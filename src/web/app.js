const api = {
  list: () => fetch('/api/tasks').then((r) => r.json()),
  create: (body) =>
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then((r) => r.json()),
  update: (id, body) =>
    fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then((r) => r.json()),
  delete: (id) =>
    fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    }).then((r) => r.json())
};

const state = {
  tasks: [],
  selected: null,
  filterPhase: 'all',
  search: '',
  currentView: 'list',
  customOrder: {}, // 自定义排序 {taskId: orderIndex}
  dragState: null, // 当前拖拽状态
  areaOptions: JSON.parse(localStorage.getItem('areaOptions')) || ['general', 'work', 'life', 'study', 'finance', 'creativity']
};

const elements = {
  taskList: document.getElementById('taskList'),
  kanbanView: document.getElementById('kanbanView'),
  matrixView: document.getElementById('matrixView'),
  depsView: document.getElementById('depsView'),
  depsSvg: document.getElementById('depsSvg'),
  scheduleView: document.getElementById('scheduleView'),
  habitView: document.getElementById('habitView'),
  summaryView: document.getElementById('summaryView'),
  historyView: document.getElementById('historyView'),
  viewTabs: Array.from(document.querySelectorAll('.view-tabs .tab')),
  refreshBtn: document.getElementById('refreshBtn'),
  newBtn: document.getElementById('newBtn'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  taskForm: document.getElementById('taskForm'),
  closeModal: document.getElementById('closeModal'),
  cancelBtn: document.getElementById('cancelBtn'),
  filterPhase: document.getElementById('filterPhase'),
  search: document.getElementById('search'),
  taskDetail: document.getElementById('taskDetail'),
  detailTitle: document.getElementById('detailTitle'),
  detailMeta: document.getElementById('detailMeta'),
  detailDesc: document.getElementById('detailDesc'),
  editBtn: document.getElementById('editBtn'),
  completeBtn: document.getElementById('completeBtn'),
  deleteBtn: document.getElementById('deleteBtn')
};

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

function translateLabel(key, value) {
  if (!value) return '-';
  
  const translations = {
    priority: {
      none: '无',
      low: '🟢 低',
      medium: '🔵 中',
      high: '🟠 高',
      urgent: '🔴 紧急'
    },
    phase: {
      collect: '📥 收集',
      process: '⚙️ 处理',
      do: '▶️ 执行',
      wait: '⏳ 等待',
      review: '🔍 回顾',
      archive: '📦 归档'
    },
    type: {
      single: '📋 单次',
      recurring: '🔄 周期',
      condition: '⚡ 条件',
      habit: '🎯 习惯'
    },
    area: {
      general: '📌 通用',
      work: '💼 工作',
      life: '🏠 生活',
      study: '📚 学习',
      finance: '💰 财务',
      creativity: '🎨 创作'
    },
    blocked: {
      none: '无关系',
      blocked: '🔴 被阻塞',
      blocking: '⚡ 阻塞他人'
    }
  };
  
  return translations[key]?.[value] || value;
}

// Drag and Drop Functions
function initDragAndDrop() {
  // 拖拽事件现在在renderTaskCard中添加
}

function handleDragEnd(e) {
  // 拖拽结束处理现在在卡片事件中
  state.dragState = null;
}

function updateCustomOrder(draggedId, targetId) {
  const tasks = state.tasks;
  const draggedTask = tasks.find(t => t.id === draggedId);
  const targetTask = tasks.find(t => t.id === targetId);
  
  if (!draggedTask || !targetTask) return;
  
  // 获取当前排序
  const draggedOrder = state.customOrder[draggedId] || 999999;
  const targetOrder = state.customOrder[targetId] || 999999;
  
  // 如果都是默认值，重新分配当前视图的任务排序
  if (draggedOrder === 999999 && targetOrder === 999999) {
    const currentViewTasks = getCurrentViewTasks();
    currentViewTasks.forEach((task, index) => {
      state.customOrder[task.id] = index;
    });
  }
  
  // 交换排序值
  const temp = state.customOrder[draggedId];
  state.customOrder[draggedId] = state.customOrder[targetId];
  state.customOrder[targetId] = temp;
  
  console.log('更新排序后:', state.customOrder);
  
  // 保存到localStorage
  localStorage.setItem('omniplan-custom-order', JSON.stringify(state.customOrder));
}

function getCurrentViewTasks() {
  const filtered = filterTasks(state.tasks);
  return sortTasksWithCustomOrder(filtered);
}

function loadCustomOrder() {
  try {
    const saved = localStorage.getItem('omniplan-custom-order');
    if (saved) {
      state.customOrder = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load custom order:', e);
  }
}

function sortTasksWithCustomOrder(tasks) {
  return [...tasks].sort((a, b) => {
    const aOrder = state.customOrder[a.id] || 999999;
    const bOrder = state.customOrder[b.id] || 999999;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // 如果排序相同，按创建时间倒序
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

function renderBadge(text, variant = '') {
  const span = document.createElement('span');
  span.className = `badge ${variant}`.trim();
  span.textContent = text;
  return span;
}

function renderTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.dataset.id = task.id;
  card.setAttribute('draggable', 'true');

  const title = document.createElement('h3');
  title.textContent = task.title || '(无标题)';
  card.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.appendChild(renderBadge(translateLabel('priority', task.urgency?.priority || 'none'), task.urgency?.priority));
  meta.appendChild(renderBadge(translateLabel('phase', task.status?.phase || 'collect'), task.status?.phase));

  const due = document.createElement('span');
  due.textContent = `截止：${formatDate(task.time?.dueDate)}`;
  meta.appendChild(due);

  if (task.category?.area) {
    const area = document.createElement('span');
    area.textContent = `${translateLabel('area', task.category.area)}`;
    meta.appendChild(area);
  }

  card.appendChild(meta);

  let isDragging = false;

  card.addEventListener('dragstart', (e) => {
    console.log('卡片开始拖拽:', card.dataset.id);
    isDragging = true;
    state.dragState = {
      taskId: card.dataset.id,
      startIndex: Array.from(card.parentNode.children).indexOf(card)
    };
    
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.dataset.id);
    e.dataTransfer.setData('text/html', card.outerHTML);
    e.dataTransfer.setDragImage(card, 0, 0);
  });

  card.addEventListener('dragend', (e) => {
    console.log('拖拽结束');
    isDragging = false;
    card.classList.remove('dragging');
    // 清除所有drag-over状态
    document.querySelectorAll('.task-card.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    console.log('拖拽悬停在:', card.dataset.id);
    
    if (card.dataset.id !== state.dragState?.taskId) {
      // 清除之前的drag-over
      document.querySelectorAll('.task-card.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      
      card.classList.add('drag-over');
    }
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    
    const targetId = card.dataset.id;
    console.log('drop事件, targetId:', targetId, 'dragState:', state.dragState);
    
    if (targetId === state.dragState?.taskId) return;
    
    console.log('放置到:', targetId);
    // 更新自定义排序
    updateCustomOrder(state.dragState.taskId, targetId);
    
    // 重新渲染当前视图
    render();
  });

  card.addEventListener('click', () => {
    if (!isDragging) {
      selectTask(task.id);
    }
  });

  return card;
}

function filterTasks(tasks) {
  const phase = state.filterPhase;
  const search = state.search.trim().toLowerCase();
  return tasks.filter((t) => {
    // 默认情况下排除已完成的任务
    if (phase === 'all' && t.status?.phase === 'archive') return false;
    if (phase !== 'all' && t.status?.phase !== phase) return false;
    if (!search) return true;
    const text = `${t.title} ${t.description} ${(t.category?.tags || []).join(' ')}`.toLowerCase();
    return text.includes(search);
  });
}

function render() {
  const filtered = filterTasks(state.tasks);
  renderTabs();

  elements.taskList.hidden = state.currentView !== 'list';
  elements.kanbanView.hidden = state.currentView !== 'kanban';
  elements.matrixView.hidden = state.currentView !== 'matrix';
  elements.depsView.hidden = state.currentView !== 'deps';
  elements.scheduleView.hidden = state.currentView !== 'schedule';
  elements.habitView.hidden = state.currentView !== 'habit';
  elements.summaryView.hidden = state.currentView !== 'summary';
  elements.historyView.hidden = state.currentView !== 'history';

  renderListView(filtered);
  renderKanbanView(filtered);
  renderMatrixView(filtered);
  renderDepsView(filtered);
  renderScheduleView(filtered);
  renderHabitView(filtered);
  renderSummaryView(filtered);
  renderHistoryView(filtered);

  renderDetail();
}

function renderTabs() {
  elements.viewTabs.forEach((tab) => {
    tab.classList.toggle('current', tab.dataset.view === state.currentView);
  });
}

function renderListView(filtered) {
  elements.taskList.innerHTML = '';
  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'task-card';
    empty.textContent = '暂无任务，点击“新建任务”开始。';
    elements.taskList.appendChild(empty);
    return;
  }

  // 使用自定义排序
  const sortedTasks = sortTasksWithCustomOrder(filtered);
  
  sortedTasks.forEach((task) => {
    elements.taskList.appendChild(renderTaskCard(task));
  });
}

function renderKanbanView(filtered) {
  const lanes = {
    collect: [],
    process: [],
    do: [],
    wait: []
  };
  filtered.forEach((t) => {
    const key = t.status?.phase;
    if (lanes[key]) lanes[key].push(t);
  });

  elements.kanbanView.innerHTML = '';
  Object.entries(lanes).forEach(([key, tasks]) => {
    const col = document.createElement('div');
    col.className = 'kanban-column';
    const header = document.createElement('h3');
    header.textContent = `${translateLabel('phase', key)} (${tasks.length})`;
    col.appendChild(header);

    const body = document.createElement('div');
    body.className = 'column-body';
    if (tasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'task-card';
      empty.textContent = '暂无任务';
      body.appendChild(empty);
    } else {
      // 为每个列使用自定义排序
      const sortedTasks = sortTasksWithCustomOrder(tasks);
      sortedTasks.forEach((task) => {
        const card = renderTaskCard(task);
        body.appendChild(card);
      });
    }
    col.appendChild(body);
    elements.kanbanView.appendChild(col);
  });
}

function renderMatrixView(filtered) {
  const cells = {
    urgentImportant: [],
    urgentNotImportant: [],
    notUrgentImportant: [],
    notUrgentNotImportant: []
  };

  filtered.forEach((task) => {
    const urgent = ['urgent', 'high'].includes(task.urgency?.priority);
    const important = ['do', 'review'].includes(task.status?.phase);
    if (urgent && important) cells.urgentImportant.push(task);
    else if (urgent && !important) cells.urgentNotImportant.push(task);
    else if (!urgent && important) cells.notUrgentImportant.push(task);
    else cells.notUrgentNotImportant.push(task);
  });

  const renderCell = (title, tasks) => {
    const cell = document.createElement('div');
    cell.className = 'matrix-cell';
    const heading = document.createElement('h3');
    heading.textContent = title;
    cell.appendChild(heading);
    const list = document.createElement('div');
    list.className = 'cell-list';
    if (tasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'task-card';
      empty.textContent = '暂无任务';
      list.appendChild(empty);
    } else {
      // 为每个象限使用自定义排序
      const sortedTasks = sortTasksWithCustomOrder(tasks);
      sortedTasks.forEach((task) => {
        const card = renderTaskCard(task);
        list.appendChild(card);
      });
    }
    cell.appendChild(list);
    return cell;
  };

  elements.matrixView.innerHTML = '';
  elements.matrixView.appendChild(renderCell('紧急且重要', cells.urgentImportant));
  elements.matrixView.appendChild(renderCell('紧急但不重要', cells.urgentNotImportant));
  elements.matrixView.appendChild(renderCell('重要但不紧急', cells.notUrgentImportant));
  elements.matrixView.appendChild(renderCell('不重要也不紧急', cells.notUrgentNotImportant));
}

function renderDepsView(filtered) {
  const tasks = filtered;
  const nodes = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    parentId: t.parentId,
    blocked: isBlocked(t, tasks),
    completed: t.status?.phase === 'archive'
  }));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const roots = nodes.filter((n) => !n.parentId || !byId[n.parentId]);

  const layout = [];
  const spacingX = 320;
  const spacingY = 160;

  function traverse(node, depth, index) {
    const x = index * spacingX + 60;
    const y = depth * spacingY + 60;
    layout.push({ node, x, y });
    const children = nodes.filter((n) => n.parentId === node.id);
    children.forEach((child, idx) => {
      traverse(child, depth + 1, index + idx);
    });
  }

  roots.forEach((root, idx) => traverse(root, 0, idx));

  const width = Math.max(1000, (Math.max(...layout.map((l) => l.x)) || 0) + 380);
  const height = Math.max(680, (Math.max(...layout.map((l) => l.y)) || 0) + 280);

  const svg = elements.depsSvg;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.innerHTML = '';

  layout.forEach((item) => {
    const children = nodes.filter((n) => n.parentId === item.node.id);
    children.forEach((child) => {
      const to = layout.find((l) => l.node.id === child.id);
      if (!to) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', item.x + 140);
      line.setAttribute('y1', item.y + 90);
      line.setAttribute('x2', to.x + 140);
      line.setAttribute('y2', to.y);
      line.setAttribute('stroke', child.blocked ? 'rgba(255,99,132,0.7)' : 'rgba(255,255,255,0.35)');
      line.setAttribute('stroke-width', '2.5');
      line.setAttribute('stroke-dasharray', child.blocked ? '8 5' : '');
      svg.appendChild(line);
    });
  });

  layout.forEach((item) => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', item.x);
    rect.setAttribute('y', item.y);
    rect.setAttribute('width', 280);
    rect.setAttribute('height', 90);
    rect.setAttribute('rx', 16);
    rect.setAttribute('ry', 16);
    rect.setAttribute('fill', item.node.completed ? 'rgba(86,211,100,0.15)' : 'rgba(255,255,255,0.05)');
    rect.setAttribute('stroke', item.node.blocked ? 'rgba(255, 99, 132, 0.7)' : 'rgba(255,255,255,0.12)');
    rect.setAttribute('stroke-width', '2');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', item.x + 16);
    text.setAttribute('y', item.y + 32);
    text.setAttribute('fill', 'rgba(255,255,255,0.88)');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', 'bold');
    text.textContent = (item.node.title || '(无标题)').substring(0, 20);

    if (item.node.blocked) {
      const blocked = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      blocked.setAttribute('x', item.x + 16);
      blocked.setAttribute('y', item.y + 60);
      blocked.setAttribute('fill', 'rgba(255,99,132,0.9)');
      blocked.setAttribute('font-size', '14');
      blocked.textContent = '🔴 阻塞中';
      group.appendChild(blocked);
    }

    group.appendChild(rect);
    group.appendChild(text);

    group.addEventListener('click', () => {
      selectTask(item.node.id);
    });

    svg.appendChild(group);
  });
}

function isBlocked(task, allTasks) {
  if (task.resources?.blockedReason) return true;
  const byId = Object.fromEntries(allTasks.map((t) => [t.id, t]));
  let current = task;
  while (current?.parentId) {
    const parent = byId[current.parentId];
    if (!parent) break;
    if (parent.status?.phase !== 'archive') return true;
    current = parent;
  }
  return false;
}

function sortByPriorityEnergyAndDue(tasks) {
  const priorityOrder = ['urgent', 'high', 'medium', 'low', 'none'];
  const energyOrder = ['low', 'medium', 'high'];
  return [...tasks].sort((a, b) => {
    const pa = priorityOrder.indexOf(a.urgency?.priority || 'none');
    const pb = priorityOrder.indexOf(b.urgency?.priority || 'none');
    if (pa !== pb) return pa - pb;

    const ea = energyOrder.indexOf(a.urgency?.energy || 'medium');
    const eb = energyOrder.indexOf(b.urgency?.energy || 'medium');
    if (ea !== eb) return ea - eb;

    const da = a.time?.dueDate ? new Date(a.time.dueDate).getTime() : Infinity;
    const db = b.time?.dueDate ? new Date(b.time.dueDate).getTime() : Infinity;
    return da - db;
  });
}

function createCompletionUpdate(task) {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  if (task.time?.type === 'habit') {
    const lastDone = task.time?.lastDone ? new Date(task.time.lastDone) : null;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const isYesterday = lastDone &&
      lastDone.getFullYear() === yesterday.getFullYear() &&
      lastDone.getMonth() === yesterday.getMonth() &&
      lastDone.getDate() === yesterday.getDate();

    const streak = isYesterday ? (task.status?.progress || 0) + 1 : 1;
    return {
      time: { ...task.time, lastDone: todayKey },
      status: { ...task.status, phase: 'do', progress: streak }
    };
  }

  if (task.time?.type === 'recurring') {
    const due = task.time?.dueDate ? new Date(task.time.dueDate) : null;
    let next = due;
    if (due && task.time?.recurrence) {
      next = new Date(due);
      switch (task.time.recurrence) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
      }
    }
    return {
      time: { ...task.time, dueDate: next ? next.toISOString() : task.time.dueDate },
      status: { ...task.status, phase: 'do', progress: 0 }
    };
  }

  return { status: { ...task.status, phase: 'archive', progress: 100 } };
}

function renderScheduleView(filtered) {
  const tasks = filtered.filter((t) => t.status?.phase !== 'archive' && t.time?.type !== 'habit');
  const today = new Date();
  const inWindow = tasks.filter((t) => {
    if (!t.time?.dueDate) return true;
    const due = new Date(t.time.dueDate);
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    return diff >= -1 && diff <= 7;
  });

  const blocked = inWindow.filter((t) => isBlocked(t, filtered));
  const candidates = inWindow.filter((t) => !isBlocked(t, filtered));

  const suggested = sortByPriorityEnergyAndDue(candidates).slice(0, 8);

  elements.scheduleView.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<h2>今日建议</h2><p>基于截止日期、优先级、能量匹配（默认：中）和阻塞情况。</p>`;
  elements.scheduleView.appendChild(header);

  const list = document.createElement('div');
  list.className = 'tasklist';
  if (suggested.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'task-card';
    empty.textContent = '暂无推荐任务：检查过滤条件或添加任务吧。';
    list.appendChild(empty);
  } else {
    suggested.forEach((task) => {
      const card = renderTaskCard(task);
      list.appendChild(card);
    });
  }
  elements.scheduleView.appendChild(list);

  if (blocked.length > 0) {
    const blk = document.createElement('div');
    blk.className = 'panel';
    blk.innerHTML = `<h3>当前被阻塞</h3><p>部分任务由于依赖未完成或标记阻塞，建议先解除阻塞。</p>`;
    const bList = document.createElement('div');
    bList.className = 'tasklist';
    blocked.forEach((task) => {
      const card = renderTaskCard(task);
      bList.appendChild(card);
    });
    blk.appendChild(bList);
    elements.scheduleView.appendChild(blk);
  }
}

function renderHabitView(filtered) {
  const habits = filtered.filter((t) => t.time?.type === 'habit');
  elements.habitView.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<h2>习惯打卡</h2><p>记录每日打卡，查看连续完成情况。</p>`;
  elements.habitView.appendChild(header);

  if (habits.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'task-card';
    empty.textContent = '暂无习惯任务，创建一个“类型=习惯”的任务开始。';
    elements.habitView.appendChild(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'tasklist';

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  habits.forEach((task) => {
    const card = document.createElement('div');
    card.className = 'task-card';

    const title = document.createElement('h3');
    title.textContent = task.title || '(无标题)';
    card.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const streak = task.status?.progress || 0;
    const lastDone = task.time?.lastDone ? task.time.lastDone.slice(0, 10) : '-';
    meta.appendChild(renderBadge(`打卡: ${lastDone}`));
    meta.appendChild(renderBadge(`连胜: ${streak} 天`));
    meta.appendChild(renderBadge(`时间窗: ${task.time?.habitWindow || '-'}`));
    card.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'detail-row';

    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn primary';
    checkBtn.textContent = '打卡';
    checkBtn.addEventListener('click', () => {
      const last = task.time?.lastDone ? new Date(task.time.lastDone) : null;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = last &&
        last.getFullYear() === yesterday.getFullYear() &&
        last.getMonth() === yesterday.getMonth() &&
        last.getDate() === yesterday.getDate();
      const newStreak = isYesterday ? (task.status?.progress || 0) + 1 : 1;
      api
        .update(task.id, {
          time: { ...task.time, lastDone: todayKey },
          status: { ...task.status, phase: 'do', progress: newStreak }
        })
        .then(() => loadTasks());
    });

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.textContent = '重置';
    resetBtn.addEventListener('click', () => {
      if (!confirm('重置打卡连胜？')) return;
      api
        .update(task.id, {
          time: { ...task.time, lastDone: null },
          status: { ...task.status, progress: 0 }
        })
        .then(() => loadTasks());
    });

    actions.appendChild(checkBtn);
    actions.appendChild(resetBtn);
    card.appendChild(actions);

    list.appendChild(card);
  });

  elements.habitView.appendChild(list);
}

function renderSummaryView(filtered) {
  elements.summaryView.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<h2>任务汇总</h2><p>按月和按年查看任务统计。</p>`;
  
  // 添加详情按钮
  const detailBtn = document.createElement('button');
  detailBtn.className = 'btn';
  detailBtn.textContent = '查看详情';
  detailBtn.addEventListener('click', () => {
    let table = elements.summaryView.querySelector('.summary-table');
    if (table) {
      table.classList.toggle('hidden');
      detailBtn.textContent = table.classList.contains('hidden') ? '查看详情' : '隐藏详情';
    } else {
      renderSummaryTable();
      detailBtn.textContent = '隐藏详情';
    }
  });
  header.appendChild(detailBtn);
  
  elements.summaryView.appendChild(header);

  // 按年月分组任务
  const monthlyStats = {};
  const yearlyStats = {};

  filtered.forEach((task) => {
    const created = task.createdAt ? new Date(task.createdAt) : new Date();
    const year = created.getFullYear();
    const month = created.getMonth() + 1;
    const key = `${year}-${month.toString().padStart(2, '0')}`;

    if (!monthlyStats[key]) {
      monthlyStats[key] = { total: 0, completed: 0, year, month };
    }
    monthlyStats[key].total++;
    if (task.status?.phase === 'archive') {
      monthlyStats[key].completed++;
    }

    if (!yearlyStats[year]) {
      yearlyStats[year] = { total: 0, completed: 0 };
    }
    yearlyStats[year].total++;
    if (task.status?.phase === 'archive') {
      yearlyStats[year].completed++;
    }
  });

  // 按年显示
  const years = Object.keys(yearlyStats).sort((a, b) => b - a);
  years.forEach((year) => {
    const yearDiv = document.createElement('div');
    yearDiv.className = 'summary-year';
    yearDiv.innerHTML = `<h3>${year} 年</h3>`;

    const stat = yearlyStats[year];
    const completionRate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
    yearDiv.innerHTML += `<p>总任务: ${stat.total} | 完成: ${stat.completed} (${completionRate}%)</p>`;

    // 该年的月份
    const months = Object.keys(monthlyStats).filter(k => k.startsWith(`${year}-`)).sort();
    months.forEach((key) => {
      const mStat = monthlyStats[key];
      const mCompletionRate = mStat.total > 0 ? Math.round((mStat.completed / mStat.total) * 100) : 0;
      const monthDiv = document.createElement('div');
      monthDiv.className = 'summary-month';
      monthDiv.innerHTML = `<strong>${mStat.month} 月:</strong> ${mStat.total} 任务, 完成 ${mStat.completed} (${mCompletionRate}%)`;
      yearDiv.appendChild(monthDiv);
    });

    elements.summaryView.appendChild(yearDiv);
  });

  if (years.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'task-card';
    empty.textContent = '暂无任务数据。';
    elements.summaryView.appendChild(empty);
  }
}

function renderSummaryTable() {
  // 检查是否已存在表格
  let tableContainer = elements.summaryView.querySelector('.summary-table');
  if (tableContainer) {
    tableContainer.classList.remove('hidden');
    return;
  }

  tableContainer = document.createElement('div');
  tableContainer.className = 'summary-table';

  const tableHeader = document.createElement('div');
  tableHeader.className = 'table-header';
  tableHeader.innerHTML = `
    <h3>任务详情表格</h3>
    <button id="exportBtn" class="btn primary">导出为Excel</button>
  `;
  tableContainer.appendChild(tableHeader);

  const table = document.createElement('table');
  table.className = 'data-table';

  // 表头
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>标题</th>
      <th>描述</th>
      <th>优先级</th>
      <th>阶段</th>
      <th>领域</th>
      <th>标签</th>
      <th>截止日期</th>
      <th>创建时间</th>
      <th>更新时间</th>
      <th>完成状态</th>
    </tr>
  `;
  table.appendChild(thead);

  // 表体
  const tbody = document.createElement('tbody');
  state.tasks.forEach((task) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${task.title || ''}</td>
      <td>${task.description || ''}</td>
      <td>${translateLabel('priority', task.urgency?.priority || 'none')}</td>
      <td>${translateLabel('phase', task.status?.phase || 'collect')}</td>
      <td>${translateLabel('area', task.category?.area || 'general')}</td>
      <td>${(task.category?.tags || []).join(', ')}</td>
      <td>${formatDate(task.time?.dueDate)}</td>
      <td>${formatDate(task.createdAt)}</td>
      <td>${formatDate(task.updatedAt)}</td>
      <td>${task.status?.phase === 'archive' ? '已完成' : '进行中'}</td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  tableContainer.appendChild(table);
  elements.summaryView.appendChild(tableContainer);

  // 绑定导出按钮事件
  const exportBtn = tableContainer.querySelector('#exportBtn');
  exportBtn.addEventListener('click', () => exportToExcel());
}

function exportToExcel() {
  const table = elements.summaryView.querySelector('.data-table');
  if (!table) return;

  let csv = [];
  const rows = table.querySelectorAll('tr');
  
  for (let i = 0; i < rows.length; i++) {
    const row = [];
    const cols = rows[i].querySelectorAll('td, th');
    
    for (let j = 0; j < cols.length; j++) {
      row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"');
    }
    
    csv.push(row.join(','));
  }

  const csvContent = csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tasks.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function renderHistoryView(filtered) {
  elements.historyView.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'panel';
  header.innerHTML = `<h2>历史任务</h2><p>已完成的任务，按周分组展示。</p>`;
  elements.historyView.appendChild(header);

  // 过滤已完成任务
  const completedTasks = state.tasks.filter(task => task.status?.phase === 'archive');

  if (completedTasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'task-card';
    empty.textContent = '暂无已完成任务。';
    elements.historyView.appendChild(empty);
    return;
  }

  // 按周分组 (周一到周日为一周)
  const weeklyGroups = {};

  completedTasks.forEach((task) => {
    const completedDate = task.updatedAt ? new Date(task.updatedAt) : new Date();
    const year = completedDate.getFullYear();
    const month = completedDate.getMonth();
    const day = completedDate.getDate();
    
    // 计算本周的周一日期
    const weekStart = new Date(year, month, day - completedDate.getDay() + 1);
    const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    
    if (!weeklyGroups[weekKey]) {
      weeklyGroups[weekKey] = [];
    }
    weeklyGroups[weekKey].push(task);
  });

  // 按周排序（最新的在前面）
  const sortedWeeks = Object.keys(weeklyGroups).sort((a, b) => new Date(b) - new Date(a));

  sortedWeeks.forEach((weekKey) => {
    const weekTasks = weeklyGroups[weekKey];
    const weekStart = new Date(weekKey);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekDiv = document.createElement('div');
    weekDiv.className = 'history-week';
    weekDiv.innerHTML = `<h3>${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日 (${weekTasks.length}个任务)</h3>`;
    
    const taskList = document.createElement('div');
    taskList.className = 'tasklist';
    
    weekTasks.forEach((task) => {
      const card = document.createElement('div');
      card.className = 'task-card completed';
      
      const title = document.createElement('h3');
      title.textContent = task.title || '(无标题)';
      card.appendChild(title);
      
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.appendChild(renderBadge(`完成时间: ${formatDate(task.updatedAt)}`, 'completed'));
      meta.appendChild(renderBadge(translateLabel('priority', task.urgency?.priority || 'none'), task.urgency?.priority));
      meta.appendChild(renderBadge(translateLabel('area', task.category?.area || 'general'), ''));
      
      card.appendChild(meta);
      
      taskList.appendChild(card);
    });
    
    weekDiv.appendChild(taskList);
    elements.historyView.appendChild(weekDiv);
  });
}

function selectTask(id) {
  console.log('选择任务:', id);
  state.selected = state.tasks.find((t) => t.id === id) || null;
  console.log('设置selected为:', state.selected);
  renderDetail();
}

function renderDetail() {
  const task = state.selected;
  elements.detailTitle.textContent = task ? (task.title || '(无标题)') : '（选择任务）';
  elements.detailMeta.innerHTML = '';
  elements.detailDesc.textContent = task ? (task.description || '（无描述）') : '';
  
  if (!task) return;

  elements.detailMeta.appendChild(renderBadge(translateLabel('priority', task.urgency?.priority || 'none'), task.urgency?.priority));
  elements.detailMeta.appendChild(renderBadge(translateLabel('phase', task.status?.phase || 'collect'), task.status?.phase));
  elements.detailMeta.appendChild(renderBadge(`截止：${formatDate(task.time?.dueDate)}`, ''));
  elements.detailMeta.appendChild(renderBadge(`${translateLabel('area', task.category?.area || 'general')}`, ''));
}

function selectTagInSelector(selectorElement, value) {
  const buttons = selectorElement.querySelectorAll('.tag');
  let foundMatch = false;
  
  buttons.forEach((btn) => {
    if (btn.dataset.value === value) {
      btn.classList.add('selected');
      foundMatch = true;
    } else {
      btn.classList.remove('selected');
    }
  });
  
  // Update hidden input
  const hiddenInput = selectorElement.nextElementSibling;
  if (hiddenInput && hiddenInput.type === 'hidden') {
    hiddenInput.value = value;
  }
  
  return foundMatch;
}

function openModal(task = null) {
  elements.modal.hidden = false;
  elements.modalTitle.textContent = task ? '编辑任务' : '新建任务';
  const form = elements.taskForm;
  form.reset();

  // Initialize tag selectors
  const tagSelectors = form.querySelectorAll('.tag-selector');
  tagSelectors.forEach((selector) => {
    const field = selector.dataset.field;
    const hiddenInput = selector.nextElementSibling;
    
    selector.querySelectorAll('.tag').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        selectTagInSelector(selector, btn.dataset.value);
      });
    });
  });

  if (task) {
    form.title.value = task.title || '';
    form.description.value = task.description || '';
    form.progress.value = task.status?.progress ?? 0;
    form.blocked.value = task.resources?.blockedReason || '';
    form.dueDate.value = task.time?.dueDate ? task.time.dueDate.slice(0, 10) : '';
    form.habitWindow.value = task.time?.habitWindow || '';
    form.tags.value = (task.category?.tags || []).join(', ');
    form.dataset.editId = task.id;
    
    // Handle tag selectors
    selectTagInSelector(form.querySelector('[data-field="type"]'), task.time?.type || 'single');
    selectTagInSelector(form.querySelector('[data-field="recurrence"]'), task.time?.recurrence || '');
    selectTagInSelector(form.querySelector('[data-field="priority"]'), task.urgency?.priority || 'none');
    selectTagInSelector(form.querySelector('[data-field="area"]'), task.category?.area || 'general');
    selectTagInSelector(form.querySelector('[data-field="phase"]'), task.status?.phase || 'collect');
  } else {
    delete form.dataset.editId;
    form.progress.value = 0;
    // Set default selections for new tasks
    selectTagInSelector(form.querySelector('[data-field="type"]'), 'single');
    selectTagInSelector(form.querySelector('[data-field="recurrence"]'), '');
    selectTagInSelector(form.querySelector('[data-field="priority"]'), 'none');
    selectTagInSelector(form.querySelector('[data-field="area"]'), 'general');
    selectTagInSelector(form.querySelector('[data-field="phase"]'), 'collect');
  }
}

function closeModal() {
  elements.modal.hidden = true;
  elements.taskForm.reset();
  // Reset tag selectors to defaults
  const tagSelectors = elements.taskForm.querySelectorAll('.tag-selector');
  tagSelectors.forEach((selector) => {
    selectTagInSelector(selector, getDefaultForField(selector.dataset.field));
  });
}

function getDefaultForField(field) {
  const defaults = {
    'type': 'single',
    'recurrence': '',
    'priority': 'none',
    'area': 'general',
    'phase': 'collect'
  };
  return defaults[field] || '';
}

function loadTasks() {
  return api.list().then((tasks) => {
    state.tasks = Array.isArray(tasks) ? tasks : [];
    render();
  });
}

function saveTask(data) {
  const form = elements.taskForm;
  const id = form.dataset.editId;
  if (id) {
    return api.update(id, data);
  }
  return api.create(data);
}

function buildTaskPayload(formElement) {
  // Read from FormData which includes all form fields
  const formData = new FormData(formElement);
  
  // Read tag selector values from hidden inputs
  const typeInput = formElement.querySelector('input[name="type"]');
  const recurrenceInput = formElement.querySelector('input[name="recurrence"]');
  const priorityInput = formElement.querySelector('input[name="priority"]');
  const areaInput = formElement.querySelector('input[name="area"]');
  const phaseInput = formElement.querySelector('input[name="phase"]');
  
  const tags = formData.get('tags') 
    ? formData.get('tags').split(',').map((t) => t.trim()).filter(Boolean) 
    : [];
  
  return {
    title: formData.get('title'),
    description: formData.get('description'),
    time: {
      type: typeInput?.value || 'single',
      dueDate: formData.get('dueDate') || null,
      recurrence: recurrenceInput?.value || null,
      habitWindow: formData.get('habitWindow') || null
    },
    urgency: { priority: priorityInput?.value || 'none' },
    category: { area: areaInput?.value || 'general', tags },
    status: { phase: phaseInput?.value || 'collect', progress: Number(formData.get('progress')) || 0 },
    resources: {
      blockedReason: formData.get('blocked') || null
    }
  };
}

function init() {
  elements.refreshBtn.addEventListener('click', () => loadTasks());
  elements.newBtn.addEventListener('click', () => openModal());
  elements.closeModal.addEventListener('click', closeModal);
  elements.cancelBtn.addEventListener('click', closeModal);
  
  // Close modal when clicking background
  const modalBg = elements.modal.querySelector('.modal-bg');
  if (modalBg) {
    modalBg.addEventListener('click', closeModal);
  }
  
  // Close modal with ESC key
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !elements.modal.hidden) {
      closeModal();
    }
  });

  elements.filterPhase.addEventListener('change', (ev) => {
    state.filterPhase = ev.target.value;
    render();
  });

  elements.search.addEventListener('input', (ev) => {
    state.search = ev.target.value;
    render();
  });

  elements.viewTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.currentView = tab.dataset.view;
      render();
    });
  });

  elements.taskForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const payload = buildTaskPayload(form);

    saveTask(payload)
      .then(() => {
        closeModal();
        return loadTasks();
      })
      .catch((err) => {
        console.error(err);
        alert('保存失败，请检查控制台');
      });
  });

  elements.editBtn.addEventListener('click', () => {
    if (!state.selected) return;
    openModal(state.selected);
  });

  elements.completeBtn.addEventListener('click', () => {
    console.log('完成按钮被点击');
    console.log('当前选中任务:', state.selected);
    
    if (!state.selected) {
      console.log('❌ 没有选中任务，无法完成');
      alert('请先选择一个任务');
      return;
    }
    
    console.log('准备完成任务:', state.selected.title);
    const update = createCompletionUpdate(state.selected);
    console.log('更新数据:', update);

    api.update(state.selected.id, update)
      .then(() => {
        console.log('✅ 任务完成成功');
        return loadTasks();
      })
      .catch((err) => {
        console.error('❌ 标记完成失败:', err);
        alert('标记完成失败');
      });
  });

  elements.deleteBtn.addEventListener('click', () => {
    if (!state.selected) return;
    if (!confirm('确认删除该任务？')) return;
    api
      .delete(state.selected.id)
      .then(() => {
        state.selected = null;
        loadTasks();
      })
      .catch(() => alert('删除失败'));
  });

  // 初始化拖拽功能
  initDragAndDrop();
  loadCustomOrder();

  loadTasks();
}

window.addEventListener('DOMContentLoaded', init);
