const User = require('../Models/User');
const bcrypt = require('bcryptjs');

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

        res.status(201).json({
            success: true,
            message: 'User created successfully'
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

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { signup, login };