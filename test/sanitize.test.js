const assert = require('node:assert');
const { sanitizeArticle, escapeHtml } = require('../controllers/blogController');

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

console.log('sanitize tests passed');
