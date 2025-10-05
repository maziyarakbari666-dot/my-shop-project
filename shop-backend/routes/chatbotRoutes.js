const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Public endpoint; protected by global rate limiter
router.post('/', chatbotController.handle);

module.exports = router;




