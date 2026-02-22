const Blog = require('../models/Blog');

// Create Blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');

    const blog = new Blog({
      title,
      slug,
      content,
      category
    });

    await blog.save();

    res.json({ success: true, blog });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Blogs
exports.getBlogs = async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json({ success: true, blogs });
};

// Get Single Blog
exports.getBlogBySlug = async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug });
  res.json({ success: true, blog });
};