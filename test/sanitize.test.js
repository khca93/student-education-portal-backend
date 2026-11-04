const assert = require('node:assert');
const sift = require('sift'); // mongoose's own query matcher, used here to run filters in memory
const { sanitizeArticle, escapeHtml, publishedFilter } = require('../controllers/blogController');

const out = sanitizeArticle(
  '<p>Hi</p><script>alert(1)</script>' +
  '<img src="https://x.com/a.png" onerror="alert(2)">' +
  '<iframe src="https://www.youtube.com/embed/abc123"></iframe>' +
  '<iframe src="https://evil.example.com/page"></iframe>'
);

assert.ok(!/<script/i.test(out), 'script tag must be removed');
assert.ok(!/alert\(1\)/.test(out), 'script body must be removed');
assert.ok(!/onerror/i.test(out), 'onerror must be removed');
assert.ok(out.includes('<img src="https://x.com/a.png"'), 'image itself stays');
assert.ok(out.includes('src="https://www.youtube.com/embed/abc123"'), 'YouTube iframe stays');
assert.ok(!out.includes('evil.example.com'), 'other iframe is removed');

assert.strictEqual(escapeHtml('"><script>&\''), '&quot;&gt;&lt;script&gt;&amp;&#39;');

// Editor blocks: note/tip/warning, FAQ, button, table of contents keep their classes and toc ids.
const blocks = sanitizeArticle(
  '<div class="blog-callout blog-callout-warning"><p><strong>Warning:</strong> x</p></div>' +
  '<div class="blog-faq"><div class="blog-faq-item"><p class="blog-faq-q"><strong>Q?</strong></p><p>A</p></div></div>' +
  '<p><a class="blog-btn" href="https://example.com">Go</a></p>' +
  '<div class="blog-toc"><ul><li><a href="#toc-intro">Intro</a></li></ul></div>' +
  '<h2 id="toc-intro">Intro</h2><h3 id="main-header">Bad id</h3>'
);
['blog-callout blog-callout-warning', 'blog-faq', 'blog-faq-item', 'blog-faq-q', 'blog-btn', 'blog-toc'].forEach((cls) =>
  assert.ok(blocks.includes(`class="${cls}"`), `class ${cls} stays`));
assert.ok(blocks.includes('<h2 id="toc-intro">'), 'toc heading id stays');
assert.ok(blocks.includes('href="#toc-intro"'), 'toc link stays');
assert.ok(!blocks.includes('main-header'), 'non-toc heading id is removed');

// Scheduled publish: future publishedAt is hidden until its time.
const isPublic = sift(publishedFilter());
const day = 24 * 60 * 60 * 1000;
assert.ok(isPublic({ status: 'published', publishedAt: new Date(Date.now() - day) }), 'past post is public');
assert.ok(isPublic({ status: 'published', publishedAt: null }), 'post without date is public');
assert.ok(isPublic({}), 'legacy post without status is public');
assert.ok(!isPublic({ status: 'published', publishedAt: new Date(Date.now() + day) }), 'scheduled post is hidden');
assert.ok(!isPublic({ status: 'draft', publishedAt: null }), 'draft is hidden');

console.log('sanitize tests passed');
