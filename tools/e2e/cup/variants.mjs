// La Copa with variants (D-331), end to end: a 3-day Cup (the test store offers it) whose two game
// days are 🖌️ Pintaminas and 📐 Loteo. The admin picks ⚡ hard and ⚡💧 Utilities below the week; the
// cup saves `pintaminas:hard` and `loteo:utilities`; a second player signs up; each day's card, its
// waiting room and its rules say the variant, and the board that comes out is the variant's (two
// colors; ⚡ and 💧 in plots of the same size). The random week picks the default variants.
// Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = output('/tmp/cup-variants');
mkdirSync(OUT, { recursive: true });
const b = await launch({ dir: `${OUT}/profile`, out: OUT });
const SITE = process.env.SITE || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const click = sel => ev(`(()=>{const x=document.querySelector(${JSON.stringify(sel)});if(!x)return 'missing';if(x.disabled)return 'disabled';x.click();return 'ok'})()`);
const screen = () => ev('__copa.estado.pantalla');
const DAY = 24 * 60 * 60 * 1000;

try {
  await b.open(`${SITE}/cup/?test&lang=es`, 1200);
  await ev(`window.confirm=()=>true; navigator.share=async()=>{}; 1`);
  await b.until(`!!document.getElementById('btn-crear')`, 5000);
  await click('#btn-crear');
  await b.until(`document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)').length >= 4`, 5000);
  await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)')];i[0].value='Copa variantes';i[1].value='Cata';i[2].value='1111';i[3].value='1111';return 1})()`);
  // The 3-day cup, starting today
  await ev(`(()=>{const o=[...document.querySelectorAll('#crear-body .opcion')];o.find(x=>/^Copa de 3 días/.test(x.textContent)).click();o.find(x=>/^Hoy/.test(x.textContent.trim())).click();return 1})()`);
  await sleep(200);
  // Shuffles until the two game days are Pintaminas and Loteo
  const both = await ev(`(()=>{const has=()=>{const d=[...document.querySelectorAll('#cal-elegir .event[data-dia]')].map(x=>x.dataset.juego);return d.includes('pintaminas')&&d.includes('loteo')};
    for(let k=0;k<400&&!has();k++)document.getElementById('btn-azar').click();return has()})()`);
  ok(both, 'the random week can bring Pintaminas and Loteo');
  ok(await ev(`[...document.querySelectorAll('#cal-variantes [data-variantes]')].map(x=>x.dataset.variantes).sort().join()`) === 'loteo,pintaminas',
    'below the week, one variant row for each game that has them');
  ok(await ev(`[...document.querySelectorAll('#cal-variantes .opcion.on')].map(x=>x.textContent).join('|')`).then(t => /Números/.test(t) && /Fácil/.test(t)),
    'each row starts on its default variant');
  await ev(`(()=>{document.querySelectorAll('[data-variantes="pintaminas"] .opcion')[1].click();document.querySelectorAll('[data-variantes="loteo"] .opcion')[1].click();return 1})()`);
  // Moving a day keeps the variant: it goes with the game
  await ev(`(()=>{const d=document.querySelectorAll('#cal-elegir .event[data-dia]');d[0].click();document.querySelector('#cal-elegir .slot[data-slot="2"]')?.click();return 1})()`);
  await b.shot('create');
  await click('#btn-crear-go'); await sleep(900);
  const cal = await ev('__copa.estado.copa.meta.cal');
  ok(/^(pintaminas:hard,loteo:utilities|loteo:utilities,pintaminas:hard),final$/.test(cal), `the cup saves each day with its variant (${cal})`);
  const CODE = await ev('__copa.estado.code');

  // A second player, so the days can start
  await ev('sessionStorage.clear(); 1');
  await b.open(`${SITE}/cup/?${CODE}&test&lang=es`, 1200);
  await click('#tab-nuevo'); await sleep(150);
  await ev(`(()=>{const i=[...document.querySelectorAll('#entrar-body input')];i[0].value='Javi';i[1].value='2222';i[2].value='2222';return 1})()`);
  await click('#btn-inscribir'); await b.until(`__copa.estado.pantalla === 'tablero'`, 500, 30);
  ok(await screen() === 'tablero', 'Javi signs up');

  const days = cal.split(',').slice(0, 2);
  for (let d = 1; d <= 2; d++) {
    if (d === 2) { await ev(`__copa.store.adelantar(${DAY}); 1`); await b.open(`${SITE}/cup/?${CODE}&test&lang=es`, 1200); }
    const hard = days[d - 1].startsWith('pintaminas');
    const label = hard ? '⚡ Difícil' : '⚡💧 Servicios';
    ok(await b.until(`!!document.querySelector('[data-dia="${d}"]')`, 300, 20), `day ${d} can be played`);
    ok((await ev(`document.querySelector('.screen.active').innerText`)).includes(label), `the day's card says ${label}`);
    await click(`[data-dia="${d}"]`); await sleep(400);
    ok((await ev(`document.getElementById('variante-dia')?.textContent || ''`)) === label, `day ${d}'s waiting room says the variant under the name`);
    await b.shot(`waiting-${d}`);
    await click('#btn-empezar');
    await b.until(`!document.getElementById('cuenta') || document.getElementById('cuenta').classList.contains('ya')`, 8000, 50); await sleep(1200);
    if (hard) {
      ok(await ev(`window.__pintaminas?.p?.variante`) === 'hard' && await ev(`(c=>Array.isArray(c)?c.length:c)(window.__pintaminas?.p?.colores)`) === 2, 'Pintaminas comes out hard: two colors');
      ok(await ev(`!!document.getElementById('btn-tinta2')`), 'with three brushes');
    } else {
      ok(await ev(`window.__loteo?.P?.p?.variante`) === 'utilities', 'Loteo comes out in Utilities');
      ok(await ev(`window.__loteo?.P?.t?.modo`) === 'servicios', 'with ⚡ and 💧 on the board');
    }
    ok((await ev(`document.querySelector('#reglas')?.textContent || ''`)).includes(label), 'the folded rules say the variant too');
    await b.shot(`game-${d}`);
    await b.open(`${SITE}/cup/?${CODE}&test&lang=es`, 1200);
  }
} finally {
  await b.close();
}
console.log(process.exitCode ? '✗ cup variants' : '✓ cup variants');
