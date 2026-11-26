// Signing out leaves a clean sheet (the owner's report): the player's progress goes, the phone's settings stay
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limpiarProgreso } from './jugador.js';

const mem = init => { const m = new Map(Object.entries(init)); return { get length() { return m.size; }, key: i => [...m.keys()][i], getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k), m }; };

test('signing out clears the progress and keeps the settings', () => {
  const s = mem({ 'juegos-de-salon:uno-al-dia': '{}', 'juegos-de-salon:uno-al-dia:empezado': '1', 'juegos-de-salon:copa:mias': '[]', 'juegos-de-salon:copa:hoy:K7Q2X': '1',
    'juegos-de-salon:jugador:pendientes': '[]', 'juegos-de-salon:jugados': '[]', 'uad-pts-cache': '{}',
    'juegos-de-salon:lang': 'es', 'juegos-de-salon:muted': '1', 'juegos-de-salon:labs-llave': 'x', 'juegos-de-salon:copa:prueba': '1' });
  limpiarProgreso(s);
  assert.deepEqual([...s.m.keys()].sort(), ['juegos-de-salon:copa:prueba', 'juegos-de-salon:labs-llave', 'juegos-de-salon:lang', 'juegos-de-salon:muted']);
});
