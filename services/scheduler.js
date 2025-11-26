const cron = require('node-cron');
const Capsule = require('../Models/Capsule');
const { sendEmail } = require('../config/email');
const { getDeliveryEmailTemplate, getReminderEmailTemplate } = require('../utils/emailTemplates');
let isProcessing = false;
const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

const processCapsulesWithRetry = async (capsule, retryCount = 0) => {
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
        
        return { success: true, capsuleId: capsule._id };
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
            return processCapsulesWithRetry(capsule, retryCount + 1);
        }
        
        await Capsule.findByIdAndUpdate(capsule._id, {
            status: 'failed',
            error: error.message,
            retryCount: retryCount + 1,
            lastRetry: new Date()
        });
        
        return { success: false, capsuleId: capsule._id, error: error.message };
    }
};

const startScheduler = () => {
    cron.schedule('* * * * *', async () => {
        if (isProcessing) {
            console.log('⏳ Previous batch still processing, skipping...');
            return;
        }
        
        isProcessing = true;
        const startTime = Date.now();
        
        try {
            const now = new Date();
            const dueCapsules = await Capsule.find({
                status: 'pending',
                scheduleDate: { $lte: now }
            })
            .populate('creator', 'email username')
            .limit(BATCH_SIZE)
            .sort({ priority: -1, scheduleDate: 1 })
            .lean();
            
            if (dueCapsules.length === 0) return;
            
            console.log(`\n🔄 Processing ${dueCapsules.length} capsules (batch size: ${BATCH_SIZE})`);
            
            const validCapsules = dueCapsules.filter(capsule => {
                if (!capsule.creator?.email) {
                    Capsule.findByIdAndUpdate(capsule._id, {
                        status: 'failed',
                        error: 'No valid creator/email'
                    }).catch(console.error);
                    return false;
                }
                return true;
            });
            
            const results = await Promise.allSettled(
                validCapsules.map(capsule => processCapsulesWithRetry(capsule))
            );
            
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;
            
            const duration = Date.now() - startTime;
            console.log(`\n✨ Delivery batch complete:`);
            console.log(`   ✅ Successful: ${successful}`);
            console.log(`   ❌ Failed: ${failed}`);
            console.log(`   ⏱️ Duration: ${duration}ms`);
            
        } catch (error) {
            console.error('❌ Scheduler error:', error.message);
        } finally {
            isProcessing = false;
        }
    });
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('\n🔔 Checking for reminder notifications');
            const startTime = Date.now();
            
            const capsulesNeedingReminders = await Capsule.find({
                status: 'pending',
                'reminder.enabled': true,
                'reminder.sent': false
            })
            .populate('creator', 'email username')
            .limit(50)
            .lean();
            
            if (capsulesNeedingReminders.length === 0) return;
            
            const results = await Promise.allSettled(
                capsulesNeedingReminders.map(async (capsule) => {
                    const now = new Date();
                    const daysUntil = Math.ceil((new Date(capsule.scheduleDate) - now) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntil <= capsule.reminder.daysBeforeDelivery && daysUntil > 0) {
                        const emailTemplate = getReminderEmailTemplate(capsule, capsule.creator, daysUntil);
                        
                        await sendEmail({
                            to: capsule.creator.email,
                            subject: emailTemplate.subject,
                            html: emailTemplate.html,
                            text: emailTemplate.text
                        });
                        
                        await Capsule.findByIdAndUpdate(capsule._id, {
                            'reminder.sent': true,
                            'reminder.sentAt': new Date()
                        });
                        
                        return { success: true, capsuleId: capsule._id, daysUntil };
                    }
                    return { success: false, reason: 'Not due yet' };
                })
            );
            
            const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const duration = Date.now() - startTime;
            
            if (sent > 0) {
                console.log(`📬 Sent ${sent} reminders in ${duration}ms`);
            }
        } catch (error) {
            console.error('❌ Reminder scheduler error:', error.message);
        }
    });
    console.log('✨ Scheduler started successfully (delivery + reminders)');
};
module.exports = { startScheduler };
