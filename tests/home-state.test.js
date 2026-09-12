const assert = require('node:assert/strict');
const test = require('node:test');

const { getHomeModelState } = require('../public/home-state.js');

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
