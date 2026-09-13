const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const styleSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');

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

test('centers the home title and dropdown arrow as one accessible group', () => {
  const topbar = elements(html, 'header').find((element) =>
    attribute(element.attributes, 'class') === 'topbar compact',
  );

  assert.ok(topbar, 'compact topbar should remain the shared home title shell');
  assert.match(topbar.content, /<div class="topbar-title(?: house-title-frame)?"[^>]*><h1>橘子洲 3A<\/h1><span aria-hidden="true">⌄<\/span><\/div>/);
  assert.match(styleSource, /\.topbar\.compact\s*\{[^}]*justify-content:\s*center/i);
  assert.match(styleSource, /\.topbar-title\s*\{[^}]*display:\s*flex/i);
  assert.match(styleSource, /\.topbar-title\s*\{[^}]*align-items:\s*center/i);
});

test('defines the blue-white visual tokens without the legacy orange gradient', () => {
  for (const token of [
    '--color-page: #F5F7FA',
    '--color-surface: #FFFFFF',
    '--color-text: #1D1D1F',
    '--color-primary: #007AFF',
  ]) {
    assert.ok(styleSource.includes(token), `style.css should define ${token}`);
  }

  assert.doesNotMatch(styleSource, /linear-gradient\(115deg\s*,\s*#f87e4a\s*,\s*#f8a363\s*\)/i);
});

test('anchors the full home floor plan and its hotspots to one bottom-aligned canvas', () => {
  const homeSource = appSource.slice(appSource.indexOf('function renderHome()'), appSource.indexOf('function renderExpenses()'));

  assert.match(styleSource, /\.nav button\s*\{[^}]*min-height:\s*44px/i);
  assert.match(styleSource, /\.nav svg\s*\{[^}]*width:/i);
  assert.match(styleSource, /\.nav span\s*\{[^}]*font-size:/i);
  assert.match(styleSource, /:focus-visible\s*\{/i);
  assert.match(styleSource, /\.primary\s*\{/i);
  assert.match(styleSource, /\.phone-shell\.home-only\s*\{[^}]*display:\s*flex/i);
  assert.match(styleSource, /\.phone-shell\.home-only\s*\{[^}]*flex-direction:\s*column/i);
  assert.match(styleSource, /\.phone-shell\.home-only\s*\{[^}]*min-height:\s*100dvh/i);
  assert.match(styleSource, /\.phone-shell\.home-only\s*\{[^}]*padding:\s*0\s+0\s+80px/i);
  assert.match(styleSource, /\.phone-shell\.home-only\s+#app\s*\{[^}]*flex:\s*1/i);
  assert.match(styleSource, /\.phone-shell\.home-only\s+#app\s*\{[^}]*min-height:\s*0/i);
  assert.match(styleSource, /\.home-model\s*\{[^}]*flex:\s*1/i);
  assert.match(styleSource, /\.home-model\s*\{[^}]*min-height:\s*0/i);
  assert.match(styleSource, /\.home-model\s*\{[^}]*display:\s*flex/i);
  assert.match(styleSource, /\.home-model\s*\{[^}]*flex-direction:\s*column/i);
  assert.match(styleSource, /\.home-model\s*\{[^}]*align-items:\s*center/i);
  assert.match(styleSource, /\.home-model\s*\{[^}]*justify-content:\s*flex-end/i);
  assert.match(styleSource, /\.home-model\s*\{[^}]*background:\s*var\(--color-page\)/i);
  assert.match(styleSource, /\.home-model-canvas\s*\{[^}]*position:\s*relative/i);
  assert.match(styleSource, /\.home-model-canvas\s*\{[^}]*width:\s*100%/i);
  assert.match(styleSource, /\.home-model-canvas\s*\{[^}]*aspect-ratio:\s*2\s*\/\s*3/i);
  assert.match(styleSource, /\.home-model-canvas\s*\{[^}]*flex:\s*0\s+0\s+auto/i);
  assert.match(styleSource, /\.home-model-canvas img\s*\{[^}]*display:\s*block/i);
  assert.match(styleSource, /\.home-model-canvas img\s*\{[^}]*width:\s*100%/i);
  assert.match(styleSource, /\.home-model-canvas img\s*\{[^}]*height:\s*100%/i);
  assert.match(styleSource, /\.home-model-canvas img\s*\{[^}]*object-fit:\s*contain/i);
  assert.match(styleSource, /\.home-model-canvas img\s*\{[^}]*object-position:\s*center\s+bottom/i);
  assert.match(styleSource, /\.home-model-canvas img\s*\{[^}]*mix-blend-mode:\s*multiply/i);
  assert.doesNotMatch(styleSource, /\.home-model\s*\{[^}]*aspect-ratio:/i);
  assert.doesNotMatch(styleSource, /\.home-model-canvas img\s*\{[^}]*object-fit:\s*cover/i);
  assert.match(homeSource, /<section class="home-model"[^>]*><div class="home-model-canvas"><img[^>]*>\$\{residentButtons\}<button class="model-hotspot kitchen-hotspot[\s\S]*?<button class="model-hotspot management-hotspot[\s\S]*?<button class="model-hotspot living-hotspot[\s\S]*?<\/button><\/div><\/section>/);
  assert.doesNotMatch(homeSource, /room-hotspot|小陈的房间状态/);
  assert.match(styleSource, /\.modal\s*\{/i);
  assert.match(styleSource, /#toast\s*\{/i);
  assert.match(styleSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
});

test('keeps surfaces, local semantic colors, and motion details in the blue-white system', () => {
  assert.match(styleSource, /\.modal\s*\{[^}]*animation:/i);
  assert.match(styleSource, /#toast\s*\{[^}]*transition:/i);
  for (const selector of ['.expense', '.life-card', '.profile-card', '.settings']) {
    assert.ok(styleSource.includes(selector), `${selector} should remain a white-surface component`);
  }
  assert.match(styleSource, /background:\s*var\(--color-surface\)/i);
  assert.match(styleSource, /input,\s*select\s*\{[^}]*background:\s*var\(--color-surface\)/i);

  for (const selector of ['.pay', '.clean', '.supply-pic', '.rule', '.stock']) {
    assert.match(styleSource, new RegExp(`\\${selector}\\s*\\{`, 'i'));
  }
  for (const selector of ['body', '\\.phone-shell', '\\.summary']) {
    assert.doesNotMatch(styleSource, new RegExp(`${selector}\\s*\\{[^}]*var\\(--color-(?:expense|success|supply|rule|danger)`, 'i'));
  }

  assert.match(styleSource, /\.home-model\s*\{[^}]*margin:\s*0/i);
  assert.doesNotMatch(styleSource, /#(?:000|111|0A0A0A|6C00FF|7B61FF)\b/i);
});

test('uses contrast-safe primary text, actions, and focus styles', () => {
  assert.ok(styleSource.includes('--color-primary: #007AFF'));
  assert.ok(styleSource.includes('--color-primary-text: #005FCC'));
  assert.ok(styleSource.includes('--color-focus: #005FCC'));
  assert.ok(styleSource.includes('--color-primary-action: #0066CC'));
  assert.match(styleSource, /:focus-visible\s*\{[^}]*solid\s+var\(--color-focus\)/i);
  assert.match(styleSource, /\.nav \.active\s*\{[^}]*color:\s*var\(--color-primary-text\)/i);
  assert.match(styleSource, /\.soft-btn\s*\{[^}]*color:\s*var\(--color-primary-text\)/i);
  assert.match(styleSource, /\.primary\s*\{[^}]*background:\s*var\(--color-primary-action\)/i);
});

test('uses opaque settlement copy and dark semantic text for status labels', () => {
  assert.doesNotMatch(styleSource, /\.settlement p,\s*\.settlement small\s*\{[^}]*opacity:/i);
  for (const token of [
    '--color-expense-text: #9A5A00',
    '--color-success-text: #147534',
    '--color-danger-text: #B42318',
  ]) {
    assert.ok(styleSource.includes(token), `style.css should define ${token}`);
  }
  assert.match(styleSource, /\.expense-bottom span:last-child\s*\{[^}]*color:\s*var\(--color-expense-text\)/i);
  assert.match(styleSource, /\.done\s*\{[^}]*color:\s*var\(--color-success-text\)/i);
  assert.match(styleSource, /\.share-list small\s*\{[^}]*color:\s*var\(--color-success-text\)/i);
  assert.match(styleSource, /\.reset\s*\{[^}]*color:\s*var\(--color-danger-text\)/i);
  assert.match(styleSource, /\.section-head em\s*\{[^}]*background:\s*var\(--color-danger-action\)/i);
});

test('uses AA-safe foregrounds on pale controls and status surfaces', () => {
  assert.ok(styleSource.includes('--color-supply-text: #765600'));
  assert.match(styleSource, /\.avatar,\s*\.round-add\s*\{[^}]*color:\s*var\(--color-primary-text\)/i);
  assert.match(styleSource, /\.faces \.me\s*\{[^}]*color:\s*var\(--color-success-text\)/i);
  assert.match(styleSource, /\.stock\s*\{[^}]*color:\s*var\(--color-success-text\)/i);
  assert.match(styleSource, /\.supply-pic\s*\{[^}]*color:\s*var\(--color-supply-text\)/i);
});

test('only blocks gradients in page-level surfaces', () => {
  for (const selector of ['body', '\\.phone-shell', '\\.summary']) {
    assert.doesNotMatch(styleSource, new RegExp(`${selector}\\s*\\{[^}]*linear-gradient`, 'i'));
  }
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

test('renders local semantic class hooks without changing home hotspot actions', () => {
  for (const className of ['expense-summary', 'expense-status', 'life-status', 'profile-avatar']) {
    assert.match(appSource, new RegExp(`class=["'][^"']*\\b${className}\\b`));
  }

  for (const [className, action] of [
    ['hotspot-kitchen', 'show-supplies'],
    ['hotspot-management', 'open-pending'],
  ]) {
    assert.match(appSource, new RegExp(`class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*data-action=["']${action}["']`));
  }
  assert.match(html, /class="home-status-link"[^>]*data-action="show-member-status"/);
  assert.match(appSource, /class=["'][^"']*\bhotspot-living\b[^"']*["'][^>]*data-page=["']life["']/);
  for (const sourceContract of ['function go(next)', 'function actionButtons()', 'const actions = {', 'function purchase(x)']) {
    assert.ok(appSource.includes(sourceContract), `app.js should retain ${sourceContract}`);
  }
});

test('renders the full supply list only in the public-supplies tab', () => {
  const renderLife = appSource.match(/function renderLife\(\) \{[\s\S]*?\n\}/)?.[0];

  assert.ok(renderLife, 'app.js should retain renderLife');
  assert.match(renderLife, /const supplies = state\.supplies\.map\([\s\S]*?\)\.join\(''\);/);
  assert.match(renderLife, /lifeTab === 'supplies'/);
  assert.doesNotMatch(renderLife, /supply-preview/);
});

test('renders active resident avatar controls with privacy-safe labels', () => {
  const renderHome = appSource.match(/function renderHome\(\) \{[\s\S]*?\n\}/)?.[0];

  assert.ok(renderHome, 'app.js should retain renderHome');
  assert.match(appSource, /household:\s*\{[\s\S]*?members:/);
  assert.equal((appSource.match(/status: 'active'/g) || []).length, 3, 'initial household should have three active residents');
  assert.match(renderHome, /activeResidents\(state\)\.map\(resident =>[\s\S]*resident-avatar/);
  assert.equal((renderHome.match(/data-action="show-resident"/g) || []).length, 1);
  assert.match(renderHome, /const pendingCount = \[[\s\S]*?\]\.filter\(Boolean\)\.length/);
  assert.match(renderHome, /data-status="\$\{residentPending \? 'pending' : 'settled'\}"/);
  assert.match(html, /class="home-status-link"[^>]*data-action="show-member-status"/);
  assert.match(html, /class="home-status-link"[^>]*aria-label="查看我的待处理事项"/);
  assert.match(appSource, /adminId: '小陈'/);

  const residentMarkup = renderHome.slice(renderHome.indexOf('resident-avatar'));
  assert.doesNotMatch(residentMarkup, /手机号|电话|地址|支付账号|银行卡|身份证/);
  assert.match(appSource, /['"]show-resident['"]\s*\([^)]*\)/);
  assert.match(styleSource, /\.resident-avatar\s*\{[^}]*min-width:\s*44px/i);
  assert.match(styleSource, /\.resident-avatar:focus-visible\s*\{/i);
  assert.match(styleSource, /\.resident-avatar:active\s*\{/i);
  assert.match(styleSource, /\.resident-avatar span\s*\{[^}]*position:\s*static/i);
  assert.match(styleSource, /\.home-status-link:active\s*\{/i);
  assert.match(styleSource, /\.resident-avatar-top-left\s*\{[^}]*top:\s*29%/i);
  assert.match(styleSource, /\.resident-avatar-middle-right\s*\{[^}]*top:\s*46%/i);
  assert.match(styleSource, /\.resident-avatar-bottom-left\s*\{[^}]*top:\s*63%/i);
});

test('defines floor-plan coordinates for every selectable bedroom', () => {
  for (const position of ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']) {
    assert.match(styleSource, new RegExp(`\\.resident-avatar-${position}\\s*\\{[^}]*top:`, 'i'));
  }
});

test('uses a decorated house title and removes the redundant profile intro block', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
  assert.match(html, /class="topbar-title house-title-frame"/);
  assert.match(css, /\.house-title-frame\s*\{/);
  assert.match(css, /\.house-title-frame::before/);
  assert.doesNotMatch(app, /<p class="eyebrow">我的合租生活<\/p>/);
});

test('keeps the house title and roommate rules editable', () => {
  assert.match(html, /data-action="edit-house"/);
  assert.match(appSource, /'edit-house'\(\)[\s\S]*?id="house-form"/);
  assert.match(appSource, /'show-rules'\(\)[\s\S]*?id="rule-form"[\s\S]*?<textarea/);
  assert.match(appSource, /x\.version\s*=\s*form\.get\('version'\)/);
});

test('supports accessible modal dismissal and mobile-friendly form inputs', () => {
  assert.match(appSource, /event\.target\s*===\s*event\.currentTarget/);
  assert.match(appSource, /focusable/);
  for (const id of ['house-name', 'rule-version', 'rule-title', 'rule-text', 'rule-progress', 'expense-name', 'expense-amount', 'purchase-quantity']) {
    assert.match(appSource, new RegExp(`for="${id}"`));
    assert.match(appSource, new RegExp(`id="${id}"`));
  }
  assert.match(appSource, /inputmode="decimal"/);
  assert.match(appSource, /inputmode="numeric"/);
  assert.match(styleSource, /button\s*\{[^}]*touch-action:\s*manipulation/i);
  assert.match(styleSource, /button:active\s*\{/i);
});

test('guards repeat confirmations and empty payment actions', () => {
  assert.match(appSource, /if\s*\(!x\.confirmed\.includes\(me\)\)/);
  assert.match(appSource, /const x = openExpenses\(\)\.find[\s\S]*?if\s*\(!x\)/);
  assert.match(appSource, /当前没有待付款账单/);
});

test('keeps house labels and life dates dynamic on small screens', () => {
  assert.match(appSource, /function houseName\(\)/);
  assert.match(appSource, /const name = houseName\(\)/);
  assert.match(appSource, /function lifeDateLabel\(\)/);
  assert.match(appSource, /lifeDateLabel\(\)/);
  assert.doesNotMatch(appSource, /9 月 · 第 2 周/);
  assert.match(styleSource, /@media\s*\(max-width:\s*375px\)/i);
  assert.match(styleSource, /\.house-title-frame\s*\{[^}]*max-width:/i);
});

test('preserves each expense participant count and exposes a standalone admin transfer form', () => {
  assert.match(appSource, /const participantCount = Object\.keys\(x\.shares\)\.length;/);
  assert.match(appSource, /\$\{settled\}\/\$\{participantCount\} 已结清/);
  assert.match(appSource, /data-action="transfer-admin"/);
  assert.match(appSource, /'transfer-admin'\(\)[\s\S]*?<form id="transfer-admin-form">/);
  assert.match(appSource, /<label for="new-admin-id">接任管理员<\/label><select id="new-admin-id" name="successorId" required/);
});

test('renders member management from active resident state and exposes its action', () => {
  assert.match(appSource, /data-action="show-members"/);
  assert.match(appSource, /function renderMembers\(\)/);
  assert.match(appSource, /activeResidents\(state\)/);
  assert.match(appSource, /data-action="invite-resident"/);
  assert.match(appSource, /data-action="move-out-resident"/);
  assert.match(appSource, /管理员/);
  assert.match(appSource, /最近变动/);
});

test('warns about a member’s unpaid open expenses before move-out without blocking it', () => {
  assert.match(appSource, /未结费用/);
  assert.match(appSource, /memberOpenExpenses/);
  assert.match(appSource, /确认办理退租/);
});

test('styles member management sections and keeps member actions touch-friendly', () => {
  for (const selector of ['.member-list', '.member-admin-badge', '.member-history', '.member-event']) {
    assert.match(styleSource, new RegExp(`\\${selector}\\s*\\{`, 'i'), `${selector} should have a dedicated style rule`);
  }
  assert.match(styleSource, /\.member-action\s*\{[^}]*min-height:\s*44px/i);
});

test('provides an accessible return action from member management to my page', () => {
  assert.match(appSource, /data-action="back-to-profile"[^>]*aria-label="返回我的"/);
  assert.match(appSource, /'back-to-profile'\(\)\s*\{\s*go\('profile'\);\s*\}/);
  assert.match(styleSource, /\.back-link\s*\{[^}]*min-height:\s*44px/i);
});

test('moves public supplies into the life page public-supplies tab', () => {
  const renderLife = appSource.match(/function renderLife\(\) \{[\s\S]*?\n\}/)?.[0];

  assert.match(renderLife, /data-action="show-life-tab" data-id="supplies">公共物品/);
  assert.match(renderLife, /lifeTab === 'supplies'/);
  assert.doesNotMatch(renderLife, /supply-preview/);
  assert.match(appSource, /'show-life-tab'\(tab\)\s*\{\s*lifeTab = tab;\s*render\(\);\s*\}/);
});
