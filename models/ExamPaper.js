const mongoose = require('mongoose');

const examPaperSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['10th SSC', '10th CBSE', '12th HSC', 'Graduation', 'Competitive']
  },
  className: {
    type: String,
    required: [true, 'Class is required']
  },
  year: {
    type: String,
    required: [true, 'Year is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  paperType: {
    type: String,
    required: [true, 'Paper type is required'],
    enum: ['Final Exam Paper', 'Practice Paper']
  },
  pdfPath: {
    type: String,
    required: [true, 'PDF file is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
examPaperSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ExamPaper', examPaperSchema);