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
assert.deepEqual(atrasos({ app: '0.88.0' }, { portada: [], version: '0.88.4' }), []);

console.log('marketing: ok');
