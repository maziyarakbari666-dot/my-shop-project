const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, cartController.getCart);
router.post('/add', isAuthenticated, cartController.addItem);
router.post('/update', isAuthenticated, cartController.updateItem);
router.post('/remove', isAuthenticated, cartController.removeItem);
router.post('/clear', isAuthenticated, cartController.clear);

module.exports = router;



