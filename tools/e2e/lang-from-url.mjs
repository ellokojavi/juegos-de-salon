// The language that comes in the link (D-74), in every one offered (D-199): /?lang=pt, the /pt/
// gate, and the invitation to a room that arrives in the language of whoever sent it. No network:
// no real room is opened.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { LANGS } from '../../public/assets/js/i18n.js';
const OTHERS = LANGS.filter(l => l !== 'es');   // every one offered (D-199)
const bad = msg => { console.log(`✗ ${msg}`); process.exitCode = 1; };
const OUT = output();
const b = await launch({ port: 9495, dir: `${OUT}/p`, out: OUT });
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';

const look = () => b.evaluate(`JSON.stringify({
  lang: document.documentElement.lang,
  saved: localStorage.getItem('juegos-de-salon:lang'),
  url: location.pathname + location.search,
  title: document.querySelector('.hero .display, .intro-hero .display')?.textContent?.trim(),
  tagline: document.querySelector('.hero .sub')?.textContent?.trim().slice(0, 40),
})`).then(JSON.parse);

const clean = async route => { await b.go(`${SITE}/`, 800); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}${route}`, 1600); };

/* 1. With nothing in the link, Spanish (D-47) */
await clean('/');
console.log('bare home page      →', JSON.stringify(await look()));

/* 2. The language asked for in the URL, and the URL stays clean */
for (const lang of OTHERS) {
  await clean(`/?lang=${lang}`);
  const m = await look();
  console.log(`/?lang=${lang}`.padEnd(20) + '→', JSON.stringify(m));
  if (m.lang !== lang || m.saved !== lang || m.url !== '/') bad(`/?lang=${lang} doesn't leave the home page in ${lang} with a clean URL`);
}

/* 3. A language that doesn't exist changes nothing */
await clean('/?lang=fr');
console.log('/?lang=fr (absent)  →', JSON.stringify(await look()));

/* 4. Each language's entry gate (/pt/, /en/…) leaves it chosen and sends to the home page */
for (const route of OTHERS.map(l => `/${l}/`)) {
  const lang = route.split('/').at(-2);
  await clean(route);
  await sleep(1600);
  const m = await look();
  console.log(`${route.padEnd(20)}→`, JSON.stringify(m));
  if (m.lang !== lang || m.saved !== lang || m.url !== '/') bad(`${route} doesn't leave the app in ${lang} on the home page`);
}
// German left the app (D-514): its door, a `?lang=de` link and a stored `de` open English
await clean('/de/'); await sleep(2200);
{ const m = await look(); console.log('/de/ (retired)      →', JSON.stringify(m)); if (m.lang !== 'en' || m.saved !== 'en') bad('/de/ does not open English'); }
await clean('/?lang=de');
{ const m = await look(); if (m.lang !== 'en' || m.saved !== 'en') bad('?lang=de does not open English'); }

/* 5. It stays saved: the next visit, with nothing in the link, stays in that language */
await b.go(`${SITE}/`, 1500);
console.log('and on coming back  →', JSON.stringify(await look()));

/* 6. The invitation to a room arrives in the language of whoever sent it */
for (const lang of OTHERS) {
  await clean(`/liars-dice/?room=WFBN&lang=${lang}`);
  const room = JSON.parse(await b.evaluate(`JSON.stringify({
    lang: document.documentElement.lang,
    url: location.pathname + location.search,
    title: document.querySelector('#screen-setup h2')?.textContent,
    code: document.querySelector('#setup-actions input.code')?.value,
  })`));
  console.log(`room in ${lang}`.padEnd(20) + '→', JSON.stringify(room));
  if (room.lang !== lang || room.url !== '/liars-dice/?room=WFBN') bad(`the invitation to a room with ?lang=${lang} doesn't arrive in ${lang}`);
}

/* 6b. An invitation from before D-266 (`?sala=`) still gets in, and the bar ends up in English */
await clean('/liars-dice/?sala=WFBN&lang=pt');
{
  const old = await b.evaluate(`location.pathname + location.search`);
  console.log('room with ?sala='.padEnd(20) + '→', old);
  if (old !== '/liars-dice/?room=WFBN') bad(`the old invitation with ?sala= doesn't end up as ?room= (${old})`);
}

/* 7. And the link the game builds to share carries the language */
console.log('shared link         →', await b.evaluate(`(async () => {
  const { withLang } = await import('/assets/js/i18n.js');
  return withLang('https://juegosdesalon.cl/liars-dice/?room=WFBN');
})()`));

/* 8. The invitation to a cup in another language (D-170): the link still leads to the cup. Removing
   lang= can't touch the rest (before, `?K7Q2X&lang=pt` ended up as `?K7Q2X=` and opened the home page) */
await b.go(`${SITE}/cup/?test&demo=guest`, 2500);
const cup = await b.evaluate('__copa.estado.code');
for (const lang of OTHERS) {
  await b.go(`${SITE}/cup/?test&${cup}&lang=${lang}`, 2500);
  const inv = JSON.parse(await b.evaluate(`JSON.stringify({ lang: document.documentElement.lang, url: location.search, screen: __copa.estado.pantalla })`));
  console.log(`cup in ${lang}`.padEnd(20) + '→', JSON.stringify(inv));
  if (inv.screen !== 'entrar' || inv.lang !== lang || inv.url !== `?test&${cup}`) bad(`the invitation to a cup with ?lang=${lang} doesn't open the cup`);
}

console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs.filter(l => !/vibrate/i.test(l))));
b.close();
