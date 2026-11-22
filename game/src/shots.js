// Ghostlight Heist — deterministic demo states for screenshots.
// ?shot=start | play | play2 | end (with &seed=1 for reproducibility).
// These are dev affordances built from the game's own state: they place the
// player, guards and artifacts with the same code the game uses, then let
// the normal render loop draw them. Nothing here fakes a render.

import { TILE, tileCenter } from './config.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function parseShot() {
  const q = new URLSearchParams(window.location.search);
  return { shot: q.get('shot') || null, seed: parseInt(q.get('seed') || '1', 10) || 1 };
}

// Places the game into a chosen demo state. Returns the screen to show.
export function applyShot(game, shot, seed) {
  const rand = mulberry32(seed);
  // Give guards deterministic walk phases so the shot is reproducible.
  const fixPhases = () => {
    for (const g of game.guards) g.walkPhase = rand() * 6;
    if (game.dog) game.dog.walkPhase = rand() * 6;
  };

  if (shot === 'start') {
    game.loadLevel(0);
    fixPhases();
    return 'title';
  }

  if (shot === 'play') {
    // Level 1 mid-play: thief crouched behind a crate, a guard cone sweeping
    // nearby, 1 of 2 artifacts already collected, detection eye half full.
    game.loadLevel(0);
    const p = game.player;
    const c = tileCenter(11, 8);
    p.x = c.x;
    p.y = c.y;
    p.mode = 'sneak';
    p.facing = -0.46;
    game.world.artifacts[0].taken = true;
    const g = game.guards[0];
    g.x = tileCenter(13, 7).x;
    g.y = tileCenter(13, 7).y;
    g.facing = 2.68;
    g.meter = 0.45;
    g.state = 'suspicious';
    const g2 = game.guards[1];
    g2.x = tileCenter(8, 9).x;
    g2.y = tileCenter(8, 9).y;
    g2.facing = -Math.PI / 2;
    fixPhases();
    game.score = 250;
    game.levelTime = 47;
    return 'playing';
  }

  if (shot === 'play2') {
    // Level 2: camera cone sweeping, two guards on patrol, thief in cover.
    game.loadLevel(1);
    const p = game.player;
    const c = tileCenter(6, 5);
    p.x = c.x;
    p.y = c.y;
    p.mode = 'sneak';
    p.facing = 0;
    const cam = game.cameras[0];
    cam.angle = 0.5;
    cam.meter = 0.3;
    const g = game.guards[0];
    g.x = tileCenter(10, 5).x;
    g.y = tileCenter(10, 5).y;
    g.facing = Math.PI;
    const g2 = game.guards[2];
    g2.x = tileCenter(24, 9).x;
    g2.y = tileCenter(24, 9).y;
    g2.facing = -Math.PI / 2;
    g2.meter = 0.2;
    fixPhases();
    game.score = 640;
    game.levelTime = 82;
    return 'playing';
  }

  if (shot === 'end') {
    // Level-complete screen with stars and bonuses.
    game.loadLevel(0);
    game.world.artifacts.forEach((a) => { a.taken = true; });
    game.world.exit.open = true;
    game.score = 1250;
    game.levelTime = 68;
    game.ghost = true;
    game.completeLevel(true);
    return 'level';
  }

  return null;
}
