require('dotenv').config();
const nodemailer = require('nodemailer');

// Debug: Print environment variables
console.log('Email Configuration:', {
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD,
    passwordLength: process.env.EMAIL_PASSWORD?.length,
    baseUrl: process.env.BASE_URL
});

let transporter;
const hasEmailCreds = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

if (hasEmailCreds) {
    // Create a transporter using SMTP (Gmail as default)
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Verify transporter configuration but don't crash the app on failure.
    transporter.verify().then(() => {
        console.log('Email server is ready to send messages');
    }).catch((error) => {
        console.error('Email configuration error (will fallback to log-only):', error && error.message ? error.message : error);
        console.log('\nTroubleshooting steps:');
        console.log('1. If using Gmail, enable 2-Step Verification and use an App Password');
        console.log('2. Verify EMAIL_USER and EMAIL_PASSWORD in your .env');
        console.log('3. If you prefer not to send real emails during development, leave EMAIL_USER/EMAIL_PASSWORD empty to use a log-only fallback');
    });
} else {
    // Fallback transporter that just logs emails to console (development-friendly)
    transporter = {
        sendMail: async (mailOptions) => {
            console.log('\n[EMAIL - LOG FALLBACK]');
            console.log('From:', mailOptions.from);
            console.log('To:', mailOptions.to);
            console.log('Subject:', mailOptions.subject);
            console.log('HTML:', (mailOptions.html || '').slice(0, 800));
            return { messageId: 'log-fallback-' + Date.now() };
        }
    };
    console.log('No EMAIL_USER/PASSWORD found — using log-only email fallback. Set EMAIL_* in .env to send real emails.');
}

// Function to send emails
const sendEmail = async ({ to, subject, html }) => {
    try {
        console.log('Attempting to send email to:', to);
        console.log('Subject:', subject);

        const mailOptions = {
            from: `"Time Capsule" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email send result:', info && info.messageId ? info.messageId : 'logged');
        return true;
    } catch (error) {
        console.error('Error sending email (logged, not crashing):', error && error.message ? error.message : error);
        // Don't crash the whole process on email send failure; bubble up the error so callers can mark failures if needed
        throw error;
    }
};

module.exports = { sendEmail };