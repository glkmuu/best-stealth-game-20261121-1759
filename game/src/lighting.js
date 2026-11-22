// lighting.js — darkness, lamp pools, player flashlight, floodlights
var GH = window.GH;
GH.lightingDraw = function (ctx) {
  var S = GH.S, L = GH.L, p = GH.player;
  var t = S.time;
  ctx.save();
  // Darkness overlay with holes cut for lamps, the player, and the flashlight cone.
  var dark = ctx.createRadialGradient(p.x, p.y, 60, p.x, p.y, 420);
  ctx.fillStyle = 'rgba(4,6,18,0.40)';
  ctx.fillRect(0, 0, GH.W, GH.H);
  ctx.globalCompositeOperation = 'destination-out';
  // (destination-out on the main canvas would erase the game, so instead we
  // paint light pools additively below — see lightPoolsDraw.)
  ctx.restore();
  GH.lightPoolsDraw(ctx, t);
  GH.flashlightDraw(ctx, p, t);
  if (S.level === 3) GH.floodlightDraw(ctx, t);
};
GH.lightPoolsDraw = function (ctx, t) {
  var L = GH.L;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (var i = 0; i < L.lamps.length; i++) {
    var lm = L.lamps[i], flick = 0.85 + Math.sin(t * 7 + i * 2.1) * 0.08 + Math.sin(t * 13 + i) * 0.05;
    var g = ctx.createRadialGradient(lm.x, lm.y, 8, lm.x, lm.y, 105 * flick);
    g.addColorStop(0, 'rgba(255,214,120,0.20)');
    g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(lm.x, lm.y, 105 * flick, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(lm.x, lm.y, 4, 0, 7); ctx.fill();
  }
  ctx.restore();
};
GH.flashlightDraw = function (ctx, p, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  var g = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 130);
  g.addColorStop(0, 'rgba(190,220,255,0.14)');
  g.addColorStop(1, 'rgba(190,220,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(p.x, p.y, 130, 0, 7); ctx.fill();
  // Flashlight cone in the facing direction.
  ctx.fillStyle = 'rgba(255,240,190,0.10)';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.arc(p.x, p.y, 170, p.dir - 0.42, p.dir + 0.42);
  ctx.closePath(); ctx.fill();
  ctx.restore();
};
GH.floodlightDraw = function (ctx, t) {
  // Rooftop floodlights sweep the helipad area.
  var cx = 880, cy = 520, ang = Math.sin(t * 0.5) * 0.7 - Math.PI / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  var g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260);
  g.addColorStop(0, 'rgba(255,250,220,0.16)');
  g.addColorStop(1, 'rgba(255,250,220,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, 260, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,250,200,0.10)';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 300, ang - 0.3, ang + 0.3); ctx.closePath(); ctx.fill();
  ctx.restore();
};
