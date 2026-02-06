const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');


// Paper Controllers
const {
  savePaper,
  getSavedPapers
} = require('../controllers/studentPaperController');

// Middleware
const { studentAuth } = require('../middleware/auth');

/*
|-------------------------------------------------------------------------- 
| Student Registration Validation
|-------------------------------------------------------------------------- 
*/
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),

  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('mobile')
    .isLength({ min: 10, max: 10 })
    .withMessage('Mobile number must be 10 digits')
    .isNumeric()
    .withMessage('Mobile number must contain only numbers'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

/*
|-------------------------------------------------------------------------- 
| Student Login Validation
|-------------------------------------------------------------------------- 
*/
const loginValidation = [
  body('loginId')
    .trim()
    .notEmpty()
    .withMessage('Email or mobile is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];
const {
  register,
  login,
  getProfile,
  googleLogin
} = require('../controllers/studentAuthController');


/*
|-------------------------------------------------------------------------- 
| Routes
|-------------------------------------------------------------------------- 
*/

// ✅ Register student
router.post('/register', registerValidation, register);

// ✅ Login student
router.post('/login', loginValidation, login);

// ✅ Get logged-in student profile
router.get('/profile', studentAuth, getProfile);

router.post('/google-login', googleLogin);


// ✅ Save exam paper (LOGIN REQUIRED)
const { validationResult } = require('express-validator');

router.post(
  '/save-paper/:paperId',
  studentAuth,
  param('paperId').isMongoId().withMessage('Invalid paper ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  },
  savePaper
);


// ✅ Get all saved papers (Dashboard)
router.get(
  '/saved-papers',
  studentAuth,
  getSavedPapers
);



module.exports = router;


