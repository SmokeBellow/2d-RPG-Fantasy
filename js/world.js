// Игровой мир: области, сущности, бой, лут, взаимодействия. Не зависит от DOM —
// запускается и в браузере, и в Node (тесты, бот).
import { TILE, T, TILEDEF, CFG, CLASSES, ENEMIES, ITEMS, AREAS, SHOPS } from './defs.js';
import { getMap, PROP_DEF } from './maps.js';
import { clamp, dist, angleTo, normAng, angDiff } from './util.js';
import {
  calcStats, addItem, removeItem, count, addXp, equip as eqItem, unequip as uneqItem, resolveItem, isUnlocked,
} from './state.js';
import {
  QUESTS, NODES, ENTRY, NPCS, questStatus, acceptQuest, completeQuest, onKill, itemName,
} from './quests.js';
import { favor as godFavor, godRank, GODS, GOD_IDS, templeReading } from './gods.js';
import { skillMod, respec as skillRespec, respecCost, learn as skillLearn } from './skills.js';
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
      .filter((n) => this.npcVisible(n));
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
      if (sp.showIf && !this.s.flags[sp.showIf]) continue;
      if (sp.hideIf && this.s.flags[sp.hideIf]) continue;
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
    this.emit({ t: 'music', theme: AREAS[id].music || AREAS[id].theme });
  }

  npcVisible(n) {
    const f = new Proxy(this.s.flags, { get: (o, k) => o[k] || k === 'cls_' + this.s.cls });   // флаг cls_<класс> всегда виден своему классу
    if (n.showIf && !(Array.isArray(n.showIf) ? n.showIf.every((k) => f[k]) : f[n.showIf])) return false;
    if (n.hideIf && (Array.isArray(n.hideIf) ? n.hideIf.some((k) => f[k]) : f[n.hideIf])) return false;
    return true;
  }
  refreshNpcs() {
    const have = new Set(this.npcs.map((n) => n.id));
    const map = this.map;
    this.npcs = this.npcs.filter((n) => this.npcVisible(n));
    for (const n of map.npcs) {
      if (!have.has(n.id) && this.npcVisible(n)) this.npcs.push({ ...n, px: (n.x + 0.5) * TILE, py: (n.y + 0.5) * TILE, t: 0 });
    }
  }

  // двери и барьеры открываются и по флагам, поставленным диалогом (не только рычагом)
  syncDoors() {
    let changed = false;
    for (const d of this.doors || []) { const o = d.opens.every((f) => this.s.flags[f]); if (o !== d.open) { d.open = o; changed = true; } }
    if (changed) this.applyDoors();
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
      act: null, cdAtk: 0, cdSkill: [0, 0, 0], cdDodge: 0, cdPot: 0, cdLik: 0, inv: 0, hurt: 0, dead: false,
      buffs: { roar: 0, shadow: 0, slow: 0, web: 0, lik: 0 }, lik: null, critCharges: 0, nextCrit: false, combo: 0, comboT: 0, dodge: null,
      kbx: 0, kby: 0, lavaT: 0, regenAcc: 0, mpAcc: 0, hpAcc: 0,
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
    const p = this.p, st = this.stats;
    if (p.dead || p.inv > 0 || (p.dodge && p.dodge.iframes > 0 && !o.unavoidable)) return false;
    if (st.dodgePct && !o.unavoidable && Math.random() < st.dodgePct) {
      this.emit({ t: 'text', x: p.x, y: p.y - 18, text: 'Мимо!', col: '#d9a6ff' });
      p.inv = 0.25;
      return false;
    }
    let d = dmg * (1 - st.def / (st.def + 40));
    if (p.buffs.roar > 0) d *= 0.7;
    d *= 1 - st.drPct;
    const lik = p.buffs.lik > 0 ? p.lik : null;
    if (lik && lik.god === 'lyara') d *= 0.7;
    if (lik && lik.god === 'torn') { d *= 0.4; o = { ...o, kb: 0 }; }
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
    const st = this.stats, p = this.p;
    const lik = p.buffs.lik > 0 ? p.lik : null;
    let crit = false;
    if (o.player) {
      let cc = st.crit + (lik && lik.god === 'seyr' ? 0.5 : 0);
      if (o.canCrit !== false && (p.nextCrit || p.critCharges > 0 || Math.random() < cc)) {
        crit = true;
        dmg *= p.nextCrit ? 3 + st.critDmg : 1.8 + st.critDmg;
        if (p.nextCrit) p.nextCrit = false; else if (p.critCharges > 0) p.critCharges--;
      }
      dmg *= 0.92 + Math.random() * 0.16;
      if (p.buffs.roar > 0) dmg *= 1.35;
      if (lik && lik.god === 'kharn') dmg *= 1.6;
      if (e.boss && st.bossDmg) dmg *= 1 + st.bossDmg;
    }
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg;
    e.flash = 0.12;
    if (o.player) {
      const ls = st.lifesteal + (lik && lik.god === 'kharn' ? 0.15 : 0);
      if (ls > 0) this.healPlayer(dmg * ls, true);
    }
    if (!e.aggro && !e.boss) this.alert(e);
    e.aggro = true;
    const ang = o.ang != null ? o.ang : angleTo(p.x, p.y, e.x, e.y);
    const kb = (o.kb || 0) * (e.boss ? 0.15 : 1) * (e.def.hop ? 1.2 : 1);
    if (kb) { e.kbx += Math.cos(ang) * kb; e.kby += Math.sin(ang) * kb; if (!e.boss) e.stun = Math.max(e.stun, 0.12); }
    if (o.slow && !e.boss) e.slow = Math.max(e.slow, o.slow);
    if (o.stun && !e.boss) e.stun = Math.max(e.stun, o.stun);
    this.emit({ t: 'dmg', x: e.x, y: e.y - e.r - 8, v: dmg, crit, who: 'e', big: dmg > 30 });
    this.emit({ t: 'hit', x: e.x, y: e.y - 4, ang, crit });
    this.emit({ t: 'sfx', n: crit ? 'crit' : 'hit' });
    if (e.yields && e.hp <= e.maxHp * 0.2) { this.yieldEnemy(e); return true; }   // дуэль: соперник сдаётся
    if (e.hp <= 0) this.killEnemy(e);
    return true;
  }

  // дуэль до сдачи (эффект 'duel'): враг складывает оружие и снова становится NPC, ставится флаг y_<id>
  yieldEnemy(e) {
    e.alive = false; e.state = 'dead';
    this.enemies = this.enemies.filter((q) => q !== e);
    this.s.flags['y_' + e.unique] = true;
    this.npcs = this.npcs.filter((q) => q.id !== e.unique);
    const base = this.map.npcs.find((q) => q.id === e.unique);
    if (base) this.npcs.push({ ...base, px: e.x, py: e.y, t: 0 });
    if (e.def.boss) { this.emit({ t: 'boss', e: null }); this.bossE = null; }
    this.teles.length = 0; this.projs = this.projs.filter((q) => q.from === 'p');
    this.emit({ t: 'toast', text: `${e.def.name} сдаётся`, kind: 'good' });
    this.emit({ t: 'shake', v: 3 });
    this.emit({ t: 'quest', id: null, why: 'flag' });
  }

  healPlayer(n, quiet = false) {
    const s = this.s, st = this.stats;
    const before = s.hp;
    s.hp = Math.min(st.maxHp, s.hp + n);
    if (!quiet && s.hp > before) this.emit({ t: 'dmg', x: this.p.x, y: this.p.y - 12, v: Math.round(s.hp - before), who: 'heal' });
  }

  alert(e) {
    for (const o of this.enemies) {
      if (o.alive && !o.aggro && !o.boss && o.type === e.type && dist(o.x, o.y, e.x, e.y) < 80) o.aggro = true;
    }
  }

  killEnemy(e) {
    e.alive = false; e.state = 'dead'; e.t = 0;
    const s = this.s, st = this.stats, p = this.p;
    s.kills++;
    const d = e.def;
    const xp = Math.round(d.xp * e.xpMul);
    const lv = addXp(s, xp);
    this.emit({ t: 'xp', x: e.x, y: e.y - 14, v: xp });
    this.emit({ t: 'sfx', n: d.boss ? 'bossdie' : 'die' });
    this.emit({ t: 'puff', x: e.x, y: e.y, big: !!d.boss, col: d.color || '#c8c8d0' });
    if (lv) { this.refreshStats(); this.emit({ t: 'levelup', lvl: s.lvl }); }
    if (st.killHeal) this.healPlayer(st.killHeal, true);
    if (e.unique) { s.killed[e.unique] = true; s.flags['k_' + e.unique] = true; }
    for (const id of onKill(s, e.type, e.unique)) this.emit({ t: 'quest', id, why: 'kill' });
    // золото (Лик Сейра удваивает)
    const lik = p.buffs.lik > 0 ? p.lik : null;
    let g = d.gold ? d.gold[0] + Math.floor(Math.random() * (d.gold[1] - d.gold[0] + 1)) : 0;
    g = Math.round(g * (1 + st.goldPct) * (lik && lik.god === 'seyr' ? 2 : 1));
    if (g > 0) this.drop('gold', g, e.x, e.y);
    // предметы
    for (const [id, ch] of d.drops || []) if (Math.random() < ch) this.drop(id, 1, e.x, e.y);
    if (!d.boss) {
      if (Math.random() < 0.09) this.drop(Math.random() < 0.6 ? 'p_hp1' : 'p_mp1', 1, e.x, e.y);
      if (e.lvl >= 8 && Math.random() < 0.05) this.drop(Math.random() < 0.6 ? 'p_hp2' : 'p_mp2', 1, e.x, e.y);
      if (e.lvl >= 14 && Math.random() < 0.04) this.drop(Math.random() < 0.6 ? 'p_hp3' : 'p_mp3', 1, e.x, e.y);
    }
    if (d.boss) {
      this.emit({ t: 'boss', e: null }); this.bossE = null;
      this.emit({ t: 'toast', text: `${d.title || d.name} повержен!`, kind: 'good' });
      this.emit({ t: 'shake', v: 6 });
      for (const o of this.enemies) if (o.alive && o.summoned) { o.hp = 0; o.alive = false; o.state = 'dead'; }
      this.teles.length = 0; this.projs = this.projs.filter((q) => q.from === 'p');
      if (e.type === 'oldone') this.emit({ t: 'finale' });
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
    p.cdLik = Math.max(0, p.cdLik - dt);
    for (let i = 0; i < 3; i++) p.cdSkill[i] = Math.max(0, p.cdSkill[i] - dt);
    if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.combo = 0; }
    const lik = p.buffs.lik > 0 ? p.lik : null;
    // регенерация здоровья и маны
    let hpRegen = st.hpRegen;
    if (lik && lik.god === 'lyara') hpRegen += st.maxHp * 0.06 * lik.pot;
    if (lik && lik.god === 'mara') hpRegen += st.maxHp * 0.03 * lik.pot;
    if (hpRegen > 0 && s.hp < st.maxHp) { p.hpAcc += hpRegen * dt; if (p.hpAcc >= 1) { const n = Math.floor(p.hpAcc); s.hp = Math.min(st.maxHp, s.hp + n); p.hpAcc -= n; } }
    p.mpAcc += st.mpRegen * (lik && lik.god === 'ori' ? 4 : 1) * dt;
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
    p.moving = ml > 0.1 && !p.dodge && !(p.act && p.act.kind === 'dance');
    if (p.moving) {
      let speed = CFG.playerSpeed * st.spd * (p.buffs.web > 0 ? 0.55 : 1) * (lik && lik.god === 'kharn' ? 1.25 : 1);
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
    if (inp.lik) this.useLik();
    if (!p.dodge && !p.act) {
      for (let i = 0; i < 3; i++) {
        if (inp.skill && inp.skill[i]) { if (this.startSkill(i, inp, cls)) break; }
      }
      if (!p.act && inp.attack && p.cdAtk <= 0) this.startAttack(inp, cls);
    }
  }

  startDodge(inp, cls) {
    const p = this.p, st = this.stats;
    let dx = inp.mx || 0, dy = inp.my || 0;
    if (!dx && !dy) { dx = Math.cos(p.face + Math.PI); dy = Math.sin(p.face + Math.PI); }   // без направления — шаг назад
    const l = Math.hypot(dx, dy); dx /= l; dy /= l;
    p.cdDodge = Math.max(0.3, CFG.dodgeCd - st.dodgeCd);
    const iframes = cls.dodge.iframes + st.dodgeIframes;
    if (cls.dodge.blink) {
      this.emit({ t: 'blink', x: p.x, y: p.y });
      let dist2 = 0;
      while (dist2 < cls.dodge.dist) {
        if (!this.boxFree(p.x + dx * 2, p.y + dy * 2, p.r)) break;
        p.x += dx * 2; p.y += dy * 2; dist2 += 2;
      }
      this.emit({ t: 'blink', x: p.x, y: p.y });
      p.inv = Math.max(p.inv, iframes);
      this.emit({ t: 'sfx', n: 'blink' });
    } else {
      p.dodge = { t: 0, dx, dy, iframes };
      this.emit({ t: 'sfx', n: 'roll' });
    }
    p.face = Math.atan2(dy, dx);
  }

  startAttack(inp, cls) {
    const p = this.p, a = cls.attack, s = this.s, st = this.stats;
    const ang = this.aimAngle(inp, CFG.autoAimRange, CFG.autoAimCone);
    p.face = ang;
    p.cdAtk = a.cd * (1 - st.atkSpeed);
    if (a.kind === 'melee') {
      let combo = 0;
      if (a.combo) { combo = p.comboT > 0 ? (p.combo + 1) % 3 : 0; p.combo = combo; p.comboT = 0.7; }
      p.act = { kind: 'swing', t: 0, hitAt: a.wind, dur: a.wind + 0.2, ang, done: false, combo, mult: a.mult * (combo === 2 ? 1.7 + st.comboBonus : 1) };
      this.emit({ t: 'sfx', n: 'swing' });
    } else {
      p.act = { kind: 'cast', t: 0, hitAt: a.wind, dur: a.wind + 0.12, ang, done: false, what: 'bolt' };
    }
  }

  // стоимость и перезарядка с учётом улучшений и пассивок
  skillInfo(i) {
    const s = this.s, st = this.stats, sk = CLASSES[s.cls].skills[i];
    const mod = skillMod(s, sk.id);
    const mp = Math.max(1, Math.round((sk.mp + mod.mp) * (1 - st.mpCost)));
    const cd = Math.max(0.6, (sk.cd + mod.cd) * (1 - st.cdr));
    return { sk, mod, mp, cd };
  }

  startSkill(i, inp, cls) {
    const p = this.p, s = this.s;
    const { sk, mod, mp, cd } = this.skillInfo(i);
    if (!isUnlocked(s, i) || p.cdSkill[i] > 0) return false;
    if (s.mp < mp) { this.emit({ t: 'toast', text: 'Не хватает маны', kind: 'warn' }); this.emit({ t: 'sfx', n: 'deny' }); p.cdSkill[i] = 0.4; return false; }
    s.mp -= mp;
    p.cdSkill[i] = cd;
    const ang = this.aimAngle(inp, CFG.autoAimRange * 1.2, CFG.autoAimCone);
    p.face = ang;
    switch (sk.id) {
      case 'whirl': p.act = { kind: 'whirl', t: 0, hitAt: 0.18, dur: 0.46, ang, done: false }; this.emit({ t: 'sfx', n: 'swing' }); break;
      case 'roar':
        p.buffs.roar = 7 + mod.dur; p.act = { kind: 'cast', t: 0, hitAt: 0, dur: 0.3, ang, done: true };
        this.emit({ t: 'nova', x: p.x, y: p.y, r: 36, col: '#ffcc66' }); this.emit({ t: 'sfx', n: 'roar' });
        this.emit({ t: 'toast', text: 'Боевой клич!', kind: 'info' });
        break;
      case 'slam': p.act = { kind: 'cast', t: 0, hitAt: 0.24, dur: 0.5, ang, done: false, what: 'slam' }; this.emit({ t: 'sfx', n: 'swing' }); break;
      case 'fireball': p.act = { kind: 'cast', t: 0, hitAt: 0.14, dur: 0.3, ang, done: false, what: 'fireball' }; break;
      case 'nova': p.act = { kind: 'cast', t: 0, hitAt: 0.12, dur: 0.38, ang, done: false, what: 'nova' }; break;
      case 'chain': p.act = { kind: 'cast', t: 0, hitAt: 0.14, dur: 0.34, ang, done: false, what: 'chain' }; break;
      case 'knives': p.act = { kind: 'cast', t: 0, hitAt: 0.08, dur: 0.28, ang, done: false, what: 'knives' }; break;
      case 'dance':
        p.act = { kind: 'dance', t: 0, hitAt: 99, dur: 0.36, ang, done: false, hits: 0 };
        p.inv = Math.max(p.inv, 0.4); this.emit({ t: 'sfx', n: 'roll' });
        break;
      case 'shadow':
        p.buffs.shadow = 3 + mod.dur; p.nextCrit = true; p.act = { kind: 'cast', t: 0, hitAt: 0, dur: 0.2, ang, done: true };
        this.emit({ t: 'puff', x: p.x, y: p.y, big: true, col: '#5a3a78' }); this.emit({ t: 'sfx', n: 'shadow' });
        for (const e of this.enemies) if (e.alive && !e.boss && e.aggro && e.state !== 'wind') { e.aggro = false; e.state = 'idle'; }
        break;
      default: break;
    }
    return true;
  }

  // Лик: временная форма аватара бога. Сила растёт с рангом (на «Избраннике» ×1,3)
  useLik() {
    const p = this.p, s = this.s, st = this.stats;
    const id = s.equip.lik;
    if (!id) { this.emit({ t: 'toast', text: 'У тебя нет надетого Лика', kind: 'info' }); return false; }
    if (p.cdLik > 0) return false;
    const god = ITEMS[id].god;
    const rank = godRank(s, god);
    if (rank < 2) { this.emit({ t: 'toast', text: `${GODS[god].name} молчит. Лик не откликается`, kind: 'warn' }); this.emit({ t: 'sfx', n: 'deny' }); p.cdLik = 3; return false; }
    if (s.mp < CFG.likMp) { this.emit({ t: 'toast', text: 'Не хватает маны', kind: 'warn' }); return false; }
    s.mp -= CFG.likMp;
    p.cdLik = CFG.likCd * (1 - st.cdr);
    const pot = rank >= 4 ? 1.3 : 1;
    const dur = god === 'seyr' || god === 'kharn' ? 12 : god === 'issa' ? 8 : 10;
    p.lik = { god, pot };
    p.buffs.lik = dur;
    if (god === 'ori') { p.cdSkill = [0, 0, 0]; p.cdDodge = 0; }
    if (god === 'mara') for (const e of this.enemies) if (e.alive && dist(e.x, e.y, p.x, p.y) < 70) { if (e.boss) e.slow = 3; else e.stun = Math.max(e.stun, 3); }
    if (god === 'issa') { p.buffs.shadow = 8; p.critCharges = 3; for (const e of this.enemies) if (e.alive && !e.boss && e.aggro) { e.aggro = false; e.state = 'idle'; } }
    this.emit({ t: 'lik', god, x: p.x, y: p.y, color: GODS[god].color });
    this.emit({ t: 'sfx', n: 'lik' });
    this.emit({ t: 'toast', text: ITEMS[id].name, kind: 'good' });
    return true;
  }

  updateAct(dt, inp) {
    const p = this.p, a = p.act, st = this.stats, cls = CLASSES[this.s.cls];
    a.t += dt;
    if (a.kind === 'dance') { this.danceStep(a, dt, st); if (a.t >= a.dur) p.act = null; return; }
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

  // Танец клинков: рывок и три серии ударов по всем врагам рядом
  danceStep(a, dt, st) {
    const p = this.p;
    const mod = skillMod(this.s, 'dance');
    this.move(p, Math.cos(a.ang) * (70 / 0.3) * dt, Math.sin(a.ang) * (70 / 0.3) * dt);
    p.inv = Math.max(p.inv, 0.1);
    const due = Math.floor(a.t / 0.1);
    while (a.hits < Math.min(3, due)) {
      a.hits++;
      this.emit({ t: 'slash', x: p.x, y: p.y, ang: a.ang + (a.hits % 2 ? 0.5 : -0.5), range: 24, arc: 2.4, combo: a.hits, cls: 'rogue' });
      this.emit({ t: 'sfx', n: 'swing' });
      for (const e of this.enemies) if (e.alive && dist(p.x, p.y, e.x, e.y) - e.r <= 24) this.hurtEnemy(e, st.atk * (1.1 + mod.dmg), { player: true, kb: 30 });
    }
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
        if (back > 2.0 && !e.boss) { m *= 1.5 + st.backstab; this.emit({ t: 'text', x: e.x, y: e.y - 22, text: 'В спину!', col: '#d9a6ff' }); }
      }
      this.hurtEnemy(e, st.atk * m, { player: true, ang: a.ang, kb: def.kb * (a.combo === 2 ? 1.6 : 1) });
      hits++;
    }
    if (!hits) this.emit({ t: 'sfx', n: 'miss' });
  }

  whirlHit(st) {
    const p = this.p;
    const mod = skillMod(this.s, 'whirl');
    this.emit({ t: 'nova', x: p.x, y: p.y, r: 36, col: '#ffe0a0', spin: true });
    this.emit({ t: 'sfx', n: 'whirl' });
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (dist(p.x, p.y, e.x, e.y) - e.r <= 34) this.hurtEnemy(e, st.atk * (1.7 + mod.dmg), { player: true, kb: 95 });
    }
  }

  castDo(a, cls, st) {
    const p = this.p, s = this.s;
    const at = cls.attack;
    const mod = (id) => skillMod(s, id);
    switch (a.what) {
      case 'bolt':
        this.shoot({ x: p.x + Math.cos(a.ang) * 8, y: p.y - 4 + Math.sin(a.ang) * 8, ang: a.ang, speed: at.speed, dmg: st.atk * at.mult, from: 'p', kind: 'bolt', life: at.range / at.speed, r: 3, kb: 24 });
        this.emit({ t: 'sfx', n: 'bolt' });
        break;
      case 'fireball': {
        const m = mod('fireball');
        this.shoot({ x: p.x + Math.cos(a.ang) * 8, y: p.y - 4 + Math.sin(a.ang) * 8, ang: a.ang, speed: 150, dmg: st.atk * (2.2 + m.dmg), from: 'p', kind: 'fire', life: 1.3, r: 4, aoe: 28 + m.aoe });
        this.emit({ t: 'sfx', n: 'fire' });
        break;
      }
      case 'nova': {
        const m = mod('nova');
        this.emit({ t: 'nova', x: p.x, y: p.y, r: 46, col: '#a8e0ff' });
        this.emit({ t: 'sfx', n: 'ice' });
        for (const e of this.enemies) if (e.alive && dist(p.x, p.y, e.x, e.y) - e.r <= 46) this.hurtEnemy(e, st.atk * (1.5 + m.dmg), { player: true, kb: 50, slow: 2.5 + m.slow });
        break;
      }
      case 'knives': {
        const m = mod('knives');
        for (let i = -2; i <= 2; i++) {
          this.shoot({ x: p.x, y: p.y - 4, ang: a.ang + i * 0.2, speed: 200, dmg: st.atk * (0.9 + m.dmg), from: 'p', kind: 'knife', life: 0.55, r: 3, kb: 20 });
        }
        this.emit({ t: 'sfx', n: 'knife' });
        break;
      }
      case 'slam': {
        const m = mod('slam');
        const cx = p.x + Math.cos(a.ang) * 24, cy = p.y + Math.sin(a.ang) * 24;
        this.emit({ t: 'boom', x: cx, y: cy, r: 40, col: '#e8c080', hard: true });
        this.emit({ t: 'shake', v: 3 }); this.emit({ t: 'sfx', n: 'slam' });
        for (const e of this.enemies) if (e.alive && dist(cx, cy, e.x, e.y) - e.r <= 40) this.hurtEnemy(e, st.atk * (2.4 + m.dmg), { player: true, kb: 110, stun: 1.2, ang: angleTo(cx, cy, e.x, e.y) });
        break;
      }
      case 'chain': {
        const m = mod('chain');
        const maxT = 3 + m.targets;
        const hit = new Set();
        let from = { x: p.x, y: p.y - 6 };
        const pts = [[from.x, from.y]];
        let cur = null, bd = 1e9;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const d = dist(p.x, p.y, e.x, e.y);
          if (d > 150) continue;
          const sc = d * (1 + angDiff(angleTo(p.x, p.y, e.x, e.y), a.ang));
          if (sc < bd) { bd = sc; cur = e; }
        }
        for (let k = 0; k < maxT && cur; k++) {
          hit.add(cur); pts.push([cur.x, cur.y - 4]);
          this.hurtEnemy(cur, st.atk * (1.7 + m.dmg), { player: true, kb: 20, ang: angleTo(from.x, from.y, cur.x, cur.y) });
          from = cur;
          let nx = null, nd = 80;
          for (const e of this.enemies) if (e.alive && !hit.has(e)) { const d = dist(cur.x, cur.y, e.x, e.y); if (d < nd) { nd = d; nx = e; } }
          cur = nx;
        }
        if (pts.length === 1) pts.push([p.x + Math.cos(a.ang) * 90, p.y - 6 + Math.sin(a.ang) * 90]);
        this.emit({ t: 'lightning', pts });
        this.emit({ t: 'sfx', n: 'zap' });
        break;
      }
      default: break;
    }
  }

  // ------------------------------------------------------------- зелья
  usePotion(kind) {
    const p = this.p, s = this.s, st = this.stats;
    if (p.cdPot > 0) return false;
    const ids = kind === 'hp' ? ['p_hp1', 'p_hp2', 'p_hp3'] : ['p_mp1', 'p_mp2', 'p_mp3'];
    const cur = kind === 'hp' ? s.hp : s.mp, max = kind === 'hp' ? st.maxHp : st.maxMp;
    if (cur >= max) { this.emit({ t: 'toast', text: kind === 'hp' ? 'Здоровье полное' : 'Мана полная', kind: 'info' }); return false; }
    const have = ids.filter((id) => count(s, id) > 0);
    if (!have.length) { this.emit({ t: 'toast', text: 'Нет зелий', kind: 'warn' }); this.emit({ t: 'sfx', n: 'deny' }); return false; }
    // берём наименьшее зелье, закрывающее недостачу; иначе самое большое
    const need = max - cur;
    const pw = (id) => (ITEMS[id].heal || ITEMS[id].mana) * (1 + st.potionPct);
    const id = have.find((h) => pw(h) >= need * 0.8) || have[have.length - 1];
    return this.useItem(id);
  }

  useItem(id) {
    const s = this.s, st = this.stats, p = this.p, it = ITEMS[id];
    if (!it || count(s, id) < 1) return false;
    const k = 1 + st.potionPct;
    if (it.heal) {
      if (s.hp >= st.maxHp) return false;
      removeItem(s, id); const v = Math.round(it.heal * k); s.hp = Math.min(st.maxHp, s.hp + v);
      this.emit({ t: 'dmg', x: p.x, y: p.y - 12, v, who: 'heal' }); this.emit({ t: 'sfx', n: 'potion' });
    } else if (it.mana) {
      if (s.mp >= st.maxMp) return false;
      removeItem(s, id); const v = Math.round(it.mana * k); s.mp = Math.min(st.maxMp, s.mp + v);
      this.emit({ t: 'dmg', x: p.x, y: p.y - 12, v, who: 'mana' }); this.emit({ t: 'sfx', n: 'potion' });
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
    // меньше счёт — важнее: NPC и сундуки перебивают таблички, даже если табличка ближе
    const consider = (kind, ref, x, y, range, label, bias = 0) => {
      const d = dist(p.x, p.y, x, y);
      if (d < range && d + bias < bd) { bd = d + bias; best = { kind, ref, label, x, y }; }
    };
    for (const n of this.npcs) consider('npc', n, n.px, n.py, 26, 'Говорить', -8);
    for (const c of this.chests) if (!c.open) consider('chest', c, c.px, c.py, 22, 'Открыть', -4);
    for (const n of this.nodes) if (!n.taken) consider('node', n, n.px, n.py, 20, 'Собрать', -4);
    for (const u of this.usables) {
      const pr = u.p;
      // расстояние до прямоугольника объекта
      const rx = clamp(p.x, pr.x * TILE, (pr.x + pr.w) * TILE), ry = clamp(p.y, pr.y * TILE, (pr.y + pr.h) * TILE);
      const d = dist(p.x, p.y, rx, ry);
      const lab = { shrine: 'Помолиться', lever: 'Потянуть', sign: 'Читать', page: 'Читать', beacon: 'Осмотреть', altar: 'Осмотреть' }[pr.use];
      if (pr.use === 'lever' && s.flags[pr.id]) continue;
      const bias = pr.use === 'sign' ? 10 : 0;
      if (d < 24 && d + bias < bd) { bd = d + bias; best = { kind: 'use', ref: u, label: lab, x: u.px, y: u.py }; }
    }
    this.prompt = best;
    if (inp.interact && best) this.interact(best);
  }

  interact(b) {
    const s = this.s, p = this.p;
    switch (b.kind) {
      case 'npc': {
        const n = b.ref;
        n.face = angleTo(n.px, n.py, p.x, p.y);
        this.talk(n);
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
      case 'sign': this.emit({ t: 'text', text: pr.text, panel: true, name: pr.title || (pr.k === 'obelisk' ? 'Надпись на камне' : 'Табличка') }); break;
      case 'page': {
        this.emit({ t: 'text', text: pr.text, panel: true, name: pr.title || 'Запись' });
        if (!s.flags['read_' + pr.id]) { s.flags['read_' + pr.id] = true; if (pr.fx) this.applyFx(pr.fx); this.emit({ t: 'quest', id: null, why: 'flag' }); }
        break;
      }
      case 'beacon': {
        // три маяка: у каждого своё сердце. Вернуть сердце на место значит вернуть маяку голос
        const n = pr.beacon || 1;
        const core = { 1: 'q_core', 2: 'q_core2', 3: 'q_core3' }[n];
        if (s.flags['beacon' + n]) { this.emit({ t: 'text', text: 'Маяк звучит ровно. Низкий звук слышен даже сквозь стены.', panel: true, name: 'Маяк' }); break; }
        if (count(s, core) > 0) {
          removeItem(s, core, 1); s.flags['beacon' + n] = true;
          this.emit({ t: 'beacon', id: n });
          this.emit({ t: 'sfx', n: 'beacon' }); this.emit({ t: 'shake', v: 4 });
          this.emit({ t: 'toast', text: 'Маяк снова звучит. Излучение вокруг стихает.', kind: 'good' });
          this.emit({ t: 'quest', id: null, why: 'flag' }); this.emit({ t: 'stats' });
        } else this.emit({ t: 'text', text: pr.silent || 'Маяк молчит. Внутри пустое гнездо там, где должно быть сердце.', panel: true, name: 'Маяк' });
        break;
      }
      case 'altar': this.emit({ t: 'text', text: pr.text, panel: true, name: pr.title || 'Алтарь' }); break;
      default: break;
    }
  }

  // ------------------------------------------------------------- диалоги
  // Узлы лежат в story_*.js. Вход в разговор выбирает ENTRY[npc]; дальше UI ходит по выборам.
  talk(n) {
    const s = this.s;
    this.talkNpc = n;
    const fn = ENTRY[n.id];
    let id = fn ? fn(s, this) : null;
    if (!id || !NODES[id]) id = NODES['idle_' + n.id] ? 'idle_' + n.id : 'idle_default';
    this.emit({ t: 'sfx', n: 'talk' });
    this.emit({ t: 'talk', plan: this.openNode(id) });
  }

  openNode(id) {
    const s = this.s, node = NODES[id];
    if (!node) return null;
    if (node.fx) this.applyFx(node.fx);
    const npc = this.talkNpc;
    const lines = typeof node.t === 'function' ? node.t(s, this) : node.t;
    const choices = (node.c || []).filter((c) => !c.cond || c.cond(s, this));
    return {
      id,
      name: node.n === undefined ? (npc && NPCS[npc.id] ? NPCS[npc.id].name : '') : node.n,
      lines: lines.length ? lines : ['…'],
      choices: choices.length ? choices : [{ label: 'Уйти', go: null, fx: [] }],
      npcId: npc ? npc.id : null,
    };
  }

  // игрок выбрал вариант: эффекты, затем следующий узел (или конец разговора)
  choose(ch) {
    if (ch.fx && ch.fx.length) this.applyFx(ch.fx);
    if (ch.go) return this.openNode(ch.go);
    return null;
  }

  favor(god, delta) {
    const changes = godFavor(this.s, god, delta);
    for (const c of changes) {
      this.emit({ t: 'omen', god: c.god, up: c.to > c.from, name: GODS[c.god].name, color: GODS[c.god].color });
    }
    if (changes.length) this.refreshStats();
    return changes;
  }

  applyFx(list) {
    const s = this.s;
    for (const fx of list || []) {
      const [op, a, b, c] = fx;
      switch (op) {
        case 'f': s.flags[a] = true; this.syncDoors(); this.emit({ t: 'quest', id: null, why: 'flag' }); break;
        case 'uf': delete s.flags[a]; break;
        case 'q+':
          if (acceptQuest(s, a)) {
            this.emit({ t: 'toast', text: `Новое задание: ${QUESTS[a].title}`, kind: 'quest' });
            this.emit({ t: 'sfx', n: 'quest' }); this.emit({ t: 'quest', id: a, why: 'accept' });
          }
          break;
        case 'q!': this.completeQ(a); break;
        case 'god': this.favor(a, b); break;
        case 'item': this.giveItem(a, b || 1); break;
        case 'take': removeItem(s, a, b || 1); this.emit({ t: 'quest', id: null, why: 'item' }); this.emit({ t: 'stats' }); break;
        case 'gold': s.gold = Math.max(0, s.gold + a); this.emit({ t: 'toast', text: a >= 0 ? `+${a} золота` : `−${-a} золота`, kind: 'item' }); this.emit({ t: 'sfx', n: 'coin' }); this.emit({ t: 'stats' }); break;
        case 'xp': {
          const lv = addXp(s, a);
          this.emit({ t: 'toast', text: `+${a} опыта`, kind: 'info' });
          if (lv) { this.refreshStats(); this.emit({ t: 'levelup', lvl: s.lvl }); }
          this.emit({ t: 'stats' });
          break;
        }
        case 'sp': s.spBonus = (s.spBonus || 0) + a; this.emit({ t: 'toast', text: `Очки навыков: +${a}`, kind: 'good' }); this.emit({ t: 'stats' }); break;
        case 'shop': this.emit({ t: 'shop', id: a }); break;
        case 'rest': {
          if (s.gold < a) { this.emit({ t: 'toast', text: 'Не хватает золота', kind: 'warn' }); break; }
          s.gold -= a; s.hp = this.stats.maxHp; s.mp = this.stats.maxMp;
          this.emit({ t: 'toast', text: 'Вы отлично выспались', kind: 'good' }); this.emit({ t: 'sfx', n: 'shrine' }); this.emit({ t: 'stats' });
          break;
        }
        case 'heal': s.hp = this.stats.maxHp; s.mp = this.stats.maxMp; this.emit({ t: 'stats' }); break;
        case 'choice': s.choices[a] = b === undefined ? true : b; break;
        case 'respec':
          if (skillRespec(s)) { this.refreshStats(); this.emit({ t: 'toast', text: 'Навыки сброшены. Очки возвращены', kind: 'good' }); this.emit({ t: 'stats' }); } else this.emit({ t: 'toast', text: 'Не хватает золота или нечего сбрасывать', kind: 'warn' });
          break;
        case 'fight': {
          // [fight, тип врага, id NPC, уровень]: NPC превращается во врага на том же месте
          const n = this.npcs.find((q) => q.id === b);
          if (!n) break;
          this.npcs = this.npcs.filter((q) => q !== n);
          const e = this.spawnEnemy(a, n.px, n.py, c || 5, b);
          e.aggro = true;
          this.emit({ t: 'bossIntro2', name: ENEMIES[a].title || ENEMIES[a].name });
          break;
        }
        case 'duel': {
          // [duel, тип врага, id NPC, уровень]: как fight, но при 20% здоровья соперник сдаётся (флаг y_<id>), убить его уже нельзя в бою
          const n = this.npcs.find((q) => q.id === b);
          if (!n) break;
          this.npcs = this.npcs.filter((q) => q !== n);
          const e = this.spawnEnemy(a, n.px, n.py, c || 5, b, { yields: true });
          e.aggro = true;
          this.emit({ t: 'bossIntro2', name: ENEMIES[a].title || ENEMIES[a].name });
          break;
        }
        case 'stash': {
          // убрать зелья в «депозит» (честный бой); 'unstash' вернуть
          s.stash = s.stash || {};
          for (const id of Object.keys(s.inv)) if (ITEMS[id] && ITEMS[id].type === 'potion') { s.stash[id] = (s.stash[id] || 0) + s.inv[id]; delete s.inv[id]; }
          this.emit({ t: 'stats' });
          break;
        }
        case 'unstash': {
          for (const [id, k] of Object.entries(s.stash || {})) addItem(s, id, k);
          s.stash = {};
          this.emit({ t: 'stats' });
          break;
        }
        case 'beacon': break;
        case 'end': this.emit({ t: 'ending', id: a }); break;
        case 'toast': this.emit({ t: 'toast', text: a, kind: b || 'info' }); break;
        case 'travel': this.emit({ t: 'transition', to: a, x: b * TILE, y: c * TILE }); break;
        case 'refresh': this.refreshNpcs(); break;
        default: break;
      }
    }
    this.refreshNpcs();
  }

  completeQ(id) {
    const r = completeQuest(this.s, id);
    if (!r) return;
    this.emit({ t: 'questDone', id, reward: r });
    this.emit({ t: 'sfx', n: 'fanfare' });
    if (r.levels) { this.refreshStats(); this.emit({ t: 'levelup', lvl: this.s.lvl }); }
    if (r.sp) this.emit({ t: 'toast', text: `Очки навыков: +${r.sp}`, kind: 'good' });
    for (const c of r.changes) this.emit({ t: 'omen', god: c.god, up: c.to > c.from, name: GODS[c.god].name, color: GODS[c.god].color });
    if (r.changes.length) this.refreshStats();
    for (const n of r.next) this.emit({ t: 'toast', text: `Новое задание: ${QUESTS[n].title}`, kind: 'quest' });
    this.emit({ t: 'quest', id, why: 'done' });
    this.emit({ t: 'stats' });
    this.emit({ t: 'save' });
  }

  // ------------------------------------------------------------- дерево навыков
  learnNode(id) {
    if (!skillLearn(this.s, id)) { this.emit({ t: 'sfx', n: 'deny' }); return false; }
    this.refreshStats(); this.emit({ t: 'sfx', n: 'item' }); this.emit({ t: 'stats' });
    return true;
  }
  respecSkills() { this.applyFx([['respec']]); }

  // ------------------------------------------------------------- торговля
  shopStock(id) {
    const s = this.s;
    const sh = SHOPS[id];
    if (sh.items) return sh.items.slice();
    return Object.values(ITEMS).filter((it) => ['weapon', 'armor'].includes(it.type) && it.cls === s.cls && sh.tiers.includes(it.tier)).map((it) => it.id);
  }
  buyPrice(id) { const it = ITEMS[id]; return it ? Math.max(1, Math.round(it.price * (1 - this.stats.discount))) : 0; }

  buy(id) {
    const s = this.s, it = ITEMS[id];
    const price = this.buyPrice(id);
    if (!it || s.gold < price) { this.emit({ t: 'toast', text: 'Не хватает золота', kind: 'warn' }); this.emit({ t: 'sfx', n: 'deny' }); return false; }
    s.gold -= price; addItem(s, id, 1);
    this.emit({ t: 'sfx', n: 'coin' }); this.emit({ t: 'stats' });
    return true;
  }

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
      const flagOk = !rq || !rq.flag || (Array.isArray(rq.flag) ? rq.flag.every((f) => s.flags[f]) : s.flags[rq.flag]);
      if (rq && ((rq.item && !count(s, rq.item)) || !flagOk)) {
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
