const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Ensure papers subfolder exists
const papersPath = path.join(uploadPath, 'papers');
if (!fs.existsSync(papersPath)) {
  fs.mkdirSync(papersPath, { recursive: true });
}

// ===== 1. GENERAL UPLOAD FOR JOBS =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowed.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDF, and DOC files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

// ===== 2. EXAM PAPER UPLOAD =====
const paperStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, papersPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    cb(null, `${originalName}_${unique}${extension}`);
  }
});

const paperFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const uploadPaper = multer({
  storage: paperStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: paperFileFilter
});

// ===== EXPORTS =====
module.exports = {
  upload: upload, // For jobs
  uploadPaper: uploadPaper.single('pdf') // For exam papers
};