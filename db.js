const mongoose = require('mongoose');

// MongoDB connection URI from environment variable
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/timecapsule';

// Retry/backoff configuration (ms)
const RETRY_BASE_MS = parseInt(process.env.MONGO_RETRY_BASE_MS, 10) || 2000; // 2s
const RETRY_MAX_MS = parseInt(process.env.MONGO_RETRY_MAX_MS, 10) || 5 * 60 * 1000; // 5min

// Connection options for better performance and stability
const options = {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Try selecting a server for 5s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    family: 4 // Use IPv4, skip trying IPv6
};

// Configure strictQuery to suppress warnings
mongoose.set('strictQuery', false);

let connectAttempt = 0;

// Exponential backoff connect with capped delay. This will not crash the process
// if Mongo is unavailable; instead it keeps retrying and allows app to run
// in a degraded mode (serving static content).
const connectWithRetry = async () => {
    try {
        await mongoose.connect(mongoURI, options);
        connectAttempt = 0;
        console.log('✅ Connected to MongoDB successfully');
    } catch (err) {
        connectAttempt += 1;
        const delay = Math.min(RETRY_BASE_MS * Math.pow(2, connectAttempt - 1), RETRY_MAX_MS);
        console.error(`❌ Failed to connect to MongoDB (attempt ${connectAttempt}):`, err.message);
        console.log(`🔄 Retrying connection in ${Math.round(delay / 1000)}s...`);
        setTimeout(connectWithRetry, delay);
    }
};

// Connection event logging
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err && err.message ? err.message : err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
    } catch (e) {
        console.error('Error closing MongoDB connection on SIGINT', e && e.message ? e.message : e);
    } finally {
        process.exit(0);
    }
});

// Start initial connect attempt but don't block module export
connectWithRetry();

module.exports = {
    mongoose,
    isConnected: () => mongoose.connection.readyState === 1,
    closeConnection: () => mongoose.connection.close(),
};