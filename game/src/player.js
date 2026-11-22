// Ghostlight Heist — the thief: movement, sneak, running and noise.
// Sneak (Shift) is slow and quiet with a smaller detection profile; running
// is fast but loud — guards and the dog hear the noise ring.

import { PLAYER_SPEED } from './config.js';

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.radius = 13;
    this.mode = 'walk'; // walk | sneak | run
    this.facing = -Math.PI / 2;
    this.moving = false;
    this.stepTimer = 0;
    this.noise = 0; // current noise radius, 0 when quiet
    this.noisePulse = 0; // 0..1 expanding ring animation
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.mode = 'walk';
    this.facing = -Math.PI / 2;
    this.moving = false;
    this.noise = 0;
  }

  update(dt, input, world, audio) {
    let ax = 0;
    let ay = 0;
    if (input.isDown('KeyW') || input.isDown('ArrowUp')) ay -= 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) ay += 1;
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) ax -= 1;
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) ax += 1;
    this.moving = ax !== 0 || ay !== 0;

    const sneak = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const sprint = input.isDown('Space');
    // Walk is the quiet default. Shift sneaks (slow, quiet, hard to spot).
    // Space runs (fast, loud — guards and the dog hear it).
    // Standing still keeps the current stance, so a crouched thief stays crouched.
    if (this.moving) {
      this.mode = sneak ? 'sneak' : sprint ? 'run' : 'walk';
    }

    const speed = PLAYER_SPEED[this.mode];
    if (this.moving) {
      const len = Math.hypot(ax, ay);
      const dx = (ax / len) * speed * dt;
      const dy = (ay / len) * speed * dt;
      this.facing = Math.atan2(dy, dx);
      const p = world.moveCircle(this.x, this.y, dx, dy, this.radius);
      this.x = p.x;
      this.y = p.y;
      // Footsteps: quiet ticks while sneaking, louder thuds while running.
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.mode === 'run' ? 0.28 : this.mode === 'sneak' ? 0.5 : 0.38;
        audio.footstep(this.mode);
      }
    }

    // Noise: only running is heard. The ring expands and fades.
    if (this.mode === 'run' && this.moving) {
      this.noise = 130;
      this.noisePulse = (this.noisePulse + dt * 1.6) % 1;
    } else {
      this.noise = Math.max(0, this.noise - 260 * dt);
    }
  }

  // Nearest artifact within pickup reach, or null.
  nearArtifact(world) {
    for (const a of world.artifacts) {
      if (a.taken) continue;
      const d = Math.hypot(a.x - this.x, a.y - this.y);
      if (d < 42) return a;
    }
    return null;
  }

  nearExit(world) {
    if (!world.exit) return false;
    return Math.hypot(world.exit.x - this.x, world.exit.y - this.y) < 34;
  }
}
