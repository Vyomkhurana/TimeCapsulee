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
    getAdvancedAnalytics
} = require('../Controllers/Capsule');
const { validateCapsule } = require('../middleware/validation');
const { rateLimiter } = require('../middleware/rateLimiter');
// Enhanced rate limiting for capsule creation
router.post('/create', rateLimiter({ max: 50, windowMs: 60 * 60 * 1000 }), validateCapsule, createCapsule);
router.get('/my-capsules', getMyCapsules);
router.get('/:id', getCapsule);
// Add rate limiting to delete operations to prevent abuse
router.delete('/delete/:id', rateLimiter({ max: 100, windowMs: 60 * 60 * 1000 }), deleteCapsule);
router.get('/statistics', getStatistics);
router.get('/activity', getActivity);
router.get('/categories', getCategories);
router.get('/recent-activity', getRecentActivity);
router.get('/export-report', exportReport);
router.get('/search/advanced', searchCapsules);
router.post('/share', shareCapsule);
router.patch('/:capsuleId/archive', toggleArchive);
router.patch('/:capsuleId/star', toggleStarred);
router.post('/bulk/delete', bulkDelete);
router.post('/bulk/archive', bulkArchive);
router.patch('/:capsuleId/tags', updateTags);
router.get('/tags/all', getAllTags);
router.patch('/:capsuleId/reminder', updateReminder);
router.post('/:capsuleId/duplicate', duplicateCapsule);
router.get('/templates/all', getTemplates);
router.post('/templates/create', createTemplate);
router.post('/templates/use', createFromTemplate);
router.get('/backup/export', backupCapsules);
router.get('/analytics/advanced', getAdvancedAnalytics);
module.exports = router;