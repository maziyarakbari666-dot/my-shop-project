const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate, authSchemas } = require('../middleware/validation');
const { isAuthenticated } = require('../middleware/auth');

router.post('/signup', validate(authSchemas.signup), userController.signup);
router.post('/login', validate(authSchemas.login), userController.login);
router.post('/send-otp', validate(authSchemas.sendOtp), userController.sendOtp);
router.post('/verify-otp', validate(authSchemas.verifyOtp), userController.verifyOtp);
router.get('/me', userController.me);
router.put('/me', userController.updateMe);
router.post('/logout', userController.logout);

// favorites
router.get('/favorites', isAuthenticated, userController.getFavorites);
router.post('/favorites/add', isAuthenticated, userController.addFavorite);
router.post('/favorites/remove', isAuthenticated, userController.removeFavorite);

module.exports = router;