// Ghostlight Heist — game loop and state machine.
// Screens: title -> playing -> (level complete) -> next level ... -> game
// complete, or game over when the lives run out. Caught = lose a life and
// restart the level. All artifacts unlock the exit; reaching it unseen pays
// a time bonus and a ghost bonus.

import { LEVELS, TILE, tileCenter } from './config.js';
import { World } from './world.js';
import { Guard, Camera, Dog } from './guards.js';
import { Player } from './player.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { UI } from './ui.js';
import { parseShot, applyShot } from './shots.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.audio = new AudioEngine();
    this.ui = new UI(this);
    this.screen = 'title'; // title | how | playing | paused | level | game | over
    this.levelIndex = 0;
    this.levelDef = LEVELS[0];
    this.world = null;
    this.player = null;
    this.guards = [];
    this.cameras = [];
    this.dog = null;
    this.lives = 3;
    this.score = 0;
    this.levelTime = 0;
    this.hintsLeft = 3;
    this.hintArrow = false;
    this.hintTimer = 0;
    this.ghost = true; // never detected this level
    this.paused = false;
    this.time = 0;
    this.lastTs = 0;
    this.events = {
      alert: (g) => this.onAlert(g),
      caught: (who) => this.onCaught(who),
      cameraAlarm: (cam) => this.onCameraAlarm(cam),
    };
    this.loadLevel(0);
    this.bindKeys();
    const shot = parseShot();
    if (shot.shot) {
      const screen = applyShot(this, shot.shot, shot.seed);
      if (screen === 'playing') {
        this.screen = 'playing';
        this.ui.showScreen('playing');
      } else if (screen) {
        this.screen = screen;
        this.ui.showScreen(screen);
      }
      this.ui.updateHUD();
      window.__shotReady = true;
    } else {
      this.ui.showScreen('title');
    }
    requestAnimationFrame((ts) => this.loop(ts));
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.levelDef = LEVELS[index];
    this.world = new World(this.levelDef);
    this.player = new Player(this.world.playerStart);
    this.guards = this.world.guardSpawns.map((spawn, i) => new Guard(
      spawn,
      this.levelDef.patrols[i] || [[spawn.tx, spawn.ty]],
      this.levelDef.guardSpeed,
      this.levelDef.guardRange,
      this.levelDef.guardFov,
    ));
    this.cameras = this.world.cameraSpawns.map((spawn, i) => new Camera(
      spawn, this.levelDef.cameras[i],
    ));
    this.dog = this.levelDef.dog && this.world.dogSpawn
      ? new Dog(this.world.dogSpawn, this.levelDef.dog) : null;
    this.levelTime = 0;
    this.hintsLeft = 3;
    this.hintArrow = false;
    this.ghost = true;
    this.ui.updateHUD();
  }

  bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') this.toggleMute();
      if (e.code === 'KeyP' && (this.screen === 'playing' || this.screen === 'paused')) {
        this.togglePause();
      }
      if (e.code === 'KeyR' && this.screen === 'playing') this.restartLevel();
      if (e.code === 'KeyH' && this.screen === 'playing') this.useHint();
      if (e.code === 'Enter' && this.screen === 'title') this.startGame();
      if (e.code === 'Enter' && this.screen === 'level') this.nextLevel();
      if (e.code === 'Enter' && (this.screen === 'game' || this.screen === 'over')) this.startGame();
    });
    this.canvas.addEventListener('mousedown', () => this.audio.ensure());
  }

  startGame() {
    this.audio.ensure();
    this.lives = 3;
    this.score = 0;
    this.loadLevel(0);
    this.screen = 'playing';
    this.ui.showScreen('playing');
    this.ui.banner('Steal every artifact. Reach the exit unseen.');
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
    this.screen = 'playing';
    this.ui.showScreen('playing');
    this.ui.toast('Level restarted');
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.screen = 'game';
      this.ui.setGameComplete(this.score);
      this.ui.showScreen('game');
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.screen = 'playing';
    this.ui.showScreen('playing');
    this.ui.banner(`${this.levelDef.name} — ${this.levelDef.subtitle}`);
  }

  togglePause() {
    if (this.screen === 'playing') {
      this.screen = 'paused';
      this.paused = true;
      this.ui.toast('Paused — P to resume');
    } else if (this.screen === 'paused') {
      this.screen = 'playing';
      this.paused = false;
    }
  }

  toggleMute() {
    this.audio.ensure();
    const muted = this.audio.toggleMute();
    this.ui.toast(muted ? 'Sound off' : 'Sound on');
  }

  useHint() {
    if (this.hintsLeft <= 0) {
      this.ui.toast('No hints left');
      return;
    }
    this.hintsLeft -= 1;
    this.hintArrow = true;
    this.hintTimer = 3;
    this.ui.toast('Hint: follow the green arrow to the exit');
    this.ui.updateHUD();
  }

  showScreen(name) {
    this.screen = name;
    this.ui.showScreen(name);
  }

  onAlert(guard) {
    this.ghost = false;
    this.audio.alert();
    this.ui.banner('SPOTTED! Break line of sight!');
  }

  onCameraAlarm(cam) {
    this.ghost = false;
    this.audio.cameraAlarm();
    this.ui.banner('Camera alarm! Get out of the cone!');
    for (const g of this.guards) {
      if (g.state === 'calm') {
        g.state = 'suspicious';
        g.lastSeen = { x: this.player.x, y: this.player.y };
        g.suspicionTimer = 0;
      }
    }
  }

  onCaught(who) {
    if (this.screen !== 'playing') return;
    this.audio.caught();
    this.lives -= 1;
    this.ui.updateHUD();
    if (this.lives <= 0) {
      this.screen = 'over';
      this.ui.showScreen('over');
      document.getElementById('over-score').textContent = `Score: ${this.score}`;
      return;
    }
    const name = who instanceof Dog ? 'The dog caught you!' : 'Caught by a guard!';
    this.ui.toast(`${name} — ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left`);
    this.loadLevel(this.levelIndex);
  }

  completeLevel(fromShot) {
    const par = this.levelDef.parTime;
    const timeBonus = Math.max(0, Math.round((par - this.levelTime) * 10));
    const ghostBonus = this.ghost ? 300 : 0;
    const stars = this.levelTime <= par ? 3 : this.levelTime <= par * 1.6 ? 2 : 1;
    const levelScore = 500 + timeBonus + ghostBonus;
    this.score += levelScore;
    this.ui.setLevelComplete(stars, timeBonus, ghostBonus, levelScore);
    if (!fromShot) {
      this.audio.levelComplete();
      this.screen = 'level';
      this.ui.showScreen('level');
    }
    this.ui.updateHUD();
  }

  update(dt) {
    if (this.screen !== 'playing' || this.paused) return;
    this.levelTime += dt;
    this.player.update(dt, this.input, this.world, this.audio);

    // Guard noise investigation: a running player draws nearby guards.
    if (this.player.noise > 0) {
      for (const g of this.guards) {
        if (g.state !== 'alerted') {
          const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
          if (d < this.player.noise + 40 && g.state === 'calm') {
            g.state = 'suspicious';
            g.lastSeen = { x: this.player.x, y: this.player.y };
            g.suspicionTimer = 0;
          }
        }
      }
    }

    for (const g of this.guards) g.update(dt, this.player, this.world, this.events);
    for (const c of this.cameras) c.update(dt, this.player, this.world, this.events);
    if (this.dog) this.dog.update(dt, this.player, this.world, this.events);

    // Pickup.
    if (this.input.wasPressed('KeyE')) {
      const a = this.player.nearArtifact(this.world);
      if (a) {
        a.taken = true;
        this.score += 100;
        this.audio.pickup();
        this.ui.toast(`Artifact stolen! ${this.world.artifactsLeft()} left`);
        if (this.world.artifactsLeft() === 0) {
          this.world.exit.open = true;
          this.audio.unlock();
          this.ui.banner('All artifacts stolen — the exit is open!');
        }
        this.ui.updateHUD();
      }
    }

    // Exit.
    if (this.world.exit.open && this.player.nearExit(this.world)) {
      this.completeLevel(false);
    }

    // Hint arrow lifetime.
    if (this.hintArrow) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) this.hintArrow = false;
    }

    this.ui.updateHUD();
  }

  loop(ts) {
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000 || 0.016);
    this.lastTs = ts;
    this.time += dt;
    this.update(dt);
    this.renderer.draw(this, this.time);
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }
}

window.__game = new Game();
