// El idioma que viene en el link (D-74): /?lang=pt, la puerta /pt/, y la invitación a una sala
// que llega en el idioma de quien la mandó. Sin red: no se abre ninguna sala de verdad.
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9495, dir: `${OUT}/p`, out: OUT });
const SITIO = 'http://localhost:8765';

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
await limpio('/?lang=pt');
console.log('/?lang=pt           →', JSON.stringify(await mirar()));
await limpio('/?lang=en');
console.log('/?lang=en           →', JSON.stringify(await mirar()));

/* 3. Un idioma que no existe no cambia nada */
await limpio('/?lang=fr');
console.log('/?lang=fr (no está) →', JSON.stringify(await mirar()));

/* 4. La puerta de entrada: /pt/ deja elegido el idioma y manda a la portada */
await limpio('/pt/');
await sleep(1200);
console.log('/pt/                →', JSON.stringify(await mirar()));
await limpio('/en/');
await sleep(1200);
console.log('/en/                →', JSON.stringify(await mirar()));

/* 5. Queda guardado: la visita siguiente, sin nada en el link, sigue en ese idioma */
await b.go(`${SITIO}/`, 1500);
console.log('y a la vuelta       →', JSON.stringify(await mirar()));

/* 6. La invitación a una sala llega en el idioma de quien la mandó */
await limpio('/dudo/?sala=WFBN&lang=pt');
console.log('sala con idioma     →', await b.evaluate(`JSON.stringify({
  lang: document.documentElement.lang,
  url: location.pathname + location.search,
  titulo: document.querySelector('#screen-setup h2')?.textContent,
  codigo: document.querySelector('#setup-actions input.code')?.value,
})`));

/* 7. Y el link que arma el juego para compartir lleva el idioma pegado */
console.log('link que se comparte→', await b.evaluate(`(async () => {
  const { withLang } = await import('/assets/js/i18n.js');
  return withLang('https://juegosdesalon.cl/dudo/?sala=WFBN');
})()`));

/* 8. La invitación a una copa en otro idioma (D-170): el link sigue llevando a la copa. Sacar el
   lang= no puede tocar el resto (antes `?K7Q2X&lang=pt` quedaba en `?K7Q2X=` y abría la portada) */
await b.go(`${SITIO}/copa/?prueba&demo=invitado`, 2500);
const copa = await b.evaluate('__copa.estado.code');
await b.go(`${SITIO}/copa/?prueba&${copa}&lang=pt`, 2500);
const inv = JSON.parse(await b.evaluate(`JSON.stringify({ lang: document.documentElement.lang, url: location.search, pantalla: __copa.estado.pantalla })`));
console.log('copa con idioma     →', JSON.stringify(inv));
if (inv.pantalla !== 'entrar' || inv.lang !== 'pt' || inv.url !== `?prueba&${copa}`) { console.log('✗ la invitación a una copa con ?lang= no abre la copa'); process.exitCode = 1; }

console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs.filter(l => !/vibrate/i.test(l))));
b.close();
