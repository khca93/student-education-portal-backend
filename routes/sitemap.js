const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

const baseUrl = "https://exampaper.khca.info";

router.get('/', async (req, res) => {
  try {

    const blogs = await Blog.find().sort({ createdAt: -1 });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Homepage
    xml += `
      <url>
        <loc>${baseUrl}</loc>
        <priority>1.0</priority>
      </url>
    `;

    // Blog List Page
    xml += `
      <url>
        <loc>${baseUrl}/blogs.html</loc>
        <priority>0.8</priority>
      </url>
    `;

    blogs.forEach(blog => {
      xml += `
        <url>
          <loc>${baseUrl}/blog.html?slug=${blog.slug}</loc>
          <lastmod>${blog.updatedAt.toISOString()}</lastmod>
          <priority>0.7</priority>
        </url>
      `;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (error) {
    res.status(500).send("Error generating sitemap");
  }
});

module.exports = router;