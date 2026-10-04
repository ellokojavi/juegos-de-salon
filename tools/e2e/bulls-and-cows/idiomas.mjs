// Toque y Fama en todos los idiomas que se ofrecen (D-199): cada pantalla de caminos.mjs, en cada uno,
// contra el español. Uso: node tools/e2e/bulls-and-cows/idiomas.mjs <carpeta-salida>
import { revisarIdiomas } from '../idiomas-comun.mjs';
import { LOCALES } from '../../../public/bulls-and-cows/rules.js';

await revisarIdiomas('toque-y-fama', { dicts: [LOCALES], port: 9464 });
