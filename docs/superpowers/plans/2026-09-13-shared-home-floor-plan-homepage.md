# Shared Home Floor-Plan Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the selected white, top-down six-bedroom apartment model the interactive state overview on the prototype homepage.

**Architecture:** Keep the existing zero-dependency Node.js server and browser `localStorage` state. Add the approved floor-plan image as a local static asset, derive four homepage hotspot states from existing data, and render transparent, keyboard-accessible overlays above the image. Existing expense, chore, supply, and rule actions remain the only state mutation paths.

**Tech Stack:** Node.js built-in HTTP server, browser DOM APIs, CSS, `node --test`.

---

## File structure

- `public/assets/shared-home-floor-plan.png`: approved generated top-down model; page visual only, no state embedded in the bitmap.
- `public/home-state.js`: pure helpers that derive the four homepage pending states and avatar state from persisted prototype data.
- `public/app.js`: imports the helpers through the browser global, renders the home model and binds model hotspot actions.
- `public/style.css`: home-model layout, touch targets, reduced-motion behavior, and narrow-screen sizing.
- `public/index.html`: loads `home-state.js` before `app.js`.
- `tests/home-state.test.js`: node tests for pending-state derivation.

### Task 1: Derive homepage model state

**Files:**
- Create: `public/home-state.js`
- Create: `tests/home-state.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing derivation test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { getHomeModelState } = require('../public/home-state.js');

test('derives all four pending model hotspots for 小陈', () => {
  const result = getHomeModelState({
    expenses: [{ status: 'open', paid: ['小李'], shares: { 小陈: 100 } }],
    chores: [{ id: 1, owner: '小陈', done: false }],
    supplies: [{ id: 2, quantity: 1, threshold: 2, claimed: false }],
    rules: [{ id: 3, confirmed: ['小王', '小李'] }]
  }, '小陈');
  assert.deepEqual(result, { debt: 100, choreId: 1, supplyId: 2, ruleId: 3, avatarPending: true });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/home-state.test.js`  
Expected: failure because `public/home-state.js` does not exist.

- [ ] **Step 3: Add the minimal pure helper**

```js
function getHomeModelState(state, member) {
  const debt = state.expenses.filter(x => x.status === 'open' && !x.paid.includes(member))
    .reduce((total, x) => total + (x.shares[member] || 0), 0);
  const chore = state.chores.find(x => x.owner === member && !x.done);
  const supply = state.supplies.find(x => x.quantity <= x.threshold && !x.claimed);
  const rule = state.rules.find(x => !x.confirmed.includes(member));
  return { debt, choreId: chore?.id || null, supplyId: supply?.id || null, ruleId: rule?.id || null,
    avatarPending: Boolean(debt || chore || rule) };
}
if (typeof module !== 'undefined') module.exports = { getHomeModelState };
if (typeof window !== 'undefined') window.getHomeModelState = getHomeModelState;
```

- [ ] **Step 4: Add the test script and verify it passes**

Add to `package.json`:

```json
"test": "node --test tests/*.test.js"
```

Run: `npm test`  
Expected: one passing test.

- [ ] **Step 5: Commit the helper and test**

```bash
git add package.json public/home-state.js tests/home-state.test.js
git commit -m "test: cover homepage floor-plan state"
```

### Task 2: Add the selected model asset and script order

**Files:**
- Create: `public/assets/shared-home-floor-plan.png`
- Modify: `public/index.html`

- [ ] **Step 1: Copy only the selected generated image into the static asset directory**

Run:

```powershell
New-Item -ItemType Directory -Force public/assets
Copy-Item -LiteralPath 'C:\Users\13150\.codex\generated_images\01a094b4-fe43-7010-a69c-739b1c54d207\exec-fb530edc-b3b1-4877-a241-bd5ce414ad6b.png' -Destination public/assets/shared-home-floor-plan.png
```

- [ ] **Step 2: Load the state helper before the app script**

Replace the final script block in `public/index.html` with:

```html
<script src="/home-state.js"></script>
<script src="/app.js"></script>
```

- [ ] **Step 3: Verify static asset serving**

Run: `curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3000/assets/shared-home-floor-plan.png`  
Expected: `200`.

- [ ] **Step 4: Commit the asset wiring**

```bash
git add public/assets/shared-home-floor-plan.png public/index.html
git commit -m "feat: add shared home floor-plan model"
```

### Task 3: Replace the homepage hero with the model and semantic hotspots

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Replace the existing `renderHome()` opening summary with a model renderer**

The renderer must call `getHomeModelState(state, me)` and return this model structure before the textual pending summary:

```html
<section class="home-model" aria-label="橘子洲 3A 合租屋状态模型">
  <img src="/assets/shared-home-floor-plan.png" alt="橘子洲 3A 的六间卧室、餐厨区、管理角和活动区俯视模型">
  <button class="model-hotspot room-hotspot" data-action="show-member-status" aria-label="查看小陈的房间状态"></button>
  <button class="model-hotspot kitchen-hotspot" data-action="show-supplies" aria-label="查看公共物品与补货"></button>
  <button class="model-hotspot management-hotspot" data-action="open-pending" aria-label="查看费用、值日和公约待办"></button>
  <button class="model-hotspot living-hotspot" data-page="life" aria-label="查看本周生活安排"></button>
</section>
```

- [ ] **Step 2: Use only current `actions` operations for hotspot behavior**

Add `show-member-status` to open a modal summarizing `debt`, `choreId`, and `ruleId`; add `open-pending` to open the first active action without changing data. Do not create duplicate expense, chore, supply, or rule records.

- [ ] **Step 3: Keep a compact readable action summary directly below the model**

Render the same four existing action cards with their existing action names (`pay`, `chore`, `claim`, `rule`) inside a horizontally scrollable `.home-summary` container.

- [ ] **Step 4: Verify the home render has all required entry points**

Run: `node --check public/app.js`  
Expected: exit code `0`.

- [ ] **Step 5: Commit the homepage structure**

```bash
git add public/app.js
git commit -m "feat: render interactive shared home model"
```

### Task 4: Add the mobile-first visual treatment and accessible interaction states

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Add model container and hotspot rules**

```css
.home-model { position: relative; margin: 14px -18px 16px; aspect-ratio: 2 / 3; overflow: hidden; background: #fff; }
.home-model img { display: block; width: 100%; height: 100%; object-fit: cover; }
.model-hotspot { position: absolute; min-width: 44px; min-height: 44px; border: 2px solid transparent; border-radius: 50%; background: transparent; cursor: pointer; }
.model-hotspot:focus-visible { border-color: #e66d48; outline: 3px solid #ffffff; outline-offset: 2px; }
.model-hotspot::after { content: ''; position: absolute; width: 9px; height: 9px; border-radius: 50%; background: #e66d48; box-shadow: 0 0 0 3px #fff; }
```

- [ ] **Step 2: Position hotspots relative to the final asset**

```css
.room-hotspot { left: 18%; top: 55%; }
.kitchen-hotspot { right: 18%; top: 13%; }
.management-hotspot { left: 45%; top: 31%; }
.living-hotspot { left: 42%; bottom: 7%; }
```

- [ ] **Step 3: Hide state dots when the mapped action is resolved**

Have `renderHome()` append `resolved` to a hotspot class when its `getHomeModelState` value is null, then add:

```css
.model-hotspot.resolved::after { display: none; }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; transition: none !important; animation: none !important; } }
```

- [ ] **Step 4: Verify stylesheet and static model load**

Run: `curl.exe -s -o NUL -w "style %{http_code}\nmodel %{http_code}\n" http://127.0.0.1:3000/style.css http://127.0.0.1:3000/assets/shared-home-floor-plan.png`  
Expected: both requests return `200`.

- [ ] **Step 5: Commit visual styles**

```bash
git add public/style.css public/app.js
git commit -m "style: add floor-plan homepage hotspots"
```

### Task 5: Verify the closed-loop behavior and publish

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the homepage-model behavior to the README**

Append:

```markdown
首页以可点击的六人合租屋俯视模型展示费用、值日、补货和公约状态；完成原型操作后，模型热点会同步更新。
```

- [ ] **Step 2: Run automated checks**

Run:

```powershell
npm test
node --check server.js
node --check public/app.js
```

Expected: all commands exit with code `0`.

- [ ] **Step 3: Run the interactive regression path in a browser**

1. Open the homepage and verify the asset fills the model panel without outside shadow or horizontal overflow.
2. Use the management hotspot to open a pending item and mark the electricity expense as transferred.
3. Complete the kitchen chore from its summary card.
4. Claim paper-tissue replenishment, record the purchase, and confirm that a new expense appears.
5. Confirm the charter rule and refresh the page.

Expected: corresponding model status dots disappear or update immediately; state persists after refresh; expense and life flows still open.

- [ ] **Step 4: Commit and push only the completed redesign**

```bash
git add README.md
git commit -m "docs: describe interactive home model"
git push origin main
```
