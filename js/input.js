// Клавиатура, мышь и сенсорное управление (плавающий джойстик + кнопки).
export class Input {
  constructor(stage) {
    this.keys = new Set();
    this.edge = { skill0: false, skill1: false, skill2: false, lik: false, dodge: false, potHp: false, potMp: false, interact: false };
    this.enabled = false;
    this.attackHeld = false;
    this.mouse = { x: 0, y: 0, down: false, at: 0, valid: false };
    this.stick = { x: 0, y: 0, active: false, id: null, cx: 0, cy: 0 };
    this.touchMode = false;
    this.hooks = {};         // inventory(), journal(), pause()
    this.stage = stage;
    this.cv = stage.querySelector('#game');
    this.joyEl = document.getElementById('joy');
    this.knobEl = document.getElementById('joy-knob');
    this.bindKeys();
    this.bindMouse();
    this.bindTouch();
  }

  bindKeys() {
    const block = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab']);
    window.addEventListener('keydown', (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (this.enabled && block.has(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const h = this.hooks;
      if (e.code === 'Escape' || e.code === 'KeyP') { h.pause && h.pause(); return; }
      if (e.code === 'KeyI' || e.code === 'KeyC') { h.inventory && h.inventory(); return; }
      if (e.code === 'KeyT') { h.skills && h.skills(); return; }
      if (e.code === 'Tab' || e.code === 'KeyQ') { h.journal && h.journal(); return; }
      if (e.code === 'Enter' || e.code === 'Space') { if (h.advance && h.advance()) { e.preventDefault(); return; } }
      if (!this.enabled) return;
      if (e.code === 'KeyK') this.edge.skill0 = true;
      if (e.code === 'KeyL') this.edge.skill1 = true;
      if (e.code === 'KeyU') this.edge.skill2 = true;
      if (e.code === 'KeyR') this.edge.lik = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.edge.dodge = true;
      if (e.code === 'Digit1') this.edge.potHp = true;
      if (e.code === 'Digit2') this.edge.potMp = true;
      if (e.code === 'KeyE' || e.code === 'KeyF') this.edge.interact = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.attackHeld = false; this.mouse.down = false; });
  }

  bindMouse() {
    const cv = this.cv;
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 480, y: ((e.clientY - r.top) / r.height) * 270 };
    };
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const p = pos(e); this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.at = performance.now(); this.mouse.valid = true;
    });
    cv.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      const p = pos(e); this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.at = performance.now(); this.mouse.valid = true;
      if (!this.enabled) return;
      if (e.button === 0) this.mouse.down = true;
      if (e.button === 2) this.edge.skill0 = true;
    });
    window.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse' && e.button === 0) this.mouse.down = false; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  bindTouch() {
    const zone = document.getElementById('touch-zone');
    const radius = () => Math.max(46, Math.min(74, Math.min(window.innerWidth, window.innerHeight) * 0.15));
    let R = radius();
    const setKnob = (dx, dy) => { this.knobEl.style.transform = `translate(${dx}px, ${dy}px)`; };
    zone.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      this.setTouch(true);
      if (this.stick.active) return;
      R = radius();
      this.joyEl.style.setProperty('--r', `${R}px`);
      Object.assign(this.stick, { active: true, id: e.pointerId, cx: e.clientX, cy: e.clientY, x: 0, y: 0 });
      this.joyEl.style.left = `${e.clientX}px`; this.joyEl.style.top = `${e.clientY}px`;
      this.joyEl.classList.add('on');
      setKnob(0, 0);
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener('pointermove', (e) => {
      if (!this.stick.active || e.pointerId !== this.stick.id) return;
      let dx = e.clientX - this.stick.cx, dy = e.clientY - this.stick.cy;
      let m = Math.hypot(dx, dy);
      if (m > R) {
        const k = (m - R) / m;
        this.stick.cx += dx * k; this.stick.cy += dy * k;
        this.joyEl.style.left = `${this.stick.cx}px`; this.joyEl.style.top = `${this.stick.cy}px`;
        dx = e.clientX - this.stick.cx; dy = e.clientY - this.stick.cy; m = R;
      }
      setKnob(dx, dy);
      const dead = R * 0.12, full = R * 0.5;
      const mag = m <= dead ? 0 : Math.min(1, ((m - dead) / (full - dead)) ** 0.8);
      this.stick.x = m > 0 ? (dx / m) * mag : 0;
      this.stick.y = m > 0 ? (dy / m) * mag : 0;
    });
    const end = (e) => {
      if (e.pointerId !== this.stick.id) return;
      Object.assign(this.stick, { active: false, x: 0, y: 0, id: null });
      this.joyEl.classList.remove('on');
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);

    // экранные кнопки
    const bind = (id, down, up) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.setTouch(e.pointerType !== 'mouse'); if (this.enabled) down(); el.classList.add('press'); el.setPointerCapture && el.setPointerCapture(e.pointerId); });
      const upf = (e) => { el.classList.remove('press'); if (up) up(); };
      el.addEventListener('pointerup', upf); el.addEventListener('pointercancel', upf);
    };
    bind('t-attack', () => { this.attackHeld = true; }, () => { this.attackHeld = false; });
    bind('t-skill0', () => { this.edge.skill0 = true; });
    bind('t-skill1', () => { this.edge.skill1 = true; });
    bind('t-skill2', () => { this.edge.skill2 = true; });
    bind('t-lik', () => { this.edge.lik = true; });
    bind('t-dodge', () => { this.edge.dodge = true; });
    bind('t-interact', () => { this.edge.interact = true; });
    bind('t-hp', () => { this.edge.potHp = true; });
    bind('t-mp', () => { this.edge.potMp = true; });
  }

  setTouch(on) {
    if (on === this.touchMode) return;
    this.touchMode = on;
    document.body.classList.toggle('touch', on);
  }

  // Состояние для World.update. camX/camY нужны, чтобы перевести мышь в координаты мира
  poll(cam) {
    const k = this.keys;
    let mx = 0, my = 0;
    if (this.enabled) {
      if (k.has('KeyA') || k.has('ArrowLeft')) mx -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) mx += 1;
      if (k.has('KeyW') || k.has('ArrowUp')) my -= 1;
      if (k.has('KeyS') || k.has('ArrowDown')) my += 1;
      if (this.stick.active) { mx += this.stick.x; my += this.stick.y; }
    }
    const mouseRecent = this.mouse.valid && performance.now() - this.mouse.at < 2500 && !this.touchMode;
    const inp = {
      mx, my,
      aimX: mouseRecent ? cam.x + this.mouse.x : null,
      aimY: mouseRecent ? cam.y + this.mouse.y : null,
      attack: this.enabled && (this.attackHeld || k.has('Space') || k.has('KeyJ') || this.mouse.down),
      skill: [this.edge.skill0, this.edge.skill1, this.edge.skill2], lik: this.edge.lik,
      dodge: this.edge.dodge, potHp: this.edge.potHp, potMp: this.edge.potMp, interact: this.edge.interact,
    };
    for (const key of Object.keys(this.edge)) this.edge[key] = false;
    return inp;
  }

  reset() {
    this.keys.clear(); this.attackHeld = false; this.mouse.down = false;
    for (const key of Object.keys(this.edge)) this.edge[key] = false;
    this.stick.active = false; this.stick.x = 0; this.stick.y = 0;
    this.joyEl.classList.remove('on');
  }
}
