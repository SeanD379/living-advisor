# Model-Only Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leave only the interactive floor-plan model on the homepage above the existing bottom navigation.

**Architecture:** Make one surgical change to `renderHome()`: retain the model markup and remove the textual summary and quick-navigation sections. No state, action, style, routing, or asset behavior changes are needed.

**Tech Stack:** Browser DOM APIs, Node.js built-in tests.

---

### Task 1: Remove secondary homepage content

**Files:**
- Modify: `public/app.js`
- Test: `tests/home-state.test.js`

- [ ] **Step 1: Confirm current state tests pass**

Run: `npm test`  
Expected: 5 tests pass.

- [ ] **Step 2: Reduce `renderHome()` to the model section**

Replace the return value after hotspot construction with:

```js
return `<section class="home-model" aria-label="橘子洲 3A 合租屋状态模型">...</section>`;
```

Keep the four existing hotspot buttons and their `data-action`/`data-page` attributes unchanged. Remove the `.home-summary` and `.quick` markup only.

- [ ] **Step 3: Verify syntax and visible routes**

Run:

```powershell
npm test
node --check public/app.js
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3000/
```

Expected: tests pass, syntax exits 0, homepage returns 200.

- [ ] **Step 4: Commit and push**

```bash
git add public/app.js
git commit -m "feat: simplify homepage to floor-plan model"
git push origin main
```
