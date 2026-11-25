// A duel's own page (lab flag rivals, /duels/?d=…) with the duels' test data on (duels-demo.js, a
// switch on /labs/): the made-up duels join the player's list (stats, arch rival, nemesis), a row
// opens its duel, and the duel shows its card and round by round: decided rounds, your turn with
// ▶ Play and the rival's score hidden, rounds ahead locked, rounds not needed. At 390 and 320 px: no
// sideways scroll. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = output('/tmp/duels-duel-page');
mkdirSync(OUT, { recursive: true });
const b = await launch({ dir: `${OUT}/profile`, out: OUT, width: 390, height: 844 });
const SITE = process.env.SITE || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);

try {
  await b.go(`${SITE}/labs/`, 1500);
  await ev(`localStorage.clear(); sessionStorage.clear(); 1`);
  await ev(`import('/assets/js/jugador.js').then(async ({ jugador }) => { const J = await jugador(); await J.crear('Javi', '1234'); return 1; })`);
  // The switch on the Duels card of /labs/
  await b.go(`${SITE}/labs/`, 1500);
  await b.until(`/no$/.test(document.getElementById('btn-duels-demo')?.textContent || '')`, 6000);
  await ev(`document.getElementById('btn-duels-demo').click(); 1`);
  ok(await ev(`localStorage.getItem('juegos-de-salon:duels-demo') === '1' && /sí$/.test(document.getElementById('btn-duels-demo').textContent)`), 'the /labs/ switch turns the test duels on');

  await b.go(`${SITE}/duels/`, 1500);
  await b.until(`!!document.getElementById('dl-rivalidades')`, 8000);
  ok(await ev(`!!document.getElementById('dl-arch') && /Beto/.test(document.getElementById('dl-arch').textContent)`), 'Beto is the arch rival');
  ok(await ev(`!!document.getElementById('dl-nemesis') && /Ana/.test(document.getElementById('dl-nemesis').textContent)`), 'Ana is the nemesis');
  ok(await ev(`document.querySelectorAll('#dl-mios .dl-row-link').length === 3`), 'three open duels, each a link to its page');
  await b.shot('list-390');

  // My turn: round 3 of a best of 5 against Beto
  await b.go(`${SITE}/duels/?d=demo000001`, 1500);
  await b.until(`!!document.getElementById('dl-hero')`, 8000);
  ok(await ev(`document.querySelectorAll('.dl-paso').length === 5`), 'five rounds on the track');
  ok(await ev(`document.querySelector('.dl-paso[data-round="0"]').classList.contains('w') && document.querySelector('.dl-paso[data-round="1"]').classList.contains('l')`), 'round 1 won, round 2 lost');
  ok(await ev(`(()=>{const p=document.querySelector('.dl-paso[data-round="2"]');return p.classList.contains('ahora') && !!p.querySelector('a[href*="seed=DEMOC"]') && !/95/.test(p.textContent)})()`), "round 3 is mine to play, the rival's 95 hidden");
  ok(await ev(`document.querySelectorAll('.dl-paso.futuro').length === 2`), 'rounds 4 and 5 still to play');
  ok(await ev(`/arch|Beto/i.test(document.querySelector('.dl-hero-pie')?.textContent || '')`), 'the head to head with Beto under the card');
  for (const W of [390, 320]) {
    await b.resize(W, 844); await sleep(300);
    ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: my turn, no sideways scroll`);
    await b.shot(`turn-${W}`);
  }
  await b.resize(390, 844);
  // Waiting for Caro: my round 2 played, theirs pending
  await b.go(`${SITE}/duels/?d=demo000003`, 1500);
  await b.until(`!!document.getElementById('dl-hero')`, 8000);
  ok(await ev(`document.querySelector('.dl-paso[data-round="1"]').classList.contains('medio')`), 'a round I played waits for the rival');
  await b.shot('waiting-390');
  // Finished early: a best of 3 lost 0–2 to Ana, round 3 not needed, ⚔️ Rematch
  await b.go(`${SITE}/duels/?d=demo000004`, 1500);
  await b.until(`!!document.getElementById('dl-hero')`, 8000);
  ok(await ev(`document.querySelector('.dl-paso[data-round="2"]').classList.contains('nada') && !!document.getElementById('dl-revancha')`), 'a round not needed, and ⚔️ Rematch');
  ok(await ev(`/némesis/.test(document.querySelector('.dl-hero-pie').textContent)`), 'Ana tagged as the nemesis');
  for (const W of [390, 320]) {
    await b.resize(W, 844); await sleep(300);
    ok(await ev(`document.documentElement.scrollWidth <= ${W}`), `${W}: a finished duel, no sideways scroll`);
    await b.shot(`lost-${W}`);
  }
} finally {
  await b.close();
}
