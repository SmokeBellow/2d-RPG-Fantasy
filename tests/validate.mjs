// Статические проверки данных без браузера:
//   node tests/validate.mjs          — карты, квесты, предметы, враги
// Каждая ошибка печатается, код выхода 1, если что-то не так.
import { getMap, solidGrid, AREA_IDS, PROP_DEF } from '../js/maps.js';
import { T, TILEDEF, ENEMIES, ITEMS, CLASSES, SHOPS, AREAS } from '../js/defs.js';
import { QUESTS, NPCS, QUEST_ORDER } from '../js/quests.js';
import { resolveItem, newState } from '../js/state.js';
import { World } from '../js/world.js';

let failed = 0;
const fail = (msg) => { failed++; console.log('  ✗ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);

// ---------------------------------------------------------------- карты
for (const id of AREA_IDS) {
  const m = getMap(id);
  console.log(`Карта «${id}» ${m.w}x${m.h}`);
  const sol = solidGrid(m);
  const lava = (x, y) => TILEDEF[m.tiles[y * m.w + x]].lava;
  const walk = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !sol[y * m.w + x] && !lava(x, y);
  // заливка с учётом закрытых дверей: двери считаем проходимыми (их открывают рычаги)
  const doorCells = new Set();
  for (const d of m.doors) for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) doorCells.add((d.y + j) * m.w + d.x + i);
  const free = (x, y) => walk(x, y) || (x >= 0 && y >= 0 && x < m.w && y < m.h && doorCells.has(y * m.w + x));
  const start = [Math.floor(m.spawn.x), Math.floor(m.spawn.y)];
  if (!free(...start)) fail(`спавн ${start} в стене`);
  const seen = new Uint8Array(m.w * m.h);
  const q = [start]; seen[start[1] * m.w + start[0]] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (free(nx, ny) && !seen[ny * m.w + nx]) { seen[ny * m.w + nx] = 1; q.push([nx, ny]); }
    }
  }
  const reach = (x, y) => seen[Math.floor(y) * m.w + Math.floor(x)];
  // объект достижим, если достижима какая-либо соседняя клетка
  const reachNear = (x, y, w = 1, h = 1) => {
    for (let j = Math.floor(y) - 1; j <= Math.floor(y) + h; j++) for (let i = Math.floor(x) - 1; i <= Math.floor(x) + w; i++) if (reach(i, j)) return true;
    return false;
  };
  for (const n of m.npcs) { if (!NPCS[n.id]) fail(`NPC ${n.id} не описан`); if (!reachNear(n.x, n.y)) fail(`NPC ${n.id} недостижим (${n.x},${n.y})`); }
  for (const e of m.enemies) {
    if (!ENEMIES[e.type]) fail(`враг ${e.type} не описан`);
    if (!walk(Math.floor(e.x), Math.floor(e.y))) fail(`враг ${e.type} в стене (${e.x},${e.y})`);
    else if (!reach(e.x, e.y)) fail(`враг ${e.type} недостижим (${e.x},${e.y})`);
  }
  for (const c of m.chests) {
    if (!reachNear(c.x, c.y)) fail(`сундук ${c.id} недостижим`);
    for (const [it] of c.loot) if (it !== 'gold' && !ITEMS[resolveItem(it, 'warrior')]) fail(`сундук ${c.id}: неизвестный предмет ${it}`);
  }
  for (const n of m.nodes) if (!reachNear(n.x, n.y)) fail(`узел ${n.id} недостижим`);
  for (const p of m.props) if (p.use && !reachNear(p.x, p.y, p.w, p.h)) fail(`объект ${p.k} (${p.x},${p.y}) недостижим`);
  for (const p of m.props) if (!PROP_DEF[p.k]) fail(`неизвестный объект ${p.k}`);
  for (const pt of m.portals) {
    if (!reachNear(pt.x, pt.y, pt.w, pt.h)) fail(`портал ${pt.id} недостижим`);
    const dest = getMap(pt.to);
    const ax = Math.floor(pt.arrive.x), ay = Math.floor(pt.arrive.y);
    const ds = solidGrid(dest);
    if (ds[ay * dest.w + ax]) fail(`портал ${pt.id}: точка прибытия в стене (${pt.arrive.x},${pt.arrive.y}) области ${pt.to}`);
  }
  for (const z of m.zones) if (!reachNear(z.x, z.y, z.w, z.h)) fail(`зона ${z.id} недостижима`);
  // NPC и враги не должны стоять друг на друге / на объектах
  for (const n of m.npcs) if (sol[Math.floor(n.y) * m.w + Math.floor(n.x)]) fail(`NPC ${n.id} стоит на препятствии`);
  if (!failed) ok('все объекты достижимы');
}

// ---------------------------------------------------------------- квесты
console.log('Квесты');
const itemSet = new Set(Object.keys(ITEMS));
for (const id of QUEST_ORDER) {
  const q = QUESTS[id];
  if (!NPCS[q.giver]) fail(`${id}: нет NPC-выдающего ${q.giver}`);
  if (!NPCS[q.turnIn]) fail(`${id}: нет NPC-принимающего ${q.turnIn}`);
  for (const p of q.prereq) if (!QUESTS[p]) fail(`${id}: нет предпосылки ${p}`);
  for (const a of q.auto || []) if (!QUESTS[a]) fail(`${id}: auto → нет квеста ${a}`);
  for (const o of q.obj) {
    if (o.type === 'item' && !itemSet.has(o.item)) fail(`${id}: нет предмета ${o.item}`);
    if (o.type === 'kill' && !ENEMIES[o.what]) fail(`${id}: нет врага ${o.what}`);
  }
  for (const [it] of q.reward.items || []) for (const cls of Object.keys(CLASSES)) if (!itemSet.has(resolveItem(it, cls))) fail(`${id}: награда ${it} не существует для ${cls}`);
  if (!q.autoStart && !q.prereq.length && !QUESTS[id].giver) fail(`${id}: некому выдавать`);
}
// каждый предмет-цель квеста должен откуда-то появляться
const sources = new Set();
for (const id of AREA_IDS) {
  const m = getMap(id);
  for (const n of m.nodes) sources.add(n.item);
  for (const c of m.chests) for (const [it] of c.loot) sources.add(it);
  for (const p of m.props) if (p.use === 'page') sources.add('q_page');
}
for (const e of Object.values(ENEMIES)) for (const [it] of e.drops || []) sources.add(it);
for (const id of QUEST_ORDER) for (const o of QUESTS[id].obj) if (o.type === 'item' && !sources.has(o.item)) fail(`${id}: предмет ${o.item} нигде не добывается`);
// достаточно ли источников для квестов на сбор
const countSrc = (it) => {
  let n = 0;
  for (const id of AREA_IDS) { const m = getMap(id); for (const nd of m.nodes) if (nd.item === it) n++; }
  return n;
};
if (countSrc('q_flower') < QUESTS.s1.obj[0].n) fail(`цветов (${countSrc('q_flower')}) меньше, чем нужно для s1`);
const wolves = getMap('forest').enemies.filter((e) => e.type === 'wolf').length;
if (wolves < 8) fail(`волков (${wolves}) мало для s2`);
const spiders = getMap('forest').enemies.filter((e) => e.type === 'spider').length;
if (spiders < 4) fail(`пауков (${spiders}) мало для s5`);
if (getMap('crypt').props.filter((p) => p.use === 'page').length < 3) fail('страниц меньше трёх');
if (!failed) ok('цепочки и источники предметов в порядке');

// ---------------------------------------------------------------- предметы и магазины
console.log('Предметы и магазины');
for (const cls of Object.keys(CLASSES)) {
  const c = CLASSES[cls];
  if (!ITEMS[c.startWeapon] || !ITEMS[c.startArmor]) fail(`${cls}: нет стартового снаряжения`);
  const w = new World(newState(cls));
  for (const sh of Object.keys(SHOPS)) if (!w.shopStock(sh).length) fail(`${cls}: пустой магазин ${sh}`);
  for (let t = 1; t <= 5; t++) if (!ITEMS[`w_${{ warrior: 'war', mage: 'mag', rogue: 'rog' }[cls]}${t}`]) fail(`${cls}: нет оружия tier ${t}`);
  for (let t = 1; t <= 4; t++) if (!ITEMS[`a_${{ warrior: 'war', mage: 'mag', rogue: 'rog' }[cls]}${t}`]) fail(`${cls}: нет брони tier ${t}`);
}
for (const [id, it] of Object.entries(ITEMS)) { if (it.id !== id) fail(`предмет ${id}: id не совпадает`); if (!it.name) fail(`предмет ${id}: нет имени`); }
for (const [id, e] of Object.entries(ENEMIES)) for (const [it] of e.drops || []) if (!ITEMS[it]) fail(`враг ${id}: дроп ${it} не существует`);
for (const id of Object.keys(AREAS)) if (!AREA_IDS.includes(id)) fail(`область ${id} без карты`);
if (!failed) ok('предметы, магазины и враги в порядке');

console.log(failed ? `\nОшибок: ${failed}` : '\nВсе проверки пройдены');
process.exit(failed ? 1 : 0);
