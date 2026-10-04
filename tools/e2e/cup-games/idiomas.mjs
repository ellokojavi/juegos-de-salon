// Los juegos sueltos de La Copa en todos los idiomas que se ofrecen (D-199): la antesala y el
// juego empezado de cada uno (Tango suma su tablero lleno y su choque), en cada idioma, contra el
// español. Uno nuevo en SUELTOS entra solo. Uso: node tools/e2e/cup-games/idiomas.mjs <carpeta-salida>
import { revisarIdiomas } from '../idiomas-comun.mjs';
import { SUELTOS } from '../../../public/assets/js/games.js';
import { IDIOMAS } from '../../../public/assets/js/i18n.js';
import { LOCALES } from '../../../public/cup/rules.js';

const OUT = process.argv[2] || '/tmp/idiomas-juegos-copa';
// Lo que el registro dice de cada uno (nombre y bajada) también se muestra en la antesala
const REGISTRO = Object.fromEntries(IDIOMAS.map(l => [l, Object.fromEntries(SUELTOS.map(m => [m.id, { name: m.name[l], tagline: m.tagline[l] }]))]));

let fallas = 0;
for (const [i, { id, slug }] of SUELTOS.entries()) {
  fallas += await revisarIdiomas(id, { dicts: [LOCALES, REGISTRO], port: 9470 + i, salida: `${OUT}/${slug}` });
}
console.log(fallas ? `✗ juegos de La Copa: ${fallas} chequeo(s) en rojo` : `juegos de La Copa: los ${SUELTOS.length} en todos los idiomas`);
