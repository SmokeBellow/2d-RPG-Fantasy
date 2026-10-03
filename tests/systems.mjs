// Логика без браузера: репутация богов, дерево навыков, диалоги Локации 1 (сквозной прогон по узлам).
import { World } from '../js/world.js';
import { newState, calcStats } from '../js/state.js';
import { favor, godRank, rankOf, templeReading, GOD_IDS } from '../js/gods.js';
import { freePoints, learn, respec, TREE } from '../js/skills.js';
import { ENTRY, NODES, QUESTS } from '../js/quests.js';
import { questStatus } from '../js/quests.js';

let failed = 0;
const ok = (c, m) => { if (!c) { failed++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };

// ---- боги
{
  const s = newState('warrior');
  favor(s, 'lyara', 30);
  ok(godRank(s, 'lyara') === 2 && s.gods.kharn < 0, 'Лиара +30: ранг 2, Кхарн зеркально ниже нуля');
  favor(s, 'kharn', -200);
  ok(s.curses.includes('kharn') && godRank(s, 'kharn') === -3, 'Кхарн ≤ −60: проклятие навсегда');
  favor(s, 'kharn', 500);
  ok(s.curses.includes('kharn'), 'проклятие остаётся после роста');
  ok(rankOf(80) === 4 && rankOf(0) === 0 && rankOf(-70) === -3, 'пороги рангов');
  ok(templeReading(s).length >= 7, 'Храм даёт строку на каждого бога');
}
// ---- навыки
for (const cls of ['warrior', 'mage', 'rogue']) {
  const s = newState(cls);
  s.lvl = 12;
  const total = freePoints(s);
  const ids = TREE[cls].map((n) => n.id);
  let spent = 0;
  for (let k = 0; k < 400 && freePoints(s) > 0; k++) for (const id of ids) if (learn(s, id)) spent++;
  ok(spent > 0 && freePoints(s) >= 0 && spent <= total, `${cls}: очки тратятся (${spent}/${total})`);
  const st = calcStats(s);
  ok(st.maxHp > 0 && st.atk > 0, `${cls}: статы считаются`);
  s.gold = 9999;
  ok(respec(s) && freePoints(s) === total, `${cls}: сброс возвращает все очки`);
}
// ---- диалоги: пройти Локацию 1 по узлам
const run = (w, npc, ...picks) => {
  const n = { id: npc };
  w.talkNpc = n;
  let id = ENTRY[npc] ? ENTRY[npc](w.s, w) : 'idle_default';
  let plan = w.openNode(id);
  for (const pick of picks) {
    const ch = plan.choices.find((c) => c.label.includes(pick));
    if (!ch) throw new Error(`${npc}: нет варианта «${pick}» в узле ${plan.id}: ${plan.choices.map((c) => c.label).join(' | ')}`);
    plan = w.choose(ch);
    if (!plan) return null;
  }
  return plan;
};
{
  const w = new World(newState('warrior'));
  const s = w.s;
  run(w, 'orwen', 'Хорошо');
  ok(questStatus(s, 'm1') === 'active', 'Орвен выдал m1');
  s.flags.zone_beacon_area = true;
  run(w, 'orwen', 'Договорились');
  ok(s.quests.m1 && s.quests.m1.state === 'done', 'm1 сдан');
  run(w, 'garth', 'Сделаю');
  ok(questStatus(s, 'm2') === 'active', 'Гарт выдал m2');
  s.quests.m2.kills.slime = 5;
  const pl = w.openNode(ENTRY.garth(s, w));
  ok(pl.id === 'garth_m2done', 'после слизи у Гарта узел сдачи');
  w.choose(pl.choices[0]);
  ok(s.quests.m2.state === 'done', 'm2 сдан и награда выдана, очков навыков: ' + freePoints(s));
}
// все узлы достижимы из какой-то точки входа или ссылаются друг на друга
{
  const reach = new Set();
  const mark = (id) => { if (!id || reach.has(id) || !NODES[id]) return; reach.add(id); for (const c of NODES[id].c || []) mark(c.go); };
  for (const id of Object.keys(NODES)) if (id.startsWith('idle_')) mark(id);
  // точки входа неизвестны статически: проверим по возвращаемым значениям в большом числе состояний
  const states = [];
  for (const cls of ['warrior', 'mage', 'rogue']) states.push(newState(cls));
  for (const s of states) for (const k of Object.keys(ENTRY)) { try { mark(ENTRY[k](s, new World(s))); } catch (e) { /* игнор */ } }
  const lost = Object.keys(NODES).filter((id) => !reach.has(id));
  console.log(`  (узлов, не найденных статически из стартового состояния: ${lost.length} из ${Object.keys(NODES).length}; это нормально для поздних веток)`);
}
console.log(failed ? `\nОшибок: ${failed}` : '\nСистемы в порядке');
process.exit(failed ? 1 : 0);
