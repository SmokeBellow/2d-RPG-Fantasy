// Мини-инструменты для рисования пиксель-арта в canvas (общие с «Шерстинами»).

export function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return [c, x];
}

export function hex2rgb(h) {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function rgb2hex(r, g, b) {
  const t = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${t(r)}${t(g)}${t(b)}`;
}

// amt > 0 осветляет, < 0 затемняет
export function shade(h, amt) {
  const [r, g, b] = hex2rgb(h);
  if (amt >= 0) return rgb2hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgb2hex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}

export function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

export function rect(x, px, py, w, h, col) {
  x.fillStyle = col;
  x.fillRect(px, py, w, h);
}

export function dot(x, px, py, col) {
  x.fillStyle = col;
  x.fillRect(px, py, 1, 1);
}

// закруглённый прямоугольник без полупрозрачности (углы срезаны на 1 пиксель)
export function rrect(x, px, py, w, h, col) {
  x.fillStyle = col;
  x.fillRect(px + 1, py, w - 2, h);
  x.fillRect(px, py + 1, w, h - 2);
}

export function ellipse(x, cx, cy, rx, ry, col) {
  x.fillStyle = col;
  for (let yy = -ry; yy <= ry; yy++) {
    const half = Math.round(rx * Math.sqrt(1 - (yy * yy) / (ry * ry + 0.0001)));
    x.fillRect(cx - half, cy + yy, half * 2 + 1, 1);
  }
}

// зеркальное отражение канвы по горизонтали
export function flipX(src) {
  const [c, x] = mk(src.width, src.height);
  x.translate(src.width, 0);
  x.scale(-1, 1);
  x.drawImage(src, 0, 0);
  return c;
}

// контур вокруг непрозрачных пикселей (делает спрайты читаемыми на любом фоне)
export function outline(src, col = '#241a2b') {
  const [c, x] = mk(src.width + 2, src.height + 2);
  const sx = src.getContext('2d');
  const d = sx.getImageData(0, 0, src.width, src.height).data;
  const W = src.width, H = src.height;
  const solid = (px, py) => px >= 0 && py >= 0 && px < W && py < H && d[(py * W + px) * 4 + 3] > 40;
  x.fillStyle = col;
  for (let py = -1; py <= H; py++) {
    for (let px = -1; px <= W; px++) {
      if (solid(px, py)) continue;
      if (solid(px - 1, py) || solid(px + 1, py) || solid(px, py - 1) || solid(px, py + 1)) x.fillRect(px + 1, py + 1, 1, 1);
    }
  }
  x.drawImage(src, 1, 1);
  return c;
}

// простой детерминированный шум для текстур
export function hash2(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 10000) / 10000;
}

// линия по пикселям (алгоритм Брезенхэма)
export function line(x, x0, y0, x1, y1, col) {
  x.fillStyle = col;
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 400; n++) {
    x.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// закрашенный круг без сглаживания
export function disc(x, cx, cy, r, col) {
  x.fillStyle = col;
  for (let yy = -r; yy <= r; yy++) {
    const half = Math.round(Math.sqrt(r * r - yy * yy));
    x.fillRect(cx - half, cy + yy, half * 2 + 1, 1);
  }
}

// вырезать/копировать участок канвы
export function sub(src, sx, sy, w, h) {
  const [c, x] = mk(w, h);
  x.drawImage(src, sx, sy, w, h, 0, 0, w, h);
  return c;
}

// тень-эллипс под существом (полупрозрачная)
export function shadow(x, cx, cy, rx, ry, a = 0.28) {
  x.fillStyle = `rgba(10,6,20,${a})`;
  for (let yy = -ry; yy <= ry; yy++) {
    const half = Math.round(rx * Math.sqrt(1 - (yy * yy) / (ry * ry + 0.0001)));
    x.fillRect(cx - half, cy + yy, half * 2 + 1, 1);
  }
}
