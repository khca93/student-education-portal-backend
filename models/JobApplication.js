const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicantName: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  resume: {
    type: String,
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  qualification: {
  type: String,
  required: true
},
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
