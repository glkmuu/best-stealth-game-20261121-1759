// keycards.js — keycard doors: red reader while locked, green when open
var GH = window.GH;
GH.keycardDoorRect = function () { var d = GH.L.door; return d ? { x: d.x, y: d.y, w: d.w, h: d.h } : null; };
GH.doorBlocks = function () { return GH.L && GH.L.door && !GH.L.door.open; };
GH.keycardDraw = function (ctx) {
  var L = GH.L; if (!L) return;
  if (!L.keycardGot) {
    var k = L.keycard, bob = Math.sin(GH.S.time * 3) * 3;
    ctx.save();
    ctx.fillStyle = '#ffd34d'; ctx.strokeStyle = '#8a6d00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(k.x - 9, k.y - 6 + bob, 18, 12, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a6d00'; ctx.fillRect(k.x - 5, k.y - 2 + bob, 10, 2);
    ctx.fillStyle = '#ffe98a'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('KEYCARD', k.x, k.y - 14 + bob);
    ctx.restore();
  }
  var d = L.door;
  if (d) {
    ctx.save();
    ctx.fillStyle = d.open ? '#2f7d4f' : '#7d2f2f';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = d.open ? '#59d98a' : '#ff5a5a'; ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = d.open ? '#59d98a' : '#ff5a5a';
    ctx.beginPath(); ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(d.open ? 'OPEN' : 'LOCKED', d.x + d.w / 2, d.y - 6);
    ctx.restore();
  }
};
