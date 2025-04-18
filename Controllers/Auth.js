const User = require('../Models/User');
const Session = require('../Models/Session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../services/emailService');

// Auth middleware
const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        
        // Check if session exists in database
        const session = await Session.findOne({ token });
        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid' });
        }

        const user = await User.findById(session.userId)
            .select('-password -terms');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        req.token = token;
        req.session = session;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            res.clearCookie('token');
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(500).json({ error: 'Authentication failed' });
    }
};

const signup = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, terms } = req.body;

        // Debug logging
        console.log('Signup request:', {
            username: username || '[missing]',
            email: email || '[missing]',
            hasPassword: !!password,
            hasConfirmPassword: !!confirmPassword,
            terms: !!terms
        });

        // Basic validation
        if (!username || !email || !password || !confirmPassword || !terms) {
            return res.status(400).json({
                error: 'All fields are required',
                missing: {
                    username: !username,
                    email: !email,
                    password: !password,
                    confirmPassword: !confirmPassword,
                    terms: !terms
                }
            });
        }

        // Password match validation
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Create user
        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
            terms
        });

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        // Create session in database
        await Session.create({
            userId: user._id,
            token
        });

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Signup error:', err);

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: messages[0] });
        }

        if (err.code === 11000) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user and include password field
        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: email.toLowerCase() }
            ]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await user.verifyPassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        // Create session in database
        await Session.create({
            userId: user._id,
            token
        });

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        // Send user data without sensitive information
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Logout function
const logout = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (token) {
            // Remove session from database
            await Session.deleteOne({ token });
            
            // Clear cookie
            res.clearCookie('token');
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Logout failed' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'No user found with this email' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        try {
            await sendPasswordResetEmail(email, resetUrl);
            res.json({
                success: true,
                message: 'Password reset email sent successfully'
            });
        } catch (emailError) {
            console.error('Error sending reset email:', emailError);
            res.status(500).json({ error: 'Error sending reset email' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Error processing forgot password request' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, currentPassword, newPassword } = req.body;

        if (!token || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValid = await user.verifyPassword(currentPassword);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        res.status(500).json({ error: 'Error resetting password' });
    }
};

module.exports = {
    auth,
    signup,
    login,
    logout,
    forgotPassword,
    resetPassword
};