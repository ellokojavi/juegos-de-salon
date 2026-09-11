// Sin llegar a Firebase: el jugador tiene que enterarse, en su idioma (los tres), y con una salida (C-14, D-40).
// Se le corta la red a la base (no al sitio), que es como se ve quedarse sin señal o toparse
// con el tope de conexiones del plan gratuito.
import { launch, sleep } from './cdp.mjs';

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
  await b.go(`http://localhost:8765/${juego}/`);
  await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang','${lang}'); 1`);
  await b.go(`http://localhost:8765/${juego}/`);
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

const es = await intento('es', 'toque-y-fama', 'es');
const en = await intento('en', 'toque-y-fama', 'en');
const pt = await intento('pt', 'toque-y-fama', 'pt');
const ldt = await intento('es', 'linea-de-tiempo', 'ldt');
const bn = await intento('es', 'batalla-naval', 'bn');

const ok = t => t && !/Hay internet|Is there internet|Tem internet/.test(t) && /celular|phone/.test(t);
console.log('\n--- resumen ---');
console.log('es: mensaje nuevo, no el genérico →', ok(es));
console.log('en: traducido, no el genérico   →', ok(en) && /Couldn/.test(en));
console.log('pt: traducido, no el genérico   →', ok(pt) && /Não foi possível abrir/.test(pt));
console.log('línea de tiempo                 →', ok(ldt));
console.log('batalla naval                   →', ok(bn));
console.log('errors:', JSON.stringify(b.errors));
console.log('logs:', JSON.stringify(b.logs.filter(l => !/firebaseio|net::ERR_BLOCKED/.test(l))));
b.close();
