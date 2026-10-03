// Тайлы земли: рисуются один раз на карту в большой канвас (кеш). Всё процедурно, 4 тона на материал.
import { TILE, T } from './defs.js';
import { mk, rect, dot, shade, mix, hex2rgb } from './px.js';
import { hash2, fbm } from './util.js';

const PAL = {
  grass: ['#3d7a31', '#4a8c3a', '#589a43', '#6aae4f'],
  grassFor: ['#2f6a2c', '#3a7a32', '#468a3a', '#559a45'],
  dirt: ['#7c5a3a', '#8e6a44', '#a07b52', '#b48d62'],
  plaza: ['#8d8576', '#9c9484', '#aca494', '#bcb4a4'],
  sand: ['#c9b47a', '#d6c28a', '#e2cf9c', '#ecdcae'],
  water: ['#245f9e', '#2c6fb0', '#3a82c4', '#5aa0d8'],
  deep: ['#1a4580', '#205294', '#2a62a8', '#3a76bc'],
  wood: ['#7a5230', '#8e6238', '#a0743f', '#b4864c'],
  crypt: ['#3c3c54', '#484864', '#565678', '#68688a'],
  cwall: ['#2c2a42', '#3a3858', '#4a4770', '#625e8c'],
  lava: ['#7a1a10', '#b02a10', '#e05a14', '#ffa030'],
  blight: ['#2e2244', '#3a2c56', '#483868', '#5c4682'],
  bwall: ['#241a3a', '#30244e', '#40326a', '#5a4690'],
  swamp: ['#2a4a2e', '#355a35', '#416a3a', '#4e7a44'],
  snow: ['#c6d2de', '#d6e0ea', '#e6eef6', '#f6fafe'],
  ice: ['#76acd6', '#88bce2', '#a2d0f0', '#c8e8fa'],
  ash: ['#38342f', '#443f3a', '#524c46', '#645d56'],
  cobble: ['#6e685e', '#7c766a', '#8c8678', '#9c9688'],
  rock: ['#5a5a64', '#6e6e78', '#84848e', '#9c9ca6'],
};

const cacheTile = new Map();

// пиксельная заливка шумом из палитры p (4 тона), s — случайное зерно
const rgbCache = new Map();
function rgbOf(hex) {
  let v = rgbCache.get(hex);
  if (!v) { const n = parseInt(hex.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; rgbCache.set(hex, v); }
  return v;
}
let scratchImg = null;
// пиксельная заливка шумом из палитры p (4 тона): пишем прямо в ImageData, это на порядок быстрее fillRect
function noiseFill(x, px, py, p, seed, spread = 0.12, baseArg = 1) {
  if (!scratchImg) scratchImg = x.createImageData(TILE, TILE);
  const d = scratchImg.data;
  const bf = typeof baseArg === 'function' ? baseArg : null;
  let bc = null;
  if (bf) { bc = []; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) bc[j * 8 + i] = bf(i * 2, j * 2); }
  const cols = p.map(rgbOf);
  for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) {
    const n = hash2(px + i, py + j, seed);
    const base = bf ? bc[(j >> 1) * 8 + (i >> 1)] : baseArg;
    let k = base;
    if (n < spread) k = base - 1; else if (n > 1 - spread) k = base + 1;
    if (n < spread * 0.25) k = base - 1;
    const c = cols[Math.max(0, Math.min(3, k))];
    const o = (j * TILE + i) * 4;
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
  x.putImageData(scratchImg, 0, 0);
}

function grassTile(x, wx, wy, forest) {
  const p = forest ? PAL.grassFor : PAL.grass;
  // крупные пятна разных оттенков
  const base = (i, j) => {
    const patch = fbm((wx + i) * 0.05, (wy + j) * 0.05, 4);
    return patch > 0.6 ? 2 : patch < 0.4 ? 0 : 1;
  };
  noiseFill(x, wx, wy, p, 9, 0.11, base);
  // травинки
  for (let k = 0; k < 3; k++) {
    const h = hash2(wx + k * 5, wy + k * 3, 17);
    if (h < 0.55) continue;
    const bx = Math.floor(hash2(wx + k, wy, 21) * 13) + 1, by = Math.floor(hash2(wx, wy + k, 23) * 11) + 3;
    dot(x, bx, by, p[3]); dot(x, bx, by - 1, p[3]); dot(x, bx + 1, by - 2, p[2]);
    dot(x, bx - 1, by - 2, p[2]);
  }
  // цветы
  const fl = hash2(wx, wy, 31);
  if (!forest && fl > 0.965) {
    const cols = ['#f4e8a0', '#f0a0c0', '#ffffff', '#e8c060'];
    const c = cols[Math.floor(hash2(wx, wy, 33) * cols.length)];
    const fx = 3 + Math.floor(hash2(wx, wy, 35) * 10), fy = 4 + Math.floor(hash2(wx, wy, 37) * 8);
    dot(x, fx, fy, c); dot(x, fx - 1, fy, c); dot(x, fx + 1, fy, c); dot(x, fx, fy - 1, c); dot(x, fx, fy + 1, c); dot(x, fx, fy, '#d89030');
    dot(x, fx, fy + 2, p[0]);
  }
  if (forest && fl > 0.93) { // грибы и палая листва
    const fx = 3 + Math.floor(hash2(wx, wy, 35) * 10), fy = 6 + Math.floor(hash2(wx, wy, 37) * 6);
    if (fl > 0.985) { rect(x, fx, fy, 3, 1, '#e8e0d0'); rect(x, fx - 1, fy - 2, 5, 2, '#b84a38'); dot(x, fx, fy - 2, '#f0d8c0'); dot(x, fx + 2, fy - 1, '#f0d8c0'); }
    else { dot(x, fx, fy, '#b88a3a'); dot(x, fx + 1, fy, '#a0702a'); dot(x, fx + 1, fy + 1, '#c89a44'); }
  }
}

function edgeBlend(x, px, py, n, selfFn, mineCol, getOther) {
  // растушёвка границы: n = [up, right, down, left] — true, если сосед другого материала
  for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) {
    let d = 99;
    if (n[0]) d = Math.min(d, j);
    if (n[2]) d = Math.min(d, TILE - 1 - j);
    if (n[3]) d = Math.min(d, i);
    if (n[1]) d = Math.min(d, TILE - 1 - i);
    if (d > 2) continue;
    const h = hash2(px + i, py + j, 55);
    if (h < (3 - d) * 0.28 - 0.05) { x.fillStyle = getOther(i, j); x.fillRect(i, j, 1, 1); }
  }
}

function dirtTile(x, wx, wy, forest, nb) {
  noiseFill(x, wx, wy, PAL.dirt, 13, 0.13, 1);
  for (let k = 0; k < 2; k++) {
    if (hash2(wx, wy + k, 41) > 0.5) {
      const bx = Math.floor(hash2(wx + k, wy, 43) * 12) + 1, by = Math.floor(hash2(wx, wy + k, 45) * 12) + 1;
      rect(x, bx, by, 2, 1, PAL.dirt[3]); dot(x, bx, by + 1, PAL.dirt[0]);
    }
  }
  if (hash2(wx, wy, 47) > 0.9) { rect(x, 6, 7, 1, 1, '#c9b08a'); rect(x, 7, 8, 2, 1, '#8a7258'); }
  if (nb) edgeBlend(x, wx, wy, nb, null, null, () => { const p = forest ? PAL.grassFor : PAL.grass; return p[Math.floor(hash2(wx * 3, wy * 5, 8) * 3)]; });
}

function plazaTile(x, wx, wy, tx, ty) {
  // булыжник: камни неправильной формы, раствор тёмным
  noiseFill(x, wx, wy, PAL.plaza, 19, 0.1, 1);
  const off = (ty % 2) * 4;
  for (let j = 0; j < TILE; j += 1) for (let i = 0; i < TILE; i++) {
    const row = Math.floor(j / 8);
    const lx = (i + off + row * 3) % 8;
    if (j % 8 === 0 || lx === 0) { x.fillStyle = '#6e675a'; x.fillRect(i, j, 1, 1); }
    else if (j % 8 === 1 || lx === 1) { x.fillStyle = PAL.plaza[3]; x.fillRect(i, j, 1, 1); }
  }
  if (hash2(wx, wy, 3) > 0.92) { rect(x, 5, 6, 3, 1, '#7a7366'); }
}

function sandTile(x, wx, wy) {
  noiseFill(x, wx, wy, PAL.sand, 23, 0.14, 1);
  if (hash2(wx, wy, 5) > 0.8) { dot(x, 4, 6, '#a8946a'); dot(x, 10, 11, '#a8946a'); }
}

function waterTile(x, wx, wy, tx, ty, deep, nb) {
  const p = deep ? PAL.deep : PAL.water;
  noiseFill(x, wx, wy, p, 29, 0.07, 1);
  // горизонтальные блики волн
  for (let k = 0; k < 2; k++) {
    const h = hash2(tx, ty, 61 + k);
    if (h > 0.4) { const bx = Math.floor(hash2(tx, ty, 63 + k) * 8), by = 3 + k * 7; rect(x, bx, by, 5, 1, p[3]); rect(x, bx + 1, by + 1, 3, 1, p[2]); }
  }
  // пена у берега
  if (nb) {
    for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) {
      let d = 99;
      if (nb[0]) d = Math.min(d, j);
      if (nb[2]) d = Math.min(d, TILE - 1 - j);
      if (nb[3]) d = Math.min(d, i);
      if (nb[1]) d = Math.min(d, TILE - 1 - i);
      if (d <= 1 && hash2(wx + i, wy + j, 71) > 0.3) { x.fillStyle = d === 0 ? '#ffffff' : '#bfe0f4'; x.fillRect(i, j, 1, 1); }
      else if (d === 2 && hash2(wx + i, wy + j, 73) > 0.8) { x.fillStyle = '#8cc4e8'; x.fillRect(i, j, 1, 1); }
    }
  }
}

function woodTile(x, wx, wy) {
  noiseFill(x, wx, wy, PAL.wood, 37, 0.1, 1);
  for (let j = 3; j < TILE; j += 8) rect(x, 0, j, TILE, 1, PAL.wood[0]);
  rect(x, (Math.floor(hash2(wx, wy, 9) * 12)) + 1, 0, 1, 3, PAL.wood[0]);
}

function bridgeTile(x, wx, wy, horiz) {
  // доски поперёк движения
  noiseFill(x, wx, wy, PAL.water, 29, 0.07, 1);
  rect(x, 0, 0, TILE, TILE, PAL.wood[1]);
  for (let i = 0; i < TILE; i += 4) { rect(x, 0, i, TILE, 1, PAL.wood[0]); rect(x, 0, i + 1, TILE, 1, PAL.wood[3]); }
  rect(x, 0, 0, 1, TILE, '#4a3220'); rect(x, TILE - 1, 0, 1, TILE, '#4a3220');
  for (let j = 0; j < TILE; j += 4) { dot(x, 1, j + 2, '#2a1a10'); dot(x, TILE - 2, j + 2, '#2a1a10'); }
}

function cryptFloor(x, wx, wy, tx, ty, theme) {
  const p = theme === 'blight' ? PAL.blight : PAL.crypt;
  noiseFill(x, wx, wy, p, 43, 0.12, 1);
  // плиты 8x8 со швами
  rect(x, 0, 0, TILE, 1, p[0]); rect(x, 0, 0, 1, TILE, p[0]);
  rect(x, 0, 8, TILE, 1, p[0]); rect(x, 8, 0, 1, 8, p[0]);
  rect(x, 4, 9, 1, 7, p[0]);
  rect(x, 1, 1, 7, 1, p[2]); rect(x, 1, 9, 3, 1, p[2]); rect(x, 9, 1, 7, 1, p[2]);
  const h = hash2(tx, ty, 77);
  if (h > 0.93) { dot(x, 9, 11, p[0]); dot(x, 10, 12, p[0]); dot(x, 11, 12, p[0]); dot(x, 12, 13, p[0]); }
  if (theme === 'crypt' && h < 0.04) { rect(x, 5, 6, 4, 1, '#d8d0c0'); dot(x, 4, 5, '#d8d0c0'); dot(x, 9, 5, '#d8d0c0'); }
  if (theme === 'blight' && h > 0.45 && h < 0.5) { rect(x, 6, 7, 4, 1, '#a060e0'); dot(x, 7, 6, '#a060e0'); dot(x, 8, 8, '#a060e0'); }
}

// стена: «лицо» (если ниже проходимо) — кирпич; иначе тёмная крыша стены
function wallTile(x, wx, wy, tx, ty, face, theme) {
  const p = theme === 'blight' ? PAL.bwall : PAL.cwall;
  const lit = theme === 'blight' ? '#5a3a86' : '#5a5880';
  if (!face) {
    noiseFill(x, wx, wy, p, 47, 0.1, 0);
    return;
  }
  noiseFill(x, wx, wy, p, 47, 0.1, 1);
  for (let j = 0; j < TILE; j += 5) {
    rect(x, 0, j, TILE, 1, p[0]);
    const off = (j / 5) % 2 ? 4 : 0;
    for (let i = off; i < TILE; i += 8) rect(x, i, j, 1, 5, p[0]);
    rect(x, 0, j + 1, TILE, 1, p[3]);
  }
  rect(x, 0, TILE - 2, TILE, 2, p[0]);
  rect(x, 0, 0, TILE, 1, lit);
  if (hash2(tx, ty, 79) > 0.9) { rect(x, 4, 6, 3, 2, p[0]); }
}

function swampTile(x, wx, wy, tx, ty) {
  noiseFill(x, wx, wy, PAL.swamp, 61, 0.14, (i, j) => { const n = fbm((wx + i) * 0.07, (wy + j) * 0.07, 3); return n > 0.58 ? 2 : n < 0.38 ? 0 : 1; });
  const h = hash2(tx, ty, 63);
  if (h > 0.72) { rect(x, 3, 5, 9, 5, '#24505a'); rect(x, 4, 6, 7, 3, '#2e6a70'); rect(x, 6, 6, 2, 1, '#6aa8a8'); }
  if (h < 0.1) { rect(x, 7, 3, 1, 5, '#6a8a3a'); rect(x, 9, 4, 1, 4, '#7a9a44'); }
}
function snowTile(x, wx, wy, tx, ty) {
  noiseFill(x, wx, wy, PAL.snow, 67, 0.1, 2);
  if (hash2(tx, ty, 69) > 0.8) { rect(x, 4, 9, 5, 1, PAL.snow[0]); rect(x, 5, 10, 3, 1, PAL.snow[1]); }
}
function iceTile(x, wx, wy, tx, ty) {
  noiseFill(x, wx, wy, PAL.ice, 71, 0.08, 2);
  const h = hash2(tx, ty, 73);
  if (h > 0.5) { rect(x, 2, 4 + Math.floor(h * 6), 9, 1, '#e8f6ff'); rect(x, 6, 5 + Math.floor(h * 6), 6, 1, PAL.ice[0]); }
}
function ashTile(x, wx, wy, tx, ty) {
  noiseFill(x, wx, wy, PAL.ash, 75, 0.16, 1);
  const h = hash2(tx, ty, 77);
  if (h > 0.9) { dot(x, 5, 6, '#ff8a3a'); dot(x, 6, 6, '#ffb060'); }
}
function cobbleTile(x, wx, wy, tx, ty) {
  noiseFill(x, wx, wy, PAL.cobble, 79, 0.1, 1);
  for (let j = 0; j < TILE; j += 5) { rect(x, 0, j, TILE, 1, PAL.cobble[0]); const off = (j / 5) % 2 ? 4 : 0; for (let i = off; i < TILE; i += 8) rect(x, i, j, 1, 5, PAL.cobble[0]); }
  rect(x, 1, 1, 6, 1, PAL.cobble[3]);
}

function lavaTile(x, wx, wy, tx, ty) {
  const p = PAL.lava;
  noiseFill(x, wx, wy, p, 53, 0.2, 1);
  // тёмная корка плитами
  for (let k = 0; k < 4; k++) {
    const h = hash2(tx + k, ty - k, 83);
    if (h > 0.5) {
      const bx = Math.floor(hash2(tx, ty + k, 85) * 10), by = Math.floor(hash2(tx + k, ty, 87) * 10);
      rect(x, bx, by, 5, 3, '#4a1408'); rect(x, bx + 1, by + 1, 3, 1, '#6a2410');
    }
  }
}

function rockTile(x, wx, wy) {
  noiseFill(x, wx, wy, PAL.rock, 59, 0.14, 1);
}

// ---------------------------------------------------------------- фон области
// Рисует всю карту в один канвас. Деревья здесь — трава (кроны рисуются объектами).
export function buildGround(map, theme) {
  const [c, x] = mk(map.w * TILE, map.h * TILE);
  const forest = ['forest', 'grove'].includes(theme);
  const dark = ['crypt', 'citadel', 'mine', 'sewer', 'temple', 'vault', 'abbey', 'library', 'den'].includes(theme);
  const get = (tx, ty) => (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h ? T.WALL : map.tiles[ty * map.w + tx]);
  const isWater = (t) => t === T.WATER || t === T.DEEP;
  const isWall = (t) => t === T.CWALL || t === T.BWALL || t === T.WALL || t === T.ROCK;
  const [tc, tcx] = mk(TILE, TILE);
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
    const t = get(tx, ty);
    tcx.clearRect(0, 0, TILE, TILE);
    const wx = tx * TILE, wy = ty * TILE;
    const nbOf = (pred) => [pred(get(tx, ty - 1)), pred(get(tx + 1, ty)), pred(get(tx, ty + 1)), pred(get(tx - 1, ty))];
    switch (t) {
      case T.GRASS: case T.TREE: grassTile(tcx, wx, wy, forest); break;
      case T.DIRT: {
        const nb = nbOf((o) => o !== T.DIRT && o !== T.BRIDGE && o !== T.PLAZA);
        dirtTile(tcx, wx, wy, forest, nb.some(Boolean) ? nb : null); break;
      }
      case T.PLAZA: plazaTile(tcx, wx, wy, tx, ty); break;
      case T.SAND: sandTile(tcx, wx, wy); break;
      case T.WATER: case T.DEEP: {
        const nb = nbOf((o) => !isWater(o) && o !== T.BRIDGE);
        waterTile(tcx, wx, wy, tx, ty, t === T.DEEP, nb.some(Boolean) ? nb : null); break;
      }
      case T.BRIDGE: bridgeTile(tcx, wx, wy, true); break;
      case T.WOOD: woodTile(tcx, wx, wy); break;
      case T.CRYPT: cryptFloor(tcx, wx, wy, tx, ty, 'crypt'); break;
      case T.BLIGHT: cryptFloor(tcx, wx, wy, tx, ty, 'blight'); break;
      case T.CWALL: wallTile(tcx, wx, wy, tx, ty, !isWall(get(tx, ty + 1)), 'crypt'); break;
      case T.BWALL: wallTile(tcx, wx, wy, tx, ty, !isWall(get(tx, ty + 1)), 'blight'); break;
      case T.LAVA: lavaTile(tcx, wx, wy, tx, ty); break;
      case T.SWAMP: swampTile(tcx, wx, wy, tx, ty); break;
      case T.SNOW: snowTile(tcx, wx, wy, tx, ty); break;
      case T.ICE: iceTile(tcx, wx, wy, tx, ty); break;
      case T.ASH: ashTile(tcx, wx, wy, tx, ty); break;
      case T.COBBLE: cobbleTile(tcx, wx, wy, tx, ty); break;
      case T.ROCK: case T.WALL: rockTile(tcx, wx, wy); break;
      default: grassTile(tcx, wx, wy, forest);
    }
    x.drawImage(tc, tx * TILE, ty * TILE);
  }
  // мягкие тени от стен/деревьев на землю (в подземельях: затемнение у стен)
  if (dark) {
    for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
      const t = get(tx, ty);
      if (isWall(t)) continue;
      if (isWall(get(tx, ty - 1))) { x.fillStyle = 'rgba(5,3,12,0.34)'; x.fillRect(tx * TILE, ty * TILE, TILE, 4); x.fillStyle = 'rgba(5,3,12,0.16)'; x.fillRect(tx * TILE, ty * TILE + 4, TILE, 3); }
      if (isWall(get(tx - 1, ty)) && !isWall(get(tx - 1, ty + 1))) { x.fillStyle = 'rgba(5,3,12,0.2)'; x.fillRect(tx * TILE, ty * TILE, 3, TILE); }
      if (isWall(get(tx + 1, ty))) { x.fillStyle = 'rgba(5,3,12,0.2)'; x.fillRect(tx * TILE + TILE - 3, ty * TILE, 3, TILE); }
    }
  }
  // общий оттенок области: одни и те же плитки в разных местах выглядят по-разному
  const tint = TINT[theme];
  if (tint) { x.globalCompositeOperation = 'multiply'; x.fillStyle = tint; x.fillRect(0, 0, c.width, c.height); x.globalCompositeOperation = 'source-over'; }
  return c;
}
const TINT = { mine: '#c0a284', sewer: '#8fb496', temple: '#e4cc98', vault: '#98a8d0', abbey: '#d0c8c0', swamp: '#a8c098', lightforest: '#fff4c8', bastion: '#b4b8c8', arena: '#e0bc90', grove: '#a8dc98', glacier: '#c8dcf4', harbor: '#a8bccc', library: '#d0b088', clinic: '#e8e8da', den: '#b09888', pass: '#c8c0b0', fields: '#bcb49c', city: '#d8d0c8' };

export { PAL as TILE_PAL };
export { shade, mix, hex2rgb };
