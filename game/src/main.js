// main.js — game loop and state machine
var GH = window.GH;
GH.lastT = 0;
GH.loop = function (ts) {
  requestAnimationFrame(GH.loop);
  var dt = Math.min(0.05, (ts - GH.lastT) / 1000 || 0.016);
  GH.lastT = ts;
  var S = GH.S;
  if (S.screen === 'play' && !S.paused) {
    S.time += dt; S.levelTime += dt;
    if (S.msgT > 0) S.msgT -= dt;
    if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 1.4);
    if (S.hintDir > 0) S.hintDir -= dt;
    GH.updatePlayer(dt);
    if (S.screen !== 'play') { GH.uiShow(); return; }
    GH.updateGuards(dt);
    GH.updateLasers(dt);
    GH.updateCoins(dt);
    GH.guardSteps(dt);
    GH.updateRings(dt);
    GH.updateParticles(dt);
    for (var i = 0; i < GH.L.guards.length; i++) if (GH.L.guards[i].bang > 0) GH.L.guards[i].bang = Math.max(0, GH.L.guards[i].bang - dt * 2);
    for (var j = 0; j < GH.L.dogs.length; j++) if (GH.L.dogs[j].bang > 0) GH.L.dogs[j].bang = Math.max(0, GH.L.dogs[j].bang - dt * 2);
    GH.uiTick();
  }
  var ctx = GH.ctx;
  if (S.screen === 'play' || S.screen === 'leveldone' || S.screen === 'complete' || S.screen === 'over') {
    if (GH.L) GH.render(ctx);
  } else {
    // Title screen: render level 1 behind the overlay as a backdrop.
    if (GH.L) GH.render(ctx);
  }
};
GH.boot = function () {
  var canvas = document.getElementById('game');
  GH.ctx = canvas.getContext('2d');
  GH.S = GH.freshState();
  GH.loadLevel(0);
  GH.S.screen = 'title';
  GH.bindInput();
  GH.bindButtons();
  GH.uiShow();
  GH.shotFromQuery();
  requestAnimationFrame(GH.loop);
};
window.addEventListener('DOMContentLoaded', GH.boot);
