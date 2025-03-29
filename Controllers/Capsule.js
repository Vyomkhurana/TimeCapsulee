const Capsule = require('../Models/Capsule');
const multer = require('multer');
const path = require('path');

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

            const { title, message, scheduleDate, category, reminder, emailDelivery, creator } = req.body;
            const files = req.files?.map(file => ({
                filename: file.originalname,
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
                reminder: reminder === 'true',
                emailDelivery: emailDelivery === 'true',
                creator: creator // Use the actual user ID from the request
            });

            res.status(201).json({
                success: true,
                capsule
            });
        });
    } catch (err) {
        console.error('Create capsule error:', err);
        res.status(500).json({ error: 'Failed to create time capsule' });
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

module.exports = {
    createCapsule,
    getMyCapsules,
    getCapsule
};