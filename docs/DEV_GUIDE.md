# Руководство по контенту Эмбервейла

Сюжет: `docs/STORY.md` (v4, утверждён, не менять). Образцы кода: `js/areas_l1.js` (карты), `js/story_l1.js` (NPC, квесты, диалоги). Читай оба перед работой.
Весь язык игры русский. Тон взрослый, без детскости, без пафоса и без «ИИ-штампов». Реплики живые, у каждого NPC свой голос.

## Файлы локации
- `js/areas_lN.js`: функции-билдеры карт и `export const BUILD = { id: fn, ... }` (уже подключён в `maps.js`).
- `js/story_lN.js`: `NPC(...)`, `Q(...)`, `N(...)`, `E(...)`, `ITEM(...)` из `story_core.js` (уже подключён в `quests.js`).
- `js/looks_lN.js`: `NPC_LOOKS` и `ENEMY_HUMAN` для новых внешностей (формат — как в `sprites_chars.js`, поля humanSet: skin, hairC, hair, beard, top[3], pants[2], boots, hat, hatCol, hold, robe, cape, pads, tabard и др.; посмотри существующие).
- Общие файлы (`defs.js`, `ai.js`, `world.js`, `render.js`, `ui.js`, `gods.js`) трогай минимально, только Edit точечно, перечитывая файл перед правкой: рядом работают другие. Новые предметы регистрируй через `ITEM('id', {name, desc})` в своём story-файле; новых врагов не добавляй без необходимости (ростер уже есть в `defs.js` ENEMIES, у каждого `look`).

## Билдер карт (`maps_core.js`)
`new Builder(id, w, h, seed, baseTile)`; `b.spawn`; `blob/path/disc/rect/room/corridor/scatter/row/rubble/litter/forest/border`; `prop(kind,x,y,extra)`, `npc(id,x,y,{showIf,hideIf})`, `enemy(type,x,y,lvl,{unique,showIf,hideIf})`, `chest(id,x,y,[[item|'gold',n]])` (предметы вида '@weapon3' = оружие по классу), `node(id,item,x,y)`, `zone(id,x,y,w,h)` (при входе ставит флаг `zone_<id>`), `portal(id,x,y,w,h,to,{x,y}arrive,{req:{flag|item,msg}})`, `b.doors`, `b.finish()`.
Виды объектов и размеры: `PROP_DEF` в `maps_core.js`. `use:` бывает `sign` (text), `page` (text,id,fx), `shrine` (сохранение и лечение), `lever`, `beacon` (beacon:N, как в `village`), `altar`. `godaltar` с полем `god: 'torn'` рисуется цветом бога.
Тайлы: `T.GRASS/DIRT/PLAZA/SAND/WOOD/CRYPT/BLIGHT/ASH/COBBLE/ICE/SNOW/SWAMP/WATER/DEEP/WALL/ROCK/CWALL/BWALL/TREE/LAVA/BRIDGE`. Для подземелий база `T.CWALL`, полы `T.CRYPT`. Города: `COBBLE`/`PLAZA`, стены домов — объекты `house`/`hut2`/`tavern` и т.п. Тема области (`AREAS[id].theme`) красит все тайлы общим оттенком.
Лестницы: `prop('stairs',x,y)` непроходима только рядом; портал кладётся на проходимую строку лестницы, точка прибытия вне прямоугольника портала. Все объекты, враги, NPC обязаны быть достижимы от `spawn` (проверяет `node tests/validate.mjs`). Врага в стене билдер сам сдвигает.

## Диалоги, квесты, эффекты
Узел: `N(id, { n: 'Имя' (по умолчанию имя NPC), t: ['реплика', ...] или (s,world)=>[...], c: [c('Подпись', 'следующий_узел'|null, [эффекты], (s)=>bool), ...], fx: [эффекты при входе] })`. Выбор без `go` закрывает разговор. `E(npcId, (s)=>'узел')` выбирает вход; запасной узел `idle_<npcId>`; общий `idle_default`.
Эффекты: `['f','флаг']`, `['uf','флаг']`, `['q+','id']` (взять), `['q!','id']` (сдать, выдаёт награду), `['god','torn',+8]`, `['item','id',n]`, `['take','id',n]`, `['gold',n]`, `['xp',n]`, `['sp',n]`, `['shop','shopId']`, `['rest',цена]`, `['heal']`, `['choice','ключ','значение']`, `['fight','тип врага','npcId',lvl]` (NPC становится врагом; при смерти ставится флаг `k_<npcId>`), `['end','close|seal|free|throne']`, `['respec']`, `['toast','текст']`, `['travel','area',tileX,tileY]`, `['refresh']`.
Условия в выборах и E: из `story_core.js` `qst/done/active/flag/has/picked/ready` (`ready(s,'q')` значит цели выполнены), `s.cls`, `s.lvl`, `s.choices`, `s.gods`. Для выбора, зависящего от класса, `cond: (s)=>s.cls==='mage'`.
Квест: `Q(id, { main?, title, giver, turnIn, prereq:[id], when:(s)=>bool, desc, hint:[..], obj:[{type:'kill',what:'enemyType|unique',n,text} | {type:'item',item,n,text} | {type:'flag',flag,text} | {type:'any',flags:[..],text}], consume:[itemId], reward:{xp,gold,items:[[id,n]],sp,favor:[['god',n]]}, auto:[id] })`. Очки навыков `sp` дают только важные квесты (1 за веху). `favor` — скрытая репутация.
Развилка: выбор пишет `['choice','ключ','значение']` (для эпилога, см. `endings.js`) и двигает богов `['god',id,±N]`. Боги: lyara torn ori seyr mara kharn issa. Выбор должен иметь последствия и в мире (флаги, исчезновение/появление NPC через `showIf/hideIf`, другие реплики), не только в числах. Рейтинг игроку НЕ показывается (только омен-тост при смене ранга и храм).
Размеры: типичный важный квест 3-6 узлов диалога; NPC с развилкой 8-15 узлов. Побочные квесты выдают 1-2 NPC по 2-4 узла. Минимум 1 неочевидный выбор на область.

## Баланс
Уровни: Л1 1-6, Л2 5-9, Л3 8-13, Л4/5 12-17, Л6 17-20 (кап 20). XP квеста ≈ 40·lvl для побочных и ≈ 70·lvl для основных. Враги масштабируются lvl (hp ×(1+0.22(lvl-1)), атака ×(1+0.18(lvl-1))). Золото сундука ≈ 10·lvl. Магазины: `SHOPS` в `defs.js` (по тирам брони/оружия).

## Контракт между локациями (размеры карт и порталы фиксированы)
- Л1 → Л2: `darkforest` портал `to_city` → `city_market` в (32.5, 40.5), флаг `road_open`; квест `c1` берёт Орвен (с предметом `q_letter`).
- `city_market` 72x48; восточные ворота: портал `to_valley` x=70,y=22,w=2,h=4 → `valley_fields` (4.5, 32.5), `req.flag='valley_open'`. Возврат из долины прибывает в `city_market` (68.5, 23.5).
- `valley_fields` 96x64; западный портал `to_city` x=1,y=30,w=2,h=4 → `city_market` (68.5, 23.5); восточный `to_pass` x=93,y=30,w=2,h=4 → `valley_pass` (4.5, 24.5). Внутри: `vault1`/`vault2`, `abbey`.
- `valley_pass` 80x48: запад (из долины) x=1,y=22,w=2,h=4 → `valley_fields` (91.5, 32.5); север `to_bastion` x=38,y=1,w=4,h=2 → `bastion` (40.5, 60.5), `req.flag='pass_open'`; восток `to_harbor` x=77,y=22,w=2,h=4 → `harbor` (4.5, 30.5), `req.flag='pass_open'`; юг `to_citadel` x=38,y=45,w=4,h=2 → `citadel_gate` (30.5, 36.5), `req.flag='gate_open'`.
- `bastion` 80x64 (возврат `to_pass` внизу x=38,y=62,w=4,h=1 → `valley_pass` (39.5, 4.5)); `arena`, `grove`, `glacier` — внутренние области Л4.
- `harbor` 80x56 (возврат `to_pass` слева x=1,y=29,w=2,h=4 → `valley_pass` (75.5, 23.5)); `lighthouse`, `clinic`, `den` — внутренние области Л5.
- `citadel_gate` 60x40 (возврат `to_pass` внизу x=28,y=38,w=4,h=1 → `valley_pass` (39.5, 44.5)); `throne_hall`, `crypt_old`, `last_throne` внутри.
Остальные размеры и все внутренние порталы — на усмотрение автора локации (ID областей и темы уже заданы в `AREAS`, `defs.js`).
Сквозные флаги и предметы: `beacon1/2/3` (ставит прокладка маяка, предметы `q_core/q_core2/q_core3`; маяк №1 в деревне, №2 в Стоках/на башне города, №3 в Хранилище), `valley_open` (конец Л2), `pass_open` (конец Л3), `gate1/gate2` и предметы `q_gate1/q_gate2` (конец Л4/Л5 → `gate_open`, ставит NPC в Л6-подходе или последний квест Л5). Решения: `choices.faction` ∈ council|collegium|remembering (Л2), `choices.proof` ∈ council|collegium|remembering|burn (Л3). Лики `lik_<god>` выдают квесты богов (Л4/Л5). Боги в Л3 только проявляются.

## Проверки
`node tests/validate.mjs` (карты, достижимость, граф диалогов, квесты, предметы) должен проходить для твоих областей. Для скриншота: `python3 -m http.server 8123` уже запущен; `node tools/shot.mjs` или собственный Playwright-скрипт; в консоли игры: `__ember.begin(__ember.newState('mage'),false)` затем `__ember.world.travel('area',x,y)`. Смотри картинки области глазами: нет ли пустых/нелепых мест, нечитаемой геометрии.
Не коммить и не пушь: это делаю я. Не запускай `git`-команды, меняющие состояние.
