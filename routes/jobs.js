const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { uploadPaper } = require('../middleware/upload');

// FIXED: Correct import of upload middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const resumesUploadPath = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(resumesUploadPath)) {
  fs.mkdirSync(resumesUploadPath, { recursive: true });
}
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumesUploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `resume_${unique}${ext}`);
  }
});

const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF resumes allowed'), false);
    }
  }
});

// Ensure uploads/jobs folder exists
const jobsUploadPath = path.join(__dirname, '..', 'uploads', 'jobs');
if (!fs.existsSync(jobsUploadPath)) {
  fs.mkdirSync(jobsUploadPath, { recursive: true });
}

// Configure multer for job uploads
const jobStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, jobsUploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    cb(null, `${originalName}_${unique}${extension}`);
  }
});

const jobFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for jobs'), false);
  }
};

const uploadExamPaper = require('../middleware/cloudinaryUpload');


const {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  getApplicationsByJob,
  deleteJobApplication,
} = require('../controllers/jobController');


const { adminAuth, studentAuth } = require('../middleware/auth');

/* =========================================================
   JOB VALIDATION MIDDLEWARE
========================================================= */
const jobValidation = [
  body('jobTitle')
    .trim()
    .notEmpty()
    .withMessage('Job title is required'),

  body('jobType')
    .isIn(['government', 'information', 'apply'])
    .withMessage('Invalid job type'),

  body('qualification')
    .trim()
    .notEmpty()
    .withMessage('Qualification is required'),

  body('companyName')
    .optional()
    .trim(),

  body('lastDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),

  body('jobDescription')
    .optional()
    .trim()
];

/* =========================================================
   PUBLIC ROUTES
========================================================= */

// Get all jobs
router.get('/', getAllJobs);

// Get single job by ID
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid job ID'),
  getJobById
);

/* =========================================================
   ADMIN ROUTES
========================================================= */



// Create new job
router.post(
  '/',
  adminAuth,
  uploadExamPaper.single('jobPdf'),
  jobValidation,
  createJob
);

// Create new job - FIXED: Use jobUpload.single()
router.put(
  '/:id',
  adminAuth,
  uploadExamPaper.single('jobPdf'),
  jobValidation,
  updateJob
);


// Delete job
router.delete(
  '/:id',
  adminAuth,
  param('id').isMongoId().withMessage('Invalid job ID'),
  deleteJob
);


// Get all job applications
router.get(
  '/applications/all',
  adminAuth,
  getJobApplications
);

// Get applications for specific job
router.get(
  '/applications/job/:jobId',
  adminAuth,
  param('jobId').isMongoId().withMessage('Invalid job ID'),
  getApplicationsByJob
);

// Delete job application
router.delete(
  '/applications/:id',
  adminAuth,
  param('id').isMongoId().withMessage('Invalid application ID'),
  deleteJobApplication
);

/* =========================================================
   STUDENT ROUTES
========================================================= */

// Apply for job
router.post(
  '/apply',
  resumeUpload.single('resume'),
  [
    body('jobId')
      .isMongoId()
      .withMessage('Invalid job ID'),

    body('applicantName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required'),

    body('qualification')
      .trim()
      .notEmpty()
      .withMessage('Qualification is required'),

    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email is required'),

    body('mobile')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
  ],
  applyForJob
);

// Serve resume file (ADMIN)
router.get(
  '/applications/resume/:filename',
  (req, res) => {
    const filePath = path.join(__dirname, '..', 'uploads', 'resumes', req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    res.sendFile(filePath);
  }
);


module.exports = router;