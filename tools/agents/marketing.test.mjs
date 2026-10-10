// Qué cuenta como marketing atrasado (U-34). Ejecutar: node tools/agents/marketing.test.mjs
import assert from 'node:assert/strict';
import { atrasos } from './marketing.mjs';

const asset = { app: '0.82.x', juegos: ['tango', 'zip'], grilla_mas: ['letras'] };

// Al día: mismos juegos (la copa no cuenta: es la vitrina, no un juego de la grilla) y misma versión.
assert.deepEqual(atrasos(asset, { portada: ['copa', 'tango', 'zip', 'letras'], version: '0.82.3' }), []);

// Un juego nuevo en la portada, uno que salió y una versión menor más nueva.
assert.deepEqual(atrasos(asset, { portada: ['tango', 'letras', 'desenredo'], version: '0.88.0' }), [
  'juegos de la portada que no salen: desenredo',
  'salen juegos que ya no están en la portada: zip',
  'muestra la app 0.82.x; hoy es 0.88.0',
]);

// Un parche no envejece el asset.
// Un asset que muestra una selección no echa de menos los juegos nuevos, pero sí avisa si uno ya no está
assert.deepEqual(atrasos({ juegos: ['zip', 'reinas'], seleccion: true }, { portada: ['zip', 'reinas', 'desenredo'], version: '0.1.0' }), []);
assert.deepEqual(atrasos({ juegos: ['zip', 'viejo'], seleccion: true }, { portada: ['zip'], version: '0.1.0' }), ['salen juegos que ya no están en la portada: viejo']);
assert.deepEqual(atrasos({ app: '0.88.0' }, { portada: [], version: '0.88.4' }), []);

console.log('marketing: ok');

// Un juego del laboratorio que sale a propósito no se marca como "ya no está en la portada"
{
  const av = atrasos({ juegos: ['caso'], laboratorio: ['caso'], seleccion: true }, { portada: ['ahorcado'], version: null });
  assert.deepEqual(av, [], 'laboratorio: no debería avisar');
  console.log('marketing: un juego del laboratorio no avisa');
}
