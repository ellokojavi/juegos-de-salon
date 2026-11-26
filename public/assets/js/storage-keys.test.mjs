// Every key the site keeps on the phone is sorted: the player's progress (cleared on signing out, so
// the next person starts on a clean sheet) or the phone's own (the owner's report). A new key that is
// in neither list fails here, so it cannot leak one player's progress to the next.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kindOf, clearProgress } from './storage-keys.js';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '../..');
// The generated bridge pages and the old Spanish paths repeat the real pages
const files = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) files(p, out); else if (/\.(m?js|html)$/.test(f) && !/\.test\.mjs$/.test(f)) out.push(p); } return out; };

test('every key the site keeps on the phone is progress or the phone\'s own', () => {
  const sin = new Set();
  for (const f of files(PUBLIC)) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/['"`](juegos-de-salon:[^'"`\s]*)/g)) {
      // A template's ${…} or a <placeholder> in a comment stands for any text
      const k = m[1].replace(/\$\{[^}]*\}/g, 'x').replace(/<[^>]*>/g, 'x');
      if (k.endsWith(':') || k.includes('${')) continue; // a bare prefix, joined with a name elsewhere
      if (!kindOf(k)) sin.add(`${k}  (${f.slice(PUBLIC.length + 1)})`);
    }
    // A key without the site's prefix, written straight to the storage
    for (const m of src.matchAll(/Storage\.(?:get|set|remove)Item\(\s*['"`]([^'"`$]+)['"`]/g)) if (!kindOf(m[1])) sin.add(`${m[1]}  (${f.slice(PUBLIC.length + 1)})`);
  }
  assert.deepEqual([...sin], [], 'Add each key to PROGRESS or DEVICE in public/assets/js/storage-keys.js');
});

test('signing out clears the progress and keeps the settings', () => {
  const m = new Map(Object.entries({ 'juegos-de-salon:uno-al-dia': '{}', 'juegos-de-salon:copa:mias': '[]', 'juegos-de-salon:copa:hoy:K7Q2X': '1',
    'juegos-de-salon:jugador:pendientes': '[]', 'juegos-de-salon:sudoku:best': '1', 'juegos-de-salon:dudo:name': 'Ana', 'juegos-de-salon:dudo:session': '{}', 'uad-pts-cache': '{}',
    'juegos-de-salon:jugador': 'null', 'juegos-de-salon:lang': 'es', 'juegos-de-salon:labs-llave': 'x', 'juegos-de-salon:copa:prueba': '1', 'juegos-de-salon:uno-al-dia:avisos': '{}' }));
  const s = { get length() { return m.size; }, key: i => [...m.keys()][i], removeItem: k => m.delete(k) };
  clearProgress(s);
  assert.deepEqual([...m.keys()].sort(), ['juegos-de-salon:copa:prueba', 'juegos-de-salon:jugador', 'juegos-de-salon:labs-llave', 'juegos-de-salon:lang', 'juegos-de-salon:uno-al-dia:avisos']);
});
