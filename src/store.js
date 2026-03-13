const fs = require('fs');
const path = require('path');

const DEFAULT_FILENAME = 'tasks.json';

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

module.exports = { getDataPath, readAll, writeAll };
