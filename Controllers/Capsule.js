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

            const { title, message, scheduleDate } = req.body;
            const files = req.files?.map(file => ({
                filename: file.originalname,
                path: file.path,
                mimetype: file.mimetype
            }));

            const capsule = await Capsule.create({
                title,
                message,
                files: files || [],
                scheduleDate,
                creator: req.user._id
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
        const capsules = await Capsule.find({ creator: req.user._id })
            .sort({ scheduleDate: 1 });

        res.json({ capsules });
    } catch (err) {
        console.error('Get capsules error:', err);
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