// Que se coloque la carta que el jugador eligió, y ninguna otra (D-38).
// Se juega en el modo solo, la ⏳ Línea Relámpago (D-142), que usa copa/juegos/ui-linea.js.
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const BASE = process.argv[3] || process.env.SITIO || 'http://localhost:8765';
const b = await launch({ port: Number(process.env.PUERTO_CDP) || 9495, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const estado = () => b.evaluate(`JSON.stringify({
  elegida: document.querySelector('#solo-juego .hand .card.sel')?.dataset.card || null,
  marcada: document.querySelector('#solo-juego .hand .card.sel')?.innerText.replace(/\\n/g,' ') || null,
  boton: (()=>{const x=document.getElementById('btn-colocar');return !x ? 'no hay' : x.disabled ? 'deshabilitado' : 'habilitado'})(),
  textoBoton: document.getElementById('btn-colocar')?.innerText.replace(/\\n/g,' · ') || '',
  jugadas: window.__ldt.solo().jugadas.length,
})`).then(JSON.parse);

await b.go(`${BASE}/linea-de-tiempo/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/linea-de-tiempo/`, 1500);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await b.evaluate(`document.getElementById('btn-solo-empezar').click(); 1`); await sleep(1200);

// 1) Nadie eligió nada: la app no debe elegir por el jugador
console.log('al empezar →', JSON.stringify(await estado()));
// El toque en la carta se fue en scroll y el jugador va directo a la ranura
await b.evaluate(`document.querySelectorAll('#solo-juego .line .slot')[0].click(); 1`); await sleep(250);
const sinCarta = await estado();
console.log('toca solo la ranura →', JSON.stringify(sinCarta));
console.log(sinCarta.boton === 'deshabilitado' && sinCarta.elegida === null ? '  ✅ no se puede colocar nada sin elegir' : '  ❌ se puede colocar sin haber elegido');

// 2) Elige la tercera carta de la tira: esa y no otra es la que se coloca
const tercera = await b.evaluate(`(()=>{const c=document.querySelectorAll('#solo-juego .hand .card')[2];return JSON.stringify({id: c.dataset.card, texto: c.querySelector('.t').textContent})})()`).then(JSON.parse);
await b.evaluate(`document.querySelectorAll('#solo-juego .hand .card')[2].click(); 1`); await sleep(200);
await b.evaluate(`document.querySelectorAll('#solo-juego .line .slot')[1].click(); 1`); await sleep(250);
const lista = await estado();
console.log('elige la tercera carta →', JSON.stringify({ elegida: lista.elegida, boton: lista.boton, textoBoton: lista.textoBoton }));
console.log('  el botón nombra la carta elegida:', lista.textoBoton.includes(tercera.texto.slice(0, 18)));
await b.shot('eleccion-boton');
await b.evaluate(`document.getElementById('btn-colocar').click(); 1`); await sleep(1400);
// El veredicto muestra la carta que se colocó; la jugada guardada dice cuál fue
const colocada = await b.evaluate(`(()=>{const j=window.__ldt.solo().jugadas;return JSON.stringify({id: j[j.length-1].c, texto: document.querySelector('#handoff .card-big .t')?.textContent || ''})})()`).then(JSON.parse);
console.log('se colocó:', JSON.stringify(colocada.texto));
console.log(colocada.id === tercera.id ? '  ✅ se colocó la carta elegida' : `  ❌ se colocó otra: elegí "${tercera.texto}" y salió "${colocada.texto}"`);
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
