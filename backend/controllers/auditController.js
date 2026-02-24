const Audit = require('../models/Audit');

// Helper function to create a log (we will use this in other controllers)
exports.logAudit = async (documentId, action, performedBy, ipAddress) => {
  try {
    await Audit.create({
      documentId,
      action,
      performedBy,
      ipAddress: ipAddress || 'Unknown IP'
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// GET /api/audit/:documentId - Fetch the audit trail for a document
exports.getDocumentAuditTrail = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Fetch logs and sort them by newest first
    const audits = await Audit.find({ documentId }).sort({ createdAt: -1 });
    
    res.status(200).json(audits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit trail', error: error.message });
  }
};