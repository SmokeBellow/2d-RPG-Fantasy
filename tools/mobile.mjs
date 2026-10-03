// Проверка мобильной раскладки: node tools/mobile.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium, devices;
try { ({ chromium, devices } = require('playwright')); } catch { ({ chromium, devices } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const out = process.argv[2] || '/tmp/claude-0/mob';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('http://localhost:8123/index.html');
await p.waitForTimeout(600);
await p.tap('#scr-logo');
await p.waitForTimeout(700);
await p.screenshot({ path: out + '_menu.png' });
await p.tap('#m-new'); await p.waitForTimeout(600);
await p.screenshot({ path: out + '_class.png' });
await p.tap('[data-cls="rogue"]'); await p.waitForTimeout(1500);
await p.screenshot({ path: out + '_dialog.png' });
for (let i = 0; i < 10; i++) { if (!(await p.isVisible('#dialog'))) break; await p.tap('#dialog', { position: { x: 100, y: 20 } }).catch(() => {}); await p.waitForTimeout(200); }
await p.evaluate(() => { const w = window.__ember.world; w.p.x = 53 * 16; w.p.y = 17 * 16; });
await p.waitForTimeout(600);
// джойстик: касание слева и сдвиг
const cdp = await ctx.newCDPSession(p);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 120, y: 280, id: 1 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 170, y: 280, id: 1 }] });
await p.waitForTimeout(500);
await p.screenshot({ path: out + '_game.png' });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await p.tap('#b-inv'); await p.waitForTimeout(400);
await p.screenshot({ path: out + '_inv.png' });
await b.close();
