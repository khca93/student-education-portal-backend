const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import the exam paper upload middleware
const uploadExamPaper = require('../middleware/uploadExamPaper');

const {
  getAllExamPapers,
  getExamPaperById,
  createExamPaper,
  updateExamPaper,
  deleteExamPaper,
  getDashboardStats,
  getExamStructure
} = require('../controllers/examPaperController');

const { adminAuth } = require('../middleware/auth');

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Get all exam papers (with filters)
router.get(
  '/',
  [
    query('category').optional().isString(),
    query('class').optional().isString(),
    query('year').optional().isString(),
    query('subject').optional().isString(),
    query('paperType').optional().isIn(['Final Exam Paper', 'Practice Paper'])
  ],
  getAllExamPapers
);

router.get('/structure', getExamStructure);

router.get('/stats', adminAuth, getDashboardStats);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid exam paper ID'),
  getExamPaperById
);

/*
|--------------------------------------------------------------------------
| Exam Paper Validation
|--------------------------------------------------------------------------
*/
const examPaperValidation = [
  body('category')
    .isIn(['10th SSC', '10th CBSE', '12th HSC', 'Graduation', 'Competitive'])
    .withMessage('Invalid category'),

  body('class')
    .trim()
    .notEmpty()
    .withMessage('Class is required'),

  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),

  body('year')
    .trim()
    .notEmpty()
    .withMessage('Year is required'),

  body('paperType')
    .isIn(['Final Exam Paper', 'Practice Paper'])
    .withMessage('Invalid paper type')
];

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

// Create exam paper
router.post(
  '/',
  adminAuth,
  uploadExamPaper, // Use the exam paper upload middleware
  examPaperValidation,
  createExamPaper
);

// Update exam paper
router.put(
  '/:id',
  adminAuth,
  uploadExamPaper, // Use the exam paper upload middleware
  examPaperValidation,
  updateExamPaper
);

// Delete exam paper
router.delete(
  '/:id',
  adminAuth,
  param('id').isMongoId().withMessage('Invalid exam paper ID'),
  deleteExamPaper
);

module.exports = router;