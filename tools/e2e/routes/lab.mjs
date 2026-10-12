// Rutas del laboratorio (D-293, D-294) de punta a punta, en /labs/routes/: el laboratorio lo ofrece en
// Proyectos activos con el crédito a Junction Nine, que también está en la portada; Empezar pasa por la
// cuenta 3, 2, 1 y parte en la etapa 1 de 5; arrastrar marca un rectángulo y al soltar gira media vuelta
// (las piezas cambian de lugar como dice el motor); reiniciar vuelve al comienzo y no cuenta los giros;
// en cada una de las cinco etapas, deshaciendo la revuelta se unen todas las líneas y llega la siguiente,
// y el resultado da el promedio de las etapas, el desglose, compartir, otro tablero y el comentario tras
// una línea. Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
import { girar, puntaje, puntajeTotal, ETAPAS } from '../../../public/labs/routes/engine.js';
const OUT = process.argv[2] || '/tmp/rutas-lab';
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const esperar = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEMILLA = 'e2e1';

await b.go(`${SITIO}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-rutas #btn-rutas')?.getAttribute('href')`) === 'routes/', 'el laboratorio ofrece Rutas en Proyectos activos');
ok(await ev(`/Junction Nine/.test(document.querySelector('#seccion-rutas a[href*="junction"]')?.textContent || '')`), 'y da el crédito a Junction Nine, con su link');

await b.go(`${SITIO}/labs/routes/?test`, 1200);
ok(await esperar(`!!document.getElementById('btn-empezar')`), 'la portada tiene Empezar');
ok(/Inspirado en Junction Nine/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)), 'la portada da el crédito a Junction Nine');
ok(await ev(`document.querySelectorAll('.tablero-rt .pieza').length`) === 9, 'y muestra un tablero de 9 piezas');
await b.shot('01-portada');

await b.go(`${SITIO}/labs/routes/?seed=${SEMILLA}&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await esperar(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000), 'Empezar abre la cuenta 3, 2, 1');
ok(await esperar(`document.querySelectorAll('#tablero .pieza').length === 9 && !document.getElementById('cuenta')`, 8000), 'y después el tablero');
const t = await ev(`JSON.stringify(window.__rutas.P.t)`).then(JSON.parse);
ok(/Mínimo: \d/.test(await ev(`document.getElementById('marcador').textContent`)), `el marcador dice el mínimo (${t.minimo})`);
ok(/Etapa 1 de 5/.test(await ev(`document.getElementById('etapa').textContent`)) && t.minimo === ETAPAS[0].minimo, 'parte en la etapa 1 de 5, con su mínimo');
ok(await ev(`document.getElementById('btn-reiniciar').disabled`), 'sin giros, Reiniciar está apagado');
const lugares = () => ev(`JSON.stringify([...document.querySelectorAll('#tablero .pieza')].map(n => [+n.dataset.p, +n.dataset.lugar]))`).then(JSON.parse);
// Lo que se ve es lo que dice el motor: cada pieza dada vuelta (v) se dibuja girada media vuelta
const comoElMotor = async (sel, estado) => (await ev(`JSON.stringify([...document.querySelectorAll('${sel} .pieza')].map(n => [+n.dataset.lugar, Math.round(parseFloat(n.style.transform.slice(7)) / 180) % 2]))`).then(JSON.parse)).every(([l, v]) => estado[l].v === v);
ok(await comoElMotor('#tablero', t.inicio), 'al empezar, cada pieza se dibuja como dice el motor (las dadas vuelta, giradas)');
// Arrastrar de la esquina de arriba a la izquierda al centro: gira ese bloque de 2×2
const arrastrar = (c1, f1, c2, f2) => ev(`(()=>{const t=document.getElementById('tablero'),b=t.getBoundingClientRect(),at=(c,f)=>({clientX:b.left+b.width*(c+0.5)/3,clientY:b.top+b.height*(f+0.5)/3,bubbles:true,pointerId:1});t.dispatchEvent(new PointerEvent('pointerdown',at(${c1},${f1})));t.dispatchEvent(new PointerEvent('pointermove',at(${c2},${f2})));t.dispatchEvent(new PointerEvent('pointerup',at(${c2},${f2})));return 1})()`);
await arrastrar(0, 0, 1, 1);
await sleep(600);
const esperado = girar(t.inicio, { f1: 0, c1: 0, f2: 1, c2: 1 });
const hay = await lugares();
ok(hay.every(([p, l]) => esperado[l].p === p) && await comoElMotor('#tablero', esperado), 'arrastrar marca un rectángulo y al soltar gira: cada pieza queda donde y como dice el motor');
ok(/Giros: 1/.test(await ev(`document.getElementById('marcador').textContent`)), 'y cuenta el giro');
await b.shot('02-juego');
await ev(`document.getElementById('btn-reiniciar').click(); 1`); await sleep(500);
ok(/Giros: 0/.test(await ev(`document.getElementById('marcador').textContent`)) && (await lugares()).every(([p, l]) => t.inicio[l].p === p) && await comoElMotor('#tablero', t.inicio), 'reiniciar vuelve al comienzo con 0 giros');
// Cada etapa: deshacer su revuelta al revés une todas las líneas, y pasa a la siguiente
for (let k = 0; k < ETAPAS.length; k++) {
  if (k) ok(await esperar(`document.getElementById('etapa')?.textContent.includes('Etapa ${k + 1} de 5')`, 5000), `llega la etapa ${k + 1}`);
  await sleep(200);
  const te = await ev(`JSON.stringify(window.__rutas.P.t)`).then(JSON.parse);
  for (const r of [...te.revuelta].reverse()) { await ev(`document.getElementById('tablero').dispatchEvent(new CustomEvent('girar', { detail: ${JSON.stringify(r)} })); 1`); await sleep(60); }
  ok(await esperar(`document.getElementById('tablero')?.classList.contains('resuelto')`, 3000), `etapa ${k + 1}: se unen todas las líneas (mínimo ${te.minimo}, ${te.colores.length} líneas)`);
}
// Una etapa puede resolverse antes de deshacer toda la revuelta: vale lo que el juego anotó
const anotadas = await ev(`JSON.stringify(window.__rutas.P.hechas)`).then(JSON.parse);
ok(anotadas.length === 5 && anotadas.every(h => h.puntaje === puntaje(h.giros, h.minimo)), `cada etapa anota sus giros y su puntaje (${anotadas.map(h => `${h.giros}/${h.minimo}`).join(' ')})`);
const esp = puntajeTotal(anotadas.map(h => h.puntaje));
ok(await esperar(`document.getElementById('puntaje')?.textContent === '${esp}/100'`, 6000), `el resultado: ${esp}/100, el promedio de las 5 etapas`);
ok(await ev(`document.querySelectorAll('#desglose li').length`) >= 5, 'el desglose muestra cada etapa');
ok(/Reiniciaste 1 vez/.test(await ev(`document.querySelector('.desglose').textContent`)), 'el desglose cuenta el reinicio');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'se puede compartir el resultado');
ok(/seed=/.test(await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`)), '"Otro tablero" abre uno nuevo');
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario') && k.at(-2)?.classList.contains('divisor')})()`), 'el comentario es lo último, separado por una línea');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'sin scroll de lado a 375 px');
await b.shot('03-final');
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ rutas (labs)');
