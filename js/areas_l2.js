// Локация 2: Каменный Мост. Рынок, Нижний город, квартал Коллегии, Храм Семи, Стоки.
import { Builder, PROP_DEF } from './maps_core.js';
import { T } from './defs.js';

// ---------------------------------------------------------------- общие помощники
// городская стена по краю карты (толщина th)
function rim(b, th = 2, t = T.WALL) {
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (Math.min(i, j, b.w - 1 - i, b.h - 1 - j) < th) b.set(i, j, t);
}
// проём в стене
const gap = (b, x, y, w, h, t = T.COBBLE) => b.rect(x, y, w, h, t);
// здание ставится, только если не пересекает улицы (keep) и другие объекты
function maker(b, keep) {
  const hit = (k, x, y) => {
    const d = PROP_DEF[k];
    for (const [kx, ky, kw, kh] of keep) if (x < kx + kw && x + d.w > kx && y < ky + kh && y + d.h > ky) return true;
    for (const p of b.props) if (x < p.x + p.w && x + d.w > p.x && y < p.y + p.h && y + d.h > p.y) return true;
    return false;
  };
  return (k, x, y, extra) => {
    if (hit(k, x, y)) { if (typeof process !== 'undefined' && process.env.MAPDEBUG) console.warn(`${b.id}: ${k} (${x},${y}) пересекается`); return null; }
    return b.prop(k, x, y, extra);
  };
}
// ряд фонарей
const lamps = (b, put, pts) => { for (const [x, y] of pts) put('lamp', x, y); };

// ======================================================================= РЫНОК
export function city_market() {
  const b = new Builder('city_market', 72, 48, 201, T.COBBLE);
  b.spawn = { x: 32, y: 40 };
  const keep = [[14, 0, 3, 48], [31, 0, 6, 48], [55, 0, 3, 48], [0, 9, 72, 2], [0, 19, 72, 8], [0, 36, 72, 2]];
  const put = maker(b, keep);
  const dec = maker(b, []);

  // площади и мостовая
  b.disc(34, 22, 8.5, T.PLAZA, true);
  b.rect(37, 16, 18, 4, T.PLAZA, true);                  // площадь Совета
  b.rect(38, 26, 17, 10, T.PLAZA, true);                 // торговые ряды
  b.rect(31, 2, 6, 8, T.PLAZA, true);                    // подход к Храму
  b.rect(28, 36, 12, 9, T.PLAZA, true);                  // южная площадка у ворот

  // сады за домами
  for (const [x, y, w, h] of [[2, 2, 12, 4], [18, 2, 12, 3], [59, 2, 10, 3], [2, 11, 12, 4], [18, 11, 12, 4], [59, 11, 10, 4], [38, 2, 16, 3]]) b.rect(x, y, w, h, T.GRASS);
  rim(b, 2);
  gap(b, 31, 46, 6, 2); gap(b, 70, 22, 2, 4); gap(b, 0, 22, 2, 4); gap(b, 14, 0, 3, 2); gap(b, 32, 0, 4, 2);

  // дома кварталов
  const houses = [
    ['house', 2, 6], ['house', 8, 6], ['house', 18, 6], ['hut2', 24, 7], ['hut2', 27, 7], ['house', 45, 6], ['hut2', 51, 7], ['house', 59, 6], ['house', 64, 6],
    ['house', 2, 16], ['house', 8, 16], ['house', 18, 16], ['hut2', 24, 17], ['hut2', 27, 17], ['house', 59, 16], ['house', 64, 16],
    ['house', 2, 28], ['house', 8, 28], ['house', 2, 33], ['house', 8, 33], ['house', 18, 28], ['house', 24, 28], ['house', 18, 33], ['hut2', 24, 33], ['hut2', 27, 33],
    ['house', 59, 28], ['house', 64, 28], ['house', 59, 33], ['house', 64, 33],
    ['house', 2, 42], ['house', 8, 42], ['house', 18, 42], ['hut2', 24, 43], ['hut2', 27, 43], ['smithy', 38, 42], ['house', 44, 42], ['hut2', 50, 43], ['house', 59, 42], ['house', 64, 42],
  ];
  for (const [k, x, y] of houses) put(k, x, y);
  put('tavern', 38, 6);

  // Ратуша Совета
  put('house', 38, 13); put('house', 44, 13); put('house', 50, 13);
  for (const x of [41, 47, 53]) dec('banner', x, 16);
  dec('banner', 38, 16);
  dec('statue', 36, 17);
  dec('sign', 37, 19, { use: 'sign', title: 'Указ Совета', text: 'Сны не являются доказательством. Рассказывать о снах дело частное, скрывать их запрещено. Видящих просят явиться в Ратушу за пособием и присмотром. — Совет Каменного Моста' });

  // маяк №2 в центре площади
  b.prop('beacon', 33, 21, { id: 'beacon2', use: 'beacon', beacon: 2, silent: 'Башня молчит. Гнездо под куполом пусто: сердце маяка исчезло так давно, что в городе об этом успели привыкнуть. Из-под плит тянет холодом, и в камне, если приложить ладонь, чувствуется далёкое неровное биение.' });
  for (const [x, y] of [[30, 18], [37, 18], [30, 26], [37, 26]]) dec('lamp', x, y);
  dec('statue', 33, 18); dec('statue', 35, 18);
  b.zone('beacon2_area', 29, 17, 10, 10);

  // торговые ряды
  for (const x of [39, 43, 47, 51]) dec('stall', x, 28);
  for (const x of [40, 44, 48, 52]) dec('stall', x, 33);
  dec('well', 45, 30);
  for (const [k, x, y] of [['barrel', 42, 28], ['crate', 46, 28], ['barrel', 54, 28], ['crate', 39, 33], ['cart', 49, 31], ['barrel', 54, 33], ['crate', 43, 33]]) dec(k, x, y);

  // подходы и ворота
  dec('gate', 32, 46);
  for (const [x, y] of [[31, 44], [36, 44]]) dec('lamp', x, y);
  for (const [x, y] of [[68, 21], [68, 26]]) dec('lamp', x, y);
  dec('banner', 66, 21); dec('banner', 66, 26); dec('rack', 64, 24);
  for (const [x, y] of [[3, 21], [3, 26]]) dec('lamp', x, y);
  dec('pillar', 31, 2); dec('pillar', 36, 2); dec('statue', 31, 5); dec('statue', 36, 5); dec('brazier', 33, 6); dec('brazier', 34, 6);
  dec('lamp', 13, 4); dec('lamp', 17, 4);
  lamps(b, dec, [[30, 12], [37, 12], [30, 36], [37, 36], [13, 22], [17, 22], [54, 22], [58, 22], [13, 38], [17, 38], [54, 38], [58, 38], [13, 30], [17, 30], [54, 30], [58, 30]]);
  dec('sign', 4, 21, { use: 'sign', title: 'Табличка', text: 'Нижний город. Стража не ходит дальше третьего фонаря, а фонарей там два. Кошелёк держите ближе к телу.' });
  dec('sign', 13, 6, { use: 'sign', title: 'Табличка', text: 'Квартал Коллегии. Посторонним: тишина. Студентам: тише.' });
  dec('sign', 30, 6, { use: 'sign', title: 'Табличка', text: 'Храм Семи. Алтари открыты днём и ночью. Вопросы Слушающей задавать на выходе, не на входе.' });
  dec('sign', 60, 23, { use: 'sign', title: 'Табличка', text: 'Восточные ворота. Долина Былых Сражений: проход по пропускам. Раненых, мародёров и археологов не принимаем.' });
  dec('sign', 30, 43, { use: 'sign', title: 'Табличка', text: 'Каменный Мост. Оружие носить разрешено. Применять в черте города разрешено только страже.' });
  // уголки и мелочь
  for (const [k, x, y] of [['barrel', 13, 26], ['crate', 13, 27], ['cart', 56, 40], ['barrel', 30, 34], ['crate', 16, 40], ['barrel', 57, 18], ['crate', 12, 19], ['rack', 20, 22]]) dec(k, x, y);
  dec('fence', 3, 11); dec('fence', 4, 11); dec('fence', 5, 11); dec('fence', 19, 11); dec('fence', 20, 11); dec('fence', 21, 11);

  // сундуки в переулках
  b.chest('cm_chest1', 7, 31, [['gold', 70], ['p_hp2', 1]]);
  b.chest('cm_chest2', 29, 31, [['gold', 60], ['p_mp2', 2]]);
  b.chest('cm_chest3', 63, 38, [['gold', 85], ['p_hp2', 2]]);

  // жители
  b.npc('consul', 45, 18);
  b.npc('cguard_a', 41, 18); b.npc('cguard_b', 49, 18);
  b.npc('faddei', 39, 19, { hideIf: 'fac_collegium' });
  b.npc('orin', 52, 19);
  b.npc('brekk', 54, 19, { showIf: 'fac_council' });
  b.npc('miren_c', 36, 19, { showIf: 'seer_handed', hideIf: 'fac_rem' });
  b.npc('gatecap', 66, 23);
  b.npc('crier', 38, 24);
  b.npc('bard', 28, 23);
  b.npc('avram', 24, 22, { hideIf: 'prophet_gone' });
  b.npc('zara', 44, 27);
  b.npc('fishwife', 41, 32);
  b.npc('tilda', 44, 31);
  b.npc('vessa', 41, 9);
  b.npc('otto', 5, 24);
  b.npc('porter_m', 60, 25);

  b.zone('market_gate', 28, 38, 10, 6);
  b.portal('to_darkforest', 31, 45, 6, 2, 'darkforest', { x: 47.5, y: 8.5 });
  b.portal('to_valley', 70, 22, 2, 4, 'valley_fields', { x: 4.5, y: 32.5 }, { req: { flag: 'valley_open', msg: 'Ворота закрыты. Пропуск в долину выдают те, кому вы нужны. Спросите капитана.' } });
  b.portal('to_low', 0, 22, 2, 4, 'city_low', { x: 60.5, y: 23.5 });
  b.portal('to_college', 14, 0, 3, 2, 'city_college', { x: 31.5, y: 43.5 });
  b.portal('to_temple', 32, 0, 4, 2, 'city_temple', { x: 24.5, y: 36.5 });
  return b.finish();
}

// ======================================================================= НИЖНИЙ ГОРОД
export function city_low() {
  const b = new Builder('city_low', 64, 48, 202, T.DIRT);
  b.spawn = { x: 60, y: 23 };
  const keep = [[0, 22, 64, 4], [34, 4, 4, 36], [10, 13, 4, 12]];
  const put = maker(b, keep);
  const dec = maker(b, []);

  // река и набережная
  b.rect(0, 41, 64, 7, T.WATER); b.rect(0, 44, 64, 4, T.DEEP);
  b.rect(0, 39, 64, 2, T.SAND);
  rim(b, 2);
  b.rect(0, 41, 64, 7, T.WATER); b.rect(0, 44, 64, 4, T.DEEP);
  b.rect(20, 38, 3, 6, T.BRIDGE); b.rect(44, 38, 3, 5, T.BRIDGE); b.rect(8, 38, 3, 4, T.BRIDGE);
  // улицы
  b.path([[62, 23.5], [20, 23.5]], 4, T.COBBLE);
  b.path([[36, 5], [36, 23]], 2, T.DIRT);
  b.path([[36, 26], [36, 38]], 2, T.DIRT);
  b.path([[12, 14], [12, 23]], 2, T.DIRT);
  b.path([[48, 17], [48, 22]], 3, T.DIRT);
  b.rect(54, 20, 9, 8, T.PLAZA, true);
  gap(b, 62, 22, 2, 4);

  // часовня Вспоминающих (стена + деревянный пол)
  b.rect(5, 4, 16, 11, T.WALL, true); b.rect(7, 6, 12, 7, T.WOOD, true); gap(b, 11, 13, 2, 2, T.WOOD);
  b.prop('bookshelf', 7, 6); b.prop('bookshelf', 9, 6); b.prop('bookshelf', 15, 6); b.prop('bookshelf', 17, 6);
  b.prop('table', 12, 8, { use: 'page', id: 'rem_list', title: 'Список Вспоминающих', text: 'Тетрадь в холщовой обложке. На каждой странице имя, дата и одна строка: «Видит поле», «Слышит голос», «Просыпается на одном и том же слове». Рядом пометки, где человека можно спрятать и кто ему готов помочь. Это не список для суда. Но в руках Охотников он станет именно им.', fx: [['item', 'q_list', 1], ['toast', 'Вы забрали тетрадь Вспоминающих']] });
  b.prop('bed', 7, 11); b.prop('bed', 16, 11); b.prop('brazier', 7, 9); b.prop('brazier', 18, 9);
  b.prop('banner', 10, 12); b.prop('banner', 14, 12);
  b.prop('monolith', 11, 3, { use: 'sign', title: 'Камень над входом', text: 'На камне над дверью вырезан круг и семь точек. Шестая стёрта: не сколота, а именно стёрта, как стирают имя. Под кругом нацарапано: «Помним, потому что кто-то должен».' });

  // шалаши и хижины
  const homes = [['hut2', 24, 6], ['hut2', 24, 11], ['hut', 26, 5, { sprite: 'herb' }], ['hut2', 8, 18], ['hut2', 16, 18], ['hut2', 40, 18], ['hut2', 54, 6],
    ['hut2', 6, 29], ['hut2', 14, 30], ['hut', 20, 30], ['hut2', 28, 30], ['hut2', 42, 30], ['hut', 50, 31], ['hut2', 58, 31], ['hut2', 5, 34], ['hut2', 30, 34]];
  for (const [k, x, y, ex] of homes) put(k, x, y, ex || {});
  put('tavern', 27, 16);
  b.prop('stairs', 35, 14, { id: 'sewer_grate' });
  b.zone('grate_zone', 32, 11, 8, 8);
  for (const x of [33, 38]) dec('fence', x, 13);
  dec('crate', 39, 14); dec('barrel', 33, 16);

  // логово Крыса
  for (let x = 41; x <= 59; x++) if (x < 47 || x > 50) dec('fence', x, 4);
  for (let y = 5; y <= 16; y++) { dec('fence', 41, y); dec('fence', 59, y); }
  for (let x = 41; x <= 59; x++) if (x < 47 || x > 50) dec('fence', x, 17);
  put('hut', 43, 6); put('table', 52, 9); put('campfire', 49, 11); put('crate', 55, 7); put('crate', 56, 7); put('barrel', 43, 13); put('barrel', 57, 14); put('cart', 54, 14);

  // лавка скупщицы и набережная
  dec('stall', 44, 28); dec('barrel', 47, 28); dec('crate', 41, 28);
  dec('boat', 24, 41); dec('boat', 50, 42); dec('net', 15, 38); dec('net', 30, 38);
  for (const [k, x, y] of [['post', 20, 37], ['post', 22, 37], ['post', 44, 37], ['post', 46, 37], ['barrel', 25, 37], ['crate', 26, 37], ['barrel', 40, 37], ['crate', 52, 37], ['campfire', 34, 36], ['barrel', 33, 36], ['crate', 36, 36]]) dec(k, x, y);
  for (const [x, y] of [[56, 21], [18, 22], [38, 22], [60, 26], [30, 26]]) dec('lamp', x, y);
  dec('sign', 58, 22, { use: 'sign', title: 'Табличка', text: 'Нижний город. Вход свободный. Выход зависит от кошелька.' });
  dec('sign', 22, 22, { use: 'sign', title: 'Нацарапано мелом', text: 'Должен Крысу? Крыс помнит. Не должен? Крыс запомнит.' });
  dec('sign', 8, 24, { use: 'sign', title: 'Нацарапано углём', text: 'Круг и семь точек. Под ним чьей-то рукой: «Мы тебя слышим».' });
  b.chest('cl_chest1', 22, 35, [['gold', 70], ['p_hp2', 1]]);
  b.chest('cl_chest2', 61, 36, [['gold', 90], ['p_mp2', 1], ['c_copper', 1]]);
  b.chest('cl_chest3', 4, 22, [['gold', 55], ['p_hp1', 3]]);

  // жители
  b.npc('neya', 12, 10, { hideIf: 'fac_council' });
  b.npc('hada', 9, 10, { showIf: 'fac_rem' });
  b.npc('seer_l', 17, 10, { hideIf: ['fac_council', 'list_given'] });
  b.npc('miren_r1', 15, 9, { showIf: ['fac_rem', 'seer_hidden'] });
  b.npc('miren_r2', 15, 9, { showIf: ['fac_rem', 'seer_handed'] });
  b.npc('rat', 50, 12, { hideIf: 'rat_gone' });
  b.npc('gang_a', 46, 13, { hideIf: 'rat_gone' });
  b.npc('gang_b', 54, 12, { hideIf: 'rat_gone' });
  b.npc('bork', 30, 20);
  b.npc('merit', 9, 31);
  b.npc('leta', 45, 27);
  b.npc('ryk', 48, 35, { showIf: 'grok_peace' });
  b.npc('drunk', 23, 36);
  b.npc('urchin', 58, 27);

  // уличные враги: бандиты у воды, Охотники Совета, если вы встали на сторону Вспоминающих
  for (const [x, y] of [[26, 38], [38, 38]]) b.enemy('bandit', x, y, 6);
  for (const [x, y] of [[12, 36], [52, 38]]) b.enemy('echoVagrant', x, y, 7);
  for (const [x, y] of [[54, 24], [40, 24], [26, 24]]) b.enemy('hunter', x, y, 8, { showIf: 'fac_rem' });

  b.portal('to_market', 62, 22, 2, 4, 'city_market', { x: 3.5, y: 23.5 });
  // решётка Стоков: открывается ключом Крыса (sewer_open) либо после его смерти (k_rat)
  b.portal('to_sewers_a', 35, 14, 2, 1, 'sewers', { x: 7.5, y: 37.5 }, { req: { flag: 'k_rat', msg: 'Решётка заперта на тяжёлый замок. Ключ у Крыса.' } });
  b.portal('to_sewers_b', 35, 14, 2, 1, 'sewers', { x: 7.5, y: 37.5 }, { req: { flag: 'sewer_open', msg: 'Решётка заперта на тяжёлый замок. Ключ у Крыса.' } });
  return b.finish();
}

// ======================================================================= КВАРТАЛ КОЛЛЕГИИ
export function city_college() {
  const b = new Builder('city_college', 64, 48, 203, T.COBBLE);
  b.spawn = { x: 31, y: 43 };
  const keep = [[28, 0, 8, 48], [0, 22, 64, 4]];
  const put = maker(b, keep);
  const dec = maker(b, []);

  b.rect(18, 24, 28, 14, T.PLAZA, true);
  b.disc(32, 31, 6, T.PLAZA, true);
  b.rect(24, 17, 16, 6, T.PLAZA, true);                // ступени зала
  b.rect(45, 16, 14, 6, T.PLAZA, true);                // перед архивом
  for (const [x, y, w, h] of [[3, 3, 18, 10], [3, 28, 12, 12], [49, 28, 12, 12], [24, 3, 14, 6]]) b.rect(x, y, w, h, T.GRASS);
  rim(b, 2);
  gap(b, 30, 46, 4, 2);

  // зал Коллегии
  put('house', 22, 13); put('house', 28, 12); put('house', 34, 13);
  dec('pillar', 26, 16); dec('pillar', 37, 16); dec('banner', 24, 17); dec('banner', 39, 17); dec('statue', 31, 17);
  dec('bookshelf', 20, 19); dec('bookshelf', 41, 19);

  // архив: каменный дом с деревянным полом, дверь запечатана до разрешения Исольды
  b.rect(44, 4, 16, 13, T.WALL, true); b.rect(46, 6, 12, 9, T.WOOD, true); gap(b, 50, 15, 4, 2, T.WOOD);
  b.prop('stonedoor', 50, 15, { id: 'archive_door' });
  b.doors.push({ id: 'archive_door', x: 50, y: 15, w: 4, h: 2, opens: ['archive_open'] });
  for (const x of [46, 48, 52, 54, 56]) b.prop('bookshelf', x, 6);
  b.prop('bookshelf', 46, 9); b.prop('bookshelf', 56, 9);
  b.prop('table', 51, 9, { use: 'page', id: 'arch_case', title: 'Пустой футляр', text: 'Футляр из чёрного дерева, выстланный сукном. Здесь лежал свиток: вмятина ещё видна. Замок цел, не взломан, а открыт ключом. На сукне капля жёлтого воска. Архивные свечи серые. Такие, жёлтые и вонючие, жгут в Нижнем городе. На полу у стойки комок красной глины.', fx: [['f', 'clue_case']] });
  b.prop('table', 47, 12, { use: 'page', id: 'arch_ledger', title: 'Журнал выдачи', text: 'Последняя запись выведена уверенно: «Ночь, второй колокол. Выдано в читальный зал: карта маяков, футляр № 7. Читатель: Лукиан, младший архивариус». Графа «возвращено» пуста. Ниже другим почерком, наспех: «Лукиан не вышел утром. Дверь его комнаты открыта. Постель не тронута. Вещи на месте, кроме карты и тёплого плаща». Ещё ниже чьё-то дрожащее: «Он слышал её во сне».', fx: [['f', 'clue_ledger']] });
  b.prop('table', 55, 12);
  b.prop('brazier', 47, 7); b.prop('brazier', 57, 7); b.prop('pillar', 50, 11); b.prop('pillar', 53, 11);
  b.chest('co_chest', 56, 14, [['gold', 90], ['p_mp2', 2]]);

  // двор: фонтан, лавка и жилые дома студентов
  dec('well', 31, 30); dec('statue', 31, 27);
  for (const [x, y] of [[20, 25], [43, 25], [20, 36], [43, 36], [27, 24], [36, 24], [27, 38], [36, 38]]) dec('lamp', x, y);
  dec('stall', 38, 33); dec('barrel', 41, 33); dec('crate', 41, 34);
  for (const [k, x, y] of [['house', 6, 16], ['house', 12, 16], ['house', 6, 41], ['house', 12, 41], ['hut2', 52, 24], ['hut2', 56, 24], ['house', 49, 41], ['house', 55, 41]]) put(k, x, y);
  b.prop('sign', 29, 43, { use: 'sign', title: 'Табличка', text: 'Коллегия Каменного Моста. Основана за три века до того, как стала нужна. Вход студентам и посетителям с письмом. Остальным тоже, но дольше.' });
  b.prop('sign', 43, 19, { use: 'sign', title: 'Табличка', text: 'Архив. Хранилище сорока тысяч томов и одной пустой полки. Вход по разрешению магистра.' });
  b.prop('sign', 24, 24, { use: 'sign', title: 'Объявление', text: 'Диспут в пятницу: «Является ли Эхо личностью?» Явка студентов обязательна. Явка Эха приветствуется, но не обеспечивается.' });
  for (const [k, x, y] of [['barrel', 9, 30], ['crate', 8, 36], ['barrel', 54, 32], ['crate', 58, 36]]) dec(k, x, y);
  b.chest('co_chest2', 4, 37, [['gold', 75], ['p_hp2', 1]]);

  // жители
  b.npc('isolda', 32, 20);
  b.npc('oswald', 33, 43);
  b.npc('irma', 23, 30);
  b.npc('nico', 39, 32);
  b.npc('bastian', 36, 28);
  b.npc('orso', 27, 21, { showIf: 'fac_collegium' });
  b.npc('faddei', 48, 19, { showIf: 'fac_collegium' });
  b.npc('lidia', 51, 12);
  b.zone('college_court', 18, 24, 28, 14);

  b.portal('to_market', 30, 46, 4, 2, 'city_market', { x: 15.5, y: 3.5 });
  return b.finish();
}

// ======================================================================= ХРАМ СЕМИ
export function city_temple() {
  const b = new Builder('city_temple', 48, 40, 204, T.CWALL);
  b.spawn = { x: 24, y: 36 };
  b.rect(6, 5, 36, 25, T.PLAZA);                       // зал
  b.rect(20, 30, 8, 8, T.PLAZA);                       // притвор
  b.rect(22, 9, 4, 21, T.COBBLE);                      // главный проход
  b.rect(10, 4, 28, 1, T.CRYPT);

  // семь алтарей: добрые слева, злые справа, нейтральные в центре
  const gods = [['lyara', 7], ['torn', 12], ['ori', 17], ['seyr', 23], ['mara', 29], ['kharn', 34], ['issa', 39]];
  const lore = {
    lyara: 'Алтарь Лиары. На камне свеча в плошке с водой. Надпись: «Отдала сама. Просила присмотреть». Воск стёкся в подтёки, будто кто-то давно держит эту свечу в руках.',
    torn: 'Алтарь Торна. Весы без чаш: перекладина на остром камне. Надпись: «Закон тяжёл. Я нёс». Ниже, мельче и позже, кто-то процарапал: «И сколько ты нёс?».',
    ori: 'Алтарь Ори. Раскрытая каменная книга, страницы пусты. Надпись: «Помню за всех». Если провести ладонью, камень слегка тёплый, как после чужой руки.',
    seyr: 'Алтарь Сейра. Игральная кость в углублении, на каждой грани одно и то же число. Надпись: «Выиграл». Под ней: «Честно?» другим резцом.',
    mara: 'Алтарь Мары. Каменная чаша, в ней живой мох и тонкий ростки пробивается через трещину. Надпись: «Лес выжил».',
    kharn: 'Алтарь Кхарна. Меч, вбитый в плиту по рукоять, лезвие чисто, как будто его всё время кто-то полирует. Надпись: «Занял место. Не прошу прощения».',
    issa: 'Алтарь Иссы. Лицо без черт, гладкая маска на стене; на лбу трещина. Надпись: «Всё, что я сказала, правда». Остаётся гадать, какая именно.',
  };
  for (const [g, x] of gods) {
    b.prop('godaltar', x, 8, { god: g, use: 'altar', title: 'Алтарь', text: lore[g] });
    b.prop('brazier', x, 11); b.prop('brazier', x + 1, 11);
  }
  for (const x of [10, 15, 20, 27, 32, 37]) for (const y of [15, 23]) b.prop('pillar', x, y);
  for (const x of [8, 40]) for (const y of [16, 20, 24]) b.prop('banner', x, y);
  b.prop('statue', 23, 5); b.prop('statue', 24, 5);
  b.prop('monolith', 22, 13, { use: 'sign', title: 'Надпись без подписи', text: 'Основание статуи в центре зала. На камне одна строка, выбитая глубже остальных: «Здесь был тот, кто сделал». Ни богу, ни храму, ни веку она не принадлежит. Жрецы стараются не стоять к ней спиной.' });
  b.prop('table', 9, 27); b.prop('table', 37, 27);
  b.prop('sign', 22, 33, { use: 'sign', title: 'Правила Храма', text: 'Не называй богов по имени вслух, если не собираешься просить. Не торгуйся с алтарями. Не лги Слушающей: она не накажет, но услышит.' });
  b.chest('tp_chest', 40, 27, [['gold', 80], ['p_hp2', 2]]);
  b.chest('tp_chest2', 7, 26, [['gold', 60], ['p_mp2', 1]]);

  b.npc('listener', 24, 17);
  b.npc('acolyte', 22, 31);
  b.npc('gedeon', 14, 20);
  b.npc('brand', 32, 13);
  b.npc('anselma', 9, 13);
  b.zone('temple_hall', 6, 5, 36, 25);
  b.portal('to_market', 21, 37, 6, 1, 'city_market', { x: 33.5, y: 3.5 });
  return b.finish();
}

// ======================================================================= СТОКИ
export function sewers() {
  const b = new Builder('sewers', 56, 44, 205, T.CWALL);
  b.spawn = { x: 7, y: 37 };
  const F = T.CRYPT;
  b.room(3, 34, 10, 7, F);                      // вход
  b.corridor(12, 37, 21, 37, 3, F);
  b.room(19, 28, 14, 12, F);                    // узловая цистерна
  b.rect(24, 30, 4, 8, T.WATER); b.rect(24, 33, 4, 2, T.BRIDGE);
  b.corridor(7, 34, 7, 24, 3, F);
  b.room(3, 17, 10, 8, F);                      // каморка Дана
  b.corridor(32, 33, 36, 33, 3, F);
  b.room(36, 28, 12, 10, F);                    // лагерь Лукиана
  b.corridor(25, 28, 25, 16, 3, F);
  b.room(14, 3, 28, 13, F);                     // логово Матери
  b.rect(18, 6, 4, 3, T.WATER); b.rect(34, 9, 4, 3, T.WATER); b.rect(26, 11, 3, 2, T.WATER);
  b.corridor(41, 8, 46, 8, 3, F);
  b.room(46, 4, 8, 9, F);                       // тайник
  b.corridor(14, 8, 9, 8, 3, F);
  b.room(3, 4, 7, 9, F);                        // тупик

  const junk = (x, y, w, h, n) => { b.scatter('barrel', n, x, y, w, h); b.scatter('crate', n, x, y, w, h); b.scatter('boulder', n + 1, x, y, w, h); b.scatter('beam', n, x, y, w, h); };
  junk(4, 35, 8, 5, 1); junk(20, 29, 12, 10, 2); junk(37, 29, 10, 8, 1); junk(15, 4, 26, 11, 3); junk(4, 18, 8, 6, 1); junk(47, 5, 6, 7, 1);
  b.prop('stairs', 6, 34, { id: 'sewer_up' });
  b.prop('brazier', 5, 36); b.prop('brazier', 11, 36);
  b.prop('brazier', 21, 29); b.prop('brazier', 31, 29);
  b.prop('brazier', 16, 4); b.prop('brazier', 39, 4); b.prop('brazier', 16, 14); b.prop('brazier', 39, 14);
  b.prop('pillar', 22, 10); b.prop('pillar', 31, 10); b.prop('pillar', 22, 14); b.prop('pillar', 31, 14);
  b.prop('shrine', 9, 38, { id: 'shrine_sewers', use: 'shrine', name: 'Стоковый алтарь' });
  b.prop('sign', 11, 35, { use: 'sign', title: 'Выцарапано на стене', text: 'Если слышишь, как кто-то поёт под полом, не отвечай. — Гвоздь. И ниже: «Это был не я».' });
  b.prop('sign', 24, 27, { use: 'sign', title: 'Нацарапано', text: 'Вода идёт к Матери. Всё, что не уходит с водой, остаётся с ней.' });
  b.prop('campfire', 41, 33); b.prop('bed', 38, 30); b.prop('table', 43, 30); b.prop('crate', 45, 35); b.prop('barrel', 38, 36);
  b.prop('bed', 5, 20); b.prop('crate', 10, 19);
  b.prop('stairs', 26, 3, { id: 'tower_shaft' });

  b.npc('gnail', 10, 36);
  b.npc('dan_echo', 6, 21, { hideIf: ['dan_resolved'] });
  b.npc('merit_s', 8, 21, { showIf: 'merit_down' });
  b.npc('lukian', 40, 32, { hideIf: 'lukian_left' });

  for (const [x, y] of [[8, 38], [11, 35]]) b.enemy('sewerSlime', x, y, 7);
  for (const [x, y] of [[16, 37], [19, 37]]) b.enemy('bat', x, y, 7);
  for (const [x, y] of [[22, 31], [30, 31], [22, 38], [30, 37]]) b.enemy('sewerSlime', x, y, 7);
  for (const [x, y] of [[26, 29], [20, 34]]) b.enemy('echoVagrant', x, y, 8);
  for (const [x, y] of [[8, 20], [5, 23]]) b.enemy('sewerSlime', x, y, 7);
  for (const [x, y] of [[44, 31], [46, 36]]) b.enemy('echoVagrant', x, y, 8);
  for (const [x, y] of [[18, 12], [36, 6], [24, 8], [32, 12]]) b.enemy('sewerSlime', x, y, 8);
  for (const [x, y] of [[20, 5], [38, 13]]) b.enemy('echoVagrant', x, y, 9);
  for (const [x, y] of [[26, 14], [30, 5]]) b.enemy('bat', x, y, 8);
  b.enemy('sewerSlime', 49, 7, 8); b.enemy('sewerSlime', 50, 10, 8);
  b.enemy('mother', 27, 7, 9, { unique: 'mother' });
  b.chest('sw_chest1', 11, 39, [['gold', 70], ['p_hp2', 1]]);
  b.chest('sw_chest2', 52, 6, [['gold', 120], ['p_hp3', 1], ['c_spirit', 1]]);
  b.chest('sw_chest3', 4, 5, [['gold', 90], ['p_mp2', 2]]);
  b.chest('sw_chest4', 46, 29, [['gold', 80], ['p_hp2', 2]]);
  b.zone('sewers_in', 3, 34, 10, 7);
  b.zone('mother_lair', 14, 3, 28, 13);

  b.portal('sewer_up', 6, 34, 2, 1, 'city_low', { x: 35.5, y: 16.5 });
  b.portal('tower_shaft', 26, 3, 2, 1, 'city_market', { x: 34.5, y: 24.5 }, { req: { flag: 'k_mother', msg: 'Лестница на поверхность завалена. Пока Мать жива, ей никто не воспользуется.' } });
  return b.finish();
}

export const BUILD = { city_market, city_low, city_college, city_temple, sewers };
