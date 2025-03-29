const express = require('express');
const router = express.Router();
const {
    createCapsule,
    getMyCapsules,
    getCapsule
} = require('../Controllers/Capsule');

router.post('/create', createCapsule);
router.get('/my-capsules', getMyCapsules);
router.get('/:id', getCapsule);

module.exports = router;