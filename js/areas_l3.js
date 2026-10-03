// Локация 3: Долина Былых Сражений. Поля, Хранилище Меры (2 этажа), Аббатство Безмолвных, Перевал Двух Дорог.
import { Builder } from './maps_core.js';
import { T } from './defs.js';

// ======================================================================= ПОЛЯ БЫЛЫХ СРАЖЕНИЙ
export function valley_fields() {
  const b = new Builder('valley_fields', 96, 64, 31);
  b.spawn = { x: 4, y: 32 };

  // выжженные и осквернённые пятна: следы войны
  b.blob(52, 44, 11, 7.5, T.ASH, false, 0.3);
  b.blob(30, 19, 9, 6, T.ASH, false, 0.3);
  b.blob(70, 17, 10, 7, T.ASH, false, 0.3);
  b.blob(62, 25, 5.5, 4, T.BLIGHT, false, 0.3);
  b.blob(30, 40, 4.5, 3.5, T.BLIGHT, false, 0.3);
  b.blob(14, 52, 6, 4, T.ASH, false, 0.3);

  // дороги
  b.path([[2, 32], [22, 33], [40, 30], [60, 33], [93, 32]], 3, T.DIRT);
  b.path([[40, 30], [44, 20], [46, 10]], 3, T.DIRT);                   // к раскопу Коллегии и Хранилищу
  b.path([[22, 33], [19, 38], [19, 46], [24, 47]], 3, T.DIRT);         // к Аббатству
  b.path([[60, 33], [70, 40], [77, 44]], 2.4, T.DIRT);                 // к лагерю Вспоминающих
  b.path([[16, 31], [14, 20], [12, 14]], 2, T.DIRT);                   // к камню приговора
  b.path([[60, 33], [60, 42], [62, 46]], 2, T.DIRT);                   // к полю копий
  b.path([[66, 33], [76, 22], [84, 13]], 2, T.DIRT);                   // к заросшему кургану
  b.path([[22, 38], [30, 46], [36, 50]], 2, T.DIRT);                   // к полевому лазарету
  b.rect(1, 30, 7, 4, T.DIRT, true);                                   // западные ворота
  b.rect(88, 30, 7, 4, T.DIRT, true);                                  // восточные ворота
  b.disc(12, 31, 5, T.DIRT);                                           // пост Совета
  b.disc(47, 16, 6, T.DIRT);                                           // раскоп Коллегии
  b.disc(77, 43, 5, T.DIRT);                                           // лагерь Вспоминающих
  b.disc(24, 48, 3, T.DIRT);                                           // двор у ворот Аббатства

  // --- пост Совета (запад)
  b.prop('tent', 7, 26); b.prop('tent', 8, 35); b.prop('banner', 14, 26); b.prop('banner', 18, 35);
  b.prop('campfire', 11, 29); b.prop('rack', 15, 36); b.prop('crate', 17, 28); b.prop('barrel', 18, 28); b.prop('table', 12, 35);
  b.prop('sign', 5, 29, { use: 'sign', text: 'ДОЛИНА БЫЛЫХ СРАЖЕНИЙ. С дороги не сходить. Раненых не поднимать. Если говорят с вами из-под земли, не отвечать. Пост Совета, Каменный Мост.' });
  b.npc('ardis', 12, 32);
  b.npc('olt', 15, 34);
  b.npc('brann', 9, 31);
  b.npc('cguard1', 6, 33);
  b.zone('council_post', 5, 26, 15, 12);

  // --- раскоп Коллегии (центр-север) и вход в Хранилище
  b.prop('tent', 41, 13); b.prop('tent', 52, 13); b.prop('table', 49, 17); b.prop('table', 43, 18);
  b.prop('crate', 53, 17); b.prop('barrel', 40, 17); b.prop('lamp', 50, 12); b.prop('lamp', 43, 12); b.prop('campfire', 48, 20);
  b.prop('cryptgate', 45, 4);
  b.prop('statue', 42, 6); b.prop('statue', 51, 6);
  b.prop('sign', 44, 9, { use: 'sign', text: 'ХРАНИЛИЩЕ МЕРЫ. Вход по ключу. Печать Коллегии на двери не означает, что дверь открыта. — М. Э. Сорн' });
  b.npc('elvia', 47, 15);
  b.npc('nil', 44, 19);
  b.npc('scholar_f', 51, 19, { showIf: 'proof_collegium' });
  b.zone('dig_camp', 38, 11, 18, 11);
  b.portal('to_vault', 46, 6, 2, 1, 'vault1', { x: 27.5, y: 38.5 }, { req: { item: 'q_vaultkey', msg: 'Дверь Хранилища не поддаётся. Замок не ржавый, не тёплый и не помнит ничьей руки. Нужен ключ Меры.' } });

  // --- Аббатство Безмолвных (юго-запад)
  b.prop('gate', 22, 44); b.prop('ruin', 17, 43); b.prop('ruin', 27, 44); b.prop('statue', 21, 42); b.prop('statue', 26, 42);
  b.prop('sign', 20, 47, { use: 'sign', text: 'Здесь жили те, кто умел забывать. Звонить не нужно: откроют, если захотят.' });
  b.portal('to_abbey', 23, 45, 2, 1, 'abbey', { x: 29.5, y: 38.5 });

  // --- лагерь Вспоминающих (восток)
  b.prop('tent', 72, 39); b.prop('tent', 81, 40); b.prop('tent', 75, 47); b.prop('campfire', 77, 41); b.prop('barrel', 80, 46); b.prop('crate', 71, 44);
  b.prop('monolith', 83, 35, { use: 'page', id: 'pg_f_mono', title: 'Камень Вспоминающих', text: 'Двадцать семь имён, вырезанных разными руками. Двадцать шестое стёрто стамеской, на её месте выбито: «Помним, что забыли». Под камнем кто-то оставил хлеб.', fx: [] });
  b.npc('sael', 77, 43);
  b.npc('dorn', 74, 44);
  b.npc('pilgrim_b', 80, 43, { hideIf: 'proof_council' });
  b.npc('pilgrim_c', 82, 33, { showIf: 'proof_remembering' });
  b.zone('pilgrim_camp', 69, 36, 16, 14);

  // --- боги проявляются: алтари и видения
  b.prop('godaltar', 36, 53, { god: 'lyara', use: 'altar', title: 'Алтарь у лазарета', text: 'Свечной воск, застывший на камне слоями. Под ним ещё один слой, и ещё.' });
  b.npc('vis_lyara', 36, 55);
  b.prop('godaltar', 12, 12, { god: 'torn', use: 'altar', title: 'Камень приговора', text: 'Плита, на которой читали приговоры. Края стёрты тысячами рук.' });
  b.npc('vis_torn', 12, 14);
  b.prop('godaltar', 62, 47, { god: 'kharn', use: 'altar', title: 'Алтарь на поле копий', text: 'Клинок вкопан в землю по самую гарду. Земля вокруг тёплая.' });
  b.npc('vis_kharn', 62, 49);
  b.npc('kelm', 57, 38);
  b.prop('godaltar', 85, 11, { god: 'mara', use: 'altar', title: 'Заросший курган', text: 'Из-под камня пробивается росток. Он слишком зелёный для этой земли.' });
  b.npc('vis_mara', 85, 13);

  // --- поле сражения: курганы, ржавые доспехи, копья
  const kurgan = (cx, cy, r) => { b.blob(cx, cy, r, r * 0.75, T.DIRT, true, 0.25); };
  kurgan(62, 22, 3.5); kurgan(36, 44, 3); kurgan(30, 24, 3); kurgan(54, 56, 3.5); kurgan(84, 12, 3);
  for (const [x, y] of [[60, 20], [64, 20], [62, 24], [34, 42], [38, 42], [28, 22], [32, 22], [52, 54], [56, 54], [82, 10], [87, 9]]) b.prop('grave', x, y);
  b.scatter('spear', 26, 50, 38, 24, 12, { deco: true });
  b.scatter('spear', 12, 20, 14, 20, 12, { deco: true });
  b.scatter('boulder', 14, 4, 4, 88, 56, { deco: true });
  b.scatter('ruin', 6, 26, 8, 60, 52, { deco: true });
  b.scatter('banner', 4, 54, 38, 20, 14, { deco: true });
  b.scatter('rack', 4, 22, 20, 14, 10, { deco: true });
  b.scatter('cart', 3, 30, 36, 40, 20, { deco: true });
  b.prop('grave', 29, 26, { use: 'page', id: 'pg_kelm', title: 'Могила без имени', text: 'Холмик, камень, на камне нацарапано углём: «Рядовой К. Всегда держал левый фланг». Под камнем клочок бумаги, исписанный так мелко, что видно только слово «прости».' });
  b.prop('sign', 27, 31, { use: 'page', id: 'pg_f1', title: 'Памятная плита Совета', text: 'ОСВОБОДИТЕЛЯМ. Здесь пали люди, поднявшие оружие против богов-тиранов, чтобы мы жили без ярма. Слава им и память. (Ниже мелко, другой рукой: «Какая именно память, не уточнено».)' });
  b.prop('sign', 40, 25, { use: 'page', id: 'pg_f2', title: 'Колышек Коллегии', text: 'Колышек с биркой: «Замер 14. Фон в три раза выше расчётного. Источник: север, под землёй. Не пить воду из колодцев ниже этой отметки». Бирка свежая. Колышек старый.' });
  b.prop('sign', 56, 36, { use: 'sign', text: 'Поле копий. Здесь, по рассказам, кончился век. Ни один рассказ не говорит, кто победил.' });
  b.prop('sign', 80, 31, { use: 'sign', text: 'На восток: Перевал Двух Дорог. На запад: Каменный Мост. Между ними всё, что мы не помним.' });

  // --- враги: эхо-солдаты, эхо-лучники, эхо-великаны, призрачное эхо (уровни 8-11)
  for (const [x, y] of [[26, 18], [32, 20], [28, 23]]) b.enemy('echoSoldier', x, y, 8);
  for (const [x, y] of [[24, 22], [34, 24]]) b.enemy('echoArcher', x, y, 8);
  for (const [x, y] of [[30, 38], [34, 41]]) b.enemy('echoSoldier', x, y, 9);
  b.enemy('wraith', 29, 44, 9); b.enemy('wraith', 38, 45, 9);
  for (const [x, y] of [[50, 40], [56, 43]]) b.enemy('echoSoldier', x, y, 9);
  b.enemy('echoArcher', 54, 47, 9); b.enemy('echoArcher', 58, 50, 9);
  b.enemy('echoBrute', 52, 49, 10); b.enemy('echoBrute', 66, 50, 10);
  for (const [x, y] of [[60, 26], [66, 24], [64, 28]]) b.enemy('wraith', x, y, 10);
  b.enemy('echoBrute', 62, 20, 10);
  for (const [x, y] of [[68, 14], [72, 18], [74, 13]]) b.enemy('echoSoldier', x, y, 10);
  b.enemy('echoArcher', 70, 20, 10); b.enemy('echoArcher', 76, 16, 10);
  b.enemy('wraith', 82, 14, 10); b.enemy('wraith', 88, 12, 10);
  for (const [x, y] of [[54, 8], [58, 12]]) b.enemy('echoSoldier', x, y, 9);
  b.enemy('wraith', 14, 18, 8); b.enemy('wraith', 10, 16, 8);
  b.enemy('echoArcher', 36, 8, 9); b.enemy('echoSoldier', 32, 10, 9);
  b.enemy('echoSoldier', 12, 55, 9); b.enemy('wraith', 16, 54, 9);

  // --- добыча
  b.chest('vf_chest1', 18, 15, [['gold', 90], ['p_hp2', 2]]);
  b.chest('vf_chest2', 33, 12, [['gold', 85], ['p_mp2', 2]]);
  b.chest('vf_chest3', 58, 53, [['gold', 100], ['p_hp2', 1], ['c_wolf', 1]]);
  b.chest('vf_chest4', 66, 16, [['gold', 100], ['@weapon3', 1]]);
  b.chest('vf_chest5', 88, 8, [['gold', 110], ['p_mp3', 1]]);
  b.chest('vf_chest6', 10, 58, [['gold', 90], ['p_hp2', 2], ['c_spirit', 1]]);
  b.chest('vf_chest7', 44, 56, [['gold', 100], ['@armor3', 1]]);
  b.chest('vf_chest8', 90, 44, [['gold', 95], ['p_hp3', 1]]);
  b.node('echo_res', 'q_sample', 63, 27);                       // застывшее излучение в кургане
  for (const [id, x, y] of [['tag1', 22, 28], ['tag2', 40, 38], ['tag3', 56, 30], ['tag4', 70, 28], ['tag5', 48, 52], ['tag6', 20, 20]]) b.node(id, 'q_tag', x, y);

  b.portal('to_city', 1, 30, 2, 4, 'city_market', { x: 68.5, y: 23.5 });
  b.portal('to_pass', 93, 30, 2, 4, 'valley_pass', { x: 4.5, y: 24.5 });

  b.border(3, T.TREE);
  b.forest(0.7, 0.12, 5);
  b.litter('bush', 40, 3);
  return b.finish();
}

// ======================================================================= ХРАНИЛИЩЕ МЕРЫ, ВЕРХНИЙ ЗАЛ
const vaultProps = (b, rooms) => {
  for (const [x, y, w, h] of rooms) {
    b.scatter('pillar', 3, x, y, w, h);
    b.scatter('boulder', 2, x, y, w, h);
  }
};

export function vault1() {
  const b = new Builder('vault1', 56, 44, 61, T.CWALL);
  b.spawn = { x: 27, y: 38 };
  const F = T.CRYPT;
  b.room(21, 34, 14, 8, F);            // вход
  b.room(4, 32, 10, 8, F);             // западная палата
  b.room(13, 36, 8, 4, F);
  b.room(42, 32, 10, 8, F);            // восточная палата
  b.room(35, 36, 7, 4, F);
  b.room(26, 26, 4, 8, F);             // коридор к залу
  b.room(14, 12, 28, 14, F);           // главный зал
  b.room(5, 14, 8, 8, F);              // западная ниша
  b.room(12, 17, 3, 4, F);
  b.room(44, 14, 8, 8, F);             // восточная ниша
  b.room(41, 17, 4, 4, F);
  b.room(26, 10, 4, 2, F);             // проход к лестнице
  b.room(22, 3, 12, 7, F);             // комната лестницы

  vaultProps(b, [[22, 13, 18, 11], [43, 33, 8, 6], [5, 33, 8, 6]]);
  b.prop('brazier', 22, 35); b.prop('brazier', 33, 35); b.prop('brazier', 16, 13); b.prop('brazier', 39, 13); b.prop('brazier', 23, 4); b.prop('brazier', 32, 4);
  b.prop('stairs', 27, 40, { id: 'v1_up' });
  b.prop('stairs', 27, 4, { id: 'v1_down' });
  b.prop('shrine', 24, 36, { id: 'shrine_vault1', use: 'shrine', name: 'Алтарь у входа' });
  b.prop('bookshelf', 15, 14); b.prop('bookshelf', 37, 14);

  // рычаги, двери и барьеры
  b.prop('lever', 6, 33, { id: 'lv1a', use: 'lever', text: 'Рычаг с медной рукоятью' });
  b.prop('lever', 50, 33, { id: 'lv1b', use: 'lever', text: 'Рычаг с костяной рукоятью' });
  b.prop('lever', 6, 15, { id: 'lv1c', use: 'lever', text: 'Рычаг под плитой' });
  b.prop('stonedoor', 26, 30, { id: 'd1' });
  b.doors.push({ id: 'd1', x: 26, y: 30, w: 4, h: 2, opens: ['lv1a', 'lv1b'] });
  b.prop('barrier', 26, 10, { id: 'bar1', flagGone: 'lv1c' });
  b.doors.push({ id: 'bar1', x: 26, y: 10, w: 4, h: 1, opens: ['lv1c'] });
  b.prop('sign', 24, 38, { use: 'sign', text: 'На двери две выемки под рычаги. Одна рука здесь не справится. (Кто-то нацарапал: «И одна голова тоже».)' });

  // страницы: обрывки записей Меры
  b.prop('table', 8, 36, { use: 'page', id: 'pg_v1a', title: 'Журнал Меры, лист первый', text: 'Семь поглотителей, один счёт. Допуск на третьем 0,03. «Если третий уйдёт в перекос, остальные возьмут нагрузку, но не надолго». Приписано другим почерком: «Считал трое суток. Выходит, что мы построили плотину и забыли про воду».' });
  b.prop('table', 46, 36, { use: 'page', id: 'pg_v1b', title: 'Перечень Законодателя', text: 'Список казнённых за год: одиннадцать тысяч четыреста. Основание: «нарушение меры». Ниже приписка рукой, привыкшей к печатям: «Освобождение не будет бескровным. Освободителей назначить из числа смертных. Они не должны знать, что выбраны».' });
  b.prop('table', 8, 18, { use: 'page', id: 'pg_v1c', title: 'Копия договора', text: 'Договор о Памяти. Сторона первая: боги. Сторона вторая: люди. «Люди отдают то, что хотят забыть. Боги держат то, что люди не вынесут. Срок: пока помнит хотя бы один». Подписи выскоблены, остался один оттиск: круг и семь точек.' });
  b.prop('table', 47, 18, { use: 'page', id: 'pg_v1d', title: 'Запись привратника', text: 'Я стою у двери четыреста лет. Мне велено не пускать того, кто придёт с вопросом, пока он не покажет, что вопрос не его собственный. Никто ещё не показал. Все приходили с чужими вопросами, и я понимаю их.' });
  b.prop('sign', 28, 20, { use: 'sign', text: 'Над залом высечено слово, затёртое до половины: «МЕР…». Остальное восстановить нельзя, но все, кто читал, достроили его по-своему.' });

  // тень Архивариуса: проводник
  b.npc('meris', 30, 38);
  // образцы Лаборанта: застывшие осколки
  for (const [id, x, y] of [['sh1', 7, 38], ['sh2', 49, 38], ['sh3', 10, 20], ['sh4', 47, 20]]) b.node(id, 'q_shard', x, y);

  // враги (8-10)
  for (const [x, y] of [[8, 36], [11, 34]]) b.enemy('wraith', x, y, 9);
  b.enemy('echoSoldier', 47, 36, 9); b.enemy('echoArcher', 45, 34, 9); b.enemy('wraith', 50, 38, 9);
  for (const [x, y] of [[18, 20], [24, 22]]) b.enemy('echoSoldier', x, y, 10);
  for (const [x, y] of [[34, 20], [38, 22]]) b.enemy('echoArcher', x, y, 10);
  b.enemy('echoBrute', 30, 16, 10); b.enemy('wraith', 22, 16, 10); b.enemy('wraith', 36, 16, 10);
  b.enemy('echoSoldier', 8, 18, 10); b.enemy('echoSoldier', 48, 18, 10); b.enemy('wraith', 10, 20, 10);
  b.enemy('echoSoldier', 24, 6, 10); b.enemy('echoArcher', 31, 7, 10);

  b.chest('v1_chest1', 11, 15, [['gold', 100], ['p_hp2', 2]]);
  b.chest('v1_chest2', 50, 16, [['gold', 100], ['p_mp2', 2], ['c_scholar', 1]]);
  b.chest('v1_chest3', 12, 38, [['gold', 90], ['p_hp2', 1]]);
  b.chest('v1_chest4', 28, 5, [['gold', 120], ['@armor3', 1]]);
  b.zone('vault2_gate', 22, 3, 12, 7);
  b.portal('v1_out', 27, 40, 2, 1, 'valley_fields', { x: 47.5, y: 9.5 });
  b.portal('v1_down', 27, 4, 2, 1, 'vault2', { x: 27.5, y: 7.5 });
  return b.finish();
}

// ======================================================================= ХРАНИЛИЩЕ МЕРЫ, НИЖНИЙ ЗАЛ
export function vault2() {
  const b = new Builder('vault2', 56, 44, 62, T.CWALL);
  b.spawn = { x: 27, y: 7 };
  const F = T.CRYPT;
  b.room(22, 3, 12, 7, F);             // комната лестницы
  b.room(26, 10, 4, 6, F);
  b.room(10, 16, 36, 12, F);           // центральный зал
  b.room(3, 17, 6, 10, F);             // западное крыло
  b.room(8, 20, 3, 4, F);
  b.room(47, 17, 6, 10, F);            // восточное крыло
  b.room(45, 20, 3, 4, F);
  b.room(26, 28, 4, 7, F);             // коридор к залу Привратника
  b.room(12, 35, 32, 8, F);            // зал Привратника

  vaultProps(b, [[11, 17, 34, 10], [13, 36, 30, 6], [3, 18, 6, 8], [47, 18, 6, 8]]);
  b.prop('brazier', 23, 4); b.prop('brazier', 32, 4); b.prop('brazier', 12, 17); b.prop('brazier', 43, 17); b.prop('brazier', 13, 36); b.prop('brazier', 42, 36);
  b.prop('stairs', 27, 4, { id: 'v2_up' });
  b.prop('statue', 21, 36); b.prop('statue', 34, 36);

  // двери и барьеры
  b.prop('lever', 4, 18, { id: 'lv2a', use: 'lever', text: 'Рычаг с вытертой рукоятью' });
  b.prop('lever', 51, 18, { id: 'lv2b', use: 'lever', text: 'Рычаг с обугленной рукоятью' });
  b.prop('lever', 24, 8, { id: 'lv2c', use: 'lever', text: 'Рычаг у лестницы' });
  b.prop('barrier', 26, 12, { id: 'bar2', flagGone: 'lv2c' });
  b.doors.push({ id: 'bar2', x: 26, y: 12, w: 4, h: 1, opens: ['lv2c'] });
  b.prop('stonedoor', 26, 29, { id: 'd2' });
  b.doors.push({ id: 'd2', x: 26, y: 29, w: 4, h: 2, opens: ['lv2a', 'lv2b'] });
  b.prop('sign', 31, 8, { use: 'sign', text: 'Если рычаг ведёт к ловушке, ловушка подождёт. Если ведёт к двери, дверь подождёт. Привратник ждёт лучше обеих.' });

  // страницы
  b.prop('table', 5, 25, { use: 'page', id: 'pg_v2a', title: 'Расчёт третьего маяка', text: 'Нагрузка на третий растёт. Если не сменить кристалл, он треснет к сроку. Если сменить, придётся обесточить остальные на ночь. Принято решение: не менять. Приписка: «Мы выбрали не тех, кому придётся расплачиваться».' });
  b.prop('table', 48, 25, { use: 'page', id: 'pg_v2b', title: 'Протокол освобождения', text: 'Выбранные смертные получили Ключи и ушли. Часть вернулась. Вернулись не те. «Законодатель казнён. Знающий передал силу добровольно. Тот, что держал удачу, проспорил. Остальные… в протокол не вносить».' });
  b.prop('table', 21, 26, { use: 'page', id: 'pg_v2c', title: 'Последняя запись Меры', text: 'Если читающий дошёл сюда, значит, Привратник сказал правду: вопрос не чужой. Свидетельство лежит под ним. В нём всё, и оно никому не подходит целиком. Каждый, кто его прочтёт, возьмёт себе ровно столько, сколько сможет унести.' });

  b.npc('meris_b', 30, 8);
  b.prop('beacon', 38, 37, { id: 'beacon3', use: 'beacon', beacon: 3, silent: 'Маяк молчит. В гнезде пустота размером с кулак. Тёплая пустота.' });
  b.enemy('gatekeeper', 27, 39, 12, { unique: 'gatekeeper' });
  b.zone('keeper_hall', 12, 35, 32, 8);
  b.zone('vault2_in', 22, 3, 12, 7);

  for (const [x, y] of [[14, 20], [18, 24]]) b.enemy('echoSoldier', x, y, 11);
  for (const [x, y] of [[36, 20], [40, 24]]) b.enemy('echoArcher', x, y, 11);
  b.enemy('echoBrute', 28, 20, 11); b.enemy('wraith', 20, 18, 11); b.enemy('wraith', 34, 18, 11); b.enemy('wraith', 25, 25, 11);
  b.enemy('wraith', 5, 22, 11); b.enemy('echoSoldier', 7, 20, 11);
  b.enemy('wraith', 50, 22, 11); b.enemy('echoSoldier', 50, 26, 11);

  b.chest('v2_chest1', 4, 25, [['gold', 130], ['p_hp3', 1]]);
  b.chest('v2_chest2', 52, 25, [['gold', 130], ['p_mp3', 1]]);
  b.chest('v2_chest3', 36, 40, [['gold', 160], ['@weapon3', 1], ['p_hp3', 1]]);
  b.portal('v2_out', 27, 4, 2, 1, 'vault1', { x: 27.5, y: 7.5 });
  return b.finish();
}

// ======================================================================= АББАТСТВО БЕЗМОЛВНЫХ
export function abbey() {
  const b = new Builder('abbey', 60, 44, 63, T.CWALL);
  b.spawn = { x: 30, y: 39 };
  const F = T.COBBLE, W = T.WOOD;
  b.room(24, 36, 12, 6, F);            // привратная
  b.room(28, 34, 4, 2, F);
  b.room(18, 22, 24, 12, F);           // внутренний двор
  b.rect(22, 25, 16, 6, T.GRASS, true);
  b.room(28, 19, 4, 3, F);
  b.room(22, 8, 16, 11, F);            // часовня
  b.room(14, 26, 5, 4, F);             // к кельям
  b.room(3, 20, 12, 12, W);            // кельи
  b.room(41, 26, 6, 4, F);             // к архиву
  b.room(46, 18, 12, 16, W);           // архив
  b.room(15, 38, 9, 3, F);             // к трапезной
  b.room(4, 34, 12, 8, W);             // трапезная
  b.room(36, 38, 8, 3, F);             // к келье молчания
  b.room(44, 36, 12, 6, F);            // келья молчания

  b.prop('brazier', 25, 37); b.prop('brazier', 34, 37); b.prop('brazier', 19, 23); b.prop('brazier', 40, 23); b.prop('brazier', 23, 9); b.prop('brazier', 36, 9);
  b.prop('well', 29, 27);
  b.prop('statue', 24, 23); b.prop('statue', 35, 23);
  b.prop('shrine', 38, 13, { id: 'shrine_abbey', use: 'shrine', name: 'Алтарь Безмолвных' });
  b.prop('monolith', 29, 10, { use: 'page', id: 'pg_ab_mono', title: 'Камень в часовне', text: 'На камне одна строка, без подписи, без даты и без смысла, который кто-то мог бы присвоить: «Здесь был тот, кто сделал».' });
  for (const [x, y] of [[24, 15], [35, 15], [24, 11], [35, 11]]) b.prop('pillar', x, y);
  // кельи
  for (const [x, y] of [[4, 21], [4, 25], [4, 29], [10, 21], [10, 25]]) b.prop('bed', x, y);
  b.prop('table', 8, 30);
  // трапезная
  b.prop('table', 7, 36); b.prop('table', 11, 36); b.prop('barrel', 5, 40); b.prop('barrel', 6, 40); b.prop('crate', 14, 40);
  // архив
  for (const [x, y] of [[47, 19], [51, 19], [55, 19]]) b.prop('bookshelf', x, y);
  for (const [x, y] of [[47, 24], [51, 24]]) b.prop('bookshelf', x, y);
  b.prop('table', 53, 24); b.prop('table', 48, 29); b.prop('lamp', 54, 29); b.prop('lamp', 47, 32);
  b.prop('bookshelf', 55, 32);
  // келья молчания
  b.prop('coffin', 46, 37); b.prop('coffin', 50, 37); b.prop('brazier', 45, 40);

  // страницы: свидетельства о войне
  b.prop('table', 52, 29, { use: 'page', id: 'pg_ab1', title: 'Из архива аббатства', text: 'Мы пришли сюда после последней битвы. Нас было сорок человек, и каждый просил об одном: забыть. Игумен принимал клятву и снимал память, как снимают повязку. Договор обязывал его. Что именно он обязывал, мы не спрашивали. Нам было достаточно, что больше не будет сниться.' });
  b.prop('table', 7, 29, { use: 'page', id: 'pg_ab2', title: 'Дневник послушника', text: 'Сегодня брат Томас плакал и не мог объяснить, о чём. Игумен сказал: «Значит, снимается». Я записываю, чтобы потом спросить, о чём плакал брат. Спросить некого: через месяц он не будет помнить, что плакал, и я тоже.' });
  b.prop('table', 14, 39, { use: 'page', id: 'pg_ab3', title: 'Хозяйственная книга', text: 'Хлеб на сорок ртов. Свечи. Воск. Приход: пожертвования от «тех, кому нужно забыть». Расход: молчание на двести лет вперёд. Отдельной строкой: «Ключ от Хранилища выдан Хранителю архива и не подлежит передаче». Рядом печать: круг и семь точек.' });
  b.prop('table', 48, 37, { use: 'page', id: 'pg_ab4', title: 'Записка в келье молчания', text: 'Тому, кто придёт после: мы забыли не потому, что нас заставили. Мы забыли, потому что помнить было нечем. Что бы вам ни рассказали про войну, помните, что рассказывающие всегда были на чьей-то стороне. Мы были на стороне тишины.' });

  // люди
  b.npc('prior', 30, 24);
  b.npc('mav', 51, 27);
  b.npc('tomas', 8, 27);
  b.npc('brother_pol', 9, 38);
  b.npc('monk_chapel', 28, 13);
  b.npc('ghost_abbot', 49, 39, { hideIf: 'abbot_gone' });
  b.npc('inspector', 30, 31, { showIf: 'proof_council' });
  for (const [x, y] of [[26, 28], [34, 30]]) b.node('abtag' + x, 'q_tag', x, y);   // жетоны, оставленные послушниками

  // эхо забытых
  for (const [x, y] of [[26, 14], [34, 16], [30, 17]]) b.enemy('wraith', x, y, 10);
  for (const [x, y] of [[48, 40], [53, 38]]) b.enemy('wraith', x, y, 10);
  b.enemy('echoSoldier', 55, 22, 10); b.enemy('echoSoldier', 50, 32, 10);
  b.enemy('wraith', 9, 22, 10);

  b.chest('ab_chest1', 56, 20, [['gold', 110], ['p_mp2', 2], ['c_scholar', 1]]);
  b.chest('ab_chest2', 5, 40, [['gold', 100], ['p_hp2', 2]]);
  b.chest('ab_chest3', 54, 40, [['gold', 120], ['p_hp3', 1]]);
  b.zone('archive', 46, 18, 12, 16);
  b.zone('chapel', 22, 8, 16, 11);
  b.portal('ab_out', 28, 41, 4, 1, 'valley_fields', { x: 24.5, y: 47.5 });
  return b.finish();
}

// ======================================================================= ПЕРЕВАЛ ДВУХ ДОРОГ
export function valley_pass() {
  const b = new Builder('valley_pass', 80, 48, 64, T.ROCK);
  b.spawn = { x: 4, y: 24 };

  // открытые участки в скалах
  b.blob(40, 24, 10, 8, T.GRASS, true, 0.2);
  b.blob(17, 22, 9, 8, T.GRASS, true, 0.25);
  b.blob(63, 21, 9, 8, T.GRASS, true, 0.25);
  b.blob(14, 8, 6, 4, T.GRASS, true, 0.25);
  b.blob(64, 38, 8, 5, T.GRASS, true, 0.25);
  b.blob(55, 8, 7, 5, T.GRASS, true, 0.25);
  b.blob(24, 39, 7, 4, T.GRASS, true, 0.25);
  b.disc(40, 24, 5.5, T.COBBLE);
  // дороги
  b.path([[1, 24], [20, 24], [40, 24]], 4, T.DIRT);
  b.path([[40, 24], [60, 24], [78, 24]], 4, T.DIRT);
  b.path([[40, 24], [40, 12], [40, 1]], 4, T.DIRT);
  b.path([[40, 24], [40, 36], [40, 46]], 4, T.DIRT);
  b.path([[17, 22], [15, 14], [14, 8]], 2, T.DIRT);
  b.path([[63, 22], [58, 14], [55, 8]], 2, T.DIRT);
  b.path([[63, 24], [64, 32], [64, 38]], 2, T.DIRT);
  b.path([[40, 36], [30, 38], [24, 39]], 2, T.DIRT);
  b.rect(1, 22, 7, 4, T.DIRT, true);
  b.rect(72, 22, 7, 4, T.DIRT, true);
  b.rect(38, 1, 4, 10, T.DIRT, true);
  b.rect(38, 38, 4, 9, T.DIRT, true);

  // барьеры Меры на закрытых дорогах: север и восток исчезают с pass_open, юг с gate_open
  b.prop('barrier', 38, 5, { id: 'pbar_n', flagGone: 'pass_open' });
  b.doors.push({ id: 'pbar_n', x: 38, y: 5, w: 4, h: 1, opens: ['pass_open'] });
  for (let j = 0; j < 4; j++) b.prop('barrier', 70, 22 + j, { flagGone: 'pass_open' });
  b.doors.push({ id: 'pbar_e', x: 70, y: 22, w: 4, h: 4, opens: ['pass_open'] });
  b.prop('barrier', 38, 41, { id: 'pbar_s', flagGone: 'gate_open' });
  b.doors.push({ id: 'pbar_s', x: 38, y: 41, w: 4, h: 1, opens: ['gate_open'] });

  // указатели
  b.prop('post', 36, 19); b.prop('post', 44, 29);
  b.prop('sign', 37, 20, { use: 'sign', text: 'СЕВЕР: Бастион Торна. Закон высечен в стене, и стена высока.' });
  b.prop('sign', 43, 20, { use: 'sign', text: 'ВОСТОК: Порт Серой Воды. Корабли приходят, но уходят не все.' });
  b.prop('sign', 37, 28, { use: 'sign', text: 'ЗАПАД: Долина Былых Сражений. Назад смотреть не обязательно.' });
  b.prop('sign', 43, 28, { use: 'sign', text: 'ЮГ: Цитадель. (Табличку кто-то перевернул лицом вниз. Под ней нацарапано: «Не сегодня».)' });
  b.prop('statue', 34, 24); b.prop('statue', 46, 24);

  // лагерь торговца (западная поляна)
  b.prop('hut2', 12, 18); b.prop('cart', 19, 21); b.prop('crate', 21, 20); b.prop('barrel', 22, 21); b.prop('campfire', 16, 24); b.prop('tent', 11, 24);
  b.npc('yorsh', 18, 23);
  // смотритель
  b.prop('lamp', 38, 21); b.prop('lamp', 42, 21);
  b.npc('keeper', 40, 21);
  b.npc('hok', 14, 9);
  // отряды после решения о Свидетельстве
  b.npc('guard_p1', 36, 24, { showIf: 'proof_council' }); b.npc('guard_p2', 44, 24, { showIf: 'proof_council' });
  b.npc('surveyor_p', 36, 26, { showIf: 'proof_collegium' });
  b.npc('pilgrim_p', 44, 26, { showIf: 'proof_remembering' });
  b.npc('ash_monk', 41, 27, { showIf: 'proof_burn' });
  b.prop('tent', 65, 18); b.prop('campfire', 63, 21);
  b.npc('ghost_p', 62, 23);

  // алтари: Ори, Сейр, Исса
  b.prop('godaltar', 54, 10, { god: 'ori', use: 'altar', title: 'Плита на склоне', text: 'Плита покрыта мелкими бороздками, как страница, которую читали пальцами.' });
  b.npc('vis_ori', 54, 12);
  b.prop('godaltar', 47, 26, { god: 'seyr', use: 'altar', title: 'Перекрёсток', text: 'Здесь сходятся четыре дороги. На камне вытерт круг: туда кладут монету.' });
  b.npc('vis_seyr', 47, 28);
  b.prop('godaltar', 64, 40, { god: 'issa', use: 'altar', title: 'Чёрное зеркало', text: 'Камень отполирован до блеска. В нём отражается чьё-то лицо, и оно не твоё.' });
  b.npc('vis_issa', 64, 42);

  // враги (10-12)
  for (const [x, y] of [[26, 21], [28, 27]]) b.enemy('echoSoldier', x, y, 11);
  b.enemy('echoArcher', 24, 25, 11); b.enemy('echoArcher', 29, 19, 11);
  for (const [x, y] of [[53, 22], [56, 26]]) b.enemy('echoSoldier', x, y, 11);
  b.enemy('echoArcher', 55, 20, 11); b.enemy('echoArcher', 59, 24, 11); b.enemy('echoArcher', 60, 19, 11);
  b.enemy('echoBrute', 66, 40, 12); b.enemy('wraith', 62, 37, 12); b.enemy('wraith', 68, 38, 12);
  b.enemy('wraith', 56, 7, 12); b.enemy('echoSoldier', 53, 8, 12);
  b.enemy('echoBrute', 40, 12, 12);
  b.enemy('echoSoldier', 25, 38, 12); b.enemy('wraith', 27, 40, 12);
  b.enemy('echoSoldier', 15, 7, 11);

  b.chest('vp_chest1', 66, 18, [['gold', 130], ['p_hp3', 1]]);
  b.chest('vp_chest2', 23, 40, [['gold', 120], ['p_mp3', 1], ['@weapon3', 1]]);
  b.chest('vp_chest3', 56, 6, [['gold', 140], ['p_hp3', 1]]);
  b.chest('vp_chest4', 13, 6, [['gold', 110], ['c_wolf', 1]]);
  b.node('p_res', 'q_tag', 31, 25);
  b.zone('crossroads', 34, 19, 12, 11);

  b.portal('to_valley', 1, 22, 2, 4, 'valley_fields', { x: 91.5, y: 32.5 });
  b.portal('to_bastion', 38, 1, 4, 2, 'bastion', { x: 40.5, y: 60.5 }, { req: { flag: 'pass_open', msg: 'Дорога на север закрыта Мерой. Барьер держится, пока Привратник не отвечен.' } });
  b.portal('to_harbor', 77, 22, 2, 4, 'harbor', { x: 4.5, y: 30.5 }, { req: { flag: 'pass_open', msg: 'Дорога на восток закрыта Мерой. Барьер держится, пока Привратник не отвечен.' } });
  b.portal('to_citadel', 38, 45, 4, 2, 'citadel_gate', { x: 30.5, y: 36.5 }, { req: { flag: 'gate_open', msg: 'Дорога на юг закрыта. Эти врата открываются двумя ключами, и у вас их нет.' } });

  b.border(2, T.ROCK);
  b.scatter('boulder', 22, 3, 3, 74, 42, { deco: true });
  b.litter('bush', 14, 3);
  return b.finish();
}

export const BUILD = { valley_fields, vault1, vault2, abbey, valley_pass };
