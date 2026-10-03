// Интерфейс поверх canvas: HUD, диалоги, сумка/герой/журнал, магазин, меню.
import { CLASSES, ITEMS, CFG, xpForLevel, AREAS, SHOPS } from './defs.js';
import { BRANCHES, TREE, rankOfNode, canLearn, freePoints, respecCost } from './skills.js';
import { ENDINGS, epilogue } from './endings.js';
import { QUESTS, NPCS, questStatus, objProgress, objNeed, activeQuests, QUEST_ORDER } from './quests.js';
import { calcStats, count, itemCompare, isUnlocked } from './state.js';
import { playerSet, itemIcon, coinIcon, weaponSprite } from './sprites_chars.js';
import { mk, rect, dot, disc, line, ellipse, outline, shade } from './px.js';
import { hash2, fbm } from './util.js';

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;
const TIER_CLS = ['t1', 't1', 't2', 't3', 't4', 't5'];
const ICO = {};
const icon = (id) => ICO[id] || (ICO[id] = itemIcon(ITEMS[id]));
const cloneTo = (src, dst, w, h) => {
  dst.width = w || src.width; dst.height = h || src.height;
  const x = dst.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, dst.width, dst.height);
  x.drawImage(src, Math.floor((dst.width - src.width) / 2), Math.floor((dst.height - src.height) / 2));
};
const fmtTime = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} ч ${m} мин` : `${m} мин`; };

// ---------------------------------------------------------------- иконки навыков (24x24)
function skillIconCanvas(id, cls) {
  const [c, x] = mk(24, 24);
  switch (id) {
    case 'attack': {
      const wp = ITEMS[CLASSES[cls].startWeapon];
      const w = weaponSprite(cls, 3).c;
      x.save(); x.translate(12, 12); x.rotate(0.6); x.drawImage(w, -w.width / 2, -w.height / 2); x.restore();
      break;
    }
    case 'whirl': for (let a = 0.3; a < 5.4; a += 0.35) { const r = 8; rect(x, Math.round(12 + Math.cos(a) * r), Math.round(12 + Math.sin(a) * r), 2, 2, a > 4.6 ? '#fff' : '#e8e8f4'); } rect(x, 18, 4, 4, 2, '#fff'); rect(x, 20, 4, 2, 5, '#fff'); disc(x, 12, 12, 2, '#ffd860'); break;
    case 'roar': disc(x, 12, 12, 8, '#d8782e'); disc(x, 12, 12, 6, '#f0a050'); rect(x, 8, 9, 3, 2, '#2a1a10'); rect(x, 14, 9, 3, 2, '#2a1a10'); rect(x, 9, 14, 7, 4, '#2a1a10'); rect(x, 10, 14, 5, 1, '#fff'); for (const [dx, dy] of [[-10, -2], [10, -2], [-9, 5], [9, 5]]) rect(x, 12 + dx - 1, 12 + dy, 3, 1, '#ffd860'); break;
    case 'fireball': disc(x, 14, 10, 6, '#ff7a20'); disc(x, 14, 10, 4, '#ffb838'); disc(x, 14, 10, 2, '#fff0a0'); for (let i = 0; i < 5; i++) rect(x, 3 + i * 2, 20 - i * 2, 3, 3 - (i > 2 ? 1 : 0), i % 2 ? '#ff9a30' : '#ffd860'); break;
    case 'nova': for (let a = 0; a < 6; a++) { const an = (a / 6) * TAU; line(x, 12, 12, Math.round(12 + Math.cos(an) * 9), Math.round(12 + Math.sin(an) * 9), '#a8e0ff'); } disc(x, 12, 12, 3, '#fff'); disc(x, 12, 12, 1, '#a8e0ff'); for (let a = 0; a < 6; a++) { const an = (a / 6) * TAU + 0.5; dot(x, Math.round(12 + Math.cos(an) * 6), Math.round(12 + Math.sin(an) * 6), '#6ab4e8'); } break;
    case 'knives': for (let i = -1; i <= 1; i++) { x.save(); x.translate(12, 20); x.rotate(i * 0.45); rect(x, -1, -16, 2, 11, '#e8ecf6'); rect(x, -1, -16, 1, 11, '#fff'); rect(x, -2, -5, 4, 1, '#8a6a30'); rect(x, -1, -4, 2, 3, '#3a2a1c'); x.restore(); } break;
    case 'shadow': ellipse(x, 12, 14, 7, 8, '#4a2a68'); ellipse(x, 12, 12, 5, 6, '#6a3a90'); rect(x, 8, 10, 3, 2, '#e8c8ff'); rect(x, 14, 10, 3, 2, '#e8c8ff'); for (let i = 0; i < 5; i++) rect(x, 5 + i * 3, 20, 2, 3, '#4a2a68'); break;
    case 'slam': rect(x, 4, 17, 16, 3, '#6a5a48'); rect(x, 6, 15, 12, 2, '#8a7a64'); for (const [dx, dy] of [[-8, -2], [8, -2], [-5, -6], [5, -6]]) rect(x, 12 + dx, 14 + dy, 2, 3, '#d8c8a0'); rect(x, 11, 3, 3, 10, '#e8ecf6'); rect(x, 9, 11, 7, 2, '#8a6a30'); rect(x, 11, 13, 3, 3, '#3a2a1c'); break;
    case 'chain': line(x, 3, 5, 10, 11, '#bfe4ff'); line(x, 10, 11, 8, 13, '#bfe4ff'); line(x, 8, 13, 16, 19, '#bfe4ff'); line(x, 4, 5, 11, 11, '#fff'); line(x, 9, 13, 17, 19, '#fff'); disc(x, 20, 19, 2, '#a8d8ff'); disc(x, 4, 5, 2, '#a8d8ff'); break;
    case 'dance': for (let i = 0; i < 4; i++) { x.save(); x.translate(4 + i * 5, 18 - i * 3); x.rotate(-0.8); rect(x, -1, -9, 2, 10, i === 3 ? '#fff' : '#b8bccc'); rect(x, -2, 1, 4, 1, '#8a6a30'); x.restore(); } dot(x, 20, 4, '#fff'); dot(x, 3, 20, '#9a8ab8'); break;
    case 'dodge': for (let i = 0; i < 3; i++) { rect(x, 4 + i * 2, 8 + i * 4, 12 - i * 2, 2, i === 0 ? '#fff' : '#9a8ab8'); } line(x, 14, 4, 20, 10, '#fff'); line(x, 14, 16, 20, 10, '#fff'); line(x, 15, 4, 21, 10, '#fff'); line(x, 15, 16, 21, 10, '#fff'); break;
    default: break;
  }
  return outline(c, '#1d1420');
}
const skillCache = {};
function skillIcon(id, cls) { const k = id + cls; return skillCache[k] || (skillCache[k] = skillIconCanvas(id, cls)); }

// ---------------------------------------------------------------- фон меню
class MenuBg {
  constructor(canvas) {
    this.c = canvas; canvas.width = 320; canvas.height = 180;
    this.x = canvas.getContext('2d');
    this.t = 0;
    this.embers = Array.from({ length: 50 }, () => this.newEmber(true));
    // статические силуэты гор
    const [m, mx] = mk(320, 180);
    for (let layer = 0; layer < 3; layer++) {
      const base = 120 + layer * 14, amp = 40 - layer * 9;
      mx.fillStyle = ['#241636', '#1a0f28', '#120a1c'][layer];
      for (let i = 0; i < 320; i++) { const h = Math.round(base - fbm(i * 0.018 + layer * 9, layer, 3) * amp); mx.fillRect(i, h, 1, 180 - h); }
    }
    // башня-маяк
    rect(mx, 232, 60, 22, 70, '#0e0814'); rect(mx, 228, 52, 30, 10, '#0e0814'); rect(mx, 238, 90, 10, 3, '#2a1a38');
    for (const [wx, wy] of [[240, 80], [240, 100]]) rect(mx, wx, wy, 4, 6, '#ffb040');
    this.mount = m;
  }
  newEmber(init) { return { x: Math.random() * 320, y: init ? Math.random() * 180 : 185, vy: -(6 + Math.random() * 14), vx: (Math.random() - 0.5) * 6, c: Math.random() < 0.7 ? '#ff9a3a' : '#ffd860', ph: Math.random() * 6 }; }
  draw(dt) {
    this.t += dt;
    const x = this.x;
    const g = x.createLinearGradient(0, 0, 0, 180);
    g.addColorStop(0, '#0e0818'); g.addColorStop(0.6, '#2a1440'); g.addColorStop(1, '#6a2a2a');
    x.fillStyle = g; x.fillRect(0, 0, 320, 180);
    for (let i = 0; i < 60; i++) { const a = 0.4 + 0.6 * Math.abs(Math.sin(this.t * 0.8 + i)); x.fillStyle = `rgba(255,240,220,${a * 0.6})`; x.fillRect(Math.floor(hash2(i, 1, 7) * 320), Math.floor(hash2(i, 2, 7) * 90), 1, 1); }
    x.drawImage(this.mount, 0, 0);
    // огонь маяка
    const f = Math.sin(this.t * 9) * 1.5;
    const glow = x.createRadialGradient(243, 54, 2, 243, 54, 44);
    glow.addColorStop(0, 'rgba(255,170,60,0.55)'); glow.addColorStop(1, 'rgba(255,120,40,0)');
    x.fillStyle = glow; x.fillRect(190, 10, 110, 90);
    rect(x, 236, 46 - f, 14, 8 + f, '#ff7a20'); rect(x, 239, 42 - f, 8, 8 + f, '#ffb838'); rect(x, 241, 40 - f, 4, 6, '#fff0a0');
    for (const e of this.embers) {
      e.y += e.vy * dt; e.x += (e.vx + Math.sin(this.t + e.ph) * 4) * dt;
      if (e.y < -4) Object.assign(e, this.newEmber(false));
      x.fillStyle = e.c; x.globalAlpha = Math.min(1, Math.max(0, e.y / 120)); x.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
    }
    x.globalAlpha = 1;
  }
}

function drawFlameLogo(cv, t) {
  const x = cv.getContext('2d'); x.clearRect(0, 0, 48, 56);
  const f = Math.sin(t * 8) * 2, g = Math.sin(t * 11 + 1) * 1.5;
  disc(x, 24, 36, 14 + f / 2, '#a8301a'); disc(x, 24, 34, 11 + f / 2, '#e8601c'); disc(x, 24, 32, 8, '#ffa030'); disc(x, 24, 30, 5, '#ffe070');
  for (let r = 0; r < 24; r++) { const half = Math.round((1 - r / 24) * 10); rect(x, 24 - half + Math.round(Math.sin(r * 0.4 + t * 6) * 2), 26 - r - Math.round(f), half * 2, 1, r < 8 ? '#ffe070' : r < 16 ? '#ffa030' : '#e8601c'); }
  rect(x, 21 + Math.round(g), 4, 6, 3, '#fff0a0');
  rect(x, 14, 48, 20, 4, '#3a2a38'); rect(x, 10, 52, 28, 4, '#241a2a');
}

// ---------------------------------------------------------------- UI
export class UI {
  constructor(g) {
    this.g = g;
    this.cache = {};
    this.plan = null; this.lineIdx = 0; this.typed = 0; this.fullText = ''; this.typing = false; this.endDone = false; this.typeAcc = 0;
    this.panelOpen = false; this.shopOpen = null; this.pauseOpen = false; this.deathOpen = false; this.endingOpen = false;
    this.tab = 'char'; this.sel = null; this.selQ = null; this.stab = 'buy';
    this.menuBg = new MenuBg($('bg-canvas'));
    this.coin = coinIcon();
    cloneTo(this.coin, $('gold-ico'), 10, 10); cloneTo(this.coin, $('shop-coin'), 10, 10);
    this.bind();
  }

  get blocking() { return !!(this.plan || this.panelOpen || this.shopOpen || this.pauseOpen || this.deathOpen || this.endingOpen); }

  bind() {
    $('dialog').addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; this.advance(); });
    $('b-inv').addEventListener('click', () => this.g.togglePanel('bag'));
    $('b-journal').addEventListener('click', () => this.g.togglePanel('quests'));
    $('b-pause').addEventListener('click', () => this.g.pause());
    $('tracker').addEventListener('click', () => this.g.togglePanel('quests'));
    $('panel-close').addEventListener('click', () => this.closePanel());
    $('panel').addEventListener('pointerdown', (e) => { if (e.target === $('panel')) this.closePanel(); });
    $('shop-close').addEventListener('click', () => this.closeShop());
    $('shop').addEventListener('pointerdown', (e) => { if (e.target === $('shop')) this.closeShop(); });
    for (const b of document.querySelectorAll('[data-tab]')) b.addEventListener('click', () => { this.tab = b.dataset.tab; this.renderPanel(); });
    for (const b of document.querySelectorAll('[data-stab]')) b.addEventListener('click', () => { this.stab = b.dataset.stab; this.renderShop(); });
    $('p-resume').addEventListener('click', () => this.g.pause(false));
    $('p-menu').addEventListener('click', () => this.g.quitToMenu());
    $('d-respawn').addEventListener('click', () => this.g.respawn());
    $('e-continue').addEventListener('click', () => { this.hideEnding(); });
    $('e-menu').addEventListener('click', () => { this.hideEnding(); this.g.quitToMenu(); });
  }

  // ------------------------------------------------------------- HUD
  refreshClass(state) {
    const cls = state.cls;
    const set = playerSet(cls, 1);
    const face = $('hud-face'); face.width = 26; face.height = 32;
    const x = face.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(set.d[0], 0, 0);
    const c = CLASSES[cls];
    const mapIcon = { 't-attack': 'attack', 't-skill0': c.skills[0].id, 't-skill1': c.skills[1].id, 't-skill2': c.skills[2].id, 't-dodge': 'dodge' };
    for (const [id, ic] of Object.entries(mapIcon)) { const cv = $(id).querySelector('canvas'); cloneTo(skillIcon(ic, cls), cv, 24, 24); }
    for (const id of ['t-hp', 't-mp']) {
      const cv = $(id).querySelector('canvas');
      cloneTo(itemIcon(ITEMS[id === 't-hp' ? 'p_hp1' : 'p_mp1']), cv, 18, 18);
    }
    $('t-skill0').title = c.skills[0].name; $('t-skill1').title = c.skills[1].name; $('t-skill2').title = c.skills[2].name; $('t-dodge').title = c.dodge.name;
    this.cache = {};
  }

  hud(w) {
    const s = w.s, st = w.stats, p = w.p;
    const C = this.cache;
    const set = (k, v, fn) => { if (C[k] !== v) { C[k] = v; fn(v); } };
    set('hp', `${Math.ceil(s.hp)}/${st.maxHp}`, (v) => { $('hp-txt').textContent = v; $('hp-fill').style.width = `${Math.max(0, s.hp / st.maxHp) * 100}%`; });
    set('mp', `${Math.floor(s.mp)}/${st.maxMp}`, (v) => { $('mp-txt').textContent = v; $('mp-fill').style.width = `${Math.max(0, s.mp / st.maxMp) * 100}%`; });
    set('xp', `${s.lvl}:${s.xp}`, () => {
      $('hud-lvl').textContent = s.lvl;
      $('xp-fill').style.width = s.lvl >= CFG.maxLevel ? '100%' : `${(s.xp / xpForLevel(s.lvl)) * 100}%`;
    });
    set('gold', s.gold, (v) => { $('gold-txt').textContent = v; });
    // навыки
    const cls = CLASSES[s.cls];
    for (let i = 0; i < 3; i++) {
      const el = $('t-skill' + i), sk = w.skillInfo(i).sk;
      const unlocked = isUnlocked(s, i);
      const inf = w.skillInfo(i);
      const cd = p.cdSkill[i], frac = cd > 0 ? Math.min(1, cd / inf.cd) : 0;
      set('sk' + i, `${unlocked}:${Math.round(frac * 40)}:${s.mp >= inf.mp}`, () => {
        el.classList.toggle('locked', !unlocked); el.dataset.lock = `ур. ${sk.unlock}`;
        el.classList.toggle('cd', frac > 0); el.classList.toggle('nomp', unlocked && s.mp < inf.mp);
        el.querySelector('em').style.height = `${frac * 100}%`;
      });
    }
    // Лик: кнопка видна, только если он надет
    const lk = s.equip.lik ? ITEMS[s.equip.lik] : null;
    const lfrac = p.cdLik > 0 ? Math.min(1, p.cdLik / CFG.likCd) : 0;
    set('lik', `${lk ? lk.id : ''}:${Math.round(lfrac * 40)}:${p.buffs.lik > 0}`, () => {
      const el = $('t-lik');
      el.classList.toggle('none', !lk); el.classList.toggle('cd', lfrac > 0); el.classList.toggle('ready', !!lk && lfrac === 0);
      el.querySelector('em').style.height = `${lfrac * 100}%`;
      if (lk) { cloneTo(icon(lk.id), el.querySelector('canvas'), 24, 24); el.title = lk.name; }
    });
    const dfrac = p.cdDodge > 0 ? Math.min(1, p.cdDodge / (CFG.dodgeCd + (w.stats.dodgeCd ? -w.stats.dodgeCd : 0))) : 0;
    set('dodge', Math.round(dfrac * 40), () => { $('t-dodge').querySelector('em').style.height = `${dfrac * 100}%`; $('t-dodge').classList.toggle('cd', dfrac > 0); });
    const hpN = count(s, 'p_hp1') + count(s, 'p_hp2') + count(s, 'p_hp3'), mpN = count(s, 'p_mp1') + count(s, 'p_mp2') + count(s, 'p_mp3');
    const fp = freePoints(s);
    set('sp', fp, () => { const b = $('sp-badge'); b.textContent = fp; b.classList.toggle('on', fp > 0); });
    set('pot', `${hpN}:${mpN}`, () => {
      $('t-hp').querySelector('b').textContent = hpN; $('t-mp').querySelector('b').textContent = mpN;
      $('t-hp').classList.toggle('empty', !hpN); $('t-mp').classList.toggle('empty', !mpN);
    });
    // подсказка взаимодействия
    const pr = w.prompt;
    const key = pr ? pr.label + (pr.ref && pr.ref.id ? pr.ref.id : '') : '';
    set('prompt', key, () => {
      const el = $('prompt');
      if (pr) { el.innerHTML = `<kbd>E</kbd>${pr.label}`; el.classList.add('on'); } else el.classList.remove('on');
      const ia = $('t-interact'); ia.classList.toggle('on', !!pr);
    });
    // босс
    if (w.bossE && w.bossE.alive) $('boss-fill').style.width = `${Math.max(0, w.bossE.hp / w.bossE.maxHp) * 100}%`;
  }

  tracker(s) {
    const el = $('tracker');
    const act = activeQuests(s);
    if (!act.length) { el.classList.remove('on'); el.innerHTML = ''; return; }
    const main = act.filter((id) => QUESTS[id].main), side = act.filter((id) => !QUESTS[id].main);
    const pick = [...main.slice(0, 1), ...side.slice(0, 1)];
    el.innerHTML = pick.map((id) => {
      const q = QUESTS[id];
      const objs = q.obj.map((o) => {
        const v = objProgress(s, id, o), n = objNeed(o);
        const ok = v >= n;
        return `<div class="q-obj${ok ? ' ok' : ''}">${ok ? '✓' : '•'} ${o.text}${n > 1 ? ` ${v}/${n}` : ''}</div>`;
      }).join('');
      const ready = questStatus(s, id) === 'ready';
      return `<div><div class="q-title">${q.title}</div>${q.main ? '<div class="q-main">Основное задание</div>' : ''}${objs}${ready ? `<div class="q-obj ok">→ Вернуться к ${NPCS[q.turnIn].name.split(' ').pop()}</div>` : ''}</div>`;
    }).join('<div style="height:.4em"></div>');
    el.classList.add('on');
  }

  toast(text, kind = 'info') {
    const box = $('toasts');
    const d = document.createElement('div');
    d.className = `toast ${kind}`; d.textContent = text;
    box.appendChild(d);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(() => d.remove(), 3300);
  }

  banner(b1, b2, boss = false) {
    const el = $('banner');
    el.className = boss ? 'boss' : '';
    el.innerHTML = `<div class="b1">${b1}</div>${b2 ? `<div class="b2">${b2}</div>` : ''}`;
    requestAnimationFrame(() => el.classList.add('on'));
    clearTimeout(this.bt);
    this.bt = setTimeout(() => el.classList.remove('on'), boss ? 3200 : 2600);
  }

  bossBar(e) {
    const el = $('bossbar');
    if (e) { $('boss-name').textContent = e.def.title || e.def.name; el.classList.add('on'); $('boss-fill').style.width = '100%'; } else el.classList.remove('on');
  }

  questPop(id, r) {
    const q = QUESTS[id];
    const box = $('questpop');
    const d = document.createElement('div');
    d.className = 'qp';
    const items = r.items.map(([iid, n]) => `<span class="ri" data-i="${iid}"><canvas width="18" height="18"></canvas> ${ITEMS[iid].name}${n > 1 ? ' ×' + n : ''}</span>`).join('');
    d.innerHTML = `<h4>Задание выполнено</h4><div class="qn">${q.title}</div><div class="rw">${r.xp ? `<span>+${r.xp} опыта</span>` : ''}${r.gold ? `<span>+${r.gold} зол.</span>` : ''}${r.sp ? `<span>+${r.sp} оч. навыков</span>` : ''}${items}</div>`;
    for (const sp of d.querySelectorAll('.ri')) cloneTo(icon(sp.dataset.i), sp.querySelector('canvas'), 18, 18);
    box.innerHTML = ''; box.appendChild(d);
    setTimeout(() => d.remove(), 4900);
  }

  // ------------------------------------------------------------- диалог
  openDialogue(plan) {
    this.closePanelsForDialog();
    this.plan = plan; this.lineIdx = 0; this.endDone = false;
    $('dlg-name').textContent = plan.name || '';
    $('dlg-name').style.display = plan.name ? '' : 'none';
    $('dlg-choices').innerHTML = '';
    $('dialog').classList.add('on');
    this.showLine();
  }
  closePanelsForDialog() { if (this.panelOpen) { this.panelOpen = false; $('panel').classList.remove('on'); } if (this.shopOpen) this.closeShop(true); }
  showLine() {
    const plan = this.plan;
    this.fullText = plan.lines[this.lineIdx] || '';
    this.typed = 0; this.typing = true; this.typeAcc = 0;
    $('dlg-text').textContent = '';
    $('dlg-next').style.display = 'block';
    $('dlg-choices').innerHTML = '';
  }
  tick(dt) {
    if (!this.plan || !this.typing) return;
    this.typeAcc += dt * 55;
    while (this.typeAcc >= 1 && this.typed < this.fullText.length) {
      this.typed++; this.typeAcc -= 1;
      if (this.typed % 3 === 0) this.g.sound.sfx('talk');
    }
    $('dlg-text').textContent = this.fullText.slice(0, this.typed);
    if (this.typed >= this.fullText.length) { this.typing = false; this.afterLine(); }
  }
  afterLine() {
    const plan = this.plan;
    if (this.lineIdx >= plan.lines.length - 1) {
      $('dlg-next').style.display = 'none';
      const box = $('dlg-choices'); box.innerHTML = '';
      const choices = plan.choices && plan.choices.length ? plan.choices : [{ label: 'Закрыть' }];
      choices.forEach((ch, i) => {
        const b = document.createElement('button');
        b.className = 'btn small' + (i === 0 ? ' primary' : ''); b.textContent = ch.label;
        b.addEventListener('click', () => this.choose(ch));
        box.appendChild(b);
      });
    }
  }
  advance() {
    if (!this.plan) return false;
    if (this.typing) { this.typed = this.fullText.length; $('dlg-text').textContent = this.fullText; this.typing = false; this.afterLine(); return true; }
    if (this.lineIdx < this.plan.lines.length - 1) { this.lineIdx++; this.showLine(); return true; }
    // последняя строка: Enter/Пробел выбирает первый вариант
    const first = (this.plan.choices && this.plan.choices[0]) || { label: 'Закрыть' };
    this.choose(first);
    return true;
  }
  // выбор реплики: мир применяет эффекты и отдаёт следующий узел (или null — разговор окончен)
  choose(ch) {
    if (!this.plan) return;
    const next = ch.go !== undefined || (ch.fx && ch.fx.length) ? this.g.world.choose({ fx: [], ...ch }) : null;
    if (next) { this.plan = null; this.openDialogue(next); this.g.afterChoice(); } else this.closeDialog();
  }
  closeDialog() {
    const plan = this.plan;
    if (!plan) return;
    this.plan = null;
    $('dialog').classList.remove('on');
    this.g.afterUi();
  }

  // ------------------------------------------------------------- панель
  openPanel(tab) {
    if (this.plan) return;
    this.tab = tab || this.tab; this.panelOpen = true;
    $('panel').classList.add('on'); this.renderPanel();
  }
  closePanel() { this.panelOpen = false; $('panel').classList.remove('on'); this.g.afterUi(); }

  itemStatRows(it) {
    const rows = [];
    const add = (l, v, pct) => { if (v) rows.push([l, `${v > 0 ? '+' : ''}${pct ? Math.round(v * 100) + '%' : v}`, v < 0]); };
    add('Урон', it.atk); add('Защита', it.def); add('Здоровье', it.hp); add('Мана', it.mp); add('Крит', it.crit, true); add('Скорость', it.spd, true);
    if (it.heal) rows.push(['Лечит', it.heal, false]);
    if (it.mana) rows.push(['Мана', `+${it.mana}`, false]);
    return rows;
  }
  tierCls(it) { return it.type === 'quest' ? 'tq' : TIER_CLS[it.tier || 1]; }
  typeLabel(it) {
    const base = { weapon: 'Оружие', armor: 'Броня', charm: 'Амулет', lik: 'Лик', potion: 'Зелье', quest: 'Особый предмет' }[it.type];
    return it.cls ? `${base} · ${CLASSES[it.cls].name}` : base;
  }

  renderPanel() {
    for (const b of document.querySelectorAll('[data-tab]')) b.classList.toggle('on', b.dataset.tab === this.tab);
    const body = $('tab-body');
    if (this.tab === 'char') this.renderChar(body); else if (this.tab === 'skills') this.renderSkills(body); else if (this.tab === 'bag') this.renderBag(body); else this.renderQuests(body);
  }

  renderChar(body) {
    const w = this.g.world, s = w.s, st = w.stats, c = CLASSES[s.cls];
    const armor = s.equip.armor && ITEMS[s.equip.armor];
    body.innerHTML = `<div class="hero">
      <div><div class="hero-face"><canvas id="hf" width="26" height="32"></canvas><div class="nm">${c.name}</div><div>Уровень ${s.lvl}</div>
        <div style="width:100%"><div class="bar xp" style="height:10px"><i style="width:${s.lvl >= CFG.maxLevel ? 100 : (s.xp / xpForLevel(s.lvl)) * 100}%"></i></div></div>
        <div style="font:700 12px var(--ui)">${s.lvl >= CFG.maxLevel ? 'Максимальный уровень' : `Опыт ${s.xp} / ${xpForLevel(s.lvl)}`}</div></div>
        <h3 style="margin-top:1em">Характеристики</h3>
        <div class="stat-list"><span>Здоровье</span><b>${st.maxHp}</b><span>Мана</span><b>${st.maxMp}</b><span>Урон</span><b>${st.atk}</b><span>Защита</span><b>${st.def}</b><span>Крит. шанс</span><b>${Math.round(st.crit * 100)}%</b><span>Скорость</span><b>${Math.round(st.spd * 100)}%</b>${st.lifesteal ? `<span>Вампиризм</span><b>${(st.lifesteal * 100).toFixed(1)}%</b>` : ''}${st.drPct ? `<span>Снижение урона</span><b>${Math.round(st.drPct * 100)}%</b>` : ''}<span>Убито врагов</span><b>${s.kills}</b><span>Золото</span><b>${s.gold}</b></div></div>
      <div><h3>Снаряжение</h3><div class="slots" id="slots"></div><div class="empty-note" style="padding:.6em;font-size:.85em">Нажми на предмет, чтобы снять</div></div>
      <div><h3>Умения</h3><div id="skills"></div></div></div>`;
    const hf = $('hf');
    hf.getContext('2d').drawImage(playerSet(s.cls, armor ? armor.tier : 1).d[0], 0, 0);
    const slots = $('slots');
    for (const [slot, name] of [['weapon', 'Оружие'], ['armor', 'Броня'], ['charm', 'Амулет'], ['lik', 'Лик']]) {
      const id = s.equip[slot];
      const b = document.createElement('button');
      b.className = 'slot' + (id ? '' : ' empty');
      if (id) {
        const it = ITEMS[id];
        b.innerHTML = `<canvas width="18" height="18"></canvas><span><span class="${this.tierCls(it)}">${it.name}</span><small>${this.itemStatRows(it).map((r) => `${r[0]} ${r[1]}`).join(' · ')}</small></span>`;
        cloneTo(icon(id), b.querySelector('canvas'), 18, 18);
        b.addEventListener('click', () => { w.unequipSlot(slot); this.renderPanel(); });
      } else b.innerHTML = `<span>${name}<small>пусто</small></span>`;
      slots.appendChild(b);
    }
    const sk = $('skills');
    const rows = [['attack', c.attack.name, 'Основная атака. Бей по врагам, чтобы копить опыт.', 1], ...c.skills.map((k, i) => { const inf = w.skillInfo(i); return [k.id, k.name, `${k.desc} (${inf.mp} маны, ${inf.cd.toFixed(1)} с)`, k.unlock]; }), ['dodge', c.dodge.name, 'Короткий рывок с неуязвимостью.', 1]];
    for (const [id, name, desc, unlock] of rows) {
      const d = document.createElement('div');
      d.className = 'skill-row' + (s.lvl < unlock ? ' locked' : '');
      d.innerHTML = `<canvas width="24" height="24"></canvas><div><b>${name}${s.lvl < unlock ? ` · с ${unlock} ур.` : ''}</b>${desc}</div>`;
      cloneTo(skillIcon(id, s.cls), d.querySelector('canvas'), 24, 24);
      sk.appendChild(d);
    }
  }

  renderSkills(body) {
    const w = this.g.world, s = w.s;
    const free = freePoints(s);
    body.innerHTML = `<div class="sk-head"><span class="pts">Очков: ${free}</span><span style="font:600 .85em var(--ui)">Очко даётся за каждый уровень и за важные задания</span><button class="btn small" id="respec">Сбросить (${respecCost(s)} зол.)</button></div><div class="skt" id="skt"></div>`;
    $('respec').addEventListener('click', () => { w.respecSkills(); this.renderPanel(); });
    const box = $('skt');
    BRANCHES[s.cls].forEach((bn, bi) => {
      const col = document.createElement('div');
      col.innerHTML = `<h4>${bn}</h4>`;
      for (const n of TREE[s.cls].filter((x) => x.branch === bi)) {
        const r = rankOfNode(s, n.id), can = canLearn(s, n.id);
        const b = document.createElement('button');
        b.className = 'node' + (can.ok ? ' can' : '') + (r >= n.max ? ' maxed' : '') + (!can.ok && r < n.max ? ' lock' : '');
        b.innerHTML = `<b>${r}/${n.max}</b>${n.name}<small>${n.text}${!can.ok && r < n.max ? ` · ${can.why}` : ''}</small>`;
        b.addEventListener('click', () => { if (w.learnNode(n.id)) this.renderPanel(); });
        col.appendChild(b);
      }
      box.appendChild(col);
    });
  }

  renderBag(body) {
    const w = this.g.world, s = w.s;
    const order = { weapon: 0, armor: 1, charm: 2, lik: 3, potion: 4, quest: 5 };
    const ids = Object.keys(s.inv).filter((id) => ITEMS[id]).sort((a, b) => order[ITEMS[a].type] - order[ITEMS[b].type] || (ITEMS[a].tier || 0) - (ITEMS[b].tier || 0));
    if (!this.sel || !s.inv[this.sel]) this.sel = ids[0] || null;
    body.innerHTML = `<div class="bag"><div class="grid" id="grid"></div><div class="detail" id="detail"></div></div>`;
    const grid = $('grid');
    if (!ids.length) grid.innerHTML = '<div class="empty-note" style="grid-column:1/-1">Сумка пуста</div>';
    for (const id of ids) {
      const it = ITEMS[id];
      const b = document.createElement('button');
      const wrongCls = it.cls && it.cls !== s.cls;
      b.className = 'cell' + (id === this.sel ? ' sel' : '') + (!wrongCls && itemCompare(s, id) > 0 ? ' up' : '') + (wrongCls ? ' bad' : '');
      b.innerHTML = `<canvas width="18" height="18"></canvas>${s.inv[id] > 1 ? `<b>${s.inv[id]}</b>` : ''}`;
      cloneTo(icon(id), b.querySelector('canvas'), 18, 18);
      b.addEventListener('click', () => { this.sel = id; this.renderBag(body); });
      grid.appendChild(b);
    }
    this.renderDetail($('detail'), this.sel, { bag: true });
  }

  renderDetail(box, id, o = {}) {
    const w = this.g.world, s = w.s;
    if (!id) { box.innerHTML = '<div class="empty-note">Выбери предмет</div>'; return; }
    const it = ITEMS[id];
    const rows = this.itemStatRows(it);
    const wrong = it.cls && it.cls !== s.cls;
    box.innerHTML = `<div class="it-name ${this.tierCls(it)}">${it.name}</div><div class="it-type">${this.typeLabel(it)}${count(s, id) > 1 ? ` · ×${count(s, id)}` : ''}</div>
      <div class="it-stats">${rows.map((r) => `<span>${r[0]}</span><b class="${r[2] ? 'neg' : ''}">${r[1]}</b>`).join('')}</div>
      <div class="it-desc">${it.desc || ''}</div><div class="it-btns"></div>`;
    const btns = box.querySelector('.it-btns');
    const addBtn = (label, fn, primary) => { const b = document.createElement('button'); b.className = 'btn small' + (primary ? ' primary' : ''); b.textContent = label; b.addEventListener('click', fn); btns.appendChild(b); };
    if (it.type === 'potion') addBtn('Использовать', () => { w.useItem(id); this.renderPanel(); }, true);
    if (['weapon', 'armor', 'charm', 'lik'].includes(it.type)) {
      if (wrong) btns.insertAdjacentHTML('beforeend', `<span class="it-type">Только для класса: ${CLASSES[it.cls].name}</span>`);
      else addBtn('Надеть', () => { w.equipItem(id); this.renderPanel(); }, true);
    }
  }

  renderQuests(body) {
    const s = this.g.world.s;
    const groups = [['Активные', (id) => ['active', 'ready'].includes(questStatus(s, id))], ['Выполнены', (id) => questStatus(s, id) === 'done']];
    let html = '';
    const flat = [];
    for (const [title, pred] of groups) {
      const ids = QUEST_ORDER.filter(pred);
      if (!ids.length) continue;
      html += `<h3 style="font:400 11px var(--px);color:var(--ember-d);margin:.6em 0 .4em">${title}</h3>`;
      for (const id of ids) { flat.push(id); }
    }
    if (!flat.length) { body.innerHTML = '<div class="empty-note">Пока нет заданий. Поговори с жителями Тихого Брода: над некоторыми из них светится «!».</div>'; return; }
    if (!this.selQ || !flat.includes(this.selQ)) this.selQ = flat[0];
    body.innerHTML = `<div class="qlist"><div id="ql"></div><div class="qdet" id="qd"></div></div>`;
    const ql = $('ql');
    let lastTitle = null;
    for (const [title, pred] of groups) {
      const ids = QUEST_ORDER.filter(pred);
      if (!ids.length) continue;
      ql.insertAdjacentHTML('beforeend', `<h3 style="font:400 11px var(--px);color:var(--ember-d);margin:.6em 0 .4em">${title}</h3>`);
      for (const id of ids) {
        const q = QUESTS[id], st = questStatus(s, id);
        const b = document.createElement('button');
        b.className = 'qrow' + (id === this.selQ ? ' sel' : '') + (st === 'done' ? ' done' : '') + (q.main ? ' main' : '');
        b.innerHTML = `${q.title}<small>${q.main ? 'Основное' : 'Побочное'}${st === 'ready' ? ' · готово к сдаче' : st === 'done' ? ' · выполнено' : ''}</small>`;
        b.addEventListener('click', () => { this.selQ = id; this.renderQuests(body); });
        ql.appendChild(b);
      }
    }
    const q = QUESTS[this.selQ], st = questStatus(s, this.selQ);
    const done = st === 'done';
    const objs = q.obj.map((o) => { const v = objProgress(s, this.selQ, o), n = objNeed(o); const ok = done || v >= n; return `<div class="obj${ok ? ' ok' : ''}"><span>${ok ? '✓' : '○'}</span><span>${o.text}${n > 1 ? ` — ${done ? n : v}/${n}` : ''}</span></div>`; }).join('');
    const rw = q.reward;
    const rwt = [rw.xp ? `${rw.xp} опыта` : '', rw.gold ? `${rw.gold} золота` : '', ...(rw.items || []).map(([i, n]) => (i[0] === '@' ? (i.includes('weapon') ? 'оружие' : 'броня') + ' для вашего класса' : ITEMS[i].name + (n > 1 ? ' ×' + n : '')))].filter(Boolean).join(', ');
    $('qd').innerHTML = `<h3>${q.title}</h3><div>${q.desc}</div><div style="margin-top:.7em">${objs}</div>${rwt ? `<div class="rew">Награда: ${rwt}</div>` : ''}${st === 'ready' ? `<div class="rew" style="color:#2a8a4a">Вернись к: ${NPCS[q.turnIn].name}</div>` : ''}${st === 'active' ? `<div style="margin-top:.7em;opacity:.8">${q.hint[0] || ''}</div>` : ''}`;
  }

  // ------------------------------------------------------------- магазин
  openShop(id) {
    this.shopOpen = id; this.stab = 'buy'; this.sel = null;
    $('shop').classList.add('on');
    this.renderShop();
  }
  closeShop(silent) { this.shopOpen = null; $('shop').classList.remove('on'); if (!silent) this.g.afterUi(); }
  renderShop() {
    const w = this.g.world, s = w.s;
    if (!this.shopOpen) return;
    $('shop-title').textContent = (SHOPS[this.shopOpen] && SHOPS[this.shopOpen].name) || 'Магазин';
    $('shop-gold').textContent = s.gold;
    for (const b of document.querySelectorAll('[data-stab]')) b.classList.toggle('on', b.dataset.stab === this.stab);
    const body = $('shop-body'); body.innerHTML = '';
    const mk2 = (id, price, label, fn, afford) => {
      const it = ITEMS[id];
      const row = document.createElement('div');
      row.className = 'shop-row' + (afford ? '' : ' cant');
      const cmp = ['weapon', 'armor', 'charm'].includes(it.type) ? itemCompare(s, id) : 0;
      row.innerHTML = `<canvas width="18" height="18"></canvas><span class="nm"><span class="${this.tierCls(it)}">${it.name}</span>${cmp > 0 ? '<span class="up">▲</span>' : cmp < 0 ? '<span class="down">▼</span>' : ''}<small>${this.itemStatRows(it).map((r) => `${r[0]} ${r[1]}`).join(' · ') || it.desc}</small></span><span class="pr">${price} зол.</span>`;
      cloneTo(icon(id), row.querySelector('canvas'), 18, 18);
      const b = document.createElement('button'); b.className = 'btn small' + (afford ? ' primary' : ''); b.textContent = label; b.addEventListener('click', fn);
      row.appendChild(b); body.appendChild(row);
    };
    if (this.stab === 'buy') {
      for (const id of w.shopStock(this.shopOpen)) mk2(id, w.buyPrice(id), 'Купить', () => { w.buy(id); this.renderShop(); }, s.gold >= w.buyPrice(id));
    } else {
      const ids = Object.keys(s.inv).filter((id) => w.sellPrice(id) > 0);
      if (!ids.length) body.innerHTML = '<div class="empty-note">Нечего продавать</div>';
      for (const id of ids) mk2(id, w.sellPrice(id), `Продать${s.inv[id] > 1 ? ` (×${s.inv[id]})` : ''}`, () => { w.sell(id); this.renderShop(); }, true);
    }
  }

  // ------------------------------------------------------------- пауза, смерть, финал
  showPause(on) { this.pauseOpen = on; $('pause').classList.toggle('on', on); }
  syncSettings(set) { $('p-music').value = Math.round(set.music * 100); $('p-sfx').value = Math.round(set.sfx * 100); }
  showDeath(on) { this.deathOpen = on; $('death').classList.toggle('on', on); }
  showEnding(s, id) {
    const e = ENDINGS[id] || ENDINGS.close;
    this.endingOpen = true; $('ending').classList.add('on');
    $('ending-title').textContent = e.title;
    $('ending-text').innerHTML = e.text.map((l) => `<p>${l}</p>`).join('') + epilogue(s).map((l) => `<p class="epi">${l}</p>`).join('');
    $('ending-stats').innerHTML = [['Класс', CLASSES[s.cls].name], ['Уровень', s.lvl], ['Врагов побеждено', s.kills], ['Поражений', s.deaths], ['Время', fmtTime(s.playtime)]].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  }
  hideEnding() { this.endingOpen = false; $('ending').classList.remove('on'); }
  closeAll() {
    this.plan = null; this.panelOpen = false; this.shopOpen = null; this.pauseOpen = false; this.deathOpen = false; this.endingOpen = false;
    for (const id of ['dialog', 'panel', 'shop', 'pause', 'death', 'ending']) $(id).classList.remove('on');
    $('bossbar').classList.remove('on'); $('toasts').innerHTML = ''; $('questpop').innerHTML = '';
  }

  // ------------------------------------------------------------- меню и выбор класса
  menuInfo(save) {
    const el = $('menu-save');
    $('m-continue').disabled = !save;
    el.textContent = save ? `${CLASSES[save.cls].name}, уровень ${save.lvl} · ${AREAS[save.area].name} · ${fmtTime(save.playtime)}` : 'Сохранений пока нет';
  }
  buildClassCards(onPick) {
    const row = $('class-row'); row.innerHTML = '';
    this.classCanvases = [];
    for (const c of Object.values(CLASSES)) {
      const b = document.createElement('button');
      b.className = 'class-card'; b.dataset.cls = c.id;
      b.innerHTML = `<canvas width="26" height="32"></canvas><div class="class-name">${c.name}</div><div class="class-desc">${c.blurb}</div><div class="class-hint">${c.hint}</div><div class="class-skills"><b>${c.skills[0].name}</b> — ${c.skills[0].desc}<br><b>${c.skills[1].name}</b> (ур. 5) — ${c.skills[1].desc}<br><b>${c.skills[2].name}</b> (ур. 10) — ${c.skills[2].desc}</div>`;
      b.addEventListener('click', () => onPick(c.id));
      row.appendChild(b);
      this.classCanvases.push([c.id, b.querySelector('canvas')]);
    }
  }
  animateMenu(dt, screen) {
    this.mt = (this.mt || 0) + dt;
    this.menuBg.draw(dt);
    if (screen === 'logo') drawFlameLogo($('logo-flame'), this.mt);
    if (screen === 'class' && this.classCanvases) {
      for (const [cls, cv] of this.classCanvases) {
        const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 26, 32);
        const set = playerSet(cls, 3);
        x.drawImage(set.d[Math.floor(this.mt * 2.5) % 2 ? 1 : 0], 0, 0);
        const wp = weaponSprite(cls, 3);
        x.save(); x.translate(21, 22); x.rotate(0.3); x.drawImage(wp.c, -wp.hx, -wp.hy); x.restore();
      }
    }
  }
}
