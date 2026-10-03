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
  SNOW: 17, ICE: 18, ASH: 19, COBBLE: 20,
};

// solid — не пройти; slow — замедляет; hurt — урон в секунду
export const TILEDEF = {
  [T.GRASS]: {}, [T.DIRT]: {}, [T.PLAZA]: {}, [T.SAND]: {}, [T.WOOD]: {}, [T.CRYPT]: {}, [T.BLIGHT]: {},
  [T.ASH]: {}, [T.COBBLE]: {}, [T.ICE]: {},
  [T.SNOW]: { slow: 0.88 },
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
  pickupRange: 14,
  magnetRange: 34,
  maxLevel: 20,
  deathGoldLoss: 0.1,
  autoAimRange: 110,
  autoAimCone: 0.75,   // радианы
  likCd: 100,
  likMp: 40,
};

export const xpForLevel = (lvl) => Math.round(22 * Math.pow(lvl, 1.5) + 14 * lvl);

// ---------------------------------------------------------------- классы
// base — на 1 уровне, grow — прирост за уровень. Третий навык открывается на 10 уровне.
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
      { id: 'slam', name: 'Сокрушающий удар', unlock: 10, mp: 26, cd: 10, desc: 'Удар о землю: 240% урона по области перед тобой и оглушение.' },
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
      { id: 'chain', name: 'Цепная молния', unlock: 10, mp: 28, cd: 8, desc: 'Молния перескакивает между врагами: до 3 целей, 170% урона каждой.' },
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
      { id: 'dance', name: 'Танец клинков', unlock: 10, mp: 26, cd: 9, desc: 'Рывок сквозь врагов: серия ударов по 110% урона каждому.' },
    ],
    dodge: { name: 'Кувырок', dist: 58, iframes: 0.3 },
    startWeapon: 'w_rog1', startArmor: 'a_rog1', color: '#9a6bb8',
  },
};

// ---------------------------------------------------------------- предметы
// type: weapon | armor | charm | potion | quest | lik
export const ITEMS = {};
const put = (list) => { for (const it of list) ITEMS[it.id] = it; };

const WEAPONS = {
  warrior: ['w_war', [['Ржавый меч', 'Видал лучшие дни.'], ['Железный меч', 'Простой и надёжный.'], ['Стальной клинок', 'Хорошо сбалансирован.'], ['Рунный меч', 'Руны тихо гудят в руке.'], ['Меч Прежних', 'Металл, который не должен был пережить войну.']]],
  mage: ['w_mag', [['Посох-ветка', 'Просто ветка. Но с верой.'], ['Дубовый посох', 'Тёплый на ощупь.'], ['Кристальный посох', 'Кристалл ловит свет даже в темноте.'], ['Посох Бури', 'Над навершием вьются молнии.'], ['Посох Забытого Века', 'Дерево помнит то, что люди забыли.']]],
  rogue: ['w_rog', [['Нож следопыта', 'Годится и для хлеба, и для врагов.'], ['Стальной кинжал', 'Тонкий и острый.'], ['Волчий клык', 'Изогнутое лезвие из кости.'], ['Теневой клинок', 'Почти не отбрасывает блика.'], ['Жало Прежних', 'Тонкое, как слово, сказанное шёпотом.']]],
};
const WSTAT = [{ atk: 4, price: 10 }, { atk: 9, price: 120 }, { atk: 15, price: 380 }, { atk: 22, crit: 0.04, price: 900 }, { atk: 32, crit: 0.08, price: 0 }];
const ARMORS = {
  warrior: ['a_war', [['Стёганка', 'Тёплая, но тонкая.'], ['Кольчуга', 'Звенит при каждом шаге.'], ['Латный доспех', 'Тяжёлая сталь.'], ['Рунная броня', 'Защитные руны вплетены в сталь.'], ['Доспех Прежних', 'Не ржавеет, не нагревается, не помнит.']]],
  mage: ['a_mag', [['Ряса ученика', 'Чуть длинновата.'], ['Мантия странника', 'Пахнет дорожной пылью.'], ['Мантия чародея', 'Расшита звёздами.'], ['Мантия архимага', 'Подол шелестит, как страницы.'], ['Одеяние Прежних', 'Ткань, которую никто не ткал.']]],
  rogue: ['a_rog', [['Кожаная куртка', 'Не стесняет движений.'], ['Плащ следопыта', 'Сливается с лесом.'], ['Куртка душегуба', 'Много скрытых карманов.'], ['Теневой плащ', 'Тень сама ложится на плечи.'], ['Покров Прежних', 'Невесомый и очень холодный.']]],
};
const ASTAT = {
  warrior: [{ def: 2, hp: 10, price: 10 }, { def: 5, hp: 24, price: 130 }, { def: 9, hp: 44, price: 420 }, { def: 14, hp: 70, price: 950 }, { def: 20, hp: 100, price: 0 }],
  mage: [{ def: 1, mp: 8, price: 10 }, { def: 3, mp: 16, hp: 12, price: 130 }, { def: 6, mp: 28, hp: 22, price: 420 }, { def: 10, mp: 44, hp: 40, price: 950 }, { def: 14, mp: 64, hp: 70, price: 0 }],
  rogue: [{ def: 1, hp: 6, price: 10 }, { def: 4, hp: 16, spd: 0.02, price: 130 }, { def: 7, hp: 30, spd: 0.03, price: 420 }, { def: 11, hp: 48, spd: 0.05, price: 950 }, { def: 16, hp: 70, spd: 0.08, price: 0 }],
};
for (const cls of Object.keys(WEAPONS)) {
  const [pre, names] = WEAPONS[cls];
  names.forEach(([name, desc], i) => {
    const st = { ...WSTAT[i] };
    if (cls === 'mage') st.mp = [4, 10, 18, 26, 40][i];
    if (cls === 'rogue' && i >= 2) st.crit = [0, 0, 0.04, 0.07, 0.12][i];
    if (cls === 'rogue' && i === 4) st.spd = 0.05;
    if (cls === 'warrior' && i === 4) st.hp = 30;
    put([{ id: `${pre}${i + 1}`, type: 'weapon', cls, tier: i + 1, name, desc, ...st }]);
  });
  const [apre, anames] = ARMORS[cls];
  anames.forEach(([name, desc], i) => put([{ id: `${apre}${i + 1}`, type: 'armor', cls, tier: i + 1, name, desc, ...ASTAT[cls][i] }]));
}
put([
  // амулеты
  { id: 'c_copper', type: 'charm', tier: 1, name: 'Медный амулет', hp: 15, price: 60, desc: 'Простенький оберег.' },
  { id: 'c_wolf', type: 'charm', tier: 2, name: 'Кольцо волка', crit: 0.05, atk: 2, price: 220, desc: 'Волчья ярость.' },
  { id: 'c_spirit', type: 'charm', tier: 2, name: 'Оберег лесных духов', mp: 24, def: 2, price: 220, desc: 'Шепчет в тишине.' },
  { id: 'c_amulet', type: 'charm', tier: 3, name: 'Амулет Элоизы', hp: 30, mp: 20, price: 0, desc: 'Старинная семейная реликвия.' },
  { id: 'c_scholar', type: 'charm', tier: 3, name: 'Печать Коллегии', mp: 36, crit: 0.03, price: 540, desc: 'Знак допуска. Работает и как оберег.' },
  { id: 'c_gladiator', type: 'charm', tier: 4, name: 'Кольцо чемпиона', atk: 8, hp: 40, price: 0, desc: 'Тяжёлое, как приговор.' },
  // реликвии богов (награды за их задания)
  { id: 'c_lyara', type: 'charm', tier: 4, name: 'Свеча Лиары', hp: 60, mp: 20, price: 0, desc: 'Горит, не сгорая. Согревает, когда тебе плохо.' },
  { id: 'c_torn', type: 'charm', tier: 4, name: 'Печать Торна', def: 8, hp: 30, price: 0, desc: 'Холодная и точная, как приговор.' },
  { id: 'c_ori', type: 'charm', tier: 4, name: 'Закладка Ори', mp: 50, crit: 0.03, price: 0, desc: 'Помнит страницу, которую ты не дочитал.' },
  { id: 'c_seyr', type: 'charm', tier: 4, name: 'Монета Сейра', crit: 0.06, atk: 4, price: 0, desc: 'Падает так, как нужно тебе. Обычно.' },
  { id: 'c_mara', type: 'charm', tier: 4, name: 'Росток Мары', hp: 90, price: 0, desc: 'Пробивается сквозь ладонь.' },
  { id: 'c_kharn', type: 'charm', tier: 4, name: 'Осколок клинка Кхарна', atk: 10, price: 0, desc: 'Острый со всех сторон, в том числе с той, что в руке.' },
  { id: 'c_issa', type: 'charm', tier: 4, name: 'Осколок маски Иссы', crit: 0.10, price: 0, desc: 'Улыбается, когда ты не смотришь.' },
  { id: 'c_old', type: 'charm', tier: 5, name: 'Слеза Прежнего', atk: 8, hp: 80, mp: 40, crit: 0.05, price: 0, desc: 'Тяжёлая капля чужой силы.' },
  // зелья
  { id: 'p_hp1', type: 'potion', name: 'Малое зелье лечения', heal: 50, price: 25, desc: 'Восстанавливает 50 здоровья.' },
  { id: 'p_hp2', type: 'potion', name: 'Зелье лечения', heal: 120, price: 70, desc: 'Восстанавливает 120 здоровья.' },
  { id: 'p_hp3', type: 'potion', name: 'Большое зелье лечения', heal: 260, price: 160, desc: 'Восстанавливает 260 здоровья.' },
  { id: 'p_mp1', type: 'potion', name: 'Малое зелье маны', mana: 40, price: 25, desc: 'Восстанавливает 40 маны.' },
  { id: 'p_mp2', type: 'potion', name: 'Зелье маны', mana: 90, price: 70, desc: 'Восстанавливает 90 маны.' },
  { id: 'p_mp3', type: 'potion', name: 'Большое зелье маны', mana: 180, price: 160, desc: 'Восстанавливает 180 маны.' },
  // квестовые
  { id: 'q_pelt', type: 'quest', name: 'Волчья шкура', price: 8, desc: 'Плотная и тёплая.' },
  { id: 'q_silk', type: 'quest', name: 'Паучий шёлк', price: 8, desc: 'Прочнее верёвки.' },
  { id: 'q_flower', type: 'quest', name: 'Лунный цветок', price: 6, desc: 'Светится в сумерках.' },
  { id: 'q_amulet', type: 'quest', name: 'Семейный амулет (находка)', price: 0, desc: 'Мокрый, но целый.' },
  { id: 'q_moss', type: 'quest', name: 'Болотный мох', price: 0, desc: 'Пахнет железом и дождём.' },
  { id: 'q_tear', type: 'quest', name: 'Слеза рассвета', price: 0, desc: 'Роса из родника, который никогда не замерзает.' },
  { id: 'q_cure', type: 'quest', name: 'Лекарство Хеспер', price: 0, desc: 'Мутное, горькое, настоящее.' },
  { id: 'q_core', type: 'quest', name: 'Сердце маяка', price: 0, desc: 'Тяжёлый кристалл, который молчит.' },
  { id: 'q_core2', type: 'quest', name: 'Сердце маяка II', price: 0, desc: 'Холодный кристалл из городских стоков.' },
  { id: 'q_core3', type: 'quest', name: 'Сердце маяка III', price: 0, desc: 'Кристалл из Хранилища. Тёплый.' },
  { id: 'q_letter', type: 'quest', name: 'Письмо Орвена', price: 0, desc: 'Запечатано воском без герба.' },
  { id: 'q_pass', type: 'quest', name: 'Пропуск Совета', price: 0, desc: 'Позволяет проходить на перевал.' },
  { id: 'q_beaconmap', type: 'quest', name: 'Карта маяков', price: 0, desc: 'Семь точек и ни одной подписи.' },
  { id: 'q_sample', type: 'quest', name: 'Проба излучения', price: 0, desc: 'Склянка тихо гудит.' },
  { id: 'q_vaultkey', type: 'quest', name: 'Ключ Хранилища', price: 0, desc: 'Не ржавеет. Не нагревается. Не помнит руки.' },
  { id: 'q_proof', type: 'quest', name: 'Свидетельство', price: 0, desc: 'Записи о том, кем были боги до того, как стали богами.' },
  { id: 'q_gate1', type: 'quest', name: 'Первый ключ врат', price: 0, desc: 'Часть ключа Цитадели.' },
  { id: 'q_gate2', type: 'quest', name: 'Второй ключ врат', price: 0, desc: 'Часть ключа Цитадели.' },
  { id: 'q_book', type: 'quest', name: 'Книга без автора', price: 0, desc: 'Страницы шевелятся, когда на них не смотришь.' },
  { id: 'q_mask', type: 'quest', name: 'Чужое лицо', price: 0, desc: 'Маска, которая подстраивается под владельца.' },
  { id: 'q_ledger', type: 'quest', name: 'Караванная книга', price: 0, desc: 'Цифры в ней не сходятся.' },
]);
// Лики: артефакты прежней эпохи, позволяющие на время стать аватаром бога
for (const [id, name] of [['lyara', 'Милосердия'], ['torn', 'Закона'], ['ori', 'Памяти'], ['seyr', 'Удачи'], ['mara', 'Чащи'], ['kharn', 'Войны'], ['issa', 'Лжи']]) {
  put([{ id: `lik_${id}`, type: 'lik', god: id, name: `Лик ${name}`, price: 0, desc: 'Артефакт прежней эпохи. Надень его, и на время бог заговорит твоими руками.' }]);
}

// торговцы: tiers — ступени снаряжения для класса игрока, items — фиксированный ассортимент
export const SHOPS = {
  smith: { name: 'Кузница', tiers: [2] },
  village_general: { name: 'Лавка', items: ['p_hp1', 'p_hp2', 'p_mp1', 'p_mp2', 'c_copper', 'c_wolf', 'c_spirit'] },
  armory: { name: 'Оружейная', tiers: [3] },
  college: { name: 'Лавка Коллегии', items: ['p_hp2', 'p_mp2', 'p_mp3', 'c_scholar', 'c_spirit'] },
  market: { name: 'Рынок', items: ['p_hp2', 'p_hp3', 'p_mp2', 'p_mp3', 'c_wolf'] },
  forge: { name: 'Кузня', tiers: [4] },
  harbor: { name: 'Портовая лавка', items: ['p_hp3', 'p_mp3', 'p_hp2', 'p_mp2'] },
};

// ---------------------------------------------------------------- враги
// hp/atk даны для первого уровня, дальше масштабируются по lvl (см. world.js).
// look: { c: креатура } или { h: человек }; tint — перекраска, scale — масштаб спрайта.
export const ENEMIES = {
  slime: { name: 'Слизень', ai: 'melee', hp: 22, atk: 5, spd: 28, r: 5, xp: 8, gold: [1, 3], aggro: 70, wind: 0.45, reach: 11, color: '#6ccf5a', hop: true, look: { c: 'slime' } },
  bogling: { name: 'Болотник', ai: 'melee', hp: 30, atk: 7, spd: 24, r: 5, xp: 12, gold: [1, 4], aggro: 70, wind: 0.5, reach: 11, color: '#8a7a3a', hop: true, look: { c: 'slime', tint: '#9a8a48' } },
  wolf: { name: 'Волк', ai: 'charger', hp: 30, atk: 8, spd: 52, r: 5, xp: 14, gold: [1, 4], aggro: 100, wind: 0.5, reach: 12, lunge: 120, drops: [['q_pelt', 0.5]], look: { c: 'wolf' } },
  goblin: { name: 'Гоблин', ai: 'melee', hp: 34, atk: 9, spd: 36, r: 5, xp: 17, gold: [2, 6], aggro: 90, wind: 0.5, reach: 14, look: { h: 'goblin' } },
  goblinArcher: { name: 'Гоблин-лучник', ai: 'ranged', hp: 24, atk: 8, spd: 32, r: 5, xp: 18, gold: [2, 6], aggro: 130, wind: 0.65, keep: 70, shot: 'arrow', look: { h: 'goblinArcher' } },
  spider: { name: 'Паук', ai: 'ranged', hp: 28, atk: 7, spd: 42, r: 5, xp: 20, gold: [1, 5], aggro: 100, wind: 0.6, keep: 52, shot: 'web', drops: [['q_silk', 0.5]], look: { c: 'spider' } },
  bandit: { name: 'Разбойник', ai: 'melee', hp: 44, atk: 11, spd: 44, r: 5, xp: 26, gold: [4, 10], aggro: 100, wind: 0.4, reach: 14, look: { h: 'bandit' } },
  bat: { name: 'Летучая мышь', ai: 'flier', hp: 20, atk: 7, spd: 70, r: 4, xp: 14, gold: [0, 3], aggro: 110, wind: 0.2, reach: 10, look: { c: 'bat' } },
  echoMiner: { name: 'Искажённый шахтёр', ai: 'melee', hp: 48, atk: 9, spd: 28, r: 5, xp: 22, gold: [0, 4], aggro: 80, wind: 0.6, reach: 14, echo: true, look: { h: 'echoMiner' } },
  sewerSlime: { name: 'Стоковая слизь', ai: 'melee', hp: 40, atk: 10, spd: 28, r: 5, xp: 22, gold: [1, 5], aggro: 70, wind: 0.5, reach: 11, hop: true, look: { c: 'slime', tint: '#5a9a9a' } },
  echoVagrant: { name: 'Искажённый бродяга', ai: 'melee', hp: 56, atk: 12, spd: 36, r: 5, xp: 28, gold: [1, 6], aggro: 90, wind: 0.55, reach: 14, echo: true, look: { h: 'echoVagrant' } },
  thug: { name: 'Головорез', ai: 'melee', hp: 60, atk: 13, spd: 46, r: 5, xp: 30, gold: [5, 12], aggro: 100, wind: 0.4, reach: 14, look: { h: 'thug' } },
  hunter: { name: 'Охотник Совета', ai: 'ranged', hp: 44, atk: 13, spd: 36, r: 5, xp: 32, gold: [4, 10], aggro: 140, wind: 0.6, keep: 82, shot: 'arrow', look: { h: 'hunter' } },
  echoSoldier: { name: 'Эхо-солдат', ai: 'melee', hp: 90, atk: 17, spd: 34, r: 6, xp: 40, gold: [4, 10], aggro: 100, wind: 0.5, reach: 16, echo: true, look: { h: 'echoSoldier' } },
  echoArcher: { name: 'Эхо-лучник', ai: 'ranged', hp: 60, atk: 16, spd: 32, r: 5, xp: 40, gold: [4, 10], aggro: 150, wind: 0.65, keep: 85, shot: 'arrow', echo: true, look: { h: 'echoArcher' } },
  echoBrute: { name: 'Эхо-великан', ai: 'melee', hp: 190, atk: 26, spd: 28, r: 8, xp: 70, gold: [8, 18], aggro: 90, wind: 0.8, reach: 20, echo: true, look: { h: 'echoBrute', scale: 1.35 } },
  wraith: { name: 'Призрачное эхо', ai: 'ranged', hp: 46, atk: 15, spd: 30, r: 5, xp: 40, gold: [4, 10], aggro: 140, wind: 0.7, keep: 80, shot: 'orb', float: true, echo: true, look: { c: 'wraith' } },
  iceWolf: { name: 'Ледяной волк', ai: 'charger', hp: 70, atk: 18, spd: 56, r: 5, xp: 42, gold: [2, 8], aggro: 110, wind: 0.5, reach: 12, lunge: 130, look: { c: 'wolf', tint: '#a8d4f4' } },
  sentinel: { name: 'Страж бастиона', ai: 'melee', hp: 140, atk: 24, spd: 28, r: 6, xp: 56, gold: [6, 14], aggro: 90, wind: 0.7, reach: 17, look: { h: 'sentinel' } },
  gladiator: { name: 'Гладиатор', ai: 'melee', hp: 100, atk: 22, spd: 50, r: 5, xp: 52, gold: [8, 16], aggro: 110, wind: 0.4, reach: 15, look: { h: 'gladiator' } },
  harpy: { name: 'Гарпия', ai: 'flier', hp: 60, atk: 20, spd: 76, r: 5, xp: 46, gold: [2, 8], aggro: 120, wind: 0.2, reach: 11, look: { c: 'bat', tint: '#e0a8a8', scale: 1.3 } },
  smuggler: { name: 'Контрабандист', ai: 'melee', hp: 90, atk: 24, spd: 44, r: 5, xp: 54, gold: [10, 22], aggro: 100, wind: 0.4, reach: 14, look: { h: 'smuggler' } },
  crab: { name: 'Береговой краб', ai: 'melee', hp: 110, atk: 25, spd: 30, r: 6, xp: 55, gold: [4, 10], aggro: 70, wind: 0.5, reach: 13, hop: true, look: { c: 'slime', tint: '#d0704a' } },
  drowned: { name: 'Утопленник', ai: 'ranged', hp: 100, atk: 26, spd: 30, r: 5, xp: 58, gold: [6, 14], aggro: 140, wind: 0.7, keep: 80, shot: 'orb', float: true, echo: true, look: { c: 'wraith', tint: '#70b0b0' } },
  warden: { name: 'Эхо-страж', ai: 'melee', hp: 150, atk: 34, spd: 38, r: 6, xp: 80, gold: [10, 22], aggro: 100, wind: 0.5, reach: 16, echo: true, look: { h: 'husk' } },
  spitter: { name: 'Эхо-плевун', ai: 'ranged', hp: 110, atk: 32, spd: 30, r: 6, xp: 82, gold: [10, 22], aggro: 140, wind: 0.65, keep: 76, shot: 'blight', echo: true, look: { c: 'spitter' } },
  // миниботы и звери из квестов богов
  grovebeast: { name: 'Хранитель рощи', ai: 'charger', hp: 260, atk: 30, spd: 54, r: 8, xp: 120, gold: [20, 40], aggro: 120, wind: 0.6, reach: 16, lunge: 150, look: { c: 'wolf', tint: '#70c070', scale: 1.7 } },
  champion: { name: 'Чемпион арены', ai: 'boss_captain', boss: true, hp: 500, atk: 28, spd: 54, r: 7, xp: 260, gold: [60, 90], aggro: 160, title: 'Чемпион арены', look: { h: 'gladiator', scale: 1.25 } },
  // боссы
  chieftain: { name: 'Грок, вождь гоблинов', ai: 'boss_chief', boss: true, hp: 380, atk: 16, spd: 34, r: 9, xp: 160, gold: [40, 60], aggro: 150, drops: [['q_core', 1]], title: 'Грок, вождь гоблинов', look: { c: 'chieftain' } },
  ragged: { name: 'Рваный Альд', ai: 'boss_captain', boss: true, hp: 320, atk: 18, spd: 52, r: 6, xp: 180, gold: [50, 80], aggro: 150, title: 'Рваный Альд, главарь бандитов', look: { h: 'captain' } },
  mother: { name: 'Мать Стоков', ai: 'boss_mother', boss: true, hp: 700, atk: 20, spd: 30, r: 10, xp: 360, gold: [70, 100], aggro: 170, drops: [['q_core2', 1], ['q_sample', 1]], title: 'Мать Стоков', look: { c: 'spitter', scale: 1.9, tint: '#6aa8a0' } },
  gatekeeper: { name: 'Привратник Меры', ai: 'boss_king', boss: true, hp: 1100, atk: 30, spd: 36, r: 9, xp: 640, gold: [120, 160], aggro: 190, drops: [['q_core3', 1], ['q_proof', 1]], minion: 'echoSoldier', title: 'Привратник Меры', look: { c: 'king' } },
  oldone: { name: 'Последний Прежний', ai: 'boss_lord', boss: true, hp: 2600, atk: 42, spd: 40, r: 11, xp: 2000, gold: [300, 300], aggro: 220, title: 'Последний Прежний', look: { c: 'lord', tint: '#e8d8a8' } },
};

// ---------------------------------------------------------------- области
// loc — номер локации; music — тема музыки; dark — подземелье с освещением
export const AREAS = {
  village: { id: 'village', loc: 1, name: 'Тихий Брод', sub: 'Деревня у реки', theme: 'village', music: 'village' },
  mine1: { id: 'mine1', loc: 1, name: 'Старая шахта', sub: 'Верхний уровень', theme: 'mine', music: 'crypt', dark: 0.34 },
  mine2: { id: 'mine2', loc: 1, name: 'Старая шахта', sub: 'Средний уровень', theme: 'mine', music: 'crypt', dark: 0.42 },
  mine3: { id: 'mine3', loc: 1, name: 'Старая шахта', sub: 'Нижний уровень', theme: 'mine', music: 'crypt', dark: 0.5 },
  darkforest: { id: 'darkforest', loc: 1, name: 'Шёпотный лес', sub: 'Здесь шепчут даже деревья', theme: 'forest', music: 'forest' },
  swamp: { id: 'swamp', loc: 1, name: 'Топи Тихой Воды', sub: 'Вода здесь помнит больше людей', theme: 'swamp', music: 'forest' },
  lightforest: { id: 'lightforest', loc: 1, name: 'Светлая роща', sub: 'Единственное место без шёпота', theme: 'lightforest', music: 'village' },
  city_market: { id: 'city_market', loc: 2, name: 'Каменный Мост', sub: 'Рыночная площадь', theme: 'city', music: 'city' },
  city_low: { id: 'city_low', loc: 2, name: 'Нижний город', sub: 'Здесь не задают вопросов', theme: 'city', music: 'city' },
  city_college: { id: 'city_college', loc: 2, name: 'Квартал Коллегии', sub: 'Тихие улицы и острые языки', theme: 'city', music: 'city' },
  city_temple: { id: 'city_temple', loc: 2, name: 'Храм Семи', sub: 'Семь алтарей, один зал', theme: 'temple', music: 'crypt', dark: 0.3 },
  sewers: { id: 'sewers', loc: 2, name: 'Стоки', sub: 'Под городом слышно, как дышит камень', theme: 'sewer', music: 'crypt', dark: 0.42 },
  valley_fields: { id: 'valley_fields', loc: 3, name: 'Долина Былых Сражений', sub: 'Поля, которые так и не остыли', theme: 'valley', music: 'forest' },
  vault1: { id: 'vault1', loc: 3, name: 'Хранилище Меры', sub: 'Верхний зал', theme: 'vault', music: 'crypt', dark: 0.42 },
  vault2: { id: 'vault2', loc: 3, name: 'Хранилище Меры', sub: 'Нижний зал', theme: 'vault', music: 'crypt', dark: 0.48 },
  abbey: { id: 'abbey', loc: 3, name: 'Аббатство Безмолвных', sub: 'Здесь жили те, кто умел забывать', theme: 'abbey', music: 'crypt', dark: 0.3 },
  valley_pass: { id: 'valley_pass', loc: 3, name: 'Перевал Двух Дорог', sub: 'Отсюда видно, куда ведёт каждая', theme: 'pass', music: 'forest' },
  bastion: { id: 'bastion', loc: 4, name: 'Бастион Торна', sub: 'Закон высечен в стене', theme: 'bastion', music: 'city' },
  arena: { id: 'arena', loc: 4, name: 'Арена Кхарна', sub: 'Песок помнит каждого', theme: 'arena', music: 'boss' },
  grove: { id: 'grove', loc: 4, name: 'Роща Мары', sub: 'Деревья растут быстрее, чем падают', theme: 'grove', music: 'village' },
  glacier: { id: 'glacier', loc: 4, name: 'Ледник', sub: 'Холод давно не против', theme: 'glacier', music: 'forest' },
  harbor: { id: 'harbor', loc: 5, name: 'Порт Серой Воды', sub: 'Корабли приходят, но уходят не все', theme: 'harbor', music: 'city' },
  lighthouse: { id: 'lighthouse', loc: 5, name: 'Маяк-библиотека', sub: 'Свет здесь нужен, чтобы читать', theme: 'library', music: 'crypt', dark: 0.3 },
  clinic: { id: 'clinic', loc: 5, name: 'Лечебница Лиары', sub: 'Тишина и запах трав', theme: 'clinic', music: 'village' },
  den: { id: 'den', loc: 5, name: 'Игорный дом', sub: 'Все ставки приняты', theme: 'den', music: 'city', dark: 0.28 },
  citadel_gate: { id: 'citadel_gate', loc: 6, name: 'Врата Цитадели', sub: 'Здесь никто не ждёт гостей', theme: 'citadel', music: 'citadel', dark: 0.4 },
  throne_hall: { id: 'throne_hall', loc: 6, name: 'Зал Семи Тронов', sub: 'Семь кресел, одно из них тёплое', theme: 'citadel', music: 'citadel', dark: 0.4 },
  crypt_old: { id: 'crypt_old', loc: 6, name: 'Склеп Прежних', sub: 'Так выглядят боги, когда их больше нет', theme: 'citadel', music: 'crypt', dark: 0.46 },
  last_throne: { id: 'last_throne', loc: 6, name: 'Последний Трон', sub: 'У него нет имени', theme: 'citadel', music: 'boss', dark: 0.4 },
};
export const LOCATIONS = {
  1: 'Тихий Брод и окрестности', 2: 'Каменный Мост', 3: 'Долина Былых Сражений', 4: 'Горный край', 5: 'Побережье', 6: 'Цитадель',
};

export const DIRS8 = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];
