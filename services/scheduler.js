const cron = require('node-cron');
const Capsule = require('../Models/Capsule');
const { sendEmail } = require('../config/email');
const User = require('../Models/User');

const startScheduler = () => {
    // Check for capsules to be delivered every minute
    cron.schedule('* * * * *', async () => {
        try {
            console.log('Checking for capsules to be delivered...', new Date().toLocaleString());
            
            // Find capsules that are due for delivery
            const now = new Date();
            const dueCapsules = await Capsule.find({
                status: 'pending',
                scheduleDate: { $lte: now }
            }).populate('creator');

            console.log(`Found ${dueCapsules.length} capsules to deliver`);
            if (dueCapsules.length > 0) {
                console.log('Due capsules:', dueCapsules.map(c => ({
                    id: c._id,
                    title: c.title,
                    scheduleDate: c.scheduleDate,
                    creator: c.creator.email
                })));
            }

            // Process each due capsule
            for (const capsule of dueCapsules) {
                try {
                    console.log(`Processing capsule ${capsule._id} for delivery to ${capsule.creator.email}`);
                    
                    // Send email
                    await sendEmail({
                        to: capsule.creator.email,
                        subject: `Your Time Capsule: ${capsule.title}`,
                        html: `
                            <h1>Your Time Capsule Has Arrived!</h1>
                            <h2>${capsule.title}</h2>
                            <p>Message: ${capsule.message}</p>
                            <p>Created on: ${capsule.createdAt.toLocaleDateString()}</p>
                            <p>Category: ${capsule.category}</p>
                            ${capsule.files.length > 0 ? `
                                <h3>Attached Files:</h3>
                                <ul>
                                    ${capsule.files.map(file => `<li>${file.filename}</li>`).join('')}
                                </ul>
                            ` : ''}
                        `
                    });

                    // Update capsule status
                    capsule.status = 'delivered';
                    await capsule.save();

                    console.log(`Successfully delivered capsule: ${capsule._id}`);
                } catch (error) {
                    console.error(`Failed to deliver capsule ${capsule._id}:`, error);
                    capsule.status = 'failed';
                    await capsule.save();
                }
            }
        } catch (error) {
            console.error('Scheduler error:', error);
        }
    });

    // Check for reminder notifications (3 days before delivery)
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Checking for reminder notifications...');
            
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            // Find capsules that need reminders
            const reminderCapsules = await Capsule.find({
                status: 'pending',
                reminder: true,
                scheduleDate: {
                    $gte: new Date(),
                    $lte: threeDaysFromNow
                }
            }).populate('creator');

            console.log(`Found ${reminderCapsules.length} capsules for reminders`);

            // Send reminders
            for (const capsule of reminderCapsules) {
                try {
                    await sendEmail({
                        to: capsule.creator.email,
                        subject: `Reminder: Your Time Capsule Will Be Delivered Soon`,
                        html: `
                            <h1>Time Capsule Reminder</h1>
                            <p>Your time capsule "${capsule.title}" will be delivered in 3 days.</p>
                            <p>Scheduled delivery: ${capsule.scheduleDate.toLocaleDateString()}</p>
                        `
                    });

                    console.log(`Sent reminder for capsule: ${capsule._id}`);
                } catch (error) {
                    console.error(`Failed to send reminder for capsule ${capsule._id}:`, error);
                }
            }
        } catch (error) {
            console.error('Reminder scheduler error:', error);
        }
    });

    console.log('Scheduler started successfully');
};

module.exports = { startScheduler };
