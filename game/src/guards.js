// guards.js — patrol AI, vision cones, detection, dogs, cameras
var GH = window.GH;
GH.guardSees = function (g, range, halfAngle) {
  var p = GH.player, S = GH.S;
  var d = GH.dist(g.x, g.y, p.x, p.y);
  if (d > range) return 0;
  var diff = Math.abs(GH.angleDiff(g.dir, GH.angleTo(g.x, g.y, p.x, p.y)));
  if (diff > halfAngle) return 0;
  if (!GH.losClear(g.x, g.y, p.x, p.y)) return 0;
  return 1 - d / range * 0.5; // closer = stronger signal
};
GH.moveAlongPath = function (e, dt, speedMul) {
  var t = e.path[e.wp], dx = t[0] - e.x, dy = t[1] - e.y, d = Math.sqrt(dx * dx + dy * dy);
  if (d < 4) { e.wp = (e.wp + 1) % e.path.length; e.wait = e.pause || 1; return; }
  var sp = (e.speed || 55) * (speedMul || 1);
  e.x += dx / d * sp * dt; e.y += dy / d * sp * dt; e.dir = Math.atan2(dy, dx);
};
GH.updateGuard = function (g, dt) {
  var S = GH.S, p = GH.player;
  if (g.wait > 0) { g.wait -= dt; return; }
  if (g.state === 'chase') {
    var d = GH.dist(g.x, g.y, p.x, p.y);
    var ang = GH.angleTo(g.x, g.y, p.x, p.y);
    g.dir = ang;
    g.x += Math.cos(ang) * g.speed * 1.7 * dt; g.y += Math.sin(ang) * g.speed * 1.7 * dt;
    if (d < 16) { GH.caught(); return; }
    if (!GH.guardSees(g, 220, 1.1)) { g.loseT += dt; if (g.loseT > 3) { g.state = 'patrol'; g.loseT = 0; GH.say('LOST YOU — the guard gives up'); GH.audio('lost'); } }
    else g.loseT = 0;
    return;
  }
  if (g.state === 'investigate' && g.investigate) {
    var tx = g.investigate.x, ty = g.investigate.y;
    var dd = GH.dist(g.x, g.y, tx, ty);
    if (dd < 8) { g.invT -= dt; if (g.invT <= 0) { g.state = 'patrol'; g.investigate = null; } return; }
    var a2 = GH.angleTo(g.x, g.y, tx, ty); g.dir = a2;
    g.x += Math.cos(a2) * g.speed * 1.3 * dt; g.y += Math.sin(a2) * g.speed * 1.3 * dt;
    return;
  }
  if (g.state === 'suspicious' && g.lastSeen) {
    var sx = g.lastSeen.x, sy = g.lastSeen.y, sd = GH.dist(g.x, g.y, sx, sy);
    if (sd < 10) { g.wait = 1.2; g.state = 'patrol'; g.lastSeen = null; return; }
    var a3 = GH.angleTo(g.x, g.y, sx, sy); g.dir = a3;
    g.x += Math.cos(a3) * g.speed * 1.15 * dt; g.y += Math.sin(a3) * g.speed * 1.15 * dt;
    return;
  }
  GH.moveAlongPath(g, dt, 1);
};
GH.updateDog = function (dg, dt) {
  var p = GH.player, d = GH.dist(dg.x, dg.y, p.x, p.y);
  if (dg.wait > 0) { dg.wait -= dt; return; }
  if (dg.state === 'chase') {
    var a = GH.angleTo(dg.x, dg.y, p.x, p.y); dg.dir = a;
    dg.x += Math.cos(a) * dg.speed * 1.5 * dt; dg.y += Math.sin(a) * dg.speed * 1.5 * dt;
    if (d < 16) { GH.caught(); return; }
    if (d > 260) { dg.state = 'patrol'; }
    return;
  }
  // Dogs hear running: loud footsteps within 150px trigger a chase.
  if (!p.sneak && p.moving && d < 150 && GH.losClear(dg.x, dg.y, p.x, p.y)) {
    dg.state = 'chase'; dg.bang = 1; GH.alarm('The dog heard you!'); return;
  }
  if (GH.guardSees(dg, 150, 1.4) > 0.4) { dg.state = 'chase'; dg.bang = 1; GH.alarm('The dog spotted you!'); return; }
  GH.moveAlongPath(dg, dt, 1);
};
GH.updateCameras = function (dt) {
  var L = GH.L, S = GH.S, p = GH.player;
  var off = S.time < S.camerasOffUntil;
  for (var i = 0; i < L.cameras.length; i++) {
    var c = L.cameras[i]; c.t += dt;
    c.angle = c.base + Math.sin(c.t * 0.7) * c.sweep;
    if (off) continue;
    var d = GH.dist(c.x, c.y, p.x, p.y);
    if (d < c.range && Math.abs(GH.angleDiff(c.angle, GH.angleTo(c.x, c.y, p.x, p.y))) < 0.45 && GH.losClear(c.x, c.y, p.x, p.y)) {
      S.detection = Math.min(100, S.detection + 55 * dt);
      if (!S.spotted) { S.spotted = true; }
    }
  }
};
GH.updateDetection = function (dt) {
  var S = GH.S, L = GH.L, p = GH.player;
  if (GH.shotHold) return; // demo screenshots hold a fixed detection value
  var seen = 0, seer = null;
  var all = L.guards.concat(L.dogs);
  for (var i = 0; i < all.length; i++) {
    var g = all[i];
    var s = GH.guardSees(g, 180, 0.85);
    if (s > 0) { if (s > seen) { seen = s; seer = g; } }
  }
  if (seen > 0) {
    var rate = 26 * seen;
    if (GH.inLight(p.x, p.y)) rate *= 1.6;
    else rate *= 0.55; // dark zones drain the meter — hiding works
    if (p.sneak) rate *= 0.55;
    S.detection = Math.min(100, S.detection + rate * dt);
    if (seer) { seer.lastSeen = { x: p.x, y: p.y }; seer.bang = 1; if (S.detection > 40 && seer.state === 'patrol') seer.state = 'suspicious'; }
    if (S.detection >= 100 && !S.alerted) GH.alarm('SPOTTED!');
  } else {
    S.detection = Math.max(0, S.detection - (GH.inLight(p.x, p.y) ? 10 : 26) * dt);
    if (S.detection < 40) S.spotted = false;
  }
  if (S.detection >= 100) {
    S.alerted = true;
    for (var j = 0; j < L.guards.length; j++) if (L.guards[j].state !== 'chase') L.guards[j].state = 'chase';
  } else if (S.detection < 55) S.alerted = false;
};
GH.alarm = function (msg) {
  var S = GH.S;
  if (!S.alerted) { S.alarms++; S.flash = 1; GH.audio('alarm'); }
  S.alerted = true; S.detection = Math.max(S.detection, 100);
  GH.say(msg || 'SPOTTED!');
};
GH.caught = function () {
  var S = GH.S;
  S.lives--; GH.audio('caught'); S.flash = 1;
  if (S.lives <= 0) { S.screen = 'over'; GH.audio('over'); GH.uiShow(); return; }
  GH.say('Caught! ' + S.lives + ' lives left');
  GH.player.x = GH.LEVELS[S.level].start.x; GH.player.y = GH.LEVELS[S.level].start.y;
  S.detection = 0; S.alerted = false;
  var L = GH.L;
  for (var i = 0; i < L.guards.length; i++) { L.guards[i].state = 'patrol'; L.guards[i].x = L.guards[i].path[0][0]; L.guards[i].y = L.guards[i].path[0][1]; L.guards[i].wp = 1; }
  for (var j = 0; j < L.dogs.length; j++) { L.dogs[j].state = 'patrol'; L.dogs[j].x = L.dogs[j].path[0][0]; L.dogs[j].y = L.dogs[j].path[0][1]; L.dogs[j].wp = 1; }
};
GH.updateGuards = function (dt) {
  var L = GH.L;
  for (var i = 0; i < L.guards.length; i++) GH.updateGuard(L.guards[i], dt);
  for (var j = 0; j < L.dogs.length; j++) GH.updateDog(L.dogs[j], dt);
  GH.updateCameras(dt);
  GH.updateDetection(dt);
};
