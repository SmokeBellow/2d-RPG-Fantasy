// Квесты, NPC и диалоги. Данные + небольшой движок. Без DOM, чтобы цепочку можно было проверить в Node.
import { addItem, removeItem, count, addXp, resolveItem } from './state.js';
import { ITEMS } from './defs.js';

// ---------------------------------------------------------------- NPC
// look — подсказки для спрайта; shop — id магазина; inn — цена отдыха
export const NPCS = {
  orwen: { name: 'Старейшина Орвен', look: 'elder', color: '#d8d0c0' },
  garth: { name: 'Стражник Гарт', look: 'guard', color: '#7a8aa8' },
  torvald: { name: 'Кузнец Торвальд', look: 'smith', shop: 'smith', color: '#c0703a' },
  mira: { name: 'Торговка Мира', look: 'merchant', shop: 'general', color: '#b8607a' },
  bom: { name: 'Трактирщик Бом', look: 'innkeeper', inn: 20, color: '#c9a064' },
  lissa: { name: 'Травница Лисса', look: 'herbalist', color: '#6ab070' },
  tim: { name: 'Тим', look: 'kid', color: '#e8c068' },
  pushok: { name: 'Пушок', look: 'cat', color: '#e8924a' },
};

// ---------------------------------------------------------------- квесты
// objectives: kill {what,n} | item {item,n} | flag {flag}
// consume — предметы, которые забирают при сдаче; auto — квесты, стартующие после сдачи этого
export const QUESTS = {
  m1: {
    id: 'm1', main: true, title: 'Погасший маяк', giver: 'orwen', turnIn: 'orwen', prereq: [],
    desc: 'Старейшина Орвен просит осмотреть маяк на площади Тихого Брода.',
    obj: [{ type: 'flag', flag: 'zone_beacon_area', text: 'Осмотреть маяк на площади' }],
    offer: ['Путник! Ты вовремя. Взгляни на наш маяк. Пламя Эмбера погасло в ночь на вторник.', 'Подойди к нему и посмотри сам. А потом возвращайся и расскажешь, что увидел.'],
    hint: ['Маяк стоит на площади, к северо-востоку от алтаря. Подойди к нему поближе.'],
    done: ['Холодный, как могильный камень, да? Так и есть: Пламя на последнем издыхании.', 'Скверна, что заперта в Цитадели на севере, почуяла слабину. Монстры уже лезут из леса. Нам нужна твоя помощь.'],
    reward: { xp: 40, gold: 25 },
  },
  m2: {
    id: 'm2', main: true, title: 'Первая кровь', giver: 'garth', turnIn: 'garth', prereq: ['m1'],
    desc: 'Гарт хочет убедиться, что ты умеешь обращаться с оружием: перебей слизней на восточном лугу.',
    obj: [{ type: 'kill', what: 'slime', n: 5, text: 'Победить слизней' }],
    offer: ['Новенький? Меч держать умеешь?', 'Проверим. На лугу к востоку расплодились слизни. Перебей пятерых, и поговорим всерьёз.'],
    hint: ['Луг на востоке, по дороге от площади. Слизни зелёные, их видно издалека.'],
    done: ['Пятеро! Неплохо для новичка.', 'Держи награду. И зайди к старейшине: у него есть дело поважнее слизней.'],
    reward: { xp: 70, gold: 40, items: [['p_hp1', 3]] },
  },
  m3: {
    id: 'm3', main: true, title: 'Осколок вождя', giver: 'orwen', turnIn: 'orwen', prereq: ['m2'],
    desc: 'Добудь первый Осколок Пламени у Грока, вождя гоблинов, в восточной части Шёпотного леса.',
    obj: [{ type: 'item', item: 'q_shard1', n: 1, text: 'Добыть Осколок Пламени (I)' }],
    offer: ['Пламя Эмбера когда-то раскололось. Два осколка ещё можно найти.', 'Первый у Грока, вождя гоблинов. Его лагерь на востоке Шёпотного леса: по тропе на север от деревни, затем направо. Он носит осколок как талисман, глупец.'],
    hint: ['Лагерь гоблинов на востоке леса. Вождь Грок крупный, берегись его дубины.'],
    done: ['Он тёплый… и живой. Оставь осколок у себя: нам понадобятся оба.'],
    reward: { xp: 220, gold: 90, items: [['p_hp2', 2]] },
  },
  m4: {
    id: 'm4', main: true, title: 'Ключ от склепа', giver: 'garth', turnIn: 'garth', prereq: ['m2'],
    desc: 'Добудь ключ от склепа у Волчьего Глаза, главаря разбойников из западной части леса.',
    obj: [{ type: 'item', item: 'q_key', n: 1, text: 'Добыть ключ от склепа' }],
    offer: ['Второй осколок лежит в склепе королей, у северных врат Шёпотного леса. А врата заперты.', 'Ключ у Волчьего Глаза, главаря разбойников. Его лагерь на западе леса. Осторожнее: он не любит гостей.'],
    hint: ['Лагерь разбойников на западе леса. Сам Волчий Глаз стоит у костра.'],
    done: ['Ключ у тебя! Ну ты даёшь. Оставь его при себе: склеп на севере леса, за святилищем.'],
    reward: { xp: 220, gold: 100, items: [['@armor2', 1]] },
  },
  m5: {
    id: 'm5', main: true, title: 'Склеп забытых королей', giver: 'orwen', turnIn: 'orwen', prereq: ['m3', 'm4'],
    desc: 'Открой врата склепа, дерни рычаги в обоих крыльях и добудь второй осколок у Полого короля.',
    obj: [{ type: 'item', item: 'q_shard2', n: 1, text: 'Добыть Осколок Пламени (II)' }],
    consume: ['q_shard1', 'q_shard2'], auto: ['m6'],
    offer: ['Ключ у тебя, значит дорога в склеп открыта. Дверь к королю откроется, если дёрнуть рычаги в западном и восточном крыльях.', 'Остерегайся Полого короля. Говорят, он всё ещё помнит, как держать меч.'],
    hint: ['Врата склепа на севере леса, за святилищем. В склепе ищи рычаги в обоих боковых залах.'],
    done: ['Оба осколка! Идём к Торвальду. Только он сумеет их перековать в оружие, достойное Пламени.'],
    reward: { xp: 650, gold: 250, items: [['p_hp2', 3], ['p_mp2', 3]] },
  },
  m6: {
    id: 'm6', main: true, title: 'Пламя возвращается', giver: 'orwen', turnIn: 'orwen', prereq: ['m5'], autoStart: true,
    desc: 'Торвальд перекует осколки в оружие. После этого зажги маяк.',
    obj: [
      { type: 'flag', flag: 'forged', text: 'Перековать осколки у Торвальда' },
      { type: 'flag', flag: 'beacon_lit', text: 'Зажечь маяк на площади' },
    ],
    offer: [], hint: ['Поговори с Торвальдом в кузнице, а затем подойди к маяку.'],
    done: ['Смотри! Пламя горит! Барьер Скверны на севере леса пал: путь в Цитадель открыт.', 'Теперь всё зависит от тебя. Мы будем ждать у маяка.'],
    reward: { xp: 500, gold: 200, items: [['@armor4', 1]] },
    auto: ['m7'],
  },
  m7: {
    id: 'm7', main: true, title: 'Цитадель Скверны', giver: 'orwen', turnIn: 'orwen', prereq: ['m6'], autoStart: true, autoComplete: true,
    desc: 'Пройди к Цитадели на северо-востоке леса и сразись со Скверным Владыкой.',
    obj: [{ type: 'kill', what: 'lord', n: 1, text: 'Победить Скверного Владыку' }],
    offer: [], hint: ['Цитадель в северо-восточном углу Шёпотного леса, за бывшим барьером.'],
    done: [],
    reward: { xp: 0, gold: 0 },
  },
  // ---------------- побочные
  s1: {
    id: 's1', title: 'Лунные цветы', giver: 'lissa', turnIn: 'lissa', prereq: [],
    desc: 'Лисса просит принести пять лунных цветов с лесных полян.',
    obj: [{ type: 'item', item: 'q_flower', n: 5, text: 'Собрать лунные цветы' }], consume: ['q_flower'],
    offer: ['Ой, как хорошо, что ты зашёл! У меня закончились лунные цветы, а без них ни одного зелья не сваришь.', 'Они растут в Шёпотном лесу на опушках и светятся голубым. Принеси пять, и я отблагодарю как смогу.'],
    hint: ['Лунные цветы светятся голубым на лесных полянах. Особенно у южных троп.'],
    done: ['Какая красота! Эти цветы совсем свежие. Вот, держи моё лучшее зелье маны.'],
    reward: { xp: 110, gold: 60, items: [['p_mp2', 2]] },
  },
  s2: {
    id: 's2', title: 'Шкуры для кузнеца', giver: 'torvald', turnIn: 'torvald', prereq: ['m2'],
    desc: 'Торвальду нужны пять волчьих шкур.',
    obj: [{ type: 'item', item: 'q_pelt', n: 5, text: 'Добыть волчьи шкуры' }], consume: ['q_pelt'],
    offer: ['Кожаные ремни на доспехи кончились. Принеси пять волчьих шкур, и я скажу спасибо звонкой монетой.', 'Волки бродят по всему лесу, особенно в логовах на юго-западе и юго-востоке.'],
    hint: ['Волки живут на южных полянах Шёпотного леса. Шкура падает не с каждого.'],
    done: ['Отличные шкуры! Вот, держи: я тут кое-что подточил.'],
    reward: { xp: 140, gold: 80, items: [['@weapon2', 1]] },
  },
  s3: {
    id: 's3', title: 'Амулет Элоизы', giver: 'bom', turnIn: 'bom', prereq: ['m2'],
    desc: 'Бом просит найти семейный амулет на островке посреди лесного озера.',
    obj: [{ type: 'item', item: 'q_amulet', n: 1, text: 'Найти амулет на острове' }], consume: ['q_amulet'],
    offer: ['Моя жена Элоиза обронила семейный амулет, когда рыбачила на озере в лесу. Сама ныряла бы, да волки.', 'Говорят, течение унесло его на островок посреди озера. Мост есть, с южного берега.'],
    hint: ['Озеро в центре Шёпотного леса. Остров с сундуком соединён мостом с южного берега.'],
    done: ['Он нашёлся! Элоиза расцветёт. Забирай его себе: ты его заслужил, а мы ей новый купим.'],
    reward: { xp: 170, gold: 120, items: [['c_amulet', 1]] },
  },
  s4: {
    id: 's4', title: 'Кот Пушок', giver: 'tim', turnIn: 'tim', prereq: [],
    desc: 'Тим потерял кота Пушка. Тот лежит на какой-то лесной поляне.',
    obj: [{ type: 'flag', flag: 'cat_found', text: 'Найти кота Пушка' }],
    offer: ['Дяденька… тётенька… в общем, воин! Мой кот Пушок убежал в лес. Он рыжий, толстый и очень ленивый.', 'Он любит лежать на солнечных полянах. Найдёшь, скажи ему, что дома рыбка.'],
    hint: ['Пушок лежит на поляне в юго-восточной части леса. Там ещё бродят волки.'],
    done: ['Пушок уже дома! Он мурчит! Спасибо-спасибо! Вот, всё, что у меня есть.'],
    reward: { xp: 90, gold: 30, items: [['p_hp1', 2], ['p_mp1', 2]] },
  },
  s5: {
    id: 's5', title: 'Паучий шёлк', giver: 'mira', turnIn: 'mira', prereq: ['m2'],
    desc: 'Мира собирает четыре клубка паучьего шёлка.',
    obj: [{ type: 'item', item: 'q_silk', n: 4, text: 'Собрать паучий шёлк' }], consume: ['q_silk'],
    offer: ['Шёлк для перевязок на исходе. Паучий лучше всего: принеси четыре клубка.', 'Пауки гнездятся в северо-западной чаще леса. Только не лезь в паутину!'],
    hint: ['Паучья чаща на северо-западе леса. Пауки плюются паутиной издалека.'],
    done: ['Отлично! Чистый, крепкий шёлк. Вот плата, и забери это на память.'],
    reward: { xp: 130, gold: 90, items: [['c_copper', 1]] },
  },
  s6: {
    id: 's6', title: 'Страницы летописи', giver: 'orwen', turnIn: 'orwen', prereq: ['m3'],
    desc: 'Три страницы летописи разбросаны по залам склепа королей.',
    obj: [{ type: 'item', item: 'q_page', n: 3, text: 'Собрать страницы летописи' }], consume: ['q_page'],
    offer: ['Король-основатель вёл летопись, но страницы разлетелись по залам склепа: библиотека, оружейная и часовня.', 'Принеси их. Я хочу знать, как он зажёг Пламя в первый раз.'],
    hint: ['Страницы лежат на полках в библиотеке (запад), оружейной (восток) и часовне (север склепа).'],
    done: ['«…пока в сердце хоть одного человека есть вера, Пламя не угаснет». Вот оно что.', 'Спасибо. Это знание ещё пригодится.'],
    reward: { xp: 300, gold: 100, items: [['c_spirit', 1]] },
  },
};

export const QUEST_ORDER = Object.keys(QUESTS);

// ---------------------------------------------------------------- состояние квеста
// 'locked' | 'available' | 'active' | 'ready' | 'done'
export function questStatus(s, id) {
  const q = QUESTS[id];
  const st = s.quests[id];
  if (st && st.state === 'done') return 'done';
  if (st && st.state === 'active') return isReady(s, id) ? 'ready' : 'active';
  if (q.prereq.every((p) => s.quests[p] && s.quests[p].state === 'done')) return q.autoStart ? 'locked' : 'available';
  return 'locked';
}

export function objProgress(s, id, o) {
  const st = s.quests[id];
  if (o.type === 'kill') return Math.min(o.n, (st && st.kills && st.kills[o.what]) || 0);
  if (o.type === 'item') return Math.min(o.n, count(s, o.item));
  if (o.type === 'flag') return s.flags[o.flag] ? 1 : 0;
  return 0;
}
export const objNeed = (o) => (o.type === 'flag' ? 1 : o.n);
export const isReady = (s, id) => QUESTS[id].obj.every((o) => objProgress(s, id, o) >= objNeed(o));

export function acceptQuest(s, id) {
  if (s.quests[id]) return false;
  s.quests[id] = { state: 'active', kills: {} };
  return true;
}

// Возвращает { xp, gold, items:[id], levels, next:[id] } — всё, что произошло при сдаче
export function completeQuest(s, id) {
  const q = QUESTS[id];
  const st = s.quests[id];
  if (!st || st.state !== 'active') return null;
  st.state = 'done';
  for (const it of q.consume || []) {
    const need = q.obj.find((o) => o.item === it);
    removeItem(s, it, need ? need.n : count(s, it));
  }
  const given = [];
  for (const [raw, n] of (q.reward.items || [])) {
    const id2 = resolveItem(raw, s.cls);
    addItem(s, id2, n); given.push([id2, n]);
  }
  s.gold += q.reward.gold || 0;
  const levels = addXp(s, q.reward.xp || 0);
  const next = [];
  for (const nid of q.auto || []) {
    if (QUESTS[nid].prereq.every((p) => s.quests[p] && s.quests[p].state === 'done') && acceptQuest(s, nid)) next.push(nid);
  }
  return { xp: q.reward.xp || 0, gold: q.reward.gold || 0, items: given, levels, next };
}

// Убийство врага засчитывается во всех активных квестах с такой целью
export function onKill(s, what) {
  const changed = [];
  for (const id of QUEST_ORDER) {
    const st = s.quests[id];
    if (!st || st.state !== 'active') continue;
    for (const o of QUESTS[id].obj) {
      if (o.type === 'kill' && o.what === what) { st.kills[what] = (st.kills[what] || 0) + 1; changed.push(id); }
    }
  }
  return changed;
}

// Квесты, автоматически завершаемые по цели (финал)
export function autoCompletable(s) {
  return QUEST_ORDER.filter((id) => QUESTS[id].autoComplete && questStatus(s, id) === 'ready');
}

export function activeQuests(s) {
  return QUEST_ORDER.filter((id) => ['active', 'ready'].includes(questStatus(s, id)));
}

// ---------------------------------------------------------------- диалоги
const IDLE = {
  orwen: ['Пока горит хоть одна свеча, надежда жива.', 'Не забывай отдыхать на алтарях. Они хранят тепло Пламени.', 'Береги себя, путник.'],
  garth: ['Север стал неспокойным. Держись троп.', 'Слизни? Ерунда. Вот волки в лесу…', 'Службу несу. Без выходных, зато с видом на маяк.'],
  torvald: ['Хороший металл поёт. Слышишь?', 'Нужен клинок получше? Загляни ко мне, есть кое-что.', 'Молот не любит ленивых.'],
  mira: ['Зелья, амулеты, всё для дальней дороги!', 'Без зелья в лес ходить — как без меча.', 'Покупай больше, дорожает всё.'],
  bom: ['Отдохни у меня, в «Дымном котле» тепло и сухо.', 'Эль? У нас только травяной настой. Лисса говорит, полезно.', 'Слышал в лесу воют. Не к добру.'],
  lissa: ['Травы чувствуют, когда рядом беда. Они поникли.', 'Лунные цветы собирают на закате. Они такие красивые…', 'Я бы пошла с тобой, да лес меня не любит.'],
  tim: ['А ты правда убил слизня? Он мягкий?', 'Когда вырасту, стану героем. Как ты!', 'Папа говорит, в лесу страшно. Но интересно же!'],
  pushok: ['Мррр.', 'Мур-р-р-р.'],
};

// Начало беседы: возвращает { npc, lines, choices, kind }
// actions: {t:'accept',q} | {t:'complete',q} | {t:'forge'} | {t:'shop',id} | {t:'rest'} | {t:'close'} | {t:'catfound'}
export function planTalk(s, npcId, rnd = Math.random) {
  const npc = NPCS[npcId];
  const out = { npc: npcId, name: npc.name, lines: [], choices: [], onEnd: null };
  const services = () => {
    const ch = [];
    if (npc.shop) ch.push({ label: 'Торговать', act: { t: 'shop', id: npc.shop } });
    if (npc.inn) ch.push({ label: `Отдохнуть (${npc.inn} зол.)`, act: { t: 'rest' } });
    ch.push({ label: 'Уйти', act: { t: 'close' } });
    return ch;
  };

  // особые сценарии
  if (npcId === 'pushok') {
    if (!s.flags.cat_found) {
      out.lines = ['Мррр… (Кот лениво приоткрывает один глаз.)', 'Вы шепчете ему про рыбку. Пушок вскакивает и бежит в сторону деревни.'];
      out.onEnd = { t: 'catfound' };
    } else out.lines = ['(Пушка здесь уже нет. Только примятая трава.)'];
    out.choices = [{ label: 'Закрыть', act: { t: 'close' } }];
    return out;
  }
  if (npcId === 'torvald' && s.quests.m6 && s.quests.m6.state === 'active' && !s.flags.forged) {
    out.lines = ['Это… осколки Пламени? Положи их сюда, на наковальню.', 'Стой тихо. Сейчас будет жарко.', '*Звон металла, вспышка света*', 'Готово! Лучшее оружие, что я когда-либо ковал. Владей им достойно.'];
    out.onEnd = { t: 'forge' };
    out.choices = [{ label: 'Спасибо!', act: { t: 'close' } }];
    return out;
  }

  // сдача
  for (const id of QUEST_ORDER) {
    const q = QUESTS[id];
    if (q.turnIn === npcId && questStatus(s, id) === 'ready' && !q.autoComplete) {
      out.lines = q.done.slice();
      out.onEnd = { t: 'complete', q: id };
      out.kind = 'turnin';
      out.choices = [{ label: 'Продолжить', act: { t: 'close' } }];
      return out;
    }
  }
  // предложение
  for (const id of QUEST_ORDER) {
    const q = QUESTS[id];
    if (q.giver === npcId && questStatus(s, id) === 'available') {
      out.lines = q.offer.slice();
      out.kind = 'offer';
      out.choices = [{ label: 'Принять задание', act: { t: 'accept', q: id } }, { label: 'Позже', act: { t: 'close' } }];
      return out;
    }
  }
  // подсказка по активному
  for (const id of QUEST_ORDER) {
    const q = QUESTS[id];
    if ((q.giver === npcId || q.turnIn === npcId) && questStatus(s, id) === 'active' && q.hint.length) {
      out.lines = [...q.hint];
      out.kind = 'hint';
      out.choices = services();
      return out;
    }
  }
  const idle = IDLE[npcId];
  out.lines = [idle[Math.floor(rnd() * idle.length)]];
  out.choices = services();
  return out;
}

export const itemName = (id) => (ITEMS[id] ? ITEMS[id].name : id);

// Значок над NPC: '!' — есть задание, '?' — можно сдать, '…' — задание в процессе
export function npcMarker(s, npcId) {
  let mark = null;
  for (const id of QUEST_ORDER) {
    const q = QUESTS[id];
    const st = questStatus(s, id);
    if (q.turnIn === npcId && st === 'ready' && !q.autoComplete) return '?';
    if (q.giver === npcId && st === 'available') mark = '!';
    else if (!mark && (q.giver === npcId || q.turnIn === npcId) && st === 'active') mark = '…';
  }
  return mark;
}
