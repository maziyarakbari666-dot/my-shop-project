const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/create', isAuthenticated, paymentController.create);
router.get('/callback', paymentController.callback);

module.exports = router;






