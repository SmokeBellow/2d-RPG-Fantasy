// Отрисовка мира на пиксельном canvas 480x270: камера, слои, частицы, освещение.
import { TILE, VW, VH, T, ITEMS, CLASSES, AREAS } from './defs.js';
import { PROP_DEF } from './maps.js';
import { buildGround } from './sprites_tiles.js';
import { propSprites, treeSprite, bushSprite, godAltarSprite } from './sprites_props.js';
import { GODS } from './gods.js';
import { playerSet, npcSet, enemyHumanSet, creatureFrames, transformSprite, weaponSprite, catSprite, itemIcon, coinIcon } from './sprites_chars.js';
import { mk, rect, dot, disc, outline, flipX, shade } from './px.js';
import { hash2, clamp, angleTo, normAng, dist } from './util.js';
import { NPCS, npcMarker } from './quests.js';

const FONT = '8px "Press Start 2P", monospace';
const TAU = Math.PI * 2;

const flashCache = new WeakMap();
function flashed(cv) {
  let f = flashCache.get(cv);
  if (!f) {
    const [c, x] = mk(cv.width, cv.height);
    x.drawImage(cv, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.fillRect(0, 0, cv.width, cv.height);
    f = c; flashCache.set(cv, f);
  }
  return f;
}

function glowSprite(r, rgb, a = 1) {
  const [c, x] = mk(r * 2, r * 2);
  const g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.5, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
  return c;
}

function chestSprite(open) {
  const [c, x] = mk(16, 16);
  rect(x, 1, 6, 14, 9, '#8a5a30'); rect(x, 1, 6, 14, 2, '#b07a44'); rect(x, 1, 13, 14, 2, '#5a3a22');
  rect(x, 1, 3 + (open ? -2 : 0), 14, open ? 3 : 4, '#a06a38');
  if (open) { rect(x, 2, 7, 12, 3, '#2a1a10'); rect(x, 4, 7, 3, 1, '#ffd860'); rect(x, 9, 8, 3, 1, '#ffd860'); }
  else rect(x, 1, 3, 14, 1, '#c8884a');
  rect(x, 1, 6, 14, 1, '#d8b04a'); rect(x, 7, 6, 2, 4, '#d8b04a'); rect(x, 7, 7, 2, 2, '#fff0a0');
  rect(x, 1, 3, 2, 12, '#d8b04a'); rect(x, 13, 3, 2, 12, '#d8b04a');
  return outline(c, '#1d1420');
}
function nodeSprite() {
  const [c, x] = mk(16, 16);
  rect(x, 8, 8, 1, 6, '#3a7a3a'); rect(x, 6, 11, 2, 1, '#3a7a3a'); rect(x, 9, 10, 2, 1, '#3a7a3a');
  disc(x, 8, 6, 3, '#58b8e8'); disc(x, 8, 6, 2, '#a8ecff'); dot(x, 8, 6, '#ffffff');
  for (const [px, py] of [[5, 4], [11, 4], [8, 2], [5, 8], [11, 8]]) dot(x, px, py, '#7ad0ff');
  return outline(c, '#1d1420');
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = VW; canvas.height = VH;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.camX = 0; this.camY = 0;
    this.t = 0;
    this.fx = [];
    this.shake = 0;
    this.groundCache = {};
    this.props = propSprites();
    this.treeCache = {};
    this.chestC = [chestSprite(false), chestSprite(true)];
    this.nodeC = nodeSprite();
    this.coin = coinIcon();
    this.iconCache = {};
    this.glows = {};
    this.light = null;
    this.world = null;
    this.vignette = this.makeVignette();
    this.shadowC = (() => { const [c, x] = mk(24, 8); x.fillStyle = 'rgba(10,6,20,0.3)'; x.beginPath(); x.ellipse(12, 4, 9, 3, 0, 0, TAU); x.fill(); return c; })();
    this.weaponCache = {};
    this.ambT = 0;
  }

  makeVignette() {
    const [c, x] = mk(VW, VH);
    const g = x.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.62);
    g.addColorStop(0, 'rgba(10,6,20,0)'); g.addColorStop(1, 'rgba(10,6,20,0.5)');
    x.fillStyle = g; x.fillRect(0, 0, VW, VH);
    return c;
  }
  glow(key, r, rgb, a = 1) { return this.glows[key] || (this.glows[key] = glowSprite(r, rgb, a)); }
  icon(id) { return this.iconCache[id] || (this.iconCache[id] = itemIcon(ITEMS[id])); }
  tree(v, theme) { const k = v + theme; return this.treeCache[k] || (this.treeCache[k] = treeSprite(v, theme)); }
  bush(theme, b) { const k = 'b' + theme + b; return this.treeCache[k] || (this.treeCache[k] = bushSprite(theme, b)); }

  setWorld(world) {
    this.world = world;
    const id = world.area;
    this.theme = AREAS[id].theme;
    if (!this.groundCache[id]) this.groundCache[id] = buildGround(world.map, this.theme);
    this.ground = this.groundCache[id];
    this.fx = [];
    this.dark = AREAS[id].dark || 0;
    const p = world.p;
    this.camX = clamp(p.x - VW / 2, 0, world.W * TILE - VW);
    this.camY = clamp(p.y - VH / 2, 0, world.H * TILE - VH);
    if (this.dark) this.light = this.light || mk(VW, VH);
    this.treeTheme = ['village', 'lightforest', 'city', 'harbor', 'clinic', 'grove'].includes(this.theme) ? 'village' : 'forest';
    // водные/лавовые тайлы не перебираем каждый кадр — список
    this.fluids = [];
    const m = world.map;
    for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
      const t = m.tiles[ty * m.w + tx];
      if (t === T.WATER || t === T.DEEP) this.fluids.push([tx, ty, 0]);
      else if (t === T.LAVA) this.fluids.push([tx, ty, 1]);
    }
    this.lightSources = [];
    for (const pr of m.props) {
      if (pr.k === 'brazier') this.lightSources.push({ x: (pr.x + 0.5) * TILE, y: (pr.y + 0.2) * TILE, r: 54, rgb: '255,170,70' });
      else if (pr.k === 'shrine') this.lightSources.push({ x: (pr.x + 1) * TILE, y: pr.y * TILE - 4, r: 46, rgb: '255,200,110' });
      else if (pr.k === 'campfire') this.lightSources.push({ x: (pr.x + 0.5) * TILE, y: pr.y * TILE, r: 40, rgb: '255,150,60' });
      else if (pr.k === 'cryptgate') this.lightSources.push({ x: (pr.x + 0.5) * TILE + 8, y: (pr.y + 1) * TILE, r: 50, rgb: '255,170,70' });
      else if (pr.k === 'obelisk') this.lightSources.push({ x: (pr.x + 0.5) * TILE, y: pr.y * TILE - 10, r: 28, rgb: '255,200,120' });
    }
  }

  // ------------------------------------------------------------- события -> эффекты
  burst(x, y, n, col, spd = 40, life = 0.5, size = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = spd * (0.4 + Math.random() * 0.8);
      this.fx.push({ k: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, life: life * (0.6 + Math.random() * 0.6), max: life, col, size, g: 40 });
    }
  }
  text(x, y, s, col = '#fff', life = 0.9, big = false) {
    this.fx.push({ k: 'text', x, y, vx: 0, vy: -22, life, max: life, s, col, big });
  }
  consume(events) {
    for (const e of events) {
      switch (e.t) {
        case 'dmg': {
          if (e.who === 'e') this.text(e.x, e.y, String(e.v) + (e.crit ? '!' : ''), e.crit ? '#ffd24a' : '#ffffff', e.crit ? 1.1 : 0.8, e.crit || e.big);
          else if (e.who === 'p') this.text(e.x, e.y, '-' + e.v, '#ff6a5a', 0.9, true);
          else if (e.who === 'heal') this.text(e.x, e.y, '+' + e.v, '#6aff8a', 1);
          else if (e.who === 'mana') this.text(e.x, e.y, '+' + e.v, '#6ab4ff', 1);
          break;
        }
        case 'text': if (!e.panel) this.text(e.x, e.y, e.text, e.col || '#fff', 1.2); break;
        case 'xp': this.text(e.x, e.y, '+' + e.v + ' оп.', '#9ad0ff', 1.1); break;
        case 'hit': this.burst(e.x, e.y, e.crit ? 9 : 5, e.crit ? '#ffe070' : '#ffffff', 55, 0.3); break;
        case 'slash': this.fx.push({ k: 'slash', x: e.x, y: e.y, ang: e.ang, range: e.range, arc: e.arc, life: 0.18, max: 0.18, combo: e.combo, cls: e.cls }); break;
        case 'estrike': this.fx.push({ k: 'slash', x: e.x, y: e.y, ang: e.ang, range: e.range, arc: 1.6, life: 0.15, max: 0.15, enemy: true }); break;
        case 'boom': this.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r, life: 0.35, max: 0.35, col: e.col, hard: e.hard }); this.burst(e.x, e.y, e.hard ? 10 : 8, e.col, 70, 0.5, 2); break;
        case 'nova': this.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r, life: 0.4, max: 0.4, col: e.col, spin: e.spin }); this.burst(e.x, e.y, 10, e.col, 60, 0.5); break;
        case 'puff': this.burst(e.x, e.y, e.big ? 18 : e.small ? 3 : 8, e.col || '#ccc', e.big ? 70 : 40, e.big ? 0.9 : 0.5, e.big ? 2 : 1); break;
        case 'blink': this.burst(e.x, e.y, 8, '#b898ff', 50, 0.4); break;
        case 'alert': this.fx.push({ k: 'icon', x: e.x, y: e.y, s: '!', col: e.warn ? '#ff7a3a' : '#ffd24a', life: 0.6, max: 0.6 }); break;
        case 'shake': this.shake = Math.max(this.shake, e.v); break;
        case 'levelup': {
          const p = this.world.p;
          this.fx.push({ k: 'ring', x: p.x, y: p.y, r: 40, life: 0.8, max: 0.8, col: '#ffe070' });
          this.burst(p.x, p.y - 8, 24, '#ffe070', 80, 1.1, 2);
          this.text(p.x, p.y - 26, 'НОВЫЙ УРОВЕНЬ!', '#ffe070', 1.8, true);
          break;
        }
        case 'beacon': {
          const b = this.world.map.props.find((q) => q.k === 'beacon');
          if (b) { this.fx.push({ k: 'ring', x: (b.x + 1.5) * TILE, y: (b.y + 1) * TILE, r: 90, life: 1.2, max: 1.2, col: '#ffc860' }); this.burst((b.x + 1.5) * TILE, b.y * TILE - 40, 40, '#ffc860', 100, 1.6, 2); }
          break;
        }
        default: break;
      }
    }
  }

  // ------------------------------------------------------------- кадр
  update(dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 14);
    for (const f of this.fx) {
      f.life -= dt;
      if (f.vx !== undefined) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.g) f.vy += f.g * dt; }
    }
    this.fx = this.fx.filter((f) => f.life > 0);
    if (this.fx.length > 500) this.fx.splice(0, this.fx.length - 500);
    this.ambient(dt);
  }

  ambient(dt) {
    const w = this.world;
    if (!w) return;
    this.ambT += dt;
    const cx = this.camX, cy = this.camY;
    const spawn = (k, o) => this.fx.push({ k, ...o });
    if (this.theme === 'forest' && Math.random() < dt * 4) spawn('firefly', { x: cx + Math.random() * VW, y: cy + Math.random() * VH, vx: 0, vy: 0, life: 4, max: 4, ph: Math.random() * 6 });
    if (this.theme === 'village' && Math.random() < dt * 1.5) spawn('leaf', { x: cx + Math.random() * VW, y: cy - 4, vx: 12 + Math.random() * 8, vy: 10 + Math.random() * 6, life: 8, max: 8, ph: Math.random() * 6 });
    if (this.theme === 'crypt' && Math.random() < dt * 3) spawn('mote', { x: cx + Math.random() * VW, y: cy + Math.random() * VH, vx: 3, vy: -3, life: 5, max: 5, col: '#9a98c0' });
    if (this.theme === 'citadel' && Math.random() < dt * 8) spawn('mote', { x: cx + Math.random() * VW, y: cy + VH, vx: (Math.random() - 0.5) * 8, vy: -16 - Math.random() * 14, life: 6, max: 6, col: Math.random() < 0.5 ? '#ff8a3a' : '#c070ff' });
    // дым из труб
    if (Math.random() < dt * 2.5) {
      for (const pr of w.map.props) {
        if (!['house', 'hut', 'smithy', 'tavern'].includes(pr.k)) continue;
        const px = pr.x * TILE, py = (pr.y + pr.h) * TILE - PROP_DEF[pr.k].h * TILE - PROP_DEF[pr.k].extra;
        if (px < cx - 20 || px > cx + VW + 20 || py < cy - 40 || py > cy + VH + 40) continue;
        const chx = pr.k === 'smithy' ? 14 : pr.k === 'tavern' ? 26 : pr.k === 'hut' ? (pr.sprite === 'herb' ? 12 : 48) : (pr.x % 2 ? 12 : pr.w * TILE - 16);
        if (Math.random() < 0.5) spawn('smoke', { x: px + chx, y: py + 2, vx: 3 + Math.random() * 3, vy: -10, life: 2.4, max: 2.4 });
      }
    }
  }

  draw(w, dt, ui = {}) {
    const ctx = this.ctx, p = w.p;
    this.update(dt);
    // камера
    const tx = clamp(p.x - VW / 2, 0, w.W * TILE - VW), ty = clamp(p.y - VH / 2 - 6, 0, w.H * TILE - VH);
    this.camX += (tx - this.camX) * Math.min(1, dt * 10);
    this.camY += (ty - this.camY) * Math.min(1, dt * 10);
    let sx = 0, sy = 0;
    if (this.shake > 0.2) { sx = (Math.random() - 0.5) * this.shake; sy = (Math.random() - 0.5) * this.shake; }
    const camX = Math.round(this.camX + sx), camY = Math.round(this.camY + sy);
    this.cx = camX; this.cy = camY;

    ctx.fillStyle = '#10081a'; ctx.fillRect(0, 0, VW, VH);
    ctx.drawImage(this.ground, camX, camY, VW, VH, 0, 0, VW, VH);
    ctx.save(); ctx.translate(-camX, -camY);
    this.drawFluids(ctx, camX, camY);
    this.drawTeles(ctx, w);
    this.drawObjects(ctx, w, camX, camY);
    this.drawProjs(ctx, w);
    this.drawFx(ctx);
    this.drawMarker(ctx, w);
    ctx.restore();
    if (this.dark) this.drawLight(ctx, w, camX, camY);
    ctx.drawImage(this.vignette, 0, 0);
    // красная вспышка при ударе
    if (p.hurt > 0) { ctx.fillStyle = `rgba(200,30,30,${p.hurt * 0.9})`; ctx.fillRect(0, 0, VW, VH); }
    if (w.s.hp / w.stats.maxHp < 0.25 && !p.dead) { const a = 0.12 + 0.08 * Math.sin(this.t * 6); ctx.fillStyle = `rgba(150,10,10,${a})`; ctx.fillRect(0, 0, VW, VH); }
  }

  drawFluids(ctx, camX, camY) {
    const t = this.t;
    for (const [tx, ty, kind] of this.fluids) {
      const x = tx * TILE, y = ty * TILE;
      if (x < camX - 16 || x > camX + VW || y < camY - 16 || y > camY + VH) continue;
      const h = hash2(tx, ty, 91);
      if (kind === 0) {
        if (h > 0.55) {
          const ph = (t * 0.6 + h * 10) % 1;
          ctx.fillStyle = `rgba(255,255,255,${0.5 * Math.sin(ph * Math.PI)})`;
          ctx.fillRect(x + 3 + Math.floor(h * 8), y + 4 + Math.floor((h * 37) % 7), 3, 1);
        }
      } else {
        const a = 0.18 + 0.16 * Math.sin(t * 2 + h * 12);
        ctx.fillStyle = `rgba(255,170,40,${a})`; ctx.fillRect(x, y, TILE, TILE);
        if (h > 0.6) { ctx.fillStyle = `rgba(255,240,150,${0.5 * Math.max(0, Math.sin(t * 3 + h * 20))})`; ctx.fillRect(x + 4 + Math.floor(h * 6), y + 5, 2, 2); }
      }
    }
  }

  drawTeles(ctx, w) {
    for (const z of w.teles) {
      const prog = Math.min(1, z.t / z.dur);
      const warn = z.dmg <= 0;
      const col = warn ? '255,200,80' : '255,60,50';
      ctx.save();
      ctx.translate(z.x, z.y);
      if (z.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, z.r, 0, TAU);
        ctx.fillStyle = `rgba(${col},0.14)`; ctx.fill();
        ctx.strokeStyle = `rgba(${col},${0.55 + 0.3 * Math.sin(this.t * 18)})`; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, z.r * prog, 0, TAU);
        ctx.fillStyle = `rgba(${col},${0.2 + prog * 0.3})`; ctx.fill();
      } else {
        ctx.rotate(z.ang);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, z.r, -z.arc / 2, z.arc / 2); ctx.closePath();
        ctx.fillStyle = `rgba(${col},0.14)`; ctx.fill();
        ctx.strokeStyle = `rgba(${col},${0.55 + 0.3 * Math.sin(this.t * 18)})`; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, z.r * prog, -z.arc / 2, z.arc / 2); ctx.closePath();
        ctx.fillStyle = `rgba(${col},${0.2 + prog * 0.3})`; ctx.fill();
      }
      ctx.restore();
    }
  }

  // ------------------------------------------------------------- объекты с сортировкой по глубине
  drawObjects(ctx, w, camX, camY) {
    const list = [];
    const m = w.map;
    const x0 = Math.max(0, Math.floor(camX / TILE) - 2), x1 = Math.min(m.w - 1, Math.floor((camX + VW) / TILE) + 2);
    const y0 = Math.max(0, Math.floor(camY / TILE) - 1), y1 = Math.min(m.h - 1, Math.floor((camY + VH) / TILE) + 4);
    // деревья
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (m.tiles[ty * m.w + tx] !== T.TREE) continue;
      const h = hash2(tx, ty, 5);
      const v = h < 0.38 ? 0 : h < 0.7 ? 1 : 2;
      const spr = this.tree(this.theme === 'village' ? (v === 2 ? 0 : v) : v, this.treeTheme);
      const px = tx * TILE + 8 - 18 + Math.floor(hash2(tx, ty, 8) * 5 - 2), py = (ty + 1) * TILE - 44;
      list.push({ y: (ty + 1) * TILE - 1, spr, x: px, yy: py });
    }
    // объекты
    const flags = w.s.flags;
    for (const pr of m.props) {
      const d = PROP_DEF[pr.k];
      const sh = d.h * TILE + d.extra;
      const px = pr.x * TILE, bottom = (pr.y + pr.h) * TILE;
      if (px > camX + VW + 40 || px + pr.w * TILE < camX - 40 || bottom - sh > camY + VH || bottom < camY - 4) continue;
      let spr = null;
      const e = this.props[pr.k];
      if (pr.k === 'bush') spr = this.bush(this.treeTheme, hash2(pr.x, pr.y, 3) > 0.7);
      else if (pr.k === 'stonedoor') { const dr = w.doors.find((q) => q.id === pr.id); if (dr && dr.open) continue; spr = e.s; }
      else if (pr.k === 'barrier') { if (flags[pr.flagGone]) continue; spr = e.frames[Math.floor(this.t * e.fps) % e.frames.length]; }
      else if (pr.k === 'beacon') spr = flags.beacon_lit ? e.on[Math.floor(this.t * 6) % 2] : e.off;
      else if (pr.k === 'lever') spr = flags[pr.id] ? e.on : e.off;
      else if (pr.k === 'hut') spr = e[pr.sprite || 'elder'];
      else if (pr.k === 'godaltar') { const g = pr.god || 'x'; spr = e.by[g] || (e.by[g] = godAltarSprite(GODS[g] ? GODS[g].color : '#c8c8d8')); }
      else if (pr.k === 'house' || pr.k === 'tent') spr = e.variants[Math.floor(hash2(pr.x, pr.y, 2) * e.variants.length)];
      else if (e && e.frames) spr = e.frames[Math.floor(this.t * e.fps + hash2(pr.x, pr.y, 1) * 4) % e.frames.length];
      else if (e && e.s) spr = e.s;
      if (!spr) continue;
      // outline() добавляет по 1 пикселю с каждой стороны
      list.push({ y: bottom - (pr.k === 'barrier' ? 0 : 0), spr, x: px - 1, yy: bottom - sh - 1, prop: pr });
    }
    // сундуки, узлы
    for (const c of w.chests) list.push({ y: c.py + 6, spr: this.chestC[c.open ? 1 : 0], x: c.px - 9, yy: c.py - 11 });
    for (const n of w.nodes) if (!n.taken) list.push({ y: n.py + 6, spr: this.nodeC, x: n.px - 9, yy: n.py - 11 + Math.sin(this.t * 2 + n.x) * 1, glow: [n.px, n.py - 4, '90,190,255'] });
    // NPC
    for (const n of w.npcs) {
      const look = NPCS[n.id].look;
      if (look.startsWith('c:')) {
        const cf = creatureFrames(look.slice(2));
        const base = cf.frames[Math.floor(this.t * 1.5) % cf.frames.length];
        list.push({ y: n.py + 6, spr: base, x: n.px - cf.w / 2 - 1, yy: n.py - cf.base - 1, shadow: [n.px, n.py + 3, 2] });
        continue;
      }
      if (look === 'cat') { list.push({ y: n.py + 6, spr: catSprite(Math.floor(this.t * 0.8) % 2), x: n.px - 13, yy: n.py - 10 }); continue; }
      const set = npcSet(look);
      const a = n.face != null ? n.face : Math.PI / 2 + Math.sin(n.t * 0.3) * 0.3;
      let spr = set.d[0];
      const c = Math.cos(a), s = Math.sin(a);
      if (Math.abs(c) > Math.abs(s)) spr = c > 0 ? set.s[0] : set.sL[0]; else if (s < 0) spr = set.u[0];
      const breathe = Math.sin(n.t * 2) > 0.8 ? -1 : 0;
      const mk0 = npcMarker(w.s, n.id);
      list.push({
        y: n.py + 4, spr, x: n.px - 13, yy: n.py - 25 + breathe, shadow: [n.px, n.py + 3],
        after: mk0 ? (ctx) => {
          const bob = Math.sin(this.t * 4 + n.px) * 1.5;
          ctx.font = FONT; ctx.textAlign = 'center';
          ctx.fillStyle = '#10081a'; ctx.fillText(mk0, Math.round(n.px) + 1, Math.round(n.py - 31 + bob) + 1);
          ctx.fillStyle = mk0 === '…' ? '#c8c8d8' : '#ffd24a'; ctx.fillText(mk0, Math.round(n.px), Math.round(n.py - 31 + bob));
        } : null,
      });
    }
    // враги
    for (const e of w.enemies) {
      if (e.x < camX - 60 || e.x > camX + VW + 60 || e.y < camY - 70 || e.y > camY + VH + 70) continue;
      const it = this.enemyDraw(e);
      if (it) list.push(it);
    }
    // дропы
    for (const q of w.pickups) {
      const bob = Math.sin(this.t * 5 + q.x) * 1.5;
      let spr, gl;
      if (q.id === 'gold') { spr = this.coin; gl = '255,210,80'; }
      else { spr = this.icon(q.id); gl = ITEMS[q.id].type === 'quest' ? '120,220,255' : '255,255,255'; }
      if (q.life < 5 && Math.floor(q.life * 6) % 2) continue;
      list.push({ y: q.y + 2, spr, x: q.x - spr.width / 2, yy: q.y - spr.height / 2 - 3 + bob, glow: [q.x, q.y - 3, gl], small: true });
    }
    // игрок
    if (!w.p.dead) list.push(this.playerDraw(w));
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.glow) { const g = this.glow('g' + it.glow[2], 12, it.glow[2], 0.5); ctx.drawImage(g, it.glow[0] - 12, it.glow[1] - 12); }
      if (it.shadow) ctx.drawImage(this.shadowC, it.shadow[0] - 12, it.shadow[1] - 4);
      if (it.draw) { it.draw(ctx); continue; }
      if (it.alpha != null) ctx.globalAlpha = it.alpha;
      ctx.drawImage(it.spr, Math.round(it.x), Math.round(it.yy));
      ctx.globalAlpha = 1;
      if (it.flashSpr) ctx.drawImage(it.flashSpr, Math.round(it.x), Math.round(it.yy));
      if (it.after) it.after(ctx);
    }
  }

  dirSprite(set, a, frame) {
    const c = Math.cos(a), s = Math.sin(a);
    if (Math.abs(c) >= Math.abs(s) * 1.05) return { spr: c > 0 ? set.s[frame] : set.sL[frame], dir: c > 0 ? 'r' : 'l' };
    return s > 0 ? { spr: set.d[frame], dir: 'd' } : { spr: set.u[frame], dir: 'u' };
  }

  playerDraw(w) {
    const p = w.p, s = w.s;
    const armor = s.equip.armor && ITEMS[s.equip.armor];
    const tier = armor ? armor.tier : 1;
    const set = playerSet(s.cls, tier);
    const walk = p.moving || p.dodge;
    let frame = 0;
    if (walk) frame = [1, 0, 3, 0][Math.floor(p.anim * 9) % 4];
    const act = p.act;
    const { spr, dir } = this.dirSprite(set, p.face, act ? 1 : frame);
    const wpn = s.equip.weapon && ITEMS[s.equip.weapon];
    const wt = wpn ? wpn.tier : 1;
    const key = s.cls + wt;
    const wsp = this.weaponCache[key] || (this.weaponCache[key] = weaponSprite(s.cls, wt));
    const idleBob = !walk && !act && Math.floor(p.anim * 2) % 2 ? 1 : 0;
    const x0 = p.x - 13, y0 = p.y - 27 + idleBob;
    const alpha = p.inv > 0 && Math.floor(this.t * 20) % 2 && p.hurt <= 0 ? 0.45 : 1;
    const dodgeRoll = p.dodge;
    const self = this;
    return {
      y: p.y + 1, shadow: [p.x, p.y + 3], x: x0, yy: y0, spr, alpha,
      draw: (ctx) => {
        ctx.globalAlpha = alpha;
        if (p.buffs.shadow > 0) ctx.globalAlpha = 0.45;
        // оружие сзади, когда смотрим вверх
        const wdraw = () => self.drawWeapon(ctx, w, wsp, dir);
        if (dir === 'u' && !act) wdraw();
        if (dodgeRoll) {
          ctx.save(); ctx.translate(p.x, p.y - 9); ctx.rotate((dodgeRoll.t / 0.28) * TAU * (dodgeRoll.dx >= 0 ? 1 : -1)); ctx.drawImage(spr, -13, -18); ctx.restore();
        } else ctx.drawImage(spr, Math.round(x0), Math.round(y0));
        if (p.hurt > 0 && !dodgeRoll) ctx.drawImage(flashed(spr), Math.round(x0), Math.round(y0));
        if (!(dir === 'u' && !act) && !dodgeRoll) wdraw();
        if (p.buffs.roar > 0) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(self.t * 8); ctx.drawImage(self.glow('roar', 20, '255,190,70', 0.9), p.x - 20, p.y - 24); }
        ctx.globalAlpha = 1;
      },
    };
  }

  drawWeapon(ctx, w, wsp, dir) {
    const p = w.p;
    const act = p.act;
    const side = dir === 'l' ? -1 : 1;
    // хват: правая рука относительно игрока
    let hx = p.x + (dir === 'd' ? 7 : dir === 'u' ? -7 : 4 * side), hy = p.y - 8;
    let ang;
    const cls = w.s.cls;
    if (act && act.kind === 'swing') {
      const prog = Math.min(1, act.t / act.dur);
      const arcStart = -1.1, arcEnd = 1.1;
      const dirSign = act.combo % 2 ? -1 : 1;
      ang = act.ang + (arcStart + (arcEnd - arcStart) * Math.min(1, prog * 1.4)) * dirSign + Math.PI / 2;
    } else if (act && act.kind === 'whirl') {
      ang = act.ang + (act.t / act.dur) * TAU * 1.5 + Math.PI / 2; hx = p.x; hy = p.y - 8;
    } else if (act && act.kind === 'cast') {
      const up = Math.min(1, act.t / 0.12);
      ang = act.ang + Math.PI / 2 + (cls === 'mage' ? 0 : 0);
      if (cls === 'mage') { hx = p.x + Math.cos(act.ang) * 4; hy = p.y - 8 + Math.sin(act.ang) * 3; }
    } else {
      // в покое: меч за плечом, посох у ноги, кинжал на бедре
      const sd = dir === 'u' || dir === 'l' ? -1 : 1;
      ang = cls === 'mage' ? 0.08 * sd : cls === 'warrior' ? 0.4 * sd : Math.PI - 0.35 * sd;
      if (cls === 'rogue') hy += 3;
    }
    ctx.save();
    ctx.translate(Math.round(hx), Math.round(hy));
    ctx.rotate(ang);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(wsp.c, -wsp.hx, -wsp.hy);
    ctx.restore();
  }

  enemyDraw(e) {
    const d = e.def;
    const dead = !e.alive;
    const a = e.face != null ? e.face : Math.PI / 2;
    let spr, x, y, flashSpr = null, alpha = 1;
    const wind = e.state === 'wind' || e.pose === 'wind';
    const t = e.anim;
    const look = d.look || { c: e.type };
    if (look.h) {
      const set = enemyHumanSet(look.h);
      const mv = e.state === 'chase' || (e.state === 'idle' && e.moving) || e.state === 'lunge';
      const frame = mv ? [1, 0, 3, 0][Math.floor(t * 7) % 4] : 0;
      spr = this.dirSprite(set, a, wind ? 1 : frame).spr;
      x = e.x - 13; y = e.y - 27;
    } else {
      const cf = creatureFrames(look.c);
      if (!cf) return null;
      const nf = cf.frames.length;
      const mv = e.state === 'chase' || e.state === 'orbit' || e.state === 'dive' || e.state === 'retreat' || e.state === 'lunge' || (e.state === 'idle' && e.moving) || e.pose === 'move' || e.pose === 'dash';
      const fi = nf === 4 ? [0, 1, 2, 3][Math.floor(t * 8) % 4] : Math.floor(t * (cf.fly ? 9 : mv ? 6 : 2)) % nf;
      const base = wind && cf.wind ? cf.wind : cf.frames[mv || cf.fly ? fi : (nf > 2 ? 0 : Math.floor(t * 1.5) % nf)];
      const faceRight = Math.cos(a) >= 0;
      spr = faceRight ? base : this.flipCache(base);
      const fly = cf.fly ? cf.fly + Math.sin(t * 3) * 2 : 0;
      x = e.x - cf.w / 2 - 1; y = e.y - cf.base - 1 - fly + (cf.fly ? 6 : 0);
      if (e.type === 'slime' || look.c === 'slime') {
        // прыжок: подскок вверх
        const ph = (t * 1.4) % 1;
        if ((e.state === 'chase' || e.moving) && ph < 0.45) y -= Math.sin((ph / 0.45) * Math.PI) * 5;
      }
    }
    if (look.tint || (look.scale && look.scale !== 1)) {
      const w0 = spr.width, h0 = spr.height;
      spr = transformSprite(spr, look.tint, look.scale);
      x += (w0 - spr.width) / 2; y += h0 - spr.height;
    }
    if (e.flash > 0) flashSpr = flashed(spr);
    if (e.slow > 0) alpha = 0.92;
    if (dead) { alpha = Math.max(0, 1 - e.t / 0.9); y += Math.min(6, e.t * 20); }
    const self = this;
    const sh = d.boss ? [e.x, e.y + 3, 2] : [e.x, e.y + 3];
    return {
      y: e.y, x, yy: y, spr, alpha, flashSpr,
      shadow: sh,
      after: dead ? null : (ctx) => {
        // полоска здоровья над раненым врагом
        if (e.hp < e.maxHp && !d.boss) {
          const w2 = Math.max(10, e.r * 3), bx = Math.round(e.x - w2 / 2), by = Math.round(y - 3);
          ctx.fillStyle = '#10081a'; ctx.fillRect(bx - 1, by - 1, w2 + 2, 4);
          ctx.fillStyle = '#5a1a22'; ctx.fillRect(bx, by, w2, 2);
          ctx.fillStyle = e.slow > 0 ? '#8ad0ff' : '#e0463a'; ctx.fillRect(bx, by, Math.round(w2 * e.hp / e.maxHp), 2);
        }
        if (wind && !d.boss) {
          ctx.fillStyle = '#ff5a3a'; ctx.fillRect(Math.round(e.x) - 1, Math.round(y) - 9, 2, 5); ctx.fillRect(Math.round(e.x) - 1, Math.round(y) - 3, 2, 2);
        }
        if (e.slow > 0) { ctx.fillStyle = 'rgba(168,224,255,0.35)'; ctx.fillRect(Math.round(x) + 2, Math.round(y) + 2, spr.width - 4, spr.height - 4); }
      },
    };
  }

  flipCache(c) {
    if (!c._flip) c._flip = flipX(c);
    return c._flip;
  }

  // ------------------------------------------------------------- снаряды
  drawProjs(ctx, w) {
    for (const q of w.projs) {
      const x = Math.round(q.x), y = Math.round(q.y - 3);
      switch (q.kind) {
        case 'arrow': case 'knife': {
          ctx.save(); ctx.translate(x, y); ctx.rotate(q.ang);
          if (q.kind === 'arrow') { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-5, -0.5, 8, 1); ctx.fillStyle = '#d8d8e0'; ctx.fillRect(3, -1, 2, 2); ctx.fillStyle = '#e8e0c8'; ctx.fillRect(-6, -1, 2, 2); }
          else { ctx.rotate(q.t * 14); ctx.fillStyle = '#d8dce8'; ctx.fillRect(-3, -1, 6, 2); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-4, -1, 2, 2); }
          ctx.restore(); break;
        }
        case 'web': ctx.drawImage(this.glow('web', 8, '240,240,255', 0.7), x - 8, y - 8); ctx.fillStyle = '#f4f4ff'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = '#b8b8d0'; ctx.fillRect(x - 1, y - 1, 2, 2); break;
        case 'orb': case 'skull': case 'blight': {
          const col = q.kind === 'blight' ? ['#5aff7a', '154,255,170'] : q.kind === 'skull' ? ['#a8e8ff', '120,220,255'] : ['#c080ff', '190,130,255'];
          ctx.drawImage(this.glow('o' + q.kind, 11, col[1], 0.8), x - 11, y - 11);
          ctx.fillStyle = col[0]; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 1, 2, 2);
          break;
        }
        case 'bolt': ctx.drawImage(this.glow('bolt', 11, '120,190,255', 0.9), x - 11, y - 11); ctx.fillStyle = '#a8d8ff'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 2, 2); break;
        case 'fire':
          ctx.drawImage(this.glow('fire', 16, '255,150,50', 0.9), x - 16, y - 16); ctx.fillStyle = '#ff7a20'; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = '#ffd860'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 2, 2);
          if (Math.random() < 0.6) this.fx.push({ k: 'dot', x: q.x, y: q.y - 3, vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ff9a30' : '#ffd860', size: 1, g: 0 });
          break;
        default: ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 3, 3);
      }
    }
  }

  // ------------------------------------------------------------- частицы
  drawFx(ctx) {
    for (const f of this.fx) {
      const k = f.life / f.max;
      switch (f.k) {
        case 'dot': ctx.globalAlpha = Math.min(1, k * 1.6); ctx.fillStyle = f.col; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.size || 1, f.size || 1); ctx.globalAlpha = 1; break;
        case 'ring': {
          const r = f.r * (1 - k * 0.8) + 2;
          ctx.globalAlpha = Math.min(1, k * 1.4);
          ctx.strokeStyle = f.col; ctx.lineWidth = f.hard ? 2 : 1;
          ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); ctx.stroke();
          if (f.hard) { ctx.fillStyle = f.col; ctx.globalAlpha = k * 0.25; ctx.fill(); }
          ctx.globalAlpha = 1; break;
        }
        case 'slash': this.drawSlash(ctx, f, k); break;
        case 'text': {
          ctx.globalAlpha = Math.min(1, k * 2);
          ctx.font = FONT; ctx.textAlign = 'center';
          const sc = f.big ? 1 : 0.75;
          ctx.save(); ctx.translate(Math.round(f.x), Math.round(f.y)); ctx.scale(sc, sc);
          ctx.fillStyle = '#10081a';
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) ctx.fillText(f.s, dx, dy);
          ctx.fillStyle = f.col; ctx.fillText(f.s, 0, 0);
          ctx.restore(); ctx.globalAlpha = 1; break;
        }
        case 'icon': ctx.font = FONT; ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, k * 3); ctx.fillStyle = '#10081a'; ctx.fillText(f.s, f.x + 1, f.y - (1 - k) * 4 + 1); ctx.fillStyle = f.col; ctx.fillText(f.s, f.x, f.y - (1 - k) * 4); ctx.globalAlpha = 1; break;
        case 'firefly': {
          const a = Math.sin(this.t * 2 + f.ph) * 0.5 + 0.5;
          f.x += Math.sin(this.t * 0.7 + f.ph) * 0.15; f.y += Math.cos(this.t * 0.9 + f.ph * 2) * 0.12;
          ctx.globalAlpha = a * Math.min(1, k * 3); ctx.drawImage(this.glow('ff', 7, '220,255,120', 0.8), f.x - 7, f.y - 7); ctx.fillStyle = '#f4ffb0'; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); ctx.globalAlpha = 1; break;
        }
        case 'leaf': ctx.fillStyle = '#7ab04a'; ctx.globalAlpha = 0.8; ctx.fillRect(Math.round(f.x + Math.sin(this.t * 2 + f.ph) * 4), Math.round(f.y), 2, 1); ctx.globalAlpha = 1; break;
        case 'mote': ctx.globalAlpha = Math.min(1, k * 2, (1 - k) * 4) * 0.8; ctx.fillStyle = f.col; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); ctx.globalAlpha = 1; break;
        case 'smoke': ctx.globalAlpha = 0.45 * k; ctx.fillStyle = '#d8d4e0'; { const s = 2 + (1 - k) * 4; ctx.fillRect(Math.round(f.x - s / 2), Math.round(f.y - s / 2), s, s); } ctx.globalAlpha = 1; break;
        default: break;
      }
    }
  }

  drawSlash(ctx, f, k) {
    // полумесяц из пикселей: след удара
    const prog = 1 - k;
    const n = 14;
    const dirSign = f.combo % 2 ? -1 : 1;
    ctx.globalAlpha = Math.min(1, k * 2.2);
    const col = f.enemy ? '#ff7a5a' : f.cls === 'rogue' ? '#d8c8ff' : '#ffffff';
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = f.ang + (-f.arc / 2 + f.arc * u) * dirSign;
      const sweep = Math.min(1, prog * 2.2);
      if (u > sweep) continue;
      const r = f.range * (0.78 + 0.22 * Math.sin(u * Math.PI));
      const px = f.x + Math.cos(a) * r, py = f.y - 8 + Math.sin(a) * r * 0.9;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      if (u > sweep - 0.25) { ctx.fillStyle = f.enemy ? '#ffd0a0' : '#ffe9a0'; ctx.fillRect(Math.round(px), Math.round(py), 1, 1); }
    }
    ctx.globalAlpha = 1;
  }

  drawMarker(ctx, w) {
    const pr = w.prompt;
    if (!pr || w.p.dead) return;
    const bob = Math.sin(this.t * 5) * 1.5;
    const x = Math.round(pr.x), y = Math.round(pr.y - 30 + bob - (pr.kind === 'npc' ? 0 : -12));
    ctx.fillStyle = '#10081a'; ctx.fillRect(x - 5, y - 1, 10, 10);
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x - 4, y, 8, 8);
    ctx.fillStyle = '#4a3326'; ctx.font = FONT; ctx.textAlign = 'center'; ctx.fillText('E', x, y + 7);
    ctx.fillStyle = '#10081a'; ctx.fillRect(x - 1, y + 9, 2, 1);
  }

  // ------------------------------------------------------------- освещение
  drawLight(ctx, w, camX, camY) {
    const [lc, lx] = this.light;
    lx.globalCompositeOperation = 'source-over';
    lx.fillStyle = `rgba(8,5,18,${this.dark})`;
    lx.fillRect(0, 0, VW, VH);
    lx.globalCompositeOperation = 'destination-out';
    const cut = (x, y, r, a = 1) => { lx.globalAlpha = a; lx.drawImage(this.glow('cut' + r, r, '255,255,255', 1), Math.round(x - camX - r), Math.round(y - camY - r)); };
    const p = w.p;
    cut(p.x, p.y - 6, 125, 1);
    for (const s of this.lightSources) { if (s.x < camX - 70 || s.x > camX + VW + 70 || s.y < camY - 70 || s.y > camY + VH + 70) continue; cut(s.x, s.y, s.r, 0.85 + Math.sin(this.t * 7 + s.x) * 0.1); }
    if (this.theme === 'citadel') {
      for (const [tx, ty, kind] of this.fluids) { if (kind !== 1 || (tx + ty) % 3) continue; const x = tx * TILE + 8, y = ty * TILE + 8; if (x < camX - 40 || x > camX + VW + 40 || y < camY - 40 || y > camY + VH + 40) continue; cut(x, y, 38, 0.8); }
    }
    for (const q of w.projs) cut(q.x, q.y, 30, 0.7);
    for (const z of w.enemies) if (z.alive && (z.type === 'wraith' || z.boss)) cut(z.x, z.y - 8, z.boss ? 60 : 34, 0.6);
    lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.light[0], 0, 0);
    // тёплое свечение источников поверх
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.lightSources) { if (s.x < camX - 70 || s.x > camX + VW + 70 || s.y < camY - 70 || s.y > camY + VH + 70) continue; ctx.globalAlpha = 0.18 + Math.sin(this.t * 8 + s.x) * 0.04; ctx.drawImage(this.glow('w' + s.rgb, 30, s.rgb, 0.8), Math.round(s.x - camX - 30), Math.round(s.y - camY - 30)); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
}
