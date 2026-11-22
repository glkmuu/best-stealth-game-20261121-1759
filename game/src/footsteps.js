// footsteps.js — visible sound rings: loud running feet, faint guard steps
var GH = window.GH;
GH._stepT = 0;
GH.footstep = function (dt, p) {
  var L = GH.L;
  GH._stepT -= dt;
  if (p.moving && !p.sneak && GH._stepT <= 0) {
    GH._stepT = 0.32;
    L.rings.push({ x: p.x, y: p.y, r: 6, max: 64, a: 0.85, who: 'player' });
    GH.audio('step');
  }
  if (p.moving && p.sneak && GH._stepT <= -0.3) { GH._stepT = 0.32; }
};
GH.guardSteps = function (dt) {
  var L = GH.L;
  for (var i = 0; i < L.guards.length; i++) {
    var g = L.guards[i];
    if (g.state === 'patrol' || g.state === 'suspicious') {
      g._st = (g._st || 0) - dt;
      if (g._st <= 0 && (g.wait <= 0)) {
        g._st = 0.55;
        L.rings.push({ x: g.x, y: g.y, r: 5, max: 34, a: 0.4, who: 'guard' });
      }
    }
  }
};
GH.updateRings = function (dt) {
  var L = GH.L;
  for (var i = L.rings.length - 1; i >= 0; i--) {
    var r = L.rings[i]; r.r += 90 * dt; r.a -= 0.9 * dt;
    if (r.a <= 0 || r.r > r.max) L.rings.splice(i, 1);
  }
};
GH.ringsDraw = function (ctx) {
  var L = GH.L;
  ctx.save();
  for (var i = 0; i < L.rings.length; i++) {
    var r = L.rings[i];
    ctx.strokeStyle = r.who === 'player' ? 'rgba(255,255,255,' + Math.max(0, r.a) + ')' : 'rgba(255,90,90,' + Math.max(0, r.a) + ')';
    ctx.lineWidth = r.who === 'player' ? 2 : 1.5;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
  }
  ctx.restore();
};
GH.burst = function (x, y, color) {
  var L = GH.L;
  for (var i = 0; i < 14; i++) {
    var a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 70;
    L.particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 0.6, color: color });
  }
};
GH.updateParticles = function (dt) {
  var L = GH.L;
  for (var i = L.particles.length - 1; i >= 0; i--) {
    var p = L.particles[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
    if (p.t > p.life) L.particles.splice(i, 1);
  }
};
GH.particlesDraw = function (ctx) {
  var L = GH.L;
  ctx.save();
  for (var i = 0; i < L.particles.length; i++) {
    var p = L.particles[i];
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.restore();
};
