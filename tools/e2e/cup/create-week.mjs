// La Copa's new create screen (D-425), end to end, as a lab key holder sees it (`?test&lab`; on
// localhost the lab opens by itself): the week is in view from the start; 🎲 Crear al azar draws
// it again, the cards spinning like a slot machine, and on a small phone it scrolls the week into view; each week style draws by its rule; tapping a game opens the sheet
// with the whole pool, which swaps, replaces, moves the day and picks
// its version; a day is still dragged by its grip; the PIN goes once, with 👁; "More options"
// folds the language, the audience and the link, and says in one line what is chosen; the length
// (3 or 7 days) goes up front (D-437); under the button, when the cup starts and ends. The cup created saves
// the week as shown. Without `&lab` the test store keeps the screen of before (cup/tournament.mjs).
// Last, the week and the sheet in English, Portuguese and German at 320 px: no sideways scroll.
// Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = output('/tmp/cup-create-week');
mkdirSync(OUT, { recursive: true });
const b = await launch({ dir: `${OUT}/profile`, out: OUT, width: 360, height: 760 });
const SITE = process.env.SITE || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const click = sel => ev(`(()=>{const x=document.querySelector(${JSON.stringify(sel)});if(!x)return 'missing';if(x.disabled)return 'disabled';x.click();return 'ok'})()`);
const week = async () => JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('#semana-dias .semana-dia')].map(x=>x.dataset.juego))`));
const openSheet = async i => { await ev(`(document.querySelectorAll('#semana-dias .semana-juego')[${i}].click(), 1)`); await b.until(`!!document.getElementById('semana-hoja')`, 1500); };
const center = sel => ev(`(()=>{const r=document.querySelector('${sel}').getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]})()`);

try {
  // The screen of before stays for the test store without &lab
  await b.open(`${SITE}/cup/?test&lang=es`, 1200);
  await ev('localStorage.clear(); sessionStorage.clear(); 1');
  await b.open(`${SITE}/cup/?test&lang=es`, 1200);
  await b.until(`!!document.getElementById('btn-crear')`, 5000);
  await click('#btn-crear'); await sleep(500);
  ok(!!await ev(`document.getElementById('crear-juegos')`) && !await ev(`document.getElementById('crear-semana')`), 'without &lab, the test store shows the create screen of before');

  await b.open(`${SITE}/cup/?test&lab&lang=es`, 1200);
  await ev(`window.confirm=()=>true; 1`);
  await b.until(`!!document.getElementById('btn-crear')`, 5000);
  await click('#btn-crear');
  await b.until(`!!document.getElementById('crear-semana')`, 3000);

  // The week, in view from the start: six games and the final, a balanced draw
  const w0 = await week();
  ok(w0.length === 6 && new Set(w0).size === 6, `the week is in view from the start, six different games (${w0.join(', ')})`);
  ok(/La Gran Final/.test(await ev(`document.querySelector('.semana-final').textContent`)) && /Repite los 6 juegos/.test(await ev(`document.querySelector('.semana-final').textContent`)),
    'the final closes the week and says it replays the six games (D-418)');
  ok(await ev(`document.querySelector('#semana-estilos [data-estilo="equilibrada"]').getAttribute('aria-pressed')`) === 'true', 'it starts as a Balanced week');
  ok(!await ev(`document.querySelector('#semana-mezcla .muchas')`), 'a balanced week has no skill more than twice');
  ok(!await ev(`document.documentElement.scrollWidth > innerWidth`), 'no sideways scroll at 360 px');
  await b.shot('01-week');

  // 🎲 Make it random draws the whole week again; there are no locks (the owner's review)
  ok(/Crear al azar/.test(await ev(`document.getElementById('btn-dado').textContent`)), 'the yellow button says "🎲 Crear al azar"');
  ok(!await ev(`document.querySelector('#semana-dias .candado')`), 'no 🔒 on the days');
  let changed = false, valid = true;
  for (let k = 0; k < 6; k++) {
    await click('#btn-dado'); await sleep(60);
    const w = await week();
    valid &&= w.length === 6 && new Set(w).size === 6;
    changed ||= JSON.stringify(w) !== JSON.stringify(w0);
  }
  ok(valid && changed, '🎲 draws another week of six different games');
  // The roll: the cards run through random games and land one after the other, on the real week
  {
    await click('#btn-dado'); await sleep(40);
    const spinning = await ev(`document.querySelectorAll('#semana-dias .semana-dia.baraja').length`);
    ok(spinning === 6, `pressing 🎲, the six cards spin (${spinning})`);
    await sleep(500);
    const midway = await ev(`document.querySelectorAll('#semana-dias .semana-dia.baraja').length`);
    ok(midway > 0 && midway < 6, `and they land one after the other (${6 - midway} landed at ~0.5 s)`);
    await sleep(600);
    const landed = await ev(`(async()=>{const {juegosCopa}=await import('/cup/rules.js');const J=juegosCopa('es');
      const f=[...document.querySelectorAll('#semana-dias .semana-dia')];
      return !document.querySelector('#semana-dias .baraja') && f.every(x=>x.querySelector('.semana-juego b').textContent===J[x.dataset.juego].nombre)})()`);
    ok(landed, 'in under a second every card is still and shows the week drawn');
  }
  // On a small phone (320×640) the week starts below the 🎲: rolling scrolls it into view
  {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
    await ev(`(scrollTo(0, 0), 1)`); await sleep(200);
    const before = JSON.parse(await ev(`JSON.stringify(document.getElementById('semana-dias').getBoundingClientRect())`));
    await click('#btn-dado'); await sleep(900);
    const after = JSON.parse(await ev(`JSON.stringify({ dado: document.getElementById('btn-dado').getBoundingClientRect().top, lista: document.getElementById('semana-dias').getBoundingClientRect() })`));
    ok(before.bottom > 640 && after.dado >= 0 && after.dado < 40 && after.lista.bottom <= 640,
      `at 320×640 the roll scrolls the week into view (the 🎲 at ${Math.round(after.dado)} px, the week ends at ${Math.round(after.lista.bottom)} px)`);
    await b.shot('04-roll-small');
    await click('#btn-dado'); await sleep(900);
    ok(Math.abs(await ev(`document.getElementById('btn-dado').getBoundingClientRect().top`) - after.dado) < 2, 'with the week already in view, rolling again does not move the page');
    await b.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 760, deviceScaleFactor: 2, mobile: true });
  }

  // The styles: each one draws by its rule
  const PUZZLES = ['reinas', 'zip', 'tango', 'loteo', 'desenredo', 'rutas', 'pintaminas'];
  const KNOWLEDGE = ['linea', 'anio', 'donde', 'agentes', 'numero', 'letras'];
  await click('#semana-estilos [data-estilo="puzzles"]'); await sleep(500);
  const wp = await week();
  ok(wp.every(id => PUZZLES.includes(id)), `🧩 Puzzles draws a week of board games (${wp.join(', ')})`);
  ok(!await ev(`document.querySelector('#semana-mezcla .muchas')`), 'and the skill it asked for is not marked as repeated');
  await click('#semana-estilos [data-estilo="saber"]'); await sleep(500);
  const ws = await week();
  ok(ws.every(id => KNOWLEDGE.includes(id)), `🧠 Trivia and words draws its six (${ws.join(', ')})`);
  await click('#semana-estilos [data-estilo="equilibrada"]'); await sleep(500);

  // More options: folded, with what is chosen in one line; the 3-day cup lives there in the test store
  ok(await ev(`!document.getElementById('crear-mas').open`), '"More options" starts folded');
  ok(await ev(`document.getElementById('crear-resumen').textContent`) === 'Español · 🇨🇱 Chile · sin link propio', `and says what is inside (${await ev(`document.getElementById('crear-resumen').textContent`)})`);
  await ev(`(document.querySelector('#crear-mas summary').click(), 1)`); await sleep(150);
  await ev(`(()=>{const i=document.getElementById('crear-link');i.value='Primos';i.dispatchEvent(new Event('input'));return 1})()`); await sleep(500);
  await ev(`([...document.querySelectorAll('#crear-alcance .opcion')][0].click(), 1)`);
  ok(await ev(`document.getElementById('crear-resumen').textContent`) === 'Español · 🌎 Global · ?primos', 'the line follows the link and the audience');
  ok(!await ev(`[...document.querySelectorAll('#crear-mas .opcion')].some(x=>/días/.test(x.textContent))`), 'the length is not in "More options" (D-437)');
  await b.shot('03-more');
  // The length goes up front, next to when it starts: 7 days by default, 3 draws two games (D-437)
  ok(await ev(`document.querySelector('#crear-modo .opcion.on')?.textContent || ''`).then(t => /7 días/.test(t)), 'the length is in the first panel, at seven days');
  await ev(`([...document.querySelectorAll('#crear-modo .opcion')].find(x=>/7 días/.test(x.textContent)).click(), 1)`);
  await ev(`([...document.querySelectorAll('#crear-modo .opcion')].find(x=>/3 días/.test(x.textContent)).click(), 1)`); await sleep(200);
  ok((await week()).length === 2 && await ev(`document.querySelector('.semana-titulo').textContent`) === 'Los 3 días', 'the 3-day cup draws two games under "Los 3 días"');
  ok(/Repite los 2 juegos/.test(await ev(`document.querySelector('.semana-final').textContent`)), 'and its final replays the two');
  await b.shot('05-three-days');
  await ev(`([...document.querySelectorAll('#crear-modo .opcion')].find(x=>/7 días/.test(x.textContent)).click(), 1)`); await sleep(200);
  ok((await week()).length === 6 && await ev(`document.querySelector('.semana-titulo').textContent`) === 'La semana', 'and back to seven, six games under "La semana"');
  await b.shot('03-more');

  // The sheet: the whole pool, each game with its tagline
  await openSheet(2);
  ok(await ev(`document.querySelectorAll('#semana-hoja .hoja-juego').length`) === 13, 'tapping a game opens the sheet with the 13 games of the pool');
  ok(await ev(`[...document.querySelectorAll('#semana-hoja .hoja-juego small')].every(x=>x.textContent.length>10)`), 'each one says what it is');
  await b.shot('02-sheet');
  // Replacing day 3 with a game outside the week
  const before = await week();
  const outside = await ev(`[...document.querySelectorAll('#semana-hoja .hoja-juego')].map(x=>x.dataset.juego).find(id=>!${JSON.stringify(before)}.includes(id))`);
  await click(`#semana-hoja .hoja-juego[data-juego="${outside}"]`); await sleep(200);
  let w = await week();
  ok(!await ev(`document.getElementById('semana-hoja')`) && w[2] === outside && !w.includes(before[2]), `picking a game outside the week replaces the day (${before[2]} → ${outside})`);
  ok(await ev(`document.querySelector('#semana-estilos .estilo.on')`) === null, 'a week changed by hand has no style marked');
  // Picking one already in the week swaps the two days
  await openSheet(0);
  const other = w[4];
  await click(`#semana-hoja .hoja-juego[data-juego="${other}"]`); await sleep(200);
  const w2 = await week();
  ok(w2[0] === other && w2[4] === w[0], `picking a game already in the week swaps the two days (${w[0]} ⇄ ${other})`);
  // Moving a day with the sheet's arrows
  await openSheet(0);
  ok(await ev(`document.querySelector('#semana-hoja [data-mover="-1"]').disabled`), 'the first day cannot go earlier');
  await click('#semana-hoja [data-mover="1"]'); await sleep(200);
  const w3 = await week();
  ok(w3[1] === w2[0] && w3[0] === w2[1], 'One day later moves it one day down');
  // Escape and a tap outside close the sheet without changing anything
  await openSheet(3);
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); 1`); await sleep(100);
  ok(!await ev(`document.getElementById('semana-hoja')`) && JSON.stringify(await week()) === JSON.stringify(w3), 'Escape closes the sheet, nothing changes');
  await openSheet(3);
  await ev(`(document.querySelector('#semana-hoja .hoja-fondo').click(), 1)`); await sleep(100);
  ok(!await ev(`document.getElementById('semana-hoja')`) && JSON.stringify(await week()) === JSON.stringify(w3), 'a tap outside closes it too');

  // A version is picked in the sheet: Pintaminas goes in and gets Difícil
  {
    const now = await week();
    const i = now.indexOf('pintaminas') >= 0 ? now.indexOf('pintaminas') : 5;
    if (now[i] !== 'pintaminas') { await openSheet(i); await click('#semana-hoja .hoja-juego[data-juego="pintaminas"]'); await sleep(200); }
    const at = (await week()).indexOf('pintaminas');
    await openSheet(at);
    await ev(`([...document.querySelectorAll('#semana-hoja .opciones.variantes .opcion')][1].click(), 1)`); await sleep(100);
    ok(await ev(`document.getElementById('hoja-listo').classList.contains('btn--yellow')`), 'the sheet\'s Listo is yellow');
    await click('#hoja-listo'); await sleep(100);
    ok(/Difícil/.test(await ev(`document.querySelectorAll('#semana-dias .semana-juego small')[${at}].textContent`)), 'the version is picked in the sheet and shows on the day');
  }

  // Dragging by the grip, with a finger: the first day goes to the last place
  {
    const finger = (type, p) => b.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p[0], y: p[1], id: 1 }] });
    await ev(`(document.getElementById('semana-dias').scrollIntoView({block:'center'}), 1)`); await sleep(150);
    const pre = await week();
    const from = await center('#semana-dias .semana-dia[data-dia="0"] .agarre');
    const to = await center('#semana-dias .semana-dia[data-dia="5"]');
    await finger('touchStart', from); await finger('touchMove', [from[0], from[1] + 20]); await sleep(16);
    for (let k = 1; k <= 10; k++) { await finger('touchMove', [from[0], Math.round(from[1] + (to[1] + 8 - from[1]) * k / 10)]); await sleep(16); }
    await sleep(100); await finger('touchEnd', to); await sleep(300);
    const post = await week();
    ok(post[5] === pre[0] && JSON.stringify(post.slice(0, 5)) === JSON.stringify(pre.slice(1)), `a day is dragged by its grip (${pre[0]} to day 6)`);
    ok(!await ev(`document.querySelector('.vilo.on')`), 'and no card is left floating');
  }

  // One PIN with 👁, and the dates under the button
  ok(await ev(`document.querySelectorAll('#crear-body input.pin').length`) === 1, 'the PIN is asked once');
  await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)')];i[0].value='Copa de los primos';i[1].value='Cata';i[2].value='1111';return 1})()`);
  await click('#ver-pin');
  ok(await ev(`document.querySelector('#crear-body input.pin').type`) === 'text' && await ev(`document.getElementById('ver-pin').getAttribute('aria-pressed')`) === 'true', '👁 shows the PIN');
  await click('#ver-pin');
  ok(await ev(`document.querySelector('#crear-body input.pin').type`) === 'password', 'and hides it again');
  ok(await ev(`document.getElementById('crear-fechas').textContent`) === '', 'no dates before choosing when it starts');
  {
    const starts = await ev(`[...document.querySelectorAll('#crear-body .opciones.tres')][0].textContent`);
    ok(/^Ahora \(\p{L}{2,4}\)Mañana \(\p{L}{2,4}\)Otra fecha$/u.test(starts.trim()), `the start says Now and Tomorrow with their weekday (${starts.trim()})`);
  }
  await ev(`([...document.querySelectorAll('#crear-body .opcion')].find(x=>/Mañana/.test(x.textContent)).click(), 1)`); await sleep(100);
  ok(/^Parte el .+ y termina el .+\.$/.test(await ev(`document.getElementById('crear-fechas').textContent`)), `under the button, when it starts and ends (${await ev(`document.getElementById('crear-fechas').textContent`)})`);

  // Creating: the cup saves the week as shown
  const final = await week();
  const pinta = final.indexOf('pintaminas');
  await click('#btn-crear-go');
  await b.until(`__copa.estado.copa?.meta`, 3000); await sleep(500);
  const cal = await ev('__copa.estado.copa.meta.cal');
  const expected = [...final.map((id, i) => (i === pinta ? 'pintaminas:hard' : id)), 'final'].join(',');
  ok(pinta >= 0 && cal === expected, `the cup saves the week as shown, with its version (${cal})`);
  ok(/\?primos&test$/.test(await ev('location.search')), 'with its own link');
  // The other three languages at 320 px: the week and a day's sheet fit, with no sideways scroll
  await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 760, deviceScaleFactor: 2, mobile: true });
  for (const lang of ['en', 'pt', 'de']) {
    await b.open(`${SITE}/cup/?test&lab&lang=${lang}`, 1200);
    await b.until(`!!document.getElementById('btn-crear')`, 5000);
    await click('#btn-crear');
    await b.until(`!!document.getElementById('crear-semana')`, 3000);
    const wide = () => ev(`document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('#crear-semana *, #semana-hoja *')].some(x => x.scrollWidth > x.clientWidth + 1 && getComputedStyle(x).overflowX === 'visible' && x.children.length === 0)`);
    ok(!await wide(), `${lang}: the week fits at 320 px`);
    await ev(`(document.getElementById('crear-semana').scrollIntoView({block:'start'}), 1)`); await sleep(150);
    await b.shot(`lang-${lang}-week`);
    await openSheet(5);
    ok(!await wide(), `${lang}: a day's sheet fits at 320 px`);
    await b.shot(`lang-${lang}-sheet`);
  }
} catch (e) {
  ok(false, `the script broke: ${e.message}`);
} finally {
  b.close();
}
console.log(process.exitCode ? '✗ cup create week' : '✓ cup create week');
