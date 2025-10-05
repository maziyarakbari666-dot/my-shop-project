const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { validate, orderSchemas } = require('../middleware/validation');

// Guest checkout allowed for creating order
router.post('/', validate(orderSchemas.create), orderController.createOrder);
router.get('/', isAuthenticated, orderController.getUserOrders);
router.post('/pay', isAuthenticated, orderController.payOrder);
router.get('/all', isAuthenticated, isAdmin, orderController.getAllOrders);
router.post('/:id/cancel', isAuthenticated, isAdmin, orderController.cancelOrder);
router.post('/:id/send-to-courier', isAuthenticated, isAdmin, orderController.sendToCourier);

module.exports = router;