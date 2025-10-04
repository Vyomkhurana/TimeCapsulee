const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Add index for faster user session queries
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true // Add index for token lookup
    },
    userAgent: {
        type: String,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 24 * 60 * 60 // Session documents will be automatically deleted after 24 hours (86400 seconds)
    }
}, {
    timestamps: true
});

// Compound index for userId and token lookups
sessionSchema.index({ userId: 1, token: 1 });

// Method to update last activity
sessionSchema.methods.updateActivity = function() {
    this.lastActivity = new Date();
    return this.save();
};

// Static method to clean up expired sessions
sessionSchema.statics.cleanupExpired = function() {
    const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.deleteMany({ createdAt: { $lt: expiryTime } });
};

module.exports = mongoose.model('Session', sessionSchema); 