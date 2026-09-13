# Member Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add administrator-controlled resident invitation, move-out, management transfer, and a visible resident-change history to the local shared-home prototype.

**Architecture:** Keep the existing browser-local state as the only persistence layer. Add pure member-state helpers in `public/home-state.js`; `public/app.js` renders and mutates that state through the existing modal/action pattern, while the floor plan derives its avatar controls from active residents only.

**Tech Stack:** Plain browser JavaScript, Node.js built-in test runner, HTML/CSS, localStorage.

---

## File structure

- `public/home-state.js`: pure functions for active-member lookup, invitations, administrator transfer, and move-out validation.
- `public/app.js`: initial member records, legacy-state normalization, dynamic floor-plan residents, member-management screen, and modal actions.
- `public/style.css`: member list, status badge, event history, and form action styling using existing blue-white tokens.
- `tests/home-state.test.js`: member-state behavior tests.
- `tests/ui-markup.test.js`: source-level UI contract tests for the entry point, dynamic resident rendering, and accessible controls.

### Task 1: Add member-state behavior with tests first

**Files:**
- Modify: `tests/home-state.test.js`
- Modify: `public/home-state.js`

- [ ] **Step 1: Write failing member-state tests**

  Append tests that define the state contract:

  ```js
  const { activeResidents, inviteResident, moveOutResident } = require('../public/home-state.js');

  test('invites a resident into an empty room and retains active residents only', () => {
    const state = { household: { adminId: '小陈', members: [
      { id: '小陈', name: '小陈', room: '左下卧室', position: 'resident-avatar-bottom-left', status: 'active', joinedAt: '2026-09-01' },
    ], history: [] } };

    inviteResident(state, { name: '小周', room: '右上卧室', position: 'resident-avatar-top-right', joinedAt: '2026-09-14' });

    assert.deepEqual(activeResidents(state).map((member) => member.name), ['小陈', '小周']);
    assert.equal(state.household.history[0].type, '入住');
  });

  test('requires an administrator successor before the administrator can move out', () => {
    const state = { household: { adminId: '小陈', members: [
      { id: '小陈', name: '小陈', status: 'active' },
      { id: '小王', name: '小王', status: 'active' },
    ], history: [] } };

    assert.throws(() => moveOutResident(state, '小陈', '2026-09-20'), /接任管理员/);
    moveOutResident(state, '小陈', '2026-09-20', '小王');
    assert.equal(state.household.adminId, '小王');
    assert.deepEqual(activeResidents(state).map((member) => member.name), ['小王']);
    assert.deepEqual(state.household.history.map((event) => event.type), ['退租', '管理员转让']);
  });
  ```

- [ ] **Step 2: Run the focused test file and confirm expected failure**

  Run: `node --test tests/home-state.test.js`

  Expected: FAIL because `activeResidents`, `inviteResident`, and `moveOutResident` are not exported yet.

- [ ] **Step 3: Implement the smallest pure helpers**

  Add these functions to `public/home-state.js`, then include them in both module exports and browser globals:

  ```js
  function activeResidents(state) {
    return state.household.members.filter((member) => member.status === 'active');
  }

  function inviteResident(state, member) {
    if (!member.name.trim()) throw new Error('请输入成员昵称');
    if (activeResidents(state).some((item) => item.name === member.name)) throw new Error('成员昵称已存在');
    if (activeResidents(state).some((item) => item.room === member.room)) throw new Error('该房间已有人入住');
    state.household.members.push({ id: member.name, status: 'active', ...member });
    state.household.history.unshift({ type: '入住', member: member.name, date: member.joinedAt });
  }

  function moveOutResident(state, memberId, date, successorId) {
    const member = activeResidents(state).find((item) => item.id === memberId);
    if (!member) throw new Error('未找到当前成员');
    if (activeResidents(state).length === 1) throw new Error('至少保留一名当前成员');
    if (state.household.adminId === memberId && !successorId) throw new Error('请选择接任管理员');
    if (successorId) {
      const successor = activeResidents(state).find((item) => item.id === successorId && item.id !== memberId);
      if (!successor) throw new Error('接任管理员必须是当前成员');
      state.household.adminId = successor.id;
      state.household.history.unshift({ type: '管理员转让', from: member.name, to: successor.name, date });
    }
    member.status = 'moved-out';
    member.movedOutAt = date;
    state.household.history.unshift({ type: '退租', member: member.name, date });
  }
  ```

- [ ] **Step 4: Re-run the focused test file**

  Run: `node --test tests/home-state.test.js`

  Expected: PASS, including all pre-existing home model tests.

- [ ] **Step 5: Commit the tested state contract**

  ```bash
  git add public/home-state.js tests/home-state.test.js
  git commit -m "feat: add member state management"
  ```

### Task 2: Render current members, history, and administrator-only actions

**Files:**
- Modify: `tests/ui-markup.test.js`
- Modify: `public/app.js`

- [ ] **Step 1: Write failing UI-contract tests**

  Append this test to ensure the entry point and dynamic list are not replaced with static markup:

  ```js
  test('renders member management from active resident state and exposes its action', () => {
    assert.match(appSource, /data-action="show-members"/);
    assert.match(appSource, /function renderMembers\(\)/);
    assert.match(appSource, /activeResidents\(state\)/);
    assert.match(appSource, /data-action="invite-resident"/);
    assert.match(appSource, /data-action="move-out-resident"/);
    assert.match(appSource, /管理员/);
    assert.match(appSource, /最近变动/);
  });
  ```

- [ ] **Step 2: Run the focused UI test and confirm expected failure**

  Run: `node --test tests/ui-markup.test.js`

  Expected: FAIL because the member-management action and renderer do not exist.

- [ ] **Step 3: Replace static residents with normalized member state**

  In `public/app.js`, extend `initial` with:

  ```js
  household: {
    adminId: '小陈',
    members: [
      { id: '小王', name: '小王', room: '左上卧室', position: 'resident-avatar-top-left', status: 'active', joinedAt: '2026-09-01' },
      { id: '小李', name: '小李', room: '右中卧室', position: 'resident-avatar-middle-right', status: 'active', joinedAt: '2026-09-01' },
      { id: '小陈', name: '小陈', room: '左下卧室', position: 'resident-avatar-bottom-left', status: 'active', joinedAt: '2026-09-01' },
    ],
    history: [],
  },
  ```

  Immediately after loading localStorage, normalize legacy saved state:

  ```js
  function normalizeState(savedState) {
    const next = savedState || createInitialState();
    if (!next.household) return createInitialState();
    return next;
  }

  let state = normalizeState(JSON.parse(localStorage.getItem('shared-home-state') || 'null'));
  ```

  Remove the static `residents` constant. In `renderHome`, replace `residents.map(...)` with `activeResidents(state).map(...)`, retaining each member's existing `position` hook. Update all fixed `/3`, hard-coded payer choices, and equal shares to use `activeResidents(state)` so new expenses only include current residents.

- [ ] **Step 4: Add the member-management renderer and its actions**

  Add a `rooms` constant and `renderMembers()` that renders active members with room, joined date, and an `管理员` badge when `member.id === state.household.adminId`; render a `最近变动` list from `state.household.history`, with an empty-state message. Update the page switch in `render()` to include `page === 'members' ? renderMembers()` before the profile fallback. Use this exact renderer:

  ```js
  const rooms = [
    { name: '左上卧室', position: 'resident-avatar-top-left' },
    { name: '右上卧室', position: 'resident-avatar-top-right' },
    { name: '左中卧室', position: 'resident-avatar-middle-left' },
    { name: '右中卧室', position: 'resident-avatar-middle-right' },
    { name: '左下卧室', position: 'resident-avatar-bottom-left' },
    { name: '右下卧室', position: 'resident-avatar-bottom-right' },
  ];

  function renderMembers() {
    const members = activeResidents(state);
    const canManage = state.household.adminId === me;
    const current = members.map((member) => `<article class="member-item"><div class="member-item-head"><h3>${member.name}</h3>${member.id === state.household.adminId ? '<span class="member-admin-badge">管理员</span>' : ''}</div><p>${member.room} · ${member.joinedAt} 入住</p>${canManage ? `<button class="member-action" data-action="move-out-resident" data-id="${member.id}">办理退租</button>` : ''}</article>`).join('');
    const history = state.household.history.length ? state.household.history.map((event) => `<li class="member-event">${event.date} · ${event.type}${event.member ? ` · ${event.member}` : ` · ${event.from} → ${event.to}`}</li>`).join('') : '<li class="member-event">暂无成员变动记录</li>';
    return `<section class="page-title"><div><p class="eyebrow">合租成员</p><h2>成员与邀请</h2></div></section><section class="member-list"><h3>当前入住 · ${members.length} 人</h3>${current}</section>${canManage ? '<button class="primary" data-action="invite-resident">邀请新成员</button>' : ''}<section class="member-history"><h3>最近变动</h3><ul class="share-list">${history}</ul></section>`;
  }
  ```

  Update `renderProfile()` so the first settings button is:

  ```js
  <button data-action="show-members">成员与邀请 <i>›</i></button>
  ```

  Add these actions to the existing `actions` object:

  ```js
  'show-members'() { page = 'members'; render(); },
  'invite-resident'() {
    const vacantRooms = rooms.filter((room) => !activeResidents(state).some((member) => member.room === room.name));
    modal('邀请新成员', `<form id="invite-resident-form"><label for="resident-name">昵称</label><input id="resident-name" name="name" required maxlength="12"><label for="resident-room">房间</label><select id="resident-room" name="room">${vacantRooms.map((room) => `<option value="${room.name}">${room.name}</option>`).join('')}</select><button class="primary">确认邀请</button></form>`);
    document.querySelector('#invite-resident-form').onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      const room = rooms.find((item) => item.name === form.get('room'));
      try { inviteResident(state, { name: form.get('name').trim(), room: room.name, position: room.position, joinedAt: '2026-09-14' }); save(); closeModal(); render(); toast('新成员已加入合租屋'); } catch (error) { toast(error.message); }
    };
  },
  'move-out-resident'(id) {
    const member = activeResidents(state).find((item) => item.id === id);
    const isAdmin = id === state.household.adminId;
    const successors = activeResidents(state).filter((item) => item.id !== id);
    modal(`办理${member.name}退租`, `<form id="move-out-form"><label for="move-out-date">生效日期</label><input id="move-out-date" name="date" type="date" required value="2026-09-14">${isAdmin ? `<label for="successor-id">接任管理员</label><select id="successor-id" name="successorId" required><option value="">请选择</option>${successors.map((item) => `<option value="${item.id}">${item.name} · ${item.room}</option>`).join('')}</select>` : ''}<button class="primary">确认办理退租</button></form>`);
    document.querySelector('#move-out-form').onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      try { moveOutResident(state, id, form.get('date'), form.get('successorId')); save(); closeModal(); render(); toast(isAdmin ? '管理权已转让，成员已退租' : '成员已退租'); } catch (error) { toast(error.message); }
    };
  },
  ```

  Generate the vacant-room select from a fixed six-room location list minus `activeResidents(state).map((member) => member.room)`. Render invite and move-out buttons only when `state.household.adminId === me`; keep the page readable for all members.

- [ ] **Step 5: Re-run focused UI tests**

  Run: `node --test tests/ui-markup.test.js`

  Expected: PASS, including existing navigation, accessible markup, and floor-plan tests.

- [ ] **Step 6: Commit the member-management interaction**

  ```bash
  git add public/app.js tests/ui-markup.test.js
  git commit -m "feat: add resident management interface"
  ```

### Task 3: Style the list and verify user-visible flows

**Files:**
- Modify: `public/style.css`
- Modify: `tests/ui-markup.test.js`

- [ ] **Step 1: Write a failing style-contract test**

  Append this test:

  ```js
  test('styles member status and history inside the existing blue-white system', () => {
    for (const selector of ['.member-list', '.member-admin-badge', '.member-history', '.member-event']) {
      assert.match(styleSource, new RegExp(`\\${selector}\\s*\\{`));
    }
    assert.match(styleSource, /\.member-action\s*\{[^}]*min-height:\s*44px/i);
  });
  ```

- [ ] **Step 2: Run the focused UI test and confirm expected failure**

  Run: `node --test tests/ui-markup.test.js`

  Expected: FAIL because the member style selectors do not exist.

- [ ] **Step 3: Add minimal styles using current tokens**

  Add member-specific selectors to `public/style.css`:

  ```css
  .member-list, .member-history { display: grid; gap: 10px; }
  .member-item, .member-event { padding: 14px 0; border-bottom: 1px solid var(--color-divider); }
  .member-item-head { display: flex; align-items: center; gap: 8px; }
  .member-admin-badge { padding: 3px 8px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-text); font-size: 11px; font-weight: 700; }
  .member-action { width: 100%; min-height: 44px; margin-top: 12px; border: 1px solid var(--color-primary); border-radius: 12px; background: transparent; color: var(--color-primary-text); }
  .member-event { color: var(--color-secondary); font-size: 12px; }
  ```

  Keep the existing bottom-sheet modal and token set. Do not add new gradients, external assets, or icon dependencies.

- [ ] **Step 4: Re-run all automated checks**

  Run:

  ```bash
  npm test
  node --check public/app.js
  node --check public/home-state.js
  git diff --check
  ```

  Expected: all tests pass; both syntax checks return no output; diff check returns no output.

- [ ] **Step 5: Manually exercise the browser flows**

  At `http://127.0.0.1:3000/`:

  1. Open 我的 → 成员与邀请; verify 小陈 has the 管理员 badge.
  2. Invite 小周 into an empty room; verify the list and floor-plan avatar update.
  3. Move out 小周; verify the avatar disappears and a 退租 event is shown.
  4. Start 小陈’s move-out; verify submission is blocked until a successor is selected.
  5. Select 小王; verify 小王 gains 管理员 and both the transfer and move-out events appear.
  6. Reset demo data; verify the default three residents and 小陈 administrator are restored.

- [ ] **Step 6: Commit styling and verification result**

  ```bash
  git add public/style.css tests/ui-markup.test.js
  git commit -m "style: present member management states"
  ```
