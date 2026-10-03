// Сохранения и настройки в localStorage (всё в try/catch: приватный режим может запрещать запись).
import { SAVE_VERSION } from './state.js';

const KEY = 'emberveil.save.v1';
const SKEY = 'emberveil.settings.v1';

export const defaultSettings = { music: 0.6, sfx: 0.8, fullscreen: false, touchHint: true };

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== SAVE_VERSION || !s.cls) return null;
    return s;
  } catch (e) { return null; }
}

export function writeSave(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SKEY);
    return { ...defaultSettings, ...(raw ? JSON.parse(raw) : {}) };
  } catch (e) { return { ...defaultSettings }; }
}

export function writeSettings(s) {
  try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}
