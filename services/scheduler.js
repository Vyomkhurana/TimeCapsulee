const cron = require('node-cron');
const Capsule = require('../Models/Capsule');
const { sendEmail } = require('../config/email');
const { getDeliveryEmailTemplate, getReminderEmailTemplate } = require('../utils/emailTemplates');
const { logActivity } = require('../utils/activityLogger');
const db = require('../db');

let isProcessing = false;
const BATCH_SIZE = parseInt(process.env.SCHEDULER_BATCH_SIZE, 10) || 10;
const MAX_RETRIES = parseInt(process.env.SCHEDULER_MAX_RETRIES, 10) || 4;
const BASE_RETRY_DELAY = parseInt(process.env.SCHEDULER_RETRY_DELAY_MS, 10) || 2000; // ms
const MAX_RETRY_DELAY = 60 * 1000; // 1 minute

const addJitter = (delay) => Math.floor(delay + Math.random() * 300);

const exponentialDelay = (retryCount) => {
    const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
    return addJitter(delay);
};

const processCapsuleWithRetry = async (capsule, retryCount = 0) => {
    try {
        const emailTemplate = getDeliveryEmailTemplate(capsule, capsule.creator);
        await sendEmail({
            to: capsule.creator.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
            priority: capsule.priority === 'urgent' ? 'high' : 'normal'
        });

        await Capsule.findByIdAndUpdate(capsule._id, {
            status: 'delivered',
            deliveredAt: new Date(),
            $unset: { retryCount: 1, lastRetry: 1 }
        });

        await logActivity({
            userId: capsule.creator._id || capsule.creator,
            action: 'capsule_delivered',
            entityType: 'capsule',
            entityId: capsule._id,
            details: { title: capsule.title },
        });

        return { success: true, capsuleId: capsule._id };
    } catch (error) {
        const nextRetry = retryCount + 1;
        const delay = exponentialDelay(retryCount);

        if (nextRetry <= MAX_RETRIES) {
            console.warn(`Retry ${nextRetry}/${MAX_RETRIES} for capsule ${capsule._id} in ${delay}ms:`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
            return processCapsuleWithRetry(capsule, nextRetry);
        }

        await Capsule.findByIdAndUpdate(capsule._id, {
            status: 'failed',
            error: error.message,
            retryCount: nextRetry,
            lastRetry: new Date()
        });

        await logActivity({
            userId: capsule.creator._id || capsule.creator,
            action: 'capsule_failed',
            entityType: 'capsule',
            entityId: capsule._id,
            details: { error: error.message }
        });

        return { success: false, capsuleId: capsule._id, error: error.message };
    }
};

let scheduledTasks = [];

const startScheduler = () => {
    // Delivery task: runs every minute
    const deliveryTask = cron.schedule('* * * * *', async () => {
        if (!db.isConnected()) {
            console.warn('Scheduler: MongoDB not connected, skipping delivery cycle');
            return;
        }

        if (isProcessing) {
            console.log('⏳ Scheduler: previous batch still processing, skipping this cycle');
            return;
        }

        isProcessing = true;
        const batchStart = Date.now();

        try {
            const now = new Date();
            const dueCapsules = await Capsule.find({ status: 'pending', scheduleDate: { $lte: now } })
                .populate('creator', 'email username')
                .limit(BATCH_SIZE)
                .sort({ priority: -1, scheduleDate: 1 })
                .lean();

            if (!dueCapsules || dueCapsules.length === 0) {
                // nothing to do
                return;
            }

            console.log(`\n🔄 Scheduler: processing ${dueCapsules.length} capsules (batch=${BATCH_SIZE})`);

            // Validate creators synchronously and mark invalid ones
            const valid = [];
            for (const c of dueCapsules) {
                if (!c.creator || !c.creator.email) {
                    console.warn(`Capsule ${c._id} has no delivery email; marking failed`);
                    await Capsule.findByIdAndUpdate(c._id, { status: 'failed', error: 'No valid creator/email' });
                    await logActivity({ userId: c.creator?._id || c.creator, action: 'capsule_failed', entityType: 'capsule', entityId: c._id, details: { reason: 'No valid creator/email' } });
                    continue;
                }
                valid.push(c);
            }

            if (valid.length === 0) return;

            const results = await Promise.allSettled(valid.map(capsule => processCapsuleWithRetry(capsule)));

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length + results.filter(r => r.status === 'rejected').length;

            const duration = Date.now() - batchStart;
            console.log(`\n✨ Scheduler batch complete — success: ${successful}, failed: ${failed}, duration: ${duration}ms`);

        } catch (err) {
            console.error('❌ Scheduler delivery error:', err && err.message ? err.message : err);
        } finally {
            isProcessing = false;
        }
    }, { scheduled: true });

    // Reminder task: runs hourly at minute 0
    const reminderTask = cron.schedule('0 * * * *', async () => {
        if (!db.isConnected()) {
            console.warn('Scheduler: MongoDB not connected, skipping reminder cycle');
            return;
        }

        try {
            console.log('\n🔔 Scheduler: checking reminders');
            const startTime = Date.now();

            const capsulesNeedingReminders = await Capsule.find({
                status: 'pending',
                'reminder.enabled': true,
                'reminder.sent': false
            })
                .populate('creator', 'email username')
                .limit(200)
                .lean();

            if (!capsulesNeedingReminders || capsulesNeedingReminders.length === 0) return;

            const results = await Promise.allSettled(capsulesNeedingReminders.map(async (capsule) => {
                const now = new Date();
                const daysUntil = Math.ceil((new Date(capsule.scheduleDate) - now) / (1000 * 60 * 60 * 24));

                if (daysUntil <= capsule.reminder.daysBeforeDelivery && daysUntil > 0) {
                    try {
                        const emailTemplate = getReminderEmailTemplate(capsule, capsule.creator, daysUntil);
                        await sendEmail({ to: capsule.creator.email, subject: emailTemplate.subject, html: emailTemplate.html, text: emailTemplate.text });
                        await Capsule.findByIdAndUpdate(capsule._id, { 'reminder.sent': true, 'reminder.sentAt': new Date() });
                        await logActivity({ userId: capsule.creator._id || capsule.creator, action: 'reminder_sent', entityType: 'capsule', entityId: capsule._id });
                        return { success: true, capsuleId: capsule._id, daysUntil };
                    } catch (errInner) {
                        console.error('Reminder send error for', capsule._id, errInner && errInner.message ? errInner.message : errInner);
                        return { success: false, capsuleId: capsule._id, error: errInner.message };
                    }
                }

                return { success: false, reason: 'Not due yet' };
            }));

            const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const duration = Date.now() - startTime;
            if (sent > 0) console.log(`📬 Sent ${sent} reminders in ${duration}ms`);

        } catch (error) {
            console.error('❌ Reminder scheduler error:', error && error.message ? error.message : error);
        }
    }, { scheduled: true });

    scheduledTasks.push(deliveryTask, reminderTask);

    console.log('✨ Scheduler started successfully (delivery + reminders)');
};

const stopScheduler = async () => {
    try {
        scheduledTasks.forEach(task => task?.stop && task.stop());
        scheduledTasks = [];
        console.log('🛑 Scheduler stopped');
    } catch (err) {
        console.error('Error stopping scheduler:', err && err.message ? err.message : err);
    }
};

process.on('SIGINT', async () => {
    console.log('SIGINT received: stopping scheduler...');
    await stopScheduler();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM received: stopping scheduler...');
    await stopScheduler();
    process.exit(0);
});

module.exports = { startScheduler, stopScheduler };
