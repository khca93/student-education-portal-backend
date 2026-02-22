const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protectAdmin } = require('../middleware/auth');

// Admin Create Blog
router.post('/', protectAdmin, blogController.createBlog);

// Public Routes
router.get('/', blogController.getBlogs);
router.get('/:slug', blogController.getBlogBySlug);

module.exports = router;