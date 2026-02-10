// ✅ JOB PDF UPLOAD CONFIGURATION
const jobStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'job-pdfs',
      resource_type: 'raw',  // ⭐⭐ PDF साठी 'raw' ⭐⭐
      format: 'pdf',
      type: 'upload',
      
      public_id: `job_${Date.now()}_${file.originalname
        .replace(/\s+/g, '_')
        .replace('.pdf', '')}`,
      
      flags: 'attachment',
      transformation: [
        { flags: 'attachment:job.pdf' }
      ]
    };
  }
});

const uploadJobPdf = multer({
  storage: jobStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed for jobs'), false);
    }
    cb(null, true);
  }
});

// ✅ EXPORT BOTH
module.exports = {
  uploadExamPaper,
  uploadJobPdf
};