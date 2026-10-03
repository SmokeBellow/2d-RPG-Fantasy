// Реестры сюжета: NPC, квесты, диалоговые узлы. Файлы story_l1.js ... story_l6.js только наполняют их.
// Диалоги — граф узлов. Узел: { n: имя говорящего, t: [реплики], c: [[подпись, следующий узел|null, эффекты, условие]], fx: эффекты при входе }.
// Эффекты — массивы вида ['f','флаг'], ['q+','m1'], ['q!','m1'], ['god','torn',8], ['item','q_core',1], ['take','q_core',1],
// ['gold',50], ['xp',100], ['sp',1], ['shop','smith'], ['rest',20], ['choice','ключ','значение'], ['fight','chieftain','grok'], ['end','seal'] и т.п.
// Обрабатываются в World.applyFx.

import { ITEMS } from './defs.js';

export const NPCS = {};
export const QUESTS = {};
export const NODES = {};
export const ENTRY = {};      // npcId -> (s, world) => id узла

export const NPC = (id, o) => { NPCS[id] = { id, ...o }; };
export const Q = (id, o) => { QUESTS[id] = { id, prereq: [], obj: [], reward: {}, hint: [], ...o }; };
export const N = (id, o) => { NODES[id] = o; };
export const E = (npc, fn) => { ENTRY[npc] = fn; };

// ---- проверки состояния для условий
export const qst = (s, id) => (s.quests[id] ? s.quests[id].state : null);   // 'active' | 'done' | null
export const done = (s, id) => qst(s, id) === 'done';
export const active = (s, id) => qst(s, id) === 'active';
export const flag = (s, f) => !!s.flags[f];
export const has = (s, item, n = 1) => (s.inv[item] || 0) >= n;
export const picked = (s, key) => s.choices[key];

// короткая запись выбора: c('Подпись', 'узел', [эффекты], условие)
export const c = (label, go = null, fx = [], cond = null) => ({ label, go, fx, cond });

// ready(s,id): квест выполнен по целям (подключается движком квестов, чтобы не плодить циклический импорт)
export const H = {};
export const ready = (s, id) => (H.isReady ? H.isReady(s, id) : false);

// ITEM('q_x', { name, desc }) — регистрирует предмет (по умолчанию квестовый) прямо из файла сюжета
export const ITEM = (id, o) => { ITEMS[id] = { id, type: 'quest', price: 0, ...o }; };
