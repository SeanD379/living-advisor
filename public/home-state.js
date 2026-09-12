function getHomeModelState(state, member) {
  const debt = state.expenses
    .filter((expense) => expense.status === 'open' && !expense.paid.includes(member))
    .reduce((total, expense) => total + (expense.shares[member] || 0), 0);
  const chore = state.chores.find((item) => item.owner === member && !item.done);
  const supply = state.supplies.find((item) => item.quantity <= item.threshold && !item.claimed);
  const rule = state.rules.find((item) => !item.confirmed.includes(member));

  return {
    debt,
    choreId: chore?.id ?? null,
    supplyId: supply?.id ?? null,
    ruleId: rule?.id ?? null,
    avatarPending: Boolean(debt || chore || rule),
  };
}

if (typeof module !== 'undefined') {
  module.exports = { getHomeModelState };
}

if (typeof window !== 'undefined') {
  window.getHomeModelState = getHomeModelState;
}
