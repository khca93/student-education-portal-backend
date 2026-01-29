const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/papers folder exists
const uploadPath = path.join(__dirname, '..', 'uploads', 'papers');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage config for exam papers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    cb(null, `${originalName}_${unique}${extension}`);
  }
});

// File filter for PDF only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

module.exports = upload.single('pdf');