const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { adminAuth } = require('../middleware/auth');

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

/* =====================================
   CLOUDINARY CONFIG
===================================== */
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

/* =====================================
   MULTER STORAGE
===================================== */
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blogs',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
            const error = new Error('Only JPG, PNG, or WebP images are supported.');
            error.code = 'INVALID_BLOG_IMAGE';
            return cb(error);
        }
        cb(null, true);
    }
});
const uploadBlogImage = (req, res, next) => upload.single('image')(req, res, (error) => {
    if (error?.code === 'INVALID_BLOG_IMAGE') {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
});

// Publish/update must show at once: browsers and proxies revalidate every blog GET.
router.use((req, res, next) => { if (req.method === 'GET') res.set('Cache-Control', 'no-cache'); next(); });

/* =====================================
   PUBLIC ROUTES (SPECIFIC FIRST)
===================================== */
router.get('/featured', blogController.getFeaturedBlog);
router.get('/related/:slug', blogController.getRelatedBlogs);
router.post('/like/:id', blogController.likeBlog);
router.post('/comment/:id', blogController.addComment);
router.get('/categories', blogController.getCategories);
router.get('/admin/all', adminAuth, blogController.getAdminBlogs);
router.get('/admin/comments', adminAuth, blogController.getPendingComments);
router.put('/admin/comments/:blogId/:commentId/approve', adminAuth, blogController.approveComment);
router.delete('/admin/comments/:blogId/:commentId', adminAuth, blogController.deleteComment);
router.get('/admin/revisions/:blogId', adminAuth, blogController.getRevisions);
router.post('/admin/revisions/:revisionId/restore', adminAuth, blogController.restoreRevision);

// Media library: images already uploaded to the Cloudinary 'blogs' folder.
router.get('/admin/media', adminAuth, async (req, res) => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload', resource_type: 'image', prefix: 'blogs/', max_results: 30,
            ...(req.query.cursor ? { next_cursor: String(req.query.cursor) } : {})
        });
        res.json({
            success: true,
            images: result.resources.map((r) => ({ url: r.secure_url, publicId: r.public_id, width: r.width, height: r.height })),
            nextCursor: result.next_cursor || null
        });
    } catch (error) {
        console.error('Media library error:', error.message || error.error?.message);
        res.status(500).json({ success: false, message: 'Could not load the media library' });
    }
});

/* =====================================
   ADMIN ROUTES
===================================== */
router.post(
    '/upload-image',
    adminAuth,
    uploadBlogImage,
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: "No file uploaded" 
            });
        }

        res.json({
            success: true,
            url: req.file.path
        });
    }
);

router.post(
    '/',
    adminAuth,
    uploadBlogImage,
    blogController.createBlog
);

router.get('/id/:id', adminAuth, blogController.getBlogById);
router.put('/:id', adminAuth, uploadBlogImage, blogController.updateBlog);
router.delete('/:id', adminAuth, blogController.deleteBlog);

/* =====================================
   PUBLIC LIST
===================================== */
router.get('/', blogController.getBlogs);

/* =====================================
   DYNAMIC SLUG (ALWAYS LAST)
===================================== */
router.get('/:slug', blogController.getBlogBySlug);

module.exports = router;
