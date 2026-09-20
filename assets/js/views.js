/* 打字小英雄 · 页面视图 */
window.App = window.App || {};

(function (App) {
  'use strict';

  var data = App.data;
  var store = App.store;
  var kb = App.keyboard;

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }
  function fmtDur(ms) {
    var m = Math.floor(ms / 60000);
    if (m < 60) return m + ' 分钟';
    return Math.floor(m / 60) + ' 小时 ' + (m % 60) + ' 分';
  }
  function stars(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += '<span class="star' + (i < n ? ' on' : '') + '">★</span>';
    return s;
  }
  function go(hash) { location.hash = hash; }
  function typeLabel(l) {
    return { keys: '键位', caps: '大小写', words: '单词', sentence: '句子', text: '文章', zh: '中文' }[l.type] || '练习';
  }

  var views = {};
  App.views = views;

  /* ================= 首页 ================= */
  views.home = function () {
    var s = store.get();
    var ov = store.overall();
    var last = store.lastLesson();
    var tip = data.rand(data.tips);
    var recent = s.sessions.slice(-5).reverse();

    var html = '';
    html += '<section class="hero">' +
      '<div class="hero-text">' +
      '<h1>打字小英雄 <span class="hero-badge">⌨️</span></h1>' +
      '<p>每天 10 分钟，跟着课程闯关，让你的手指在键盘上飞起来！</p>' +
      '<div class="hero-actions">' +
      '<button class="btn btn-primary btn-lg" data-go="#/practice/' + last.id + '">继续学习：' + esc(last.title) + '</button>' +
      '<button class="btn btn-ghost btn-lg" data-go="#/courses">课程地图</button>' +
      '<button class="btn btn-soft btn-lg" data-go="#/test">⚡ 60 秒测速</button>' +
      '</div>' +
      '<div class="hero-tip">💡 小贴士：' + esc(tip) + '</div>' +
      '</div>' +
      '<div class="hero-card card">' +
      '<div class="ring" style="--p:' + Math.round(ov.passed / ov.total * 100) + '">' +
      '<div class="ring-in"><b>' + ov.passed + '</b><span>/ ' + ov.total + ' 课</span></div></div>' +
      '<div class="hero-meta">' +
      '<div><b>' + ov.stars + '</b><span>获得星星</span></div>' +
      '<div><b>' + Math.round(ov.best) + '</b><span>最高速度</span></div>' +
      '<div><b>' + store.streak() + '</b><span>连续天数</span></div>' +
      '</div></div></section>';

    html += '<div class="grid-3">' +
      '<button class="entry-card" data-go="#/courses"><span class="ic">🗺️</span><b>课程地图</b><i>5 章 34 课，从键位到实战</i></button>' +
      '<button class="entry-card" data-go="#/game"><span class="ic">🎮</span><b>键位挑战</b><i>字母雨小游戏，越玩越快</i></button>' +
      '<button class="entry-card" data-go="#/stats"><span class="ic">📊</span><b>学习报告</b><i>看看进步曲线和薄弱键位</i></button>' +
      '</div>';

    html += '<div class="grid-2 mt">' +
      '<div class="card"><h3>今日战绩</h3><div class="stat-row">' +
      '<div class="stat"><b>' + fmtDur(store.todayMs()) + '</b><span>练习时长</span></div>' +
      '<div class="stat"><b>' + store.todayCount() + '</b><span>练习次数</span></div>' +
      '<div class="stat"><b>' + Math.round(ov.avgAcc) + '%</b><span>平均准确率</span></div>' +
      '<div class="stat"><b>' + ov.totalChars + '</b><span>累计字数</span></div>' +
      '</div>' +
      '<div class="bar-wrap"><div class="bar"><i style="width:' +
      Math.min(100, Math.round(store.todayMs() / 600000 * 100)) + '%"></i></div>' +
      '<span>今日目标 10 分钟</span></div></div>';

    html += '<div class="card"><h3>最近练习</h3>';
    if (!recent.length) {
      html += '<p class="muted">还没有练习记录，快去上第一课吧！</p>';
    } else {
      html += '<ul class="recent">';
      recent.forEach(function (r) {
        var l = data.getLesson(r.lessonId);
        html += '<li><span class="t">' + esc(l ? l.title : '速度测试') + '</span>' +
          '<span class="v">' + r.speed + ' <i>' + (r.mode === 'zh' ? '字/分' : 'WPM') + '</i></span>' +
          '<span class="a">' + r.acc + '%</span></li>';
      });
      html += '</ul>';
    }
    html += '</div></div>';

    html += '<div class="card mt" id="cloudCard">' + cloudCardHtml() + '</div>';

    App._mount = function (root) { bindCloud(root); };
    return html;
  };

  /* 云端账号卡片（登录状态 / 离线提示） */
  function cloudCardHtml() {
    var api = App.api || {};
    var u = api.user;
    var h = '<h3>☁️ 云端账号与排行榜</h3>';
    if (!api.online) {
      h += '<p class="muted">当前是<b>离线单机模式</b>，进度只保存在这台电脑。' +
        '在终端运行 <code>dazi</code> 启动服务后，就能登录班级、云同步进度、和同学比一比。</p>';
      return h;
    }
    if (u) {
      h += '<p>已登录：<b class="hl">' + esc(u.name) + '</b> · 班级 <b class="hl">' + esc(u.classCode) + '</b>' +
        '<span class="muted">（成绩自动云同步）</span></p>' +
        '<div class="cloud-actions">' +
        '<button class="btn btn-primary" data-go="#/rank">🏅 查看排行榜</button>' +
        '<button class="btn btn-ghost" id="btnSync">立即同步</button>' +
        '<button class="btn btn-ghost" id="btnLogout">退出登录</button>' +
        '</div>';
    } else {
      h += '<p class="muted">登录后可以云同步星星和成绩，还能在班级排行榜上和同学比赛。</p>' +
        '<div class="cloud-actions">' +
        '<button class="btn btn-primary" id="btnLogin">登录 / 注册</button>' +
        '<button class="btn btn-ghost" data-go="#/rank">🏅 排行榜</button>' +
        '<button class="btn btn-ghost" data-go="#/teacher">👩‍🏫 教师后台</button>' +
        '</div>';
    }
    return h;
  }

  App.renderCloudCard = function () {
    var el = document.getElementById('cloudCard');
    if (!el) return;
    el.innerHTML = cloudCardHtml();
    bindCloud(el);
    var gos = el.querySelectorAll('[data-go]');
    for (var i = 0; i < gos.length; i++) {
      gos[i].onclick = function () { location.hash = this.getAttribute('data-go'); };
    }
  };

  function bindCloud(scope) {
    var login = scope.querySelector('#btnLogin');
    if (login) login.onclick = function () { App.showLogin(); };
    var out = scope.querySelector('#btnLogout');
    if (out) out.onclick = function () {
      if (!confirm('退出后本机进度仍会保留，确定退出吗？')) return;
      App.api.logout();
      App.rerender();
    };
    var sync = scope.querySelector('#btnSync');
    if (sync) sync.onclick = function () {
      var btn = this;
      btn.textContent = '同步中…';
      App.store.pushNow();
      setTimeout(function () { btn.textContent = '已同步 ✓'; }, 900);
    };
  }

  /* ================= 课程地图 ================= */
  views.courses = function () {
    var html = '<div class="page-head"><h2>🗺️ 课程地图</h2>' +
      '<p class="muted">按顺序闯关，通过一课才能解锁下一课。每章完成一半就能开启下一章！</p></div>';

    data.chapters.forEach(function (ch) {
      var p = store.chapterProgress(ch);
      html += '<section class="chapter card">' +
        '<header class="ch-head"><span class="ch-emoji">' + ch.emoji + '</span>' +
        '<div class="ch-title"><h3>' + esc(ch.title) + '</h3><p>' + esc(ch.desc) + '</p></div>' +
        '<div class="ch-prog"><div class="bar sm"><i style="width:' + Math.round(p.ratio * 100) + '%"></i></div>' +
        '<span>' + p.done + ' / ' + p.total + '</span></div></header>' +
        '<div class="lesson-grid">';

      ch.lessons.forEach(function (ls) {
        var r = store.lesson(ls.id);
        var unlocked = store.unlocked(ls.id);
        var cls = 'lesson-card' + (unlocked ? '' : ' locked') + (r.passed ? ' passed' : '');
        html += '<button class="' + cls + '" ' + (unlocked ? 'data-go="#/practice/' + ls.id + '"' : 'disabled') + '>' +
          '<div class="lc-top"><span class="tag tag-' + ls.type + '">' + typeLabel(ls) + '</span>' +
          (r.passed ? '<span class="passed">已通过</span>' : (unlocked ? '' : '<span class="lock">🔒 未解锁</span>')) + '</div>' +
          '<h4>' + esc(ls.title) + '</h4>' +
          '<p class="lc-goal">目标 ' + ls.target.speed + ' ' + (ls.type === 'zh' ? '字/分' : 'WPM') +
          ' · 准确率 ' + ls.target.acc + '%</p>' +
          '<div class="lc-stars">' + stars(r.stars || 0) + '</div>' +
          '</button>';
      });
      html += '</div></section>';
    });
    return html;
  };

  /* ================= 练习页 ================= */
  views.practice = function (params) {
    var id = params[0];
    var lesson = data.getLesson(id);
    if (!lesson) return '<div class="card"><p>找不到这节课</p><button class="btn" data-go="#/courses">返回课程</button></div>';

    var isZh = lesson.type === 'zh';
    var text = data.buildText(lesson);
    var py = (isZh && store.settings().pinyin) ? data.pinyinList(lesson) : null;
    var record = store.lesson(id);
    var next = store.nextLesson(id);

    var html = '<div class="practice">' +
      '<div class="pr-head">' +
      '<button class="btn btn-icon" id="btnQuit" title="退出 (Esc)">←</button>' +
      '<div class="pr-title"><h3>' + esc(lesson.title) + '</h3>' +
      '<span class="muted">' + esc(lesson.chapterTitle) + '</span></div>' +
      '<div class="pr-goal">目标：<b>' + lesson.target.speed + '</b> ' + (isZh ? '字/分' : 'WPM') +
      ' · 准确率 <b>' + lesson.target.acc + '%</b>' +
      (record.bestSpeed ? ' · 最好成绩 ' + record.bestSpeed : '') + '</div>' +
      '</div>';

    html += '<div class="card pr-card">' +
      '<div class="metrics">' +
      '<div class="metric"><b id="mTime">0:00</b><span>用时</span></div>' +
      '<div class="metric"><b id="mSpeed">0</b><span>' + (isZh ? '字/分' : 'WPM') + '</span></div>' +
      '<div class="metric"><b id="mAcc">100%</b><span>准确率</span></div>' +
      '<div class="metric"><b id="mCombo">0</b><span>连击</span></div>' +
      '<div class="metric"><b id="mErr">0</b><span>打错</span></div>' +
      '</div>' +
      '<div class="bar sm mb"><i id="prBar" style="width:0%"></i></div>' +
      '<div class="text-box" id="textBox"></div>' +
      (isZh ? '<input id="zhInput" class="zh-input" autocomplete="off" spellcheck="false" ' +
        'placeholder="点这里，用拼音输入法打字…">' : '') +
      '<div class="finger-hint" id="fingerHint">' + esc(lesson.tips) + '</div>' +
      '<div class="pr-actions">' +
      '<button class="btn btn-ghost" id="btnRestart">重新开始</button>' +
      '<button class="btn btn-ghost" id="btnPause">暂停</button>' +
      '<span class="muted ml">' + (isZh ? '请先切换到拼音输入法' : '直接敲键盘即可开始，Esc 退出') + '</span>' +
      '</div></div>';

    if (store.settings().keyboard) {
      html += '<div class="card kb-card">' + kb.html() + '</div>';
    }
    html += '</div>';
    html += '<div class="result-mask" id="resultMask" hidden></div>';

    App._mount = function (root) {
      var engine = null;
      var box = root.querySelector('#textBox');
      var input = root.querySelector('#zhInput');
      var mask = root.querySelector('#resultMask');

      if (store.settings().keyboard) {
        kb.mount(root.querySelector('#kb'));
        kb.highlightKeys((lesson.newKeys && lesson.newKeys.length ? lesson.newKeys : (lesson.keys || '').split('')));
      }

      function upd(st) {
        root.querySelector('#mTime').textContent = fmtTime(st.elapsed);
        root.querySelector('#mSpeed').textContent = Math.round(st.speed);
        root.querySelector('#mAcc').textContent = Math.round(st.acc) + '%';
        root.querySelector('#mCombo').textContent = st.combo;
        root.querySelector('#mErr').textContent = st.errors;
        root.querySelector('#prBar').style.width = Math.round(st.index / st.total * 100) + '%';
      }

      function computeStars(res) {
        var s = 1;
        if (res.acc >= 95) s++;
        if (res.speed >= lesson.target.speed) s++;
        if (res.acc < 80) s = 1;
        return s;
      }

      function showResult(res) {
        var st = computeStars(res);
        var passed = res.acc >= lesson.target.acc && res.speed >= lesson.target.speed * 0.8;
        store.record({
          lessonId: lesson.id, mode: isZh ? 'zh' : 'en', speed: res.speed,
          acc: res.acc, chars: res.chars, ms: res.ms, stars: st, passed: passed
        });
        App.sound.win();

        var comments = ['再练一遍会更快哦！', '不错，继续加油！', '很棒！接近目标啦！', '太厉害了，打字小英雄！'];
        var ci = res.acc >= 98 ? 3 : (res.speed >= lesson.target.speed ? 2 : (res.acc >= 90 ? 1 : 0));

        var h = '<div class="result-card card">' +
          '<h2>' + (passed ? '🎉 闯关成功！' : '💪 完成练习') + '</h2>' +
          '<div class="big-stars">' + stars(st) + '</div>' +
          '<p class="result-comment">' + comments[ci] + '</p>' +
          '<div class="result-grid">' +
          '<div><b>' + Math.round(res.speed) + '</b><span>' + res.unit + '</span></div>' +
          '<div><b>' + Math.round(res.acc) + '%</b><span>准确率</span></div>' +
          '<div><b>' + fmtTime(res.ms) + '</b><span>用时</span></div>' +
          '<div><b>' + res.errors + '</b><span>打错次数</span></div>' +
          '<div><b>' + res.maxCombo + '</b><span>最高连击</span></div>' +
          '<div><b>' + res.chars + '</b><span>正确字数</span></div>' +
          '</div>' +
          '<p class="muted">目标：' + lesson.target.speed + ' ' + res.unit + ' / 准确率 ' + lesson.target.acc + '%' +
          (passed && next ? ' · 已解锁《' + esc(next.title) + '》' : '') + '</p>' +
          '<div class="result-actions">' +
          '<button class="btn btn-ghost" id="rAgain">再来一次</button>' +
          '<button class="btn btn-ghost" id="rBack">课程地图</button>' +
          (next ? '<button class="btn btn-primary" id="rNext"' + (passed ? '' : ' disabled') + '>下一课 →</button>' : '') +
          '</div></div>';
        mask.innerHTML = h;
        mask.hidden = false;
        root.querySelector('#rAgain').onclick = function () { location.reload(); };
        root.querySelector('#rBack').onclick = function () { go('#/courses'); };
        if (next) root.querySelector('#rNext').onclick = function () { go('#/practice/' + next.id); };
      }

      function boot() {
        if (engine) engine.destroy();
        mask.hidden = true;
        engine = App.createEngine({
          text: text, mode: isZh ? 'zh' : 'en', el: box, input: input, pinyin: py,
          onTick: upd,
          onFinish: showResult,
          onQuit: function () { go('#/courses'); }
        });
        engine.start();
        root.querySelector('#btnPause').textContent = '暂停';
      }

      boot();

      root.querySelector('#btnRestart').onclick = function () { App.sound.click(); location.reload(); };
      root.querySelector('#btnQuit').onclick = function () { go('#/courses'); };
      root.querySelector('#btnPause').onclick = function () {
        if (!engine || engine.isFinished()) return;
        if (engine.isPaused()) { engine.resume(); this.textContent = '暂停'; }
        else { engine.pause(); this.textContent = '继续'; }
      };
      var onBlur = function () {
        if (engine && !engine.isPaused() && !engine.isFinished()) {
          engine.pause();
          var b = root.querySelector('#btnPause');
          if (b) b.textContent = '继续';
        }
      };
      window.addEventListener('blur', onBlur);
      App._cleanup = function () {
        if (engine) engine.destroy();
        window.removeEventListener('blur', onBlur);
      };
    };

    return html;
  };

  /* ================= 速度测试 ================= */
  views.test = function () {
    var text = data.buildTestText();
    var html = '<div class="practice">' +
      '<div class="pr-head">' +
      '<button class="btn btn-icon" data-go="#/">←</button>' +
      '<div class="pr-title"><h3>⚡ 60 秒速度测试</h3><span class="muted">看看你一分钟能打多少字</span></div>' +
      '<div class="pr-goal">时间到就结束，尽可能打对！</div></div>' +
      '<div class="card pr-card">' +
      '<div class="metrics">' +
      '<div class="metric"><b id="mTime">1:00</b><span>剩余</span></div>' +
      '<div class="metric"><b id="mSpeed">0</b><span>WPM</span></div>' +
      '<div class="metric"><b id="mAcc">100%</b><span>准确率</span></div>' +
      '<div class="metric"><b id="mCombo">0</b><span>连击</span></div>' +
      '<div class="metric"><b id="mErr">0</b><span>打错</span></div>' +
      '</div>' +
      '<div class="bar sm mb"><i id="prBar" style="width:0%"></i></div>' +
      '<div class="text-box" id="textBox"></div>' +
      '<div class="finger-hint" id="fingerHint">敲下第一个字母就开始计时，加油！</div>' +
      '<div class="pr-actions"><button class="btn btn-ghost" id="btnRestart">再来一次</button>' +
      '<span class="muted ml">Esc 退出</span></div></div>';
    if (store.settings().keyboard) html += '<div class="card kb-card">' + kb.html() + '</div>';
    html += '</div><div class="result-mask" id="resultMask" hidden></div>';

    App._mount = function (root) {
      var box = root.querySelector('#textBox');
      var mask = root.querySelector('#resultMask');
      var engine = null;
      if (store.settings().keyboard) kb.mount(root.querySelector('#kb'));

      function upd(st) {
        root.querySelector('#mTime').textContent = fmtTime(Math.max(0, 60000 - st.elapsed));
        root.querySelector('#mSpeed').textContent = Math.round(st.speed);
        root.querySelector('#mAcc').textContent = Math.round(st.acc) + '%';
        root.querySelector('#mCombo').textContent = st.combo;
        root.querySelector('#mErr').textContent = st.errors;
        root.querySelector('#prBar').style.width = Math.round(st.index / st.total * 100) + '%';
      }

      function showResult(res) {
        var s = 1;
        if (res.acc >= 95) s++;
        if (res.speed >= 30) s++;
        store.record({
          lessonId: 'test', mode: 'en', speed: res.speed, acc: res.acc,
          chars: res.chars, ms: res.ms, stars: s, passed: true
        });
        App.sound.win();
        mask.innerHTML = '<div class="result-card card">' +
          '<h2>⚡ 测试完成</h2><div class="big-stars">' + stars(s) + '</div>' +
          '<div class="result-grid">' +
          '<div><b>' + Math.round(res.speed) + '</b><span>WPM</span></div>' +
          '<div><b>' + Math.round(res.acc) + '%</b><span>准确率</span></div>' +
          '<div><b>' + res.chars + '</b><span>正确字符</span></div>' +
          '<div><b>' + res.maxCombo + '</b><span>最高连击</span></div>' +
          '</div>' +
          '<div class="result-actions">' +
          '<button class="btn btn-ghost" id="rAgain">再来一次</button>' +
          '<button class="btn btn-primary" id="rBack">返回首页</button></div></div>';
        mask.hidden = false;
        root.querySelector('#rAgain').onclick = function () { location.reload(); };
        root.querySelector('#rBack').onclick = function () { go('#/'); };
      }

      engine = App.createEngine({
        text: text, mode: 'en', el: box, timeLimit: 60,
        onTick: upd, onFinish: showResult, onQuit: function () { go('#/'); }
      });
      engine.start();
      root.querySelector('#btnRestart').onclick = function () { location.reload(); };
      App._cleanup = function () { if (engine) engine.destroy(); };
    };
    return html;
  };

  /* ================= 键位挑战（字母雨） ================= */
  views.game = function () {
    var best = store.get().game.best || 0;
    var html = '<div class="page-head"><h2>🎮 键位挑战 · 字母雨</h2>' +
      '<p class="muted">字母从天上掉下来，在它们落地前敲掉对应的键！打错扣分，漏掉 5 个就结束。</p></div>' +
      '<div class="card game-card">' +
      '<div class="game-bar">' +
      '<div class="metric"><b id="gScore">0</b><span>得分</span></div>' +
      '<div class="metric"><b id="gCombo">0</b><span>连击</span></div>' +
      '<div class="metric"><b id="gLife">5</b><span>生命</span></div>' +
      '<div class="metric"><b id="gLevel">1</b><span>等级</span></div>' +
      '<div class="metric"><b>' + best + '</b><span>最高分</span></div>' +
      '</div>' +
      '<canvas id="gameCanvas" width="860" height="420"></canvas>' +
      '<div class="game-mask" id="gameMask">' +
      '<div class="game-start">' +
      '<h3>准备好了吗？</h3>' +
      '<p>选择难度开始挑战</p>' +
      '<div class="level-pick">' +
      '<button class="btn" data-level="1">字母 (简单)</button>' +
      '<button class="btn" data-level="2">字母 (普通)</button>' +
      '<button class="btn" data-level="3">字母+数字</button>' +
      '<button class="btn" data-level="4">全部键位</button>' +
      '</div></div></div>' +
      '</div>';

    App._mount = function (root) {
      var cv = root.querySelector('#gameCanvas');
      var ctx = cv.getContext('2d');
      var mask = root.querySelector('#gameMask');
      var items = [], running = false, raf = null, lastT = 0;
      var score = 0, combo = 0, life = 5, spawnAcc = 0, level = 1;

      var SETS = [
        'asdfjkl;',
        'abcdefghijklmnopqrstuvwxyz',
        'abcdefghijklmnopqrstuvwxyz0123456789',
        "abcdefghijklmnopqrstuvwxyz0123456789,./;'"
      ];

      function resize() {
        var w = cv.parentNode.clientWidth;
        if (w > 400) { cv.width = w - 2; }
      }
      resize();

      function spawn() {
        var set = SETS[level - 1] || SETS[1];
        var ch = set[Math.floor(Math.random() * set.length)];
        var x = 30 + Math.random() * (cv.width - 70);
        items.push({ ch: ch, x: x, y: -20, v: 30 + level * 12 + Math.random() * 25, dead: false });
      }

      function loop(t) {
        if (!running) return;
        var dt = Math.min(50, t - lastT) / 1000;
        lastT = t;
        var speedUp = 1 + (score / 800);
        spawnAcc += dt * (0.8 + level * 0.4) * speedUp;
        while (spawnAcc >= 1) { spawnAcc--; spawn(); }

        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.fillStyle = 'rgba(0,0,0,0)';
        for (var i = items.length - 1; i >= 0; i--) {
          var it = items[i];
          it.y += it.v * dt * speedUp;
          drawBubble(ctx, it);
          if (it.y > cv.height) {
            items.splice(i, 1);
            life--;
            combo = 0;
            App.sound.wrong();
            updBar();
            if (life <= 0) { stop(); return; }
          }
        }
        level = 1 + Math.floor(score / 300);
        if (level > 4) level = 4;
        updBar();
        raf = requestAnimationFrame(loop);
      }

      function drawBubble(c, it) {
        c.save();
        c.beginPath();
        c.arc(it.x + 16, it.y + 16, 18, 0, Math.PI * 2);
        c.fillStyle = it.pop ? 'rgba(81,207,102,.9)' : 'rgba(77,171,247,.9)';
        c.fill();
        c.fillStyle = '#fff';
        c.font = 'bold 20px ui-monospace, Menlo, Consolas, monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(it.ch.toUpperCase(), it.x + 16, it.y + 17);
        c.restore();
      }

      function updBar() {
        root.querySelector('#gScore').textContent = score;
        root.querySelector('#gCombo').textContent = combo;
        root.querySelector('#gLife').textContent = life;
        root.querySelector('#gLevel').textContent = level;
      }

      function start(lv) {
        level = lv; score = 0; combo = 0; life = 5; items = []; spawnAcc = 0;
        mask.hidden = true;
        running = true;
        updBar();
        lastT = performance.now();
        raf = requestAnimationFrame(loop);
      }

      function stop() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        store.gameRecord(score);
        App.sound.lose();
        var isBest = score >= (store.get().game.best || 0);
        mask.hidden = false;
        mask.innerHTML = '<div class="game-start"><h3>' + (isBest ? '🏆 新纪录！' : '挑战结束') + '</h3>' +
          '<p class="big-score">' + score + ' 分</p>' +
          '<p class="muted">漏掉 ' + (5 - life) + ' 个 · 等级 ' + level + ' · 最高分 ' + store.get().game.best + '</p>' +
          '<div class="level-pick"><button class="btn btn-primary" data-level="' + level + '">再玩一次</button>' +
          '<button class="btn btn-ghost" data-go="#/">返回首页</button></div></div>';
        bindMask();
      }

      function onKey(e) {
        if (!running) return;
        var k = e.key;
        if (k.length !== 1) return;
        var hit = -1;
        for (var i = 0; i < items.length; i++) {
          if (items[i].ch === k.toLowerCase()) { if (hit < 0 || items[i].y > items[hit].y) hit = i; }
        }
        if (hit >= 0) {
          items.splice(hit, 1);
          combo++;
          score += 10 + Math.min(combo, 20);
          App.sound.pop(combo);
          updBar();
        } else if (items.length) {
          combo = 0;
          score = Math.max(0, score - 2);
          App.sound.wrong();
          updBar();
        }
      }

      function bindMask() {
        var btns = mask.querySelectorAll('[data-level]');
        for (var i = 0; i < btns.length; i++) {
          btns[i].onclick = function () { start(parseInt(this.getAttribute('data-level'), 10)); };
        }
        var backs = mask.querySelectorAll('[data-go]');
        for (var j = 0; j < backs.length; j++) {
          backs[j].onclick = function () { go(this.getAttribute('data-go')); };
        }
      }
      bindMask();

      document.addEventListener('keydown', onKey);
      window.addEventListener('resize', resize);
      App._cleanup = function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        document.removeEventListener('keydown', onKey);
      };
    };
    return html;
  };

  /* ================= 学习报告 ================= */
  views.stats = function () {
    var s = store.get();
    var ov = store.overall();
    var recent = s.sessions.slice(-20);

    var html = '<div class="page-head"><h2>📊 学习报告</h2>' +
      '<p class="muted">坚持练习，曲线会一直往上走！</p></div>';

    html += '<div class="grid-4">' +
      '<div class="card stat-card"><b>' + ov.count + '</b><span>练习次数</span></div>' +
      '<div class="card stat-card"><b>' + fmtDur(ov.totalMs) + '</b><span>累计时长</span></div>' +
      '<div class="card stat-card"><b>' + Math.round(ov.best) + '</b><span>最高速度</span></div>' +
      '<div class="card stat-card"><b>' + Math.round(ov.avgAcc) + '%</b><span>平均准确率</span></div>' +
      '</div>';

    html += '<div class="grid-2 mt">' +
      '<div class="card"><h3>速度进步曲线</h3>' +
      (recent.length ? '<canvas id="chart" width="520" height="240"></canvas>'
        : '<p class="muted">还没有数据，去练习一课吧！</p>') +
      '</div>' +
      '<div class="card"><h3>需要加强的键位</h3>' + weakKeysHtml() + '</div>' +
      '</div>';

    html += '<div class="card mt"><h3>各章进度</h3>';
    data.chapters.forEach(function (ch) {
      var p = store.chapterProgress(ch);
      html += '<div class="prog-row"><span>' + ch.emoji + ' ' + esc(ch.title) + '</span>' +
        '<div class="bar sm"><i style="width:' + Math.round(p.ratio * 100) + '%"></i></div>' +
        '<b>' + p.done + '/' + p.total + '</b></div>';
    });
    html += '</div>';

    html += '<div class="card mt"><h3>成就徽章</h3><div class="ach-grid">' + achievementsHtml() + '</div></div>';

    html += '<div class="card mt"><h3>设置</h3><div class="settings">' +
      '<label><input type="checkbox" id="setSound"' + (s.settings.sound ? ' checked' : '') + '> 打字音效</label>' +
      '<label><input type="checkbox" id="setKb"' + (s.settings.keyboard ? ' checked' : '') + '> 显示虚拟键盘</label>' +
      '<label><input type="checkbox" id="setPy"' + (s.settings.pinyin ? ' checked' : '') + '> 中文课显示拼音</label>' +
      '<label><input type="checkbox" id="setDark"' + (s.settings.theme === 'dark' ? ' checked' : '') + '> 夜间模式</label>' +
      '<button class="btn btn-danger" id="btnReset">清空所有学习记录</button>' +
      '</div></div>';

    App._mount = function (root) {
      if (recent.length) drawChart(root.querySelector('#chart'), recent);
      root.querySelector('#setSound').onchange = function () { store.setSetting('sound', this.checked); };
      root.querySelector('#setKb').onchange = function () { store.setSetting('keyboard', this.checked); };
      root.querySelector('#setPy').onchange = function () { store.setSetting('pinyin', this.checked); };
      root.querySelector('#setDark').onchange = function () {
        store.setSetting('theme', this.checked ? 'dark' : 'light');
        App.applyTheme();
      };
      root.querySelector('#btnReset').onclick = function () {
        if (confirm('确定要清空所有学习记录吗？此操作不能撤销。')) {
          store.reset();
          location.hash = '#/';
          location.reload();
        }
      };
    };
    return html;
  };

  function weakKeysHtml() {
    var s = store.get();
    var keys = Object.keys(s.keyErrors);
    if (!keys.length) return '<p class="muted">太棒了，还没有出错的键位！</p>';
    var list = keys.map(function (k) {
      var e = s.keyErrors[k], h = s.keyHits[k] || 0;
      return { k: (k === ' ' ? '空格' : k), e: e, h: h, rate: h + e ? e / (h + e) : 1 };
    }).sort(function (a, b) { return b.e - a.e || b.rate - a.rate; }).slice(0, 8);
    var max = list[0].e;
    var h = '<ul class="weak">';
    list.forEach(function (x) {
      h += '<li><span class="wk">' + esc(x.k) + '</span>' +
        '<div class="bar sm"><i class="bad-bar" style="width:' + Math.round(x.e / max * 100) + '%"></i></div>' +
        '<b>' + x.e + ' 次</b></li>';
    });
    return h + '</ul>';
  }

  function achievementsHtml() {
    var s = store.get(), ov = store.overall();
    var list = [
      { ic: '🌱', name: '初次上手', desc: '完成第一次练习', got: ov.count >= 1 },
      { ic: '🔟', name: '十次练习', desc: '累计练习 10 次', got: ov.count >= 10 },
      { ic: '⭐', name: '星星收藏家', desc: '累计获得 30 颗星', got: ov.stars >= 30 },
      { ic: '🚀', name: '速度新秀', desc: '任意一课达到 30 WPM', got: ov.best >= 30 },
      { ic: '🎯', name: '百发百中', desc: '一次练习准确率 100%', got: s.sessions.some(function (x) { return x.acc >= 100; }) },
      { ic: '⌨️', name: '键位达人', desc: '第一章全部通过', got: store.chapterProgress(data.chapters[0]).ratio >= 1 },
      { ic: '🔥', name: '坚持三天', desc: '连续练习 3 天', got: store.streak() >= 3 },
      { ic: '🏆', name: '游戏高手', desc: '键位挑战拿到 500 分', got: (s.game.best || 0) >= 500 }
    ];
    return list.map(function (a) {
      return '<div class="ach' + (a.got ? ' got' : '') + '"><span class="ic">' + a.ic + '</span>' +
        '<b>' + a.name + '</b><i>' + a.desc + '</i></div>';
    }).join('');
  }

  function drawChart(cv, list) {
    var c = cv.getContext('2d');
    var w = cv.width, h = cv.height;
    var pad = 34;
    c.clearRect(0, 0, w, h);
    var max = Math.max.apply(null, list.map(function (x) { return x.speed; }));
    max = Math.max(20, Math.ceil(max / 10) * 10);

    c.strokeStyle = getComputedStyle(document.body).getPropertyValue('--line') || '#e9ecef';
    c.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted') || '#868e96';
    c.font = '12px system-ui';
    c.textAlign = 'right';
    for (var i = 0; i <= 4; i++) {
      var y = pad + (h - pad * 2) * i / 4;
      c.beginPath();
      c.moveTo(pad, y);
      c.lineTo(w - 10, y);
      c.stroke();
      c.fillText(Math.round(max * (1 - i / 4)), pad - 6, y + 4);
    }

    var step = (w - pad - 14) / Math.max(1, list.length - 1);
    var pts = list.map(function (x, i) {
      return { x: pad + step * i, y: pad + (h - pad * 2) * (1 - x.speed / max) };
    });

    var grad = c.createLinearGradient(0, pad, 0, h - pad);
    grad.addColorStop(0, 'rgba(255,122,69,.35)');
    grad.addColorStop(1, 'rgba(255,122,69,0)');
    c.beginPath();
    c.moveTo(pts[0].x, h - pad);
    pts.forEach(function (p) { c.lineTo(p.x, p.y); });
    c.lineTo(pts[pts.length - 1].x, h - pad);
    c.closePath();
    c.fillStyle = grad;
    c.fill();

    c.beginPath();
    pts.forEach(function (p, i) { i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); });
    c.strokeStyle = '#ff7a45';
    c.lineWidth = 3;
    c.lineJoin = 'round';
    c.stroke();

    pts.forEach(function (p) {
      c.beginPath();
      c.arc(p.x, p.y, 4, 0, Math.PI * 2);
      c.fillStyle = '#fff';
      c.fill();
      c.strokeStyle = '#ff7a45';
      c.lineWidth = 2;
      c.stroke();
    });
  }

  /* ================= 排行榜 ================= */
  views.rank = function () {
    var html = '<div class="page-head"><h2>🏅 排行榜</h2>' +
      '<p class="muted">和同学比一比谁更快、谁星星更多。数据来自服务器，换电脑也不会丢。</p></div>' +
      '<div class="card">' +
      '<div class="rank-tabs">' +
      '<div class="seg" id="segScope"><button data-v="class" class="on">班级榜</button><button data-v="all">全校榜</button></div>' +
      '<div class="seg" id="segBy">' +
      '<button data-v="stars" class="on">星星</button><button data-v="speed">速度</button>' +
      '<button data-v="time">时长</button><button data-v="acc">准确率</button></div>' +
      '</div>' +
      '<div id="rankBody"><p class="muted">加载中…</p></div>' +
      '</div>';

    App._mount = function (root) {
      var body = root.querySelector('#rankBody');
      var scope = 'class', by = 'stars';

      function load() {
        body.innerHTML = '<p class="muted">加载中…</p>';
        App.api.leaderboard(scope, by).then(function (d) {
          if (!d.list.length) {
            body.innerHTML = '<p class="muted">还没有人上榜，快去练习一课吧！</p>';
            return;
          }
          var h = '<div class="muted mb">共 ' + d.total + ' 位同学' +
            (d.myRank ? ' · 你的排名：<b class="hl">第 ' + d.myRank + ' 名</b>' : '') + '</div>';
          h += '<table class="rank-table"><thead><tr>' +
            '<th>名次</th><th>同学</th><th>班级</th><th>星星</th><th>最高速度</th>' +
            '<th>通过</th><th>练习</th><th>准确率</th></tr></thead><tbody>';
          d.list.forEach(function (r) {
            var me = App.api.user && r.id === App.api.user.id;
            h += '<tr class="' + (me ? 'me' : '') + '">' +
              '<td class="rk">' + (r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank) + '</td>' +
              '<td><b>' + esc(r.name) + '</b></td>' +
              '<td class="muted">' + esc(r.classCode) + '</td>' +
              '<td>' + stars(Math.min(3, Math.round(r.stars / 8))) + ' <span class="muted">' + r.stars + '</span></td>' +
              '<td>' + r.bestSpeed + '</td>' +
              '<td>' + r.passed + '</td>' +
              '<td>' + r.sessions + ' 次 / ' + fmtDur(r.totalMs) + '</td>' +
              '<td>' + r.avgAcc + '%</td></tr>';
          });
          h += '</tbody></table>';
          body.innerHTML = h;
        }).catch(function (e) {
          var msg = App.api.online
            ? '排行榜加载失败：' + esc(e.message)
            : '还没有连接服务器：请在终端输入 dazi 启动服务，再刷新页面就能看到班级排行榜。';
          var h = '<p class="muted">' + msg + '</p><div class="cloud-actions">';
          if (App.api.online) {
            h += '<button class="btn btn-primary" id="rkLogin">登录 / 注册</button>';
          }
          h += '<button class="btn btn-ghost" data-go="#/">返回首页</button></div>';
          body.innerHTML = h;
          var b = body.querySelector('#rkLogin');
          if (b) b.onclick = function () { App.showLogin(function () { App.rerender(); }); };
          var g = body.querySelector('[data-go]');
          if (g) g.onclick = function () { location.hash = this.getAttribute('data-go'); };
        });
      }

      function bindSeg(id, cb) {
        var seg = root.querySelector(id);
        seg.addEventListener('click', function (e) {
          var b = e.target.closest('button');
          if (!b) return;
          var bs = seg.querySelectorAll('button');
          for (var i = 0; i < bs.length; i++) bs[i].classList.remove('on');
          b.classList.add('on');
          cb(b.getAttribute('data-v'));
        });
      }
      bindSeg('#segScope', function (v) { scope = v; load(); });
      bindSeg('#segBy', function (v) { by = v; load(); });
      load();
    };
    return html;
  };

  /* ================= 教师后台 ================= */
  views.teacher = function () {
    var html = '<div class="page-head"><h2>👩‍🏫 教师后台</h2>' +
      '<p class="muted">输入班级码和教师口令，查看全班同学的练习情况（口令在终端运行 <code>dazi info</code> 查看）。</p></div>' +
      '<div class="card"><div id="tBody">' +
      '<form class="t-form" id="tForm">' +
      '<label>班级码<input id="tCode" placeholder="例如 3A" autocomplete="off"></label>' +
      '<label>教师口令<input id="tPass" type="password" placeholder="教师口令" autocomplete="off"></label>' +
      '<button class="btn btn-primary" type="submit">登录查看</button>' +
      '</form><p class="muted" id="tMsg"></p></div></div>';

    App._mount = function (root) {
      var body = root.querySelector('#tBody');
      var form = root.querySelector('#tForm');
      var TOKEN = null;

      form.onsubmit = function (e) {
        e.preventDefault();
        var code = root.querySelector('#tCode').value.trim();
        var pass = root.querySelector('#tPass').value.trim();
        var msg = root.querySelector('#tMsg');
        if (!code || !pass) { msg.textContent = '请填写班级码和教师口令'; return; }
        msg.textContent = '登录中…';
        App.api.teacherLogin(code, pass).then(function (d) {
          TOKEN = d.token;
          return App.api.teacherClass(code, TOKEN);
        }).then(function (d) { render(d, code); })
          .catch(function (err) {
            var m = App.api.online ? err.message
              : '还没有连接服务器：请在终端输入 dazi 启动服务后再来。';
            var msg = root.querySelector('#tMsg');
            if (msg) msg.textContent = m;
          });
      };

      function render(d, code) {
        var h = '<div class="t-head"><div><h3>' + esc(d.className) + '</h3>' +
          '<p class="muted">' + d.studentCount + ' 位学生 · ' + d.sessionCount + ' 条练习记录</p></div>' +
          '<div class="cloud-actions">' +
          '<a class="btn btn-primary" href="' + App.api.exportUrl(code, TOKEN) + '" download>⬇️ 导出 CSV</a>' +
          '<button class="btn btn-ghost" id="tReload">刷新</button>' +
          '<button class="btn btn-ghost" id="tBack">返回</button></div></div>';

        h += '<div class="grid-4">' +
          '<div class="card stat-card"><b>' + d.studentCount + '</b><span>学生人数</span></div>' +
          '<div class="card stat-card"><b>' + d.avgSpeed + '</b><span>平均最高速度</span></div>' +
          '<div class="card stat-card"><b>' + d.avgAcc + '%</b><span>平均准确率</span></div>' +
          '<div class="card stat-card"><b>' + fmtDur(d.totalMs) + '</b><span>累计练习</span></div>' +
          '</div>';

        h += '<div class="card mt"><h3>学生明细</h3><table class="rank-table"><thead><tr>' +
          '<th>名次</th><th>姓名</th><th>星星</th><th>最高速度</th><th>通过课</th>' +
          '<th>练习次数</th><th>练习时长</th><th>准确率</th><th>最近练习</th><th>操作</th></tr></thead><tbody>';
        d.students.forEach(function (s, i) {
          h += '<tr><td class="rk">' + (i + 1) + '</td><td><b>' + esc(s.name) + '</b></td>' +
            '<td>' + s.stars + '</td><td>' + s.bestSpeed + '</td><td>' + s.passed + '</td>' +
            '<td>' + s.sessions + '</td><td>' + fmtDur(s.totalMs) + '</td>' +
            '<td>' + s.avgAcc + '%</td>' +
            '<td class="muted">' + (s.lastAt ? new Date(s.lastAt).toLocaleString('zh-CN') : '-') + '</td>' +
            '<td><button class="btn tiny" data-reset="' + esc(s.name) + '">重置密码</button></td></tr>';
        });
        h += '</tbody></table></div>';

        h += '<div class="grid-2 mt">' +
          '<div class="card"><h3>全班薄弱键位</h3>';
        if (!d.weakKeys.length) h += '<p class="muted">暂没有出错记录</p>';
        else {
          h += '<ul class="weak">';
          var max = d.weakKeys[0].count;
          d.weakKeys.forEach(function (w) {
            h += '<li><span class="wk">' + esc(w.key === ' ' ? '空格' : w.key) + '</span>' +
              '<div class="bar sm"><i class="bad-bar" style="width:' + Math.round(w.count / max * 100) + '%"></i></div>' +
              '<b>' + w.count + ' 次</b></li>';
          });
          h += '</ul>';
        }
        h += '</div><div class="card"><h3>近 14 天练习活跃度</h3><div class="daily">';
        if (!d.daily.length) h += '<p class="muted">暂无数据</p>';
        else {
          var mx = Math.max.apply(null, d.daily.map(function (x) { return x.count; }));
          d.daily.forEach(function (x) {
            h += '<div class="day" title="' + x.date + '：' + x.count + ' 次">' +
              '<i style="height:' + Math.max(6, Math.round(x.count / mx * 70)) + 'px"></i>' +
              '<span>' + x.date.slice(5) + '</span></div>';
          });
        }
        h += '</div></div></div>';

        body.innerHTML = h;
        var rs = body.querySelectorAll('[data-reset]');
        for (var k = 0; k < rs.length; k++) {
          rs[k].onclick = function () {
            var n = this.getAttribute('data-reset');
            if (!confirm('把「' + n + '」的密码清空？\n清空后该学生登录时不需要密码，可重新设置。')) return;
            var btn = this;
            btn.disabled = true;
            App.api.teacherResetPassword(code, n).then(function () {
              btn.textContent = '已重置 ✓';
            }).catch(function (e) {
              btn.disabled = false;
              alert('重置失败：' + e.message);
            });
          };
        }
        body.querySelector('#tReload').onclick = function () {
          App.api.teacherClass(code, TOKEN).then(function (nd) { render(nd, code); });
        };
        body.querySelector('#tBack').onclick = function () { location.hash = '#/'; };
      }
    };
    return html;
  };

  views.esc = esc;
})(window.App);
