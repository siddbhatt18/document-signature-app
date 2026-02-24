const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['Document Uploaded', 'Document Shared', 'Signature Placed', 'Document Finalized'],
  },
  performedBy: {
    type: String, // Can be an email or User ID
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  }
}, { timestamps: true }); // Automatically gives us the 'when' (createdAt)

module.exports = mongoose.model('Audit', auditSchema);