const Blog = require('../models/Blog');

// ================= CREATE BLOG =================
exports.createBlog = async (req, res) => {
  try {

    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and Content are required"
      });
    }

    // ✅ Get image from Cloudinary (if uploaded)
    const image = req.file ? req.file.path : '';

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');

    // Duplicate check
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res.status(400).json({
        success: false,
        message: "Blog with same title already exists"
      });
    }

    const metaTitle = title + " | Student Education Portal";
    const plainText = content.replace(/<[^>]*>/g, '');
    const metaDescription = plainText.substring(0, 150);

    const blog = await Blog.create({
      title,
      slug,
      content,
      category,
      image,
      metaTitle,
      metaDescription
    });

    res.json({ success: true, blog });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= GET ALL BLOGS (WITH PAGINATION) =================
exports.getBlogs = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const category = req.query.category;
    const search = req.query.search;

    let filter = {};

    // Category filter
    if (category && category !== "all") {
      filter.category = category;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } }
      ];
    }

    const total = await Blog.countDocuments(filter);

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      blogs,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET BLOG BY SLUG =================
// ================= GET BLOG BY SLUG =================
exports.getBlogBySlug = async (req, res) => {
  try {

    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    res.json({ success: true, blog });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET FEATURED BLOG (LATEST) =================
exports.getFeaturedBlog = async (req, res) => {
  try {

    const blog = await Blog.findOne()
      .sort({ createdAt: -1 });

    if (!blog) {
      return res.json({ success: true, blog: null });
    }

    res.json({ success: true, blog });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ================= GET RELATED BLOGS =================
exports.getRelatedBlogs = async (req, res) => {
  try {

    const slug = req.params.slug;

    const currentBlog = await Blog.findOne({ slug });

    if (!currentBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    const related = await Blog.find({
      category: currentBlog.category,
      slug: { $ne: slug }
    })
    .sort({ createdAt: -1 })
    .limit(3);

    res.json({
      success: true,
      blogs: related
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE BLOG
exports.updateBlog = async (req, res) => {
  try {

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.json({ success: true, blog });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE BLOG
exports.deleteBlog = async (req, res) => {
  try {

    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.likeBlog = async (req, res) => {
  try {

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    res.json({ success: true, likes: blog.likes });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.getBlogById = async (req, res) => {
  try {

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false });
    }

    res.json({ success: true, blog });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};
