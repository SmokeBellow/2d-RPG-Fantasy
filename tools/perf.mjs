// Замер скорости логики и отрисовки в браузере: node tools/perf.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('pageerror', (e) => console.log('pageerror:', e.message));
for (const [area, x, y] of [['village', 32, 24], ['forest', 47, 58], ['forest', 71, 38], ['crypt', 32, 31], ['citadel', 28, 50]]) {
  const t0 = Date.now();
  await p.goto(`http://localhost:8123/tools/scene.html?area=${area}&x=${x}&y=${y}&cls=mage&lvl=8&steps=5`);
  await p.waitForFunction('window.done');
  const load = Date.now() - t0;
  const r = await p.evaluate(() => {
    const { w, r, inp } = window.__scene;
    let tu = 0, td = 0; const N = 300;
    for (let i = 0; i < N; i++) {
      inp.mx = Math.cos(i / 30); inp.my = Math.sin(i / 30); inp.attack = i % 12 < 4;
      let a = performance.now(); w.update(1 / 60, inp); tu += performance.now() - a;
      r.consume(w.drain());
      a = performance.now(); r.draw(w, 1 / 60); td += performance.now() - a;
    }
    return { upd: tu / N, draw: td / N };
  });
  console.log(`${area.padEnd(8)} (${x},${y}) загрузка ${load} мс, логика ${r.upd.toFixed(2)} мс/кадр, отрисовка ${r.draw.toFixed(2)} мс/кадр`);
}
await b.close();
