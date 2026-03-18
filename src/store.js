const fs = require('fs');
const path = require('path');

const DEFAULT_FILENAME = 'tasks.json';
const ORDER_FILENAME = 'order.json';
const SIGNATURE_FILENAME = 'signature.json';
const DYNAMIC_TABS_CONFIG = 'dynamic-tabs.json';

function getDynamicTabsConfig() {
  const configPath = path.join(__dirname, 'config', DYNAMIC_TABS_CONFIG);
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { tabs: [] };
  }
}

function getDynamicTabDataPath(dataFile) {
  const env = process.env.OMNIPLAN_DATA;
  if (env) return path.resolve(env, '..', dataFile);

  const localDir = path.resolve(process.cwd(), '.omni-plan');
  return path.join(localDir, dataFile);
}

function readDynamicTabData(dataFile) {
  const file = getDynamicTabDataPath(dataFile);
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    return [];
  }
}

function writeDynamicTabData(dataFile, items) {
  const file = getDynamicTabDataPath(dataFile);
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf-8');
}

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

function getSignaturePath() {
  const env = process.env.OMNIPLAN_DATA;
  if (env) return path.resolve(env, '..', SIGNATURE_FILENAME);

  const localDir = path.resolve(process.cwd(), '.omni-plan');
  return path.join(localDir, SIGNATURE_FILENAME);
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

function readSignature() {
  const file = getSignaturePath();
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);
    return data?.text || '';
  } catch (e) {
    return '';
  }
}

function writeSignature(text) {
  const file = getSignaturePath();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(file, JSON.stringify({ text }, null, 2), 'utf-8');
}

module.exports = { 
  getDataPath, getOrderPath, getSignaturePath,
  getDynamicTabsConfig, getDynamicTabDataPath,
  readAll, writeAll, readOrder, writeOrder, 
  readSignature, writeSignature,
  readDynamicTabData, writeDynamicTabData
};
