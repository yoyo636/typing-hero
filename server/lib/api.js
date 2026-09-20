/* 接口层：账号、进度同步、排行榜、教师后台、课程下发 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const db = require('./db');

const ROOT = path.join(__dirname, '..', '..');
const TEACHER_CODE = process.env.DAZI_TEACHER_CODE || 'dazi2026';
const MAX_BODY = 1024 * 1024;      // 1MB
const MAX_SESSIONS = 5000;         // 流水上限
const MAX_NAME = 24;

/* ---------------- 工具 ---------------- */

function send(res, code, data, headers) {
  const body = Buffer.from(JSON.stringify(data == null ? {} : data));
  res.writeHead(code, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  }, headers || {}));
  res.end(body);
}

function ok(res, data) { send(res, 200, { ok: true, data: data }); }
function fail(res, code, msg) { send(res, code || 400, { ok: false, error: msg || '请求有误' }); }

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let size = 0;
    const chunks = [];
    req.on('data', function (c) {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('请求过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', function () {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(new Error('JSON 格式错误')); }
    });
    req.on('error', reject);
  });
}

function clean(s, max) {
  if (typeof s !== 'string') return '';
  return s.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max || MAX_NAME);
}

function num(v, def) {
  const n = Number(v);
  return isFinite(n) ? n : (def || 0);
}

/* 密码：加盐 sha256（小学生场景足够，不明文保存） */
function hashPass(pw, salt) {
  return crypto.createHash('sha256').update(salt + '|' + String(pw)).digest('hex');
}
function setPassword(u, pw) {
  if (!pw) { u.salt = ''; u.pass = ''; return; }
  u.salt = crypto.randomBytes(8).toString('hex');
  u.pass = hashPass(pw, u.salt);
}
function checkPassword(u, pw) {
  if (!u.pass) return true;          // 没设密码的账号免密码登录
  return hashPass(pw || '', u.salt || '') === u.pass;
}
function hasPassword(u) { return !!u.pass; }

function state() { return db.get(); }

function findUserByToken(token) {
  if (!token) return null;
  return state().users.find(function (u) { return u.token === token; }) || null;
}

function tokenOf(req, url) {
  const h = req.headers.authorization || '';
  if (h.indexOf('Bearer ') === 0) return h.slice(7).trim();
  return (url.searchParams.get('token') || '').trim();
}

function emptyProgress() {
  return { lessons: {}, totalMs: 0, totalChars: 0, keyErrors: {}, keyHits: {}, game: { best: 0, plays: 0 } };
}

function mergeLesson(a, b) {
  return {
    stars: Math.max(num(a.stars), num(b.stars)),
    bestSpeed: Math.max(num(a.bestSpeed), num(b.bestSpeed)),
    bestAcc: Math.max(num(a.bestAcc), num(b.bestAcc)),
    times: Math.max(num(a.times), num(b.times)),
    passed: !!(a.passed || b.passed),
    updatedAt: Math.max(num(a.updatedAt), num(b.updatedAt))
  };
}

function mergeProgress(dst, src) {
  dst.lessons = dst.lessons || {};
  const sl = (src && src.lessons) || {};
  Object.keys(sl).forEach(function (k) {
    const a = dst.lessons[k] || {};
    dst.lessons[k] = mergeLesson(a, sl[k] || {});
  });
  dst.totalMs = Math.max(num(dst.totalMs), num(src && src.totalMs));
  dst.totalChars = Math.max(num(dst.totalChars), num(src && src.totalChars));
  ['keyErrors', 'keyHits'].forEach(function (f) {
    dst[f] = dst[f] || {};
    const s = (src && src[f]) || {};
    Object.keys(s).forEach(function (k) {
      dst[f][k] = Math.max(num(dst[f][k]), num(s[k]));
    });
  });
  dst.game = dst.game || { best: 0, plays: 0 };
  if (src && src.game) {
    dst.game.best = Math.max(num(dst.game.best), num(src.game.best));
    dst.game.plays = Math.max(num(dst.game.plays), num(src.game.plays));
  }
  return dst;
}

function userSummary(u, sessions) {
  const lessons = (u.progress && u.progress.lessons) || {};
  let stars = 0, best = 0, passed = 0;
  Object.keys(lessons).forEach(function (k) {
    const l = lessons[k] || {};
    stars += num(l.stars);
    best = Math.max(best, num(l.bestSpeed));
    if (l.passed) passed++;
  });
  const mine = sessions.filter(function (s) { return s.userId === u.id; });
  let ms = 0, accSum = 0, chars = 0;
  mine.forEach(function (s) { ms += num(s.ms); accSum += num(s.acc); chars += num(s.chars); });
  return {
    id: u.id,
    name: u.name,
    classCode: u.classCode,
    stars: stars,
    bestSpeed: Math.round(best * 10) / 10,
    passed: passed,
    sessions: mine.length,
    totalMs: ms,
    totalChars: chars,
    avgAcc: mine.length ? Math.round(accSum / mine.length * 10) / 10 : 0,
    lastAt: u.lastAt || 0
  };
}

/* ---------------- 课程数据（从前端 data.js 读取，单一数据源） ---------------- */

let courseCache = null;

function loadCourses() {
  if (courseCache) return courseCache;
  const src = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'data.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  const d = sandbox.window.App.data;
  courseCache = {
    chapters: JSON.parse(JSON.stringify(d.chapters)),
    tips: d.tips || []
  };
  return courseCache;
}

/* ---------------- 路由 ---------------- */

const routes = {
  /* 健康检查 */
  'GET /api/health': function (req, res, url, body, ctx) {
    const s = state();
    ok(res, {
      name: '打字小英雄',
      version: '1.1.0',
      users: s.users.length,
      classes: Object.keys(s.classes || {}).length,
      sessions: s.sessions.length,
      teacherMode: true
    });
  },

  /* 课程（服务端下发） */
  'GET /api/courses': function (req, res) {
    try {
      ok(res, loadCourses());
    } catch (e) {
      fail(res, 500, '课程数据读取失败：' + e.message);
    }
  },

  /* 查询账号状态：用于前端判断是登录还是注册、要不要填密码 */
  'GET /api/auth/check': function (req, res, url) {
    const name = clean(url.searchParams.get('name'));
    const classCode = clean(url.searchParams.get('classCode'), 24);
    if (!name || !classCode) return fail(res, 400, '请填写昵称和班级码');
    const s = state();
    const u = s.users.find(function (x) { return x.name === name && x.classCode === classCode; });
    ok(res, {
      exists: !!u,
      hasPassword: u ? hasPassword(u) : false,
      classExists: !!s.classes[classCode],
      className: (s.classes[classCode] || {}).name || ''
    });
  },

  /* 注册：昵称 + 班级码（+ 可选密码），同班同名会被拒绝 */
  'POST /api/auth/register': function (req, res, url, body) {
    const name = clean(body.name);
    const classCode = clean(body.classCode, 24);
    const className = clean(body.className, 30);
    const pw = clean(body.password, 40);
    if (!name) return fail(res, 400, '请填写昵称');
    if (!classCode) return fail(res, 400, '请填写班级码');
    if (body.password && body.password !== body.password2) {
      return fail(res, 400, '两次输入的密码不一样');
    }
    if (pw && pw.length < 4) return fail(res, 400, '密码至少 4 位');

    const s = state();
    const dup = s.users.find(function (u) { return u.name === name && u.classCode === classCode; });
    if (dup) return fail(res, 409, '「' + name + '」在班级 ' + classCode + ' 已经有人用啦，换一个昵称吧');

    const isNewClass = !s.classes[classCode];
    if (isNewClass) {
      s.classes[classCode] = { code: classCode, name: className || classCode, createdAt: Date.now() };
    }
    const user = {
      id: db.id(),
      name: name,
      classCode: classCode,
      token: db.token(),
      createdAt: Date.now(),
      lastAt: Date.now(),
      progress: emptyProgress()
    };
    setPassword(user, pw);
    s.users.push(user);
    db.backup();
    db.markDirty();
    ok(res, {
      token: user.token,
      user: { id: user.id, name: user.name, classCode: user.classCode },
      progress: user.progress,
      newClass: isNewClass,
      hasPassword: hasPassword(user)
    });
  },

  /* 登录 / 注册：昵称 + 班级码 */
  'POST /api/auth/login': function (req, res, url, body) {
    const name = clean(body.name);
    const classCode = clean(body.classCode, 24);
    if (!name) return fail(res, 400, '请填写昵称');
    if (!classCode) return fail(res, 400, '请填写班级码');

    const s = state();
    let user = s.users.find(function (u) {
      return u.name === name && u.classCode === classCode;
    });
    if (!user) return fail(res, 404, '还没有这个账号哦，请先注册');
    if (!checkPassword(user, clean(body.password, 40))) {
      return fail(res, 403, '密码不对，再想想？');
    }
    user.lastAt = Date.now();
    db.markDirty();
    ok(res, {
      token: user.token,
      user: { id: user.id, name: user.name, classCode: user.classCode },
      progress: user.progress,
      isNew: !Object.keys(user.progress.lessons || {}).length
    });
  },

  'POST /api/auth/logout': function (req, res, url, body) {
    ok(res, { logout: true });
  },

  'GET /api/me': function (req, res, url, body, ctx) {
    const u = ctx.user;
    if (!u) return fail(res, 401, '未登录');
    ok(res, {
      user: { id: u.id, name: u.name, classCode: u.classCode },
      progress: u.progress,
      summary: userSummary(u, state().sessions)
    });
  },

  /* 进度同步：服务端与客户端取最大值合并 */
  'POST /api/me/progress': function (req, res, url, body, ctx) {
    const u = ctx.user;
    if (!u) return fail(res, 401, '未登录');
    u.progress = mergeProgress(u.progress || emptyProgress(), body.progress || {});
    u.lastAt = Date.now();
    db.markDirty();
    ok(res, { progress: u.progress, summary: userSummary(u, state().sessions) });
  },

  /* 提交一次练习流水 */
  'POST /api/me/session': function (req, res, url, body, ctx) {
    const u = ctx.user;
    if (!u) return fail(res, 401, '未登录');
    const list = Array.isArray(body.sessions) ? body.sessions : [body.session];
    const added = [];
    list.slice(0, 50).forEach(function (x) {
      if (!x) return;
      const rec = {
        id: db.id(),
        userId: u.id,
        name: u.name,
        classCode: u.classCode,
        t: num(x.t, Date.now()),
        lessonId: clean(x.lessonId, 40),
        mode: x.mode === 'zh' ? 'zh' : 'en',
        speed: num(x.speed),
        acc: num(x.acc),
        chars: num(x.chars),
        ms: num(x.ms)
      };
      state().sessions.push(rec);
      added.push(rec);
    });
    const s = state();
    if (s.sessions.length > MAX_SESSIONS) s.sessions = s.sessions.slice(-MAX_SESSIONS);
    u.lastAt = Date.now();
    db.markDirty();
    ok(res, { added: added.length, summary: userSummary(u, s.sessions) });
  },

  /* 排行榜 */
  'GET /api/leaderboard': function (req, res, url, body, ctx) {
    const s = state();
    const scope = url.searchParams.get('scope') || 'class';
    const by = url.searchParams.get('by') || 'stars';
    const limit = Math.min(50, Math.max(5, parseInt(url.searchParams.get('limit') || '20', 10)));
    const myClass = ctx.user ? ctx.user.classCode : url.searchParams.get('classCode');

    let users = s.users;
    if (scope === 'class' && myClass) {
      users = users.filter(function (u) { return u.classCode === myClass; });
    }
    const rows = users.map(function (u) { return userSummary(u, s.sessions); });
    rows.sort(function (a, b) {
      if (by === 'speed') return b.bestSpeed - a.bestSpeed;
      if (by === 'time') return b.totalMs - a.totalMs;
      if (by === 'acc') return b.avgAcc - a.avgAcc;
      return b.stars - a.stars || b.bestSpeed - a.bestSpeed;
    });
    const top = rows.slice(0, limit).map(function (r, i) { r.rank = i + 1; return r; });
    const myRank = ctx.user ? (rows.findIndex(function (r) { return r.id === ctx.user.id; }) + 1) : 0;
    ok(res, {
      scope: scope, by: by, list: top, myRank: myRank, total: rows.length,
      classCode: myClass || ''
    });
  },

  /* 教师登录 */
  'POST /api/teacher/login': function (req, res, url, body) {
    const classCode = clean(body.classCode, 24);
    const passcode = clean(body.passcode, 40);
    if (!classCode) return fail(res, 400, '请填写班级码');
    if (passcode !== TEACHER_CODE) return fail(res, 403, '教师口令不正确');
    const s = state();
    if (!s.classes[classCode]) return fail(res, 404, '这个班级还没有学生加入');
    const t = db.token();
    s.teacherTokens[t] = classCode;
    db.markDirty();
    ok(res, { token: t, classCode: classCode, className: s.classes[classCode].name });
  },

  /* 教师：帮学生重置密码（清空密码，学生可重新设置） */
  'POST /api/teacher/reset-password': function (req, res, url, body, ctx) {
    const code = body.classCode || ctx.classCode;
    if (!code) return fail(res, 401, '请先用教师口令登录');
    if (ctx.classCode && ctx.classCode !== code) return fail(res, 403, '只能管理自己班级');
    const name = clean(body.name);
    const u = state().users.find(function (x) { return x.name === name && x.classCode === code; });
    if (!u) return fail(res, 404, '找不到这个学生');
    setPassword(u, '');
    db.markDirty();
    ok(res, { name: u.name, hasPassword: false });
  },

  /* 教师：班级总览 */
  'GET /api/teacher/class': function (req, res, url, body, ctx) {
    const code = url.searchParams.get('code') || ctx.classCode;
    if (!code) return fail(res, 401, '请先用教师口令登录');
    if (ctx.classCode && ctx.classCode !== code) return fail(res, 403, '只能查看自己班级');
    const s = state();
    const students = s.users.filter(function (u) { return u.classCode === code; });
    if (!students.length) return fail(res, 404, '班级暂无学生');
    const rows = students.map(function (u) { return userSummary(u, s.sessions); })
      .sort(function (a, b) { return b.stars - a.stars; });
    const sessions = s.sessions.filter(function (x) { return x.classCode === code; });

    // 全班薄弱键位
    const weak = {};
    students.forEach(function (u) {
      const e = (u.progress && u.progress.keyErrors) || {};
      Object.keys(e).forEach(function (k) { weak[k] = (weak[k] || 0) + num(e[k]); });
    });
    const weakList = Object.keys(weak).map(function (k) { return { key: k, count: weak[k] }; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 10);

    // 近 14 天活跃
    const days = {};
    sessions.forEach(function (x) {
      const d = new Date(num(x.t)).toISOString().slice(0, 10);
      days[d] = (days[d] || 0) + 1;
    });
    const recent = Object.keys(days).sort().slice(-14).map(function (d) {
      return { date: d, count: days[d] };
    });

    ok(res, {
      classCode: code,
      className: (s.classes[code] || {}).name || code,
      studentCount: students.length,
      sessionCount: sessions.length,
      avgAcc: rows.length ? Math.round(rows.reduce(function (a, r) { return a + r.avgAcc; }, 0) / rows.length * 10) / 10 : 0,
      avgSpeed: rows.length ? Math.round(rows.reduce(function (a, r) { return a + r.bestSpeed; }, 0) / rows.length * 10) / 10 : 0,
      totalMs: rows.reduce(function (a, r) { return a + r.totalMs; }, 0),
      students: rows,
      weakKeys: weakList,
      daily: recent
    });
  },

  /* 教师：导出 CSV */
  'GET /api/teacher/export': function (req, res, url, body, ctx) {
    const code = url.searchParams.get('code') || ctx.classCode;
    if (!code) return fail(res, 401, '请先用教师口令登录');
    const s = state();
    const rows = s.users.filter(function (u) { return u.classCode === code; })
      .map(function (u) { return userSummary(u, s.sessions); })
      .sort(function (a, b) { return b.stars - a.stars; });
    const head = ['排名', '姓名', '班级', '星星', '最高速度', '通过课数', '练习次数', '练习分钟', '平均准确率', '最近练习'];
    const lines = [head.join(',')];
    rows.forEach(function (r, i) {
      lines.push([
        i + 1, r.name, r.classCode, r.stars, r.bestSpeed, r.passed, r.sessions,
        Math.round(r.totalMs / 60000 * 10) / 10, r.avgAcc,
        r.lastAt ? new Date(r.lastAt).toLocaleString('zh-CN') : '-'
      ].join(','));
    });
    const csv = '\ufeff' + lines.join('\n');
    const buf = Buffer.from(csv, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Length': buf.length,
      'Content-Disposition': 'attachment; filename="class-' + encodeURIComponent(code) + '.csv"'
    });
    res.end(buf);
  }
};

/** 返回 true 表示已处理 */
function handle(req, res, url) {
  const key = req.method + ' ' + url.pathname;
  const fn = routes[key];
  if (!fn) {
    if (url.pathname.indexOf('/api/') === 0) fail(res, 404, '接口不存在：' + key);
    return false;
  }
  const ctx = {};
  const t = tokenOf(req, url);
  if (t) {
    ctx.user = findUserByToken(t);
    if (!ctx.user && state().teacherTokens[t]) ctx.classCode = state().teacherTokens[t];
  }
  readBody(req).then(function (body) {
    try {
      fn(req, res, url, body || {}, ctx);
    } catch (e) {
      fail(res, 500, '服务器内部错误：' + e.message);
    }
  }).catch(function (e) {
    fail(res, 400, e.message);
  });
  return true;
}

module.exports = { handle: handle, TEACHER_CODE: TEACHER_CODE, loadCourses: loadCourses };
