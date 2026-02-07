const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: 'exam-papers',

    // ✅ IMPORTANT: PDF browser + download support
    resource_type: 'image',
    format: 'pdf',

    // ✅ Force proper download
    flags: 'attachment',

    // ✅ Clean & safe filename
    public_id: `${Date.now()}-${file.originalname
      .replace(/\s+/g, '-')
      .replace('.pdf', '')}`
  })
});

const uploadExamPaper = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  }
});

module.exports = uploadExamPaper;
