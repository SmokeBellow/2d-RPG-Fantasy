// Внешность NPC и человекоподобных врагов Локации 5 (формат как в sprites_chars.js).
export const NPC_LOOKS = {
  // порт
  l5_warden: { skin: '#d8a888', hairC: '#9a9a9a', hair: 'bald', beard: '#9a9a9a', top: ['#6a7a8a', '#4e5c6a', '#8a9aaa'], pants: ['#3e4854', '#2c343e'], boots: '#2a2018', hat: null, hold: 'cane', belt: '#5a3a22', tabard: '#7a8a9a', pads: true, padCol: '#8a98a8' },
  l5_judge: { skin: '#e8c8a8', hairC: '#3a3a42', hair: 'short', top: ['#2e2e3a', '#1e1e28', '#4a4a5a'], pants: ['#1e1e28', '#14141c'], boots: '#14141c', robe: true, hat: null, belt: '#c8b060', trim: '#c8b060', mustache: '#3a3a42' },
  l5_innF: { skin: '#f0c8a0', hairC: '#a0503a', hair: 'long', braid: true, top: ['#7a5a3a', '#5a4028', '#9a7a52'], pants: ['#5a4028', '#40301c'], boots: '#3a2a1c', robe: true, hat: 'scarf', hatCol: '#a03a3a', apron: '#e8e0cc', hold: 'mug', blush: '#e89a88', belt: '#5a3a22' },
  l5_trader: { skin: '#e0b890', hairC: '#4a3a2a', hair: 'short', top: ['#4a7a8a', '#365c6a', '#6a9aaa'], pants: ['#3a4a58', '#2a3642'], boots: '#2a2018', hat: null, apron: '#d8cfb8', hold: 'basket', mustache: '#4a3a2a', belt: '#3a2a1c' },
  l5_darian: { skin: '#c89868', hairC: '#1e1a18', hair: 'short', top: ['#8a3a4a', '#6a2a38', '#b05a6a'], pants: ['#3a2a2e', '#2a1e22'], boots: '#2a1a14', hat: 'scarf', hatCol: '#d8a838', belt: '#d8a838', mustache: '#1e1a18', cape: '#5a2430' },
  l5_traveler: { skin: '#e0c0a0', hairC: '#6a5a48', hair: 'short', top: ['#6a6048', '#4e4634', '#8a7e60'], pants: ['#4a4030', '#342c22'], boots: '#2a2018', hat: 'hood', hatCol: '#5a5038', cape: '#4a4230', belt: '#c8a848', glowEyes: '#ffd860', hold: null },
  l5_fisher: { skin: '#c89870', hairC: '#7a6a5a', hair: 'bald', beard: '#8a7a6a', top: ['#4a6a7a', '#34505e', '#6a8a9a'], pants: ['#3a4a50', '#2a363c'], boots: '#2a2018', hat: null, hold: null, belt: '#3a2a1c', sleeve: '#c89870' },
  l5_widow: { skin: '#e8c8b0', hairC: '#8a8a92', hair: 'long', top: ['#2e2e38', '#1e1e28', '#4a4a58'], pants: ['#1e1e28', '#14141c'], boots: '#14141c', robe: true, hat: 'scarf', hatCol: '#7a8a92', blush: '#d8a898', belt: null },
  l5_sara: { skin: '#f0c8a8', hairC: '#6a3a2a', hair: 'long', braid: true, top: ['#6a8a6a', '#4e6a4e', '#8aaa8a'], pants: ['#4e6a4e', '#38503a'], boots: '#3a2a1c', robe: true, hat: null, apron: '#e8e0cc', blush: '#e89a88', belt: '#7a5a3a' },
  l5_boatman: { skin: '#b88860', hairC: '#2a2420', hair: 'short', beard: '#2a2420', top: ['#3a4a5a', '#2a3642', '#566a7e'], pants: ['#2a3040', '#1e2230'], boots: '#1a1a22', hat: 'bandana', hatCol: '#3a6a7a', hold: null, belt: '#2a2018' },
  l5_martin: { skin: '#d8b090', hairC: '#6a6a70', hair: 'short', beard: '#6a6a70', top: ['#5a5048', '#443c36', '#7a6e62'], pants: ['#3a3430', '#2a2624'], boots: '#2a2018', hat: null, belt: '#3a2a1c' },
  l5_collegium: { skin: '#e8c8a8', hairC: '#c8c8d0', hair: 'bald', beard: '#c8c8d0', top: ['#3a4a9a', '#2a3678', '#5a6ac0'], pants: ['#2a3678', '#1e285a'], boots: '#1e1e2c', robe: true, hat: 'wizard', hatCol: '#2a3678', hold: 'cane', belt: '#e8c050', trim: '#e8c050' },
  l5_fence: { skin: '#c8a080', hairC: '#7a7a7a', hair: 'bald', beard: '#7a7a7a', top: ['#4a4a40', '#36362e', '#6a6a5a'], pants: ['#2e2e28', '#1e1e1a'], boots: '#1a1a14', hat: 'hood', hatCol: '#34342c', cape: '#2a2a22', belt: '#2a2018', hold: 'dagger' },
  // маяк-библиотека
  l5_keeper: { skin: '#e0d0c0', hairC: '#d8d8e0', hair: 'long', beard: '#d8d8e0', top: ['#e8e4d8', '#c0baa8', '#f8f4ec'], pants: ['#c0baa8', '#a09a88'], boots: '#5a5448', robe: true, hat: null, glowEyes: '#a8d8ff', belt: '#a8a090', hold: 'cane' },
  l5_scholar: { skin: '#f0d0b0', hairC: '#3a2a22', hair: 'spiky', top: ['#5a4a7a', '#403458', '#7a6a9a'], pants: ['#403458', '#2c2440'], boots: '#2a2018', robe: true, hat: null, belt: '#e8c050', blush: '#e8a898' },
  l5_scribe: { skin: '#f0d0b0', hairC: '#8a6a3a', hair: 'short', top: ['#7a7060', '#5a5244', '#9a9078'], pants: ['#4a4438', '#36322a'], boots: '#2a2018', hat: null, sleeve: '#7a7060', belt: null },
  // лечебница
  l5_healer: { skin: '#f0c8a8', hairC: '#7a5a3a', hair: 'long', braid: true, top: ['#e8e8e0', '#c0c0b8', '#f8f8f0'], pants: ['#c0c0b8', '#a0a098'], boots: '#5a4a3a', robe: true, hat: 'scarf', hatCol: '#e8e8e0', apron: '#f4f4ec', hold: 'basket', blush: '#e89a88', belt: '#7a9a7a' },
  l5_kaspar: { skin: '#a8a898', hairC: '#4a4a44', hair: 'short', top: ['#8a8a82', '#6a6a64', '#aaa8a0'], pants: ['#6a6a64', '#4e4e48'], boots: '#3a342c', hat: null, belt: null },
  l5_sailor: { skin: '#8a9a88', hairC: '#3a3830', hair: 'short', top: ['#5a6a7a', '#444f5a', '#7a8a9a'], pants: ['#4a5058', '#363a40'], boots: '#2a2018', hat: null, glowEyes: '#c8e8a0', belt: '#3a2a1c' },
  l5_oldwoman: { skin: '#e8d0b8', hairC: '#d8d8d8', hair: 'long', top: ['#8a7a9a', '#6a5a7a', '#aa9aba'], pants: ['#6a5a7a', '#4e4260'], boots: '#4a3a2c', robe: true, hat: 'scarf', hatCol: '#a898b8', blush: '#e8a8a0', belt: null },
  // игорный дом
  l5_lisandra: { skin: '#e8c8b0', hairC: '#1e1a22', hair: 'long', top: ['#6a2a5a', '#4e1e42', '#8a4a7a'], pants: ['#2a1a28', '#1a101a'], boots: '#14101a', robe: true, hat: null, mask: '#d8d0e0', belt: '#b070e0', glowEyes: '#d8a8ff', blush: null },
  l5_fim: { skin: '#e0b898', hairC: '#2a2018', hair: 'short', top: ['#3a5a3a', '#2a422a', '#5a7a5a'], pants: ['#2a2a2a', '#1a1a1a'], boots: '#1a1a1a', hat: 'scarf', hatCol: '#c83a3a', mustache: '#2a2018', belt: '#c8a848', hold: null },
  l5_banker: { skin: '#f0c8a8', hairC: '#c8b898', hair: 'bald', top: ['#6a3a2a', '#4e2a1e', '#8a5a4a'], pants: ['#2a2220', '#1a1614'], boots: '#1a1210', robe: false, hat: null, belt: '#d8a838', blush: '#e89a88', mustache: '#8a7858', trim: '#d8a838' },
  l5_velda: { skin: '#d8b090', hairC: '#2a1a1a', hair: 'long', top: ['#2a5a5a', '#1e4242', '#4a8a8a'], pants: ['#1e3a3a', '#142a2a'], boots: '#14201e', robe: true, hat: null, belt: '#c8c8d0', blush: '#c88888' },
  l5_emile: { skin: '#e8c8a8', hairC: '#2a2a32', hair: 'short', top: ['#2a2a32', '#1c1c24', '#4a4a5a'], pants: ['#1c1c24', '#12121a'], boots: '#14141a', hat: null, belt: '#c8a848', sleeve: '#e8c8a8' },
};
export const ENEMY_HUMAN = {};
