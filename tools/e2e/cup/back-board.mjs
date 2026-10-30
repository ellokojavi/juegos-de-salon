// The header's ‹ inside a cup (#1040): on a day's cover, while playing it and on its result it says
// «Volver a la copa» and goes to the cup's board, never to the menu; mid-day it asks first (D-432).
// Runs with the lab flag `cup-back-board` on: localhost holds the lab key.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { LOCALES } from '../../../public/cup/rules.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const T = LOCALES.es;
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const pill = () => ev(`(()=>{const a=document.getElementById('btn-menu');return {t:a.textContent,h:a.href,s:document.querySelector('.screen.active')?.id}})()`);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };

const BOARD = `‹ ${T.toBoard}`;
const toBoard = h => /\/cup\/\?[A-Za-z0-9-]+/.test(h) && !h.endsWith('/cup/');

await b.go(`${SITE}/cup/?test&demo=player`, 2000);
const board = await pill();
ok(board.s === 'screen-tablero' && board.h === `${SITE}/`, `on the board, ‹ goes to the menu (${board.t} → ${board.h})`);

await ev(`document.querySelector('button[data-dia]').click()`);
await sleep(800);
let p = await pill();
ok(p.t === BOARD && toBoard(p.h), `a day's cover: «${p.t}» with a real link to the board (${p.h})`);

// The trial run goes back to the day's cover
await ev(`document.getElementById('btn-ensayo').click()`);
await sleep(1200);
p = await pill();
ok(p.t === BOARD && toBoard(p.h), `the trial run: «${p.t}»`);
await ev(`document.getElementById('btn-menu').click()`);
ok(await waitFor(`!!document.getElementById('btn-empezar')`), 'from the trial run, ‹ lands on the day\'s cover');

// A real day: the same pill, and the back guard asks before leaving
await ev(`document.getElementById('btn-empezar').click()`);
await sleep(1200);
p = await pill();
ok(p.s === 'screen-jugar' && p.t === BOARD && toBoard(p.h), `playing a day: «${p.t}» → the board, not the menu (${p.h})`);
// The day's countdown first: the guard is on once the game is
await waitFor(`history.state?.backGuard`);
await sleep(2500);
await ev(`document.getElementById('btn-menu').click()`);
ok(await waitFor(`!!document.getElementById('back-guard')`), 'mid-day, ‹ asks «¿Salir de la partida?» first (D-432)');
await b.shot('cup-back-board');
await b.close();
