# 户型图完整贴合导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让首页户型图使用页面冷灰背景、完整显示，并与底部导航胶囊紧贴。

**Architecture:** 仅修改首页模型容器的 CSS；不更换图片文件、不修改热点坐标或业务逻辑。用现有静态 CSS 合约测试防止重新出现裁切或空隙。

**Tech Stack:** 原生 CSS、node:test。

---

### Task 1: Lock down the full-model display contract

**Files:**
- Modify: `tests/ui-markup.test.js`
- Modify: `public/style.css:152-154`

- [ ] **Step 1: Write the failing test**

Add to `tests/ui-markup.test.js`:

```js
test('shows the whole floor plan against the page background and above the navigation', () => {
  const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
  assert.match(css, /\.home-model\s*\{[^}]*background:\s*var\(--color-page\)/s);
  assert.match(css, /\.home-model img\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.home-model\s*\{[^}]*padding-bottom:\s*68px/s);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/ui-markup.test.js`

Expected: FAIL because the current model uses `object-fit: cover` and does not reserve exactly the navigation height.

- [ ] **Step 3: Implement the minimal CSS change**

```css
.phone-shell.home-only { padding: 0; }
.home-model {
  position: relative;
  aspect-ratio: 2 / 3;
  margin: 0;
  padding-bottom: 68px;
  overflow: hidden;
  background: var(--color-page);
}
.home-model img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

Adjust the exact model height rule as needed so the rendered image’s bottom edge meets the navigation’s top edge, while preserving the four absolute hotspot positions relative to the visible image area.

- [ ] **Step 4: Verify GREEN and visual result**

Run: `npm test; node --check public/app.js`

Expected: all tests pass.

At `http://127.0.0.1:3000/`, verify the model’s white margin is replaced by the cold-grey page background, the bottom activity area is visible, and no gap appears between the displayed model and the nav pill.

- [ ] **Step 5: Commit**

```bash
git add public/style.css tests/ui-markup.test.js
git commit -m "fix: fit floor plan above navigation"
```
