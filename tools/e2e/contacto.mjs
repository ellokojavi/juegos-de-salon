/**
 * Hoja de contacto: todas las capturas del README, juntas, para mirarlas antes de publicar.
 *
 *   node tools/e2e/contacto.mjs                 # una hoja por sección
 *   node tools/e2e/contacto.mjs cuarto-rey      # solo esa sección
 *   node tools/e2e/contacto.mjs --salida /tmp/contacto
 *
 * Por qué existe: las capturas se rehacen solas (`tools/readme.py capturas`), pero nadie las
 * mira una por una, y así se publicó una lista de jugadores congelada a mitad de animación,
 * con las filas a distintas escalas (D-76). Puestas en fila y al tamaño en que el README las
 * muestra, un ancho distinto o una pantalla que no corresponde al pie saltan a la vista.
 *
 * No reemplaza al ojo: arma la hoja y la deja en un PNG. Mirarla es el trabajo.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';

const args = process.argv.slice(2);
const flag = (n, def) => { const i = args.indexOf('--' + n); return i < 0 ? def : args[i + 1]; };
const salida = flag('salida', '/tmp/contacto');
const pedidas = args.filter(a => !a.startsWith('--') && a !== salida);

const RAIZ = new URL('../../', import.meta.url).pathname;
const { capturas } = JSON.parse(readFileSync(`${RAIZ}docs/capturas.json`, 'utf8'));
const secciones = [...new Set(capturas.map(c => c.seccion))].filter(s => !pedidas.length || pedidas.includes(s));
if (!secciones.length) { console.error(`No conozco esas secciones. Hay: ${[...new Set(capturas.map(c => c.seccion))].join(', ')}`); process.exit(1); }

mkdirSync(salida, { recursive: true });
const ANCHO_FICHA = 200;   // el README muestra la galería a 180 px: se mira como se va a ver
const b = await launch({ port: 9461, dir: `${salida}/perfil`, out: salida, width: 1200, height: 900 });

for (const seccion of secciones) {
  const fichas = capturas.filter(c => c.seccion === seccion);
  const html = `<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; padding: 18px; background: #11061f; color: #fff;
           font: 13px -apple-system, system-ui, sans-serif; }
    h1 { font-size: 16px; margin: 0 0 14px; letter-spacing: .04em; text-transform: uppercase; opacity: .8; }
    .hoja { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; }
    figure { margin: 0; width: ${ANCHO_FICHA}px; }
    img { width: 100%; display: block; border-radius: 10px; background: #000; }
    figcaption { margin-top: 6px; opacity: .75; line-height: 1.3; }
    b { display: block; opacity: .55; font-weight: 600; font-size: 11px; }
  </style><h1>${seccion} · ${fichas.length} capturas</h1><div class="hoja">${
    fichas.map(f => `<figure><img src="file://${RAIZ}${f.imagen}"><figcaption>${f.pie}<b>${f.toma}</b></figcaption></figure>`).join('')
  }</div>`;
  const archivo = `${salida}/${seccion}.html`;
  writeFileSync(archivo, html);
  await b.go(`file://${archivo}`, 900);
  const alto = await b.evaluate(`document.documentElement.scrollHeight`);
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: alto, deviceScaleFactor: 1, mobile: false });
  await sleep(400);
  await b.shot(`contacto-${seccion}`);
  console.log(`${salida}/contacto-${seccion}.png · ${fichas.length} capturas`);
}
b.close();
