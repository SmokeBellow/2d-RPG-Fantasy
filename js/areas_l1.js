// Локация 1: Тихий Брод и окрестности. Деревня, шахта (3 этажа), тёмный лес, болото, светлая роща.
import { Builder } from './maps_core.js';
import { T } from './defs.js';

// ======================================================================= ТИХИЙ БРОД
export function village() {
  const b = new Builder('village', 64, 44, 11);
  b.spawn = { x: 32, y: 25 };

  // озеро на юге и пруд
  b.blob(32, 46, 34, 5.5, T.WATER, false, 0.2);
  b.blob(32, 47, 30, 3.2, T.DEEP, false, 0.2);
  b.blob(10, 34, 4.5, 3.5, T.WATER, true, 0.2);
  b.blob(10, 34, 2.6, 1.8, T.DEEP, false, 0.2);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) {
    if (b.get(i, j) !== T.GRASS) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (b.get(i + dx, j + dy) === T.WATER) { b.set(i, j, T.SAND); b.reserve(i, j, 1, 1, 0); break; }
  }

  // площадь и дороги
  b.disc(32, 22, 7, T.PLAZA);
  b.path([[32, 15], [32, 3]], 3, T.DIRT);                // на север: тёмный лес
  b.path([[39, 22], [51, 22], [61, 22]], 3, T.DIRT);     // на восток: луг и светлая роща
  b.path([[25, 22], [20, 24], [8, 22]], 2, T.DIRT);      // на запад: шахта
  b.path([[28, 16], [19, 14]], 2, T.DIRT);
  b.path([[36, 18], [46, 15]], 2, T.DIRT);
  b.path([[30, 28], [22, 34], [8, 38], [3, 38]], 2, T.DIRT);   // на юго-запад: топи
  b.path([[36, 28], [48, 27]], 2, T.DIRT);
  b.blob(56, 24, 6, 11, T.GRASS, true, 0.3);             // луг со слизью
  b.rect(1, 36, 5, 4, T.GRASS, true);                    // подход к топям
  b.rect(6, 19, 4, 6, T.GRASS, true);                    // подход к шахте

  // здания
  b.prop('hut', 14, 10, { sprite: 'elder' });
  b.prop('smithy', 12, 22);
  b.prop('anvil', 18, 25);
  b.prop('tavern', 42, 10);
  b.prop('hut', 46, 23, { sprite: 'herb' });
  b.prop('house', 21, 31);
  b.prop('house', 38, 32);
  b.prop('stall', 25, 16);
  b.prop('well', 36, 24);
  b.prop('beacon', 36, 9, { id: 'beacon', use: 'beacon', beacon: 1 });
  b.prop('shrine', 31, 26, { id: 'shrine_village', use: 'shrine', name: 'Деревенский алтарь' });
  b.prop('barrel', 20, 25); b.prop('barrel', 19, 27); b.prop('crate', 47, 14); b.prop('barrel', 48, 14);
  b.prop('sign', 34, 6, { use: 'sign', text: 'Север: Шёпотный лес и дорога на Каменный Мост. Дозор не выходит за черту после заката. Не спрашивайте почему.' });
  b.prop('sign', 50, 21, { use: 'sign', text: 'Восточный луг. После Серой зимы земля здесь не родит. Слизь выходит из неё сама.' });
  b.prop('sign', 9, 21, { use: 'sign', text: 'Шахта закрыта до выяснения. — Совет Тихого Брода. (Кто-то зачеркнул «до выяснения».)' });
  b.prop('sign', 5, 36, { use: 'sign', text: 'Топи Тихой Воды. Тропа по доскам. Сходить с досок не рекомендуется.' });
  b.prop('statue', 29, 6);
  b.prop('cart', 24, 25);
  b.prop('stairs', 6, 21, { id: 'mine_entrance' });   // вход в шахту

  // NPC
  b.npc('orwen', 17, 14);
  b.npc('torvald', 15, 26);
  b.npc('bom', 45, 14);
  b.npc('lissa', 49, 27);
  b.npc('mira', 26, 19);
  b.npc('garth', 30, 5);
  b.npc('tim', 27, 29);
  b.npc('ren', 8, 23);
  b.npc('tobias', 9, 25, { showIf: 'tobias_cured' });

  // слизь на лугу
  for (const [x, y] of [[53, 15], [58, 17], [54, 20], [58, 25], [54, 29], [58, 31], [55, 35]]) b.enemy('slime', x, y, 1);

  b.chest('v_chest1', 8, 20, [['gold', 40], ['p_hp1', 2]]);
  b.chest('v_chest2', 60, 38, [['gold', 55], ['p_mp1', 2]]);
  b.reserve(7, 19, 3, 3, 1); b.reserve(59, 37, 3, 3, 1);

  b.zone('beacon_area', 34, 11, 7, 5);
  b.portal('to_darkforest', 31, 1, 3, 2, 'darkforest', { x: 47.5, y: 66.5 });
  b.portal('to_lightforest', 61, 21, 2, 3, 'lightforest', { x: 3.5, y: 22.5 });
  b.portal('to_mine', 6, 21, 2, 1, 'mine1', { x: 7.5, y: 31.5 });
  b.portal('to_swamp', 1, 37, 2, 3, 'swamp', { x: 32.5, y: 5.5 });

  b.border(3, T.TREE);
  b.forest(0.58, 0.14, 5);
  b.litter('bush', 26, 4);
  b.litter('boulder', 8, 6);
  return b.finish();
}

// ======================================================================= ШАХТА (3 этажа)
const mineProps = (b, area) => {
  for (const [x, y, w, h] of area) {
    b.scatter('beam', 4, x, y, w, h);
    b.scatter('barrel', 2, x, y, w, h);
    b.scatter('crate', 2, x, y, w, h);
    b.scatter('boulder', 3, x, y, w, h);
  }
};

export function mine1() {
  const b = new Builder('mine1', 48, 36, 71, T.CWALL);
  b.spawn = { x: 7, y: 31 };
  const F = T.CRYPT;
  b.room(3, 26, 10, 7, F);                 // вход
  b.corridor(12, 29, 22, 24, 3, F);
  b.room(18, 17, 14, 11, F);               // каверна A
  b.corridor(25, 17, 25, 11, 3, F);
  b.room(18, 3, 14, 9, F);                 // зал B
  b.corridor(31, 8, 38, 13, 3, F);
  b.room(34, 10, 10, 10, F);               // зал C
  b.corridor(6, 26, 6, 17, 3, F);
  b.room(3, 9, 9, 9, F);                   // боковая выработка
  mineProps(b, [[4, 27, 8, 5], [19, 18, 12, 9], [19, 4, 12, 7], [35, 11, 8, 8], [4, 10, 7, 7]]);
  b.prop('brazier', 5, 27); b.prop('brazier', 11, 27); b.prop('brazier', 27, 5);
  b.prop('cart', 22, 14, { deco: true });
  b.prop('stairs', 6, 32, { id: 'up1' });
  b.prop('stairs', 39, 12, { id: 'down1' });
  b.prop('sign', 14, 28, { use: 'sign', text: 'СМЕНА 2. Не заходить в левый штрек: там шумно. — Брана' });
  b.prop('shrine', 20, 5, { id: 'shrine_mine1', use: 'shrine', name: 'Шахтёрский алтарь' });

  for (const [x, y] of [[22, 23], [27, 20]]) b.enemy('bat', x, y, 3);
  for (const [x, y] of [[24, 8], [28, 6]]) b.enemy('bat', x, y, 3);
  for (const [x, y] of [[8, 12], [9, 16]]) b.enemy('echoMiner', x, y, 3);
  b.enemy('echoMiner', 40, 16, 4);
  b.chest('m1_chest', 40, 18, [['gold', 45], ['p_hp1', 2]]);
  b.chest('m1_chest2', 5, 10, [['gold', 30], ['p_mp1', 2]]);

  b.portal('mine1_up', 6, 32, 2, 1, 'village', { x: 7.5, y: 22.8 });
  b.portal('mine1_down', 39, 12, 2, 1, 'mine2', { x: 7.5, y: 6.5 });
  return b.finish();
}

export function mine2() {
  const b = new Builder('mine2', 48, 36, 72, T.CWALL);
  b.spawn = { x: 7, y: 8 };
  const F = T.CRYPT;
  b.room(3, 4, 9, 9, F);                   // приёмная: лагерь шахтёров
  b.corridor(11, 8, 20, 14, 3, F);
  b.room(16, 10, 14, 11, F);               // хаб
  b.corridor(23, 20, 23, 28, 3, F);
  b.room(17, 27, 12, 7, F);                // южный зал
  b.corridor(29, 14, 35, 14, 3, F);
  b.room(34, 7, 11, 14, F);                // восточный зал
  b.corridor(16, 14, 8, 20, 3, F, true);
  b.room(3, 18, 10, 9, F);                 // западная выработка
  mineProps(b, [[17, 11, 12, 9], [18, 28, 10, 5], [35, 8, 9, 12], [4, 19, 8, 7]]);
  b.prop('campfire', 6, 7); b.prop('tent', 8, 9); b.prop('crate', 4, 10); b.prop('barrel', 10, 6);
  b.prop('brazier', 18, 11); b.prop('brazier', 28, 11);
  b.prop('stairs', 6, 4, { id: 'up2' });
  b.prop('stairs', 40, 8, { id: 'down2' });
  b.prop('shrine', 21, 12, { id: 'shrine_mine2', use: 'shrine', name: 'Шахтёрский алтарь' });
  b.npc('brana2', 7, 8);
  b.npc('miner_a', 5, 9);

  for (const [x, y] of [[19, 15], [26, 17], [22, 13]]) b.enemy('goblin', x, y, 4);
  for (const [x, y] of [[20, 31], [26, 30]]) b.enemy('goblin', x, y, 4);
  b.enemy('goblinArcher', 28, 12, 4); b.enemy('goblinArcher', 25, 32, 4);
  for (const [x, y] of [[38, 12], [41, 17], [37, 16]]) b.enemy('echoMiner', x, y, 5);
  for (const [x, y] of [[7, 22], [9, 24]]) b.enemy('echoMiner', x, y, 4);
  for (const [x, y] of [[32, 14], [19, 21]]) b.enemy('bat', x, y, 4);
  b.chest('m2_chest', 41, 19, [['gold', 70], ['p_hp2', 1], ['@armor2', 1]]);
  b.chest('m2_chest2', 10, 25, [['gold', 40], ['p_mp1', 2]]);
  b.chest('m2_chest3', 27, 33, [['gold', 55], ['c_copper', 1]]);

  b.portal('mine2_up', 6, 4, 2, 1, 'mine1', { x: 39.5, y: 14.5 });
  b.portal('mine2_down', 40, 8, 2, 1, 'mine3', { x: 7.5, y: 30.5 });
  b.zone('mine2_camp', 3, 4, 9, 9);
  return b.finish();
}

export function mine3() {
  const b = new Builder('mine3', 48, 36, 73, T.CWALL);
  b.spawn = { x: 7, y: 30 };
  const F = T.CRYPT;
  b.room(3, 26, 9, 7, F);                  // вход
  b.corridor(11, 29, 16, 22, 3, F);
  b.room(10, 15, 9, 9, F);                 // «палата» Тобиаса
  b.corridor(18, 19, 24, 16, 3, F);
  b.room(22, 6, 22, 21, F);                // зал Грока
  b.corridor(24, 27, 14, 31, 3, F);
  b.room(10, 30, 8, 4, F);
  b.scatter('beam', 4, 23, 7, 20, 19); b.scatter('crate', 3, 23, 7, 20, 19); b.scatter('barrel', 3, 23, 7, 20, 19);
  b.prop('campfire', 33, 18); b.prop('tent', 38, 9); b.prop('tent', 27, 20); b.prop('tent', 38, 20);
  b.prop('brazier', 24, 8); b.prop('brazier', 42, 8);
  b.prop('stairs', 6, 32, { id: 'up3' });
  b.prop('sign', 8, 28, { use: 'sign', text: 'Ниже нас никого нет. — Надпись шахтёров. Ниже неё кто-то нацарапал: «Есть».' });
  b.prop('shrine', 13, 17, { id: 'shrine_mine3', use: 'shrine', name: 'Шахтёрский алтарь' });
  b.npc('tobias_echo', 14, 20, { hideIf: ['tobias_cured', 'k_tobias_echo'] });
  b.npc('grok', 33, 14, { hideIf: 'grok_done' });
  b.enemy('goblin', 28, 12, 5, { hideIf: 'grok_peace' }); b.enemy('goblin', 38, 14, 5, { hideIf: 'grok_peace' });
  b.enemy('goblinArcher', 30, 22, 5, { hideIf: 'grok_peace' }); b.enemy('goblinArcher', 40, 22, 5, { hideIf: 'grok_peace' });
  for (const [x, y] of [[13, 29], [15, 32]]) b.enemy('echoMiner', x, y, 5);
  b.enemy('spider', 20, 25, 5); b.enemy('spider', 16, 31, 5);
  b.chest('m3_chest', 42, 24, [['gold', 90], ['c_spirit', 1]]);
  b.portal('mine3_up', 6, 32, 2, 1, 'mine2', { x: 40.5, y: 9.5 });
  b.zone('grok_hall', 22, 6, 22, 21);
  return b.finish();
}

// ======================================================================= ТЁМНЫЙ ЛЕС
export function darkforest() {
  const b = new Builder('darkforest', 96, 72, 23);
  b.spawn = { x: 47, y: 66 };

  b.blob(47, 57, 9, 6, T.GRASS, true);                   // стартовая поляна
  b.blob(47, 38, 11, 7.5, T.WATER, false, 0.18);
  b.blob(47, 38, 8, 5, T.DEEP, false, 0.18);
  b.blob(24, 40, 11, 8.5, T.GRASS, true);                // лагерь бандитов
  b.blob(76, 40, 11, 9, T.GRASS, true);                  // приют видящих
  b.blob(47, 18, 8, 6, T.GRASS, true);                   // святилище
  b.blob(17, 15, 8, 6, T.GRASS, true);                   // паучья чаща
  b.blob(84, 62, 6, 5, T.GRASS, true);                   // волчья поляна
  b.blob(15, 61, 7, 5, T.GRASS, true);
  b.blob(60, 63, 4, 3, T.GRASS, true);
  b.blob(33, 63, 4, 3, T.GRASS, true);
  b.blob(47, 6, 6, 4, T.GRASS, true);                    // северные ворота

  b.path([[47, 69], [47, 62], [47, 57]], 2.4, T.DIRT);
  b.path([[44, 57], [34, 52], [28, 47]], 2.4, T.DIRT);
  b.path([[50, 57], [60, 52], [68, 46]], 2.4, T.DIRT);
  b.path([[27, 33], [29, 26], [38, 21], [44, 19]], 2.4, T.DIRT);
  b.path([[72, 31], [66, 25], [56, 20], [51, 19]], 2.4, T.DIRT);
  b.path([[47, 14], [47, 8]], 3, T.DIRT);
  b.path([[27, 33], [20, 20], [17, 15]], 2, T.DIRT);
  b.path([[56, 58], [70, 60], [82, 62]], 2, T.DIRT);
  b.path([[40, 58], [26, 60], [16, 61]], 2, T.DIRT);
  b.path([[50, 59], [60, 63]], 2, T.DIRT);
  b.path([[44, 59], [33, 63]], 2, T.DIRT);

  b.disc(47, 37, 2.5, T.SAND, true);
  b.path([[47, 44], [47, 40]], 2, T.BRIDGE, true);
  b.chest('f_island', 47, 37, [['q_amulet', 1]]);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) {
    if (b.get(i, j) !== T.GRASS) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (b.get(i + dx, j + dy) === T.WATER) { b.set(i, j, T.SAND); b.reserve(i, j, 1, 1, 1); break; }
  }

  b.prop('shrine', 46, 17, { id: 'shrine_forest', use: 'shrine', name: 'Лесной алтарь' });
  b.prop('obelisk', 42, 14, { use: 'sign', text: 'Камень старше леса. Надпись стёрта, остался только край: «…помни, что…». Дальше скол.' });
  b.prop('obelisk', 52, 14, { use: 'sign', text: 'На камне вырезан круг с семью точками. Одна точка выбита целиком.' });
  b.prop('sign', 49, 63, { use: 'sign', text: '← Волчьи тропы. Не заходить без меча.' });
  b.prop('sign', 44, 62, { use: 'sign', text: 'Тихий Брод — на юге.' });
  b.prop('gate', 45, 4, { id: 'citygate' });
  b.prop('sign', 49, 9, { use: 'sign', text: 'Каменный Мост: два дня пути. Не сходите с дороги и не отвечайте, если зовут по имени.' });
  b.portal('to_city', 45, 5, 4, 1, 'city_market', { x: 32.5, y: 40.5 }, { req: { flag: 'road_open', msg: 'Дорога на север закрыта дозором. Орвен должен дать письмо.' } });
  b.portal('to_village', 46, 70, 4, 1, 'village', { x: 32.5, y: 4.5 });

  // лагерь бандитов (Рваный Альд)
  b.prop('tent', 18, 36); b.prop('tent', 18, 42); b.prop('tent', 31, 45);
  b.prop('campfire', 26, 41); b.prop('crate', 21, 46); b.prop('barrel', 33, 36); b.prop('crate', 22, 33);
  b.prop('sign', 28, 33, { use: 'sign', text: 'ТУТ ПЛАТИТЕ. ИЛИ НЕ ХОДИТЕ. — Альд' });
  b.enemy('ragged', 25, 37, 7, { unique: 'ragged' });
  for (const [x, y] of [[20, 40], [30, 38], [23, 45], [31, 42], [27, 34]]) b.enemy('bandit', x, y, 5);
  b.chest('f_bandit', 17, 40, [['gold', 90], ['c_wolf', 1]]);

  // приют видящих (Волчий Глаз)
  b.prop('tent', 70, 34); b.prop('tent', 83, 36); b.prop('tent', 71, 46); b.prop('campfire', 76, 41);
  b.prop('crate', 80, 45); b.prop('barrel', 69, 40); b.prop('rack', 82, 32);
  b.npc('wolfeye', 74, 38);
  b.npc('miren', 79, 42);
  b.npc('seer_a', 72, 43);
  b.chest('f_refuge', 82, 44, [['gold', 70], ['p_hp2', 1]]);
  b.zone('refuge', 66, 31, 20, 18);

  // звери
  for (const [x, y] of [[41, 56], [53, 54], [47, 53]]) b.enemy('wolf', x, y, 2);
  for (const [x, y] of [[11, 59], [14, 64], [18, 60], [19, 63]]) b.enemy('wolf', x, y, 3);
  for (const [x, y] of [[82, 60], [86, 64], [88, 61]]) b.enemy('wolf', x, y, 4);
  for (const [x, y] of [[13, 13], [20, 12], [15, 18], [21, 17], [11, 16]]) b.enemy('spider', x, y, 5);
  b.chest('f_spider', 10, 11, [['gold', 60], ['p_hp2', 2]]);
  for (const [x, y] of [[40, 22], [54, 22]]) b.enemy('wolf', x, y, 4);
  for (const [x, y] of [[44, 9], [51, 10]]) b.enemy('echoMiner', x, y, 6);

  for (const [id, x, y] of [['mf1', 60, 63], ['mf2', 62, 62], ['mf3', 33, 63], ['mf4', 35, 64], ['mf5', 84, 58], ['mf6', 15, 58], ['mf7', 38, 25]]) b.node(id, 'q_flower', x, y);
  b.zone('shrine_clearing', 42, 14, 10, 8);

  b.border(3, T.TREE);
  b.forest(0.43, 0.13, 9);
  b.litter('bush', 90, 3);
  b.litter('boulder', 30, 5);
  b.litter('stump', 22, 5);
  return b.finish();
}

// ======================================================================= ТОПИ
export function swamp() {
  const b = new Builder('swamp', 64, 56, 81, T.SWAMP);
  b.spawn = { x: 32, y: 5 };
  // сухие острова и доски
  const isle = (cx, cy, rx, ry) => b.blob(cx, cy, rx, ry, T.GRASS, true, 0.35);
  isle(32, 6, 8, 4); isle(14, 20, 7, 5); isle(48, 22, 8, 5); isle(30, 32, 7, 5); isle(12, 42, 6, 5); isle(50, 44, 7, 5); isle(32, 48, 7, 4);
  // вода и трясина
  for (const [cx, cy, rx, ry] of [[24, 16, 5, 3], [38, 14, 5, 3], [30, 24, 5, 3], [44, 34, 5, 3], [20, 32, 4, 3], [24, 40, 4, 3], [42, 50, 4, 3]]) { b.blob(cx, cy, rx, ry, T.WATER, false, 0.3); b.blob(cx, cy, rx - 2, ry - 1.4, T.DEEP, false, 0.3); }
  // доски (тропа)
  b.path([[32, 9], [32, 14], [20, 20], [14, 24]], 1.6, T.BRIDGE, true);
  b.path([[32, 9], [42, 18], [48, 24]], 1.6, T.BRIDGE, true);
  b.path([[20, 22], [28, 30], [30, 34]], 1.6, T.BRIDGE, true);
  b.path([[46, 26], [40, 32], [32, 34]], 1.6, T.BRIDGE, true);
  b.path([[28, 36], [18, 41], [12, 43]], 1.6, T.BRIDGE, true);
  b.path([[34, 36], [44, 42], [50, 44]], 1.6, T.BRIDGE, true);
  b.path([[30, 38], [32, 44], [32, 48]], 1.6, T.BRIDGE, true);

  // хижина Хеспер и руины
  b.prop('hut', 27, 29, { sprite: 'herb' });
  b.prop('ruin', 44, 20); b.prop('ruin', 12, 18); b.prop('ruin', 49, 42);
  b.prop('sign', 36, 8, { use: 'sign', text: 'Не пейте воду. Не слушайте воду. Воду вообще не трогайте. — Хеспер' });
  b.prop('shrine', 34, 4, { id: 'shrine_swamp', use: 'shrine', name: 'Болотный алтарь' });
  b.npc('hesper', 30, 33);
  b.prop('campfire', 33, 34);
  b.scatter('reeds', 30, 2, 2, 60, 52, {}, [T.SWAMP]);
  b.scatter('stump', 10, 2, 2, 60, 52, {}, [T.GRASS]);

  for (const [x, y] of [[14, 19], [16, 22], [46, 21], [50, 24], [11, 41], [14, 44]]) b.enemy('bogling', x, y, 4);
  for (const [x, y] of [[48, 44], [52, 46], [30, 31]]) b.enemy('bogling', x, y, 5);
  for (const [x, y] of [[48, 20], [12, 44]]) b.enemy('spider', x, y, 5);
  b.enemy('bat', 20, 30, 4); b.enemy('bat', 38, 24, 4);
  for (const [id, x, y] of [['ms1', 14, 21], ['ms2', 48, 23], ['ms3', 51, 45], ['ms4', 12, 43], ['ms5', 32, 47]]) b.node(id, 'q_moss', x, y);
  b.chest('s_chest', 50, 46, [['gold', 80], ['p_hp2', 2], ['c_spirit', 1]]);
  b.chest('s_chest2', 13, 40, [['gold', 60], ['p_mp2', 1]]);
  b.zone('swamp_hut', 24, 28, 12, 8);

  b.portal('swamp_to_village', 28, 2, 8, 1, 'village', { x: 3.5, y: 38.5 });
  b.border(2, T.TREE);
  b.litter('bush', 20, 3);
  return b.finish();
}

// ======================================================================= СВЕТЛАЯ РОЩА
export function lightforest() {
  const b = new Builder('lightforest', 64, 44, 91);
  b.spawn = { x: 3, y: 22 };
  b.blob(8, 22, 6, 5, T.GRASS, true);                 // вход
  b.blob(30, 22, 9, 7, T.GRASS, true);                // центральная поляна и родник
  b.blob(52, 14, 7, 6, T.GRASS, true);                // северо-восточная поляна
  b.blob(50, 34, 8, 6, T.GRASS, true);                // южная поляна
  b.blob(18, 8, 6, 4, T.GRASS, true);
  b.blob(14, 36, 6, 4, T.GRASS, true);
  b.path([[3, 22], [14, 22], [24, 22]], 3, T.DIRT);
  b.path([[36, 22], [46, 16], [52, 14]], 2.4, T.DIRT);
  b.path([[36, 24], [44, 32], [50, 34]], 2.4, T.DIRT);
  b.path([[24, 20], [18, 10]], 2, T.DIRT);
  b.path([[24, 24], [16, 34]], 2, T.DIRT);
  // родник
  b.blob(30, 22, 2.6, 2, T.WATER, true, 0.2);
  b.blob(30, 22, 1.2, 0.9, T.DEEP, false, 0.1);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) {
    if (b.get(i, j) !== T.GRASS) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (b.get(i + dx, j + dy) === T.WATER) { b.set(i, j, T.SAND); b.reserve(i, j, 1, 1, 1); break; }
  }
  b.prop('shrine', 33, 25, { id: 'shrine_light', use: 'shrine', name: 'Алтарь рощи' });
  b.prop('obelisk', 27, 18, { use: 'sign', text: 'Здесь вода всегда холодная и всегда чистая. Никто не знает, почему. Родник никогда не замерзает и не пересыхает.' });
  b.prop('sign', 7, 20, { use: 'sign', text: 'Тихий Брод — на западе.' });
  b.node('spring', 'q_tear', 30, 24);
  b.npc('pushok', 50, 36, { hideIf: 'cat_found' });
  for (const [id, x, y] of [['lf1', 18, 8], ['lf2', 52, 12], ['lf3', 14, 36], ['lf4', 48, 33]]) b.node(id, 'q_flower', x, y);
  for (const [x, y] of [[50, 16], [54, 12]]) b.enemy('wolf', x, y, 3);
  for (const [x, y] of [[48, 32], [52, 36]]) b.enemy('slime', x, y, 2);
  b.enemy('bat', 18, 10, 3);
  b.chest('l_chest', 54, 16, [['gold', 50], ['p_hp1', 2], ['c_copper', 1]]);
  b.zone('spring_zone', 26, 18, 8, 8);
  b.portal('light_to_village', 1, 21, 2, 3, 'village', { x: 59.5, y: 22.5 });
  b.border(3, T.TREE);
  b.forest(0.5, 0.15, 14);
  b.litter('bush', 40, 3);
  return b.finish();
}

export const BUILD = { village, mine1, mine2, mine3, darkforest, swamp, lightforest };
