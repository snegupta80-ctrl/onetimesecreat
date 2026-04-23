const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const { createSecret, viewSecret, getUserSecrets, cleanupExpiredSecrets, downloadFile, getAccessLogs } = require('../controllers/secret.controller');

router.post('/', authMiddleware, upload.single('file'), createSecret);
router.post('/anonymous', upload.single('file'), createSecret);
router.get('/user', authMiddleware, getUserSecrets);
router.get('/cleanup', cleanupExpiredSecrets);
router.get('/:id/logs', getAccessLogs);
router.get('/:id/download', downloadFile);
router.post('/:id', viewSecret);

module.exports = router;
