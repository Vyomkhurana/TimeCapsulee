const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot be more than 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false 
    },
    terms: {
        type: Boolean,
        required: [true, 'Terms must be accepted'],
        default: false
    },
    resetPasswordToken: {
        type: String,
        default: null,
        index: { sparse: true } 
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        index: { sparse: true }
    },
    emailVerificationExpires: {
        type: Date
    },
    lastLogin: {
        type: Date,
        index: true
    },
    loginAttempts: {
        type: Number,
        default: 0,
        max: 10
    },
    lockUntil: {
        type: Date
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    backupCodes: {
        type: [String],
        select: false,
        default: []
    },
    profileCompletion: {
        type: Number,
        default: 60,
        min: 0,
        max: 100
    },
    accountTier: {
        type: String,
        enum: ['free', 'premium', 'enterprise'],
        default: 'free',
        index: true
    },
    storageUsed: {
        type: Number,
        default: 0
    },
    storageLimit: {
        type: Number,
        default: 100 * 1024 * 1024
    },
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'UTC' }
    },
    stats: {
        capsulesCreated: { type: Number, default: 0 },
        capsulesDelivered: { type: Number, default: 0 },
        totalViews: { type: Number, default: 0 }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, {
    timestamps: true
});
userSchema.pre('save', async function(next) {
    try {
        if (!this.isModified('password')) return next();
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});
userSchema.methods.verifyPassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw new Error('Password verification failed');
    }
};
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    return this.save();
};

userSchema.methods.incrementLoginAttempts = async function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000;
    
    if (this.loginAttempts + 1 >= maxAttempts && !this.lockUntil) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
};

userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});
userSchema.statics.findByCredentials = async function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() }
        ]
    }).select('+password');
};
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    return user;
};
module.exports = mongoose.model('User', userSchema);