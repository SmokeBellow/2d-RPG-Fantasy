// Объекты мира: деревья, здания, алтари, мебель склепа. Каждый спрайт рисуется кодом один раз.
// Размер: footprint (w*16 x h*16) внизу + extra пикселей над ним (см. PROP_DEF).
import { TILE } from './defs.js';
import { PROP_DEF } from './maps.js';
import { mk, rect, dot, rrect, ellipse, disc, line, outline, shade, mix, shadow } from './px.js';
import { hash2 } from './util.js';

const OUT = '#1d1420';

function canvasFor(kind) {
  const d = PROP_DEF[kind];
  return mk(d.w * TILE, d.h * TILE + d.extra);
}
const wrap = (kind, fn, out = true) => {
  const [c, x] = canvasFor(kind);
  fn(x, c.width, c.height);
  return out ? outline(c, OUT) : c;
};

// ---------------------------------------------------------------- деревья
const TREE_COLS = {
  village: [['#2f6a2a', '#3d8035', '#4c9640', '#62ae50'], ['#35702c', '#448a38', '#58a044', '#72b858']],
  forest: [['#1f4d2a', '#2b6234', '#397842', '#4b9250'], ['#274f2c', '#356a36', '#458440', '#5a9c4a']],
};

export function treeSprite(variant, theme) {
  const cols = (TREE_COLS[theme] || TREE_COLS.forest)[variant % 2];
  const [c, x] = mk(36, 46);
  // тень
  shadow(x, 18, 41, 11, 3, 0.28);
  // ствол
  rect(x, 16, 28, 5, 13, '#5a3a22'); rect(x, 16, 28, 2, 13, '#7a5232'); rect(x, 20, 28, 1, 13, '#3e2616');
  rect(x, 14, 38, 9, 3, '#5a3a22'); rect(x, 14, 38, 3, 2, '#7a5232'); rect(x, 22, 38, 1, 3, '#3e2616');
  const [cm, cx] = mk(36, 46);
  if (variant % 3 === 2) {
    // ель: три яруса
    for (let k = 0; k < 4; k++) {
      const top = 3 + k * 8, w = 8 + k * 5, y2 = top + 12;
      for (let j = top; j < y2; j++) {
        const half = Math.round(((j - top) / (y2 - top)) * w * 0.9) + 1;
        rect(cx, 18 - half, j, half * 2, 1, '#fff');
      }
    }
  } else {
    const blobs = variant % 3 === 0
      ? [[18, 17, 13], [10, 21, 9], [26, 21, 9], [18, 10, 9], [18, 25, 9]]
      : [[18, 15, 12], [9, 19, 8], [27, 19, 8], [14, 8, 8], [23, 9, 8], [18, 24, 9]];
    for (const [bx, by, br] of blobs) disc(cx, bx, by, br, '#fff');
  }
  const d = cx.getImageData(0, 0, 36, 46).data;
  // освещение сверху-слева, шум для листвы
  for (let j = 0; j < 46; j++) for (let i = 0; i < 36; i++) {
    if (d[(j * 36 + i) * 4 + 3] < 40) continue;
    const l = (-(i - 15) * 0.45 - (j - 12) * 0.75) / 13;
    let k = l > 0.45 ? 3 : l > 0.0 ? 2 : l > -0.5 ? 1 : 0;
    const n = hash2(i, j, 7 + variant);
    if (n > 0.86 && k < 3) k++; else if (n < 0.1 && k > 0) k--;
    x.fillStyle = cols[k]; x.fillRect(i, j, 1, 1);
  }
  // кластеры листьев (тёмные «ямки»)
  for (let n = 0; n < 9; n++) {
    const px = 8 + Math.floor(hash2(n, variant, 3) * 20), py = 6 + Math.floor(hash2(n, variant, 5) * 22);
    if (d[(py * 36 + px) * 4 + 3] > 40) { dot(x, px, py, cols[0]); dot(x, px + 1, py, cols[0]); dot(x, px, py + 1, cols[1]); }
  }
  return outline(c, OUT);
}

export function bushSprite(theme, berries) {
  const cols = (TREE_COLS[theme] || TREE_COLS.forest)[0];
  const [c, x] = mk(16, 18);
  shadow(x, 8, 15, 6, 2);
  const [cm, cx] = mk(16, 18);
  disc(cx, 8, 9, 5, '#fff'); disc(cx, 4, 11, 4, '#fff'); disc(cx, 12, 11, 4, '#fff');
  const d = cx.getImageData(0, 0, 16, 18).data;
  for (let j = 0; j < 18; j++) for (let i = 0; i < 16; i++) {
    if (d[(j * 16 + i) * 4 + 3] < 40) continue;
    const l = (-(i - 6) * 0.4 - (j - 8) * 0.7) / 6;
    let k = l > 0.4 ? 3 : l > 0 ? 2 : l > -0.5 ? 1 : 0;
    if (hash2(i, j, 31) > 0.85 && k < 3) k++;
    x.fillStyle = cols[k]; x.fillRect(i, j, 1, 1);
  }
  if (berries) { dot(x, 5, 9, '#e0405a'); dot(x, 10, 8, '#e0405a'); dot(x, 8, 12, '#e0405a'); }
  return outline(c, OUT);
}

// ---------------------------------------------------------------- здания
function shingles(x, x0, y0, w, h, main, dark, light, tapered = 0) {
  for (let r = 0; r < h; r++) {
    const inset = Math.round(((h - r) / h) * tapered);
    const row = Math.floor(r / 4);
    const off = (row % 2) * 3;
    for (let i = inset; i < w - inset; i++) {
      const sx = (i + off) % 6;
      let col = main;
      const ry = r % 4;
      if (ry === 3) col = dark;
      else if (sx === 0) col = dark;
      else if (ry === 0) col = light;
      else if (hash2(i, r, 3) > 0.9) col = shade(main, 0.08);
      x.fillStyle = col; x.fillRect(x0 + i, y0 + r, 1, 1);
    }
  }
}

function windowLit(x, wx, wy, w, h, glow = '#f6d880') {
  rect(x, wx, wy, w, h, '#4a3220');
  rect(x, wx + 1, wy + 1, w - 2, h - 2, glow);
  rect(x, wx + 1, wy + h - 3, w - 2, 2, shade(glow, -0.18));
  rect(x, wx + Math.floor(w / 2), wy + 1, 1, h - 2, '#4a3220'); rect(x, wx + 1, wy + Math.floor(h / 2), w - 2, 1, '#4a3220');
  rect(x, wx + 1, wy + 1, 2, 2, '#fff6c8');
  rect(x, wx - 1, wy + h, w + 2, 1, '#2a1a10');
}

function door(x, dx, dy, w, h, wood = '#7a4a2a') {
  rect(x, dx - 1, dy - 1, w + 2, h + 1, '#2e1c10');
  rect(x, dx, dy, w, h, wood);
  for (let i = 3; i < w; i += 4) rect(x, dx + i, dy, 1, h, shade(wood, -0.25));
  rect(x, dx, dy, w, 1, shade(wood, 0.2));
  rect(x, dx + w - 3, dy + Math.floor(h / 2), 2, 2, '#e8c050');
  rect(x, dx - 2, dy + h, w + 4, 2, '#8a8478'); rect(x, dx - 1, dy + h + 2, w + 2, 1, '#6a6458');
}

function house(opts) {
  const kind = opts.kind;
  return wrap(kind, (x, W, H) => {
    const o = { wall: '#dcc9a0', wallD: '#bca678', wallL: '#efe0bc', roof: '#b04a38', roofD: '#7e3024', roofL: '#d06a50', trim: '#5a3a24', ...opts };
    const wallTop = H - 36;
    // стена
    rect(x, 5, wallTop, W - 10, H - wallTop - 6, o.wall);
    for (let j = wallTop; j < H - 6; j++) for (let i = 5; i < W - 5; i++) if (hash2(i, j, 11) > 0.93) { x.fillStyle = o.wallD; x.fillRect(i, j, 1, 1); }
    rect(x, 5, wallTop, W - 10, 2, o.wallD);
    // каркас
    rect(x, 5, wallTop, 3, H - wallTop - 6, o.trim); rect(x, W - 8, wallTop, 3, H - wallTop - 6, o.trim);
    rect(x, 5, H - 9, W - 10, 3, o.trim);
    // фундамент
    rect(x, 3, H - 7, W - 6, 7, '#7a766a');
    for (let i = 3; i < W - 3; i += 5) rect(x, i, H - 7, 1, 7, '#5a564c');
    rect(x, 3, H - 7, W - 6, 1, '#9a968a');
    // крыша
    const roofH = wallTop - 2;
    shingles(x, 0, 3, W, roofH, o.roof, o.roofD, o.roofL, Math.min(14, W * 0.22));
    rect(x, 0, 3 + roofH - 1, W, 3, o.roofD); // карниз
    rect(x, 0, 3 + roofH + 2, W, 2, 'rgba(0,0,0,0.25)');
    // конёк
    rect(x, Math.round(W * 0.2), 3, Math.round(W * 0.6), 2, o.roofL);
    // труба
    if (o.chimney !== false) {
      const cx2 = o.chimneyX != null ? o.chimneyX : W - 20;
      rect(x, cx2, 0, 8, 22, '#8a8478'); rect(x, cx2, 0, 8, 2, '#a8a294'); rect(x, cx2 + 6, 2, 2, 20, '#6a665c');
      for (let j = 2; j < 22; j += 4) rect(x, cx2, j, 8, 1, '#6a665c');
    }
    // дверь и окна
    const dw = 12;
    const dxp = Math.round(W / 2 - dw / 2);
    door(x, dxp, H - 28, dw, 20, o.doorCol || '#7a4a2a');
    const n = W > 70 ? 2 : 1;
    if (W > 55) {
      windowLit(x, dxp - 22, H - 30, 12, 12, o.glow);
      windowLit(x, dxp + dw + 10, H - 30, 12, 12, o.glow);
      if (o.flowers) {
        for (const wx of [dxp - 23, dxp + dw + 9]) { rect(x, wx, H - 17, 14, 3, '#5a3a22'); for (let i = 0; i < 14; i += 3) { dot(x, wx + i, H - 19, o.flowers); dot(x, wx + i + 1, H - 18, '#4a9a40'); } }
      }
    } else {
      windowLit(x, dxp + dw + 6, H - 30, 10, 10, o.glow);
    }
    if (o.deco) o.deco(x, W, H);
  });
}

function smithy() {
  return wrap('smithy', (x, W, H) => {
    const wallTop = H - 38;
    rect(x, 4, wallTop, W - 8, H - wallTop - 4, '#8a8478');
    for (let j = wallTop; j < H - 4; j += 6) { rect(x, 4, j, W - 8, 1, '#6a665c'); for (let i = 4 + ((j / 6) % 2) * 5; i < W - 4; i += 10) rect(x, i, j, 1, 6, '#6a665c'); }
    rect(x, 4, wallTop, W - 8, 2, '#a8a294');
    shingles(x, 0, 3, W, wallTop - 4, '#4a4e5c', '#2e303c', '#666a7c', 14);
    rect(x, 0, wallTop - 2, W, 3, '#2e303c');
    rect(x, 0, wallTop + 1, W, 2, 'rgba(0,0,0,0.3)');
    // труба с дымом
    rect(x, 10, 0, 10, 24, '#6a665c'); rect(x, 10, 0, 10, 2, '#8a8478'); rect(x, 17, 2, 3, 22, '#4a463c');
    // горн
    rect(x, 8, H - 30, 26, 24, '#1a1210'); rect(x, 10, H - 28, 22, 20, '#3a2418');
    rect(x, 12, H - 14, 18, 6, '#e8601c'); rect(x, 14, H - 18, 14, 6, '#ff9a30'); rect(x, 18, H - 22, 6, 6, '#ffd860');
    rect(x, 8, H - 30, 26, 2, '#5a564c'); rect(x, 6, H - 8, 30, 4, '#5a564c');
    // дверь и окно
    door(x, W - 26, H - 28, 12, 20, '#5a3a22');
    windowLit(x, W - 48, H - 30, 12, 12, '#ffb860');
    // вывеска-молот
    rect(x, 40, H - 40, 2, 10, '#3a2418'); rect(x, 36, H - 34, 16, 8, '#6a4a2a'); rect(x, 37, H - 33, 14, 6, '#8a6a3a');
    rect(x, 42, H - 33, 6, 2, '#c8c8d0'); rect(x, 44, H - 31, 2, 4, '#6a4a2a');
    rect(x, 3, H - 4, W - 6, 4, '#6a665c');
  });
}

function tavern() {
  return house({
    kind: 'tavern', wall: '#b8884e', wallD: '#8e6434', wallL: '#d4a468', roof: '#7a3a2c', roofD: '#582418', roofL: '#a05540', trim: '#3e2616', glow: '#ffc858', chimney: true, chimneyX: 22,
    deco(x, W, H) {
      // вывеска на кронштейне
      rect(x, W - 22, H - 34, 14, 2, '#3e2616'); rect(x, W - 14, H - 32, 1, 5, '#3e2616');
      rect(x, W - 20, H - 28, 14, 10, '#5a3a22'); rect(x, W - 19, H - 27, 12, 8, '#c89850');
      // котёл
      rect(x, W - 17, H - 24, 8, 4, '#2a2a30'); rect(x, W - 16, H - 26, 6, 2, '#2a2a30'); dot(x, W - 15, H - 27, '#f0f0f0'); dot(x, W - 12, H - 28, '#f0f0f0');
      // бочки у стены
      for (const bx of [10, 18]) { rrect(x, bx, H - 18, 8, 12, '#6a4a2a'); rect(x, bx, H - 15, 8, 1, '#3a2a18'); rect(x, bx, H - 10, 8, 1, '#3a2a18'); rect(x, bx + 1, H - 17, 2, 10, '#8a6a3a'); }
    },
  });
}

function hutVariant(variant) {
  return house(variant === 'elder'
    ? { kind: 'hut', wall: '#cdbfa0', wallD: '#a89a7c', roof: '#3a5a9a', roofD: '#26407a', roofL: '#5a7ac0', trim: '#5a3a24', glow: '#ffe8a0', chimneyX: 44, flowers: '#e8e0ff',
        deco(x, W, H) { rect(x, W / 2 - 4, H - 54, 8, 1, '#ffe080'); dot(x, W / 2, H - 56, '#ffe080'); dot(x, W / 2, H - 52, '#ffe080'); rect(x, W / 2 - 1, H - 54, 2, 1, '#fff6c0'); } }
    : { kind: 'hut', wall: '#c8b48a', wallD: '#a89470', roof: '#4a8a3a', roofD: '#2e6428', roofL: '#6aae50', trim: '#4a3a20', glow: '#d8f0a0', chimneyX: 8, flowers: '#f0a0c0',
        deco(x, W, H) { for (let i = 0; i < 4; i++) { rect(x, 10 + i * 5, H - 33, 1, 5, '#6a8a3a'); rect(x, 9 + i * 5, H - 28, 3, 3, i % 2 ? '#c85a6a' : '#a0c060'); } } });
}

function stall() {
  return wrap('stall', (x, W, H) => {
    // прилавок
    rect(x, 3, H - 16, W - 6, 14, '#8a5a30'); rect(x, 3, H - 16, W - 6, 3, '#b07a44'); rect(x, 3, H - 4, W - 6, 2, '#4a2e18');
    for (let i = 6; i < W - 6; i += 6) rect(x, i, H - 12, 1, 8, '#6a4220');
    // товары: склянки и яблоки
    for (const [px, col] of [[8, '#e04a5a'], [16, '#4a9ae0'], [24, '#6ac85a'], [32, '#e0b04a'], [40, '#c06ae0']]) { rect(x, px, H - 24, 5, 8, col); rect(x, px + 1, H - 27, 3, 3, '#d8d8e0'); dot(x, px + 1, H - 22, '#ffffffaa'); }
    // стойки и навес
    rect(x, 2, 8, 3, H - 14, '#5a3a22'); rect(x, W - 5, 8, 3, H - 14, '#5a3a22');
    for (let i = 0; i < W; i += 8) { rect(x, i, 4, 8, 12, i % 16 === 0 ? '#c8503e' : '#f0e6d0'); rect(x, i, 14, 8, 2, i % 16 === 0 ? '#903426' : '#c8bea8'); }
    rect(x, 0, 2, W, 3, '#903426');
  });
}

function well() {
  return wrap('well', (x, W, H) => {
    rect(x, 3, H - 22, W - 6, 20, '#8a8478');
    for (let j = H - 22; j < H - 2; j += 5) { rect(x, 3, j, W - 6, 1, '#6a665c'); for (let i = 3 + ((j / 5) % 2) * 4; i < W - 3; i += 8) rect(x, i, j, 1, 5, '#6a665c'); }
    rect(x, 3, H - 22, W - 6, 2, '#aaa496');
    rect(x, 7, H - 20, W - 14, 8, '#1a4580'); rect(x, 8, H - 19, W - 16, 2, '#3a82c4');
    rect(x, 4, 8, 3, H - 24, '#5a3a22'); rect(x, W - 7, 8, 3, H - 24, '#5a3a22');
    shingles(x, 0, 2, W, 10, '#a05540', '#6a3020', '#c87058', 6);
    rect(x, W / 2 - 1, 12, 2, 8, '#d8c8a0'); rect(x, W / 2 - 3, 20, 6, 4, '#6a4a2a');
  });
}

// маяк Тихого Брода: нет огня / огонь (2 кадра)
function beacon(lit, frame) {
  return wrap('beacon', (x, W, H) => {
    // ступенчатое основание
    rect(x, 0, H - 22, W, 22, '#7a766a'); rect(x, 0, H - 22, W, 2, '#a8a294'); rect(x, 0, H - 4, W, 4, '#4a463c');
    for (let j = H - 20; j < H - 4; j += 5) { rect(x, 0, j, W, 1, '#5a564c'); for (let i = 3 + ((j / 5) % 2) * 5; i < W; i += 10) rect(x, i, j, 1, 5, '#5a564c'); }
    // ствол башни
    const tx = 9, tw = W - 18;
    rect(x, tx, 14, tw, H - 36, '#8a8478');
    for (let j = 14; j < H - 24; j += 6) { rect(x, tx, j, tw, 1, '#6a665c'); for (let i = tx + 3 + ((j / 6) % 2) * 6; i < tx + tw; i += 12) rect(x, i, j, 1, 6, '#6a665c'); }
    rect(x, tx, 14, 3, H - 36, '#a8a294'); rect(x, tx + tw - 3, 14, 3, H - 36, '#5a564c');
    // руны
    for (const ry of [30, 44, 58]) { rect(x, W / 2 - 2, ry, 4, 1, lit ? '#ffc860' : '#4a463c'); rect(x, W / 2, ry - 2, 1, 5, lit ? '#ffc860' : '#4a463c'); }
    // чаша
    rect(x, 4, 8, W - 8, 6, '#6a665c'); rect(x, 4, 8, W - 8, 2, '#a8a294'); rect(x, 7, 12, W - 14, 3, '#3a362c');
    rect(x, 7, 4, 3, 5, '#8a8478'); rect(x, W - 10, 4, 3, 5, '#8a8478');
    // дверь
    door(x, W / 2 - 6, H - 20, 12, 16, '#4a3220');
    if (lit) {
      const f = frame;
      rect(x, 14, 1 - f, W - 28, 7 + f, '#ff7a20'); rect(x, 17, -f + 1, W - 34, 5 + f, '#ffb838'); rect(x, 21, 2 - f, W - 42, 3 + f, '#fff0a0');
    } else {
      rect(x, 14, 5, W - 28, 4, '#3a362c'); rect(x, 17, 4, W - 34, 2, '#5a564c');
    }
  }, true);
}

// ---------------------------------------------------------------- мелочь
function sign() {
  return wrap('sign', (x, W, H) => {
    shadow(x, 8, H - 3, 5, 2);
    rect(x, 7, H - 14, 2, 12, '#5a3a22');
    rrect(x, 2, H - 20, 12, 9, '#a0743f'); rect(x, 3, H - 19, 10, 1, '#c89050'); rect(x, 4, H - 16, 8, 1, '#5a3a22'); rect(x, 4, H - 14, 6, 1, '#5a3a22');
  });
}
function barrel() { return wrap('barrel', (x, W, H) => { shadow(x, 8, H - 3, 6, 2); rrect(x, 3, H - 14, 10, 13, '#7a5232'); rect(x, 4, H - 13, 2, 11, '#9a6a3c'); rect(x, 3, H - 11, 10, 1, '#3a2a18'); rect(x, 3, H - 5, 10, 1, '#3a2a18'); rect(x, 4, H - 15, 8, 2, '#a0743f'); }); }
function crate() { return wrap('crate', (x, W, H) => { shadow(x, 8, H - 3, 6, 2); rect(x, 2, H - 13, 12, 12, '#9a6a3c'); rect(x, 2, H - 13, 12, 2, '#c08848'); rect(x, 2, H - 13, 2, 12, '#7a5232'); rect(x, 12, H - 13, 2, 12, '#7a5232'); line(x, 3, H - 11, 12, H - 3, '#7a5232'); line(x, 3, H - 3, 12, H - 11, '#7a5232'); }); }
function tent(col) {
  return wrap('tent', (x, W, H) => {
    shadow(x, W / 2, H - 3, 20, 4);
    for (let r = 0; r < H - 6; r++) { const half = Math.round(4 + (r / (H - 6)) * (W / 2 - 3)); rect(x, W / 2 - half, 2 + r, half * 2, 1, r % 6 < 3 ? col : shade(col, -0.12)); rect(x, W / 2 - half, 2 + r, 2, 1, shade(col, 0.16)); rect(x, W / 2 + half - 2, 2 + r, 2, 1, shade(col, -0.3)); }
    for (let r = 0; r < 16; r++) { const half = Math.round(1 + r * 0.45); rect(x, W / 2 - half, H - 8 - r, half * 2, 1, '#1a1210'); }
    rect(x, W / 2 - 1, 0, 2, 4, '#5a3a22'); rect(x, W / 2, 0, 5, 3, '#c04a3a');
  });
}
function campfire(frame) {
  return wrap('campfire', (x, W, H) => {
    shadow(x, 8, H - 3, 7, 2, 0.3);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; disc(x, 8 + Math.round(Math.cos(a) * 5), H - 5 + Math.round(Math.sin(a) * 2), 1, '#8a8478'); }
    line(x, 4, H - 3, 12, H - 6, '#5a3a22'); line(x, 4, H - 6, 12, H - 3, '#6a4a2a');
    const f = frame;
    rect(x, 6, H - 10 - f, 5, 6 + f, '#ff7a20'); rect(x, 7, H - 13 - f, 3, 6 + f, '#ffb838'); rect(x, 8, H - 15 - f, 1, 5, '#fff0a0');
  });
}

function shrine(frame) {
  return wrap('shrine', (x, W, H) => {
    shadow(x, W / 2, H - 2, 14, 3, 0.3);
    // пьедестал
    rect(x, 4, H - 12, W - 8, 11, '#8a8478'); rect(x, 4, H - 12, W - 8, 2, '#b0aa9c'); rect(x, 4, H - 4, W - 8, 3, '#4a463c');
    for (let i = 7; i < W - 7; i += 6) { rect(x, i, H - 9, 1, 4, '#d8a840'); rect(x, i - 1, H - 7, 3, 1, '#d8a840'); }
    rect(x, 8, H - 16, W - 16, 5, '#6a665c'); rect(x, 8, H - 16, W - 16, 1, '#a8a294');
    // колонна и чаша
    rect(x, W / 2 - 3, H - 24, 6, 9, '#8a8478'); rect(x, W / 2 - 3, H - 24, 2, 9, '#b0aa9c');
    rect(x, W / 2 - 7, H - 28, 14, 5, '#d8a840'); rect(x, W / 2 - 8, H - 29, 16, 2, '#f0c860'); rect(x, W / 2 - 6, H - 24, 12, 1, '#8a6820');
    const f = frame;
    rect(x, W / 2 - 3, H - 34 - f, 6, 6 + f, '#ff9a30'); rect(x, W / 2 - 2, H - 37 - f, 4, 5 + f, '#ffd060'); rect(x, W / 2 - 1, H - 39 - f, 2, 3, '#fff6c0');
  }, true);
}

function lever(on) {
  return wrap('lever', (x, W, H) => {
    rect(x, 3, H - 12, 10, 10, '#5a5870'); rect(x, 3, H - 12, 10, 2, '#7a7898'); rect(x, 3, H - 4, 10, 2, '#2e2c40');
    rect(x, 6, H - 10, 4, 4, '#2a2838');
    if (on) { line(x, 8, H - 8, 13, H - 16, '#c8c8d0'); disc(x, 13, H - 17, 2, '#e04a3a'); }
    else { line(x, 8, H - 8, 3, H - 16, '#c8c8d0'); disc(x, 3, H - 17, 2, '#8a3a2a'); }
  });
}

function pillar() {
  return wrap('pillar', (x, W, H) => {
    shadow(x, 8, H - 3, 7, 2, 0.35);
    rect(x, 3, H - 6, 10, 5, '#5a5878'); rect(x, 3, H - 6, 10, 1, '#7a789a');
    rect(x, 4, 6, 8, H - 10, '#6a6888'); rect(x, 4, 6, 2, H - 10, '#8a88aa'); rect(x, 10, 6, 2, H - 10, '#4a4868');
    for (let j = 10; j < H - 8; j += 5) rect(x, 4, j, 8, 1, '#4a4868');
    rect(x, 2, 2, 12, 5, '#7a789a'); rect(x, 2, 2, 12, 1, '#9a98ba'); rect(x, 2, 6, 12, 1, '#4a4868');
  });
}
function brazier(frame) {
  return wrap('brazier', (x, W, H) => {
    shadow(x, 8, H - 3, 6, 2, 0.3);
    rect(x, 7, H - 8, 2, 7, '#4a4a58'); rect(x, 4, H - 3, 8, 2, '#3a3a48');
    rect(x, 3, H - 12, 10, 5, '#5a5a6a'); rect(x, 3, H - 12, 10, 1, '#8a8a9a'); rect(x, 4, H - 8, 8, 1, '#3a3a48');
    const f = frame;
    rect(x, 5, H - 16 - f, 6, 5 + f, '#ff7a20'); rect(x, 6, H - 19 - f, 4, 5 + f, '#ffb838'); rect(x, 7, H - 21 - f, 2, 4, '#fff0a0');
  });
}
function bookshelf() {
  return wrap('bookshelf', (x, W, H) => {
    rect(x, 1, 1, W - 2, H - 2, '#4a3220'); rect(x, 3, 3, W - 6, H - 6, '#2a1a10');
    const cols = ['#a03a3a', '#3a5aa0', '#3a8a5a', '#c8a03a', '#7a3a8a', '#a06a3a'];
    for (let row = 0; row < 3; row++) {
      const y = 4 + row * 9;
      let i = 4;
      while (i < W - 6) { const w = 2 + Math.floor(hash2(i, row, 9) * 3); rect(x, i, y, w, 8, cols[Math.floor(hash2(i, row, 5) * cols.length)]); rect(x, i, y, 1, 8, 'rgba(255,255,255,0.2)'); i += w; if (hash2(i, row, 3) > 0.9) i += 2; }
      rect(x, 3, y + 8, W - 6, 1, '#6a4a2a');
    }
    rect(x, 1, 1, W - 2, 2, '#6a4a2a');
  });
}
function coffin() {
  return wrap('coffin', (x, W, H) => {
    shadow(x, W / 2, H - 3, 14, 3, 0.35);
    rect(x, 2, H - 14, W - 4, 13, '#6a6888'); rect(x, 2, H - 14, W - 4, 3, '#8a88aa'); rect(x, 2, H - 4, W - 4, 3, '#3a3850');
    rect(x, 5, H - 11, W - 10, 6, '#5a5878'); line(x, 8, H - 10, 13, H - 7, '#3a3850'); rect(x, W / 2 - 1, H - 11, 2, 6, '#8a88aa'); rect(x, W / 2 - 3, H - 9, 6, 1, '#8a88aa');
  });
}
function tomb() {
  return wrap('tomb', (x, W, H) => {
    shadow(x, 8, H - 3, 6, 2, 0.3);
    rrect(x, 3, 2, 10, H - 5, '#7a7898'); rect(x, 3, 2, 10, 2, '#9a98b8'); rect(x, 7, 5, 2, 7, '#4a4868'); rect(x, 5, 7, 6, 2, '#4a4868');
    rect(x, 2, H - 4, 12, 3, '#4a4868');
  });
}
function throne() {
  return wrap('throne', (x, W, H) => {
    shadow(x, W / 2, H - 2, 14, 3, 0.35);
    rect(x, 6, 2, W - 12, H - 10, '#2a2038'); rect(x, 6, 2, W - 12, 2, '#5a4878');
    for (const sx of [4, W / 2 - 1, W - 6]) { rect(x, sx, 0, 3, 9, '#3a2c50'); dot(x, sx + 1, 0, '#8a6ad0'); }
    rect(x, 3, H - 14, W - 6, 10, '#3a2c50'); rect(x, 3, H - 14, W - 6, 2, '#6a54a0'); rect(x, 8, H - 20, W - 16, 6, '#5a1a28');
    rect(x, 3, H - 4, W - 6, 4, '#1a1428');
    rect(x, W / 2 - 3, 8, 6, 6, '#a060e0'); rect(x, W / 2 - 2, 9, 4, 4, '#d8a0ff');
  });
}
function statue() {
  return wrap('statue', (x, W, H) => {
    shadow(x, 8, H - 3, 7, 2, 0.3);
    rect(x, 2, H - 8, 12, 7, '#6a6888'); rect(x, 2, H - 8, 12, 1, '#8a88aa');
    rect(x, 5, H - 22, 6, 14, '#8a88aa'); rect(x, 5, H - 22, 2, 14, '#a8a6c8'); rect(x, 10, H - 22, 1, 14, '#5a5878');
    rect(x, 6, H - 28, 4, 6, '#a8a6c8'); rect(x, 7, H - 29, 2, 2, '#c8c6e8');
    rect(x, 3, H - 20, 3, 8, '#8a88aa'); rect(x, 11, H - 22, 2, 14, '#c8c8d0'); dot(x, 11, H - 23, '#e8e8f0');
  });
}
function boulder() { return wrap('boulder', (x, W, H) => { shadow(x, 8, H - 3, 7, 2, 0.3); disc(x, 8, H - 8, 6, '#6e6e78'); disc(x, 7, H - 10, 4, '#84848e'); rect(x, 4, H - 6, 8, 3, '#5a5a64'); dot(x, 6, H - 12, '#a8a8b4'); dot(x, 7, H - 12, '#a8a8b4'); }); }
function stump() { return wrap('stump', (x, W, H) => { shadow(x, 8, H - 3, 6, 2); rect(x, 4, H - 8, 8, 6, '#6a4a2a'); ellipse(x, 8, H - 8, 4, 2, '#a07848'); ellipse(x, 8, H - 8, 2, 1, '#6a4a2a'); }); }
function fence() { return wrap('fence', (x, W, H) => { rect(x, 2, H - 10, 2, 10, '#7a5232'); rect(x, 12, H - 10, 2, 10, '#7a5232'); rect(x, 0, H - 8, 16, 2, '#9a6a3c'); rect(x, 0, H - 4, 16, 2, '#9a6a3c'); }); }
function anvil() { return wrap('anvil', (x, W, H) => { shadow(x, 8, H - 3, 6, 2); rect(x, 5, H - 6, 6, 4, '#4a4a58'); rect(x, 2, H - 10, 12, 4, '#6a6a7a'); rect(x, 2, H - 10, 12, 1, '#9a9aa8'); rect(x, 0, H - 9, 3, 2, '#6a6a7a'); }); }
function obelisk() {
  return wrap('obelisk', (x, W, H) => {
    shadow(x, 8, H - 3, 6, 2, 0.35);
    for (let r = 0; r < H - 4; r++) { const half = 2 + Math.round((r / (H - 4)) * 4); rect(x, 8 - half, r + 2, half * 2, 1, r % 8 < 2 ? '#8a88aa' : '#5a5878'); rect(x, 8 - half, r + 2, 2, 1, '#9a98ba'); }
    for (const ry of [10, 16, 22]) { rect(x, 6, ry, 4, 1, '#d8a860'); dot(x, 8, ry - 1, '#d8a860'); }
  });
}
function cart() { return wrap('cart', (x, W, H) => { shadow(x, W / 2, H - 3, 13, 2); rect(x, 3, H - 12, 26, 8, '#8a5a30'); rect(x, 3, H - 12, 26, 2, '#b07a44'); disc(x, 8, H - 4, 4, '#3a2a18'); disc(x, 8, H - 4, 2, '#7a5232'); disc(x, 24, H - 4, 4, '#3a2a18'); disc(x, 24, H - 4, 2, '#7a5232'); for (let i = 0; i < 4; i++) disc(x, 8 + i * 5, H - 13, 3, '#d8b04a'); }); }
function rack() { return wrap('rack', (x, W, H) => { rect(x, 2, H - 12, 2, 12, '#5a3a22'); rect(x, W - 4, H - 12, 2, 12, '#5a3a22'); rect(x, 2, H - 12, W - 4, 2, '#7a5232'); for (let i = 0; i < 4; i++) { rect(x, 6 + i * 6, H - 20, 1, 12, '#c8c8d0'); rect(x, 5 + i * 6, H - 9, 3, 2, '#5a3a22'); } }); }
function table() { return wrap('table', (x, W, H) => { shadow(x, W / 2, H - 2, 12, 2); rect(x, 2, H - 10, W - 4, 4, '#9a6a3c'); rect(x, 2, H - 10, W - 4, 1, '#c08848'); rect(x, 4, H - 6, 2, 5, '#6a4220'); rect(x, W - 6, H - 6, 2, 5, '#6a4220'); }); }
function banner() {
  return wrap('banner', (x, W, H) => {
    rect(x, 2, 1, 12, 2, '#3a2c50'); rect(x, 3, 3, 10, H - 8, '#5a1a60'); rect(x, 3, 3, 10, 1, '#8a3a90');
    for (let i = 0; i < 5; i++) { rect(x, 3 + i * 2, H - 5, 2, 2 + (i % 2) * 2, '#5a1a60'); }
    rect(x, 7, 9, 2, 10, '#c890e8'); rect(x, 5, 12, 6, 2, '#c890e8');
  });
}
function stonedoor() {
  return wrap('stonedoor', (x, W, H) => {
    rect(x, 0, 0, W, H, '#4a4868'); rect(x, 2, 2, W - 4, H - 2, '#5a5878'); rect(x, 2, 2, W - 4, 2, '#7a789a');
    for (let i = 4; i < W - 4; i += 8) { rect(x, i, 6, 1, H - 8, '#3a3850'); }
    rect(x, W / 2 - 1, 4, 2, H - 6, '#2a2838');
    disc(x, W / 2 - 8, H / 2 + 2, 3, '#c8a850'); disc(x, W / 2 + 8, H / 2 + 2, 3, '#c8a850');
    rect(x, W / 2 - 3, 6, 6, 6, '#8a88aa'); dot(x, W / 2 - 1, 8, '#2a2838'); dot(x, W / 2 + 1, 8, '#2a2838'); rect(x, W / 2 - 1, 10, 2, 1, '#2a2838');
  });
}
function cryptgate() {
  return wrap('cryptgate', (x, W, H) => {
    // арка из камня
    rect(x, 0, 12, W, H - 12, '#6a6888'); rect(x, 0, 12, W, 3, '#8a88aa');
    for (let j = 16; j < H; j += 5) { rect(x, 0, j, W, 1, '#4a4868'); for (let i = 3 + ((j / 5) % 2) * 5; i < W; i += 10) rect(x, i, j, 1, 5, '#4a4868'); }
    rect(x, 4, 4, W - 8, 10, '#7a789a'); rect(x, 10, 0, W - 20, 6, '#8a88aa'); rect(x, 10, 0, W - 20, 1, '#aaa8ca');
    // тёмный проём
    const ax = 18, aw = W - 36;
    rect(x, ax, 22, aw, H - 22, '#0c0a14');
    for (let r = 0; r < 8; r++) rect(x, ax + r, 22 + r - 8 + 8, aw - r * 2, 1, '#0c0a14');
    rect(x, ax, 20, aw, 3, '#4a4868');
    rect(x, ax, H - 4, aw, 4, '#2a2838');
    // череп
    rect(x, W / 2 - 4, 6, 8, 7, '#d8d0c0'); rect(x, W / 2 - 3, 12, 6, 2, '#d8d0c0'); rect(x, W / 2 - 3, 8, 2, 2, '#1a1020'); rect(x, W / 2 + 1, 8, 2, 2, '#1a1020');
    // факелы по бокам
    for (const fx of [6, W - 10]) { rect(x, fx, H - 20, 3, 12, '#4a3220'); rect(x, fx - 1, H - 24, 5, 5, '#ff9a30'); rect(x, fx, H - 27, 3, 4, '#ffd860'); }
  });
}
function barrier(frame) {
  const [c, x] = canvasFor('barrier');
  const W = c.width, H = c.height;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const wave = Math.sin((i + frame * 6) * 0.35 + j * 0.2);
    const a = 0.55 + 0.25 * wave;
    const edge = Math.min(i, W - 1 - i, j * 0.6, 6);
    x.fillStyle = `rgba(${150 + wave * 40},${70},${220},${Math.max(0, a * Math.min(1, (edge + 1) / 4))})`; x.fillRect(i, j, 1, 1);
  }
  for (let k = 0; k < 6; k++) { const ix = Math.floor(hash2(k, frame, 3) * (W - 4)); rect(x, ix, 4 + (k * 5) % 16, 2, 6, '#e8c8ff'); }
  rect(x, 0, H - 4, W, 4, 'rgba(60,20,90,0.9)');
  return c;
}
function reeds() { return wrap('reeds', (x, W, H) => { for (let i = 0; i < 4; i++) { rect(x, 3 + i * 3, H - 12 + (i % 2) * 2, 1, 11 - (i % 2) * 2, '#4a7a3a'); rect(x, 2 + i * 3, H - 14 + (i % 2) * 2, 3, 3, '#6a4a2a'); } }); }

// Реестр: kind -> { frames: [canvas], fps } либо { s: canvas }
let reg = null;

// ---------------------------------------------------------------- новые объекты (локации 1-6)
function stairs() {
  return wrap('stairs', (x, W, H) => {
    rect(x, 0, 0, W, H, '#2a2438');
    for (let i = 0; i < 4; i++) { rect(x, 2, 1 + i * 3, W - 4, 3, i % 2 ? '#5a5470' : '#6a6484'); rect(x, 2, 1 + i * 3, W - 4, 1, '#8a84a8'); }
    rect(x, 0, 0, 2, H, '#4a4460'); rect(x, W - 2, 0, 2, H, '#4a4460');
  });
}
function lamp() {
  return wrap('lamp', (x, W, H) => {
    shadow(x, 8, H - 3, 4, 1, 0.3);
    rect(x, 7, 10, 2, H - 13, '#3a3448'); rect(x, 5, H - 5, 6, 2, '#2a2438');
    rect(x, 4, 3, 8, 8, '#4a4458'); rect(x, 5, 4, 6, 6, '#ffd870'); rect(x, 6, 5, 4, 4, '#fff4c0'); rect(x, 3, 2, 10, 2, '#2a2438');
  });
}
function godaltar(col) {
  return wrap('godaltar', (x, W, H) => {
    shadow(x, W / 2, H - 2, 12, 3, 0.35);
    rect(x, 3, H - 8, W - 6, 7, '#5a5878'); rect(x, 3, H - 8, W - 6, 1, '#8a88aa'); rect(x, 1, H - 3, W - 2, 3, '#3a3850');
    rect(x, 7, H - 18, W - 14, 10, '#6a6888'); rect(x, 7, H - 18, W - 14, 2, '#9a98ba');
    disc(x, W / 2, H - 22, 5, col); disc(x, W / 2, H - 22, 3, shade(col, 1.4)); dot(x, W / 2 - 1, H - 24, '#fff');
    rect(x, 2, H - 14, 2, 8, col); rect(x, W - 4, H - 14, 2, 8, col);
  });
}
function bed() {
  return wrap('bed', (x, W, H) => {
    shadow(x, W / 2, H - 2, 13, 2, 0.3);
    rect(x, 1, H - 11, W - 2, 10, '#6a4a2a'); rect(x, 2, H - 10, W - 4, 7, '#d8d0c0'); rect(x, 2, H - 10, 8, 6, '#f0e8d8'); rect(x, 12, H - 10, W - 14, 7, '#7a8ab0');
  });
}
function boat() {
  return wrap('boat', (x, W, H) => {
    shadow(x, W / 2, H - 2, 34, 3, 0.3);
    rect(x, 4, H - 12, W - 8, 10, '#6a4a2a'); rect(x, 2, H - 14, W - 4, 3, '#8a6238'); rect(x, 6, H - 8, W - 12, 2, '#4a3220');
    rect(x, W / 2 - 1, 2, 3, H - 14, '#4a3220'); rect(x, W / 2 + 2, 4, 16, 14, '#e8e0cc'); rect(x, W / 2 + 2, 4, 16, 1, '#fff');
  });
}
function post() { return wrap('post', (x, W, H) => { shadow(x, 8, H - 3, 3, 1, 0.3); rect(x, 7, 2, 3, H - 4, '#6a4a2a'); rect(x, 7, 2, 1, H - 4, '#8a6238'); rect(x, 4, 4, 9, 4, '#8a6238'); rect(x, 4, 4, 9, 1, '#b08848'); }); }
function net() { return wrap('net', (x, W, H) => { rect(x, 1, 2, 2, H - 2, '#5a3a22'); rect(x, W - 3, 2, 2, H - 2, '#5a3a22'); for (let i = 3; i < W - 3; i += 3) rect(x, i, 3, 1, H - 6, '#b8a878'); for (let j = 4; j < H - 3; j += 3) rect(x, 3, j, W - 6, 1, '#b8a878'); }); }
function ruin() {
  return wrap('ruin', (x, W, H) => {
    shadow(x, W / 2, H - 2, 12, 2, 0.3);
    rect(x, 2, H - 10, 10, 9, '#6a6674'); rect(x, 2, H - 10, 10, 2, '#8a8696'); rect(x, 18, H - 18, 8, 17, '#5a5664'); rect(x, 18, H - 18, 8, 2, '#7a7686'); rect(x, 20, H - 14, 2, 8, '#3a3644');
    rect(x, 12, H - 6, 6, 5, '#5a5664'); dot(x, 6, H - 12, '#4a6a3a'); dot(x, 22, H - 20, '#4a6a3a');
  });
}
function spear() { return wrap('spear', (x, W, H) => { shadow(x, 8, H - 3, 3, 1, 0.3); rect(x, 7, 5, 2, H - 7, '#6a4a2a'); rect(x, 6, 1, 4, 5, '#c8ccd8'); rect(x, 7, 0, 2, 2, '#fff'); rect(x, 5, H - 8, 6, 2, '#5a3a22'); }); }
function plant() {
  return wrap('plant', (x, W, H) => {
    shadow(x, 8, H - 3, 5, 1, 0.3);
    for (const [dx, h, c] of [[-4, 8, '#3e7a40'], [-1, 12, '#5aa058'], [3, 9, '#3e7a40'], [5, 6, '#5aa058']]) { rect(x, 8 + dx, H - 3 - h, 2, h, c); }
    dot(x, 7, H - 15, '#f0e078'); dot(x, 12, H - 11, '#e87a9a');
  });
}
function gate() {
  return wrap('gate', (x, W, H) => {
    rect(x, 0, 2, 10, H - 2, '#4a4860'); rect(x, W - 10, 2, 10, H - 2, '#4a4860'); rect(x, 0, 2, 10, 2, '#7a789a'); rect(x, W - 10, 2, 10, 2, '#7a789a');
    rect(x, 10, 4, W - 20, 6, '#3a3850');
    for (let i = 12; i < W - 12; i += 5) rect(x, i, 10, 2, H - 12, '#2a2a38');
    rect(x, 10, H - 5, W - 20, 3, '#2a2a38');
  });
}
function monolith() {
  return wrap('monolith', (x, W, H) => {
    shadow(x, W / 2, H - 2, 11, 3, 0.35);
    rect(x, 4, 4, W - 8, H - 6, '#3a384e'); rect(x, 4, 4, 3, H - 6, '#5a587a'); rect(x, W - 7, 4, 3, H - 6, '#24223a'); rect(x, 6, 2, W - 12, 3, '#4a486a');
    for (let j = 9; j < H - 8; j += 5) { rect(x, 9, j, W - 18, 1, '#a898e0'); dot(x, 10, j - 1, '#a898e0'); dot(x, W - 11, j + 1, '#a898e0'); }
  });
}
function beam() { return wrap('beam', (x, W, H) => { shadow(x, 8, H - 3, 4, 1, 0.3); rect(x, 6, 2, 4, H - 4, '#8a6238'); rect(x, 6, 2, 1, H - 4, '#b08848'); rect(x, 3, 2, 10, 3, '#6a4a2a'); }); }
function grave() { return wrap('grave', (x, W, H) => { shadow(x, 8, H - 3, 5, 1, 0.3); rrect(x, 4, 3, 8, H - 6, '#8a8696'); rect(x, 4, 3, 8, 2, '#a8a4b8'); rect(x, 7, 6, 2, 5, '#5a5664'); rect(x, 6, 7, 4, 1, '#5a5664'); rect(x, 3, H - 4, 10, 2, '#4a6a3a'); }); }
function hut2() {
  return wrap('hut2', (x, W, H) => {
    shadow(x, W / 2, H - 2, 20, 3, 0.3);
    rect(x, 4, H - 24, W - 8, 22, '#8a6a48'); rect(x, 4, H - 24, W - 8, 2, '#a88a62');
    for (let i = 8; i < W - 6; i += 6) rect(x, i, H - 22, 1, 18, '#6a4a2c');
    rect(x, 0, H - 32, W, 10, '#6a4a2a'); rect(x, 0, H - 32, W, 2, '#8a6a3a'); rect(x, 2, H - 24, W - 4, 2, '#4a3220');
    rect(x, W / 2 - 4, H - 14, 8, 12, '#3a2a1c'); rect(x, 8, H - 18, 6, 6, '#c8d8e0');
  });
}
function tree2() {
  return wrap('tree2', (x, W, H) => {
    shadow(x, 8, H - 3, 6, 2, 0.3);
    rect(x, 7, H - 12, 3, 10, '#5a3a22'); rect(x, 7, H - 12, 1, 10, '#7a5232');
    disc(x, 8, H - 18, 6, '#4a7a3a'); disc(x, 6, H - 20, 4, '#5a9448'); disc(x, 11, H - 16, 3, '#3a6a30');
  });
}

export function propSprites() {
  if (reg) return reg;
  reg = {
    house: { variants: [house({ kind: 'house' }), house({ kind: 'house', wall: '#c8d4b8', wallD: '#a0b090', roof: '#486a98', roofD: '#2e4a78', roofL: '#6888b8', chimneyX: 8, flowers: '#f0e078' })] },
    smithy: { s: smithy() },
    tavern: { s: tavern() },
    hut: { elder: hutVariant('elder'), herb: hutVariant('herb') },
    stall: { s: stall() },
    well: { s: well() },
    beacon: { off: beacon(false, 0), on: [beacon(true, 0), beacon(true, 1)] },
    sign: { s: sign() }, barrel: { s: barrel() }, crate: { s: crate() },
    tent: { variants: [tent('#8a6a4a'), tent('#7a4a3a'), tent('#5a6a4a')] },
    campfire: { frames: [campfire(0), campfire(1), campfire(0), campfire(1)], fps: 8 },
    shrine: { frames: [shrine(0), shrine(1)], fps: 5 },
    lever: { off: lever(false), on: lever(true) },
    pillar: { s: pillar() }, brazier: { frames: [brazier(0), brazier(1)], fps: 7 },
    bookshelf: { s: bookshelf() }, coffin: { s: coffin() }, tomb: { s: tomb() }, throne: { s: throne() },
    statue: { s: statue() }, boulder: { s: boulder() }, stump: { s: stump() }, fence: { s: fence() }, anvil: { s: anvil() },
    obelisk: { s: obelisk() }, cart: { s: cart() }, rack: { s: rack() }, table: { s: table() }, banner: { s: banner() },
    stonedoor: { s: stonedoor() }, cryptgate: { s: cryptgate() }, barrier: { frames: [barrier(0), barrier(1), barrier(2)], fps: 6 },
    reeds: { s: reeds() },
    stairs: { s: stairs() }, lamp: { s: lamp() }, bed: { s: bed() }, boat: { s: boat() }, post: { s: post() }, net: { s: net() }, ruin: { s: ruin() },
    spear: { s: spear() }, plant: { s: plant() }, gate: { s: gate() }, monolith: { s: monolith() }, beam: { s: beam() }, grave: { s: grave() },
    hut2: { s: hut2() }, tree2: { s: tree2() }, godaltar: { s: godaltar('#c8c8d8'), by: {} },
    bush: {}, // по теме, см. getBush
  };
  return reg;
}

export const godAltarSprite = (col) => godaltar(col);
