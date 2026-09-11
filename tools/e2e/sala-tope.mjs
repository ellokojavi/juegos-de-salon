// Tope de salas por celular (C-7, D-41): pasado el límite, el juego lo dice y no toca la red.
// Se siembra el historial en localStorage en vez de abrir 20 salas de verdad contra Firebase.
import { launch, sleep } from './cdp.mjs';

const OUT = process.argv[2];
const b = await launch({ port: 9443, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });

const error = () => b.evaluate(`document.querySelector('#setup-error')?.textContent || ''`);

async function intento(juego, salas, etiqueta) {
  await b.go(`http://localhost:8765/${juego}/`);
  await b.evaluate(`(()=>{
    localStorage.clear();
    const now = Date.now();
    const h = Array.from({length: ${salas}}, (_, i) => now - (i + 1) * 1000);
    localStorage.setItem('juegos-de-salon:rooms-created', JSON.stringify(h));
    return 1;
  })()`);
  await b.go(`http://localhost:8765/${juego}/`);
  await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
  await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);

  const t0 = Date.now();
  await b.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`);
  for (let i = 0; i < 30 && !(await error()); i++) await sleep(200);
  const ms = Date.now() - t0;
  const texto = await error();
  console.log(`${etiqueta} · con ${salas} salas → ${JSON.stringify(texto)} (${ms} ms)`);
  return { texto, ms };
}

// 20 es el tope por hora: con 19 todavía se puede jugar.
const bajo = await intento('toque-y-fama', 19, 'bajo el tope');
console.log('bajo el tope: no se queja →', bajo.texto === '', '| pantalla:', await b.active());

const tope = await intento('toque-y-fama', 20, 'en el tope');
await b.shot('sala-tope');
console.log('en el tope: avisa               →', /muchas salas/.test(tope.texto));
console.log('avisa al toque, sin esperar red →', tope.ms < 2000);
console.log('sigue en la pantalla de datos   →', await b.active());

const ldt = await intento('linea-de-tiempo', 20, 'ldt');
const bn = await intento('batalla-naval', 20, 'bn');
console.log('línea de tiempo →', /muchas salas/.test(ldt.texto));
console.log('batalla naval   →', /muchas salas/.test(bn.texto));
console.log('errors:', JSON.stringify(b.errors));
console.log('logs:', JSON.stringify(b.logs));
b.close();
