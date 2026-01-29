const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  login,
  getProfile,
  getDashboardStats
} = require('../controllers/adminAuthController');

const { adminAuth } = require('../middleware/auth');

/* ================= LOGIN VALIDATION ================= */

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

/* ================= ROUTES ================= */

// Admin login
router.post('/_secure_login_92x', loginValidation, login);

// Admin profile
router.get('/profile', adminAuth, getProfile);

// Admin dashboard stats
router.get('/dashboard', adminAuth, getDashboardStats);

module.exports = router;

// ⚠️ TEMPORARY ADMIN RESET ROUTE (DEV ONLY)
router.get('/__reset_admin__', async (req, res) => {
  const Admin = require('../models/Admin');

  await Admin.deleteMany({});

  const admin = new Admin({
    email: 'admin@educationportal.com',
    password: '123456'
  });

  await admin.save();

  res.json({
    success: true,
    message: 'Admin reset done',
    login: {
      email: 'admin@educationportal.com',
      password: '123456'
    }
  });
});
