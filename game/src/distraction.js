// distraction.js — throwable coin: clinks, draws the nearest guard to investigate
var GH = window.GH;
GH.throwCoin = function () {
  var S = GH.S, L = GH.L, p = GH.player;
  if (S.screen !== 'play' || S.coins <= 0) return;
  S.coins--;
  var cx = p.x + Math.cos(p.dir) * 120, cy = p.y + Math.sin(p.dir) * 120;
  cx = Math.max(20, Math.min(GH.W - 20, cx)); cy = Math.max(20, Math.min(GH.H - 20, cy));
  var coin = { x: cx, y: cy, t: 0 };
  L.coinsThrown.push(coin);
  GH.audio('coin');
  GH.say('Coin tossed — a guard goes to look');
  GH.burst(cx, cy, '#ffd34d');
  // Nearest patrolling/suspicious guard investigates the clink.
  var best = null, bd = 1e9;
  for (var i = 0; i < L.guards.length; i++) {
    var g = L.guards[i];
    if (g.state === 'chase') continue;
    var d = GH.dist(g.x, g.y, cx, cy);
    if (d < bd) { bd = d; best = g; }
  }
  if (best && bd < 420) {
    best.state = 'investigate'; best.investigate = { x: cx, y: cy }; best.invT = 4; best.bang = 1;
  }
};
GH.updateCoins = function (dt) {
  var L = GH.L;
  for (var i = L.coinsThrown.length - 1; i >= 0; i--) {
    L.coinsThrown[i].t += dt;
    if (L.coinsThrown[i].t > 5) L.coinsThrown.splice(i, 1);
  }
};
