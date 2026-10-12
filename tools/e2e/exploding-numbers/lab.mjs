// Números explosivos del laboratorio (D-297) de punta a punta, en /labs/exploding-numbers/: el
// laboratorio lo ofrece en Proyectos activos con el crédito a Number Match; la portada lo dice y se
// juega sola (los pares estallan); Empezar pasa por la cuenta 3, 2, 1 y arma el tablero de 4 filas;
// un par que no se une tiembla y dice por qué; uno que se une estalla (chispas y 💥); la ayuda pide un
// segundo toque y marca un par; ➕ con pares a la vista pide un segundo toque y copia abajo los que
// quedan; con el orden del motor se limpia entero, las filas se van y paga 100/100; el resultado trae
// compartir, otro tablero, el de hoy y el comentario tras una línea; rendirse pide un segundo toque y
// vale la parte estallada. Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2] || '/tmp/explosivos-lab';
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const esperar = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEMILLA = 'e2e1';
const { generar, nuevaPartida, une, pares, indice, quitar, PUNTOS_LIMPIO } = await import('../../../public/labs/exploding-numbers/engine.js');
const clic = id => ev(`document.querySelector('#tablero [data-id="${id}"]').click(); 1`);
const aviso = () => ev(`document.querySelector('.aviso-ne').textContent`);

await b.go(`${SITIO}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-explosivos #btn-explosivos')?.getAttribute('href')`) === 'exploding-numbers/', 'el laboratorio ofrece Números explosivos en Proyectos activos');
ok(await ev(`/Number Match/.test(document.querySelector('#seccion-explosivos a[href*="numbermatch"]')?.textContent || '')`), 'y dice que está inspirado en Number Match, con su link');

await b.go(`${SITIO}/labs/exploding-numbers/?test`, 1200);
ok(await esperar(`!!document.getElementById('btn-empezar')`), 'la portada tiene Empezar');
ok(/Inspirado en Number Match/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)) && !!await ev(`document.getElementById('link-number-match')?.href`), 'la portada da el crédito a Number Match con su link');
ok(await esperar(`document.querySelectorAll('.demo .num.fuera').length >= 2`, 8000), 'el tablero de la portada se juega solo: los pares estallan');
ok(/mismo para todos/.test(await ev(`document.body.textContent`)), 'sin semilla es el tablero de hoy');
ok(await ev(`document.querySelectorAll('.pasos li').length`) === 3, 'tres pasos');
await b.shot('01-portada');

await b.go(`${SITIO}/labs/exploding-numbers/?seed=${SEMILLA}&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await esperar(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000), 'Empezar abre la cuenta 3, 2, 1');
ok(await esperar(`document.querySelectorAll('#tablero .num').length === 36 && !document.getElementById('cuenta')`, 8000), 'y después el tablero de 4 filas de 9');
const t = generar(SEMILLA);
ok(JSON.stringify(await ev(`[...document.querySelectorAll('#tablero .num')].map(n => +n.textContent)`)) === JSON.stringify(t.numeros), 'los números son los del motor');
ok(/Quedan 36/.test(await ev(`document.getElementById('marcador').textContent`)), 'el marcador: Quedan 36');

// Un par que no se une: tiembla y dice por qué
const p0 = nuevaPartida(t);
let malo = null;
for (let i = 0; i < 36 && !malo; i++) for (let j = i + 1; j < 36 && !malo; j++) if (!une(p0, i, j).ok) malo = [i, j, une(p0, i, j).motivo];
await clic(malo[0]); await clic(malo[1]); await sleep(100);
ok(await ev(`document.querySelector('#tablero [data-id="${malo[1]}"]').classList.contains('no')`) && /no son iguales|entre medio|No están en línea/.test(await aviso()), `un par que no se une tiembla y dice por qué (${malo[2]}: ${await aviso()})`);
ok(await ev(`document.querySelectorAll('#tablero .num.sel').length`) === 0, 'y se sueltan los dos: la jugada siguiente parte de cero');

// La ayuda: el primer toque pide confirmar; el segundo marca un par que se une
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(100);
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)) && !await ev(`!!document.querySelector('#tablero .pista')`), 'el primer toque de la ayuda pide confirmar, sin cobrar');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
const pista = await ev(`[...document.querySelectorAll('#tablero .num.pista')].map(n => +n.dataset.i)`);
ok(pista.length === 2 && une(p0, pista[0], pista[1]).ok, 'el segundo marca dos que se unen');
ok(/estallan juntos/.test(await aviso()) && await ev(`window.__explosivos.P.p.ayudas`) === 1, 'y lo dice, y cuenta una ayuda');

// ➕ con pares a la vista pide un segundo toque
await ev(`document.getElementById('btn-mas').click(); 1`); await sleep(100);
ok(/Hay pares: ¿seguro\?/.test(await ev(`document.getElementById('btn-mas').textContent`)) && await ev(`document.querySelectorAll('#tablero .num').length`) === 36, '➕ con pares a la vista pide un segundo toque');

// Con el orden del motor (en otra partida, sin ayuda ni ➕) se limpia entero
await b.go(`${SITIO}/labs/exploding-numbers/?seed=${SEMILLA}&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await esperar(`document.querySelectorAll('#tablero .num').length === 36 && !document.getElementById('cuenta')`, 8000);
const [a0, b0] = t.orden[0];
await clic(a0); await clic(b0); await sleep(60);
ok(await ev(`document.querySelectorAll('.chispas .chispa').length > 5 && !!document.querySelector('.chispas .kaboom')`), 'un par que se une estalla: chispas y 💥');
ok(await ev(`document.querySelector('#tablero [data-id="${a0}"]').classList.contains('fuera')`) && /Quedan 34/.test(await ev(`document.getElementById('marcador').textContent`)), 'queda su sombra y el marcador baja a 34');
await b.shot('02-juego');
let filas = 0;
for (const [a, c] of t.orden.slice(1)) {
  await esperar(`!!document.querySelector('#tablero [data-id="${a}"]:not(.fuera)') && !window.__explosivos.P.ocupado`, 2000);
  await clic(a); await clic(c);
  await sleep(20);
  if (await ev(`window.__explosivos.P.ocupado`)) filas++;
  await sleep(40);
}
ok(filas > 0, `las filas tachadas enteras explotan y se van (${filas} veces)`);
ok(await esperar(`document.getElementById('puntaje')?.textContent === '100/100' && !document.getElementById('tablero')`, 1500), 'limpio y sin ➕: el resumen aparece de inmediato, sin otra pantalla antes: 100/100');
ok(/Limpio/.test(await ev(`document.querySelector('.sello-ne').textContent`)), '«¡Limpio!»');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'se puede compartir el resultado');
const otro = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(otro) && !otro.includes(SEMILLA), `"Otro tablero" abre uno nuevo (${otro})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), 'y como no era el de hoy, ofrece el de hoy');
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario') && k.at(-2)?.classList.contains('divisor')})()`), 'el comentario es lo último, separado por una línea');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'sin scroll de lado a 375 px');
await b.shot('03-final');

// ➕ sin pares a la vista, y rendirse: un segundo toque, y vale la parte estallada
await b.go(`${SITIO}/labs/exploding-numbers/?seed=${SEMILLA}&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await esperar(`document.querySelectorAll('#tablero .num').length === 36 && !document.getElementById('cuenta')`, 8000);
const p = nuevaPartida(t);
for (const [a, c] of t.orden.slice(0, 5)) { await esperar(`!window.__explosivos.P.ocupado`, 2000); await clic(a); await clic(c); quitar(p, indice(p, a), indice(p, c)); await sleep(40); }
await esperar(`!window.__explosivos.P.ocupado`, 2000);
await ev(`document.getElementById('btn-mas').click(); 1`); await sleep(80);
if (pares(p).length) await ev(`document.getElementById('btn-mas').click(); 1`);
await sleep(200);
const n = p.celdas.filter(c => !c.fuera).length;
ok(await ev(`document.querySelectorAll('#tablero .num').length`) === p.celdas.length + n && /Agregar \(2\)/.test(await ev(`document.getElementById('btn-mas').textContent`)), `➕ copia abajo los ${n} que quedan y quedan 2`);
ok(await ev(`[...document.querySelectorAll('.acciones-ne .btn')].map(b => b.id).join()`) === 'btn-mas,btn-ayuda,btn-rendirse', 'abajo: ➕, la ayuda y Rendirse, en una fila');
await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(100);
ok(/Seguro/.test(await ev(`document.getElementById('btn-rendirse').textContent`)), 'rendirse pide un segundo toque');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
const esperado = Math.round(PUNTOS_LIMPIO * (10 / (36 + n)));
ok(await esperar(`document.getElementById('puntaje')?.textContent === '${esperado}/100'`, 6000) && /Te rendiste/.test(await ev(`document.querySelector('.sello-ne').textContent`)), `vale la parte estallada, con lo agregado: ${esperado}/100, «Te rendiste»`);
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ números explosivos (labs)');
