// lasers.js — timed laser grids on doorways; a live beam trips the alarm
var GH = window.GH;
GH.laserIsOn = function (l, t) {
  var cycle = l.on + l.off;
  var tt = ((t + l.phase) % cycle + cycle) % cycle;
  return tt < l.on;
};
GH.updateLasers = function (dt) {
  var L = GH.L, S = GH.S, p = GH.player;
  L.floodT += dt;
  for (var i = 0; i < L.lasers.length; i++) {
    var l = L.lasers[i];
    var on = GH.laserIsOn(l, S.time);
    if (!on) { l.tripped = false; continue; }
    // Distance from player to the beam segment.
    var dx = l.x2 - l.x1, dy = l.y2 - l.y1, len2 = dx * dx + dy * dy;
    var tt = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - l.x1) * dx + (p.y - l.y1) * dy) / len2));
    var px = l.x1 + dx * tt, py = l.y1 + dy * tt;
    if (GH.dist(p.x, p.y, px, py) < 14 && !l.tripped) {
      l.tripped = true;
      S.detection = Math.min(100, S.detection + 60);
      GH.audio('laser'); GH.say('LASER TRIPPED!'); S.flash = 0.7;
      if (S.detection >= 100) GH.alarm('Laser tripped the alarm!');
    }
  }
};
GH.laserDraw = function (ctx, l, t) {
  var on = GH.laserIsOn(l, t);
  ctx.save();
  ctx.strokeStyle = on ? '#ff2e4d' : '#5a1f2a';
  ctx.lineWidth = on ? 3 : 1.5;
  ctx.setLineDash(on ? [] : [6, 6]);
  ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
  ctx.setLineDash([]);
  if (on) {
    ctx.fillStyle = '#ff2e4d';
    ctx.beginPath(); ctx.arc(l.x1, l.y1, 5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(l.x2, l.y2, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('LASER', (l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2 - 8);
  }
  ctx.restore();
};
