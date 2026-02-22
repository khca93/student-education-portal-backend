// D:\WEBFILE\StudentEducationPortal\backend\server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');


// Load environment variables
dotenv.config();

console.log("MONGO_URI =", process.env.MONGO_URI);
// Import database connection
const connectDB = require('./config/database');

// Import routes
const studentAuthRoutes = require('./routes/studentAuth');
const adminAuthRoutes = require('./routes/adminAuth');
const jobRoutes = require('./routes/jobs');
const examPaperRoutes = require('./routes/examPapers');
// Blog routes removed

// Import controllers
const { initializeAdmin } = require('./controllers/adminAuthController');

const app = express();

connectDB().then(() => {
  initializeAdmin();
});


// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));


// Routes
app.use('/api/student/auth', studentAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/exam-papers', examPaperRoutes);

const blogRoutes = require('./routes/blogs');
app.use('/api/blogs', blogRoutes);

// Root route (IMPORTANT for Render / Browser check)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student Education Portal Backend is Live 🚀'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Student Education Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: "File upload error",
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development"
      ? err.message
      : "Internal server error"
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


