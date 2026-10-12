// Pintaminas del laboratorio (D-289) de punta a punta, en /labs/paint-mines/: el laboratorio lo ofrece
// en Proyectos activos con el crédito a ColorSweeper; la portada lo dice y se pinta sola; Empezar pasa
// por la cuenta 3, 2, 1; con semilla se juega entero comparando con el motor: acertar muestra el
// número, errar resta y destapa el color verdadero, el pincel cambia; al terminar aparece el dibujo y
// el resultado trae el puntaje, compartir, otro tablero y el comentario tras una línea. El modo
// difícil (D-291): el interruptor lo enciende, y con dos colores y sin errores paga 150. La ayuda
// (D-292) marca una casilla deducible y resta 10. Imprime ✗ si
// algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2] || '/tmp/pintaminas-lab';
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const esperar = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEMILLA = 'e2e1';

await b.go(`${SITIO}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-pintaminas #btn-pintaminas')?.getAttribute('href')`) === 'paint-mines/', 'el laboratorio ofrece Pintaminas en Proyectos activos');
ok(await ev(`/ColorSweeper/.test(document.querySelector('#seccion-pintaminas a[href*="ColorSweeper"]')?.textContent || '')`), 'y dice que está inspirado en ColorSweeper, con su link');

await b.go(`${SITIO}/labs/paint-mines/?test`, 1200);
ok(await esperar(`!!document.getElementById('btn-empezar')`), 'la portada tiene Empezar');
ok(/Inspirado en ColorSweeper/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)) && !!await ev(`document.getElementById('link-colorsweeper')?.href`), 'la portada da el crédito a ColorSweeper con su link');
ok(await esperar(`document.querySelectorAll('.demo .casilla.tinta').length > 3`, 6000), 'el tablero de la portada se pinta solo');
ok(/mismo para todos/.test(await ev(`document.body.textContent`)), 'sin semilla es el tablero de hoy');
// El interruptor del modo difícil: se sube, se electrifica, y se baja
await ev(`localStorage.removeItem('juegos-de-salon:pintaminas:dificil'); 1`);
await b.go(`${SITIO}/labs/paint-mines/?test`, 1200);
ok(await ev(`document.getElementById('btn-dificil')?.getAttribute('aria-checked')`) === 'false', 'el modo difícil parte apagado');
ok(/Modo fácil/.test(await ev(`document.querySelector('#btn-dificil .rotulo').textContent`)) && await ev(`!!document.querySelector('#btn-dificil .recorrido .ranura')`), 'la palanca dice «Modo fácil» y la placa tiene grabado su recorrido');
// El destello dura 0,6 s: se anota cuando aparece, para no depender de mirarlo a tiempo
await ev(`window.__destellos = 0; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList?.contains('relampago')) window.__destellos++; }))).observe(document.body, { childList: true }); 1`);
await ev(`document.getElementById('btn-dificil').click(); 1`); await sleep(200);
ok(await ev(`document.getElementById('btn-dificil').getAttribute('aria-checked') === 'true' && document.getElementById('btn-dificil').classList.contains('on')`), 'el interruptor lo enciende y se electrifica');
ok(await ev(`document.body.classList.contains('modo-dificil')`), 'y cambia el fondo de la página');
ok(await ev(`window.__destellos`) === 1, 'y un destello cubre toda la vista');
ok(/Modo difícil/.test(await ev(`document.querySelector('#btn-dificil .rotulo').textContent`)), 'y el rótulo pasa a «⚡ Modo difícil»');
ok(await esperar(`document.querySelectorAll('.demo .casilla.p2').length > 0`, 9000), 'y la partida de la portada pasa a dos colores');
await b.shot('01b-dificil');
await ev(`document.getElementById('btn-dificil').click(); 1`); await sleep(100);
ok(await ev(`document.getElementById('btn-dificil').getAttribute('aria-checked') === 'false' && !document.body.classList.contains('modo-dificil')`), 'y lo apaga, con el fondo de siempre');
ok(await ev(`window.__destellos`) === 1, 'volver al modo fácil no lleva destello');
await b.shot('01-portada');

await b.go(`${SITIO}/labs/paint-mines/?seed=${SEMILLA}&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
ok(!await ev(`document.getElementById('vista').textContent.includes('null')`), 'con semilla, la portada no escribe "null"');
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await esperar(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000), 'Empezar abre la cuenta 3, 2, 1');
ok(await esperar(`document.querySelectorAll('#tablero .casilla').length === 49 && !document.getElementById('cuenta')`, 8000), 'y después el tablero de 7×7');
const t = await ev(`JSON.stringify(window.__pintaminas.P.t)`).then(JSON.parse);
const { numero } = await import('../../../public/labs/paint-mines/engine.js');
const casilla = i => `document.querySelector('#tablero .casilla[data-i="${i}"]')`;
ok(await ev(`[...document.querySelectorAll('#tablero .casilla.tinta, #tablero .casilla.fondo')].length`) === t.dadas.length, `las dadas se ven pintadas (${t.dadas.length})`);
const pintar = async (i, color) => { await ev(`document.getElementById('${color ? 'btn-tinta' : 'btn-fondo'}').click(); ${casilla(i)}.click(); 1`); await sleep(40); };
const libres = t.sol.map((_, i) => i).filter(i => !t.dadas.includes(i));
// Un acierto muestra su número; un error resta y destapa el color verdadero
await pintar(libres[0], t.sol[libres[0]]);
ok(await ev(`${casilla(libres[0])}.textContent`) === String(numero(t.sol, libres[0])), 'acertar muestra el número de la casilla');
ok(await ev(`document.getElementById('btn-${t.sol[libres[0]] ? 'tinta' : 'fondo'}').getAttribute('aria-pressed')`) === 'true', 'el pincel elegido se nota');
await pintar(libres[1], 1 - t.sol[libres[1]]);
ok(await ev(`${casilla(libres[1])}.classList.contains('error') && ${casilla(libres[1])}.classList.contains('${t.sol[libres[1]] ? 'tinta' : 'fondo'}')`), 'errar destapa el color verdadero, marcado como error');
ok(/(Se pintaba de \w+|No se pintaba): −15/.test(await ev(`document.querySelector('.aviso-pm').textContent`)) && /1 error/.test(await ev(`document.getElementById('marcador').textContent`)), 'y lo dice: −15, 1 error');
// La ayuda: marca la casilla que se puede deducir y los números que lo explican, sin pintarla, y resta
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
// El primer toque solo pide confirmar (#351): no marca ni cobra
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)) && !await ev(`!!document.querySelector('#tablero .pista-objetivo')`), 'el primer toque de la ayuda pide confirmar, sin cobrar');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
const objetivo = await ev(`[...document.querySelectorAll('#tablero .casilla.pista-objetivo')].map(b => +b.dataset.i)`);
ok(objetivo.length === 1 && await ev(`document.querySelectorAll('#tablero .casilla.pista-razon').length`) > 0 && !await ev(`${casilla(objetivo[0] ?? 0)}.classList.contains('tinta') || ${casilla(objetivo[0] ?? 0)}.classList.contains('fondo')`), 'la ayuda marca una casilla sin pintar y los números que la explican');
ok(/se deduce de los números marcados/.test(await ev(`document.querySelector('.aviso-pm').textContent`)), 'y lo dice');
// Pintar otra casilla quita las marcas, y volver a verla no cobra de nuevo
const otraLibre = libres.find(i => i !== objetivo[0] && !t.dadas.includes(i));
await pintar(otraLibre, t.sol[otraLibre]);
ok(/Ver la ayuda/.test(await ev(`document.getElementById('btn-ayuda').textContent`)), 'después, el botón ofrece ver la misma ayuda');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
ok(await ev(`${casilla(objetivo[0])}.classList.contains('pista-objetivo')`) && /1 error|Sin errores/.test(await ev(`document.getElementById('marcador').textContent`)), 'y la muestra de nuevo sin cobrar otra');
await b.shot('02-juego');
for (const i of libres.slice(2)) await pintar(i, t.sol[i]);
ok(await esperar(`document.getElementById('tablero')?.classList.contains('revelada')`, 2000), 'al terminar aparece el dibujo');
ok((await ev(`document.querySelector('.aviso-pm').textContent`)).includes(t.dibujo.nombre.toLowerCase()), `y dice qué era: ${t.dibujo.nombre}`);
ok(await esperar(`document.getElementById('puntaje')?.textContent === '75/100'`, 5000), 'el resultado: 75/100 con un error y una ayuda');
ok(/1 ayuda: −10/.test(await ev(`document.querySelector('.desglose').textContent`)), 'el desglose cuenta la ayuda');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'se puede compartir el resultado');
const otro = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(otro) && !otro.includes(SEMILLA), `"Otro tablero" abre uno nuevo (${otro})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), 'y como no era el de hoy, ofrece el de hoy');
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario') && k.at(-2)?.classList.contains('divisor')})()`), 'el comentario es lo último, separado por una línea');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'sin scroll de lado a 375 px');
await b.shot('03-final');

// El modo difícil desde el link: dos colores, tres pinceles, y sin errores paga 150
await b.go(`${SITIO}/labs/paint-mines/?seed=${SEMILLA}&colors=2&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
ok(await ev(`document.getElementById('btn-dificil').getAttribute('aria-checked')`) === 'true', 'con colors=2 en el link, el modo difícil viene encendido');
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await esperar(`document.querySelectorAll('#tablero .casilla').length === 49 && !document.getElementById('cuenta')`, 8000), 'el tablero difícil');
const t2 = await ev(`JSON.stringify(window.__pintaminas.P.t)`).then(JSON.parse);
ok(t2.colores === 2 && t2.sol.includes(2) && await ev(`document.querySelectorAll('.pinceles .pincel').length`) === 3, `dos colores y tres pinceles (${t2.dibujo.pinturas.map(p => p.nombre).join(' y ')})`);
ok(/Modo difícil ×1.5/.test(await ev(`document.getElementById('marcador').textContent`)), 'el marcador lo dice');
const boton = k => (k === 0 ? 'btn-fondo' : k === 1 ? 'btn-tinta' : 'btn-tinta2');
for (const i of t2.sol.map((_, i) => i).filter(i => !t2.dadas.includes(i))) { await ev(`document.getElementById('${boton(t2.sol[i])}').click(); document.querySelector('#tablero .casilla[data-i="${i}"]').click(); 1`); await sleep(30); }
ok(await esperar(`document.getElementById('puntaje')?.textContent === '150/150'`, 5000), 'sin errores, el modo difícil paga 150/150');
ok(/colors=2/.test(await ev(`document.getElementById('btn-otro').getAttribute('href')`)), '"Otro tablero" sigue en el modo difícil');
await b.shot('04-dificil');

// Rendirse (D-296): pide un segundo toque, destapa el dibujo y el puntaje vale la parte pintada
await b.go(`${SITIO}/labs/paint-mines/?seed=${SEMILLA}&colors=1&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await esperar(`!!document.getElementById('btn-rendirse') && !document.getElementById('cuenta')`, 8000);
const t3 = await ev(`JSON.stringify(window.__pintaminas.P.t)`).then(JSON.parse);
const libres3 = t3.sol.map((_, i) => i).filter(i => !t3.dadas.includes(i));
for (const i of libres3.slice(0, 10)) await pintar(i, t3.sol[i]);
ok(await ev(`[...document.querySelectorAll('.acciones-pm .btn')].map(b => b.id).join()`) === 'btn-ayuda,btn-rendirse', 'bajo los pinceles: la ayuda y Rendirse, en una fila');
await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(150);
ok(/Seguro/.test(await ev(`document.getElementById('btn-rendirse').textContent`)) && !await ev(`document.getElementById('tablero').classList.contains('revelada')`), 'rendirse pide un segundo toque');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await esperar(`document.getElementById('tablero')?.classList.contains('revelada') && document.querySelectorAll('#tablero .casilla.sin-hacer').length === ${libres3.length - 10}`, 3000), 'con el segundo, se destapa el dibujo y lo que faltaba se ve apagado');
const esp3 = Math.round(100 * 10 / libres3.length);
ok(await esperar(`document.getElementById('puntaje')?.textContent === '${esp3}/100'`, 5000) && /Te rendiste/.test(await ev(`document.querySelector('.sello-pm').textContent`)), `el puntaje vale la parte pintada: ${esp3}/100, «Te rendiste»`);
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ pintaminas (labs)');
