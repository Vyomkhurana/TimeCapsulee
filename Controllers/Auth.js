const User = require('../models/User');
const bcrypt = require('bcrypt');

const signup = async (req, res) => {
    try {
        const { username, email, password, confirm_password, terms } = req.body;

        if (!username || !email || !password || !confirm_password || terms === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            terms: terms === true || terms === "true"
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully', user: { username, email } });

    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { signup }; // ✅ Ensure correct export
