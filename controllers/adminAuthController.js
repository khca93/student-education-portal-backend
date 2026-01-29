const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Initialize default admin (run once)
const initializeAdmin = async () => {
  try {
    const count = await Admin.countDocuments();

    if (count === 0) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD // 👈 PLAIN
      });

      console.log('✅ Default admin created');
    }
  } catch (err) {
    console.error(err);
  }
};

// Admin Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔒 ONLY THIS EMAIL CAN LOGIN
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(admin._id);

    res.json({
      success: true,
      token
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin Profile
const getProfile = async (req, res) => {
  const admin = await Admin.findById(req.user._id).select('-password');
  res.json({
    success: true,
    profile: admin
  });
};

const Job = require('../models/Job');
const ExamPaper = require('../models/ExamPaper');
const JobApplication = require('../models/JobApplication');

const getDashboardStats = async (req, res) => {
  try {
    const [jobs, papers, blogs, applications] = await Promise.all([
      Job.countDocuments(),
      ExamPaper.countDocuments(),
      JobApplication.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        totalJobs: jobs,
        totalPapers: papers,
        totalBlogs: blogs,
        totalApplications: applications
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard stats'
    });
  }
};

module.exports = {
  initializeAdmin,
  login,
  getProfile,
  getDashboardStats   // 👈 ADD THIS
};


