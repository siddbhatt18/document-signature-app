const express = require('express');
const router = express.Router();
const { getDocumentAuditTrail } = require('../controllers/auditController');
const verifyToken = require('../middleware/authMiddleware');

// GET /api/audit/:documentId
router.get('/:documentId', verifyToken, getDocumentAuditTrail);

module.exports = router;