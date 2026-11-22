// Ghostlight Heist — canvas rendering: the museum floor, walls, cover,
// vision cones (raycast against walls, so cover really hides you), light
// pools, and the night-time darkness that shows what is safe.

import { TILE, MAP_COLS, MAP_ROWS } from './config.js';

export const VIEW = { width: 1280, height: 800, offsetX: 40, offsetY: 110 };

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

// Per-tile floor shade, deterministic so every load looks the same.
const FLOOR_SHADE = (() => {
  const rand = mulberry32(1337);
  const shades = [];
  for (let i = 0; i < MAP_COLS * MAP_ROWS; i++) shades.push(rand());
  return shades;
})();

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = VIEW.width;
    canvas.height = VIEW.height;
    // Offscreen layer for the night darkness, so punching light holes in it
    // never erases the game art drawn underneath.
    this.darkCanvas = document.createElement('canvas');
    this.darkCanvas.width = MAP_COLS * TILE;
    this.darkCanvas.height = MAP_ROWS * TILE;
    this.darkCtx = this.darkCanvas.getContext('2d');
  }

  draw(game, time) {
    const ctx = this.ctx;
    const world = game.world;
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    ctx.save();
    ctx.translate(VIEW.offsetX, VIEW.offsetY);
    // Clip everything to the level bounds so vision cones never spill
    // into the margin around the map.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, MAP_COLS * TILE, MAP_ROWS * TILE);
    ctx.clip();
    this.drawFloor(ctx, world, game.levelIndex);
    this.drawLights(ctx, world, time);
    this.drawExit(ctx, world, time);
    this.drawArtifacts(ctx, world, time);
    this.drawCover(ctx, world);
    this.drawWalls(ctx, world);
    this.drawCameras(ctx, game, time);
    this.drawGuards(ctx, game, time);
    if (game.dog) this.drawDog(ctx, game.dog, time);
    this.drawPlayer(ctx, game, time);
    this.drawDarkness(ctx, game, time);
    if (game.hintArrow) this.drawHintArrow(ctx, game, time);
    ctx.restore(); // un-clip
    ctx.restore();
  }

  drawFloor(ctx, world, levelIndex) {
    const palettes = [
      ['#463c2e', '#514638'], // Archive: dark wood
      ['#333b4b', '#3b4356'], // Gallery: slate marble
      ['#372e4a', '#403654'], // Vault: deep violet stone
    ];
    const [a, b] = palettes[levelIndex] || palettes[0];
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const ch = world.charAt(tx, ty);
        if (ch === '#') continue;
        const shade = FLOOR_SHADE[ty * MAP_COLS + tx];
        ctx.fillStyle = shade > 0.5 ? a : b;
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        // subtle tile grout
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
      }
    }
  }

  drawLights(ctx, world, time) {
    for (const l of world.lights) {
      const pulse = 0.55 + Math.sin(time * 2 + l.tx) * 0.06;
      const grad = ctx.createRadialGradient(l.x, l.y, 6, l.x, l.y, 52);
      grad.addColorStop(0, `rgba(255, 214, 120, ${pulse})`);
      grad.addColorStop(1, 'rgba(255, 214, 120, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 52, 0, Math.PI * 2);
      ctx.fill();
      // ceiling lamp fixture
      ctx.fillStyle = '#6b5a2e';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawExit(ctx, world, time) {
    const e = world.exit;
    if (!e) return;
    const open = e.open;
    ctx.save();
    ctx.translate(e.x, e.y);
    // door frame
    ctx.fillStyle = '#14100c';
    ctx.fillRect(-19, -19, 38, 38);
    ctx.fillStyle = open ? '#1d7a3a' : '#7a1d1d';
    ctx.fillRect(-15, -15, 30, 30);
    ctx.strokeStyle = open ? '#7dff9e' : '#ff8a7a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-15, -15, 30, 30);
    // door bars / open glow
    if (open) {
      const glow = 0.5 + Math.sin(time * 3) * 0.2;
      ctx.fillStyle = `rgba(125, 255, 158, ${glow})`;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#3a0d0d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-15, -15);
      ctx.lineTo(15, 15);
      ctx.moveTo(15, -15);
      ctx.lineTo(-15, 15);
      ctx.stroke();
    }
    ctx.restore();
    // label
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = open ? '#7dff9e' : '#ff9a8a';
    ctx.fillText(open ? 'EXIT — OPEN' : 'EXIT — LOCKED', e.x, e.y - 26);
  }

  drawArtifacts(ctx, world, time) {
    for (const a of world.artifacts) {
      if (a.taken) continue;
      const bob = Math.sin(time * 2.4 + a.bob) * 3;
      ctx.save();
      ctx.translate(a.x, a.y + bob);
      // glow
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
      grad.addColorStop(0, 'rgba(255, 215, 90, 0.75)');
      grad.addColorStop(1, 'rgba(255, 215, 90, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      // golden idol: diamond gem on a pedestal
      ctx.fillStyle = '#8a6d1f';
      ctx.fillRect(-9, 4, 18, 8);
      ctx.fillStyle = '#ffd75a';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(9, -2);
      ctx.lineTo(0, 6);
      ctx.lineTo(-9, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(5, -2);
      ctx.lineTo(0, 2);
      ctx.lineTo(-5, -2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawCover(ctx, world) {
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        const ch = world.charAt(tx, ty);
        const x = tx * TILE;
        const y = ty * TILE;
        if (ch === 'C') {
          // wooden crate
          ctx.fillStyle = '#7a5a28';
          ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = '#8f6d33';
          ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
          ctx.strokeStyle = '#5a3f16';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
          ctx.beginPath();
          ctx.moveTo(x + 3, y + 3);
          ctx.lineTo(x + TILE - 3, y + TILE - 3);
          ctx.moveTo(x + TILE - 3, y + 3);
          ctx.lineTo(x + 3, y + TILE - 3);
          ctx.stroke();
        } else if (ch === 'S') {
          ctx.fillStyle = '#4a3220';
          ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
          ctx.fillStyle = '#6b4a2e';
          ctx.fillRect(x + 5, y + 5, TILE - 10, 8);
          ctx.fillRect(x + 5, y + 16, TILE - 10, 8);
          ctx.fillRect(x + 5, y + 27, TILE - 10, 8);
        } else if (ch === 'P') {
          ctx.fillStyle = '#5c5c66';
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#7d7d8a';
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, 9, 0, Math.PI * 2);
          ctx.fill();
        } else if (ch === 'T') {
          ctx.fillStyle = '#3d2c1c';
          ctx.fillRect(x + 12, y + 26, 16, 10);
          ctx.fillStyle = '#2e7d32';
          ctx.beginPath();
          ctx.arc(x + 14, y + 18, 9, 0, Math.PI * 2);
          ctx.arc(x + 26, y + 16, 10, 0, Math.PI * 2);
          ctx.arc(x + 20, y + 10, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4caf50';
          ctx.beginPath();
          ctx.arc(x + 18, y + 16, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawWalls(ctx, world) {
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        if (world.charAt(tx, ty) !== '#') continue;
        const x = tx * TILE;
        const y = ty * TILE;
        ctx.fillStyle = '#17131c';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#2e2836';
        ctx.fillRect(x, y, TILE, 5);
        ctx.fillStyle = '#241f2c';
        ctx.fillRect(x, y + 5, TILE, 3);
      }
    }
  }

  // Vision cone polygon from raycasts: blocked by walls and cover.
  conePolygon(world, x, y, angle, fov, range) {
    const rays = 26;
    const pts = [{ x, y }];
    for (let i = 0; i <= rays; i++) {
      const a = angle - fov / 2 + (fov * i) / rays;
      const d = world.castRay(x, y, a, range);
      pts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
    }
    return pts;
  }

  drawCone(ctx, world, x, y, angle, fov, range, color, alpha) {
    const pts = this.conePolygon(world, x, y, angle, fov, range);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha + 0.25;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawCameras(ctx, game, time) {
    for (const cam of game.cameras) {
      const alert = cam.meter > 0.05;
      this.drawCone(ctx, game.world, cam.x, cam.y, cam.angle, cam.fov, cam.range,
        alert ? 'rgba(255, 60, 40, 0.30)' : 'rgba(255, 210, 80, 0.20)', 1);
      // mount + lens
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.fillStyle = '#3a3f4a';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(cam.angle);
      ctx.fillStyle = alert ? '#ff3c28' : '#ffd250';
      ctx.fillRect(0, -4, 16, 8);
      ctx.beginPath();
      ctx.arc(16, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (cam.meter > 0.05) {
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff6a55';
        ctx.fillText('!', cam.x, cam.y - 18);
      }
    }
  }

  drawGuards(ctx, game, time) {
    for (const g of game.guards) {
      const alerted = g.state === 'alerted';
      const suspicious = g.state === 'suspicious';
      const color = alerted ? 'rgba(255, 60, 40, 0.34)'
        : suspicious ? 'rgba(255, 170, 40, 0.30)'
        : 'rgba(255, 220, 90, 0.22)';
      this.drawCone(ctx, game.world, g.x, g.y, g.facing, g.fov, g.range, color, 1);
      // guard body: dark uniform, pale face, cap
      ctx.save();
      ctx.translate(g.x, g.y);
      const bob = Math.sin(g.walkPhase) * 1.5;
      ctx.fillStyle = '#1c2436';
      ctx.beginPath();
      ctx.arc(0, bob * 0.4, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = alerted ? '#ff5040' : suspicious ? '#ffaa28' : '#8fa3c8';
      ctx.lineWidth = 2;
      ctx.stroke();
      // facing tick
      ctx.rotate(g.facing);
      ctx.fillStyle = '#e8dcc0';
      ctx.beginPath();
      ctx.arc(7, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b3a55';
      ctx.fillRect(2, -6, 8, 12);
      ctx.restore();
      // state mark + detection arc
      if (g.meter > 0.03) {
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = alerted ? '#ff5040' : '#ffcf4d';
        ctx.fillText(alerted ? '!' : '?', g.x, g.y - 20);
        ctx.strokeStyle = alerted ? '#ff5040' : '#ffcf4d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.meter);
        ctx.stroke();
      }
    }
  }

  drawDog(ctx, dog, time) {
    ctx.save();
    ctx.translate(dog.x, dog.y);
    const bob = Math.sin(dog.walkPhase) * 1.5;
    ctx.rotate(dog.facing);
    ctx.fillStyle = dog.state === 'chase' ? '#5a2a1a' : '#4a3423';
    ctx.beginPath();
    ctx.ellipse(0, bob * 0.4, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(13, bob * 0.4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1a0e';
    ctx.beginPath();
    ctx.moveTo(10, -6 + bob * 0.4);
    ctx.lineTo(8, -12 + bob * 0.4);
    ctx.lineTo(14, -7 + bob * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d8b98a';
    ctx.fillText(dog.state === 'chase' ? 'WOOF!' : 'dog', dog.x, dog.y - 18);
  }

  drawPlayer(ctx, game, time) {
    const p = game.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    // noise ring while running
    if (p.noise > 0) {
      const r = 20 + p.noisePulse * (p.noise - 20);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.55 * (1 - p.noisePulse)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 9, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const crouch = p.mode === 'sneak';
    ctx.rotate(p.facing);
    // cloak body — bright violet so the thief reads against the dark floor
    ctx.fillStyle = crouch ? '#6b4fa8' : '#7d5fc0';
    ctx.beginPath();
    ctx.arc(0, 0, crouch ? 11 : 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8dcff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // hood point + face
    ctx.fillStyle = '#2a1c44';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(2, -7);
    ctx.lineTo(2, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2d8a0';
    ctx.beginPath();
    ctx.arc(5, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // sneak indicator, below the thief so it never covers a guard's "?" mark
    if (crouch) {
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d9ccff';
      ctx.fillText('SNEAK', p.x, p.y + 28);
    }
  }

  drawDarkness(ctx, game, time) {
    // Night falls over the museum; light pools, artifacts and the thief
    // stay readable. Holes are punched in the offscreen darkness layer,
    // then the layer is drawn over the scene.
    const dctx = this.darkCtx;
    dctx.clearRect(0, 0, MAP_COLS * TILE, MAP_ROWS * TILE);
    dctx.globalCompositeOperation = 'source-over';
    dctx.fillStyle = 'rgba(4, 4, 14, 0.28)';
    dctx.fillRect(0, 0, MAP_COLS * TILE, MAP_ROWS * TILE);
    dctx.globalCompositeOperation = 'destination-out';
    const holes = [];
    holes.push({ x: game.player.x, y: game.player.y, r: 130 });
    for (const l of game.world.lights) holes.push({ x: l.x, y: l.y, r: 70 });
    for (const a of game.world.artifacts) {
      if (!a.taken) holes.push({ x: a.x, y: a.y, r: 46 });
    }
    if (game.world.exit) holes.push({ x: game.world.exit.x, y: game.world.exit.y, r: 60 });
    for (const h of holes) {
      const grad = dctx.createRadialGradient(h.x, h.y, 4, h.x, h.y, h.r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = grad;
      dctx.beginPath();
      dctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      dctx.fill();
    }
    ctx.drawImage(this.darkCanvas, 0, 0);
  }

  drawHintArrow(ctx, game, time) {
    const p = game.player;
    const e = game.world.exit;
    if (!e) return;
    const angle = Math.atan2(e.y - p.y, e.x - p.x);
    const pulse = 26 + Math.sin(time * 5) * 4;
    const ax = p.x + Math.cos(angle) * pulse;
    const ay = p.y + Math.sin(angle) * pulse;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.fillStyle = '#7dff9e';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
