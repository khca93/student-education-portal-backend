const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload'); // ✅ ADD THIS

const {
  getAllExamPapers,
  getExamPaperById,
  createExamPaper,
  updateExamPaper,
  deleteExamPaper,
  getExamStructure
} = require('../controllers/examPaperController');

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
    query('paperType')
      .optional()
      .isIn(['Final Exam Paper', 'Practice Paper'])
  ],
  getAllExamPapers
);

// Get exam structure
router.get('/structure', getExamStructure);

// Get single exam paper by ID
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
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('class').trim().notEmpty().withMessage('Class is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('year').trim().notEmpty().withMessage('Year is required'),
  body('paperType')
    .isIn(['Final Exam Paper', 'Practice Paper'])
    .withMessage('Invalid paper type'),
  body('fileName')
    .trim()
    .notEmpty()
    .withMessage('File name is required')
  // ❌ pdfPath validation removed (R2 upload will generate it)
];

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

// ✅ CREATE exam paper (WITH PDF UPLOAD)
router.post(
  '/',
  adminAuth,
  upload.single('pdf'),   // ✅ THIS IS IMPORTANT
  examPaperValidation,
  createExamPaper
);

// UPDATE exam paper
router.put(
  '/:id',
  adminAuth,
  upload.single('pdf'),   // ✅ allow optional PDF update
  examPaperValidation,
  updateExamPaper
);

// DELETE exam paper
router.delete(
  '/:id',
  adminAuth,
  param('id').isMongoId().withMessage('Invalid exam paper ID'),
  deleteExamPaper
);

module.exports = router;
