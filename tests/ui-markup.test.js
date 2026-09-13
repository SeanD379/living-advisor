const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

test('uses the Apple blue browser theme color', () => {
  assert.match(html, /<meta name="theme-color" content="#007AFF"\s*\/>/);
});

test('renders an accessible primary navigation shell', () => {
  const nav = html.match(/<nav class="nav" aria-label="主导航">([\s\S]*?)<\/nav>/);

  assert.ok(nav, 'primary navigation should have the expected class and aria label');

  const pages = [
    ['home', '首页'],
    ['expenses', '费用'],
    ['life', '生活'],
    ['profile', '我的'],
  ];

  for (const [page, label] of pages) {
    const button = new RegExp(
      `<button(?=[^>]*\\bdata-page="${page}")[^>]*>\\s*<svg\\b[^>]*\\baria-hidden="true"[^>]*>[\\s\\S]*?<\\/svg>\\s*${label}\\s*<\\/button>`,
    );
    assert.match(nav[1], button, `${label} should have an inline decorative SVG before its label`);
  }

  assert.doesNotMatch(nav[1], /<i>[⌂¥☼☺]<\/i>/, 'legacy icon glyphs should not remain');
});
