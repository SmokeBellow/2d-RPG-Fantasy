// Внешность NPC и человекоподобных врагов Локации 4 (формат как в sprites_chars.js: NPC_LOOKS / ENEMY_HUMAN).
export const NPC_LOOKS = {
  // Бастион: судья в серо-синей мантии, комендант, интендант, узник, смотрительница пайков, паломники
  judge: { skin: '#d8b090', hairC: '#c8c8d4', hair: 'short', beard: '#c8c8d4', top: ['#4a5a8a', '#34406a', '#6a7aaa'], pants: ['#34406a', '#262e50'], boots: '#2a2230', robe: true, belt: '#c8c8d8', hold: 'cane', hat: null, trim: '#a8b8e8' },
  commandant: { skin: '#d0a078', hairC: '#6a6a74', hair: 'short', top: ['#6a7aa0', '#4a5880', '#8a9ac0'], pants: ['#3a4260', '#2a3048'], boots: '#22202c', hat: 'helm', hatCol: '#a8b4cc', plume: '#6a8ad0', pads: true, padCol: '#b8c4dc', belt: '#5a3a22', hold: 'spear', tabard: '#3a4a8a', mustache: '#6a6a74' },
  quarter: { skin: '#e0b088', hairC: '#7a5a3a', hair: 'bald', top: ['#7a6a4a', '#5a4c34', '#9a8a68'], pants: ['#4a4030', '#342c22'], boots: '#2a2018', apron: '#d8d0b8', belt: '#3a2a1c', mustache: '#7a5a3a', hat: null },
  prisoner: { skin: '#d0a888', hairC: '#3a2a20', hair: 'spiky', beard: '#3a2a20', top: ['#8a7a64', '#6a5c4a', '#a89a82'], pants: ['#5a5042', '#40382e'], boots: '#2a2018', hat: null, belt: null, sleeve: '#d0a888' },
  ration: { skin: '#f0c8a0', hairC: '#8a3a2a', hair: 'long', braid: true, top: ['#6a7a5a', '#4e5c42', '#8a9a76'], pants: ['#4a4030', '#342c22'], boots: '#2a2018', apron: '#e8e0cc', hat: 'scarf', hatCol: '#a89a6a', belt: '#5a3a22', blush: '#e89a88' },
  pilgrim: { skin: '#e0b890', hairC: '#9a9a9a', hair: 'bald', beard: '#9a9a9a', top: ['#8a7a6a', '#6a5c4e', '#a89a88'], pants: ['#5a5042', '#40382e'], boots: '#3a2a1c', robe: true, hat: 'hood', hatCol: '#6a5c4e', hold: 'cane', belt: '#7a6a50' },
  pilgrimF: { skin: '#f0c8a0', hairC: '#4a3a2a', hair: 'long', top: ['#7a8a9a', '#5c6a7a', '#9aaaba'], pants: ['#5c6a7a', '#44505e'], boots: '#3a2a1c', robe: true, hat: 'scarf', hatCol: '#a8b0b8', blush: '#e89a88', belt: '#5a4a3a' },
  baker: { skin: '#e0b088', hairC: '#6a4a2a', hair: 'bald', top: ['#e8e0cc', '#c8c0aa', '#f8f2e0'], pants: ['#6a5a48', '#4e4234'], boots: '#3a2a1c', apron: '#f4efe0', mustache: '#6a4a2a', hat: null },
  sergeant: { skin: '#d8a078', hairC: '#3a2a20', hair: 'short', beard: '#3a2a20', top: ['#6a7aa0', '#4a5880', '#8a9ac0'], pants: ['#3a4260', '#2a3048'], boots: '#22202c', hat: 'helm', hatCol: '#a8b4cc', pads: true, padCol: '#b8c4dc', tabard: '#3a4a8a', belt: '#5a3a22', hold: 'spear' },
  employer: { skin: '#d8a078', hairC: '#7a3a1a', hair: 'short', beard: '#7a3a1a', top: ['#6a3a32', '#4a2822', '#8a5248'], pants: ['#2a2430', '#1a161e'], boots: '#1a1418', hat: 'bandana', hatCol: '#8a3a2a', scar: '#c07058', pads: true, padCol: '#8a8a94', belt: '#3a2a1c', hold: 'sword', cape: '#4a2a26' },
  // Арена
  arenamaster: { skin: '#b87850', hairC: '#1a1210', hair: 'bald', beard: '#1a1210', top: ['#8a2a22', '#621a16', '#b04238'], pants: ['#3a2a22', '#28201a'], boots: '#22181a', pads: true, padCol: '#b8a068', belt: '#c8a040', hold: 'hammer', sleeve: '#b87850', hat: null },
  champion: { skin: '#c88858', hairC: '#c8c8c8', hair: 'short', beard: '#c8c8c8', top: ['#8a5a3a', '#6a4228', '#a87858'], pants: ['#5a4030', '#42302a'], boots: '#3a2818', hat: 'helm', hatCol: '#d8b868', plume: '#e0c040', pads: true, padCol: '#d8b868', hold: 'sword', belt: '#5a3a22', sleeve: '#c88858', scar: '#b06848' },
  gladF: { skin: '#e0b088', hairC: '#7a2a1a', hair: 'long', braid: true, top: ['#8a5a3a', '#6a4228', '#a87858'], pants: ['#5a4030', '#42302a'], boots: '#3a2818', pads: true, padCol: '#b8a068', belt: '#5a3a22', sleeve: '#e0b088', blush: '#e89a88', hat: null },
  // Роща
  dryad: { skin: '#9ac890', hairC: '#3a7a3a', hair: 'long', top: ['#4a8a48', '#34683a', '#6aae62'], pants: ['#34683a', '#264e2c'], boots: '#2a4a2a', robe: true, hat: 'leaf', glowEyes: '#d8ffb8', blush: null, belt: '#7a5a3a' },
  woodcutter: { skin: '#d8a078', hairC: '#6a4a2a', hair: 'short', beard: '#6a4a2a', top: ['#8a3a32', '#622824', '#aa5248'], pants: ['#4a4030', '#342c22'], boots: '#2a2018', hat: null, belt: '#2a2018', hold: 'hammer', sleeve: '#d8a078' },
  sickF: { skin: '#cfd8b8', hairC: '#6a5a4a', hair: 'long', top: ['#b8b098', '#968e78', '#d4ccb4'], pants: ['#8a826c', '#6c6552'], boots: '#4a3e30', robe: true, hat: null, blush: null, belt: null, glowEyes: '#a8e898' },
  grovefolk: { skin: '#e0b890', hairC: '#4a3a22', hair: 'short', top: ['#5a7a48', '#425c34', '#7a9a62'], pants: ['#4a4030', '#342c22'], boots: '#2a2018', hat: 'hood', hatCol: '#42602e', belt: '#3a2a1c', hold: 'basket', blush: '#e89a88' },
  // Ледник
  ghostsoldier: { skin: '#a8c4d8', hairC: '#c8dcee', hair: 'short', top: ['#8aa4c0', '#6a84a0', '#aac4e0'], pants: ['#5a7490', '#445a74'], boots: '#3a4a60', hat: 'helm', hatCol: '#a8c0d8', pads: true, padCol: '#b8d0e8', glowEyes: '#a8e0ff', tabard: '#4a6a9a', hold: 'spear' },
  keyghost: { skin: '#c8dcee', hairC: '#eef6ff', hair: 'long', beard: '#eef6ff', top: ['#7a94c0', '#5a74a0', '#9ab4e0'], pants: ['#5a74a0', '#445a80'], boots: '#3a4a70', robe: true, hat: null, glowEyes: '#e8f4ff', belt: '#d8e8ff', trim: '#d8e8ff', hold: 'cane' },
};
export const ENEMY_HUMAN = {};
