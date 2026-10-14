// The lab's Agents (D-286) end to end, at /labs/agents/: the lab offers it under Active projects,
// the cover says where it comes from (Codenames, with its link) and plays one clue by itself;
// without a seed it's today's board; with a seed it's played through: an agent scores, one from another
// clue scores without cutting, the assassin and the neutrals cut the clue (Cortada stamp), completing it
// moves to the next (Completa stamp), and the end shows the score the engine says with its stamp, the
// uncovered board, sharing and the comment at the end. Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/agents-lab');
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEED = 'e2e1';

// The lab offers it under Active projects, with the credit to Codenames
await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-agentes #btn-agentes')?.getAttribute('href')`) === 'agents/', 'the lab offers Agents under Active projects');
ok(await ev(`/codenames/i.test(document.querySelector('#seccion-agentes a[href*="czechgames"]')?.textContent || '')`), 'and says it is inspired by Codenames, with its link');

// Without a seed: the cover of today's board, with the credit
await b.go(`${SITE}/labs/agents/?test`, 1200);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'the cover has Empezar');
ok(await ev(`document.getElementById('link-codenames')?.href`) === 'https://czechgames.com/en/codenames/' && /Inspirado en Codenames/.test(await ev(`document.querySelector('.credito')?.textContent`)), 'the cover says "Inspirado en Codenames", with the link to the official page');
ok(/mismo para todos/.test(await ev(`document.body.textContent`)), "without a seed it's today's board, the same for everyone");
ok(await ev(`!!document.getElementById('btn-comentario')`), 'and ends with the comment link');
ok(await ev(`/clasificado/i.test(document.querySelector('.sello--titulo')?.textContent || '')`), 'the title carries the Clasificado stamp');
// The cover plays by itself: the magnifier finds the clue's agents and at the end the assassin is uncovered
ok(await waitFor(`document.querySelectorAll('.demo-cartas .dc.agente').length === 3 && !!document.querySelector('.demo-cartas .dc.asesino')`, 9000), 'the cover plays one clue by itself: 3 agents and the assassin');
await b.shot('01-cover');

// With a seed: played through, compared with the engine
await b.go(`${SITE}/labs/agents/?seed=${SEED}&test`, 1200);
await waitFor(`!!document.getElementById('btn-empezar')`);
ok(!await ev(`document.getElementById('vista').textContent.includes('null')`), 'with a seed, the cover does not write "null"');
await ev(`document.getElementById('btn-empezar').click(); 1`);
// Before the board, La Copa's 3, 2, 1 (D-105)
ok(await waitFor(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000), 'Empezar opens the 3, 2, 1 countdown');
ok(await waitFor(`document.querySelectorAll('#tablero .carta').length === 15 && !document.getElementById('cuenta')`, 8000), 'and then the board of 15 cards');
const t = await ev(`JSON.stringify(window.__agentes.P.t)`).then(JSON.parse);
const of = (p, type = 'agente') => t.cartas.map((c, i) => ({ ...c, i })).filter(c => c.tipo === type && (p == null || c.p === p)).map(c => c.i);
const tap = async i => { await ev(`document.querySelector('#tablero .carta[data-i="${i}"]').click(); 1`); await sleep(250); };
const clue = () => ev(`document.querySelector('#pista .palabra')?.textContent || ''`);
// A new clue arrives being decoded: wait for the word to be written out
const arrives = n => waitFor(`(document.querySelector('#pista .palabra')?.textContent || '').startsWith(${JSON.stringify(t.pistas[n].pista)} + ' ·')`, 4000);
const stamp = () => ev(`document.querySelector('#pista .sello--pista')?.textContent || ''`);
ok(await arrives(0), `the first clue is ${t.pistas[0].pista}`);
await b.shot('02-board');

// The marks: a long press marks 📌, another 🚫 and another removes it; the tap that follows the long one
// does not uncover, and a 🚫 is not uncovered by mistake
const longPress = async i => {
  await ev(`(()=>{const b=document.querySelector('#tablero .carta[data-i="${i}"]');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));return 1})()`);
  await sleep(600);
  await ev(`(()=>{const b=document.querySelector('#tablero .carta[data-i="${i}"]');b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));b.click();return 1})()`);
  await sleep(100);
};
const cls = i => ev(`document.querySelector('#tablero .carta[data-i="${i}"]').className`);
ok(await ev(`!!document.getElementById('ayuda-marcas') && !document.getElementById('ayuda-marcas').hidden`), 'the board says how to mark');
const m = of(null, 'neutral')[1];
await longPress(m);
ok(/marca-sospecha/.test(await cls(m)) && !/neutral/.test(await cls(m)), 'a long press marks 📌 without uncovering');
ok(/Marcada, sin destapar/.test(await ev(`document.querySelector('.aviso-ag').textContent`)), "and says so: marked, not uncovered (a tap that lasted too long doesn't look chosen)");
ok(await ev(`document.getElementById('ayuda-marcas').hidden`), 'and the help goes away');
await longPress(m);
ok(/marca-descarte/.test(await cls(m)), 'another turns it into 🚫');
await ev(`document.querySelector('#tablero .carta[data-i="${m}"]').click(); 1`); await sleep(150);
ok(!/neutral/.test(await cls(m)) && /Descartada: mantenla apretada/.test(await ev(`document.querySelector('.aviso-ag').textContent`)), 'a 🚫 is not uncovered when tapped');
await longPress(m);
ok(!/marca-/.test(await cls(m)), 'and another long press leaves it unmarked');
await longPress(m); await longPress(m);   // stays 🚫 until the end: so no tap in the script uncovers it

// Clue 1: an own agent, one from clue 3 (scores without cutting) and then the assassin (cuts)
await tap(of(0)[0]);
ok(/de los tuyos/i.test(await ev(`document.querySelector('.aviso-ag').textContent`)), "an agent of the clue scores");
await tap(of(2)[0]);
ok(/otra pista/i.test(await ev(`document.querySelector('.aviso-ag').textContent`)) && (await clue()).startsWith(t.pistas[0].pista) && !await stamp(), "one from another clue scores and doesn't cut the clue");
await tap(of(null, 'asesino')[0]);
ok(/asesino/i.test(await ev(`document.querySelector('.aviso-ag').textContent`)) && await stamp() === 'Cortada', 'the assassin cuts the clue: it gets the Cortada stamp');
ok(await arrives(1), 'and the next one comes in');
// Clue 2: its three agents complete it and it moves on by itself
for (const i of of(1)) await tap(i);
ok(await stamp() === 'Completa', 'completing the clue gives it the Completa stamp');
ok(await arrives(2), 'and it moves to the next one');
// Clue 3: its two missing ones complete it (one was already found in clue 1)
for (const i of of(2).slice(1)) await tap(i);
ok(await arrives(3), 'an agent found earlier counts for its clue: with the other two it is complete');
// Clue 4, the last: one, the button says Terminar, and a neutral cuts the clue: it's over
await tap(of(3)[0]);
ok(/Terminar/.test(await ev(`document.getElementById('btn-pasar')?.textContent || ''`)), 'on the last clue the button says Terminar');
await tap(of(null, 'neutral')[0]);
ok(await waitFor(`document.querySelectorAll('#tablero .carta.sin-tocar').length > 0`, 3000), 'at the end the cards nobody touched are uncovered');
ok(await waitFor(`!!document.getElementById('puntaje')`), 'a neutral cuts the last clue and leads to the result');

// The result: what the engine says (the agents touched, 1 neutral, the assassin)
const total = t.pistas.reduce((a, p) => a + p.n, 0), found = 1 + t.pistas[1].n + t.pistas[2].n + 1;
const expected = Math.max(0, Math.round(100 * found / total) - 15 - 40);
ok(await waitFor(`document.getElementById('puntaje').textContent === '${expected}/100'`, 4000), `the score climbs to the engine's (${expected}/100)`);
ok(/descubrió el asesino/i.test(await ev(`document.querySelector('.sello-fin')?.textContent || ''`)), 'with the assassin, the end is the red stamp "Te descubrió el asesino"');
const trap = await ev(`document.getElementById('trampa')?.textContent || ''`);
const assassin = t.cartas.find(c => c.tipo === 'asesino');
ok(trap.includes(assassin.w) && trap.includes(t.pistas[assassin.tienta].pista) && /Caíste/.test(trap), `explains the trap: ${trap}`);
ok((await ev(`[...document.querySelectorAll('#tablero-fin .carta.asesino .de-pista')].map(x => x.textContent).join()`)).includes(t.pistas[assassin.tienta].pista), 'and under the assassin, the clue it was tempting with');
ok(await ev(`document.querySelectorAll('#tablero-fin .carta').length`) === 15, 'shows the whole board uncovered');
// Folded by default, and the end buttons in view without scrolling (C-8, D-309)
ok(await ev(`!document.getElementById('repaso-agentes').open`), 'the whole board comes folded');
ok(await ev(`(()=>{const b=document.getElementById('btn-otro');window.scrollTo(0,0);return b.getBoundingClientRect().bottom <= innerHeight})()`), 'the end buttons are visible without scrolling');
await ev(`document.querySelector('#repaso-agentes summary').click(); 1`); await sleep(1800);
ok(await ev(`document.getElementById('repaso-agentes').open && document.querySelector('#tablero-fin .carta').getBoundingClientRect().height > 0`), 'tapping it opens it with the 15 cards');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'the result can be shared');
const another = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(another) && !another.includes(SEED), `"Otro tablero" opens a new one (${another})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), "and since it wasn't today's, it offers today's");
ok(!await ev(`!!document.querySelector('.resultado #link-codenames')`), "the Codenames credit goes on the cover, not in the result (owner's request)");
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario') && k.at(-2)?.classList.contains('divisor')})()`), 'the comment is the last thing in the result (D-268), separated from the game by a line');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'no sideways scroll at 375 px');
await b.shot('03-end');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ agents (labs)');
