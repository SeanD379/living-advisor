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

  assert.match(nav[1], /<button(?=[^>]*\bdata-page="home")(?=[^>]*\bclass="active")[^>]*>/, 'home should remain active');

  const svgs = nav[1].match(/<svg\b[^>]*>/g) || [];
  assert.equal(svgs.length, pages.length, 'each navigation item should have one SVG');
  for (const svg of svgs) {
    assert.match(svg, /\bwidth="24"/, 'navigation SVGs should be 24px wide');
    assert.match(svg, /\bheight="24"/, 'navigation SVGs should be 24px high');
    assert.match(svg, /\bfill="none"/, 'navigation SVGs should be outline icons');
    assert.match(svg, /\bstroke="currentColor"/, 'navigation SVGs should inherit their color');
    assert.match(svg, /\bstroke-width="1\.8"/, 'navigation SVGs should use the shared stroke weight');
    assert.doesNotMatch(svg, /\b(?:src|href)=/, 'navigation SVGs should not load external assets');
  }

  assert.doesNotMatch(nav[1], /<i>[⌂¥☼☺]<\/i>/, 'legacy icon glyphs should not remain');
});

test('keeps the app mount points and local scripts intact', () => {
  assert.match(html, /<section id="app"><\/section>/);
  assert.match(html, /<div id="modal-root"><\/div>/);

  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((match) => match[1]);
  assert.deepEqual(scripts, ['/home-state.js', '/app.js']);
  assert.equal((html.match(/<script\b/g) || []).length, 2, 'only the two local application scripts should remain');
  assert.doesNotMatch(html, /<(?:img|image|link|script)\b[^>]*(?:src|href)="[^"]+\.svg(?:[?#][^"]*)?"/i, 'icons should not load external SVG assets');
});
