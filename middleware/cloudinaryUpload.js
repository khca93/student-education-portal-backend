const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'exam-papers',
    resource_type: 'raw', // IMPORTANT for PDFs
    format: async (req, file) => 'pdf',
    public_id: (req, file) => {
      const name = file.originalname.replace(/\.[^/.]+$/, "");
      return `${Date.now()}-${name}`;
    },
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = upload;
