# 合租公约讨论区与通知设置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, interactive house-rule proposal board and working notification preferences.

**Architecture:** Extend the existing browser-persisted state with rule posts and three notification flags. Reuse the single renderer, action dispatcher, modal component, and profile back-link pattern.

**Tech Stack:** Static HTML/CSS/JavaScript, Node built-in test runner.

---

### Task 1: Rule proposal board

**Files:**
- Modify: `public/app.js`
- Test: `tests/ui-markup.test.js`

- [ ] **Step 1: Write the failing test**

```js
test('renders a proposal board and supports creating and supporting house-rule posts', () => {
  assert.match(appSource, /data-id="rules">公约/);
  assert.match(appSource, /data-action="create-rule-post"/);
  assert.match(appSource, /'support-rule-post'\(id\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="proposal board"`

Expected: FAIL because the tab still opens the old rule editor.

- [ ] **Step 3: Implement the minimal board**

Add `rulePosts` to initial state, render the list when `lifeTab === 'rules'`, and add create, support, and owner-only adopt actions that call `save()`.

- [ ] **Step 4: Run tests to verify it passes**

Run: `npm test`

Expected: all tests pass.

### Task 2: Notification preferences subpage

**Files:**
- Modify: `public/app.js`
- Test: `tests/ui-markup.test.js`

- [ ] **Step 1: Write the failing test**

```js
test('opens a notification settings subpage with persisted preference controls', () => {
  assert.match(appSource, /data-action="show-notifications"/);
  assert.match(appSource, /notifications/);
  assert.match(appSource, /'toggle-notification'\(id\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="notification settings"`

Expected: FAIL because the profile row has no action.

- [ ] **Step 3: Implement the minimal subpage**

Render a dedicated notification page with three buttons reflecting switch state. Toggle state, save, rerender, and expose a back link to profile.

- [ ] **Step 4: Run tests to verify it passes**

Run: `npm test`

Expected: all tests pass.
