const Capsule = require('../Models/Capsule');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type'));
    }
}).array('files', 5); // Max 5 files

// Create new capsule
const createCapsule = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const { title, message, scheduleDate, category, creator } = req.body;
            const files = req.files?.map(file => ({
                filename: file.filename,
                path: file.path.replace('public', ''), // Make path relative to public directory
                mimetype: file.mimetype
            }));

            // Create capsule with the actual user ID
            const capsule = await Capsule.create({
                title,
                message,
                category,
                files: files || [],
                scheduleDate,
                creator: new mongoose.Types.ObjectId(creator) // Convert string ID to ObjectId
            });

            res.status(201).json({
                success: true,
                capsule
            });
        });
    } catch (err) {
        console.error('Create capsule error:', err);
        res.status(500).json({ error: err.message || 'Failed to create time capsule' });
    }
};

// Get user's capsules
const getMyCapsules = async (req, res) => {
    try {
        const userId = req.query.userId;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        console.log('Fetching capsules for user ID:', userId);

        // Find capsules where creator matches the user ID
        const capsules = await Capsule.find({ creator: userId })
            .sort({ scheduleDate: 1 });

        console.log('Found capsules:', capsules.length);
        res.json({ capsules });
    } catch (error) {
        console.error('Error fetching capsules:', error);
        res.status(500).json({ error: 'Failed to fetch capsules' });
    }
};

// Get single capsule
const getCapsule = async (req, res) => {
    try {
        const capsule = await Capsule.findOne({
            _id: req.params.id,
            creator: req.user._id
        });

        if (!capsule) {
            return res.status(404).json({ error: 'Capsule not found' });
        }

        res.json({ capsule });
    } catch (err) {
        console.error('Get capsule error:', err);
        res.status(500).json({ error: 'Failed to fetch capsule' });
    }
};

// Delete capsule
const deleteCapsule = async (req, res) => {
    try {
        const capsuleId = req.params.id;
        
        // Find the capsule first to check if it exists and get file info
        const capsule = await Capsule.findById(capsuleId);
        
        if (!capsule) {
            return res.status(404).json({ error: 'Capsule not found' });
        }

        // Delete the capsule
        await Capsule.findByIdAndDelete(capsuleId);

        // Delete associated files if they exist
        if (capsule.files && capsule.files.length > 0) {
            const fs = require('fs').promises;
            const path = require('path');
            
            for (const file of capsule.files) {
                try {
                    const filePath = path.join(__dirname, '../public', file.path);
                    await fs.unlink(filePath);
                } catch (err) {
                    console.error('Error deleting file:', err);
                    // Continue with deletion even if file removal fails
                }
            }
        }

        res.json({ 
            success: true, 
            message: 'Capsule deleted successfully',
            deletedCapsule: capsule 
        });
    } catch (error) {
        console.error('Delete capsule error:', error);
        res.status(500).json({ error: 'Failed to delete capsule' });
    }
};

// Get capsule statistics
const getStatistics = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get current month's data
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Get last month's data for comparison
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current month queries
        const [totalCapsules, scheduledCapsules, deliveredCapsules, categories] = await Promise.all([
            Capsule.countDocuments({ creator: userId }),
            Capsule.countDocuments({ creator: userId, status: 'pending' }),
            Capsule.countDocuments({ creator: userId, status: 'delivered' }),
            Capsule.distinct('category', { creator: userId })
        ]);

        // Last month queries for comparison
        const [lastMonthTotal, lastMonthScheduled, lastMonthDelivered, lastMonthCategories] = await Promise.all([
            Capsule.countDocuments({ 
                creator: userId,
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
            }),
            Capsule.countDocuments({ 
                creator: userId,
                status: 'pending',
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
            }),
            Capsule.countDocuments({ 
                creator: userId,
                status: 'delivered',
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
            }),
            Capsule.distinct('category', { 
                creator: userId,
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
            })
        ]);

        // Calculate percentage changes
        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        res.json({
            totalCapsules,
            scheduledCapsules,
            deliveredCapsules,
            uniqueCategories: categories.length,
            totalCapsulesChange: calculateChange(totalCapsules, lastMonthTotal),
            scheduledCapsulesChange: calculateChange(scheduledCapsules, lastMonthScheduled),
            deliveredCapsulesChange: calculateChange(deliveredCapsules, lastMonthDelivered),
            categoriesChange: calculateChange(categories.length, lastMonthCategories.length)
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

// Get capsule activity data
const getActivity = async (req, res) => {
    try {
        const userId = req.user._id;
        const period = req.query.period || 'week';

        const now = new Date();
        let startDate, endDate, format;

        switch (period) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                endDate = now;
                format = '%Y-%m-%d';
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                endDate = now;
                format = '%Y-%m-%d';
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
                endDate = now;
                format = '%Y-%m';
                break;
            default:
                return res.status(400).json({ error: 'Invalid period' });
        }

        const [created, delivered] = await Promise.all([
            // Get created capsules
            Capsule.aggregate([
                {
                    $match: {
                        creator: userId,
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format, date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ]),
            // Get delivered capsules
            Capsule.aggregate([
                {
                    $match: {
                        creator: userId,
                        status: 'delivered',
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format, date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ])
        ]);

        // Generate all dates in the range
        const dates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Fill in missing dates with zero counts
        const createdMap = new Map(created.map(item => [item._id, item.count]));
        const deliveredMap = new Map(delivered.map(item => [item._id, item.count]));

        const labels = dates;
        const createdData = dates.map(date => createdMap.get(date) || 0);
        const deliveredData = dates.map(date => deliveredMap.get(date) || 0);

        res.json({
            labels,
            created: createdData,
            delivered: deliveredData
        });
    } catch (error) {
        console.error('Error fetching activity data:', error);
        res.status(500).json({ error: 'Failed to fetch activity data' });
    }
};

// Get capsule categories distribution
const getCategories = async (req, res) => {
    try {
        const userId = req.user._id;

        const categories = await Capsule.aggregate([
            {
                $match: { creator: userId }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            labels: categories.map(cat => cat._id),
            values: categories.map(cat => cat.count)
        });
    } catch (error) {
        console.error('Error fetching categories data:', error);
        res.status(500).json({ error: 'Failed to fetch categories data' });
    }
};

// Get recent activity
const getRecentActivity = async (req, res) => {
    try {
        const userId = req.user._id;

        const activities = await Capsule.find({ creator: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title status createdAt scheduleDate')
            .lean();

        const formattedActivities = activities.map(activity => {
            let type = 'created';
            if (activity.status === 'delivered') type = 'delivered';
            else if (activity.status === 'failed') type = 'failed';
            else if (activity.scheduleDate) type = 'scheduled';

            return {
                title: activity.title,
                type,
                timestamp: activity.createdAt
            };
        });

        res.json(formattedActivities);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
};

// Export capsule report
const exportReport = async (req, res) => {
    try {
        const userId = req.user._id;

        const capsules = await Capsule.find({ creator: userId })
            .sort({ createdAt: -1 })
            .lean();

        // Generate CSV content
        const csvHeader = 'Title,Category,Status,Created At,Scheduled Date\n';
        const csvRows = capsules.map(capsule => {
            return `"${capsule.title}","${capsule.category}","${capsule.status}","${capsule.createdAt.toISOString()}","${capsule.scheduleDate?.toISOString() || ''}"\n`;
        });

        const csvContent = csvHeader + csvRows.join('');

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=capsule-report-${new Date().toISOString().split('T')[0]}.csv`);

        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ error: 'Failed to export report' });
    }
};

// NEW: Advanced search with filters
const searchCapsules = async (req, res) => {
    try {
        const userId = req.query.userId;
        const { 
            query, 
            category, 
            status, 
            tags, 
            priority, 
            starred, 
            archived,
            dateFrom,
            dateTo,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        const filter = { creator: userId };

        // Text search
        if (query) {
            filter.$text = { $search: query };
        }

        // Category filter
        if (category) {
            filter.category = category;
        }

        // Status filter
        if (status) {
            filter.status = status;
        }

        // Tags filter
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            filter.tags = { $in: tagArray };
        }

        // Priority filter
        if (priority) {
            filter.priority = priority;
        }

        // Starred filter
        if (starred !== undefined) {
            filter.starred = starred === 'true';
        }

        // Archived filter
        if (archived !== undefined) {
            filter.archived = archived === 'true';
        } else {
            // By default, don't show archived capsules
            filter.archived = false;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            filter.scheduleDate = {};
            if (dateFrom) filter.scheduleDate.$gte = new Date(dateFrom);
            if (dateTo) filter.scheduleDate.$lte = new Date(dateTo);
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const capsules = await Capsule.find(filter)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const total = await Capsule.countDocuments(filter);

        res.json({
            capsules,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error searching capsules:', error);
        res.status(500).json({ error: 'Failed to search capsules' });
    }
};

// NEW: Share capsule with another user
const shareCapsule = async (req, res) => {
    try {
        const { capsuleId, userEmail, permission = 'view' } = req.body;
        const User = require('../Models/User');

        // Find the user to share with
        const sharedUser = await User.findOne({ email: userEmail });
        if (!sharedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update capsule
        const capsule = await Capsule.findByIdAndUpdate(
            capsuleId,
            {
                $addToSet: {
                    sharedWith: {
                        user: sharedUser._id,
                        permissions: permission,
                        sharedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!capsule) {
            return res.status(404).json({ error: 'Capsule not found' });
        }

        res.json({
            success: true,
            message: `Capsule shared with ${userEmail}`,
            capsule
        });
    } catch (error) {
        console.error('Error sharing capsule:', error);
        res.status(500).json({ error: 'Failed to share capsule' });
    }
};

// NEW: Archive/Unarchive capsule
const toggleArchive = async (req, res) => {
    try {
        const { capsuleId } = req.params;
        
        const capsule = await Capsule.findById(capsuleId);
        if (!capsule) {
            return res.status(404).json({ error: 'Capsule not found' });
        }

        capsule.archived = !capsule.archived;
        await capsule.save();

        res.json({
            success: true,
            archived: capsule.archived,
            message: capsule.archived ? 'Capsule archived' : 'Capsule unarchived'
        });
    } catch (error) {
        console.error('Error toggling archive:', error);
        res.status(500).json({ error: 'Failed to toggle archive status' });
    }
};

// NEW: Toggle starred/favorite
const toggleStarred = async (req, res) => {
    try {
        const { capsuleId } = req.params;
        
        const capsule = await Capsule.findById(capsuleId);
        if (!capsule) {
            return res.status(404).json({ error: 'Capsule not found' });
        }

        capsule.starred = !capsule.starred;
        await capsule.save();

        res.json({
            success: true,
            starred: capsule.starred,
            message: capsule.starred ? 'Capsule starred' : 'Capsule unstarred'
        });
    } catch (error) {
        console.error('Error toggling starred:', error);
        res.status(500).json({ error: 'Failed to toggle starred status' });
    }
};

// NEW: Bulk delete capsules
const bulkDelete = async (req, res) => {
    try {
        const { capsuleIds } = req.body;

        if (!Array.isArray(capsuleIds) || capsuleIds.length === 0) {
            return res.status(400).json({ error: 'Invalid capsule IDs' });
        }

        const result = await Capsule.deleteMany({
            _id: { $in: capsuleIds }
        });

        res.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `${result.deletedCount} capsule(s) deleted`
        });
    } catch (error) {
        console.error('Error bulk deleting capsules:', error);
        res.status(500).json({ error: 'Failed to delete capsules' });
    }
};

// NEW: Bulk archive capsules
const bulkArchive = async (req, res) => {
    try {
        const { capsuleIds, archive = true } = req.body;

        if (!Array.isArray(capsuleIds) || capsuleIds.length === 0) {
            return res.status(400).json({ error: 'Invalid capsule IDs' });
        }

        const result = await Capsule.updateMany(
            { _id: { $in: capsuleIds } },
            { $set: { archived: archive } }
        );

        res.json({
            success: true,
            modifiedCount: result.modifiedCount,
            message: `${result.modifiedCount} capsule(s) ${archive ? 'archived' : 'unarchived'}`
        });
    } catch (error) {
        console.error('Error bulk archiving capsules:', error);
        res.status(500).json({ error: 'Failed to archive capsules' });
    }
};

// NEW: Update capsule tags
const updateTags = async (req, res) => {
    try {
        const { capsuleId } = req.params;
        const { tags } = req.body;

        if (!Array.isArray(tags)) {
            return res.status(400).json({ error: 'Tags must be an array' });
        }

        const capsule = await Capsule.findByIdAndUpdate(
            capsuleId,
            { $set: { tags: tags.map(tag => tag.toLowerCase().trim()) } },
            { new: true }
        );

        if (!capsule) {
            return res.status(404).json({ error: 'Capsule not found' });
        }

        res.json({
            success: true,
            capsule
        });
    } catch (error) {
        console.error('Error updating tags:', error);
        res.status(500).json({ error: 'Failed to update tags' });
    }
};

// NEW: Get all unique tags
const getAllTags = async (req, res) => {
    try {
        const userId = req.query.userId;
        
        const tags = await Capsule.aggregate([
            { $match: { creator: new mongoose.Types.ObjectId(userId) } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 }
        ]);

        res.json({
            tags: tags.map(t => ({ tag: t._id, count: t.count }))
        });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
};

// NEW: Update reminder settings
const updateReminder = async (req, res) => {
    try {
        const { capsuleId } = req.params;
        const { enabled, daysBeforeDelivery } = req.body;

        const capsule = await Capsule.findByIdAndUpdate(
            capsuleId,
            {
                $set: {
                    'reminder.enabled': enabled,
                    'reminder.daysBeforeDelivery': daysBeforeDelivery || 1
                }
            },
            { new: true }
        );

        if (!capsule) {
            return res.status(404).json({ error: 'Capsule not found' });
        }

        res.json({
            success: true,
            capsule
        });
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({ error: 'Failed to update reminder' });
    }
};

module.exports = {
    createCapsule,
    getMyCapsules,
    getCapsule,
    deleteCapsule,
    getStatistics,
    getActivity,
    getCategories,
    getRecentActivity,
    exportReport,
    // NEW POWERFUL FEATURES
    searchCapsules,
    shareCapsule,
    toggleArchive,
    toggleStarred,
    bulkDelete,
    bulkArchive,
    updateTags,
    getAllTags,
    updateReminder
};