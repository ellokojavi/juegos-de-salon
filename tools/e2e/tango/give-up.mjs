// ☀️ Tango at its standalone page /tango/: 🏳️ Give up sits next to 🧹 Clear all; it asks to confirm,
// shows the solution and the game gives 0 points. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch } from '../cdp.mjs';

const OUT = output('/tmp/tango-give-up');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
try {
  await b.open(`${SITE}/tango/?test`, 2500);
  await ev(`document.getElementById('btn-empezar')?.click(); 1`);
  ok(await b.until(`document.querySelector('[data-tablero="tango"]')`, 9000), 'the board opens');
  ok(await ev(`!!document.getElementById('btn-borrar') && !!document.getElementById('btn-rendirse')`), 'Clear all and Give up are there');
  await b.shot('01-board');
  await ev(`window.confirm = () => true; document.getElementById('btn-rendirse').click(); 1`);
  ok(await b.until(`document.querySelector('.tan-grid.fin')`, 4000), 'giving up ends the board');
  ok(await ev(`[...document.querySelectorAll('.tan')].every(c => c.dataset.v !== '0')`), 'with the solution showing');
  ok(await ev(`!document.getElementById('btn-rendirse') && !!document.getElementById('btn-fin')`), 'the buttons go and See results comes');
  await b.shot('02-gave-up');
} catch (e) { ok(false, e.message); }
await b.close?.();
process.exit(failures ? 1 : 0);
