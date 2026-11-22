// minimap.js — top-right minimap: walls, guards, artifacts, exit
var GH = window.GH;
GH.minimapDraw = function (ctx) {
  var L = GH.L, S = GH.S, p = GH.player;
  var mx = GH.W - 172, my = 10, mw = 162, mh = 101, sx = mw / GH.W, sy = mh / GH.H;
  ctx.save();
  ctx.fillStyle = 'rgba(6,10,22,0.82)';
  ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
  ctx.strokeStyle = '#3a4a6b'; ctx.lineWidth = 1;
  ctx.strokeRect(mx - 4, my - 4, mw + 8, mh + 8);
  ctx.fillStyle = '#1b2742';
  ctx.fillRect(mx, my, mw, mh);
  var i;
  for (i = 0; i < L.walls.length; i++) { var w = L.walls[i]; ctx.fillStyle = '#5a6b8f'; ctx.fillRect(mx + w.x * sx, my + w.y * sy, Math.max(1, w.w * sx), Math.max(1, w.h * sy)); }
  for (i = 0; i < L.covers.length; i++) { var c = L.covers[i]; ctx.fillStyle = '#3d4a68'; ctx.fillRect(mx + c.x * sx, my + c.y * sy, Math.max(1, c.w * sx), Math.max(1, c.h * sy)); }
  if (L.door && !L.door.open) { ctx.fillStyle = '#ff5a5a'; ctx.fillRect(mx + L.door.x * sx, my + L.door.y * sy, Math.max(2, L.door.w * sx), Math.max(2, L.door.h * sy)); }
  for (i = 0; i < L.artifacts.length; i++) { var a = L.artifacts[i]; if (!a.got) { ctx.fillStyle = '#7fe7ff'; ctx.beginPath(); ctx.arc(mx + a.x * sx, my + a.y * sy, 3, 0, 7); ctx.fill(); } }
  for (i = 0; i < L.cameras.length; i++) { ctx.fillStyle = '#ff9d5c'; ctx.fillRect(mx + L.cameras[i].x * sx - 2, my + L.cameras[i].y * sy - 2, 4, 4); }
  for (i = 0; i < L.guards.length; i++) { ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.arc(mx + L.guards[i].x * sx, my + L.guards[i].y * sy, 3.5, 0, 7); ctx.fill(); }
  for (i = 0; i < L.dogs.length; i++) { ctx.fillStyle = '#ff9d5c'; ctx.beginPath(); ctx.arc(mx + L.dogs[i].x * sx, my + L.dogs[i].y * sy, 3, 0, 7); ctx.fill(); }
  ctx.strokeStyle = '#59d98a'; ctx.lineWidth = 2;
  ctx.strokeRect(mx + L.exit.x * sx - 6, my + L.exit.y * sy - 6, 12, 12);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(mx + p.x * sx, my + p.y * sy, 4, 0, 7); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(mx + p.x * sx, my + p.y * sy, 6, 0, 7); ctx.stroke();
  ctx.fillStyle = '#9fb4d8'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
  ctx.fillText('MAP', mx, my + mh + 14);
  ctx.restore();
};
