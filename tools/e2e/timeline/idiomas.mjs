// Línea de Tiempo en todos los idiomas que se ofrecen (D-199): cada pantalla de caminos.mjs, en cada uno,
// contra el español. Uso: node tools/e2e/timeline/idiomas.mjs <carpeta-salida>
import { revisarIdiomas } from '../idiomas-comun.mjs';
import { LOCALES } from '../../../public/timeline/rules.js';

await revisarIdiomas('linea-de-tiempo', { dicts: [LOCALES], port: 9465 });
