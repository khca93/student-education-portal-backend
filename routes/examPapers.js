const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const uploadExamPaper = require('../middleware/cloudinaryUpload');
const cloudinary = require('../config/cloudinary');

const {
  getAllExamPapers,
  getExamPaperById,
  createExamPaper,
  updateExamPaper,
  deleteExamPaper,
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

// Get exam structure
router.get('/structure', getExamStructure);

/*
|--------------------------------------------------------------------------
| PDF Download Route  ✅ MUST BE ABOVE /:id
|--------------------------------------------------------------------------
*/
router.get('/download/pdf/:publicId', async (req, res) => {
  try {
    const publicId = req.params.publicId;

    if (!publicId) {
      return res.status(400).send('Invalid PDF');
    }

    const pdfUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true
    });

    return res.redirect(pdfUrl);

  } catch (err) {
    console.error('PDF download error:', err);
    res.status(500).send('PDF download failed');
  }
});

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
  uploadExamPaper.single('pdf'),
  examPaperValidation,
  createExamPaper
);

// Update exam paper
router.put(
  '/:id',
  adminAuth,
  uploadExamPaper.single('pdf'),
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
