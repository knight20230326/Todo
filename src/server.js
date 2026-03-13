const http = require('http');
const fs = require('fs');
const path = require('path');
const { Task } = require('./models/task');
const { readAll, writeAll, getDataPath } = require('./store');

// Parse command line arguments
const args = process.argv.slice(2);
let port = 3030;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i+1]) {
    port = Number(args[i+1]);
    break;
  }
}

const PORT = process.env.PORT ? Number(process.env.PORT) : port;
const PUBLIC_DIR = path.join(__dirname, 'web');

function sendJSON(res, data, status = 200) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body, 'utf8')
  });
  res.end(body);
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function parseJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function getTaskById(tasks, id) {
  return tasks.find((t) => t.id.startsWith(id) || t.id === id);
}

function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.replace(/\/\/+/, '/');

  if (pathname === '/api/tasks' && req.method === 'GET') {
    const tasks = readAll();
    sendJSON(res, tasks);
    return;
  }

  if (pathname === '/api/tasks' && req.method === 'POST') {
    parseJSON(req)
      .then((payload) => {
        const tasks = readAll();
        const task = new Task(payload);
        tasks.push(task.toJSON());
        writeAll(tasks);
        sendJSON(res, task.toJSON(), 201);
      })
      .catch(() => sendJSON(res, { error: 'invalid json body' }, 400));
    return;
  }

  const match = pathname.match(/^\/api\/tasks\/(.+)$/);
  if (match) {
    const id = match[1];
    const tasks = readAll();
    const idx = tasks.findIndex((t) => t.id.startsWith(id) || t.id === id);
    if (idx === -1) {
      sendJSON(res, { error: 'not found' }, 404);
      return;
    }
    const task = Task.fromJSON(tasks[idx]);

    if (req.method === 'PATCH' || req.method === 'PUT') {
      parseJSON(req)
        .then((payload) => {
          task.update(payload);
          tasks[idx] = task.toJSON();
          writeAll(tasks);
          sendJSON(res, task.toJSON());
        })
        .catch(() => sendJSON(res, { error: 'invalid json body' }, 400));
      return;
    }

    if (req.method === 'DELETE') {
      tasks.splice(idx, 1);
      writeAll(tasks);
      sendJSON(res, { ok: true });
      return;
    }

    if (req.method === 'GET') {
      sendJSON(res, task.toJSON());
      return;
    }
  }

  // Not found
  sendJSON(res, { error: 'not found' }, 404);
}

function handleStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(safePath).toLowerCase();
  const contentType =
    ext === '.html'
      ? 'text/html; charset=utf-8'
      : ext === '.js'
      ? 'application/javascript; charset=utf-8'
      : ext === '.css'
      ? 'text/css; charset=utf-8'
      : ext === '.json'
      ? 'application/json; charset=utf-8'
      : 'application/octet-stream';

  sendFile(res, safePath, contentType);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    handleApi(req, res);
  } else {
    handleStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`OmniPlan Web UI running: http://localhost:${PORT}`);
  console.log(`数据文件: ${getDataPath()}`);
});
