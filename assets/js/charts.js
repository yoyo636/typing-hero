/* 打字小英雄 · 图表（Canvas 手绘，零依赖） */
window.App = window.App || {};

(function (App) {
  'use strict';

  function css(name, fallback) {
    var v = getComputedStyle(document.body).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function fit(cv, w) {
    cv.width = w;
    return cv.getContext('2d');
  }

  var Charts = {
    /** 键盘热力图：按错误次数给键位上色 */
    keyboardHeat: function (cv, keyErrors) {
      var W = Math.min(860, cv.parentNode ? cv.parentNode.clientWidth : 860);
      var c = fit(cv, W);
      var rows = App.keyboard.ROWS;
      var kw = Math.min(46, Math.floor((W - 40) / 14));
      var gap = 4;
      var H = rows.length * (kw + gap) + 60;
      cv.height = H;
      c = cv.getContext('2d');
      c.clearRect(0, 0, W, H);

      var vals = Object.keys(keyErrors || {}).map(function (k) { return keyErrors[k]; });
      var max = vals.length ? Math.max.apply(null, vals) : 0;

      var muted = css('--muted', '#868e96').trim();
      var text = css('--text', '#2f3542').trim();
      var track = css('--track', '#f1f3f5').trim();

      rows.forEach(function (row, ri) {
        var y = 10 + ri * (kw + gap);
        var x = 10 + ri * 12;
        row.forEach(function (k) {
          var n = (keyErrors || {})[k[0]] || 0;
          var t = max ? Math.min(1, n / max) : 0;
          c.fillStyle = n ? 'rgba(255,107,107,' + (0.18 + t * 0.8) + ')' : track;
          roundRect(c, x, y, kw, kw, 8);
          c.fill();
          c.fillStyle = n && t > 0.5 ? '#fff' : text;
          c.font = 'bold ' + Math.round(kw * 0.36) + 'px system-ui, sans-serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(k[0].toUpperCase(), x + kw / 2, y + kw / 2);
          x += kw + gap;
        });
      });

      // 空格键
      var sy = 10 + rows.length * (kw + gap);
      var sn = (keyErrors || {})[' '] || 0;
      var st = max ? Math.min(1, sn / max) : 0;
      c.fillStyle = sn ? 'rgba(255,107,107,' + (0.18 + st * 0.8) + ')' : track;
      roundRect(c, 10 + 90, sy, kw * 6, kw, 8);
      c.fill();
      c.fillStyle = sn && st > 0.5 ? '#fff' : text;
      c.fillText('空格', 10 + 90 + kw * 3, sy + kw / 2);

      c.fillStyle = muted;
      c.font = '12px system-ui, sans-serif';
      c.textAlign = 'left';
      c.fillText('颜色越红，说明这个键按错得越多', 10, sy + kw + 22);
    },

    /** 练习日历（GitHub 贡献图风格） */
    calendar: function (cv, days) {
      var W = Math.min(860, cv.parentNode ? cv.parentNode.clientWidth : 860);
      var cell = Math.floor((W - 30) / 20);
      var H = cell * 7 + 40;
      var c = fit(cv, W);
      cv.height = H;
      c = cv.getContext('2d');
      c.clearRect(0, 0, W, H);

      var muted = css('--muted', '#868e96').trim();
      var track = css('--track', '#f1f3f5').trim();
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      // 从本周日往回推 20 周
      var end = new Date(today);
      end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));
      var weeks = 20;

      var max = 1;
      Object.keys(days || {}).forEach(function (k) { max = Math.max(max, days[k]); });

      for (var w = 0; w < weeks; w++) {
        for (var d = 0; d < 7; d++) {
          var dt = new Date(end);
          dt.setDate(dt.getDate() - ((weeks - 1 - w) * 7 + (6 - d)));
          var key = dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
          var ms = (days || {})[key] || 0;
          var t = ms ? Math.min(1, ms / Math.max(600000, max)) : 0;
          c.fillStyle = ms ? 'rgba(255,122,69,' + (0.25 + t * 0.75) + ')' : track;
          roundRect(c, 10 + w * (cell + 3), 10 + d * (cell + 3), cell, cell, 4);
          c.fill();
        }
      }
      c.fillStyle = muted;
      c.font = '12px system-ui, sans-serif';
      c.textAlign = 'left';
      c.fillText('最近 20 周练习记录（颜色越深，练得越久）', 10, H - 8);
    },

    /** 速度 / 准确率成长曲线 */
    line: function (cv, sessions) {
      var W = Math.min(860, cv.parentNode ? cv.parentNode.clientWidth : 860);
      var H = 240;
      var c = fit(cv, W);
      cv.height = H;
      c = cv.getContext('2d');
      c.clearRect(0, 0, W, H);

      var list = (sessions || []).slice(-25);
      if (!list.length) return;
      var pad = 36;
      var max = Math.max.apply(null, list.map(function (x) { return x.speed; }));
      max = Math.max(20, Math.ceil(max / 10) * 10);

      var line = css('--line', '#eceef1').trim();
      var muted = css('--muted', '#868e96').trim();

      c.strokeStyle = line;
      c.fillStyle = muted;
      c.font = '12px system-ui, sans-serif';
      c.textAlign = 'right';
      for (var i = 0; i <= 4; i++) {
        var y = pad + (H - pad * 2) * i / 4;
        c.beginPath();
        c.moveTo(pad, y);
        c.lineTo(W - 10, y);
        c.stroke();
        c.fillText(Math.round(max * (1 - i / 4)), pad - 6, y + 4);
      }

      var step = (W - pad - 16) / Math.max(1, list.length - 1);
      var pts = list.map(function (x, i) {
        return { x: pad + step * i, y: pad + (H - pad * 2) * (1 - x.speed / max), a: x.acc };
      });

      var grad = c.createLinearGradient(0, pad, 0, H - pad);
      grad.addColorStop(0, 'rgba(255,122,69,.35)');
      grad.addColorStop(1, 'rgba(255,122,69,0)');
      c.beginPath();
      c.moveTo(pts[0].x, H - pad);
      pts.forEach(function (p) { c.lineTo(p.x, p.y); });
      c.lineTo(pts[pts.length - 1].x, H - pad);
      c.closePath();
      c.fillStyle = grad;
      c.fill();

      c.beginPath();
      pts.forEach(function (p, i) { i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); });
      c.strokeStyle = '#ff7a45';
      c.lineWidth = 3;
      c.lineJoin = 'round';
      c.stroke();

      // 准确率（右轴，蓝色虚点）
      c.beginPath();
      pts.forEach(function (p, i) {
        var y = pad + (H - pad * 2) * (1 - p.a / 100);
        i ? c.lineTo(p.x, y) : c.moveTo(p.x, y);
      });
      c.strokeStyle = '#4dabf7';
      c.lineWidth = 2;
      c.setLineDash([5, 4]);
      c.stroke();
      c.setLineDash([]);

      pts.forEach(function (p) {
        c.beginPath();
        c.arc(p.x, p.y, 4, 0, Math.PI * 2);
        c.fillStyle = '#fff';
        c.fill();
        c.strokeStyle = '#ff7a45';
        c.lineWidth = 2;
        c.stroke();
      });

      c.textAlign = 'left';
      c.fillStyle = '#ff7a45';
      c.fillText('— 速度', pad, H - 8);
      c.fillStyle = '#4dabf7';
      c.fillText('-- 准确率', pad + 70, H - 8);
    },

    /** 完成时的礼花动画 */
    confetti: function (cv, ms) {
      var W = cv.width = cv.clientWidth || 600;
      var H = cv.height = 220;
      var c = cv.getContext('2d');
      var colors = ['#ff7a45', '#4dabf7', '#51cf66', '#fcc419', '#9775fa', '#ff6b6b'];
      var parts = [];
      for (var i = 0; i < 90; i++) {
        parts.push({
          x: Math.random() * W,
          y: -20 - Math.random() * H,
          v: 1.4 + Math.random() * 2.4,
          s: 4 + Math.random() * 5,
          r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.2,
          col: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      var t0 = performance.now();
      var dur = ms || 2400;
      (function frame(t) {
        var el = t - t0;
        c.clearRect(0, 0, W, H);
        parts.forEach(function (p) {
          p.y += p.v;
          p.r += p.vr;
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.r);
          c.fillStyle = p.col;
          c.globalAlpha = Math.max(0, 1 - el / dur);
          c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
          c.restore();
        });
        if (el < dur) requestAnimationFrame(frame);
        else c.clearRect(0, 0, W, H);
      })(t0);
    }
  };

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  App.charts = Charts;
})(window.App);
