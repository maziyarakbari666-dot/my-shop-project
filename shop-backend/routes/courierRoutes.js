const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const courierController = require('../controllers/courierController');

router.get('/', isAuthenticated, isAdmin, courierController.list);
router.post('/', isAuthenticated, isAdmin, courierController.create);
router.put('/:id', isAuthenticated, isAdmin, courierController.update);
router.delete('/:id', isAuthenticated, isAdmin, courierController.remove);

module.exports = router;


