const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'exam-papers',

    // ✅ IMPORTANT
    resource_type: 'raw',

    public_id: (req, file) =>
      `${Date.now()}-${file.originalname
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9.\-_]/g, '')}`
  }
});

const uploadExamPaper = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF allowed'), false);
    }
    cb(null, true);
  }
});

module.exports = uploadExamPaper;
