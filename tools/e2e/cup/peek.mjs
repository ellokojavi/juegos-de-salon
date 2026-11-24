// A name in a Cup's table opens that player's public profile (lab flag `ranking-peek`, player-peek.js; the owner,
// 2026-11-23: every ranking with names): only a seat with a name of its own (its `j`), headed by the Cup's name
// and that player's place and points in it, the row's 💬 still its own. At 320 and 390 px, no sideways scroll.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const KEY = 'juegos-de-salon:copa:prueba';

for (const W of [320, 390]) {
  const b = await launch({ dir: `${OUT}/p${W}`, out: OUT, width: W, height: W === 320 ? 640 : 844 });
  b.flags({ 'ranking-peek': 'all' });
  const ev = x => b.evaluate(x);
  await b.go(`${SITE}/cup/?test&demo=player`, 2500);
  // Cata has a name and a score; the demo's first other seat becomes hers
  const jid = await ev(`(async () => {
    const { jugador } = await import('/assets/js/jugador.js');
    const J = await jugador();
    await J.crear('Cata', '1111'); await J.anotar({ juego: 'reinas', s: 95, ms: 50000 });
    const jid = JSON.parse(localStorage.getItem('juegos-de-salon:jugador')).jid; J.salir();
    const db = JSON.parse(localStorage.getItem('${KEY}'));
    const code = new URLSearchParams(location.search).keys().toArray().find(k => /^[A-Z]{5}$/.test(k));
    const L = db[code], me = Object.keys(L._seats).find(p => !Object.keys(L._seats[p])[0].startsWith('otro-'));
    const other = Object.keys(L.players).find(p => p !== me);
    L.players[other].j = jid; localStorage.setItem('${KEY}', JSON.stringify(db));
    return jid + ':' + other;
  })()`);
  const [, other] = jid.split(':');
  await ev('location.reload()'); await sleep(3000);
  const row = `document.querySelector('.tabla .fila[data-pid="${other}"]')`;
  ok(await ev(`${row}?.getAttribute('role') === 'button' && !document.querySelector('.tabla .fila.yo[data-peek]')`), `${W}: the named seat's row is a button; a seat with no name of its own is not`);
  await ev(`(() => { const r = ${row}; r.scrollIntoView({ block: 'center' }); r.querySelector('.quien b').click(); })()`); await sleep(1500);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek'), h = p?.querySelector('.pf-peek-here'); return !!p && p.querySelector('.pf-peek-name').textContent.includes('Cata') && !!h && h.querySelector('.pf-peek-here-label').textContent.startsWith('🏆') && !!h.querySelector('.pf-peek-here-medal .pf-medal') && /\\d\\s*pts/.test(h.querySelector('.pf-peek-here-vals').textContent) && !h.querySelector('.pf-peek-here-all').textContent; })()`), `${W}: the sheet starts with this Cup, her place and points in it`);
  ok(await ev(`(() => { const p = document.getElementById('pf-peek').getBoundingClientRect(); return p.left >= 0 && p.right <= ${W} && document.documentElement.scrollWidth <= ${W}; })()`), `${W}: the sheet fits the screen`);
  await b.shot(`cup-peek-${W}`);
  await ev(`document.querySelector('#pf-peek .pf-peek-ok').click()`); await sleep(300);
  ok(await ev(`!document.getElementById('pf-peek')`), `${W}: Cerrar closes it`);
  b.close();
}
