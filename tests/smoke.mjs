// Быстрая проверка логики мира без браузера: загрузка областей, бой, квесты.
import { World } from '../js/world.js';
import { newState } from '../js/state.js';
import { AREA_IDS } from '../js/maps.js';

const inp = (o = {}) => ({ mx: 0, my: 0, aimX: null, aimY: null, attack: false, skill: [false, false], dodge: false, potHp: false, potMp: false, interact: false, ...o });
for (const cls of ['warrior', 'mage', 'rogue']) {
  const w = new World(newState(cls));
  for (const id of AREA_IDS) w.loadArea(id);
  w.loadArea('forest');
  // прогон 60 секунд: атаки и движение
  for (let i = 0; i < 3600; i++) w.update(1 / 60, inp({ mx: Math.cos(i / 40), my: Math.sin(i / 40), attack: i % 20 < 10, skill: [i % 200 === 0, i % 330 === 0], dodge: i % 150 === 0 }));
  console.log(cls, 'ok, hp', Math.round(w.s.hp), 'enemies', w.enemies.length);
}
