// Sin llegar a Firebase: el jugador tiene que enterarse, en su idioma (todos los que se ofrecen:
// D-199), y con una salida (C-14, D-40).
// Se le corta la red a la base (no al sitio), que es como se ve quedarse sin señal o toparse
// con el tope de conexiones del plan gratuito.
import { launch, sleep } from './cdp.mjs';
import { LANGS } from '../../public/assets/js/i18n.js';
import { gameById } from '../../public/assets/js/games.js';
import { LOCALES as TYF } from '../../public/bulls-and-cows/rules.js';
import { LOCALES as LDT } from '../../public/timeline/rules.js';
import { LOCALES as BN } from '../../public/battleship/rules.js';
import { LOCALES as AH } from '../../public/hangman/rules.js';
import { LOCALES as DU } from '../../public/liars-dice/rules.js';
// Con varias sesiones a la vez, cada una sirve su copia en su puerto (D-135)
const SITIO = process.env.SITIO || 'http://localhost:8765';

const OUT = process.argv[2];
const b = await launch({ port: 9442, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });

await b.send('Network.enable');

// Bloquear por URL no sirve: el canal de RTDB es un WebSocket y se cuela igual. Se emula la
// red caída, pero recién **después** de precargar el módulo del transporte; si no, lo que
// falla es la descarga del SDK desde gstatic y nunca se llega a probar la espera de conexión.
const red = al => b.send('Network.emulateNetworkConditions', {
  offline: !al, latency: 0, downloadThroughput: al ? -1 : 0, uploadThroughput: al ? -1 : 0,
});

const error = () => b.evaluate(`document.querySelector('#setup-error')?.textContent || ''`);
const botonVivo = () => b.evaluate(`(()=>{const b=document.querySelector('#setup-actions .btn');return !!b && !b.disabled})()`);

async function intento(lang, juego, etiqueta) {
  await red(true);
  const ruta = gameById(juego).path;
  await b.go(`${SITIO}/${ruta}`);
  await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang','${lang}'); 1`);
  await b.go(`${SITIO}/${ruta}`);
  const precarga = await b.evaluate(`import('../assets/js/transport/firebase.js').then(()=>'ok',e=>'falló: '+e)`);
  console.log(`${etiqueta} · SDK precargado:`, precarga);
  await red(false);
  await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
  await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
  await b.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`);

  // A los 3 s todavía no se rinde: la espera de conexión son 8 s.
  await sleep(3000);
  console.log(`${etiqueta} · a los 3 s sigue esperando:`, JSON.stringify(await error()) === '""');

  for (let i = 0; i < 20 && !(await error()); i++) await sleep(1000);
  const texto = await error();
  console.log(`${etiqueta} · mensaje:`, JSON.stringify(texto));
  console.log(`${etiqueta} · el botón vuelve a estar usable:`, await botonVivo());
  console.log(`${etiqueta} · pantalla:`, await b.active());
  await b.shot(`sala-error-${etiqueta}`);
  return texto;
}

/**
 * Toque y Fama en cada idioma; los demás juegos, uno cada uno, repartidos entre los idiomas: el
 * texto sale de `errText` (transport/errors.js), que es uno solo para todos los juegos. Lo que se
 * espera es el `errOffline` de su diccionario, no el genérico `errNet` ("¿Hay internet?").
 */
const casos = [
  ...LANGS.map(lang => ['toque-y-fama', TYF, lang]),
  ['linea-de-tiempo', LDT], ['batalla-naval', BN], ['ahorcado', AH],
  ['dudo', Object.fromEntries(Object.entries(DU).map(([l, d]) => [l, d.ui]))],   // Dudo los guarda en `ui`
].map(([juego, L, lang], i) => [juego, L, lang || LANGS[(i + 1) % LANGS.length]]);

const resultados = [];
for (const [juego, L, lang] of casos) resultados.push([juego, L, lang, await intento(lang, juego, `${juego}-${lang}`)]);

console.log('\n--- resumen ---');
for (const [juego, L, lang, texto] of resultados) {
  const bien = texto === L[lang].errOffline;
  console.log(`${bien ? '✓' : '✗'} ${juego} (${lang}): ${bien ? 'el mensaje de sala que no abre, traducido' : `esperaba ${JSON.stringify(L[lang].errOffline.slice(0, 50))}…`}`);
  if (!bien) process.exitCode = 1;
}
console.log('errors:', JSON.stringify(b.errors));
console.log('logs:', JSON.stringify(b.logs.filter(l => !/firebaseio|net::ERR_BLOCKED/.test(l))));
b.close();
