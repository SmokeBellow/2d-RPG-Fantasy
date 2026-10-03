// Внешность NPC и человекоподобных врагов этой локации (формат как в sprites_chars.js: NPC_LOOKS / ENEMY_HUMAN).
const SK = { fair: '#f0d0b0', tan: '#e0b088', dark: '#b88060', pale: '#e8d8c8', old: '#e0b898' };

export const NPC_LOOKS = {
  // Совет и рынок
  archivist: { skin: SK.old, hairC: '#d8d4cc', hair: 'bald', beard: '#d8d4cc', top: ['#6a6a7a', '#4e4e5e', '#8a8a9c'], pants: ['#4a4a5a', '#363644'], boots: '#2a2230', robe: true, belt: '#8a7a5a', hold: 'cane', hat: null },
  consul: { skin: '#e8bf98', hairC: '#9a9aa8', top: ['#8a2a3a', '#6a1c2a', '#b04858'], pants: ['#4a2030', '#341622'], boots: '#2a1418', robe: true, trim: '#e8c050', belt: '#e8c050', buckle: '#fff0a0', cape: '#5a1020', mustache: '#9a9aa8', hat: null },
  gatecap: { skin: '#d8a880', hairC: '#3a3030', top: ['#6a7a98', '#4a587a', '#8a9ab8'], pants: ['#3a4258', '#2a3042'], boots: '#2a2230', hat: 'helm', hatCol: '#a0aac0', plume: '#e8c050', pads: true, padCol: '#b0b8cc', tabard: '#3a5aa0', beard: '#3a3030', hold: 'spear', belt: '#5a3a22' },
  merchant2: { skin: '#d8a888', hairC: '#2a1c18', hair: 'long', top: ['#3a7a6a', '#2a5a4e', '#5aa090'], pants: ['#2a5a4e', '#1c4036'], boots: '#3a2a1c', robe: true, hat: 'scarf', hatCol: '#d8a040', apron: '#e8e0d0', hold: 'basket', blush: '#e89a88', belt: '#2a5a4e' },
  innkeeperF: { skin: SK.fair, hairC: '#a04a2a', hair: 'long', braid: true, top: ['#a85a4a', '#864236', '#c87a68'], pants: ['#5a3a30', '#442a22'], boots: '#3a2a1c', robe: true, apron: '#f0ece0', hold: 'mug', blush: '#e89a88', belt: '#7a4a3a', hat: null },
  bard: { skin: SK.tan, hairC: '#7a4a2a', hair: 'spiky', top: ['#4a6a9a', '#34507a', '#6a8aba'], pants: ['#7a3a3a', '#5a2a2a'], boots: '#3a2a1c', hat: 'scarf', hatCol: '#c84a4a', cape: '#8a3a3a', belt: '#e8c050', blush: '#e89a88' },
  huntmaster: { skin: '#d8a880', hairC: '#3a3a3a', top: ['#3a5a3a', '#284428', '#587a52'], pants: ['#3a3a30', '#2a2a22'], boots: '#2a2018', hat: 'hood', hatCol: '#2e4a2e', hold: 'bow', cape: '#2e4a2e', belt: '#3a2a1c', beard: '#3a3a3a', scar: '#b87858' },
  veteran: { skin: '#d0a078', hairC: '#8a8a8a', hair: 'bald', beard: '#8a8a8a', top: ['#6a5a4a', '#4e4034', '#8a7860'], pants: ['#4a4038', '#342c26'], boots: '#2a2018', hold: 'cane', eyepatch: true, scar: '#b87858', cape: '#4a3a2e', pads: true, padCol: '#6a6a72', belt: '#2a2018' },
  crier: { skin: SK.fair, hairC: '#5a3a22', top: ['#2a5a8a', '#1c4068', '#4a7ab0'], pants: ['#3a3a50', '#2a2a3c'], boots: '#2a2018', hat: 'scarf', hatCol: '#e8c050', tabard: '#e8c050', belt: '#5a3a22', blush: '#e89a88' },
  quartermaster: { skin: '#d8a078', hairC: '#6a6a6a', hair: 'bald', beard: '#6a6a6a', mustache: '#6a6a6a', top: ['#5a6a82', '#40506a', '#7a8aa2'], pants: ['#3a4258', '#2a3042'], boots: '#2a2230', apron: '#6a5a42', belt: '#5a3a22', hold: 'hammer', hat: null },
  preacher: { skin: '#e8c8a0', hairC: '#c8c0b0', hair: 'long', beard: '#c8c0b0', top: ['#c8c0a8', '#a09880', '#e8e0c8'], pants: ['#a09880', '#807860'], boots: '#5a4a3a', robe: true, hold: 'staff', belt: '#7a6a4a', blush: '#e8a898', hat: null },
  washer: { skin: '#f0c8a0', hairC: '#7a5a3a', hair: 'long', braid: true, top: ['#8aa0c0', '#6a82a2', '#a8bcd8'], pants: ['#6a82a2', '#506482'], boots: '#3a2a1c', robe: true, hat: 'scarf', hatCol: '#e8e0d0', apron: '#f0ece0', hold: 'basket', blush: '#e89a88', belt: '#8a7a5a' },
  fishwife: { skin: '#e8b890', hairC: '#6a3a22', top: ['#5a8a8a', '#406a6a', '#7aaaaa'], pants: ['#4a5a5a', '#364444'], boots: '#2a2018', robe: true, hat: 'scarf', hatCol: '#c85a4a', apron: '#e0d8c0', hold: 'basket', blush: '#e89a88', belt: '#7a5a3a' },
  docker: { skin: '#d0a078', hairC: '#3a2a1c', hair: 'bald', beard: '#4a3a2a', top: ['#7a6a52', '#5a4c3a', '#9a8a70'], sleeve: '#d0a078', pants: ['#4a4038', '#342c26'], boots: '#2a2018', hat: 'bandana', hatCol: '#5a6a8a', belt: '#2a2018', pads: true, padCol: '#6a5a46' },

  // Нижний город
  neya: { skin: '#d8b090', hairC: '#2a2a3a', hair: 'long', braid: true, top: ['#4a4a6a', '#34344e', '#6a6a8c'], pants: ['#34344e', '#262638'], boots: '#2a2230', robe: true, hat: 'hood', hatCol: '#34344e', cape: '#2a2a42', belt: '#c8a860', blush: '#d8988a' },
  hada: { skin: SK.old, hairC: '#d8d8d8', hair: 'long', top: ['#7a6a5a', '#5a4c3e', '#9a8a74'], pants: ['#5a4c3e', '#42382e'], boots: '#3a2a1c', robe: true, hat: 'scarf', hatCol: '#9a7a6a', hold: 'basket', belt: '#6a5a3a' },
  ratboss: { skin: '#d0a888', hairC: '#1a1a1a', hair: 'bald', scar: '#b87858', mustache: '#1a1a1a', top: ['#5a2a2a', '#421c1c', '#7a4040'], pants: ['#2a2428', '#1c181c'], boots: '#1c1418', hat: 'bandana', hatCol: '#7a2a2a', pads: true, padCol: '#4a3a3a', cape: '#2a1a1a', hold: 'dagger', belt: '#c8a040', buckle: '#e8c050' },
  gangster: { skin: '#d8a078', hairC: '#2a2018', hair: 'bald', top: ['#4a4038', '#342c26', '#6a5e50'], pants: ['#3a3228', '#2a241c'], boots: '#221a14', hold: 'club', belt: '#2a2018', scar: '#b87858', pads: true, padCol: '#6a5a48', hat: null },
  bork: { skin: '#d8a078', hairC: '#6a4a2a', hair: 'bald', mustache: '#6a4a2a', beard: '#6a4a2a', top: ['#6a5a4a', '#4e4034', '#8a7860'], pants: ['#4a4038', '#342c26'], boots: '#2a2018', apron: '#d8d0c0', hold: 'mug', belt: '#3a2a1c', hat: null },
  widow: { skin: SK.fair, hairC: '#6a6a6a', hair: 'long', top: ['#2a2a34', '#1c1c24', '#44444e'], pants: ['#1c1c24', '#14141a'], boots: '#1c1418', robe: true, hat: 'scarf', hatCol: '#2a2a34', belt: null },
  fence: { skin: '#d8b090', hairC: '#5a2a3a', hair: 'long', top: ['#7a3a5a', '#5a2a42', '#9a5a7a'], pants: ['#5a2a42', '#421e30'], boots: '#2a1c22', robe: true, hat: 'scarf', hatCol: '#c8a040', belt: '#c8a040', blush: '#d8988a' },
  drunk: { skin: '#e0b090', hairC: '#5a4a3a', beard: '#5a4a3a', top: ['#6a5a4a', '#4a3e32', '#8a7a68'], pants: ['#4a4036', '#342c24'], boots: '#2a2018', hold: 'mug', belt: null, blush: '#e07a6a', hat: null },
  urchin: { skin: '#e8c298', hairC: '#6a4a2a', hair: 'spiky', top: ['#8a7a68', '#6a5c4c', '#a89a86'], pants: ['#5a5046', '#40382f'], boots: '#3a2a1c', legH: 4, torsoH: 6, hat: 'bandana', hatCol: '#5a7a5a', blush: '#e89a88', belt: null },
  goblinN: { skin: '#78a84a', hairC: '#3a4a22', hair: 'bald', ears: true, top: ['#5a4a3a', '#42362a', '#7a6a58'], pants: ['#4a3a28', '#362a1c'], boots: '#2a2018', eye: '#ffe030', belt: '#3a2a1c', hat: null, legH: 5, torsoH: 8, apron: '#b8a888', hold: 'basket' },

  // Коллегия
  isolda: { skin: '#e8c8b0', hairC: '#e0e0e8', hair: 'long', top: ['#2a4a8a', '#1c3468', '#4a6ab0'], pants: ['#1c3468', '#14264e'], boots: '#2a2030', robe: true, trim: '#e8d060', belt: '#e8d060', hold: 'staff', hat: null, blush: '#d8988a' },
  porter: { skin: '#d8a880', hairC: '#5a4a3a', hair: 'bald', beard: '#5a4a3a', top: ['#5a6a7a', '#40505e', '#7a8a9a'], pants: ['#3a4250', '#2a303c'], boots: '#2a2230', tabard: '#2a4a8a', hold: 'cane', belt: '#3a2a1c', hat: null },
  student: { skin: SK.fair, hairC: '#3a2a22', hair: 'long', braid: true, top: ['#3a5a9a', '#2a4078', '#5a7aca'], pants: ['#2a3452', '#1e263c'], boots: '#2a2018', robe: true, belt: '#c8c0a0', blush: '#e89a88', hat: null },
  student2: { skin: SK.tan, hairC: '#2a2018', hair: 'spiky', top: ['#3a5a9a', '#2a4078', '#5a7aca'], pants: ['#2a3452', '#1e263c'], boots: '#2a2018', belt: '#c8c0a0', hat: null },
  scribe: { skin: '#e8c298', hairC: '#6a4a2a', top: ['#6a5a4a', '#4e4034', '#8a7860'], pants: ['#4a4038', '#342c26'], boots: '#2a2018', apron: '#c8c0a8', hold: 'basket', mustache: '#6a4a2a', belt: '#4a3a2a', hat: null },
  prof: { skin: SK.pale, hairC: '#d8d8e0', hair: 'bald', beard: '#d8d8e0', top: ['#5a3a7a', '#42285e', '#7a5aa0'], pants: ['#42285e', '#321c48'], boots: '#2a2030', robe: true, hat: 'wizard', hatCol: '#5a3a7a', hatBand: '#e8c050', hold: 'staff', trim: '#e8c050' },
  librarian: { skin: '#f0d0b0', hairC: '#4a3a2a', hair: 'long', braid: true, top: ['#6a4a7a', '#4e345e', '#8a6a9c'], pants: ['#4e345e', '#382444'], boots: '#2a2030', robe: true, belt: '#c8c0a0', blush: '#e89a88', hat: null },

  // Храм
  listener: { skin: SK.pale, hairC: '#e8e4f0', hair: 'long', top: ['#e8e4f0', '#c8c4d8', '#fffcff'], pants: ['#c8c4d8', '#a8a4b8'], boots: '#a8a4b8', robe: true, hat: 'scarf', hatCol: '#f0eef8', belt: '#c8c4d8' },
  acolyte: { skin: '#e8c8a0', hairC: '#6a4a2a', hair: 'bald', top: ['#8a7a5a', '#6a5c42', '#a89a76'], pants: ['#6a5c42', '#4e4430'], boots: '#3a2a1c', robe: true, belt: '#8a6a3a', blush: '#e89a88', hat: null },
  penitent: { skin: '#e0c4a4', hairC: '#6a6a6a', hair: 'bald', beard: '#6a6a6a', top: ['#6a6a6a', '#4e4e4e', '#8a8a8a'], pants: ['#4e4e4e', '#383838'], boots: '#3a3a3a', robe: true, hat: 'hood', hatCol: '#5a5a5a', belt: null },
  warpriest: { skin: SK.dark, hairC: '#2a1a10', hair: 'bald', beard: '#2a1a10', top: ['#8a2a1a', '#641c10', '#b04a38'], pants: ['#3a2220', '#2a1814'], boots: '#2a1818', pads: true, padCol: '#8a8a98', tabard: '#2a2a2a', hold: 'sword', belt: '#3a2a1c', hat: null },
  nun: { skin: '#f0d0b0', hairC: '#c8a888', top: ['#e8d0d8', '#c8aab4', '#f8e8ee'], pants: ['#c8aab4', '#a88c96'], boots: '#8a7078', robe: true, hat: 'scarf', hatCol: '#f8f0f4', belt: '#c8aab4', blush: '#e89a98' },

  // Стоки
  lukian: { skin: '#e0d0bc', hairC: '#4a3a2a', hair: 'spiky', top: ['#3a4a7a', '#2a3860', '#5a6a9c'], pants: ['#2a3452', '#1e263c'], boots: '#2a2018', robe: true, glowEyes: '#c8e8ff', belt: '#8a8a6a', scar: '#b8a090', hat: null },
  echoV: { skin: '#9a9a8a', hairC: '#4a4a40', hair: 'spiky', top: ['#6a6454', '#4e483c', '#8a846e'], pants: ['#4a4438', '#383228'], boots: '#2a2620', glowEyes: '#d8e868', belt: '#3a3228', hat: null },
  sewerman: { skin: '#c89870', hairC: '#3a2a1c', hair: 'bald', beard: '#4a3a2a', top: ['#5a6a4a', '#42503a', '#7a8a62'], pants: ['#3a3a2a', '#2a2a1e'], boots: '#2a2a1e', hat: 'helm', hatCol: '#8a7a4a', apron: '#4a4a3a', hold: 'club', belt: '#2a2018' },
};
export const ENEMY_HUMAN = {};
