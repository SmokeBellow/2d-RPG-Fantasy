// Прогон всех экранов интерфейса с наполненным состоянием, ищем ошибки JS. node tools/uistress.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const out = process.argv[2] || '/tmp/claude-0/ui';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
let errs = 0;
p.on('pageerror', (e) => { errs++; console.log('pageerror:', e.message); });
p.on('console', (m) => { if (m.type() === 'error') { errs++; console.log('console error:', m.text()); } });
await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(500);
await p.click('#scr-logo'); await p.waitForTimeout(400);
await p.click('#m-new'); await p.waitForTimeout(300);
await p.click('[data-cls="mage"]'); await p.waitForTimeout(1000);
for (let i = 0; i < 12; i++) { if (!(await p.isVisible('#dialog'))) break; await p.click('#dialog', { position: { x: 300, y: 30 }, timeout: 800 }).catch(() => {}); await p.waitForTimeout(100); }
// наполняем состояние
await p.evaluate(() => {
  const E = window.__ember, w = E.world, s = w.s;
  s.lvl = 6; s.gold = 777; s.xp = 100;
  w.refreshStats();
  for (const id of ['w_mag2', 'w_mag3', 'a_mag2', 'a_mag3', 'c_wolf', 'c_spirit', 'p_hp1', 'p_hp2', 'p_mp2', 'q_pelt', 'q_flower', 'q_key', 'q_page', 'w_war3']) s.inv[id] = (s.inv[id] || 0) + 2;
  s.quests.m1 = { state: 'done', kills: {} }; s.quests.m2 = { state: 'active', kills: { slime: 3 } };
  s.quests.s1 = { state: 'active', kills: {} }; s.quests.s2 = { state: 'done', kills: {} };
  s.flags.zone_beacon_area = true;
  E.ui.tracker(s);
});
for (const tab of ['char', 'bag', 'quests']) {
  await p.keyboard.press(tab === 'quests' ? 'Tab' : 'KeyI'); await p.waitForTimeout(250);
  await p.click(`[data-tab="${tab}"]`); await p.waitForTimeout(250);
  if (tab === 'bag') { await p.click('.cell >> nth=2'); await p.waitForTimeout(150); }
  if (tab === 'quests') { await p.click('.qrow >> nth=1').catch(() => {}); await p.waitForTimeout(150); }
  await p.screenshot({ path: `${out}_${tab}.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
}
// магазины: покупка и продажа
for (const sh of ['smith', 'general']) {
  await p.evaluate((sh) => window.__ember.ui.openShop(sh), sh); await p.waitForTimeout(250);
  await p.screenshot({ path: `${out}_shop_${sh}_buy.png` });
  await p.click('[data-stab="buy"]');
  const btn = p.locator('#shop-body button.primary').first();
  if (await btn.count()) { await btn.click(); await p.waitForTimeout(150); }
  await p.click('[data-stab="sell"]'); await p.waitForTimeout(250);
  const sell = p.locator('#shop-body button').first();
  if (await sell.count()) await sell.click();
  await p.screenshot({ path: `${out}_shop_${sh}_sell.png` });
  await p.click('#shop-close'); await p.waitForTimeout(150);
}
// всплывающие элементы
await p.evaluate(() => {
  const ui = window.__ember.ui;
  ui.banner('Склеп забытых королей', 'Тишина тяжелее камня');
  ui.toast('Получено: Ключ от склепа', 'quest'); ui.toast('Не хватает маны', 'warn'); ui.toast('Сундук: 40 золота', 'item');
  ui.questPop('m1', { xp: 40, gold: 25, items: [['p_hp1', 3], ['a_mag2', 1]], levels: 0, next: [] });
});
await p.waitForTimeout(700);
await p.screenshot({ path: `${out}_popups.png` });
// диалоги всех NPC
const lines = await p.evaluate(async () => {
  const { planTalk, NPCS } = await import('./js/quests.js');
  const s = window.__ember.world.s;
  const res = [];
  for (const id of Object.keys(NPCS)) { const pl = planTalk(s, id); res.push(id + ':' + pl.kind + ':' + pl.lines.length + ':' + pl.choices.length); }
  return res;
});
console.log('диалоги:', lines.join(' | '));
await p.evaluate(async () => { const { planTalk } = await import('./js/quests.js'); window.__ember.ui.openDialogue(planTalk(window.__ember.world.s, 'lissa')); });
await p.waitForTimeout(2500);
await p.screenshot({ path: `${out}_dialog_lissa.png` });
await p.click('#dlg-choices button >> nth=0'); await p.waitForTimeout(300);
// босс-бар, смерть, финал
await p.evaluate(() => { const ui = window.__ember.ui, w = window.__ember.world; ui.banner('Полый король', 'Босс', true); ui.bossBar({ def: { title: 'Полый король' }, hp: 700, maxHp: 800 }); });
await p.waitForTimeout(500); await p.screenshot({ path: `${out}_boss.png` });
await p.evaluate(() => { window.__ember.ui.bossBar(null); window.__ember.ui.showDeath(true); });
await p.waitForTimeout(300); await p.screenshot({ path: `${out}_death.png` });
await p.evaluate(() => { window.__ember.ui.showDeath(false); window.__ember.ui.showEnding(window.__ember.world.s); });
await p.waitForTimeout(300); await p.screenshot({ path: `${out}_ending.png` });
await p.click('#e-continue'); await p.waitForTimeout(200);
await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.screenshot({ path: `${out}_pause.png` });
await b.close();
console.log(errs ? `ОШИБОК: ${errs}` : 'интерфейс: ошибок JS нет');
