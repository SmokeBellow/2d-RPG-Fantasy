// Общие константы и справочники. Модуль не зависит от DOM, чтобы его можно было
// запускать и в браузере, и в Node (тесты карт и квестов).

export const TILE = 16;
export const VW = 480;          // логическая ширина экрана (пикселей игры)
export const VH = 270;          // логическая высота экрана

// ---------------------------------------------------------------- тайлы
export const T = {
  GRASS: 0, DIRT: 1, PLAZA: 2, WATER: 3, SAND: 4, WOOD: 5, WALL: 6, ROCK: 7,
  CRYPT: 8, CWALL: 9, LAVA: 10, SWAMP: 11, BRIDGE: 12, DEEP: 13, BLIGHT: 14, BWALL: 15,
  TREE: 16, // дерево: непроходимый тайл травы (крона рисуется как объект)
};

// solid — не пройти; slow — замедляет; hurt — урон в секунду
export const TILEDEF = {
  [T.GRASS]: {}, [T.DIRT]: {}, [T.PLAZA]: {}, [T.SAND]: {}, [T.WOOD]: {}, [T.CRYPT]: {}, [T.BLIGHT]: {},
  [T.WATER]: { solid: true, water: true }, [T.DEEP]: { solid: true, water: true },
  [T.WALL]: { solid: true }, [T.ROCK]: { solid: true }, [T.CWALL]: { solid: true }, [T.BWALL]: { solid: true },
  [T.TREE]: { solid: true },
  [T.LAVA]: { hurt: 14, lava: true },
  [T.SWAMP]: { slow: 0.7 },
  [T.BRIDGE]: {},
};

// ---------------------------------------------------------------- баланс
export const CFG = {
  playerSpeed: 64,
  playerRadius: 5,
  dodgeTime: 0.28,
  dodgeCd: 0.9,
  invulnAfterHit: 0.55,
  potionCd: 1.2,
  interactRange: 22,
  aggroMult: 1,
  pickupRange: 14,
  magnetRange: 34,
  maxLevel: 15,
  deathGoldLoss: 0.1,
  autoAimRange: 110,
  autoAimCone: 0.75,   // радианы
};

export const xpForLevel = (lvl) => Math.round(30 * Math.pow(lvl, 1.55) + 20 * lvl);

// ---------------------------------------------------------------- классы
// base — на 1 уровне, grow — прирост за уровень
export const CLASSES = {
  warrior: {
    id: 'warrior', name: 'Воин', blurb: 'Крепкий боец ближнего боя. Много здоровья, мощные удары по дуге.',
    hint: 'Здоровье ★★★  Урон ★★☆  Скорость ★☆☆',
    base: { hp: 130, mp: 40, atk: 9, def: 4, spd: 1.0, crit: 0.05, mpRegen: 2.0 },
    grow: { hp: 16, mp: 3, atk: 2.1, def: 1.2, crit: 0.002 },
    attack: { kind: 'melee', cd: 0.42, wind: 0.10, range: 27, arc: 2.0, mult: 1.0, kb: 70, name: 'Удар мечом' },
    skills: [
      { id: 'whirl', name: 'Вихрь', unlock: 1, mp: 16, cd: 4.5, desc: 'Круговой удар по всем врагам вокруг (170% урона).' },
      { id: 'roar', name: 'Боевой клич', unlock: 5, mp: 24, cd: 16, desc: 'На 7 с: +35% урона и −30% получаемого урона.' },
    ],
    dodge: { name: 'Перекат', dist: 44, iframes: 0.2 },
    startWeapon: 'w_war1', startArmor: 'a_war1', color: '#c9a064',
  },
  mage: {
    id: 'mage', name: 'Маг', blurb: 'Хрупкий, но смертоносный. Бьёт магией на расстоянии, колдует огонь и лёд.',
    hint: 'Здоровье ★☆☆  Урон ★★★  Скорость ★★☆',
    base: { hp: 84, mp: 90, atk: 8, def: 1, spd: 1.0, crit: 0.06, mpRegen: 4.5 },
    grow: { hp: 10, mp: 9, atk: 2.4, def: 0.6, crit: 0.002 },
    attack: { kind: 'bolt', cd: 0.5, wind: 0.08, speed: 200, range: 150, mult: 1.0, name: 'Магический снаряд' },
    skills: [
      { id: 'fireball', name: 'Огненный шар', unlock: 1, mp: 16, cd: 2.4, desc: 'Взрывается при попадании (220% урона по области).' },
      { id: 'nova', name: 'Ледяная нова', unlock: 5, mp: 26, cd: 9, desc: 'Волна холода вокруг: 150% урона и замедление врагов.' },
    ],
    dodge: { name: 'Скачок', dist: 52, iframes: 0.18, blink: true },
    startWeapon: 'w_mag1', startArmor: 'a_mag1', color: '#6b8de8',
  },
  rogue: {
    id: 'rogue', name: 'Разбойник', blurb: 'Быстрый и ловкий. Серии коротких ударов, удар в спину и метание ножей.',
    hint: 'Здоровье ★★☆  Урон ★★☆  Скорость ★★★',
    base: { hp: 100, mp: 60, atk: 7, def: 2, spd: 1.14, crit: 0.12, mpRegen: 3.2 },
    grow: { hp: 12, mp: 5, atk: 1.9, def: 0.8, crit: 0.003 },
    attack: { kind: 'melee', cd: 0.27, wind: 0.05, range: 20, arc: 1.5, mult: 0.7, kb: 28, combo: true, name: 'Удар кинжалом' },
    skills: [
      { id: 'knives', name: 'Веер ножей', unlock: 1, mp: 14, cd: 3.2, desc: 'Пять метательных ножей веером (по 90% урона).' },
      { id: 'shadow', name: 'Теневой шаг', unlock: 5, mp: 22, cd: 12, desc: 'На 3 с невидим для врагов; следующий удар — критический ×3.' },
    ],
    dodge: { name: 'Кувырок', dist: 58, iframes: 0.3 },
    startWeapon: 'w_rog1', startArmor: 'a_rog1', color: '#9a6bb8',
  },
};

// ---------------------------------------------------------------- предметы
// type: weapon | armor | charm | potion | quest
function gear(table, list) {
  for (const it of list) table[it.id] = it;
}
export const ITEMS = {};
gear(ITEMS, [
  // оружие воина
  { id: 'w_war1', type: 'weapon', cls: 'warrior', tier: 1, name: 'Ржавый меч', atk: 4, price: 10, desc: 'Видал лучшие дни.' },
  { id: 'w_war2', type: 'weapon', cls: 'warrior', tier: 2, name: 'Железный меч', atk: 9, price: 120, desc: 'Простой и надёжный.' },
  { id: 'w_war3', type: 'weapon', cls: 'warrior', tier: 3, name: 'Стальной клинок', atk: 15, price: 380, desc: 'Хорошо сбалансирован.' },
  { id: 'w_war4', type: 'weapon', cls: 'warrior', tier: 4, name: 'Рунный меч', atk: 22, crit: 0.04, price: 900, desc: 'Руны тихо гудят в руке.' },
  { id: 'w_war5', type: 'weapon', cls: 'warrior', tier: 5, name: 'Клинок Пламени Эмбера', atk: 32, crit: 0.08, hp: 30, price: 0, desc: 'Перекован из двух осколков Сердца Пламени.' },
  // оружие мага
  { id: 'w_mag1', type: 'weapon', cls: 'mage', tier: 1, name: 'Посох-ветка', atk: 4, mp: 4, price: 10, desc: 'Просто ветка. Но с верой.' },
  { id: 'w_mag2', type: 'weapon', cls: 'mage', tier: 2, name: 'Дубовый посох', atk: 9, mp: 10, price: 120, desc: 'Тёплый на ощупь.' },
  { id: 'w_mag3', type: 'weapon', cls: 'mage', tier: 3, name: 'Кристальный посох', atk: 15, mp: 18, price: 380, desc: 'Кристалл ловит свет даже в темноте.' },
  { id: 'w_mag4', type: 'weapon', cls: 'mage', tier: 4, name: 'Посох Бури', atk: 22, mp: 26, crit: 0.04, price: 900, desc: 'Над навершием вьются молнии.' },
  { id: 'w_mag5', type: 'weapon', cls: 'mage', tier: 5, name: 'Посох Тлеющего Сердца', atk: 32, mp: 40, crit: 0.08, price: 0, desc: 'Перекован из двух осколков Сердца Пламени.' },
  // оружие разбойника
  { id: 'w_rog1', type: 'weapon', cls: 'rogue', tier: 1, name: 'Нож следопыта', atk: 4, price: 10, desc: 'Годится и для хлеба, и для врагов.' },
  { id: 'w_rog2', type: 'weapon', cls: 'rogue', tier: 2, name: 'Стальной кинжал', atk: 9, price: 120, desc: 'Тонкий и острый.' },
  { id: 'w_rog3', type: 'weapon', cls: 'rogue', tier: 3, name: 'Волчий клык', atk: 15, crit: 0.04, price: 380, desc: 'Изогнутое лезвие из кости.' },
  { id: 'w_rog4', type: 'weapon', cls: 'rogue', tier: 4, name: 'Теневой клинок', atk: 22, crit: 0.07, price: 900, desc: 'Почти не отбрасывает блика.' },
  { id: 'w_rog5', type: 'weapon', cls: 'rogue', tier: 5, name: 'Жало Эмбера', atk: 32, crit: 0.12, spd: 0.05, price: 0, desc: 'Перекован из двух осколков Сердца Пламени.' },
  // броня
  { id: 'a_war1', type: 'armor', cls: 'warrior', tier: 1, name: 'Стёганка', def: 2, hp: 10, price: 10, desc: 'Тёплая, но тонкая.' },
  { id: 'a_war2', type: 'armor', cls: 'warrior', tier: 2, name: 'Кольчуга', def: 5, hp: 24, price: 130, desc: 'Звенит при каждом шаге.' },
  { id: 'a_war3', type: 'armor', cls: 'warrior', tier: 3, name: 'Латный доспех', def: 9, hp: 44, price: 420, desc: 'Тяжёлая сталь.' },
  { id: 'a_war4', type: 'armor', cls: 'warrior', tier: 4, name: 'Рунная броня', def: 14, hp: 70, price: 950, desc: 'Защитные руны вплетены в сталь.' },
  { id: 'a_mag1', type: 'armor', cls: 'mage', tier: 1, name: 'Ряса ученика', def: 1, mp: 8, price: 10, desc: 'Чуть длинновата.' },
  { id: 'a_mag2', type: 'armor', cls: 'mage', tier: 2, name: 'Мантия странника', def: 3, mp: 16, hp: 12, price: 130, desc: 'Пахнет дорожной пылью.' },
  { id: 'a_mag3', type: 'armor', cls: 'mage', tier: 3, name: 'Мантия чародея', def: 6, mp: 28, hp: 22, price: 420, desc: 'Расшита звёздами.' },
  { id: 'a_mag4', type: 'armor', cls: 'mage', tier: 4, name: 'Одеяние Огня', def: 10, mp: 44, hp: 40, price: 950, desc: 'Тёплое, как очаг.' },
  { id: 'a_rog1', type: 'armor', cls: 'rogue', tier: 1, name: 'Кожаная куртка', def: 1, hp: 6, price: 10, desc: 'Не стесняет движений.' },
  { id: 'a_rog2', type: 'armor', cls: 'rogue', tier: 2, name: 'Плащ следопыта', def: 4, hp: 16, spd: 0.02, price: 130, desc: 'Сливается с лесом.' },
  { id: 'a_rog3', type: 'armor', cls: 'rogue', tier: 3, name: 'Куртка душегуба', def: 7, hp: 30, spd: 0.03, price: 420, desc: 'Много скрытых карманов.' },
  { id: 'a_rog4', type: 'armor', cls: 'rogue', tier: 4, name: 'Теневой плащ', def: 11, hp: 48, spd: 0.05, price: 950, desc: 'Тьма сама ложится на плечи.' },
  // амулеты (для всех)
  { id: 'c_copper', type: 'charm', tier: 1, name: 'Медный амулет', hp: 15, price: 60, desc: 'Простенький оберег.' },
  { id: 'c_wolf', type: 'charm', tier: 2, name: 'Кольцо волка', crit: 0.05, atk: 2, price: 220, desc: 'Волчья ярость.' },
  { id: 'c_spirit', type: 'charm', tier: 2, name: 'Оберег лесных духов', mp: 24, def: 2, price: 220, desc: 'Шепчет в тишине.' },
  { id: 'c_amulet', type: 'charm', tier: 3, name: 'Амулет Элоизы', hp: 30, mp: 20, price: 0, desc: 'Старинная семейная реликвия.' },
  { id: 'c_king', type: 'charm', tier: 4, name: 'Печать полого короля', atk: 5, def: 4, hp: 40, price: 0, desc: 'Холодная, но всё ещё сильная.' },
  { id: 'c_ember', type: 'charm', tier: 5, name: 'Искра Эмбера', atk: 6, hp: 60, mp: 30, crit: 0.05, price: 0, desc: 'Тёплый огонёк в камне.' },
  // зелья
  { id: 'p_hp1', type: 'potion', name: 'Малое зелье лечения', heal: 50, price: 25, desc: 'Восстанавливает 50 здоровья.' },
  { id: 'p_hp2', type: 'potion', name: 'Зелье лечения', heal: 120, price: 70, desc: 'Восстанавливает 120 здоровья.' },
  { id: 'p_mp1', type: 'potion', name: 'Малое зелье маны', mana: 40, price: 25, desc: 'Восстанавливает 40 маны.' },
  { id: 'p_mp2', type: 'potion', name: 'Зелье маны', mana: 90, price: 70, desc: 'Восстанавливает 90 маны.' },
  // квестовые и материалы
  { id: 'q_pelt', type: 'quest', name: 'Волчья шкура', price: 8, desc: 'Плотная и тёплая.' },
  { id: 'q_silk', type: 'quest', name: 'Паучий шёлк', price: 8, desc: 'Прочнее верёвки.' },
  { id: 'q_flower', type: 'quest', name: 'Лунный цветок', price: 6, desc: 'Светится в сумерках.' },
  { id: 'q_key', type: 'quest', name: 'Ключ от склепа', price: 0, desc: 'Тяжёлый ржавый ключ с черепом.' },
  { id: 'q_shard1', type: 'quest', name: 'Осколок Пламени (I)', price: 0, desc: 'Тёплый и пульсирующий.' },
  { id: 'q_shard2', type: 'quest', name: 'Осколок Пламени (II)', price: 0, desc: 'Тёплый и пульсирующий.' },
  { id: 'q_page', type: 'quest', name: 'Страница летописи', price: 0, desc: 'Выцветшие строки старого короля.' },
  { id: 'q_cat', type: 'quest', name: 'Лежебока Пушок', price: 0, desc: 'Мурчит.' },
]);

// какие предметы продают торговцы (зависит от класса игрока: см. shopStock)
export const SHOPS = {
  smith: { name: 'Кузница Торвальда', tiers: [2, 3], kinds: ['weapon', 'armor'] },
  general: { name: 'Лавка Миры', items: ['p_hp1', 'p_hp2', 'p_mp1', 'p_mp2', 'c_copper', 'c_wolf', 'c_spirit'] },
};

// ---------------------------------------------------------------- враги
// hp/atk даны для эталонного уровня, дальше масштабируются по lvl (см. world.js)
export const ENEMIES = {
  slime: { name: 'Слизень', ai: 'melee', hp: 22, atk: 5, spd: 28, r: 5, xp: 8, gold: [1, 3], aggro: 70, wind: 0.45, reach: 11, color: '#6ccf5a', hop: true },
  wolf: { name: 'Волк', ai: 'charger', hp: 30, atk: 8, spd: 52, r: 5, xp: 14, gold: [1, 4], aggro: 100, wind: 0.5, reach: 12, lunge: 120, drops: [['q_pelt', 0.45]] },
  goblin: { name: 'Гоблин', ai: 'melee', hp: 34, atk: 9, spd: 36, r: 5, xp: 17, gold: [2, 6], aggro: 90, wind: 0.5, reach: 14 },
  goblinArcher: { name: 'Гоблин-лучник', ai: 'ranged', hp: 24, atk: 8, spd: 32, r: 5, xp: 18, gold: [2, 6], aggro: 130, wind: 0.65, keep: 70, shot: 'arrow' },
  spider: { name: 'Паук', ai: 'ranged', hp: 28, atk: 7, spd: 42, r: 5, xp: 20, gold: [1, 5], aggro: 100, wind: 0.6, keep: 52, shot: 'web', drops: [['q_silk', 0.5]] },
  bandit: { name: 'Разбойник', ai: 'melee', hp: 44, atk: 11, spd: 44, r: 5, xp: 26, gold: [4, 10], aggro: 100, wind: 0.4, reach: 14 },
  skeleton: { name: 'Скелет', ai: 'melee', hp: 54, atk: 13, spd: 32, r: 5, xp: 32, gold: [3, 8], aggro: 90, wind: 0.55, reach: 15 },
  bat: { name: 'Летучая мышь', ai: 'flier', hp: 20, atk: 7, spd: 70, r: 4, xp: 14, gold: [0, 3], aggro: 110, wind: 0.2, reach: 10 },
  wraith: { name: 'Призрак', ai: 'ranged', hp: 46, atk: 15, spd: 30, r: 5, xp: 40, gold: [4, 10], aggro: 140, wind: 0.7, keep: 80, shot: 'orb', float: true },
  husk: { name: 'Скверный воин', ai: 'melee', hp: 80, atk: 18, spd: 38, r: 6, xp: 50, gold: [6, 14], aggro: 100, wind: 0.5, reach: 16 },
  spitter: { name: 'Скверноплюй', ai: 'ranged', hp: 54, atk: 17, spd: 30, r: 6, xp: 52, gold: [6, 14], aggro: 140, wind: 0.65, keep: 76, shot: 'blight' },
  // боссы и мини-боссы
  chieftain: { name: 'Вождь гоблинов Грок', ai: 'boss_chief', boss: true, hp: 380, atk: 16, spd: 34, r: 9, xp: 160, gold: [40, 60], aggro: 150, drops: [['q_shard1', 1]], title: 'Грок, вождь гоблинов' },
  captain: { name: 'Капитан Волчий Глаз', ai: 'boss_captain', boss: true, hp: 320, atk: 18, spd: 52, r: 6, xp: 180, gold: [50, 80], aggro: 150, drops: [['q_key', 1]], title: 'Волчий Глаз, главарь разбойников' },
  king: { name: 'Полый король', ai: 'boss_king', boss: true, hp: 800, atk: 22, spd: 36, r: 9, xp: 520, gold: [120, 160], aggro: 190, drops: [['q_shard2', 1], ['c_king', 1]], title: 'Полый король' },
  lord: { name: 'Скверный Владыка', ai: 'boss_lord', boss: true, hp: 1700, atk: 28, spd: 40, r: 11, xp: 1500, gold: [300, 300], aggro: 220, title: 'Скверный Владыка' },
};

// ---------------------------------------------------------------- области
export const AREAS = {
  village: { id: 'village', name: 'Тихий Брод', sub: 'Деревня у реки', theme: 'village' },
  forest: { id: 'forest', name: 'Шёпотный лес', sub: 'Здесь шепчут даже деревья', theme: 'forest' },
  crypt: { id: 'crypt', name: 'Склеп забытых королей', sub: 'Тишина тяжелее камня', theme: 'crypt' },
  citadel: { id: 'citadel', name: 'Цитадель Скверны', sub: 'Последний рубеж', theme: 'citadel' },
};

export const DIRS8 = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];
