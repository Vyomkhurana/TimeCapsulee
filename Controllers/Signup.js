const User = require('../models/User'); // Import the User model
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

// Handle signup form submission
const signup = async (req, res) => {
    const { username, email, password, confirm_password, terms } = req.body;

    try {
        // Validate input fields
        if (!username || !email || !password || !confirm_password || !terms) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if passwords match
        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Check if terms are agreed to (accepts both boolean and string)
        if (!terms || terms === 'false') {
            return res.status(400).json({ error: 'You must agree to the terms and conditions' });
        }

        // Hash the password before saving it to the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const user = new User({ username, email, password: hashedPassword, terms });

        // Save the user to the database
        await user.save()
            .then(() => {
                console.log('User saved successfully:', user);
            })
            .catch((err) => {
                console.error('Error saving user:', err);
                throw err; // Re-throw the error to be caught by the outer catch block
            });

        // Respond with success message (exclude sensitive data like password)
        res.status(201).json({ message: 'User created successfully', user: { username, email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { signup };