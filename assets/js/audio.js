/* 打字小英雄 · 音效（WebAudio，无需音频文件） */
window.App = window.App || {};

(function (App) {
  'use strict';

  var ctx = null;

  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, delay) {
    if (!App.store.settings().sound) return;
    var a = ac();
    if (!a) return;
    var t0 = a.currentTime + (delay || 0);
    var osc = a.createOscillator();
    var g = a.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  App.sound = {
    key: function () { tone(660, 0.05, 'triangle', 0.05); },
    right: function () { tone(880, 0.06, 'triangle', 0.07); },
    wrong: function () { tone(180, 0.16, 'sawtooth', 0.09); },
    combo: function (n) { tone(700 + Math.min(n, 12) * 40, 0.07, 'square', 0.05); },
    win: function () {
      [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.1, i * 0.11); });
    },
    lose: function () {
      [440, 349, 262].forEach(function (f, i) { tone(f, 0.22, 'sine', 0.09, i * 0.13); });
    },
    pop: function (n) { tone(500 + Math.min(n, 20) * 30, 0.08, 'square', 0.06); },
    click: function () { tone(520, 0.04, 'sine', 0.05); }
  };
})(window.App);
