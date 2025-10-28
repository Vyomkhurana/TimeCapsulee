/**
 * Email templates for different notifications
 */

const getDeliveryEmailTemplate = (capsule, user) => {
    return {
        subject: `🎁 Your Time Capsule "${capsule.title}" is Now Open!`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .capsule-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        .emoji { font-size: 50px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">⏰</div>
            <h1>Your Time Capsule is Ready!</h1>
        </div>
        <div class="content">
            <p>Hello ${user.name || user.email},</p>
            
            <p>The moment has arrived! Your time capsule <strong>"${capsule.title}"</strong> that you created on ${new Date(capsule.createdAt).toLocaleDateString()} is now open!</p>
            
            <div class="capsule-card">
                <h2>📦 ${capsule.title}</h2>
                <p><strong>Category:</strong> ${capsule.category}</p>
                <p><strong>Message:</strong></p>
                <p style="font-style: italic; padding: 15px; background: #f0f0f0; border-left: 4px solid #667eea;">
                    ${capsule.message}
                </p>
                ${capsule.tags && capsule.tags.length > 0 ? `
                <p><strong>Tags:</strong> ${capsule.tags.join(', ')}</p>
                ` : ''}
            </div>
            
            <p>We hope this message from your past brings you joy and wonderful memories! 🌟</p>
            
            <center>
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/my-capsules" class="button">View Your Capsules</a>
            </center>
        </div>
        <div class="footer">
            <p>© 2025 Time Capsule. Preserving your memories for the future.</p>
            <p>You received this email because you created a time capsule with us.</p>
        </div>
    </div>
</body>
</html>
        `,
        text: `
Your Time Capsule "${capsule.title}" is Now Open!

Hello ${user.name || user.email},

The moment has arrived! Your time capsule "${capsule.title}" that you created on ${new Date(capsule.createdAt).toLocaleDateString()} is now open!

Message: ${capsule.message}

We hope this message from your past brings you joy and wonderful memories!

View your capsules at: ${process.env.APP_URL || 'http://localhost:3000'}/my-capsules
        `
    };
};

const getReminderEmailTemplate = (capsule, user, daysUntil) => {
    return {
        subject: `⏰ Reminder: Your Time Capsule Opens in ${daysUntil} Day${daysUntil !== 1 ? 's' : ''}!`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .countdown { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .countdown-number { font-size: 48px; font-weight: bold; color: #f5576c; }
        .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Time Capsule Reminder</h1>
        </div>
        <div class="content">
            <p>Hello ${user.name || user.email},</p>
            
            <p>Just a friendly reminder that your time capsule <strong>"${capsule.title}"</strong> will open soon!</p>
            
            <div class="countdown">
                <div class="countdown-number">${daysUntil}</div>
                <div>Day${daysUntil !== 1 ? 's' : ''} Until Opening</div>
            </div>
            
            <p><strong>Opening Date:</strong> ${new Date(capsule.scheduleDate).toLocaleDateString()}</p>
            <p><strong>Category:</strong> ${capsule.category}</p>
            
            <p>Get ready to revisit the memories and thoughts you preserved! 🎁</p>
            
            <center>
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/my-capsules" class="button">View Details</a>
            </center>
        </div>
        <div class="footer">
            <p>© 2025 Time Capsule. Your memories, perfectly timed.</p>
        </div>
    </div>
</body>
</html>
        `,
        text: `
Time Capsule Reminder

Hello ${user.name || user.email},

Your time capsule "${capsule.title}" will open in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!

Opening Date: ${new Date(capsule.scheduleDate).toLocaleDateString()}
Category: ${capsule.category}

Get ready to revisit the memories and thoughts you preserved!

View details at: ${process.env.APP_URL || 'http://localhost:3000'}/my-capsules
        `
    };
};

const getSharedCapsuleEmailTemplate = (capsule, sender, recipient) => {
    return {
        subject: `📬 ${sender.name || sender.email} Shared a Time Capsule with You!`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .capsule-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 You've Received a Shared Time Capsule!</h1>
        </div>
        <div class="content">
            <p>Hello ${recipient.name || recipient.email},</p>
            
            <p><strong>${sender.name || sender.email}</strong> has shared a time capsule with you!</p>
            
            <div class="capsule-info">
                <h2>${capsule.title}</h2>
                <p><strong>Category:</strong> ${capsule.category}</p>
                <p><strong>Opens on:</strong> ${new Date(capsule.scheduleDate).toLocaleDateString()}</p>
            </div>
            
            <p>You can view this capsule once it opens on the scheduled date. 🎉</p>
            
            <center>
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/my-capsules" class="button">View Shared Capsules</a>
            </center>
        </div>
        <div class="footer">
            <p>© 2025 Time Capsule. Sharing memories across time.</p>
        </div>
    </div>
</body>
</html>
        `
    };
};

module.exports = {
    getDeliveryEmailTemplate,
    getReminderEmailTemplate,
    getSharedCapsuleEmailTemplate
};
