require('dotenv').config();
const nodemailer = require('nodemailer');

// Debug: Print environment variables
console.log('Email Configuration:', {
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD,
    passwordLength: process.env.EMAIL_PASSWORD?.length,
    baseUrl: process.env.BASE_URL
});

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports like 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('Email configuration error:', error);
        console.log('\nTroubleshooting steps:');
        console.log('1. Make sure 2-Step Verification is enabled on your Google Account');
        console.log('2. Generate a new App Password from Google Account settings');
        console.log('3. Update the EMAIL_PASSWORD in your .env file');
        console.log('4. Make sure you\'re using the correct email address');
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Function to send emails
const sendEmail = async ({ to, subject, html }) => {
    try {
        console.log('Attempting to send email to:', to);
        console.log('Subject:', subject);
        
        const mailOptions = {
            from: `"Time Capsule" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail };