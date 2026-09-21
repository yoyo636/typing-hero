/* 打字小英雄 · 虚拟键盘与指法提示 */
window.App = window.App || {};

(function (App) {
  'use strict';

  // 手指代号：l=左 r=右, p=小指 r=无名指 m=中指 i=食指 t=拇指
  var FINGERS = {
    lp: { name: '左手小指', color: '#ff922b' },
    lr: { name: '左手无名指', color: '#fcc419' },
    lm: { name: '左手中指', color: '#a9e34b' },
    li: { name: '左手食指', color: '#38d9a9' },
    lt: { name: '大拇指', color: '#868e96' },
    ri: { name: '右手食指', color: '#4dabf7' },
    rm: { name: '右手中指', color: '#9775fa' },
    rr: { name: '右手无名指', color: '#f783ac' },
    rp: { name: '右手小指', color: '#ff6b6b' }
  };

  var ROWS = [
    [
      ['`', '~', 'lp'], ['1', '!', 'lp'], ['2', '@', 'lr'], ['3', '#', 'lm'],
      ['4', '$', 'li'], ['5', '%', 'li'], ['6', '^', 'ri'], ['7', '&', 'ri'],
      ['8', '*', 'rm'], ['9', '(', 'rr'], ['0', ')', 'rp'], ['-', '_', 'rp'], ['=', '+', 'rp']
    ],
    [
      ['q', 'Q', 'lp'], ['w', 'W', 'lr'], ['e', 'E', 'lm'], ['r', 'R', 'li'], ['t', 'T', 'li'],
      ['y', 'Y', 'ri'], ['u', 'U', 'ri'], ['i', 'I', 'rm'], ['o', 'O', 'rr'], ['p', 'P', 'rp'],
      ['[', '{', 'rp'], [']', '}', 'rp'], ['\\', '|', 'rp']
    ],
    [
      ['a', 'A', 'lp'], ['s', 'S', 'lr'], ['d', 'D', 'lm'], ['f', 'F', 'li'], ['g', 'G', 'li'],
      ['h', 'H', 'ri'], ['j', 'J', 'ri'], ['k', 'K', 'rm'], ['l', 'L', 'rr'], [';', ':', 'rr'],
      ["'", '"', 'rp']
    ],
    [
      ['z', 'Z', 'lp'], ['x', 'X', 'lr'], ['c', 'C', 'lm'], ['v', 'V', 'li'], ['b', 'B', 'li'],
      ['n', 'N', 'ri'], ['m', 'M', 'ri'], [',', '<', 'rm'], ['.', '>', 'rr'], ['/', '?', 'rp']
    ]
  ];

  var map = {};
  ROWS.forEach(function (row) {
    row.forEach(function (k) {
      map[k[0]] = { finger: k[2], shift: false };
      map[k[1]] = { finger: k[2], shift: true };
    });
  });
  map[' '] = { finger: 'lt', shift: false };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function cssEsc(s) {
    if (s === '"') return '\\"';
    if (s === "'") return "\\'";
    if (s === '\\') return '\\\\';
    return s;
  }

  var Keyboard = {
    FINGERS: FINGERS,
    ROWS: ROWS,

    html: function () {
      var h = '<div class="kb" id="kb">';
      ROWS.forEach(function (row) {
        h += '<div class="kb-row">';
        row.forEach(function (k) {
          var f = FINGERS[k[2]];
          h += '<div class="kb-key" data-key="' + esc(k[0]) + '" data-finger="' + k[2] +
            '" style="--fc:' + f.color + '">' +
            '<span class="kb-shift">' + esc(k[1]) + '</span>' +
            '<span class="kb-main">' + esc(k[0]) + '</span></div>';
        });
        h += '</div>';
      });
      h += '<div class="kb-row">' +
        '<div class="kb-key kb-mod" data-key="ShiftL" style="--fc:' + FINGERS.lp.color + '">' +
        '<span class="kb-main">Shift</span></div>' +
        '<div class="kb-key kb-space" data-key=" " style="--fc:' + FINGERS.lt.color + '">' +
        '<span class="kb-main">空格</span></div>' +
        '<div class="kb-key kb-mod" data-key="ShiftR" style="--fc:' + FINGERS.rp.color + '">' +
        '<span class="kb-main">Shift</span></div>' +
        '</div>';
      h += '</div>';
      return h;
    },

    mount: function (root) {
      this.root = typeof root === 'string' ? document.querySelector(root) : root;
      return this;
    },

    _find: function (key) {
      return this.root ? this.root.querySelector('[data-key="' + cssEsc(key) + '"]') : null;
    },

    clear: function () {
      if (!this.root) return;
      var els = this.root.querySelectorAll('.kb-key.on, .kb-key.err, .kb-key.hint');
      for (var i = 0; i < els.length; i++) els[i].classList.remove('on', 'err', 'hint');
    },

    /** 高亮某个字符对应的按键 */
    press: function (ch, isErr) {
      if (!this.root || typeof ch !== 'string' || !ch.length) return;
      this.clear();
      if (ch.charCodeAt(0) > 127) { // 中文等字符不参与键位提示
        var h = document.getElementById('fingerHint');
        if (h) { h.textContent = '继续加油！'; h.className = 'finger-hint'; h.style.color = ''; }
        return;
      }
      var info = map[ch];
      var isUpper = !!(info && info.shift);
      var key = (ch === ' ') ? ' ' : (typeof ch === 'string' ? ch.toLowerCase() : null);
      if (!key) return;
      var el = this._find(key);
      if (el) el.classList.add(isErr ? 'err' : 'on');
      if (isUpper) {
        var left = info.finger.charAt(0) === 'l';
        var sf = this._find(left ? 'ShiftL' : 'ShiftR');
        if (sf) sf.classList.add('on');
      }
      var hint = document.getElementById('fingerHint');
      if (hint) {
        if (isErr) {
          hint.textContent = '按错啦！看看下面的键盘';
          hint.className = 'finger-hint err';
          hint.style.color = '#ff6b6b';
        } else {
          var f = FINGERS[info ? info.finger : 'lt'];
          hint.textContent = f.name + ' → ' + (ch === ' ' ? '空格' : ch) + (isUpper ? '（按住 Shift）' : '');
          hint.className = 'finger-hint';
          hint.style.color = f.color;
        }
      }
    },

    /** 在已高亮的基础上，额外标红按错的键（不清除期望键高亮） */
    markWrong: function (ch) {
      if (!this.root || typeof ch !== 'string') return;
      var el = this._find(ch.toLowerCase());
      if (el) el.classList.add('err');
    },

    hintWrong: function (expect) {
      var hint = document.getElementById('fingerHint');
      if (!hint) return;
      hint.textContent = '按错啦！应该按 ' + (expect === ' ' ? '空格' : expect);
      hint.className = 'finger-hint err';
      hint.style.color = '#ff6b6b';
    },

    /** 提示本课使用到的键 */
    highlightKeys: function (chars) {
      if (!this.root || !chars || !chars.length) return;
      this.clear();
      var self = this;
      chars.forEach(function (c) {
        var el = self._find(String(c).toLowerCase());
        if (el) el.classList.add('hint');
      });
      if (chars.join('').toUpperCase() !== chars.join('')) {
        var sf = this._find('ShiftL');
        if (sf) sf.classList.add('hint');
      }
    },

    fingerOf: function (ch) {
      var info = map[ch] || (typeof ch === 'string' ? map[ch.toLowerCase()] : null);
      return info ? FINGERS[info.finger] : null;
    }
  };

  App.keyboard = Keyboard;
})(window.App);
