// Скриншот страницы: node tools/shot.mjs <url> <out.png> [width height] [js-wait-expression]
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [url, out, w = 1400, h = 1000, waitExpr = 'window.done'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.PW_EXE || undefined, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on('console', (m) => console.log('console:', m.text()));
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto(url);
await p.waitForFunction(waitExpr, null, { timeout: 15000 }).catch((e) => console.log('wait failed', e.message));
await p.waitForTimeout(300);
await p.screenshot({ path: out });
await b.close();
