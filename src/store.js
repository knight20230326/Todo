const fs = require('fs');
const path = require('path');

const DEFAULT_FILENAME = 'tasks.json';
const ORDER_FILENAME = 'order.json';

function getDataPath() {
  const env = process.env.OMNIPLAN_DATA;
  if (env) return path.resolve(env);

  // Prefer current directory .omni-plan/tasks.json
  const localDir = path.resolve(process.cwd(), '.omni-plan');
  if (!fs.existsSync(localDir)) {
    try {
      fs.mkdirSync(localDir, { recursive: true });
    } catch (e) {
      // ignore
    }
  }

  return path.join(localDir, DEFAULT_FILENAME);
}

function getOrderPath() {
  const env = process.env.OMNIPLAN_DATA;
  if (env) return path.resolve(env, '..', ORDER_FILENAME);

  const localDir = path.resolve(process.cwd(), '.omni-plan');
  return path.join(localDir, ORDER_FILENAME);
}

function readAll() {
  const file = getDataPath();
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    return [];
  }
}

function writeAll(tasks) {
  const file = getDataPath();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(file, JSON.stringify(tasks, null, 2), 'utf-8');
}

function readOrder() {
  const file = getOrderPath();
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);
    if (typeof data !== 'object') return {};
    return data;
  } catch (e) {
    return {};
  }
}

function writeOrder(order) {
  const file = getOrderPath();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(file, JSON.stringify(order, null, 2), 'utf-8');
}

module.exports = { getDataPath, getOrderPath, readAll, writeAll, readOrder, writeOrder };
