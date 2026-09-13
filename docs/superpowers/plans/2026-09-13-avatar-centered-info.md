# 居中室友头像与房屋标题 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已入住室友头像移动到各自房间中心、提供隐私安全的住户信息弹层，并将房屋标题居中。

**Architecture:** 保留现有户型图资产与空间热点；在模型画布上增加三个可访问头像按钮，由既有状态数据驱动弹层内容。顶部只调整布局，不改变房屋名称数据或导航行为。

**Tech Stack:** 原生 HTML/CSS/JavaScript、node:test、本地 Mock 数据和 localStorage。

---

### Task 1: Add centered resident-avatar interaction

**Files:**
- Modify: `public/app.js`
- Modify: `public/style.css`
- Modify: `tests/ui-markup.test.js`

- [ ] **Step 1: Write failing source contracts**

Add tests for three `resident-avatar` buttons, `data-action="show-resident"`, non-sensitive labels, and the centered topbar class. Run `npm test` and confirm the new contracts fail before implementation.

- [ ] **Step 2: Implement minimal markup and action**

Keep the floor-plan image, room hotspots, state derivation, and existing actions unchanged. Add three 44px+ avatar buttons inside the canvas at the centers of the occupied rooms. Each carries only a resident id/name and an aria-label. Add `show-resident` to `actions`; render a modal with nickname, room label, current shared-home status and pending summary. Never include contact, payment, or exact-address fields.

- [ ] **Step 3: Style and verify**

Center the existing resident portraits with absolute positions tied to the 2:3 canvas, preserve keyboard focus, and add a subtle press/focus state. Run `npm test`, `node --check public/app.js`, and manually click all three avatars.

- [ ] **Step 4: Commit**

```bash
git add public/app.js public/style.css tests/ui-markup.test.js
git commit -m "feat: center resident avatars with safe info"
```

### Task 2: Center the house title

**Files:**
- Modify: `public/index.html`
- Modify: `public/style.css`
- Modify: `tests/ui-markup.test.js`

- [ ] **Step 1: Add failing title-layout contract**

Assert the compact header uses a centered title group and the title remains present with the dropdown marker.

- [ ] **Step 2: Implement and verify**

Wrap the existing title and arrow in a centered group, style `.topbar.compact` with centered alignment, and run the full test suite plus a 375px visual check.

- [ ] **Step 3: Commit**

```bash
git add public/index.html public/style.css tests/ui-markup.test.js
git commit -m "style: center shared home title"
```
