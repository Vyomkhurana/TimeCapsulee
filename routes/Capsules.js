const express = require('express');
const router = express.Router();
const { auth } = require('../Controllers/Auth');
const {
    createCapsule,
    getMyCapsules,
    getCapsule
} = require('../Controllers/Capsule');

router.post('/create', auth, createCapsule);
router.get('/my-capsules', auth, getMyCapsules);
router.get('/:id', auth, getCapsule);

module.exports = router;