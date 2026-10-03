// Дерево навыков: три ветки на класс. Узел: id, имя, max рангов, эффект на ранг (stat) или улучшение активного навыка (skill).
// Очки: 1 за уровень начиная со 2-го плюс бонусы за задания (s.spBonus). Модуль без DOM.

// stat-ключи: hpPct atkPct defFlat defPct mpFlat mpRegen hpRegen crit critDmg spd lifesteal cdr goldPct potionPct
// drPct bossDmg killHeal dodgePct atkSpeed mpCost backstab comboBonus dodgeCd dodgeIframes
// skill-ключи: dmg (доля), cd (секунды, отрицательное — быстрее), mp, dur (секунды), aoe (пиксели), targets, slow
const N = (id, name, max, branch, o = {}) => ({ id, name, max, branch, ...o });

export const BRANCHES = {
  warrior: ['Оплот', 'Клинок', 'Тактика'],
  mage: ['Пламя', 'Лёд', 'Разум'],
  rogue: ['Тени', 'Клинки', 'Ловкость'],
};

export const TREE = {
  warrior: [
    N('w_hp', 'Закалка', 5, 0, { stat: { hpPct: 0.04 }, text: 'Здоровье +4%' }),
    N('w_def', 'Крепкая кожа', 5, 0, { stat: { defFlat: 2 }, text: 'Защита +2' }),
    N('w_regen', 'Выдержка', 3, 0, { stat: { hpRegen: 0.5 }, text: 'Восстановление здоровья +0,5/с', req: ['w_hp', 2] }),
    N('w_dr', 'Отпор', 3, 0, { stat: { drPct: 0.03 }, text: 'Получаемый урон −3%', req: ['w_def', 2] }),
    N('w_potion', 'Закалённый', 3, 0, { stat: { potionPct: 0.1 }, text: 'Зелья на 10% сильнее' }),
    N('w_roar', 'Эхо клича', 3, 0, { skill: { id: 'roar', dur: 1.5, mp: -3 }, text: 'Боевой клич: +1,5 с, −3 маны', lvl: 5 }),
    N('w_atk', 'Сила удара', 5, 1, { stat: { atkPct: 0.04 }, text: 'Урон +4%' }),
    N('w_crit', 'Рассечение', 5, 1, { stat: { crit: 0.02 }, text: 'Шанс крита +2%' }),
    N('w_boss', 'Охотник на великанов', 3, 1, { stat: { bossDmg: 0.05 }, text: 'Урон по боссам +5%', req: ['w_atk', 2] }),
    N('w_whirl', 'Вихрь', 4, 1, { skill: { id: 'whirl', dmg: 0.12, cd: -0.3 }, text: 'Вихрь: урон +12%, перезарядка −0,3 с' }),
    N('w_steal', 'Кровь врага', 3, 1, { stat: { lifesteal: 0.015 }, text: 'Вампиризм +1,5%', req: ['w_atk', 2] }),
    N('w_speed', 'Мастер меча', 4, 1, { stat: { atkSpeed: 0.04 }, text: 'Скорость атаки +4%' }),
    N('w_mp', 'Выносливость', 5, 2, { stat: { mpFlat: 6 }, text: 'Мана +6' }),
    N('w_run', 'Лёгкий шаг', 4, 2, { stat: { spd: 0.02 }, text: 'Скорость +2%' }),
    N('w_slam', 'Сокрушение', 4, 2, { skill: { id: 'slam', dmg: 0.15, cd: -0.4 }, text: 'Сокрушающий удар: урон +15%, перезарядка −0,4 с', lvl: 10 }),
    N('w_dodge', 'Манёвр', 3, 2, { stat: { dodgeCd: 0.12 }, text: 'Перезарядка переката −0,12 с' }),
    N('w_mpr', 'Железная воля', 3, 2, { stat: { mpRegen: 0.4 }, text: 'Восстановление маны +0,4/с' }),
    N('w_kill', 'Добыча', 3, 2, { stat: { killHeal: 2 }, text: 'За каждого врага +2 здоровья' }),
  ],
  mage: [
    N('m_atk', 'Сила чар', 5, 0, { stat: { atkPct: 0.04 }, text: 'Урон +4%' }),
    N('m_crit', 'Меткость', 5, 0, { stat: { crit: 0.02 }, text: 'Шанс крита +2%' }),
    N('m_fire', 'Огненный шар', 4, 0, { skill: { id: 'fireball', dmg: 0.12, aoe: 3, cd: -0.2 }, text: 'Огненный шар: урон +12%, радиус +3, перезарядка −0,2 с' }),
    N('m_boss', 'Разрушитель', 3, 0, { stat: { bossDmg: 0.05 }, text: 'Урон по боссам +5%', req: ['m_atk', 2] }),
    N('m_bolt', 'Магическая очередь', 4, 0, { stat: { atkSpeed: 0.05 }, text: 'Скорость атаки +5%' }),
    N('m_steal', 'Поглощение', 3, 0, { stat: { lifesteal: 0.01 }, text: 'Вампиризм +1%', req: ['m_atk', 2] }),
    N('m_nova', 'Ледяная нова', 4, 1, { skill: { id: 'nova', dmg: 0.12, slow: 0.4 }, text: 'Ледяная нова: урон +12%, замедление +0,4 с', lvl: 5 }),
    N('m_def', 'Ледяной щит', 5, 1, { stat: { defFlat: 1 }, text: 'Защита +1' }),
    N('m_hp', 'Стойкость', 5, 1, { stat: { hpPct: 0.04 }, text: 'Здоровье +4%' }),
    N('m_dr', 'Морозная кожа', 3, 1, { stat: { drPct: 0.03 }, text: 'Получаемый урон −3%', req: ['m_hp', 2] }),
    N('m_spd', 'Скольжение', 4, 1, { stat: { spd: 0.02 }, text: 'Скорость +2%' }),
    N('m_potion', 'Алхимия', 3, 1, { stat: { potionPct: 0.1 }, text: 'Зелья на 10% сильнее' }),
    N('m_mp', 'Глубокий источник', 5, 2, { stat: { mpFlat: 8 }, text: 'Мана +8' }),
    N('m_mpr', 'Медитация', 5, 2, { stat: { mpRegen: 0.6 }, text: 'Восстановление маны +0,6/с' }),
    N('m_cdr', 'Сосредоточение', 5, 2, { stat: { cdr: 0.03 }, text: 'Перезарядка навыков −3%' }),
    N('m_chain', 'Цепная молния', 4, 2, { skill: { id: 'chain', dmg: 0.12, targets: 1 }, text: 'Цепная молния: урон +12%, +1 цель на 2 и 4 рангах', lvl: 10 }),
    N('m_cost', 'Бережливость', 4, 2, { stat: { mpCost: 0.04 }, text: 'Стоимость навыков −4%' }),
    N('m_gold', 'Магический расчёт', 3, 2, { stat: { goldPct: 0.05 }, text: 'Золото +5%' }),
  ],
  rogue: [
    N('r_crit', 'Смертельный удар', 5, 0, { stat: { crit: 0.025 }, text: 'Шанс крита +2,5%' }),
    N('r_critd', 'Беспощадность', 5, 0, { stat: { critDmg: 0.1 }, text: 'Урон крита +10%' }),
    N('r_shadow', 'Теневой шаг', 4, 0, { skill: { id: 'shadow', dur: 0.6, mp: -2 }, text: 'Теневой шаг: +0,6 с, −2 маны', lvl: 5 }),
    N('r_boss', 'Предатель', 3, 0, { stat: { bossDmg: 0.05 }, text: 'Урон по боссам +5%' }),
    N('r_back', 'Удар в спину', 3, 0, { stat: { backstab: 0.1 }, text: 'Удар в спину сильнее на 10%' }),
    N('r_dodge', 'Призрак', 4, 0, { stat: { dodgePct: 0.02 }, text: 'Шанс уклониться от удара +2%' }),
    N('r_atk', 'Острая заточка', 5, 1, { stat: { atkPct: 0.04 }, text: 'Урон +4%' }),
    N('r_knives', 'Веер ножей', 4, 1, { skill: { id: 'knives', dmg: 0.12, cd: -0.2 }, text: 'Веер ножей: урон +12%, перезарядка −0,2 с' }),
    N('r_speed', 'Быстрые руки', 4, 1, { stat: { atkSpeed: 0.05 }, text: 'Скорость атаки +5%' }),
    N('r_steal', 'Кровь', 3, 1, { stat: { lifesteal: 0.015 }, text: 'Вампиризм +1,5%', req: ['r_atk', 2] }),
    N('r_combo', 'Серия', 3, 1, { stat: { comboBonus: 0.1 }, text: 'Третий удар серии сильнее на 10%' }),
    N('r_dance', 'Танец клинков', 4, 1, { skill: { id: 'dance', dmg: 0.15, cd: -0.4 }, text: 'Танец клинков: урон +15%, перезарядка −0,4 с', lvl: 10 }),
    N('r_hp', 'Живучесть', 5, 2, { stat: { hpPct: 0.04 }, text: 'Здоровье +4%' }),
    N('r_spd', 'Лёгкая поступь', 5, 2, { stat: { spd: 0.03 }, text: 'Скорость +3%' }),
    N('r_roll', 'Кувырок', 3, 2, { stat: { dodgeCd: 0.12, dodgeIframes: 0.03 }, text: 'Кувырок: перезарядка −0,12 с, неуязвимость +0,03 с' }),
    N('r_gold', 'Нюх на золото', 4, 2, { stat: { goldPct: 0.08 }, text: 'Золото +8%' }),
    N('r_mp', 'Концентрация', 4, 2, { stat: { mpFlat: 5 }, text: 'Мана +5' }),
    N('r_kill', 'Добыча', 3, 2, { stat: { killHeal: 2 }, text: 'За каждого врага +2 здоровья' }),
  ],
};

export const NODE = {};
for (const cls of Object.keys(TREE)) for (const n of TREE[cls]) NODE[n.id] = { ...n, cls };

export const rankOfNode = (s, id) => (s.sk && s.sk[id]) || 0;
export const spentPoints = (s) => Object.values(s.sk || {}).reduce((a, b) => a + b, 0);
export const totalPoints = (s) => Math.max(0, s.lvl - 1) + (s.spBonus || 0);
export const freePoints = (s) => totalPoints(s) - spentPoints(s);

export function canLearn(s, id) {
  const n = NODE[id];
  if (!n || n.cls !== s.cls) return { ok: false, why: 'Не твой класс' };
  const r = rankOfNode(s, id);
  if (r >= n.max) return { ok: false, why: 'Максимум' };
  if (freePoints(s) < 1) return { ok: false, why: 'Нет очков' };
  if (n.lvl && s.lvl < n.lvl) return { ok: false, why: `Нужен уровень ${n.lvl}` };
  if (n.req && rankOfNode(s, n.req[0]) < n.req[1]) return { ok: false, why: `Нужно: ${NODE[n.req[0]].name} ${n.req[1]}` };
  return { ok: true };
}

export function learn(s, id) {
  if (!canLearn(s, id).ok) return false;
  s.sk[id] = rankOfNode(s, id) + 1;
  return true;
}

// полный сброс за золото: очки возвращаются, золото тратится
export const respecCost = (s) => 50 + s.lvl * 20;
export function respec(s) {
  const cost = respecCost(s);
  if (s.gold < cost || !spentPoints(s)) return false;
  s.gold -= cost; s.sk = {};
  return true;
}

// суммарные stat-эффекты пассивных узлов
export function passiveStats(s) {
  const out = {};
  for (const [id, r] of Object.entries(s.sk || {})) {
    const n = NODE[id];
    if (!n || !n.stat) continue;
    for (const [k, v] of Object.entries(n.stat)) out[k] = (out[k] || 0) + v * r;
  }
  return out;
}

// улучшения конкретного активного навыка
export function skillMod(s, skillId) {
  const out = { dmg: 0, cd: 0, mp: 0, dur: 0, aoe: 0, targets: 0, slow: 0 };
  for (const [id, r] of Object.entries(s.sk || {})) {
    const n = NODE[id];
    if (!n || !n.skill || n.skill.id !== skillId) continue;
    for (const [k, v] of Object.entries(n.skill)) {
      if (k === 'id') continue;
      if (k === 'targets') out.targets += Math.floor((r + 0) / 2) || 0;   // +1 цель на 2 и 4 рангах
      else out[k] += v * r;
    }
  }
  return out;
}
