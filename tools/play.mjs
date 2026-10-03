// Сценарий прогона игры в браузере со скриншотами: node tools/play.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const out = process.argv[2] || '/tmp/claude-0/play';
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text()); });
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('http://localhost:8123/index.html');
await p.waitForTimeout(800);
await p.screenshot({ path: out + '_1logo.png' });
await p.mouse.click(640, 360);
await p.waitForTimeout(800);
await p.screenshot({ path: out + '_2menu.png' });
await p.click('#m-new');
await p.waitForTimeout(700);
await p.screenshot({ path: out + '_3class.png' });
await p.click('[data-cls="mage"]');
await p.waitForTimeout(1500);
await p.screenshot({ path: out + '_4prologue.png' });
for (let i = 0; i < 12; i++) {
  if (!(await p.isVisible('#dialog'))) break;
  await p.click('#dialog'); await p.waitForTimeout(150);
}
await p.waitForTimeout(600);
await p.screenshot({ path: out + '_5game.png' });
// бой: телепорт на луг со слизнями и атака
await p.evaluate(() => { const w = window.__ember.world; w.p.x = 53 * 16; w.p.y = 17 * 16; });
await p.waitForTimeout(500);
await p.keyboard.down('KeyD'); await p.waitForTimeout(500); await p.keyboard.up('KeyD');
for (let i = 0; i < 14; i++) { await p.keyboard.press('Space'); await p.keyboard.press('KeyK'); await p.waitForTimeout(120); }
await p.screenshot({ path: out + '_6fight.png' });
await p.keyboard.press('KeyI'); await p.waitForTimeout(300);
await p.screenshot({ path: out + '_7bag.png' });
await p.keyboard.press('Tab'); await p.waitForTimeout(300);
await p.screenshot({ path: out + '_8quests.png' });
await b.close();
