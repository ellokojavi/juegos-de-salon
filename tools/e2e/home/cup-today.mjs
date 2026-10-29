// La Copa's card on the home page (flag copa-hoy, in the lab): with a day of this phone's cup left to
// play, ▶ Jugar hoy and a link to that day, at One a Day's height; once played, ✅ Día 3 abre en…
// (flag copa-espera, in the lab), still at One a Day's height; with the final played, ✅ Final jugada · cierra en….
// Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { nuevaMeta, porJugar } from '../../../public/cup/engine.js';
const OUT = output('/tmp/home-cup-today');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

// A 7-day cup that started yesterday: day 1 in its grace day and day 2 open
const inicio = new Date(Date.now() - 24 * 3600e3).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
const meta = nuevaMeta({ nombre: 'Copa', dias: 7, inicio, tz: 'America/Los_Angeles', admin: 'aaaaaa', creada: 0 });
const L = { meta, players: { aaaaaa: { name: 'Ana', at: 1 } }, results: {} };
const jugada = { ...L, results: { 1: { aaaaaa: { s: 1, ms: 1 } }, 2: { aaaaaa: { s: 1, ms: 1 } } } };

// The same cup on its last day, every day played: the final played, the cup still open
const ultimo = nuevaMeta({ nombre: 'Copa', dias: 7, inicio: new Date(Date.now() - 6 * 24 * 3600e3).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }), tz: 'America/Los_Angeles', admin: 'aaaaaa', creada: 0 });
const final = { meta: ultimo, players: L.players, results: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(d => [d, { aaaaaa: { s: 1, ms: 1 } }])) };

for (const [width, cup, name] of [[390, L, 'pending'], [320, L, 'pending-320'], [390, jugada, 'played'], [390, final, 'final']]) {
  const b = await launch({ dir: `${OUT}/p-${name}`, out: OUT, width, height: 800 });
  const ev = e => b.evaluate(e);
  const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
  await b.go(`${SITE}/?test`);
  await ev(`localStorage.setItem('juegos-de-salon:copa:mias', ${JSON.stringify(JSON.stringify([{ code: 'K7Q2X', nombre: 'Ana', copa: 'Copa' }]))});
    localStorage.setItem('juegos-de-salon:copa:hoy:K7Q2X', ${JSON.stringify(JSON.stringify(porJugar(cup, 'aaaaaa', Date.now())))});
    localStorage.setItem('juegos-de-salon:copa:lista:K7Q2X', ${JSON.stringify(JSON.stringify(cup))}); 1`);
  await b.go(`${SITE}/?test`);
  await waitFor(`!!document.querySelector('.uad-card:not(.reserva)')`);
  const card = `document.querySelector('.game-card.torneo')`;
  if (cup === L) {
    ok(await waitFor(`!!document.getElementById('copa-hoy-chip')`), `${width}px: ▶ Jugar hoy on La Copa's card`);
    ok(await ev(`${card}.getAttribute('href').endsWith('cup/?K7Q2X&day=1')`), `${width}px: it opens the day left (day 1, in its grace day)`);
    ok(await ev(`Math.abs(${card}.offsetHeight - document.querySelector('.uad-card').offsetHeight) <= 1`), `${width}px: as tall as One a Day's card`);
    ok(await ev(`${card}.scrollWidth <= ${card}.clientWidth + 1`), `${width}px: nothing overflows the card`);
  } else if (cup === final) {
    ok(await waitFor(`/^✅ Final jugada · cierra en \\d/.test(document.getElementById('copa-hoy-chip')?.textContent || '')`), 'final played: ✅ Final jugada · cierra en…');
    ok(await ev(`${card}.getAttribute('href').endsWith('cup/?K7Q2X')`), 'final played: it opens the cup');
  } else {
    ok(await waitFor(`/^✅ Día 3 abre en \\d/.test(document.getElementById('copa-hoy-chip')?.textContent || '')`), 'played today: ✅ Día 3 abre en…');
    ok(await ev(`${card}.getAttribute('href').endsWith('cup/?K7Q2X')`), 'played today: it opens the cup');
    ok(await ev(`Math.abs(${card}.offsetHeight - document.querySelector('.uad-card').offsetHeight) <= 1`), 'played today: as tall as One a Day\'s card');
  }
  await b.shot(name);
  b.close();
}
process.exit(failures ? 1 : 0);
