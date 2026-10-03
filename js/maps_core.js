// Строитель карт и общие инструменты. Всё строится кодом с фиксированным seed — карты одинаковы в браузере и в Node.
// Координаты в тайлах (кроме pixel-полей рендера). Модуль не зависит от DOM.
import { T, TILEDEF } from './defs.js';
import { mulberry32, fbm, hash2 } from './util.js';

// footprint (в тайлах) и «высота» спрайта над footprint (в пикселях) для каждого вида объектов
export const PROP_DEF = {
  house: { w: 5, h: 3, extra: 30 }, smithy: { w: 5, h: 3, extra: 34 }, tavern: { w: 6, h: 3, extra: 34 },
  hut: { w: 4, h: 3, extra: 28 }, stall: { w: 3, h: 2, extra: 16 }, well: { w: 2, h: 2, extra: 14 },
  beacon: { w: 3, h: 2, extra: 70 }, sign: { w: 1, h: 1, extra: 8 }, barrel: { w: 1, h: 1, extra: 4 },
  crate: { w: 1, h: 1, extra: 4 }, tent: { w: 3, h: 2, extra: 16 }, campfire: { w: 1, h: 1, extra: 4 },
  shrine: { w: 2, h: 1, extra: 18 }, lever: { w: 1, h: 1, extra: 10 }, pillar: { w: 1, h: 1, extra: 22 },
  bookshelf: { w: 2, h: 1, extra: 22 }, coffin: { w: 2, h: 1, extra: 6 }, tomb: { w: 1, h: 1, extra: 8 },
  throne: { w: 2, h: 1, extra: 28 }, statue: { w: 1, h: 1, extra: 20 }, boulder: { w: 1, h: 1, extra: 6 },
  cryptgate: { w: 4, h: 2, extra: 28 }, barrier: { w: 4, h: 1, extra: 24 }, anvil: { w: 1, h: 1, extra: 4 },
  fence: { w: 1, h: 1, extra: 4 }, bush: { w: 1, h: 1, extra: 6 }, stump: { w: 1, h: 1, extra: 3 },
  stonedoor: { w: 4, h: 2, extra: 20 }, brazier: { w: 1, h: 1, extra: 14 }, cart: { w: 2, h: 1, extra: 8 },
  rack: { w: 2, h: 1, extra: 10 }, table: { w: 2, h: 1, extra: 6 }, banner: { w: 1, h: 1, extra: 28 },
  obelisk: { w: 1, h: 1, extra: 30 }, reeds: { w: 1, h: 1, extra: 6 },
  stairs: { w: 2, h: 1, extra: 6, walk: true }, lamp: { w: 1, h: 1, extra: 26 }, godaltar: { w: 2, h: 1, extra: 20 }, bed: { w: 2, h: 1, extra: 6 },
  boat: { w: 5, h: 2, extra: 26 }, post: { w: 1, h: 1, extra: 10 }, net: { w: 2, h: 1, extra: 8 }, ruin: { w: 2, h: 1, extra: 14 },
  spear: { w: 1, h: 1, extra: 14 }, plant: { w: 1, h: 1, extra: 14 }, gate: { w: 4, h: 1, extra: 26 }, monolith: { w: 2, h: 1, extra: 34 },
  beam: { w: 1, h: 1, extra: 16 }, grave: { w: 1, h: 1, extra: 8 }, hut2: { w: 3, h: 2, extra: 24 }, tree2: { w: 1, h: 1, extra: 6 },
};

export class Builder {
  constructor(id, w, h, seed, base = T.GRASS) {
    this.id = id; this.w = w; this.h = h; this.seed = seed;
    this.rng = mulberry32(seed);
    this.tiles = new Uint8Array(w * h).fill(base);
    this.res = new Uint8Array(w * h);   // зарезервировано: деревья и камни сюда не ставим
    this.props = [];
    this.npcs = []; this.enemies = []; this.chests = []; this.nodes = []; this.zones = []; this.portals = [];
    this.spawn = { x: w / 2, y: h / 2 };
    this.doors = [];
  }

  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inb(x, y) ? this.tiles[y * this.w + x] : T.ROCK; }
  set(x, y, t) { if (this.inb(x, y)) this.tiles[y * this.w + x] = t; }
  reserve(x, y, w = 1, h = 1, pad = 0) {
    for (let j = y - pad; j < y + h + pad; j++) for (let i = x - pad; i < x + w + pad; i++) if (this.inb(i, j)) this.res[j * this.w + i] = 1;
  }
  reserveDisc(cx, cy, r) {
    for (let j = Math.floor(cy - r); j <= cy + r; j++) {
      for (let i = Math.floor(cx - r); i <= cx + r; i++) {
        if (Math.hypot(i - cx, j - cy) <= r && this.inb(i, j)) this.res[j * this.w + i] = 1;
      }
    }
  }
  rect(x, y, w, h, t, res = false) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, t);
    if (res) this.reserve(x, y, w, h, 1);
  }
  disc(cx, cy, r, t, res = true) {
    for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) {
      if (Math.hypot(i - cx, j - cy) <= r) { this.set(i, j, t); if (res) this.reserve(i, j, 1, 1, 1); }
    }
  }
  // неровное пятно (поляны, озёра): край «дышит» по шуму
  blob(cx, cy, rx, ry, t, res = true, wob = 0.28, seedOff = 0) {
    for (let j = Math.floor(cy - ry - 2); j <= Math.ceil(cy + ry + 2); j++) {
      for (let i = Math.floor(cx - rx - 2); i <= Math.ceil(cx + rx + 2); i++) {
        const dx = (i - cx) / rx, dy = (j - cy) / ry;
        const d = Math.hypot(dx, dy);
        const n = (fbm(i * 0.35, j * 0.35, this.seed + seedOff) - 0.5) * wob * 2;
        if (d + n <= 1) { this.set(i, j, t); if (res) this.reserve(i, j, 1, 1, 1); }
      }
    }
  }
  // ломаная кистью толщины w
  path(pts, w, t = T.DIRT, res = true) {
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
      for (let s = 0; s <= n; s++) {
        const px = ax + ((bx - ax) * s) / n, py = ay + ((by - ay) * s) / n;
        const wob = (fbm(px * 0.25, py * 0.25, this.seed + 3) - 0.5) * 1.6;
        this.brush(px + wob, py + wob * 0.6, w / 2, t, res);
      }
    }
  }
  brush(cx, cy, r, t, res) {
    for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) {
      if (Math.hypot(i + 0.5 - cx - 0.5, j + 0.5 - cy - 0.5) <= r + 0.2) {
        const cur = this.get(i, j);
        if (t === T.BRIDGE || cur !== T.BRIDGE) this.set(i, j, t);
        if (res) this.reserve(i, j, 1, 1, 1);
      }
    }
  }
  prop(k, x, y, extra = {}) {
    const d = PROP_DEF[k];
    const p = { k, x, y, w: d.w, h: d.h, ...(d.walk ? { walk: true } : {}), ...extra };
    this.props.push(p);
    this.reserve(x, y, p.w, p.h, 1);
    return p;
  }
  // рисует «ручную» рамку деревьев по краю карты (толщина th)
  border(th, t) {
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      const e = Math.min(i, j, this.w - 1 - i, this.h - 1 - j);
      const n = (hash2(i, j, this.seed) - 0.5) * 2;
      const cur = this.get(i, j);
      if (cur === T.WATER || cur === T.DEEP) continue;       // воду рамкой не закрываем
      if ((e < th + n && !this.res[j * this.w + i]) || e < 1) this.set(i, j, t);
    }
  }
  // деревья по шуму там, где трава не зарезервирована
  forest(th, scale = 0.16, seedOff = 21, t = T.TREE) {
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      if (this.res[j * this.w + i] || this.get(i, j) !== T.GRASS) continue;
      if (fbm(i * scale, j * scale, this.seed + seedOff) > th) this.set(i, j, t);
    }
  }
  // отдельные камни и кусты (декор, непроходимые 1х1)
  litter(kind, n, minDist = 3) {
    let tries = 0, placed = 0;
    while (placed < n && tries++ < n * 40) {
      const x = 2 + Math.floor(this.rng() * (this.w - 4)), y = 2 + Math.floor(this.rng() * (this.h - 4));
      if (this.res[y * this.w + x] || this.get(x, y) !== T.GRASS) continue;
      if (this.props.some((p) => Math.abs(p.x - x) < minDist && Math.abs(p.y - y) < minDist)) continue;
      this.props.push({ k: kind, x, y, w: 1, h: 1, deco: true });
      placed++;
    }
  }
  npc(id, x, y, extra = {}) { this.npcs.push({ id, x, y, ...extra }); this.reserveDisc(x, y, 1.5); }
  enemy(type, x, y, lvl, extra = {}) { this.enemies.push({ type, x, y, lvl, ...extra }); }
  chest(id, x, y, loot, extra = {}) { this.chests.push({ id, x, y, loot, ...extra }); this.reserve(Math.floor(x), Math.floor(y), 1, 1, 1); }
  zone(id, x, y, w, h) { this.zones.push({ id, x, y, w, h }); }
  portal(id, x, y, w, h, to, arrive, extra = {}) { this.portals.push({ id, x, y, w, h, to, arrive, ...extra }); this.reserve(x, y, w, h, 1); }
  node(id, item, x, y) { this.nodes.push({ id, item, x, y }); this.reserveDisc(x, y, 1.5); }
  ring(cx, cy, r, kind, n, extra = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.prop(kind, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), extra);
    }
  }

  // ---- подземелья и города
  // комната: пол t в прямоугольнике (всё остальное остаётся стеной)
  room(x, y, w, h, t = T.CRYPT) { this.rect(x, y, w, h, t); }
  // коридор шириной w под прямым углом: сначала по горизонтали, затем по вертикали (или наоборот при vFirst)
  corridor(x1, y1, x2, y2, w = 2, t = T.CRYPT, vFirst = false) {
    const h = Math.floor(w / 2);
    const hz = (xa, xb, y) => this.rect(Math.min(xa, xb) - h, y - h, Math.abs(xb - xa) + w, w, t);
    const vt = (x, ya, yb) => this.rect(x - h, Math.min(ya, yb) - h, w, Math.abs(yb - ya) + w, t);
    if (vFirst) { vt(x1, y1, y2); hz(x1, x2, y2); } else { hz(x1, x2, y1); vt(x2, y1, y2); }
  }
  // расставить n объектов на свободных клетках прямоугольника (без перекрытия)
  scatter(kind, n, x, y, w, h, extra = {}, okTile = null) {
    let tries = 0, placed = 0;
    const d = PROP_DEF[kind];
    while (placed < n && tries++ < n * 60) {
      const px = x + Math.floor(this.rng() * Math.max(1, w - d.w + 1)), py = y + Math.floor(this.rng() * Math.max(1, h - d.h + 1));
      let ok = true;
      for (let j = 0; j < d.h && ok; j++) for (let i = 0; i < d.w && ok; i++) {
        const tt = this.get(px + i, py + j);
        if (TILEDEF[tt].solid || TILEDEF[tt].lava || (okTile && !okTile.includes(tt)) || this.res[(py + j) * this.w + px + i]) ok = false;
      }
      if (!ok) continue;
      this.props.push({ k: kind, x: px, y: py, w: d.w, h: d.h, deco: true, ...extra });
      placed++;
    }
  }
  // ряд объектов: n штук от (x,y) с шагом (dx,dy)
  row(kind, x, y, n, dx, dy, extra = {}) {
    for (let i = 0; i < n; i++) this.prop(kind, x + dx * i, y + dy * i, extra);
  }
  // неровный «шум» декоративных препятствий: камни, обломки (решётка занята)
  rubble(kind, n, x, y, w, h, extra = {}) { this.scatter(kind, n, x, y, w, h, { deco: false, ...extra }); }

  // карта проходимости с учётом объектов (для ботов и тестов)
  solidMap() {
    const s = new Uint8Array(this.w * this.h);
    for (let i = 0; i < s.length; i++) if (TILEDEF[this.tiles[i]].solid) s[i] = 1;
    for (const p of this.props) {
      if (p.walk || (p.deco && p.k === 'reeds')) continue;
      for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) if (this.inb(p.x + i, p.y + j)) s[(p.y + j) * this.w + p.x + i] = 1;
    }
    return s;
  }

  // враги, оказавшиеся в стене или на объекте, сдвигаются на ближайшую свободную клетку
  nudge() {
    const sol = solidGrid({ w: this.w, h: this.h, tiles: this.tiles, props: this.props });
    const bad = (x, y) => x < 0 || y < 0 || x >= this.w || y >= this.h || sol[y * this.w + x] || TILEDEF[this.tiles[y * this.w + x]].lava;
    for (const e of this.enemies) {
      if (!bad(Math.floor(e.x), Math.floor(e.y))) continue;
      let done = false;
      for (let r = 1; r < 6 && !done; r++) {
        for (let j = -r; j <= r && !done; j++) for (let i = -r; i <= r && !done; i++) {
          const x = Math.floor(e.x) + i, y = Math.floor(e.y) + j;
          if (!bad(x, y)) { e.x = x + 0.5; e.y = y + 0.5; done = true; }
        }
      }
    }
  }

  finish() {
    this.nudge();
    return {
      id: this.id, w: this.w, h: this.h, tiles: this.tiles, props: this.props, npcs: this.npcs, enemies: this.enemies,
      chests: this.chests, nodes: this.nodes, zones: this.zones, portals: this.portals, spawn: this.spawn, doors: this.doors,
    };
  }
}


export const mapCache = {};

// проходимость тайла с учётом объектов (для тестов достижимости и ботов)
export function solidGrid(map) {
  const s = new Uint8Array(map.w * map.h);
  for (let i = 0; i < s.length; i++) if (TILEDEF[map.tiles[i]].solid) s[i] = 1;
  for (const p of map.props) {
    if (p.walk || (p.deco && p.k === 'reeds')) continue;
    for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) {
      const x = p.x + i, y = p.y + j;
      if (x >= 0 && y >= 0 && x < map.w && y < map.h) s[y * map.w + x] = 1;
    }
  }
  return s;
}
