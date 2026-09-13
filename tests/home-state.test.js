const assert = require('node:assert/strict');
const test = require('node:test');

const { createStateFactory, getHomeModelState, getHomeHotspotState } = require('../public/home-state.js');

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
