// Реестр карт. Области собираются в areas_l*.js; здесь только кеш и доступ.
import { TILEDEF } from './defs.js';
import { PROP_DEF, Builder, solidGrid } from './maps_core.js';
import { BUILD as L1 } from './areas_l1.js';
import { BUILD as L2 } from './areas_l2.js';
import { BUILD as L3 } from './areas_l3.js';
import { BUILD as L4 } from './areas_l4.js';
import { BUILD as L5 } from './areas_l5.js';
import { BUILD as L6 } from './areas_l6.js';

const BUILDERS = { ...L1, ...L2, ...L3, ...L4, ...L5, ...L6 };
const cache = {};
export function getMap(id) {
  if (!BUILDERS[id]) throw new Error(`нет карты ${id}`);
  return cache[id] || (cache[id] = BUILDERS[id]());
}
export const AREA_IDS = Object.keys(BUILDERS);
export { PROP_DEF, Builder, solidGrid, TILEDEF };
