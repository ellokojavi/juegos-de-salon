// Loteo del laboratorio, el modo «Servicios» (D-311), de punta a punta en /labs/plots/: el selector de
// la portada cambia el lema, los pasos y la demo (un 4×4 de ⚡ y 💧 que se resuelve solo), se recuerda
// al volver y lo dice el link; `?mode=utilities` entra directo. En el juego, «Lotes de n casillas»
// arriba del tablero y los íconos del motor; un lote del tamaño equivocado, al que le falta un servicio
// o al que le sobra uno se rechaza con su aviso; uno que vale se pinta; con la solución del motor se
// resuelven los 5 tableros, el puntaje es el del motor y el final dice el modo; «Otro tablero» y «El de
// hoy» lo conservan. Imprime ✗ si algo falla. `ANCHO=320` lo corre a 320 px.
import { salida } from '../salida.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = salida('/tmp/loteo-servicios');
const ANCHO = +process.env.ANCHO || 375;
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: ANCHO, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const esperar = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEMILLA = 'e2e1';
const { generarEtapaServicios, validar, puntajePartida, ETAPAS_SERVICIOS, ICONOS } = await import('../../../public/labs/plots/engine.js');
const dibujar = r => ev(`window.__loteo.dibujar(${JSON.stringify(r)}); 1`);
const aviso = () => ev(`document.getElementById('aviso').textContent`);
const lotes = () => ev(`document.querySelectorAll('#tablero .lote').length`);
const pasos = () => ev(`[...document.querySelectorAll('.pasos li')].map(l => l.textContent).join(' | ')`);

// La portada, en el modo de números (el de siempre): el selector, con Números elegido
await b.go(`${SITIO}/labs/plots/?test`, 1200);
await ev(`localStorage.removeItem('juegos-de-salon:loteo:modo'); 1`);
await b.go(`${SITIO}/labs/plots/?test`, 1200);
ok(await esperar(`!!document.getElementById('selector-modo')`), 'la portada tiene el selector de modo');
ok(await ev(`document.getElementById('modo-numeros').getAttribute('aria-checked')`) === 'true', 'de entrada, Números');
ok(await ev(`[...document.querySelectorAll('#selector-modo [role=radio]')].every(x => x.getBoundingClientRect().height >= 44)`), 'las dos opciones miden 44 px o más');
const pasosNumeros = await pasos();
ok(/número/.test(pasosNumeros), 'los pasos son los de los números');

// Servicios: cambian el lema, los pasos y la demo; el link lo dice
await ev(`document.getElementById('modo-servicios').click(); 1`); await sleep(200);
ok(await ev(`document.getElementById('modo-servicios').getAttribute('aria-checked')`) === 'true', 'tocar Servicios lo elige');
ok(/⚡/.test(await ev(`document.getElementById('lema').textContent`)), 'el lema cambia');
const pasosServicios = await pasos();
ok(pasosServicios !== pasosNumeros && /un ⚡ y un 💧, ni más ni menos/.test(pasosServicios) && /del tamaño que dice arriba/.test(pasosServicios) && /deja una casilla sin lote posible/.test(pasosServicios), `los pasos cambian (${pasosServicios})`);
ok(await ev(`document.querySelectorAll('.pasos li').length`) === 3, 'tres pasos');
ok(await ev(`location.search.includes('mode=utilities')`), 'el link dice el modo (?mode=utilities)');
ok(await esperar(`document.querySelectorAll('.demo .num[data-servicio=luz]').length === 4`, 3000), 'la demo trae ⚡ y 💧 (4×4 en lotes de 4)');
ok(/Lotes de 4 casillas/.test(await ev(`document.querySelector('.demo-tam')?.textContent || ''`)), 'y dice el tamaño de sus lotes');
ok(await esperar(`document.querySelectorAll('.demo .lote').length >= 2`, 8000), 'la demo se resuelve sola: los lotes se pintan');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `sin scroll de lado a ${ANCHO} px`);
await b.shot('01-portada-servicios');
ok(await esperar(`document.querySelector('.demo-rotulo.ve')?.textContent === '¡Listo!'`, 20000), 'al terminar la demo dice «¡Listo!»');

// Se recuerda: al volver sin el parámetro, sigue en Servicios
await b.go(`${SITIO}/labs/plots/?test`, 1200);
ok(await esperar(`document.getElementById('modo-servicios')?.getAttribute('aria-checked') === 'true'`), 'al volver, el celular recuerda Servicios');
// Y de vuelta a Números
await ev(`document.getElementById('modo-numeros').click(); 1`); await sleep(200);
ok(await pasos() === pasosNumeros && !(await ev(`location.search.includes('mode=')`)), 'volver a Números trae sus pasos y saca el modo del link');
ok(await esperar(`document.querySelectorAll('.demo .num:not(.icono)').length === 25`, 3000), 'y su demo de 5×5');
await b.shot('01b-portada-numeros');

// ?mode=utilities entra directo, aunque el celular recuerde Números
await b.go(`${SITIO}/labs/plots/?seed=${SEMILLA}&mode=utilities&test`, 1200);
ok(await esperar(`document.getElementById('modo-servicios')?.getAttribute('aria-checked') === 'true'`), '?mode=utilities entra en Servicios');
await ev(`document.getElementById('btn-empezar').click(); 1`);
const t = generarEtapaServicios(SEMILLA, 0);
ok(await esperar(`document.querySelectorAll('#tablero .num').length === ${t.lado * t.lado} && !document.getElementById('cuenta')`, 8000), `el tablero 1 es de ${t.lado}×${t.lado}`);
ok(await ev(`window.__loteo.P.modo`) === 'servicios', 'en el modo servicios');
ok(await ev(`document.getElementById('tam')?.textContent`) === `Lotes de ${t.tam} casillas`, `arriba del tablero: «Lotes de ${t.tam} casillas»`);
ok(JSON.stringify(await ev(`[...document.querySelectorAll('#tablero .num')].map(n => n.textContent)`)) === JSON.stringify(t.iconos.map(x => (x ? ICONOS[x] : ''))), 'los íconos son los del motor');
ok(await ev(`(() => { const r = document.querySelector('#tablero .num[data-servicio]').getBoundingClientRect(); return r.height >= 18; })()`), 'los íconos se ven grandes');

// Los lotes que no valen, con su aviso
const L = t.lado, todos = [];
for (let f1 = 0; f1 < L; f1++) for (let f2 = f1; f2 < L; f2++) for (let c1 = 0; c1 < L; c1++) for (let c2 = c1; c2 < L; c2++) todos.push({ f1, c1, f2, c2 });
const malTam = todos.find(r => validar(t, r).motivo === 'tam' && validar(t, r).area > 1);
await dibujar(malTam); await sleep(60);
const vt = validar(t, malTam);
ok(await ev(`document.querySelector('#tablero .seleccion').classList.contains('mal')`) && await aviso() === `Ese lote tiene ${vt.area} casillas; cada lote tiene ${t.tam}.`, `uno del tamaño equivocado tiembla en rojo y lo dice (${await aviso()})`);
ok(await lotes() === 0, 'y no se pinta');
const falta = todos.find(r => validar(t, r).motivo === 'falta');
await dibujar(falta); await sleep(60);
ok(await aviso() === `Le falta ${ICONOS[validar(t, falta).servicio]}.`, `uno al que le falta un servicio lo dice (${await aviso()})`);
const sobra = todos.find(r => validar(t, r).motivo === 'sobra' && validar(t, r).cuantos === 2);
await dibujar(sobra); await sleep(60);
ok(await aviso() === `Tiene 2 ${ICONOS[validar(t, sobra).servicio]}: cada lote lleva uno.`, `uno con dos del mismo lo dice (${await aviso()})`);
await dibujar(t.solucion[0]); await sleep(80);
ok(await lotes() === 1 && await ev(`!!document.querySelector('#tablero .lote').style.getPropertyValue('--c')`), 'uno que vale se pinta de su color');
await b.shot('02-juego-servicios');
await ev(`document.getElementById('btn-borrar').click(); document.getElementById('btn-borrar').click(); 1`); await sleep(60);

// Con la solución del motor se resuelven los cinco
for (let n = 0; n < ETAPAS_SERVICIOS.length; n++) {
  const tt = generarEtapaServicios(SEMILLA, n);
  ok(await esperar(`document.querySelectorAll('#tablero .num').length === ${tt.lado * tt.lado} && !window.__loteo.P.terminado && document.getElementById('tam')?.textContent === 'Lotes de ${tt.tam} casillas'`, 5000), `el tablero ${n + 1} es de ${tt.lado}×${tt.lado}, en lotes de ${tt.tam}`);
  if (n === 4) { await sleep(400); await b.shot('02c-tablero-dificil'); }
  // Al llegar a los difíciles, el aviso dice cómo pensarlos (pedido del dueño)
  if (n === 2) ok(/Difíciles: si un lote deja una casilla sin lote posible/.test(await ev(`document.getElementById('aviso').textContent`)), 'el tablero 3 avisa que vienen los difíciles y cómo pensarlos');
  if (n === 3) ok(!/Difíciles:/.test(await ev(`document.getElementById('aviso').textContent`)), 'y solo al llegar a ellos');
  for (const r of tt.solucion) { await dibujar(r); await sleep(25); }
  ok(await esperar(`/listo/.test(document.getElementById('aviso')?.textContent || '') || !!document.getElementById('puntaje')`, 2000), `resuelto el tablero ${n + 1}`);
}
ok(await esperar(`!!document.getElementById('puntaje')`, 4000), 'tras el quinto, directo al resultado');
const seg = await ev(`window.__loteo.P.segundos`);
const esperado = puntajePartida(ETAPAS_SERVICIOS.length, seg, 0).total;
ok(await ev(`document.getElementById('puntaje').textContent`) === `${esperado}/100`, `el puntaje es el del motor: ${esperado}/100 en ${seg.toFixed(1)} s`);
ok(await ev(`document.getElementById('modo-fin')?.textContent`) === '⚡💧 Servicios' && /Todo loteado/i.test(await ev(`document.querySelector('.sello-lt').textContent`)), 'el final dice el modo y «¡Todo loteado!»');
const otro = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(otro) && /mode=utilities/.test(otro) && !otro.includes(SEMILLA), `"Otro tablero" conserva el modo (${otro})`);
ok(/mode=utilities/.test(await ev(`document.getElementById('btn-de-hoy')?.getAttribute('href') || ''`)), '"El de hoy" también');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), `sin scroll de lado a ${ANCHO} px`);
await sleep(1500);
await b.shot('03-final-servicios');
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ loteo servicios (labs)');
