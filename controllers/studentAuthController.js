const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/emailService');
const { validationResult } = require('express-validator');

const generateToken = (id) =>
  jwt.sign({ id, role: 'student' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });

// Register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { name, email, mobile, password } = req.body;

  const exists = await Student.findOne({ $or: [{ email }, { mobile }] });
  if (exists)
    return res.status(400).json({ message: 'Student already exists' });

  const student = await Student.create({ name, email, mobile, password });
  const token = generateToken(student._id);

  res.status(201).json({
    success: true,
    token,
    user: student
  });
};

// Login
const login = async (req, res) => {
  const { loginId, password } = req.body;

  console.log("👉 LOGIN ID RECEIVED:", loginId);
  console.log("👉 PASSWORD RECEIVED:", password);

  const student = await Student.findOne({
    $or: [{ email: loginId }, { mobile: loginId }]
  });

  console.log("👉 STUDENT FOUND:", student);

  if (!student) {
    console.log("❌ NO STUDENT IN DB");
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await student.comparePassword(password);
  console.log("👉 PASSWORD MATCH:", isMatch);

  if (!isMatch)
    return res.status(401).json({ message: 'Invalid credentials' });

  const token = generateToken(student._id);
  res.json({ success: true, token, user: student });
};

// Profile
const getProfile = async (req, res) => {
  const student = await Student.findById(req.user._id)
    .populate('savedPapers');

  res.json({
    success: true,
    profile: student
  });
};

exports.sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Email not registered'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    student.otp = otp;
    student.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min
    await student.save();

    await sendOtpEmail({
      to: student.email,
      name: student.name,
      otp
    });

    res.json({
      success: true,
      message: 'OTP sent to email'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const student = await Student.findOne({ email });
    if (!student || !student.otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    if (student.otp !== otp || student.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Clear OTP
    student.otp = null;
    student.otpExpiry = null;
    await student.save();

    const token = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
};
module.exports = {
  register,
  login,
  getProfile,
  sendLoginOtp,
  verifyLoginOtp
};
