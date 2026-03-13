const { Task } = require('./models/task');
const { readAll, writeAll, getDataPath } = require('./store');

function pad(str, len) {
  str = String(str ?? '');
  if (str.length >= len) return str;
  return str + ' '.repeat(len - str.length);
}

function formatTask(task, options = {}) {
  const id = task.id.slice(0, 8);
  const title = task.title || '(no title)';
  const due = task.time?.dueDate ? task.time.dueDate.split('T')[0] : '-';
  const prio = task.urgency?.priority || 'none';
  const status = task.status?.phase || 'collect';
  return `${pad(id, 8)}  ${pad(prio, 7)}  ${pad(status, 8)}  ${pad(due, 10)}  ${title}`;
}

function printHelp() {
  console.log(`
OmniPlan CLI - 简易复杂事务管理 (基于设计文档)

用法:
  omni-plan <command> [options]

命令:
  init                   初始化本地数据存储（默认: .omni-plan/tasks.json）
  add <title> [options]  添加任务（支持 --type/--due/--priority/--recurrence/--window/--blocked 等）
  list [--view=flat|matrix]  列出任务
  show <id>              展示任务详情
  update <id> [--field=value]  更新任务字段（支持 --type/--due/--recurrence/--window/--blocked 等）
  complete <id>          标记任务完成（支持周期 & 习惯自动更新）
  delete <id>            删除任务
  help                   显示帮助

示例:
  omni-plan init
  omni-plan add "写周报" --due=2026-03-13 --priority=high --area=work
  omni-plan list
  omni-plan show <id>

Web 界面:
  npm start
  然后访问: http://localhost:3030

环境变量:
  OMNIPLAN_DATA  指定任务存储文件路径
`);
}

function parseArgs(argv) {
  const args = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [key, value] = a.slice(2).split('=');
      opts[key] = value || true;
    } else {
      args.push(a);
    }
  }
  return { args, opts };
}

function ensureStore() {
  const dataPath = getDataPath();
  const tasks = readAll();
  if (tasks.length === 0) {
    writeAll([]);
  }
  return dataPath;
}

function cmdInit() {
  const dataPath = getDataPath();
  const dir = require('path').dirname(dataPath);
  if (!require('fs').existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }
  if (!require('fs').existsSync(dataPath)) {
    writeAll([]);
  }
  console.log(`初始化完成: ${dataPath}`);
}

function cmdAdd(argv) {
  const { args, opts } = parseArgs(argv);
  const title = args.join(' ').trim();
  if (!title) {
    console.error('错误: 请提供任务标题');
    process.exit(1);
  }

  const tasks = readAll();
  const task = new Task({
    title,
    description: opts.desc || opts.description || '',
    time: {
      type: opts.type || 'single',
      dueDate: opts.due || null,
      recurrence: opts.recurrence || null,
      condition: opts.condition || null,
      habitWindow: opts.window || null,
      lastDone: null
    },
    urgency: {
      priority: opts.priority || 'none',
      energy: opts.energy || 'medium'
    },
    category: {
      area: opts.area || 'general',
      tags: opts.tags ? opts.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    },
    status: {
      phase: opts.phase || 'collect',
      progress: 0
    },
    resources: {
      budget: opts.budget ? Number(opts.budget) : null,
      checklist: [],
      blockedReason: opts.blocked || null
    }
  });

  tasks.push(task.toJSON());
  writeAll(tasks);
  console.log(`已创建任务: ${task.id} (${task.title})`);
}

function cmdList(argv) {
  const { opts } = parseArgs(argv);
  const tasks = readAll();
  if (tasks.length === 0) {
    console.log('没有任务');
    return;
  }

  console.log('ID       优先级  阶段      截止        标题');
  console.log('-------- ------- -------- ---------- --------------------------------');
  const sorted = [...tasks].sort((a, b) => {
    if (a.urgency?.priority === b.urgency?.priority) return 0;
    const order = ['urgent', 'high', 'medium', 'low', 'none'];
    return order.indexOf(a.urgency?.priority) - order.indexOf(b.urgency?.priority);
  });
  sorted.forEach((t) => {
    console.log(formatTask(t));
  });
}

function cmdShow(argv) {
  const { args } = parseArgs(argv);
  const id = args[0];
  if (!id) {
    console.error('错误: 请输入任务 ID');
    process.exit(1);
  }
  const tasks = readAll();
  const task = tasks.find((t) => t.id.startsWith(id) || t.id === id);
  if (!task) {
    console.error('未找到任务: ' + id);
    process.exit(1);
  }

  console.log(`
ID: ${task.id}
标题: ${task.title}
描述: ${task.description || '-'}
创建: ${task.createdAt}
更新: ${task.updatedAt}

层级:
  父任务: ${task.parentId || '-'}
  子任务: ${(task.childrenIds || []).join(', ') || '-'}

时间:
  类型: ${task.time?.type}
  截止: ${task.time?.dueDate || '-'}
  重复: ${task.time?.recurrence || '-'}
  条件: ${task.time?.condition || '-'}
  习惯窗口: ${task.time?.habitWindow || '-'}
  最近打卡: ${task.time?.lastDone || '-'}

紧急度:
  优先级: ${task.urgency?.priority}
  能量: ${task.urgency?.energy}

类别:
  领域: ${task.category?.area}
  标签: ${(task.category?.tags || []).join(', ') || '-'}

状态:
  阶段: ${task.status?.phase}
  完成度: ${task.status?.progress}%

资源:
  预算: ${task.resources?.budget ?? '-'}
  阻塞原因: ${task.resources?.blockedReason || '-'}
  清单项: ${(task.resources?.checklist || []).join(', ') || '-'}

内容:
  文稿模式: ${task.content?.draftMode}
  字数目标: ${task.content?.wordTarget || '-'}
  素材: ${(task.content?.assets || []).join(', ') || '-'}
`);
}

function cmdUpdate(argv) {
  const { args, opts } = parseArgs(argv);
  const id = args[0];
  if (!id) {
    console.error('错误: 请输入任务 ID');
    process.exit(1);
  }

  const tasks = readAll();
  const idx = tasks.findIndex((t) => t.id.startsWith(id) || t.id === id);
  if (idx === -1) {
    console.error('未找到任务: ' + id);
    process.exit(1);
  }

  const task = Task.fromJSON(tasks[idx]);
  const update = {};
  const timeUpdate = { ...task.time };
  const resourcesUpdate = { ...task.resources };

  if (opts.title) update.title = opts.title;
  if (opts.desc || opts.description) update.description = opts.desc || opts.description;

  if (opts.type) timeUpdate.type = opts.type;
  if (opts.due) timeUpdate.dueDate = opts.due;
  if (opts.recurrence) timeUpdate.recurrence = opts.recurrence;
  if (opts.window) timeUpdate.habitWindow = opts.window;

  if (opts.priority) update.urgency = { ...task.urgency, priority: opts.priority };
  if (opts.energy) update.urgency = { ...task.urgency, energy: opts.energy };
  if (opts.phase) update.status = { ...task.status, phase: opts.phase };
  if (opts.progress) update.status = { ...task.status, progress: Number(opts.progress) };
  if (opts.area) update.category = { ...task.category, area: opts.area };
  if (opts.tags) update.category = { ...task.category, tags: opts.tags.split(',').map((t) => t.trim()) };
  if (opts.budget) resourcesUpdate.budget = Number(opts.budget);
  if (opts.blocked) resourcesUpdate.blockedReason = opts.blocked;

  update.time = timeUpdate;
  update.resources = resourcesUpdate;

  task.update(update);
  tasks[idx] = task.toJSON();
  writeAll(tasks);
  console.log(`任务已更新: ${task.id}`);
}

function applyCompletionLogic(task) {
  const now = new Date().toISOString();

  if (task.time?.type === 'habit') {
    const lastDone = task.time?.lastDone ? new Date(task.time.lastDone) : null;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isYesterday = lastDone &&
      lastDone.getFullYear() === yesterday.getFullYear() &&
      lastDone.getMonth() === yesterday.getMonth() &&
      lastDone.getDate() === yesterday.getDate();

    const streak = isYesterday ? (task.status?.progress || 0) + 1 : 1;

    return {
      time: { ...task.time, lastDone: now },
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

function cmdComplete(argv) {
  const { args } = parseArgs(argv);
  const id = args[0];
  if (!id) {
    console.error('错误: 请输入任务 ID');
    process.exit(1);
  }

  const tasks = readAll();
  const idx = tasks.findIndex((t) => t.id.startsWith(id) || t.id === id);
  if (idx === -1) {
    console.error('未找到任务: ' + id);
    process.exit(1);
  }

  const task = Task.fromJSON(tasks[idx]);
  const update = applyCompletionLogic(task);
  task.update(update);
  tasks[idx] = task.toJSON();
  writeAll(tasks);
  console.log(`任务已标记完成: ${task.id}`);
}

function cmdDelete(argv) {
  const { args } = parseArgs(argv);
  const id = args[0];
  if (!id) {
    console.error('错误: 请输入任务 ID');
    process.exit(1);
  }
  const tasks = readAll();
  const remaining = tasks.filter((t) => !(t.id.startsWith(id) || t.id === id));
  if (remaining.length === tasks.length) {
    console.error('未找到任务: ' + id);
    process.exit(1);
  }
  writeAll(remaining);
  console.log(`任务已删除: ${id}`);
}

module.exports = {
  printHelp,
  cmdInit,
  cmdAdd,
  cmdList,
  cmdShow,
  cmdUpdate,
  cmdComplete,
  cmdDelete
};
