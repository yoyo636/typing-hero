/* 打字小英雄 · 打字引擎（计时 / 速度 / 准确率 / 中英文输入） */
window.App = window.App || {};

(function (App) {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /**
   * cfg: { text, mode:'en'|'zh', el, pinyin, input, timeLimit, onTick, onFinish, onQuit }
   */
  App.createEngine = function (cfg) {
    var text = cfg.text || '';
    var mode = cfg.mode || 'en';
    var el = cfg.el;
    var input = cfg.input || null;
    var py = cfg.pinyin || null;
    var total = text.length;

    var idx = 0;
    var errors = 0;
    var hits = 0;
    var combo = 0;
    var maxCombo = 0;
    var errFlag = false;
    var started = false;
    var finished = false;
    var paused = false;
    var startAt = 0;
    var pauseAt = 0;
    var pausedMs = 0;
    var timer = null;
    var pending = {};
    var lastFlush = 0;
    var prevErr = 0;
    var composing = false;
    var spans = [];

    /* ---------- 渲染 ---------- */
    function render() {
      var h = '';
      for (var i = 0; i < total; i++) {
        var c = text[i];
        h += '<span class="ch' + (c === ' ' ? ' sp' : '') + '">' +
          (py && py[i] ? '<i class="py">' + esc(py[i]) + '</i>' : '') +
          '<span class="c">' + esc(c) + '</span></span>';
      }
      el.innerHTML = h;
      spans = el.querySelectorAll('.ch');
    }

    function paint() {
      var typed = mode === 'zh' ? (input ? input.value : '') : text.slice(0, idx);
      for (var i = 0; i < spans.length; i++) {
        var s = spans[i];
        s.className = 'ch' + (text[i] === ' ' ? ' sp' : '');
        if (i < typed.length) {
          s.classList.add(typed[i] === text[i] ? 'ok' : 'bad');
        } else if (i === typed.length) {
          s.classList.add('cur');
          if (mode !== 'zh' && errFlag) s.classList.add('bad');
        }
      }
      scrollToCursor();
    }

    function scrollToCursor() {
      var cur = el.querySelector('.ch.cur');
      if (!cur) return;
      var lh = cur.offsetHeight || 40;
      // 光标相对内容顶部的偏移（兼容 .text-box 没有定位的情况）
      var offset = (cur.offsetParent === el)
        ? cur.offsetTop
        : (cur.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop);
      var top = offset - (el.clientHeight - lh) / 2;
      if (top < 0) top = 0;
      el.scrollTop = top;
    }

    /* ---------- 计时与统计 ---------- */
    function now() { return Date.now(); }

    function elapsedMs() {
      if (!started) return 0;
      var end = paused ? pauseAt : now();
      return Math.max(1, end - startAt - pausedMs);
    }

    function minutes() { return elapsedMs() / 60000; }

    function correctCount() {
      if (mode === 'zh') {
        var v = input ? input.value : '';
        var n = 0;
        for (var i = 0; i < v.length && i < total; i++) if (v[i] === text[i]) n++;
        return n;
      }
      return hits;
    }

    function speed() {
      var m = minutes();
      if (m <= 0) return 0;
      var c = correctCount();
      return mode === 'zh' ? c / m : (c / 5) / m;
    }

    function accuracy() {
      var c = correctCount();
      var t = c + errors;
      return t === 0 ? 100 : (c / t) * 100;
    }

    function snapshot() {
      return {
        index: idx, total: total, elapsed: elapsedMs(),
        speed: speed(), acc: accuracy(), errors: errors,
        combo: combo, maxCombo: maxCombo, started: started, paused: paused,
        unit: mode === 'zh' ? '字/分' : 'WPM'
      };
    }

    function tick() {
      if (finished) return;
      if (cfg.timeLimit && elapsedMs() >= cfg.timeLimit * 1000) { finish(true); return; }
      flush();
      if (cfg.onTick) cfg.onTick(snapshot());
    }

    function start() {
      if (started) return;
      started = true;
      startAt = now();
      timer = setInterval(tick, 200);
    }

    function flush() {
      var keys = Object.keys(pending);
      if (!keys.length) return;
      keys.forEach(function (k) {
        var n = pending[k];
        for (var i = 0; i < Math.abs(n); i++) App.store.keyStat(k, n > 0);
      });
      pending = {};
    }

    function finish(timedOut) {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      flush();
      var res = {
        speed: speed(),
        acc: accuracy(),
        chars: correctCount(),
        errors: errors,
        maxCombo: maxCombo,
        ms: elapsedMs(),
        total: total,
        timedOut: !!timedOut,
        mode: mode,
        unit: mode === 'zh' ? '字/分' : 'WPM'
      };
      if (cfg.onFinish) cfg.onFinish(res);
    }

    /* ---------- 英文输入 ---------- */
    function onKeyDown(e) {
      if (finished) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') { e.preventDefault(); if (cfg.onQuit) cfg.onQuit(); return; }

      if (!started) start();
      if (paused) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (idx > 0) { idx--; errFlag = false; paint(); }
        return;
      }
      if (e.key === 'Tab') { e.preventDefault(); return; }
      if (e.key.length !== 1) return;

      e.preventDefault();
      var expect = text[idx];
      var k = e.key;
      var ok = k === expect;

      pending[k] = (pending[k] || 0) + (ok ? 1 : -1);
      App.keyboard.press(expect, false);
      if (!ok) { App.keyboard.markWrong(k); App.keyboard.hintWrong(expect); }

      if (ok) {
        hits++;
        combo++;
        errFlag = false;
        if (combo > maxCombo) maxCombo = combo;
        idx++;
        App.sound.right();
        if (combo > 0 && combo % 10 === 0) App.sound.combo(combo);
      } else {
        errors++;
        errFlag = true;
        combo = 0;
        App.sound.wrong();
      }
      paint();
      if (cfg.onTick) cfg.onTick(snapshot());
      if (idx >= total) finish(false);
    }

    /* ---------- 中文输入（拼音输入法） ---------- */
    function onCompositionStart() { composing = true; }
    function onCompositionEnd() { composing = false; setTimeout(process, 0); }
    function onInput(e) {
      if (composing || (e && e.isComposing)) return;
      process();
    }

    function process() {
      if (finished || !input) return;
      if (!started) start();
      if (paused) return;
      var v = input.value;
      var err = 0;
      for (var i = 0; i < v.length && i < total; i++) if (v[i] !== text[i]) err++;
      if (err > prevErr) {
        errors += (err - prevErr);
        combo = 0;
        App.sound.wrong();
      } else if (v.length > idx) {
        combo += v.length - idx;
        if (combo > maxCombo) maxCombo = combo;
        App.sound.right();
      }
      prevErr = err;
      idx = Math.min(v.length, total);
      var cur = v[idx - 1];
      if (cur) App.keyboard.press(cur, false);
      paint();
      if (cfg.onTick) cfg.onTick(snapshot());
      if (idx >= total) finish(false);
    }

    /* ---------- 生命周期 ---------- */
    function bind() {
      if (mode === 'zh' && input) {
        input.disabled = false;
        input.value = '';
        input.addEventListener('compositionstart', onCompositionStart);
        input.addEventListener('compositionend', onCompositionEnd);
        input.addEventListener('input', onInput);
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') { e.preventDefault(); if (cfg.onQuit) cfg.onQuit(); }
        });
        setTimeout(function () { input.focus(); }, 30);
      } else {
        document.addEventListener('keydown', onKeyDown);
      }
    }

    function unbind() {
      if (mode === 'zh' && input) {
        input.removeEventListener('compositionstart', onCompositionStart);
        input.removeEventListener('compositionend', onCompositionEnd);
        input.removeEventListener('input', onInput);
      } else {
        document.removeEventListener('keydown', onKeyDown);
      }
      clearInterval(timer);
    }

    render();
    paint();
    if (mode !== 'zh') bind();

    return {
      start: function () {
        if (mode === 'zh') bind();
      },
      pause: function () {
        if (!started || paused || finished) return;
        paused = true;
        pauseAt = now();
      },
      resume: function () {
        if (!paused) return;
        paused = false;
        pausedMs += now() - pauseAt;
        if (mode === 'zh' && input) input.focus();
      },
      isPaused: function () { return paused; },
      isFinished: function () { return finished; },
      snapshot: snapshot,
      finish: function () { finish(false); },
      destroy: unbind,
      focus: function () { if (mode === 'zh' && input) input.focus(); }
    };
  };

  App.esc = esc;
})(window.App);
