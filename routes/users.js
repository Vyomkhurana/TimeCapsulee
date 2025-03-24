const express = require('express');
const router = express.Router();
const AuthController = require('../Controllers/Auth'); // Updated reference

router.post('/signup', AuthController.signup); // Ensure this matches function name inside Auth.js

module.exports = router;
