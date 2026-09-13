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

function createStateFactory(initialState) {
  return () => JSON.parse(JSON.stringify(initialState));
}

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

function getHomeHotspotState(modelState) {
  return {
    room: modelState.avatarPending ? 'active' : 'resolved',
    kitchen: modelState.supplyId !== null ? 'active' : 'resolved',
    management: modelState.debt || modelState.choreId !== null || modelState.ruleId !== null ? 'active' : 'resolved',
    living: 'active',
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    activeResidents,
    createStateFactory,
    getHomeModelState,
    getHomeHotspotState,
    inviteResident,
    moveOutResident,
  };
}

if (typeof window !== 'undefined') {
  window.activeResidents = activeResidents;
  window.createStateFactory = createStateFactory;
  window.getHomeModelState = getHomeModelState;
  window.getHomeHotspotState = getHomeHotspotState;
  window.inviteResident = inviteResident;
  window.moveOutResident = moveOutResident;
}
