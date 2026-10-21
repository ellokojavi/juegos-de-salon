// Uno al día with a game that has variants (D-334): the daily challenge is the same for everyone, so
// `?today` plays the default variant without offering the picker, even on a phone that remembers the
// other one. The page clock is fixed at noon on the first day each game is due, looked up in the deck
// (D-405: hand-written dates broke whenever a game joined). Prints ✗ if anything fails.
import { output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { juegoDel as gameOf, DESDE_MAS, sumarDias } from '../../public/assets/js/uno-al-dia.js';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const dayOf = id => { for (let i = 0; i < 200; i++) { const f = sumarDias(DESDE_MAS, i); if (gameOf(f) === id) return f; } return null; };
const CASES = [
  { day: dayOf('loteo'), id: 'loteo', path: 'plots', other: 'utilities', variant: () => 'window.__loteo?.P?.p?.variante' },
  { day: dayOf('pintaminas'), id: 'pintaminas', path: 'paint-mines', other: 'hard', variant: () => 'window.__pintaminas?.p?.variante' },
];
for (const c of CASES) if (!c.day) { console.log(`✗ ${c.id} never comes out in Uno al día`); process.exit(1); }

for (const c of CASES) {
  const b = await launch({ dir: `${OUT}/p-${c.id}`, out: OUT });
  const ev = x => b.evaluate(x);
  try {
    const [y, m, d] = c.day.split('-').map(Number);
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const D=Date,dif=new D(${y},${m - 1},${d},12,0,0).getTime()-D.now();
      class F extends D{constructor(...a){a.length?super(...a):super(D.now()+dif)} static now(){return D.now()+dif}}
      window.Date=F;})()` });
    // The phone remembers the other variant, as if the player had picked it standalone
    await b.open(`${SITE}/${c.path}/?test&lang=es`, 1200);
    await ev(`localStorage.setItem('juegos-de-salon:${c.id}:variant','${c.other}'); 1`);
    await b.open(`${SITE}/${c.path}/?today&test&lang=es`, 1500);
    ok(await b.until(`!!document.getElementById('btn-empezar')`, 6000), `${c.id}: today's waiting room opens on ${c.day}`);
    ok(await ev(`!document.getElementById('selector-variante') && !document.getElementById('btn-dificil')`), `${c.id}: no variant picker in Uno al día`);
    await ev(`document.getElementById('btn-empezar').click(); 1`);
    await b.until(`!document.getElementById('cuenta') || document.getElementById('cuenta').classList.contains('ya')`, 8000, 50); await sleep(1200);
    const v = await ev(c.variant());
    ok(v && v !== c.other, `${c.id}: it plays the default variant (${v}), not the remembered one`);
    ok(await ev(`localStorage.getItem('juegos-de-salon:${c.id}:variant')`) === c.other, `${c.id}: and the standalone choice stays remembered`);
    await b.shot(`today-${c.id}`);
  } finally {
    b.close();
  }
}
console.log(process.exitCode ? '✗ daily variants' : '✓ daily variants');
