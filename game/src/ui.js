// Ghostlight Heist — HUD and screens (DOM overlays over the canvas).

export class UI {
  constructor(game) {
    this.game = game;
    this.el = {};
    for (const id of ['hud', 'hud-level', 'hud-sub', 'hud-artifacts', 'hud-eye-fill', 'hud-eye-label',
      'hud-timer', 'hud-score', 'hud-lives', 'hud-hints', 'hud-mode',
      'screen-title', 'screen-level', 'screen-game', 'screen-over',
      'toast', 'banner']) {
      this.el[id] = document.getElementById(id);
    }
    this.bindButtons();
  }

  bindButtons() {
    const g = this.game;
    const click = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', () => { g.audio.ensure(); g.audio.click(); fn(); });
    };
    click('btn-start', () => g.startGame());
    click('btn-how', () => g.showScreen('how'));
    click('btn-how-back', () => g.showScreen('title'));
    click('btn-next', () => g.nextLevel());
    click('btn-replay-level', () => g.restartLevel());
    click('btn-again', () => g.startGame());
    click('btn-retry', () => g.startGame());
    click('btn-resume', () => g.togglePause());
    click('btn-quit', () => g.showScreen('title'));
    click('btn-hint', () => g.useHint());
    click('btn-mute', () => g.toggleMute());
  }

  updateHUD() {
    const g = this.game;
    const w = g.world;
    this.el['hud-level'].textContent = g.levelDef.name;
    this.el['hud-sub'].textContent = g.levelDef.subtitle;
    const got = w.artifacts.filter((a) => a.taken).length;
    this.el['hud-artifacts'].textContent = `◆ ${got} / ${w.artifacts.length}`;
    // Detection eye: the highest live meter among guards and cameras.
    let meter = 0;
    let alerted = false;
    for (const gd of g.guards) {
      meter = Math.max(meter, gd.meter);
      if (gd.state === 'alerted') alerted = true;
    }
    for (const c of g.cameras) meter = Math.max(meter, c.meter);
    this.el['hud-eye-fill'].style.width = `${Math.round(meter * 100)}%`;
    this.el['hud-eye-fill'].style.background = alerted ? '#ff4030'
      : meter > 0.35 ? '#ffaa28' : '#ffd75a';
    this.el['hud-eye-label'].textContent = alerted ? 'SPOTTED!'
      : meter > 0.35 ? 'SUSPICIOUS' : meter > 0.03 ? 'SEEN?' : 'UNSEEN';
    this.el['hud-eye-label'].style.color = alerted ? '#ff6a55'
      : meter > 0.35 ? '#ffaa28' : '#e8e0c8';
    const t = Math.max(0, Math.floor(g.levelTime));
    this.el['hud-timer'].textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    this.el['hud-score'].textContent = `Score ${g.score}`;
    this.el['hud-lives'].textContent = '♥'.repeat(g.lives) + '♡'.repeat(Math.max(0, 3 - g.lives));
    this.el['hud-hints'].textContent = `Hints ${g.hintsLeft}`;
    this.el['hud-mode'].textContent = g.player.mode === 'sneak' ? 'SNEAKING'
      : g.player.mode === 'run' ? 'RUNNING — LOUD' : 'WALKING';
    this.el['hud-mode'].style.color = g.player.mode === 'run' ? '#ff9a7a'
      : g.player.mode === 'sneak' ? '#c9b8ff' : '#b8c8a0';
  }

  showScreen(name) {
    for (const key of ['screen-title', 'screen-level', 'screen-game', 'screen-over']) {
      this.el[key].classList.add('hidden');
    }
    const how = document.getElementById('screen-how');
    if (how) how.classList.add('hidden');
    if (name === 'title') this.el['screen-title'].classList.remove('hidden');
    else if (name === 'level') this.el['screen-level'].classList.remove('hidden');
    else if (name === 'game') this.el['screen-game'].classList.remove('hidden');
    else if (name === 'over') this.el['screen-over'].classList.remove('hidden');
    else if (name === 'how' && how) how.classList.remove('hidden');
    else if (name === 'pause') this.el['screen-title'].classList.add('hidden');
    this.el.hud.classList.toggle('hidden', name === 'title' || name === 'how');
  }

  setLevelComplete(stars, timeBonus, ghostBonus, levelScore) {
    document.getElementById('level-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('level-time-bonus').textContent = `Time bonus: +${timeBonus}`;
    document.getElementById('level-ghost-bonus').textContent = ghostBonus > 0
      ? `Ghost bonus (never detected): +${ghostBonus}` : 'Ghost bonus: — (you were spotted)';
    document.getElementById('level-score').textContent = `Level score: ${levelScore}`;
    document.getElementById('level-title').textContent = `${this.game.levelDef.name} cleared!`;
  }

  setGameComplete(totalScore) {
    document.getElementById('game-total-score').textContent = `Total score: ${totalScore}`;
  }

  toast(msg, ms = 2200) {
    this.el.toast.textContent = msg;
    this.el.toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.el.toast.classList.add('hidden'), ms);
  }

  banner(msg, ms = 1600) {
    this.el.banner.textContent = msg;
    this.el.banner.classList.remove('hidden');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => this.el.banner.classList.add('hidden'), ms);
  }
}
