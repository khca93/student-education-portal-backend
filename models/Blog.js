const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  category: { type: String },
  metaTitle: String,
  metaDescription: String
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);