// Движок квестов. Данные лежат в story_*.js, реестры — в story_core.js. Без DOM, запускается и в Node.
import { addItem, removeItem, count, addXp, resolveItem } from './state.js';
import { ITEMS } from './defs.js';
import { favor } from './gods.js';
import { QUESTS, NPCS, NODES, ENTRY, done, H } from './story_core.js';
import './story_l1.js';
import './story_l2.js';
import './story_l3.js';
import './story_l45.js';
import './story_l6.js';

export { QUESTS, NPCS, NODES, ENTRY };
export const QUEST_ORDER = Object.keys(QUESTS);

// ---------------------------------------------------------------- состояние квеста
// 'locked' | 'available' | 'active' | 'ready' | 'done'
export function questStatus(s, id) {
  const q = QUESTS[id];
  const st = s.quests[id];
  if (st && st.state === 'done') return 'done';
  if (st && st.state === 'active') return isReady(s, id) ? 'ready' : 'active';
  if (q.prereq.every((p) => done(s, p)) && (!q.when || q.when(s))) return q.autoStart ? 'locked' : 'available';
  return 'locked';
}

export function objProgress(s, id, o) {
  const st = s.quests[id];
  if (o.type === 'kill') return Math.min(o.n, (st && st.kills && st.kills[o.what]) || 0);
  if (o.type === 'item') return Math.min(o.n, count(s, o.item));
  if (o.type === 'flag') return s.flags[o.flag] ? 1 : 0;
  if (o.type === 'any') return o.flags.some((f) => s.flags[f]) ? 1 : 0;
  return 0;
}
export const objNeed = (o) => (o.type === 'flag' || o.type === 'any' ? 1 : o.n);
export const isReady = (s, id) => QUESTS[id].obj.every((o) => objProgress(s, id, o) >= objNeed(o));

H.isReady = (s, id) => isReady(s, id);

export function acceptQuest(s, id) {
  if (s.quests[id]) return false;
  s.quests[id] = { state: 'active', kills: {} };
  return true;
}

// Возвращает { xp, gold, items:[[id,n]], sp, levels, next:[id] } — всё, что произошло при сдаче
export function completeQuest(s, id) {
  const q = QUESTS[id];
  const st = s.quests[id];
  if (!st || st.state !== 'active') return null;
  st.state = 'done';
  for (const it of q.consume || []) {
    const need = q.obj.find((o) => o.item === it);
    removeItem(s, it, need ? need.n : count(s, it));
  }
  const rw = q.reward || {};
  const given = [];
  for (const [raw, n] of rw.items || []) {
    const id2 = resolveItem(raw, s.cls);
    addItem(s, id2, n); given.push([id2, n]);
  }
  s.gold += rw.gold || 0;
  s.spBonus = (s.spBonus || 0) + (rw.sp || 0);
  const levels = addXp(s, rw.xp || 0);
  const changes = [];
  for (const [g, d] of rw.favor || []) changes.push(...favor(s, g, d));
  const next = [];
  for (const nid of q.auto || []) {
    if (QUESTS[nid].prereq.every((p) => done(s, p)) && acceptQuest(s, nid)) next.push(nid);
  }
  return { xp: rw.xp || 0, gold: rw.gold || 0, items: given, sp: rw.sp || 0, levels, next, changes };
}

// Убийство засчитывается во всех активных квестах с такой целью (по типу врага или по имени уникального)
export function onKill(s, what, unique) {
  const changed = [];
  for (const id of QUEST_ORDER) {
    const st = s.quests[id];
    if (!st || st.state !== 'active') continue;
    for (const o of QUESTS[id].obj) {
      if (o.type !== 'kill') continue;
      if (o.what === what || (unique && o.what === unique)) {
        const key = o.what;
        st.kills[key] = (st.kills[key] || 0) + 1; changed.push(id);
      }
    }
  }
  return changed;
}

export function activeQuests(s) {
  return QUEST_ORDER.filter((id) => ['active', 'ready'].includes(questStatus(s, id)));
}

// Значок над NPC: '!' — есть задание, '?' — можно сдать, '…' — задание в процессе
export function npcMarker(s, npcId) {
  let mark = null;
  for (const id of QUEST_ORDER) {
    const q = QUESTS[id];
    const st = questStatus(s, id);
    if (q.turnIn === npcId && st === 'ready') return '?';
    if (q.giver === npcId && st === 'available') mark = '!';
    else if (!mark && (q.giver === npcId || q.turnIn === npcId) && st === 'active') mark = '…';
  }
  return mark;
}

export const itemName = (id) => (ITEMS[id] ? ITEMS[id].name : id);
