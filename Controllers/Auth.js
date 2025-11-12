const User = require('../Models/User');
const Session = require('../Models/Session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const TOKEN_EXPIRY = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const [session, user] = await Promise.all([
            Session.findOne({ token }).lean(),
            User.findById(decoded.userId).select('-password -terms').lean()
        ]);

        if (!session) {
            return res.status(401).json({ success: false, error: 'Session expired or invalid' });
        }
        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        req.user = user;
        req.token = token;
        req.sessionId = session._id;
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            res.clearCookie('token');
            return res.status(401).json({ success: false, error: 'Token expired' });
        }
        res.status(500).json({ success: false, error: 'Authentication failed' });
    }
};
const signup = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, terms } = req.body;

        if (!username || !email || !password || !confirmPassword || !terms) {
            return res.status(400).json({
                success: false,
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

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, error: 'Passwords do not match' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.toLowerCase().trim();

        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
        }).lean();

        if (existingUser) {
            const field = existingUser.email === normalizedEmail ? 'Email' : 'Username';
            return res.status(400).json({ success: false, error: `${field} already exists` });
        }

        const user = await User.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password,
            terms
        });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        await Session.create({
            userId: user._id,
            token,
            userAgent: req.get('user-agent'),
            ipAddress: req.ip
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_MAX_AGE,
            path: '/'
        });

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Welcome to TimeCapsule',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            },
            token
        });
    } catch (err) {
        console.error('Signup error:', err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, error: messages[0] });
        }
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Username or email already exists' });
        }
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedEmail }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isValid = await user.verifyPassword(password);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        
        await Promise.all([
            Session.deleteMany({ userId: user._id }),
            Session.create({
                userId: user._id,
                token,
                userAgent: req.get('user-agent'),
                ipAddress: req.ip
            })
        ]);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_MAX_AGE,
            path: '/'
        });

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Login successful! Welcome back',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                lastLogin: user.lastLogin
            },
            token
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};
const logout = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (token) {
            await Session.deleteOne({ token });
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
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        try {
            await sendPasswordResetEmail(email, resetUrl);
            res.json({
                success: true,
                message: 'Password reset email sent successfully'
            });
        } catch (emailError) {
            console.error('Email error:', emailError.message);
            res.status(500).json({ success: false, error: 'Error sending reset email' });
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isValid = await user.verifyPassword(currentPassword);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
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