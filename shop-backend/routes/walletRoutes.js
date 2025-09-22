const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, walletController.getWallet);
router.post('/deposit', isAuthenticated, walletController.deposit);

module.exports = router;






