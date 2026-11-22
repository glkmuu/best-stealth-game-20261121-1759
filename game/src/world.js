// world.js — map collision, line-of-sight, light checks
var GH = window.GH;
GH.rectHit = function (x, y, r, rect) {
  var cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  var cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  var dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy < r * r;
};
GH.solidAt = function (x, y, r) {
  var L = GH.L; if (!L) return false;
  if (x < r + 8 || x > GH.W - r - 8 || y < r + 8 || y > GH.H - r - 8) return true;
  var i, s;
  for (i = 0; i < L.walls.length; i++) if (GH.rectHit(x, y, r, L.walls[i])) return true;
  for (i = 0; i < L.covers.length; i++) if (GH.rectHit(x, y, r, L.covers[i])) return true;
  if (L.door && !L.door.open) {
    s = L.door; if (GH.rectHit(x, y, r, { x: s.x, y: s.y, w: s.w, h: s.h })) return true;
  }
  return false;
};
// Segment vs rect intersection (slab test) — used for line of sight.
GH.segHitsRect = function (x1, y1, x2, y2, rc) {
  var dx = x2 - x1, dy = y2 - y1, t0 = 0, t1 = 1, p, q, r;
  var planes = [[-dx, x1 - rc.x], [dx, rc.x + rc.w - x1], [-dy, y1 - rc.y], [dy, rc.y + rc.h - y1]];
  for (var i = 0; i < 4; i++) {
    p = planes[i][0]; q = planes[i][1];
    if (p === 0) { if (q < 0) return false; }
    else { r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } }
  }
  return true;
};
GH.losClear = function (x1, y1, x2, y2) {
  var L = GH.L; if (!L) return true;
  var i;
  for (i = 0; i < L.walls.length; i++) if (GH.segHitsRect(x1, y1, x2, y2, L.walls[i])) return false;
  for (i = 0; i < L.covers.length; i++) if (GH.segHitsRect(x1, y1, x2, y2, L.covers[i])) return false;
  if (L.door && !L.door.open && GH.segHitsRect(x1, y1, x2, y2, L.door)) return false;
  return true;
};
GH.dist = function (x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); };
GH.angleTo = function (x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); };
GH.angleDiff = function (a, b) { var d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
GH.inLight = function (x, y) {
  var L = GH.L; if (!L) return false;
  for (var i = 0; i < L.lamps.length; i++) if (GH.dist(x, y, L.lamps[i].x, L.lamps[i].y) < 95) return true;
  return false;
};
GH.buildLevel = function (idx) {
  var d = GH.LEVELS[idx];
  var L = JSON.parse(JSON.stringify(d));
  L.guards = L.guards.map(function (g) { return { x: g.x, y: g.y, path: g.path, speed: g.speed, pause: g.pause, wp: 1, wait: 0, dir: 0, state: 'patrol', lastSeen: null, loseT: 0, bang: 0, investigate: null, invT: 0 }; });
  L.dogs = L.dogs.map(function (g) { return { x: g.x, y: g.y, path: g.path, speed: g.speed, wp: 1, wait: 0, dir: 0, state: 'patrol', lastSeen: null, loseT: 0, bang: 0 }; });
  L.cameras = L.cameras.map(function (c) { return { x: c.x, y: c.y, base: c.angle, sweep: c.sweep, range: c.range, t: Math.random() * 6 }; });
  L.lasers = L.lasers.map(function (l) { return { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, on: l.on, off: l.off, phase: l.phase, t: l.phase, tripped: false }; });
  L.artifacts = L.artifacts.map(function (a) { return { x: a.x, y: a.y, got: false, bob: Math.random() * 6 }; });
  L.door.open = false;
  L.keycardGot = false; L.terminalDone = false;
  L.coinsThrown = [];
  L.particles = []; L.rings = [];
  L.floodT = 0;
  return L;
};
GH.loadLevel = function (idx) {
  GH.S.level = idx;
  GH.S.levelTime = 0; GH.S.artifactsGot = 0; GH.S.detection = 0; GH.S.alerted = false;
  GH.S.camerasOffUntil = 0; GH.S.hack = 0; GH.S.hint = 3;
  GH.S.coins = GH.LEVELS[idx].coins; GH.S.keycard = false;
  GH.L = GH.buildLevel(idx);
  GH.player = { x: GH.LEVELS[idx].start.x, y: GH.LEVELS[idx].start.y, dir: -Math.PI / 2, sneak: false, moving: false, speed: 0 };
  GH.S.screen = 'play';
  GH.say('Level ' + (idx + 1) + ' — ' + GH.LEVELS[idx].name);
};
GH.say = function (m) { GH.S.msg = m; GH.S.msgT = 3; };
