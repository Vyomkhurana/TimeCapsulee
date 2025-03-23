const express = require('express');
const router = express.Router();
const SignupController = require('../Controllers/Signup');

router.post('/signup', SignupController.signup);

module.exports = router;