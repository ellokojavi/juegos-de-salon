// La portada al día (U-36): portadas.mjs lee el lema y los pasos de un game.js del laboratorio y
// reconoce qué juegos toca un PR. Lo prueba contra los juegos de verdad del laboratorio.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portadaDe, juegosTocados, pasosResueltos } from './portadas.mjs';

for (const slug of ['agents', 'paint-mines', 'routes']) {
  const { lema, pasos } = portadaDe(readFileSync(new URL(`../../public/labs/${slug}/game.js`, import.meta.url), 'utf8'));
  assert.ok(lema && lema.length > 10, `${slug}: sin lema`);
  assert.ok(pasos.length >= 2 && pasos.length <= 3, `${slug}: ${pasos.length} pasos (U-18: hasta 3)`);
  // El tope de U-18 que juegos.test.mjs vigila en La Copa, con las constantes del juego puestas
  const { resueltos, largo } = pasosResueltos(pasos, { ...(await import(`../../public/labs/${slug}/engine.js`)) });
  assert.ok(resueltos.every(p => !p.includes('${')), `${slug}: quedó un \${…} sin resolver`);
  assert.ok(largo <= 280, `${slug}: "Cómo se juega" tiene ${largo} caracteres (U-18: máximo 280)`);
}
assert.deepEqual(juegosTocados(['public/labs/routes/game.js', 'public/labs/routes/style.css', 'docs/x.md', 'public/cup/games/queens/ui.js']),
  { labs: ['routes'], otros: ['queens'] });
assert.deepEqual(juegosTocados(['README.md']), { labs: [], otros: [] });
console.log('✓ portadas (U-36)');
