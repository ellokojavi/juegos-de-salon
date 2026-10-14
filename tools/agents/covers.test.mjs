// La portada al día (U-36): covers.mjs lee el lema y los pasos de un game.js del laboratorio y
// reconoce qué juegos toca un PR. Lo prueba contra los juegos de verdad del laboratorio.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portadaDe, juegosTocados, pasosResueltos, salidasDeLabs, etapa } from './covers.mjs';

for (const slug of ['agents', 'paint-mines', 'routes', 'exploding-numbers', 'plots']) {
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
// La etapa del PR (D-304): quién sale del laboratorio
const desenredo = `@@ -1,5 +1,4 @@ export const SUELTOS = [
   {
     id: 'desenredo',
     slug: 'untangle',
-    labs: true,
     duration: '2–5',`;
assert.deepEqual(salidasDeLabs(desenredo, ''), ['untangle']);
assert.deepEqual(salidasDeLabs("@@ -20,3 +20,3 @@\n-  zip: { emoji: '〰️', labs: true },\n+  zip: { emoji: '〰️' },", ''), ['zip']);
assert.deepEqual(salidasDeLabs('', 'R100\tpublic/labs/routes/game.js\tpublic/routes/game.js\nM\tpublic/index.html'), ['routes']);
assert.deepEqual(salidasDeLabs('', 'R090\tpublic/labs/routes/a.js\tpublic/labs/routes/b.js'), [], 'mudarse dentro del laboratorio no es salir');
assert.deepEqual(salidasDeLabs("@@ -1,3 +1,3 @@\n-    labs: true,\n+    labs: true,", ''), [], 'una línea que se reescribe igual no saca a nadie');
assert.equal(etapa(['public/labs/routes/game.js', 'public/labs/index.html', 'docs/games/routes.md'], []), 'laboratorio');
assert.equal(etapa(['public/labs/routes/game.js', 'public/assets/js/i18n.js'], []), 'sitio');
assert.equal(etapa(['public/assets/js/games.js'], ['untangle']), 'sale');
assert.equal(etapa(['docs/x.md'], []), 'sin-app');
console.log('✓ portadas (U-36, D-304)');
