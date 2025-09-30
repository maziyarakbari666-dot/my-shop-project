const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const settingsController = require('../controllers/settingsController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const aiAssistantController = require('../controllers/aiAssistantController');
const insightsController = require('../controllers/insightsController');
const reportController = require('../controllers/reportController');
const { runEngagementTasks } = require('../services/engagementScheduler');

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
router.get('/top-products', isAuthenticated, isAdmin, adminController.topProducts);
router.get('/stream/metrics', isAuthenticated, isAdmin, adminController.streamSSE);

// insights
router.get('/insights', isAuthenticated, isAdmin, insightsController.getInsights);
router.get('/reports/daily.html', isAuthenticated, isAdmin, reportController.dailyHtmlReport);

module.exports = router;

// AI Admin Assistant
router.post('/ai-assistant', isAuthenticated, isAdmin, aiAssistantController.handle);

// Engagement manual trigger
router.post('/engagement/run', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await runEngagementTasks();
    res.success({ ok: true });
  } catch (e) {
    res.fail(e.message || 'engagement_failed', 500);
  }
});






