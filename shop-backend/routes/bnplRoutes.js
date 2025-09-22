const express = require('express');
const router = express.Router();
const bnplController = require('../controllers/bnplController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/eligibility', isAuthenticated, bnplController.checkEligibility);
router.post('/plan', isAuthenticated, bnplController.createPlan);
router.get('/my-plans', isAuthenticated, bnplController.listMyPlans);
router.get('/all', isAuthenticated, isAdmin, bnplController.listAll);
router.post('/:id/pay', isAuthenticated, bnplController.payInstallment);

module.exports = router;




