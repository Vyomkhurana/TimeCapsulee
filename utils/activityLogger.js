const ActivityLog = require('../Models/ActivityLog');

/**
 * Log user activity
 * @param {Object} options - Activity log options
 * @param {String} options.userId - User ID
 * @param {String} options.action - Action performed
 * @param {String} options.entityType - Type of entity (capsule, user, system)
 * @param {String} options.entityId - Entity ID
 * @param {Object} options.details - Additional details
 * @param {Object} options.req - Express request object (optional)
 */
const logActivity = async (options) => {
    try {
        const { userId, action, entityType, entityId, details, req } = options;

        const log = {
            user: userId,
            action,
            entityType: entityType || 'capsule',
            entityId,
            details: details || {},
            ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
            userAgent: req ? req.headers['user-agent'] : null
        };

        await ActivityLog.create(log);
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error to prevent breaking the main flow
    }
};

/**
 * Get user activity logs
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 */
const getUserActivity = async (userId, options = {}) => {
    const {
        limit = 50,
        skip = 0,
        action,
        startDate,
        endDate
    } = options;

    const query = { user: userId };

    if (action) {
        query.action = action;
    }

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    return await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('entityId')
        .lean();
};

/**
 * Get activity statistics
 * @param {String} userId - User ID
 * @param {Number} days - Number of days to analyze
 */
const getActivityStats = async (userId, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await ActivityLog.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    return stats;
};

module.exports = {
    logActivity,
    getUserActivity,
    getActivityStats
};
