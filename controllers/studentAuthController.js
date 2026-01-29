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

module.exports = { register, login, getProfile };
