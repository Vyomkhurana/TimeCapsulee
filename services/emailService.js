const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendPasswordResetEmail = async (email, resetUrl) => {
    try {
        const mailOptions = {
            from: `TimeCapsule <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request - TimeCapsule',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset - TimeCapsule</title>
                    <style>
                        body {
                            font-family: 'Poppins', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            background-color: #f5f7fa;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 0;
                        }
                        .header {
                            text-align: center;
                            padding: 15px 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border-radius: 10px 10px 0 0;
                        }
                        .content {
                            background: #ffffff;
                            padding: 25px;
                            border-radius: 0 0 10px 10px;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        }
                        .button {
                            display: inline-block;
                            padding: 12px 30px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white !important;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 15px 0;
                            font-weight: 500;
                            text-align: center;
                            min-width: 200px;
                        }
                        .footer {
                            text-align: center;
                            padding: 15px;
                            color: #666;
                            font-size: 12px;
                            margin-top: 20px;
                        }
                        .logo {
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 5px;
                        }
                        .icon {
                            font-size: 36px;
                            margin-bottom: 10px;
                        }
                        .reset-link {
                            word-break: break-all;
                            color: #667eea;
                            font-size: 14px;
                            background: #f8f9fa;
                            padding: 10px;
                            border-radius: 5px;
                            margin: 15px 0;
                            display: block;
                        }
                        .message {
                            margin: 15px 0;
                        }
                        .support {
                            margin-top: 20px;
                            padding-top: 15px;
                            border-top: 1px solid #eee;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">TimeCapsule</div>
                            <div class="icon">⏳</div>
                            <h2 style="margin: 0; font-size: 20px;">Password Reset Request</h2>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>We received a request to reset your password for your TimeCapsule account. If you didn't make this request, you can safely ignore this email.</p>
                            
                            <div class="message">
                                <p>To reset your password, click the button below:</p>
                                <div style="text-align: center;">
                                    <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
                                </div>
                            </div>

                            <p>Or copy and paste this link into your browser:</p>
                            <div class="reset-link">${resetUrl}</div>
                            
                            <p>This link will expire in 1 hour for security reasons.</p>
                            
                            <div class="support">
                                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                                <p>Best regards,<br>The TimeCapsule Team</p>
                            </div>
                        </div>
                        <div class="footer">
                            <p>This is an automated message, please do not reply to this email.</p>
                            <p>© ${new Date().getFullYear()} TimeCapsule. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

module.exports = {
    sendPasswordResetEmail
}; 