// Que se coloque la carta que el jugador eligió, y ninguna otra (D-38)
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:8765';
const b = await launch({ port: 9495, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const estado = () => b.evaluate(`JSON.stringify({
  elegida: window.__ldt.session().selCard,
  marcada: document.querySelector('#hand .card.sel')?.innerText.replace(/\\n/g,' ') || null,
  boton: (()=>{const x=document.querySelector('#place-row .btn');return !x ? 'no hay' : x.disabled ? 'deshabilitado' : 'habilitado'})(),
  textoBoton: document.querySelector('#place-row .btn')?.innerText.replace(/\\n/g,' · ') || '',
  jugadas: window.__ldt.view().history.length,
})`).then(JSON.parse);

await b.go(`${BASE}/linea-de-tiempo/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/linea-de-tiempo/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')][0].click(); 1`); await sleep(1200);
await b.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(400);

// 1) Nadie eligió nada: la app no debe elegir por el jugador
console.log('al empezar →', JSON.stringify(await estado()));
// El toque en la carta se fue en scroll y el jugador va directo a la ranura
await b.evaluate(`document.querySelectorAll('#line .slot')[0].click(); 1`); await sleep(250);
const sinCarta = await estado();
console.log('toca solo la ranura →', JSON.stringify(sinCarta));
console.log(sinCarta.boton === 'deshabilitado' && sinCarta.elegida === null ? '  ✅ no se puede colocar nada sin elegir' : '  ❌ se puede colocar sin haber elegido');

// 2) Elige la tercera carta de la tira: esa y no otra es la que se coloca
const tercera = await b.evaluate(`(()=>{const v=window.__ldt.view();const id=v.hands.A[2];return JSON.stringify({id, texto: v.byId[id].es})})()`).then(JSON.parse);
await b.evaluate(`document.querySelectorAll('#hand .card')[2].click(); 1`); await sleep(200);
await b.evaluate(`document.querySelectorAll('#line .slot')[1].click(); 1`); await sleep(250);
const lista = await estado();
console.log('elige la tercera carta →', JSON.stringify({ elegida: lista.elegida, boton: lista.boton, textoBoton: lista.textoBoton }));
console.log('  el botón nombra la carta elegida:', lista.textoBoton.includes(tercera.texto.slice(0, 18)));
await b.evaluate(`document.querySelector('#place-row .btn').click(); 1`); await sleep(1400);
const colocada = await b.evaluate(`(()=>{const v=window.__ldt.view();const h=v.history[v.history.length-1];return JSON.stringify({id:h.card, texto:v.byId[h.card].es})})()`).then(JSON.parse);
console.log('se colocó:', JSON.stringify(colocada.texto));
console.log(colocada.id === tercera.id ? '  ✅ se colocó la carta elegida' : `  ❌ se colocó otra: elegí "${tercera.texto}" y salió "${colocada.texto}"`);
await b.shot('eleccion-boton');
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
