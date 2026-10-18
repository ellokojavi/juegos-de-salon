// La Copa end to end (LIG-27): a 7-day Cup with three players in a single Chrome, using the
// test store (`?test`) and the clock moved forward day by day. Each "phone" is the same tab
// with sessionStorage cleared: the test account lives there.
//
// Usage: python3 -m http.server 8765 (in another terminal) and node tools/e2e/cup/tournament.mjs <output-folder>
// With --tres it plays the 3-day Cup (the trial one, D-100), which is shorter.
// With --part cup|labs|demos it runs only that part: they are independent, and GitHub runs
// each one in its own job so the PR doesn't wait for the whole script (ci.mjs).
// The README screenshots come from here (docs/capturas.json): the shots with a fixed name.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';
import { POZO } from '../../../public/cup/engine.js';
import { slugDe } from '../../../public/assets/js/games.js';

const OUT = output('/tmp/cup');
const SEVEN = !process.argv.includes('--tres');
const PART = process.argv.includes('--part') ? process.argv[process.argv.indexOf('--part') + 1] : null;
if (PART && !['cup', 'labs', 'demos'].includes(PART)) throw new Error(`--part ${PART}: must be cup, labs or demos`);
const runs = part => !PART || PART === part;
mkdirSync(OUT, { recursive: true });
// cdp.mjs picks the Chrome port (D-213); CDP_PORT pins it, if wanted
const b = await launch({ port: Number(process.env.CDP_PORT) || 9377, dir: `${OUT}/profile`, out: OUT });
// SITE lets us test another copy of the repo served on another port (the usability round, D-132)
const SITE = process.env.SITE || 'http://localhost:8765';
const BASE = `${SITE}/cup/`;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const click = sel => ev(`(()=>{const x=document.querySelector(${JSON.stringify(sel)});if(!x)return 'missing';if(x.disabled)return 'disabled';x.click();return 'ok'})()`);
const screen = () => ev('__copa.estado.pantalla');
const DAY = 24 * 60 * 60 * 1000;

// Headless has no share dialog: whatever would have been sent is captured (like a phone, which
// also shares files) and the test-mode bar stays out of the screenshots.
const prepare = () => ev(`(()=>{window.confirm=()=>true;window.__shared=[];navigator.share=async d=>{window.__shared.push(d)};navigator.canShare=()=>true;
  const st=document.createElement('style');st.textContent='.prueba-barra{display:none!important}';document.head.append(st);return 1})()`);

/** The image of the last share, saved to the output folder for a look. */
async function saveImage(name) {
  const u = await ev(`(async()=>{const f=window.__shared.at(-1)?.files?.[0];if(!f)return null;const r=new FileReader();return new Promise(ok=>{r.onload=()=>ok(r.result);r.readAsDataURL(f)})})()`);
  if (u) (await import('node:fs')).writeFileSync(`${OUT}/${name}.png`, Buffer.from(u.split(',')[1], 'base64'));
}

/** The README shots, with a fixed name so docs/capturas.json finds them. */
const SHOTS = { numero: '02-number', conexiones: '03-connections', reinas: '04-queens', letras: '05-letters', anio: '06-year' };

/** C-8: no horizontal scroll and no buttons under 44 px on the active screen. */
async function checkScreen(name) {
  await b.still();
  const r = await ev(`(()=>{
    const wide = document.documentElement.scrollWidth > innerWidth + 1;
    const small = [...document.querySelectorAll('.screen.active button, .screen.active a.btn')]
      .filter(x => { const q = x.getBoundingClientRect(); return q.width && q.height && q.height < 43.5 && !x.closest('.sol-grid'); })
      .map(x => x.textContent.trim().slice(0, 20));
    const culprits = wide ? [...document.querySelectorAll('body *')].filter(x => x.getBoundingClientRect().right > innerWidth + 1).slice(-3).map(x => x.tagName + '.' + x.className) : [];
    return JSON.stringify({ wide, small, culprits });
  })()`).then(JSON.parse);
  ok(!r.wide, `${name}: no horizontal scroll ${r.culprits.length ? JSON.stringify(r.culprits) : ''}`);
  ok(!r.small.length, `${name}: buttons 44 px or taller ${r.small.length ? JSON.stringify(r.small) : ''}`);
  await b.shot(name);
}

async function asPlayer(code) {
  await ev('sessionStorage.clear(); 1');
  await b.open(`${BASE}?${code}&test`, 1200);
  await prepare();
}

async function signUp(code, name, pin) {
  await asPlayer(code);
  ok(await screen() === 'entrar', `${name} reaches the invitation`);
  await click('#tab-nuevo'); await b.settle(150);
  await ev(`(()=>{const i=[...document.querySelectorAll('#entrar-body input')];i[0].value=${JSON.stringify(name)};i[1].value='${pin}';i[2].value='${pin}';return 1})()`);
  if (name === 'Javi') await b.shot('00-invitation');
  await click('#btn-inscribir'); await b.until(`__copa.estado.pantalla === 'tablero'`, 500, 30);
  ok(await screen() === 'tablero', `${name} is signed up and sees the board`);
}

async function sitDown(code, name, pin) {
  await asPlayer(code);
  if (await screen() === 'tablero') return;
  await click('#tab-inscrito'); await b.settle(150);
  await ev(`[...document.querySelectorAll('.chip-btn')].find(x=>x.textContent===${JSON.stringify(name)}).click(); 1`);
  await ev(`document.querySelector('#entrar-body input.pin').value='${pin}'; 1`);
  await click('#btn-sentarse'); await b.until(`__copa.estado.pantalla === 'tablero'`, 500, 30);
}

/* ---------- How each player plays each game. `level` from 0 (bad) to 2 (perfect). ---------- */

/** Closes Línea's verdict (a hit closes by itself; a miss waits for a tap). */
// No fixed pauses (D-307): wait for what is expected, with the old pause as the cap
const closeVerdict = async () => { await b.until(`!document.getElementById('handoff').hidden`, 150, 30); await ev(`(()=>{const h=document.getElementById('handoff');if(!h.hidden)h.click();return 1})()`); await b.until(`document.getElementById('handoff').hidden`, 380, 30); };

const playLine = async (level, { drag = false } = {}) => {
  for (let k = 0; k < 12 && await ev(`!!document.querySelector('.hand .card')`); k++) {
    // Picks the first card in the hand and works out its correct slot from the years on the line
    const plan = await ev(`(()=>{
      const b = document.querySelector('.hand .card');
      const c = window.__playing.p.mano.find(x => x.id === b.dataset.card);
      const years = [...document.querySelectorAll('.line .event')].map(e => Number(e.dataset.year));
      let at = years.filter(y => y < c.year).length;
      if (${level} === 0 || (${level} === 1 && ${k} % 3 === 2)) at = (at + 1) % (years.length + 1);
      return JSON.stringify({ id: c.id, at });
    })()`).then(JSON.parse);
    if (drag && k === 0) {
      // The real drag, with pointer events (D-85): from the hand to the slot
      const [x0, y0, x1, y1] = await ev(`(()=>{const c=document.querySelector('.hand .card[data-card="${plan.id}"]').getBoundingClientRect();const s=document.querySelector('.line .slot[data-slot="${plan.at}"]').getBoundingClientRect();return [c.x+c.width/2,c.y+c.height/2,s.x+s.width/2,s.y+s.height/2]})()`);
      // Downwards, like a finger: a swipe more sideways than vertical scrolls the hand (D-38)
      await b.drag(x0, y0, x0, y1 + 6);
      if (!await ev(`!!document.querySelector('.line .slot.on .ghost')`)) console.log('  drag diagnostics', JSON.stringify([x0, y0, x1, y1]), await ev(`JSON.stringify({h: innerHeight, sy: scrollY, handoff: document.getElementById('handoff').hidden, sel: document.querySelector('.hand .card.sel')?.dataset.card})`));
      ok(await ev(`!!document.querySelector('.line .slot.on .ghost') && !document.getElementById('btn-colocar').disabled`), 'Línea Relámpago: dragging the card onto the line selects it, without placing it');
    } else {
      await ev(`document.querySelector('.hand .card[data-card="${plan.id}"]').click(); 1`); await sleep(40);
      await ev(`document.querySelector('.line .slot[data-slot="${plan.at}"]').click(); 1`); await sleep(40);
    }
    await click('#btn-colocar'); await closeVerdict();
  }
};

const typeKeypad = async text => { for (const k of text) { await ev(`(()=>{const t=[...document.querySelectorAll('.keypad button[data-d]')].find(x=>x.dataset.d===${JSON.stringify(k)});t&&t.click();return 1})()`); await sleep(25); } await click('.keypad .ok'); await sleep(120); };

const playNumber = async level => {
  const secret = await ev('window.__playing.p.secreto');
  const digits = secret.length;
  const wrong = ['0123456789'.split('').filter(d => !secret.includes(d)).slice(0, digits).join(''), secret.split('').reverse().join('')];
  for (const guess of [...wrong.slice(0, level === 2 ? 0 : level === 1 ? 1 : 2), secret]) {
    if (!await ev(`!!document.querySelector('.keypad .ok')`)) break;
    await typeKeypad(guess);
  }
};

const playLetters = async level => {
  const secret = await ev('window.__playing.p.secreto');
  const others = 'QWERTYUIOPASDFGHJKLÑZXCVBNM'.split('').filter(l => !secret.includes(l));
  const wrong = [others.slice(0, 5).join(''), secret.slice(1) + secret[0]];
  for (const guess of [...wrong.slice(0, level === 2 ? 0 : level === 1 ? 1 : 2), secret]) {
    if (!await ev(`!!document.querySelector('.keypad .ok')`)) break;
    await typeKeypad(guess);
  }
};

const playYear = async level => {
  const milestones = await ev('JSON.stringify(window.__playing.p.hitos)').then(JSON.parse);
  for (const h of milestones) {
    const y = h.year + (level === 2 ? 0 : level === 1 ? 3 : 25);
    if (y < 0) await click('#btn-ac');
    await typeKeypad(String(Math.abs(y)));
    if (await ev(`!!document.getElementById('btn-siguiente')`)) { await click('#btn-siguiente'); await sleep(80); }
  }
};

/** Turns the ¿Dónde queda? globe until the place faces us and says where it is on the screen. */
const mapPoint = async (lat, lon) => {
  await ev(`document.querySelector('.mapa-globo').globo.girarA(${lat}, ${lon}); 1`);
  return ev(`JSON.stringify(document.querySelector('.mapa-globo').globo.aPantalla(${lat}, ${lon}))`).then(JSON.parse);
};

const playWhere = async level => {
  const cities = await ev('JSON.stringify(window.__playing.p.ciudades)').then(JSON.parse);
  for (const c of cities) {
    // level 2: right on the city; 1: about 3° off; 0: the other side of the world
    const lat = level === 2 ? c.lat : level === 1 ? c.lat + 3 : -c.lat;
    const lon = level === 0 ? (c.lon > 0 ? c.lon - 170 : c.lon + 170) : c.lon;
    await b.tap(...await mapPoint(lat, lon));
    await sleep(450); // longer than a double tap: the next tap doesn't zoom in
    await click('#btn-confirmar'); await sleep(150);
    if (await ev(`!!document.getElementById('btn-siguiente')`)) { await click('#btn-siguiente'); await sleep(120); }
    // The turning hint is only for the first city (#88)
    if (await ev(`!!document.querySelector('.mapa-globo') && !document.getElementById('btn-fin')`)) ok(!await ev(`document.getElementById('globo-pista')`), '¿Dónde queda?: the hint does not come back for the following cities');
  }
};

const tapCell = sel => i => click(`${sel}[data-i="${i}"]`);

const playQueens = async level => {
  const p = await ev('JSON.stringify(window.__playing.p)').then(JSON.parse);
  const t = tapCell('.rej');
  // Each mistake: the queen of row 0 and a diagonally adjacent one in row 1 (one tap places the queen,
  // another turns it into an X and another leaves it empty: D-167)
  const adjacent = 1 * p.n + (p.sol[0] === 0 ? 1 : p.sol[0] - 1);
  for (let e = 0; e < (level === 2 ? 0 : level === 1 ? 1 : 2); e++) {
    await t(p.sol[0]); await t(adjacent);   // clash
    await t(adjacent); await t(adjacent); await t(p.sol[0]); await t(p.sol[0]);   // both are removed
  }
  for (let r = 0; r < p.n; r++) await t(r * p.n + p.sol[r]);
  await sleep(150);
};

const playTango = async level => {
  const p = await ev('JSON.stringify(window.__playing.p)').then(JSON.parse);
  const t = tapCell('.tan');
  const value = i => ev(`Number(document.querySelector('.tan[data-i="${i}"]').dataset.v)`);
  const free = p.sol.map((v, i) => i).filter(i => p.dadas[i] === undefined);
  if (level < 2) {
    // A sun on its way to moon flags nothing: the clash is marked only when another cell is tapped,
    // just as the score counts it, and shown 1.5 s later; never by time alone (#135)
    // A cell where the sun clashes, with a sun placed first if needed (the board is random)
    const [before, step] = await ev(`(async()=>{const m=await import('/cup/games/tango/engine.js');const p=window.__playing.p;
      const L=[${free}], clashes=(pre,i)=>p.sol[i]===m.LUNA&&m.estado(p,[...pre,i]).mal.size>m.estado(p,pre).mal.size;
      for (const i of L) if (clashes([],i)) return [-1,i];
      for (const a of L) if (!m.estado(p,[a]).mal.size) for (const i of L) if (i!==a&&clashes([a],i)) return [a,i];
      return [-1,-1]})()`);
    ok(step >= 0, 'Tango: there is a cell to try the passing sun on');
    if (step >= 0) {
      const clashCount = () => ev(`document.querySelectorAll('.tan.choque').length`);
      const counter = () => ev(`document.querySelector('.tango-juego p.muted')?.textContent || ''`);
      if (before >= 0) await t(before);
      await t(step);
      ok(await clashCount() === 0, 'Tango: the clashing sun is not marked right away');
      await sleep(900);
      ok(await clashCount() === 0 && !/[1-9]/.test(await counter()), 'Tango: the clashing sun is neither marked nor counted over time (#135)');
      await t(step); await sleep(300);
      ok(await value(step) === p.sol[step] && await clashCount() === 0, 'Tango: sun then moon leave no clash and no warning');
      await t(step); await t(step);
      const other = free.find(i => i !== step && i !== before);
      await t(other);
      ok(await clashCount() === 0, 'Tango: a sun left in place is not marked the instant another cell is tapped');
      await sleep(1700);
      ok(await clashCount() > 0 && /1/.test(await counter()), 'Tango: a sun left in place is marked and counted 1.5 s after another cell is tapped');
    }
    // Clear all (two taps) and a hint (two taps), the helpers of D-103; Undo brings back what Clear all erased (D-342)
    await t(free[0]);
    const board = () => ev(`[...document.querySelectorAll('.tan')].map(c => c.dataset.v).join()`);
    const full = await board();
    const clearAt = `(()=>{const r=document.getElementById('btn-borrar').getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width)].join()})()`;
    const clearBefore = await ev(clearAt);
    await click('#btn-borrar'); await sleep(60);
    ok(await ev(clearAt) === clearBefore, 'Tango: armed, Clear all does not move: the second tap does not land on Undo (D-342)');
    await click('#btn-borrar'); await sleep(100);
    ok(await board() !== full, 'Tango: Clear all empties the board');
    await click('#btn-deshacer'); await sleep(100);
    ok(await board() === full, 'Tango: Undo brings back the board Clear all erased (D-342)');
    await click('#btn-borrar'); await sleep(60); await click('#btn-borrar'); await sleep(100);
    await click('#btn-pista'); await sleep(60); await click('#btn-pista'); await sleep(100);
  }
  for (const i of free) {
    if (await ev(`document.querySelector('.tan[data-i="${i}"]').disabled`)) continue;
    for (let k = 0; k < 3 && await value(i) !== p.sol[i]; k++) await t(i);
  }
  await sleep(150);
};

/** Zip by levels: solves the first two and waits for the clock to run out (shortened with &timer). */
const playZip = async () => {
  const { codigo: code, dia: day } = await ev('JSON.stringify(window.__playing.p)').then(JSON.parse);
  for (let k = 0; k < 2; k++) {
    const sol = await ev(`(async()=>{const m=await import('/cup/games/zip/engine.js');return JSON.stringify(m.nivel('${code}', ${day}, ${k}).sol)})()`).then(JSON.parse);
    for (const i of sol) await click(`.zc[data-i="${i}"]`);
    await sleep(700);
  }
  for (let w = 0; w < 40 && !await ev(`!!document.getElementById('btn-fin')`); w++) await sleep(500);
};

/**
 * Desenredo (D-179): each knot is taken to its place in the solution with the real mouse (CDP),
 * and on two levels all of them are dragged. Then we wait for the short clock to run out.
 */
const playUntangle = async () => {
  const { codigo: code, dia: day } = await ev('JSON.stringify(window.__playing.p)').then(JSON.parse);
  for (let k = 0; k < 2; k++) {
    const sol = await ev(`(async()=>{const m=await import('/cup/games/untangle/engine.js');return JSON.stringify(m.nivel('${code}', ${day}, ${k}).sol)})()`).then(JSON.parse);
    for (let v = 0; v < sol.length; v++) {
      const [x0, y0, x1, y1] = await ev(`(()=>{const t=document.querySelector('.des-tablero'),r=t.getBoundingClientRect(),s=r.width/1000,c=t.querySelector('circle[data-v="${v}"]');
        return JSON.stringify([r.left+c.cx.baseVal.value*s, r.top+c.cy.baseVal.value*s, r.left+${sol[v][0]}*s, r.top+${sol[v][1]}*s])})()`).then(JSON.parse);
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', clickCount: 1, buttons: 1 });
      for (let i = 1; i <= 4; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + (x1 - x0) * i / 4, y: y0 + (y1 - y0) * i / 4, button: 'left', buttons: 1 });
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x1, y: y1, button: 'left', clickCount: 1, buttons: 0 });
    }
    await sleep(900);
  }
  for (let w = 0; w < 60 && !await ev(`!!document.getElementById('btn-fin')`); w++) await sleep(500);
};

const playConnections = async level => {
  const groups = await ev('JSON.stringify(window.__playing.p.grupos.map(g=>g.palabras))').then(JSON.parse);
  const tryWords = async words => {
    await click('#btn-limpiar');
    for (const w of words) await ev(`[...document.querySelectorAll('.palabra')].find(x=>x.textContent===${JSON.stringify(w)})?.click(); 1`);
    await click('#btn-confirmar'); await sleep(120);
  };
  if (level < 2) await tryWords([groups[3][0], groups[3][1], groups[3][2], groups[2][0]]); // "one away!"
  if (level === 0) { await tryWords([groups[2][1], groups[3][3], groups[1][0], groups[0][0]]); }
  for (const g of groups) if (await ev(`!!document.getElementById('btn-confirmar')`)) await tryWords(g);
};

const playFinal = async level => {
  const rounds = { linea: playLine, numero: playNumber, reinas: playQueens, letras: playLetters, anio: playYear };
  for (const r of ['linea', 'numero', 'reinas', 'letras', 'anio']) {
    await click('#btn-ronda'); await sleep(200);
    await ev(`window.__playingFinal = window.__playing; window.__playing = { p: window.__playingFinal.p.${r} }; 1`);
    await rounds[r](level);
    await ev('window.__playing = window.__playingFinal; 1');
    if (r === 'anio' && await ev('!!__copa.estado.copa && !__copa.estado.juego?.practica')) {
      await sleep(300);
      ok(await ev(`(()=>{const d=__copa.estado.juego.d, x=__copa.estado.copa.results?.[d]?.[__copa.estado.yo];return !!x && __copa.estado.pantalla === 'jugar'})()`), 'the final: when the last round ends the result is already in the cup (D-150)');
    }
    await click('#btn-fin'); await sleep(250);
  }
};

const PLAY = { donde: playWhere, linea: playLine, numero: playNumber, anio: playYear, reinas: playQueens, letras: playLetters, zip: playZip, desenredo: playUntangle, tango: playTango, conexiones: playConnections, final: playFinal };

/** The 3-to-1 countdown before each game (D-105): waits for "¡A jugar!" to show up. */
async function waitCountdown({ check = false } = {}) {
  if (check) {
    await sleep(150);
    ok(await ev(`document.querySelector('#cuenta .cuenta-num')?.textContent`) === '3' && await ev(`document.querySelector('#jugar-body').children.length`) === 0,
      'on start the countdown appears from 3, with the board still hidden');
    await b.shot('countdown');
  }
  await b.until(`!document.getElementById('cuenta') || document.getElementById('cuenta').classList.contains('ya')`, 8000, 50);
  if (check) {
    ok(await ev(`document.getElementById('cuenta')?.textContent.includes('¡A jugar!') && !!document.querySelector('#jugar-body').children.length`), 'after the countdown it says ¡A jugar! and the board appears');
    ok(/0:0[01]/.test(await ev(`document.querySelector('#jugar-head .cron')?.textContent || ''`)), 'the clock starts at zero after the countdown');
  }
  await sleep(950);
}

async function playDay(d, level, { capture = false, joker = false } = {}) {
  await click(`[data-dia="${d}"]`); await b.settle(300);
  if (joker) { await click('#btn-comodin'); await sleep(300); }
  if (capture) await checkScreen(`before-${d}`);
  if (capture && d === 1) {
    // The trial session (D-103): other content, doesn't count, and goes back to Empezar
    ok(/más corta/.test(await ev(`document.getElementById('nota-ensayo')?.textContent || ''`)), 'the lobby warns that the trial is shorter and does not count');
    await click('#btn-ensayo'); await waitCountdown({ check: true });
    ok(!!await ev(`document.querySelector('#reglas #nota-ensayo')`), 'the folded rules of the trial repeat the warning');
    await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');window.__playing={p:JUEGOS.linea.ensayo(__copa.estado.code, 1)};return 1})()`);
    const realTheme = await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');return JUEGOS.linea.generar(__copa.estado.code, 1).tema})()`);
    ok(await ev('window.__playing.p.tema') !== realTheme && await ev(`document.querySelectorAll('.hand .card').length`) === 4, 'the trial session brings other content and is shorter');
    await checkScreen('trial');
    await playLine(2);
    await click('#btn-fin'); await sleep(300);
    ok(await screen() === 'resultado' && !(await ev('__copa.estado.copa.started?.[1]?.[__copa.estado.yo]')), 'the trial ends without starting the day or saving anything');
    await b.shot('trial-end');
    await click('#btn-volver-ensayo'); await sleep(300);
  }
  await click('#btn-empezar'); await b.until(`document.getElementById('cuenta')`, 400, 30); await waitCountdown();
  if (!await ev('!!__copa.estado.juego')) {
    console.log('  day diagnostics', d, await ev(`JSON.stringify({p:__copa.estado.pantalla, err:document.querySelector('.screen.active .form-error')?.textContent, btn:!!document.getElementById('btn-empezar'), text:document.querySelector('.screen.active').innerText.slice(0,300)})`));
    await b.shot(`failure-day${d}`);
  }
  const id = await ev('__copa.estado.juego.id');
  await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');window.__playing={p:JUEGOS[${JSON.stringify(id)}].generar(__copa.estado.code, ${d})};return 1})()`);
  await PLAY[id](level, { drag: capture && id === 'linea' });
  if (capture) { await checkScreen(`game-${id}`); if (SHOTS[id]) await b.shot(SHOTS[id]); }
  // The result is saved as soon as the board ends, before tapping "Ver resultado" (D-150)
  if (id !== 'final') {
    await b.until(`!!__copa.estado.copa.results?.[${d}]?.[__copa.estado.yo]`, 300, 30);
    ok(await ev(`!!__copa.estado.copa.results?.[${d}]?.[__copa.estado.yo] && __copa.estado.pantalla === 'jugar'`), `day ${d} (${id}): the result is in the cup before tapping "Ver resultado"`);
  }
  await click('#btn-fin'); await b.until(`__copa.estado.pantalla === 'resultado'`, 700, 30); await b.settle(400);
  if (id === 'final') ok(await ev(`(()=>{const x=[...document.querySelectorAll('#resultado-body .md-x2')];return x.length>0 && x.every(c=>c.classList.contains('chip--final') && !c.classList.contains('chip--gold'))})()`), 'the final: in the results everyone carries the final\'s ×2, in cyan and not in the joker\'s gold (D-151)');
  if (capture) ok(await ev(`(document.querySelector('#explicacion')?.textContent || '').includes('Total:')`), `result of day ${d}: explains how the score was computed`);
  return id;
}

/* ---------- The cup ---------- */
if (runs('cup')) {
  await b.go(`${BASE}?test`, 1200);
  await ev('localStorage.clear(); sessionStorage.clear(); 1');
  await b.go(`${BASE}?test`, 1200);
  await prepare();
  await checkScreen('home');
  await click('#btn-crear'); await sleep(900); // with several sessions testing at once, the machine runs slow
  await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)')];i[0].value='Copa de la oficina';i[1].value='Cata';i[2].value='1111';i[3].value='1111';return 1})()`);
  ok(await ev(`document.getElementById('crear-juegos').hidden`), 'games are picked after the length: before that they are hidden');
  await ev(`(()=>{const o=[...document.querySelectorAll('#crear-body .opcion')];o[${SEVEN ? 1 : 0}].click();o[3].click();return 1})()`); // starts tomorrow
  // Picking the games (D-163): a random proposal in the hand and the Línea de Tiempo line
  {
    const n = SEVEN ? 7 : 3;
    const cal = () => ev(`[...document.querySelectorAll('#cal-elegir .event[data-dia]')].map(b=>b.dataset.juego)`);
    const outside = () => ev(`[...document.querySelectorAll('#cal-fuera .card')].map(b=>b.dataset.juego)`);
    const tapDay = i => ev(`(document.querySelectorAll('#cal-elegir .event[data-dia]')[${i}].click(), 1)`);
    const tapOutside = id => ev(`(document.querySelector('#cal-fuera [data-juego="${id}"]').click(), 1)`);
    const tapSlot = k => ev(`(document.querySelector('#cal-elegir .slot[data-slot="${k}"]').click(), 1)`);
    const center = sel => ev(`(()=>{const r=document.querySelector('${sel}').getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2),Math.round(r.y)]})()`);
    // Brings the week to `goal` by tapping: a day moves to a slot, an outside game replaces a day
    const arrange = async (goal, check) => {
      for (let i = 0; i < goal.length; i++) {
        const now = await cal();
        if (now[i] === goal[i]) continue;
        const j = now.indexOf(goal[i]);
        if (j >= 0) { await tapDay(j); await tapSlot(i); } else { await tapOutside(goal[i]); await tapDay(i); }
        const after = await cal();
        if (check) ok(after[i] === goal[i] && (j < 0 ? (await outside()).includes(now[i]) : after[i + 1] === now[i]),
          j >= 0 ? `tapping: a day moves to another place in the week (${goal[i]} to day ${i + 1})` : `tapping: an outside game replaces a day (${now[i]} → ${goal[i]})`);
      }
    };
    const proposal = await cal();
    ok(!await ev(`document.getElementById('crear-juegos').hidden`) && proposal.length === n - 1 && new Set(proposal).size === n - 1
      && /La Gran Final/.test(await ev(`document.querySelector('#cal-elegir .event.fija').textContent`)), `on picking the length a random proposal of ${n - 1} games appears, with the final last (${proposal.join(', ')})`);
    // From the real pool: a new game doesn't break the count (C-16)
    ok((await outside()).length === POZO.length - (n - 1), 'the ones left out stay outside, in the hand');
    const helpHeight = () => ev(`Math.round(document.querySelector('#crear-juegos .cal-estado').getBoundingClientRect().height)`);
    const height0 = await helpHeight();
    await tapDay(0);
    ok(await helpHeight() === height0, `the help that changes on selecting keeps its height (${height0} px): what is below doesn't shift under the finger`);
    ok(await ev(`document.querySelectorAll('#cal-elegir .event.sel').length`) === 1 && await ev(`document.querySelectorAll('#cal-elegir .slot').length`) === n - 2,
      'tapping a day selects it and opens the slots it can move to');
    await ev(`(document.querySelector('#crear-body .panel').click(), 1)`);
    ok(await ev(`document.querySelectorAll('#cal-elegir .event.sel, #cal-elegir .slot').length`) === 0 && JSON.stringify(await cal()) === JSON.stringify(proposal), 'a tap outside the list releases it without changing anything (C-8)');
    await ev(`(document.getElementById('crear-juegos').scrollIntoView({block:'start'}), scrollBy(0,-12), 1)`); await sleep(150);
    await b.shot('10-week');
    await ev(`(document.getElementById('cal-elegir').scrollIntoView({block:'center'}), 1)`); await sleep(100);
    // Dragging (D-85): the last day up to the first place, with the mouse pointer
    {
      const before = await cal();
      const [x0, y0] = await center(`#cal-elegir .event[data-dia="${n - 2}"]`);
      const [, , top0] = await center('#cal-elegir .event[data-dia="0"]');
      await b.drag(x0, y0, x0, top0 + 4, 8);
      const after = await cal();
      ok(after[0] === before[n - 2] && JSON.stringify(after.slice(1)) === JSON.stringify(before.slice(0, -1)), `dragging a day moves it to another place in the week (${before[n - 2]} to day 1)`);
    }
    const finger = (type, p) => b.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p[0], y: p[1], id: 1 }] });
    const withFinger = async (from, to, midAir = null) => {
      await finger('touchStart', from); await finger('touchMove', [from[0], from[1] + (to[1] < from[1] ? -20 : 20)]); await sleep(16);
      for (let k = 1; k <= 10; k++) { await finger('touchMove', [from[0], Math.round(from[1] + (to[1] - from[1]) * k / 10)]); await sleep(16); }
      if (midAir) { await sleep(120); await midAir(); }
      await finger('touchEnd', to); await sleep(250);
    };
    // On a phone, a day is dragged from its ⠿ grip (the rest of the row lets the page scroll)
    {
      const before = await cal();
      const from = await center('#cal-elegir .event[data-dia="0"] .agarre');
      const [, , topLast] = await center('#cal-elegir .fija');
      await withFinger(from, [from[0], topLast - 6]);
      const after = await cal();
      ok(after[n - 2] === before[0] && JSON.stringify(after.slice(0, -1)) === JSON.stringify(before.slice(1)), `with a finger, a day is dragged from its grip (${before[0]} to day ${n - 1})`);
    }
    // A finger on a day's body, not its grip: the page may take it as a scroll, and Chrome sends
    // that cancel to the pressed node, which the first redraw already took out of the page.
    // Before, the card stayed floating over every later screen (Pintaminas over Administrar)
    {
      const before = await cal();
      const [x, y] = await center('#cal-elegir .event[data-dia="0"] .t');
      await withFinger([x, y], [x, y + 120]);
      const stuck = await ev(`JSON.stringify({floating: !!document.querySelector('.vilo.on'), covered: document.body.classList.contains('arrastrando')})`);
      ok(stuck === '{"floating":false,"covered":false}', `a finger dragging a day by its body leaves no card floating (${stuck})`);
      // And it doesn't block the next drag: back to how it was, by its grip if it moved
      const now = await cal();
      if (JSON.stringify(now) !== JSON.stringify(before)) await arrange(before, false);
      const from = await center('#cal-elegir .event[data-dia="0"] .agarre');
      const [, , topLast] = await center('#cal-elegir .fija');
      await withFinger(from, [from[0], topLast - 6]);
      ok((await cal())[n - 2] === before[0], 'and the next drag by the grip still works');
      await arrange(before, false);
    }
    // And with a finger: a game from the hand onto day 1, which goes outside
    {
      const before = await cal(), id = (await outside())[0];
      await ev(`(document.getElementById('cal-fuera').scrollIntoView({block:'center'}), 1)`); await sleep(100);
      const from = await center(`#cal-fuera [data-juego="${id}"]`), to = await center('#cal-elegir .event[data-dia="0"]');
      await withFinger(from, to, async () => {
        const air = JSON.parse(await ev(`JSON.stringify({help: [...document.querySelectorAll('.cal-estado [data-ayuda]:not(.oculta)')].map(x=>x.textContent).join(), left: document.querySelector('.vilo-carta').getBoundingClientRect().left, right: document.querySelector('.vilo-carta').getBoundingClientRect().right, w: innerWidth})`));
        ok(/^Suéltalo sobre el día/.test(air.help), `with the game in the air, the help says to drop it, not to tap («${air.help}»)`);
        ok(air.left >= 0 && air.right <= air.w, `the lifted card stays on screen even with the finger at the edge (${Math.round(air.left)}–${Math.round(air.right)} of ${air.w})`);
      });
      const after = await cal();
      ok(after[0] === id && (await outside()).includes(before[0]), `dragging an outside game onto a day replaces it (${before[0]} → ${id})`);
    }
    // The usual calendar is arranged, so the rest of the script knows what each day plays. First one
    // reversed, to be sure to go through both tapping paths
    const goal = SEVEN ? ['linea', 'numero', 'conexiones', 'reinas', 'letras', 'anio'] : ['linea', 'conexiones'];
    await arrange(SEVEN ? ['zip', 'anio', 'letras', 'reinas', 'conexiones', 'numero'] : ['tango', 'conexiones'], true);
    await arrange(goal, true);
    await click('#btn-azar'); await sleep(100);
    const shuffled = await cal();
    ok(shuffled.length === n - 1 && new Set(shuffled).size === n - 1, `🎲 proposes another order (${shuffled.join(', ')})`);
    await arrange(goal, false);
    ok(JSON.stringify(await cal()) === JSON.stringify(goal), `the calendar stays as arranged (${goal.join(', ')})`);
  }
  // The custom link (D-121): shows how it looks and whether it is free
  await ev(`(()=>{const i=document.getElementById('crear-link');i.value='Oficina';i.dispatchEvent(new Event('input'));return 1})()`); await sleep(700);
  ok(/juegosdesalon\.cl\/cup\/\?oficina está libre/.test(await ev(`document.getElementById('link-estado').textContent`)), 'the custom link shows how it looks and that it is free');
  // The audience (D-187): three options; in Spanish it starts as Chile, and it can be changed and back
  {
    const audience = () => ev(`document.querySelector('#crear-alcance .opcion.on')?.textContent || ''`);
    ok(await ev(`document.querySelectorAll('#crear-alcance .opcion').length`) === 3, 'create: the audience has three options (global, Chile and Brazil)');
    ok(/Chile/.test(await audience()), 'create: in Spanish, the cup starts as Chile');
    await ev(`[...document.querySelectorAll('#crear-alcance .opcion')][0].click(); 1`);
    ok(/Global/.test(await audience()), 'create: a global cup can be picked');
    await ev(`(document.getElementById('crear-alcance').scrollIntoView({block:'center'}), 1)`); await sleep(150);
    await b.shot('create-audience');
    await ev(`[...document.querySelectorAll('#crear-alcance .opcion')][1].click(); 1`);
  }
  await checkScreen('create');
  await click('#btn-crear-go'); await sleep(900);
  ok(/\?oficina&test$/.test(await ev('location.search')), 'the created cup lives at ?oficina');
  const CODE = await ev('__copa.estado.code');
  ok(/^[A-HJ-NP-Z]{5}$/.test(CODE), `cup created with code ${CODE}`);
  ok(await ev('__copa.estado.copa.meta.aud') === 'cl', 'the cup saves its audience (Chile)');
  ok(await ev('__copa.estado.copa.meta.cal') === (SEVEN ? 'linea,numero,conexiones,reinas,letras,anio,final' : 'linea,conexiones,final'), 'the cup saves the games in the chosen order');
  // Freshly created, the admin starts in Administrar, with the first-time guide (D-110)
  ok(await screen() === 'admin' && !!await ev(`document.getElementById('admin-bienvenida')`), 'on creating it, the admin sees Administrar with the guide to invite');
  ok(/Mensajes para los jugadores/.test(await ev(`document.getElementById('admin-body').innerText`)), 'the messages are for the players');
  await checkScreen('admin-new');
  await b.shot('admin-new');
  await click('#msg-invitar'); await sleep(300);
  ok((await ev('window.__shared.length')) === 1, 'the invitation is shared from there');
  console.log('  invitation:', await ev('window.__shared[0]?.text'));
  {
    const inv = await ev('window.__shared[0]?.text || ""');
    ok(/¡Estás invitado!/.test(inv) && /👥 Ya se inscribió Cata\./.test(inv) && !/Línea Relámpago|Conexiones|Reinas/.test(inv), 'the invitation is promotional, says who is already in and does not reveal the games (D-127)');
  }
  ok(/\n\n🔗 https?:\/\/\S+\?oficina/.test(await ev('window.__shared[0]?.text || ""')), 'the invitation ends with the ?oficina link on its own line');
  // Closing sign-up keeps new players out; reopening it doesn't
  await click('#btn-cerrar-inscripcion'); await sleep(300);
  ok(!!await ev(`document.getElementById('btn-reabrir')`), 'the admin closes sign-up');
  await asPlayer(CODE);
  ok(!await ev(`document.getElementById('tab-nuevo')`) && /cerró la inscripción/.test(await ev(`document.getElementById('entrar-body').innerText`)), 'with sign-up closed, a newcomer cannot get in and is told why');
  await sitDown(CODE, 'Cata', '1111');
  await click('#btn-admin'); await sleep(300);
  await click('#btn-reabrir'); await sleep(300);
  ok(!!await ev(`document.getElementById('btn-cerrar-inscripcion')`), 'the admin reopens sign-up');
  // Moving the start: it starts tomorrow; moved to today and back to tomorrow
  const start0 = await ev('__copa.estado.copa.meta.start');
  await click('#btn-inicio-hoy'); await sleep(300);
  const start1 = await ev('__copa.estado.copa.meta.start');
  ok(start1 !== start0, `the admin moves the start to today (${start0} → ${start1})`);
  await click('#btn-inicio-manana'); await sleep(300);
  ok(await ev('__copa.estado.copa.meta.start') === start0, 'and moves it back to tomorrow');
  // Another date, with the calendar (D-115)
  await click('#btn-inicio-otra'); await sleep(200);
  const otherDate = await ev(`(()=>{const i=document.querySelector('#admin-inicio input.fecha');const d=new Date(i.min+'T12:00:00');d.setDate(d.getDate()+10);i.value=d.toISOString().slice(0,10);return i.value})()`);
  await click('#btn-inicio-otra-ok'); await sleep(300);
  ok(await ev('__copa.estado.copa.meta.start') === otherDate, `the admin picks another date in the calendar (${otherDate})`);
  await click('#btn-inicio-manana'); await sleep(300);
  ok(await ev('__copa.estado.copa.meta.start') === start0, 'and moves it back to tomorrow');
  await ev(`window.__shared=[]; 1`);

  await signUp(CODE, 'Javi', '2222');
  await signUp(CODE, 'Pancho', '3333');
  // A repeated name doesn't get in
  await asPlayer(CODE);
  await click('#tab-nuevo'); await sleep(100);
  await ev(`(()=>{const i=[...document.querySelectorAll('#entrar-body input')];i[0].value='javi ';i[1].value='4444';i[2].value='4444';return 1})()`);
  await click('#btn-inscribir'); await sleep(300);
  ok(/Ya hay alguien/.test(await ev(`document.querySelector('#entrar-body .form-error').textContent`)), 'a repeated name is rejected');
  await checkScreen('invitation');
  // Wrong PIN
  await click('#tab-inscrito'); await sleep(100);
  await ev(`[...document.querySelectorAll('.chip-btn')].find(x=>x.textContent==='Javi').click(); document.querySelector('#entrar-body input.pin').value='9999'; 1`);
  await click('#btn-sentarse'); await sleep(300);
  ok(/no es el de Javi/.test(await ev(`document.querySelector('#entrar-body .form-error').textContent`)), 'a wrong PIN is rejected');
  // Opening through the custom link leads to the same cup
  await ev('sessionStorage.clear(); 1');
  await b.go(`${BASE}?oficina&test`, 1200); await prepare();
  ok(await ev('__copa.estado.code') === CODE, 'the ?oficina link opens the cup');
  await ev('sessionStorage.clear(); 1');
  await b.go(`${BASE}?${CODE}&test`, 1200); await prepare();
  ok(/\?oficina&test$/.test(await ev('location.search')), 'coming in through the code, the address bar shows the custom link');
  // Signing up with a name and PIN that already exist counts as coming in (D-120)
  await asPlayer(CODE);
  ok(/7 días · Parte el .* · 3 jugadores inscritos/.test(await ev(`document.querySelector('#entrar-body .lead').textContent`)) || /3 días · Parte el .* · 3 jugadores inscritos/.test(await ev(`document.querySelector('#entrar-body .lead').textContent`)), 'the invitation states the days, when it starts and how many signed up');
  await click('#tab-nuevo'); await sleep(100);
  await ev(`(()=>{const i=[...document.querySelectorAll('#entrar-body input')];i[0].value='javi';i[1].value='2222';i[2].value='2222';return 1})()`);
  await click('#btn-inscribir'); await b.until(`__copa.estado.pantalla === 'tablero'`, 500, 30);
  ok(await screen() === 'tablero' && await ev('__copa.estado.copa.players[__copa.estado.yo].name') === 'Javi', 'signing up with the name and PIN of someone already signed up logs them in');

  const PLAYERS = [['Cata', '1111'], ['Javi', '2222'], ['Pancho', '3333']];
  const days = SEVEN ? 7 : 3;
  // Levels per day so the table moves: [Cata, Javi, Pancho]
  const LEVELS = [[2, 1, 0], [0, 2, 1], [1, 0, 2], [2, 1, 0], [1, 2, 0], [1, 0, 2], [1, 0, 2]];
  await ev(`__copa.store.adelantar(${DAY}); 1`);

  for (let d = 1; d <= days; d++) {
    for (let j = 0; j < PLAYERS.length; j++) {
      const [name, pin] = PLAYERS[j];
      // Pancho falls behind on day 1 and plays it on his grace day
      if (d === 1 && name === 'Pancho') continue;
      await sitDown(CODE, name, pin);
      if (d === 2 && name === 'Pancho') {
        ok(await ev(`!!document.querySelector('.md-fila.gracia [data-dia="1"]')`), 'Pancho sees day 1 on his grace day, enabled');
        await checkScreen('board-grace');
        await playDay(1, 1); await click('#btn-volver'); await sleep(300);
      }
      const capture = j === 0 || (d === 1 && j === 1);
      if (j === 0) await checkScreen(`board-day${d}`);
      if (j === 0 && d === 4) await b.shot('01-board');
      const id = await playDay(d, LEVELS[d - 1][j], { capture, joker: d === 2 && name === 'Javi' });
      if (capture) await checkScreen(`result-${id}`);
      ok(await screen() === 'resultado', `${name} finished day ${d} (${id})`);
      const sharedCount = await ev('window.__shared.length');
      await click('#btn-tarjeta'); await b.until(`window.__shared.length > ${sharedCount}`, 800, 30);
      if (d === 1 && j === 0) {
        console.log('  card:', JSON.stringify(await ev('window.__shared.at(-1)?.text')));
        // The game, who and the score go in the image: the text is the header and the link (D-171)
        ok(/^🏆 \*La Copa: .+\* · Día 1 de 7\n\n🔗 \S+$/.test(await ev('window.__shared.at(-1)?.text')), 'the result text does not repeat what the image says');
        // With its image and the cup header, the same as in the text (D-165)
        ok(/^🏆 \*La Copa: .+\* · Día 1 de 7\n\n/.test(await ev('window.__shared.at(-1)?.text')), 'the result opens with the cup header and the day out of how many');
        const f = await ev(`(()=>{const f=window.__shared.at(-1)?.files?.[0];return f?{name:f.name,type:f.type,size:f.size}:null})()`);
        ok(f && f.type === 'image/png' && f.size > 20000 && f.name === 'copa-oficina-dia-1-cata.png', `the result is shared with its image (${f?.name})`);
        await saveImage('result-image');
      }
      await click('#btn-volver'); await b.settle(300);
      // Hidden results: whoever played first doesn't see the scores of those who haven't played yet (LIG-13)
    }
    if (d === 1) {
      await sitDown(CODE, 'Cata', '1111');
      ok(await ev(`!!document.querySelector('#btn-admin')`), 'the admin sees the admin button');
      await click('#btn-admin'); await sleep(300);
      await click('#msg-hoy'); await sleep(100);
      console.log('  reminder:', JSON.stringify(await ev('window.__shared.at(-1)?.text')));
      ok(/Falta por jugar hoy: Pancho\./.test(await ev('window.__shared.at(-1)?.text')), 'the reminder says who is missing');
      ok(/\n\n⏳ Hoy toca Línea Relámpago\.\n/.test(await ev('window.__shared.at(-1)?.text')), 'the reminder opens the line with the game\'s emoji, not mid-sentence (dilemma #114)');
      await click('#msg-tabla'); await sleep(1200);
      console.log('  partial table:', JSON.stringify(await ev('window.__shared.at(-1)?.text')));
      // The admin's table is the same as the board's: image and text, with the same header (D-165)
      ok(/^📊 \*La Copa: .+\* · Tabla de posiciones( \(provisoria\))? · día 1 de 7\n\n/.test(await ev('window.__shared.at(-1)?.text || ""')) && await ev('window.__shared.at(-1)?.files?.[0]?.type') === 'image/png', 'the admin\'s partial table comes with its image and the table header');
      // The table isn't written out: the image shows it (D-171)
      ok(!/ pts$/m.test(await ev('window.__shared.at(-1)?.text || ""')), 'the partial table text does not repeat the table');
      await saveImage('partial-table-image');
      await checkScreen('admin');
      await b.shot('09-admin');
      // On the board, the chart also marks Pancho with "(-1J)" and explains it (D-126)
      await sitDown(CODE, 'Cata', '1111');
      ok(/Pancho \(-1J\)/.test(await ev(`document.querySelector('.grafico-chips')?.textContent || ''`)) && !!await ev(`document.getElementById('nota-juegos')`), 'the chart marks (-1J) whoever has played fewer games, with its legend');
    }
    await ev(`__copa.store.adelantar(${DAY}); 1`);
  }

  // One hour after midnight of the last day: the cup is over
  await sitDown(CODE, 'Cata', '1111');
  await b.go(`${BASE}?${CODE}&test`, 1200); await prepare();
  ok(await ev(`!!document.querySelector('.podio')`), 'when it ends the podium shows');
  await sleep(3000); // let the confetti finish
  await checkScreen('podium');
  await b.shot('08-podium');
  const table = await ev(`[...document.querySelectorAll('#tablero-body .tabla .fila')].map(f=>f.innerText.replace(/\\s+/g,' ')).join(' | ')`);
  console.log('  final table:', table);
  ok(await ev(`!!document.querySelector('svg.grafico .g-jugador.mia polyline')`), 'the chart draws your own line');
  ok(await ev(`new Set([...document.querySelectorAll('svg.grafico .g-jugador')].map(g=>g.style.getPropertyValue('--c'))).size`) === 3, 'the chart shows all three players, each with their own color (D-125)');
  await ev(`document.querySelectorAll('.g-chip')[1].click(); 1`); await sleep(200);
  ok(await ev(`document.querySelector('svg.grafico').classList.contains('con-destacado') && document.querySelectorAll('svg.grafico .g-jugador.destacado').length === 1`), 'tapping a name highlights their line');
  await b.shot('chart-colors');
  // The partial table as an image (D-126): shared as a PNG file
  await ev(`navigator.canShare = () => true; 1`);
  await click('#btn-imagen'); await sleep(1500);
  const img = await ev(`(async()=>{const d=window.__shared.at(-1);const f=d?.files?.[0];if(!f)return null;const r=new FileReader();const u=await new Promise(ok=>{r.onload=()=>ok(r.result);r.readAsDataURL(f)});return {name:f.name,type:f.type,size:f.size,u}})()`);
  ok(img && img.type === 'image/png' && img.size > 20000 && img.name === 'copa-oficina-tabla-final.png', `the table is shared as an image (${img?.name})`);
  ok(/^🏁 \*La Copa: .+\* · Tabla final\n\n/.test(await ev('window.__shared.at(-1)?.text || ""')), 'once over, the table image comes with the final summary');
  if (img) (await import('node:fs')).writeFileSync(`${OUT}/table-image.png`, Buffer.from(img.u.split(',')[1], 'base64'));
  await ev(`document.querySelectorAll('.g-chip')[1].click(); 1`);
  await ev(`document.querySelector('svg.grafico').scrollIntoView(); 1`);
  await b.shot('07-chart');
  await click('#btn-admin'); await sleep(300);
  await click('#msg-final'); await sleep(1200);
  console.log('  final summary:', JSON.stringify(await ev('window.__shared.at(-1)?.text')));
  // The podium ("🥇 Cata · 30 pts") and the champion go in the image; the medals ("🥇 Más días ganados") don't
  ok(!/ pts$|^🏆 /m.test(await ev('window.__shared.at(-1)?.text || ""')), 'the final summary does not repeat the podium from the image (D-171)');
  ok(await ev('window.__shared.at(-1)?.files?.[0]?.name') === 'copa-oficina-tabla-final.png', 'the admin\'s final summary comes with the final table image');
}

/* ---------- The lab (D-101): the page, each game's practice and the reports ---------- */
if (runs('labs')) {
  await b.go(`${SITE}/`, 1500);
  const card = await ev(`(()=>{const c=[...document.querySelectorAll('.game-card')].find(x=>x.textContent.includes('La Copa'));return JSON.stringify({soon:c.classList.contains('soon'),href:c.getAttribute('href'),label:c.querySelector('.proximamente')?.textContent})})()`).then(JSON.parse);
  ok(!card.soon && card.href === 'cup/' && !card.label, 'in the menu La Copa is active and opens /cup/ (D-175)');
  await b.go(BASE, 1500);
  ok(await ev(`document.getElementById('btn-menu').href`) === `${SITE}/`, 'La Copa without ?labs goes back to the menu, not to the lab (D-175)');
  await b.go(`${BASE}?labs`, 1500);
  ok(await ev(`document.getElementById('btn-menu').href`) === `${SITE}/labs/`, 'La Copa with ?labs goes back to the lab');
  await b.go(`${SITE}/labs/`, 1500);
  // Only what hasn't shipped stays in the lab (D-262): each section leads to its prototype's
  // page, at /labs/<folder>/ (El caso, D-267…), and La Copa is no longer there
  const sections = await ev(`JSON.stringify([...document.querySelectorAll('section.seccion')].map(x => [x.id, x.querySelector('a.btn')?.getAttribute('href')]))`).then(JSON.parse);
  ok(sections.length >= 1 && sections.some(([id, h]) => id === 'seccion-caso' && h === 'case/') && sections.every(([, h]) => /^[a-z-]+\/$/.test(h || '')) && !await ev(`!!document.getElementById('minis')`),
    `the lab offers only prototypes, each in its folder (${sections.map(([, h]) => h).join(' ')})`);
  await b.shot('10-labs');
  // A link from before D-266, with the parameters in Spanish: still arrives, and in English
  await b.go(`${BASE}?practica=tango&prueba&labs&semilla=KQRST`, 1500); await prepare();
  ok(await ev(`location.pathname + location.search`) === '/tango/?labs&test&seed=KQRST', 'lab: the old link goes to the game\'s page with its seed, in English');
  ok(!!await ev(`document.getElementById('btn-ensayo')`) && await ev(`document.getElementById('btn-menu').href`) === `${SITE}/labs/`, 'lab: the game\'s page still has the trial session and goes back to the lab');
  // Dragging from an empty cell paints X on the empty ones (D-166) and from an X erases them (D-168),
  // with mouse and finger, without
  // getting in the way of the tap (queen) or the long press (X)
  await b.go(`${BASE}?practice=queens&test&labs`, 1200); await prepare();
  await click('#btn-empezar'); await sleep(300); await waitCountdown();
  {
    const N = await ev(`Math.round(Math.sqrt(document.querySelectorAll('.rej').length))`);
    const center = i => ev(`(()=>{const r=document.querySelector('.rej[data-i="${i}"]').getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]})()`);
    const cells = () => ev(`[...document.querySelectorAll('.rej')].map(x=>x.classList.contains('reina')?'R':x.classList.contains('marca')?'X':'.').join('')`);
    ok(await ev(`document.getElementById('btn-deshacer')?.disabled`) === true, 'Reinas: with no moves, Deshacer is off (D-283)');
    const [x0, y0] = await center(0), [x1, y1] = await center(N - 1);
    await b.drag(x0, y0, x1, y1, 3);
    let t = await cells();
    ok(t.slice(0, N) === 'X'.repeat(N) && !t.slice(N).includes('X') && !t.includes('R'), 'Reinas: dragging along a row fills it with X, skipping no cells');
    const [xr, yr] = await center(N); await b.tap(xr, yr);
    t = await cells();
    ok(t[N] === 'R' && t.slice(N + 1, 2 * N) === '.'.repeat(N - 1), 'Reinas: a tap still places the queen');
    // The tap cycle: queen → X → empty → queen (D-167)
    const cycle = [];
    for (let k = 0; k < 3; k++) { await b.tap(xr, yr); cycle.push((await cells())[N]); }
    ok(cycle.join('') === 'X.R', 'Reinas: tapping the queen again turns it into an X, then empty and a queen again');
    const [xr2, yr2] = await center(N + 3); await b.drag(xr, yr, xr2, yr2, 3);
    t = await cells();
    ok(t[N] === 'R' && t.slice(N + 1, 2 * N) === '.'.repeat(N - 1), 'Reinas: dragging from a queen neither paints nor removes it');
    // With a finger, down a column: the board doesn't scroll the page
    const col = 3, from = await center(2 * N + col), to = await center((N - 1) * N + col);
    const finger = (type, [x, y] = [0, 0]) => b.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await finger('touchStart', from);
    for (let k = 1; k <= 4; k++) { await finger('touchMove', [from[0], Math.round(from[1] + (to[1] - from[1]) * k / 4)]); await sleep(30); }
    await finger('touchEnd'); await sleep(250);
    t = await cells();
    ok([...Array(N - 2).keys()].every(k => t[(k + 2) * N + col] === 'X') && t[N + col] === '.', 'Reinas: with a finger, dragging down a column fills it with X');
    // Dragging from an X erases them (D-168): the last four of row 0
    const [xb0, yb0] = await center(N - 1), [xb1, yb1] = await center(N - 4);
    await b.drag(xb0, yb0, xb1, yb1, 3);
    t = await cells();
    ok(t.slice(0, N - 4) === 'X'.repeat(N - 4) && t.slice(N - 4, N) === '....' && t[2 * N + col] === 'X', 'Reinas: dragging from an X erases the X it passes over');
    // and it passes over the queen without removing it: from the X in cell 1 to the queen of row 1
    const [xc0, yc0] = await center(1);
    await b.drag(xc0, yc0, xr, yr, 3);
    t = await cells();
    ok(t[0] === 'X' && t[1] === '.' && t[N] === 'R', 'Reinas: the erasing drag does not remove queens');
    // Long press on an empty cell: X, and the release click doesn't place a queen
    const [xl, yl] = await center(N + 6);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: xl, y: yl, button: 'left', clickCount: 1, buttons: 1 }); await sleep(600);
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: xl, y: yl, button: 'left', clickCount: 1, buttons: 0 }); await sleep(200);
    ok((await cells())[N + 6] === 'X', 'Reinas: the long press still places the X');
    // Borrar todo asks for a second tap and leaves the board blank (D-169)
    const beforeClear = await cells();
    const clearPos = `(()=>{const r=document.getElementById('btn-borrar').getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width)].join()})()`;
    const clearPos0 = await ev(clearPos);
    await click('#btn-borrar'); await sleep(150);
    ok(/[RX]/.test(await cells()) && await ev(`document.getElementById('btn-borrar').classList.contains('armado')`), 'Reinas: the first tap on Borrar todo only arms it');
    ok(await ev(clearPos) === clearPos0, 'Reinas: armed, Borrar todo does not move: the second tap does not land on Deshacer (D-283)');
    await click('#btn-borrar'); await sleep(200);
    ok(!/[RX]/.test(await cells()) && await ev(`document.getElementById('btn-borrar').disabled`), 'Reinas: the second tap leaves the board blank and the button turns off');
    await b.tap(xr, yr);
    ok((await cells())[N] === 'R', 'Reinas: after clearing everything, play goes on');
    // ↩️ Deshacer (D-283): removes the last gesture, one per tap, including Borrar todo and a whole drag
    const undo = async () => { await click('#btn-deshacer'); await sleep(150); return cells(); };
    t = await undo();
    ok(!/[RX]/.test(t), 'Reinas: Deshacer removes the last queen');
    t = await undo();
    ok(t === beforeClear, 'Reinas: Deshacer brings back the board from before Borrar todo');
    t = await undo();
    ok(t[N + 6] === '.' && t[N] === 'R', 'Reinas: Deshacer removes the long-press X and nothing else');
    t = await undo();
    ok(t[1] === 'X' && t[N] === 'R', 'Reinas: Deshacer brings back the X erased by the last drag');
    t = await undo();
    ok(t.slice(0, N) === 'X'.repeat(N), 'Reinas: a drag that erased several X is undone whole, in one tap');
    for (let k = 0; k < 40 && !await ev(`document.getElementById('btn-deshacer').disabled`); k++) t = await undo();
    ok(!/[RX]/.test(t) && await ev(`document.getElementById('btn-deshacer').disabled`), 'Reinas: Deshacer goes back to the start and turns off there');
  }
  // Giving up in Reinas: two taps, the solution in view and 0 points (D-110)
  await b.go(`${BASE}?practice=queens&test&labs`, 1200); await prepare();
  await click('#btn-empezar'); await sleep(300); await waitCountdown();
  // With the confirmation denied nothing happens; accepted, the player gives up
  await ev('window.confirm = () => false; 1');
  await click('#btn-rendirse'); await sleep(150);
  ok(!await ev(`document.getElementById('btn-fin')`), 'Reinas: giving up asks for confirmation and, if not confirmed, play goes on');
  await ev('window.confirm = () => true; 1');
  await click('#btn-rendirse'); await sleep(300);
  ok(await ev(`document.querySelectorAll('.rej.reina').length`) > 0 && !!await ev(`document.getElementById('btn-fin')`), 'Reinas: on giving up the solution shows');
  await click('#btn-fin'); await sleep(500);
  ok(/^0/.test(await ev(`document.querySelector('.score-big')?.textContent || ''`)), 'Reinas: giving up is worth 0 points');
  // From the home page (D-142) practice is the standalone game: no trial or seed, and it goes back to the menu.
  // It lives at /<slug>/ (D-149, D-162, D-199): an old link to /cup/?practica= without &labs goes there.
  await b.go(`${BASE}?practica=conexiones&prueba`, 1500); await prepare();
  ok(await ev(`location.pathname + location.search`) === '/connections/?test', 'standalone game: the old cup link leads to /connections/');
  ok(!await ev(`document.getElementById('btn-ensayo')`) && await ev(`document.getElementById('btn-menu').href`) === `${SITE}/`
    && await ev(`[...document.querySelectorAll('#jugar-body a')].some(a => a.href === '${SITE}/')`), 'standalone game: no trial and back to the menu');
  // Its page brings its own social card: a shared link shows the game, not La Copa (D-162)
  ok(/\/assets\/og\/conexiones\.jpg/.test(await ev(`document.querySelector('meta[property="og:image"]')?.content || ''`)), 'standalone game: its page brings its own social card');
  ok(!/copa/i.test(await ev(`location.href + ' ' + document.title`)), 'standalone game: neither the link nor the title says copa');
  ok(!await ev(`document.body.innerText.includes('empatas')`), 'standalone game: no talk of ties, there is nobody to tie with (dilemma #72)');
  // The result's 🐞 opens the form and returns to the result (the standalone page needs its own screen)
  // The old links (/minigames/?reinas, /minigames/queens/) go to the game's own page
  await b.go(`${SITE}/minigames/?reinas&prueba`, 1500); await prepare();
  ok(await ev(`location.pathname + location.search`) === '/queens/?test', 'standalone game: /minigames/?reinas leads to /queens/');
  await b.go(`${SITE}/minigames/queens/?test`, 1500); await prepare();
  ok(await ev(`location.pathname + location.search`) === '/queens/?test', 'standalone game: /minigames/queens/ leads to /queens/');
  await click('#btn-empezar'); await sleep(300); await waitCountdown();
  await click('#btn-rendirse'); await sleep(300); await click('#btn-fin'); await sleep(800);
  await click('#btn-reporte'); await sleep(300);
  ok(await ev(`document.querySelector('.screen.active')?.id`) === 'screen-reporte' && !!await ev(`document.getElementById('btn-enviar-reporte')`), 'standalone game: the result\'s 🐞 opens the form');
  await ev(`[...document.querySelectorAll('#reporte-body .btn--ghost')].at(-1).click()`); await sleep(300);
  ok(await ev(`document.querySelector('.screen.active')?.id`) === 'screen-resultado', 'standalone game: cancelling the report goes back to the result');
  for (const id of ['linea', 'numero', 'conexiones', 'reinas', 'letras', 'zip', 'desenredo', 'tango', 'anio', 'donde', 'final']) {
    // Zip with a fixed seed: the warning check looks for a path that reaches the end without covering everything.
    // Desenredo with a short clock too: two levels solved and time runs out on the third
  await b.go(`${BASE}?practice=${slugDe(id)}&test&labs${id === 'zip' ? '&timer=12&seed=KQRST' : id === 'desenredo' ? '&timer=25&seed=KQRST' : ''}`, 1200); await prepare();
    // The first time a game opens its modules arrive uncached (with --part labs,
    // nobody played it before in the cup): wait for the lobby instead of a fixed time.
    for (let w = 0; w < 30 && !await ev(`!!document.getElementById('btn-ensayo')`); w++) await sleep(200);
    await prepare();   // again: if the page was slow, the first call prepared the previous one
    ok(await ev(`!!document.getElementById('btn-ensayo')`), `practice of ${id}: the lobby offers the trial as in the cup`);
    if (id === 'donde') {
      // The cover is the globe spinning on its own (and the other games keep their emoji)
      const frame = () => ev(`document.querySelector('.intro-hero .globo-portada canvas:last-child')?.toDataURL().length + ':' + document.querySelector('.intro-hero .globo-portada canvas:last-child')?.toDataURL().slice(-200)`);
      const f1 = await frame(); await sleep(700); const f2 = await frame();
      ok(!f1.startsWith('undefined') && f1 !== f2, '¿Dónde queda?: the cover is a spinning globe');
      await b.shot('where-cover');
      ok(await ev(`document.getElementById('btn-menu').getBoundingClientRect().height`) < 50, 'practice: "‹ Laboratorio" fits on one line next to a long title (U-12)');
      // Full screen, the clock pill (with 🧪 in the trial) sits between "‹ Laboratorio" and
      // the sound without overlapping them: centered in the window it rode over the button (C-8)
      await click('#btn-ensayo'); await waitCountdown(); await sleep(300);
      const bar = await ev(`(()=>{const R=s=>document.querySelector(s).getBoundingClientRect(),a=R('#btn-menu'),h=R('#jugar-head'),t=R('.topbar .tools'),j=document.getElementById('jugar-head');
        return JSON.stringify({a:a.right|0,h:[h.left|0,h.right|0],t:t.left|0,fits:j.scrollWidth<=j.clientWidth,chip:!!j.querySelector('.chip')?.offsetWidth})})()`).then(JSON.parse);
      ok(bar.h[0] >= bar.a && bar.h[1] <= bar.t && bar.fits && bar.chip, `¿Dónde queda?: the trial clock fits between back and the sound (${bar.a} | ${bar.h} | ${bar.t})`);
      await b.shot('where-trial-bar');
      await b.go(`${BASE}?practice=${slugDe(id)}&test&labs`, 1200); await prepare();
      for (let w = 0; w < 30 && !await ev(`!!document.getElementById('btn-empezar')`); w++) await sleep(200);
      await prepare();
    }
    if (id === 'linea') {
      // The trial from the lab: the same as before a day (D-109), and it goes back to the lobby
      await click('#btn-ensayo'); await waitCountdown();
      await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');window.__playing={p:JUEGOS.linea.ensayo(__copa.estado.juego.semilla, 1)};return 1})()`);
      await playLine(2); await click('#btn-fin'); await sleep(300);
      ok(!!await ev(`document.getElementById('btn-volver-ensayo')`), 'the lab trial ends with the way back to the lobby');
      await click('#btn-volver-ensayo'); await sleep(300);
    }
    await click('#btn-empezar'); await sleep(300); await waitCountdown();
    // The folded rules below the board (D-133)
    {
      const r = await ev(`(()=>{const d=document.getElementById('reglas');if(!d)return null;const b=document.getElementById('jugar-body').getBoundingClientRect();return JSON.stringify({open:d.open,below:d.getBoundingClientRect().top>=b.bottom-1,title:d.querySelector('summary').textContent})})()`).then(x => x && JSON.parse(x));
      ok(r && !r.open && r.below && r.title.includes(await ev(`__copa.estado.juego ? document.querySelector('.jugar-titulo')?.textContent.split(' ').slice(1).join(' ') : ''`)), `${id}: the rules are folded below the board (${r?.title})`);
      if (id === 'conexiones') {
        await ev(`document.querySelector('#reglas summary').click(); document.getElementById('reglas').scrollIntoView(); 1`); await sleep(300);
        await b.shot('rules-open');
        await ev(`document.querySelector('#reglas summary').click(); window.scrollTo(0,0); 1`);
      }
    }
    await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');window.__playing={p:JUEGOS['${id}'].generar(__copa.estado.juego.semilla, 1)};return 1})()`);
    if (id === 'zip') {
      // Reaching the last number without covering everything: the warning goes under the grid and doesn't move it, and the head doesn't hide the number
      const z = await ev(`(async()=>{const z=await import('/cup/games/zip/engine.js');const p=z.nivel(__copa.estado.juego.semilla,1,0);const N=p.n*p.n;
        const start=+Object.keys(p.numeros).find(k=>p.numeros[k]===1);let found=null,k=0;
        const dfs=t=>{if(found||k++>200000)return;if(z.estado(p,t).faltan){found=t.slice();return}for(let i=0;i<N;i++)if(z.puedeIr(p,t,i)){t.push(i);dfs(t);t.pop()}};dfs([start]);
        const g=document.querySelector('.zip-grid');const top0=g.getBoundingClientRect().top;
        for(const i of found)g.querySelector('.zc[data-i="'+i+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));
        const h=g.querySelector('.zc.cabeza');const r={still:g.getBoundingClientRect().top===top0,warning:!!document.querySelector('.zip-aviso .aviso.mal'),num:h.innerText.trim()!=='',covers:getComputedStyle(h,'::after').content!=='none'};
        return JSON.stringify(r)})()`).then(JSON.parse);
      ok(z.warning && z.still, 'Zip: the missing-cells warning appears under the grid without moving it');
      ok(z.num && !z.covers, 'Zip: the head of the path over a number leaves the number visible');
      // Borrar todo, like in Tango: the first tap asks for confirmation and the second leaves only the 1
      const bz = await ev(`(async()=>{const g=document.querySelector('.zip-grid'),b=document.getElementById('btn-borrar'),w=ms=>new Promise(r=>setTimeout(r,ms));
        const before=g.querySelectorAll('.zc.on').length;b.click();await w(50);
        const head=g.querySelector('.zc.cabeza');head.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));await w(50);const released=!b.classList.contains('armado');
        b.click();await w(50);const armed=b.classList.contains('armado')&&g.querySelectorAll('.zc.on').length===before;
        b.click();await w(50);const on=[...g.querySelectorAll('.zc.on')];
        return JSON.stringify({before,released,armed,left:on.length,one:on[0]?.innerText.trim(),off:b.disabled})})()`).then(JSON.parse);
      ok(bz.before > 1 && bz.armed, 'Zip: the first tap on Borrar todo asks for confirmation and does not clear');
      ok(bz.released, 'Zip: tapping the grid with Borrar todo armed disarms it, like in Tango');
      ok(bz.left === 1 && bz.one === '1' && bz.off, 'Zip: the second tap leaves only the 1 and the button turns off');
    }
    if (id === 'reinas') {
      // The long press places an X, with the real pointer (D-103)
      const [x, y] = await ev(`(()=>{const r=document.querySelector('.rej[data-i="0"]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
      await sleep(650);
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
      await sleep(300);
      ok(await ev(`document.querySelector('.rej[data-i="0"]').classList.contains('marca')`), 'Reinas: the long press marks the X and does not place a queen');
      await b.tap(x, y); await b.tap(x, y);   // real quick taps: the X goes to empty and then to queen (D-167)
      ok(await ev(`document.querySelector('.rej[data-i="0"]').classList.contains('reina')`), 'Reinas: after the long press, quick taps are not lost');
      await b.tap(x, y);
      ok(await ev(`document.querySelector('.rej[data-i="0"]').classList.contains('marca')`), 'Reinas: another tap turns the queen into an X');
      await b.tap(x, y);
      ok(await ev(`document.querySelector('.rej[data-i="0"]').textContent === ''`), 'Reinas: and another leaves the cell empty');
    }
    if (id === 'desenredo') {
      // Dragging a knot with the real mouse moves it, and the crossings counter shows
      const before = await ev(`(()=>{const c=document.querySelector('.des-tablero circle[data-v="0"]');return JSON.stringify([c.cx.baseVal.value,c.cy.baseVal.value])})()`).then(JSON.parse);
      const [x0, y0] = await ev(`(()=>{const c=document.querySelector('.des-tablero circle[data-v="0"]').getBoundingClientRect();return JSON.stringify([c.x+c.width/2,c.y+c.height/2])})()`).then(JSON.parse);
      // Grabbed a bit to the side of the knot: the touch area is bigger than the drawing (C-8)
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0 + 14, y: y0, button: 'left', clickCount: 1, buttons: 1 });
      for (let i = 1; i <= 3; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + 14, y: y0 + 15 * i, button: 'left', buttons: 1 });
      // Mid-drag the grabbed knot is visible: with the .vilo class the shared drag CSS hid it
      ok(await ev(`(()=>{const c=document.querySelector('.des-tablero circle.tomado');return !!c&&c.getBoundingClientRect().width>20})()`), 'Desenredo: the dragged knot is visible while it moves');
      ok(await ev(`document.querySelectorAll('.des-tablero .des-hilo path.hebra').length`) > 0, 'Desenredo: the threads are drawn as rope (D-182)');
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x0 + 14, y: y0 + 45, button: 'left', clickCount: 1, buttons: 0 });
      const after = await ev(`(()=>{const c=document.querySelector('.des-tablero circle[data-v="0"]');return JSON.stringify([c.cx.baseVal.value,c.cy.baseVal.value])})()`).then(JSON.parse);
      ok(after[1] > before[1] + 50 && Math.abs(after[0] - before[0]) < 2, `Desenredo: dragging from beside the knot moves it (${before} → ${after})`);
      ok(/cruce/.test(await ev(`document.querySelector('.des-estado').textContent`)), 'Desenredo: the crossings are counted below the board');
      // Reiniciar nivel: with a knot moved it turns on, the first tap arms it and the second puts the knots back
      ok(await ev(`!document.getElementById('btn-reiniciar').disabled`), 'Desenredo: with a knot moved, Reiniciar nivel turns on');
      await ev(`document.getElementById('btn-reiniciar').click()`);
      ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-reiniciar').textContent`)), 'Desenredo: the first tap on Reiniciar nivel only arms it');
      await ev(`document.getElementById('btn-reiniciar').click()`); await sleep(1100);
      const back = await ev(`(()=>{const c=document.querySelector('.des-tablero circle[data-v="0"]');return JSON.stringify([c.cx.baseVal.value,c.cy.baseVal.value])})()`).then(JSON.parse);
      ok(Math.abs(back[0] - before[0]) < 1 && Math.abs(back[1] - before[1]) < 1 && await ev(`document.getElementById('btn-reiniciar').disabled`), `Desenredo: the second tap puts the knots back at the start (${back}) and the button turns off`);
      await checkScreen('untangle-board');
    }
    if (id === 'tango') await b.shot('tango-board');
    if (id === 'donde') {
      // Dragging turns the globe without placing the pin; the double tap only zooms in two times
      const view = () => ev(`JSON.stringify(document.querySelector('.mapa-globo').globo.vista())`).then(JSON.parse);
      const before = await view();
      ok(before.z === 1 && await ev(`(()=>{const c=document.querySelector('.mapa-globo').getBoundingClientRect();return c.width>200&&c.height>150})()`), '¿Dónde queda?: the globe starts fully in view');
      ok(await ev(`document.getElementById('btn-confirmar').disabled`), '¿Dónde queda?: without a pin, Confirmar is off (C-8)');
      ok(await ev(`document.getElementById('globo-pista')?.textContent`) === '↔ Arrastra para girar', '¿Dónde queda?: the first city says the globe can be turned (#88)');
      const [x0, y0] = await ev(`(()=>{const c=document.querySelector('.mapa-globo').getBoundingClientRect();return JSON.stringify([c.left+c.width/2,c.top+c.height/2])})()`).then(JSON.parse);
      await b.tap(x0, y0); await sleep(60); await b.tap(x0, y0); await sleep(500);
      const zoomed = await view();
      ok(zoomed.z === 2 && await ev(`!document.querySelector('.mapa-globo').dataset.alfiler && document.getElementById('btn-confirmar').disabled`), `¿Dónde queda?: the double tap zooms in two times (×${zoomed.z}) without placing the pin`);
      // A single tap does place it, once the moment when it could be a double tap has passed
      await b.tap(x0, y0); await sleep(500);
      ok(await ev(`document.querySelector('.mapa-globo').dataset.alfiler === '1' && !document.getElementById('btn-confirmar').disabled`), '¿Dónde queda?: a single tap places the pin');
      // A long drag goes all the way round: longitude has no cap (the globe turns endlessly)
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', clickCount: 1, buttons: 1 });
      for (let i = 1; i <= 6; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 - 12 * i, y: y0, button: 'left', buttons: 1 });
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x0 - 72, y: y0, button: 'left', clickCount: 1, buttons: 0 });
      await sleep(200);
      const turned = await view();
      ok(!await ev(`document.getElementById('globo-pista')`), '¿Dónde queda?: the hint goes away with the first drag');
      ok(turned.centro[1] > zoomed.centro[1] && turned.z === 2 && await ev(`document.querySelector('.mapa-globo').dataset.alfiler`) === '1', `¿Dónde queda?: dragging turns the globe (${zoomed.centro[1].toFixed(1)}° → ${turned.centro[1].toFixed(1)}°) and does not move the pin`);
      await ev(`document.querySelector('.mapa-globo').globo.girarA(0, 175); 1`);
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', clickCount: 1, buttons: 1 });
      for (let i = 1; i <= 6; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 - 12 * i, y: y0, button: 'left', buttons: 1 });
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x0 - 72, y: y0, button: 'left', clickCount: 1, buttons: 0 });
      await sleep(200);
      const lon = (await view()).centro[1];
      ok(lon < -170, `¿Dónde queda?: past 180° the globe keeps turning (${lon.toFixed(1)}°)`);
      // Zoomed in, the sharp tiles of what is in view are downloaded, and only those (D-160)
      if (await ev(`!!document.createElement('canvas').getContext('webgl')`)) {
        await ev(`document.querySelector('.mapa-globo').globo.girarA(-33, -70); for (let i = 0; i < 4; i++) document.getElementById('btn-acercar').click(); 1`);
        await sleep(1500);
        const tiles = await ev(`JSON.stringify(performance.getEntriesByType('resource').filter(e => e.name.includes('earth-2004-09/')).map(e => e.name.split('/').pop()))`).then(JSON.parse);
        ok(tiles.includes('5-4.jpg') && tiles.length <= 9, `¿Dónde queda?: zoomed in over Chile its tiles are downloaded (${tiles.join(', ')})`);
        for (let i = 0; i < 4; i++) await click('#btn-alejar');
      }
      await b.shot('where-map');
    }
    await PLAY[id](id === 'tango' ? 1 : 2);
    if (id === 'zip') {
      ok(await ev(`document.querySelector('.zip-grid').classList.contains('solucion') && !!document.getElementById('zip-solucion')`), 'Zip: when time runs out the solution of the half-done level shows');
      const clock0 = await ev(`document.querySelector('#jugar-head .cron').textContent`);
      await sleep(2200);
      ok(await ev(`document.querySelector('#jugar-head .cron').textContent`) === clock0 && !await ev(`document.querySelector('.zip-reloj')`), `Zip: when time runs out the clock stays still at ${clock0} and the countdown disappears`);
      await b.shot('zip-solution');
    }
    if (id === 'desenredo') {
      ok(await ev(`document.querySelector('.des-tablero').classList.contains('solucion') && !!document.getElementById('des-solucion')`), 'Desenredo: when time runs out a solution of the half-done level shows');
      ok(/Resolviste 2 niveles/.test(await ev(`document.querySelector('.zip-aviso').textContent`)), 'Desenredo: the final notice says how many levels were solved');
      ok(!/null|false|undefined/.test(await ev(`document.querySelector('.zip-aviso').textContent`)), 'Desenredo: the final notice carries no stray text');
      await sleep(900); await b.shot('untangle-solution');
    }
    if (id === 'conexiones') ok(await ev(`document.querySelectorAll('.grupo').length === 4 && !document.querySelector('.grupo').classList.contains('pop')`), 'Conexiones: groups already solved do not animate again');
    if (['conexiones', 'reinas', 'linea', 'letras'].includes(id)) {
      // The clock stops when the board ends, not when "Ver resultado" is tapped (D-130)
      const t0 = await ev(`document.querySelector('#jugar-head .cron').textContent`);
      await sleep(2300);
      ok(await ev(`document.querySelector('#jugar-head .cron').textContent`) === t0, `${id}: when the board ends the clock stays still at ${t0}`);
    }
    await click('#btn-fin'); await sleep(500);
    const r = await ev(`JSON.stringify({p:__copa.estado.pantalla, s:document.querySelector('.score-big')?.textContent})`).then(JSON.parse);
    ok(r.p === 'resultado', `practice of ${id}: plays through to the end (${r.s})`);
    ok((await ev(`document.querySelector('#explicacion')?.innerText || ''`)).length > 40, `practice of ${id}: explains how the score was computed`);
    if (id === 'donde') ok(r.s === '100/100', `¿Dónde queda?: the pin right on each city is 100 points (${r.s})`);
    if (['reinas', 'zip', 'desenredo', 'tango', 'letras', 'donde'].includes(id)) await b.shot(`practice-${id}`);
    if (id === 'reinas') { await checkScreen('practice-result'); await b.shot('11-practice'); }
  }
  // A report from practice (the reports of an earlier run on the same profile don't count)
  await ev(`localStorage.removeItem('juegos-de-salon:copa:prueba:reportes'); 1`);
  await click('#btn-reporte'); await sleep(300);
  await ev(`document.querySelector('.reporte-texto').value='El barco no se veía bien'; document.querySelector('#reporte-nombre').value='Tester'; 1`);
  ok(await ev(`(()=>{const c=document.getElementById('reporte-correo');return !!c && c.type==='email' && !c.value && !!document.getElementById('reporte-correo-nota')?.textContent})()`), 'the report has the optional email, empty, with what it is for (D-317)');
  await checkScreen('report');
  await b.shot('12-report');
  await click('#btn-enviar-reporte'); await sleep(400);
  const reports = await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:copa:prueba:reportes')||'[]')`);
  ok(reports.length === 1 && reports[0].texto === 'El barco no se veía bien' && /"juego":"final"/.test(reports[0].contexto), `the report is saved with its context${reports.length === 1 ? '' : ` (${reports.length} reports: ${JSON.stringify(reports).slice(0, 300)})`}`);
  ok(reports[0].nombre === 'Tester', 'the report carries the typed name');
  await click('#btn-reporte-volver'); await sleep(300);
  await click('#btn-reporte'); await sleep(300);
  ok(await ev(`document.querySelector('#reporte-nombre').value`) === 'Tester', 'the name stays saved on the device for the next report');
  await ev(`document.querySelector('.reporte-texto').value='Segundo comentario'; 1`);
  await click('#btn-enviar-reporte'); await sleep(400);
  ok(await ev(`!!document.getElementById('btn-reporte-volver')`), 'after sending there is a thank-you and a way back');
}

/* ---------- The demos (D-110): cups seeded in test mode, for the tests and the screenshots (D-262) ---------- */
if (runs('demos')) {
  const DEMOS = { new: 'admin', guest: 'entrar', waiting: 'tablero', 'not-started': 'admin', player: 'tablero', admin: 'admin', final: 'tablero', 'final-admin': 'admin', podium: 'tablero', full: 'tablero' };
  for (const [demo, expected] of Object.entries(DEMOS)) {
    await b.go(`${BASE}?test&demo=${demo}`, 1500); await prepare();
    ok(await screen() === expected, `demo ${demo}: opens on ${expected}`);
    await checkScreen(`demo-${demo}`);
    await b.shot(`demo-${demo}`);
  }
  await b.go(`${BASE}?test&demo=not-started`, 1500); await prepare();
  ok(/nadie ha jugado/i.test(await ev(`document.getElementById('admin-inicio')?.innerText || ''`)), 'demo not-started: the admin sees it started with nobody and can move it');
  await b.go(`${BASE}?test&demo=player`, 1500); await prepare();
  ok(!!await ev(`document.querySelector('[data-dia="4"]')`), 'demo player: day 4 can be played');
  ok(await ev(`[...document.querySelectorAll('.tabla .fila')].every(f=>f.querySelectorAll('.pd').length===7) && !!document.querySelector('.tabla .pd.pendiente') && !!document.querySelector('.tabla .pd.abierto') && !!document.querySelector('.tabla-leyenda')`), 'the table shows each player\'s 7 days, with states and a legend (D-131)');
  // Deleting the cup (D-117): two confirmations, the second by typing the name
  await b.go(`${BASE}?test&demo=admin`, 1500); await prepare();
  const codeToDelete = await ev('__copa.estado.code');
  await checkScreen('admin-delete');
  await ev(`window.prompt = () => 'otro nombre'; 1`);
  await click('#btn-eliminar'); await sleep(300);
  ok(/no coincide/.test(await ev(`document.querySelector('#admin-eliminar .form-error').textContent`)) && !!await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:copa:prueba'))['${codeToDelete}']`), 'delete: with another name nothing is deleted');
  await ev(`window.prompt = () => 'copa de la oficina'; 1`);
  await click('#btn-eliminar'); await sleep(500);
  ok(!!await ev(`document.getElementById('copa-eliminada')`) && !await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:copa:prueba'))['${codeToDelete}']`), 'delete: typing the name deletes it and the admin sees it was deleted');
  await b.shot('cup-deleted');

  // Each message only when it makes sense (D-116)
  await b.go(`${BASE}?test&demo=admin`, 1500); await prepare();
  ok(!!await ev(`document.getElementById('msg-invitar')`) && !!await ev(`document.getElementById('msg-tabla')`) && !await ev(`document.getElementById('msg-final')`), 'day 4: with invitation (D-176) and the partial table, without final summary');
  await ev(`window.__msgs = []; navigator.share = d => { window.__msgs.push(d.text); return Promise.resolve(); }; 1`);
  await click('#msg-invitar'); await sleep(400);
  ok(/día \d+ de \d+/.test(await ev(`(window.__msgs || []).join(' ')`) || '') && !/Parte el/.test(await ev(`(window.__msgs || []).join(' ')`) || ''), 'the invitation of a cup already under way says which day it is on (D-176)');
  await b.go(`${BASE}?test&demo=new`, 1500); await prepare();
  ok(!!await ev(`document.getElementById('lab-falta-gente')`) && !await ev(`document.getElementById('btn-pasar-dia')`), 'with the admin alone the day cannot be advanced (D-118)');
  ok(!!await ev(`document.getElementById('msg-invitar')`) && !await ev(`document.getElementById('msg-tabla')`), 'before starting: with invitation and without table');
  // Test cup: the admin moves it to the next day (D-115)
  await b.go(`${BASE}?test&demo=admin`, 1500); await prepare();
  const labStart = await ev('__copa.estado.copa.meta.start');
  await click('#btn-pasar-dia'); await sleep(400);
  ok(await ev('__copa.estado.copa.meta.start') !== labStart && /día 6/i.test(await ev(`document.getElementById('btn-pasar-dia')?.textContent || ''`)), 'test cup: the admin moves it to day 5 and the button offers day 6');
  await checkScreen('admin-lab');
  await b.shot('admin-lab');

  // Ending the cup early (D-161): on the day of the final, with people who haven't played; then, export
  await b.go(`${BASE}?test&demo=final-admin`, 1500); await prepare();
  const endNotice = await ev(`document.getElementById('admin-terminar')?.innerText || ''`);
  ok(/Falta que juegue(n)? el día 7: .*Cata/.test(endNotice) && !/no se juegan/.test(endNotice), 'end early: the admin sees who hasn\'t played the final');
  ok(!await ev(`document.getElementById('admin-exportar')`), 'while it is being played there is no export');
  await checkScreen('admin-end');
  await ev(`document.getElementById('admin-terminar').scrollIntoView(); 1`);
  await b.shot('admin-end');
  await ev('window.confirm = () => false; 1');
  await click('#btn-terminar'); await sleep(300);
  ok(!await ev('__copa.estado.copa.fin'), 'end early: without confirming nothing happens');
  await ev('window.confirm = () => true; 1');
  await click('#btn-terminar'); await sleep(500);
  ok(!!await ev('__copa.estado.copa.fin') && !await ev(`document.getElementById('admin-terminar')`) && !!await ev(`document.getElementById('admin-exportar')`) && !!await ev(`document.getElementById('msg-final')`), 'end early: the cup ends and the final summary and export appear');
  await ev(`window.__downloads = []; URL.createObjectURL = x => { window.__downloads.push(x); return 'blob:prueba'; }; 1`);
  await click('#btn-exportar-planilla'); await sleep(300);
  const csv = await ev(`window.__downloads[0]?.text()`);
  const bom = await ev(`window.__downloads[0]?.arrayBuffer().then(x => [...new Uint8Array(x).slice(0, 3)].join(','))`);
  ok(bom === '239,187,191', 'export: the spreadsheet carries a BOM, so Excel reads the accents');
  ok(/^🏆 Copa de la oficina\r\nEl administrador la terminó antes/.test(csv || '') && /Tabla final/.test(csv) && /Posiciones día a día/.test(csv) && /Día 7 · La Gran Final/.test(csv), 'export: the spreadsheet has the final table, the day-by-day places and the final');
  await checkScreen('admin-export');
  await b.shot('admin-export');
  await click('#btn-exportar-imagen'); await sleep(1500);
  ok((await ev(`window.__shared.length`)) + (await ev(`window.__downloads.length`)) >= 2, 'export: the final table image is shared or downloaded');
  await ev(`[...document.querySelectorAll('#admin-body > button')].find(x => /Volver a la copa/.test(x.textContent))?.click(); 1`); await sleep(400);
  ok(await screen() === 'tablero' && !!await ev(`document.querySelector('.podio')`) && /terminó la copa antes/.test(await ev(`document.querySelector('.copa-head').innerText`)), 'end early: the board shows the podium and that the admin closed it');
  await b.shot('board-ended-early');

  // A cup for Brazil (D-187): the invitation says so, and its Línea may bring the Brazil theme but never the Chile one
  {
    const code = await ev(`(async()=>{const E=await import('/cup/engine.js');const st=__copa.store;await st.listo();const now=st.now();
      let c=null;for(const x of ['WQXYZ','WQXYA','WQXYB']){if(!(await st.existe(x))){c=x;break}}
      const meta=E.nuevaMeta({nombre:'Copa do Brasil',dias:7,inicio:E.sumarDias(E.fechaEn(now,E.ZONA),1),tz:E.ZONA,admin:'zzz111',creada:now,lab:true,aud:'br'});
      await st.crear(c,meta,{pid:'zzz111',name:'Ana',at:now,pinHash:'x'});return c})()`);
    await ev('sessionStorage.clear(); 1');
    await b.go(`${BASE}?${code}&test`, 1500);
    ok(await ev(`document.getElementById('aviso-aud')?.dataset.aud`) === 'br' && /Brasil/.test(await ev(`document.getElementById('aviso-aud').textContent`)), 'cup for Brazil: the invitation says so');
    ok(await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');return [1,2,3,4,5,6,7].every(d=>JUEGOS.linea.generar('${code}',d,{aud:'br'}).tema!=='chile')})()`), 'cup for Brazil: Línea Relámpago does not use the Chile theme');
    await b.shot('invitation-brazil');
  }
}

console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
ok(!b.errors.length && !b.logs.length, 'console without errors');
b.close();
