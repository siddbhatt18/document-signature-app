const Document = require('../models/Document');
const jwt = require('jsonwebtoken');
const { logAudit } = require('./auditController'); // Audit helper

// Upload a new document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const newDoc = new Document({
      userId: req.user.id, 
      title: req.body.title || req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
    });

    const savedDoc = await newDoc.save();

    // Log the upload action
    await logAudit(savedDoc._id, 'Document Uploaded', req.user.id, req.ip);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: savedDoc,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during upload', error: error.message });
  }
};

// Fetch all documents for the logged-in user
exports.getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

// Fetch a single document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document', error: error.message });
  }
};

// Generate a shareable link, log the action, and return the link
exports.shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Generate a special signing token valid for 7 days
    const signToken = jwt.sign({ documentId: id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // FIX: Dynamically use the production Vercel URL or fallback to localhost
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // REMOVE trailing slash if it accidentally exists in the ENV var, then append the route
    const cleanFrontendUrl = frontendUrl.replace(/\/$/, '');
    const signLink = `${cleanFrontendUrl}/sign/${signToken}`;

    // Log the sharing action
    await logAudit(document._id, 'Document Shared', req.user.id, req.ip);

    // Return the generated link to the frontend
    res.status(200).json({ 
      message: 'Document shared successfully', 
      link: signLink 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sharing document', error: error.message });
  }
};

// Verify public token and fetch document for external signers
exports.getPublicDocument = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify the special 7-day token we generated during sharing
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const document = await Document.findById(decoded.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json({ 
      document, 
      signerEmail: decoded.email // Pass this back so the UI knows who is signing
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired signature link', error: error.message });
  }
};
