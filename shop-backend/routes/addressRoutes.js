const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const addressController = require('../controllers/addressController');

router.get('/', isAuthenticated, addressController.list);
router.post('/', isAuthenticated, addressController.add);
router.delete('/:id', isAuthenticated, addressController.remove);
router.put('/:id', isAuthenticated, addressController.update);

module.exports = router;



