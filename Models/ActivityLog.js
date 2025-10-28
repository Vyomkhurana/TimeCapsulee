const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'capsule_created',
            'capsule_updated',
            'capsule_deleted',
            'capsule_delivered',
            'capsule_viewed',
            'capsule_shared',
            'capsule_archived',
            'capsule_starred',
            'user_login',
            'user_logout',
            'settings_updated',
            'export_report'
        ]
    },
    entityType: {
        type: String,
        enum: ['capsule', 'user', 'system'],
        default: 'capsule'
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

// Auto-delete logs older than 90 days
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
