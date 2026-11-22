// Ghostlight Heist — guards, cameras and the guard dog.
// Guard states: calm (patrol) -> suspicious (walk to last seen spot, look
// around) -> alerted (chase the player, alarm). Detection is a meter that
// fills only while the player is inside the vision cone AND in line of sight,
// faster when the player is close, running, or standing in light.

import { TILE, tileCenter } from './config.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export class Guard {
  constructor(spawn, waypoints, speed, range, fov) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.waypoints = waypoints.map(([tx, ty]) => tileCenter(tx, ty));
    this.wpIndex = 0;
    this.speed = speed;
    this.range = range;
    this.fov = fov;
    this.facing = 0;
    this.state = 'calm'; // calm | suspicious | alerted
    this.meter = 0; // 0..1 detection for this guard
    this.lastSeen = null;
    this.suspicionTimer = 0;
    this.lookTimer = 0;
    this.pauseTimer = 0;
    this.stuckTimer = 0;
    this.lastX = this.x;
    this.lastY = this.y;
    this.walkPhase = Math.random() * 6;
  }

  // Can this guard see the player right now? Cone + distance + real LOS.
  // A sneaking player has a smaller detection radius: guards spot them
  // only when much closer.
  canSee(player, world) {
    const range = player.mode === 'sneak' ? this.range * 0.72 : this.range;
    const d = dist(this.x, this.y, player.x, player.y);
    if (d > range) return 0;
    const angleTo = Math.atan2(player.y - this.y, player.x - this.x);
    if (Math.abs(angleDiff(angleTo, this.facing)) > this.fov / 2) return 0;
    if (!world.hasLineOfSight(this.x, this.y, player.x, player.y)) return 0;
    // Closer = seen faster. Returns a 0..1 strength.
    return 1.15 - (d / range) * 0.75;
  }

  update(dt, player, world, events) {
    const seen = this.canSee(player, world);
    if (seen > 0) {
      let rate = 0.55 * seen;
      if (player.mode === 'run') rate *= 1.7;
      else if (player.mode === 'sneak') rate *= 0.55;
      if (world.inLight(player.x, player.y)) rate *= 1.45;
      this.meter = Math.min(1, this.meter + rate * dt);
      this.lastSeen = { x: player.x, y: player.y };
    } else {
      this.meter = Math.max(0, this.meter - 0.22 * dt);
    }

    if (this.meter >= 1 && this.state !== 'alerted') {
      this.state = 'alerted';
      events.alert(this);
    } else if (this.meter >= 0.35 && this.state === 'calm') {
      this.state = 'suspicious';
      this.suspicionTimer = 0;
    }

    if (this.state === 'calm') this.patrol(dt, world);
    else if (this.state === 'suspicious') this.investigate(dt, world);
    else this.chase(dt, player, world, events);

    // Stuck detection: if barely moving while trying, nudge the waypoint.
    if (dist(this.x, this.y, this.lastX, this.lastY) < 1.5 && this.state !== 'calm') {
      this.stuckTimer += dt;
      if (this.stuckTimer > 1.2) {
        this.stuckTimer = 0;
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        if (this.state === 'suspicious') this.state = 'calm';
      }
    } else {
      this.stuckTimer = 0;
    }
    this.lastX = this.x;
    this.lastY = this.y;
  }

  moveToward(tx, ty, speed, dt, world) {
    const d = dist(this.x, this.y, tx, ty);
    if (d < 2) return true;
    const nx = ((tx - this.x) / d) * speed * dt;
    const ny = ((ty - this.y) / d) * speed * dt;
    this.facing = Math.atan2(ty - this.y, tx - this.x);
    const p = world.moveCircle(this.x, this.y, nx, ny, 14);
    this.x = p.x;
    this.y = p.y;
    this.walkPhase += dt * 9;
    return d < 6;
  }

  patrol(dt, world) {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      return;
    }
    const wp = this.waypoints[this.wpIndex];
    if (this.moveToward(wp.x, wp.y, this.speed, dt, world)) {
      this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      this.pauseTimer = 0.6; // brief look-around at each waypoint
    }
  }

  investigate(dt, world) {
    if (this.lastSeen) {
      if (!this.moveToward(this.lastSeen.x, this.lastSeen.y, this.speed * 1.25, dt, world)) return;
    }
    // Arrived: scan the area, then give up and go back to patrol.
    this.lookTimer += dt;
    this.facing += Math.sin(this.lookTimer * 2.2) * dt * 1.6;
    this.suspicionTimer += dt;
    if (this.suspicionTimer > 3.2) {
      this.state = 'calm';
      this.meter = 0.2;
      this.lookTimer = 0;
      this.suspicionTimer = 0;
    }
  }

  chase(dt, player, world, events) {
    this.moveToward(player.x, player.y, this.speed * 1.65, dt, world);
    if (dist(this.x, this.y, player.x, player.y) < 26) {
      events.caught(this);
    }
    // Lost the player completely for a while: drop back to suspicious.
    if (this.canSee(player, world) === 0) {
      this.meter = Math.max(0, this.meter - 0.12 * dt);
      if (this.meter < 0.55) {
        this.state = 'suspicious';
        this.lastSeen = { x: player.x, y: player.y };
        this.suspicionTimer = 0;
      }
    }
  }
}

export class Camera {
  constructor(spawn, def) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.speed = def.speed;
    this.range = def.range;
    this.fov = (52 * Math.PI) / 180;
    this.phase = 0;
    this.angle = def.baseAngle;
    this.meter = 0;
  }

  update(dt, player, world, events) {
    this.phase += dt * this.speed;
    this.angle = this.baseAngle + Math.sin(this.phase) * this.sweep;
    const range = player.mode === 'sneak' ? this.range * 0.72 : this.range;
    const d = dist(this.x, this.y, player.x, player.y);
    let seen = 0;
    if (d < range) {
      const angleTo = Math.atan2(player.y - this.y, player.x - this.x);
      if (Math.abs(angleDiff(angleTo, this.angle)) < this.fov / 2 &&
          world.hasLineOfSight(this.x, this.y, player.x, player.y)) {
        seen = 1.2 - (d / range) * 0.7;
      }
    }
    if (seen > 0) {
      this.meter = Math.min(1, this.meter + 0.9 * seen * dt);
      if (this.meter >= 1) events.cameraAlarm(this);
    } else {
      this.meter = Math.max(0, this.meter - 0.3 * dt);
    }
  }
}

export class Dog {
  constructor(spawn, def) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.waypoints = def.waypoints.map(([tx, ty]) => tileCenter(tx, ty));
    this.wpIndex = 0;
    this.speed = def.speed;
    this.hearRadius = def.hearRadius;
    this.state = 'patrol'; // patrol | chase
    this.facing = 0;
    this.target = null;
    this.walkPhase = 0;
    this.loseTimer = 0;
  }

  update(dt, player, world, events) {
    const d = dist(this.x, this.y, player.x, player.y);
    // The dog hears running. Sneaking past it is safe.
    if (player.mode === 'run' && d < this.hearRadius &&
        world.hasLineOfSight(this.x, this.y, player.x, player.y)) {
      this.state = 'chase';
      this.target = { x: player.x, y: player.y };
      this.loseTimer = 0;
    }
    if (this.state === 'chase') {
      this.target = { x: player.x, y: player.y };
      const arrived = this.moveToward(this.target.x, this.target.y, this.speed * 1.5, dt, world);
      if (d < 24) events.caught(this);
      if (d > this.hearRadius * 1.6) {
        this.loseTimer += dt;
        if (this.loseTimer > 2) this.state = 'patrol';
      }
    } else {
      const wp = this.waypoints[this.wpIndex];
      if (this.moveToward(wp.x, wp.y, this.speed, dt, world)) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      }
    }
  }

  moveToward(tx, ty, speed, dt, world) {
    const d = dist(this.x, this.y, tx, ty);
    if (d < 2) return true;
    const nx = ((tx - this.x) / d) * speed * dt;
    const ny = ((ty - this.y) / d) * speed * dt;
    this.facing = Math.atan2(ty - this.y, tx - this.x);
    const p = world.moveCircle(this.x, this.y, nx, ny, 12);
    this.x = p.x;
    this.y = p.y;
    this.walkPhase += dt * 12;
    return d < 6;
  }
}
