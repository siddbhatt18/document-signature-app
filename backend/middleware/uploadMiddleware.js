const multer = require('multer');
const path = require('path');
const fs = require('fs'); // NEW: Import the file system module

// NEW: Automatically create the 'uploads' folder if it doesn't exist
// This ensures the path is always correct regardless of where you start the server
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save to the absolute path we verified above
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using timestamp
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;