// input.js — keyboard controls
var GH = window.GH;
GH.bindInput = function () {
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) >= 0) e.preventDefault();
    GH.keys[k] = true;
    GH.audioCtx();
    if (k === 'q') GH.throwCoin();
    if (k === 'r') GH.restartLevel();
    if (k === 'm') { GH.S.muted = !GH.S.muted; GH.say(GH.S.muted ? 'Muted' : 'Sound on'); GH.uiShow(); }
    if (k === 'p') { GH.S.paused = !GH.S.paused; GH.uiShow(); }
    if (k === 'h') GH.useHint();
    if (k === 'enter') {
      if (GH.S.screen === 'title') { GH.loadLevel(0); GH.uiShow(); }
      else if (GH.S.screen === 'leveldone') GH.nextLevel();
      else if (GH.S.screen === 'complete' || GH.S.screen === 'over') { GH.S = GH.freshState(); GH.loadLevel(0); GH.uiShow(); }
    }
  });
  window.addEventListener('keyup', function (e) { GH.keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function () { GH.keys = {}; });
};
GH.useHint = function () {
  var S = GH.S;
  if (S.screen !== 'play' || S.hint <= 0) return;
  S.hint--; S.hintDir = 3;
  GH.say('Hint: follow the gold marker to the exit');
};
