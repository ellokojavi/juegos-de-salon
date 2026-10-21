// La pantalla de La Copa terminada, entera de arriba abajo, para la escena de La Copa.
//   node copa.mjs   → plays/copa-larga.png (la demo «podio» del laboratorio, con el almacén de prueba)
import { abrir, SITIO } from './navegador.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const LANG = process.env.LANG_PROMO || 'es', PLAYS_DIR = LANG === 'es' ? 'plays' : `plays-${LANG}`;
fs.mkdirSync(path.join(dir, PLAYS_DIR), { recursive: true });
const b = await abrir();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.goto(SITIO + '/'); await p.evaluate(l => { localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', l); }, LANG);
await p.goto(SITIO + '/cup/?test&labs&demo=podium'); await p.waitForTimeout(4000);
// El fondo de la app está fijo a la pantalla (background-attachment: fixed, y las partículas en
// position: fixed): en la captura de la página entera cubría solo los primeros 844 px y, al bajar
// en el video, se veía como un brillo pegado arriba. La captura va con el fondo liso.
await p.addStyleTag({ content: 'body{background-image:none!important}.bg-sparkles{display:none!important}' }); await p.waitForTimeout(300);
await p.screenshot({ path: path.join(dir, PLAYS_DIR, 'copa-larga.png'), fullPage: true });
await b.close();
console.log('listo plays/copa-larga.png');
