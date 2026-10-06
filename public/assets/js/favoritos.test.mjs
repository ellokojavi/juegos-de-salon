// Los favoritos de la portada (D-238): qué se guarda en localStorage, marcar y desmarcar, y que un
// almacén roto o con basura no rompa la portada.
import assert from 'node:assert/strict';
import { favoritos, alternarFavorito, CLAVE } from './favoritos.js';

const memoria = (inicial = {}) => {
  const m = new Map(Object.entries(inicial));
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m };
};

// Sin nada guardado, ninguno
assert.deepEqual(favoritos(memoria()), []);
assert.deepEqual(favoritos(null), []);

// Marcar, marcar otro y desmarcar el primero: quedan en el orden en que se marcaron
const ls = memoria();
assert.equal(alternarFavorito('ahorcado', ls), true);
assert.equal(alternarFavorito('dudo', ls), true);
assert.deepEqual(favoritos(ls), ['ahorcado', 'dudo']);
assert.equal(alternarFavorito('ahorcado', ls), false);
assert.deepEqual(favoritos(ls), ['dudo']);

// El último que se desmarca borra la clave: no queda un "[]" guardado
alternarFavorito('dudo', ls);
assert.equal(ls.m.has(CLAVE), false);

// Un valor roto, o con basura adentro, no rompe la portada
assert.deepEqual(favoritos(memoria({ [CLAVE]: '{no es json' })), []);
assert.deepEqual(favoritos(memoria({ [CLAVE]: '{"a":1}' })), []);
assert.deepEqual(favoritos(memoria({ [CLAVE]: '["tango", 3, "", null, "tango"]' })), ['tango']);

// Si guardar falla (modo privado), igual responde lo que pasó
const lleno = { getItem: () => null, setItem: () => { throw new Error('lleno'); }, removeItem: () => {} };
assert.equal(alternarFavorito('tango', lleno), true);

console.log('✓ favoritos');
