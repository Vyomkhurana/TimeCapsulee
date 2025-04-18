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
    exportReport
} = require('../Controllers/Capsule');

router.post('/create', createCapsule);
router.get('/my-capsules', getMyCapsules);
router.get('/:id', getCapsule);
router.delete('/delete/:id', deleteCapsule);

// Analytics routes
router.get('/statistics', getStatistics);
router.get('/activity', getActivity);
router.get('/categories', getCategories);
router.get('/recent-activity', getRecentActivity);
router.get('/export-report', exportReport);

module.exports = router;