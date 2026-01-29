const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },

  // Saved exam papers
  savedPapers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamPaper'
    }
  ],

  // Download history
  downloadHistory: [
    {
      paperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamPaper'
      },
      downloadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // Applied jobs
  appliedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
studentSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
