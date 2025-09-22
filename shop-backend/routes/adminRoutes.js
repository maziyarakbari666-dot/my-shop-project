const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const settingsController = require('../controllers/settingsController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// one-time seeding with ADMIN_SETUP_TOKEN
router.post('/seed-admin', adminController.seedAdmin);
router.post('/list-admins', adminController.listAdmins);
// get me (debug): returns role using cookie or bearer for quick check
router.get('/me', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const authHeader = req.headers['authorization'];
    let token = null;
    if (req.cookies?.auth_token) token = req.cookies.auth_token;
    if (!token && authHeader) token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return res.success({ user: null });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email role');
    res.success({ user });
  } catch (_) { res.success({ user: null }); }
});
// Admin gate check - verifies user is admin
router.get('/gate', isAuthenticated, isAdmin, (req, res) => {
  res.success({ message: 'Admin access granted', user: req.user });
});

// promote user by admin
router.post('/promote', isAuthenticated, isAdmin, adminController.promote);

// settings
router.get('/settings', isAuthenticated, isAdmin, settingsController.getSettings);
router.post('/settings', isAuthenticated, isAdmin, settingsController.updateSettings);

// analytics
router.get('/analytics', isAuthenticated, isAdmin, adminController.analytics);
router.get('/analytics/daily', isAuthenticated, isAdmin, adminController.analyticsDaily);
router.get('/analytics/by-category', isAuthenticated, isAdmin, adminController.analyticsByCategory);

module.exports = router;






