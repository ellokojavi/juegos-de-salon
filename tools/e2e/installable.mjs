// The installable app (D-221): on every page with a manifest, Chrome registers /sw.js with its
// scope at the root, reads the manifest without errors and finds nothing that prevents installing
// the app. And the app is named as in the chosen language, in the manifest and for the iPhone (D-222).
// With SITE pointing at a stamped copy (set-version.py --site) it also tests the import map.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
// Without an output folder it uses a temporary one: so no Chrome profile is left in `undefined/`
const OUT = output();
const bad = msg => { console.log(`✗ ${msg}`); process.exitCode = 1; };
const b = await launch({ port: 9496, dir: `${OUT}/p`, out: OUT });

import { COMMON, IDIOMAS } from '../../public/assets/js/i18n.js';
const PAGES = ['/', '/hangman/', '/cup/', '/cup/suelto/?practice=agents', '/records/'];

/** The name the app would be installed with: the one in the manifest Chrome read and the iPhone's. */
const names = async () => {
  const m = (await b.send('Page.getAppManifest')).result || {};
  let data = {};
  try { data = JSON.parse(m.data || '{}'); } catch (_) { /* stays empty */ }
  const iphone = await b.evaluate(`document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content || ''`);
  return { url: m.url || '', name: data.name, short: data.short_name, iphone };
};

for (const route of PAGES) {
  await b.go(`${SITE}${route}`, 1500);
  const sw = await b.evaluate(`(async () => {
    const r = await Promise.race([navigator.serviceWorker.ready, new Promise(ok => setTimeout(() => ok(null), 4000))]);
    return r ? { scope: new URL(r.scope).pathname, script: new URL(r.active.scriptURL).pathname } : null;
  })()`);
  if (!sw) { bad(`${route}: the service worker was not registered`); continue; }
  if (sw.scope !== '/' || sw.script !== '/sw.js') bad(`${route}: service worker ${JSON.stringify(sw)}, expected /sw.js with scope /`);
  const manifest = (await b.send('Page.getAppManifest')).result || {};
  if (!/\/manifest(\.\w+)?\.webmanifest$/.test(manifest.url || '')) bad(`${route}: Chrome didn't find the manifest`);
  if (manifest.errors?.length) bad(`${route}: errors in the manifest: ${JSON.stringify(manifest.errors)}`);
  const inst = (await b.send('Page.getInstallabilityErrors')).result?.installabilityErrors || [];
  if (inst.length) bad(`${route}: Chrome doesn't let it be installed: ${inst.map(e => e.errorId).join(', ')}`);
  console.log(`${route.padEnd(36)} → sw ${sw.script} (scope ${sw.scope}) · installable: ${inst.length ? 'no' : 'yes'}`);
}

// The name in each language, on the home page and in a game: the language is chosen with ?lang= (D-74)
for (const lang of IDIOMAS) {
  for (const route of ['/', '/hangman/']) {
    await b.go(`${SITE}${route}?lang=${lang}`, 1500);
    const expected = COMMON[lang].appTitle;
    // instalable.js changes the manifest on load, and Chrome reads it again a little later: it
    // waits up to 5 s for it to have it (when installing, the person taps the button much later)
    let n = await names();
    for (let i = 0; i < 10 && n.name !== expected; i++) { await sleep(500); n = await names(); }
    console.log(`${lang} ${route.padEnd(10)} → ${n.url.split('/').pop()} · ${n.name} / ${n.short} · iPhone: ${n.iphone}`);
    if (n.name !== expected || n.short !== expected || n.iphone !== expected) bad(`${lang} ${route}: the app would be named "${n.name}" / "${n.short}" / "${n.iphone}", and must be named "${expected}"`);
  }
}
await b.go(`${SITE}/?lang=es`, 800);

await sleep(200);
if (b.errors.length) bad(`page errors: ${JSON.stringify(b.errors)}`);
b.close();
if (!process.exitCode) console.log('✓ the app can be installed from every page tested');
