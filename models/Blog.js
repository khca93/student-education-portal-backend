const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  content: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String,
    default: 'General',
    trim: true
  },

  image: {
    type: String,
    default: ''
  },

  views: {
    type: Number,
    default: 0,
    min: 0
  },

  likes: {
    type: Number,
    default: 0,
    min: 0
  },

  metaTitle: {
    type: String,
    default: ''
  },

  metaDescription: {
    type: String,
    default: ''
  },

  comments: [
    {
      name: {
        type: String,
        required: true,
        trim: true
      },
      message: {
        type: String,
        required: true,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]

}, { timestamps: true });

/* ================= SEARCH INDEX ================= */
blogSchema.index(
  { title: 'text', content: 'text' },
  { weights: { title: 5, content: 1 } }
);

module.exports = mongoose.model('Blog', blogSchema);