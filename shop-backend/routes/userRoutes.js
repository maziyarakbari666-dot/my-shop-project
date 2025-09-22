const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/send-otp', userController.sendOtp);
router.post('/verify-otp', userController.verifyOtp);
router.get('/me', userController.me);
router.put('/me', userController.updateMe);
router.post('/logout', userController.logout);

// favorites
router.get('/favorites', isAuthenticated, userController.getFavorites);
router.post('/favorites/add', isAuthenticated, userController.addFavorite);
router.post('/favorites/remove', isAuthenticated, userController.removeFavorite);

module.exports = router;