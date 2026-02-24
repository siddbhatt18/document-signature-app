const express = require('express');
const router = express.Router();
const { 
  saveSignaturePosition, 
  getDocumentSignatures,
  finalizeDocument // NEW import
} = require('../controllers/signatureController');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/signatures - Save signature position
router.post('/', verifyToken, saveSignaturePosition);

// GET /api/signatures/:documentId - Get signatures for a document
router.get('/:documentId', verifyToken, getDocumentSignatures);

// POST /api/signatures/finalize - Embed signature into PDF
router.post('/finalize', verifyToken, finalizeDocument);

module.exports = router;