// Ghostlight Heist — synthesized sound. No audio files: every sound is a
// WebAudio oscillator/noise burst built at runtime.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noiseBurst(dur, vol, filterFreq) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  footstep(mode) {
    if (mode === 'sneak') this.noiseBurst(0.05, 0.05, 500);
    else if (mode === 'run') this.noiseBurst(0.09, 0.16, 900);
    else this.noiseBurst(0.07, 0.09, 700);
  }

  pickup() {
    this.tone(660, 0.12, 'sine', 0.22);
    setTimeout(() => this.tone(990, 0.18, 'sine', 0.22), 90);
  }

  alert() {
    this.tone(220, 0.35, 'sawtooth', 0.2, 440);
    this.tone(110, 0.35, 'square', 0.1, 220);
  }

  cameraAlarm() {
    this.tone(880, 0.15, 'square', 0.14);
    setTimeout(() => this.tone(880, 0.15, 'square', 0.14), 180);
  }

  caught() {
    this.tone(160, 0.5, 'sawtooth', 0.25, 60);
    this.noiseBurst(0.3, 0.2, 400);
  }

  unlock() {
    this.tone(523, 0.12, 'triangle', 0.2);
    setTimeout(() => this.tone(784, 0.2, 'triangle', 0.2), 110);
  }

  levelComplete() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.2), i * 120));
  }

  click() {
    this.tone(440, 0.06, 'sine', 0.12);
  }
}
