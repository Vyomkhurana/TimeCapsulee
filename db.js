const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/timecapsule';
const RETRY_BASE_MS = parseInt(process.env.MONGO_RETRY_BASE_MS, 10) || 2000;
const RETRY_MAX_MS = parseInt(process.env.MONGO_RETRY_MAX_MS, 10) || 5 * 60 * 1000;
const options = {
    maxPoolSize: 50,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    family: 4,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    retryReads: true,
    compressors: ['zlib'],
    zlibCompressionLevel: 6
};
mongoose.set('strictQuery', false);
let connectAttempt = 0;
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
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err && err.message ? err.message : err);
});
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});
const gracefulClose = async (signal) => {
    try {
        await mongoose.connection.close();
        console.log(`MongoDB connection closed through ${signal || 'app termination'}`);
    } catch (e) {
        console.error(`Error closing MongoDB connection on ${signal}`, e && e.message ? e.message : e);
    } finally {
        process.exit(0);
    }
};

process.on('SIGINT', () => gracefulClose('SIGINT'));
process.on('SIGTERM', () => gracefulClose('SIGTERM'));

// Start initial connection attempt
connectWithRetry();

const getConnectionStats = () => {
    const conn = mongoose.connection;
    return {
        status: conn.readyState === 1 ? 'connected' : 'disconnected',
        readyState: conn.readyState,
        host: conn.host,
        port: conn.port,
        name: conn.name,
        models: Object.keys(conn.models).length,
        collections: Object.keys(conn.collections).length
    };
};

const healthCheck = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return { healthy: false, error: 'Not connected' };
        }
        await mongoose.connection.db.admin().ping();
        return { healthy: true, stats: getConnectionStats() };
    } catch (error) {
        return { healthy: false, error: error.message };
    }
};

module.exports = {
    mongoose,
    isConnected: () => mongoose.connection.readyState === 1,
    closeConnection: () => mongoose.connection.close(),
    connectWithRetry,
    getConnectionStats,
    healthCheck
};