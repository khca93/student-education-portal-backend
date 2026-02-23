const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { adminAuth } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

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
router.post(
    '/',
    adminAuth,
    upload.single('image'),
    blogController.createBlog
);

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

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blogs',
        allowed_formats: ['jpg', 'png', 'jpeg']
    }
});

const upload = multer({ storage });
module.exports = router;