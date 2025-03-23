const mongoose = require('mongoose');

// MongoDB connection URI
const mongoURI = 'mongodb+srv://Vyomkhurana:Earth1234@project.4nqou.mongodb.net/TimeCapsule?retryWrites=true&w=majority&appName=Project'; // Replace with your database name

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));

module.exports = mongoose;