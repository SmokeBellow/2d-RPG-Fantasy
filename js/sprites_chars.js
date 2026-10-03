// Персонажи, враги, боссы, оружие и иконки. Всё рисуется кодом (см. px.js).
import { mk, rect, dot, rrect, ellipse, disc, line, outline, flipX, shade, mix, shadow } from './px.js';
import { hash2 } from './util.js';

const OUT = '#1d1420';
const CW = 24, CH = 30;          // холст человечка; ступни на y = 28

// ---------------------------------------------------------------- генератор человечка
// dir: 'd' | 'u' | 's' (вправо); frame: 0..3 (0 — стойка, 1/3 — шаги, 2 — стойка)
function human(P, dir, frame) {
  const [c, x] = mk(CW, CH);
  const o = { legH: 6, torsoH: 9, hair: 'short', hat: null, robe: false, beard: null, hold: null, ears: false, cape: null, pads: false, apron: null, skel: false, mustache: false, ...P };
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const lift1 = frame === 1 ? 1 : 0, lift2 = frame === 3 ? 1 : 0;
  const swL = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const legTop = 28 - o.legH, torsoTop = legTop - o.torsoH, headTop = torsoTop - 9;
  const top = o.top, pants = o.pants;
  const cx = 12;

  const skin = o.skin, skinD = shade(skin, -0.16), skinL = shade(skin, 0.1);

  // ---- плащ сзади
  if (o.cape && dir !== 'd') {
    const w = dir === 'u' ? 12 : 8;
    rect(x, cx - w / 2, torsoTop + 1 + bob, w, o.torsoH + o.legH - 4 + (frame % 2 ? 1 : 0), o.cape);
    rect(x, cx - w / 2, torsoTop + 1 + bob, 2, o.torsoH + o.legH - 4, shade(o.cape, 0.15));
    rect(x, cx + w / 2 - 2, torsoTop + 1 + bob, 2, o.torsoH + o.legH - 4, shade(o.cape, -0.3));
  }

  // ---- ноги (или подол)
  if (o.robe) {
    const h = o.legH + 1;
    rect(x, 7, legTop + bob, 10, h - 1, top[0]);
    rect(x, 7, legTop + bob, 2, h - 1, top[2]); rect(x, 15, legTop + bob, 2, h - 1, top[1]);
    for (let i = 7; i < 17; i += 2) rect(x, i, 27 + (frame % 2 ? 0 : 0), 1, 1, top[1]);
    rect(x, 7, 27, 10, 1, shade(top[0], -0.25));
    rect(x, 8 + (lift1 ? 0 : 0), 27, 3, 1, o.boots); rect(x, 13, 27, 3, 1, o.boots);
  } else if (dir === 's') {
    const f1 = frame === 1 ? 2 : frame === 3 ? -2 : 0;
    rect(x, 10 - f1, legTop, 3, o.legH - 2 + (lift1 ? -1 : 0), pants[1]); rect(x, 9 - f1, 26 - (lift1 ? 1 : 0), 5, 2, o.boots);
    rect(x, 11 + f1, legTop, 3, o.legH - 2 + (lift2 ? -1 : 0), pants[0]); rect(x, 11 + f1, 26 - (lift2 ? 1 : 0), 5, 2, o.boots); rect(x, 11 + f1, 26 - (lift2 ? 1 : 0), 5, 1, shade(o.boots, 0.2));
  } else {
    rect(x, 8, legTop, 3, o.legH - 2 - lift1, pants[0]); rect(x, 7, 26 - lift1, 5, 2, o.boots);
    rect(x, 13, legTop, 3, o.legH - 2 - lift2, pants[1]); rect(x, 12, 26 - lift2, 5, 2, o.boots);
    rect(x, 8, legTop, 1, o.legH - 2, shade(pants[0], 0.15)); rect(x, 7, 26 - lift1, 5, 1, shade(o.boots, 0.2)); rect(x, 12, 26 - lift2, 5, 1, shade(o.boots, 0.2));
  }

  // ---- туловище
  const tw = dir === 's' ? 7 : 10, tx = dir === 's' ? 9 : 7;
  const ty = torsoTop + bob;
  if (o.skel) {
    rect(x, tx + 1, ty, tw - 2, o.torsoH, o.bone[1]);
    for (let j = 1; j < o.torsoH - 1; j += 2) rect(x, tx + 1, ty + j, tw - 2, 1, o.bone[0]);
    rect(x, cx - 1, ty, 2, o.torsoH, o.bone[2]);
    rect(x, tx + 1, ty + o.torsoH - 2, tw - 2, 2, o.pants[0]);
  } else {
    rect(x, tx, ty, tw, o.torsoH, top[0]);
    rect(x, tx, ty, 2, o.torsoH, top[2]); rect(x, tx + tw - 2, ty, 2, o.torsoH, top[1]);
    rect(x, tx, ty, tw, 1, top[2]);
    if (o.apron && dir !== 'u') { rect(x, tx + 2, ty + 2, tw - 4, o.torsoH - 2 + o.legH * (o.robe ? 0 : 0.3), o.apron); rect(x, tx + 2, ty + 2, 1, o.torsoH - 2, shade(o.apron, 0.2)); }
    if (o.tabard && dir === 'd') { rect(x, 10, ty + 1, 4, o.torsoH + 2, o.tabard); rect(x, 10, ty + 1, 1, o.torsoH + 2, shade(o.tabard, 0.2)); }
    if (o.trim) { rect(x, tx, ty + o.torsoH - 2, tw, 1, o.trim); if (dir === 'd') { rect(x, 11, ty, 2, 2, o.trim); } }
    if (o.belt) { rect(x, tx, ty + o.torsoH - 3, tw, 2, o.belt); if (dir === 'd') rect(x, 11, ty + o.torsoH - 3, 2, 2, o.buckle || '#e8c050'); }
    if (o.chest && dir === 'd') { rect(x, 9, ty + 3, 6, 1, o.chest); rect(x, 11, ty + 2, 2, 4, o.chest); }
  }
  if (o.pads) {
    const pc = o.padCol || top[2];
    if (dir === 's') { rect(x, 10, ty - 1, 5, 3, pc); rect(x, 10, ty - 1, 5, 1, shade(pc, 0.25)); }
    else { rect(x, 5, ty - 1, 4, 3, pc); rect(x, 15, ty - 1, 4, 3, pc); rect(x, 5, ty - 1, 4, 1, shade(pc, 0.25)); rect(x, 15, ty - 1, 4, 1, shade(pc, 0.25)); }
  }

  // ---- руки
  const armCol = o.sleeve || top[0];
  if (dir === 's') {
    const a = swL;
    rect(x, 10 + a, ty + 1, 3, o.torsoH - 3, armCol); rect(x, 10 + a, ty + 1, 1, o.torsoH - 3, shade(armCol, 0.2));
    rect(x, 10 + a, ty + o.torsoH - 2, 3, 2, skin);
  } else {
    const l = dir === 'u' ? -swL : swL;
    rect(x, 4, ty + 1 + l, 3, o.torsoH - 3, armCol); rect(x, 4, ty + 1 + l, 1, o.torsoH - 3, shade(armCol, 0.2)); rect(x, 4, ty + o.torsoH - 2 + l, 3, 2, skin);
    rect(x, 17, ty + 1 - l, 3, o.torsoH - 3, armCol); rect(x, 19, ty + 1 - l, 1, o.torsoH - 3, shade(armCol, -0.3)); rect(x, 17, ty + o.torsoH - 2 - l, 3, 2, skin);
  }

  // ---- оружие в руке (для врагов и NPC)
  if (o.hold) holdItem(x, o.hold, dir, ty, o, frame);

  // ---- голова
  const hy = headTop + bob + 1;
  if (dir === 's') {
    rect(x, 9, hy, 8, 8, skin); rect(x, 17, hy + 4, 1, 2, skin); // нос
    rect(x, 9, hy + 6, 8, 2, skinD); rect(x, 9, hy, 2, 8, skinD); dot(x, 9, hy, '#0000');
    rect(x, 13, hy + 3, 2, 2, o.eye || '#2a1c1c'); dot(x, 13, hy + 3, '#fff');
    if (o.ears) { rect(x, 8, hy + 2, 2, 3, skin); rect(x, 7, hy + 1, 1, 2, skin); }
    if (o.beard) { rect(x, 11, hy + 5, 6, 4, o.beard); rect(x, 12, hy + 7, 4, 2, shade(o.beard, -0.2)); }
    if (o.mustache) { rect(x, 13, hy + 5, 4, 1, o.mustache); }
  } else if (dir === 'd') {
    rect(x, 8, hy, 8, 8, skin); dot(x, 8, hy, '#0000'); dot(x, 15, hy, '#0000');
    rect(x, 8, hy + 6, 8, 2, skinD); rect(x, 14, hy, 2, 6, skinD); rect(x, 8, hy + 1, 1, 5, skinL);
    if (o.skel) { rect(x, 9, hy + 3, 2, 2, '#10101a'); rect(x, 13, hy + 3, 2, 2, '#10101a'); if (o.glow) { dot(x, 9, hy + 3, o.glow); dot(x, 13, hy + 3, o.glow); } rect(x, 10, hy + 6, 4, 1, '#10101a'); for (let i = 10; i < 14; i += 2) dot(x, i, hy + 7, '#10101a'); }
    else {
      rect(x, 10, hy + 3, 1, 2, o.eye || '#2a1c1c'); rect(x, 13, hy + 3, 1, 2, o.eye || '#2a1c1c');
      dot(x, 10, hy + 3, '#fff'); dot(x, 13, hy + 3, '#fff');
      if (o.glow) { dot(x, 10, hy + 4, o.glow); dot(x, 13, hy + 4, o.glow); }
      if (!o.beard) rect(x, 11, hy + 6, 2, 1, shade(skin, -0.3));
      if (o.blush) { dot(x, 9, hy + 5, o.blush); dot(x, 14, hy + 5, o.blush); }
    }
    if (o.ears) { rect(x, 6, hy + 2, 2, 3, skin); rect(x, 5, hy + 1, 1, 2, skin); rect(x, 16, hy + 2, 2, 3, skin); rect(x, 18, hy + 1, 1, 2, skin); }
    if (o.beard) { rect(x, 8, hy + 5, 8, 5, o.beard); rect(x, 10, hy + 9, 4, 2, o.beard); rect(x, 8, hy + 5, 1, 4, shade(o.beard, 0.2)); rect(x, 15, hy + 5, 1, 5, shade(o.beard, -0.25)); rect(x, 10, hy + 5, 4, 1, shade(skin, -0.2)); dot(x, 11, hy + 6, '#0000'); }
    if (o.mustache) { rect(x, 9, hy + 5, 6, 1, o.mustache); }
    if (o.scar) { line(x, 9, hy + 1, 11, hy + 4, o.scar); }
    if (o.eyepatch) { rect(x, 9, hy + 3, 3, 3, '#1a1420'); line(x, 8, hy + 1, 15, hy + 3, '#1a1420'); }
  } else {
    rect(x, 8, hy, 8, 8, skin); rect(x, 8, hy + 5, 8, 3, skinD);
    if (o.ears) { rect(x, 6, hy + 2, 2, 3, skin); rect(x, 16, hy + 2, 2, 3, skin); }
  }

  // ---- волосы
  const hc = o.hairC, hcd = shade(hc, -0.25), hcl = shade(hc, 0.2);
  if (o.hat !== 'hood' && o.hat !== 'helm' && o.hair !== 'bald') {
    if (dir === 'd') {
      rect(x, 8, hy - 1, 8, 3, hc); rect(x, 7, hy, 1, 4, hc); rect(x, 16, hy, 1, 4, hc);
      rect(x, 8, hy - 1, 8, 1, hcl); rect(x, 9, hy + 2, 2, 1, hc); rect(x, 13, hy + 2, 3, 1, hc); dot(x, 11, hy + 2, hc);
      if (o.hair === 'long') { rect(x, 6, hy + 1, 2, 12, hc); rect(x, 16, hy + 1, 2, 12, hc); rect(x, 6, hy + 8, 1, 5, hcd); rect(x, 17, hy + 8, 1, 5, hcd); }
      if (o.hair === 'spiky') { for (let i = 8; i < 16; i += 2) rect(x, i, hy - 3, 1, 3, hc); }
      if (o.braid) { rect(x, 17, hy + 5, 2, 12, hc); for (let j = 0; j < 12; j += 2) rect(x, 17, hy + 5 + j, 2, 1, hcd); }
    } else if (dir === 'u') {
      rect(x, 7, hy - 1, 10, 10, hc); rect(x, 7, hy - 1, 10, 2, hcl); rect(x, 7, hy + 6, 10, 3, hcd);
      if (o.hair === 'long') { rect(x, 6, hy + 2, 12, 12, hc); rect(x, 6, hy + 10, 12, 3, hcd); }
      if (o.braid) { rect(x, 11, hy + 8, 2, 10, hc); }
    } else {
      rect(x, 8, hy - 1, 9, 3, hc); rect(x, 8, hy + 1, 4, 6, hc); rect(x, 8, hy - 1, 9, 1, hcl);
      if (o.hair === 'long') { rect(x, 7, hy + 1, 4, 12, hc); rect(x, 7, hy + 9, 4, 4, hcd); }
      if (o.hair === 'spiky') { for (let i = 9; i < 17; i += 2) rect(x, i, hy - 3, 1, 3, hc); }
      if (o.braid) { rect(x, 7, hy + 4, 2, 11, hc); }
    }
  }

  // ---- головные уборы
  const hat = o.hat;
  if (hat === 'wizard') {
    const hcol = o.hatCol;
    rect(x, 5, hy - 1, 14, 2, hcol); rect(x, 5, hy - 1, 14, 1, shade(hcol, 0.25)); rect(x, 6, hy + 1, 12, 1, shade(hcol, -0.3));
    for (let r = 0; r < 12; r++) { const half = Math.max(1, Math.round(5.5 - r * 0.45)); const bend = r > 7 ? (r - 7) : 0; rect(x, cx - half + bend, hy - 2 - r, half * 2, 1, r % 4 === 0 ? shade(hcol, 0.12) : hcol); rect(x, cx - half + bend, hy - 2 - r, 1, 1, shade(hcol, 0.3)); rect(x, cx + half - 1 + bend, hy - 2 - r, 1, 1, shade(hcol, -0.3)); }
    rect(x, 8, hy - 2, 8, 1, o.hatBand || '#e8c050');
    if (o.hatStar) dot(x, cx, hy - 2, '#ffffff');
  } else if (hat === 'hood') {
    const hc2 = o.hatCol;
    if (dir === 'u') { rect(x, 6, hy - 2, 12, 12, hc2); rect(x, 6, hy - 2, 12, 2, shade(hc2, 0.2)); rect(x, 6, hy + 8, 12, 2, shade(hc2, -0.3)); }
    else if (dir === 'd') {
      rect(x, 6, hy - 2, 12, 11, hc2); rect(x, 6, hy - 2, 12, 2, shade(hc2, 0.2)); rect(x, 8, hy + 1, 8, 7, skin);
      rect(x, 8, hy + 1, 8, 2, shade(skin, -0.5)); rect(x, 9, hy + 3, 6, 1, shade(skin, -0.25));
      rect(x, 10, hy + 3, 1, 2, o.eye || '#2a1c1c'); rect(x, 13, hy + 3, 1, 2, o.eye || '#2a1c1c');
      rect(x, 6, hy + 5, 2, 5, hc2); rect(x, 16, hy + 5, 2, 5, hc2);
      if (o.mask) { rect(x, 8, hy + 5, 8, 3, o.mask); }
    } else {
      rect(x, 7, hy - 2, 10, 11, hc2); rect(x, 7, hy - 2, 10, 2, shade(hc2, 0.2)); rect(x, 12, hy + 2, 5, 6, skin); rect(x, 12, hy + 2, 5, 2, shade(skin, -0.5)); rect(x, 14, hy + 4, 2, 2, o.eye || '#2a1c1c'); rect(x, 17, hy + 3, 1, 4, hc2);
      if (o.mask) { rect(x, 12, hy + 5, 5, 3, o.mask); }
    }
  } else if (hat === 'helm') {
    const hm = o.hatCol;
    if (dir === 'd') {
      rect(x, 7, hy - 2, 10, 9, hm); rect(x, 7, hy - 2, 10, 2, shade(hm, 0.3)); rect(x, 7, hy + 6, 10, 1, shade(hm, -0.3));
      rect(x, 8, hy + 2, 8, 2, '#10101a'); rect(x, 11, hy + 2, 2, 5, '#10101a'); rect(x, 7, hy + 1, 1, 6, shade(hm, 0.2)); rect(x, 16, hy + 1, 1, 6, shade(hm, -0.3));
    } else if (dir === 'u') { rect(x, 7, hy - 2, 10, 10, hm); rect(x, 7, hy - 2, 10, 2, shade(hm, 0.3)); rect(x, 7, hy + 6, 10, 2, shade(hm, -0.3)); }
    else { rect(x, 8, hy - 2, 9, 9, hm); rect(x, 8, hy - 2, 9, 2, shade(hm, 0.3)); rect(x, 12, hy + 2, 5, 2, '#10101a'); rect(x, 8, hy + 6, 9, 1, shade(hm, -0.3)); }
    if (o.plume) rect(x, 11, hy - 5, 3, 3, o.plume);
    if (o.horns) { rect(x, 6, hy - 4, 2, 5, '#d8d0c0'); rect(x, 16, hy - 4, 2, 5, '#d8d0c0'); dot(x, 5, hy - 5, '#d8d0c0'); dot(x, 18, hy - 5, '#d8d0c0'); }
  } else if (hat === 'bandana') {
    rect(x, 8, hy, 8, 2, o.hatCol); rect(x, 15, hy + 1, 3, 3, o.hatCol); rect(x, 8, hy, 8, 1, shade(o.hatCol, 0.25));
  } else if (hat === 'scarf') {
    rect(x, 7, hy - 1, 10, 4, o.hatCol); rect(x, 7, hy - 1, 10, 1, shade(o.hatCol, 0.25)); rect(x, 6, hy + 2, 3, 6, o.hatCol); rect(x, 16, hy + 2, 2, 3, o.hatCol);
    if (dir === 'd') rect(x, 8, hy + 3, 8, 1, shade(o.hatCol, -0.3));
  } else if (hat === 'crown') {
    rect(x, 8, hy - 2, 8, 3, '#e8c050'); for (const i of [8, 11, 14]) rect(x, i, hy - 4, 2, 2, '#e8c050'); dot(x, 12, hy - 1, '#c83a3a');
  } else if (hat === 'leaf') {
    for (const i of [8, 11, 14]) { rect(x, i, hy - 2, 3, 2, '#6aae50'); dot(x, i + 1, hy - 3, '#8ac870'); }
  }
  if (o.glowEyes && dir !== 'u') {
    // светящиеся глаза поверх (враги Скверны)
    if (dir === 'd') { rect(x, 9, hy + 3, 2, 1, o.glowEyes); rect(x, 13, hy + 3, 2, 1, o.glowEyes); }
    else rect(x, 13, hy + 3, 2, 1, o.glowEyes);
  }
  return outline(c, OUT);
}

// предметы в руке врагов / NPC
function holdItem(x, what, dir, ty, o, frame) {
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const hx = dir === 's' ? 13 : dir === 'u' ? 5 : 19;
  const hy = ty + o.torsoH - 2 + bob;
  const wood = '#6a4a2a', woodL = '#9a6a3c';
  switch (what) {
    case 'club': rect(x, hx, hy - 10, 3, 14, wood); rect(x, hx - 1, hy - 14, 5, 6, woodL); rect(x, hx - 1, hy - 14, 5, 1, '#c89050'); dot(x, hx + 1, hy - 11, '#4a3220'); break;
    case 'bow': rect(x, hx + 1, hy - 8, 1, 14, '#d8c8a0'); dot(x, hx, hy - 9, wood); dot(x, hx, hy + 5, wood); rect(x, hx, hy - 7, 1, 2, wood); rect(x, hx, hy + 2, 1, 2, wood); line(x, hx - 1, hy - 8, hx - 1, hy + 5, '#e8e0c8'); break;
    case 'dagger': rect(x, hx, hy - 6, 2, 7, '#c8ccd8'); rect(x, hx, hy - 6, 1, 7, '#eceff8'); rect(x, hx - 1, hy + 1, 4, 1, '#6a4a2a'); break;
    case 'sword': rect(x, hx, hy - 12, 2, 13, '#c8ccd8'); rect(x, hx, hy - 12, 1, 13, '#eceff8'); rect(x, hx - 2, hy + 1, 6, 1, '#8a6a30'); rect(x, hx, hy + 2, 2, 2, wood); break;
    case 'bonesword': rect(x, hx, hy - 12, 2, 13, '#d8d0c0'); rect(x, hx - 2, hy + 1, 6, 1, '#8a8478'); break;
    case 'spear': rect(x, hx + 1, hy - 20, 1, 26, wood); rect(x, hx, hy - 24, 3, 5, '#c8ccd8'); dot(x, hx + 1, hy - 26, '#eceff8'); break;
    case 'staff': rect(x, hx + 1, hy - 16, 2, 22, wood); disc(x, hx + 2, hy - 18, 2, '#58c8e8'); break;
    case 'hammer': rect(x, hx, hy - 8, 2, 12, wood); rect(x, hx - 3, hy - 12, 8, 5, '#6a6a7a'); rect(x, hx - 3, hy - 12, 8, 1, '#9a9aa8'); break;
    case 'basket': rect(x, hx - 3, hy - 2, 7, 5, '#a07848'); rect(x, hx - 2, hy - 4, 5, 2, '#6aae50'); dot(x, hx, hy - 5, '#f0a0c0'); break;
    case 'mug': rect(x, hx - 1, hy - 2, 4, 4, '#c8c8d0'); rect(x, hx, hy - 3, 2, 1, '#f0f0f0'); rect(x, hx + 3, hy - 1, 1, 2, '#c8c8d0'); break;
    case 'cane': rect(x, hx + 1, hy - 14, 2, 20, '#6a4a2a'); rect(x, hx - 1, hy - 16, 5, 2, '#6a4a2a'); break;
    default: break;
  }
}

function humanSet(P) {
  const set = { d: [], u: [], s: [], sL: [] };
  for (let f = 0; f < 4; f++) {
    set.d.push(human(P, 'd', f)); set.u.push(human(P, 'u', f));
    const s = human(P, 's', f); set.s.push(s); set.sL.push(flipX(s));
  }
  return set;
}

// ---------------------------------------------------------------- игроки
const SKIN = '#f2c9a0';
const TIERS = {
  warrior: [
    { top: ['#8a6a4a', '#6a4a30', '#a8845a'], pants: ['#5a4a3a', '#443626'], boots: '#3a2a1c', hat: null, pads: false },
    { top: ['#8c94a2', '#6a7280', '#aab2c0'], pants: ['#4a4a58', '#363644'], boots: '#3a3030', hat: 'helm', hatCol: '#8c94a2', pads: true, padCol: '#a8b0be' },
    { top: ['#b8c0cc', '#8a92a0', '#dce2ec'], pants: ['#5a6070', '#444a5a'], boots: '#4a4a58', hat: 'helm', hatCol: '#c0c8d4', plume: '#c83a3a', pads: true, padCol: '#dce2ec' },
    { top: ['#c8d4e8', '#8a9ac0', '#f0f6ff'], pants: ['#3a4a78', '#2a3660'], boots: '#2a3050', hat: 'helm', hatCol: '#d8e2f4', plume: '#58e0ff', pads: true, padCol: '#58b8e8', trim: '#58e0ff' },
  ],
  mage: [
    { top: ['#4a5a9a', '#34407a', '#6a7ac0'], pants: ['#34407a', '#262e60'], boots: '#3a2a1c', hat: 'wizard', hatCol: '#4a5a9a' },
    { top: ['#6a4a9a', '#4a3278', '#8a6ac0'], pants: ['#4a3278', '#34205a'], boots: '#3a2a1c', hat: 'wizard', hatCol: '#6a4a9a', hatBand: '#e8c050' },
    { top: ['#2a5aa8', '#1a3e80', '#4a7ad0'], pants: ['#1a3e80', '#122c60'], boots: '#2a2030', hat: 'wizard', hatCol: '#2a5aa8', hatStar: true, trim: '#e8d060' },
    { top: ['#d0502a', '#9a3418', '#f07a40'], pants: ['#9a3418', '#6a2210'], boots: '#3a2018', hat: 'wizard', hatCol: '#d0502a', hatBand: '#ffd860', hatStar: true, trim: '#ffd860' },
  ],
  rogue: [
    { top: ['#6a5a4a', '#4e4034', '#8a7860'], pants: ['#4a4038', '#342c26'], boots: '#2a2018', hat: 'hood', hatCol: '#5a4a3a' },
    { top: ['#4a6a4a', '#34503a', '#6a8a62'], pants: ['#3a4a3a', '#2a382a'], boots: '#2a2018', hat: 'hood', hatCol: '#3e5a3e', mask: '#2a3a2a' },
    { top: ['#3a3a4a', '#26262e', '#58586c'], pants: ['#2a2a36', '#1c1c26'], boots: '#1a1a22', hat: 'hood', hatCol: '#34343e', mask: '#1c1c26' },
    { top: ['#34204a', '#201230', '#58388a'], pants: ['#241636', '#180e26'], boots: '#140a1e', hat: 'hood', hatCol: '#2e1a46', mask: '#140a1e', trim: '#a060e0' },
  ],
};
const CLASS_LOOK = {
  warrior: { hair: 'short', hairC: '#7a4a2a', belt: '#5a3a22', tabard: '#b83a32', chest: null },
  mage: { hair: 'long', hairC: '#c8c0d8', belt: '#e8c050', robe: true, tabard: null },
  rogue: { hair: 'short', hairC: '#2a2630', belt: '#3a2a1c', buckle: '#c8c8d0', cape: '#2a2038' },
};

const playerCache = new Map();
export function playerSet(cls, tier) {
  const key = `${cls}|${tier}`;
  if (playerCache.has(key)) return playerCache.get(key);
  const t = TIERS[cls][Math.min(tier, 4) - 1];
  const P = { skin: SKIN, eye: '#2a1c1c', blush: '#e89a88', ...CLASS_LOOK[cls], ...t };
  if (cls === 'rogue') P.cape = shade(t.top[1], -0.2);
  const s = humanSet(P);
  playerCache.set(key, s);
  return s;
}

// оружие для оверлея: «остриё вверх», хват в нижней трети. Возвращает { c, hx, hy }
export function weaponSprite(cls, tier) {
  const [c, x] = mk(8, 30);
  const hx = 4, hy = 24;
  const blade = ['#b8bcc8', '#d4d8e4', '#e8ecf6', '#8a8ec0'][Math.min(tier, 5) - 2] || '#a8acb8';
  if (cls === 'warrior') {
    const col = tier >= 5 ? '#ffb030' : tier >= 4 ? '#8ad0ff' : tier >= 3 ? '#d8dce8' : tier >= 2 ? '#b8bcc8' : '#9a8a78';
    rect(x, 3, 3, 2, 17, col); rect(x, 3, 3, 1, 17, shade(col, 0.35)); dot(x, 3, 2, shade(col, 0.4)); dot(x, 4, 2, col);
    if (tier >= 4) { rect(x, 4, 6, 1, 10, shade(col, -0.25)); }
    rect(x, 1, 20, 6, 2, tier >= 5 ? '#ffd860' : '#8a6a30'); rect(x, 3, 22, 2, 4, '#5a3a22'); rect(x, 2, 26, 4, 2, tier >= 5 ? '#ffd860' : '#8a6a30');
  } else if (cls === 'mage') {
    const gem = tier >= 5 ? '#ff7a30' : tier >= 4 ? '#7ae0ff' : tier >= 3 ? '#a888ff' : tier >= 2 ? '#58c8a8' : '#8a6a4a';
    rect(x, 3, 8, 2, 22, '#6a4a2a'); rect(x, 3, 8, 1, 22, '#9a6a3c');
    rect(x, 2, 6, 4, 2, '#8a6a30'); disc(x, 4, 4, 3, gem); dot(x, 3, 3, '#ffffff'); rect(x, 1, 2, 1, 1, shade(gem, 0.3));
    if (tier >= 3) { dot(x, 1, 5, gem); dot(x, 7, 5, gem); }
  } else {
    const col = tier >= 5 ? '#ffb030' : tier >= 4 ? '#b890ff' : tier >= 3 ? '#e8e0d0' : '#c0c4d0';
    rect(x, 3, 12, 2, 10, col); rect(x, 3, 12, 1, 10, shade(col, 0.35)); dot(x, 3, 11, col); dot(x, 4, 10, col);
    rect(x, 1, 22, 6, 1, '#8a6a30'); rect(x, 3, 23, 2, 4, '#3a2a1c');
  }
  return { c: outline(c, OUT), hx: hx + 1, hy: hy + 1 };
}

// ---------------------------------------------------------------- NPC
const NPC_LOOKS = {
  elder: { skin: '#e8c0a0', hairC: '#f0f0f0', hair: 'bald', beard: '#f0f0f0', top: ['#7a6a9a', '#5a4a7a', '#9a8aba'], pants: ['#5a4a7a', '#40345a'], boots: '#3a2a1c', robe: true, belt: '#e8c050', hold: 'cane', hat: null, trim: '#e8d060' },
  guard: { skin: '#e8b890', hairC: '#4a3220', top: ['#7a8aa8', '#566486', '#a0b0cc'], pants: ['#4a5470', '#363e56'], boots: '#2a2230', hat: 'helm', hatCol: '#9aa4b8', plume: '#b83a32', pads: true, padCol: '#aab4c8', belt: '#5a3a22', hold: 'spear', tabard: '#3a5aa0', mustache: '#4a3220' },
  smith: { skin: '#d8a078', hairC: '#3a2a1c', hair: 'bald', beard: '#5a3a22', top: ['#6a4a2a', '#4a3220', '#8a6a3a'], sleeve: '#d8a078', apron: '#4a4a52', pants: ['#4a4038', '#342c26'], boots: '#2a2018', hold: 'hammer', hat: null, belt: '#2a2018' },
  merchant: { skin: '#f0c8a0', hairC: '#5a2a2a', top: ['#b8607a', '#8a405a', '#d880a0'], pants: ['#7a405a', '#5a2c42'], boots: '#3a2a1c', robe: true, hat: 'scarf', hatCol: '#e0a840', apron: '#f0e6d0', hold: 'basket', blush: '#e89a88', belt: '#8a405a' },
  innkeeper: { skin: '#e8b890', hairC: '#6a4a2a', hair: 'bald', top: ['#a89068', '#867048', '#c8b088'], pants: ['#5a4a3a', '#443626'], boots: '#3a2a1c', apron: '#f0ece0', hold: 'mug', mustache: '#6a4a2a', hat: null, belt: '#5a3a22' },
  herbalist: { skin: '#f0c8a0', hairC: '#7a4a2a', hair: 'long', braid: true, top: ['#5a9a58', '#3e7a40', '#7ac078'], pants: ['#3e7a40', '#2c5a30'], boots: '#3a2a1c', robe: true, hat: 'leaf', hold: 'basket', blush: '#e89a88', belt: '#7a5a3a' },
  miner: { skin: '#d8a078', hairC: '#3a2a1c', top: ['#6a6a58', '#4e4e40', '#8a8a74'], pants: ['#4a4038', '#342c26'], boots: '#2a2018', hat: 'helm', hatCol: '#a89a5a', beard: '#3a2a1c', hold: 'pick', belt: '#2a2018', sleeve: '#d8a078' },
  minerF: { skin: '#e8b890', hairC: '#7a3a1a', hair: 'long', braid: true, top: ['#7a6a58', '#5a4c3e', '#9a8a74'], pants: ['#4a4038', '#342c26'], boots: '#2a2018', hat: 'helm', hatCol: '#a89a5a', hold: 'pick', belt: '#2a2018', blush: '#e89a88' },
  ranger: { skin: '#e0b088', hairC: '#6a5a3a', top: ['#4a6a3a', '#34502a', '#6a8a52'], pants: ['#4a4030', '#342c22'], boots: '#2a2018', hat: 'hood', hatCol: '#3e5a2e', hold: 'bow', cape: '#34502a', belt: '#3a2a1c', beard: '#6a5a3a' },
  seer: { skin: '#f0d0b0', hairC: '#c8c0d0', hair: 'spiky', top: ['#b8b4d0', '#8e8aac', '#d8d4ec'], pants: ['#8e8aac', '#6e6a8c'], boots: '#5a5470', legH: 4, torsoH: 6, hat: null, glowEyes: '#d8e8ff', blush: '#e8a8a0', belt: null },
  seerF: { skin: '#f0d0b0', hairC: '#e8e4f0', hair: 'long', top: ['#c8c4e0', '#9e9abc', '#e8e4fc'], pants: ['#9e9abc', '#7e7a9c'], boots: '#5a5470', robe: true, hat: null, glowEyes: '#d8e8ff', blush: '#e8a8a0', belt: '#d8d4ec' },
  witch: { skin: '#d8c8a0', hairC: '#5a6a4a', hair: 'long', braid: true, top: ['#4a5a3a', '#34422a', '#6a7a52'], pants: ['#34422a', '#26301e'], boots: '#2a2018', robe: true, hat: 'leaf', hold: 'basket', belt: '#7a5a3a', blush: '#c8a888' },
  kid: { skin: '#f4cda6', hairC: '#c88a3a', hair: 'spiky', top: ['#e8c068', '#c09840', '#f8dc88'], pants: ['#4a6a9a', '#34507a'], boots: '#5a3a22', legH: 4, torsoH: 6, hat: null, blush: '#e89a88', belt: null },
};
const npcCache = new Map();
export function npcSet(look) {
  if (npcCache.has(look)) return npcCache.get(look);
  const s = humanSet(NPC_LOOKS[look]);
  npcCache.set(look, s);
  return s;
}

export function catSprite(frame) {
  const [c, x] = mk(24, 16);
  shadow(x, 12, 14, 9, 2);
  // свернувшийся рыжий кот
  ellipse(x, 11, 10, 8, 4, '#d8782e'); ellipse(x, 10, 9, 7, 3, '#ec9444');
  for (const sx of [6, 10, 14]) rect(x, sx, 7, 2, 4, '#a85a1e');
  disc(x, 19, 8, 3, '#ec9444'); rect(x, 17, 4, 2, 3, '#ec9444'); rect(x, 21, 4, 2, 3, '#ec9444'); dot(x, 18, 5, '#f4b0a0'); dot(x, 22, 5, '#f4b0a0');
  rect(x, 19, 8, 1, frame ? 0 : 1, '#1a1420'); rect(x, 21, 8, 1, frame ? 0 : 1, '#1a1420'); dot(x, 20, 10, '#f4b0a0');
  rect(x, 2, 11, 5, 2, '#d8782e'); rect(x, 1, 10, 2, 2, '#a85a1e');
  rect(x, 11, 12, 6, 2, '#f8e8d0'); rect(x, 8, 12, 2, 2, '#f8e8d0');
  return outline(c, OUT);
}

// ---------------------------------------------------------------- враги
function slime(frame, col, wind) {
  const [c, x] = mk(20, 16);
  const sq = frame === 1 ? 1 : 0;
  const h = wind ? 8 : 11 - sq * 2, w = wind ? 8 : 6 + sq;
  shadow(x, 10, 14, 7, 2, 0.3);
  const [m, mx] = mk(20, 16);
  ellipse(mx, 10, 14 - h / 2, w + 1, Math.round(h / 2), '#fff');
  const d = mx.getImageData(0, 0, 20, 16).data;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 20; i++) {
    if (d[(j * 20 + i) * 4 + 3] < 40) continue;
    const l = (-(i - 8) * 0.5 - (j - 7) * 0.9) / 8;
    x.fillStyle = l > 0.45 ? shade(col, 0.35) : l > 0 ? shade(col, 0.1) : l > -0.45 ? col : shade(col, -0.3);
    x.fillRect(i, j, 1, 1);
  }
  const ey = 14 - h + Math.round(h * 0.35) + 1;
  rect(x, 7, ey, 2, 3, '#10202a'); rect(x, 12, ey, 2, 3, '#10202a'); dot(x, 7, ey, '#fff'); dot(x, 12, ey, '#fff');
  rect(x, 9, ey + 4, 3, 1, '#10202a');
  rect(x, 6, 14 - h + 2, 3, 1, 'rgba(255,255,255,0.7)');
  return outline(c, OUT);
}

function wolf(frame, wind) {
  const [c, x] = mk(30, 20);
  shadow(x, 14, 18, 11, 2, 0.3);
  const fur = '#7a7a86', furD = '#54545e', furL = '#a0a0ac';
  const dy = wind ? 3 : 0;
  const l1 = frame === 0 ? 0 : frame === 1 ? 2 : -2;
  // задние и передние лапы
  rect(x, 6 + l1, 13 + dy, 3, 5 - dy, furD); rect(x, 9 - l1, 13 + dy, 3, 5 - dy, fur);
  rect(x, 18 - l1, 13 + dy, 3, 5 - dy, furD); rect(x, 21 + l1, 13 + dy, 3, 5 - dy, fur);
  // туловище
  rrect(x, 5, 7 + dy, 19, 8, fur); rect(x, 6, 7 + dy, 17, 2, furL); rect(x, 6, 13 + dy, 17, 2, furD);
  for (let i = 8; i < 22; i += 3) dot(x, i, 9 + dy, furD);
  // хвост
  rect(x, 1, 6 + dy - (frame === 1 ? 1 : 0), 5, 3, furD); rect(x, 0, 5 + dy, 2, 2, furD);
  // голова
  rrect(x, 22, 5 + dy, 7, 7, fur); rect(x, 27, 8 + dy, 3, 3, furL); dot(x, 29, 8 + dy, '#1a1420');
  rect(x, 22, 3 + dy, 2, 3, furD); rect(x, 25, 3 + dy, 2, 3, furD);
  dot(x, 25, 7 + dy, wind ? '#ff4a3a' : '#f0d060'); dot(x, 26, 7 + dy, '#1a1420');
  if (wind) { rect(x, 27, 11 + dy, 3, 1, '#f8f8f8'); }
  return outline(c, OUT);
}

function spider(frame, col = '#3a2a3a') {
  const [c, x] = mk(26, 18);
  shadow(x, 13, 16, 9, 2, 0.3);
  const leg = (sx, sy, dx, dy2, k) => { line(x, sx, sy, sx + dx, sy - 3 - (k ? 1 : 0), '#1a1020'); line(x, sx + dx, sy - 3 - (k ? 1 : 0), sx + dx + (dx > 0 ? 3 : -3), sy + dy2, '#1a1020'); };
  for (let i = 0; i < 4; i++) {
    const k = (i + frame) % 2;
    leg(10, 8 + i - 1, -3 - i * 1, 5 - i, k); leg(15, 8 + i - 1, 3 + i * 1, 5 - i, k);
  }
  disc(x, 13, 10, 5, col); disc(x, 13, 5, 3, shade(col, 0.1));
  rect(x, 10, 8, 6, 1, shade(col, 0.3)); rect(x, 11, 9, 4, 3, '#8a2a3a'); rect(x, 12, 10, 2, 1, '#c85a6a');
  dot(x, 11, 4, '#ff3a3a'); dot(x, 15, 4, '#ff3a3a'); dot(x, 12, 3, '#ff3a3a'); dot(x, 14, 3, '#ff3a3a');
  return outline(c, OUT);
}

function bat(frame) {
  const [c, x] = mk(26, 16);
  shadow(x, 13, 14, 5, 1, 0.2);
  const up = frame === 0;
  const wing = (sgn) => {
    const bx = 13 + sgn * 3;
    for (let i = 0; i < 9; i++) {
      const wy = up ? 5 - Math.round(i * 0.4) + (i > 5 ? 3 : 0) : 6 + Math.round(i * 0.3);
      rect(x, bx + sgn * i - (sgn < 0 ? 0 : 0), wy, 1, 4 - (i > 6 ? 1 : 0), i % 3 === 0 ? '#3a2848' : '#54406a');
    }
    rect(x, bx + sgn * 5, up ? 8 : 9, 1, 3, '#2a1a38');
  };
  wing(-1); wing(1);
  ellipse(x, 13, 8, 3, 4, '#4a3458'); rect(x, 11, 4, 1, 3, '#4a3458'); rect(x, 15, 4, 1, 3, '#4a3458');
  dot(x, 11, 8, '#ff4a4a'); dot(x, 15, 8, '#ff4a4a'); rect(x, 12, 10, 3, 1, '#f8f0e8'); dot(x, 12, 11, '#f8f0e8'); dot(x, 14, 11, '#f8f0e8');
  return outline(c, OUT);
}

function wraith(frame) {
  const [c, x] = mk(24, 32);
  const wob = frame === 0 ? 0 : 1;
  // тело-плащ
  for (let r = 0; r < 26; r++) {
    const half = Math.round(4 + r * 0.32 + Math.sin(r * 0.5 + frame * 1.6) * 0.6);
    const a = 1 - r / 40;
    rect(x, 12 - half, 6 + r, half * 2, 1, r % 5 === 0 ? '#9ab0e0' : '#7a90c8');
    rect(x, 12 - half, 6 + r, 2, 1, '#b8ccf4'); rect(x, 12 + half - 2, 6 + r, 2, 1, '#5a70a8');
  }
  // рваный подол
  for (let i = 0; i < 12; i++) { const ln = 2 + ((i * 7 + frame * 2) % 4); rect(x, 4 + i * 1.3 | 0, 31 - ln, 2, ln, '#5a70a8'); }
  // капюшон и лицо
  disc(x, 12, 9, 6, '#6a80b8'); rect(x, 7, 6, 10, 2, '#9ab0e0');
  rect(x, 8, 8, 8, 6, '#10142a'); rect(x, 9, 10, 2, 2, '#9afff0'); rect(x, 13, 10, 2, 2, '#9afff0'); rect(x, 11, 13, 2, 1, '#9afff0');
  // руки
  rect(x, 3, 16 + wob, 3, 6, '#7a90c8'); rect(x, 18, 16 - wob, 3, 6, '#7a90c8'); rect(x, 2, 22 + wob, 2, 3, '#b8ccf4'); rect(x, 20, 22 - wob, 2, 3, '#b8ccf4');
  const o = outline(c, '#20284a');
  return o;
}

function spitter(frame) {
  const [c, x] = mk(26, 24);
  shadow(x, 13, 22, 9, 2, 0.3);
  const sq = frame ? 1 : 0;
  ellipse(x, 13, 15, 8, 7 - sq, '#3a2a58'); ellipse(x, 12, 14, 6, 5, '#54407a');
  // щупальца
  for (let i = 0; i < 5; i++) { const sx = 5 + i * 4; rect(x, sx, 19 + (i % 2), 2, 3 + (i + frame) % 2, '#2e2048'); }
  // пасть
  rect(x, 9, 12, 8, 5, '#14081e'); rect(x, 10, 13, 6, 3, '#6aff7a'); rect(x, 11, 14, 4, 1, '#c8ffd0');
  for (const i of [9, 12, 15]) rect(x, i, 12, 1, 2, '#e8e0f0');
  // глаза
  disc(x, 8, 9, 2, '#f0f8a0'); disc(x, 18, 9, 2, '#f0f8a0'); dot(x, 8, 9, '#1a0a20'); dot(x, 18, 9, '#1a0a20');
  rect(x, 12, 5, 2, 4, '#7a5ab0'); disc(x, 13, 4, 2, '#9aff7a');
  return outline(c, OUT);
}

// ---------------------------------------------------------------- боссы (одна «передняя» проекция + зеркало)
function bossChief(frame, pose) {
  const [c, x] = mk(48, 54);
  const skin = '#6a9a4a', skinD = '#4a7432', skinL = '#8ac05a';
  const bob = frame === 1 ? -1 : 0;
  shadow(x, 24, 51, 16, 3, 0.35);
  // ноги
  rect(x, 12, 36, 9, 14 - (frame === 1 ? 1 : 0), skinD); rect(x, 27, 36, 9, 14 - (frame === 3 ? 1 : 0), skinD);
  rect(x, 10, 48, 12, 4, '#3a2a1c'); rect(x, 26, 48, 12, 4, '#3a2a1c');
  // туловище
  rrect(x, 8, 16 + bob, 32, 24, skin); rect(x, 8, 16 + bob, 6, 24, skinL); rect(x, 34, 16 + bob, 6, 24, skinD);
  // меховая броня
  rect(x, 8, 28 + bob, 32, 6, '#6a4a2a'); for (let i = 8; i < 40; i += 4) rect(x, i, 33 + bob, 2, 3, '#6a4a2a');
  rect(x, 8, 28 + bob, 32, 1, '#9a6a3c');
  rect(x, 6, 14 + bob, 10, 7, '#5a4a3a'); rect(x, 32, 14 + bob, 10, 7, '#5a4a3a'); rect(x, 6, 14 + bob, 10, 1, '#8a7a6a');
  // осколок-талисман на груди (светится)
  disc(x, 24, 24 + bob, 3, '#ff8a30'); disc(x, 24, 24 + bob, 1, '#fff0a0'); line(x, 20, 18 + bob, 24, 22 + bob, '#3a2a1c'); line(x, 28, 18 + bob, 24, 22 + bob, '#3a2a1c');
  // голова
  rrect(x, 15, 3 + bob, 18, 14, skin); rect(x, 15, 3 + bob, 18, 2, skinL); rect(x, 28, 3 + bob, 5, 14, skinD);
  rect(x, 12, 6 + bob, 4, 5, skin); rect(x, 32, 6 + bob, 4, 5, skin); rect(x, 10, 5 + bob, 3, 3, skin); rect(x, 35, 5 + bob, 3, 3, skin);
  rect(x, 18, 8 + bob, 4, 3, '#1a1420'); rect(x, 27, 8 + bob, 4, 3, '#1a1420'); rect(x, 19, 9 + bob, 2, 2, '#ff3a3a'); rect(x, 28, 9 + bob, 2, 2, '#ff3a3a');
  rect(x, 18, 6 + bob, 5, 1, '#3a2a1c'); rect(x, 27, 6 + bob, 5, 1, '#3a2a1c');
  rect(x, 18, 13 + bob, 12, 3, '#2a1a14'); rect(x, 19, 11 + bob, 2, 3, '#f0ecd8'); rect(x, 28, 11 + bob, 2, 3, '#f0ecd8');
  // боевая раскраска
  rect(x, 16, 10 + bob, 2, 4, '#c83a3a'); rect(x, 31, 10 + bob, 2, 4, '#c83a3a');
  // руки
  const raise = pose === 'wind' ? -12 : 0;
  rect(x, 2, 18 + bob, 7, 16, skin); rect(x, 2, 18 + bob, 2, 16, skinL); rect(x, 1, 32 + bob, 8, 5, skinD);
  rect(x, 39, 16 + bob + raise, 7, 16, skin); rect(x, 44, 16 + bob + raise, 2, 16, skinD); rect(x, 39, 30 + bob + raise, 8, 5, skinD);
  // дубина
  const cx = 43, cy = 14 + bob + raise;
  rect(x, cx - 1, cy - 14, 4, 26, '#6a4a2a'); rect(x, cx - 4, cy - 26, 10, 14, '#7a5232'); rect(x, cx - 4, cy - 26, 10, 2, '#b07a44'); rect(x, cx + 4, cy - 26, 2, 14, '#4a3220');
  for (const [sx, sy] of [[-3, -24], [4, -20], [-3, -16], [3, -14]]) rect(x, cx + sx, cy + sy, 2, 2, '#c8c8d0');
  return outline(c, OUT);
}

function bossKing(frame, pose) {
  const [c, x] = mk(52, 64);
  const bone = '#d8d0bc', boneD = '#a8a08c', boneL = '#f0ecd8';
  const bob = frame === 1 ? -1 : 0;
  shadow(x, 26, 61, 17, 3, 0.4);
  // плащ
  rect(x, 8, 18 + bob, 36, 40, '#4a2a6a'); for (let r = 0; r < 40; r += 1) { rect(x, 8, 18 + r + bob, 3, 1, '#5e3a82'); rect(x, 41, 18 + r + bob, 3, 1, '#2e1844'); }
  for (let i = 0; i < 8; i++) rect(x, 8 + i * 4.5 | 0, 56 + bob, 4, 2 + (i * 5) % 4, '#4a2a6a');
  // ноги в доспехе
  rect(x, 16, 40, 8, 17, '#54546c'); rect(x, 28, 40, 8, 17, '#54546c'); rect(x, 16, 40, 2, 17, '#8a8aa8'); rect(x, 28, 40, 2, 17, '#8a8aa8');
  rect(x, 14, 56, 11, 5, '#3a3a50'); rect(x, 27, 56, 11, 5, '#3a3a50');
  // грудная клетка с доспехом
  rect(x, 14, 18 + bob, 24, 22, '#54546c'); rect(x, 14, 18 + bob, 24, 3, '#8a8aa8'); rect(x, 14, 18 + bob, 3, 22, '#7a7a98'); rect(x, 35, 18 + bob, 3, 22, '#3a3a50');
  for (let j = 24; j < 38; j += 3) rect(x, 18, j + bob, 16, 1, bone);
  rect(x, 25, 20 + bob, 2, 18, boneD);
  rect(x, 8, 14 + bob, 12, 8, '#8a8aa8'); rect(x, 32, 14 + bob, 12, 8, '#8a8aa8'); rect(x, 8, 14 + bob, 12, 2, '#b8b8d0'); rect(x, 32, 14 + bob, 12, 2, '#b8b8d0');
  rect(x, 22, 28 + bob, 8, 8, '#6a3a9a'); disc(x, 26, 32 + bob, 3, '#a8e8ff'); disc(x, 26, 32 + bob, 1, '#ffffff');
  // череп
  rrect(x, 17, 2 + bob, 18, 15, bone); rect(x, 17, 2 + bob, 18, 2, boneL); rect(x, 30, 2 + bob, 5, 15, boneD);
  rect(x, 20, 8 + bob, 5, 5, '#10101a'); rect(x, 28, 8 + bob, 5, 5, '#10101a'); rect(x, 21, 9 + bob, 3, 3, '#58d8ff'); rect(x, 29, 9 + bob, 3, 3, '#58d8ff'); dot(x, 22, 10 + bob, '#ffffff'); dot(x, 30, 10 + bob, '#ffffff');
  rect(x, 25, 12 + bob, 2, 2, '#10101a'); rect(x, 20, 15 + bob, 12, 3, '#10101a'); for (let i = 20; i < 32; i += 2) rect(x, i, 15 + bob, 1, 3, bone);
  // корона
  rect(x, 16, -1 + bob, 20, 5, '#e8c050'); for (const i of [16, 21, 26, 31]) rect(x, i, -4 + bob, 4, 4, '#e8c050'); rect(x, 16, 3 + bob, 20, 1, '#a08020'); dot(x, 26, 1 + bob, '#c83a3a'); dot(x, 20, 1 + bob, '#3a8ac8'); dot(x, 32, 1 + bob, '#3a8ac8');
  // руки и меч
  const raise = pose === 'wind' ? -16 : 0;
  rect(x, 4, 22 + bob, 5, 18, bone); rect(x, 3, 38 + bob, 7, 5, boneD);
  rect(x, 43, 20 + bob + raise, 5, 18, bone); rect(x, 42, 36 + bob + raise, 7, 5, boneD);
  const sx = 45, sy = 34 + bob + raise;
  rect(x, sx - 1, sy - 30, 4, 34, '#c8d8f0'); rect(x, sx - 1, sy - 30, 1, 34, '#f0f8ff'); rect(x, sx, sy - 32, 2, 3, '#e8f0ff');
  rect(x, sx - 5, sy + 3, 12, 3, '#e8c050'); rect(x, sx - 1, sy + 6, 4, 6, '#5a3a22'); disc(x, sx + 1, sy + 13, 2, '#e8c050');
  rect(x, sx, sy - 24, 2, 20, '#58d8ff');
  return outline(c, OUT);
}

function bossLord(frame, pose) {
  const [c, x] = mk(64, 76);
  const bob = frame === 1 ? -2 : 0;
  // тёмная аура
  for (let r = 0; r < 4; r++) { ellipse(x, 32, 70, 22 - r * 2, 3, `rgba(90,30,140,${0.12 + r * 0.04})`); }
  // плащ: колышущийся
  for (let r = 0; r < 52; r++) {
    const half = Math.round(10 + r * 0.42 + Math.sin(r * 0.25 + frame * 1.4) * 2);
    rect(x, 32 - half, 18 + r + bob, half * 2, 1, r % 6 === 0 ? '#3e1a6a' : '#2a0e4a');
    rect(x, 32 - half, 18 + r + bob, 3, 1, '#5a2a96'); rect(x, 32 + half - 3, 18 + r + bob, 3, 1, '#18082e');
  }
  for (let i = 0; i < 12; i++) rect(x, 8 + i * 4.2 | 0, 66 + bob, 3, 3 + ((i * 7 + frame * 3) % 5), '#2a0e4a');
  // тело
  rect(x, 20, 20 + bob, 24, 30, '#1a0c2e'); rect(x, 20, 20 + bob, 3, 30, '#3a1e64');
  // нагрудник со светящимся ядром
  rect(x, 22, 24 + bob, 20, 14, '#2e2048'); rect(x, 22, 24 + bob, 20, 2, '#5a4488');
  disc(x, 32, 31 + bob, 6, '#6a1ab0'); disc(x, 32, 31 + bob, 4, '#b060ff'); disc(x, 32, 31 + bob, 2, '#f0d8ff');
  for (const [dx, dy] of [[-8, -4], [8, -4], [-6, 6], [6, 6]]) line(x, 32, 31 + bob, 32 + dx, 31 + bob + dy, '#a060e0');
  // наплечники с шипами
  rect(x, 8, 16 + bob, 16, 10, '#3a2a58'); rect(x, 40, 16 + bob, 16, 10, '#3a2a58'); rect(x, 8, 16 + bob, 16, 2, '#6a54a0'); rect(x, 40, 16 + bob, 16, 2, '#6a54a0');
  for (const sxx of [10, 15, 20, 42, 47, 52]) { rect(x, sxx, 11 + bob, 2, 6, '#8a6ad0'); dot(x, sxx, 10 + bob, '#c8b0ff'); }
  // голова с рогами
  rrect(x, 23, 2 + bob, 18, 17, '#1e1430'); rect(x, 23, 2 + bob, 18, 2, '#46346a');
  rect(x, 20, 0 + bob, 3, 8, '#d8d0c0'); rect(x, 41, 0 + bob, 3, 8, '#d8d0c0'); rect(x, 17, -4 + bob, 3, 6, '#d8d0c0'); rect(x, 44, -4 + bob, 3, 6, '#d8d0c0'); dot(x, 16, -6 + bob, '#d8d0c0'); dot(x, 47, -6 + bob, '#d8d0c0');
  rect(x, 26, 8 + bob, 5, 3, '#ff3a8a'); rect(x, 34, 8 + bob, 5, 3, '#ff3a8a'); dot(x, 27, 9 + bob, '#ffffff'); dot(x, 35, 9 + bob, '#ffffff');
  rect(x, 27, 15 + bob, 10, 2, '#a060e0'); for (let i = 27; i < 37; i += 2) rect(x, i, 14 + bob, 1, 2, '#e8d8ff');
  // руки
  const raise = pose === 'wind' ? -18 : 0;
  rect(x, 4, 24 + bob + raise, 7, 20, '#2a1a42'); rect(x, 53, 24 + bob + raise, 7, 20, '#2a1a42');
  for (const hx of [3, 53]) { rect(x, hx, 42 + bob + raise, 8, 6, '#46346a'); for (let i = 0; i < 4; i++) rect(x, hx + i * 2, 47 + bob + raise, 1, 4, '#c8b0ff'); }
  if (pose === 'wind') { disc(x, 7, 18 + bob, 4, '#b060ff'); disc(x, 57, 18 + bob, 4, '#b060ff'); disc(x, 7, 18 + bob, 2, '#f0d8ff'); disc(x, 57, 18 + bob, 2, '#f0d8ff'); }
  return outline(c, '#120820');
}

// ---------------------------------------------------------------- враги на основе человечка
const GOBLIN = { skin: '#78a84a', hairC: '#3a4a22', hair: 'bald', ears: true, top: ['#6a4a2a', '#4a3220', '#8a6a3a'], pants: ['#4a3a28', '#362a1c'], boots: '#2a2018', eye: '#ffe030', belt: '#3a2a1c', hat: null, legH: 5, torsoH: 8 };
const ENEMY_HUMAN = {
  goblin: { ...GOBLIN, hold: 'club' },
  goblinArcher: { ...GOBLIN, top: ['#4a6a3a', '#34502a', '#6a8a52'], hat: 'hood', hatCol: '#3e5a2e', hold: 'bow', eye: '#ffe030' },
  bandit: { skin: '#e0b088', hairC: '#2a2018', top: ['#6a3a3a', '#4a2828', '#8a5252'], pants: ['#3a3038', '#2a2228'], boots: '#2a2018', hat: 'hood', hatCol: '#4a3030', mask: '#2a1a1a', hold: 'dagger', belt: '#2a2018' },
  skeleton: { skin: '#d8d0bc', hairC: '#d8d0bc', hair: 'bald', skel: true, bone: ['#a8a08c', '#d8d0bc', '#f0ecd8'], pants: ['#6a5a48', '#4a3e30'], top: ['#d8d0bc', '#a8a08c', '#f0ecd8'], boots: '#a8a08c', glow: '#58d8ff', hold: 'bonesword', hat: null, legH: 6, torsoH: 9, sleeve: '#d8d0bc' },
  husk: { skin: '#6a5a8a', hairC: '#2a1a42', hair: 'bald', top: ['#3a2a58', '#261a40', '#5a4488'], pants: ['#241a38', '#18102a'], boots: '#14102a', hat: 'helm', hatCol: '#3a2a58', horns: true, pads: true, padCol: '#5a4488', glowEyes: '#ff3a8a', hold: 'sword', belt: '#8a6ad0', trim: '#8a6ad0' },
  captain: { skin: '#e0b088', hairC: '#6a2a1a', top: ['#7a2a2a', '#561c1c', '#a04444'], pants: ['#2a2430', '#1a161e'], boots: '#1a1418', hat: 'bandana', hatCol: '#c83a3a', eyepatch: true, scar: '#c07058', beard: '#6a2a1a', hold: 'dagger', belt: '#3a2a1c', cape: '#2a1018', pads: true, padCol: '#6a5a4a', mustache: null },
};
Object.assign(ENEMY_HUMAN, {
  echoMiner: { skin: '#8a9a7a', hairC: '#3a3a30', hair: 'bald', top: ['#5a5a48', '#42423a', '#78785e'], pants: ['#3a3630', '#2a2622'], boots: '#221e1a', hat: 'helm', hatCol: '#7a7248', glowEyes: '#c8e060', hold: 'pick', belt: '#2a2018', sleeve: '#8a9a7a' },
  echoVagrant: { skin: '#9a9a8a', hairC: '#4a4a40', hair: 'spiky', top: ['#6a6454', '#4e483c', '#8a846e'], pants: ['#4a4438', '#383228'], boots: '#2a2620', glowEyes: '#d8e868', hold: 'club', belt: '#3a3228' },
  thug: { skin: '#d8a078', hairC: '#2a2018', hair: 'bald', top: ['#5a4a3a', '#42362a', '#7a6a58'], pants: ['#3a3228', '#2a241c'], boots: '#221a14', hold: 'club', belt: '#2a2018', scar: '#b87858', pads: true, padCol: '#6a5a48' },
  hunter: { skin: '#e0b088', hairC: '#4a3a2a', top: ['#5a7a48', '#42602e', '#7a9a62'], pants: ['#4a4030', '#342c22'], boots: '#2a2018', hat: 'hood', hatCol: '#42602e', hold: 'bow', cape: '#42602e', belt: '#3a2a1c', beard: '#4a3a2a' },
  echoSoldier: { skin: '#8a8a9a', hairC: '#2a2a38', hair: 'bald', top: ['#6a6a7a', '#4e4e5c', '#8a8a9c'], pants: ['#3a3a48', '#2a2a36'], boots: '#22222c', hat: 'helm', hatCol: '#8a8a9c', pads: true, padCol: '#8a8a9c', glowEyes: '#a8c8ff', hold: 'sword', belt: '#3a3a48', tabard: '#5a4a6a' },
  echoArcher: { skin: '#8a8a9a', hairC: '#2a2a38', top: ['#5a5a6c', '#42424e', '#78788a'], pants: ['#3a3a48', '#2a2a36'], boots: '#22222c', hat: 'hood', hatCol: '#42424e', glowEyes: '#a8c8ff', hold: 'bow', cape: '#34343e' },
  echoBrute: { skin: '#7a8a7a', hairC: '#2a2a28', hair: 'bald', top: ['#5a5a50', '#42423a', '#78786a'], pants: ['#3a3a32', '#2a2a24'], boots: '#22221c', hat: 'helm', hatCol: '#6a6a5a', horns: true, pads: true, padCol: '#6a6a5a', glowEyes: '#e8e060', hold: 'club', belt: '#2a2a22' },
  sentinel: { skin: '#c8c4d0', hairC: '#e8e4f0', hair: 'bald', top: ['#a8a4b8', '#7e7a92', '#c8c4dc'], pants: ['#6a667e', '#4e4a60'], boots: '#3a3648', hat: 'helm', hatCol: '#c8c4dc', plume: '#6a8ad0', pads: true, padCol: '#c8c4dc', glowEyes: '#6a9aff', hold: 'spear', tabard: '#4a5a9a' },
  gladiator: { skin: '#c88858', hairC: '#2a1a10', top: ['#8a5a3a', '#6a4228', '#a87858'], pants: ['#5a4030', '#42302a'], boots: '#3a2818', hat: 'helm', hatCol: '#b8a068', plume: '#c83a3a', pads: true, padCol: '#b8a068', hold: 'sword', belt: '#5a3a22', sleeve: '#c88858' },
  smuggler: { skin: '#d8b090', hairC: '#2a2a3a', top: ['#3a4a5a', '#2a3644', '#566a7e'], pants: ['#2a2a38', '#1e1e2a'], boots: '#1a1a22', hat: 'bandana', hatCol: '#3a6a7a', mask: '#1a1a24', hold: 'dagger', belt: '#2a2018', cape: '#1e2a38' },
});
const humanEnemyCache = new Map();
export function enemyHumanSet(type) {
  if (humanEnemyCache.has(type)) return humanEnemyCache.get(type);
  const s = humanSet(ENEMY_HUMAN[type]);
  humanEnemyCache.set(type, s);
  return s;
}

// перекраска и масштаб готового спрайта (для look.tint / look.scale), с кешем
const xfCache = new WeakMap();
export function transformSprite(cv, tint, scale) {
  if (!tint && (!scale || scale === 1)) return cv;
  const key = `${tint || ''}|${scale || 1}`;
  let m = xfCache.get(cv);
  if (!m) { m = new Map(); xfCache.set(cv, m); }
  if (m.has(key)) return m.get(key);
  const sc = scale || 1;
  const [o, x] = mk(Math.round(cv.width * sc), Math.round(cv.height * sc));
  x.imageSmoothingEnabled = false;
  x.drawImage(cv, 0, 0, o.width, o.height);
  if (tint) { x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.45; x.fillStyle = tint; x.fillRect(0, 0, o.width, o.height); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  m.set(key, o);
  return o;
}

// ---------------------------------------------------------------- реестр
const reg = {};
export function creatureFrames(type) {
  if (reg[type]) return reg[type];
  let r;
  switch (type) {
    case 'slime': r = { frames: [slime(0, '#6ccf5a'), slime(1, '#6ccf5a')], wind: slime(0, '#6ccf5a', true), w: 20, h: 16, base: 15 }; break;
    case 'wolf': r = { frames: [wolf(0), wolf(1), wolf(0), wolf(2)], wind: wolf(0, true), w: 30, h: 20, base: 19 }; break;
    case 'spider': r = { frames: [spider(0), spider(1)], wind: spider(0), w: 26, h: 18, base: 17 }; break;
    case 'bat': r = { frames: [bat(0), bat(1)], wind: bat(1), w: 26, h: 16, base: 13, fly: 18 }; break;
    case 'wraith': r = { frames: [wraith(0), wraith(1)], wind: wraith(1), w: 24, h: 32, base: 30, fly: 6 }; break;
    case 'spitter': r = { frames: [spitter(0), spitter(1)], wind: spitter(1), w: 26, h: 24, base: 23 }; break;
    case 'chieftain': r = { frames: [bossChief(0), bossChief(1), bossChief(0), bossChief(3)], wind: bossChief(0, 'wind'), w: 48, h: 54, base: 52 }; break;
    case 'king': r = { frames: [bossKing(0), bossKing(1), bossKing(0), bossKing(3)], wind: bossKing(0, 'wind'), w: 52, h: 64, base: 61 }; break;
    case 'lord': r = { frames: [bossLord(0), bossLord(1)], wind: bossLord(0, 'wind'), w: 64, h: 76, base: 70, fly: 8 }; break;
    default: r = null;
  }
  reg[type] = r;
  return r;
}

// ---------------------------------------------------------------- иконки предметов (16x16)
const TIER_COL = ['#9a8a78', '#b8bcc8', '#d8dce8', '#8ad0ff', '#ffb030'];
export function itemIcon(it) {
  const [c, x] = mk(16, 16);
  const t = Math.min(5, it.tier || 1);
  const tc = TIER_COL[t - 1];
  switch (it.type) {
    case 'weapon':
      if (it.cls === 'warrior') { line(x, 3, 13, 12, 4, tc); line(x, 4, 13, 13, 4, shade(tc, 0.3)); rect(x, 2, 11, 4, 2, '#8a6a30'); rect(x, 1, 13, 2, 2, '#5a3a22'); }
      else if (it.cls === 'mage') { line(x, 3, 14, 11, 5, '#8a5a30'); disc(x, 12, 4, 2, t >= 5 ? '#ff7a30' : t >= 4 ? '#7ae0ff' : '#a888ff'); dot(x, 11, 3, '#fff'); }
      else { line(x, 4, 12, 11, 5, tc); line(x, 5, 12, 12, 5, shade(tc, 0.3)); rect(x, 2, 11, 4, 1, '#8a6a30'); rect(x, 2, 13, 2, 2, '#3a2a1c'); }
      break;
    case 'armor':
      if (it.cls === 'mage') { rect(x, 4, 2, 8, 12, tc === '#9a8a78' ? '#4a5a9a' : tc); rect(x, 3, 12, 10, 2, shade(tc, -0.2)); rect(x, 7, 2, 2, 12, '#e8c050'); }
      else if (it.cls === 'rogue') { rect(x, 4, 3, 8, 10, '#4a4a58'); rect(x, 2, 3, 3, 6, '#3a3a48'); rect(x, 11, 3, 3, 6, '#3a3a48'); rect(x, 6, 2, 4, 2, '#2a2a36'); rect(x, 7, 6, 2, 7, tc); }
      else { rect(x, 4, 3, 8, 10, tc); rect(x, 2, 3, 3, 4, shade(tc, 0.2)); rect(x, 11, 3, 3, 4, shade(tc, 0.2)); rect(x, 6, 2, 4, 2, shade(tc, -0.2)); rect(x, 7, 5, 2, 8, '#b83a32'); }
      rect(x, 4, 3, 1, 10, 'rgba(255,255,255,0.35)');
      break;
    case 'charm':
      line(x, 4, 2, 8, 8, '#c8a850'); line(x, 12, 2, 8, 8, '#c8a850'); disc(x, 8, 10, 3, tc); disc(x, 8, 10, 1, '#fff'); dot(x, 7, 9, '#fff');
      break;
    case 'potion':
      rect(x, 6, 2, 4, 3, '#d8d0c0'); rect(x, 5, 5, 6, 8, it.heal ? '#e04a5a' : '#4a8ae0'); rect(x, 4, 7, 8, 6, it.heal ? '#e04a5a' : '#4a8ae0'); rect(x, 5, 12, 6, 1, it.heal ? '#a02a3a' : '#2a5aa0'); rect(x, 5, 7, 1, 4, 'rgba(255,255,255,0.5)');
      if ((it.heal || it.mana) > 80) { rect(x, 5, 4, 6, 1, '#ffd860'); }
      break;
    default:
      if (it.id === 'q_key') { disc(x, 5, 5, 3, '#c8a850'); disc(x, 5, 5, 1, '#0000'); rect(x, 7, 7, 2, 7, '#c8a850'); rect(x, 9, 11, 3, 1, '#c8a850'); rect(x, 9, 13, 2, 1, '#c8a850'); dot(x, 4, 4, '#fff6c0'); }
      else if (it.id === 'q_shard1' || it.id === 'q_shard2') { disc(x, 8, 8, 5, '#ff8a30'); disc(x, 8, 8, 3, '#ffc860'); disc(x, 8, 8, 1, '#fff6c0'); }
      else if (it.id === 'q_flower') { rect(x, 7, 8, 1, 6, '#4a8a3a'); disc(x, 8, 6, 3, '#7ad0ff'); disc(x, 8, 6, 1, '#ffffff'); }
      else if (it.id === 'q_pelt') { rrect(x, 2, 4, 12, 9, '#7a7a86'); rect(x, 3, 5, 10, 2, '#a0a0ac'); rect(x, 2, 12, 3, 2, '#54545e'); rect(x, 11, 12, 3, 2, '#54545e'); }
      else if (it.id === 'q_silk') { disc(x, 8, 8, 5, '#e8e8f0'); for (let i = -4; i <= 4; i += 2) line(x, 8, 8, 8 + i, 3, '#b8b8c8'); disc(x, 8, 8, 2, '#c8c8d8'); }
      else if (it.id === 'q_page') { rect(x, 4, 2, 9, 12, '#e8dcb8'); rect(x, 4, 2, 9, 1, '#fff6d8'); for (let j = 4; j < 12; j += 2) rect(x, 5, j, 7, 1, '#8a7a5a'); }
      else if (it.id === 'q_amulet') { line(x, 4, 2, 8, 8, '#c8a850'); line(x, 12, 2, 8, 8, '#c8a850'); disc(x, 8, 10, 3, '#58c8a8'); dot(x, 7, 9, '#fff'); }
      else { rect(x, 4, 4, 8, 8, '#a0a0b0'); }
  }
  return outline(c, OUT);
}
export function coinIcon() {
  const [c, x] = mk(8, 8);
  disc(x, 4, 4, 3, '#e8b830'); disc(x, 4, 4, 2, '#ffd860'); dot(x, 3, 3, '#fff6c0'); rect(x, 4, 3, 1, 3, '#c89818');
  return outline(c, OUT);
}
export const NPC_LOOK_IDS = Object.keys(NPC_LOOKS);
