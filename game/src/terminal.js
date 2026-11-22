// terminal.js — security terminal: hold E for 3s, cameras go dark for 20s
var GH = window.GH;
GH.terminalDraw = function (ctx) {
  var L = GH.L; if (!L) return;
  var t = L.terminal, S = GH.S, bob = Math.sin(S.time * 2) * 2;
  ctx.save();
  ctx.fillStyle = '#12333a'; ctx.strokeStyle = L.terminalDone ? '#59d98a' : '#37c8e8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(t.x - 14, t.y - 14 + bob, 28, 28, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = L.terminalDone ? '#59d98a' : '#37c8e8';
  ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
  ctx.fillText('▦', t.x, t.y + 4 + bob);
  ctx.font = 'bold 9px monospace';
  ctx.fillText(L.terminalDone ? 'CAMERAS OFF' : 'TERMINAL — hold E', t.x, t.y - 22 + bob);
  if (S.hack > 0 && !L.terminalDone) {
    ctx.fillStyle = '#222'; ctx.fillRect(t.x - 20, t.y + 18, 40, 6);
    ctx.fillStyle = '#37c8e8'; ctx.fillRect(t.x - 20, t.y + 18, 40 * (S.hack / 3), 6);
  }
  ctx.restore();
};
GH.camerasDisabled = function () { return GH.S.time < GH.S.camerasOffUntil; };
