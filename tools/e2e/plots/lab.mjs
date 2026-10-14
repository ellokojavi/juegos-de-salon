// Loteo del laboratorio (D-310) de punta a punta, en /labs/plots/: el laboratorio lo ofrece en
// Proyectos activos con el crédito a Shikaku; la portada lo dice y su 5×5 se resuelve solo (los lotes se
// pintan); Empezar pasa por la cuenta 3, 2, 1 y arma el tablero 1 de 5 con los números del motor; un
// rectángulo sin número, con dos números o del área equivocada se rechaza (el marco tiembla en rojo) y
// dice por qué; uno que vale se pinta de su color y tocarlo lo borra; la 💡 Ayuda pide un segundo toque
// y pone un lote de la solución; Deshacer lo saca; Deshacer, Borrar y Rendirse van en una fila (la
// ayuda aparte), Borrar pide un segundo toque, vacía el tablero y Deshacer lo trae de vuelta, y armar
// uno de esos botones desarma los otros; con la solución del motor se resuelven los 5 tableros
// y el puntaje es el que dice el motor con el tiempo que anotó el juego; el resultado trae compartir,
// otro tablero, el de hoy y el comentario tras una línea; rendirse pide un segundo toque y vale los
// tableros hechos. Imprime ✗ si algo falla. `ANCHO=320` lo corre a 320 px.
import { salida } from '../salida.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = salida('/tmp/loteo-lab');
const ANCHO = +process.env.ANCHO || 375;
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: ANCHO, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const esperar = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEMILLA = 'e2e1';
const { generarEtapa, validar, puntajePartida, ETAPAS, PUNTOS_ETAPA } = await import('../../../public/labs/plots/engine.js');
const dibujar = r => ev(`window.__loteo.dibujar(${JSON.stringify(r)}); 1`);
const tocar = (f, c) => ev(`window.__loteo.tocar(${f}, ${c}); 1`);
const aviso = () => ev(`document.getElementById('aviso').textContent`);
const lotes = () => ev(`document.querySelectorAll('#tablero .lote').length`);
const empezar = async () => {
  await b.go(`${SITIO}/labs/plots/?seed=${SEMILLA}&test`, 1200);
  await esperar(`!!document.getElementById('btn-empezar')`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  return esperar(`document.querySelectorAll('#tablero .num').length === 25 && !document.getElementById('cuenta')`, 8000);
};

await b.go(`${SITIO}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-loteo #btn-loteo')?.getAttribute('href')`) === 'plots/', 'el laboratorio ofrece Loteo en Proyectos activos');
ok(await ev(`/Shikaku/.test(document.querySelector('#seccion-loteo a[href*="wikipedia.org/wiki/Shikaku"]')?.textContent || '')`), 'y dice que está inspirado en Shikaku, con su link');

await b.go(`${SITIO}/labs/plots/?test`, 1200);
ok(await esperar(`!!document.getElementById('btn-empezar')`), 'la portada tiene Empezar');
ok(/Inspirado en Shikaku/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)) && /wikipedia/.test(await ev(`document.getElementById('link-shikaku')?.href || ''`)), 'la portada da el crédito a Shikaku con su link');
ok(await esperar(`document.querySelectorAll('.demo .lote').length >= 2`, 8000), 'el 5×5 de la portada se resuelve solo: los lotes se pintan');
ok(/mismo para todos/.test(await ev(`document.body.textContent`)), 'sin semilla es el tablero de hoy');
ok(await ev(`document.querySelectorAll('.pasos li').length`) === 3, 'tres pasos');
await b.shot('01-portada');
ok(await esperar(`document.querySelector('.demo-rotulo.ve')?.textContent === '¡Listo!'`, 20000), 'al terminar la demo dice «¡Listo!»');
await b.shot('01b-portada-listo');

ok(await (async () => {
  await b.go(`${SITIO}/labs/plots/?seed=${SEMILLA}&test`, 1200);
  await esperar(`!!document.getElementById('btn-empezar')`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  return esperar(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000);
})(), 'Empezar abre la cuenta 3, 2, 1');
ok(await esperar(`document.querySelectorAll('#tablero .num').length === 25 && !document.getElementById('cuenta')`, 8000), 'y después el tablero de 5×5');
ok(/Tablero 1 de 5/.test(await ev(`document.getElementById('etapa').textContent`)), '«Tablero 1 de 5»');
const t = generarEtapa(SEMILLA, 0);
ok(JSON.stringify(await ev(`[...document.querySelectorAll('#tablero .num')].map(n => +n.textContent || 0)`)) === JSON.stringify(t.numeros), 'los números son los del motor');

// Los rectángulos que no valen: sin número, con dos, del área equivocada
const L = t.lado, todos = [];
for (let f1 = 0; f1 < L; f1++) for (let f2 = f1; f2 < L; f2++) for (let c1 = 0; c1 < L; c1++) for (let c2 = c1; c2 < L; c2++) todos.push({ f1, c1, f2, c2 });
const sinNumero = todos.find(r => validar(t, r).motivo === 'sin-numero');
await dibujar(sinNumero); await sleep(60);
ok(await ev(`document.querySelector('#tablero .seleccion').classList.contains('mal')`) && await aviso() === 'Ese rectángulo no tiene número.', `uno sin número tiembla en rojo y lo dice (${await aviso()})`);
ok(await lotes() === 0, 'y no se pinta');
await dibujar({ f1: 0, c1: 0, f2: L - 1, c2: L - 1 }); await sleep(60);
ok(/^Tiene \d+ números: cada uno va en su propio lote\.$/.test(await aviso()), `uno con varios números lo dice (${await aviso()})`);
const malArea = todos.find(r => validar(t, r).motivo === 'area');
const v = validar(t, malArea);
await dibujar(malArea); await sleep(60);
ok(await aviso() === `El ${v.n} pide ${v.n} ${v.n === 1 ? 'casilla' : 'casillas'}; ese tiene ${v.area}.`, `uno del área equivocada dice cuántas pide (${await aviso()})`);

// Uno que vale se pinta; tocarlo lo borra
const [s0] = t.solucion;
await dibujar(s0); await sleep(80);
ok(await lotes() === 1 && await ev(`!!document.querySelector('#tablero .lote').style.getPropertyValue('--c')`), 'uno que vale se pinta de su color');
ok(await ev(`document.querySelector('#tablero .num.cubierto') !== null`), 'y su número queda encima, oscuro');
await b.shot('02-juego');
await tocar(s0.f1, s0.c1); await sleep(60);
ok(await lotes() === 0 && /borrado/.test(await aviso()), 'tocarlo lo borra');

// La ayuda: dos toques, pone un lote de la solución; Deshacer lo saca
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(80);
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)) && await lotes() === 0, 'el primer toque de la ayuda pide confirmar, sin cobrar');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(120);
ok(await lotes() === 1 && await ev(`!!document.querySelector('#tablero .lote.ayudado')`) && await ev(`window.__loteo.P.ayudas`) === 1, 'el segundo pone un lote de la solución, marcado, y cuenta una ayuda');
const puesto = await ev(`JSON.stringify((({f1,c1,f2,c2}) => ({f1,c1,f2,c2}))(window.__loteo.P.parcelas[0]))`);
ok(t.solucion.some(r => JSON.stringify(r) === puesto), 'ese lote es de la solución');
await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(60);
ok(await lotes() === 0, 'Deshacer lo saca');
ok(await ev(`[...document.querySelectorAll('.acciones-lt .btn')].map(b => b.id).join()`) === 'btn-deshacer,btn-borrar,btn-rendirse', 'abajo: Deshacer, Borrar y Rendirse, en una fila; la ayuda, aparte');
// Borrar el tablero (pedido del dueño): con un segundo toque, y Deshacer lo trae de vuelta
for (const r of t.solucion.slice(0, 2)) { await dibujar(r); await sleep(40); }
ok(await lotes() === 2, 'dos lotes puestos');
await ev(`document.getElementById('btn-borrar').click(); 1`); await sleep(80);
ok(/Seguro/.test(await ev(`document.getElementById('btn-borrar').textContent`)) && await lotes() === 2, 'Borrar pide un segundo toque');
await ev(`document.getElementById('btn-borrar').click(); 1`); await sleep(80);
ok(await lotes() === 0 && await ev(`document.getElementById('btn-borrar').disabled`), 'con el segundo, el tablero queda vacío y Borrar se apaga');
await ev(`document.getElementById('btn-deshacer').click(); 1`); await sleep(80);
ok(await lotes() === 2, 'Deshacer trae de vuelta lo borrado');
await ev(`document.getElementById('btn-borrar').click(); document.getElementById('btn-rendirse').click(); 1`); await sleep(80);
ok(await ev(`!document.getElementById('btn-borrar').classList.contains('armado') && document.getElementById('btn-rendirse').classList.contains('armado')`), 'un «¿Seguro?» a la vez: armar Rendirse desarma Borrar');
await ev(`document.querySelector('#tablero').click(); 1`); await sleep(3100);

// Con la solución del motor (otra partida, sin ayuda) se resuelven los cinco
await empezar();
for (let n = 0; n < ETAPAS.length; n++) {
  const tt = generarEtapa(SEMILLA, n);
  ok(await esperar(`document.querySelectorAll('#tablero .num').length === ${tt.lado * tt.lado} && !window.__loteo.P.terminado`, 5000), `el tablero ${n + 1} es de ${tt.lado}×${tt.lado}`);
  if (n === 4) await b.shot('02c-tablero-8x8');
  for (const r of tt.solucion) { await dibujar(r); await sleep(30); }
  ok(await esperar(`/listo/.test(document.getElementById('aviso')?.textContent || '') || !!document.getElementById('puntaje')`, 2000), `resuelto el tablero ${n + 1}`);
  if (n === 1) await b.shot('02b-tablero-listo');
}
ok(await esperar(`!!document.getElementById('puntaje')`, 4000), 'tras el quinto, directo al resultado');
const seg = await ev(`window.__loteo.P.segundos`);
const esperado = puntajePartida(ETAPAS.length, seg, 0).total;
ok(await ev(`document.getElementById('puntaje').textContent`) === `${esperado}/100`, `el puntaje es el del motor: ${esperado}/100 en ${seg.toFixed(1)} s`);
ok(/Todo loteado/i.test(await ev(`document.querySelector('.sello-lt').textContent`)), '«¡Todo loteado!»');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'se puede compartir el resultado');
const otro = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(otro) && !otro.includes(SEMILLA), `"Otro tablero" abre uno nuevo (${otro})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), 'y como no era el de hoy, ofrece el de hoy');
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario') && k.at(-2)?.classList.contains('divisor')})()`), 'el comentario es lo último, separado por una línea');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `sin scroll de lado a ${ANCHO} px`);
await sleep(1500);
await b.shot('03-final');

// Rendirse: un segundo toque, y valen los tableros hechos
await empezar();
for (const r of generarEtapa(SEMILLA, 0).solucion) { await dibujar(r); await sleep(30); }
ok(await esperar(`document.querySelectorAll('#tablero .num').length === 36 && !window.__loteo.P.terminado`, 5000), 'pasa al tablero 2');
await ev(`document.getElementById('btn-rendirse').click(); 1`); await sleep(80);
ok(/Seguro/.test(await ev(`document.getElementById('btn-rendirse').textContent`)), 'rendirse pide un segundo toque');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await esperar(`document.getElementById('puntaje')?.textContent === '${PUNTOS_ETAPA}/100'`, 4000) && /Te rendiste/.test(await ev(`document.querySelector('.sello-lt').textContent`)), `vale el tablero hecho: ${PUNTOS_ETAPA}/100, «Te rendiste»`);
ok(/Así se resolvía el tablero 2/.test(await ev(`document.querySelector('.resultado').textContent`)) && await ev(`document.querySelectorAll('.resultado .lote').length`) === generarEtapa(SEMILLA, 1).solucion.length, 'y muestra cómo se resolvía');
await b.shot('04-rendido');
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ loteo (labs)');
