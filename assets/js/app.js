/* 打字小英雄 · 应用外壳与路由 */
(function (App) {
  'use strict';

  var root = document.getElementById('app');

  App.applyTheme = function () {
    document.documentElement.setAttribute('data-theme', App.store.settings().theme || 'light');
  };

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    if (!h) return { name: 'home', params: [] };
    var parts = h.split('/');
    return { name: parts[0], params: parts.slice(1) };
  }

  function render() {
    var r = parseHash();
    var view = App.views[r.name] || App.views.home;

    if (App._cleanup) { try { App._cleanup(); } catch (e) { /* ignore */ } }
    App._cleanup = null;
    App._mount = null;

    root.innerHTML = view(r.params) || '';
    root.scrollTop = 0;
    window.scrollTo(0, 0);

    // 导航高亮
    var links = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('active', links[i].getAttribute('data-nav') === r.name);
    }

    // 通用跳转
    var gos = root.querySelectorAll('[data-go]');
    for (var j = 0; j < gos.length; j++) {
      gos[j].addEventListener('click', function () {
        App.sound.click();
        location.hash = this.getAttribute('data-go');
      });
    }

    if (App._mount) App._mount(root);
    updateChip();
  }

  App.rerender = render;

  /* ---------- 顶部账号状态 ---------- */
  function updateChip() {
    var chip = document.getElementById('userChip');
    if (!chip) return;
    var api = App.api;
    if (!api.online) {
      chip.className = 'user-chip off';
      chip.textContent = '离线单机';
      chip.title = '在终端运行 dazi 启动服务后即可云同步';
    } else if (api.user) {
      chip.className = 'user-chip on';
      chip.textContent = '👦 ' + api.user.name + ' · ' + api.user.classCode;
      chip.title = '已登录，成绩自动云同步（点击可登录其他账号）';
    } else {
      chip.className = 'user-chip';
      chip.textContent = '未登录';
      chip.title = '点击登录班级';
    }
    chip.onclick = function () {
      if (!api.online) { alert('服务器未启动。请在终端输入：dazi'); return; }
      if (api.user) {
        if (confirm('当前账号：' + api.user.name + '（' + api.user.classCode + '）\n确定要退出登录吗？')) {
          api.logout();
          render();
        }
      } else {
        App.showLogin();
      }
    };
  }

  /* ---------- 登录 / 注册弹窗 ---------- */
  App.showLogin = function (cb, mode) {
    if (!App.api.online) {
      alert('还没有连接到服务器。\n请在终端运行：dazi');
      return;
    }
    var cur = mode === 'register' ? 'register' : 'login';
    var mask = document.createElement('div');
    mask.className = 'result-mask';
    mask.innerHTML =
      '<div class="result-card card auth-card">' +
      '<h2 id="authTitle">登录班级</h2>' +
      '<div class="seg auth-seg" id="authTabs">' +
      '<button type="button" data-m="login" class="on">登录</button>' +
      '<button type="button" data-m="register">注册新账号</button>' +
      '</div>' +
      '<form class="login-form" id="loginForm">' +
      '<label>昵称<input id="lgName" maxlength="16" placeholder="例如：小明" autocomplete="off"></label>' +
      '<label>班级码<input id="lgCode" maxlength="16" placeholder="例如：3A" autocomplete="off"></label>' +
      '<p class="hint-box" id="lgHint">填好昵称和班级码，会自动帮你查一下账号。</p>' +
      '<div id="lgClassWrap" hidden><label>班级名称（新班级）<input id="lgClassName" maxlength="20" ' +
      'placeholder="例如：三年级一班" autocomplete="off"></label></div>' +
      '<div id="lgPassWrap" hidden><label>密码<input id="lgPass" type="password" maxlength="30" ' +
      'placeholder="密码" autocomplete="off"></label></div>' +
      '<div id="lgPass2Wrap" hidden><label>再输一次密码<input id="lgPass2" type="password" maxlength="30" ' +
      'autocomplete="off"></label></div>' +
      '<p class="err" id="lgErr"></p>' +
      '<div class="result-actions">' +
      '<button type="button" class="btn btn-ghost" id="lgCancel">取消</button>' +
      '<button type="submit" class="btn btn-primary" id="lgSubmit">登录</button>' +
      '</div>' +
      '<p class="muted mini">忘记密码？请老师用教师后台帮你重置。</p>' +
      '</form></div>';
    document.body.appendChild(mask);

    var nameEl = mask.querySelector('#lgName');
    var codeEl = mask.querySelector('#lgCode');
    var hint = mask.querySelector('#lgHint');
    var err = mask.querySelector('#lgErr');
    var passWrap = mask.querySelector('#lgPassWrap');
    var pass2Wrap = mask.querySelector('#lgPass2Wrap');
    var classWrap = mask.querySelector('#lgClassWrap');
    var submit = mask.querySelector('#lgSubmit');
    var state = { exists: false, hasPassword: false, classExists: false };

    function close() { if (mask.parentNode) mask.parentNode.removeChild(mask); }
    mask.querySelector('#lgCancel').onclick = close;
    setTimeout(function () { nameEl.focus(); }, 50);

    function setMode(m) {
      cur = m;
      var tabs = mask.querySelectorAll('#authTabs button');
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.toggle('on', tabs[i].getAttribute('data-m') === m);
      }
      mask.querySelector('#authTitle').textContent = m === 'register' ? '注册新账号' : '登录班级';
      submit.textContent = m === 'register' ? '注册并登录' : '登录';
      pass2Wrap.hidden = (m !== 'register');
      // 注册时密码可选；登录时按账号是否有密码决定
      passWrap.hidden = (m === 'login') ? !(state.exists && state.hasPassword) : false;
      if (m === 'register') {
        passWrap.querySelector('label').firstChild.textContent = '密码（可以不填）';
      } else {
        passWrap.querySelector('label').firstChild.textContent = '密码';
      }
      err.textContent = '';
      lookup();
    }

    var tabWrap = mask.querySelector('#authTabs');
    tabWrap.onclick = function (e) {
      var b = e.target.closest('button');
      if (b) setMode(b.getAttribute('data-m'));
    };

    var timer = null;
    function lookup() {
      var name = nameEl.value.trim();
      var code = codeEl.value.trim();
      classWrap.hidden = true;
      if (!name || !code) {
        hint.textContent = '填好昵称和班级码，会自动帮你查一下账号。';
        hint.className = 'hint-box';
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        App.api.checkAccount(name, code).then(function (d) {
          state = d;
          if (cur === 'register') {
            if (d.exists) {
              hint.textContent = '「' + name + '」在班级 ' + code + ' 已经有人用了，换个昵称吧。';
              hint.className = 'hint-box warn';
            } else if (!d.classExists) {
              hint.textContent = '班级 ' + code + ' 还不存在，注册时会自动创建这个新班级。';
              hint.className = 'hint-box ok';
              classWrap.hidden = false;
            } else {
              hint.textContent = '加入已有班级：' + (d.className || code);
              hint.className = 'hint-box ok';
            }
          } else {
            if (!d.exists) {
              hint.textContent = '还没有这个账号，点上面「注册新账号」创建一个吧。';
              hint.className = 'hint-box warn';
            } else if (d.hasPassword) {
              hint.textContent = '这个账号设了密码，请输入密码。';
              hint.className = 'hint-box ok';
            } else {
              hint.textContent = '这个账号没有密码，直接点登录就行。';
              hint.className = 'hint-box ok';
            }
          }
          passWrap.hidden = (cur === 'login') ? !(state.exists && state.hasPassword) : false;
        }).catch(function () { /* 忽略查询失败 */ });
      }, 350);
    }
    nameEl.addEventListener('input', lookup);
    nameEl.addEventListener('blur', lookup);
    codeEl.addEventListener('input', lookup);
    codeEl.addEventListener('blur', lookup);

    function done(d) {
      App.store.mergeServer(d.progress);
      App.store.schedulePush(0);
      close();
      App.rerender();
      if (cb) cb();
    }

    mask.querySelector('#loginForm').onsubmit = function (e) {
      e.preventDefault();
      var name = nameEl.value.trim();
      var code = codeEl.value.trim();
      var pw = mask.querySelector('#lgPass').value;
      var pw2 = mask.querySelector('#lgPass2').value;
      err.textContent = '';
      if (!name || !code) { err.textContent = '昵称和班级码都要填哦'; return; }

      var p;
      if (cur === 'register') {
        if (pw && pw.length < 4) { err.textContent = '密码至少 4 位'; return; }
        if (pw !== pw2) { err.textContent = '两次输入的密码不一样'; return; }
        p = App.api.register(name, code, pw, pw2, mask.querySelector('#lgClassName').value.trim());
      } else {
        p = App.api.login(name, code, pw);
      }
      submit.disabled = true;
      submit.textContent = '处理中…';
      p.then(done).catch(function (e2) {
        submit.disabled = false;
        submit.textContent = cur === 'register' ? '注册并登录' : '登录';
        err.textContent = e2.message || '操作失败';
        if (cur === 'login' && /还没有这个账号/.test(e2.message)) setMode('register');
      });
    };

    setMode(cur);
    if (App.api.user) {
      nameEl.value = App.api.user.name || '';
      codeEl.value = App.api.user.classCode || '';
    }
  };

  function boot() {
    App.applyTheme();

    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = '#/';
    render();

    // 顶部按钮
    var themeBtn = document.getElementById('btnTheme');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var cur = App.store.settings().theme;
        App.store.setSetting('theme', cur === 'dark' ? 'light' : 'dark');
        App.applyTheme();
        this.textContent = cur === 'dark' ? '🌙' : '☀️';
      });
    }
    var soundBtn = document.getElementById('btnSound');
    if (soundBtn) {
      var syncSound = function () {
        soundBtn.textContent = App.store.settings().sound ? '🔊' : '🔇';
      };
      syncSound();
      soundBtn.addEventListener('click', function () {
        App.store.setSetting('sound', !App.store.settings().sound);
        syncSound();
        App.sound.click();
      });
    }

    // 顶部导航
    var navs = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < navs.length; i++) {
      navs[i].addEventListener('click', function (e) {
        e.preventDefault();
        App.sound.click();
        location.hash = this.getAttribute('href');
      });
    }

    // 连接后端（失败自动保持离线单机模式）
    App.api.init().then(function (online) {
      updateChip();
      if (!online) {
        App.renderCloudCard && App.renderCloudCard();
        App.rerender();
        return;
      }
      // 课程内容由服务端下发
      var afterCourses = App.api.courses().then(function (c) {
        if (App.data.applyRemote(c)) App.rerender();
      }).catch(function () { /* 用本地课程兜底 */ });

      if (App.api.token) {
        afterCourses.then(function () {
          return App.api.me().catch(function () { return null; });
        }).then(function (me) {
          if (me) App.store.mergeServer(me.progress);
          App.store.schedulePush(300);
          App.rerender();
        });
      } else {
        App.rerender();
      }
    });

    // 关页面前把进度推上去
    window.addEventListener('pagehide', function () {
      try { App.store.pushNow(); } catch (e) { /* ignore */ }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.App);
