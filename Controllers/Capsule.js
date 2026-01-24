const Capsule = require('../Models/Capsule');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { logActivity } = require('../utils/activityLogger');
const Template = require('../Models/Template');

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_TYPES = ['jpeg', 'jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'mp3'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'audio/mpeg'];
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 100;

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        // Sanitize filename to prevent path traversal attacks
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().substring(1);
        const mimeType = file.mimetype;
        if (ALLOWED_TYPES.includes(ext) && ALLOWED_MIME_TYPES.includes(mimeType)) {
            return cb(null, true);
        }
        cb(new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`));
    }
}).array('files', MAX_FILES); 
const createCapsule = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            const errorMsg = err.code === 'LIMIT_FILE_SIZE' 
                ? `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
                : err.message;
            return res.status(400).json({ success: false, error: errorMsg });
        }

        try {
            const { title, message, scheduleDate, category, creator, tags } = req.body;

            if (!title?.trim() || !message?.trim() || !scheduleDate || !creator) {
                return res.status(400).json({
                    success: false,
                    error: 'Title, message, schedule date, and creator are required'
                });
            }

            if (title.trim().length < MIN_TITLE_LENGTH || title.trim().length > MAX_TITLE_LENGTH) {
                return res.status(400).json({
                    success: false,
                    error: `Title must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters`
                });
            }

            const scheduleDateObj = new Date(scheduleDate);
            const now = new Date();
            
            if (isNaN(scheduleDateObj.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid schedule date format. Please use ISO 8601 format'
                });
            }

            // Add 1 minute buffer to account for processing time
            const minFutureDate = new Date(now.getTime() + 60000);
            if (scheduleDateObj <= minFutureDate) {
                return res.status(400).json({
                    success: false,
                    error: 'Schedule date must be at least 1 minute in the future'
                });
            }

            const maxFutureDate = new Date();
            maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 50);
            
            if (scheduleDateObj > maxFutureDate) {
                return res.status(400).json({
                    success: false,
                    error: 'Schedule date cannot be more than 50 years in the future'
                });
            }

            const files = req.files?.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                path: file.path.replace(/\\/g, '/').replace('public', ''),
                mimetype: file.mimetype,
                size: file.size
            })) || [];

            const capsuleData = {
                title: title.trim(),
                message: message.trim(),
                category: category?.trim() || 'general',
                files,
                scheduleDate: scheduleDateObj,
                creator: mongoose.Types.ObjectId(creator)
            };

            if (tags && Array.isArray(tags)) {
                capsuleData.tags = tags.filter(tag => tag?.trim()).map(tag => tag.trim());
            }

            const capsule = await Capsule.create(capsuleData);

            await logActivity({
                userId: creator,
                action: 'capsule_created',
                entityType: 'capsule',
                entityId: capsule._id,
                details: { 
                    title: capsule.title, 
                    category: capsule.category, 
                    fileCount: files.length,
                    scheduleDate: scheduleDateObj 
                },
                req
            });

            res.status(201).json({
                success: true,
                message: 'Time capsule created successfully! It will be delivered on the scheduled date.',
                capsule: {
                    _id: capsule._id,
                    title: capsule.title,
                    category: capsule.category,
                    scheduleDate: capsule.scheduleDate,
                    fileCount: files.length,
                    createdAt: capsule.createdAt
                }
            });
        } catch (err) {
            console.error('Create capsule error:', err.message, err.stack);
            
            if (err.name === 'ValidationError') {
                const messages = Object.values(err.errors).map(e => e.message);
                return res.status(400).json({ success: false, error: messages[0] });
            }
            
            res.status(500).json({ 
                success: false, 
                error: 'Failed to create capsule. Please try again.' 
            });
        }
    });
};
const getMyCapsules = async (req, res) => {
    try {
        const userId = req.query.userId || req.user?._id;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID format',
                code: 'INVALID_USER_ID'
            });
        }

        const { 
            status, 
            category, 
            limit = 50, 
            skip = 0, 
            sortBy = 'scheduleDate',
            sortOrder = 'asc',
            search 
        } = req.query;
        
        const query = { creator: userId };
        
        if (status && status !== 'all') query.status = status;
        if (category && category !== 'all') query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const parsedLimit = Math.min(parseInt(limit) || 50, 100);
        const parsedSkip = Math.max(parseInt(skip) || 0, 0);

        const [capsules, total, statusCounts] = await Promise.all([
            Capsule.find(query)
                .select('-__v')
                .sort(sortOptions)
                .limit(parsedLimit)
                .skip(parsedSkip)
                .lean(),
            Capsule.countDocuments(query),
            Capsule.aggregate([
                { $match: { creator: mongoose.Types.ObjectId(userId) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        const statusCountsMap = statusCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        res.set('Cache-Control', 'private, max-age=60');
        res.json({
            success: true,
            capsules,
            pagination: {
                total,
                limit: parsedLimit,
                skip: parsedSkip,
                hasMore: total > parsedSkip + capsules.length,
                page: Math.floor(parsedSkip / parsedLimit) + 1,
                totalPages: Math.ceil(total / parsedLimit)
            },
            statusCounts: statusCountsMap,
            filters: { status, category, search }
        });
    } catch (error) {
        console.error('[Capsule] Get capsules error:', {
            message: error.message,
            stack: error.stack,
            userId: req.user?._id || req.query.userId,
            query: req.query
        });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch capsules',
            code: 'FETCH_ERROR',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
};
const getCapsule = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid capsule ID' });
        }

        const capsule = await Capsule.findOne({
            _id: id,
            creator: req.user._id
        }).select('-__v').lean();

        if (!capsule) {
            return res.status(404).json({ 
                success: false, 
                error: 'Capsule not found or access denied' 
            });
        }

        await Capsule.findByIdAndUpdate(id, {
            $inc: { views: 1 },
            lastViewed: new Date()
        });

        const enrichedCapsule = {
            ...capsule,
            daysUntilOpen: Math.ceil((new Date(capsule.scheduleDate) - new Date()) / (1000 * 60 * 60 * 24)),
            isLocked: new Date(capsule.scheduleDate) > new Date(),
            fileCount: capsule.files?.length || 0
        };

        res.set('Cache-Control', 'private, max-age=300');
        res.json({ 
            success: true, 
            capsule: enrichedCapsule 
        });
    } catch (err) {
        console.error('Get capsule error:', err.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch capsule details' 
        });
    }
};
const deleteCapsule = async (req, res) => {
    try {
        const capsuleId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(capsuleId)) {
            return res.status(400).json({ success: false, error: 'Invalid capsule ID' });
        }

        const capsule = await Capsule.findOne({
            _id: capsuleId,
            creator: req.user?._id
        });

        if (!capsule) {
            return res.status(404).json({ 
                success: false, 
                error: 'Capsule not found or you do not have permission to delete it' 
            });
        }

        if (capsule.files && capsule.files.length > 0) {
            const fs = require('fs').promises;
            const path = require('path');
            
            const deletePromises = capsule.files.map(async (file) => {
                try {
                    const filePath = path.join(__dirname, '../public', file.path);
                    await fs.unlink(filePath);
                    return { success: true, file: file.filename };
                } catch (err) {
                    console.error('Error deleting file:', file.filename, err.message);
                    return { success: false, file: file.filename, error: err.message };
                }
            });

            await Promise.allSettled(deletePromises);
        }

        await Capsule.findByIdAndDelete(capsuleId);

        await logActivity({
            userId: req.user._id,
            action: 'capsule_deleted',
            entityType: 'capsule',
            entityId: capsule._id,
            details: { 
                title: capsule.title, 
                category: capsule.category,
                fileCount: capsule.files?.length || 0 
            },
            req
        });

        res.json({ 
            success: true, 
            message: 'Time capsule deleted successfully',
            deletedCapsule: {
                _id: capsule._id,
                title: capsule.title,
                category: capsule.category
            }
        });
    } catch (error) {
        console.error('Delete capsule error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete capsule. Please try again.' 
        });
    }
};
const getStatistics = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const [totalCapsules, scheduledCapsules, deliveredCapsules, categories] = await Promise.all([
            Capsule.countDocuments({ creator: userId }),
            Capsule.countDocuments({ creator: userId, status: 'pending' }),
            Capsule.countDocuments({ creator: userId, status: 'delivered' }),
            Capsule.distinct('category', { creator: userId })
        ]);
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
        const dates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
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
const exportReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const capsules = await Capsule.find({ creator: userId })
            .sort({ createdAt: -1 })
            .lean();
        const csvHeader = 'Title,Category,Status,Created At,Scheduled Date\n';
        const csvRows = capsules.map(capsule => {
            return `"${capsule.title}","${capsule.category}","${capsule.status}","${capsule.createdAt.toISOString()}","${capsule.scheduleDate?.toISOString() || ''}"\n`;
        });
        const csvContent = csvHeader + csvRows.join('');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=capsule-report-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ error: 'Failed to export report' });
    }
};
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
        if (query) {
            filter.$text = { $search: query };
        }
        if (category) {
            filter.category = category;
        }
        if (status) {
            filter.status = status;
        }
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            filter.tags = { $in: tagArray };
        }
        if (priority) {
            filter.priority = priority;
        }
        if (starred !== undefined) {
            filter.starred = starred === 'true';
        }
        if (archived !== undefined) {
            filter.archived = archived === 'true';
        } else {
            filter.archived = false;
        }
        if (dateFrom || dateTo) {
            filter.scheduleDate = {};
            if (dateFrom) filter.scheduleDate.$gte = new Date(dateFrom);
            if (dateTo) filter.scheduleDate.$lte = new Date(dateTo);
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const capsules = await Capsule.find(filter)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
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
const shareCapsule = async (req, res) => {
    try {
        const { capsuleId, userEmail, permission = 'view' } = req.body;
        const User = require('../Models/User');
        const sharedUser = await User.findOne({ email: userEmail });
        if (!sharedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
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
const duplicateCapsule = async (req, res) => {
    try {
        const { capsuleId } = req.params;
        const { scheduleDate } = req.body;
        const originalCapsule = await Capsule.findById(capsuleId);
        if (!originalCapsule) {
            return res.status(404).json({ error: 'Capsule not found' });
        }
        const duplicatedCapsule = await Capsule.create({
            title: `${originalCapsule.title} (Copy)`,
            message: originalCapsule.message,
            category: originalCapsule.category,
            tags: originalCapsule.tags,
            priority: originalCapsule.priority,
            files: originalCapsule.files,
            scheduleDate: scheduleDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
            creator: originalCapsule.creator
        });
        await logActivity({
            userId: originalCapsule.creator,
            action: 'capsule_created',
            entityType: 'capsule',
            entityId: duplicatedCapsule._id,
            details: { duplicatedFrom: capsuleId },
            req
        });
        res.json({
            success: true,
            capsule: duplicatedCapsule,
            message: 'Capsule duplicated successfully'
        });
    } catch (error) {
        console.error('Error duplicating capsule:', error);
        res.status(500).json({ error: 'Failed to duplicate capsule' });
    }
};
const getTemplates = async (req, res) => {
    try {
        const userId = req.query.userId;
        const templates = await Template.find({
            $or: [
                { creator: userId },
                { isPublic: true }
            ]
        }).sort({ usageCount: -1, createdAt: -1 });
        res.json({ templates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};
const createTemplate = async (req, res) => {
    try {
        const { capsuleId, name, description, isPublic } = req.body;
        const capsule = await Capsule.findById(capsuleId);
        if (!capsule) {
            return res.status(404).json({ error: 'Capsule not found' });
        }
        const template = await Template.create({
            name,
            description,
            category: capsule.category,
            messageTemplate: capsule.message,
            tags: capsule.tags,
            priority: capsule.priority,
            isPublic: isPublic || false,
            creator: capsule.creator
        });
        res.json({
            success: true,
            template,
            message: 'Template created successfully'
        });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
};
const createFromTemplate = async (req, res) => {
    try {
        const { templateId, title, scheduleDate, customMessage } = req.body;
        const userId = req.query.userId;
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        const capsule = await Capsule.create({
            title: title || `Capsule from ${template.name}`,
            message: customMessage || template.messageTemplate,
            category: template.category,
            tags: template.tags,
            priority: template.priority,
            scheduleDate,
            creator: userId
        });
        template.usageCount += 1;
        await template.save();
        await logActivity({
            userId,
            action: 'capsule_created',
            entityType: 'capsule',
            entityId: capsule._id,
            details: { fromTemplate: templateId },
            req
        });
        res.json({
            success: true,
            capsule,
            message: 'Capsule created from template'
        });
    } catch (error) {
        console.error('Error creating from template:', error);
        res.status(500).json({ error: 'Failed to create from template' });
    }
};
const backupCapsules = async (req, res) => {
    try {
        const userId = req.query.userId;
        const capsules = await Capsule.find({ creator: userId }).lean();
        const backup = {
            exportDate: new Date().toISOString(),
            totalCapsules: capsules.length,
            user: userId,
            capsules: capsules.map(c => ({
                title: c.title,
                message: c.message,
                category: c.category,
                tags: c.tags,
                priority: c.priority,
                status: c.status,
                scheduleDate: c.scheduleDate,
                createdAt: c.createdAt,
                starred: c.starred,
                archived: c.archived
            }))
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=timecapsule-backup-${new Date().toISOString().split('T')[0]}.json`);
        res.send(JSON.stringify(backup, null, 2));
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
};
const getAdvancedAnalytics = async (req, res) => {
    try {
        const userId = req.query.userId;
        const [
            totalStats,
            categoryDistribution,
            priorityDistribution,
            deliveryRate,
            topTags,
            monthlyTrend
        ] = await Promise.all([
            Capsule.aggregate([
                { $match: { creator: new mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                        starred: { $sum: { $cond: ['$starred', 1, 0] } },
                        archived: { $sum: { $cond: ['$archived', 1, 0] } }
                    }
                }
            ]),
            Capsule.aggregate([
                { $match: { creator: new mongoose.Types.ObjectId(userId) } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Capsule.aggregate([
                { $match: { creator: new mongoose.Types.ObjectId(userId) } },
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ]),
            Capsule.aggregate([
                { $match: { creator: new mongoose.Types.ObjectId(userId), status: { $in: ['delivered', 'failed'] } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        successful: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
                    }
                }
            ]),
            Capsule.aggregate([
                { $match: { creator: new mongoose.Types.ObjectId(userId) } },
                { $unwind: '$tags' },
                { $group: { _id: '$tags', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Capsule.aggregate([
                {
                    $match: {
                        creator: new mongoose.Types.ObjectId(userId),
                        createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$createdAt' },
                            year: { $year: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);
        const deliverySuccessRate = deliveryRate[0]
            ? Math.round((deliveryRate[0].successful / deliveryRate[0].total) * 100)
            : 0;
        res.json({
            overview: totalStats[0] || {},
            categoryDistribution,
            priorityDistribution,
            deliverySuccessRate,
            topTags,
            monthlyTrend
        });
    } catch (error) {
        console.error('Error fetching advanced analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

// Update capsule priority
const updatePriority = async (req, res) => {
    try {
        const { id } = req.params;
        const { priority } = req.body;
        const userId = req.session.userId;

        // Validate priority
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!priority || !validPriorities.includes(priority)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
            });
        }

        // Find and update capsule
        const capsule = await Capsule.findOne({ _id: id, creator: userId });
        if (!capsule) {
            return res.status(404).json({ success: false, error: 'Capsule not found' });
        }

        const oldPriority = capsule.priority;
        capsule.priority = priority;
        await capsule.save();

        // Log activity
        await logActivity({
            userId,
            action: 'priority_updated',
            resourceType: 'capsule',
            resourceId: id,
            details: { oldPriority, newPriority: priority }
        });

        res.json({ 
            success: true, 
            message: 'Priority updated successfully',
            priority: capsule.priority 
        });
    } catch (error) {
        console.error('Error updating priority:', error);
        res.status(500).json({ success: false, error: 'Failed to update priority' });
    }
};

// Get high priority capsules (high + urgent)
const getHighPriorityCapsules = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { limit = 20, status } = req.query;

        const query = {
            creator: userId,
            priority: { $in: ['high', 'urgent'] }
        };

        // Optional status filter
        if (status && ['pending', 'delivered', 'failed'].includes(status)) {
            query.status = status;
        }

        const capsules = await Capsule.find(query)
            .select('title message category priority status scheduleDate createdAt starred tags')
            .sort({ priority: -1, scheduleDate: 1 }) // urgent first, then by schedule date
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: capsules.length,
            capsules
        });
    } catch (error) {
        console.error('Error fetching high priority capsules:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch capsules' });
    }
};

// Get priority statistics
const getPriorityStats = async (req, res) => {
    try {
        const userId = req.session.userId;

        const stats = await Capsule.aggregate([
            { $match: { creator: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 },
                    pending: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
                    },
                    delivered: { 
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } 
                    },
                    failed: { 
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } 
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get urgent capsules needing attention (pending + high/urgent priority)
        const urgentNeedingAttention = await Capsule.countDocuments({
            creator: userId,
            priority: { $in: ['high', 'urgent'] },
            status: 'pending',
            scheduleDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // within 7 days
        });

        res.json({
            success: true,
            stats,
            urgentNeedingAttention
        });
    } catch (error) {
        console.error('Error fetching priority stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
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
    searchCapsules,
    shareCapsule,
    toggleArchive,
    toggleStarred,
    bulkDelete,
    bulkArchive,
    updateTags,
    getAllTags,
    updateReminder,
    duplicateCapsule,
    getTemplates,
    createTemplate,
    createFromTemplate,
    backupCapsules,
    getAdvancedAnalytics,
    updatePriority,
    getHighPriorityCapsules,
    getPriorityStats
};