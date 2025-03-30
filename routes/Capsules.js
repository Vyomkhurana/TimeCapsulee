const express = require('express');
const router = express.Router();
const {
    createCapsule,
    getMyCapsules,
    getCapsule,
    deleteCapsule
} = require('../Controllers/Capsule');

router.post('/create', createCapsule);
router.get('/my-capsules', getMyCapsules);
router.get('/:id', getCapsule);
router.delete('/delete/:id', deleteCapsule);

module.exports = router;