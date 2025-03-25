const User = require('../Models/User');
const bcrypt = require('bcryptjs');

const signup = async (req, res) => {
    try {
        const { username, email, password, confirm_password, terms } = req.body;

        // Validation
        if (!username || !email || !password || !confirm_password || terms === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
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

        // Create new user - let the schema middleware handle password hashing
        const newUser = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: password, // The schema will hash this
            terms: terms === true || terms === "true"
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

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email/Username and password are required' });
        }

        // Find user
        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: email.toLowerCase() }
            ]
        });

        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Use the schema method to compare passwords
        const isValid = await user.comparePassword(password);

        if (!isValid) {
            console.log('Invalid password for user:', user.username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Success
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