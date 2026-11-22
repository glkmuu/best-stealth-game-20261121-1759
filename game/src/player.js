// player.js — movement, sneak, noise, pickups, exit
var GH = window.GH;
GH.updatePlayer = function (dt) {
  var S = GH.S, L = GH.L, p = GH.player, k = GH.keys;
  var dx = 0, dy = 0;
  if (k['arrowleft'] || k['a']) dx -= 1;
  if (k['arrowright'] || k['d']) dx += 1;
  if (k['arrowup'] || k['w']) dy -= 1;
  if (k['arrowdown'] || k['s']) dy += 1;
  p.moving = dx !== 0 || dy !== 0;
  p.sneak = !!(k['shift']);
  var speed = p.sneak ? 62 : 148; // sneak is slow and quiet; running is fast and loud
  p.speed = p.moving ? speed : 0;
  if (p.moving) {
    var len = Math.sqrt(dx * dx + dy * dy); dx /= len; dy /= len;
    p.dir = Math.atan2(dy, dx);
    var nx = p.x + dx * speed * dt, ny = p.y + dy * speed * dt;
    if (!GH.solidAt(nx, p.y, 11)) p.x = nx;
    if (!GH.solidAt(p.x, ny, 11)) p.y = ny;
    GH.footstep(dt, p);
  }
  // Keycard pickup
  if (!L.keycardGot && GH.dist(p.x, p.y, L.keycard.x, L.keycard.y) < 26) {
    L.keycardGot = true; S.keycard = true; GH.audio('pickup'); GH.say('KEYCARD acquired — locked doors open');
    GH.burst(L.keycard.x, L.keycard.y, '#ffd34d');
  }
  // Artifact pickup (E or walk-over)
  for (var i = 0; i < L.artifacts.length; i++) {
    var a = L.artifacts[i];
    if (!a.got && GH.dist(p.x, p.y, a.x, a.y) < 26) {
      a.got = true; S.artifactsGot++; S.score += 300; GH.audio('pickup');
      GH.say('Artifact secured! +' + 300 + '  (' + S.artifactsGot + '/' + L.artifacts.length + ')');
      GH.burst(a.x, a.y, '#7fe7ff');
    }
  }
  // Keycard door opens on touch when the card is held
  if (L.door && !L.door.open && S.keycard && GH.dist(p.x, p.y, L.door.x + L.door.w / 2, L.door.y + L.door.h / 2) < 70) {
    L.door.open = true; GH.audio('door'); GH.say('Keycard door unlocked');
  }
  // Terminal hack channel (hold E near the terminal)
  if (!L.terminalDone && GH.dist(p.x, p.y, L.terminal.x, L.terminal.y) < 42) {
    if (k['e']) {
      S.hack += dt;
      if (S.hack >= 3) { L.terminalDone = true; S.camerasOffUntil = S.time + 20; GH.audio('hack'); GH.say('CAMERAS OFF for 20 seconds'); S.hack = 0; }
    } else S.hack = Math.max(0, S.hack - dt * 2);
  } else S.hack = 0;
  // Exit — locked until every artifact is collected
  var ex = L.exit, allGot = S.artifactsGot >= L.artifacts.length;
  if (GH.dist(p.x, p.y, ex.x, ex.y) < 30 && allGot) GH.levelComplete();
  else if (GH.dist(p.x, p.y, ex.x, ex.y) < 46 && !allGot && !S._exitWarned) { S._exitWarned = true; GH.say('Exit locked — collect all artifacts first'); }
  if (GH.dist(p.x, p.y, ex.x, ex.y) > 60) S._exitWarned = false;
};
GH.levelComplete = function () {
  var S = GH.S, L = GH.L;
  var timeBonus = Math.max(0, Math.round(900 - S.levelTime * 6));
  var ghost = S.alarms === 0 ? 500 : 0;
  var noAlarm = S.alarms === 0 ? 300 : 0;
  var gained = timeBonus + ghost + noAlarm;
  S.score += gained;
  S.stars = S.alarms === 0 ? 3 : (S.levelTime < GH.LEVELS[S.level].par ? 2 : 1);
  S.lastBonus = { time: timeBonus, ghost: ghost, noAlarm: noAlarm, gained: gained };
  S.totalScore = S.score;
  GH.audio('win');
  if (S.level >= 3) { S.screen = 'complete'; }
  else S.screen = 'leveldone';
  GH.uiShow();
};
GH.nextLevel = function () {
  GH.loadLevel(GH.S.level + 1);
  GH.uiShow();
};
GH.restartLevel = function () {
  var keepScore = GH.S.score - (GH.S.score % 1);
  GH.loadLevel(GH.S.level);
  GH.S.score = keepScore; GH.uiShow();
};
