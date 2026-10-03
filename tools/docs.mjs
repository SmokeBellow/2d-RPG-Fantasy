// Скриншоты для README: node tools/docs.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('pageerror', (e) => console.log('pageerror:', e.message));
const BASE = 'http://localhost:8123/';
// меню и выбор класса
await p.goto(BASE + 'index.html'); await p.waitForTimeout(700);
await p.click('#scr-logo'); await p.waitForTimeout(900);
await p.screenshot({ path: 'docs/menu.png' });
await p.click('#m-new'); await p.waitForTimeout(900);
await p.screenshot({ path: 'docs/classes.png' });
// игровые сцены (через harness с готовым состоянием)
const scene = async (q, file, steps = 120) => {
  await p.goto(BASE + 'tools/scene.html?' + q + '&steps=' + steps);
  await p.waitForFunction('window.done'); await p.waitForTimeout(250);
  await p.screenshot({ path: file });
};
await scene('area=village&x=32&y=24&cls=mage&lvl=3', 'docs/village.png');
await scene('area=forest&x=47&y=58&cls=warrior&lvl=4', 'docs/forest.png');
await scene('area=crypt&x=32&y=31&cls=rogue&lvl=8', 'docs/crypt.png');
await scene('area=forest&x=71&y=38&cls=warrior&lvl=7&attack=1', 'docs/boss.png', 90);
await b.close();
