// Длинный прогон отрисовки и боя во всех областях для трёх классов: ищем ошибки JS. node tools/soak.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
let errs = 0;
p.on('pageerror', (e) => { errs++; console.log('pageerror:', e.message); });
p.on('console', (m) => { if (m.type() === 'error') { errs++; console.log('console error:', m.text()); } });
const spots = [['village', 54, 22], ['forest', 71, 38], ['forest', 26, 38], ['forest', 17, 15], ['crypt', 32, 30], ['crypt', 32, 9], ['citadel', 28, 48], ['citadel', 28, 10]];
for (const cls of ['warrior', 'mage', 'rogue']) {
  for (const [area, x, y] of spots) {
    await p.goto(`http://localhost:8123/tools/scene.html?area=${area}&x=${x}&y=${y}&cls=${cls}&lvl=12&steps=3`);
    await p.waitForFunction('window.done');
    const r = await p.evaluate(() => {
      const { w, r, inp } = window.__scene;
      w.s.hp = w.stats.maxHp * 10; // бессмертие для длинного прогона
      let deaths = 0;
      for (let i = 0; i < 1500; i++) {
        w.s.hp = Math.min(w.stats.maxHp, w.s.hp + 2); w.s.mp = w.stats.maxMp;
        const a = i / 25;
        inp.mx = Math.cos(a); inp.my = Math.sin(a * 0.7); inp.attack = true;
        inp.skill = [i % 90 === 0, i % 130 === 0]; inp.dodge = i % 170 === 0;
        w.update(1 / 60, inp);
        for (const e of w.enemies) if (e.boss && !e.aggro) e.aggro = true;
        const ev = w.drain(); r.consume(ev); r.draw(w, 1 / 60);
        if (w.p.dead) { deaths++; w.respawn(); r.setWorld(w); }
      }
      return { deaths, enemies: w.enemies.filter((e) => e.alive).length, fx: r.fx.length };
    });
    console.log(`${cls.padEnd(8)} ${area.padEnd(8)} (${x},${y}) смертей ${r.deaths}, врагов ${r.enemies}, частиц ${r.fx}`);
  }
}
await b.close();
console.log(errs ? `ОШИБОК: ${errs}` : 'ошибок JS нет');
