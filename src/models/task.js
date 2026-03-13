const { randomUUID } = require('crypto');

const DefaultTask = {
  id: null,
  title: '',
  description: '',
  createdAt: null,
  updatedAt: null,
  
  // Hierarchy
  parentId: null,
  childrenIds: [],
  depth: 0,
  expanded: true,

  // Time dimension
  time: {
    type: 'single', // single | recurring | condition | habit
    dueDate: null, // ISO string
    reminder: null, // ISO string or relative
    recurrence: null, // e.g. "daily" | "weekly" | "monthly"
    condition: null, // e.g. "等待甲方确认"
    habitWindow: null, // e.g. "07:00-09:00"
    lastDone: null // ISO date string
  },

  // Urgency dimension
  urgency: {
    priority: 'none', // urgent|high|medium|low|none
    energy: 'medium' // high|medium|low
  },

  // Category dimension
  category: {
    area: 'general', // work|life|study|finance|creativity|general
    tags: []
  },

  // Status dimension
  status: {
    phase: 'collect', // collect|process|do|wait|review|archive
    progress: 0 // 0-100
  },

  // Resources dimension
  resources: {
    budget: null,
    checklist: [],
    blockedReason: null
  },

  // Content dimension (for writing tasks)
  content: {
    draftMode: 'outline', // outline|draft|revise|final
    wordTarget: null,
    assets: []
  }
};

class Task {
  constructor(attributes = {}) {
    const now = new Date().toISOString();
    const base = {
      ...DefaultTask,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    const merged = mergeDeep(base, attributes);
    Object.assign(this, merged);
  }

  update(attrs = {}) {
    mergeDeep(this, attrs);
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return { ...this };
  }

  static fromJSON(json) {
    const t = new Task();
    Object.assign(t, json);
    return t;
  }
}

function mergeDeep(target, source) {
  for (const key of Object.keys(source || {})) {
    const value = source[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = mergeDeep(target[key] ?? {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

module.exports = { Task, DefaultTask };
