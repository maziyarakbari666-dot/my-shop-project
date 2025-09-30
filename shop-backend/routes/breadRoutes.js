const express = require('express');
const router = express.Router();
const { listAvailability } = require('../controllers/breadController');

router.get('/availability', listAvailability);

module.exports = router;


