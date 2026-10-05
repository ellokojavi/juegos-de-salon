// La app instalable (D-220): en cada página con manifest, Chrome registra /sw.js con alcance en la
// raíz, lee el manifest sin errores y no encuentra nada que impida instalar la app.
// Con SITIO apuntando a una copia estampada (set-version.py --sitio) prueba también el import map.
import { launch, sleep } from './cdp.mjs';
const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2];
const mal = msg => { console.log(`✗ ${msg}`); process.exitCode = 1; };
const b = await launch({ port: 9496, dir: `${OUT}/p`, out: OUT });

const PAGINAS = ['/', '/hangman/', '/cup/', '/cup/suelto/?practica=conexiones', '/records/'];

for (const ruta of PAGINAS) {
  await b.go(`${SITIO}${ruta}`, 1500);
  const sw = await b.evaluate(`(async () => {
    const r = await Promise.race([navigator.serviceWorker.ready, new Promise(ok => setTimeout(() => ok(null), 4000))]);
    return r ? { alcance: new URL(r.scope).pathname, script: new URL(r.active.scriptURL).pathname } : null;
  })()`);
  if (!sw) { mal(`${ruta}: no se registró el service worker`); continue; }
  if (sw.alcance !== '/' || sw.script !== '/sw.js') mal(`${ruta}: service worker ${JSON.stringify(sw)}, se esperaba /sw.js con alcance /`);
  const manifest = (await b.send('Page.getAppManifest')).result || {};
  if (!manifest.url?.endsWith('/manifest.webmanifest')) mal(`${ruta}: Chrome no encontró el manifest`);
  if (manifest.errors?.length) mal(`${ruta}: errores en el manifest: ${JSON.stringify(manifest.errors)}`);
  const inst = (await b.send('Page.getInstallabilityErrors')).result?.installabilityErrors || [];
  if (inst.length) mal(`${ruta}: Chrome no la deja instalar: ${inst.map(e => e.errorId).join(', ')}`);
  console.log(`${ruta.padEnd(36)} → sw ${sw.script} (alcance ${sw.alcance}) · instalable: ${inst.length ? 'no' : 'sí'}`);
}

await sleep(200);
if (b.errors.length) mal(`errores de la página: ${JSON.stringify(b.errors)}`);
b.close();
if (!process.exitCode) console.log('✓ la app se puede instalar desde todas las páginas probadas');
