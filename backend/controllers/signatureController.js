const Signature = require('../models/Signature');
const Document = require('../models/Document');
const User = require('../models/User');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { logAudit } = require('./auditController');

// Save a new signature position (x, y)
exports.saveSignaturePosition = async (req, res) => {
  try {
    const { documentId, x, y, page } = req.body;

    const document = await Document.findById(documentId);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    // FIX: Fallback for external signers. If no user ID, attach to the document owner's ID
    const signatureOwnerId = req.user.id ? req.user.id : document.userId;

    const newSignature = new Signature({
      documentId,
      userId: signatureOwnerId,
      x,
      y,
      page: page || 1,
      status: 'pending'
    });

    const savedSignature = await newSignature.save();

    // FIX: Audit Trail fallback. Log the ID if logged in, otherwise log the external email
    const performedBy = req.user.id ? req.user.id : req.user.email;
    await logAudit(documentId, 'Signature Placed', performedBy, req.ip);

    res.status(201).json({ message: 'Signature position saved', signature: savedSignature });
  } catch (error) {
    res.status(500).json({ message: 'Error saving position', error: error.message });
  }
};

// Get all signatures for a specific document
exports.getDocumentSignatures = async (req, res) => {
  try {
    const { documentId } = req.params;
    const signatures = await Signature.find({ documentId });
    res.status(200).json(signatures);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching signatures', error: error.message });
  }
};

// Finalize and embed the signature into the PDF
exports.finalizeDocument = async (req, res) => {
  try {
    const { documentId } = req.body;

    const document = await Document.findById(documentId);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const signatures = await Signature.find({ documentId, status: 'pending' });
    if (signatures.length === 0) return res.status(400).json({ message: 'No pending signatures found' });

    // FIX: Determine what name to stamp on the PDF depending on if they are an internal or external user
    let signerName = 'External Signer';
    let performedBy = req.user.email; // Default to email for the audit log

    if (req.user.id) {
      // It's a logged-in user
      const user = await User.findById(req.user.id);
      if (user) signerName = user.name;
      performedBy = req.user.id;
    } else {
      // It's an external user using a share link
      signerName = req.user.email; 
    }

    const originalPdfBytes = await fs.readFile(document.filePath);
    const pdfDoc = await PDFDocument.load(originalPdfBytes);

    for (const sig of signatures) {
      const pages = pdfDoc.getPages();
      const pageIndex = sig.page > 0 ? sig.page - 1 : 0;
      const page = pages[pageIndex];
      const { height } = page.getSize();
      const pdfY = height - sig.y;

      page.drawText(`Signed by: ${signerName}`, {
        x: sig.x,
        y: pdfY,
        size: 16,
        color: rgb(0, 0, 0.8),
      });

      sig.status = 'signed';
      await sig.save();
    }

    const pdfBytes = await pdfDoc.save();
    const signedFileName = `signed-${document.fileName}`;
    const signedFilePath = path.join(__dirname, '../uploads', signedFileName);
    
    await fs.writeFile(signedFilePath, pdfBytes);

    document.status = 'Signed';
    document.fileName = signedFileName;
    document.filePath = signedFilePath;
    await document.save();

    // Log the finalization
    await logAudit(documentId, 'Document Finalized', performedBy, req.ip);

    res.status(200).json({ message: 'Document finalized successfully', document });

  } catch (error) {
    res.status(500).json({ message: 'Error finalizing document', error: error.message });
  }
};