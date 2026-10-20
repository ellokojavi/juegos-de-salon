// The lab's Pips (D-381) end to end, at /labs/pips/: the lab offers it under Juegos en prueba with the
// credit to NYT Pips, which the cover gives too; the cover board solves itself; Empezar goes through the
// 3, 2, 1 countdown to board 1 of 3; a domino is chosen, turned with a second tap and laid with a tap on
// a cell; one that does not fit shakes and says why; a placed one comes off with a tap; laying the
// engine's solution with real taps solves the three boards and pays up to 100; the 💡 help asks for a
// second tap and lays a domino; the result brings share, other boards, the lab and the comment form;
// giving up asks for a second tap. At 375 px. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/pips-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const { generar, lugar, NIVELES } = await import('../../../public/labs/pips/engine.js');
const SEED = 'e2e1';

/** The tap on a cell and the turns that lay domino `f` of the solution on its cells `a` (its x) and `b` (its y). */
function jugada(t, s) {
  for (let g = 0; g < 4; g++) for (const i of [s.a, s.b]) { const l = lugar(t, i, g); if (l && l.a === s.a && l.b === s.b) return { i, g }; }
  throw new Error('no way to lay it');
}
const tocarFicha = f => ev(`document.querySelector('#bandeja [data-f="${f}"]').click(); 1`);
const tocarCelda = i => ev(`document.querySelector('#tablero .celda[data-i="${i}"]').click(); 1`);
/** Taps on domino `f` until it has turn `g` and is chosen: each tap turns it a quarter and chooses it. */
async function girarA(f, g) {
  const q = `document.querySelector('#bandeja [data-f="${f}"]')`;
  const cur = await ev(`+${q}.dataset.giro`), sel = await ev(`${q}.classList.contains('sel')`);
  const n = (g - cur + 4) % 4 || (sel ? 0 : 4);
  for (let k = 0; k < n; k++) await tocarFicha(f);
}
const aviso = () => ev(`document.querySelector('.aviso-pips').textContent`);
async function resolverTablero(t) {
  for (const s of t.solucion) {
    // One the help already laid is not in the tray any more
    if (!await ev(`!!document.querySelector('#bandeja [data-f="${s.f}"]')`)) continue;
    const { i, g } = jugada(t, s);
    await girarA(s.f, g);
    await tocarCelda(i);
  }
}

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-pips #btn-pips')?.getAttribute('href')`) === 'pips/', 'the lab offers Pips under Juegos en prueba');
ok(await ev(`/Pips/.test(document.querySelector('#seccion-pips a[href*="nytimes.com/games/pips"]')?.textContent || '')`), 'and says it is inspired by NYT Pips, with its link');

await b.go(`${SITE}/labs/pips/?test&seed=${SEED}`, 1200);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the cover has Empezar');
ok(/Inspirado en Pips, de The New York Times Games/.test(await ev(`document.querySelector('.credito')?.textContent || ''`)), 'the cover credits NYT Pips');
ok(await waitFor(`document.querySelectorAll('.demo .puesta').length >= 2`, 8000), 'the cover board solves itself, a domino at a time');
ok(await ev(`document.documentElement.scrollWidth <= 375`), 'no sideways scroll on the cover');

await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await waitFor(`!!document.getElementById('tablero')`, 9000), 'Empezar goes through the 3, 2, 1 to the board');
ok(/Tablero 1 de 3 · fácil/.test(await ev(`document.querySelector('.marcador').textContent`)), 'it says board 1 of 3, easy');
const t0 = generar(SEED, 'facil');
ok(await ev(`document.querySelectorAll('#tablero .celda').length`) === t0.celdas.length && await ev(`document.querySelectorAll('#bandeja .ficha').length`) === t0.fichas.length, 'the board and the tray are the engine\'s');

// A tap turns and chooses; lay; one that does not fit; take it off
const s0 = t0.solucion[0];
const alto = () => ev(`document.getElementById('bandeja').offsetHeight`);
const altoAntes = await alto();
await tocarFicha(s0.f);
ok(await ev(`document.querySelector('#bandeja [data-f="${s0.f}"]').classList.contains('sel') && document.querySelector('#bandeja [data-f="${s0.f}"]').classList.contains('vertical')`), 'a single tap turns a domino and chooses it');
ok(await alto() === altoAntes, 'turning it does not change the tray\'s height');
const sinSitio = t0.celdas.findIndex((_, i) => !lugar(t0, i, 1));
if (sinSitio >= 0) {
  await tocarCelda(sinSitio);
  ok(/Así no cabe/.test(await aviso()), 'where it does not fit, it says so');
}
const { i, g } = jugada(t0, s0);
await girarA(s0.f, g);
await tocarCelda(i);
ok(await ev(`!!document.querySelector('#tablero .puesta[data-f="${s0.f}"]') && !document.querySelector('#bandeja [data-f="${s0.f}"]')`), 'a tap on a cell lays it on the board');
await ev(`document.querySelector('#tablero .puesta[data-f="${s0.f}"]').click(); 1`);
ok(await ev(`!document.querySelector('#tablero .puesta') && !!document.querySelector('#bandeja [data-f="${s0.f}"]')`), 'a tap on a placed domino takes it off');

// The three boards with the engine's solution, by taps
await resolverTablero(t0);
ok(await waitFor(`/Tablero 2 de 3/.test(document.querySelector('.marcador')?.textContent || '')`, 5000), 'the easy board solved, the medium one comes');
await resolverTablero(generar(SEED, 'medio'));
ok(await waitFor(`/Tablero 3 de 3/.test(document.querySelector('.marcador')?.textContent || '')`, 5000), 'then the hard one');
// The help: a second tap, and it lays a domino
await ev(`document.getElementById('btn-ayuda').click(); 1`);
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)), 'the 💡 help asks for a second tap');
await ev(`document.getElementById('btn-ayuda').click(); 1`);
ok(await waitFor(`document.querySelectorAll('#tablero .puesta').length === 1`), 'and lays one domino of the solution');
const t2 = generar(SEED, 'dificil');
await resolverTablero(t2);
ok(await waitFor(`!!document.getElementById('puntaje')`, 6000), 'the three solved: the result');
const pts = await ev(`document.getElementById('puntaje').textContent`);
ok(/^\d+\/100$/.test(pts) && +pts.split('/')[0] >= 80 && +pts.split('/')[0] <= 90, `it pays 100 minus the help, fast (${pts})`);
ok(await ev(`!!document.getElementById('btn-otro') && !!document.querySelector('.resultado .comentario, .resultado form') && !!document.querySelector('.resultado .divisor')`), 'other boards, and the comment form after a line');
ok(await ev(`document.documentElement.scrollWidth <= 375`), 'no sideways scroll on the result');

// Giving up asks for a second tap
await b.go(`${SITE}/labs/pips/?test&seed=${SEED}`, 1200);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await waitFor(`!!document.getElementById('tablero')`, 9000);
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await ev(`/¿Seguro\\?/.test(document.getElementById('btn-rendirse').textContent) && !document.getElementById('puntaje')`), 'giving up asks for a second tap');
await ev(`document.getElementById('btn-rendirse').click(); 1`);
ok(await waitFor(`document.getElementById('puntaje')?.textContent === '0/100'`), 'and gives up with nothing solved: 0/100');

b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ pips/lab.mjs');
process.exit(failures ? 1 : 0);
