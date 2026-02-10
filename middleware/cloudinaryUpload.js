const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

/* ===============================
   EXAM PAPER PDF (VIEW + DOWNLOAD)
================================ */
const examPaperStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'exam-papers',
    resource_type: 'auto',   // ✅ FIXED
    format: 'pdf',           // ✅ FORCE PDF
    public_id: `paper_${Date.now()}`,
  }),
});

const uploadExamPaper = multer({
  storage: examPaperStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files allowed'), false);
    }
    cb(null, true);
  },
});

/* ===============================
   JOB PDF (DOWNLOAD ONLY)
================================ */
const jobPdfStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'job-pdfs',
    resource_type: 'auto',
    format: 'pdf',
    flags: 'attachment',   // ✅ download only
    public_id: `job_${Date.now()}`,
  }),
});

const uploadJobPdf = multer({
  storage: jobPdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  uploadExamPaper,
  uploadJobPdf,
};
