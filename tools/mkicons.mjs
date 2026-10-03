import { createRequire } from 'module';
import { execSync } from 'child_process';
import fs from 'fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage();
await p.goto('http://localhost:8123/tools/icons.html');
await p.waitForFunction('window.done');
const icons = await p.evaluate(() => window.icons);
for (const [n, f] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) fs.writeFileSync('icons/' + f, Buffer.from(icons[n].split(',')[1], 'base64'));
await b.close();
