const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.post('/', isAuthenticated, isAdmin, couponController.createCoupon);
router.get('/', isAuthenticated, isAdmin, couponController.listCoupons);
router.post('/validate', isAuthenticated, couponController.validateCoupon);

module.exports = router;


