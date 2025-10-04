const mongoose = require('mongoose');

// MongoDB connection URI from environment variable
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/timecapsule';

// Connection options for better performance and stability
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
    mongoose.connect(mongoURI, options)
        .then(() => {
            console.log('✅ Connected to MongoDB successfully');
        })
        .catch((err) => {
            console.error('❌ Failed to connect to MongoDB:', err.message);
            console.log('🔄 Retrying connection in 5 seconds...');
            setTimeout(connectWithRetry, 5000);
        });
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
});

connectWithRetry();

module.exports = mongoose;