// The home page share button (D-226, D-242): in every language it opens a sheet with the vertical
// video, in a Spanish and an English tab (Spanish opens on Spanish, every other language on English),
// playing on its own, and two options (D-253, D-410). In each
// language, the invitation sends, with a phone that shares files, that language's social card along
// with the text, and "Compartir el video" sends the video's text with its YouTube link; on a
// computer, only the copied text and nothing downloaded.
// Usage: node tools/e2e/share-home.mjs /tmp/share-home
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output('/tmp/share-home');
const b = await launch({ dir: `${OUT}/p`, out: OUT });
let bad = 0;
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) bad++; };
const EXPECTED = {
  es: { photo: 'menu.jpg', head: '🎲 *Juegos de Salón* · ', file: 'juegos-de-salon.jpg' },
  en: { photo: 'menu-en.jpg', head: '🎲 *Party Games* · ', file: 'party-games.jpg' },
  pt: { photo: 'menu-pt.jpg', head: '🎲 *Jogos de Salão* · ', file: 'jogos-de-salao.jpg' },
  de: { photo: 'menu-de.jpg', head: '🎲 *Salonspiele* · ', file: 'salonspiele.jpg' },
};
// A phone that shares files: keeps what reached the menu and how many cards were requested
const PHONE = `(() => {
  window.__fotos = performance.getEntriesByType('resource').filter(e => /assets\\/og\\//.test(e.name)).map(e => e.name);
  navigator.canShare = d => true;
  navigator.share = async d => { window.__menu = { text: d.text, files: (d.files || []).map(f => ({ name: f.name, type: f.type, size: f.size })) }; };
  return 1;
})()`;
for (const [lang, e] of Object.entries(EXPECTED)) {
  await b.go(`${SITE}/?lang=${lang}`, 1500);
  await b.evaluate(PHONE);
  // The photo is fetched on tap, if it wasn't fetched before; the tap waits for it
  await b.evaluate(`document.querySelector('#share-slot button').click(); 1`); await sleep(500);
  // The sheet, on its language's tab, with that tab's Short playing muted (D-410)
  const tab = lang === 'es' ? 'es' : 'en', other = tab === 'es' ? 'en' : 'es';
  const ID = { es: 'zM9v2UwEsM8', en: 'UubTGcUoQD8' };
  const v0 = await b.evaluate(`JSON.stringify({ on: document.querySelector('#hoja-compartir .hoja-pestana.on')?.dataset.k, src: document.querySelector('#hoja-compartir iframe')?.src })`).then(JSON.parse);
  check(v0.on === tab && v0.src?.includes(`/embed/${ID[tab]}?`) && /autoplay=1/.test(v0.src) && /mute=1/.test(v0.src), `${lang}: the sheet opens on the ${tab} tab, its Short autoplaying muted`);
  await b.evaluate(`window.__menu = null; document.getElementById('btn-compartir-video').click(); 1`); await sleep(600);
  const v = await b.evaluate(`JSON.stringify(window.__menu || null)`).then(JSON.parse);
  check(v && v.text.startsWith('🎬 ') && v.text.trim().split('\n').pop() === `🔗 https://youtube.com/shorts/${ID[tab]}` && !v.files.length, `${lang}: "share the video" sends its text with the tab's Short at the end (${v?.text?.split('\n').pop()})`);
  // The other tab: its Short plays and is the one shared
  await b.evaluate(`document.getElementById('pestana-video-${other}').click(); 1`); await sleep(400);
  const v1 = await b.evaluate(`JSON.stringify({ on: document.querySelector('#hoja-compartir .hoja-pestana.on')?.dataset.k, src: document.querySelector('#hoja-compartir iframe')?.src, sel: document.getElementById('pestana-video-${other}').getAttribute('aria-selected') })`).then(JSON.parse);
  await b.evaluate(`window.__menu = null; document.getElementById('btn-compartir-video').click(); 1`); await sleep(600);
  const v2 = await b.evaluate(`JSON.stringify(window.__menu || null)`).then(JSON.parse);
  check(v1.on === other && v1.sel === 'true' && v1.src?.includes(`/embed/${ID[other]}?`) && v2?.text.trim().endsWith(`https://youtube.com/shorts/${ID[other]}`), `${lang}: the ${other} tab plays and shares its own Short`);
  await b.evaluate(`window.__menu = null; document.getElementById('btn-invitar-portada').click(); 1`); await sleep(1200);
  const m = await b.evaluate(`JSON.stringify(window.__menu || null)`).then(JSON.parse);
  check(m, `${lang}: the invite option opens the system menu`);
  if (!m) continue;
  check(m.files.length === 1 && m.files[0].name === e.file && m.files[0].type === 'image/jpeg' && m.files[0].size > 50000, `${lang}: the card goes as an image (${JSON.stringify(m.files[0])})`);
  const photos = await b.evaluate(`JSON.stringify(performance.getEntriesByType('resource').filter(e => /assets\\/og\\//.test(e.name)).map(e => e.name.split('/').pop()))`).then(JSON.parse);
  check(photos.length === 1 && photos[0] === e.photo, `${lang}: the card is its language's (${photos.join(', ')})`);
  check(m.text.startsWith(e.head) && /\d+/.test(m.text.split('\n')[0]), `${lang}: the text opens with the header and how many games there are`);
  const link = m.text.trim().split('\n').pop();
  check(link === `🔗 https://juegosdesalon.cl/${lang === 'es' ? '' : `${lang}/`}?from=link`, `${lang}: the link to the language's home page, only on the last line (${link})`);
  console.log(m.text.replace(/^/gm, '    '));
}
// A computer: no menu, the text gets copied, the button says ✅ and no image is fetched.
// Headless Chrome does have navigator.canShare: it is removed before the page loads, or the
// home page fetches the card ahead of time and the image count comes out wrong
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: 'navigator.canShare = undefined; navigator.share = undefined;' });
await b.go(`${SITE}/?lang=es`, 1500);
await b.evaluate(`(() => { navigator.canShare = undefined; navigator.share = undefined; window.__copiado = null;
  navigator.clipboard.writeText = async t => { window.__copiado = t; };
  window.__descargas = 0; const c = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) window.__descargas++; else c.call(this); };
  return 1; })()`);
await b.evaluate(`(() => { const x = document.querySelector('#share-slot button'); x.focus(); x.click(); return 1; })()`); await sleep(400);
await b.evaluate(`document.getElementById('btn-invitar-portada').click(); 1`); await sleep(600);
const pc = await b.evaluate(`JSON.stringify({ copied: window.__copiado, downloads: window.__descargas, button: document.querySelector('#btn-invitar-portada b').textContent, photos: performance.getEntriesByType('resource').filter(e => /assets\\/og\\//.test(e.name)).length })`).then(JSON.parse);
check(pc.copied?.startsWith('🎲 *Juegos de Salón*') && pc.button === '✅ Copiado', `computer: the text gets copied and the option says ✅ Copiado (${pc.button})`);
await b.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); 1`); await sleep(200);
check(await b.evaluate(`!document.getElementById('hoja-compartir') && document.activeElement?.id === 'btn-compartir-portada'`), 'Escape closes the sheet and focus goes back to the button');
check(pc.downloads === 0 && pc.photos === 0, 'computer: no image is fetched or downloaded');
check(!b.errors.length, `no console errors ${JSON.stringify(b.errors)}`);
b.close();
if (bad) process.exit(1);
