// UI-сценарий: диалоги, магазин, журнал, сохранение/продолжение. node tools/flow.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const out = process.argv[2] || '/tmp/claude-0/flow';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
p.on('pageerror', (e) => { errors.push(e.message); console.log('pageerror:', e.message); });
p.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text()); });
await p.goto('http://localhost:8123/index.html');
await p.waitForTimeout(600); console.log('loaded');
await p.click('#scr-logo'); await p.waitForTimeout(500);
await p.click('#m-new'); await p.waitForTimeout(400);
await p.click('[data-cls="warrior"]'); await p.waitForTimeout(1200);
const closeDlg = async () => { for (let i = 0; i < 15; i++) { if (!(await p.isVisible('#dialog'))) break; await p.click('#dialog', { position: { x: 400, y: 30 } }); await p.waitForTimeout(120); } };
await closeDlg();
const tp = (x, y) => p.evaluate(([x, y]) => { const w = window.__ember.world; w.p.x = x * 16; w.p.y = y * 16; w.p.vx = 0; }, [x, y]);
const near = (id) => p.evaluate((id) => { const w = window.__ember.world; const n = w.npcs.find((q) => q.id === id); w.p.x = n.px; w.p.y = n.py + 14; }, id);
console.log('step1'); // 1. Орвен: предложение квеста
await near('orwen'); await p.waitForTimeout(300);
await p.keyboard.press('KeyE'); await p.waitForTimeout(2500);
await p.screenshot({ path: out + '_1orwen.png' });
await closeDlg();
console.log('step2'); // 2. Торвальд: магазин (после диалога выбрать «Торговать»)
await near('torvald'); await p.waitForTimeout(300);
await p.keyboard.press('KeyE'); await p.waitForTimeout(1800);
for (let i = 0; i < 6; i++) { if (await p.locator('#dlg-choices button').count()) break; await p.click('#dialog', { position: { x: 400, y: 30 }, timeout: 800 }).catch(() => {}); await p.waitForTimeout(150); }
await p.waitForTimeout(500);
const shopBtn = p.locator('#dlg-choices button', { hasText: 'Торговать' });
if (await shopBtn.count()) { await shopBtn.click(); await p.waitForTimeout(500); await p.screenshot({ path: out + '_2shop.png' }); await p.click('#shop-close'); } else console.log('нет кнопки «Торговать»');
await p.waitForTimeout(300);
console.log('step3'); // 3. Алтарь и сохранение
await tp(32, 27.4); await p.waitForTimeout(300);
await p.keyboard.press('KeyE'); await p.waitForTimeout(500);
await p.screenshot({ path: out + '_3shrine.png' });
console.log('step4'); // 4. Герой
await p.keyboard.press('KeyI'); await p.waitForTimeout(200);
await p.click('[data-tab="char"]'); await p.waitForTimeout(300);
await p.screenshot({ path: out + '_4char.png' });
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
console.log('step5'); // 5. Пауза -> меню -> Продолжить
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.screenshot({ path: out + '_5pause.png' });
await p.click('#p-menu'); await p.waitForTimeout(900);
await p.screenshot({ path: out + '_6menu_after.png' });
const cont = await p.isEnabled('#m-continue');
console.log('Продолжить доступно:', cont);
await p.click('#m-continue'); await p.waitForTimeout(1200);
const st = await p.evaluate(() => { const s = window.__ember.world.s; return { cls: s.cls, lvl: s.lvl, area: s.area, gold: s.gold, quests: Object.keys(s.quests) }; });
console.log('После продолжения:', JSON.stringify(st));
await b.close();
console.log(errors.length ? 'ОШИБКИ: ' + errors.length : 'без ошибок JS');
