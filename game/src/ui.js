// ui.js — HUD and screens (title / level-complete / game-complete / game-over / paused)
var GH = window.GH;
GH.$ = function (id) { return document.getElementById(id); };
GH.fmtTime = function (s) { var m = Math.floor(s / 60), ss = Math.floor(s % 60); return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss; };
GH.uiShow = function () {
  var S = GH.S, L = GH.L;
  var hud = GH.$('hud'), title = GH.$('title'), done = GH.$('leveldone'), comp = GH.$('complete'), over = GH.$('over'), paused = GH.$('paused');
  if (!hud) return;
  hud.style.display = (S.screen === 'play') ? 'flex' : 'none';
  title.style.display = S.screen === 'title' ? 'block' : 'none';
  done.style.display = S.screen === 'leveldone' ? 'block' : 'none';
  comp.style.display = S.screen === 'complete' ? 'block' : 'none';
  over.style.display = S.screen === 'over' ? 'block' : 'none';
  paused.style.display = (S.screen === 'play' && S.paused) ? 'block' : 'none';
  if (S.screen === 'play' && L) {
    GH.$('hud-level').textContent = 'LV ' + (S.level + 1) + ' · ' + L.name;
    GH.$('hud-art').textContent = '◆ ' + S.artifactsGot + '/' + L.artifacts.length;
    GH.$('hud-key').textContent = S.keycard ? '🔑 KEYCARD' : '🔒 NO CARD';
    GH.$('hud-coins').textContent = '🪙 ×' + S.coins + ' (Q)';
    GH.$('hud-time').textContent = '⏱ ' + GH.fmtTime(S.levelTime);
    GH.$('hud-score').textContent = 'SCORE ' + S.score;
    GH.$('hud-lives').textContent = '♥'.repeat(Math.max(0, S.lives)) + '♡'.repeat(Math.max(0, 3 - S.lives));
    GH.$('hud-cam').textContent = GH.camerasDisabled() ? '📷 CAMERAS OFF ' + Math.ceil(S.camerasOffUntil - S.time) + 's' : '📷 CAMERAS LIVE';
    GH.$('hud-cam').style.color = GH.camerasDisabled() ? '#59d98a' : '#ff9d5c';
    GH.$('hud-hint').textContent = 'H hint ×' + S.hint;
  }
  if (S.screen === 'leveldone') {
    GH.$('done-title').textContent = L.name + ' — CLEARED!';
    GH.$('done-stars').textContent = '★'.repeat(S.stars) + '☆'.repeat(3 - S.stars);
    var b = S.lastBonus || { time: 0, ghost: 0, noAlarm: 0, gained: 0 };
    GH.$('done-bonus').textContent = 'Time bonus +' + b.time + ' · Ghost +' + b.ghost + ' · No-alarm +' + b.noAlarm + '  =  +' + b.gained;
    GH.$('done-score').textContent = 'TOTAL SCORE: ' + S.score;
  }
  if (S.screen === 'complete') {
    GH.$('comp-score').textContent = 'TOTAL SCORE: ' + S.score;
    GH.$('comp-stars').textContent = '★'.repeat(3);
  }
  if (S.screen === 'over') GH.$('over-score').textContent = 'SCORE: ' + S.score;
};
GH.uiTick = function () {
  var S = GH.S;
  if (S.screen !== 'play') return;
  GH.$('hud-time').textContent = '⏱ ' + GH.fmtTime(S.levelTime);
  GH.$('hud-score').textContent = 'SCORE ' + S.score;
  GH.$('hud-art').textContent = '◆ ' + S.artifactsGot + '/' + GH.L.artifacts.length;
  GH.$('hud-coins').textContent = '🪙 ×' + S.coins + ' (Q)';
  GH.$('hud-key').textContent = S.keycard ? '🔑 KEYCARD' : '🔒 NO CARD';
  GH.$('hud-cam').textContent = GH.camerasDisabled() ? '📷 CAMERAS OFF ' + Math.ceil(S.camerasOffUntil - S.time) + 's' : '📷 CAMERAS LIVE';
};
GH.bindButtons = function () {
  GH.$('btn-start').addEventListener('click', function () { GH.loadLevel(0); GH.uiShow(); });
  GH.$('btn-next').addEventListener('click', function () { GH.nextLevel(); });
  GH.$('btn-again').addEventListener('click', function () { GH.S = GH.freshState(); GH.loadLevel(0); GH.uiShow(); });
  GH.$('btn-retry').addEventListener('click', function () { GH.S = GH.freshState(); GH.loadLevel(0); GH.uiShow(); });
  var lv = document.querySelectorAll('.lvl-btn');
  for (var i = 0; i < lv.length; i++) {
    lv[i].addEventListener('click', function (ev) {
      var n = parseInt(ev.target.getAttribute('data-level'), 10);
      GH.loadLevel(n); GH.uiShow();
    });
  }
};
