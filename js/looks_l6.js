// Внешность NPC и человекоподобных врагов этой локации (формат как в sprites_chars.js: NPC_LOOKS / ENEMY_HUMAN).
export const NPC_LOOKS = {};
export const ENEMY_HUMAN = {};

// оттенки цвета для кресел богов
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const tone = (h, f) => '#' + hx(h).map((v) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))).toString(16).padStart(2, '0')).join('');

// «тень на кресле»: каменная фигура в цвете бога, глаза светятся
const SEAT = { lyara: '#f4a8c0', torn: '#7ab0f0', ori: '#c8b0ff', seyr: '#f0d060', mara: '#7ad08a', kharn: '#f06048', issa: '#b070e0' };
for (const [id, col] of Object.entries(SEAT)) {
  NPC_LOOKS['seat_' + id] = {
    skin: '#8c8a9c', hairC: '#6a6878', hair: 'long', robe: true, top: [tone(col, -0.35), tone(col, -0.55), tone(col, -0.1)], pants: [tone(col, -0.55), tone(col, -0.7)],
    boots: '#2a2834', hat: 'hood', hatCol: tone(col, -0.45), glowEyes: col, belt: tone(col, -0.2), trim: col,
  };
}

Object.assign(NPC_LOOKS, {
  // посланница: серый дорожный плащ, ничего, что выдавало бы, от кого она
  envoy: { skin: '#e8c0a0', hairC: '#4a3a2e', hair: 'short', top: ['#6a6a72', '#4e4e58', '#8a8a96'], pants: ['#3a3a44', '#2a2a34'], boots: '#2a2630', hat: 'hood', hatCol: '#56565f', cape: '#56565f', belt: '#5a4a3a', blush: '#d09880' },
  // эхо-привратник: тот, кто ещё стоит на посту
  echoKeeper: { skin: '#8a8a9a', hairC: '#c8c8d8', hair: 'bald', beard: '#b8b8c8', top: ['#6a6a7a', '#4e4e5c', '#8a8a9c'], pants: ['#3a3a48', '#2a2a36'], boots: '#22222c', hat: 'helm', hatCol: '#8a8a9c', pads: true, padCol: '#8a8a9c', glowEyes: '#a8c8ff', hold: 'spear', belt: '#3a3a48', tabard: '#4a3a6a', plume: '#6a5a9a' },
  // писарь склепа: пальцы в чернилах, глаза слабо светятся
  crypt_scribe: { skin: '#cfc2b0', hairC: '#e4e0e8', hair: 'bald', beard: '#d8d4dc', top: ['#6a5a48', '#4a3e30', '#8a7860'], pants: ['#3e3428', '#2c241c'], boots: '#2a2018', robe: true, glowEyes: '#d8e8ff', belt: '#8a6a30', hold: 'cane' },
});
