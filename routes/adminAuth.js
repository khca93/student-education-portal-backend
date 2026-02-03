const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const Admin = require('../models/Admin');

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

/* ================= ENV BASED ADMIN PASSWORD RESET ================= */

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // 🔐 Only admin email from .env allowed
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        message: 'Unauthorized email'
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        message: 'Admin not found'
      });
    }

    const envPassword = process.env.ADMIN_PASSWORD;
    if (!envPassword) {
      return res.status(500).json({
        message: 'ADMIN_PASSWORD not set in env'
      });
    }

    // ✅ Reset password (bcrypt will hash automatically)
    admin.password = envPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password reset to default admin password'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

/* ================= DEV ONLY RESET (OPTIONAL) ================= */
/*
⚠️ हे route production मध्ये ठेवू नको
फक्त local testing साठी
*/
router.get('/__reset_admin__', async (req, res) => {
  await Admin.deleteMany({});

  const admin = new Admin({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  });

  await admin.save();

  res.json({
    success: true,
    message: 'Admin reset done (DEV ONLY)'
  });
});

module.exports = router;
