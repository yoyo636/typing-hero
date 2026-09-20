/* 打字小英雄 · 后端接口客户端（离线自动降级） */
window.App = window.App || {};

(function (App) {
  'use strict';

  var LS_TOKEN = 'dazi_token';
  var LS_USER = 'dazi_user';
  var LS_BASE = 'dazi_base';

  var api = {
    base: null,
    online: false,
    checking: false,
    token: null,
    user: null,

    init: function () {
      try {
        this.token = localStorage.getItem(LS_TOKEN) || null;
        var u = localStorage.getItem(LS_USER);
        this.user = u ? JSON.parse(u) : null;
      } catch (e) { /* 忽略 */ }

      var p = location.protocol;
      if (p === 'http:' || p === 'https:') {
        this.base = '';                       // 同域部署
        this.online = true;
        this.check();
        return Promise.resolve(true);
      }
      // file:// 打开时探测本机服务
      var cached = null;
      try { cached = localStorage.getItem(LS_BASE); } catch (e) { /* ignore */ }
      var candidates = [];
      if (cached) candidates.push(cached);
      for (var i = 5173; i <= 5183; i++) candidates.push('http://localhost:' + i);
      return this.probe(candidates);
    },

    probe: function (list) {
      var self = this;
      var i = 0;
      function next() {
        if (i >= list.length) { self.online = false; return Promise.resolve(false); }
        var base = list[i++];
        return fetch(base + '/api/health', { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) {
            if (j && j.ok) {
              self.base = base;
              self.online = true;
              try { localStorage.setItem(LS_BASE, base); } catch (e) { /* ignore */ }
              App.store && App.store.schedulePush && App.store.schedulePush();
              return true;
            }
            return next();
          })
          .catch(next);
      }
      return next();
    },

    /** 手动检测服务是否可用 */
    check: function () {
      var self = this;
      if (!this.base && this.base !== '') return Promise.resolve(false);
      return fetch(this.base + '/api/health', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          self.online = !!(j && j.ok);
          return self.online;
        })
        .catch(function () { self.online = false; return false; });
    },

    request: function (path, opts) {
      opts = opts || {};
      var self = this;
      var url = (this.base || '') + path;
      var headers = { 'Content-Type': 'application/json' };
      if (this.token) headers.Authorization = 'Bearer ' + this.token;
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
      return fetch(url, {
        method: opts.method || 'GET',
        headers: headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        if (timer) clearTimeout(timer);
        return r.json().catch(function () { return { ok: false, error: '返回格式错误' }; });
      }).then(function (j) {
        if (!j.ok) throw new Error(j.error || '请求失败');
        self.online = true;
        return j.data;
      }).catch(function (e) {
        if (e.name === 'AbortError') throw new Error('服务器没有响应');
        throw e;
      });
    },

    /* ---------- 账号 ---------- */
    checkAccount: function (name, classCode) {
      return this.request('/api/auth/check?name=' + encodeURIComponent(name) +
        '&classCode=' + encodeURIComponent(classCode));
    },

    register: function (name, classCode, password, password2, className) {
      var self = this;
      return this.request('/api/auth/register', {
        method: 'POST',
        body: {
          name: name, classCode: classCode,
          password: password || '', password2: password2 || '',
          className: className || ''
        }
      }).then(function (d) {
        self.token = d.token;
        self.user = d.user;
        try {
          localStorage.setItem(LS_TOKEN, d.token);
          localStorage.setItem(LS_USER, JSON.stringify(d.user));
        } catch (e) { /* ignore */ }
        return d;
      });
    },

    login: function (name, classCode, password) {
      var self = this;
      return this.request('/api/auth/login', {
        method: 'POST',
        body: { name: name, classCode: classCode, password: password || '' }
      }).then(function (d) {
        self.token = d.token;
        self.user = d.user;
        try {
          localStorage.setItem(LS_TOKEN, d.token);
          localStorage.setItem(LS_USER, JSON.stringify(d.user));
        } catch (e) { /* ignore */ }
        return d;
      });
    },

    logout: function () {
      this.token = null;
      this.user = null;
      try {
        localStorage.removeItem(LS_TOKEN);
        localStorage.removeItem(LS_USER);
      } catch (e) { /* ignore */ }
    },

    me: function () { return this.request('/api/me'); },

    pushProgress: function (progress) {
      return this.request('/api/me/progress', { method: 'POST', body: { progress: progress } });
    },

    pushSessions: function (sessions) {
      return this.request('/api/me/session', { method: 'POST', body: { sessions: sessions } });
    },

    leaderboard: function (scope, by) {
      return this.request('/api/leaderboard?scope=' + encodeURIComponent(scope || 'class') +
        '&by=' + encodeURIComponent(by || 'stars'));
    },

    teacherLogin: function (classCode, passcode) {
      return this.request('/api/teacher/login', {
        method: 'POST', body: { classCode: classCode, passcode: passcode }
      });
    },

    teacherClass: function (code, token) {
      var self = this;
      var old = this.token;
      if (token) this.token = token;
      return this.request('/api/teacher/class?code=' + encodeURIComponent(code))
        .then(function (d) { self.token = old; return d; },
          function (e) { self.token = old; throw e; });
    },

    teacherResetPassword: function (classCode, name) {
      return this.request('/api/teacher/reset-password', {
        method: 'POST', body: { classCode: classCode, name: name }
      });
    },

    exportUrl: function (code, token) {
      return (this.base || '') + '/api/teacher/export?code=' + encodeURIComponent(code) +
        '&token=' + encodeURIComponent(token);
    },

    courses: function () { return this.request('/api/courses'); }
  };

  App.api = api;
})(window.App);
