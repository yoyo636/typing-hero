/* 实时 PK 房间（SSE 推送，零依赖） */
'use strict';

const db = require('./db');
const api = require('./api');

const rooms = new Map();     // code -> room
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RACE_TEXT_LEN = 200;

function newCode() {
  let c = '';
  for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return rooms.has(c) ? newCode() : c;
}

function raceText() {
  try {
    const App = api.appData();
    if (App && App.data && App.data.buildTestText) {
      return App.data.buildTestText().slice(0, RACE_TEXT_LEN);
    }
  } catch (e) { /* 用兜底文本 */ }
  return 'The quick brown fox jumps over the lazy dog. Practice makes perfect and typing is fun for everyone.';
}

function userOf(token) {
  if (!token) return null;
  return db.get().users.find(function (u) { return u.token === token; }) || null;
}

function makeRoom(u) {
  const room = {
    code: newCode(),
    host: u.id,
    text: raceText(),
    status: 'wait',          // wait | race | end
    createdAt: Date.now(),
    startedAt: 0,
    players: {},             // userId -> { id, name, index, speed, acc, finishedAt }
    clients: []              // res 列表（SSE）
  };
  addPlayer(room, u);
  rooms.set(room.code, room);
  return room;
}

function addPlayer(room, u) {
  room.players[u.id] = {
    id: u.id, name: u.name, index: 0, speed: 0, acc: 100, finishedAt: 0
  };
}

function snapshot(room) {
  const list = Object.keys(room.players).map(function (k) { return room.players[k]; });
  return {
    code: room.code,
    status: room.status,
    text: room.text,
    hostId: room.host,
    startedAt: room.startedAt,
    total: room.text.length,
    players: list
  };
}

function broadcast(room) {
  const payload = 'event: state\ndata: ' + JSON.stringify(snapshot(room)) + '\n\n';
  room.clients.forEach(function (res) {
    try { res.write(payload); } catch (e) { /* 连接已断开 */ }
  });
}

function sweep() {
  const now = Date.now();
  rooms.forEach(function (r, code) {
    if (r.clients.length === 0 && now - r.createdAt > 10 * 60 * 1000) rooms.delete(code);
    else if (now - r.createdAt > 3 * 60 * 60 * 1000) rooms.delete(code);
  });
}

const PK = {
  /** 创建房间 */
  create: function (token) {
    const u = userOf(token);
    if (!u) return { error: '请先登录再开始对战' };
    const room = makeRoom(u);
    return { room: snapshot(room) };
  },

  /** 加入房间 */
  join: function (token, code) {
    const u = userOf(token);
    if (!u) return { error: '请先登录再开始对战' };
    const room = rooms.get(String(code || '').toUpperCase().trim());
    if (!room) return { error: '房间不存在，检查一下房间码' };
    if (room.status !== 'wait') return { error: '这局已经开始啦' };
    if (Object.keys(room.players).length >= 2 && !room.players[u.id]) {
      return { error: '房间已经满了' };
    }
    addPlayer(room, u);
    broadcast(room);
    return { room: snapshot(room) };
  },

  /** 房主开始比赛 */
  start: function (token, code) {
    const u = userOf(token);
    const room = rooms.get(String(code || '').toUpperCase().trim());
    if (!room) return { error: '房间不存在' };
    if (!u || room.host !== u.id) return { error: '只有房主可以开始' };
    if (Object.keys(room.players).length < 2) return { error: '还要再等一位同学加入' };
    room.status = 'race';
    room.startedAt = Date.now();
    broadcast(room);
    return { room: snapshot(room) };
  },

  /** 上报进度 */
  progress: function (token, code, p) {
    const u = userOf(token);
    const room = rooms.get(String(code || '').toUpperCase().trim());
    if (!room || !u) return { error: '房间不存在' };
    const me = room.players[u.id];
    if (!me) return { error: '你不在房间里' };
    if (room.status !== 'race') return { room: snapshot(room) };
    me.index = Math.max(0, Math.min(room.text.length, Number(p.index) || 0));
    me.speed = Number(p.speed) || 0;
    me.acc = Number(p.acc) || 0;
    if (p.finished && !me.finishedAt) me.finishedAt = Date.now();
    // 双方都完成立即结束；只有一人完成则 8 秒后结束本局
    const ids = Object.keys(room.players);
    const done = ids.filter(function (k) { return room.players[k].finishedAt; });
    if (done.length === ids.length && ids.length >= 2) {
      room.status = 'end';
    } else if (done.length === 1 && !room.endTimer) {
      room.endTimer = setTimeout(function () {
        room.endTimer = null;
        if (room.status === 'race') { room.status = 'end'; broadcast(room); }
      }, 8000);
    }
    broadcast(room);
    return { room: snapshot(room) };
  },

  /** 离开房间 */
  leave: function (token, code) {
    const u = userOf(token);
    const room = rooms.get(String(code || '').toUpperCase().trim());
    if (!room || !u) return { ok: true };
    delete room.players[u.id];
    if (!Object.keys(room.players).length) rooms.delete(room.code);
    else broadcast(room);
    return { ok: true };
  },

  /** SSE 订阅 */
  stream: function (req, res, code, token) {
    const room = rooms.get(String(code || '').toUpperCase().trim());
    if (!room) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('房间不存在');
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write('retry: 2000\n\n');
    res.write('event: state\ndata: ' + JSON.stringify(snapshot(room)) + '\n\n');

    room.clients.push(res);
    const beat = setInterval(function () {
      try { res.write(': ping\n\n'); } catch (e) { /* ignore */ }
    }, 15000);

    const bye = function () {
      clearInterval(beat);
      const i = room.clients.indexOf(res);
      if (i >= 0) room.clients.splice(i, 1);
      if (!room.clients.length && room.status === 'end') rooms.delete(room.code);
    };
    req.on('close', bye);
    req.on('error', bye);
    sweep();
  }
};

module.exports = PK;
