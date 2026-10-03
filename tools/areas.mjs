// Скриншоты областей: node tools/areas.mjs <out-prefix> <area:x:y> ...   (x,y в тайлах, класс — mage)
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [out, ...list] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
p.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text()); });
p.on('pageerror', (e) => console.log('pageerror:', e.message, (e.stack || '').split('\n').slice(0, 4).join(' / ')));
await p.goto('http://localhost:8123/index.html');
await p.waitForTimeout(600);
await p.evaluate(() => { const E = window.__ember; const s = E.newState(window.__cls || 'mage'); s.lvl = 8; E.begin(s, false); });
await p.waitForTimeout(500);
for (const spec of list) {
  const [area, x, y] = spec.split(':');
  await p.evaluate(([a, x, y]) => { const w = window.__ember.world; w.travel(a, +x * 16, +y * 16); window.__ember.renderer.setWorld(w); w.s.hp = 9999; }, [area, x, y]);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${out}_${area}.png` });
}
await b.close();
