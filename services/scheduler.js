const cron = require('node-cron');
const Capsule = require('../Models/Capsule');
const { sendEmail } = require('../config/email');
const { getDeliveryEmailTemplate, getReminderEmailTemplate } = require('../utils/emailTemplates');

const startScheduler = () => {
    // Check for capsules to be delivered every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            console.log('\n--- Checking for capsules to be delivered ---');
            console.log('Current time:', now.toLocaleString());
            
            // Find only pending capsules that are due for delivery
            const dueCapsules = await Capsule.find({
                status: 'pending',
                scheduleDate: { $lte: now }
            }).populate('creator');

            if (dueCapsules.length > 0) {
                console.log(`Found ${dueCapsules.length} capsules to deliver`);
            }

            // Process each due capsule
            for (const capsule of dueCapsules) {
                try {
                    console.log('\nProcessing capsule:', {
                        id: capsule._id,
                        title: capsule.title,
                        creator: capsule.creator?.email,
                        scheduleDate: capsule.scheduleDate
                    });

                    // Skip if creator or email is not available
                    if (!capsule.creator || !capsule.creator.email) {
                        console.log(`⚠️ Skipping capsule ${capsule._id} - No valid creator/email found`);
                        await Capsule.findByIdAndUpdate(capsule._id, {
                            status: 'failed',
                            error: 'No valid creator/email found'
                        });
                        continue;
                    }

                    // Skip if required fields are missing
                    if (!capsule.category || !capsule.title || !capsule.message) {
                        console.log(`⚠️ Skipping capsule ${capsule._id} - Missing required fields`);
                        await Capsule.findByIdAndUpdate(capsule._id, {
                            status: 'failed',
                            error: 'Missing required fields'
                        });
                        continue;
                    }

                    // Send email with enhanced template
                    const emailTemplate = getDeliveryEmailTemplate(capsule, capsule.creator);
                    await sendEmail({
                        to: capsule.creator.email,
                        subject: emailTemplate.subject,
                        html: emailTemplate.html,
                        text: emailTemplate.text
                    });

                    // Update capsule status
                    await Capsule.findByIdAndUpdate(capsule._id, {
                        status: 'delivered'
                    });

                    console.log(`✅ Successfully delivered capsule: ${capsule._id}`);
                } catch (error) {
                    console.error(`❌ Failed to deliver capsule ${capsule._id}:`, error);
                    await Capsule.findByIdAndUpdate(capsule._id, {
                        status: 'failed',
                        error: error.message
                    });
                }
            }
        } catch (error) {
            console.error('❌ Scheduler error:', error);
        }
    });

    // NEW: Check for capsules needing reminders every hour
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('\n--- Checking for reminder notifications ---');
            const capsulesNeedingReminders = await Capsule.findNeedingReminders();

            for (const capsule of capsulesNeedingReminders) {
                try {
                    if (capsule.shouldSendReminder()) {
                        const daysUntil = Math.ceil((capsule.scheduleDate - new Date()) / (1000 * 60 * 60 * 24));
                        
                        const emailTemplate = getReminderEmailTemplate(capsule, capsule.creator, daysUntil);
                        await sendEmail({
                            to: capsule.creator.email,
                            subject: emailTemplate.subject,
                            html: emailTemplate.html,
                            text: emailTemplate.text
                        });

                        // Mark reminder as sent
                        capsule.reminder.sent = true;
                        await capsule.save();

                        console.log(`✅ Reminder sent for capsule: ${capsule._id}`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to send reminder for capsule ${capsule._id}:`, error);
                }
            }
        } catch (error) {
            console.error('❌ Reminder scheduler error:', error);
        }
    });

    console.log('✨ Scheduler started successfully (delivery + reminders)');
};

module.exports = { startScheduler };
