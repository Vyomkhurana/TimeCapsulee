const express = require('express');
const router = express.Router();
const {
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
    updateReminder,
    // NEWEST FEATURES
    duplicateCapsule,
    getTemplates,
    createTemplate,
    createFromTemplate,
    backupCapsules,
    getAdvancedAnalytics
} = require('../Controllers/Capsule');

const { validateCapsule } = require('../middleware/validation');
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to capsule creation
router.post('/create', rateLimiter({ max: 50, windowMs: 60 * 60 * 1000 }), validateCapsule, createCapsule);

router.get('/my-capsules', getMyCapsules);
router.get('/:id', getCapsule);
router.delete('/delete/:id', deleteCapsule);

// Analytics routes
router.get('/statistics', getStatistics);
router.get('/activity', getActivity);
router.get('/categories', getCategories);
router.get('/recent-activity', getRecentActivity);
router.get('/export-report', exportReport);

// NEW: Advanced search and filtering
router.get('/search/advanced', searchCapsules);

// NEW: Sharing features
router.post('/share', shareCapsule);

// NEW: Archive/Star features
router.patch('/:capsuleId/archive', toggleArchive);
router.patch('/:capsuleId/star', toggleStarred);

// NEW: Bulk operations
router.post('/bulk/delete', bulkDelete);
router.post('/bulk/archive', bulkArchive);

// NEW: Tags management
router.patch('/:capsuleId/tags', updateTags);
router.get('/tags/all', getAllTags);

// NEW: Reminder management
router.patch('/:capsuleId/reminder', updateReminder);

// NEWEST: Duplicate/Clone capsule
router.post('/:capsuleId/duplicate', duplicateCapsule);

// NEWEST: Templates
router.get('/templates/all', getTemplates);
router.post('/templates/create', createTemplate);
router.post('/templates/use', createFromTemplate);

// NEWEST: Backup & Advanced Analytics
router.get('/backup/export', backupCapsules);
router.get('/analytics/advanced', getAdvancedAnalytics);

module.exports = router;