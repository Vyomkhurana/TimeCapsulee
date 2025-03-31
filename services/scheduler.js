const cron = require('node-cron');
const Capsule = require('../Models/Capsule');
const { sendEmail } = require('../config/email');

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

                    // Generate capsule link
                    const capsuleLink = `${process.env.BASE_URL}/capsule/${capsule._id}`;
                    console.log('Generated capsule link:', capsuleLink);
                    
                    // Send email with capsule content and link
                    await sendEmail({
                        to: capsule.creator.email,
                        subject: `Your Time Capsule: ${capsule.title}`,
                        html: `
                            <h1>Your Time Capsule Has Arrived!</h1>
                            <h2>${capsule.title}</h2>
                            <p>Message: ${capsule.message}</p>
                            <p>Created on: ${capsule.createdAt.toLocaleDateString()}</p>
                            <p>Category: ${capsule.category}</p>
                            <p>View your capsule here: <a href="${capsuleLink}">${capsuleLink}</a></p>
                            ${capsule.files && capsule.files.length > 0 ? `
                                <h3>Attached Files:</h3>
                                <ul>
                                    ${capsule.files.map(file => `<li>${file.filename}</li>`).join('')}
                                </ul>
                            ` : ''}
                        `
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

    console.log('✨ Scheduler started successfully');
};

module.exports = { startScheduler };
