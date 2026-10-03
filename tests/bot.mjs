// Бот проходит игру через настоящую логику мира (без браузера): квесты, бои, магазины, боссы.
//   node tests/bot.mjs [warrior|mage|rogue] [--seed N] [--quiet]
// Выводит хронологию, итоговое время и число смертей. Код выхода 1, если игра не пройдена.
import { World } from '../js/world.js';
import { newState, count, calcStats } from '../js/state.js';
import { solidGrid } from '../js/maps.js';
import { TILE, ITEMS, CLASSES, ENEMIES, TILEDEF, CFG } from '../js/defs.js';
import { QUESTS, planTalk, questStatus, isReady, objProgress, QUEST_ORDER } from '../js/quests.js';
import { mulberry32, dist, angleTo, angDiff } from '../js/util.js';

const args = process.argv.slice(2);
const cls = args.find((a) => CLASSES[a]) || 'warrior';
const seed = args.includes('--seed') ? +args[args.indexOf('--seed') + 1] : 7;
const quiet = args.includes('--quiet');
const rng = mulberry32(seed);
Math.random = rng;

const DT = 1 / 30;
const world = new World(newState(cls), rng);
const w = world;
let simT = 0, deaths = 0, done = false;
let bossT0 = null, bossMin = 1, bossName = '';
const log = (...a) => { if (!quiet) console.log(`[${String(Math.floor(simT / 60)).padStart(3)}м L${String(w.s.lvl).padStart(2)}]`, ...a); };
const inp = () => ({ mx: 0, my: 0, aimX: null, aimY: null, attack: false, skill: [false, false], dodge: false, potHp: false, potMp: false, interact: false });

class Stuck extends Error {}

// ---------------------------------------------------------------- события
const pendingTalk = [];
function pump() {
  for (const e of w.drain()) {
    if (e.t === 'talk') pendingTalk.push(e.plan);
    else if (e.t === 'transition') { w.travel(e.to, e.x, e.y); }
    else if (e.t === 'death') {
      deaths++;
      const near = w.enemies.filter((q) => q.alive && dist(q.x, q.y, w.p.x, w.p.y) < 120).map((q) => `${q.type}:${q.state}:${q.hp | 0}`).join(',');
      log('☠ смерть #' + deaths + ' в ' + w.area + ' рядом: ' + near + ' pos ' + (w.p.x / 16 | 0) + ',' + (w.p.y / 16 | 0));
    }
    else if (e.t === 'victory') done = true;
    else if (e.t === 'bossIntro') { bossT0 = simT; bossMin = 1; bossName = e.name; }
    else if (e.t === 'boss' && !e.e && bossT0 != null) { log(`  босс «${bossName}»: ${(simT - bossT0).toFixed(0)} с, минимум здоровья ${Math.round(bossMin * 100)}%`); bossT0 = null; }
    else if (e.t === 'levelup') log('★ уровень', e.lvl);
    else if (e.t === 'questDone') log('✔ квест выполнен:', QUESTS[e.id].title);
    else if (e.t === 'toast' && /Новое задание|Перековано|Маяк|Получено|повержен/.test(e.text)) log('·', e.text);
  }
}
function tick(i) {
  simT += DT;
  if (bossT0 != null) bossMin = Math.min(bossMin, w.s.hp / w.stats.maxHp);
  if (process.env.DEBUG3 && simT > 1441 && simT < 1442) console.log(`   f t=${simT.toFixed(2)} in=${JSON.stringify(i && { mx: +(i.mx || 0).toFixed(2), my: +(i.my || 0).toFixed(2), a: i.attack, d: i.dodge })} p=(${w.p.x | 0},${w.p.y | 0}) inv=${w.p.inv.toFixed(2)} act=${w.p.act && w.p.act.kind} dodge=${!!w.p.dodge} cdAtk=${w.p.cdAtk.toFixed(2)} gob=${w.enemies.filter((o) => o.alive && o.aggro && dist(o.x, o.y, w.p.x, w.p.y) < 40).map((o) => o.type + ':' + o.state + ':' + o.t.toFixed(2) + ':' + o.cd.toFixed(2) + ':' + (o.hp | 0)).join('|')}`);
  const input = i || inp();
  w.update(DT, input);
  pump();
  if (w.p.dead) {
    w.respawn(); pump();
    throw new Stuck('respawn');
  }
}

// ---------------------------------------------------------------- A*
class Heap {
  constructor() { this.a = []; }
  get length() { return this.a.length; }
  push(v) { const a = this.a; a.push(v); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
    return top;
  }
}
function findPath(sx, sy, tx, ty) {
  const W = w.W, H = w.H;
  const s0 = [Math.floor(sx / TILE), Math.floor(sy / TILE)], g0 = [Math.floor(tx / TILE), Math.floor(ty / TILE)];
  const blocked = (x, y) => x < 0 || y < 0 || x >= W || y >= H || w.solid[y * W + x] > 0;
  if (blocked(...g0)) {
    // ближайшая свободная клетка к цели
    let best = null, bd = 1e9;
    for (let j = g0[1] - 3; j <= g0[1] + 3; j++) for (let i = g0[0] - 3; i <= g0[0] + 3; i++) if (!blocked(i, j)) { const d = Math.hypot(i - g0[0], j - g0[1]); if (d < bd) { bd = d; best = [i, j]; } }
    if (!best) return null;
    g0[0] = best[0]; g0[1] = best[1];
  }
  const key = (x, y) => y * W + x;
  const open = new Heap(); open.push([0, s0[0], s0[1]]);
  const gs = new Map([[key(...s0), 0]]);
  const from = new Map();
  let it = 0;
  while (open.length && it++ < 60000) {
    const [, x, y] = open.pop();
    if (x === g0[0] && y === g0[1]) {
      const path = [[x, y]];
      let k = key(x, y);
      while (from.has(k)) { const p = from.get(k); path.push(p); k = key(...p); }
      return path.reverse().map(([px, py]) => [(px + 0.5) * TILE, (py + 0.5) * TILE]);
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (blocked(nx, ny)) continue;
      if (dx && dy && (blocked(x + dx, y) || blocked(x, y + dy))) continue;
      // не прижиматься к стенам: небольшой штраф
      let pen = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (blocked(nx + ax, ny + ay)) pen += 0.4;
      const ng = gs.get(key(x, y)) + (dx && dy ? 1.41 : 1) + pen;
      if (ng < (gs.get(key(nx, ny)) ?? 1e9)) { gs.set(key(nx, ny), ng); from.set(key(nx, ny), [x, y]); open.push([ng + Math.hypot(nx - g0[0], ny - g0[1]), nx, ny]); }
    }
  }
  return null;
}

// ---------------------------------------------------------------- тактика боя
const C = CLASSES[cls];
const RANGED = cls === 'mage';

function threats() {
  const p = w.p;
  let ax = 0, ay = 0, danger = false;
  for (const z of w.teles) {
    if (z.done) continue;
    const d = dist(z.x, z.y, p.x, p.y);
    const lead = z.dur - z.t;
    if (z.shape === 'circle' && d < z.r + 12 && lead < z.dur) { ax += (p.x - z.x) / (d + 1); ay += (p.y - z.y) / (d + 1); danger = true; }
    else if (z.shape === 'cone' && d < z.r + 6) {
      // уйти вбок от оси конуса
      const rel = angleTo(z.x, z.y, p.x, p.y) - z.ang;
      const side = Math.sin(rel) >= 0 ? 1 : -1;
      if (angDiff(angleTo(z.x, z.y, p.x, p.y), z.ang) < z.arc / 2 + 0.35) { ax += -Math.sin(z.ang) * side; ay += Math.cos(z.ang) * side; danger = true; }
    }
  }
  for (const q of w.projs) {
    if (q.from === 'p') continue;
    const d = dist(q.x, q.y, p.x, p.y);
    if (d < 46) {
      const ang = Math.atan2(q.vy, q.vx);
      const toP = angleTo(q.x, q.y, p.x, p.y);
      if (angDiff(ang, toP) < 0.5) { const side = Math.sin(toP - ang) >= 0 ? 1 : -1; ax += -Math.sin(ang) * side * 1.5; ay += Math.cos(ang) * side * 1.5; danger = true; }
    }
  }
  return { ax, ay, danger };
}

function combatFrame(target) {
  const p = w.p, i = inp(), s = w.s, st = w.stats;
  const foes = w.enemies.filter((e) => e.alive && dist(e.x, e.y, p.x, p.y) < 160 && (e.aggro || dist(e.x, e.y, p.x, p.y) < 70) && (dist(e.x, e.y, p.x, p.y) < 24 || w.los(p.x, p.y, e.x, e.y)));
  const t = target || foes.sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y))[0];
  if (!t) return false;
  const d = dist(p.x, p.y, t.x, t.y);
  const th = threats();
  i.aimX = t.x; i.aimY = t.y;
  // зелья
  if (s.hp < st.maxHp * 0.42 && (count(s, 'p_hp1') || count(s, 'p_hp2'))) i.potHp = true;
  if (s.mp < st.maxMp * 0.15 && (count(s, 'p_mp1') || count(s, 'p_mp2')) && RANGED) i.potMp = true;
  // уклонение от опасных зон
  let mx = 0, my = 0;
  if (th.danger) {
    const l = Math.hypot(th.ax, th.ay) || 1;
    mx = th.ax / l; my = th.ay / l;
    if (p.cdDodge <= 0 && !p.dodge && (th.ax || th.ay)) { i.dodge = true; }
  } else if (RANGED) {
    const want = t.boss ? 85 : 70;
    const a = angleTo(p.x, p.y, t.x, t.y);
    if (d < want - 18) { mx = -Math.cos(a); my = -Math.sin(a); }
    else if (d > want + 25) { mx = Math.cos(a); my = Math.sin(a); }
    else { const side = Math.sin(simT * 0.7) > 0 ? 1 : -1; mx = -Math.sin(a) * side * 0.6; my = Math.cos(a) * side * 0.6; }
  } else {
    const reach = (C.attack.range || 20) - 5;
    const a = angleTo(p.x, p.y, t.x, t.y);
    if (d > reach + t.r) { mx = Math.cos(a); my = Math.sin(a); }
    else if (t.boss && (t.boss.mode === 'attack')) { const side = Math.sin(simT * 1.3) > 0 ? 1 : -1; mx = -Math.sin(a) * side * 0.8; my = Math.cos(a) * side * 0.8; }
  }
  i.mx = mx; i.my = my;
  const inRange = RANGED ? d < 150 : d < (C.attack.range || 20) + t.r + 4;
  i.attack = inRange;
  if (process.env.DEBUG2 && Math.floor(simT * 2) !== combatFrame.last) { combatFrame.last = Math.floor(simT * 2); console.log(`  cf t=${simT.toFixed(1)} php=${w.s.hp | 0} t=${t.type}@${d | 0} range=${inRange} act=${w.p.act && w.p.act.kind} cd=${w.p.cdAtk.toFixed(2)} dodgeInp=${i.dodge} mv=${mx.toFixed(1)},${my.toFixed(1)} danger=${th.danger}`); }
  // навыки
  const crowd = foes.filter((e) => dist(e.x, e.y, p.x, p.y) < 40).length;
  for (let k = 0; k < 2; k++) {
    const sk = C.skills[k];
    if (s.lvl < sk.unlock || s.mp < sk.mp || p.cdSkill[k] > 0) continue;
    if (sk.id === 'whirl' && (crowd >= 2 || (t.boss && d < 40))) i.skill[k] = true;
    if (sk.id === 'roar' && (t.boss || foes.length >= 3) && d < 60) i.skill[k] = true;
    if (sk.id === 'fireball' && inRange) i.skill[k] = true;
    if (sk.id === 'nova' && (crowd >= 2 || (t.boss && d < 46))) i.skill[k] = true;
    if (sk.id === 'knives' && d < 110 && d > 25) i.skill[k] = true;
    if (sk.id === 'shadow' && d < 40 && !p.nextCrit && (t.boss || foes.length >= 2)) i.skill[k] = true;
  }
  tick(i);
  return true;
}

// ---------------------------------------------------------------- навигация
// один шаг по кэшированному пути (путь пересчитывается при смене цели или раз в секунду)
const nav = { path: null, wp: 0, t: -99, tx: 0, ty: 0 };
function followStep(tx, ty) {
  const p = w.p;
  if (!nav.path || simT - nav.t > 1 || dist(tx, ty, nav.tx, nav.ty) > 24) {
    nav.path = findPath(p.x, p.y, tx, ty); nav.t = simT; nav.wp = 0; nav.tx = tx; nav.ty = ty;
    if (!nav.path) throw new Error(`нет пути ${w.area} (${p.x | 0},${p.y | 0}) → (${tx | 0},${ty | 0})`);
  }
  const path = nav.path;
  while (nav.wp < path.length - 1 && dist(p.x, p.y, path[nav.wp][0], path[nav.wp][1]) < 6) nav.wp++;
  const [px, py] = path[nav.wp];
  const a = angleTo(p.x, p.y, px, py);
  const i = inp();
  i.mx = Math.cos(a); i.my = Math.sin(a);
  return i;
}
function walkTo(tx, ty, range = 10, opts = {}) {
  nav.path = null;
  const tStart = simT;
  for (let n = 0; n < 30 * 600; n++) {
    const p = w.p;
    if (simT - tStart > 1200) break;
    if (dist(p.x, p.y, tx, ty) <= range) return true;
    // бой по пути
    if (!opts.noFight && w.enemies.some((e) => e.alive && e.aggro && dist(e.x, e.y, p.x, p.y) < 110 && w.los(p.x, p.y, e.x, e.y))) { combatFrame(); n--; continue; }
    const i = followStep(tx, ty);
    const s = w.s;
    if (s.hp < w.stats.maxHp * 0.3 && (count(s, 'p_hp1') || count(s, 'p_hp2'))) i.potHp = true;
    tick(i);
  }
  throw new Error(`не дошёл до (${tx | 0},${ty | 0}) в ${w.area}`);
}
const tileC = (t) => (t + 0.5) * TILE;

function interactWith(pred) {
  for (let n = 0; n < 40; n++) {
    const i = inp();
    tick(i);
    if (w.prompt && pred(w.prompt)) { const j = inp(); j.interact = true; tick(j); return true; }
    tick(inp());
  }
  return false;
}

function talk(npcId) {
  const n = w.npcs.find((q) => q.id === npcId);
  if (!n) throw new Error(`нет NPC ${npcId} в ${w.area}`);
  walkTo(n.px, n.py + 12, 6);
  if (!interactWith((pr) => pr.kind === 'npc' && pr.ref.id === npcId)) throw new Error(`не удалось заговорить с ${npcId}`);
  const plan = pendingTalk.pop();
  if (!plan) throw new Error(`диалог ${npcId} не открылся`);
  // «нажимаем» кнопки как игрок
  const first = plan.choices[0];
  if (plan.kind === 'offer') w.act(first.act);
  if (plan.onEnd) w.act(plan.onEnd);
  pump();
  return plan;
}

function acceptAvailable(npcId) {
  for (let k = 0; k < 4; k++) {
    const plan = talk(npcId);
    if (plan.kind !== 'offer') break;
  }
}

// ---------------------------------------------------------------- бой по заданию
function pickups() {
  if (process.env.DEBUG) console.log('  pickups:', w.pickups.map((q) => `${q.id}@${q.x | 0},${q.y | 0}`).join(' '), 'player', w.p.x | 0, w.p.y | 0);
  for (let n = 0; n < 30 && w.pickups.length; n++) {
    const isQ = (q) => ITEMS[q.id] && ITEMS[q.id].type === 'quest';
    const list = w.pickups.filter((q) => isQ(q) || dist(q.x, q.y, w.p.x, w.p.y) < 160).sort((a, b) => (isQ(b) - isQ(a)) || dist(a.x, a.y, w.p.x, w.p.y) - dist(b.x, b.y, w.p.x, w.p.y));
    const q = list[0];
    if (!q) break;
    try { walkTo(q.x, q.y, 6, { noFight: true }); } catch (e) { break; }
    for (let k = 0; k < 12; k++) tick(inp());
  }
}

function fightEnemy(e, maxSec = 180) {
  const t0 = simT;
  const hp0 = w.s.hp, pot0 = count(w.s, 'p_hp1') + count(w.s, 'p_hp2'), max0 = w.stats.maxHp;
  let minHp = hp0;
  let dbgT = 0;
  while (e.alive && simT - t0 < maxSec) {
    const p = w.p;
    const d = dist(p.x, p.y, e.x, e.y);
    minHp = Math.min(minHp, w.s.hp);
    if (process.env.DEBUG && simT - dbgT > 2) { dbgT = simT; console.log(`  dbg t=${simT.toFixed(1)} p=(${p.x | 0},${p.y | 0}) e=${e.type}(${e.x | 0},${e.y | 0}) st=${e.state} aggro=${e.aggro} hp=${e.hp | 0}/${e.maxHp} d=${d | 0} php=${w.s.hp | 0} aggro=[${w.enemies.filter((o) => o.alive && o.aggro && dist(o.x, o.y, p.x, p.y) < 90).map((o) => o.type + '@' + (dist(o.x, o.y, p.x, p.y) | 0) + ':' + o.state).join(',')}] nav.wp=${nav.wp}/${nav.path && nav.path.length} wp=${nav.path && nav.path[nav.wp] && nav.path[nav.wp].map((v) => v | 0)}`); }
    const engageD = RANGED ? 120 : 60;
    if (d > engageD && !w.enemies.some((o) => o.alive && o.aggro && dist(o.x, o.y, p.x, p.y) < 90)) {
      const i = followStep(e.x, e.y);
      const s2 = w.s;
      if (s2.hp < w.stats.maxHp * 0.3 && (count(s2, 'p_hp1') || count(s2, 'p_hp2'))) i.potHp = true;
      tick(i);
    } else {
      if (!combatFrame(null)) tick(followStep(e.x, e.y));
      if (!e.aggro && d < 70) e.aggro = true;
    }
  }
  if (!e.alive && e.boss) log(`  бой с боссом ${e.type}: ${(simT - t0).toFixed(0)} с, здоровье мин. ${Math.round(minHp / max0 * 100)}% (начало ${Math.round(hp0 / max0 * 100)}%), зелий выпито ${pot0 - (count(w.s, 'p_hp1') + count(w.s, 'p_hp2'))}, ур. ${w.s.lvl}`);
  if (e.alive) throw new Error(`враг ${e.type} не побеждён за ${maxSec} с`);
}

function killMatching(filter, until, label) {
  let guard = 0;
  while (guard++ < 400) {
    if (until && until()) return true;
    const list = w.enemies.filter((e) => e.alive && filter(e)).sort((a, b) => dist(a.x, a.y, w.p.x, w.p.y) - dist(b.x, b.y, w.p.x, w.p.y));
    if (!list.length) return false;
    fightEnemy(list[0]);
    pickups();
    recover();
  }
  return false;
}

// восстановление: пить зелья/ждать регена перед следующим боем
function recover() {
  const s = w.s, st = w.stats;
  for (let n = 0; n < 30 * 90; n++) {
    if (w.enemies.some((e) => e.alive && e.aggro && dist(e.x, e.y, w.p.x, w.p.y) < 130)) { combatFrame(); continue; }
    if (s.hp >= st.maxHp * 0.8 && (!RANGED || s.mp >= st.maxMp * 0.5)) return;
    if (s.hp < st.maxHp * 0.5 && (count(s, 'p_hp1') || count(s, 'p_hp2')) && count(s, 'p_hp1') + count(s, 'p_hp2') > 3) { const i = inp(); i.potHp = true; tick(i); continue; }
    // нет сил — идём к ближайшему алтарю
    if (n > 60 && s.hp < st.maxHp * 0.8 && w.usables.some((u) => u.p.use === 'shrine')) { restAtShrine(); return; }
    tick(inp());
    if (n > 30 * 40 && s.hp >= st.maxHp * 0.6) return;
  }
}
function restAtShrine() {
  const u = w.usables.find((q) => q.p.use === 'shrine');
  if (!u) return;
  walkTo(u.px, u.py + 14, 14, { noFight: false });
  interactWith((pr) => pr.kind === 'use' && pr.ref.p.use === 'shrine');
}

// ---------------------------------------------------------------- покупки
function shopRun() {
  // продать лишнее, купить лучшее снаряжение и зелья
  const s = w.s;
  talkShop('torvald', () => {
    for (let k = 0; k < 6; k++) {
      let bought = false;
      for (const slot of ['weapon', 'armor']) {
        const cur = ITEMS[s.equip[slot]];
        const cand = w.shopStock('smith').map((id) => ITEMS[id]).filter((it) => it.type === slot && (it.tier || 0) > (cur.tier || 0) && it.price <= s.gold - 60).sort((a, b) => b.tier - a.tier)[0];
        if (cand && w.buy(cand.id)) { w.equipItem(cand.id); log('купил', cand.name); bought = true; }
      }
      if (!bought) break;
    }
  });
  talkShop('mira', () => {
    while (s.gold >= 70 && count(s, 'p_hp1') + count(s, 'p_hp2') < 8) { if (!w.buy(s.gold >= 140 ? 'p_hp2' : 'p_hp1')) break; }
    while (RANGED && s.gold >= 50 && count(s, 'p_mp1') + count(s, 'p_mp2') < 5) { if (!w.buy('p_mp1')) break; }
    // амулеты
    for (const id of ['c_wolf', 'c_spirit', 'c_copper']) if (!s.equip.charm && s.gold > ITEMS[id].price + 40 && w.buy(id)) { w.equipItem(id); log('купил', ITEMS[id].name); }
  });
  // экипируем найденное
  for (const slot of ['weapon', 'armor', 'charm']) {
    const cur = ITEMS[s.equip[slot]];
    let best = cur, bid = s.equip[slot];
    for (const id of Object.keys(s.inv)) {
      const it = ITEMS[id];
      if (it.type === slot && (!it.cls || it.cls === cls) && ((it.tier || 0) > ((best && best.tier) || 0))) { best = it; bid = id; }
    }
    if (bid !== s.equip[slot]) { w.equipItem(bid); log('надел', ITEMS[bid].name); }
  }
}
function talkShop(npcId, fn) {
  const n = w.npcs.find((q) => q.id === npcId);
  walkTo(n.px, n.py + 12, 6);
  interactWith((pr) => pr.kind === 'npc' && pr.ref.id === npcId);
  pendingTalk.pop();
  fn();
}

// ---------------------------------------------------------------- прогресс по сюжету
const T0 = Date.now();
function goArea(id, x, y) { pendingTalk.length = 0; w.travel(id, tileC(x), tileC(y)); pump(); }
const inForest = () => w.area === 'forest';
const status = (id) => questStatus(w.s, id);

function ensureLevel(lvl, where) {
  // фарм: чистим доступных врагов в лесу, при необходимости перезаходим
  let loops = 0;
  while (w.s.lvl < lvl && loops++ < 12) {
    if (w.area !== 'forest') goArea('forest', 47.5, 66);
    const ok = (e) => !e.boss && !e.summoned && ['wolf', 'spider', 'bandit', 'goblin', 'goblinArcher'].includes(e.type);
    log(`фарм до ур. ${lvl} (сейчас ${w.s.lvl})`);
    const order = [(e) => e.type === 'wolf', (e) => e.type === 'spider', (e) => e.type === 'bandit', (e) => e.type === 'goblin' || e.type === 'goblinArcher'];
    for (const f of order) {
      if (w.s.lvl >= lvl) break;
      try { killMatching((e) => ok(e) && f(e), () => w.s.lvl >= lvl); } catch (err) { if (!(err instanceof Stuck)) throw err; log('· после смерти продолжаю'); w.loadArea('forest', tileC(47.5), tileC(66)); }
    }
    if (w.s.lvl < lvl) { restAtShrine2(); goArea('village', 32.5, 5); shopRun(); goArea('forest', 47.5, 66); }
  }
}
function restAtShrine2() { try { w.s.hp = w.stats.maxHp; w.s.mp = w.stats.maxMp; } catch (e) { /* ignore */ } }

function retry(label, fn, tries = 6) {
  for (let k = 0; k < tries; k++) {
    try { return fn(); } catch (e) {
      if (e instanceof Stuck) { log(`· ${label}: возврат после смерти, попытка ${k + 2}`); recoverAfterDeath(); continue; }
      throw e;
    }
  }
  throw new Error(`${label}: не получилось за ${tries} попыток`);
}
function recoverAfterDeath() {
  // после смерти игрок у алтаря: лечимся, закупаемся, идём обратно
  w.s.hp = w.stats.maxHp; w.s.mp = w.stats.maxMp;
  if (w.s.gold > 100 && w.area === 'village') shopRun();
}

function main() {
  log(`Класс: ${C.name}, seed ${seed}`);
  // ---- деревня: задания
  acceptAvailable('orwen');
  walkTo(tileC(37), tileC(14), 18);
  for (let n = 0; n < 5; n++) tick(inp());
  if (status('m1') !== 'ready') throw new Error('m1 не готов после осмотра маяка');
  talk('orwen');
  acceptAvailable('garth');
  for (const n of ['lissa', 'tim', 'mira', 'bom']) acceptAvailable(n);
  // луг
  retry('слизни', () => { killMatching((e) => e.type === 'slime', () => status('m2') === 'ready'); });
  if (status('m2') !== 'ready') throw new Error('слизни не убиты');
  talk('garth');
  acceptAvailable('garth'); acceptAvailable('orwen'); acceptAvailable('torvald'); acceptAvailable('bom'); acceptAvailable('mira');
  shopRun();

  // ---- лес: волки, шкуры, цветы, кот, пауки
  goArea('forest', 47.5, 66);
  ensureLevel(4);
  retry('цветы и волки', () => {
    for (const nd of w.nodes.filter((n) => !n.taken && n.item === 'q_flower')) {
      try { walkTo(nd.px, nd.py, 12); interactWith((pr) => pr.kind === 'node'); } catch (e) { if (e instanceof Stuck) throw e; log('· узел недоступен', nd.id); }
    }
  });
  // кот
  retry('кот', () => { const cat = w.npcs.find((n) => n.id === 'pushok'); if (cat) { killMatching((e) => e.type === 'wolf' && dist(e.x, e.y, cat.px, cat.py) < 90); talk('pushok'); } });
  // озеро: амулет
  retry('амулет', () => { walkTo(tileC(47), tileC(42), 10); walkTo(tileC(47), tileC(37), 12); interactWith((pr) => pr.kind === 'chest'); });
  ensureLevel(6);

  // ---- Грок и осколок
  retry('Грок', () => {
    walkTo(tileC(66), tileC(46), 20);
    killMatching((e) => !e.boss && !e.summoned && dist(e.x, e.y, 74 * TILE, 37 * TILE) < 120, null);
    const g = w.enemies.find((e) => e.type === 'chieftain' && e.alive);
    if (g) { log('⚔ Грок'); fightEnemy(g, 240); pickups(); }
  });
  if (!count(w.s, 'q_shard1')) { pickups(); }
  retry('сундук гоблинов', () => { const c = w.chests.find((q) => q.id === 'f_goblin'); walkTo(c.px, c.py + 10, 12); interactWith((pr) => pr.kind === 'chest'); });
  ensureLevel(7);
  // ---- Волчий Глаз
  retry('Волчий Глаз', () => {
    walkTo(tileC(34), tileC(48), 20);
    walkTo(tileC(30), tileC(42), 20);
    killMatching((e) => !e.boss && !e.summoned && e.type === 'bandit', null);
    const c = w.enemies.find((e) => e.type === 'captain' && e.alive);
    if (c) { log('⚔ Волчий Глаз'); fightEnemy(c, 240); pickups(); }
  });
  pickups();
  if (!count(w.s, 'q_key')) throw new Error('ключ не получен');
  // пауки для шёлка
  retry('пауки', () => { killMatching((e) => e.type === 'spider', () => count(w.s, 'q_silk') >= 4); });

  // ---- в деревню: сдать, купить снаряжение
  goArea('village', 32.5, 5);
  for (const n of ['garth', 'orwen', 'lissa', 'torvald', 'bom', 'mira', 'tim']) { try { talk(n); } catch (e) { log('· разговор', n, e.message); } }
  for (const n of ['orwen', 'garth', 'torvald', 'mira', 'bom']) { try { acceptAvailable(n); } catch (e) { /* нет */ } }
  shopRun();
  restAtShrine2();

  // ---- склеп
  goArea('forest', 47.5, 66);
  ensureLevel(9);
  goArea('crypt', 32.5, 49.5);
  retry('склеп', () => {
    // запад, рычаг
    walkTo(tileC(32), tileC(34), 20);
    walkTo(tileC(8), tileC(30), 20);
    killMatching((e) => !e.boss && dist(e.x, e.y, 8 * TILE, 31 * TILE) < 130, null); pickups();
    const lw = w.usables.find((u) => u.p.id === 'lever_w'); walkTo(lw.px, lw.py + 14, 14); interactWith((pr) => pr.kind === 'use' && pr.ref.p.use === 'lever');
    const pg = w.usables.find((u) => u.p.id === 'page1'); walkTo(pg.px, pg.py + 14, 14); interactWith((pr) => pr.kind === 'use' && pr.ref.p.use === 'page'); pendingTalk.length = 0;
    const ch = w.chests.find((c) => c.id === 'c_lib'); walkTo(ch.px, ch.py - 10, 12); interactWith((pr) => pr.kind === 'chest');
    walkTo(tileC(30), tileC(31), 20);
    // восток
    walkTo(tileC(53), tileC(31), 20);
    killMatching((e) => !e.boss && dist(e.x, e.y, 54 * TILE, 31 * TILE) < 130, null); pickups();
    const le = w.usables.find((u) => u.p.id === 'lever_e'); walkTo(le.px, le.py + 14, 14); interactWith((pr) => pr.kind === 'use' && pr.ref.p.use === 'lever');
    const p2 = w.usables.find((u) => u.p.id === 'page2'); walkTo(p2.px, p2.py + 14, 14); interactWith((pr) => pr.kind === 'use' && pr.ref.p.use === 'page'); pendingTalk.length = 0;
    const ch2 = w.chests.find((c) => c.id === 'c_arm'); walkTo(ch2.px, ch2.py - 10, 12); interactWith((pr) => pr.kind === 'chest');
    if (!w.doors[0].open) throw new Error('дверь не открылась после двух рычагов');
    // часовня
    walkTo(tileC(32), tileC(24), 20);
    walkTo(tileC(32), tileC(17), 20);
    killMatching((e) => !e.boss && e.type === 'wraith', null); pickups();
    const p3 = w.usables.find((u) => u.p.id === 'page3'); walkTo(p3.px, p3.py + 14, 14); interactWith((pr) => pr.kind === 'use' && pr.ref.p.use === 'page'); pendingTalk.length = 0;
    const ch3 = w.chests.find((c) => c.id === 'c_chapel'); walkTo(ch3.px, ch3.py + 10, 12); interactWith((pr) => pr.kind === 'chest');
    restAtShrine();
  });
  // экипируем найденное
  shopRunLocal();
  ensureLevelCrypt(10);
  retry('Полый король', () => {
    walkTo(tileC(32), tileC(14), 20);
    walkTo(tileC(32), tileC(10), 20, { noFight: true });
    const k = w.enemies.find((e) => e.type === 'king' && e.alive);
    if (k) { log('⚔ Полый король'); fightEnemy(k, 360); }
    pickups();
  });
  if (!count(w.s, 'q_shard2')) throw new Error('второй осколок не получен');

  // ---- домой, перековка, маяк
  goArea('village', 32.5, 5);
  for (const n of ['orwen', 'torvald']) talk(n);
  talk('orwen');
  talk('torvald');
  walkTo(37.5 * 16, 188, 5);
  if (!interactWith((pr) => pr.kind === 'use' && pr.ref.p.use === 'beacon')) throw new Error('маяк недоступен');
  talk('orwen');
  shopRun();
  for (const n of ['orwen', 'torvald', 'mira', 'bom']) { try { talk(n); } catch (e) { /* ok */ } }
  restAtShrine2();

  // ---- Цитадель
  if (!w.s.flags.beacon_lit) throw new Error('маяк не зажжён');
  goArea('forest', 84.5, 11.5);
  ensureLevelForest(12);
  goArea('citadel', 28.5, 58.5);
  retry('Цитадель', () => {
    walkTo(tileC(28), tileC(48), 20);
    killMatching((e) => !e.boss && dist(e.x, e.y, 28 * TILE, 50 * TILE) < 150, null); pickups();
    restAtShrine();
    walkTo(tileC(28), tileC(40), 20, { noFight: true });
    walkTo(tileC(28), tileC(30), 20);
    killMatching((e) => !e.boss, null); pickups();
    for (const id of ['z_chest1', 'z_chest2']) { const c = w.chests.find((q) => q.id === id); try { walkTo(c.px, c.py + 10, 12); interactWith((pr) => pr.kind === 'chest'); } catch (e) { if (e instanceof Stuck) throw e; } }
    shopRunLocal();
    recoverAfterDeath();
    walkTo(tileC(28), tileC(20), 20, { noFight: true });
    walkTo(tileC(28), tileC(13), 20, { noFight: true });
    const lord = w.enemies.find((e) => e.type === 'lord' && e.alive);
    if (lord) { log('⚔ Скверный Владыка'); fightEnemy(lord, 600); }
  });
  for (let n = 0; n < 150; n++) tick(inp());
  if (!done) throw new Error('победа не засчитана');
}

function shopRunLocal() {
  const s = w.s;
  for (const slot of ['weapon', 'armor', 'charm']) {
    let bid = s.equip[slot];
    for (const id of Object.keys(s.inv)) {
      const it = ITEMS[id];
      if (it.type === slot && (!it.cls || it.cls === cls) && (it.tier || 0) > (ITEMS[bid] ? ITEMS[bid].tier || 0 : -1)) bid = id;
    }
    if (bid !== s.equip[slot]) { w.equipItem(bid); log('надел', ITEMS[bid].name); }
  }
}
function ensureLevelCrypt(lvl) {
  let loops = 0;
  while (w.s.lvl < lvl && loops++ < 6) {
    log(`фарм в склепе до ур. ${lvl}`);
    goArea('crypt', 32.5, 49.5);
    try { killMatching((e) => !e.boss && !e.summoned, () => w.s.lvl >= lvl); } catch (e) { if (!(e instanceof Stuck)) throw e; }
    pickups();
  }
}
function ensureLevelForest(lvl) {
  let loops = 0;
  while (w.s.lvl < lvl && loops++ < 8) {
    log(`фарм до ур. ${lvl} (сейчас ${w.s.lvl})`);
    goArea('forest', 47.5, 66);
    try { killMatching((e) => !e.boss && !e.summoned, () => w.s.lvl >= lvl); } catch (e) { if (!(e instanceof Stuck)) throw e; }
    if (w.s.lvl < lvl) { goArea('crypt', 32.5, 49.5); try { killMatching((e) => !e.boss && !e.summoned, () => w.s.lvl >= lvl); } catch (e) { if (!(e instanceof Stuck)) throw e; } }
    pickups();
  }
  goArea('forest', 84.5, 11.5);
}

try {
  main();
  const st = calcStats(w.s);
  console.log(`\n✅ Пройдено: ${C.name}, ур. ${w.s.lvl}, ${Math.round(simT / 60)} мин игры, смертей: ${deaths}, убийств: ${w.s.kills}, золото ${w.s.gold}`);
  console.log(`   HP ${st.maxHp}, урон ${st.atk}, защита ${st.def}; реальное время теста ${((Date.now() - T0) / 1000).toFixed(1)} с`);
} catch (e) {
  console.log(`\n❌ Бот застрял: ${e.message}`);
  console.log(`   область ${w.area}, ур. ${w.s.lvl}, ${Math.round(simT / 60)} мин, смертей ${deaths}`);
  if (!(e instanceof Stuck)) console.log(e.stack.split('\n').slice(1, 5).join('\n'));
  process.exit(1);
}
