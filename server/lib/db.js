/* 数据层：JSON 文件存储（零依赖，原子写入） */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const EMPTY = function () {
  return {
    version: 1,
    users: [],      // { id, name, classCode, token, createdAt, lastAt, progress }
    classes: {},    // code -> { code, name, createdAt, teacherName }
    sessions: [],   // 练习流水（用于排行榜与教师看板）
    teacherTokens: {} // token -> classCode
  };
};

let state = null;
let dirty = false;
let timer = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function load() {
  ensureDir();
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    state = Object.assign(EMPTY(), parsed);
  } catch (e) {
    state = EMPTY();
  }
  return state;
}

function get() {
  if (!state) load();
  return state;
}

function save() {
  if (!state) return;
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, FILE);
  dirty = false;
}

/** 延迟落盘，避免频繁写文件 */
function markDirty() {
  dirty = true;
  if (timer) return;
  timer = setTimeout(function () {
    timer = null;
    try { save(); } catch (e) { console.error('[db] 保存失败', e.message); }
  }, 400);
}

/** 每天保留一份备份，最多保留 7 份 */
function backup() {
  try {
    ensureDir();
    if (!fs.existsSync(FILE)) return;
    const day = new Date().toISOString().slice(0, 10);
    const target = path.join(BACKUP_DIR, 'db-' + day + '.json');
    if (!fs.existsSync(target)) {
      fs.copyFileSync(FILE, target);
      const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).sort();
      while (files.length > 7) {
        fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
      }
    }
  } catch (e) { /* 备份失败不影响主流程 */ }
}

function token() {
  return crypto.randomBytes(16).toString('hex');
}

function id() {
  return crypto.randomBytes(8).toString('hex');
}

module.exports = {
  get: get,
  save: save,
  markDirty: markDirty,
  backup: backup,
  token: token,
  id: id,
  FILE: FILE,
  DATA_DIR: DATA_DIR,
  flush: function () { if (dirty) save(); },
  path: FILE
};
