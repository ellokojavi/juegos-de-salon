// La portada al día (U-36): portadas.mjs lee el lema y los pasos de un game.js del laboratorio y
// reconoce qué juegos toca un PR. Lo prueba contra los juegos de verdad del laboratorio.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portadaDe, juegosTocados } from './portadas.mjs';

for (const slug of ['agents', 'paint-mines', 'routes']) {
  const { lema, pasos } = portadaDe(readFileSync(new URL(`../../public/labs/${slug}/game.js`, import.meta.url), 'utf8'));
  assert.ok(lema && lema.length > 10, `${slug}: sin lema`);
  assert.ok(pasos.length >= 2 && pasos.length <= 3, `${slug}: ${pasos.length} pasos (U-18: hasta 3)`);
}
assert.deepEqual(juegosTocados(['public/labs/routes/game.js', 'public/labs/routes/style.css', 'docs/x.md', 'public/cup/games/queens/ui.js']),
  { labs: ['routes'], otros: ['queens'] });
assert.deepEqual(juegosTocados(['README.md']), { labs: [], otros: [] });
console.log('✓ portadas (U-36)');
