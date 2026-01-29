const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },

  jobType: {
    type: String,
    enum: ['government', 'information', 'apply'],
    required: true
  },

  qualification: {
    type: String,
    required: true
  },

  // Government job
  department: {
    type: String,
    default: null
  },
  lastDate: {
    type: Date,
    default: null
  },
  jobPdf: {
    type: String,
    default: null
  },

  // Information job
  company: {
    type: String,
    default: null
  },
  contactNumber: {
    type: String,
    default: null
  },
  contactEmail: {
    type: String,
    default: null
  },

  // Apply job
  companyName: {
    type: String,
    default: null
  },
  jobDescription: {
    type: String,
    default: null
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
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
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Job', jobSchema);