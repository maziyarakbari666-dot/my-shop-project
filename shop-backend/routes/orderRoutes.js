const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// افزودن سفارش جدید
router.post('/', orderController.addOrder);

// دریافت همه سفارش‌ها
router.get('/', orderController.getAllOrders);

// دریافت یک سفارش خاص
router.get('/:id', orderController.getOrder);

// لغو سفارش
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;