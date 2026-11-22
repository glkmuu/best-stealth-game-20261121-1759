// Ghostlight Heist — config.js: level data, constants, shared state (round 2, fresh rewrite)
window.GH = window.GH || {};
var GH = window.GH;
GH.TILE = 40;
GH.W = 960; GH.H = 600;
GH.LEVEL_NAMES = ['The Archive', 'The Gallery', 'The Vault', 'The Rooftop'];
GH.LEVEL_SUBS = ['Night shift at the old museum', 'Glass halls, sweeping cameras', 'The vault below — dogs on patrol', 'Rooftop escape — the helicopter pad'];
GH.unlocked = 4;
GH.S = null; GH.L = null; GH.keys = {};
GH.saveKey = 'ghostlight-heist-r2';

function GHwall(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }
function GHcover(x, y, w, h, kind) { return { x: x, y: y, w: w, h: h, kind: kind || 'crate' }; }
function GHguard(x, y, path, speed, pause) { return { x: x, y: y, path: path, speed: speed || 55, pause: pause || 1.2 }; }
function GHcamera(x, y, angle, sweep, range) { return { x: x, y: y, angle: angle, sweep: sweep || 0.9, range: range || 190 }; }
function GHlaser(x1, y1, x2, y2, on, off, phase) { return { x1: x1, y1: y1, x2: x2, y2: y2, on: on || 2.4, off: off || 1.6, phase: phase || 0 }; }
function GHdog(x, y, path) { return { x: x, y: y, path: path, speed: 95 }; }

GH.LEVELS = [
  { // Level 1 — The Archive
    name: 'The Archive', sub: 'Night shift at the old museum',
    start: { x: 80, y: 520 }, exit: { x: 880, y: 80 },
    walls: [GHwall(360, 0, 40, 200), GHwall(360, 400, 40, 200), GHwall(600, 280, 360, 40)],
    covers: [GHcover(150, 150, 80, 40, 'crate'), GHcover(240, 380, 40, 80, 'case'), GHcover(500, 120, 80, 40, 'case'), GHcover(640, 420, 80, 40, 'crate'), GHcover(120, 300, 40, 80, 'crate'), GHcover(820, 300, 40, 80, 'case')],
    rugs: [{ x: 100, y: 80, w: 200, h: 120 }, { x: 620, y: 420, w: 220, h: 120 }],
    guards: [GHguard(140, 140, [[140, 140], [320, 140]], 55, 1.4), GHguard(520, 340, [[520, 340], [520, 520]], 50, 1.0), GHguard(460, 500, [[460, 500], [700, 500]], 55, 1.2)],
    dogs: [],
    cameras: [GHcamera(480, 80, 1.57, 0.9, 190)],
    lasers: [GHlaser(400, 210, 400, 390, 2.4, 1.6, 0)],
    keycard: { x: 200, y: 500 }, door: { x: 720, y: 280, w: 80, h: 40 },
    terminal: { x: 120, y: 120 },
    artifacts: [{ x: 820, y: 120 }, { x: 880, y: 480 }],
    lamps: [{ x: 200, y: 200 }, { x: 700, y: 140 }, { x: 500, y: 480 }],
    coins: 3, par: 75
  },
  { // Level 2 — The Gallery
    name: 'The Gallery', sub: 'Glass halls, sweeping cameras',
    start: { x: 80, y: 80 }, exit: { x: 880, y: 520 },
    walls: [GHwall(300, 0, 40, 160), GHwall(300, 340, 40, 260), GHwall(620, 160, 40, 200), GHwall(620, 440, 40, 160), GHwall(140, 300, 220, 40)],
    covers: [GHcover(120, 200, 80, 40, 'case'), GHcover(420, 100, 40, 80, 'crate'), GHcover(480, 420, 80, 40, 'case'), GHcover(760, 140, 40, 80, 'crate'), GHcover(760, 380, 80, 40, 'case'), GHcover(200, 480, 80, 40, 'crate')],
    rugs: [{ x: 380, y: 220, w: 200, h: 120 }, { x: 700, y: 240, w: 180, h: 100 }],
    guards: [GHguard(120, 420, [[120, 420], [280, 420]], 60, 1.0), GHguard(420, 220, [[420, 220], [560, 220]], 60, 1.2), GHguard(700, 300, [[700, 300], [700, 480]], 58, 1.0), GHguard(860, 120, [[860, 120], [720, 120]], 62, 1.4), GHguard(480, 520, [[480, 520], [640, 520]], 60, 1.0)],
    dogs: [],
    cameras: [GHcamera(340, 300, 0, 1.0, 200), GHcamera(660, 100, 1.57, 0.8, 200)],
    lasers: [GHlaser(340, 170, 340, 330, 2.0, 1.8, 0.5), GHlaser(660, 370, 660, 430, 2.2, 1.4, 0)],
    keycard: { x: 880, y: 80 }, door: { x: 620, y: 360, w: 40, h: 80 },
    terminal: { x: 80, y: 520 },
    artifacts: [{ x: 200, y: 140 }, { x: 560, y: 480 }, { x: 880, y: 300 }],
    lamps: [{ x: 200, y: 260 }, { x: 560, y: 140 }, { x: 820, y: 460 }, { x: 420, y: 500 }],
    coins: 4, par: 95
  },
  { // Level 3 — The Vault
    name: 'The Vault', sub: 'The vault below — dogs on patrol',
    start: { x: 80, y: 520 }, exit: { x: 880, y: 80 },
    walls: [GHwall(240, 0, 40, 180), GHwall(240, 320, 40, 280), GHwall(480, 140, 40, 220), GHwall(700, 0, 40, 160), GHwall(700, 300, 40, 300), GHwall(420, 440, 200, 40)],
    covers: [GHcover(120, 140, 80, 40, 'case'), GHcover(340, 100, 40, 80, 'crate'), GHcover(560, 260, 80, 40, 'case'), GHcover(800, 200, 40, 80, 'crate'), GHcover(340, 480, 80, 40, 'case'), GHcover(780, 440, 80, 40, 'crate'), GHcover(560, 520, 40, 40, 'crate')],
    rugs: [{ x: 300, y: 380, w: 180, h: 100 }, { x: 760, y: 100, w: 140, h: 100 }],
    guards: [GHguard(140, 300, [[140, 300], [200, 300]], 65, 0.8), GHguard(360, 220, [[360, 220], [440, 220]], 65, 1.0), GHguard(560, 120, [[560, 120], [660, 120]], 65, 1.0), GHguard(820, 340, [[820, 340], [820, 500]], 65, 1.2), GHguard(300, 420, [[300, 420], [400, 420]], 62, 1.0), GHguard(640, 480, [[640, 480], [760, 480]], 65, 0.9), GHguard(520, 320, [[520, 320], [640, 320]], 65, 1.1)],
    dogs: [GHdog(480, 480, [[480, 480], [680, 480]])],
    cameras: [GHcamera(280, 200, 0.6, 1.0, 210), GHcamera(740, 180, 2.2, 0.9, 210)],
    lasers: [GHlaser(280, 190, 280, 310, 1.8, 1.8, 0), GHlaser(740, 170, 740, 290, 2.0, 1.6, 0.7)],
    keycard: { x: 120, y: 80 }, door: { x: 480, y: 140, w: 40, h: 80 },
    terminal: { x: 880, y: 520 },
    artifacts: [{ x: 160, y: 420 }, { x: 640, y: 80 }, { x: 880, y: 300 }, { x: 520, y: 520 }],
    lamps: [{ x: 160, y: 240 }, { x: 520, y: 80 }, { x: 820, y: 260 }, { x: 400, y: 520 }],
    coins: 4, par: 120
  },
  { // Level 4 — The Rooftop
    name: 'The Rooftop', sub: 'Rooftop escape — the helicopter pad',
    start: { x: 80, y: 80 }, exit: { x: 880, y: 520 },
    walls: [GHwall(240, 140, 40, 220), GHwall(480, 0, 40, 180), GHwall(480, 320, 40, 280), GHwall(700, 140, 40, 220), GHwall(140, 420, 220, 40)],
    covers: [GHcover(120, 240, 80, 40, 'crate'), GHcover(340, 80, 40, 80, 'case'), GHcover(560, 220, 80, 40, 'case'), GHcover(780, 300, 40, 80, 'crate'), GHcover(200, 520, 80, 40, 'crate'), GHcover(640, 460, 80, 40, 'case'), GHcover(840, 120, 40, 80, 'crate')],
    rugs: [{ x: 380, y: 260, w: 220, h: 120 }],
    guards: [GHguard(140, 360, [[140, 360], [300, 360]], 70, 0.9), GHguard(360, 260, [[360, 260], [440, 260]], 70, 1.0), GHguard(560, 120, [[560, 120], [660, 120]], 70, 0.8), GHguard(780, 420, [[780, 420], [780, 500]], 70, 1.0), GHguard(200, 160, [[200, 160], [200, 300]], 68, 1.0), GHguard(640, 320, [[640, 320], [640, 440]], 70, 1.1), GHguard(860, 260, [[860, 260], [740, 260]], 70, 0.9), GHguard(480, 520, [[480, 520], [600, 520]], 70, 1.0)],
    dogs: [GHdog(320, 480, [[320, 480], [440, 480]]), GHdog(760, 160, [[760, 160], [880, 160]])],
    cameras: [GHcamera(280, 100, 1.2, 1.1, 220), GHcamera(520, 300, 0, 1.0, 220), GHcamera(740, 480, 3.1, 0.9, 220)],
    lasers: [GHlaser(280, 370, 280, 460, 1.8, 1.6, 0), GHlaser(520, 190, 520, 310, 2.0, 1.6, 0.5), GHlaser(740, 370, 740, 460, 1.6, 1.8, 0.3)],
    keycard: { x: 880, y: 80 }, door: { x: 700, y: 140, w: 40, h: 80 },
    terminal: { x: 80, y: 520 },
    artifacts: [{ x: 160, y: 480 }, { x: 420, y: 80 }, { x: 660, y: 260 }, { x: 880, y: 380 }, { x: 560, y: 520 }],
    lamps: [{ x: 200, y: 320 }, { x: 520, y: 260 }, { x: 820, y: 200 }, { x: 420, y: 460 }, { x: 760, y: 520 }],
    coins: 5, par: 150
  }
];
GH.freshState = function () {
  return { screen: 'title', level: 0, score: 0, lives: 3, time: 0, levelTime: 0,
    artifactsGot: 0, coins: 0, keycard: false, detection: 0, alerted: false,
    alarms: 0, spotted: false, camerasOffUntil: 0, hack: 0, hint: 3, hintDir: 0,
    muted: false, paused: false, flash: 0, msg: '', msgT: 0, stars: 0, totalScore: 0 };
};
GH.S = GH.freshState();
