// Звук: эффекты и музыка синтезируются в Web Audio, внешних файлов нет.
const N = (semi) => 440 * Math.pow(2, (semi - 9) / 12);   // semi: 0 = C4

// Музыкальные темы: шаг = 1/8 такта, ноты — полутона от C4 (null — пауза)
const THEMES = {
  village: { bpm: 96, wave: 'triangle', root: 0, bass: [0, null, 7, null, 5, null, 7, null], lead: [12, 16, 19, 16, 14, 17, 21, 17, 12, 16, 19, 24, 23, 19, 16, 14], pad: [0, 4, 7], vol: 0.5 },
  forest: { bpm: 72, wave: 'sine', root: 2, bass: [0, null, null, null, -2, null, null, null], lead: [14, null, 17, null, 21, null, 19, null, 17, null, 14, null, 12, null, null, null], pad: [0, 3, 7], vol: 0.55 },
  crypt: { bpm: 60, wave: 'sine', root: -5, bass: [0, null, null, null, null, null, 1, null], lead: [12, null, null, null, 15, null, null, null, null, null, 13, null, null, null, null, null], pad: [0, 3, 6], vol: 0.5 },
  citadel: { bpm: 84, wave: 'sawtooth', root: -7, bass: [0, 0, null, 0, 1, 1, null, 1], lead: [12, null, 15, null, 18, null, 15, null, 13, null, 16, null, 19, null, 16, null], pad: [0, 3, 6], vol: 0.42 },
  boss: { bpm: 132, wave: 'sawtooth', root: -5, bass: [0, 0, 0, null, 0, 0, 3, null, 0, 0, 0, null, 5, 5, 3, null], lead: [12, null, 12, 15, null, 12, null, 18, 17, null, 15, null, 12, null, 10, null], pad: [0, 3, 7], vol: 0.45 },
};

export class Sound {
  constructor() {
    this.ctx = null; this.master = null; this.sfxG = null; this.musG = null;
    this.musicVol = 0.5; this.sfxVol = 0.8;
    this.theme = null; this.want = null; this.step = 0; this.nextT = 0; this.timer = null;
    this.noiseBuf = null; this.unlocked = false; this.last = {};
    this.boss = false;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 1; this.master.connect(this.ctx.destination);
      this.sfxG = this.ctx.createGain(); this.sfxG.gain.value = this.sfxVol; this.sfxG.connect(this.master);
      this.musG = this.ctx.createGain(); this.musG.gain.value = this.musicVol * 0.5; this.musG.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.unlocked = true;
      if (this.want) this.setTheme(this.want, true);
    } catch (e) { this.ctx = null; }
  }

  setVolumes(music, sfx) {
    this.musicVol = music; this.sfxVol = sfx;
    if (this.sfxG) this.sfxG.gain.value = sfx;
    if (this.musG) this.musG.gain.value = music * 0.5;
  }

  // ---------------- примитивы
  tone(freq, dur, type = 'square', vol = 0.2, o = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t0 = (o.at != null ? o.at : c.currentTime);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.dest || this.sfxG);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol = 0.2, o = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t0 = (o.at != null ? o.at : c.currentTime);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.f || 1200, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfxG);
    src.start(t0, Math.random() * 0.4); src.stop(t0 + dur + 0.05);
  }

  // ---------------- эффекты
  sfx(n) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    // не засорять: один и тот же звук не чаще раза в 40 мс
    if (this.last[n] && now - this.last[n] < 0.04) return;
    this.last[n] = now;
    const T = (f, d, ty, v, o) => this.tone(f, d, ty, v, o);
    const Z = (d, v, o) => this.noise(d, v, o);
    switch (n) {
      case 'swing': Z(0.12, 0.18, { type: 'bandpass', f: 600, to: 2200, q: 1.2 }); break;
      case 'miss': break;
      case 'hit': Z(0.08, 0.28, { f: 1800 }); T(160, 0.09, 'square', 0.18, { to: 70 }); break;
      case 'crit': Z(0.1, 0.32, { f: 3000 }); T(320, 0.14, 'square', 0.2, { to: 110 }); T(900, 0.08, 'triangle', 0.15, { to: 1500 }); break;
      case 'hurt': T(220, 0.16, 'sawtooth', 0.22, { to: 80 }); Z(0.1, 0.25, { f: 900 }); break;
      case 'die': T(260, 0.3, 'square', 0.18, { to: 50 }); Z(0.25, 0.2, { f: 700, to: 200 }); break;
      case 'bossdie': T(180, 0.9, 'sawtooth', 0.25, { to: 35 }); Z(1.0, 0.3, { f: 900, to: 100 }); T(90, 1.2, 'sine', 0.3, { to: 30 }); break;
      case 'whirl': Z(0.35, 0.22, { type: 'bandpass', f: 500, to: 1800, q: 1.5 }); break;
      case 'bolt': T(500, 0.14, 'triangle', 0.16, { to: 1000 }); break;
      case 'fire': Z(0.3, 0.2, { f: 700, to: 300 }); T(200, 0.3, 'sawtooth', 0.12, { to: 400 }); break;
      case 'boom': Z(0.35, 0.3, { f: 1400, to: 150 }); T(110, 0.3, 'sine', 0.3, { to: 40 }); break;
      case 'ice': T(1200, 0.4, 'triangle', 0.14, { to: 400 }); T(1800, 0.3, 'sine', 0.1, { to: 700, at: now + 0.04 }); Z(0.25, 0.14, { type: 'highpass', f: 3000 }); break;
      case 'knife': Z(0.1, 0.16, { type: 'highpass', f: 2500 }); T(900, 0.1, 'triangle', 0.1, { to: 1800 }); break;
      case 'slam': T(90, 0.35, 'sine', 0.4, { to: 35 }); Z(0.3, 0.3, { f: 600, to: 120 }); break;
      case 'blink': T(300, 0.14, 'sine', 0.16, { to: 1400 }); break;
      case 'roll': Z(0.16, 0.14, { type: 'bandpass', f: 800, q: 0.8 }); break;
      case 'roar': T(120, 0.5, 'sawtooth', 0.2, { to: 70 }); Z(0.5, 0.15, { f: 400, to: 150 }); break;
      case 'shadow': T(700, 0.3, 'sine', 0.12, { to: 150 }); break;
      case 'deny': T(160, 0.12, 'square', 0.12); T(120, 0.14, 'square', 0.12, { at: now + 0.08 }); break;
      case 'potion': T(500, 0.08, 'sine', 0.16, { to: 700 }); T(760, 0.1, 'sine', 0.14, { to: 1000, at: now + 0.08 }); break;
      case 'equip': Z(0.08, 0.2, { f: 2500 }); T(500, 0.08, 'square', 0.1, { to: 700 }); break;
      case 'coin': T(1300, 0.07, 'square', 0.1); T(1750, 0.12, 'square', 0.1, { at: now + 0.06 }); break;
      case 'item': T(660, 0.08, 'triangle', 0.14); T(880, 0.12, 'triangle', 0.14, { at: now + 0.07 }); break;
      case 'chest': Z(0.15, 0.2, { f: 700 }); [523, 659, 784, 1047].forEach((f, i) => T(f, 0.2, 'triangle', 0.14, { at: now + 0.1 + i * 0.07 })); break;
      case 'shrine': [392, 523, 659, 784].forEach((f, i) => T(f, 0.6, 'sine', 0.12, { at: now + i * 0.1 })); break;
      case 'lever': Z(0.1, 0.25, { f: 500 }); T(120, 0.2, 'square', 0.12, { to: 80 }); break;
      case 'door': Z(0.9, 0.22, { f: 400, to: 90 }); T(70, 0.9, 'sine', 0.3, { to: 40 }); break;
      case 'beacon': [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => T(f, 1.0, 'triangle', 0.14, { at: now + i * 0.12 })); Z(0.8, 0.2, { f: 600, to: 2000 }); break;
      case 'quest': T(523, 0.12, 'triangle', 0.15); T(784, 0.2, 'triangle', 0.15, { at: now + 0.1 }); break;
      case 'fanfare': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => T(f, 0.25, 'square', 0.1, { at: now + i * 0.11 })); break;
      case 'talk': T(400 + Math.random() * 120, 0.05, 'square', 0.08); break;
      case 'forge': for (let i = 0; i < 4; i++) { Z(0.12, 0.3, { f: 3000, at: now + i * 0.22 }); T(900 + i * 80, 0.18, 'square', 0.1, { at: now + i * 0.22 }); } break;
      case 'portal': T(200, 0.5, 'sine', 0.18, { to: 800 }); Z(0.4, 0.1, { type: 'bandpass', f: 1000, to: 3000 }); break;
      case 'alert': T(700, 0.08, 'square', 0.1); T(950, 0.1, 'square', 0.1, { at: now + 0.07 }); break;
      case 'estrike': Z(0.1, 0.15, { type: 'bandpass', f: 700, to: 1800 }); break;
      case 'growl': T(110, 0.3, 'sawtooth', 0.14, { to: 70 }); break;
      case 'shoot': T(600, 0.08, 'square', 0.07, { to: 350 }); break;
      case 'bossintro': T(70, 1.2, 'sawtooth', 0.22, { to: 45 }); T(105, 1.2, 'sawtooth', 0.14, { to: 70 }); Z(1.1, 0.12, { f: 300, to: 100 }); break;
      case 'summon': T(200, 0.6, 'sawtooth', 0.12, { to: 600 }); Z(0.5, 0.12, { f: 500, to: 1800 }); break;
      case 'warn': T(300, 0.12, 'square', 0.08); break;
      default: break;
    }
  }

  // ---------------- музыка
  setTheme(name, force = false) {
    this.want = name;
    if (!this.ctx) return;
    const t = this.boss && name !== 'boss' ? 'boss' : name;
    if (this.theme === t && !force) return;
    this.theme = t; this.step = 0; this.nextT = this.ctx.currentTime + 0.05;
    if (!this.timer) this.timer = setInterval(() => this.schedule(), 90);
  }
  setBoss(on) { this.boss = on; if (this.want) this.setTheme(this.want, true); }
  stopMusic() { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.theme = null; }

  schedule() {
    if (!this.ctx || !this.theme || this.ctx.state !== 'running') return;
    const th = THEMES[this.theme];
    const stepDur = 60 / th.bpm / 2;
    while (this.nextT < this.ctx.currentTime + 0.4) {
      const t = this.nextT;
      const s = this.step;
      const bass = th.bass[s % th.bass.length];
      if (bass != null) this.tone(N(th.root + bass - 12), stepDur * 1.8, th.wave === 'sawtooth' ? 'sawtooth' : 'triangle', 0.14 * th.vol, { at: t, dest: this.musG, attack: 0.02 });
      const lead = th.lead[s % th.lead.length];
      if (lead != null) this.tone(N(th.root + lead), stepDur * 1.6, th.wave === 'sawtooth' ? 'square' : th.wave, 0.09 * th.vol, { at: t, dest: this.musG, attack: 0.02 });
      if (s % 16 === 0) for (const p of th.pad) this.tone(N(th.root + p), stepDur * 15, 'sine', 0.05 * th.vol, { at: t, dest: this.musG, attack: 0.6 });
      if (this.theme === 'boss' && s % 2 === 0) this.noise(0.04, 0.05 * th.vol, { at: t, f: 5000, type: 'highpass', dest: this.musG });
      this.step++;
      this.nextT += stepDur;
    }
  }
}
