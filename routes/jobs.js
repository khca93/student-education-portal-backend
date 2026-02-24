const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const multer = require('multer');
const upload = multer();

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

const { adminAuth } = require('../middleware/auth');

/* =========================================================
   JOB VALIDATION
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
    .trim(),

];

/* =========================================================
   PUBLIC ROUTES
========================================================= */

router.get('/', getAllJobs);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid job ID'),
  getJobById
);

/* =========================================================
   ADMIN ROUTES
========================================================= */

router.post(
  '/',
  adminAuth,
  upload.single('jobPdf'),
  jobValidation,
  createJob
);

router.put(
  '/:id',
  adminAuth,
  upload.single('jobPdf'),
  jobValidation,
  updateJob
);

router.delete(
  '/:id',
  adminAuth,
  param('id').isMongoId().withMessage('Invalid job ID'),
  deleteJob
);

router.get(
  '/applications/all',
  adminAuth,
  getJobApplications
);

router.delete(
  '/applications/:id',
  adminAuth,
  param('id').isMongoId().withMessage('Invalid application ID'),
  deleteJobApplication
);

/* =========================================================
   STUDENT ROUTE
========================================================= */

router.post(
  '/apply',
  upload.single('resume'),
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

module.exports = router;
