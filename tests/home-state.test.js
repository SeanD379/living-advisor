const assert = require('node:assert/strict');
const test = require('node:test');

const {
  activeResidents,
  createStateFactory,
  getHomeModelState,
  getHomeHotspotState,
  inviteResident,
  moveOutResident,
  transferAdmin,
} = require('../public/home-state.js');

test('derives all four pending model hotspots for 小陈', () => {
  const state = {
    expenses: [{ status: 'open', paid: ['小李'], shares: { '小陈': 100 } }],
    chores: [{ id: 1, owner: '小陈', done: false }],
    supplies: [{ id: 2, quantity: 1, threshold: 2, claimed: false }],
    rules: [{ id: 3, confirmed: ['小王', '小李'] }],
  };

  assert.deepEqual(getHomeModelState(state, '小陈'), {
    debt: 100,
    choreId: 1,
    supplyId: 2,
    ruleId: 3,
    avatarPending: true,
  });
});

test('returns no pending homepage actions after a member resolves them', () => {
  const state = {
    expenses: [{ status: 'closed', paid: ['小陈'], shares: { '小陈': 100 } }],
    chores: [{ id: 1, owner: '小陈', done: true }],
    supplies: [
      { id: 2, quantity: 3, threshold: 2, claimed: false },
      { id: 3, quantity: 1, threshold: 2, claimed: true },
    ],
    rules: [{ id: 4, confirmed: ['小陈'] }],
  };

  assert.deepEqual(getHomeModelState(state, '小陈'), {
    debt: 0,
    choreId: null,
    supplyId: null,
    ruleId: null,
    avatarPending: false,
  });
});

test('derives semantic hotspot states from the homepage model state', () => {
  assert.deepEqual(getHomeHotspotState({
    debt: 100,
    choreId: null,
    supplyId: 2,
    ruleId: null,
    avatarPending: true,
  }), {
    room: 'active',
    kitchen: 'active',
    management: 'active',
    living: 'active',
  });

  assert.deepEqual(getHomeHotspotState({
    debt: 0,
    choreId: null,
    supplyId: null,
    ruleId: null,
    avatarPending: false,
  }), {
    room: 'resolved',
    kitchen: 'resolved',
    management: 'resolved',
    living: 'active',
  });
});

test('keeps zero-valued pending record ids active in hotspot state', () => {
  assert.deepEqual(getHomeHotspotState({
    debt: 0,
    choreId: 0,
    supplyId: 0,
    ruleId: 0,
    avatarPending: true,
  }), {
    room: 'active',
    kitchen: 'active',
    management: 'active',
    living: 'active',
  });
});

test('creates a fresh deep-cloned state for each factory call', () => {
  const createInitialState = createStateFactory({ expenses: [{ paid: [] }] });
  const mutated = createInitialState();
  mutated.expenses[0].paid.push('小陈');

  assert.deepEqual(createInitialState(), { expenses: [{ paid: [] }] });
});

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

test('lets the active administrator transfer management without moving out', () => {
  const state = { household: { adminId: '小陈', members: [
    { id: '小陈', name: '小陈', status: 'active' },
    { id: '小王', name: '小王', status: 'active' },
  ], history: [] } };

  transferAdmin(state, '小陈', '小王', '2026-09-14');

  assert.equal(state.household.adminId, '小王');
  assert.deepEqual(activeResidents(state).map((member) => member.name), ['小陈', '小王']);
  assert.deepEqual(state.household.history, [{ type: '管理员转让', from: '小陈', to: '小王', date: '2026-09-14' }]);
});
