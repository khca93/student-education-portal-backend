const mongoose = require('mongoose');

// Older copy of an article, kept on each manual save (last 20 per blog).
const blogRevisionSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  savedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BlogRevision', blogRevisionSchema);
