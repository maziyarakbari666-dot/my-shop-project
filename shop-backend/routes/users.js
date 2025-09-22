const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Admin routes - require admin authentication
router.get('/all', isAuthenticated, isAdmin, adminUserController.getAllUsers);
router.put('/:userId/status', isAuthenticated, isAdmin, adminUserController.updateUserStatus);
router.get('/export-excel', isAuthenticated, isAdmin, adminUserController.exportUsersExcel);

module.exports = router;
