const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
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

const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Invalid Google data' });
    }

    let student = await Student.findOne({
      $or: [{ email }, { googleId }]
    });

    if (!student) {
  student = await Student.create({
    name,
    email,
    googleId,
    mobile: "GOOGLE_" + Date.now(),
    password: Math.random().toString(36).slice(-8)
  });
}


    const token = generateToken(student._id);

    res.json({
      success: true,
      token,
      user: student
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Google login failed' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  googleLogin
};
