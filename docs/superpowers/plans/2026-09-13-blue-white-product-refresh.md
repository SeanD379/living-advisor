# 蓝白产品视觉改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有合租业务行为的前提下，将四个移动端页面更新为现代蓝白、语义色点缀的界面，并完整保留首页户型图模型。

**Architecture:** 保持内置 HTTP 服务、原生 HTML/CSS/JS 与 localStorage 状态架构不变。`index.html` 只承载全局壳层和导航，`app.js` 只为既有数据输出添加语义 class 与一致的内联 SVG 图标，`style.css` 作为唯一的设计令牌和页面表现层；`home-state.js` 不改动。

**Tech Stack:** Node.js 内置 HTTP 服务、原生 HTML、CSS、JavaScript、node:test。

---

## File structure

- Modify: `public/index.html` — 更新浏览器主题色和四项主导航的可访问 SVG 图标。
- Modify: `public/style.css` — 用蓝白设计令牌替换暖色样式，并实现壳层、卡片、表单、弹层、模型热点和悬浮导航。
- Modify: `public/app.js` — 给既有费用、生活、我的页面增加稳定的语义 class 与状态 class；不更改任何 action、state 或 localStorage 字段。
- Create: `tests/ui-markup.test.js` — 对导航标签、SVG 图标和蓝白主题色进行低成本回归测试。
- Test: `tests/home-state.test.js` — 现有模型状态行为回归测试。

### Task 1: Lock down semantic navigation markup

**Files:**
- Create: `tests/ui-markup.test.js`
- Modify: `public/index.html:5-15`

- [ ] **Step 1: Write the failing navigation markup test**

Create `tests/ui-markup.test.js`:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

test('uses a blue browser theme and labelled SVG primary navigation', () => {
  assert.match(html, /name="theme-color" content="#007AFF"/);
  assert.match(html, /<nav class="nav" aria-label="主导航">/);
  for (const label of ['首页', '费用', '生活', '我的']) {
    assert.match(html, new RegExp(`<button[^>]*data-page="[^\"]+"[^>]*>[\\s\\S]*?<svg[\\s\\S]*?${label}</button>`));
  }
  assert.doesNotMatch(html, /<i>[⌂¥☼☺]<\/i>/);
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `node --test tests/ui-markup.test.js`

Expected: FAIL because the existing theme color is warm orange and the navigation uses text glyphs in `<i>` elements.

- [ ] **Step 3: Replace the theme color and navigation glyphs with labelled inline SVG**

In `public/index.html`, set the theme color to `#007AFF`. Replace the current one-line navigation with four buttons retaining the existing `data-page` values and visible Chinese labels. Each button must contain a 24×24 inline SVG with `aria-hidden="true"` and a single consistent 1.8px outline stroke. Example for the home item:

```html
<button data-page="home" class="active">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-7h6v7"/></svg>
  <span>首页</span>
</button>
```

Use similarly simple, non-decorative paths for expenses, life and profile. Do not alter `#app`, `#modal-root`, script order, or `data-page` values.

- [ ] **Step 4: Run the markup test and full test suite**

Run: `npm test`

Expected: PASS with 6 tests, including the new navigation assertion and the five existing home-state assertions.

- [ ] **Step 5: Commit the isolated markup change**

```bash
git add public/index.html tests/ui-markup.test.js
git commit -m "style: add accessible blue navigation shell"
```

### Task 2: Establish blue-white tokens and global component language

**Files:**
- Modify: `public/style.css:1-3`
- Test: `tests/ui-markup.test.js`

- [ ] **Step 1: Extend the markup test with the design-token contract**

Add this test to `tests/ui-markup.test.js`:

```js
test('defines the approved blue-white semantic color tokens', () => {
  const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
  for (const token of ['--color-page:#F5F7FA', '--color-surface:#FFFFFF', '--color-text:#1D1D1F', '--color-primary:#007AFF']) {
    assert.ok(css.replaceAll(' ', '').includes(token), `missing ${token}`);
  }
  assert.doesNotMatch(css, /linear-gradient\([^)]*(#f87e4a|#f8a363)/i);
});
```

- [ ] **Step 2: Run the token test to verify it fails**

Run: `node --test tests/ui-markup.test.js`

Expected: FAIL because `style.css` has no `--color-*` declarations and still contains the orange gradient.

- [ ] **Step 3: Rewrite the stylesheet around the agreed tokens**

Replace the compact legacy CSS with readable sections. Begin with:

```css
:root {
  --color-page: #F5F7FA;
  --color-surface: #FFFFFF;
  --color-text: #1D1D1F;
  --color-secondary: #6E6E73;
  --color-divider: #E5E5EA;
  --color-primary: #007AFF;
  --color-expense: #FF9500;
  --color-success: #34C759;
  --color-supply: #FFCC00;
  --color-rule: #AF52DE;
  --color-danger: #FF3B30;
  --radius-card: 20px;
  --shadow-card: 0 8px 24px rgb(28 28 30 / 7%);
}
```

Apply these rules:

- Body uses `--color-page`; `.phone-shell`, cards and sheets use `--color-surface`; text hierarchy uses `--color-text` / `--color-secondary`.
- `.nav` is a fixed white, rounded capsule with a 1px divider and soft shadow. `.nav button` is at least 44px high. `.nav .active` uses `--color-primary` with a shallow `#EAF3FF` selection background.
- `.summary`, `.expense`, `.life-card`, `.profile-card`, `.settings`, `.modal`, inputs and selects share the same white surface, `20px` or smaller related radius, divider and shadow scale.
- `.primary`, `.round-add`, links and focus rings use `--color-primary`; normal buttons have an opacity/transform press feedback that honors `prefers-reduced-motion`.
- Existing `.pay`, `.clean`, `.supply`, `.rule`, `.stock.low`, `.done`, and destructive reset styles map to the five approved semantic colors, only as icon backgrounds, badges or small labels.
- `.phone-shell.home-only` has zero bottom padding; `.home-model` remains `aspect-ratio: 2 / 3` and uses `object-fit: cover`, so the complete existing floor-plan asset appears immediately above the nav without blank space.
- `.model-hotspot::after` defaults to `--color-primary`; give each hotspot a semantic modifier in Task 3. Keep all hotspots 44×44px and preserve their visible keyboard focus outline.
- Preserve the existing modal up transition, toast positioning and the reduced-motion override. Do not add dark mode or page-wide gradient backgrounds.

- [ ] **Step 4: Run static and behavior regression checks**

Run: `npm test; node --check public/app.js; node --check server.js`

Expected: all tests PASS and both syntax checks exit with code 0.

- [ ] **Step 5: Manually verify shell responsiveness**

Run: `npm start`

Check `http://127.0.0.1:3000/` at 375px and 480px widths:

- no horizontal scrolling;
- full floor plan visible on 首页 and no gap before navigation;
- navigation labels and selected state readable;
- every visible icon control is at least 44px clickable;
- reduced-motion does not leave an animated sheet or toast transition.

- [ ] **Step 6: Commit global styles**

```bash
git add public/style.css tests/ui-markup.test.js
git commit -m "style: apply blue white component system"
```

### Task 3: Add page-level semantics without changing business behavior

**Files:**
- Modify: `public/app.js:29-35`
- Modify: `public/style.css`
- Test: `tests/home-state.test.js`

- [ ] **Step 1: Add a failing source-level assertion for required page semantics**

Append to `tests/ui-markup.test.js`:

```js
test('keeps semantic page classes for the blue-white layout', () => {
  const app = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  for (const className of ['expense-summary', 'expense-status', 'life-status', 'profile-avatar']) {
    assert.match(app, new RegExp(className));
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/ui-markup.test.js`

Expected: FAIL because the existing rendered strings do not include the new semantic class names.

- [ ] **Step 3: Apply minimal markup changes in the render functions**

Do not touch `initial`, `save`, `go`, `actions`, or any mutation logic. Make the following rendering-only changes:

```js
// renderExpenses():
<section class="summary expense-summary">…</section>
<span class="expense-status ${x.paid.includes(me) ? 'is-settled' : 'is-open'}">…</span>

// renderLife():
<span class="life-status ${x.done ? 'is-done' : 'is-pending'}">…</span>

// renderProfile():
<span class="profile-avatar">陈</span>
```

For `renderHome()`, add semantic classes to the four existing hotspot buttons, for example `model-hotspot room-hotspot hotspot-room`; style these classes so room and management remain blue, kitchen uses supply yellow only when active, and living uses green only when active. The `.resolved` class must still hide the marker.

In `style.css`, implement the new class selectors as compact status pills or avatar treatment; do not put a colored background behind the entire expense, life, or profile card.

- [ ] **Step 4: Run complete behavior regression tests**

Run: `npm test`

Expected: PASS with all home-state tests unchanged, proving that this visual pass did not alter state derivation.

- [ ] **Step 5: Exercise the four existing workflows manually**

At `http://127.0.0.1:3000/`, verify:

1. 首页：点击房间、餐厨、管理、活动区热点，确认各自仍打开正确信息或页面。
2. 费用：新增账单并标记“我已转账”，确认金额和状态仍刷新。
3. 生活：完成值日、认领低库存物品，确认 Toast 和库存状态仍刷新。
4. 我的：打开设置项并重置演示数据，确认初始数据恢复。

- [ ] **Step 6: Commit page-level visual semantics**

```bash
git add public/app.js public/style.css tests/ui-markup.test.js
git commit -m "style: refine blue white page layouts"
```

### Task 4: Final visual and accessibility verification

**Files:**
- Modify: `public/style.css` only if an acceptance check below fails.
- Test: `tests/home-state.test.js`, `tests/ui-markup.test.js`

- [ ] **Step 1: Run final automated verification**

Run: `npm test; node --check public/app.js; node --check server.js`

Expected: test runner reports 8 passing tests (five model-state tests and three UI-markup tests); syntax checks exit 0.

- [ ] **Step 2: Complete the final visual acceptance pass**

Use the running local preview at 375px and 480px widths. Verify all of the following:

- 首页仍只显示标题、完整户型图和导航；没有待办卡、快捷宫格或模型下方空白；
- 蓝白是页面骨架，橙绿黄紫只做费用/完成/库存/公约的局部状态；
- 没有深色蓝紫、彩虹或大面积高饱和渐变；
- 四个页面均有一致的圆角、分隔线、阴影、标题和底部导航；
- Tab 键可见焦点，模态框可按 Escape 关闭并回到触发位置；
- 弹层和 Toast 在 `prefers-reduced-motion: reduce` 下不播放动画。

- [ ] **Step 3: Commit only if the acceptance pass caused a correction**

```bash
git add public/style.css
git commit -m "fix: polish blue white mobile layout"
```

If no correction was needed, do not create an empty commit.
