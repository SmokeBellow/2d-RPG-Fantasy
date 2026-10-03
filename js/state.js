// Состояние игрока (сохраняется целиком) и производные характеристики. Без DOM.
import { CLASSES, ITEMS, CFG, xpForLevel } from './defs.js';

export const SAVE_VERSION = 1;

export function newState(cls) {
  const c = CLASSES[cls];
  const s = {
    v: SAVE_VERSION,
    cls,
    lvl: 1, xp: 0,
    hp: 1, mp: 1,
    gold: 15,
    inv: { p_hp1: 2, p_mp1: 1 },
    equip: { weapon: c.startWeapon, armor: c.startArmor, charm: null },
    quests: {},
    flags: {},
    opened: {},        // открытые сундуки и собранные узлы
    killed: {},        // побеждённые уникальные враги
    area: 'village',
    x: 0, y: 0,
    respawn: { area: 'village', x: 32.5 * 16, y: 25.5 * 16 },
    kills: 0,
    playtime: 0,
    deaths: 0,
    visited: {},
    skillsSeen: {},
  };
  const st = calcStats(s);
  s.hp = st.maxHp; s.mp = st.maxMp;
  return s;
}

// '@weapon3' -> предмет нужного класса: w_war3 / w_mag3 / w_rog3
const ABBR = { warrior: 'war', mage: 'mag', rogue: 'rog' };
export function resolveItem(id, cls) {
  if (id[0] !== '@') return id;
  const m = /^@(weapon|armor)(\d)$/.exec(id);
  if (!m) return id;
  return `${m[1] === 'weapon' ? 'w' : 'a'}_${ABBR[cls]}${m[2]}`;
}

export function calcStats(s) {
  const c = CLASSES[s.cls];
  const L = s.lvl - 1;
  const st = {
    maxHp: c.base.hp + c.grow.hp * L,
    maxMp: c.base.mp + c.grow.mp * L,
    atk: c.base.atk + c.grow.atk * L,
    def: c.base.def + c.grow.def * L,
    crit: c.base.crit + c.grow.crit * L,
    spd: c.base.spd,
    mpRegen: c.base.mpRegen,
  };
  for (const slot of ['weapon', 'armor', 'charm']) {
    const it = s.equip[slot] && ITEMS[s.equip[slot]];
    if (!it) continue;
    st.maxHp += it.hp || 0; st.maxMp += it.mp || 0; st.atk += it.atk || 0;
    st.def += it.def || 0; st.crit += it.crit || 0; st.spd += it.spd || 0;
  }
  st.maxHp = Math.round(st.maxHp); st.maxMp = Math.round(st.maxMp);
  st.atk = Math.round(st.atk * 10) / 10; st.def = Math.round(st.def * 10) / 10;
  return st;
}

// ---- инвентарь
export const count = (s, id) => s.inv[id] || 0;
export function addItem(s, id, n = 1) { s.inv[id] = (s.inv[id] || 0) + n; }
export function removeItem(s, id, n = 1) {
  if (count(s, id) < n) return false;
  s.inv[id] -= n;
  if (s.inv[id] <= 0) delete s.inv[id];
  return true;
}

export function equip(s, id) {
  const it = ITEMS[id];
  if (!it || !['weapon', 'armor', 'charm'].includes(it.type)) return false;
  if (it.cls && it.cls !== s.cls) return false;
  if (count(s, id) < 1) return false;
  const slot = it.type;
  const prev = s.equip[slot];
  removeItem(s, id, 1);
  if (prev) addItem(s, prev, 1);
  s.equip[slot] = id;
  const st = calcStats(s);
  s.hp = Math.min(s.hp, st.maxHp); s.mp = Math.min(s.mp, st.maxMp);
  return true;
}

export function unequip(s, slot) {
  const prev = s.equip[slot];
  if (!prev) return false;
  s.equip[slot] = null;
  addItem(s, prev, 1);
  const st = calcStats(s);
  s.hp = Math.min(s.hp, st.maxHp); s.mp = Math.min(s.mp, st.maxMp);
  return true;
}

// опыт; возвращает число полученных уровней
export function addXp(s, n) {
  if (s.lvl >= CFG.maxLevel) return 0;
  s.xp += Math.round(n);
  let gained = 0;
  while (s.lvl < CFG.maxLevel && s.xp >= xpForLevel(s.lvl)) {
    s.xp -= xpForLevel(s.lvl);
    s.lvl++; gained++;
    const st = calcStats(s);
    s.hp = st.maxHp; s.mp = st.maxMp;   // новый уровень лечит
  }
  if (s.lvl >= CFG.maxLevel) s.xp = 0;
  return gained;
}

export function isUnlocked(s, skillIdx) {
  return s.lvl >= CLASSES[s.cls].skills[skillIdx].unlock;
}

export function itemCompare(s, id) {
  // насколько предмет лучше надетого в этом слоте (для подсказок «▲»)
  const it = ITEMS[id];
  if (!it || !['weapon', 'armor', 'charm'].includes(it.type)) return 0;
  const cur = ITEMS[s.equip[it.type]];
  const score = (x) => (x ? (x.atk || 0) * 3 + (x.def || 0) * 3 + (x.hp || 0) * 0.3 + (x.mp || 0) * 0.3 + (x.crit || 0) * 100 : 0);
  return score(it) - score(cur);
}
