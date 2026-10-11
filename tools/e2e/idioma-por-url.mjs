// El idioma que viene en el link (D-74), en todos los que se ofrecen (D-199): /?lang=pt, la puerta /pt/, y la invitación a una sala
// que llega en el idioma de quien la mandó. Sin red: no se abre ninguna sala de verdad.
import { launch, sleep } from './cdp.mjs';
import { LANGS } from '../../public/assets/js/i18n.js';
const OTROS = LANGS.filter(l => l !== 'es');   // todos los que se ofrecen (D-199)
const mal = msg => { console.log(`✗ ${msg}`); process.exitCode = 1; };
const OUT = process.argv[2];
const b = await launch({ port: 9495, dir: `${OUT}/p`, out: OUT });
const SITIO = process.env.SITIO || 'http://localhost:8765';

const mirar = () => b.evaluate(`JSON.stringify({
  lang: document.documentElement.lang,
  guardado: localStorage.getItem('juegos-de-salon:lang'),
  url: location.pathname + location.search,
  titulo: document.querySelector('.hero .display, .intro-hero .display')?.textContent?.trim(),
  bajada: document.querySelector('.hero .sub')?.textContent?.trim().slice(0, 40),
})`).then(JSON.parse);

const limpio = async ruta => { await b.go(`${SITIO}/`, 800); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITIO}${ruta}`, 1600); };

/* 1. Sin nada en el link, español (D-47) */
await limpio('/');
console.log('portada pelada      →', JSON.stringify(await mirar()));

/* 2. El idioma pedido en la URL, y la URL queda limpia */
for (const lang of OTROS) {
  await limpio(`/?lang=${lang}`);
  const m = await mirar();
  console.log(`/?lang=${lang}`.padEnd(20) + '→', JSON.stringify(m));
  if (m.lang !== lang || m.guardado !== lang || m.url !== '/') mal(`/?lang=${lang} no deja la portada en ${lang} con la URL limpia`);
}

/* 3. Un idioma que no existe no cambia nada */
await limpio('/?lang=fr');
console.log('/?lang=fr (no está) →', JSON.stringify(await mirar()));

/* 4. La puerta de entrada de cada idioma (/pt/, /en/, /de/…) lo deja elegido y manda a la portada */
for (const ruta of OTROS.map(l => `/${l}/`)) {
  const lang = ruta.split('/').at(-2);
  await limpio(ruta);
  await sleep(1600);
  const m = await mirar();
  console.log(`${ruta.padEnd(20)}→`, JSON.stringify(m));
  if (m.lang !== lang || m.guardado !== lang || m.url !== '/') mal(`${ruta} no deja la app en ${lang} en la portada`);
}

/* 5. Queda guardado: la visita siguiente, sin nada en el link, sigue en ese idioma */
await b.go(`${SITIO}/`, 1500);
console.log('y a la vuelta       →', JSON.stringify(await mirar()));

/* 6. La invitación a una sala llega en el idioma de quien la mandó */
for (const lang of OTROS) {
  await limpio(`/liars-dice/?room=WFBN&lang=${lang}`);
  const sala = JSON.parse(await b.evaluate(`JSON.stringify({
    lang: document.documentElement.lang,
    url: location.pathname + location.search,
    titulo: document.querySelector('#screen-setup h2')?.textContent,
    codigo: document.querySelector('#setup-actions input.code')?.value,
  })`));
  console.log(`sala en ${lang}`.padEnd(20) + '→', JSON.stringify(sala));
  if (sala.lang !== lang || sala.url !== '/liars-dice/?room=WFBN') mal(`la invitación a una sala con ?lang=${lang} no llega en ${lang}`);
}

/* 6b. Una invitación de antes de D-266 (`?sala=`) entra igual, y la barra queda en inglés */
await limpio('/liars-dice/?sala=WFBN&lang=pt');
{
  const vieja = await b.evaluate(`location.pathname + location.search`);
  console.log('sala con ?sala='.padEnd(20) + '→', vieja);
  if (vieja !== '/liars-dice/?room=WFBN') mal(`la invitación vieja con ?sala= no queda en ?room= (${vieja})`);
}

/* 7. Y el link que arma el juego para compartir lleva el idioma pegado */
console.log('link que se comparte→', await b.evaluate(`(async () => {
  const { withLang } = await import('/assets/js/i18n.js');
  return withLang('https://juegosdesalon.cl/liars-dice/?room=WFBN');
})()`));

/* 8. La invitación a una copa en otro idioma (D-170): el link sigue llevando a la copa. Sacar el
   lang= no puede tocar el resto (antes `?K7Q2X&lang=pt` quedaba en `?K7Q2X=` y abría la portada) */
await b.go(`${SITIO}/cup/?test&demo=guest`, 2500);
const copa = await b.evaluate('__copa.estado.code');
for (const lang of OTROS) {
  await b.go(`${SITIO}/cup/?test&${copa}&lang=${lang}`, 2500);
  const inv = JSON.parse(await b.evaluate(`JSON.stringify({ lang: document.documentElement.lang, url: location.search, pantalla: __copa.estado.pantalla })`));
  console.log(`copa en ${lang}`.padEnd(20) + '→', JSON.stringify(inv));
  if (inv.pantalla !== 'entrar' || inv.lang !== lang || inv.url !== `?test&${copa}`) mal(`la invitación a una copa con ?lang=${lang} no abre la copa`);
}

console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs.filter(l => !/vibrate/i.test(l))));
b.close();
