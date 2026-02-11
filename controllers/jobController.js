const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

const { validationResult } = require('express-validator');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

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
   GET ALL JOBS
========================================================= */
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};

/* =========================================================
   GET JOB BY ID
========================================================= */
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).select('-__v');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.status(200).json({ success: true, job });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid Job ID',
      error: error.message
    });
  }
};

/* =========================================================
   CREATE JOB (ADMIN)
========================================================= */
const createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let jobPdfUrl = null;

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

      jobPdfUrl = `${R2_PUBLIC_URL}/${fileName}`;
    }


    const jobData = {
      jobTitle: req.body.jobTitle.trim(),
      jobType: req.body.jobType,
      qualification: req.body.qualification?.trim() || '',
      companyName: req.body.companyName?.trim(),
      lastDate: req.body.lastDate || null,
      jobDescription: req.body.jobDescription || '',
      jobPdf: jobPdfUrl || null,
      createdBy: req.user._id
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
};

/* =========================================================
   UPDATE JOB (ADMIN)
========================================================= */
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.jobTitle = req.body.jobTitle || job.jobTitle;
    job.jobType = req.body.jobType || job.jobType;
    job.qualification = req.body.qualification || job.qualification;
    job.companyName = req.body.companyName || job.companyName;
    job.lastDate = req.body.lastDate || job.lastDate;
    job.jobDescription = req.body.jobDescription || job.jobDescription;

    // 🔥 NEW PDF UPLOAD IF FILE EXISTS
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

      job.jobPdf = `${R2_PUBLIC_URL}/${fileName}`;
    }

    job.updatedAt = Date.now();

    await job.save();

    res.json({ success: true, message: 'Job updated', job });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
};


/* =========================================================
   DELETE JOB (ADMIN)
========================================================= */
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await JobApplication.deleteMany({ jobId: job._id });
    await job.deleteOne();

    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
};


/* =========================================================
   APPLY FOR JOB (STUDENT)
========================================================= */
const applyForJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required'
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

    const resumeUrl = `${R2_PUBLIC_URL}/${fileName}`;

    const exists = await JobApplication.findOne({
      jobId: req.body.jobId,
      email: req.body.email,
      mobile: req.body.mobile
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Already applied'
      });
    }

    const application = new JobApplication({
      jobId: req.body.jobId,
      applicantName: req.body.applicantName.trim(),
      qualification: req.body.qualification?.trim() || '',
      mobile: req.body.mobile.trim(),
      email: req.body.email.trim().toLowerCase(),
      resume: resumeUrl
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        _id: application._id,
        jobId: application.jobId,
        applicantName: application.applicantName,
        email: application.email,
        mobile: application.mobile,
        appliedAt: application.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to apply',
      error: error.message
    });
  }
};

/* =========================================================
   GET ALL APPLICATIONS (ADMIN)
========================================================= */
const getJobApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find()
      .populate({
        path: "jobId",
        select: "jobTitle",
        strictPopulate: false
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      applications: applications.map(app => ({
        _id: app._id,
        applicantName: app.applicantName,
        email: app.email,
        mobile: app.mobile,
        resume: app.resume,
        appliedAt: app.createdAt,
        status: app.status || "pending",
        jobId: app.jobId   // <-- populated object
      }))
    });

  } catch (error) {
    console.error("❌ GET APPLICATIONS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications"
    });
  }
};


/* =========================================================
   DELETE APPLICATION (ADMIN)
========================================================= */
const deleteJobApplication = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await application.deleteOne();

    res.json({ success: true, message: 'Application deleted' });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
};
/* =========================================================
   GET APPLICATIONS BY JOB ID (ADMIN)
========================================================= */
const getApplicationsByJob = async (req, res) => {
  try {
    const applications = await JobApplication.find({
      jobId: req.params.jobId
    })
      .populate('jobId', 'jobTitle')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job applications'
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application status updated',
      application
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  getApplicationsByJob,
  deleteJobApplication,
};


