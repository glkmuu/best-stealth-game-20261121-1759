// Ghostlight Heist — world: map parsing, collision, line of sight.
// A tile is either open floor or a sight/movement blocker. Cover objects
// (crates, shelves, pillars, plants) block both sight and movement, which is
// what makes hiding behind them real instead of decorative.

import { TILE, MAP_COLS, MAP_ROWS, tileCenter } from './config.js';

// Tiles that block movement and sight.
export const BLOCKERS = new Set(['#', 'C', 'S', 'P', 'T']);

export class World {
  constructor(level) {
    this.level = level;
    this.grid = level.map.map((row) => row.split(''));
    this.artifacts = [];
    this.lights = [];
    this.guardSpawns = [];
    this.cameraSpawns = [];
    this.dogSpawn = null;
    this.playerStart = null;
    this.exit = null;
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const ch = this.grid[ty][tx];
        const c = tileCenter(tx, ty);
        if (ch === 'A') this.artifacts.push({ tx, ty, x: c.x, y: c.y, taken: false, bob: Math.random() * 6 });
        else if (ch === 'L') this.lights.push({ tx, ty, x: c.x, y: c.y });
        else if (ch === 'G') this.guardSpawns.push({ tx, ty, x: c.x, y: c.y });
        else if (ch === 'M') this.cameraSpawns.push({ tx, ty, x: c.x, y: c.y });
        else if (ch === 'K') this.dogSpawn = { tx, ty, x: c.x, y: c.y };
        else if (ch === 'D') this.playerStart = { tx, ty, x: c.x, y: c.y };
        else if (ch === 'E') this.exit = { tx, ty, x: c.x, y: c.y, open: false };
      }
    }
  }

  charAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_COLS || ty >= MAP_ROWS) return '#';
    return this.grid[ty][tx];
  }

  isBlockedTile(tx, ty) {
    return BLOCKERS.has(this.charAt(tx, ty));
  }

  // Circle vs blocked tiles. Returns the position after sliding along walls.
  moveCircle(x, y, dx, dy, radius) {
    let nx = x + dx;
    if (this.circleHits(nx, y, radius)) nx = x;
    let ny = y + dy;
    if (this.circleHits(nx, ny, radius)) ny = y;
    return { x: nx, y: ny };
  }

  circleHits(x, y, radius) {
    const x0 = Math.floor((x - radius) / TILE);
    const x1 = Math.floor((x + radius) / TILE);
    const y0 = Math.floor((y - radius) / TILE);
    const y1 = Math.floor((y + radius) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.isBlockedTile(tx, ty)) continue;
        const bx = tx * TILE;
        const by = ty * TILE;
        const cx = Math.max(bx, Math.min(x, bx + TILE));
        const cy = Math.max(by, Math.min(y, by + TILE));
        const ddx = x - cx;
        const ddy = y - cy;
        if (ddx * ddx + ddy * ddy < radius * radius) return true;
      }
    }
    return false;
  }

  // True when nothing blocks the straight segment between two points.
  // Sampled in small steps so thin walls can never be skipped.
  hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      if (this.isBlockedTile(Math.floor(px / TILE), Math.floor(py / TILE))) return false;
    }
    return true;
  }

  // Distance from (x, y) along a ray until the first blocking tile, capped at maxDist.
  castRay(x, y, angle, maxDist) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let dist = 0;
    const step = 6;
    while (dist < maxDist) {
      dist += step;
      const px = x + dx * dist;
      const py = y + dy * dist;
      if (this.isBlockedTile(Math.floor(px / TILE), Math.floor(py / TILE))) return dist;
    }
    return maxDist;
  }

  // Is the point standing inside a lit pool? Light pools raise detection.
  inLight(x, y) {
    for (const l of this.lights) {
      const dx = x - l.x;
      const dy = y - l.y;
      if (dx * dx + dy * dy < 46 * 46) return true;
    }
    return false;
  }

  artifactsLeft() {
    return this.artifacts.filter((a) => !a.taken).length;
  }
}
