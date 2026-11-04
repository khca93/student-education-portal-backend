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
    default: '',
    trim: true
  },

  subtitle: { type: String, default: '', trim: true, maxlength: 240 },
  excerpt: { type: String, default: '', trim: true, maxlength: 320 },
  tags: { type: [String], default: [] },
  authorName: { type: String, default: '', trim: true, maxlength: 120 },
  publishedAt: { type: Date, default: null },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  featured: { type: Boolean, default: false, index: true },
  focusKeyword: { type: String, default: '', trim: true, maxlength: 120 },
  canonicalUrl: { type: String, default: '', trim: true, maxlength: 500 },
  socialTitle: { type: String, default: '', trim: true, maxlength: 160 },
  socialDescription: { type: String, default: '', trim: true, maxlength: 320 },
  socialImage: { type: String, default: '', trim: true, maxlength: 1000 },
  imageAlt: { type: String, default: '', trim: true, maxlength: 240 },
  imageCaption: { type: String, default: '', trim: true, maxlength: 320 },

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
      // no default: old comments have no field and count as approved
      approved: Boolean,
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
