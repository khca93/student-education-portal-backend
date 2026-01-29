const ExamPaper = require('../models/ExamPaper');
const path = require('path');
const fs = require('fs');
const { validationResult } = require('express-validator');


/* =========================================================
   GET ALL EXAM PAPERS (WITH FILTERS)
========================================================= */
const getAllExamPapers = async (req, res) => {
  try {
    const { category, class: className, year, subject, paperType } = req.query;

    const query = {};
    if (category) query.category = category;
    if (className) query.class = className;
    if (year) query.year = year;
    if (subject) query.subject = subject;
    if (paperType) query.paperType = paperType;

    const examPapers = await ExamPaper.find(query)
      .populate('uploadedBy', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      examPapers
    });
  } catch (err) {
    console.error('Error getting exam papers:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam papers'
    });
  }
};

/* =========================================================
   GET SINGLE EXAM PAPER
========================================================= */
const getExamPaperById = async (req, res) => {
  try {
    const paper = await ExamPaper.findById(req.params.id)
      .populate('uploadedBy', 'email');

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Exam paper not found'
      });
    }

    res.json({
      success: true,
      paper
    });
  } catch (err) {
    console.error('Error getting exam paper:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam paper'
    });
  }
};

/* =========================================================
   CREATE EXAM PAPER
========================================================= */
const createExamPaper = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    // Create exam paper in database
    const examPaper = await ExamPaper.create({
      category: req.body.category,
      class: req.body.class,
      subject: req.body.subject,
      year: req.body.year,
      paperType: req.body.paperType,
      pdfPath: `/uploads/papers/${req.file.filename}`,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      examPaper
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error creating exam paper:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create exam paper'
    });
  }
};

/* =========================================================
   UPDATE EXAM PAPER
========================================================= */
const updateExamPaper = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Find existing paper
    const paper = await ExamPaper.findById(req.params.id);
    if (!paper) {
      // Clean up uploaded file if paper not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Exam paper not found'
      });
    }

    // Store old file path for cleanup
    const oldFilePath = paper.pdfPath ? path.join(__dirname, '..', paper.pdfPath) : null;

    // Update paper details
    paper.category = req.body.category;
    paper.class = req.body.class;
    paper.subject = req.body.subject;
    paper.year = req.body.year;
    paper.paperType = req.body.paperType;

    // If new file uploaded, update file path and delete old file
    if (req.file) {
      // Delete old file if it exists
      if (oldFilePath && fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (unlinkErr) {
          console.error('Error deleting old file:', unlinkErr);
        }
      }
      paper.pdfPath = `/uploads/papers/${req.file.filename}`;
    }

    // Save updated paper
    await paper.save();

    res.json({
      success: true,
      examPaper: paper
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error updating exam paper:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update exam paper'
    });
  }
};

/* =========================================================
   DELETE EXAM PAPER
========================================================= */
const deleteExamPaper = async (req, res) => {
  try {
    const paper = await ExamPaper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Exam paper not found'
      });
    }

    // Delete PDF file from server
    if (paper.pdfPath) {
      const filePath = path.join(__dirname, '..', paper.pdfPath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      }
    }

    // Delete from database
    await paper.deleteOne();

    res.json({
      success: true,
      message: 'Exam paper deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting exam paper:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete exam paper'
    });
  }
};

/* =========================================================
   GET DASHBOARD STATS
========================================================= */
const getDashboardStats = async (req, res) => {
  try {
    const Job = require('../models/Job');
    const JobApplication = require('../models/JobApplication');
    
    // Get counts in parallel for better performance
    const [totalPapers, totalJobs, totalApplications] = await Promise.all([
      ExamPaper.countDocuments(),
      Job.countDocuments(),
      JobApplication.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        totalPapers,
        totalJobs,
        totalApplications
        // Removed totalBlogs
      }
    });
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard stats'
    });
  }
};
/* =========================================================
   EXAM STRUCTURE
========================================================= */
const getExamStructure = async (req, res) => {
  res.json({
    success: true,
    structure: {
      '10th SSC': {
        classes: ['Class 10'],
        subjects: ['Mathematics', 'Science', 'English', 'Marathi', 'Hindi', 'History', 'Geography', 'Sanskrit']
      },
      '10th CBSE': {
        classes: ['Class 10'],
        subjects: ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'Sanskrit', 'Computer Science']
      },
      '12th HSC': {
        classes: ['Class 12 Science', 'Class 12 Commerce', 'Class 12 Arts'],
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics', 'Business Studies', 'English']
      },
      'Graduation': {
        classes: ['BA', 'B.Com', 'B.Sc', 'BCA', 'BBA', 'BE', 'B.Tech'],
        subjects: ['Core Subjects', 'Electives', 'Lab Practicals', 'Projects']
      },
      'Competitive': {
        classes: ['SSC CGL', 'Railway', 'Banking', 'UPSC', 'MPSC', 'Defense'],
        subjects: ['General Knowledge', 'Quantitative Aptitude', 'Reasoning', 'English', 'Current Affairs']
      }
    }
  });
};

module.exports = {
  getAllExamPapers,
  getExamPaperById,
  createExamPaper,
  updateExamPaper,
  deleteExamPaper,
  getDashboardStats,
  getExamStructure
};