const mongoose = require('mongoose');

const capsuleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Message is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['personal', 'special', 'academic', 'mental', 'business', 'legacy', 'social']
    },
    files: [{
        filename: String,
        path: String,
        mimetype: String
    }],
    scheduleDate: {
        type: Date,
        required: [true, 'Schedule date is required']
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'failed'],
        default: 'pending'
    },
    reminder: {
        type: Boolean,
        default: false
    },
    emailDelivery: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Capsule', capsuleSchema);