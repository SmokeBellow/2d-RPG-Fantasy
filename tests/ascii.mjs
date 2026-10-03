// Рисует карту областей текстом:  node tests/ascii.mjs forest
import { getMap, solidGrid } from '../js/maps.js';
import { T } from '../js/defs.js';

const id = process.argv[2] || 'village';
const m = getMap(id);
const sol = solidGrid(m);
const ch = { [T.GRASS]: '.', [T.DIRT]: ',', [T.PLAZA]: '_', [T.WATER]: '~', [T.DEEP]: '≈', [T.SAND]: ':', [T.WOOD]: '=', [T.WALL]: '#', [T.ROCK]: 'o', [T.CRYPT]: '.', [T.CWALL]: '#', [T.LAVA]: 'L', [T.SWAMP]: 's', [T.BRIDGE]: 'H', [T.BLIGHT]: '.', [T.BWALL]: '#', [T.TREE]: 'T' };
const rows = [];
for (let y = 0; y < m.h; y++) {
  let s = '';
  for (let x = 0; x < m.w; x++) s += sol[y * m.w + x] && m.tiles[y * m.w + x] !== T.TREE && !(m.tiles[y * m.w + x] === T.WATER || m.tiles[y * m.w + x] === T.DEEP || m.tiles[y * m.w + x] === T.CWALL || m.tiles[y * m.w + x] === T.BWALL) ? 'X' : ch[m.tiles[y * m.w + x]];
  rows.push(s.split(''));
}
const put = (x, y, c) => { const r = rows[Math.floor(y)]; if (r) r[Math.floor(x)] = c; };
for (const n of m.npcs) put(n.x, n.y, 'N');
for (const e of m.enemies) put(e.x, e.y, e.unique ? 'B' : 'e');
for (const c of m.chests) put(c.x, c.y, '$');
for (const n of m.nodes) put(n.x, n.y, '*');
for (const p of m.portals) for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) put(p.x + i, p.y + j, 'P');
put(m.spawn.x, m.spawn.y, '@');
console.log(rows.map((r) => r.join('')).join('\n'));
