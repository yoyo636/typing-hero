/* 打字小英雄 · 本地存档（localStorage） */
window.App = window.App || {};

(function (App) {
  'use strict';

  var KEY = 'typing_hero_v1';

  var DEFAULT = {
    profile: { name: '小英雄', createdAt: Date.now() },
    lessons: {},          // id -> { stars, bestSpeed, bestAcc, bestScore, times, passed, updatedAt }
    sessions: [],         // { t, mode, lessonId, speed, acc, chars, ms }
    mistakes: {           // 错词本
      words: {},          // 英文单词 -> 错误次数
      zh: {}              // 中文错句 / 错词 -> 错误次数
    },
    keyErrors: {},        // 键 -> 错误次数
    keyHits: {},
    game: { best: 0, plays: 0 },
    settings: { sound: true, keyboard: true, theme: 'light', pinyin: true },
    days: {},             // 'YYYY-MM-DD' -> 练习毫秒
    lastSyncT: 0,         // 已上传到服务器的最后一条流水时间
    totalMs: 0,
    totalChars: 0,
    achievements: []
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var state = null;

  function load() {
    if (state) return state;
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? merge(clone(DEFAULT), JSON.parse(raw)) : clone(DEFAULT);
    } catch (e) {
      state = clone(DEFAULT);
    }
    return state;
  }

  function merge(base, patch) {
    Object.keys(patch).forEach(function (k) {
      if (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k])) {
        base[k] = merge(base[k] || {}, patch[k]);
      } else {
        base[k] = patch[k];
      }
    });
    return base;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 隐私模式忽略 */ }
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var Store = {
    get: function () { return load(); },

    settings: function () { return load().settings; },

    setSetting: function (k, v) { load().settings[k] = v; save(); },

    lesson: function (id) {
      var s = load();
      return s.lessons[id] || { stars: 0, bestSpeed: 0, bestAcc: 0, times: 0, passed: false };
    },

    /** 记录一次练习结果 */
    record: function (r) {
      var s = load();
      var l = s.lessons[r.lessonId] || { stars: 0, bestSpeed: 0, bestAcc: 0, times: 0, passed: false };
      l.times = (l.times || 0) + 1;
      l.bestSpeed = Math.max(l.bestSpeed || 0, Math.round(r.speed * 10) / 10);
      l.bestAcc = Math.max(l.bestAcc || 0, Math.round(r.acc * 10) / 10);
      l.stars = Math.max(l.stars || 0, r.stars || 0);
      l.passed = l.passed || !!r.passed;
      l.updatedAt = Date.now();
      s.lessons[r.lessonId] = l;

      s.sessions.push({
        t: Date.now(), lessonId: r.lessonId, mode: r.mode,
        speed: Math.round(r.speed * 10) / 10, acc: Math.round(r.acc * 10) / 10,
        chars: r.chars || 0, ms: r.ms || 0
      });
      if (s.sessions.length > 200) s.sessions = s.sessions.slice(-200);

      s.totalMs = (s.totalMs || 0) + (r.ms || 0);
      s.totalChars = (s.totalChars || 0) + (r.chars || 0);
      var d = today();
      s.days[d] = (s.days[d] || 0) + (r.ms || 0);

      save();
      schedulePush();
      return l;
    },

    /* ---------------- 错词本 ---------------- */

    /** 英文：记一个打错的单词；中文：记打错的句子/词 */
    recordMistake: function (kind, text) {
      if (!text) return;
      var s = load();
      s.mistakes = s.mistakes || { words: {}, zh: {} };
      var bag = kind === 'zh' ? (s.mistakes.zh = s.mistakes.zh || {}) : (s.mistakes.words = s.mistakes.words || {});
      var k = String(text).trim().slice(0, 40);
      if (!k) return;
      bag[k] = (bag[k] || 0) + 1;
      save();
    },

    mistakes: function (kind) {
      var s = load();
      s.mistakes = s.mistakes || { words: {}, zh: {} };
      return kind === 'zh' ? s.mistakes.zh : s.mistakes.words;
    },

    topWeakWords: function (n) {
      var w = Store.mistakes('en');
      return Object.keys(w).map(function (k) { return { w: k, n: w[k] }; })
        .sort(function (a, b) { return b.n - a.n; }).slice(0, n || 10);
    },

    topWeakKeys: function (n) {
      var s = load();
      var e = s.keyErrors || {};
      return Object.keys(e).map(function (k) { return { k: k, n: e[k] }; })
        .sort(function (a, b) { return b.n - a.n; }).slice(0, n || 5);
    },

    clearMistakes: function (kind) {
      var s = load();
      s.mistakes = s.mistakes || { words: {}, zh: {} };
      if (kind === 'zh') s.mistakes.zh = {}; else s.mistakes.words = {};
      save();
    },

    /** 今日训练计划（来自 data.buildDailyPlan） */
    plan: function () {
      return App.data.buildDailyPlan();
    },

    /** 记录按键统计 */
    keyStat: function (key, ok) {
      var s = load();
      if (ok) s.keyHits[key] = (s.keyHits[key] || 0) + 1;
      else s.keyErrors[key] = (s.keyErrors[key] || 0) + 1;
      save();
    },

    gameRecord: function (score) {
      var s = load();
      s.game.plays = (s.game.plays || 0) + 1;
      if (score > (s.game.best || 0)) s.game.best = score;
      save();
    },

    todayMs: function () { return load().days[today()] || 0; },

    todayCount: function () {
      var s = load(), d = today(), n = 0;
      s.sessions.forEach(function (x) {
        var dd = new Date(x.t);
        var key = dd.getFullYear() + '-' + pad(dd.getMonth() + 1) + '-' + pad(dd.getDate());
        if (key === d) n++;
      });
      return n;
    },

    /** 连续练习天数 */
    streak: function () {
      var s = load(), n = 0;
      var d = new Date();
      for (var i = 0; i < 400; i++) {
        var key = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        if (s.days[key]) n++;
        else if (i > 0) break;
        d.setDate(d.getDate() - 1);
      }
      return n;
    },

    chapterProgress: function (ch) {
      var s = load(), done = 0;
      ch.lessons.forEach(function (l) {
        var r = s.lessons[l.id];
        if (r && r.passed) done++;
      });
      return { done: done, total: ch.lessons.length, ratio: done / ch.lessons.length };
    },

    overall: function () {
      var s = load();
      var passed = 0, stars = 0;
      App.data.lessons.forEach(function (l) {
        var r = s.lessons[l.id];
        if (r && r.passed) passed++;
        if (r) stars += r.stars || 0;
      });
      return {
        passed: passed,
        total: App.data.lessons.length,
        stars: stars,
        maxStars: App.data.lessons.length * 3,
        best: s.sessions.reduce(function (m, x) { return Math.max(m, x.speed); }, 0),
        avgAcc: s.sessions.length
          ? s.sessions.reduce(function (a, x) { return a + x.acc; }, 0) / s.sessions.length : 0,
        totalMs: s.totalMs || 0,
        totalChars: s.totalChars || 0,
        count: s.sessions.length
      };
    },

    /** 某一课是否已解锁 */
    unlocked: function (lessonId) {
      var s = load();
      var list = App.data.lessons;
      var idx = -1;
      for (var i = 0; i < list.length; i++) if (list[i].id === lessonId) idx = i;
      if (idx <= 0) return true;
      var cur = list[idx], prev = list[idx - 1];
      if (prev.chapterId !== cur.chapterId) {
        // 跨章：上一章完成一半以上
        var ch = App.data.chapters[cur.chapterIndex - 1];
        return s.lessons[prev.id] && s.lessons[prev.id].passed
          ? true : Store.chapterProgress(ch).ratio >= 0.5;
      }
      var r = s.lessons[prev.id];
      return !!(r && r.passed);
    },

    nextLesson: function (id) {
      var list = App.data.lessons, idx = 0;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) idx = i;
      return list[idx + 1] || null;
    },

    lastLesson: function () {
      var s = load(), best = null;
      Object.keys(s.lessons).forEach(function (id) {
        var l = s.lessons[id];
        if (!best || (l.updatedAt || 0) > (best.updatedAt || 0)) best = { id: id, at: l.updatedAt };
      });
      if (best) {
        var nx = Store.nextLesson(best.id);
        if (nx) return nx;
      }
      return App.data.lessons[0];
    },

    reset: function () {
      state = clone(DEFAULT);
      save();
    }
  };

  /* ---------------- 与服务器同步（离线自动跳过） ---------------- */

  var pushTimer = null;

  /** 本地进度快照（上传用） */
  function progressSnapshot() {
    var s = load();
    return {
      lessons: s.lessons || {},
      totalMs: s.totalMs || 0,
      totalChars: s.totalChars || 0,
      keyErrors: s.keyErrors || {},
      keyHits: s.keyHits || {},
      mistakes: s.mistakes || { words: {}, zh: {} },
      game: s.game || { best: 0, plays: 0 }
    };
  }

  function schedulePush(delay) {
    var api = App.api;
    if (!api || !api.online || !api.token) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, delay == null ? 1500 : delay);
  }

  function pushNow() {
    pushTimer = null;
    var api = App.api;
    if (!api || !api.online || !api.token) return;
    var s = load();
    var fresh = s.sessions.filter(function (x) { return (x.t || 0) > (s.lastSyncT || 0); }).slice(-50);

    api.pushProgress(progressSnapshot()).then(function () {
      if (!fresh.length) return;
      return api.pushSessions(fresh).then(function () {
        s.lastSyncT = fresh[fresh.length - 1].t;
        save();
      });
    }).catch(function () { /* 离线或出错：下次再试 */ });
  }

  /** 用服务器上的进度与本地合并（各项取最大） */
  function mergeServer(progress) {
    if (!progress) return;
    var s = load();
    var sl = progress.lessons || {};
    Object.keys(sl).forEach(function (k) {
      var a = s.lessons[k] || { stars: 0, bestSpeed: 0, bestAcc: 0, times: 0, passed: false };
      var b = sl[k] || {};
      s.lessons[k] = {
        stars: Math.max(a.stars || 0, b.stars || 0),
        bestSpeed: Math.max(a.bestSpeed || 0, b.bestSpeed || 0),
        bestAcc: Math.max(a.bestAcc || 0, b.bestAcc || 0),
        times: Math.max(a.times || 0, b.times || 0),
        passed: !!(a.passed || b.passed),
        updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0)
      };
    });
    s.totalMs = Math.max(s.totalMs || 0, progress.totalMs || 0);
    s.totalChars = Math.max(s.totalChars || 0, progress.totalChars || 0);
    ['keyErrors', 'keyHits'].forEach(function (f) {
      s[f] = s[f] || {};
      var o = progress[f] || {};
      Object.keys(o).forEach(function (k) { s[f][k] = Math.max(s[f][k] || 0, o[k] || 0); });
    });
    if (progress.game) {
      s.game.best = Math.max(s.game.best || 0, progress.game.best || 0);
      s.game.plays = Math.max(s.game.plays || 0, progress.game.plays || 0);
    }
    s.mistakes = s.mistakes || { words: {}, zh: {} };
    var pm = progress.mistakes || {};
    ['words', 'zh'].forEach(function (f) {
      s.mistakes[f] = s.mistakes[f] || {};
      var o = pm[f] || {};
      Object.keys(o).forEach(function (k) { s.mistakes[f][k] = Math.max(s.mistakes[f][k] || 0, o[k] || 0); });
    });
    save();
  }

  Store.schedulePush = schedulePush;
  Store.pushNow = pushNow;
  Store.mergeServer = mergeServer;
  Store.progressSnapshot = progressSnapshot;

  App.store = Store;
})(window.App);
