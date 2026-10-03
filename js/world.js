// Игровой мир: области, сущности, бой, лут, взаимодействия. Не зависит от DOM —
// запускается и в браузере, и в Node (тесты, бот).
import { TILE, T, TILEDEF, CFG, CLASSES, ENEMIES, ITEMS, AREAS, SHOPS } from './defs.js';
import { getMap, PROP_DEF } from './maps.js';
import { clamp, dist, angleTo, normAng, angDiff } from './util.js';
import {
  calcStats, addItem, removeItem, count, addXp, equip as eqItem, unequip as uneqItem, resolveItem, isUnlocked,
} from './state.js';
import {
  QUESTS, questStatus, acceptQuest, completeQuest, onKill, planTalk, autoCompletable, itemName,
} from './quests.js';
import { updateEnemy, makeBossState } from './ai.js';

const TAU = Math.PI * 2;
export { normAng, angDiff };

export class World {
  constructor(state, rng = Math.random) {
    this.s = state;
    this.rng = rng;
    this.events = [];
    this.t = 0;
    this.stats = calcStats(state);
    this.p = null;
    this.prompt = null;
    this.portalMsgT = 0;
    this.bossE = null;
    this.paused = false;
    this.loadArea(state.area, state.x || null, state.y || null, true);
  }

  emit(e) { this.events.push(e); }
  drain() { const e = this.events; this.events = []; return e; }
  refreshStats() {
    this.stats = calcStats(this.s);
    this.s.hp = Math.min(this.s.hp, this.stats.maxHp);
    this.s.mp = Math.min(this.s.mp, this.stats.maxMp);
  }

  // ------------------------------------------------------------- области
  loadArea(id, px, py, first = false) {
    const map = getMap(id);
    this.map = map;
    this.area = id;
    this.s.area = id;
    this.W = map.w; this.H = map.h;
    const n = map.w * map.h;
    this.solid = new Uint8Array(n);       // для ходящих существ (включая лаву и объекты)
    this.wall = new Uint8Array(n);        // для снарядов и летунов: стены и объекты, без воды и лавы
    for (let i = 0; i < n; i++) {
      const d = TILEDEF[map.tiles[i]];
      if (d.solid) { this.solid[i] = 1; if (!d.water) this.wall[i] = 1; }
      else if (d.lava) this.solid[i] = 2;
    }
    for (const pr of map.props) {
      if (pr.deco && pr.k === 'reeds') continue;
      for (let j = 0; j < pr.h; j++) for (let i = 0; i < pr.w; i++) {
        const x = pr.x + i, y = pr.y + j;
        if (x >= 0 && y >= 0 && x < map.w && y < map.h) { this.solid[y * map.w + x] = 1; this.wall[y * map.w + x] = 1; }
      }
    }
    // двери
    this.doors = map.doors.map((d) => ({ ...d, open: d.opens.every((f) => this.s.flags[f]) }));
    this.applyDoors();

    // NPC
    this.npcs = map.npcs.map((n) => ({ ...n, px: (n.x + 0.5) * TILE, py: (n.y + 0.5) * TILE, t: Math.random() * 6 }))
      .filter((n) => !(n.id === 'pushok' && this.s.flags.cat_found));
    // сундуки и узлы
    this.chests = map.chests.map((c) => ({ ...c, px: (c.x + 0.5) * TILE, py: (c.y + 0.5) * TILE, open: !!this.s.opened[c.id] }));
    this.nodes = map.nodes.map((c) => ({ ...c, px: (c.x + 0.5) * TILE, py: (c.y + 0.5) * TILE, taken: !!this.s.opened[c.id] }));
    // интерактивные предметы
    this.usables = map.props.filter((p) => p.use).map((p) => ({ p, px: (p.x + p.w / 2) * TILE, py: (p.y + p.h / 2) * TILE }));
    // враги
    this.enemies = [];
    this.projs = [];
    this.teles = [];
    this.pickups = [];
    this.fxProps = [];
    for (const sp of map.enemies) {
      if (sp.unique && this.s.killed[sp.unique]) continue;
      this.spawnEnemy(sp.type, (sp.x + 0.5) * TILE, (sp.y + 0.5) * TILE, sp.lvl, sp.unique);
    }
    // игрок
    const sx = px != null ? px : (map.spawn.x + 0.5) * TILE;
    const sy = py != null ? py : (map.spawn.y + 0.5) * TILE;
    this.p = this.p || this.makePlayer();
    Object.assign(this.p, { x: sx, y: sy, vx: 0, vy: 0, act: null, dodge: null, kbx: 0, kby: 0 });
    this.bossE = null;
    this.zoneIn = {};
    if (!first || !this.s.visited[id]) this.emit({ t: 'area', id, name: AREAS[id].name, sub: AREAS[id].sub });
    this.s.visited[id] = true;
    this.s.x = sx; this.s.y = sy;
    this.emit({ t: 'music', theme: AREAS[id].theme });
  }

  applyDoors() {
    for (const d of this.doors) {
      for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) {
        const k = (d.y + j) * this.W + d.x + i;
        // стена вокруг не меняется: дверной проём открывается/закрывается
        this.solid[k] = d.open ? 0 : 1; this.wall[k] = d.open ? 0 : 1;
      }
    }
  }

  makePlayer() {
    return {
      x: 0, y: 0, r: CFG.playerRadius, vx: 0, vy: 0, face: Math.PI / 2, moving: false, anim: 0,
      act: null, cdAtk: 0, cdSkill: [0, 0], cdDodge: 0, cdPot: 0, inv: 0, hurt: 0, dead: false,
      buffs: { roar: 0, shadow: 0, slow: 0, web: 0 }, nextCrit: false, combo: 0, comboT: 0, dodge: null,
      kbx: 0, kby: 0, lavaT: 0, regenAcc: 0, mpAcc: 0,
    };
  }

  spawnEnemy(type, x, y, lvl, unique = null, extra = {}) {
    const d = ENEMIES[type];
    const hpMul = 1 + 0.22 * (lvl - 1), atkMul = 1 + 0.18 * (lvl - 1);
    const e = {
      kind: 'enemy', type, def: d, lvl, x, y, hx: x, hy: y, r: d.r,
      hp: Math.round(d.hp * hpMul), atk: d.atk * atkMul, spd: d.spd, face: Math.PI / 2,
      state: 'idle', t: 0, cd: 1 + Math.random() * 2, flash: 0, stun: 0, slow: 0, kbx: 0, kby: 0,
      aggro: false, alive: true, anim: Math.random() * 6, unique, wanderA: 0, wanderT: Math.random() * 2,
      xpMul: 1 + 0.12 * (lvl - 1), vx: 0, vy: 0, lunge: 0, hit: false, tele: null, ...extra,
    };
    e.maxHp = e.hp;
    if (d.boss) e.boss = makeBossState(type);
    this.enemies.push(e);
    return e;
  }

  // ------------------------------------------------------------- коллизии
  tileSolid(tx, ty, grid = this.solid) {
    if (tx < 0 || ty < 0 || tx >= this.W || ty >= this.H) return 1;
    return grid[ty * this.W + tx];
  }
  // коробка существа: ширина r, высота 0.7r (ступни)
  boxFree(x, y, r, grid = this.solid, lavaOk = false) {
    const hw = r, hh = r * 0.7;
    for (const [ox, oy] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) {
      const v = this.tileSolid(Math.floor((x + ox) / TILE), Math.floor((y + oy) / TILE), grid);
      if (v === 1 || (v === 2 && !lavaOk)) return false;
    }
    return true;
  }
  move(e, dx, dy, grid = this.solid, lavaOk = false) {
    let hit = false;
    if (dx) { if (this.boxFree(e.x + dx, e.y, e.r, grid, lavaOk)) e.x += dx; else hit = true; }
    if (dy) { if (this.boxFree(e.x, e.y + dy, e.r, grid, lavaOk)) e.y += dy; else hit = true; }
    return hit;
  }
  los(x1, y1, x2, y2) {
    const d = dist(x1, y1, x2, y2);
    const n = Math.ceil(d / 6);
    for (let i = 1; i < n; i++) {
      const x = x1 + ((x2 - x1) * i) / n, y = y1 + ((y2 - y1) * i) / n;
      if (this.tileSolid(Math.floor(x / TILE), Math.floor(y / TILE), this.wall)) return false;
    }
    return true;
  }
  tileAt(x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.W || ty >= this.H) return T.WALL;
    return this.map.tiles[ty * this.W + tx];
  }

  // ------------------------------------------------------------- урон
  playerVisible() { return this.p.buffs.shadow <= 0; }

  hurtPlayer(dmg, sx, sy, o = {}) {
    const p = this.p;
    if (p.dead || p.inv > 0 || (p.dodge && p.dodge.iframes > 0 && !o.unavoidable)) return false;
    let d = dmg * (1 - this.stats.def / (this.stats.def + 40));
    if (p.buffs.roar > 0) d *= 0.7;
    d = Math.max(1, Math.round(d * (0.92 + Math.random() * 0.16)));
    this.s.hp -= d;
    p.inv = o.inv != null ? o.inv : CFG.invulnAfterHit;
    p.hurt = 0.25;
    if (p.act && p.act.kind !== 'cast') p.act = null;
    const a = angleTo(sx, sy, p.x, p.y);
    const kb = o.kb != null ? o.kb : 60;
    p.kbx = Math.cos(a) * kb; p.kby = Math.sin(a) * kb;
    if (o.slow) p.buffs.web = Math.max(p.buffs.web, o.slow);
    this.emit({ t: 'dmg', x: p.x, y: p.y - 12, v: d, who: 'p' });
    this.emit({ t: 'sfx', n: 'hurt' });
    this.emit({ t: 'shake', v: Math.min(5, 1.5 + d / 14) });
    if (this.s.hp <= 0) this.die();
    return true;
  }

  die() {
    const p = this.p;
    this.s.hp = 0; p.dead = true; p.act = null; p.dodge = null;
    this.s.deaths++;
    this.emit({ t: 'death' });
    // босс сбрасывается
    for (const e of this.enemies) if (e.boss && e.alive) { e.aggro = false; e.hp = e.maxHp; e.boss = makeBossState(e.type); e.x = e.hx; e.y = e.hy; }
    this.emit({ t: 'boss', e: null });
    this.bossE = null;
  }

  respawn() {
    const r = this.s.respawn;
    this.s.gold = Math.floor(this.s.gold * (1 - CFG.deathGoldLoss));
    this.p.dead = false;
    this.p.inv = 1.5; this.p.hurt = 0;
    for (const k of Object.keys(this.p.buffs)) this.p.buffs[k] = 0;
    this.s.hp = this.stats.maxHp; this.s.mp = this.stats.maxMp;
    this.loadArea(r.area, r.x, r.y);
    this.emit({ t: 'toast', text: 'Вы очнулись у алтаря', kind: 'info' });
  }

  hurtEnemy(e, dmg, o = {}) {
    if (!e.alive) return false;
    const st = this.stats;
    let crit = false;
    if (o.player) {
      if (o.canCrit !== false && (this.p.nextCrit || Math.random() < st.crit)) {
        crit = true; dmg *= this.p.nextCrit ? 3 : 1.8; this.p.nextCrit = false;
      }
      dmg *= 0.92 + Math.random() * 0.16;
      if (this.p.buffs.roar > 0) dmg *= 1.35;
    }
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg;
    e.flash = 0.12;
    if (!e.aggro && !e.boss) this.alert(e);
    e.aggro = true;
    const ang = o.ang != null ? o.ang : angleTo(this.p.x, this.p.y, e.x, e.y);
    const kb = (o.kb || 0) * (e.boss ? 0.15 : 1) * (e.def.hop ? 1.2 : 1);
    if (kb) { e.kbx += Math.cos(ang) * kb; e.kby += Math.sin(ang) * kb; if (!e.boss) e.stun = Math.max(e.stun, 0.12); }
    if (o.slow && !e.boss) e.slow = Math.max(e.slow, o.slow);
    this.emit({ t: 'dmg', x: e.x, y: e.y - e.r - 8, v: dmg, crit, who: 'e', big: dmg > 30 });
    this.emit({ t: 'hit', x: e.x, y: e.y - 4, ang, crit });
    this.emit({ t: 'sfx', n: crit ? 'crit' : 'hit' });
    if (e.hp <= 0) this.killEnemy(e);
    return true;
  }

  alert(e) {
    for (const o of this.enemies) {
      if (o.alive && !o.aggro && !o.boss && o.type === e.type && dist(o.x, o.y, e.x, e.y) < 80) o.aggro = true;
    }
  }

  killEnemy(e) {
    e.alive = false; e.state = 'dead'; e.t = 0;
    const s = this.s;
    s.kills++;
    const d = e.def;
    const xp = Math.round(d.xp * e.xpMul);
    const lv = addXp(s, xp);
    this.emit({ t: 'xp', x: e.x, y: e.y - 14, v: xp });
    this.emit({ t: 'sfx', n: d.boss ? 'bossdie' : 'die' });
    this.emit({ t: 'puff', x: e.x, y: e.y, big: !!d.boss, col: d.color || '#c8c8d0' });
    if (lv) { this.refreshStats(); this.emit({ t: 'levelup', lvl: s.lvl }); }
    if (e.unique) s.killed[e.unique] = true;
    for (const id of onKill(s, e.type)) this.emit({ t: 'quest', id, why: 'kill' });
    // золото
    const g = d.gold ? d.gold[0] + Math.floor(Math.random() * (d.gold[1] - d.gold[0] + 1)) : 0;
    if (g > 0) this.drop('gold', g, e.x, e.y);
    // предметы
    for (const [id, ch] of d.drops || []) if (Math.random() < ch) this.drop(id, 1, e.x, e.y);
    if (!d.boss) {
      if (Math.random() < 0.09) this.drop(Math.random() < 0.6 ? 'p_hp1' : 'p_mp1', 1, e.x, e.y);
      if (e.lvl >= 8 && Math.random() < 0.05) this.drop(Math.random() < 0.6 ? 'p_hp2' : 'p_mp2', 1, e.x, e.y);
    }
    if (d.boss) {
      this.emit({ t: 'boss', e: null }); this.bossE = null;
      this.emit({ t: 'toast', text: `${d.title || d.name} повержен!`, kind: 'good' });
      this.emit({ t: 'shake', v: 6 });
      for (const o of this.enemies) if (o.alive && o.summoned) { o.hp = 0; o.alive = false; o.state = 'dead'; }
      this.teles.length = 0; this.projs = this.projs.filter((q) => q.from === 'p');
    }
    // финал
    for (const id of autoCompletable(s)) {
      const r = completeQuest(s, id);
      if (r) { s.flags.victory = true; this.emit({ t: 'victory' }); }
    }
    this.emit({ t: 'stats' });
  }

  drop(id, n, x, y) {
    const a = Math.random() * TAU, sp = 20 + Math.random() * 20;
    this.pickups.push({ id, n, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 90 });
  }

  // ------------------------------------------------------------- снаряды и зоны
  shoot(o) {
    const q = { x: o.x, y: o.y, vx: Math.cos(o.ang) * o.speed, vy: Math.sin(o.ang) * o.speed, r: o.r || 3, dmg: o.dmg, from: o.from || 'e',
      kind: o.kind || 'orb', life: o.life || 2, pierce: o.pierce || 0, aoe: o.aoe || 0, slow: o.slow || 0, ang: o.ang, hits: new Set(), crit: o.crit, kb: o.kb || 0, t: 0, owner: o.owner };
    this.projs.push(q);
    return q;
  }
  tele(o) {
    const z = { x: o.x, y: o.y, r: o.r, t: 0, dur: o.dur, dmg: o.dmg, shape: o.shape || 'circle', ang: o.ang || 0, arc: o.arc || 0, kind: o.kind || 'smash', owner: o.owner, kb: o.kb != null ? o.kb : 80, slow: o.slow || 0, done: false };
    this.teles.push(z);
    return z;
  }
  inTele(z, x, y, r) {
    const d = dist(z.x, z.y, x, y);
    if (d > z.r + r) return false;
    if (z.shape === 'circle') return true;
    if (d < 4) return true;
    return angDiff(angleTo(z.x, z.y, x, y), z.ang) <= z.arc / 2 + r / Math.max(d, 8);
  }

  updateProjs(dt) {
    const p = this.p;
    for (const q of this.projs) {
      q.t += dt; q.life -= dt;
      const nx = q.x + q.vx * dt, ny = q.y + q.vy * dt;
      if (this.tileSolid(Math.floor(nx / TILE), Math.floor(ny / TILE), this.wall)) {
        q.life = 0;
        if (q.aoe) this.explode(q, q.x, q.y);
        else this.emit({ t: 'puff', x: q.x, y: q.y, big: false, col: '#ffffff', small: true });
        continue;
      }
      q.x = nx; q.y = ny;
      if (q.from === 'p') {
        for (const e of this.enemies) {
          if (!e.alive || q.hits.has(e) || dist(q.x, q.y, e.x, e.y) > e.r + q.r) continue;
          q.hits.add(e);
          if (q.aoe) { this.explode(q, q.x, q.y); q.life = 0; break; }
          this.hurtEnemy(e, q.dmg, { player: true, ang: q.ang, kb: q.kb || 30, slow: q.slow });
          if (q.pierce-- <= 0) { q.life = 0; break; }
        }
      } else if (!p.dead && dist(q.x, q.y, p.x, p.y - 2) < q.r + p.r) {
        if (this.hurtPlayer(q.dmg, q.x - q.vx * 0.05, q.y - q.vy * 0.05, { kb: 40, slow: q.slow })) q.life = 0;
      }
    }
    this.projs = this.projs.filter((q) => q.life > 0);
  }

  explode(q, x, y) {
    this.emit({ t: 'boom', x, y, r: q.aoe, col: q.kind === 'ice' ? '#a8e0ff' : '#ff9a3c' });
    this.emit({ t: 'sfx', n: 'boom' });
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (dist(x, y, e.x, e.y) <= q.aoe + e.r) this.hurtEnemy(e, q.dmg, { player: true, ang: angleTo(x, y, e.x, e.y), kb: 60, slow: q.slow });
    }
  }

  updateTeles(dt) {
    const p = this.p;
    for (const z of this.teles) {
      z.t += dt;
      if (!z.done && z.t >= z.dur) {
        z.done = true;
        if (z.dmg > 0) {
          this.emit({ t: 'boom', x: z.x, y: z.y, r: z.shape === 'circle' ? z.r : z.r * 0.7, col: '#ff5a4a', hard: true });
          this.emit({ t: 'sfx', n: 'slam' });
        }
        if (z.dmg > 0 && !p.dead && this.inTele(z, p.x, p.y, p.r)) this.hurtPlayer(z.dmg, z.x, z.y, { kb: z.kb, slow: z.slow });
        if (z.kind === 'shock') this.emit({ t: 'shake', v: 3 });
      }
    }
    this.teles = this.teles.filter((z) => !z.done || z.t < z.dur + 0.22);
  }

  // ------------------------------------------------------------- обновление
  update(dt, inp) {
    if (dt > 0.05) dt = 0.05;
    this.t += dt;
    const s = this.s, p = this.p;
    s.playtime += dt;
    if (p.dead) { this.updateProjs(dt); this.updateTeles(dt); return; }
    this.updatePlayer(dt, inp);
    this.updateEnemies(dt);
    this.updateProjs(dt);
    this.updateTeles(dt);
    this.updatePickups(dt);
    this.updateInteract(inp);
    this.updateZones();
    this.updatePortals();
    s.x = p.x; s.y = p.y;
    for (const n of this.npcs) n.t += dt;
  }

  aimAngle(inp, range, cone) {
    const p = this.p;
    let base = p.face;
    const hasMouse = inp.aimX != null;
    if (hasMouse) base = angleTo(p.x, p.y, inp.aimX, inp.aimY);
    else if (inp.mx || inp.my) base = Math.atan2(inp.my, inp.mx);
    // помощь прицеливания: ближайший враг в конусе
    let best = null, bd = 1e9;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d > range) continue;
      const diff = angDiff(angleTo(p.x, p.y, e.x, e.y), base);
      if (diff > cone) continue;
      const score = d * (1 + diff);
      if (score < bd) { bd = score; best = e; }
    }
    if (best && !(hasMouse && angDiff(angleTo(p.x, p.y, best.x, best.y), base) > cone * 0.55)) return angleTo(p.x, p.y, best.x, best.y);
    return base;
  }

  updatePlayer(dt, inp) {
    const p = this.p, s = this.s, st = this.stats, cls = CLASSES[s.cls];
    p.anim += dt;
    for (const k of Object.keys(p.buffs)) p.buffs[k] = Math.max(0, p.buffs[k] - dt);
    p.inv = Math.max(0, p.inv - dt); p.hurt = Math.max(0, p.hurt - dt);
    p.cdAtk = Math.max(0, p.cdAtk - dt); p.cdDodge = Math.max(0, p.cdDodge - dt); p.cdPot = Math.max(0, p.cdPot - dt);
    p.cdSkill[0] = Math.max(0, p.cdSkill[0] - dt); p.cdSkill[1] = Math.max(0, p.cdSkill[1] - dt);
    if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.combo = 0; }
    // регенерация
    p.mpAcc += st.mpRegen * dt;
    if (p.mpAcc >= 1) { const n = Math.floor(p.mpAcc); s.mp = Math.min(st.maxMp, s.mp + n); p.mpAcc -= n; }
    // нокбэк
    if (p.kbx || p.kby) {
      this.move(p, p.kbx * dt, p.kby * dt, this.solid, true);
      const f = Math.pow(0.0008, dt);
      p.kbx *= f; p.kby *= f;
      if (Math.abs(p.kbx) + Math.abs(p.kby) < 4) { p.kbx = 0; p.kby = 0; }
    }

    // перекат / скачок
    if (p.dodge) {
      const d = p.dodge;
      d.t += dt; d.iframes -= dt;
      const step = (cls.dodge.dist / CFG.dodgeTime) * dt;
      this.move(p, d.dx * step, d.dy * step);
      if (d.t >= CFG.dodgeTime) p.dodge = null;
    }

    // действия
    if (p.act) this.updateAct(dt, inp);

    // ввод: движение
    let mx = inp.mx || 0, my = inp.my || 0;
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    p.moving = ml > 0.1 && !p.dodge;
    if (p.moving) {
      let speed = CFG.playerSpeed * st.spd * (p.buffs.web > 0 ? 0.55 : 1);
      const tile = TILEDEF[this.tileAt(p.x, p.y)];
      if (tile.slow) speed *= tile.slow;
      if (p.act) speed *= p.act.kind === 'cast' ? 0.6 : 0.45;
      if (!p.act || p.act.kind !== 'whirl') {
        this.move(p, mx * speed * dt, my * speed * dt, this.solid, true);
        if (!p.act || p.act.kind === 'cast') p.face = Math.atan2(my, mx);
      }
    }
    // лава
    if (TILEDEF[this.tileAt(p.x, p.y)].lava && !p.dodge) {
      p.lavaT -= dt;
      if (p.lavaT <= 0) { p.lavaT = 0.5; this.hurtPlayer(TILEDEF[T.LAVA].hurt * 0.7, p.x, p.y + 4, { kb: 20, inv: 0.2 }); }
    }

    if (p.dead) return;
    // нажатия
    if (inp.dodge && !p.dodge && p.cdDodge <= 0 && !p.act) this.startDodge(inp, cls);
    if (inp.potHp) this.usePotion('hp');
    if (inp.potMp) this.usePotion('mp');
    if (!p.dodge && !p.act) {
      for (let i = 0; i < 2; i++) {
        if (inp.skill && inp.skill[i]) { if (this.startSkill(i, inp, cls)) break; }
      }
      if (!p.act && inp.attack && p.cdAtk <= 0) this.startAttack(inp, cls);
    }
  }

  startDodge(inp, cls) {
    const p = this.p;
    let dx = inp.mx || 0, dy = inp.my || 0;
    if (!dx && !dy) { dx = Math.cos(p.face + Math.PI); dy = Math.sin(p.face + Math.PI); }   // без направления — шаг назад
    const l = Math.hypot(dx, dy); dx /= l; dy /= l;
    p.cdDodge = CFG.dodgeCd;
    if (cls.dodge.blink) {
      this.emit({ t: 'blink', x: p.x, y: p.y });
      let dist2 = 0;
      while (dist2 < cls.dodge.dist) {
        if (!this.boxFree(p.x + dx * 2, p.y + dy * 2, p.r)) break;
        p.x += dx * 2; p.y += dy * 2; dist2 += 2;
      }
      this.emit({ t: 'blink', x: p.x, y: p.y });
      p.inv = Math.max(p.inv, cls.dodge.iframes);
      this.emit({ t: 'sfx', n: 'blink' });
    } else {
      p.dodge = { t: 0, dx, dy, iframes: cls.dodge.iframes };
      this.emit({ t: 'sfx', n: 'roll' });
    }
    p.face = Math.atan2(dy, dx);
  }

  startAttack(inp, cls) {
    const p = this.p, a = cls.attack, s = this.s;
    const ang = this.aimAngle(inp, CFG.autoAimRange, CFG.autoAimCone);
    p.face = ang;
    p.cdAtk = a.cd;
    if (a.kind === 'melee') {
      let combo = 0;
      if (a.combo) { combo = p.comboT > 0 ? (p.combo + 1) % 3 : 0; p.combo = combo; p.comboT = 0.7; }
      p.act = { kind: 'swing', t: 0, hitAt: a.wind, dur: a.wind + 0.2, ang, done: false, combo, mult: a.mult * (combo === 2 ? 1.7 : 1) };
      this.emit({ t: 'sfx', n: 'swing' });
    } else {
      p.act = { kind: 'cast', t: 0, hitAt: a.wind, dur: a.wind + 0.12, ang, done: false, what: 'bolt' };
    }
  }

  startSkill(i, inp, cls) {
    const p = this.p, s = this.s;
    const sk = cls.skills[i];
    if (!isUnlocked(s, i) || p.cdSkill[i] > 0) return false;
    if (s.mp < sk.mp) { this.emit({ t: 'toast', text: 'Не хватает маны', kind: 'warn' }); this.emit({ t: 'sfx', n: 'deny' }); p.cdSkill[i] = 0.4; return false; }
    s.mp -= sk.mp;
    p.cdSkill[i] = sk.cd;
    const ang = this.aimAngle(inp, CFG.autoAimRange * 1.2, CFG.autoAimCone);
    p.face = ang;
    switch (sk.id) {
      case 'whirl': p.act = { kind: 'whirl', t: 0, hitAt: 0.18, dur: 0.46, ang, done: false }; this.emit({ t: 'sfx', n: 'swing' }); break;
      case 'roar':
        p.buffs.roar = 7; p.act = { kind: 'cast', t: 0, hitAt: 0, dur: 0.3, ang, done: true };
        this.emit({ t: 'nova', x: p.x, y: p.y, r: 36, col: '#ffcc66' }); this.emit({ t: 'sfx', n: 'roar' });
        this.emit({ t: 'toast', text: 'Боевой клич!', kind: 'info' });
        break;
      case 'fireball': p.act = { kind: 'cast', t: 0, hitAt: 0.14, dur: 0.3, ang, done: false, what: 'fireball' }; break;
      case 'nova': p.act = { kind: 'cast', t: 0, hitAt: 0.12, dur: 0.38, ang, done: false, what: 'nova' }; break;
      case 'knives': p.act = { kind: 'cast', t: 0, hitAt: 0.08, dur: 0.28, ang, done: false, what: 'knives' }; break;
      case 'shadow':
        p.buffs.shadow = 3; p.nextCrit = true; p.act = { kind: 'cast', t: 0, hitAt: 0, dur: 0.2, ang, done: true };
        this.emit({ t: 'puff', x: p.x, y: p.y, big: true, col: '#5a3a78' }); this.emit({ t: 'sfx', n: 'shadow' });
        for (const e of this.enemies) if (e.alive && !e.boss && e.aggro && e.state !== 'wind') { e.aggro = false; e.state = 'idle'; }
        break;
      default: break;
    }
    return true;
  }

  updateAct(dt, inp) {
    const p = this.p, a = p.act, st = this.stats, cls = CLASSES[this.s.cls];
    a.t += dt;
    if (!a.done && a.t >= a.hitAt) {
      a.done = true;
      switch (a.kind) {
        case 'swing': this.meleeHit(a, cls.attack, st); break;
        case 'whirl': this.whirlHit(st); break;
        case 'cast': this.castDo(a, cls, st); break;
        default: break;
      }
    }
    if (a.kind === 'swing' && a.t < a.hitAt + 0.1) {   // короткий рывок вперёд при ударе
      this.move(p, Math.cos(a.ang) * 40 * dt, Math.sin(a.ang) * 40 * dt);
    }
    if (a.t >= a.dur) p.act = null;
  }

  meleeHit(a, def, st) {
    const p = this.p;
    this.emit({ t: 'slash', x: p.x, y: p.y, ang: a.ang, range: def.range, arc: def.arc, combo: a.combo, cls: this.s.cls });
    let hits = 0;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = dist(p.x, p.y, e.x, e.y) - e.r;
      if (d > def.range) continue;
      if (angDiff(angleTo(p.x, p.y, e.x, e.y), a.ang) > def.arc / 2 + (e.r / Math.max(d + e.r, 8))) continue;
      let m = a.mult;
      if (this.s.cls === 'rogue') {
        const back = angDiff(angleTo(e.x, e.y, p.x, p.y), e.face);
        if (back > 2.0 && !e.boss) { m *= 1.5; this.emit({ t: 'text', x: e.x, y: e.y - 22, text: 'В спину!', col: '#d9a6ff' }); }
      }
      this.hurtEnemy(e, st.atk * m, { player: true, ang: a.ang, kb: def.kb * (a.combo === 2 ? 1.6 : 1) });
      hits++;
    }
    // разрушение: ничего не ломаем, зато даём звук промаха
    if (!hits) this.emit({ t: 'sfx', n: 'miss' });
  }

  whirlHit(st) {
    const p = this.p;
    this.emit({ t: 'nova', x: p.x, y: p.y, r: 36, col: '#ffe0a0', spin: true });
    this.emit({ t: 'sfx', n: 'whirl' });
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (dist(p.x, p.y, e.x, e.y) - e.r <= 34) this.hurtEnemy(e, st.atk * 1.7, { player: true, kb: 95 });
    }
  }

  castDo(a, cls, st) {
    const p = this.p;
    const at = cls.attack;
    switch (a.what) {
      case 'bolt':
        this.shoot({ x: p.x + Math.cos(a.ang) * 8, y: p.y - 4 + Math.sin(a.ang) * 8, ang: a.ang, speed: at.speed, dmg: st.atk * at.mult, from: 'p', kind: 'bolt', life: at.range / at.speed, r: 3, kb: 24 });
        this.emit({ t: 'sfx', n: 'bolt' });
        break;
      case 'fireball':
        this.shoot({ x: p.x + Math.cos(a.ang) * 8, y: p.y - 4 + Math.sin(a.ang) * 8, ang: a.ang, speed: 150, dmg: st.atk * 2.2, from: 'p', kind: 'fire', life: 1.3, r: 4, aoe: 28 });
        this.emit({ t: 'sfx', n: 'fire' });
        break;
      case 'nova':
        this.emit({ t: 'nova', x: p.x, y: p.y, r: 46, col: '#a8e0ff' });
        this.emit({ t: 'sfx', n: 'ice' });
        for (const e of this.enemies) if (e.alive && dist(p.x, p.y, e.x, e.y) - e.r <= 46) this.hurtEnemy(e, st.atk * 1.5, { player: true, kb: 50, slow: 2.5 });
        break;
      case 'knives':
        for (let i = -2; i <= 2; i++) {
          this.shoot({ x: p.x, y: p.y - 4, ang: a.ang + i * 0.2, speed: 200, dmg: st.atk * 0.9, from: 'p', kind: 'knife', life: 0.55, r: 3, kb: 20 });
        }
        this.emit({ t: 'sfx', n: 'knife' });
        break;
      default: break;
    }
  }

  // ------------------------------------------------------------- зелья
  usePotion(kind) {
    const p = this.p, s = this.s, st = this.stats;
    if (p.cdPot > 0) return false;
    const ids = kind === 'hp' ? ['p_hp1', 'p_hp2'] : ['p_mp1', 'p_mp2'];
    const cur = kind === 'hp' ? s.hp : s.mp, max = kind === 'hp' ? st.maxHp : st.maxMp;
    if (cur >= max) { this.emit({ t: 'toast', text: kind === 'hp' ? 'Здоровье полное' : 'Мана полная', kind: 'info' }); return false; }
    const have = ids.filter((id) => count(s, id) > 0);
    if (!have.length) { this.emit({ t: 'toast', text: 'Нет зелий', kind: 'warn' }); this.emit({ t: 'sfx', n: 'deny' }); return false; }
    // берём наименьшее зелье, если оно закрывает недостачу; иначе большее
    const need = max - cur;
    const small = have[0], big = have[have.length - 1];
    const id = (ITEMS[small].heal || ITEMS[small].mana) >= need * 0.8 ? small : big;
    return this.useItem(id);
  }

  useItem(id) {
    const s = this.s, st = this.stats, p = this.p, it = ITEMS[id];
    if (!it || count(s, id) < 1) return false;
    if (it.heal) {
      if (s.hp >= st.maxHp) return false;
      removeItem(s, id); s.hp = Math.min(st.maxHp, s.hp + it.heal);
      this.emit({ t: 'dmg', x: p.x, y: p.y - 12, v: it.heal, who: 'heal' }); this.emit({ t: 'sfx', n: 'potion' });
    } else if (it.mana) {
      if (s.mp >= st.maxMp) return false;
      removeItem(s, id); s.mp = Math.min(st.maxMp, s.mp + it.mana);
      this.emit({ t: 'dmg', x: p.x, y: p.y - 12, v: it.mana, who: 'mana' }); this.emit({ t: 'sfx', n: 'potion' });
    } else return false;
    p.cdPot = CFG.potionCd;
    this.emit({ t: 'stats' });
    return true;
  }

  equipItem(id) {
    if (eqItem(this.s, id)) { this.refreshStats(); this.emit({ t: 'sfx', n: 'equip' }); this.emit({ t: 'stats' }); return true; }
    return false;
  }
  unequipSlot(slot) {
    if (uneqItem(this.s, slot)) { this.refreshStats(); this.emit({ t: 'stats' }); return true; }
    return false;
  }

  // ------------------------------------------------------------- враги
  updateEnemies(dt) {
    const p = this.p;
    let boss = null;
    for (const e of this.enemies) {
      if (!e.alive) { e.t += dt; continue; }
      const d = dist(e.x, e.y, p.x, p.y);
      if (d > 380 && !e.aggro) continue;
      e.anim += dt;
      e.flash = Math.max(0, e.flash - dt); e.stun = Math.max(0, e.stun - dt); e.slow = Math.max(0, e.slow - dt);
      // нокбэк
      if (e.kbx || e.kby) {
        this.move(e, e.kbx * dt, e.kby * dt, e.def.ai === 'flier' || e.def.float ? this.wall : this.solid);
        const f = Math.pow(0.001, dt);
        e.kbx *= f; e.kby *= f;
        if (Math.abs(e.kbx) + Math.abs(e.kby) < 5) { e.kbx = 0; e.kby = 0; }
      }
      updateEnemy(this, e, dt);
      if (e.boss && e.aggro) boss = e;
    }
    // разведение
    const act = this.enemies.filter((e) => e.alive && dist(e.x, e.y, p.x, p.y) < 300);
    for (let i = 0; i < act.length; i++) {
      for (let j = i + 1; j < act.length; j++) {
        const a = act[i], b = act[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
        if (d > 0 && d < m) {
          const k = ((m - d) / d) * 0.5;
          this.move(a, -dx * k * 0.5, -dy * k * 0.5); this.move(b, dx * k * 0.5, dy * k * 0.5);
        }
      }
      // выталкивание из игрока
      const a = act[i];
      const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy), m = a.r + p.r - 1;
      if (d > 0 && d < m && !p.dodge) this.move(p, (dx / d) * (m - d) * 0.3, (dy / d) * (m - d) * 0.3);
    }
    // полоса босса
    if (boss !== this.bossE) {
      this.bossE = boss;
      this.emit({ t: 'boss', e: boss });
    }
    this.enemies = this.enemies.filter((e) => e.alive || e.t < 2.2);
  }

  // ------------------------------------------------------------- подбор
  updatePickups(dt) {
    const p = this.p, s = this.s;
    for (const q of this.pickups) {
      q.t += dt; q.life -= dt;
      q.vx *= Math.pow(0.02, dt); q.vy *= Math.pow(0.02, dt);
      if (this.boxFree(q.x + q.vx * dt, q.y + q.vy * dt, 2, this.wall)) { q.x += q.vx * dt; q.y += q.vy * dt; }
      const d = dist(q.x, q.y, p.x, p.y);
      if (q.t > 0.35 && d < CFG.magnetRange) {
        const sp = 120 + (CFG.magnetRange - d) * 4;
        q.x += ((p.x - q.x) / Math.max(d, 1)) * sp * dt; q.y += ((p.y - 4 - q.y) / Math.max(d, 1)) * sp * dt;
      }
      if (q.t > 0.3 && d < 8) {
        q.life = 0;
        if (q.id === 'gold') { s.gold += q.n; this.emit({ t: 'text', x: p.x, y: p.y - 18, text: `+${q.n}`, col: '#ffd24a' }); this.emit({ t: 'sfx', n: 'coin' }); }
        else { this.giveItem(q.id, q.n); }
        this.emit({ t: 'stats' });
      }
    }
    this.pickups = this.pickups.filter((q) => q.life > 0);
  }

  giveItem(id, n = 1, silent = false) {
    id = resolveItem(id, this.s.cls);
    if (id === 'gold') { this.s.gold += n; return; }
    addItem(this.s, id, n);
    if (!silent) {
      this.emit({ t: 'toast', text: `Получено: ${itemName(id)}${n > 1 ? ' ×' + n : ''}`, kind: ITEMS[id].type === 'quest' ? 'quest' : 'item' });
      this.emit({ t: 'sfx', n: 'item' });
    }
    this.emit({ t: 'quest', id: null, why: 'item' });
    this.emit({ t: 'stats' });
  }

  // ------------------------------------------------------------- взаимодействия
  updateInteract(inp) {
    const p = this.p, s = this.s;
    let best = null, bd = 1e9;
    const consider = (kind, ref, x, y, range, label) => {
      const d = dist(p.x, p.y, x, y);
      if (d < range && d < bd) { bd = d; best = { kind, ref, label, x, y }; }
    };
    for (const n of this.npcs) consider('npc', n, n.px, n.py, 26, 'Говорить');
    for (const c of this.chests) if (!c.open) consider('chest', c, c.px, c.py, 22, 'Открыть');
    for (const n of this.nodes) if (!n.taken) consider('node', n, n.px, n.py, 20, 'Собрать');
    for (const u of this.usables) {
      const pr = u.p;
      // расстояние до прямоугольника объекта
      const rx = clamp(p.x, pr.x * TILE, (pr.x + pr.w) * TILE), ry = clamp(p.y, pr.y * TILE, (pr.y + pr.h) * TILE);
      const d = dist(p.x, p.y, rx, ry);
      const lab = { shrine: 'Помолиться', lever: 'Потянуть', sign: 'Читать', page: 'Читать', beacon: 'Осмотреть' }[pr.use];
      if (pr.use === 'lever' && s.flags[pr.id]) continue;
      if (pr.use === 'page' && s.flags['page_' + pr.n]) continue;
      if (d < 20 && d < bd) { bd = d; best = { kind: 'use', ref: u, label: lab, x: u.px, y: u.py }; }
    }
    this.prompt = best;
    if (inp.interact && best) this.interact(best);
  }

  interact(b) {
    const s = this.s, p = this.p;
    switch (b.kind) {
      case 'npc': {
        const n = b.ref;
        if (n.id === 'pushok') { /* сценарий в planTalk */ }
        const plan = planTalk(s, n.id, this.rng);
        n.face = angleTo(n.px, n.py, p.x, p.y);
        this.emit({ t: 'talk', plan });
        this.emit({ t: 'sfx', n: 'talk' });
        break;
      }
      case 'chest': {
        const c = b.ref;
        c.open = true; s.opened[c.id] = true;
        this.emit({ t: 'sfx', n: 'chest' });
        const got = [];
        for (const [raw, n] of c.loot) {
          const id = resolveItem(raw, s.cls);
          if (id === 'gold') { s.gold += n; got.push(`${n} золота`); }
          else { addItem(s, id, n); got.push(`${itemName(id)}${n > 1 ? ' ×' + n : ''}`); }
        }
        this.emit({ t: 'toast', text: 'Сундук: ' + got.join(', '), kind: 'item' });
        this.emit({ t: 'quest', id: null, why: 'item' });
        this.emit({ t: 'stats' });
        break;
      }
      case 'node': {
        const n = b.ref;
        n.taken = true; s.opened[n.id] = true;
        this.giveItem(n.item, 1);
        break;
      }
      case 'use': this.useProp(b.ref.p); break;
      default: break;
    }
  }

  useProp(pr) {
    const s = this.s, p = this.p;
    switch (pr.use) {
      case 'shrine': {
        s.hp = this.stats.maxHp; s.mp = this.stats.maxMp;
        s.respawn = { area: this.area, x: (pr.x + pr.w / 2) * TILE, y: (pr.y + pr.h + 0.8) * TILE };
        this.emit({ t: 'toast', text: `${pr.name || 'Алтарь'}: силы восстановлены, прогресс сохранён`, kind: 'good' });
        this.emit({ t: 'nova', x: p.x, y: p.y, r: 30, col: '#ffd890' });
        this.emit({ t: 'sfx', n: 'shrine' });
        this.emit({ t: 'save' });
        this.emit({ t: 'stats' });
        break;
      }
      case 'lever': {
        s.flags[pr.id] = true;
        this.emit({ t: 'sfx', n: 'lever' });
        this.emit({ t: 'toast', text: `${pr.text}: щёлк!`, kind: 'info' });
        let opened = false;
        for (const d of this.doors) {
          const was = d.open;
          d.open = d.opens.every((f) => s.flags[f]);
          if (d.open && !was) opened = true;
        }
        this.applyDoors();
        if (opened) { this.emit({ t: 'toast', text: 'Где-то вдали открылась тяжёлая дверь…', kind: 'good' }); this.emit({ t: 'shake', v: 3 }); this.emit({ t: 'sfx', n: 'door' }); }
        break;
      }
      case 'sign': this.emit({ t: 'text', text: pr.text, panel: true, name: pr.k === 'obelisk' ? 'Надпись на камне' : 'Табличка' }); break;
      case 'page': {
        s.flags['page_' + pr.n] = true;
        this.emit({ t: 'text', text: pr.text, panel: true, name: 'Страница летописи' });
        this.giveItem('q_page', 1);
        break;
      }
      case 'beacon': {
        if (s.flags.beacon_lit) { this.emit({ t: 'text', text: 'Маяк ярко горит. Тёплый свет разгоняет тьму.', panel: true, name: 'Маяк' }); break; }
        if (s.flags.forged && s.quests.m6 && s.quests.m6.state === 'active') {
          s.flags.beacon_lit = true;
          this.emit({ t: 'beacon' });
          this.emit({ t: 'sfx', n: 'beacon' });
          this.emit({ t: 'shake', v: 4 });
          this.emit({ t: 'toast', text: 'Маяк вспыхнул! Барьер Скверны пал.', kind: 'good' });
          this.emit({ t: 'quest', id: 'm6', why: 'flag' });
        } else if (s.quests.m6 && s.quests.m6.state === 'active') {
          this.emit({ t: 'text', text: 'Маяк холоден. Сначала нужно перековать осколки: Торвальд ждёт в кузнице.', panel: true, name: 'Маяк' });
        } else {
          this.emit({ t: 'text', text: 'Холодный камень. Пламя в чаше давно погасло.', panel: true, name: 'Маяк' });
        }
        break;
      }
      default: break;
    }
  }

  // Действия диалога (вызываются из UI)
  act(a) {
    const s = this.s;
    switch (a.t) {
      case 'accept':
        if (acceptQuest(s, a.q)) {
          this.emit({ t: 'toast', text: `Новое задание: ${QUESTS[a.q].title}`, kind: 'quest' });
          this.emit({ t: 'sfx', n: 'quest' }); this.emit({ t: 'quest', id: a.q, why: 'accept' });
        }
        break;
      case 'complete': this.completeQ(a.q); break;
      case 'forge': {
        s.flags.forged = true;
        const w = `w_${{ warrior: 'war', mage: 'mag', rogue: 'rog' }[s.cls]}5`;
        addItem(s, w, 1);
        this.equipItem(w);
        this.emit({ t: 'toast', text: `Перековано: ${ITEMS[w].name}!`, kind: 'good' });
        this.emit({ t: 'sfx', n: 'forge' }); this.emit({ t: 'quest', id: 'm6', why: 'flag' });
        break;
      }
      case 'catfound':
        s.flags.cat_found = true;
        this.npcs = this.npcs.filter((n) => n.id !== 'pushok');
        this.emit({ t: 'toast', text: 'Пушок убежал домой!', kind: 'quest' }); this.emit({ t: 'quest', id: 's4', why: 'flag' });
        break;
      case 'rest': {
        const cost = 20;
        if (s.gold < cost) { this.emit({ t: 'toast', text: 'Не хватает золота', kind: 'warn' }); break; }
        s.gold -= cost; s.hp = this.stats.maxHp; s.mp = this.stats.maxMp;
        this.emit({ t: 'toast', text: 'Вы отлично выспались', kind: 'good' }); this.emit({ t: 'sfx', n: 'shrine' }); this.emit({ t: 'stats' });
        break;
      }
      default: break;
    }
  }

  completeQ(id) {
    const r = completeQuest(this.s, id);
    if (!r) return;
    this.emit({ t: 'questDone', id, reward: r });
    this.emit({ t: 'sfx', n: 'fanfare' });
    if (r.levels) { this.refreshStats(); this.emit({ t: 'levelup', lvl: this.s.lvl }); }
    for (const n of r.next) this.emit({ t: 'toast', text: `Новое задание: ${QUESTS[n].title}`, kind: 'quest' });
    this.emit({ t: 'quest', id, why: 'done' });
    this.emit({ t: 'stats' });
    this.emit({ t: 'save' });
  }

  // ------------------------------------------------------------- торговля
  shopStock(id) {
    const s = this.s;
    if (SHOPS[id].items) return SHOPS[id].items.slice();
    const tiers = [...SHOPS[id].tiers];
    if (s.quests.m5 && s.quests.m5.state === 'done') tiers.push(4);
    return Object.values(ITEMS).filter((it) => ['weapon', 'armor'].includes(it.type) && it.cls === s.cls && tiers.includes(it.tier)).map((it) => it.id);
  }
  buy(id) {
    const s = this.s, it = ITEMS[id];
    if (!it || s.gold < it.price) { this.emit({ t: 'toast', text: 'Не хватает золота', kind: 'warn' }); this.emit({ t: 'sfx', n: 'deny' }); return false; }
    s.gold -= it.price; addItem(s, id, 1);
    this.emit({ t: 'sfx', n: 'coin' }); this.emit({ t: 'stats' });
    return true;
  }
  sellPrice(id) { const it = ITEMS[id]; return it && it.type !== 'quest' ? Math.max(1, Math.floor(it.price * 0.4)) : 0; }
  sell(id) {
    const s = this.s;
    const pr = this.sellPrice(id);
    if (!pr || count(s, id) < 1) return false;
    removeItem(s, id, 1); s.gold += pr;
    this.emit({ t: 'sfx', n: 'coin' }); this.emit({ t: 'stats' });
    return true;
  }

  // ------------------------------------------------------------- зоны и порталы
  updateZones() {
    const p = this.p, s = this.s;
    for (const z of this.map.zones) {
      const inside = p.x >= z.x * TILE && p.x <= (z.x + z.w) * TILE && p.y >= z.y * TILE && p.y <= (z.y + z.h) * TILE;
      if (inside && !s.flags['zone_' + z.id]) {
        s.flags['zone_' + z.id] = true;
        this.emit({ t: 'quest', id: null, why: 'zone' });
      }
    }
  }

  updatePortals() {
    const p = this.p, s = this.s;
    this.portalMsgT = Math.max(0, this.portalMsgT - 1 / 60);
    for (const pt of this.map.portals) {
      const x1 = pt.x * TILE - 2, y1 = pt.y * TILE - 2, x2 = (pt.x + pt.w) * TILE + 2, y2 = (pt.y + pt.h) * TILE + 2;
      if (p.x < x1 || p.x > x2 || p.y < y1 || p.y > y2) continue;
      const rq = pt.req;
      if (rq && ((rq.item && !count(s, rq.item)) || (rq.flag && !s.flags[rq.flag]))) {
        if (this.portalMsgT <= 0) {
          this.portalMsgT = 2.5;
          this.emit({ t: 'toast', text: rq.msg || pt.msg, kind: 'warn' });
          this.emit({ t: 'sfx', n: 'deny' });
        }
        // отталкиваем назад к центру карты
        const a = angleTo((pt.x + pt.w / 2) * TILE, (pt.y + pt.h / 2) * TILE, this.W * TILE / 2, this.H * TILE / 2);
        p.kbx = Math.cos(a) * 70; p.kby = Math.sin(a) * 70;
        continue;
      }
      this.emit({ t: 'sfx', n: 'portal' });
      this.emit({ t: 'transition', to: pt.to, x: (pt.arrive.x) * TILE, y: pt.arrive.y * TILE });
      this.p.act = null;
      return;
    }
  }

  // вызывается UI после затемнения экрана
  travel(to, x, y) {
    this.enemies = []; this.projs = []; this.teles = [];
    this.loadArea(to, x, y);
    this.emit({ t: 'save' });
  }
}
