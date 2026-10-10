// La app instalable (D-221): en cada página con manifest, Chrome registra /sw.js con alcance en la
// raíz, lee el manifest sin errores y no encuentra nada que impida instalar la app. Y la app se llama
// como en el idioma elegido, en el manifest y para el iPhone (D-222).
// Con SITIO apuntando a una copia estampada (set-version.py --sitio) prueba también el import map.
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, sleep } from './cdp.mjs';
const SITIO = process.env.SITIO || 'http://localhost:8765';
// Sin carpeta de salida usa una temporal: así no queda un perfil de Chrome en `undefined/`
const OUT = process.argv[2] || mkdtempSync(join(tmpdir(), 'instalable-'));
const mal = msg => { console.log(`✗ ${msg}`); process.exitCode = 1; };
const b = await launch({ port: 9496, dir: `${OUT}/p`, out: OUT });

import { COMMON, IDIOMAS } from '../../public/assets/js/i18n.js';
const PAGINAS = ['/', '/hangman/', '/cup/', '/cup/suelto/?practice=connections', '/records/'];

/** El nombre con que se instalaría la app: el del manifest que Chrome leyó y el del iPhone. */
const nombres = async () => {
  const m = (await b.send('Page.getAppManifest')).result || {};
  let datos = {};
  try { datos = JSON.parse(m.data || '{}'); } catch (_) { /* queda vacío */ }
  const iphone = await b.evaluate(`document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content || ''`);
  return { url: m.url || '', name: datos.name, short: datos.short_name, iphone };
};

for (const ruta of PAGINAS) {
  await b.go(`${SITIO}${ruta}`, 1500);
  const sw = await b.evaluate(`(async () => {
    const r = await Promise.race([navigator.serviceWorker.ready, new Promise(ok => setTimeout(() => ok(null), 4000))]);
    return r ? { alcance: new URL(r.scope).pathname, script: new URL(r.active.scriptURL).pathname } : null;
  })()`);
  if (!sw) { mal(`${ruta}: no se registró el service worker`); continue; }
  if (sw.alcance !== '/' || sw.script !== '/sw.js') mal(`${ruta}: service worker ${JSON.stringify(sw)}, se esperaba /sw.js con alcance /`);
  const manifest = (await b.send('Page.getAppManifest')).result || {};
  if (!/\/manifest(\.\w+)?\.webmanifest$/.test(manifest.url || '')) mal(`${ruta}: Chrome no encontró el manifest`);
  if (manifest.errors?.length) mal(`${ruta}: errores en el manifest: ${JSON.stringify(manifest.errors)}`);
  const inst = (await b.send('Page.getInstallabilityErrors')).result?.installabilityErrors || [];
  if (inst.length) mal(`${ruta}: Chrome no la deja instalar: ${inst.map(e => e.errorId).join(', ')}`);
  console.log(`${ruta.padEnd(36)} → sw ${sw.script} (alcance ${sw.alcance}) · instalable: ${inst.length ? 'no' : 'sí'}`);
}

// El nombre en cada idioma, en la portada y en un juego: el idioma se elige con ?lang= (D-74)
for (const lang of IDIOMAS) {
  for (const ruta of ['/', '/hangman/']) {
    await b.go(`${SITIO}${ruta}?lang=${lang}`, 1500);
    const esperado = COMMON[lang].appTitle;
    // instalable.js cambia el manifest al cargar, y Chrome lo vuelve a leer un poco después: se
    // espera hasta 5 s a que lo tenga (al instalar, la persona toca el botón mucho más tarde)
    let n = await nombres();
    for (let i = 0; i < 10 && n.name !== esperado; i++) { await sleep(500); n = await nombres(); }
    console.log(`${lang} ${ruta.padEnd(10)} → ${n.url.split('/').pop()} · ${n.name} / ${n.short} · iPhone: ${n.iphone}`);
    if (n.name !== esperado || n.short !== esperado || n.iphone !== esperado) mal(`${lang} ${ruta}: la app se llamaría "${n.name}" / "${n.short}" / "${n.iphone}", y debe llamarse "${esperado}"`);
  }
}
await b.go(`${SITIO}/?lang=es`, 800);

await sleep(200);
if (b.errors.length) mal(`errores de la página: ${JSON.stringify(b.errors)}`);
b.close();
if (!process.exitCode) console.log('✓ la app se puede instalar desde todas las páginas probadas');
