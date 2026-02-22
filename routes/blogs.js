const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { adminAuth } = require('../middleware/auth');


// =====================================
// PUBLIC STATIC ROUTES (SPECIFIC FIRST)
// =====================================

router.get('/featured', blogController.getFeaturedBlog);
router.get('/related/:slug', blogController.getRelatedBlogs);
router.post('/like/:id', blogController.likeBlog);


// =====================================
// ADMIN ROUTES
// =====================================

// Create blog
router.post('/', adminAuth, blogController.createBlog);

// Get blog by ID (for admin edit)
router.get('/id/:id', adminAuth, blogController.getBlogById);

// Update blog
router.put('/:id', adminAuth, blogController.updateBlog);

// Delete blog
router.delete('/:id', adminAuth, blogController.deleteBlog);


// =====================================
// PUBLIC LIST ROUTE
// =====================================

router.get('/', blogController.getBlogs);


// =====================================
// DYNAMIC SLUG (ALWAYS LAST)
// =====================================

router.get('/:slug', blogController.getBlogBySlug);


module.exports = router;