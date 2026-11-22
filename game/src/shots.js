// shots.js — deterministic demo states for screenshots (?shot= + &seed=1)
var GH = window.GH;
GH.applyShot = function (shot) {
  var S = GH.S;
  GH.shotHold = false;
  if (shot === 'start') { S.screen = 'title'; GH.uiShow(); return; }
  if (shot === 'end') {
    GH.loadLevel(0);
    S.artifactsGot = 2; S.score = 2140; S.alarms = 0; S.stars = 3;
    S.lastBonus = { time: 640, ghost: 500, noAlarm: 300, gained: 1440 };
    S.levelTime = 43; S.screen = 'leveldone'; GH.uiShow(); return;
  }
  if (shot === 'play2') {
    GH.loadLevel(3);
    var p = GH.player; p.x = 340; p.y = 300; p.dir = 0.6; p.sneak = true;
    S.artifactsGot = 2; S.coins = 3; S.keycard = true; S.detection = 28;
    GH.L.artifacts[0].got = true; GH.L.artifacts[1].got = true;
    GH.L.keycardGot = true; GH.L.door.open = true;
    GH.L.guards[0].x = 420; GH.L.guards[0].y = 260; GH.L.guards[0].dir = 2.6;
    GH.L.guards[1].x = 560; GH.L.guards[1].y = 200; GH.L.guards[1].dir = 1.2;
    GH.L.guards[1].state = 'suspicious'; GH.L.guards[1].bang = 1;
    GH.L.dogs[0].x = 400; GH.L.dogs[0].y = 480; GH.L.dogs[0].dir = -0.5;
    GH.L.rings.push({ x: p.x, y: p.y, r: 30, max: 64, a: 0.7, who: 'player' });
    GH.L.rings.push({ x: 400, y: 480, r: 18, max: 34, a: 0.4, who: 'guard' });
    S.time = 12; S.levelTime = 38; S.score = 1250;
    GH.shotHold = true;
    GH.say('Rooftop — reach the helipad unseen');
    GH.uiShow(); return;
  }
  // Default: ?shot=play — mid-level 2, dense readable cover shot.
  GH.loadLevel(1);
  var p2 = GH.player; p2.x = 460; p2.y = 300; p2.dir = -0.4; p2.sneak = true;
  S.artifactsGot = 1; S.coins = 3; S.keycard = true; S.detection = 32;
  GH.L.artifacts[0].got = true; GH.L.keycardGot = true; GH.L.door.open = true;
  GH.L.guards[1].x = 480; GH.L.guards[1].y = 220; GH.L.guards[1].dir = 2.4;
  GH.L.guards[1].state = 'suspicious'; GH.L.guards[1].bang = 1;
  GH.L.guards[2].x = 700; GH.L.guards[2].y = 380; GH.L.guards[2].dir = -1.2;
  GH.L.cameras[0].angle = 0.7;
  GH.L.coinsThrown.push({ x: 560, y: 300, t: 0.5 });
  GH.L.guards[0].state = 'investigate'; GH.L.guards[0].investigate = { x: 560, y: 300 }; GH.L.guards[0].invT = 3; GH.L.guards[0].x = 200; GH.L.guards[0].y = 400; GH.L.guards[0].dir = 0.8;
  GH.L.rings.push({ x: p2.x, y: p2.y, r: 26, max: 64, a: 0.7, who: 'player' });
  GH.L.rings.push({ x: 480, y: 220, r: 16, max: 34, a: 0.4, who: 'guard' });
  S.time = 8; S.levelTime = 31; S.score = 940;
  GH.shotHold = true;
  GH.say('Gallery — one artifact secured, guard suspicious');
  GH.uiShow();
};
GH.shotFromQuery = function () {
  var q = new URLSearchParams(window.location.search);
  var shot = q.get('shot');
  var seed = parseInt(q.get('seed') || '1', 10);
  // Deterministic seed: Math.random is only used for camera phase / bob — fix it.
  var s = seed * 9301 + 49297;
  Math.random = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  if (shot) GH.applyShot(shot);
};
