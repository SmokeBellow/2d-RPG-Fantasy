// Локация 4: Горный край. Бастион Торна (80x64), Арена Кхарна, Роща Мары, Ледник.
import { Builder } from './maps_core.js';
import { T } from './defs.js';

// ======================================================================= БАСТИОН ТОРНА
export function bastion() {
  const b = new Builder('bastion', 80, 64, 401, T.ROCK);
  b.spawn = { x: 40, y: 59 };
  const C = T.COBBLE, P = T.PLAZA, W = T.WALL;

  // южный двор: лагерь паломников и раздача пайков
  b.rect(22, 50, 36, 13, C);
  b.rect(35, 50, 10, 13, P);
  // стена с воротами
  b.rect(18, 45, 44, 5, W);
  b.rect(35, 45, 10, 5, P);
  // главный двор
  b.rect(10, 28, 60, 17, C);
  b.rect(24, 30, 32, 13, P);
  // зал суда
  b.rect(22, 4, 36, 24, W);
  b.rect(24, 6, 32, 20, C);
  b.rect(28, 8, 24, 16, P);
  b.rect(36, 26, 8, 2, P);
  // западный путь к арене
  b.rect(2, 33, 10, 8, T.SAND);
  // восточный путь к леднику
  b.rect(70, 33, 8, 8, T.SNOW);
  // северо-западная терраса (роща дотянулась до стен)
  b.rect(11, 13, 6, 16, C);
  b.rect(2, 3, 18, 11, T.GRASS);
  b.path([[9, 4], [10, 9], [13, 13]], 3, T.GRASS, true);
  // казематы и казарма
  b.rect(56, 6, 22, 22, W);
  b.rect(58, 8, 18, 18, C);
  b.rect(62, 26, 6, 2, C);
  b.rect(58, 14, 18, 1, W);
  for (const x of [60, 66, 72]) b.rect(x, 14, 2, 1, C);
  b.rect(64, 8, 1, 6, W); b.rect(70, 8, 1, 6, W);

  // --- южный двор
  b.prop('tent', 23, 52); b.prop('tent', 27, 57); b.prop('tent', 24, 59);
  b.prop('campfire', 30, 55);
  b.prop('crate', 29, 52); b.prop('barrel', 32, 58);
  b.prop('cart', 45, 53); b.prop('barrel', 48, 53); b.prop('crate', 52, 54); b.prop('crate', 52, 55);
  b.prop('table', 49, 56, { use: 'page', id: 'torn_ledger', title: 'Книга пайков',
    text: 'Книга выдач южного двора. Ровные строки, чужая рука. За последние три месяца: «Принято на лагерь: 90 мешков. Выдано лагерю: 31. Передано в кухню гарнизона по распоряжению: 59». Внизу печать зернохранилища и росчерк судьи Эрланда: «Согласовано. Излишки не пропадают».',
    fx: [['f', 'torn_ledger']] });
  b.prop('sign', 38, 53, { use: 'sign', text: 'БАСТИОН ТОРНА. Закон высечен в стене, а не в голове стражи. Оружие не обнажать без нужды. Хлеб не красть. — Устав, ст. 1 и 2' });
  b.prop('banner', 35, 48); b.prop('banner', 44, 48);
  b.prop('brazier', 34, 51); b.prop('brazier', 45, 51);
  b.prop('statue', 22, 50); b.prop('statue', 57, 50);
  b.npc('pilgrim', 27, 55);
  b.npc('pilgrim_f', 31, 57);
  b.npc('brida', 47, 55, { hideIf: 'torn_keeper' });
  b.npc('lud_free', 42, 54, { showIf: 'lud_free' });
  b.npc('lud_kid', 34, 56, { showIf: 'torn_hanged' });

  // --- главный двор
  b.prop('godaltar', 39, 33, { god: 'torn', use: 'altar', title: 'Алтарь Торна', text: 'Весы, высеченные из серого камня. Одна чаша пуста, вторая пуста. Под ними выбито: «Он взвешивал только то, что можно взвесить».' });
  b.prop('shrine', 46, 33, { id: 'shrine_bastion', use: 'shrine', name: 'Алтарь бастиона' });
  for (const x of [26, 30, 49, 53]) b.prop('pillar', x, 31);
  for (const x of [26, 53]) b.prop('statue', x, 36);
  b.prop('banner', 14, 29); b.prop('banner', 64, 29); b.prop('banner', 24, 29); b.prop('banner', 55, 29);
  b.prop('brazier', 32, 42); b.prop('brazier', 47, 42);
  b.prop('rack', 29, 42); b.prop('crate', 30, 40); b.prop('barrel', 28, 40); b.prop('crate', 35, 42);
  b.prop('campfire', 19, 40); b.prop('crate', 15, 41); b.prop('barrel', 15, 39);
  b.prop('sign', 38, 43, { use: 'sign', text: 'Суд: север. Арена Кхарна: запад. Ледник: восток. Роща: северо-запад, по лестнице. Каземат: северо-восток. Дорога на перевал: юг.' });
  b.prop('obelisk', 12, 31, { use: 'sign', text: 'ЗАКОН НЕ ПРОЩАЕТ, НО ОН НЕ ЗНАЕТ ЗЛОБЫ. Ниже нацарапано гвоздём: «Зато знает усталость».' });
  b.prop('obelisk', 67, 31, { use: 'sign', text: 'Список приговорённых за три века: восемь тысяч четыреста двенадцать имён. Первые три тысячи вписаны одной рукой, без перерыва.' });
  b.npc('commandant', 40, 38);
  b.npc('quarter', 33, 41);
  b.npc('sergeant', 51, 39, { hideIf: 'sgt_gone' });
  b.npc('employer', 18, 38, { showIf: 'cls_warrior', hideIf: 'rork_gone' });
  b.enemy('sentinel', 14, 43, 13); b.enemy('sentinel', 65, 43, 13); b.enemy('sentinel', 66, 31, 13);
  b.enemy('harpy', 15, 33, 12); b.enemy('harpy', 60, 38, 12);
  b.zone('court', 24, 30, 32, 13);

  // --- зал суда
  b.prop('throne', 39, 8);
  b.prop('statue', 34, 8); b.prop('statue', 45, 8);
  b.prop('table', 36, 12); b.prop('table', 42, 12);
  b.row('pillar', 29, 10, 4, 0, 4);
  b.row('pillar', 50, 10, 4, 0, 4);
  b.row('banner', 31, 7, 3, 4, 0);
  b.row('banner', 43, 7, 3, 4, 0);
  b.prop('bookshelf', 25, 7); b.prop('bookshelf', 52, 7);
  b.prop('brazier', 33, 22); b.prop('brazier', 46, 22);
  b.prop('godaltar', 47, 14, { god: 'torn', use: 'altar', title: 'Весы Торна', text: 'Бронзовые весы в рост человека. Дужка ходит от любого шага. Судья говорит: никто не может её остановить, а те, кто пытался, оставили на ней пальцы.' });
  b.npc('judge', 40, 11);
  b.chest('b_court', 26, 24, [['gold', 150], ['@weapon3', 1]]);
  b.zone('courthall', 24, 6, 32, 20);

  // --- терраса рощи
  b.chest('b_terrace', 4, 5, [['gold', 130], ['p_hp3', 2]]);
  b.enemy('harpy', 6, 8, 12); b.enemy('harpy', 15, 6, 12);
  b.prop('sign', 12, 4, { use: 'sign', text: 'Рощу сюда не звали. Она пришла сама и пустила корни в плиты. Стража её не трогает: приказа не было.' });
  b.prop('stump', 4, 10);
  b.litter('bush', 8, 3); b.litter('boulder', 4, 3);
  b.forest(0.5, 0.16, 5);

  // --- каземат и казарма
  b.prop('bed', 59, 17); b.prop('bed', 59, 20); b.prop('bed', 59, 23);
  b.prop('bed', 73, 17); b.prop('bed', 73, 20);
  b.prop('table', 65, 20); b.prop('rack', 68, 24); b.prop('rack', 62, 24);
  b.prop('brazier', 62, 16); b.prop('brazier', 71, 16);
  b.prop('sign', 61, 26, { use: 'sign', text: 'КАЗЕМАТ. Передача пищи через стражу. Разговоры с заключёнными только с позволения судьи.' });
  b.npc('lud', 67, 10, { hideIf: ['torn_hanged', 'torn_labor', 'torn_keeper', 'torn_freed'] });
  b.npc('brida_jailed', 73, 10, { showIf: 'torn_keeper' });
  b.enemy('sentinel', 62, 20, 14); b.enemy('sentinel', 70, 22, 14);
  b.chest('b_barracks', 74, 24, [['gold', 170], ['@armor3', 1]]);
  b.zone('prison', 58, 8, 18, 18);

  b.portal('to_pass', 38, 62, 4, 1, 'valley_pass', { x: 39.5, y: 4.5 });
  b.portal('to_arena', 2, 34, 2, 6, 'arena', { x: 5.5, y: 22.5 });
  b.portal('to_glacier', 76, 34, 2, 6, 'glacier', { x: 4.5, y: 40.5 });
  b.portal('to_grove', 8, 3, 4, 1, 'grove', { x: 28.5, y: 44.5 });
  return b.finish();
}

// ======================================================================= АРЕНА КХАРНА
export function arena() {
  const b = new Builder('arena', 56, 44, 402, T.WALL);
  b.spawn = { x: 5, y: 22 };
  const S = T.SAND, C = T.COBBLE;
  b.rect(2, 16, 14, 12, S);                 // предбанник
  b.corridor(14, 21, 24, 22, 4, S);
  b.disc(36, 22, 16, C, false);             // трибуны
  b.disc(36, 22, 12, S, false);             // песок
  b.rect(8, 27, 4, 6, S);
  b.rect(4, 32, 14, 9, C);                  // оружейная
  b.rect(8, 12, 4, 5, S);
  b.rect(4, 4, 14, 9, C);                   // зал имён

  // песок
  b.ring(36, 22, 14.6, 'brazier', 8);
  b.ring(36, 22, 15.8, 'banner', 12);
  b.prop('spear', 29, 17); b.prop('spear', 43, 27); b.prop('boulder', 36, 12); b.prop('boulder', 36, 32);
  b.prop('statue', 26, 22);
  b.prop('sign', 24, 24, { use: 'sign', text: 'ВЫХОД НА ПЕСОК. Здесь не извиняются и не благодарят. Только считают.' });
  b.npc('arena_champ', 36, 22, { hideIf: 'arena_slain' });
  for (const [x, y] of [[36, 8], [47, 11], [51, 22], [47, 33], [36, 36], [25, 33]]) b.enemy('gladiator', x, y, x % 2 ? 13 : 14);
  for (const [x, y] of [[30, 9], [42, 35], [24, 13], [49, 28]]) b.enemy('harpy', x, y, 12);

  // предбанник
  b.npc('arenamaster', 9, 21);
  b.npc('glad_f', 12, 19);
  b.prop('godaltar', 6, 17, { god: 'kharn', use: 'altar', title: 'Алтарь Кхарна', text: 'Каменная плита в пятнах, которые не отмываются. Здесь кладут клинки перед боем. Никто не молится. Кхарн не слушает молитв, он считает, сколько осталось в живых.' });
  b.prop('shrine', 13, 26, { id: 'shrine_arena', use: 'shrine', name: 'Лежанка гладиаторов' });
  b.prop('rack', 4, 25); b.prop('barrel', 14, 17); b.prop('crate', 3, 22);
  b.prop('brazier', 5, 20); b.prop('brazier', 5, 24);
  b.portal('arena_to_bastion', 2, 19, 2, 5, 'bastion', { x: 6.5, y: 36.5 });

  // оружейная
  b.prop('rack', 6, 34); b.prop('rack', 12, 34); b.prop('barrel', 5, 38); b.prop('crate', 15, 38);
  b.chest('a_chest1', 10, 37, [['gold', 150], ['@weapon3', 1], ['p_hp3', 1]]);
  b.enemy('gladiator', 14, 35, 14);

  // зал имён
  for (let i = 0; i < 5; i++) b.prop('grave', 6 + i * 2, 6);
  b.prop('table', 12, 9, { use: 'page', id: 'kharn_names', title: 'Список чемпионов',
    text: 'Чемпионы арены по годам. Строки вырезаны в камне и каждый год добавлена новая. Последняя с краю: «Мальк Одиннадцать», и вот уже одиннадцать лет под ней пусто. Перед ней сорок восемь имён, у каждого рядом знак. Знак один и тот же. Это крест.' });
  b.prop('banner', 5, 5); b.prop('banner', 16, 5);
  b.chest('a_chest2', 15, 11, [['gold', 120], ['p_mp3', 2], ['p_hp2', 2]]);
  b.zone('arena_pit', 24, 10, 24, 24);
  return b.finish();
}

// ======================================================================= РОЩА МАРЫ
export function grove() {
  const b = new Builder('grove', 56, 48, 403, T.GRASS);
  b.spawn = { x: 28, y: 44 };
  b.blob(28, 43, 6, 4, T.GRASS, true);               // вход
  b.blob(28, 36, 9, 6, T.GRASS, true);               // посёлок лесорубов
  b.blob(28, 21, 8, 7, T.GRASS, true);               // сердце рощи
  b.blob(13, 15, 7, 6, T.GRASS, true);               // логово Хранителя
  b.blob(45, 27, 7, 6, T.GRASS, true);               // лунные цветы
  b.blob(28, 6, 7, 4, T.GRASS, true);                // северная поляна
  b.blob(10, 36, 5, 4, T.GRASS, true);
  b.blob(46, 11, 5, 4, T.GRASS, true);
  b.path([[28, 45], [28, 36], [28, 22]], 3, T.DIRT);
  b.path([[28, 21], [17, 17], [13, 15]], 2.6, T.DIRT);
  b.path([[28, 21], [38, 25], [45, 27]], 2.6, T.DIRT);
  b.path([[28, 21], [28, 12], [28, 6]], 2.6, T.DIRT);
  b.path([[24, 38], [14, 37], [10, 36]], 2, T.DIRT);
  b.path([[44, 25], [46, 16], [46, 11]], 2, T.DIRT);
  // ручей к сердцу рощи
  b.blob(34, 15, 2.2, 3, T.WATER, true, 0.2);
  b.blob(34, 15, 1.1, 1.8, T.DEEP, false, 0.1);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) {
    if (b.get(i, j) !== T.GRASS) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (b.get(i + dx, j + dy) === T.WATER) { b.set(i, j, T.SAND); b.reserve(i, j, 1, 1, 1); break; }
  }

  // посёлок лесорубов
  b.prop('hut', 22, 33, { sprite: 'herb' });
  b.prop('hut', 33, 34, { sprite: 'elder' });
  b.prop('campfire', 28, 38);
  b.prop('stump', 25, 40); b.prop('stump', 31, 41); b.prop('cart', 19, 38); b.prop('crate', 36, 38); b.prop('barrel', 37, 39);
  b.prop('sign', 27, 43, { use: 'sign', text: 'Рощина слобода. Дровами не торгуем. Лес сам знает, сколько ему отдавать.' });
  b.npc('bjorn', 30, 38);
  b.npc('helga', 24, 37, { hideIf: 'mara_sacrifice' });
  b.npc('solveig', 35, 37);
  b.npc('sick_a', 20, 41);
  b.zone('settlement', 20, 31, 18, 11);

  // сердце рощи
  b.prop('tree2', 27, 19); b.prop('tree2', 29, 18); b.prop('tree2', 31, 21); b.prop('tree2', 25, 21); b.prop('tree2', 28, 16);
  b.prop('monolith', 28, 20, { use: 'sign', title: 'Сердце рощи', text: 'Дерево, которое не растёт и не умирает. Кора тёплая, как ладонь. В коре торчит старый железный клин, весь в зелёных побегах: кто-то уже пробовал.' });
  b.prop('godaltar', 33, 22, { god: 'mara', use: 'altar', title: 'Алтарь Мары', text: 'Круг из переплетённых корней. Они сомкнулись так плотно, что внутри никого не помещается, и при этом пусто. Мара любит перемены. Но не любит, когда за них не платят.' });
  b.npc('dryad', 28, 23, { hideIf: 'mara_axe' });
  b.npc('helga_tree', 29, 24, { showIf: 'mara_sacrifice' });
  b.prop('shrine', 24, 24, { id: 'shrine_grove', use: 'shrine', name: 'Алтарь рощи' });

  // логово
  b.enemy('grovebeast', 13, 15, 15, { unique: 'grovebeast', hideIf: ['mara_sacrifice', 'mara_axe'] });
  b.chest('g_den', 9, 13, [['gold', 160], ['c_spirit', 1], ['p_hp3', 1]]);
  b.prop('boulder', 17, 12); b.prop('stump', 10, 18);
  b.zone('beast_den', 7, 10, 14, 12);

  // лунные цветы и звери
  for (const [id, x, y] of [['gr1', 43, 25], ['gr2', 47, 29], ['gr3', 44, 30], ['gr4', 47, 24], ['gr5', 46, 11]]) b.node(id, 'q_flower', x, y);
  for (const [x, y] of [[41, 28], [48, 26]]) b.enemy('wolf', x, y, 12);
  for (const [x, y] of [[44, 14], [47, 12], [8, 37], [11, 34]]) b.enemy('spider', x, y, 13);
  for (const [x, y] of [[22, 12], [34, 9], [24, 8]]) b.enemy('bogling', x, y, 12);
  b.enemy('harpy', 28, 10, 12);
  b.chest('g_chest', 28, 5, [['gold', 140], ['p_mp3', 1], ['@armor3', 1]]);
  b.chest('g_chest2', 10, 38, [['gold', 110], ['p_hp2', 2]]);

  b.portal('grove_to_bastion', 26, 46, 4, 1, 'bastion', { x: 10.5, y: 7.5 });
  b.border(3, T.TREE);
  b.forest(0.45, 0.14, 9);
  b.litter('bush', 40, 3);
  b.litter('stump', 8, 4);
  return b.finish();
}

// ======================================================================= ЛЕДНИК
export function glacier() {
  const b = new Builder('glacier', 56, 48, 404, T.ROCK);
  b.spawn = { x: 5, y: 40 };
  const S = T.SNOW, I = T.ICE;
  b.blob(8, 40, 8, 6, S, false);                       // вход
  b.blob(27, 32, 9, 7, S, false);                      // лагерь эха
  b.blob(14, 21, 8, 6, I, false);                      // ледяное поле
  b.blob(30, 11, 9, 6, S, false);
  b.blob(45, 10, 9, 7, I, false);                      // чертог ключника
  b.blob(46, 30, 5, 5, S, false);
  b.path([[6, 40], [16, 38], [27, 33]], 5, S, false);
  b.path([[27, 33], [20, 27], [14, 21]], 5, S, false);
  b.path([[14, 21], [20, 13], [30, 11]], 5, S, false);
  b.path([[30, 11], [38, 10], [45, 10]], 5, S, false);
  b.path([[27, 33], [40, 31], [46, 30]], 4, S, false);
  for (const [x, y, rx, ry] of [[14, 21, 5, 4], [45, 10, 6, 5], [27, 32, 3, 2]]) b.blob(x, y, rx, ry, I, false, 0.3, 4);

  // вход
  b.prop('sign', 8, 38, { use: 'sign', text: 'Здесь кончается стража бастиона. Дальше лёд, и лёд не обязан быть к вам добр.' });
  b.prop('boulder', 4, 36); b.prop('boulder', 12, 42);
  b.portal('glacier_to_bastion', 1, 38, 2, 5, 'bastion', { x: 73.5, y: 37.5 });

  // лагерь эха
  b.prop('brazier', 24, 30); b.prop('brazier', 31, 30);
  b.prop('shrine', 27, 29, { id: 'shrine_glacier', use: 'shrine', name: 'Ледяной алтарь' });
  b.prop('ruin', 22, 35); b.prop('grave', 31, 35); b.prop('grave', 33, 36);
  b.prop('obelisk', 29, 35, { use: 'sign', text: 'ГАРНИЗОН СЕВЕРНОГО ПОСТА. Сто сорок человек. После Серой зимы поста нет, но смена идёт. Ниже карандашом: «Мы просто ещё не сменились».' });
  b.npc('ghost_soldier', 26, 32);
  b.npc('ghost_b', 30, 33);
  b.npc('sgt_ice', 28, 34, { showIf: 'sgt_gone' });
  b.enemy('wraith', 22, 29, 14); b.enemy('wraith', 33, 30, 14);
  b.chest('gl_camp', 33, 34, [['gold', 150], ['p_hp3', 2]]);
  b.zone('ghost_camp', 20, 28, 15, 9);

  // ледяное поле
  b.prop('boulder', 12, 19); b.prop('boulder', 17, 23); b.prop('ruin', 10, 22);
  for (const [x, y] of [[11, 24], [17, 20], [14, 26]]) b.enemy('iceWolf', x, y, 15);
  b.enemy('wraith', 14, 18, 15);
  b.enemy('echoSoldier', 8, 20, 14);
  b.chest('gl_field', 8, 18, [['gold', 160], ['@weapon3', 1]]);

  // долина и подход
  for (const [x, y] of [[25, 12], [31, 8], [34, 13]]) b.enemy('iceWolf', x, y, 16);
  b.enemy('echoSoldier', 30, 10, 15); b.enemy('wraith', 36, 10, 16);
  b.prop('obelisk', 21, 15, { use: 'sign', text: 'Лёд хранит всё: следы, волосы, обещания. Это не доброта. Просто холод ничего не отпускает.' });
  for (const [x, y] of [[44, 29], [48, 32]]) b.enemy('iceWolf', x, y, 15);
  b.chest('gl_east', 48, 28, [['gold', 170], ['p_mp3', 2], ['p_hp3', 1]]);

  // чертог ключника (финал)
  b.prop('pillar', 40, 6); b.prop('pillar', 40, 14); b.prop('pillar', 50, 6); b.prop('pillar', 50, 14);
  b.prop('brazier', 43, 5); b.prop('brazier', 47, 5);
  b.prop('statue', 45, 4);
  b.prop('throne', 44, 6);
  b.enemy('warden', 44, 11, 17, { unique: 'ice_warden' });
  b.npc('key_ghost', 45, 8, { showIf: 'k_ice_warden' });
  b.chest('gl_hall', 51, 11, [['gold', 220], ['@armor4', 1]]);
  b.zone('key_hall', 38, 4, 15, 13);
  return b.finish();
}

export const BUILD = { bastion, arena, grove, glacier };
