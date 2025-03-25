const User = require('../Models/User');
const bcrypt = require('bcryptjs');

const signup = async (req, res) => {
    try {
        const { username, email, password, confirm_password, terms } = req.body;

        // Validation
        if (!username || !email || !password || !confirm_password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!terms) {
            return res.status(400).json({ error: 'You must accept the terms and conditions' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Check existing user
        const existingUser = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: email.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Create new user
        const newUser = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
            terms: true
        });

        await newUser.save();
        res.status(201).json({
            message: 'User created successfully',
            user: { username, email }
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: email.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { signup, login };