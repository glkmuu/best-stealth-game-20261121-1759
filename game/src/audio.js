// audio.js — WebAudio synth sounds only, no audio files
var GH = window.GH;
GH._ac = null;
GH.audioCtx = function () {
  if (!GH._ac) { try { GH._ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { GH._ac = null; } }
  if (GH._ac && GH._ac.state === 'suspended') GH._ac.resume();
  return GH._ac;
};
GH.tone = function (freq, dur, type, vol, slide) {
  if (GH.S && GH.S.muted) return;
  var ac = GH.audioCtx(); if (!ac) return;
  try {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, ac.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), ac.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { /* audio is best-effort */ }
};
GH.audio = function (name) {
  if (!GH.S || GH.S.muted) return;
  try {
    if (name === 'pickup') { GH.tone(880, 0.12, 'sine', 0.14); setTimeout(function () { GH.tone(1318, 0.18, 'sine', 0.12); }, 90); }
    else if (name === 'coin') { GH.tone(1900, 0.08, 'triangle', 0.14, 900); setTimeout(function () { GH.tone(1500, 0.1, 'triangle', 0.1); }, 120); }
    else if (name === 'alarm') { GH.tone(220, 0.5, 'sawtooth', 0.16, 440); GH.tone(110, 0.5, 'square', 0.08, 220); }
    else if (name === 'laser') { GH.tone(1200, 0.25, 'square', 0.12, 300); }
    else if (name === 'door') { GH.tone(520, 0.15, 'sine', 0.12, 780); }
    else if (name === 'hack') { GH.tone(440, 0.1, 'square', 0.1); setTimeout(function () { GH.tone(660, 0.1, 'square', 0.1); }, 100); setTimeout(function () { GH.tone(880, 0.2, 'square', 0.1); }, 200); }
    else if (name === 'step') { GH.tone(90, 0.05, 'sine', 0.05); }
    else if (name === 'lost') { GH.tone(660, 0.2, 'sine', 0.1, 330); }
    else if (name === 'caught') { GH.tone(330, 0.4, 'sawtooth', 0.16, 80); }
    else if (name === 'win') { GH.tone(523, 0.15, 'sine', 0.13); setTimeout(function () { GH.tone(659, 0.15, 'sine', 0.13); }, 140); setTimeout(function () { GH.tone(784, 0.3, 'sine', 0.13); }, 280); }
    else if (name === 'over') { GH.tone(392, 0.3, 'sawtooth', 0.12, 196); setTimeout(function () { GH.tone(196, 0.5, 'sawtooth', 0.12, 98); }, 300); }
  } catch (e) { /* ignore */ }
};
