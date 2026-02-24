const express = require('express');
const router = express.Router();

const { 
  uploadDocument, 
  getUserDocuments, 
  getDocumentById, 
  shareDocument,
  getPublicDocument // Imported the new public function
} = require('../controllers/docController'); 

const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// POST /api/docs/upload - Upload PDF (Protected)
router.post('/upload', verifyToken, upload.single('file'), uploadDocument);

// GET /api/docs/ - List user PDFs (Protected)
router.get('/', verifyToken, getUserDocuments);

// NEW: GET /api/docs/public/:token - Must be ABOVE the /:id route! (Public)
router.get('/public/:token', getPublicDocument);

// GET /api/docs/:id - View specific doc (Protected)
router.get('/:id', verifyToken, getDocumentById);

// POST /api/docs/:id/share - Generate tokenized link (Protected)
router.post('/:id/share', verifyToken, shareDocument);

module.exports = router;