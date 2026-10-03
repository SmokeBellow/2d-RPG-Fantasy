// Внешность NPC и человекоподобных врагов Локации 3 (Долина Былых Сражений).
// Формат как в sprites_chars.js: NPC_LOOKS / ENEMY_HUMAN.

// видение у алтаря бога: бледная фигура в цвете бога, светящиеся глаза
const vision = (col, dark, light, extra = {}) => ({
  skin: '#e8e4ee', hairC: light, hair: 'long', top: [col, dark, light], pants: [dark, dark], boots: dark, robe: true, hat: null,
  glowEyes: light, belt: light, trim: light, ...extra,
});

export const NPC_LOOKS = {
  // Аббатство Безмолвных
  monk: { skin: '#e0b890', hairC: '#6a5a4a', hair: 'bald', top: ['#7a6a58', '#5a4c3e', '#9a8a74'], pants: ['#5a4c3e', '#42362a'], boots: '#3a2a1c', robe: true, hat: null, belt: '#c8b890', mustache: null, blush: '#e89a88' },
  monkOld: { skin: '#e4c4a4', hairC: '#e8e4e0', hair: 'bald', beard: '#e8e4e0', top: ['#8a8a92', '#686872', '#aaaab4'], pants: ['#686872', '#4e4e58'], boots: '#3a2a1c', robe: true, hat: null, belt: '#c8b890', hold: 'cane', trim: '#c8b890' },
  monkF: { skin: '#f0cca8', hairC: '#3a2a22', hair: 'long', top: ['#6a7a6a', '#4c5c4e', '#8a9c8a'], pants: ['#4c5c4e', '#364438'], boots: '#3a2a1c', robe: true, hat: 'scarf', hatCol: '#c8c4b0', belt: '#a89868', blush: '#e89a88' },
  monkYoung: { skin: '#f0cca8', hairC: '#7a5a3a', hair: 'spiky', top: ['#8a7a68', '#6a5c4c', '#aa9a86'], pants: ['#6a5c4c', '#4e4236'], boots: '#3a2a1c', robe: true, hat: null, belt: '#c8b890', blush: '#e89a88' },
  // призраки и Эхо, которые ещё помнят
  ghost: { skin: '#c8d4e4', hairC: '#9aa8c0', hair: 'long', top: ['#8a9ac0', '#68789c', '#aabadc'], pants: ['#68789c', '#4e5c7c'], boots: '#4e5c7c', robe: true, hat: null, glowEyes: '#e8f4ff', belt: null },
  ghostSoldier: { skin: '#b8c4d8', hairC: '#8a98b0', hair: 'bald', top: ['#7a88a8', '#5a6888', '#9aaac8'], pants: ['#4a5878', '#38445e'], boots: '#38445e', hat: 'helm', hatCol: '#8a98b8', pads: true, padCol: '#9aaac8', glowEyes: '#e8f4ff', hold: 'sword', tabard: '#5a6a98', belt: '#4a5878' },
  ghostScribe: { skin: '#c8d4e4', hairC: '#aab8d0', hair: 'bald', beard: '#aab8d0', top: ['#8a96b4', '#68748f', '#aab6d0'], pants: ['#68748f', '#4e586f'], boots: '#4e586f', robe: true, hat: null, glowEyes: '#e8f4ff', hold: 'cane', trim: '#e8f4ff' },
  ghostWoman: { skin: '#c8d4e4', hairC: '#b8c4dc', hair: 'long', braid: true, top: ['#9aa6c4', '#78849e', '#bac6e0'], pants: ['#78849e', '#5a6680'], boots: '#5a6680', robe: true, hat: null, glowEyes: '#e8f4ff', belt: '#e8f4ff' },
  // Коллегия: учёные
  scholar: { skin: '#e8c8a8', hairC: '#c8c0d0', hair: 'long', top: ['#4a5a9a', '#34407a', '#6a7ac0'], pants: ['#34407a', '#262e60'], boots: '#2a2030', robe: true, hat: null, belt: '#e8c050', trim: '#e8d060', blush: '#e8a898' },
  scholarM: { skin: '#e0b890', hairC: '#4a3a2a', hair: 'short', beard: '#4a3a2a', top: ['#4a5a8a', '#34406a', '#6a7ab0'], pants: ['#34406a', '#262e52'], boots: '#2a2030', robe: true, hat: null, belt: '#e8c050', hold: 'cane', trim: '#e8d060' },
  assistant: { skin: '#f0d0b0', hairC: '#c88a3a', hair: 'spiky', top: ['#6a7aa8', '#4e5c88', '#8a9ac8'], pants: ['#4a4a60', '#363648'], boots: '#3a2a1c', hat: null, belt: '#8a6a3a', sleeve: '#e8e0d0', blush: '#e89a88' },
  // Совет
  officer: { skin: '#e0b088', hairC: '#3a3a40', hair: 'short', top: ['#7a8aa8', '#566486', '#a0b0cc'], pants: ['#4a5470', '#363e56'], boots: '#2a2230', hat: 'helm', hatCol: '#aab4c8', plume: '#2a4a98', pads: true, padCol: '#c8d2e4', belt: '#5a3a22', tabard: '#2a4a98', cape: '#2a3a68', hold: 'sword', mustache: '#3a3a40', scar: '#c07058' },
  clerk: { skin: '#f0d0b0', hairC: '#7a7a82', hair: 'bald', top: ['#7a7a88', '#5c5c6a', '#9a9aaa'], pants: ['#4a4a58', '#363644'], boots: '#2a2230', hat: null, belt: '#5a3a22', sleeve: '#e8e0d0', mustache: '#7a7a82' },
  councilGuard: { skin: '#e0b890', hairC: '#4a3220', top: ['#7a8aa8', '#566486', '#a0b0cc'], pants: ['#4a5470', '#363e56'], boots: '#2a2230', hat: 'helm', hatCol: '#9aa4b8', plume: '#2a4a98', pads: true, padCol: '#aab4c8', hold: 'spear', tabard: '#2a4a98', belt: '#5a3a22' },
  // Вспоминающие
  pilgrim: { skin: '#e0b890', hairC: '#6a6a5a', hair: 'long', top: ['#6a7a6a', '#4e5e50', '#8a9c8c'], pants: ['#4e5e50', '#384538'], boots: '#3a2a1c', robe: true, hat: 'scarf', hatCol: '#d8d0b8', belt: '#b8a878', cape: '#4e5e50' },
  pilgrimF: { skin: '#f0cca8', hairC: '#9a7a5a', hair: 'long', braid: true, top: ['#7a8a74', '#5a6a56', '#9aac96'], pants: ['#5a6a56', '#445040'], boots: '#3a2a1c', robe: true, hat: null, belt: '#d8d0b8', blush: '#e89a88', trim: '#d8d0b8' },
  // перевал
  trader: { skin: '#d8a078', hairC: '#3a2a1c', hair: 'short', beard: '#3a2a1c', top: ['#a87a3a', '#86602a', '#c89a56'], pants: ['#4a4038', '#342c26'], boots: '#2a2018', hat: 'scarf', hatCol: '#c85a3a', belt: '#5a3a22', apron: '#d8c8a0', hold: 'basket' },
  warden: { skin: '#d8d0e0', hairC: '#d8d4e4', hair: 'bald', beard: '#d8d4e4', top: ['#4a4868', '#34324e', '#6a688a'], pants: ['#34324e', '#26243a'], boots: '#26243a', robe: true, hat: 'hood', hatCol: '#34324e', glowEyes: '#b8a8ff', cape: '#26243a', trim: '#b8a8ff', hold: 'cane' },
  deserter: { skin: '#d8a888', hairC: '#4a3a2a', hair: 'short', top: ['#6a6a78', '#4e4e5c', '#8a8a9a'], pants: ['#4a4038', '#342c26'], boots: '#2a2018', hat: null, scar: '#b87858', beard: '#4a3a2a', tabard: '#8a8a98', belt: '#3a2a1c' },
  // видения богов
  vis_lyara: vision('#f4a8c0', '#c8789a', '#ffd8e4'),
  vis_torn: vision('#7ab0f0', '#4a78b8', '#d8ecff', { robe: false, pants: ['#4a78b8', '#34588c'], hat: 'helm', hatCol: '#a8c8f0', pads: true, padCol: '#d8ecff', hold: 'spear', hair: 'bald' }),
  vis_ori: vision('#c8b0ff', '#8a70c8', '#f0e8ff', { hold: 'cane' }),
  vis_seyr: vision('#f0d060', '#b89a30', '#fff4c0', { robe: false, pants: ['#b89a30', '#8a7020'], hat: 'scarf', hatCol: '#f0d060', cape: '#b89a30', hair: 'short' }),
  vis_mara: vision('#7ad08a', '#4a9a5a', '#d0ffd8', { hat: 'leaf' }),
  vis_kharn: vision('#f06048', '#b03a28', '#ffd0c0', { robe: false, pants: ['#b03a28', '#7a2418'], hat: 'helm', hatCol: '#c85a40', horns: true, pads: true, padCol: '#f08068', hold: 'sword', hair: 'bald' }),
  vis_issa: vision('#b070e0', '#7a40a8', '#f0d8ff', { hat: 'hood', hatCol: '#7a40a8', mask: '#e8d8f4' }),
};

export const ENEMY_HUMAN = {};
