// Локация 5: Побережье. Порт Серой Воды, Маяк-библиотека, Лечебница Лиары, Игорный дом.
import { Builder } from './maps_core.js';
import { T } from './defs.js';

// ======================================================================= ПОРТ СЕРОЙ ВОДЫ
export function harbor() {
  const b = new Builder('harbor', 80, 56, 51, T.SAND);
  b.spawn = { x: 4, y: 30 };

  // море на юге, бухта на востоке
  b.rect(0, 47, 80, 9, T.WATER);
  b.rect(0, 51, 80, 5, T.DEEP);
  b.blob(40, 48, 40, 1.4, T.WATER, false, 0.3);
  b.rect(73, 21, 7, 28, T.WATER);
  b.blob(74, 33, 3, 12, T.WATER, false, 0.3);
  b.rect(76, 21, 4, 28, T.DEEP);
  // северные скалы
  b.rect(0, 0, 80, 3, T.ROCK);
  b.blob(40, 1, 44, 4, T.ROCK, false, 0.5);
  b.blob(8, 8, 8, 5, T.ROCK, false, 0.4);

  // мыс с маяком
  b.blob(70, 10, 9, 8, T.SAND, true, 0.25);
  b.blob(77, 6, 5, 9, T.ROCK, false, 0.3);

  // город: мощёные районы
  b.blob(34, 20, 30, 7, T.COBBLE, true, 0.2);
  b.rect(2, 28, 66, 6, T.COBBLE, true);
  b.disc(36, 30, 7.5, T.PLAZA);
  b.blob(40, 38, 26, 4.5, T.COBBLE, true, 0.2);
  b.rect(62, 34, 11, 10, T.COBBLE, true);
  // северная дорога к алтарю Сейра
  b.path([[46, 24], [46, 8], [56, 7]], 3, T.DIRT);
  // дорога к маяку
  b.path([[66, 30], [66, 20], [69, 12]], 3, T.COBBLE);
  // молы
  b.rect(14, 37, 3, 14, T.WOOD, true);
  b.rect(29, 37, 3, 14, T.WOOD, true);
  b.rect(47, 37, 3, 14, T.WOOD, true);
  b.rect(8, 39, 40, 2, T.COBBLE, true);

  // --- здания севера
  b.prop('house', 8, 12, { sprite: 'house' });
  b.prop('sign', 13, 17, { use: 'sign', title: 'Табличка', text: 'Лечебница Лиары. Входить тихо. Кричать можно, но не громко. Плата по состоянию.' });
  b.prop('house', 22, 12);
  b.prop('sign', 27, 17, { use: 'sign', text: 'КОНТОРА ПОРТА. Магистрат Орм принимает по средам. Остальные дни принимает дело.' });
  b.prop('post', 28, 19);
  b.prop('tavern', 38, 12);
  b.prop('sign', 36, 17, { use: 'sign', text: 'Трактир «Утопленник». У нас тонут только в пиве. Остальное не к нам.' });
  b.prop('house', 52, 13);
  b.prop('hut', 58, 16);
  b.prop('barrel', 21, 17); b.prop('barrel', 22, 17); b.prop('crate', 49, 17);
  // --- рынок
  b.prop('stall', 29, 25); b.prop('stall', 42, 25);
  b.prop('stall', 29, 36); b.prop('stall', 42, 35);
  b.prop('well', 35, 22, { deco: true });
  b.prop('cart', 33, 21); b.prop('cart', 38, 21); b.prop('cart', 42, 21);
  b.prop('barrel', 40, 22); b.prop('barrel', 41, 22);
  b.prop('lamp', 32, 28); b.prop('lamp', 40, 33);
  b.prop('shrine', 36, 33, { id: 'shrine_harbor', use: 'shrine', name: 'Алтарь Серой Воды' });
  // --- склады и доки
  b.prop('house', 18, 35);
  b.prop('house', 33, 35);
  b.prop('hut', 40, 36);
  b.prop('crate', 23, 36); b.prop('crate', 24, 36); b.prop('barrel', 38, 36); b.prop('barrel', 22, 37);
  b.prop('net', 8, 36); b.prop('net', 10, 36); b.prop('net', 36, 42); b.prop('net', 22, 43);
  b.prop('boat', 17, 47); b.prop('boat', 23, 48);
  b.prop('boat', 32, 48); b.prop('boat', 38, 47);
  b.prop('boat', 50, 47); b.prop('boat', 56, 48);
  b.prop('post', 14, 49); b.prop('post', 16, 49); b.prop('post', 29, 49); b.prop('post', 31, 49);
  b.prop('sign', 12, 38, { use: 'sign', text: 'ПРИЧАЛ 1. Лодки без хозяев вывозят на глубину. Хозяева без лодок тоже.' });
  // --- игорный дом и склады контрабандистов
  b.prop('house', 54, 33);
  b.prop('lamp', 53, 37); b.prop('lamp', 59, 37);
  b.prop('sign', 60, 38, { use: 'sign', text: 'Игорный дом «Шестёрка». Входят все, выходят по желанию. Желание может измениться.' });
  b.prop('house', 62, 31);
  b.prop('crate', 61, 36); b.prop('crate', 62, 36); b.prop('barrel', 66, 36); b.prop('crate', 67, 37); b.prop('cart', 64, 41);
  b.prop('barrel', 70, 38); b.prop('crate', 70, 39);
  // --- мыс с маяком
  b.prop('beacon', 68, 5, { id: 'lighthouse_beacon', use: 'altar', title: 'Маяк', text: 'Вместо огня наверху стоит чаша с книгами. Когда ветер листает страницы, свет мигает. Хранители уверяют, что это не одно и то же.' });
  b.prop('lamp', 67, 8); b.prop('lamp', 72, 8);
  b.prop('statue', 64, 9, { deco: true });
  // --- северная дорога и алтарь Сейра
  b.prop('godaltar', 56, 4, { god: 'seyr', use: 'altar', title: 'Придорожный алтарь Сейра', text: 'На камне вырезаны столбиком монеты: орёл, орёл, решка, орёл. Под ними нацарапано «выпадет не то, что ждёшь». Неизвестно, чьей рукой.' });
  b.prop('cart', 49, 10); b.prop('cart', 43, 9);
  b.prop('sign', 48, 22, { use: 'sign', text: 'СОЛЯНАЯ ДОРОГА на север вдоль скал. Гарпии не платят пошлину, и это их единственное преимущество перед нами.' });
  b.prop('boulder', 52, 9); b.prop('boulder', 60, 6); b.prop('boulder', 44, 6);
  b.scatter('boulder', 16, 3, 3, 40, 8, {}, [T.SAND]);
  b.scatter('reeds', 16, 2, 44, 70, 3, {}, [T.SAND]);
  b.scatter('boulder', 8, 60, 20, 12, 12, {}, [T.SAND]);
  b.scatter('barrel', 5, 4, 30, 8, 4, {}, [T.COBBLE]);
  // --- остов «Верной»
  b.prop('boat', 62, 44, { deco: false });
  b.prop('ruin', 69, 44);
  b.prop('grave', 66, 43); b.prop('grave', 67, 43);
  b.prop('post', 60, 43);
  b.prop('sign', 58, 42, { use: 'sign', text: 'БАРК «ВЕРНАЯ». Сел на мель в ночь на 14-е. Груз не поднят. Экипаж частично.' });

  // --- NPC
  b.npc('brandt', 24, 24);
  b.prop('barrel', 22, 25);
  b.npc('orm', 24, 19);
  b.npc('martin', 29, 19);
  b.npc('gulda', 40, 17);
  b.npc('trader_h', 32, 27);
  b.npc('darian', 37, 24);
  b.npc('seyr_stranger', 58, 6, { showIf: 'seyr_open' });
  b.npc('tob', 10, 43);
  b.npc('agnes', 27, 46);
  b.npc('sara', 46, 36);
  b.npc('nils', 15, 48);
  b.npc('anselm', 44, 28, { showIf: 'cls_mage' });
  b.npc('harz', 12, 35, { showIf: 'cls_rogue' });

  // --- враги
  for (const [x, y, l] of [[6, 44, 12], [9, 46, 12], [4, 42, 12], [12, 45, 12], [20, 45, 13], [25, 43, 13], [38, 45, 13], [44, 44, 13]]) b.enemy('crab', x, y, l);
  for (const [x, y, l] of [[19, 46, 14], [27, 44, 14], [45, 46, 14], [53, 45, 14]]) b.enemy('drowned', x, y, l);
  for (const [x, y, l] of [[50, 5, 14], [55, 9, 14], [60, 5, 14], [64, 12, 15], [72, 14, 15]]) b.enemy('harpy', x, y, l);
  for (const [x, y, l] of [[63, 38, 14], [66, 40, 15], [61, 41, 14], [69, 37, 15]]) b.enemy('smuggler', x, y, l);
  b.enemy('warden', 65, 45, 17, { unique: 'drowned_captain' });
  b.enemy('drowned', 61, 46, 15); b.enemy('drowned', 69, 46, 15);

  // --- сундуки и сборы
  b.chest('h_gate2', 66, 45, [['q_gate2', 1], ['gold', 170]]);
  b.chest('h_chest1', 70, 12, [['gold', 150], ['p_hp3', 2]]);
  b.chest('h_chest2', 6, 38, [['gold', 130], ['p_mp3', 2]]);
  b.chest('rogue_tally', 68, 39, [['q_tally', 1], ['gold', 140]]);
  b.chest('h_chest3', 60, 8, [['gold', 120], ['p_mp3', 1]]);
  for (const [i, x, y] of [[1, 8, 45], [2, 33, 44], [3, 51, 45], [4, 70, 45]]) b.node('bottle_' + i, 'q_bottle', x, y);
  b.node('ring_node', 'q_ring', 59, 45);
  b.reserve(5, 37, 3, 3, 1);

  // --- порталы
  b.portal('to_pass', 1, 29, 2, 4, 'valley_pass', { x: 75.5, y: 23.5 });
  b.portal('to_clinic', 9, 15, 2, 1, 'clinic', { x: 22.5, y: 30.5 });
  b.portal('to_lighthouse', 68, 7, 3, 1, 'lighthouse', { x: 26.5, y: 37.5 });
  b.portal('to_den', 55, 36, 2, 1, 'den', { x: 21.5, y: 29.5 });

  b.border(2, T.ROCK);
  return b.finish();
}

// ======================================================================= МАЯК-БИБЛИОТЕКА
export function lighthouse() {
  const b = new Builder('lighthouse', 52, 44, 52, T.CWALL);
  b.spawn = { x: 26, y: 38 };
  const W = T.WOOD, F = T.CRYPT;
  b.room(18, 36, 16, 6, W);                // вестибюль
  b.corridor(26, 35, 26, 30, 4, W, true);
  b.room(6, 18, 40, 12, W);                // читальный зал
  b.corridor(26, 18, 26, 13, 4, F, true);
  b.room(10, 3, 32, 11, F);                // закрытый Фонд
  b.room(46, 20, 5, 6, W);                 // тайник
  b.corridor(45, 23, 47, 23, 3, W);

  // вестибюль
  b.prop('shrine', 20, 37, { id: 'shrine_lighthouse', use: 'shrine', name: 'Алтарь Ори' });
  b.prop('lamp', 19, 40); b.prop('lamp', 32, 40);
  b.prop('bookshelf', 29, 37); b.prop('bookshelf', 22, 40);
  b.npc('emer', 26, 38);
  b.npc('mote', 30, 40);
  // читальный зал: стеллажи рядами, столы и лампы
  for (let i = 0; i < 6; i++) { b.prop('bookshelf', 8 + i * 4, 19); }
  for (let i = 0; i < 4; i++) { b.prop('bookshelf', 32 + i * 3, 19); }
  b.prop('bookshelf', 8, 22); b.prop('bookshelf', 12, 22); b.prop('bookshelf', 36, 22); b.prop('bookshelf', 40, 22);
  b.prop('bookshelf', 8, 26); b.prop('bookshelf', 12, 26); b.prop('bookshelf', 36, 26); b.prop('bookshelf', 40, 26);
  b.prop('table', 17, 23); b.prop('table', 31, 23); b.prop('table', 17, 26); b.prop('table', 31, 26);
  b.prop('lamp', 15, 24); b.prop('lamp', 30, 24); b.prop('lamp', 20, 20); b.prop('lamp', 40, 20);
  b.prop('godaltar', 22, 21, { god: 'ori', use: 'altar', title: 'Алтарь Ори', text: 'На камне лежит раскрытая книга. Все страницы чистые. Табличка: «Помни за всех. Начни с себя».' });
  b.prop('bookshelf', 11, 20, { use: 'page', id: 'pg_ori1', title: 'Выписка', text: 'Из реестра хранителей: «Прежние боги не писали. Писали за них. Тех, кто писал, никто не помнит, а тех, кого помнят, не просили». Ниже другой рукой: «Не помнят и не просили, а звали».', deco: false });
  b.prop('bookshelf', 37, 20, { use: 'page', id: 'pg_ori2', title: 'Запись смотрителя', text: 'Свет в окнах горит, пока читают. В ночь, когда погас маяк в Тихом Броде, горел ровно, не мигая. Я решил, что это хороший знак. Следующим утром ко мне пришёл человек и спросил, почему не читают.', deco: false });
  b.npc('ferne', 13, 24, { hideIf: 'book_scholar' });
  // Фонд
  for (let i = 0; i < 7; i++) b.prop('bookshelf', 12 + i * 4, 4);
  b.prop('bookshelf', 12, 9); b.prop('bookshelf', 16, 9); b.prop('bookshelf', 34, 9); b.prop('bookshelf', 38, 9);
  b.prop('brazier', 22, 12); b.prop('brazier', 31, 12); b.prop('brazier', 24, 6); b.prop('brazier', 29, 6);
  b.prop('statue', 26, 5);
  b.chest('ori_book', 36, 7, [['q_book', 1], ['gold', 160]]);
  b.chest('ori_chest2', 14, 7, [['gold', 140], ['p_mp3', 2]]);
  for (const [x, y, l] of [[18, 8, 14], [32, 8, 14], [24, 10, 15], [14, 11, 14], [38, 11, 15]]) b.enemy('wraith', x, y, l);
  b.enemy('warden', 26, 8, 16, { unique: 'fond_warden' });
  b.enemy('drowned', 20, 24, 14);
  // тайник
  b.node('ledger_h', 'q_borrow', 48, 22);
  b.prop('lamp', 47, 20);
  b.enemy('wraith', 40, 28, 14);

  b.portal('lh_exit', 24, 41, 4, 1, 'harbor', { x: 69.5, y: 10.5 });
  return b.finish();
}

// ======================================================================= ЛЕЧЕБНИЦА ЛИАРЫ
export function clinic() {
  const b = new Builder('clinic', 44, 36, 53, T.CWALL);
  b.spawn = { x: 22, y: 30 };
  const W = T.WOOD, P = T.PLAZA;
  b.room(16, 27, 12, 7, P);                // приёмная
  b.corridor(22, 27, 22, 21, 3, P, true);
  b.room(3, 13, 14, 10, W);                // общая палата
  b.room(26, 12, 15, 11, T.GRASS);         // сад
  b.rect(16, 16, 11, 4, W);                // зал между палатой и садом
  b.room(3, 3, 10, 6, W);                  // палата-одиночка
  b.corridor(8, 9, 8, 13, 3, W, true);
  b.room(18, 2, 22, 7, T.CRYPT);           // карантин
  b.corridor(33, 9, 33, 12, 3, T.CRYPT, true);
  b.rect(19, 19, 7, 3, W);

  b.prop('shrine', 18, 28, { id: 'shrine_clinic', use: 'shrine', name: 'Алтарь Лиары' });
  b.prop('table', 24, 28); b.prop('plant', 26, 28); b.prop('lamp', 17, 31); b.prop('lamp', 27, 31);
  b.npc('yorna', 22, 30);
  // палата
  for (const [x, y] of [[4, 14], [4, 17], [4, 20], [12, 14], [12, 17], [12, 20]]) b.prop('bed', x, y);
  b.prop('plant', 7, 14); b.prop('lamp', 9, 21);
  b.npc('eivin', 7, 18);
  b.npc('liese', 10, 15);
  // одиночка
  b.prop('bed', 4, 4); b.prop('table', 9, 4); b.prop('lamp', 11, 4);
  b.npc('kaspar', 7, 6, { hideIf: 'kaspar_gone' });
  // сад
  for (const [x, y] of [[28, 14], [31, 14], [34, 14], [37, 14], [28, 17], [38, 17], [28, 21], [32, 21], [36, 21], [39, 21], [30, 19]]) b.prop('plant', x, y);
  b.prop('well', 33, 17, { deco: true });
  b.node('hush_1', 'q_hush', 30, 16);
  b.node('hush_2', 'q_hush', 36, 19);
  b.node('hush_3', 'q_hush', 39, 13);
  b.enemy('echoVagrant', 29, 20, 12);
  // карантин
  for (const [x, y] of [[20, 4], [24, 4], [28, 4], [20, 7], [35, 4], [37, 7]]) b.prop('bed', x, y);
  for (const [x, y, l] of [[22, 6, 12], [27, 6, 13], [31, 7, 12], [36, 6, 13]]) b.enemy('echoVagrant', x, y, l);
  b.enemy('echoMiner', 25, 7, 13); b.enemy('echoMiner', 38, 4, 13);
  b.enemy('warden', 30, 4, 15, { unique: 'clinic_warden' });
  b.chest('clinic_chest', 39, 7, [['gold', 130], ['p_hp3', 2]]);
  b.chest('clinic_chest2', 5, 21, [['gold', 90], ['p_mp3', 1]]);

  b.portal('cl_exit', 20, 33, 4, 1, 'harbor', { x: 10.5, y: 18.5 });
  return b.finish();
}

// ======================================================================= ИГОРНЫЙ ДОМ
export function den() {
  const b = new Builder('den', 44, 34, 54, T.CWALL);
  b.spawn = { x: 21, y: 29 };
  const W = T.WOOD;
  b.room(14, 26, 14, 7, W);                // холл
  b.corridor(20, 22, 20, 26, 3, W, true);
  b.room(3, 10, 22, 13, W);                // игровой зал
  b.room(29, 8, 12, 9, W);                 // закрытая комната приёма
  b.corridor(24, 13, 29, 13, 3, W);
  b.room(29, 20, 12, 8, W);                // кабинет
  b.corridor(26, 28, 30, 28, 3, W);
  b.room(3, 26, 9, 6, T.CRYPT);            // подвал
  b.corridor(14, 29, 10, 29, 3, T.CRYPT);

  // холл
  b.prop('table', 16, 28); b.prop('lamp', 15, 27); b.prop('lamp', 26, 27); b.prop('barrel', 26, 31);
  b.npc('doorman', 18, 30);
  // игровой зал
  for (const [x, y] of [[6, 12], [11, 12], [16, 12], [6, 17], [11, 17], [16, 17]]) { b.prop('table', x, y); }
  b.prop('lamp', 4, 11); b.prop('lamp', 22, 11); b.prop('lamp', 4, 21); b.prop('lamp', 22, 21);
  b.prop('banner', 13, 10);
  b.prop('barrel', 4, 14); b.prop('barrel', 4, 15); b.prop('crate', 22, 16); b.prop('rack', 18, 21); b.prop('statue', 22, 13); b.prop('banner', 7, 10); b.prop('banner', 19, 10);
  b.prop('brazier', 20, 14);
  b.npc('fim', 9, 15);
  // приём
  b.prop('table', 33, 10); b.prop('table', 33, 14);
  b.prop('banner', 31, 8); b.prop('banner', 38, 8); b.prop('lamp', 40, 9);
  b.npc('roark', 36, 12, { showIf: 'issa_masked' });
  b.npc('velda', 38, 15, { showIf: 'issa_masked' });
  // кабинет
  b.prop('table', 32, 22); b.prop('banner', 35, 20); b.prop('lamp', 39, 21);
  b.npc('lisandra', 35, 24, { hideIf: 'lisandra_gone' });
  b.chest('den_vault', 39, 25, [['gold', 220], ['p_hp3', 2]]);
  // подвал
  b.prop('crate', 4, 27); b.prop('barrel', 10, 30); b.prop('crate', 5, 30);
  b.npc('emile', 7, 28, { hideIf: 'emile_dead' });
  b.node('deck_h', 'q_deck', 9, 27);
  b.chest('den_cellar', 4, 31, [['gold', 160], ['p_mp3', 2]]);
  for (const [x, y, l] of [[8, 29, 15], [6, 31, 16], [10, 31, 15]]) b.enemy('smuggler', x, y, l);
  b.enemy('thug', 12, 29, 14);
  // расправа после обмана
  for (const [x, y] of [[17, 28], [24, 29], [21, 31]]) b.enemy('smuggler', x, y, 16, { showIf: 'lisandra_hostile' });

  b.portal('den_exit', 19, 32, 4, 1, 'harbor', { x: 56.5, y: 38.5 });
  return b.finish();
}

export const BUILD = { harbor, lighthouse, clinic, den };
