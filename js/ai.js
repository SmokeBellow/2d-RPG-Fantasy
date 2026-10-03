// ИИ врагов и боссов. Работает над world (см. world.js), без DOM.
import { dist, angleTo, angDiff } from './util.js';

const TAU = Math.PI * 2;

export function makeBossState() {
  return { mode: 'idle', cd: 1.2, st: 0, dur: 0, steps: [], dash: null, phase: 1, flags: {}, contactT: 0, last: '', n: 0 };
}

// ---------------------------------------------------------------- движение
function steer(w, e, ang, grid, look = 9) {
  for (const off of [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6]) {
    const a = ang + off;
    if (w.boxFree(e.x + Math.cos(a) * look, e.y + Math.sin(a) * look, e.r, grid)) return a;
  }
  return ang;
}
function gridOf(w, e) { return e.def.ai === 'flier' || e.def.float ? w.wall : w.solid; }
function walk(w, e, ang, spd, dt) {
  const grid = gridOf(w, e);
  const a = steer(w, e, ang, grid);
  const f = e.slow > 0 ? 0.5 : 1;
  w.move(e, Math.cos(a) * spd * f * dt, Math.sin(a) * spd * f * dt, grid);
}
const toP = (w, e) => angleTo(e.x, e.y, w.p.x, w.p.y);
const rnd = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- обычные враги
export function updateEnemy(w, e, dt) {
  const p = w.p, def = e.def;
  const d = dist(e.x, e.y, p.x, p.y);
  e.cd = Math.max(0, e.cd - dt);
  const visible = w.playerVisible() && !p.dead;
  if (def.boss) { bossUpdate(w, e, dt, d, visible); return; }

  // «поводок»: слишком далеко от дома — враг сдаётся, возвращается и лечится
  const home = dist(e.x, e.y, e.hx, e.hy);
  if (e.returning) {
    if (home < 30) e.returning = false;
    else {
      e.aggro = false; e.state = 'idle';
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.15 * dt);
      if (e.stun <= 0) walk(w, e, angleTo(e.x, e.y, e.hx, e.hy), e.spd * 1.1, dt);
      e.face = angleTo(e.x, e.y, e.hx, e.hy);
      return;
    }
  }
  if (!e.aggro) {
    if (visible && d < def.aggro && w.los(e.x, e.y, p.x, p.y)) {
      e.aggro = true; e.state = 'chase';
      w.emit({ t: 'alert', x: e.x, y: e.y - e.r - 10 });
      w.emit({ t: 'sfx', n: 'alert' });
      w.alert(e);
    }
  } else if (!visible || d > def.aggro * 2.6) {
    e.aggro = false; e.state = 'idle';
  } else if (home > 300) {
    e.aggro = false; e.state = 'idle'; e.returning = true;
  }
  if (e.stun > 0) return;
  if (!e.aggro) { idle(w, e, dt); return; }
  switch (def.ai) {
    case 'melee': meleeAI(w, e, dt, d); break;
    case 'charger': chargerAI(w, e, dt, d); break;
    case 'ranged': rangedAI(w, e, dt, d); break;
    case 'flier': flierAI(w, e, dt, d); break;
    default: break;
  }
}

function idle(w, e, dt) {
  e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.04 * dt);
  e.state = 'idle';
  e.wanderT -= dt;
  if (e.wanderT <= 0) {
    e.wanderT = 1 + Math.random() * 2.5;
    e.moving = Math.random() < 0.55;
    e.wanderA = Math.random() * TAU;
    if (dist(e.x, e.y, e.hx, e.hy) > 34) { e.wanderA = angleTo(e.x, e.y, e.hx, e.hy); e.moving = true; }
  }
  if (e.moving) {
    let sp = e.spd * 0.35;
    if (e.def.hop) sp = (e.anim * 1.2) % 1 < 0.4 ? e.spd * 0.9 : 0;
    walk(w, e, e.wanderA, sp, dt);
    e.face = e.wanderA;
  }
}

function strikeHit(w, e, reach, ang, mult = 1, kb = 55) {
  const p = w.p;
  w.emit({ t: 'estrike', x: e.x, y: e.y, ang, range: reach });
  if (dist(e.x, e.y, p.x, p.y) <= reach + p.r + 5 && angDiff(angleTo(e.x, e.y, p.x, p.y), ang) < 1.4) w.hurtPlayer(e.atk * mult, e.x, e.y, { kb });
}

function meleeAI(w, e, dt, d) {
  const def = e.def, p = w.p;
  switch (e.state) {
    case 'wind':
      e.t += dt; e.face = e.lockA;
      if (e.t >= def.wind) { strikeHit(w, e, def.reach, e.lockA); e.state = 'recover'; e.t = 0; w.emit({ t: 'sfx', n: 'estrike' }); }
      break;
    case 'recover':
      e.t += dt;
      if (e.t >= 0.5) { e.state = 'chase'; e.cd = 0.7 + Math.random() * 0.7; }
      break;
    default: {
      e.state = 'chase';
      const a = toP(w, e);
      e.face = a;
      if (def.hop) {
        const hop = (e.anim * 1.4) % 1 < 0.45;
        if (hop && d > def.reach * 0.8) walk(w, e, a, e.spd * 2.2, dt);
      } else if (d > def.reach * 0.8) walk(w, e, a, e.spd, dt);
      if (d <= def.reach + p.r && e.cd <= 0 && w.los(e.x, e.y, p.x, p.y)) { e.state = 'wind'; e.t = 0; e.lockA = a; w.emit({ t: 'alert', x: e.x, y: e.y - e.r - 10, warn: true }); }
    }
  }
}

function chargerAI(w, e, dt, d) {
  const def = e.def, p = w.p;
  switch (e.state) {
    case 'wind':
      e.t += dt; e.face = e.lockA;
      if (e.t >= def.wind) { e.state = 'lunge'; e.t = 0; e.hit = false; w.emit({ t: 'sfx', n: 'growl' }); }
      break;
    case 'lunge':
      e.t += dt;
      w.move(e, Math.cos(e.lockA) * def.lunge * 1.4 * dt, Math.sin(e.lockA) * def.lunge * 1.4 * dt);
      if (!e.hit && d < e.r + p.r + 3) { e.hit = true; w.hurtPlayer(e.atk, e.x, e.y, { kb: 70 }); }
      if (e.t >= 0.34) { e.state = 'recover'; e.t = 0; }
      break;
    case 'recover':
      e.t += dt;
      if (e.t >= 0.6) { e.state = 'chase'; e.cd = 0.9 + Math.random() * 0.8; }
      break;
    default: {
      e.state = 'chase';
      const a = toP(w, e);
      e.face = a;
      // немного кружит вокруг игрока
      const circ = d < 60 ? Math.sin(e.anim * 1.7) * 0.9 : 0;
      walk(w, e, a + circ, e.spd, dt);
      if (d < 64 && e.cd <= 0 && w.los(e.x, e.y, p.x, p.y)) { e.state = 'wind'; e.t = 0; e.lockA = a; w.emit({ t: 'alert', x: e.x, y: e.y - e.r - 10, warn: true }); }
    }
  }
}

const SHOT = {
  arrow: { speed: 135, r: 2.5, mult: 1, slow: 0 },
  web: { speed: 105, r: 3, mult: 0.6, slow: 1.8 },
  orb: { speed: 92, r: 3.5, mult: 1, slow: 0 },
  blight: { speed: 100, r: 3.5, mult: 1, slow: 0, fan: 2 },
};

function rangedAI(w, e, dt, d) {
  const def = e.def, p = w.p;
  switch (e.state) {
    case 'wind':
      e.t += dt;
      if (e.t < def.wind * 0.6) { e.lockA = toP(w, e); }
      e.face = e.lockA;
      if (e.t >= def.wind) {
        const sh = SHOT[def.shot];
        const n = sh.fan || 1;
        for (let i = 0; i < n; i++) {
          const off = n > 1 ? (i - (n - 1) / 2) * 0.3 : 0;
          w.shoot({ x: e.x, y: e.y - 3, ang: e.lockA + off, speed: sh.speed, r: sh.r, dmg: e.atk * sh.mult, kind: def.shot, life: 2.2, slow: sh.slow });
        }
        w.emit({ t: 'sfx', n: 'shoot' });
        e.state = 'recover'; e.t = 0;
      }
      break;
    case 'recover':
      e.t += dt;
      if (e.t >= 0.4) { e.state = 'chase'; e.cd = 1.3 + Math.random() * 0.9; }
      break;
    default: {
      e.state = 'chase';
      const a = toP(w, e);
      e.face = a;
      const keep = def.keep;
      const los = w.los(e.x, e.y, w.p.x, w.p.y);
      if (d < keep * 0.7) walk(w, e, a + Math.PI, e.spd * 0.95, dt);
      else if (d > keep * 1.15 || !los) walk(w, e, a, e.spd, dt);
      else {
        e.strafe = e.strafe || (Math.random() < 0.5 ? 1 : -1);
        if (Math.random() < dt * 0.4) e.strafe = -e.strafe;
        walk(w, e, a + (Math.PI / 2) * e.strafe, e.spd * 0.5, dt);
      }
      if (e.cd <= 0 && d < def.aggro * 0.95 && los) { e.state = 'wind'; e.t = 0; e.lockA = a; w.emit({ t: 'alert', x: e.x, y: e.y - e.r - 10, warn: true }); }
    }
  }
}

function flierAI(w, e, dt, d) {
  const def = e.def, p = w.p;
  const a = toP(w, e);
  switch (e.state) {
    case 'dive':
      e.t += dt;
      w.move(e, Math.cos(e.lockA) * 135 * dt, Math.sin(e.lockA) * 135 * dt, w.wall);
      if (!e.hit && d < e.r + p.r + 2) { e.hit = true; w.hurtPlayer(e.atk, e.x, e.y, { kb: 40 }); }
      if (e.t >= 0.5) { e.state = 'retreat'; e.t = 0; }
      break;
    case 'retreat':
      e.t += dt;
      walk(w, e, a + Math.PI + Math.sin(e.anim * 5) * 0.8, e.spd, dt);
      if (e.t >= 0.7) { e.state = 'orbit'; e.t = 0; e.cd = 1.2 + Math.random() * 1.2; }
      break;
    default: {
      e.state = 'orbit';
      e.t += dt;
      e.face = a;
      const want = 48;
      const rad = d > want + 8 ? 0.2 : d < want - 8 ? -0.2 : 0;
      walk(w, e, a + Math.PI / 2 * (Math.sin(e.anim * 0.9) > 0 ? 1 : -1) - rad * 2 + Math.sin(e.anim * 6) * 0.5, e.spd, dt);
      if (e.cd <= 0 && d < 90 && w.los(e.x, e.y, p.x, p.y)) { e.state = 'dive'; e.t = 0; e.lockA = a; e.hit = false; w.emit({ t: 'alert', x: e.x, y: e.y - 10, warn: true }); }
    }
  }
}

// ---------------------------------------------------------------- боссы
function bossUpdate(w, e, dt, d, visible) {
  const b = e.boss, p = w.p, def = e.def;
  b.contactT = Math.max(0, b.contactT - dt);
  e.flash = Math.max(0, e.flash);
  if (!e.aggro) {
    e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.1 * dt);
    if (visible && d < def.aggro && w.los(e.x, e.y, p.x, p.y)) {
      e.aggro = true; b.mode = 'move'; b.cd = 1.3;
      w.emit({ t: 'bossIntro', name: def.title || def.name });
      w.emit({ t: 'sfx', n: 'bossintro' });
    } else return;
  }
  if (p.dead || d > def.aggro * 2.8) { e.aggro = false; b.mode = 'idle'; b.dash = null; return; }

  // фазы
  const r = e.hp / e.maxHp;
  const ph = def.ai === 'boss_king' ? (r < 0.3 ? 3 : r < 0.6 ? 2 : 1) : def.ai === 'boss_lord' ? (r < 0.22 ? 4 : r < 0.47 ? 3 : r < 0.74 ? 2 : 1) : (r < 0.5 ? 2 : 1);
  if (ph > b.phase) {
    b.phase = ph;
    w.emit({ t: 'shake', v: 5 }); w.emit({ t: 'sfx', n: 'roar' });
    if (def.ai === 'boss_lord') {
      const say = { 2: ['Он встаёт. Свет из раны становится ярче.', 'Ты пришёл не за этим.'], 3: ['Излучение растёт. Эхо отзывается на зов.', 'Слышишь? Это они.'], 4: ['Маяки гаснут. Сквозь рану идёт всё сразу.', 'Теперь без подсказок.'] }[ph];
      w.emit({ t: 'toast', text: say[0], kind: 'warn' });
      w.emit({ t: 'text', x: e.x, y: e.y - 40, text: say[1], col: '#e8d8a8' });
      w.emit({ t: 'nova', x: e.x, y: e.y, r: 70, col: ph === 4 ? '#ffe0a0' : '#c8a0ff' });
      b.flags.enrage = ph >= 3;
    } else w.emit({ t: 'toast', text: `${def.title || def.name} в ярости!`, kind: 'warn' });
    b.mode = 'move'; b.cd = 0.6; b.steps = []; b.dash = null;
  }
  e.pose = b.mode === 'attack' ? 'wind' : 'move';

  // рывок
  if (b.dash) {
    const dd = b.dash;
    dd.t -= dt;
    e.pose = 'dash';
    w.move(e, Math.cos(dd.ang) * dd.spd * dt, Math.sin(dd.ang) * dd.spd * dt);
    if (dd.dmg && !dd.hit && d < e.r + p.r + 3) { dd.hit = true; w.hurtPlayer(dd.dmg, e.x, e.y, { kb: dd.kb || 100 }); }
    if (dd.t <= 0) b.dash = null;
  }

  if (b.mode === 'attack') {
    b.st += dt;
    for (const s of b.steps) if (!s.done && b.st >= s.at) { s.done = true; s.fn(); }
    if (b.st >= b.dur) { b.mode = 'move'; b.cd = (b.phase >= 4 ? 0.5 : b.phase === 3 ? 0.7 : b.phase === 2 ? 1.0 : 1.4) + Math.random() * 0.6; }
    return;
  }
  // движение между атаками
  b.cd -= dt;
  if (!b.dash) approach(w, e, dt, d);
  if (d < e.r + p.r && b.contactT <= 0 && !b.dash) { b.contactT = 1; w.hurtPlayer(e.atk * 0.45, e.x, e.y, { kb: 70 }); }
  if (b.cd <= 0 && !b.dash) startBossAttack(w, e, d);
}

function approach(w, e, dt, d) {
  const b = e.boss, a = toP(w, e);
  e.face = a;
  const type = e.def.ai;
  const sp = e.spd * (b.flags.enrage ? 1.25 : 1);
  if (type === 'boss_captain') {
    // кружит вокруг игрока на средней дистанции
    const side = Math.sin(e.anim * 0.8) > 0 ? 1 : -1;
    if (d > 70) walk(w, e, a, sp, dt); else if (d < 38) walk(w, e, a + Math.PI, sp * 0.8, dt); else walk(w, e, a + (Math.PI / 2) * side, sp * 0.9, dt);
  } else if (type === 'boss_lord') {
    if (d > 110) walk(w, e, a, sp, dt); else if (d < 70) walk(w, e, a + Math.PI, sp * 0.8, dt);
  } else if (type === 'boss_mother') {
    // тяжёлая и медленная: держится на средней дистанции, а вблизи давит ударом
    if (d > 88) walk(w, e, a, sp, dt); else if (d < 34) walk(w, e, a + Math.PI, sp * 0.5, dt);
  } else if (d > e.r + 22) walk(w, e, a, sp, dt);
}

function script(w, e, dur, steps) {
  const b = e.boss;
  b.mode = 'attack'; b.st = 0; b.dur = dur;
  b.steps = steps.map(([at, fn]) => ({ at, fn, done: false }));
}

function aimTele(w, e, o) { return w.tele({ owner: e, ...o }); }

function summon(w, e, type, n, lvl) {
  const alive = w.enemies.filter((o) => o.alive && o.summoned).length;
  const max = 4;
  for (let i = 0; i < n && alive + i < max; i++) {
    const a = Math.random() * TAU, r = 36 + Math.random() * 26;
    let x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r;
    if (!w.boxFree(x, y, 6)) { x = e.x; y = e.y + 24; if (!w.boxFree(x, y, 6)) continue; }
    const m = w.spawnEnemy(type, x, y, lvl);
    m.summoned = true; m.aggro = true; m.state = 'chase';
    w.emit({ t: 'puff', x, y, big: false, col: '#8a6cc8' });
  }
  w.emit({ t: 'sfx', n: 'summon' });
}

function startBossAttack(w, e, d) {
  const b = e.boss, p = w.p, type = e.def.ai;
  const A = () => toP(w, e);
  const pick = (opts) => {
    let sum = 0; for (const [, wt] of opts) sum += wt;
    let r = Math.random() * sum;
    for (const [n, wt] of opts) { r -= wt; if (r <= 0) return n; }
    return opts[0][0];
  };
  b.n++;

  // ---------- Грок, вождь гоблинов
  if (type === 'boss_chief') {
    let name;
    if (b.phase === 2 && !b.flags.roared) name = 'roar';
    else name = d < 52 ? pick([['smash', 6], ['charge', 3]]) : pick([['charge', 6], ['smash', 2]]);
    if (name === b.last && name !== 'roar') name = name === 'smash' ? 'charge' : 'smash';
    b.last = name;
    if (name === 'smash') {
      const a = A(); e.face = a;
      script(w, e, 1.2, [[0, () => { aimTele(w, e, { x: e.x + Math.cos(a) * 20, y: e.y + Math.sin(a) * 20, r: 28, dur: 0.75, dmg: e.atk * 1.3, kind: 'shock' }); w.emit({ t: 'alert', x: e.x, y: e.y - 20, warn: true }); }]]);
    } else if (name === 'charge') {
      const a = A(); e.face = a;
      script(w, e, 1.6, [
        [0, () => { aimTele(w, e, { shape: 'cone', x: e.x, y: e.y, r: 140, ang: a, arc: 0.4, dur: 0.85, dmg: 0, kind: 'warn' }); }],
        [0.85, () => { b.dash = { ang: a, spd: 190, t: 0.6, dmg: e.atk * 1.2, hit: false, kb: 130 }; w.emit({ t: 'sfx', n: 'growl' }); }],
      ]);
    } else {
      b.flags.roared = true; b.flags.enrage = true;
      script(w, e, 1.1, [[0.2, () => { summon(w, e, 'goblin', 2, e.lvl - 1); w.emit({ t: 'shake', v: 4 }); w.emit({ t: 'nova', x: e.x, y: e.y, r: 50, col: '#ff8a4a' }); }]]);
    }
    return;
  }

  // ---------- Мать Стоков
  if (type === 'boss_mother') {
    const ph = b.phase;
    const alive = w.enemies.filter((o) => o.alive && o.summoned).length;
    let name;
    if (!alive && (!b.flags.lastSummon || b.n - b.flags.lastSummon > 5)) name = 'brood';
    else if (d < 56) name = pick([['slam', 5], ['spit', 2], ['pools', 2]]);
    else if (ph >= 2) name = pick([['spit', 3], ['pools', 3], ['ring', 3], ['rain', 3]]);
    else name = pick([['spit', 4], ['pools', 4], ['ring', 1]]);
    if (name === b.last && name !== 'brood') name = pick([['spit', 3], ['pools', 3], ['slam', 1]]);
    b.last = name;
    const a = A(); e.face = a;
    if (name === 'spit') {
      const volley = () => { const aa = A(); for (let i = -2; i <= 2; i++) w.shoot({ x: e.x, y: e.y - 6, ang: aa + i * 0.2, speed: 96, r: 3.5, dmg: e.atk * 0.75, kind: 'blight', life: 3.2 }); w.emit({ t: 'sfx', n: 'shoot' }); };
      script(w, e, ph >= 2 ? 1.6 : 1.2, ph >= 2 ? [[0.3, volley], [0.75, volley], [1.2, volley]] : [[0.3, volley], [0.8, volley]]);
    } else if (name === 'pools') {
      script(w, e, 1.5, [
        [0, () => { aimTele(w, e, { x: p.x, y: p.y, r: 26, dur: 0.9, dmg: e.atk * 1.2, kind: 'tendril' }); w.emit({ t: 'sfx', n: 'warn' }); }],
        [0.45, () => aimTele(w, e, { x: p.x + rnd(-34, 34), y: p.y + rnd(-34, 34), r: 24, dur: 0.85, dmg: e.atk * 1.1, kind: 'tendril' })],
        [0.9, () => aimTele(w, e, { x: p.x + rnd(-40, 40), y: p.y + rnd(-40, 40), r: 24, dur: 0.85, dmg: e.atk * 1.1, kind: 'tendril' })],
      ]);
    } else if (name === 'ring') {
      const n = 18;
      const ring = (off) => () => { for (let i = 0; i < n; i++) w.shoot({ x: e.x, y: e.y - 6, ang: off + (i / n) * TAU, speed: 66, r: 3.5, dmg: e.atk * 0.65, kind: 'blight', life: 4.5 }); w.emit({ t: 'sfx', n: 'shoot' }); };
      script(w, e, ph >= 2 ? 1.6 : 1.1, ph >= 2 ? [[0.2, ring(0)], [0.9, ring(Math.PI / n)]] : [[0.3, ring(0)]]);
    } else if (name === 'rain') {
      const steps = [];
      for (let i = 0; i < 7; i++) steps.push([i * 0.16, () => aimTele(w, e, { x: p.x + rnd(-62, 62), y: p.y + rnd(-62, 62), r: 22, dur: 0.85, dmg: e.atk * 1.0, kind: 'tendril' })]);
      script(w, e, 2.2, steps);
    } else if (name === 'slam') {
      script(w, e, 1.3, [[0, () => { aimTele(w, e, { x: e.x, y: e.y, r: 50, dur: 0.95, dmg: e.atk * 1.5, kind: 'shock', kb: 140 }); w.emit({ t: 'sfx', n: 'warn' }); }]]);
    } else {
      b.flags.lastSummon = b.n;
      if (ph >= 2) b.flags.enrage = true;
      script(w, e, 1.3, [[0.3, () => { summon(w, e, 'sewerSlime', ph >= 2 ? 3 : 2, Math.max(1, e.lvl - 1)); w.emit({ t: 'shake', v: 3 }); w.emit({ t: 'nova', x: e.x, y: e.y, r: 56, col: '#5aff7a' }); }]]);
    }
    return;
  }

  // ---------- Волчий Глаз
  if (type === 'boss_captain') {
    let name;
    if (b.phase === 2 && !b.flags.summoned) name = 'call';
    else name = pick([['slash', 5], ['knives', 4], ['evade', 3]]);
    if (name === b.last && name !== 'call') name = pick([['slash', 5], ['knives', 4], ['evade', 3]]);
    b.last = name;
    const a = A(); e.face = a;
    if (name === 'slash') {
      script(w, e, 0.95, [
        [0, () => { aimTele(w, e, { shape: 'cone', x: e.x, y: e.y, r: 78, ang: a, arc: 0.5, dur: 0.42, dmg: 0, kind: 'warn' }); }],
        [0.42, () => { b.dash = { ang: a, spd: 250, t: 0.24, dmg: e.atk, hit: false, kb: 80 }; w.emit({ t: 'sfx', n: 'swing' }); }],
      ]);
    } else if (name === 'knives') {
      script(w, e, 1.0, [[0.4, () => {
        const aa = A();
        for (let i = -2; i <= 2; i++) w.shoot({ x: e.x, y: e.y - 3, ang: aa + i * 0.2, speed: 135, r: 2.5, dmg: e.atk * 0.7, kind: 'knife', life: 1.6 });
        w.emit({ t: 'sfx', n: 'shoot' });
      }]]);
    } else if (name === 'evade') {
      script(w, e, 1.2, [
        [0, () => { b.dash = { ang: A() + Math.PI + rnd(-0.4, 0.4), spd: 190, t: 0.35, dmg: 0 }; }],
        [0.5, () => { const aa = A(); for (let i = -1; i <= 1; i++) w.shoot({ x: e.x, y: e.y - 3, ang: aa + i * 0.25, speed: 140, r: 2.5, dmg: e.atk * 0.7, kind: 'knife', life: 1.6 }); w.emit({ t: 'sfx', n: 'shoot' }); }],
      ]);
    } else {
      b.flags.summoned = true; b.flags.enrage = true;
      script(w, e, 1.0, [[0.2, () => { summon(w, e, 'bandit', 2, e.lvl - 2); w.emit({ t: 'text', x: e.x, y: e.y - 26, text: 'Ко мне, парни!', col: '#ffcc88' }); }]]);
    }
    return;
  }

  // ---------- Полый король
  if (type === 'boss_king') {
    const ph = b.phase;
    let name;
    const alive = w.enemies.filter((o) => o.alive && o.summoned).length;
    if (ph >= 2 && !alive && (!b.flags.lastSummon || b.n - b.flags.lastSummon > 5)) name = 'summon';
    else if (ph === 3) name = pick([['combo', 3], ['slam', 3], ['ring', 3], ['barrage', 3]]);
    else if (ph === 2) name = pick([['combo', 4], ['slam', 4], ['ring', 3]]);
    else name = d < 50 ? pick([['combo', 5], ['slam', 3], ['ring', 2]]) : pick([['slam', 4], ['ring', 3], ['combo', 2]]);
    if (name === b.last && name !== 'summon') name = pick([['combo', 3], ['slam', 3], ['ring', 3]]);
    b.last = name;
    if (name === 'combo') {
      const mk = (at) => [at, () => {
        const a = A(); e.face = a;
        aimTele(w, e, { shape: 'cone', x: e.x, y: e.y, r: 42, ang: a, arc: 1.7, dur: 0.5, dmg: e.atk, kind: 'swing', kb: 95 });
        b.dash = { ang: a, spd: 70, t: 0.25, dmg: 0 };
      }];
      script(w, e, 1.8, [mk(0), mk(0.6), mk(1.2)]);
    } else if (name === 'slam') {
      const steps = [[0, () => { aimTele(w, e, { x: p.x, y: p.y, r: 36, dur: 0.95, dmg: e.atk * 1.4, kind: 'shock', kb: 110 }); w.emit({ t: 'sfx', n: 'warn' }); }]];
      if (ph >= 2) {
        steps.push([0.55, () => aimTele(w, e, { x: p.x + rnd(-24, 24), y: p.y + rnd(-24, 24), r: 32, dur: 0.85, dmg: e.atk * 1.2, kind: 'shock' })]);
        steps.push([1.05, () => aimTele(w, e, { x: p.x + rnd(-30, 30), y: p.y + rnd(-30, 30), r: 32, dur: 0.85, dmg: e.atk * 1.2, kind: 'shock' })]);
      }
      script(w, e, ph >= 2 ? 2.1 : 1.35, steps);
    } else if (name === 'ring') {
      const n = ph === 3 ? 18 : 12;
      const ring = (off) => () => { for (let i = 0; i < n; i++) w.shoot({ x: e.x, y: e.y - 4, ang: off + (i / n) * TAU, speed: 66, r: 3.5, dmg: e.atk * 0.7, kind: 'skull', life: 4.5 }); w.emit({ t: 'sfx', n: 'shoot' }); };
      const st = [[0.2, ring(0)]];
      if (ph === 3) st.push([0.8, ring(Math.PI / n)]);
      script(w, e, ph === 3 ? 1.5 : 1.0, st);
    } else if (name === 'barrage') {
      script(w, e, 1.4, [0.1, 0.35, 0.6, 0.85].map((at) => [at, () => { w.shoot({ x: e.x, y: e.y - 4, ang: A(), speed: 125, r: 3.5, dmg: e.atk * 0.8, kind: 'skull', life: 3 }); w.emit({ t: 'sfx', n: 'shoot' }); }]));
    } else {
      b.flags.lastSummon = b.n;
      script(w, e, 1.3, [[0.3, () => { summon(w, e, e.def.minion || 'skeleton', 3, e.lvl - 2); w.emit({ t: 'shake', v: 3 }); w.emit({ t: 'nova', x: e.x, y: e.y, r: 50, col: '#a08ae0' }); }]]);
    }
    return;
  }

  // ---------- Последний Прежний: четыре фазы
  if (type === 'boss_lord') {
    const ph = b.phase;
    const alive = w.enemies.filter((o) => o.alive && o.summoned).length;
    // излучение слабее на каждый восстановленный маяк; в фазе 4 маяки гаснут, и подсказки (предупреждающие конусы) исчезают
    const beacons = (w.s.flags.beacon1 ? 1 : 0) + (w.s.flags.beacon2 ? 1 : 0) + (w.s.flags.beacon3 ? 1 : 0);
    const rad = 1 - 0.07 * beacons;
    const hint = ph >= 4 ? 0.4 : 1;
    let name;
    if (ph >= 2 && !alive && (!b.flags.lastSummon || b.n - b.flags.lastSummon > 5)) name = 'summon';
    else if (ph === 4) name = pick([['wave', 4], ['tendrils', 3], ['spiral', 3], ['dash', 2], ['burst', 2], ['gap', 3], ['pulse', 3]]);
    else if (ph === 3) name = pick([['bolts', 2], ['tendrils', 3], ['spiral', 2], ['dash', 2], ['burst', 3], ['gap', 3], ['wave', 3]]);
    else if (ph === 2) name = pick([['bolts', 3], ['tendrils', 3], ['spiral', 3], ['dash', 2], ['burst', 2], ['wave', 2]]);
    else name = d < 60 ? pick([['burst', 4], ['bolts', 3], ['tendrils', 3]]) : pick([['bolts', 4], ['tendrils', 4], ['dash', 2]]);
    if (name === b.last && name !== 'summon') name = pick([['bolts', 3], ['tendrils', 3], ['spiral', 2], ['burst', 2], ['wave', 2]]);
    b.last = name;
    const fan = () => { const a = A(); for (let i = -1; i <= 1; i++) w.shoot({ x: e.x, y: e.y - 6, ang: a + i * 0.24, speed: 110, r: 3.5, dmg: e.atk * 0.8 * rad, kind: 'blight', life: 3 }); w.emit({ t: 'sfx', n: 'shoot' }); };
    // кольцо излучения с окном: окно по направлению на игрока, шире на ранних фазах
    const ringGap = (n, gapA, gap, speed, off = 0) => () => {
      for (let i = 0; i < n; i++) { const a = off + (i / n) * TAU; if (angDiff(a, gapA) < gap) continue; w.shoot({ x: e.x, y: e.y - 6, ang: a, speed, r: 3.5, dmg: e.atk * 0.75 * rad, kind: 'blight', life: 5.5 }); }
      w.emit({ t: 'sfx', n: 'shoot' }); w.emit({ t: 'nova', x: e.x, y: e.y, r: 30, col: '#c8a0ff' });
    };
    if (name === 'bolts') {
      script(w, e, 1.5, ph >= 2 ? [[0.2, fan], [0.7, fan], [1.2, fan]] : [[0.3, fan], [0.9, fan]]);
    } else if (name === 'tendrils') {
      const n = ph >= 3 ? 6 : 4;
      const steps = [[0, () => aimTele(w, e, { x: p.x, y: p.y, r: 22, dur: 0.9, dmg: e.atk * 1.2, kind: 'tendril' })]];
      for (let i = 0; i < n; i++) steps.push([0.15 + i * 0.18, () => aimTele(w, e, { x: p.x + rnd(-52, 52), y: p.y + rnd(-52, 52), r: 20, dur: 0.85, dmg: e.atk * 1.1, kind: 'tendril' })]);
      script(w, e, 1.2 + n * 0.18, steps);
    } else if (name === 'spiral') {
      const base = Math.random() * TAU;
      const steps = [];
      const N = ph >= 3 ? 30 : 22;
      for (let i = 0; i < N; i++) steps.push([0.2 + i * 0.07, () => { w.shoot({ x: e.x, y: e.y - 6, ang: base + i * 0.48, speed: 78, r: 3.5, dmg: e.atk * 0.7 * rad, kind: 'blight', life: 4.5 }); if (i % 6 === 0) w.emit({ t: 'sfx', n: 'shoot' }); }]);
      script(w, e, 0.4 + N * 0.07, steps);
    } else if (name === 'dash') {
      const a = A(); e.face = a;
      script(w, e, 1.5, [
        [0, () => aimTele(w, e, { shape: 'cone', x: e.x, y: e.y, r: 170, ang: a, arc: 0.3, dur: 0.7 * hint, dmg: 0, kind: 'warn' })],
        [0.7 * hint, () => { b.dash = { ang: a, spd: 270, t: 0.5, dmg: e.atk * 1.3, hit: false, kb: 130 }; w.emit({ t: 'sfx', n: 'growl' }); }],
      ]);
    } else if (name === 'burst') {
      script(w, e, 1.5, [[0, () => { aimTele(w, e, { x: e.x, y: e.y, r: 58, dur: 1.0, dmg: e.atk * 1.5, kind: 'shock', kb: 150 }); w.emit({ t: 'sfx', n: 'warn' }); }]]);
    } else if (name === 'gap') {
      const gapA = A();
      script(w, e, 1.6, [[0.2, ringGap(22, gapA, 0.4, 72)], [0.9, ringGap(22, gapA, 0.4, 72, 0.14)]]);
    } else if (name === 'wave') {
      // волны излучения: три кольца подряд, окно каждый раз смещается; в фазе 4 волн четыре и они быстрее
      const waves = ph >= 4 ? 4 : 3, sp = ph >= 4 ? 84 : 66, gapA = A();
      const steps = [[0, () => w.emit({ t: 'sfx', n: 'warn' })]];
      for (let i = 0; i < waves; i++) steps.push([0.3 + i * 0.75, ringGap(26, gapA + i * 1.1, ph >= 4 ? 0.34 : 0.42, sp)]);
      script(w, e, 0.6 + waves * 0.75, steps);
    } else if (name === 'pulse') {
      // фаза 4: удар по месту, затем волна без предупреждения
      const gapA = A();
      script(w, e, 2.0, [
        [0, () => { aimTele(w, e, { x: e.x, y: e.y, r: 64, dur: 0.8, dmg: e.atk * 1.5, kind: 'shock', kb: 160 }); w.emit({ t: 'sfx', n: 'warn' }); }],
        [0.95, ringGap(28, gapA, 0.32, 90)],
        [1.4, () => { aimTele(w, e, { x: p.x, y: p.y, r: 24, dur: 0.6, dmg: e.atk * 1.1, kind: 'tendril' }); aimTele(w, e, { x: p.x + rnd(-40, 40), y: p.y + rnd(-40, 40), r: 22, dur: 0.6, dmg: e.atk * 1.1, kind: 'tendril' }); }],
      ]);
    } else {
      // призыв эха: эхо-солдаты и призраки, до четырёх за раз
      b.flags.lastSummon = b.n;
      script(w, e, 1.4, [[0.3, () => {
        summon(w, e, ph >= 3 ? 'wraith' : 'echoSoldier', ph >= 3 ? 3 : 2, e.lvl - 3);
        if (ph >= 4) summon(w, e, 'echoSoldier', 1, e.lvl - 3);
        w.emit({ t: 'shake', v: 3 }); w.emit({ t: 'nova', x: e.x, y: e.y, r: 60, col: '#9a5ae0' });
        w.emit({ t: 'text', x: e.x, y: e.y - 40, text: 'Они всё ещё здесь.', col: '#e8d8a8' });
      }]]);
    }
  }
}
