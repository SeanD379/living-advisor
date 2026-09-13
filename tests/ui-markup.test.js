const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function attribute(attributes, name) {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`).exec(attributes);
  return match?.[2];
}

function elements(markup, tag) {
  return [...markup.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi'))]
    .map((match) => ({ attributes: match[1], content: match[2] }));
}

function openingTags(markup, tag) {
  return [...markup.matchAll(new RegExp(`<${tag}\\b([^>]*)\\/?\\s*>`, 'gi'))]
    .map((match) => match[1]);
}

test('uses the Apple blue browser theme color', () => {
  assert.ok(openingTags(html, 'meta').some((attributes) =>
    attribute(attributes, 'name') === 'theme-color' && attribute(attributes, 'content') === '#007AFF',
  ));
});

test('renders an accessible primary navigation shell', () => {
  const nav = elements(html, 'nav').find((element) =>
    attribute(element.attributes, 'class') === 'nav' && attribute(element.attributes, 'aria-label') === '主导航',
  );

  assert.ok(nav, 'primary navigation should have the expected class and aria label');

  const pages = [
    ['home', '首页'],
    ['expenses', '费用'],
    ['life', '生活'],
    ['profile', '我的'],
  ];

  const buttons = elements(nav.content, 'button');
  assert.equal(buttons.length, pages.length, 'navigation should have exactly four page controls');

  for (const [page, label] of pages) {
    const button = buttons.find((element) => attribute(element.attributes, 'data-page') === page);
    assert.ok(button, `${label} should retain its page control`);
    assert.equal(button.content.replace(/<[^>]+>/g, '').trim(), label, `${page} should retain its visible label`);

    const svg = elements(button.content, 'svg')[0];
    assert.ok(svg, `${label} should have an inline decorative SVG before its label`);
    assert.equal(attribute(svg.attributes, 'aria-hidden'), 'true');
    assert.equal(attribute(svg.attributes, 'width'), '24');
    assert.equal(attribute(svg.attributes, 'height'), '24');
    assert.equal(attribute(svg.attributes, 'fill'), 'none');
    assert.equal(attribute(svg.attributes, 'stroke'), 'currentColor');
    assert.equal(attribute(svg.attributes, 'stroke-width'), '1.8');
    assert.equal(attribute(svg.attributes, 'src'), undefined, 'navigation SVGs should not load external assets');
    assert.equal(attribute(svg.attributes, 'href'), undefined, 'navigation SVGs should not load external assets');
  }

  const home = buttons.find((element) => attribute(element.attributes, 'data-page') === 'home');
  assert.match(attribute(home.attributes, 'class'), /\bactive\b/, 'home should remain active');
  assert.equal(attribute(home.attributes, 'aria-current'), 'page', 'home should announce the current page initially');
  assert.doesNotMatch(nav.content, /<i>[⌂¥☼☺]<\/i>/, 'legacy icon glyphs should not remain');
});

test('keeps the app mount points and local scripts intact', () => {
  const tags = openingTags(html, '[a-z][\\w-]*');
  assert.ok(tags.some((attributes) => attribute(attributes, 'id') === 'app'));
  assert.ok(tags.some((attributes) => attribute(attributes, 'id') === 'modal-root'));

  const scripts = elements(html, 'script').map((element) => attribute(element.attributes, 'src'));
  assert.deepEqual(scripts, ['/home-state.js', '/app.js']);
  const svgAsset = ['img', 'image', 'link', 'script', 'use'].flatMap((tag) => openingTags(html, tag))
    .map((attributes) => attribute(attributes, 'src') || attribute(attributes, 'href'))
    .find((source) => /\.svg(?:[?#].*)?$/i.test(source || ''));
  assert.equal(svgAsset, undefined, 'icons should not load external SVG assets');
});

test('synchronizes the current-page announcement when navigation changes', () => {
  assert.match(appSource, /function go\(next\)[\s\S]*?b\.setAttribute\(['"]aria-current['"],\s*['"]page['"]\)[\s\S]*?b\.removeAttribute\(['"]aria-current['"]\)/);
});
