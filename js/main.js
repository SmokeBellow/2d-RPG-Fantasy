// Эмбервейл: точка входа. Экраны, игровой цикл, связка мира, рендера, интерфейса и звука.
import { CLASSES, AREAS, CFG } from './defs.js';
import { newState } from './state.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { UI } from './ui.js';
import { loadSave, writeSave, clearSave, loadSettings, writeSettings } from './save.js';

const $ = (id) => document.getElementById(id);
const settings = loadSettings();
const sound = new Sound();
sound.setVolumes(settings.music, settings.sfx);

let world = null, renderer = null, input = null, ui = null;
let screen = 'logo';      // logo | menu | class | about | settings | game
let transitioning = false;
let autosaveT = 0;
let paused = false;

// ---------------------------------------------------------------- масштаб
function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  let s = Math.min(w / 480, h / 270);
  if (s >= 2) s = Math.floor(s * 2) / 2;       // кратно 0.5, чтобы пиксели были ровнее
  document.documentElement.style.setProperty('--s', s);
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 200));
fit();

// ---------------------------------------------------------------- экраны
const SCREENS = ['logo', 'menu', 'class', 'about', 'settings', 'game'];
function show(name) {
  screen = name;
  for (const n of SCREENS) {
    const el = $('scr-' + n);
    if (n === name) {
      el.classList.add('on');
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    } else { el.classList.remove('show'); el.classList.remove('on'); }
  }
  $('bg-canvas').style.display = name === 'game' ? 'none' : 'block';
  if (name === 'menu') ui.menuInfo(loadSave());
  if (name !== 'game') sound.setTheme('village');
}

function fade(fn, ms = 360) {
  const f = $('fade');
  f.classList.add('on');
  setTimeout(() => { fn(); requestAnimationFrame(() => f.classList.remove('on')); }, ms);
}

// ---------------------------------------------------------------- игра
const game = {
  get world() { return world; },
  sound,
  act(a) { world.act(a); },
  togglePanel(tab) {
    if (!world || transitioning) return;
    if (ui.panelOpen && (ui.tab === tab || !tab)) { ui.closePanel(); return; }
    if (ui.blocking && !ui.panelOpen) return;
    ui.openPanel(tab); input.reset();
  },
  pause(on) {
    if (!world || screen !== 'game') return;
    const next = on === undefined ? !paused : on;
    if (next && ui.blocking && !ui.pauseOpen) return;
    paused = next; ui.showPause(next); ui.syncSettings(settings); input.reset();
  },
  escape() {
    if (screen !== 'game') { if (screen !== 'menu' && screen !== 'logo') { show('menu'); } return; }
    if (ui.shopOpen) { ui.closeShop(); return; }
    if (ui.panelOpen) { ui.closePanel(); return; }
    if (ui.plan) { ui.closeDialog(); return; }
    if (ui.deathOpen || ui.endingOpen) return;
    game.pause();
  },
  quitToMenu() {
    if (world && !world.p.dead) writeSave(world.s);
    paused = false; ui.closeAll(); ui.showPause(false);
    fade(() => { world = null; show('menu'); });
  },
  openShop(id) { ui.openShop(id); input.reset(); },
  respawn() {
    ui.showDeath(false);
    fade(() => { world.respawn(); renderer.setWorld(world); ui.tracker(world.s); writeSave(world.s); }, 300);
  },
  afterUi() { input.reset(); ui.tracker(world.s); },
};

function begin(state, isNew) {
  world = new World(state);
  if (!renderer) renderer = new Renderer($('game'));
  renderer.setWorld(world);
  ui.refreshClass(state);
  ui.tracker(state);
  ui.closeAll();
  paused = false; transitioning = false;
  input.reset();
  autosaveT = 0;
  show('game');
  sound.setTheme('village');
  if (isNew) {
    ui.openDialogue({
      name: 'Пролог',
      lines: [
        'Три ночи подряд над Эмбервейлом гас свет. Пламя Эмбера, хранившее мир от Скверны, дрожит, как свеча на ветру.',
        'Ты пришёл в Тихий Брод на закате, усталый и с пустыми карманами. Над площадью виден старый маяк: холодный и тёмный.',
        'Поговори с жителями. Старейшина Орвен живёт в доме на северо-западе. Для разговора подойди и нажми E (на телефоне появится кнопка).',
      ],
      choices: [{ label: 'В путь!', act: { t: 'close' } }],
    });
  }
}

function startNew(cls) {
  const state = newState(cls);
  writeSave(state);
  fade(() => begin(state, true));
}

// ---------------------------------------------------------------- события мира
function handle(events) {
  for (const e of events) {
    switch (e.t) {
      case 'sfx': sound.sfx(e.n); break;
      case 'music': sound.setTheme(e.theme); break;
      case 'toast': ui.toast(e.text, e.kind); break;
      case 'area': ui.banner(e.name, e.sub); break;
      case 'talk': ui.openDialogue(e.plan); input.reset(); break;
      case 'text': if (e.panel) { ui.openDialogue({ name: e.name, lines: [e.text], choices: [{ label: 'Закрыть', act: { t: 'close' } }] }); input.reset(); } break;
      case 'levelup':
        ui.toast(`Новый уровень: ${e.lvl}!`, 'good'); sound.sfx('fanfare');
        if (e.lvl === 5) ui.toast('Открыт второй навык!', 'good');
        ui.tracker(world.s);
        break;
      case 'questDone': ui.questPop(e.id, e.reward); break;
      case 'quest': ui.tracker(world.s); if (ui.panelOpen) ui.renderPanel(); break;
      case 'stats': if (ui.panelOpen) ui.renderPanel(); if (ui.shopOpen) ui.renderShop(); break;
      case 'bossIntro': ui.banner(e.name, 'Босс', true); break;
      case 'boss': ui.bossBar(e.e); sound.setBoss(!!e.e); break;
      case 'save': writeSave(world.s); break;
      case 'death':
        sound.stopMusic();
        setTimeout(() => { if (world && world.p.dead) { ui.showDeath(true); input.reset(); } }, 1200);
        break;
      case 'victory':
        writeSave(world.s);
        setTimeout(() => { ui.showEnding(world.s); input.reset(); }, 2600);
        break;
      case 'beacon': ui.tracker(world.s); break;
      case 'transition':
        if (!transitioning) {
          transitioning = true;
          fade(() => {
            world.travel(e.to, e.x, e.y);
            renderer.setWorld(world);
            ui.bossBar(null); sound.setBoss(false);
            ui.tracker(world.s);
            transitioning = false;
          }, 380);
        }
        break;
      default: break;
    }
  }
}

// ---------------------------------------------------------------- цикл
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (screen !== 'game' || !world) {
    ui.animateMenu(dt, screen);
  } else {
    const blocked = ui.blocking || transitioning || paused;
    input.enabled = !blocked && !world.p.dead;
    const cam = { x: renderer.cx || 0, y: renderer.cy || 0 };
    const inp = input.poll(cam);
    if (!blocked) {
      world.update(dt, inp);
      autosaveT += dt;
      if (autosaveT > 25 && !world.p.dead) { autosaveT = 0; writeSave(world.s); }
    }
    const events = world.drain();
    renderer.consume(events);
    handle(events);
    renderer.draw(world, blocked && !world.p.dead ? dt * 0.5 : dt);
    ui.hud(world);
    ui.tick(dt);
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- инициализация
function init() {
  ui = new UI(game);
  input = new Input($('stage'));
  input.hooks = {
    pause: () => game.escape(),
    inventory: () => { if (screen === 'game') game.togglePanel('bag'); },
    journal: () => { if (screen === 'game') game.togglePanel('quests'); },
    advance: () => (ui.plan ? ui.advance() : false),
  };
  ui.buildClassCards((cls) => {
    if (loadSave() && !window.confirm('Начать заново? Текущее сохранение будет перезаписано.')) return;
    startNew(cls);
  });
  // касание включает сенсорное управление
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) input.setTouch(true);
  window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') input.setTouch(true); sound.unlock(); }, true);
  window.addEventListener('keydown', () => sound.unlock(), true);

  $('scr-logo').addEventListener('pointerdown', () => { sound.unlock(); show('menu'); });
  window.addEventListener('keydown', (e) => { if (screen === 'logo' && (e.code === 'Enter' || e.code === 'Space')) { sound.unlock(); show('menu'); } });
  $('m-continue').addEventListener('click', () => {
    const s = loadSave();
    if (s) fade(() => begin(s, false));
  });
  $('m-new').addEventListener('click', () => show('class'));
  $('m-about').addEventListener('click', () => show('about'));
  $('m-settings').addEventListener('click', () => { syncSettingsScreen(); show('settings'); });
  $('about-done').addEventListener('click', () => show('menu'));
  for (const b of document.querySelectorAll('[data-back]')) b.addEventListener('click', () => show(b.dataset.back));

  // настройки
  const apply = () => { sound.setVolumes(settings.music, settings.sfx); writeSettings(settings); };
  for (const [id, key] of [['p-music', 'music'], ['s-music', 'music'], ['p-sfx', 'sfx'], ['s-sfx', 'sfx']]) {
    $(id).addEventListener('input', (e) => { settings[key] = e.target.value / 100; apply(); syncSettingsScreen(); if (key === 'sfx') sound.sfx('item'); });
  }
  const toggleFs = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else await (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
    } catch (e) { /* не поддерживается (например, iPhone) */ }
  };
  $('p-fs').addEventListener('click', toggleFs);
  $('s-fs').addEventListener('click', toggleFs);
  $('s-reset').addEventListener('click', () => { if (window.confirm('Удалить сохранение? Это действие нельзя отменить.')) { clearSave(); ui.menuInfo(null); } });
  $('s-back').addEventListener('click', () => show('menu'));
  function syncSettingsScreen() {
    $('s-music').value = Math.round(settings.music * 100); $('s-sfx').value = Math.round(settings.sfx * 100);
    ui.syncSettings(settings);
  }
  syncSettingsScreen();

  // сохранить при уходе со страницы
  const flush = () => { if (world && screen === 'game' && !world.p.dead) writeSave(world.s); };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { flush(); sound.stopMusic(); } else if (world) sound.setTheme(world.area === 'village' ? 'village' : AREAS[world.area].theme); });

  // PWA
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

  // шрифт нужен для текста на canvas
  const go = () => { show('logo'); requestAnimationFrame(frame); };
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('800 16px Nunito')]).then(go, go); else go();

  // для отладки и тестов
  window.__ember = { get world() { return world; }, get renderer() { return renderer; }, get ui() { return ui; }, begin, show, newState, game };
}
init();
