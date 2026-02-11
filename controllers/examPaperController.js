const ExamPaper = require('../models/ExamPaper');
const { validationResult } = require('express-validator');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

/* ================= R2 CONFIG ================= */

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const R2_PUBLIC_URL = "https://pub-e2040be1b3ea4a2cb0e77532ce79506c.r2.dev";

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
      papers: examPapers
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
   CREATE EXAM PAPER (R2 UPLOAD)
========================================================= */
const createExamPaper = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    const fileName = Date.now() + "-" + req.file.originalname;

    await s3.send(
      new PutObjectCommand({
        Bucket: "exampaper-pdfs",
        Key: fileName,
        Body: req.file.buffer,
        ContentType: "application/pdf",
      })
    );

    const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

    const examPaper = await ExamPaper.create({
      category: req.body.category,
      class: req.body.class,
      subject: req.body.subject,
      year: req.body.year,
      fileName: req.body.fileName,
      paperType: req.body.paperType,
      pdfPath: publicUrl,
      uploadedBy: req.user && req.user._id ? req.user._id : null
    });

    res.status(201).json({
      success: true,
      examPaper
    });

  } catch (err) {
    console.error('R2 Upload Error:', err);
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const paper = await ExamPaper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Exam paper not found'
      });
    }

    paper.category = req.body.category;
    paper.class = req.body.class;
    paper.subject = req.body.subject;
    paper.fileName = req.body.fileName;
    paper.year = req.body.year;
    paper.paperType = req.body.paperType;

    // ✅ Optional new PDF upload
    if (req.file) {
      const fileName = Date.now() + "-" + req.file.originalname;

      await s3.send(
        new PutObjectCommand({
          Bucket: "exampaper-pdfs",
          Key: fileName,
          Body: req.file.buffer,
          ContentType: "application/pdf",
        })
      );

      paper.pdfPath = `${R2_PUBLIC_URL}/${fileName}`;
    }

    await paper.save();

    res.json({
      success: true,
      message: 'Exam paper updated successfully',
      paper
    });

  } catch (err) {
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
