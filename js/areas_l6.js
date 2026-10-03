// Локация 6: Цитадель. Врата, Зал Семи Тронов, Склеп Прежних, Последний Трон.
import { Builder } from './maps_core.js';
import { T } from './defs.js';

const SEAT_GODS = ['ori', 'torn', 'lyara', 'mara', 'seyr', 'kharn', 'issa'];   // по часовой стрелке, начиная с севера

// ======================================================================= ВРАТА ЦИТАДЕЛИ
export function citadel_gate() {
  const b = new Builder('citadel_gate', 60, 40, 61, T.CWALL);
  b.spawn = { x: 30, y: 36 };

  // южное поле: лагерь тех, кто не дошёл
  b.rect(6, 24, 48, 15, T.ASH);
  b.blob(14, 31, 4, 3, T.BLIGHT, false, 0.3);
  b.blob(46, 29, 5, 3, T.BLIGHT, false, 0.3);
  b.blob(38, 35, 3, 2, T.BLIGHT, false, 0.3);
  b.path([[30, 38], [30, 22]], 4, T.COBBLE, false);
  // привратная арка
  b.rect(26, 19, 8, 5, T.COBBLE);
  // внутренний двор
  b.rect(8, 8, 44, 11, T.COBBLE);
  b.path([[30, 18], [30, 8]], 4, T.PLAZA, false);
  // северный проход к Залу Семи Тронов
  b.rect(26, 4, 8, 4, T.COBBLE);
  // боковые покои
  b.rect(1, 9, 5, 9, T.CRYPT); b.rect(6, 12, 2, 3, T.COBBLE);
  b.rect(54, 9, 5, 9, T.CRYPT); b.rect(52, 12, 2, 3, T.COBBLE);

  // ворота и стена
  b.prop('cryptgate', 28, 2);
  b.prop('banner', 25, 5); b.prop('banner', 34, 5);
  b.prop('brazier', 26, 7); b.prop('brazier', 33, 7);
  b.prop('statue', 11, 9); b.prop('statue', 18, 9); b.prop('statue', 41, 9); b.prop('statue', 48, 9);
  b.prop('pillar', 13, 15); b.prop('pillar', 21, 15); b.prop('pillar', 38, 15); b.prop('pillar', 46, 15);
  b.prop('pillar', 13, 12); b.prop('pillar', 46, 12);
  b.prop('brazier', 25, 17); b.prop('brazier', 34, 17);
  b.prop('banner', 24, 20); b.prop('banner', 35, 20);
  b.rubble('boulder', 6, 8, 8, 44, 11);
  b.prop('sign', 31, 10, { use: 'sign', title: 'Надпись над воротами', text: 'ЗДЕСЬ КОНЧАЕТСЯ ВСЁ, ЧТО ВЫ ЗНАЛИ. (Ниже другой рукой, мелом: «Нет. Здесь начинается то, чего вы не хотели знать».)' });

  // лагерь южного поля
  b.prop('tent', 16, 33); b.prop('tent', 20, 28); b.prop('campfire', 19, 32);
  b.prop('crate', 15, 30); b.prop('barrel', 22, 34); b.prop('cart', 10, 27);
  b.prop('grave', 36, 31); b.prop('grave', 38, 32); b.prop('grave', 40, 30); b.prop('grave', 37, 34);
  b.prop('spear', 42, 33); b.prop('spear', 44, 27);
  b.prop('shrine', 33, 35, { id: 'shrine_citadel', use: 'shrine', name: 'Алтарь у врат' });
  b.prop('sign', 27, 35, { id: 'pg_gatepost', use: 'page', title: 'Путевой камень', text: 'Цитадель. Дальше дороги нет, только дверь. Три маяка снаружи, один трон внутри. Кто пришёл, тому решать. Больше решать некому.', fx: [['q+', 'f_main']] });
  b.prop('sign', 11, 36, { use: 'sign', title: 'Табличка на колу', text: 'Здесь стояла экспедиция Коллегии. Двенадцать человек. Идём внутрь утром. (Дальше страница вырвана.)' });
  b.npc('envoy', 18, 31);

  // двор: западные и восточные покои
  b.prop('brazier', 2, 10); b.prop('brazier', 4, 10); b.prop('bed', 2, 16); b.prop('rack', 3, 12);
  b.npc('gate_echo', 3, 14, { hideIf: 'echo_rested' });
  b.prop('table', 55, 10); b.prop('bookshelf', 57, 10); b.prop('brazier', 57, 16);
  b.prop('sign', 56, 14, { id: 'pg_gatelog', use: 'page', title: 'Журнал караула', text: 'Последняя запись, тем же почерком, что и все: «Смена окончена. Караул распустить, тем, кто может, идти домой. Врата не запирать: запирать больше нечего. Подпись неразборчива». Ниже, другим почерком: «Он не пошёл. Остался на посту. Не знаю, зачем».' });
  b.chest('cg_chest1', 57, 12, [['gold', 190], ['p_hp3', 2], ['@weapon4', 1]]);
  b.chest('cg_chest2', 22, 11, [['gold', 160], ['p_mp3', 2]]);

  // враги: южное поле
  b.enemy('echoSoldier', 24, 30, 17); b.enemy('echoSoldier', 41, 28, 17); b.enemy('echoArcher', 34, 29, 17);
  b.enemy('wraith', 10, 33, 17); b.enemy('wraith', 48, 33, 17); b.enemy('echoBrute', 14, 27, 17);
  b.enemy('echoSoldier', 44, 36, 17);
  // привратная арка
  b.enemy('warden', 28, 21, 18); b.enemy('warden', 31, 21, 18);
  // двор
  b.enemy('warden', 20, 13, 18); b.enemy('warden', 40, 13, 18); b.enemy('echoBrute', 29, 12, 18); b.enemy('echoBrute', 33, 14, 18);
  b.enemy('echoArcher', 15, 11, 17); b.enemy('echoArcher', 45, 11, 17); b.enemy('spitter', 26, 11, 18); b.enemy('spitter', 36, 16, 18);
  b.enemy('echoSoldier', 24, 15, 18); b.enemy('echoSoldier', 42, 16, 18);

  b.zone('c6_court', 8, 8, 44, 11);
  b.portal('to_pass', 28, 38, 4, 1, 'valley_pass', { x: 39.5, y: 44.5 });
  b.portal('to_hall', 28, 4, 4, 1, 'throne_hall', { x: 28.5, y: 29.5 });
  b.border(1, T.CWALL);
  return b.finish();
}

// ======================================================================= ЗАЛ СЕМИ ТРОНОВ
export function throne_hall() {
  const b = new Builder('throne_hall', 56, 36, 62, T.CWALL);
  b.spawn = { x: 28, y: 29 };

  b.rect(4, 10, 48, 18, T.COBBLE);                    // зал
  b.rect(25, 28, 6, 6, T.COBBLE);                     // вход
  b.rect(26, 3, 4, 7, T.COBBLE);                      // проход к Последнему Трону
  b.rect(4, 29, 9, 5, T.CRYPT); b.rect(6, 28, 4, 1, T.COBBLE);          // лестница в Склеп
  b.rect(43, 29, 9, 5, T.CRYPT); b.rect(45, 28, 4, 1, T.COBBLE);        // казна
  b.disc(28, 19, 4.6, T.PLAZA, false);

  // кольцо из семи кресел; перед каждым стоит тень бога
  const cx = 28, cy = 19;
  SEAT_GODS.forEach((g, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 7;
    const tx = Math.round(cx + Math.cos(a) * 16) - 1, ty = Math.round(cy + Math.sin(a) * 6.4);
    b.prop('throne', tx, ty);
    b.prop('godaltar', Math.round(cx + Math.cos(a) * 10.5) - 1, Math.round(cy + Math.sin(a) * 4.2) + 1, { god: g, use: 'sign', title: 'Знак', text: 'Знак бога, выбитый в камне. Он не светится. Свет в зале есть только там, где кто-то им ещё дорожит.' });
    b.npc('seat_' + g, tx, ty + 2);
  });
  b.prop('sign', 31, 22, { use: 'sign', title: 'Надпись на плитах', text: 'В камне семь следов от кресел и восьмой, пустой круг без следа. Одно из кресел тёплое. Какое, зависит от того, кто вошёл.' });

  b.row('pillar', 6, 11, 2, 0, 3); b.row('pillar', 49, 11, 2, 0, 3);
  b.prop('pillar', 6, 24); b.prop('pillar', 49, 24);
  b.prop('brazier', 7, 16); b.prop('brazier', 48, 16);
  b.prop('banner', 24, 10); b.prop('banner', 31, 10);
  b.prop('brazier', 25, 5); b.prop('brazier', 30, 5);
  // дверь к Последнему Трону: открывается печатью в Склепе
  b.prop('stonedoor', 26, 6, { id: 'door_last' });
  b.doors.push({ id: 'door_last', x: 26, y: 6, w: 4, h: 2, opens: ['lever_crypt'] });

  // лестница в Склеп
  b.prop('stairs', 7, 31, { id: 'down_crypt' });
  b.prop('brazier', 5, 30); b.prop('brazier', 11, 30);
  b.prop('sign', 9, 33, { use: 'sign', title: 'Надпись у лестницы', text: 'ВНИЗ: те, кто был до нас. Не будите. (Кто-то приписал: «Они не спят, они ждут».)' });
  // казна и журнал
  b.prop('table', 47, 30); b.prop('bookshelf', 44, 30); b.prop('crate', 50, 32);
  b.chest('th_journal', 48, 33, [['q_journal', 1], ['gold', 120]]);
  b.chest('th_chest2', 44, 33, [['gold', 220], ['@armor4', 1], ['p_hp3', 2]]);
  b.prop('sign', 49, 30, { id: 'pg_minutes', use: 'page', title: 'Протокол последнего собрания', text: 'Присутствовали: семеро. Вопрос: Последний. Решение: отложить. (Зачёркнуто.) Решение: принято единогласно. (Зачёркнуто.) Решение: (строка выскоблена ножом, до самой доски).' });
  b.prop('shrine', 28, 31, { id: 'shrine_hall', use: 'shrine', name: 'Алтарь Зала' });

  // враги
  for (const [x, y] of [[12, 13], [44, 13], [10, 24], [46, 24]]) b.enemy('wraith', x, y, 18);
  for (const [x, y] of [[20, 14], [36, 14], [16, 22], [40, 22]]) b.enemy('echoSoldier', x, y, 18);
  b.enemy('warden', 22, 25, 19, { hideIf: 'echo_rested' }); b.enemy('warden', 34, 25, 19, { hideIf: 'echo_rested' });
  b.enemy('echoBrute', 28, 13, 19); b.enemy('echoBrute', 14, 18, 19);
  b.enemy('echoArcher', 8, 21, 18); b.enemy('echoArcher', 48, 21, 18);
  b.enemy('spitter', 24, 22, 19); b.enemy('spitter', 32, 22, 19);

  b.zone('c6_seven', 4, 10, 48, 18);
  b.portal('hall_to_gate', 25, 33, 6, 1, 'citadel_gate', { x: 30.5, y: 6.5 });
  b.portal('hall_to_crypt', 7, 31, 2, 1, 'crypt_old', { x: 6.5, y: 20.5 });
  b.portal('hall_to_last', 26, 3, 4, 1, 'last_throne', { x: 24.5, y: 35.5 });
  b.border(1, T.CWALL);
  return b.finish();
}

// ======================================================================= СКЛЕП ПРЕЖНИХ
const PAGES = [
  ['law', 'Запись бога закона', 'Я казнил тысячами, и каждый приговор был верен. Это самое страшное, что я могу о себе сказать. Когда пришёл тот, с мечом, я не спросил, кто он. Спросил только: «Ты тоже хочешь закона?» Он сказал: «Я хочу, чтобы ты остановился». Я, кажется, впервые услышал вопрос, на который нет статьи.'],
  ['life', 'Запись богини жизни', 'Я отдала ей всё. Она спросила: «Зачем?» Я ответила, что устала. Это вся причина, и мне будет легче, если никто никогда не назовёт её слабостью. Присматривай за ними. Они не умеют беречь себя, зато умеют беречь друг друга, когда им разрешают.'],
  ['mind', 'Запись бога знания', 'Он обещал помнить за всех. Я взял с него слово не потому, что верил в его память, а потому, что боялся, что меня забудут первым. Это не милость. Это страх, одетый в мантию. Пусть простит, если когда-нибудь поймёт.'],
  ['luck', 'Запись бога удачи', 'Мы играли в кости три дня. Я не обманывал. Он, кажется, тоже. Кости были старше нас обоих. Он будет сомневаться всю жизнь, честно ли выиграл, и это моя последняя шутка. Поверь, она хорошая.'],
  ['wild', 'Запись бога природы', 'Лес был голоден, а я с ним заодно. Она вошла с топором и плакала. Я просил её не останавливаться, и она не остановилась. Не вини её. В отличие от меня, ей пришлось потом жить с этим.'],
  ['war', 'Запись бога войны', 'Он не скрывал, что придёт за моим местом. Я бы не доверял тому, кто скрывает. Мы дрались честно, и я проиграл честно. Хорошая смерть. Я бы повторил, но второй раз не дают.'],
  ['lie', 'Запись бога тайн', 'Я не говорил ей, что она не заберёт мою власть. Я отдал её сам, потому что кто-то должен помнить, как лгать красиво. Она до сих пор рассказывает всем, что убила меня. Пусть. Мёртвым так проще: они ничего не выдают.'],
];

export function crypt_old() {
  const b = new Builder('crypt_old', 64, 40, 63, T.CWALL);
  b.spawn = { x: 6, y: 20 };
  const F = T.CRYPT;
  b.rect(3, 16, 58, 8, F);                                   // нава
  PAGES.forEach(([id, title, text], i) => {
    const x = 4 + i * 8;
    b.room(x, 6, 6, 6, F);                                   // ниша
    b.rect(x + 2, 12, 2, 4, F);
    b.prop('coffin', x + 2, 7);                              // останки прежнего бога
    b.prop('obelisk', x + 1, 10, { id: 'pg_' + id, use: 'page', title, text });
    b.prop('brazier', x, 7); b.prop('brazier', x + 5, 7);
  });
  // последняя запись: в конце нефа
  b.rect(57, 17, 4, 6, F);
  b.prop('monolith', 58, 18);
  b.prop('obelisk', 59, 21, { id: 'pg_last', use: 'page', title: 'Последняя запись', text: 'Меня ранили, когда я закрывал Брешь. Не клинком: руками тех, кого я прикрывал. Не прошу пощады. Прошу, чтобы кто-нибудь пришёл и решил сам, а не по чужому слову. Имя не пишу. Сейчас это единственное, что у меня никто не отнял.' });
  // писарь
  b.rect(3, 26, 12, 7, F); b.rect(8, 24, 2, 2, F);
  b.prop('table', 5, 28); b.prop('bookshelf', 11, 27); b.prop('brazier', 4, 27); b.prop('brazier', 13, 30);
  b.npc('crypt_scribe', 8, 30);
  b.chest('co_chest1', 13, 32, [['gold', 210], ['p_mp3', 2]]);
  // комната печати
  b.rect(30, 26, 14, 10, F); b.rect(36, 24, 2, 2, F);
  b.prop('lever', 36, 33, { id: 'lever_crypt', use: 'lever', text: 'Печать Склепа' });
  b.prop('tomb', 32, 28); b.prop('tomb', 41, 28); b.prop('tomb', 32, 33); b.prop('tomb', 41, 33);
  b.prop('brazier', 35, 27); b.prop('brazier', 38, 27);
  b.chest('co_chest2', 42, 34, [['gold', 240], ['@weapon4', 1], ['p_hp3', 2]]);
  b.prop('sign', 34, 31, { use: 'sign', title: 'Надпись у рычага', text: 'Печать держит дверь к Последнему Трону. Тот, кто потянет, не скажет потом, что его не предупреждали.' });
  // стражи и эхо
  for (const [x, y] of [[14, 19], [22, 21], [30, 18], [38, 20], [46, 18], [52, 21]]) b.enemy('wraith', x, y, 19);
  for (const [x, y] of [[18, 22], [34, 21], [48, 22]]) b.enemy('echoSoldier', x, y, 19);
  b.enemy('echoBrute', 26, 19, 19); b.enemy('echoBrute', 42, 21, 19);
  b.enemy('spitter', 40, 18, 19); b.enemy('spitter', 54, 19, 19);
  b.enemy('warden', 36, 30, 20); b.enemy('warden', 39, 32, 20);
  b.enemy('echoArcher', 33, 34, 19); b.enemy('wraith', 11, 11, 19); b.enemy('wraith', 51, 10, 19);

  b.prop('stairs', 4, 17, { id: 'up_crypt' });
  b.portal('crypt_to_hall', 4, 17, 2, 1, 'throne_hall', { x: 8.5, y: 29.5 });
  b.zone('c6_crypt', 3, 16, 58, 8);
  b.border(1, T.CWALL);
  return b.finish();
}

// ======================================================================= ПОСЛЕДНИЙ ТРОН
export function last_throne() {
  const b = new Builder('last_throne', 48, 40, 64, T.CWALL);
  b.spawn = { x: 24, y: 35 };
  // подход и круглая арена
  b.rect(21, 33, 6, 6, T.COBBLE);
  b.disc(24, 19, 16, T.COBBLE, false);
  b.disc(24, 19, 7, T.PLAZA, false);
  // трещины в камне: лава по краю арены (проход свободен)
  for (const [x, y, rx, ry] of [[10, 12, 2.2, 1.6], [38, 12, 2.2, 1.6], [9, 26, 2, 1.4], [39, 26, 2, 1.4]]) b.blob(x, y, rx, ry, T.LAVA, false, 0.2);
  b.rect(21, 3, 6, 3, T.COBBLE);
  // трон и колонны
  b.prop('throne', 23, 5);
  b.prop('monolith', 18, 4); b.prop('monolith', 28, 4);
  b.prop('banner', 21, 4); b.prop('banner', 26, 4);
  for (const [x, y] of [[12, 16], [36, 16], [12, 23], [36, 23], [18, 9], [30, 9], [18, 29], [30, 29]]) b.prop('pillar', x, y);
  // три светильника-маяка по краю
  b.prop('lamp', 9, 19); b.prop('lamp', 38, 19); b.prop('lamp', 24, 33);
  b.prop('brazier', 22, 34); b.prop('brazier', 26, 34);
  b.prop('sign', 25, 31, { id: 'pg_throne', use: 'page', title: 'На ступенях', text: 'Здесь нет надписей. Только следы: много, в одну сторону, и ни одного обратно.' });
  b.prop('shrine', 24, 36, { id: 'shrine_throne', use: 'shrine', name: 'Последний алтарь' });
  // сам Прежний: до боя это собеседник
  b.npc('oldone_npc', 24, 8, { hideIf: 'k_oldone_npc' });
  b.npc('oldone_dying', 24, 8, { showIf: 'k_oldone_npc', hideIf: 'ending' });
  b.zone('c6_last', 8, 3, 32, 36);
  b.portal('last_to_hall', 21, 38, 6, 1, 'throne_hall', { x: 28.5, y: 8.5 });
  b.border(1, T.CWALL);
  return b.finish();
}

export const BUILD = { citadel_gate, throne_hall, crypt_old, last_throne };
