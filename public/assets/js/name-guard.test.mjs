// Run: node public/assets/js/name-guard.test.mjs
// Offensive names in the rankings (D-513): what the list stops and the real names it lets through.
import assert from 'node:assert/strict';
import { nombreOfensivo } from './name-guard.js';

for (const n of ['Puta', 'hijo de puta', 'CONCHETUMADRE', 'p u t a', 'MrFuck', 'fuuuck', 'F u c k', 'Culiao 69',
  'xXputitaXx', 'Hurensohn', 'caralho', 'n1gger', 'sh1t', '$hit', 'Culo', 'Coño', 'Hitler88', 'el nazi',
  'Hiperpene', 'HiperPene', 'Superpico', 'Elculo', 'Penecito', 'Culito', 'Putas', 'Megaverga', 'MrDick', 'Picote'])
  assert.ok(nombreOfensivo(n), `should stop ${n}`);

for (const n of ['Cata', 'Pancho', 'Película', 'Computadora', 'Vergara', 'Porras', 'Nazir', 'Hancock', 'Toshitaka',
  'Mer Dávila', 'Diputada', 'Cono Sur', 'Ana', 'Raja', 'Pau', 'Dickens', 'Héctor M', 'Sebastián', 'Joaquín', '🦊', '', 'Ñandú',
  'Penélope', 'Picón', 'Pichón', 'Elvis', 'Lacunza', 'Dickson', 'Cockburn', 'Mariposa', 'Hipertenso', 'Superman', 'Elena', 'Lautaro', 'Tupac', 'Miguel', 'McDonald', 'DiCaprio', 'Vergarita', 'Peneda', 'Assunta', 'Míster Pi', 'Donato', 'Picasso', 'Pacoco', 'Tetaz', 'Sussana'])
  assert.ok(!nombreOfensivo(n), `should let ${n} through`);

console.log('✓ name-guard');

// A player the owner renamed takes the server's name on the next page (rename-player.mjs)
{
  const { crearJugador } = await import('./jugador.js');
  const mem = new Map([['juegos-de-salon:jugador', JSON.stringify({ jid: 'abcd1234', n: 'Puta', co: 'CL' })]]);
  const storage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: k => mem.delete(k) };
  const almacen = { get: async p => (p === 'jugadores/abcd1234/n' ? 'Jugador ABCD' : null) };
  const J = crearJugador({ almacen, storage });
  await J.refrescarNombre();
  assert.deepEqual(J.yo(), { jid: 'abcd1234', n: 'Jugador ABCD', co: 'CL' });
}
console.log('✓ refrescarNombre');
