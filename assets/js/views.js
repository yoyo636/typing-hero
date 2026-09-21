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
      '<div class="hero-mascot">' + mascotSvg() +
      '<h1>打字小英雄</h1></div>' +
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
      '<button class="entry-card" data-go="#/pk"><span class="ic">⚔️</span><b>实时对战</b><i>和同学同打一篇文章，看谁更快</i></button>' +
      '<button class="entry-card" data-go="#/drill"><span class="ic">🎯</span><b>智能特训</b><i>专练你最容易按错的键</i></button>' +
      '<button class="entry-card" data-go="#/game"><span class="ic">🎮</span><b>键位挑战</b><i>字母雨小游戏，越玩越快</i></button>' +
      '<button class="entry-card" data-go="#/stats"><span class="ic">📊</span><b>学习报告</b><i>看看进步曲线和薄弱键位</i></button>' +
      '</div>';

    // 今日训练计划
    var plan = store.plan();
    html += '<div class="card mt plan-card"><h3>📅 今日计划</h3><div class="plan-row">';
    plan.forEach(function (t) {
      html += '<button class="plan-item" data-go="' + t.go + '">' +
        '<span class="ic">' + t.icon + '</span>' +
        '<b>' + esc(t.title) + '</b><i>' + esc(t.desc) + '</i></button>';
    });
    html += '</div></div>';

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

  /* 吉祥物：一只抱着键盘的小猫 */
  function mascotSvg() {
    return '<svg class="mascot" viewBox="0 0 100 100" aria-hidden="true">' +
      '<ellipse cx="50" cy="92" rx="30" ry="5" fill="rgba(0,0,0,.08)"/>' +
      '<path d="M22 38 L18 14 L40 26 Z" fill="#ff7a45"/>' +
      '<path d="M78 38 L82 14 L60 26 Z" fill="#ff7a45"/>' +
      '<circle cx="50" cy="48" r="32" fill="#ffd8a8"/>' +
      '<circle cx="50" cy="48" r="32" fill="none" stroke="#f59f00" stroke-width="2"/>' +
      '<circle cx="38" cy="44" r="5" fill="#2f3542"/>' +
      '<circle cx="62" cy="44" r="5" fill="#2f3542"/>' +
      '<circle cx="39.5" cy="42.5" r="1.6" fill="#fff"/>' +
      '<circle cx="63.5" cy="42.5" r="1.6" fill="#fff"/>' +
      '<path d="M44 58 Q50 64 56 58" stroke="#2f3542" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<rect x="26" y="74" width="48" height="18" rx="5" fill="#4dabf7"/>' +
      '<rect x="31" y="78" width="6" height="5" rx="1.5" fill="#fff"/>' +
      '<rect x="40" y="78" width="6" height="5" rx="1.5" fill="#fff"/>' +
      '<rect x="49" y="78" width="6" height="5" rx="1.5" fill="#fff"/>' +
      '<rect x="58" y="78" width="6" height="5" rx="1.5" fill="#fff"/>' +
      '<rect x="36" y="85" width="28" height="4" rx="2" fill="#fff"/>' +
      '</svg>';
  }

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

  /* 闯关地图：一条折线串起本章所有课 */
  function mapHtml(ch) {
    var n = ch.lessons.length;
    var w = Math.max(620, n * 96 + 80);
    var h = 170;
    var pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({
        x: 50 + i * (n > 8 ? 92 : 110),
        y: 60 + (i % 3) * 38,
        i: i
      });
    }
    if (pts.length) w = Math.max(w, pts[pts.length - 1].x + 60);
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x + ' ' + p.y; }).join(' ');

    var doneCount = 0;
    ch.lessons.forEach(function (ls) { if (store.lesson(ls.id).passed) doneCount++; });

    var s = '<svg class="map" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMinYMid meet">' +
      '<path class="map-path" d="' + d + '"></path>' +
      '<path class="map-path done" d="' + d + '" style="stroke-dasharray:' +
      (pts.length > 1 ? Math.round(doneCount / (pts.length - 1) * w) : 0) + ' ' + w + '"></path>';

    pts.forEach(function (p) {
      var ls = ch.lessons[p.i];
      var r = store.lesson(ls.id);
      var unlocked = store.unlocked(ls.id);
      var cls = 'map-node ' + (r.passed ? 'done' : unlocked ? 'open' : 'locked');
      if (unlocked && !r.passed) cls += ' current';
      var label = r.passed ? '★' : unlocked ? String(p.i + 1) : '🔒';
      s += '<g class="' + cls + '"' + (unlocked ? ' data-go="#/practice/' + ls.id + '"' : '') + '>' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="22"></circle>' +
        '<text x="' + p.x + '" y="' + p.y + '">' + label + '</text>' +
        '<text class="map-tip" x="' + p.x + '" y="' + (p.y + 38) + '">' +
        esc(ls.title.replace(/^第\d+课\s*/, '').slice(0, 6)) + '</text>' +
        (unlocked ? '<title>' + esc(ls.title) + '</title>' : '') +
        '</g>';
    });
    s += '</svg>';
    return s;
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

      html += '<div class="map-wrap">' + mapHtml(ch) + '</div>';

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
    var lesson = id === 'drill' ? buildDrillLesson()
      : id === 'wrong' ? buildWrongLesson()
        : data.getLesson(id);
    if (!lesson) return '<div class="card"><p>找不到这节课</p><button class="btn" data-go="#/courses">返回课程</button></div>';

    var isZh = lesson.type === 'zh';
    var text = data.buildText(lesson);
    var py = (isZh && store.settings().pinyin) ? data.pinyinList(lesson) : null;
    var record = store.lesson(id);
    var next = data.getLesson(id) ? store.nextLesson(id) : null;   // 特训/错词课没有"下一课"

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
      if (!text || !text.length) {
        box.innerHTML = '<p class="muted">暂时没有可练习的内容，先去课程里练几课，系统就能生成针对你的练习啦。</p>';
      }

      function upd(st) {
        root.querySelector('#mTime').textContent = fmtTime(st.elapsed);
        root.querySelector('#mSpeed').textContent = Math.round(st.speed);
        root.querySelector('#mAcc').textContent = Math.round(st.acc) + '%';
        var cm = root.querySelector('#mCombo');
        cm.textContent = st.combo;
        cm.parentNode.classList.toggle('hot', st.combo >= 10);
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
        var real = !!data.getLesson(lesson.id);   // 特训/错词不计入课程星星
        store.record({
          lessonId: lesson.id, mode: isZh ? 'zh' : 'en', speed: res.speed,
          acc: res.acc, chars: res.chars, ms: res.ms,
          stars: real ? st : 0, passed: real ? passed : false
        });
        App.sound.win();

        var comments = ['再练一遍会更快哦！', '不错，继续加油！', '很棒！接近目标啦！', '太厉害了，打字小英雄！'];
        var ci = res.acc >= 98 ? 3 : (res.speed >= lesson.target.speed ? 2 : (res.acc >= 90 ? 1 : 0));

        var h = '<div class="result-card card">' +
          '<canvas class="confetti" id="confetti"></canvas>' +
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
        var cf = mask.querySelector('#confetti');
        if (cf && App.charts) App.charts.confetti(cf, 2200);
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

  /* ================= 成绩单（可打印 / 可分享） ================= */
  function reportHtml(d, shared) {
    var s = d.summary;
    var h = '<h3>' + esc(d.user.name) + ' 的打字成绩单' + (d.user.classCode ? ' · ' + esc(d.user.classCode) : '') + '</h3>';
    h += '<div class="grid-4">' +
      '<div class="card stat-card"><b>' + s.stars + '</b><span>星星</span></div>' +
      '<div class="card stat-card"><b>' + s.bestSpeed + '</b><span>最高速度</span></div>' +
      '<div class="card stat-card"><b>' + s.avgAcc + '%</b><span>平均准确率</span></div>' +
      '<div class="card stat-card"><b>' + Math.round(s.totalMs / 60000) + '</b><span>练习分钟</span></div>' +
      '</div>';
    if (d.rank) {
      h += '<p class="mt">班级排名：<b class="hl">第 ' + d.rank + ' 名</b> / 共 ' + d.classSize + ' 位同学 · 通过 ' + s.passed + ' 门课 · 练习 ' + s.sessions + ' 次</p>';
    }
    if (d.weakKeys && d.weakKeys.length) {
      h += '<div class="card mt"><h3>需要加强的键位</h3><div class="chips">' +
        d.weakKeys.map(function (w) {
          return '<span class="chip">' + esc(w.key === ' ' ? '空格' : w.key) + '<i>' + w.count + '</i></span>';
        }).join('') + '</div></div>';
    }
    if (d.sessions && d.sessions.length) {
      h += '<div class="card mt"><h3>最近练习</h3><ul class="recent">' +
        d.sessions.slice().reverse().map(function (x) {
          var l = data.getLesson(x.lessonId);
          return '<li><span class="t">' + esc(l ? l.title : '自由练习') + '</span>' +
            '<span class="v">' + x.speed + ' <i>' + (x.mode === 'zh' ? '字/分' : 'WPM') + '</i></span>' +
            '<span class="a">' + x.acc + '%</span></li>';
        }).join('') + '</ul></div>';
    }
    if (!shared) {
      h += '<div class="cloud-actions mt">' +
        '<button class="btn btn-primary" id="rpShare">生成家长查看链接</button>' +
        '<button class="btn btn-soft" id="rpPrint">打印 / 存成 PDF</button>' +
        '<button class="btn btn-ghost" id="rpBack">返回</button></div>' +
        '<p class="muted mt" id="rpLink"></p>';
    } else {
      h += '<p class="muted mt">这是只读页面，数据来自 ' + (new Date()).toLocaleDateString('zh-CN') + ' 的同步记录。</p>';
    }
    return h;
  }

  views.report = function () {
    var s = store.get();
    var ov = store.overall();
    var days = s.days || {};
    var html = '<div class="page-head"><h2>📄 我的成绩单</h2>' +
      '<p class="muted">可以直接打印或存成 PDF，也可以生成链接发给爸爸妈妈查看。</p></div>' +
      '<div class="card report-card" id="reportBody">' +
      reportHtml({
        user: { name: App.api.user ? App.api.user.name : (s.profile && s.profile.name) || '我', classCode: App.api.user ? App.api.user.classCode : '' },
        summary: {
          stars: ov.stars, bestSpeed: Math.round(ov.best), avgAcc: Math.round(ov.avgAcc),
          totalMs: ov.totalMs, passed: ov.passed, sessions: ov.count
        },
        weakKeys: store.topWeakKeys(8).map(function (x) { return { key: x.k, count: x.n }; }),
        sessions: (s.sessions || []).slice(-15)
      }, false) +
      '</div>' +
      '<div class="grid-2 mt">' +
      '<div class="card"><h3>练习日历</h3><canvas id="calCanvas"></canvas></div>' +
      '<div class="card"><h3>速度成长曲线</h3><canvas id="lineCanvas"></canvas></div>' +
      '</div>' +
      '<div class="card mt"><h3>键盘热力图</h3><canvas id="heatCanvas"></canvas></div>';

    App._mount = function (root) {
      App.charts.calendar(root.querySelector('#calCanvas'), days);
      App.charts.line(root.querySelector('#lineCanvas'), s.sessions || []);
      App.charts.keyboardHeat(root.querySelector('#heatCanvas'), s.keyErrors || {});

      root.querySelector('#rpPrint').onclick = function () { window.print(); };
      root.querySelector('#rpBack').onclick = function () { location.hash = '#/stats'; };
      root.querySelector('#rpShare').onclick = function () {
        var out = root.querySelector('#rpLink');
        if (!App.api.online) { out.textContent = '服务器未连接，请先运行 dazi。'; return; }
        App.api.share().then(function (d) {
          var url = location.origin + location.pathname + '#/r/' + d.token;
          if (location.protocol === 'file:') url = App.api.base + '/#/r/' + d.token;
          out.innerHTML = '家长查看链接：<b>' + url + '</b>（点右侧复制）';
          var btn = document.createElement('button');
          btn.className = 'btn btn-ghost';
          btn.textContent = '复制链接';
          btn.onclick = function () {
            var ta = document.createElement('textarea');
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); btn.textContent = '已复制 ✓'; } catch (e) { /* ignore */ }
            document.body.removeChild(ta);
          };
          out.appendChild(btn);
        }).catch(function (e) { out.textContent = '生成失败：' + e.message; });
      };
    };
    return html;
  };

  /* 家长/老师只读查看：#/r/:token */
  views.share = function (params) {
    var token = params && params[0];
    var html = '<div class="page-head"><h2>👀 学习报告</h2>' +
      '<p class="muted">这是同学分享出来的只读成绩单。</p></div>' +
      '<div class="card" id="shareBody"><p class="muted">加载中…</p></div>';
    App._mount = function (root) {
      var body = root.querySelector('#shareBody');
      if (!App.api.online) {
        body.innerHTML = '<p class="muted">无法连接服务器，请在终端运行 dazi 后刷新页面。</p>';
        return;
      }
      App.api.report(token).then(function (d) {
        body.innerHTML = reportHtml(d, true);
      }).catch(function (e) {
        body.innerHTML = '<p class="muted">加载失败：' + esc(e.message) + '</p>';
      });
    };
    return html;
  };
  views.r = views.share;

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

    html += '<div class="card report-cta">' +
      '<div><h3>📄 我的成绩单</h3><p class="muted">一键生成可打印的成绩单，或生成链接给家长查看。</p></div>' +
      '<button class="btn btn-primary" data-go="#/report">打开成绩单</button></div>';

    html += '<div class="grid-2 mt">' +
      '<div class="card"><h3>速度进步曲线</h3>' +
      (recent.length ? '<canvas id="chart"></canvas>' : '<p class="muted">还没有数据，去练习一课吧！</p>') +
      '</div>' +
      '<div class="card"><h3>需要加强的键位</h3>' + weakKeysHtml() + '</div>' +
      '</div>';

    html += '<div class="grid-2 mt">' +
      '<div class="card"><h3>练习日历</h3><canvas id="calCanvas"></canvas></div>' +
      '<div class="card"><h3>键盘热力图</h3><canvas id="heatCanvas"></canvas></div>' +
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
      if (recent.length) App.charts.line(root.querySelector('#chart'), recent);
      App.charts.calendar(root.querySelector('#calCanvas'), s.days || {});
      App.charts.keyboardHeat(root.querySelector('#heatCanvas'), s.keyErrors || {});
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
    var passedChapters = data.chapters.filter(function (c) {
      return store.chapterProgress(c).ratio >= 1;
    }).length;
    var zhCount = (s.sessions || []).filter(function (x) { return x.mode === 'zh'; }).length;
    var star3 = 0;
    Object.keys(s.lessons || {}).forEach(function (k) { if (s.lessons[k].stars >= 3) star3++; });

    var list = [
      { ic: '🌱', name: '初次上手', desc: '完成第一次练习', got: ov.count >= 1 },
      { ic: '🔟', name: '十次练习', desc: '累计练习 10 次', got: ov.count >= 10 },
      { ic: '💯', name: '百次练习', desc: '累计练习 100 次', got: ov.count >= 100 },
      { ic: '⭐', name: '星星收藏家', desc: '累计获得 30 颗星', got: ov.stars >= 30 },
      { ic: '🌟', name: '满天星', desc: '累计获得 100 颗星', got: ov.stars >= 100 },
      { ic: '🚀', name: '速度新秀', desc: '任意一课达到 30 WPM', got: ov.best >= 30 },
      { ic: '✈️', name: '飞速少年', desc: '任意一课达到 60 WPM', got: ov.best >= 60 },
      { ic: '🎯', name: '百发百中', desc: '一次练习准确率 100%', got: s.sessions.some(function (x) { return x.acc >= 100; }) },
      { ic: '⌨️', name: '键位达人', desc: '第一章全部通过', got: store.chapterProgress(data.chapters[0]).ratio >= 1 },
      { ic: '🏅', name: '通关一章', desc: '任意一章全部通过', got: passedChapters >= 1 },
      { ic: '👑', name: '全部学完', desc: '所有章节全部通过', got: passedChapters === data.chapters.length },
      { ic: '🔥', name: '坚持三天', desc: '连续练习 3 天', got: store.streak() >= 3 },
      { ic: '📅', name: '坚持一周', desc: '连续练习 7 天', got: store.streak() >= 7 },
      { ic: '🏆', name: '游戏高手', desc: '键位挑战拿到 500 分', got: (s.game.best || 0) >= 500 },
      { ic: '🈶', name: '中文小能手', desc: '完成 10 次中文练习', got: zhCount >= 10 },
      { ic: '🥇', name: '完美主义', desc: '拿到 10 个三星课程', got: star3 >= 10 }
    ];
    return list.map(function (a) {
      return '<div class="ach' + (a.got ? ' got' : '') + '"><span class="ic">' + a.ic + '</span>' +
        '<b>' + a.name + '</b><i>' + a.desc + '</i></div>';
    }).join('');
  }


  /* ================= 智能特训 / 错词本 ================= */

  /* 智能特训课：用你最常按错的键生成练习 */
  function buildDrillLesson() {
    var weak = store.topWeakKeys(5);
    var keys = weak.map(function (x) { return x.k; });
    var r = data.buildSmartKeyText(keys, 90);
    return {
      id: 'drill', title: '智能特训 · 薄弱键', chapterTitle: '智能训练',
      type: 'keys', keys: r.keys.join(''), mix: '', fixedText: r.text,
      length: 90,
      target: { acc: 92, speed: 30 },
      newKeys: keys,
      tips: keys.length
        ? '这几个键你最容易按错，练习里它们占 70%，连打两遍就会顺手很多。'
        : '还没有发现薄弱键位，先随便练一课吧！'
    };
  }

  /* 错词重练课：把打错的单词重新排一遍 */
  function buildWrongLesson() {
    var ww = store.topWeakWords(20);
    var r = data.buildWrongWordText(ww.map(function (x) { return { w: x.w, n: x.n }; }), 90);
    return {
      id: 'wrong', title: '错词重练', chapterTitle: '错词本',
      type: 'words', words: ww.length ? ww.map(function (x) { return x.w; }) : data.words.mix,
      fixedText: ww.length ? r : '',
      length: 90,
      target: { acc: 92, speed: 32 },
      newKeys: [],
      tips: '这些词你以前打错过，放慢一点，把每个字母想清楚再敲。'
    };
  }

  views.drill = function () {
    var weak = store.topWeakKeys(8);
    var ww = store.topWeakWords(8);
    var html = '<div class="page-head"><h2>🎯 智能特训</h2>' +
      '<p class="muted">系统会盯着你最容易按错的键和最容易打错的词，自动生成只属于你的练习。</p></div>';

    html += '<div class="grid-2">' +
      '<div class="card"><h3>最容易按错的键</h3>';
    if (!weak.length) {
      html += '<p class="muted">太棒了，还没有出错的键！先去课程里练几课，系统会持续跟踪。</p>';
    } else {
      var max = weak[0].n;
      html += '<ul class="weak">';
      weak.forEach(function (x) {
        html += '<li><span class="wk">' + esc(x.k === ' ' ? '空格' : x.k) + '</span>' +
          '<div class="bar sm"><i class="bad-bar" style="width:' + Math.round(x.n / max * 100) + '%"></i></div>' +
          '<b>' + x.n + ' 次</b></li>';
      });
      html += '</ul>';
    }
    html += '</div>';

    html += '<div class="card"><h3>错词本</h3>';
    if (!ww.length) {
      html += '<p class="muted">还没有错词记录。打错的单词/汉字会自动收进这里。</p>';
    } else {
      html += '<div class="chips">';
      ww.forEach(function (x) {
        html += '<span class="chip">' + esc(x.w) + '<i>' + x.n + '</i></span>';
      });
      html += '</div><p class="muted mt">错得越多，在错词重练里出现得越频繁。</p>';
    }
    html += '</div></div>';

    html += '<div class="card mt"><h3>开始训练</h3><div class="cloud-actions">' +
      '<button class="btn btn-primary" id="dStart"' + (weak.length ? '' : ' disabled') + '>开始薄弱键特训</button>' +
      '<button class="btn btn-soft" id="wStart"' + (ww.length ? '' : ' disabled') + '>错词重练</button>' +
      '<button class="btn btn-ghost" data-go="#/wrong">管理错词本</button>' +
      '</div>' +
      '<p class="muted mt">小提示：特训文本每次都会重新生成，连打 2~3 遍效果最好。</p></div>';

    App._mount = function (root) {
      var a = root.querySelector('#dStart');
      if (a) a.onclick = function () { location.hash = '#/practice/drill'; };
      var b = root.querySelector('#wStart');
      if (b) b.onclick = function () { location.hash = '#/practice/wrong'; };
      var c = root.querySelector('[data-go]');
      if (c) c.onclick = function () { location.hash = this.getAttribute('data-go'); };
    };
    return html;
  };

  views.wrong = function () {
    var en = store.topWeakWords(100);
    var zh = Object.keys(store.mistakes('zh')).map(function (k) {
      return { w: k, n: store.mistakes('zh')[k] };
    }).sort(function (a, b) { return b.n - a.n; });

    var html = '<div class="page-head"><h2>📕 错词本</h2>' +
      '<p class="muted">打错的单词、汉字都会自动收进来。复习一遍再重练，进步最快。</p></div>';

    function list(items, title, kind) {
      var h = '<div class="card mt"><h3>' + title + '（' + items.length + '）</h3>';
      if (!items.length) return h + '<p class="muted">暂无记录</p></div>';
      h += '<div class="chips">';
      items.slice(0, 60).forEach(function (x) {
        h += '<span class="chip">' + esc(x.w) + '<i>' + x.n + '</i></span>';
      });
      h += '</div><div class="cloud-actions">' +
        '<button class="btn btn-primary" data-practice="' + kind + '">重练这些</button>' +
        '<button class="btn btn-danger" data-clear="' + kind + '">清空</button></div></div>';
      return h;
    }

    html += list(en, '英文错词', 'en');
    html += list(zh, '中文错句', 'zh');

    App._mount = function (root) {
      var ps = root.querySelectorAll('[data-practice]');
      for (var i = 0; i < ps.length; i++) {
        ps[i].onclick = function () {
          if (this.getAttribute('data-practice') === 'zh') {
            // 中文错句重练：直接进中文课
            location.hash = '#/practice/l4-5';
          } else {
            location.hash = '#/practice/wrong';
          }
        };
      }
      var cs = root.querySelectorAll('[data-clear]');
      for (var j = 0; j < cs.length; j++) {
        cs[j].onclick = function () {
          if (!confirm('确定清空这部分的错词记录吗？')) return;
          store.clearMistakes(this.getAttribute('data-clear') === 'zh' ? 'zh' : 'en');
          App.rerender();
        };
      }
    };
    return html;
  };

  /* ================= 实时 PK ================= */
  views.pk = function () {
    var html = '<div class="page-head"><h2>⚔️ 实时对战</h2>' +
      '<p class="muted">和同学比一比：一方创建房间拿到 4 位房间码，另一方输入房间码加入，同一篇文章同时开打。</p></div>' +
      '<div class="card"><div id="pkBody">' +
      '<div class="pk-join">' +
      '<button class="btn btn-primary" id="pkCreate">创建房间</button>' +
      '<div class="pk-or">或</div>' +
      '<div class="pk-input">' +
      '<input id="pkCode" maxlength="4" placeholder="房间码" autocomplete="off">' +
      '<button class="btn btn-soft" id="pkJoin">加入</button>' +
      '</div></div>' +
      '<p class="muted mt" id="pkMsg">' + (App.api.online ? (App.api.user ? '准备好了就创建房间吧！' : '登录后才能记录战绩哦。') : '服务器未连接，请在终端运行 dazi。') + '</p>' +
      '</div></div>';

    App._mount = function (root) {
      var body = root.querySelector('#pkBody');
      var msg = root.querySelector('#pkMsg');
      var es = null, engine = null, code = null, myId = null, lastPost = 0, room = null;

      function closeStream() { if (es) { es.close(); es = null; } }

      var builtStatus = null;

      /** 比赛进行中只更新数字，不重建 DOM（否则会丢掉正在打的文本） */
      function updateLive(state) {
        var stEl = body.querySelector('.pk-status');
        if (stEl) stEl.textContent = state.status === 'race' ? '比赛中！' : '本局结束';
        var cards = body.querySelectorAll('.pk-player');
        var me = null, other = null;
        state.players.forEach(function (p) {
          if (App.api.user && p.id === App.api.user.id) me = p; else other = p;
        });
        [me, other].forEach(function (p, i) {
          var card = cards[i];
          if (!card || !p) return;
          var pct = Math.round(p.index / state.total * 100);
          card.querySelector('.pk-bar i').style.width = pct + '%';
          card.querySelector('.pk-num').textContent =
            Math.round(p.speed) + ' WPM · ' + Math.round(p.acc) + '% · ' + pct + '%';
        });
        if (state.status === 'end') {
          if (engine) { engine.destroy(); engine = null; }
          if (!body.querySelector('.pk-result')) {
            body.insertAdjacentHTML('beforeend', resultHtml(state));
            var ag = body.querySelector('#pkAgain');
            if (ag) ag.onclick = function () {
              closeStream();
              if (code) App.api.pkLeave(code).catch(function () { });
              App.rerender();
            };
          }
        }
      }

      function resultHtml(state) {
        var rank = state.players.slice().sort(function (a, b) {
          if (a.finishedAt && b.finishedAt) return a.finishedAt - b.finishedAt;
          if (a.finishedAt) return -1;
          if (b.finishedAt) return 1;
          return b.index - a.index;
        });
        var win = rank[0] && App.api.user && rank[0].id === App.api.user.id;
        return '<div class="pk-result ' + (win ? 'win' : 'lose') + '">' +
          '<h3>' + (win ? '🏆 你赢啦！' : '💪 这局输了，再来一次？') + '</h3>' +
          '<ol>' + rank.map(function (p) {
            return '<li><b>' + esc(p.name) + '</b> · ' + Math.round(p.speed) + ' WPM · ' +
              Math.round(p.acc) + '% · ' + (p.finishedAt ? '完成' : Math.round(p.index / state.total * 100) + '%') + '</li>';
          }).join('') + '</ol>' +
          '<button class="btn btn-primary" id="pkAgain">再来一局</button></div>';
      }

      function render(state) {
        if (!state) return;
        room = state;
        if (builtStatus && builtStatus !== 'wait' && builtStatus === state.status) {
          updateLive(state);
          return;
        }
        if (engine) { engine.destroy(); engine = null; }
        var me = null, other = null;
        state.players.forEach(function (p) {
          if (App.api.user && p.id === App.api.user.id) me = p; else other = p;
        });
        var h = '';
        h += '<div class="pk-top">' +
          '<div class="pk-code">房间码 <b>' + esc(state.code) + '</b></div>' +
          '<div class="pk-status">' + (state.status === 'wait' ? '等待对手…'
            : state.status === 'race' ? '比赛中！' : '本局结束') + '</div>' +
          '<button class="btn btn-ghost" id="pkLeave">离开房间</button></div>';

        h += '<div class="pk-board">';
        [me, other].forEach(function (p, i) {
          var name = p ? p.name : (i === 0 ? '我' : '等待对手加入…');
          var pct = p ? Math.round(p.index / state.total * 100) : 0;
          h += '<div class="pk-player' + (i === 0 ? ' me' : '') + (p ? '' : ' empty') + '">' +
            '<div class="pk-name">' + esc(name) + (i === 0 ? '（我）' : '') + '</div>' +
            '<div class="pk-bar"><i style="width:' + pct + '%"></i></div>' +
            '<div class="pk-num">' + (p ? Math.round(p.speed) + ' WPM · ' + Math.round(p.acc) + '% · ' + pct + '%' : '—') + '</div>' +
            '</div>';
        });
        h += '</div>';

        if (state.status === 'wait') {
          h += '<div class="pk-actions">' +
            '<button class="btn btn-primary" id="pkStart"' + (state.players.length < 2 ? ' disabled' : '') + '>' +
            (state.players.length < 2 ? '等待同学加入…' : '开始比赛') + '</button>' +
            '<p class="muted">把房间码告诉同学，两人到齐就能开打。</p></div>';
        } else {
          h += '<div class="text-box" id="pkText"></div>';
          h += '<div class="pk-live"><span id="pkSpeed">0</span> WPM · <span id="pkAcc">100</span>% · 剩余 <span id="pkLeft">0</span></div>';
        }

        if (state.status === 'end') h += resultHtml(state);
        body.innerHTML = h;
        builtStatus = state.status;
        bind(state);
      }

      function bind(state) {
        var lv = body.querySelector('#pkLeave');
        if (lv) lv.onclick = function () {
          closeStream();
          if (code) App.api.pkLeave(code).catch(function () { });
          location.hash = '#/pk';
          App.rerender();
        };
        var st = body.querySelector('#pkStart');
        if (st) st.onclick = function () {
          App.api.pkStart(code).then(function (d) { render(d.room); }).catch(function (e) { msg.textContent = e.message; });
        };
        var ag = body.querySelector('#pkAgain');
        if (ag) ag.onclick = function () {
          closeStream();
          if (code) App.api.pkLeave(code).catch(function () { });
          App.rerender();
        };
        if (state.status === 'race' && !engine) startRace(state);
      }

      function startRace(state) {
        var box = body.querySelector('#pkText');
        if (!box) return;
        engine = App.createEngine({
          text: state.text, mode: 'en', el: box,
          onTick: function (s) {
            var sp = body.querySelector('#pkSpeed');
            if (!sp) return;
            sp.textContent = Math.round(s.speed);
            body.querySelector('#pkAcc').textContent = Math.round(s.acc);
            body.querySelector('#pkLeft').textContent = (s.total - s.index);
            var now = Date.now();
            if (now - lastPost > 300) {
              lastPost = now;
              App.api.pkProgress(code, {
                index: s.index, speed: s.speed, acc: s.acc, finished: false
              }).catch(function () { });
            }
          },
          onFinish: function (res) {
            App.api.pkProgress(code, {
              index: state.text.length, speed: res.speed, acc: res.acc, finished: true
            }).catch(function () { });
            App.store.record({
              lessonId: 'pk', mode: 'en', speed: res.speed, acc: res.acc,
              chars: res.chars, ms: res.ms, stars: 0, passed: false
            });
            App.sound.win();
          }
        });
        engine.start();
      }

      function open(codeStr) {
        code = codeStr;
        closeStream();
        es = App.api.pkStream(code);
        es.addEventListener('state', function (e) {
          try { render(JSON.parse(e.data)); } catch (err) { /* ignore */ }
        });
        es.onerror = function () { /* EventSource 会自动重连 */ };
      }

      root.querySelector('#pkCreate').onclick = function () {
        if (!App.api.online) { msg.textContent = '服务器未连接，请在终端运行 dazi。'; return; }
        if (!App.api.user) { App.showLogin(); return; }
        App.api.pkCreate().then(function (d) {
          myId = App.api.user.id;
          render(d.room);
          open(d.room.code);
        }).catch(function (e) { msg.textContent = e.message; });
      };
      root.querySelector('#pkJoin').onclick = function () {
        var c = (root.querySelector('#pkCode').value || '').toUpperCase().trim();
        if (c.length !== 4) { msg.textContent = '房间码是 4 位哦'; return; }
        App.api.pkJoin(c).then(function (d) {
          render(d.room);
          open(c);
        }).catch(function (e) { msg.textContent = e.message; });
      };

      App._cleanup = function () { closeStream(); if (engine) engine.destroy(); };
    };
    return html;
  };

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
