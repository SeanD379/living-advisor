# 上线前体验收口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在保持户型图首页主视觉的前提下，完成住户识别、状态反馈、弹窗可用性、重复操作防护和移动端一致性收口。

**Architecture:** 继续使用现有 Node.js 静态原型、`app.js` 的本地状态与 `style.css` 的 token 系统。所有改动集中在现有渲染、弹窗和测试文件，不引入依赖或新后端。

**Tech Stack:** Node.js 内置 HTTP 服务、原生 HTML/CSS/JavaScript、localStorage、Node test runner。

---

### Task 1: 明确住户头像和我的状态反馈

**Files:**
- Modify: `public/app.js:15-33,42`
- Modify: `public/index.html:12`
- Modify: `public/style.css:47,175-181`
- Test: `tests/ui-markup.test.js:239-270`

- [ ] **Step 1: Write the failing assertions**

  Extend the resident markup test to require a visible resident initial, a status class/data attribute, and the top status control with an accessible label. Require `renderHome()` to derive a `pendingCount` from `getHomeModelState` and expose either the count or the completed copy.

- [ ] **Step 2: Run the focused test and confirm failure**

  Run `node --test tests/ui-markup.test.js`.
  Expected: FAIL because resident buttons currently hide their text and the top status button is static.

- [ ] **Step 3: Implement the smallest UI change**

  In `renderHome()`, compute the number of active model states and render each resident button with a visible initial (`resident.name.slice(-1)`), `data-status`, and an optional status dot. In `render()`, update `.home-status-link` from the current model state so it reads `我的状态 · N` or `我的状态 · 已完成`, and give it `aria-label="查看我的待处理事项"`.

  Update CSS so `.resident-avatar span` is visible, uses a 12px semibold label, and has a small status treatment without changing the 44px+ hit target. Add pressed opacity/scale feedback to `.home-status-link` and resident avatars without changing layout bounds.

- [ ] **Step 4: Run the focused test and verify it passes**

  Run `node --test tests/ui-markup.test.js`.
  Expected: PASS.

### Task 2: Make modal interaction and form semantics production-ready

**Files:**
- Modify: `public/app.js:25-26,63-64`
- Modify: `public/style.css:37-40,119-128`
- Test: `tests/ui-markup.test.js`

- [ ] **Step 1: Write failing source-contract assertions**

  Add assertions for `overlay` click handling, `document.activeElement` focus restoration, `for="..."`/matching field ids in the editable forms, and `inputmode="decimal"`/`inputmode="numeric"` on amount and quantity fields.

- [ ] **Step 2: Run the focused test and confirm failure**

  Run `node --test tests/ui-markup.test.js`.
  Expected: FAIL because modal overlays do not close on backdrop click and form controls have no explicit ids/for attributes.

- [ ] **Step 3: Implement modal focus and field semantics**

  In `modal()`, attach a click handler that calls `closeModal()` only when `event.target === event.currentTarget`, keep Escape behavior, and add a small Tab-cycle handler inside the dialog so focus remains within the open sheet. Keep the existing trigger restoration in `closeModal()`.

  Add explicit labels and ids to `house-form`, `rule-form`, `expense-form`, and `purchase-form`; set `inputmode="decimal"` for monetary fields and `inputmode="numeric"` for quantities. Add `touch-action: manipulation` and `:active` opacity feedback to buttons.

- [ ] **Step 4: Run tests and syntax checks**

  Run `npm test`, `node --check public/app.js`, and `git diff --check`.
  Expected: all tests pass, syntax check exits 0, and diff check has no errors.

### Task 3: Guard repeat actions and empty payment states

**Files:**
- Modify: `public/app.js:54-60`
- Test: `tests/home-state.test.js` or `tests/ui-markup.test.js`

- [ ] **Step 1: Add regression assertions**

  Add a source contract for `confirmed.includes(me)` before appending a rule confirmation and for a no-expense guard in `pay()`.

- [ ] **Step 2: Implement idempotent actions**

  In `rule(id)`, disable or replace the confirmation action when the current member is already in `x.confirmed`; otherwise append the member once. In `pay()`, find the first open unpaid expense and show a neutral “当前没有待付款账单” modal if none exists instead of dereferencing `x`.

- [ ] **Step 3: Run focused and full tests**

  Run `npm test` and `node --check public/app.js`.
  Expected: all tests pass and no runtime syntax errors are reported.

### Task 4: Remove hardcoded presentation values and verify small screens

**Files:**
- Modify: `public/app.js:29,40`
- Modify: `public/style.css:47,160-189`
- Test: `tests/ui-markup.test.js`

- [ ] **Step 1: Add regression assertions**

  Require the home model aria label and image alt text to use the current house-name variable, and require life-page date copy to be derived from a date helper rather than the literal `9 月 · 第 2 周`.

- [ ] **Step 2: Implement shared display helpers**

  Add a `houseName()` helper that reads `shared-house-name` with the existing fallback. Add a small local date formatter for the life header and chore badge. Use both helpers in home alt/aria strings and life-page copy while preserving the current demo semantics.

- [ ] **Step 3: Add responsive safeguards**

  Keep the title centered and allow the status button to wrap or shrink at 375px using a media query; preserve 44px minimum hit areas and avoid horizontal overflow.

- [ ] **Step 4: Run the full verification set**

  Run `npm test`, `node --check public/app.js`, `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/`, and `git diff --check`.
  Expected: 0 test failures, HTTP 200, valid JavaScript, and a clean diff check.

### Task 5: Commit the verified release polish

**Files:**
- Commit the modified source, tests, and this plan only; leave the untracked `.jsd` reference file untouched.

- [ ] **Step 1: Review the diff**

  Run `git diff --stat` and `git diff -- public/app.js public/index.html public/style.css tests/ui-markup.test.js`.

- [ ] **Step 2: Commit**

  Run `git add public/app.js public/index.html public/style.css tests/ui-markup.test.js docs/superpowers/plans/2026-09-14-prelaunch-polish.md` and commit with message `feat: polish prelaunch interaction details`.

- [ ] **Step 3: Verify repository state**

  Run `git status --short` and confirm only the intentionally untracked `.jsd` reference remains.
