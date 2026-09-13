const initial = {
  expenses: [{ id: 1, name: '9 月电费', amount: 300, payer: '小王', category: '电费', status: 'open', paid: ['小李'], shares: { '小王': 100, '小李': 100, '小陈': 100 }, date: '2026-09-10' }],
  chores: [{ id: 1, name: '清洁厨房', owner: '小陈', due: '今日 20:00 前', done: false }],
  supplies: [{ id: 1, name: '纸巾', quantity: 1, threshold: 2, unit: '包', place: '客厅柜', claimed: false, history: [] }, { id: 2, name: '垃圾袋', quantity: 4, threshold: 2, unit: '卷', place: '厨房', claimed: false, history: [] }, { id: 3, name: '洗洁精', quantity: 1, threshold: 1, unit: '瓶', place: '水槽下方', claimed: false, history: [] }],
  rules: [{ id: 1, title: '访客与夜间安静规则', text: '工作日 23:00 后请保持公共区域安静；周末可延至 24:00。留宿访客请提前在群内告知。', confirmed: ['小王', '小陈'] }],
  household: {
    adminId: '小陈',
    members: [
      { id: '小王', name: '小王', room: '左上卧室', position: 'resident-avatar-top-left', status: 'active', joinedAt: '2026-09-01' },
      { id: '小李', name: '小李', room: '右中卧室', position: 'resident-avatar-middle-right', status: 'active', joinedAt: '2026-09-01' },
      { id: '小陈', name: '小陈', room: '左下卧室', position: 'resident-avatar-bottom-left', status: 'active', joinedAt: '2026-09-01' },
    ],
    history: [],
  },
};
const createInitialState = createStateFactory(initial);
function normalizeState(savedState) {
  const next = savedState || createInitialState();
  return next.household ? next : createInitialState();
}
let state = normalizeState(JSON.parse(localStorage.getItem('shared-home-state') || 'null'));
let page = 'home';
const app = document.querySelector('#app');
const save = () => localStorage.setItem('shared-home-state', JSON.stringify(state));
const me = '小陈';
const money = n => `¥${Number(n).toFixed(2)}`;
function houseName() { return localStorage.getItem('shared-house-name') || '橘子洲 3A'; }
function lifeDateLabel() { const now = new Date(); return { day: now.getDate(), month: now.getMonth() + 1, week: Math.ceil(now.getDate() / 7) }; }
const openExpenses = () => state.expenses.filter(x => x.status === 'open');
const rooms = [
  { name: '左上卧室', position: 'resident-avatar-top-left' },
  { name: '右上卧室', position: 'resident-avatar-top-right' },
  { name: '左中卧室', position: 'resident-avatar-middle-left' },
  { name: '右中卧室', position: 'resident-avatar-middle-right' },
  { name: '左下卧室', position: 'resident-avatar-bottom-left' },
  { name: '右下卧室', position: 'resident-avatar-bottom-right' },
];
let modalId = 0;
let modalTrigger = null;
let removeEscapeListener = null;
function toast(text) { const el = document.querySelector('#toast'); el.textContent = text; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2100); }
function go(next) { page = next; document.querySelectorAll('.nav button').forEach(b => { const active = b.dataset.page === next; b.classList.toggle('active', active); if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); render(); }
function actionButtons() { document.querySelectorAll('[data-action]').forEach(b => { const trigger = () => actions[b.dataset.action](b.dataset.id || b.dataset.residentId); b.onclick = trigger; b.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); trigger(); } }; }); }
function modal(title, body) {
  modalTrigger = document.activeElement;
  if (removeEscapeListener) removeEscapeListener();
  const headingId = `modal-title-${++modalId}`;
  const root = document.querySelector('#modal-root');
  root.innerHTML = `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="${headingId}"><button class="close" aria-label="关闭">×</button><h2 id="${headingId}">${title}</h2>${body}</section></div>`;
  const overlay = root.querySelector('.overlay');
  const dialog = root.querySelector('.modal');
  const closeButton = root.querySelector('.close');
  const focusable = [...dialog.querySelectorAll('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])')];
  overlay.onclick = event => { if (event.target === event.currentTarget) closeModal(); };
  closeButton.onclick = closeModal;
  const onKeydown = event => {
    if (event.key === 'Escape') return closeModal();
    if (event.key !== 'Tab' || focusable.length < 2) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKeydown);
  removeEscapeListener = () => document.removeEventListener('keydown', onKeydown);
  closeButton.focus();
}
function closeModal() { if (removeEscapeListener) removeEscapeListener(); removeEscapeListener = null; document.querySelector('#modal-root').innerHTML = ''; if (modalTrigger?.isConnected) modalTrigger.focus(); modalTrigger = null; }
function card(icon, title, text, label, action, id) { return `<article class="action-card"><span class="card-icon ${icon}">${icon === 'pay' ? '¥' : icon === 'clean' ? '✦' : icon === 'supply' ? '▣' : '⌁'}</span><div><h3>${title}</h3><p>${text}</p></div>${action ? `<button class="soft-btn" data-action="${action}" data-id="${id || ''}">${label}</button>` : ''}</article>`; }
function renderHome() {
  const name = houseName();
  const model = getHomeModelState(state, me);
  const hotspots = getHomeHotspotState(model);
  const pendingCount = [model.debt > 0, model.choreId !== null, model.supplyId !== null, model.ruleId !== null].filter(Boolean).length;
  const residentButtons = activeResidents(state).map(resident => { const residentModel = getHomeModelState(state, resident.id); const residentPending = [residentModel.debt > 0, residentModel.choreId !== null, residentModel.supplyId !== null, residentModel.ruleId !== null].filter(Boolean).length; return `<button class="resident-avatar ${resident.position}" data-action="show-resident" data-resident-id="${resident.id}" data-resident-name="${resident.name}" data-status="${residentPending ? 'pending' : 'settled'}" aria-label="查看${resident.name}的合租信息"><span aria-hidden="true">${resident.name.slice(-1)}</span></button>`; }).join('');
  return `<section class="home-model" data-pending-count="${pendingCount}" aria-label="${name} 合租屋状态模型"><div class="home-model-canvas"><img src="/assets/shared-home-floor-plan-v2.png" alt="${name} 的六间卧室、餐厨区、管理角和活动区俯视模型">${residentButtons}<button class="model-hotspot kitchen-hotspot hotspot-kitchen ${hotspots.kitchen}" data-action="show-supplies" aria-label="查看餐厨区物品状态"><span>餐厨区物品状态</span></button><button class="model-hotspot management-hotspot hotspot-management ${hotspots.management}" data-action="open-pending" aria-label="查看管理角待处理事项"><span>管理角待处理事项</span></button><button class="model-hotspot living-hotspot hotspot-living ${hotspots.living}" data-page="life" aria-label="查看活动区生活事项"><span>活动区生活事项</span></button></div></section>
    `;
}
function renderExpenses() {
  const list = state.expenses.map(x => { const mine = x.shares[me] || 0; const settled = x.paid.length + 1; const participantCount = Object.keys(x.shares).length; return `<article class="expense"><div class="expense-title"><span class="expense-icon">⚡</span><div><h3>${x.name}</h3><p>${x.date} · ${x.payer}垫付</p></div><strong>${money(x.amount)}</strong></div><div class="expense-bottom"><span>${settled}/${participantCount} 已结清</span><span class="expense-status">${x.status === 'checking' ? '待核对' : x.paid.includes(me) ? '我已转账' : `我应付 ${money(mine)}`}</span></div><button class="link-btn" data-action="detail" data-id="${x.id}">查看分摊明细 →</button></article>`; }).join('');
  return `<section class="page-title"><div><p class="eyebrow">本月共同账本</p><h2>费用 AA</h2></div><button class="round-add" data-action="add-expense">＋</button></section><section class="summary expense-summary"><span>本月我应付<strong>${money(openExpenses().filter(x => !x.paid.includes(me)).reduce((a,x) => a+x.shares[me],0))}</strong></span><span>我已垫付<strong>${money(state.expenses.filter(x=>x.payer===me).reduce((a,x)=>a+x.amount,0))}</strong></span></section><div class="filter"><b>本月账单</b><button>全部⌄</button></div><div class="expense-list">${list}</div>`;
}
function renderLife() { const date = lifeDateLabel(); const chores = state.chores.map(x => `<article class="life-card"><span class="date-badge">今<br><b>${date.day}</b></span><div><p>20:00 前完成</p><h3>${x.name}</h3><span>轮到 <b>${x.owner}</b></span></div>${x.done ? '<span class="done life-status">已完成</span>' : x.owner === me ? `<button class="soft-btn" data-action="chore" data-id="${x.id}">完成</button>` : ''}</article>`).join(''); const supplyCards = state.supplies.map(x => `<article class="supply"><span class="supply-pic">${x.name === '纸巾' ? '▤' : '◒'}</span><div><h3>${x.name}</h3><p>${x.place} · 剩余 ${x.quantity} ${x.unit}</p></div><span class="stock ${x.quantity<=x.threshold?'low':''}">${x.quantity<=x.threshold?'待补货':'充足'}</span></article>`); const supplies = supplyCards.slice(0,2).join(''); return `<section class="page-title"><div><p class="eyebrow">一起照顾共同空间</p><h2>生活</h2></div></section><div class="tabs"><button class="tab active">值日</button><button class="tab" data-action="show-supplies">物品</button><button class="tab" data-action="show-rules">公约</button></div><section class="week"><div><p>${date.month} 月 · 第 ${date.week} 周</p><h3>本周值日</h3></div><button>智能均衡排班</button></section><div>${chores}</div><button class="outline" data-action="swap">⇄ 申请换班</button><section class="supply-preview"><div class="section-head"><h2>公共物品</h2><button data-action="show-supplies">查看全部</button></div>${supplies}</section>`; }
function renderMembers() {
  const members = activeResidents(state);
  const canManage = state.household.adminId === me;
  const canTransfer = canManage && members.length > 1;
  const current = members.map((member) => `<article class="member-item"><div class="member-item-head"><h3>${member.name}</h3>${member.id === state.household.adminId ? '<span class="member-admin-badge">管理员</span>' : ''}</div><p>${member.room} · ${member.joinedAt} 入住</p>${canManage ? `<button class="member-action" data-action="move-out-resident" data-id="${member.id}">办理退租</button>` : ''}</article>`).join('');
  const history = state.household.history.length ? state.household.history.map((event) => `<li class="member-event">${event.date} · ${event.type}${event.member ? ` · ${event.member}` : ` · ${event.from} → ${event.to}`}</li>`).join('') : '<li class="member-event">暂无成员变动记录</li>';
  return `<section class="page-title"><div><p class="eyebrow">合租成员</p><h2>成员与邀请</h2></div></section><section class="member-list"><h3>当前入住 · ${members.length} 人</h3>${current}</section>${canManage ? '<button class="primary" data-action="invite-resident">邀请新成员</button>' : ''}${canTransfer ? '<button class="outline" data-action="transfer-admin">转让管理权</button>' : ''}<section class="member-history"><h3>最近变动</h3><ul class="share-list">${history}</ul></section>`;
}
function renderProfile() { return `<section class="profile-card"><span class="profile-avatar">陈</span><div><h3>${houseName()}</h3><p>成员 · 结算日每月 28 日</p></div></section><div class="settings"><button data-action="show-members">成员与邀请 <i>›</i></button><button>默认费用规则 <i>›</i></button><button>通知设置 <i>›</i></button></div><button class="reset" data-action="reset">重置演示数据</button>`; }
function updateHeaderBackLink() {
  const topbar = document.querySelector('.topbar');
  const existing = topbar.querySelector('.back-link');
  if (page === 'members' && !existing) topbar.insertAdjacentHTML('afterbegin', '<button class="back-link" data-action="back-to-profile" aria-label="返回我的">‹ <span>我的</span></button>');
  if (page !== 'members') existing?.remove();
}
function render() { document.querySelector('.phone-shell').classList.toggle('home-only', page === 'home'); app.innerHTML = page === 'home' ? renderHome() : page === 'expenses' ? renderExpenses() : page === 'life' ? renderLife() : page === 'members' ? renderMembers() : renderProfile(); document.querySelector('.topbar-title h1').textContent = houseName(); updateHeaderBackLink(); const statusLink = document.querySelector('.home-status-link'); if (statusLink) { const model = getHomeModelState(state, me); const pendingCount = [model.debt > 0, model.choreId !== null, model.supplyId !== null, model.ruleId !== null].filter(Boolean).length; statusLink.textContent = pendingCount ? `我的状态 · ${pendingCount}` : '我的状态 · 已完成'; statusLink.setAttribute('aria-label', pendingCount ? `查看我的${pendingCount}项待处理事项` : '查看我的待处理事项，当前已完成'); } document.querySelectorAll('[data-page]').forEach(b => b.onclick = () => go(b.dataset.page)); actionButtons(); }
const actions = {
  'back-to-profile'() { go('profile'); },
  'show-members'() { page = 'members'; render(); },
  'transfer-admin'() {
    if (state.household.adminId !== me) return;
    const successors = activeResidents(state).filter((member) => member.id !== me);
    if (!successors.length) return toast('至少需要一位其他当前成员才能转让管理权');
    modal('转让管理权', `<form id="transfer-admin-form"><label for="new-admin-id">接任管理员</label><select id="new-admin-id" name="successorId" required><option value="">请选择</option>${successors.map((member) => `<option value="${member.id}">${member.name} · ${member.room}</option>`).join('')}</select><button class="primary">确认转让管理权</button></form>`);
    document.querySelector('#transfer-admin-form').onsubmit = (event) => {
      event.preventDefault();
      const successorId = new FormData(event.target).get('successorId');
      try { transferAdmin(state, me, successorId, '2026-09-14'); save(); closeModal(); render(); toast('管理权已转让'); } catch (error) { toast(error.message); }
    };
  },
  'invite-resident'() {
    const vacantRooms = rooms.filter((room) => !activeResidents(state).some((member) => member.room === room.name));
    if (!vacantRooms.length) return toast('当前没有空房间可邀请');
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
    if (!member) return;
    const isAdmin = id === state.household.adminId;
    const successors = activeResidents(state).filter((item) => item.id !== id);
    const memberOpenExpenses = state.expenses.filter((expense) => expense.status === 'open' && !expense.paid.includes(member.name) && expense.shares[member.name]);
    const unpaidWarning = memberOpenExpenses.length ? `<p class="helper">未结费用：${memberOpenExpenses.length} 笔，共 ${money(memberOpenExpenses.reduce((total, expense) => total + expense.shares[member.name], 0))}。退租后仍可在历史账单中追溯。</p>` : '';
    modal(`办理${member.name}退租`, `${unpaidWarning}<form id="move-out-form"><label for="move-out-date">生效日期</label><input id="move-out-date" name="date" type="date" required value="2026-09-14">${isAdmin ? `<label for="successor-id">接任管理员</label><select id="successor-id" name="successorId" required><option value="">请选择</option>${successors.map((item) => `<option value="${item.id}">${item.name} · ${item.room}</option>`).join('')}</select>` : ''}<button class="primary">确认办理退租</button></form>`);
    document.querySelector('#move-out-form').onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      try { moveOutResident(state, id, form.get('date'), form.get('successorId')); save(); closeModal(); render(); toast(isAdmin ? '管理权已转让，成员已退租' : '成员已退租'); } catch (error) { toast(error.message); }
    };
  },
  'edit-house'() { modal('编辑合租房名称', `<form id="house-form"><label for="house-name">房名</label><input id="house-name" required name="name" maxlength="24" value="${houseName()}"><button class="primary">保存房名</button></form>`); document.querySelector('#house-form').onsubmit = event => { event.preventDefault(); const name = new FormData(event.target).get('name').trim(); if (!name) return; localStorage.setItem('shared-house-name', name); document.querySelector('.topbar-title h1').textContent = name; closeModal(); toast('房名已更新'); }; },
  'show-resident'(id) {
    const resident = activeResidents(state).find(item => item.id === id);
    if (!resident) return;
    const pending = [];
    if (state.expenses.some(item => item.status === 'open' && !item.paid.includes(resident.name) && item.shares[resident.name])) pending.push('费用分摊');
    if (state.chores.some(item => item.owner === resident.name && !item.done)) pending.push('值日');
    if (state.rules.some(item => !item.confirmed.includes(resident.name))) pending.push('公约确认');
    modal(`${resident.name}的合租信息`, `<dl class="resident-facts"><div><dt>昵称</dt><dd>${resident.name}</dd></div><div><dt>房间</dt><dd>${resident.room}</dd></div><div><dt>共享居住状态</dt><dd>已入住 · 共同居住中</dd></div><div><dt>待处理摘要</dt><dd>${pending.length ? pending.join('、') : '暂无待处理事项'}</dd></div></dl>`);
  },
  'show-member-status'() { const model = getHomeModelState(state, me); const chore = state.chores.find(x => x.id === model.choreId); const rule = state.rules.find(x => x.id === model.ruleId); modal('小陈的当前状态', `<p class="helper">${model.debt ? `当前待付款：${money(model.debt)}` : '当前没有待付款费用'}。</p><p class="helper">${chore ? `未完成值日：${chore.name}` : '当前没有未完成值日'}。</p><p class="helper">${rule ? `待确认公约：《${rule.title}》` : '当前没有待确认公约'}。</p>`); },
  'open-pending'() { const model = getHomeModelState(state, me); const chore = state.chores.find(x => x.id === model.choreId); const rule = state.rules.find(x => x.id === model.ruleId); const facts = [`${model.debt ? `待付款费用：${money(model.debt)}` : ''}`, `${chore ? `未完成值日：${chore.name}` : ''}`, `${rule ? `待确认公约：《${rule.title}》` : ''}`].filter(Boolean); modal('当前待处理事项', facts.length ? `<ul class="share-list">${facts.map(fact => `<li><span>${fact}</span></li>`).join('')}</ul>` : '<p class="helper">当前没有待处理事项。</p>'); },
  pay() {
    const x = openExpenses().find(x => !x.paid.includes(me));
    if (!x) return modal('确认已转账', '<p class="helper">当前没有待付款账单，所有费用都已处理完成。</p>');
    modal('确认已转账', `<p class="helper">请在线下完成转账后，再标记这笔费用。付款人将收到确认提醒。</p><div class="amount">${x.name}<strong>${money(x.shares[me])}</strong></div><button class="primary" id="confirm">我已转账</button>`);
    document.querySelector('#confirm').onclick = () => { if (!x.paid.includes(me)) x.paid.push(me); save(); closeModal(); render(); toast('已标记转账，等待小王确认收款'); };
  },
  chore(id) { const x = state.chores.find(x => x.id == id); x.done = true; save(); render(); toast('已完成厨房清洁，感谢照顾共同空间'); },
  claim(id) { const x = state.supplies.find(x => x.id == id); x.claimed = true; save(); render(); toast(`已认领 ${x.name} 补货，其他室友不会再收到提醒`); modal('购买完成后', `<p class="helper">补货后可把购买记录一键带入 AA 账单。</p><button class="primary" id="purchase">我已经买好了</button>`); document.querySelector('#purchase').onclick = () => purchase(x); },
  rule(id) { const x = state.rules.find(x => x.id == id); const residentCount = activeResidents(state).length; if (x.confirmed.includes(me)) return modal('确认公约', `<p class="rule-text">${x.text}</p><p class="progress">你已确认 · 共 ${x.confirmed.length}/${residentCount} 位成员确认</p>`); modal('确认公约', `<p class="rule-text">${x.text}</p><p class="progress">已有 ${x.confirmed.length}/${residentCount} 位成员确认</p><button class="primary" id="confirm">我已阅读并确认</button>`); document.querySelector('#confirm').onclick = () => { if (!x.confirmed.includes(me)) x.confirmed.push(me); save(); closeModal(); render(); toast('公约已确认，感谢共同维护舒适的家'); }; },
  detail(id) { const x = state.expenses.find(x => x.id == id); const rows = Object.entries(x.shares).map(([name, value]) => `<li><span>${name}${name===x.payer?'（垫付）':''}</span><b>${money(value)}</b><small>${x.paid.includes(name)||name===x.payer?'已结清':'待付款'}</small></li>`).join(''); modal(x.name, `<div class="amount">${x.payer}垫付<strong>${money(x.amount)}</strong></div><ul class="share-list">${rows}</ul>${!x.paid.includes(me) ? '<button class="primary" id="confirm">我已转账</button>' : ''}`); const b=document.querySelector('#confirm'); if(b) b.onclick=()=>{x.paid.push(me);save();closeModal();render();toast('已标记转账');}; },
  'add-expense'() { const members = activeResidents(state); modal('记一笔公共费用', `<form id="expense-form"><label for="expense-name">账单名称</label><input id="expense-name" required name="name" placeholder="例如：9 月网费"><label for="expense-amount">金额</label><input id="expense-amount" required name="amount" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="0.00"><label for="expense-payer">付款人</label><select id="expense-payer" name="payer">${members.map((member) => `<option>${member.name}</option>`).join('')}</select><label for="expense-split">分摊方式</label><select id="expense-split" name="split"><option value="equal">${members.length} 人均分</option></select><button class="primary">预览并发布</button></form>`); document.querySelector('#expense-form').onsubmit=e=>{e.preventDefault(); const f=new FormData(e.target), amount=Number(f.get('amount')), shares=Object.fromEntries(members.map((member) => [member.name, amount / members.length]));state.expenses.unshift({id:Date.now(),name:f.get('name'),amount,payer:f.get('payer'),category:'其他',status:'open',paid:[],shares,date:'2026-09-12'});save();closeModal();go('expenses');toast('账单已发布，室友可查看应付金额');}; },
  'show-supplies'() { modal('公共物品', state.supplies.map(x=>`<div class="supply modal-supply"><span class="supply-pic">${x.name==='纸巾'?'▤':'◒'}</span><div><h3>${x.name}</h3><p>剩余 ${x.quantity} ${x.unit} · 阈值 ${x.threshold} ${x.unit}</p></div><span class="stock ${x.quantity<=x.threshold?'low':''}">${x.quantity<=x.threshold?'待补货':'充足'}</span></div>`).join('')); },
  'show-rules'() { const x=state.rules[0]; modal('编辑室友公约', `<form id="rule-form"><label for="rule-version">版本</label><input id="rule-version" name="version" value="${x.version || 'V2'}" maxlength="12"><label for="rule-title">公约标题</label><input id="rule-title" required name="title" value="${x.title}"><label for="rule-text">公约内容</label><textarea id="rule-text" required name="text" rows="4">${x.text}</textarea><label for="rule-progress">确认进度</label><input id="rule-progress" name="progress" value="${x.confirmed.join('、')}" placeholder="例如：小王、小陈"><button class="primary">保存公约</button></form>`); document.querySelector('#rule-form').onsubmit = event => { event.preventDefault(); const form = new FormData(event.target); x.version = form.get('version').trim() || 'V2'; x.title = form.get('title').trim(); x.text = form.get('text').trim(); x.confirmed = form.get('progress').split('、').map(name => name.trim()).filter(Boolean); save(); closeModal(); render(); toast('公约内容已更新'); }; },
  swap() { const others = activeResidents(state).filter((member) => member.name !== me); modal('申请换班', `<p class="helper">由接班人确认后，才会更新本周排班。</p><label>换给<select>${others.map((member) => `<option>${member.name}</option>`).join('')}</select></label><button class="primary" id="confirm">发送换班请求</button>`); document.querySelector('#confirm').onclick=()=>{closeModal();toast('换班请求已发送，等待室友确认');}; },
  reset() { localStorage.removeItem('shared-home-state'); state=createInitialState(); render(); toast('演示数据已重置'); }
};
function purchase(x) { modal('记录补货', `<form id="purchase-form"><label for="purchase-quantity">购买数量</label><input id="purchase-quantity" name="quantity" type="number" inputmode="numeric" value="4" min="1"><label for="purchase-amount">实际花费</label><input id="purchase-amount" name="amount" type="number" inputmode="decimal" value="24" min="0.01" step="0.01"><button class="primary">更新库存并生成 AA 账单</button></form>`); document.querySelector('#purchase-form').onsubmit=e=>{e.preventDefault(); const f=new FormData(e.target), amount=Number(f.get('amount')), members=activeResidents(state), shares=Object.fromEntries(members.map((member) => [member.name, amount / members.length])); x.quantity=Number(f.get('quantity'));x.claimed=false;x.history.unshift({amount,date:'2026-09-12'});state.expenses.unshift({id:Date.now(),name:`${x.name}补货`,amount,payer:me,category:'公共采购',status:'open',paid:[],shares,date:'2026-09-12'});save();closeModal();go('expenses');toast('库存已更新，AA 账单已生成');}; }
render();
