// render.js — canvas drawing: floor, cover, cones, actors, HUD-in-canvas
var GH = window.GH;
GH.tileShade = function (tx, ty) {
  var h = (tx * 73856093) ^ (ty * 19349663);
  return (h & 7) / 7;
};
GH.drawCone = function (ctx, x, y, dir, half, range, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, range, dir - half, dir + half); ctx.closePath(); ctx.fill();
  ctx.restore();
};
GH.render = function (ctx) {
  var S = GH.S, L = GH.L, p = GH.player, t = S.time;
  ctx.clearRect(0, 0, GH.W, GH.H);
  // Floor: checker tiles with subtle variation + rugs.
  for (var ty = 0; ty < 15; ty++) for (var tx = 0; tx < 24; tx++) {
    var sh = GH.tileShade(tx, ty);
    ctx.fillStyle = (tx + ty) % 2 === 0 ? 'rgb(' + (38 + sh * 8) + ',' + (44 + sh * 8) + ',' + (62 + sh * 8) + ')' : 'rgb(' + (32 + sh * 8) + ',' + (38 + sh * 8) + ',' + (54 + sh * 8) + ')';
    ctx.fillRect(tx * 40, ty * 40, 40, 40);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  for (var gx = 0; gx <= 24; gx++) { ctx.beginPath(); ctx.moveTo(gx * 40, 0); ctx.lineTo(gx * 40, GH.H); ctx.stroke(); }
  for (var gy = 0; gy <= 15; gy++) { ctx.beginPath(); ctx.moveTo(0, gy * 40); ctx.lineTo(GH.W, gy * 40); ctx.stroke(); }
  for (var ri = 0; ri < L.rugs.length; ri++) {
    var rg = L.rugs[ri];
    ctx.fillStyle = '#5e2f3d'; ctx.fillRect(rg.x, rg.y, rg.w, rg.h);
    ctx.strokeStyle = '#d8a24a'; ctx.lineWidth = 2; ctx.strokeRect(rg.x + 6, rg.y + 6, rg.w - 12, rg.h - 12);
  }
  // Walls with shadow.
  for (var wi = 0; wi < L.walls.length; wi++) {
    var w = L.walls[wi];
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(w.x + 4, w.y + 5, w.w, w.h);
    ctx.fillStyle = '#2c3550'; ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#4a5a80'; ctx.lineWidth = 2; ctx.strokeRect(w.x, w.y, w.w, w.h);
  }
  // Exit / helipad.
  var ex = L.exit, allGot = S.artifactsGot >= L.artifacts.length;
  ctx.save();
  if (S.level === 3) {
    ctx.fillStyle = '#3a3f4d'; ctx.beginPath(); ctx.arc(ex.x, ex.y, 34, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ex.x, ex.y, 30, 0, 7); ctx.stroke();
    ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'; ctx.fillText('H', ex.x, ex.y + 8);
  } else {
    ctx.fillStyle = allGot ? '#1f6b3a' : '#4a2a2a';
    ctx.fillRect(ex.x - 22, ex.y - 22, 44, 44);
    ctx.strokeStyle = allGot ? '#59d98a' : '#ff5a5a'; ctx.lineWidth = 3; ctx.strokeRect(ex.x - 22, ex.y - 22, 44, 44);
    ctx.fillStyle = allGot ? '#59d98a' : '#ff8a8a'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    ctx.fillText(allGot ? 'EXIT ✓' : 'EXIT ✕', ex.x, ex.y + 4);
  }
  ctx.restore();
  // Cover: crates and display cases with shadows.
  for (var ci = 0; ci < L.covers.length; ci++) {
    var c = L.covers[ci];
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(c.x + 4, c.y + 5, c.w, c.h);
    if (c.kind === 'case') {
      ctx.fillStyle = '#1c2f4a'; ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#7fe7ff'; ctx.lineWidth = 2; ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(127,231,255,0.25)'; ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    } else {
      ctx.fillStyle = '#6b4a26'; ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#a87c44'; ctx.lineWidth = 2; ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h); ctx.stroke();
    }
  }
  // Artifacts: glowing diamonds.
  for (var ai = 0; ai < L.artifacts.length; ai++) {
    var a = L.artifacts[ai]; if (a.got) continue;
    var bob = Math.sin(t * 3 + a.bob) * 3;
    ctx.save();
    ctx.fillStyle = 'rgba(127,231,255,0.25)'; ctx.beginPath(); ctx.arc(a.x, a.y + bob, 18, 0, 7); ctx.fill();
    ctx.fillStyle = '#7fe7ff'; ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y - 12 + bob); ctx.lineTo(a.x + 9, a.y + bob); ctx.lineTo(a.x, a.y + 12 + bob); ctx.lineTo(a.x - 9, a.y + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  GH.keycardDraw(ctx);
  GH.terminalDraw(ctx);
  // Thrown coins.
  for (var coi = 0; coi < L.coinsThrown.length; coi++) {
    var cn = L.coinsThrown[coi];
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(cn.x, cn.y, 6, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a6d00'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.fillText('¢', cn.x, cn.y + 3);
  }
  // Lasers.
  for (var li = 0; li < L.lasers.length; li++) GH.laserDraw(ctx, L.lasers[li], t);
  // Vision cones: guards (red-orange), dogs (orange), cameras (amber).
  var off = GH.camerasDisabled();
  for (var gi = 0; gi < L.guards.length; gi++) {
    var g = L.guards[gi];
    var col = g.state === 'chase' ? 'rgba(255,40,60,0.34)' : g.state === 'suspicious' || g.state === 'investigate' ? 'rgba(255,170,40,0.30)' : 'rgba(255,220,80,0.22)';
    GH.drawCone(ctx, g.x, g.y, g.dir, 0.85, 180, col);
  }
  for (var di = 0; di < L.dogs.length; di++) {
    var dg = L.dogs[di];
    GH.drawCone(ctx, dg.x, dg.y, dg.dir, 1.0, 150, dg.state === 'chase' ? 'rgba(255,80,40,0.32)' : 'rgba(255,150,60,0.20)');
  }
  for (var cmi = 0; cmi < L.cameras.length; cmi++) {
    var cm = L.cameras[cmi];
    if (!off) GH.drawCone(ctx, cm.x, cm.y, cm.angle, 0.45, cm.range, 'rgba(255,157,92,0.26)');
  }
  // Footstep rings + particles.
  GH.ringsDraw(ctx);
  GH.particlesDraw(ctx);
  // Cameras (wall-mounted eyes).
  for (var c2 = 0; c2 < L.cameras.length; c2++) {
    var cam = L.cameras[c2];
    ctx.save();
    ctx.fillStyle = off ? '#333' : '#ff9d5c';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 8, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cam.x + Math.cos(cam.angle) * 4, cam.y + Math.sin(cam.angle) * 4, 3, 0, 7); ctx.fill();
    ctx.restore();
  }
  // Guards: bright uniform, shadow, "!" when they spot you.
  for (var g2 = 0; g2 < L.guards.length; g2++) GH.drawGuard(ctx, L.guards[g2]);
  for (var d2 = 0; d2 < L.dogs.length; d2++) GH.drawDog(ctx, L.dogs[d2]);
  // Player: hooded thief, dark cloak with bright trim, flashlight dot.
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 5, 12, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1d2b4a'; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, 7); ctx.fill();
  ctx.strokeStyle = '#7fe7ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, 7); ctx.stroke();
  ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.dir) * 6, p.y + Math.sin(p.dir) * 6, 4, 0, 7); ctx.fill();
  if (p.sneak) { ctx.fillStyle = '#7fe7ff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText('SNEAK', p.x, p.y - 18); }
  ctx.restore();
  // Lighting overlay last (darkness + lamp pools + flashlight).
  GH.lightingDraw(ctx);
  // Minimap.
  GH.minimapDraw(ctx);
  // Hint arrow to exit.
  if (S.hintDir > 0) {
    var ha = GH.angleTo(p.x, p.y, ex.x, ex.y);
    ctx.save();
    ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText('EXIT → ' + Math.round(GH.dist(p.x, p.y, ex.x, ex.y)) + 'px', p.x, p.y - 34);
    ctx.restore();
  }
  // Detection eye + message banner drawn in-canvas (always visible).
  ctx.save();
  ctx.fillStyle = 'rgba(6,10,22,0.8)'; ctx.fillRect(10, GH.H - 34, 300, 24);
  ctx.fillStyle = S.detection > 70 ? '#ff4d6d' : S.detection > 35 ? '#ffb347' : '#9fb4d8';
  ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
  ctx.fillText('👁 DETECTION ' + Math.round(S.detection) + '%', 16, GH.H - 17);
  ctx.fillStyle = '#222'; ctx.fillRect(170, GH.H - 28, 130, 12);
  ctx.fillStyle = S.detection > 70 ? '#ff4d6d' : S.detection > 35 ? '#ffb347' : '#59d98a';
  ctx.fillRect(170, GH.H - 28, 130 * S.detection / 100, 12);
  if (S.msg && S.msgT > 0) {
    ctx.fillStyle = 'rgba(6,10,22,0.85)'; ctx.fillRect(GH.W / 2 - 220, 14, 440, 26);
    ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText(S.msg, GH.W / 2, 32);
  }
  if (S.flash > 0) {
    ctx.fillStyle = 'rgba(255,40,60,' + (S.flash * 0.25) + ')';
    ctx.fillRect(0, 0, GH.W, GH.H);
  }
  ctx.restore();
};
GH.drawGuard = function (ctx, g) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(g.x + 3, g.y + 5, 13, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = g.state === 'chase' ? '#ff2e4d' : g.state === 'suspicious' || g.state === 'investigate' ? '#ff9d2e' : '#ffe14d';
  ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, 7); ctx.fill();
  ctx.strokeStyle = '#7a1f2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, 7); ctx.stroke();
  // Facing tick + cap.
  ctx.strokeStyle = '#7a1f2b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + Math.cos(g.dir) * 16, g.y + Math.sin(g.dir) * 16); ctx.stroke();
  ctx.fillStyle = '#7a1f2b'; ctx.beginPath(); ctx.arc(g.x, g.y - 4, 5, Math.PI, 0); ctx.fill();
  if (g.bang > 0) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 22);
    ctx.fillStyle = '#ff2e4d'; ctx.font = 'bold 22px monospace'; ctx.fillText('!', g.x, g.y - 22);
  }
  if (g.state === 'suspicious') { ctx.fillStyle = '#ffb347'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('?', g.x, g.y - 20); }
  if (g.state === 'investigate') { ctx.fillStyle = '#7fe7ff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('…?', g.x, g.y - 20); }
  ctx.restore();
};
GH.drawDog = function (ctx, dg) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(dg.x + 3, dg.y + 5, 12, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#8a5a2b'; ctx.beginPath(); ctx.arc(dg.x, dg.y, 11, 0, 7); ctx.fill();
  ctx.fillStyle = '#5a3413';
  ctx.beginPath(); ctx.arc(dg.x - 7, dg.y - 7, 4, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(dg.x + 7, dg.y - 7, 4, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3a2210'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(dg.x, dg.y); ctx.lineTo(dg.x + Math.cos(dg.dir) * 14, dg.y + Math.sin(dg.dir) * 14); ctx.stroke();
  if (dg.bang > 0) { ctx.fillStyle = '#ff2e4d'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', dg.x, dg.y - 20); }
  ctx.restore();
};
