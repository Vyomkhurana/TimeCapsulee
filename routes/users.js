const express = require('express');
const router = express.Router();
const { auth, signup, login } = require('../Controllers/Auth');

// Auth routes
router.post('/signup', signup);
router.post('/login', login);

// Logout route
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Protected routes
router.get('/profile', auth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Test auth route
router.get('/check-auth', auth, (req, res) => {
    res.json({
        success: true,
        message: 'Authenticated',
        user: req.user
    });
});

module.exports = router;