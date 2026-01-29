const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

/* =========================================================
   HELPER: GET TOKEN
========================================================= */
const getToken = (req) => {
  if (!req.headers.authorization) return null;

  if (req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

/* =========================================================
   STUDENT AUTH
========================================================= */
const studentAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // optional safety: role check
    if (decoded.role && decoded.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const student = await Student.findById(decoded.id).select('-password');

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = student;
    req.user.role = 'student';
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/* =========================================================
   ADMIN AUTH
========================================================= */
const adminAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // optional safety: role check
    if (decoded.role && decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = admin;
    req.user.role = 'admin';
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/* =========================================================
   ROLE BASED AUTH (OPTIONAL)
========================================================= */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    next();
  };
};

module.exports = {
  studentAuth,
  adminAuth,
  authorize
};
