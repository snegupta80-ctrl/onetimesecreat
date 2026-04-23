const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { getActivityLogs, getAnalytics } = require('../controllers/activity.controller');

// All activity routes require authentication
router.use(authMiddleware);

router.get('/logs', getActivityLogs);
router.get('/analytics', getAnalytics);

module.exports = router;
