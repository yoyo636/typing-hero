/* 打字小英雄 · 后端服务器（纯 Node，无第三方依赖）
 * 用法： node server/server.js [--port 5173]
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const db = require('./lib/db');
const api = require('./lib/api');

const ROOT = path.join(__dirname, '..');
const START_PORT = parseInt(process.env.DAZI_PORT || arg('--port') || '5173', 10);
const MAX_PORT = START_PORT + 10;
const HOST = process.env.DAZI_HOST || arg('--host') || '127.0.0.1';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

function cors(req, res) {
  // 允许 file:// 直接打开前端时访问本机接口
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded.replace(/^\/+/, '');
  const full = path.resolve(root, rel);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

const GZIP_EXT = ['.html', '.js', '.css', '.json', '.svg', '.txt'];

function serveStatic(req, res, url) {
  let p = url.pathname;
  if (p === '/' || p === '') p = '/index.html';
  const file = safeJoin(ROOT, p);
  if (!file) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, function (err, st) {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found: ' + p);
    }
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': type,
      'Cache-Control': 'no-cache',
      'Last-Modified': st.mtime.toUTCString()
    };
    // 文本资源用 gzip 压缩（机房几十人同时加载更省带宽）
    const canZip = GZIP_EXT.indexOf(ext) >= 0 && st.size > 1024 &&
      (req.headers['accept-encoding'] || '').indexOf('gzip') >= 0;
    if (canZip) {
      headers['Content-Encoding'] = 'gzip';
      headers.Vary = 'Accept-Encoding';
      res.writeHead(200, headers);
      return fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
    }
    headers['Content-Length'] = st.size;
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(function (req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  let url;
  try {
    url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  } catch (e) {
    res.writeHead(400); return res.end('Bad Request');
  }

  if (url.pathname.indexOf('/api/') === 0) {
    // 实时 PK 的 SSE 长连接单独处理
    if (url.pathname === '/api/pk/stream') {
      return require('./lib/pk').stream(req, res,
        url.searchParams.get('code'), url.searchParams.get('token'));
    }
    if (!api.handle(req, res, url)) return; // 未匹配由 api 内部返回 404
    return;
  }
  serveStatic(req, res, url);
});

function listen(port) {
  server.once('error', function (e) {
    if (e.code === 'EADDRINUSE' && port < MAX_PORT) {
      console.log('端口 ' + port + ' 被占用，尝试 ' + (port + 1));
      setTimeout(function () { listen(port + 1); }, 120);
    } else {
      console.error('启动失败：' + e.message);
      process.exit(1);
    }
  });
  server.listen(port, HOST, function () {
    const s = db.get();
    const lines = [
      '',
      '  ⌨️  打字小英雄 · 服务已启动',
      '  ─────────────────────────────',
      '  网址： http://localhost:' + port,
      '  监听： ' + HOST + ':' + port + (HOST === '0.0.0.0' ? '（局域网可访问）' : '（仅本机）'),
      '  数据： ' + db.path,
      '  学生： ' + s.users.length + ' 人，班级 ' + Object.keys(s.classes || {}).length + ' 个',
      '  教师口令：' + api.TEACHER_CODE,
      '  停止服务： Ctrl+C 或 dazi stop',
      ''
    ];
    console.log(lines.join('\n'));
    // 供 dazi 脚本探测端口
    try { fs.writeFileSync(path.join(__dirname, 'data', 'port.txt'), String(port)); } catch (e) { /* ignore */ }
  });
}

process.on('SIGINT', function () { db.flush(); process.exit(0); });
process.on('SIGTERM', function () { db.flush(); process.exit(0); });
process.on('uncaughtException', function (e) {
  console.error('[异常]', e && e.message);
});

listen(START_PORT);
