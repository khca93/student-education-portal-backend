const Blog = require('../models/Blog');
const sanitizeHtml = require('sanitize-html');

const cleanText = (value, max = 500) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const slugify = (value) => cleanText(value, 160).toLowerCase()
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160);
const safeUrl = (value) => {
  const url = cleanText(value, 1000);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.toString() : '';
  } catch { return ''; }
};
const sanitizeArticle = (html) => sanitizeHtml(String(html || ''), {
  allowedTags: [
    'address', 'article', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'del', 'div', 'dl', 'dt',
    'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre',
    's', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul', 'a',
    'iframe'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height', 'style', 'class'],
    iframe: ['src', 'width', 'height', 'title', 'allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy'],
    '*': ['style', 'class', 'colspan', 'rowspan', 'scope']
  },
  allowedStyles: {
    '*': {
      'text-align': [/^(left|center|right|justify)$/],
      'float': [/^(left|right|none)$/],
      'color': [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,%.]+\)$/i, /^rgba\([\d\s,%.]+\)$/i],
      'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,%.]+\)$/i, /^rgba\([\d\s,%.]+\)$/i],
      'font-size': [/^(\d+(\.\d+)?)(px|pt|em|rem|%)$/],
      'font-family': [/^[\w\s,"'-]+$/],
      'text-decoration': [/^(underline|line-through|none)$/],
      'line-height': [/^(0?\.\d+|[1-3](\.\d+)?)$/],
      'margin-top': [/^(0|\d+(\.\d+)?)(px|pt|em|rem|%)$/],
      'margin-bottom': [/^(0|\d+(\.\d+)?)(px|pt|em|rem|%)$/],
      'margin-left': [/^(0|\d+(\.\d+)?)(px|pt|em|rem|%)$/],
      'margin-right': [/^(0|\d+(\.\d+)?)(px|pt|em|rem|%)$/],
      'width': [/^(\d+(\.\d+)?)(px|%)$/],
      'height': [/^(\d+(\.\d+)?)(px|%)$/]
    }
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    iframe: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin' } })
  }
});
const publishedFilter = { $or: [{ status: 'published' }, { status: { $exists: false } }] };
const approvedOnly = (comments) => (comments || []).filter((c) => c.approved !== false);
const serializePublicBlog = (blog) => {
  if (!blog) return blog;
  const result = typeof blog.toObject === 'function' ? blog.toObject() : { ...blog };
  result.content = sanitizeArticle(result.content);
  result.comments = approvedOnly(result.comments);
  return result;
};
// List/card shape: no article body, no comments.
const serializeCard = (blog) => {
  if (!blog) return blog;
  const { content, comments, ...card } = blog.toObject();
  card.excerpt = card.excerpt || sanitizeHtml(String(content || ''), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim().slice(0, 160);
  return card;
};
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const normalizePayload = (body) => {
  const content = sanitizeArticle(body.content);
  const tags = Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',');
  const requestedStatus = body.status === 'draft' ? 'draft' : 'published';
  const title = cleanText(body.title, 180);
  if (!title) throw new Error('A title is required.');
  if (requestedStatus === 'published' && !sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} }).trim()) {
    throw new Error('Add article content before publishing.');
  }

  return {
    title,
    subtitle: cleanText(body.subtitle, 240),
    excerpt: cleanText(body.excerpt, 320),
    content,
    category: cleanText(body.category || 'General', 80) || 'General',
    tags: [...new Set(tags.map((tag) => cleanText(tag, 40)).filter(Boolean))].slice(0, 20),
    authorName: cleanText(body.authorName, 120),
    image: safeUrl(body.imageUrl || body.image),
    imageAlt: cleanText(body.imageAlt, 240),
    imageCaption: cleanText(body.imageCaption, 320),
    focusKeyword: cleanText(body.focusKeyword, 120),
    metaTitle: cleanText(body.metaTitle, 160),
    metaDescription: cleanText(body.metaDescription, 320),
    canonicalUrl: safeUrl(body.canonicalUrl),
    socialTitle: cleanText(body.socialTitle, 160),
    socialDescription: cleanText(body.socialDescription, 320),
    socialImage: safeUrl(body.socialImage),
    featured: body.featured === true,
    status: requestedStatus,
    publishedAt: requestedStatus === 'published' ? (body.publishedAt && !Number.isNaN(Date.parse(body.publishedAt)) ? new Date(body.publishedAt) : new Date()) : null,
    ...(body.slug !== undefined ? { slug: slugify(body.slug) || slugify(title) } : {})
  };
};

const uniqueSlug = async (base, excludeId) => {
  const stem = base || `article-${Date.now()}`;
  let candidate = stem;
  let suffix = 1;
  while (await Blog.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    candidate = `${stem}-${suffix++}`;
  }
  return candidate;
};

exports.createBlog = async (req, res) => {
  try {
    const data = normalizePayload(req.body);
    if (req.file?.path) data.image = req.file.path;
    data.slug = await uniqueSlug(data.slug || slugify(data.title));
    if (!data.metaTitle) data.metaTitle = `${data.title} | Student Education Portal`;
    if (!data.metaDescription) data.metaDescription = data.excerpt || sanitizeHtml(data.content, { allowedTags: [], allowedAttributes: {} }).slice(0, 155);
    if (!data.socialTitle) data.socialTitle = data.metaTitle;
    if (!data.socialDescription) data.socialDescription = data.metaDescription;
    if (!data.socialImage) data.socialImage = data.image;
    const blog = await Blog.create(data);
    res.status(201).json({ success: true, blog });
  } catch (error) {
    const invalid = error.message?.startsWith('A title') || error.message?.startsWith('Add article');
    res.status(invalid ? 400 : 500).json({ success: false, message: invalid ? error.message : 'Failed to create blog' });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 6, 100));
    const filter = { ...publishedFilter };
    if (req.query.category && req.query.category !== 'all') filter.category = String(req.query.category);
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$and = [publishedFilter, { $or: [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }] }];
      delete filter.$or;
    }
    const total = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-comments');
    res.json({ success: true, blogs: blogs.map(serializeCard), currentPage: page, totalPages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to load blogs' }); }
};

exports.getAdminBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ updatedAt: -1, createdAt: -1 }).limit(200).select('title slug category status featured updatedAt createdAt publishedAt');
    res.json({ success: true, blogs });
  } catch { res.status(500).json({ success: false, message: 'Failed to load blog drafts' }); }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = (await Blog.distinct('category', publishedFilter)).filter(Boolean).sort();
    res.json({ success: true, categories });
  } catch { res.status(500).json({ success: false, message: 'Failed to load categories' }); }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate({ slug: req.params.slug, ...publishedFilter }, { $inc: { views: 1 } }, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, blog: serializePublicBlog(blog) });
  } catch { res.status(500).json({ success: false, message: 'Failed to load blog' }); }
};

exports.getFeaturedBlog = async (req, res) => {
  try {
    const featuredBlog = await Blog.findOne({ featured: true, ...publishedFilter }).sort({ publishedAt: -1, createdAt: -1 });
    const blog = featuredBlog || await Blog.findOne(publishedFilter).sort({ publishedAt: -1, createdAt: -1 });
    res.json({ success: true, blog: serializeCard(blog) });
  }
  catch { res.status(500).json({ success: false, message: 'Failed to load featured blog' }); }
};

exports.getRelatedBlogs = async (req, res) => {
  try {
    const current = await Blog.findOne({ slug: req.params.slug, ...publishedFilter });
    if (!current) return res.status(404).json({ success: false, message: 'Blog not found' });
    const blogs = await Blog.find({ category: current.category, slug: { $ne: current.slug }, ...publishedFilter }).sort({ publishedAt: -1, createdAt: -1 }).limit(3);
    res.json({ success: true, blogs: blogs.map(serializeCard) });
  } catch { res.status(500).json({ success: false, message: 'Failed to load related blogs' }); }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    const data = normalizePayload({ ...blog.toObject(), ...req.body });
    if (req.file?.path) data.image = req.file.path;
    data.slug = await uniqueSlug(data.slug || blog.slug || slugify(data.title), blog._id);
    if (!data.metaTitle) data.metaTitle = `${data.title} | Student Education Portal`;
    if (!data.metaDescription) data.metaDescription = data.excerpt || sanitizeHtml(data.content, { allowedTags: [], allowedAttributes: {} }).slice(0, 155);
    if (!data.socialTitle) data.socialTitle = data.metaTitle;
    if (!data.socialDescription) data.socialDescription = data.metaDescription;
    if (!data.socialImage) data.socialImage = data.image;
    Object.assign(blog, data);
    await blog.save();
    res.json({ success: true, blog });
  } catch (error) {
    const invalid = error.message?.startsWith('A title') || error.message?.startsWith('Add article');
    res.status(invalid ? 400 : 500).json({ success: false, message: invalid ? error.message : 'Failed to update blog' });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed to delete blog' }); }
};

exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate({ _id: req.params.id, ...publishedFilter }, { $inc: { likes: 1 } }, { new: true });
    if (!blog) return res.status(404).json({ success: false });
    res.json({ success: true, likes: blog.likes });
  } catch { res.status(500).json({ success: false }); }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false });
    res.json({ success: true, blog: serializePublicBlog(blog) });
  } catch { res.status(400).json({ success: false, message: 'Invalid blog ID' }); }
};

exports.addComment = async (req, res) => {
  try {
    const name = cleanText(req.body.name, 80);
    const message = cleanText(req.body.message, 1000);
    if (!name || !message) return res.status(400).json({ success: false, message: 'Name and message required' });
    const blog = await Blog.findOne({ _id: req.params.id, ...publishedFilter });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    blog.comments.push({ name, message, approved: false });
    await blog.save();
    res.json({ success: true, message: 'Thanks! Your comment will appear after approval.', comments: approvedOnly(blog.comments) });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

exports.getPendingComments = async (req, res) => {
  try {
    const blogs = await Blog.find({ 'comments.approved': false }).select('title slug comments');
    const comments = blogs.flatMap((blog) => blog.comments.filter((c) => c.approved === false)
      .map((c) => ({ _id: c._id, blogId: blog._id, blogTitle: blog.title, name: c.name, message: c.message, createdAt: c.createdAt })));
    res.json({ success: true, comments });
  } catch { res.status(500).json({ success: false, message: 'Failed to load comments' }); }
};

exports.approveComment = async (req, res) => {
  try {
    const result = await Blog.updateOne({ _id: req.params.blogId, 'comments._id': req.params.commentId }, { $set: { 'comments.$.approved': true } });
    if (!result.matchedCount) return res.status(404).json({ success: false, message: 'Comment not found' });
    res.json({ success: true });
  } catch { res.status(400).json({ success: false, message: 'Invalid comment ID' }); }
};

exports.deleteComment = async (req, res) => {
  try {
    const result = await Blog.updateOne({ _id: req.params.blogId }, { $pull: { comments: { _id: req.params.commentId } } });
    if (!result.modifiedCount) return res.status(404).json({ success: false, message: 'Comment not found' });
    res.json({ success: true });
  } catch { res.status(400).json({ success: false, message: 'Invalid comment ID' }); }
};

const SITE = 'https://exampaper.khca.info';
exports.shareBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: String(req.params.slug), ...publishedFilter }).select('-content -comments');
    if (!blog) return res.redirect(302, SITE + '/blogs.html');
    const target = SITE + '/blog.html?slug=' + encodeURIComponent(blog.slug);
    const title = blog.socialTitle || blog.metaTitle || blog.title;
    const description = blog.socialDescription || blog.metaDescription || blog.excerpt || '';
    const image = blog.socialImage || blog.image || '';
    // og:url must be this page: Facebook re-scrapes og:url, and blog.html has no server-side tags.
    const self = 'https://' + req.get('host') + '/share/' + encodeURIComponent(blog.slug);
    const e = escapeHtml;
    res.set('Cache-Control', 'public, max-age=600').type('html').send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<meta property="og:type" content="article"><meta property="og:url" content="${e(self)}">
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}">
${image ? `<meta property="og:image" content="${e(image)}"><meta name="twitter:image" content="${e(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}">
<link rel="canonical" href="${e(target)}"><meta http-equiv="refresh" content="0;url=${e(target)}">
</head><body><p><a href="${e(target)}">${e(title)}</a></p></body></html>`);
  } catch { res.status(500).send('Error'); }
};

// Exported for tests.
exports.sanitizeArticle = sanitizeArticle;
exports.escapeHtml = escapeHtml;
