const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  category: { type: String },
  image: { type: String },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  metaTitle: String,
  metaDescription: String,

  comments: [
    {
      name: String,
      message: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]

}, { timestamps: true });
module.exports = mongoose.model('Blog', blogSchema);