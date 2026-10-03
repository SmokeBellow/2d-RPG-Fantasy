// Карты областей. Всё строится кодом с фиксированным seed — карты одинаковы в браузере и в Node.
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
};

class Builder {
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
    const p = { k, x, y, w: d.w, h: d.h, ...extra };
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

  // карта проходимости с учётом объектов (для ботов и тестов)
  solidMap() {
    const s = new Uint8Array(this.w * this.h);
    for (let i = 0; i < s.length; i++) if (TILEDEF[this.tiles[i]].solid) s[i] = 1;
    for (const p of this.props) {
      if (p.deco && p.k === 'reeds') continue;
      for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) if (this.inb(p.x + i, p.y + j)) s[(p.y + j) * this.w + p.x + i] = 1;
    }
    return s;
  }

  finish() {
    return {
      id: this.id, w: this.w, h: this.h, tiles: this.tiles, props: this.props, npcs: this.npcs, enemies: this.enemies,
      chests: this.chests, nodes: this.nodes, zones: this.zones, portals: this.portals, spawn: this.spawn, doors: this.doors,
    };
  }
}

// ======================================================================= ТИХИЙ БРОД
function buildVillage() {
  const b = new Builder('village', 64, 44, 11);
  b.spawn = { x: 32, y: 25 };

  // озеро на юге и пруд
  b.blob(32, 46, 34, 5.5, T.WATER, false, 0.2);
  b.blob(32, 47, 30, 3.2, T.DEEP, false, 0.2);
  b.blob(10, 34, 4.5, 3.5, T.WATER, true, 0.2);
  b.blob(10, 34, 2.6, 1.8, T.DEEP, false, 0.2);
  // песчаный берег
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) {
    if (b.get(i, j) !== T.GRASS) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (b.get(i + dx, j + dy) === T.WATER) { b.set(i, j, T.SAND); b.reserve(i, j, 1, 1, 0); break; }
  }

  // площадь и дороги
  b.disc(32, 22, 7, T.PLAZA);
  b.path([[32, 15], [32, 3]], 3, T.DIRT);
  b.path([[39, 22], [51, 22], [56, 22]], 3, T.DIRT);
  b.path([[25, 22], [20, 24]], 2, T.DIRT);
  b.path([[28, 16], [19, 14]], 2, T.DIRT);
  b.path([[36, 18], [46, 15]], 2, T.DIRT);
  b.path([[32, 29], [26, 33]], 2, T.DIRT);
  b.path([[36, 28], [48, 27]], 2, T.DIRT);
  // луг на востоке
  b.blob(56, 24, 6, 11, T.GRASS, true, 0.3);

  // здания
  b.prop('hut', 14, 10, { sprite: 'elder' });                 // дом старейшины
  b.prop('smithy', 12, 22);                                  // кузница
  b.prop('anvil', 18, 25);
  b.prop('tavern', 42, 10);                                  // таверна «Дымный котёл»
  b.prop('hut', 46, 23, { sprite: 'herb' });                 // травница
  b.prop('house', 21, 31);
  b.prop('house', 38, 32);
  b.prop('stall', 25, 16);                                   // лавка Миры
  b.prop('well', 36, 24);
  b.prop('beacon', 36, 9, { id: 'beacon', use: 'beacon' });  // маяк Тихого Брода
  b.prop('shrine', 31, 26, { id: 'shrine_village', use: 'shrine', name: 'Алтарь Огня' });
  b.prop('barrel', 20, 25); b.prop('barrel', 19, 27); b.prop('crate', 47, 14); b.prop('barrel', 48, 14);
  b.prop('sign', 34, 6, { use: 'sign', text: 'Север — Шёпотный лес. Дозор не выходит за черту после заката. Не спрашивайте почему.' });
  b.prop('sign', 50, 21, { use: 'sign', text: 'Восточный луг. После Серой зимы земля здесь не родит. Слизь выходит из неё сама.' });
  b.prop('statue', 29, 6);
  b.prop('cart', 24, 25);

  // NPC
  b.npc('orwen', 17, 14);
  b.npc('torvald', 15, 26);
  b.npc('bom', 45, 14);
  b.npc('lissa', 49, 27);
  b.npc('mira', 26, 19);
  b.npc('garth', 30, 5);
  b.npc('tim', 27, 29);

  // слизни на лугу
  const slimes = [[53, 15], [58, 17], [54, 20], [58, 25], [54, 29], [58, 31], [55, 35]];
  for (const [x, y] of slimes) b.enemy('slime', x, y, 1);

  b.chest('v_chest1', 8, 20, [['gold', 40], ['p_hp1', 2]]);
  b.chest('v_chest2', 60, 38, [['gold', 55], ['p_mp1', 2]]);
  b.reserve(7, 19, 3, 3, 1); b.reserve(59, 37, 3, 3, 1);

  b.zone('beacon_area', 34, 11, 7, 5);
  b.portal('to_forest', 31, 1, 3, 2, 'forest', { x: 47.5, y: 66.5 });

  b.border(3, T.TREE);
  b.forest(0.58, 0.14, 5);
  b.litter('bush', 26, 4);
  b.litter('boulder', 8, 6);
  return b.finish();
}

// ======================================================================= ШЁПОТНЫЙ ЛЕС
function buildForest() {
  const b = new Builder('forest', 96, 72, 23);
  b.spawn = { x: 47, y: 66 };

  // поляны (все зарезервированы, чтобы не заросли)
  const A = [47, 57];       // стартовая поляна
  b.blob(A[0], A[1], 9, 6, T.GRASS, true);
  b.blob(47, 38, 11, 7.5, T.WATER, false, 0.18);
  b.blob(47, 38, 8, 5, T.DEEP, false, 0.18);
  b.blob(26, 40, 11, 8.5, T.GRASS, true);                // лагерь разбойников
  b.blob(73, 39, 12, 9, T.GRASS, true);                  // лагерь гоблинов
  b.blob(47, 18, 8, 6, T.GRASS, true);                   // святилище
  b.blob(17, 15, 8, 6, T.GRASS, true);                   // паучья чаща
  b.blob(84, 62, 6, 5, T.GRASS, true);                   // поляна кота
  b.blob(15, 61, 7, 5, T.GRASS, true);                   // волчье логово
  b.blob(84, 12, 6, 5, T.GRASS, true);                   // подход к Цитадели
  b.blob(60, 63, 4, 3, T.GRASS, true);                   // цветочная опушка
  b.blob(33, 63, 4, 3, T.GRASS, true);

  // тропы
  b.path([[47, 69], [47, 62], [47, 57]], 2.4, T.DIRT);
  b.path([[44, 57], [34, 52], [28, 47]], 2.4, T.DIRT);       // на запад: разбойники
  b.path([[50, 57], [60, 52], [68, 46]], 2.4, T.DIRT);       // на восток: гоблины
  b.path([[27, 33], [29, 26], [38, 21], [44, 19]], 2.4, T.DIRT); // разбойники -> святилище
  b.path([[72, 31], [66, 25], [56, 20], [51, 19]], 2.4, T.DIRT); // гоблины -> святилище
  b.path([[47, 14], [47, 10]], 3, T.DIRT);                 // святилище -> врата склепа
  b.path([[27, 33], [20, 20], [17, 15]], 2, T.DIRT);       // к паукам
  b.path([[77, 31], [82, 22], [84, 14]], 2.4, T.DIRT);       // к Цитадели
  b.path([[56, 58], [70, 60], [82, 62]], 2, T.DIRT);       // к коту
  b.path([[40, 58], [26, 60], [16, 61]], 2, T.DIRT);       // к волкам
  b.path([[50, 59], [60, 63]], 2, T.DIRT);
  b.path([[44, 59], [33, 63]], 2, T.DIRT);

  // озеро: остров с сундуком и мост
  b.disc(47, 37, 2.5, T.SAND, true);
  b.path([[47, 44], [47, 40]], 2, T.BRIDGE, true);
  b.chest('f_island', 47, 37, [['q_amulet', 1]]);
  // берег: песок вокруг воды
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) {
    if (b.get(i, j) !== T.GRASS) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (b.get(i + dx, j + dy) === T.WATER) { b.set(i, j, T.SAND); b.reserve(i, j, 1, 1, 1); break; }
  }

  // врата склепа и святилище
  b.prop('cryptgate', 45, 6, { id: 'cryptgate' });
  b.prop('shrine', 46, 17, { id: 'shrine_forest', use: 'shrine', name: 'Лесной алтарь' });
  b.prop('obelisk', 42, 14, { use: 'sign', text: 'Здесь Эмбер Сорен принёс клятву и зажёг Пламя. Имена тех, кто стоял рядом, стёрты намеренно.' });
  b.prop('obelisk', 52, 14, { use: 'sign', text: '«Пламя горит, пока есть тот, кто согласен». Остальное высечено глубже и закрашено.' });
  b.prop('sign', 49, 63, { use: 'sign', text: '← Волчьи тропы. Не заходить без меча.' });
  b.prop('sign', 44, 62, { use: 'sign', text: 'Тихий Брод — на юге.' });
  b.portal('cryptgate', 46, 8, 2, 1, 'crypt', { x: 32.5, y: 49.5 }, { req: { item: 'q_key' }, msg: 'Врата заперты. Нужен ключ с черепом.' });
  b.portal('to_village', 46, 70, 4, 1, 'village', { x: 32.5, y: 4.5 });
  b.portal('to_citadel', 82, 8, 4, 1, 'citadel', { x: 28.5, y: 58.5 }, { req: { flag: 'beacon_lit' }, msg: 'Барьер Скверны не пускает. Пламя маяка должно вспыхнуть вновь.' });
  b.prop('barrier', 82, 9, { id: 'barrier', flagGone: 'beacon_lit' });

  // лагерь разбойников
  b.prop('tent', 18, 36); b.prop('tent', 18, 42); b.prop('tent', 31, 45);
  b.prop('campfire', 26, 41); b.prop('crate', 21, 46); b.prop('barrel', 33, 36); b.prop('crate', 22, 33);
  b.prop('sign', 28, 33, { use: 'sign', text: 'ЗДЕСЬ НЕ ТЕ, КОГО ВЫ ИЩЕТЕ. УХОДИТЕ. — В. Г.' });
  b.enemy('captain', 25, 37, 7, { unique: 'captain' });
  for (const [x, y] of [[20, 40], [30, 38], [23, 45], [31, 42], [27, 34]]) b.enemy('bandit', x, y, 5);
  b.chest('f_bandit', 17, 40, [['gold', 90], ['c_wolf', 1]]);

  // лагерь гоблинов
  b.prop('tent', 64, 34); b.prop('tent', 80, 36); b.prop('tent', 66, 45);
  b.prop('campfire', 72, 41); b.prop('crate', 78, 44); b.prop('barrel', 63, 40); b.prop('barrel', 70, 46);
  b.prop('rack', 78, 32);
  b.enemy('chieftain', 74, 37, 6, { unique: 'chieftain' });
  for (const [x, y] of [[66, 39], [70, 44], [78, 41], [69, 34]]) b.enemy('goblin', x, y, 4);
  for (const [x, y] of [[62, 42], [80, 40]]) b.enemy('goblinArcher', x, y, 4);
  b.chest('f_goblin', 82, 44, [['gold', 70], ['@weapon3', 1]]);

  // стартовая поляна и волчьи тропы
  for (const [x, y] of [[41, 56], [53, 54], [47, 53]]) b.enemy('wolf', x, y, 2);
  for (const [x, y] of [[11, 59], [14, 64], [18, 60], [19, 63]]) b.enemy('wolf', x, y, 3);
  for (const [x, y] of [[82, 60], [86, 64], [88, 61]]) b.enemy('wolf', x, y, 4);
  // пауки
  for (const [x, y] of [[13, 13], [20, 12], [15, 18], [21, 17], [11, 16]]) b.enemy('spider', x, y, 5);
  b.chest('f_spider', 10, 11, [['gold', 60], ['p_hp2', 2]]);
  // охрана у святилища и у врат
  for (const [x, y] of [[40, 22], [54, 22]]) b.enemy('wolf', x, y, 4);
  // путь к Цитадели
  for (const [x, y] of [[80, 20], [86, 18]]) b.enemy('goblin', x, y, 5);

  // сборные цветы и кот
  for (const [id, x, y] of [['mf1', 60, 63], ['mf2', 62, 62], ['mf3', 33, 63], ['mf4', 35, 64], ['mf5', 84, 58], ['mf6', 15, 58], ['mf7', 38, 25]]) b.node(id, 'q_flower', x, y);
  b.npc('pushok', 85, 62);
  b.zone('shrine_clearing', 42, 14, 10, 8);

  b.border(3, T.TREE);
  b.forest(0.43, 0.13, 9);
  b.litter('bush', 90, 3);
  b.litter('boulder', 30, 5);
  b.litter('stump', 22, 5);
  return b.finish();
}

// ======================================================================= СКЛЕП
function buildCrypt() {
  const b = new Builder('crypt', 64, 56, 37, T.CWALL);
  b.spawn = { x: 32, y: 49 };
  const floor = (x, y, w, h) => b.rect(x, y, w, h, T.CRYPT);

  floor(26, 44, 12, 8);            // вход
  floor(30, 52, 4, 2);
  floor(30, 36, 4, 8);             // коридор вверх
  floor(20, 26, 24, 10);           // зал-хаб
  floor(14, 30, 6, 2); floor(4, 24, 11, 14);      // запад: библиотека
  floor(44, 30, 5, 2); floor(49, 24, 11, 14);     // восток: оружейная
  floor(30, 21, 4, 5);             // коридор в часовню
  floor(20, 14, 24, 7);            // часовня
  floor(30, 12, 4, 2);             // место перед вратами
  floor(16, 2, 32, 10);            // тронный зал склепа (босс)

  // колонны, светильники
  for (const [x, y] of [[22, 27], [22, 33], [41, 27], [41, 33], [28, 28], [35, 28], [28, 33], [35, 33]]) b.prop('pillar', x, y);
  for (const [x, y] of [[22, 16], [41, 16], [26, 19], [37, 19]]) b.prop('brazier', x, y);
  for (const [x, y] of [[20, 4], [43, 4], [20, 9], [43, 9], [27, 4], [36, 4]]) b.prop('pillar', x, y);
  for (const [x, y] of [[27, 46], [36, 46]]) b.prop('brazier', x, y);
  for (const [x, y] of [[6, 26], [12, 26]]) b.prop('bookshelf', x, y);
  b.prop('bookshelf', 8, 26, { id: 'page1', use: 'page', n: 1, text: 'Страница I. «Серая зима длилась четыре года. Мёртвых складывали во рвы без имён: некому было их записать. На второй год рвы заговорили».' });
  b.prop('coffin', 52, 36); b.prop('coffin', 55, 36); b.prop('tomb', 51, 26); b.prop('tomb', 57, 26);
  b.prop('rack', 53, 26, { id: 'page2', use: 'page', n: 2, text: 'Страница II. «Король не стал воевать с голосами. Он зажёг Пламя и привязал его к себе: пока оно горит, они молчат. Он называл это клятвой. Я бы назвал это долгом, который нельзя выплатить до конца».' });
  b.prop('lever', 5, 28, { id: 'lever_w', use: 'lever', text: 'Рычаг западного крыла' });
  b.prop('lever', 58, 28, { id: 'lever_e', use: 'lever', text: 'Рычаг восточного крыла' });
  b.prop('shrine', 31, 15, { id: 'shrine_crypt', use: 'shrine', name: 'Склепный алтарь' });
  b.prop('bookshelf', 24, 14, { id: 'page3', use: 'page', n: 3, text: 'Страница III. «Эйлард сказал в последнюю ночь: я больше не могу гореть. Совет ответил: тогда найдём другого. Я пишу это потому, что скоро некому будет записать, кого именно».' });
  b.prop('statue', 32, 5);
  b.prop('throne', 31, 3);
  b.prop('brazier', 18, 3); b.prop('brazier', 45, 3);

  b.doors.push({ id: 'bossgate', x: 30, y: 12, w: 4, h: 2, opens: ['lever_w', 'lever_e'] });
  b.prop('stonedoor', 30, 12, { id: 'bossgate', door: true });

  b.portal('to_forest', 30, 53, 4, 1, 'forest', { x: 47, y: 12 });

  // враги
  for (const [x, y] of [[26, 30], [36, 32], [32, 28]]) b.enemy('bat', x, y, 7);
  for (const [x, y] of [[24, 31], [39, 31]]) b.enemy('skeleton', x, y, 8);
  for (const [x, y] of [[7, 30], [11, 33], [8, 35]]) b.enemy('skeleton', x, y, 8);
  for (const [x, y] of [[53, 30], [57, 33], [54, 34]]) b.enemy('skeleton', x, y, 8);
  b.enemy('bat', 10, 28, 7); b.enemy('bat', 54, 28, 7);
  for (const [x, y] of [[26, 17], [38, 17]]) b.enemy('wraith', x, y, 9);
  b.enemy('king', 32, 7, 10, { unique: 'king' });

  b.chest('c_lib', 5, 35, [['gold', 120], ['p_hp2', 2], ['p_mp2', 1]]);
  b.chest('c_arm', 58, 35, [['gold', 120], ['@armor3', 1]]);
  b.chest('c_chapel', 41, 15, [['gold', 150], ['p_mp2', 2]]);

  b.zone('boss_hall', 16, 2, 32, 10);
  return b.finish();
}

// ======================================================================= ЦИТАДЕЛЬ
function buildCitadel() {
  const b = new Builder('citadel', 56, 64, 53, T.BWALL);
  b.spawn = { x: 28, y: 58 };
  const floor = (x, y, w, h, t = T.BLIGHT) => b.rect(x, y, w, h, t);

  floor(14, 46, 28, 12);          // двор
  floor(26, 58, 4, 3);
  // лавовые рвы вокруг моста
  floor(14, 36, 28, 10, T.LAVA);
  floor(25, 36, 6, 10, T.BLIGHT);   // мост
  floor(10, 26, 36, 10);            // средний зал
  floor(25, 18, 6, 8);              // коридор
  floor(8, 3, 40, 15);              // тронный зал
  // лава по краям тронного зала
  floor(8, 3, 4, 15, T.LAVA); floor(44, 3, 4, 15, T.LAVA);

  for (const [x, y] of [[17, 48], [38, 48], [17, 54], [38, 54]]) b.prop('brazier', x, y);
  for (const [x, y] of [[13, 28], [42, 28], [13, 33], [42, 33], [22, 29], [33, 29]]) b.prop('pillar', x, y);
  for (const [x, y] of [[15, 5], [40, 5], [15, 12], [40, 12], [22, 8], [33, 8]]) b.prop('pillar', x, y);
  b.prop('shrine', 27, 53, { id: 'shrine_citadel', use: 'shrine', name: 'Осквернённый алтарь' });
  b.prop('banner', 20, 26); b.prop('banner', 35, 26);
  b.prop('throne', 27, 3);
  b.prop('statue', 18, 20); b.prop('statue', 37, 20);

  b.portal('to_forest', 26, 61, 4, 1, 'forest', { x: 84, y: 11 });

  for (const [x, y] of [[20, 50], [35, 50], [28, 48]]) b.enemy('husk', x, y, 11);
  for (const [x, y] of [[18, 53], [37, 54]]) b.enemy('spitter', x, y, 11);
  for (const [x, y] of [[14, 30], [41, 30], [28, 31]]) b.enemy('husk', x, y, 12);
  for (const [x, y] of [[20, 32], [36, 32]]) b.enemy('wraith', x, y, 12);
  for (const [x, y] of [[26, 28], [30, 34]]) b.enemy('bat', x, y, 11);
  b.enemy('lord', 28, 8, 15, { unique: 'lord' });

  b.chest('z_chest1', 12, 31, [['gold', 200], ['p_hp2', 3], ['p_mp2', 2]]);
  b.chest('z_chest2', 43, 31, [['gold', 200], ['p_hp2', 3], ['c_ember', 1]]);
  b.zone('throne_hall', 12, 3, 32, 15);
  return b.finish();
}

const BUILDERS = { village: buildVillage, forest: buildForest, crypt: buildCrypt, citadel: buildCitadel };
const cache = {};
export function getMap(id) { return cache[id] || (cache[id] = BUILDERS[id]()); }
export const AREA_IDS = Object.keys(BUILDERS);

// проходимость тайла с учётом объектов (для тестов достижимости)
export function solidGrid(map) {
  const s = new Uint8Array(map.w * map.h);
  for (let i = 0; i < s.length; i++) if (TILEDEF[map.tiles[i]].solid) s[i] = 1;
  for (const p of map.props) {
    if (p.deco && p.k === 'reeds') continue;
    for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) {
      const x = p.x + i, y = p.y + j;
      if (x >= 0 && y >= 0 && x < map.w && y < map.h) s[y * map.w + x] = 1;
    }
  }
  return s;
}
