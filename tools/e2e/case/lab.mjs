// El caso in the lab (D-267) end to end, at /labs/case/: the lab offers it and /case/ leads there;
// without a seed it's today's case (the link stays clean); it plays with La Copa's screen (D-257),
// marking too early counts as an error (D-261), reloading picks up where it was, the clues used get
// crossed out by themselves (D-282), it's solved entirely without guessing and the end offers sharing
// the same case, another case, today's and the comment (D-265), which in test mode stays on the phone.
// Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/case-lab');
const b = await launch({ port: 9392, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEED = 'KQRST';
const KEY = `juegos-de-salon:diario:caso:${SEED}`;
// What can be deduced now, with the engine and the moves the page saved
const deducible = () => ev(`(async()=>{const m=await import('/cup/games/case/engine.js');const p=m.generar('${SEED}',1);const j=(JSON.parse(localStorage.getItem('${KEY}')||'null')||{}).jugadas||[];const e=m.estado(p,j);return JSON.stringify({d:m.deducibles(e.pistas,e.x),done:e.fin,errors:e.errores})})()`).then(JSON.parse);
const visible = sel => `(()=>{const x=document.querySelector('${sel}');return !!x&&x.offsetParent!==null})()`;
let duringCountdown = null;
const start = async () => {
  await waitFor(`!!document.getElementById('btn-empezar')`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  // During the 3, 2, 1 countdown the comment link is not there (D-268)
  if (await waitFor(`!!document.getElementById('cuenta')`, 3000)) duringCountdown = await ev(visible('#btn-comentario'));
  return waitFor(`document.querySelectorAll('.cs-persona').length === 20 && !document.getElementById('cuenta')`, 12000);
};
const mark = async (i, v) => {
  await ev(`document.querySelector('.cs-persona[data-i="${i}"]').click(); 1`); await sleep(80);
  await ev(`document.getElementById('${v ? 'btn-criminal' : 'btn-inocente'}').click(); 1`); await sleep(120);
};

// The lab offers it, and /case/ (the old link) leads to /labs/case/
await b.go(`${SITE}/labs/`);
ok(await ev(`document.getElementById('btn-caso')?.getAttribute('href')`) === 'case/', 'the lab offers El caso at /labs/case/');
// Two groups (D-280): Active projects and La Bodega, where El caso ended up
ok(await ev(`!!document.querySelector('#bodega #seccion-caso') && !document.querySelector('#activos #seccion-caso')`), 'El caso is in La Bodega, not in Active projects');
// La Bodega comes folded to the title (owner's request): one tap opens it and shows its button
ok(await ev(`[...document.querySelectorAll('#bodega details')].every(d => !d.open) && !document.getElementById('btn-caso').checkVisibility()`), 'La Bodega comes folded: only the titles');
ok(await ev(`[...document.querySelectorAll('#activos .seccion')].every(x => !x.querySelector('details'))`), 'the active projects come open');
await ev(`document.querySelector('#seccion-caso summary').click(); 1`); await sleep(100);
ok(await ev(`document.querySelector('#seccion-caso details').open && document.getElementById('btn-caso').checkVisibility()`), 'one tap on the title opens it and shows Jugar');
await b.go(`${SITE}/case/`, 1500);
ok(await ev(`location.pathname`) === '/labs/case/', `/case/ leads to /labs/case/ (${await ev('location.pathname')})`);

// Without a seed: today's case, and the link stays clean
await ev(`localStorage.clear(); 1`);
await b.go(`${SITE}/labs/case/`, 1500);
ok(await waitFor(`!!document.getElementById('diario-intro')`), 'without a seed, the lobby says it is today\'s case, the same for everyone');
ok(await ev(`location.search`) === '', 'and the link has no seed');
ok((await ev(`document.getElementById('btn-menu')?.href || ''`)).endsWith('/labs/'), 'the top button goes back to the lab');
// The comment link, at the end of the lobby, opens the form in an overlay (D-268)
ok(await ev(visible('#btn-comentario')) && await ev(`(()=>{const b=document.getElementById('btn-comentario'),y=b.getBoundingClientRect().top+scrollY;return [...document.querySelectorAll('#screen-jugar button, #screen-jugar a')].every(x=>x===b||x.offsetParent===null||x.getBoundingClientRect().top+scrollY<=y)})()`), 'the lobby ends with the comment link');
await ev(`document.getElementById('btn-comentario').click(); 1`); await sleep(200);
ok(await ev(`!!document.querySelector('.labs-capa .comentario textarea')`), 'and it opens the form');
await ev(`document.querySelector('.labs-capa').click(); 1`); await sleep(150);
ok(!await ev(`!!document.querySelector('.labs-capa')`), 'which closes by tapping outside');
await b.shot('01-lobby');

// With a seed: the same case for whoever gets the link
await b.go(`${SITE}/labs/case/?seed=${SEED}&test`, 1500);
ok(!await ev(`!!document.getElementById('diario-intro')`), 'with a seed it is not today\'s');
ok(await start(), 'Empezar opens the case after the countdown');
ok(duringCountdown === false, 'during the countdown the comment link is not there');
ok(await ev(visible('#btn-comentario')), 'and in the game it comes back, at the end');
await b.shot('02-case');

// Too early: counts as an error
let { d } = await deducible();
const unknown = await ev(`(async()=>{const m=await import('/cup/games/case/engine.js');const p=m.generar('${SEED}',1);const e=m.estado(p,[]);const d=m.deducibles(e.pistas,e.x);return [...Array(20).keys()].find(i=>e.x[i]===-1&&!(i in d))})()`);
if (unknown !== null && unknown !== undefined) {
  await mark(unknown, 1);
  ok((await deducible()).errors === 1, 'marking too early counts as an error (D-261)');
}
const [i0, v0] = Object.entries(d)[0];
await mark(i0, v0);
ok(await ev(`document.querySelectorAll('.cs-persona.marcada').length`) === 2, 'marking correctly adds the person');

// Reload: picks up where it was, without the countdown
await b.go(`${SITE}/labs/case/?seed=${SEED}&test`, 1500);
await waitFor(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(600);
ok(await ev(`document.querySelectorAll('.cs-persona.marcada').length`) === 2 && !await ev(`!!document.getElementById('cuenta')`), 'on reload it picks up where it was, without the countdown (D-267)');

// The clues used get crossed out by themselves (D-282): those that already have everything they cover
// marked, according to the engine and what the page saved. The ✓ crosses out by hand one that isn't,
// and un-crosses one crossed out by itself
const used = () => ev(`(async()=>{const m=await import('/cup/games/case/engine.js');const p=m.generar('${SEED}',1);const j=(JSON.parse(localStorage.getItem('${KEY}')||'null')||{}).jugadas||[];return [...m.usadas(p,m.estado(p,j).x)]})()`);
const crossedInDom = () => ev(`[...document.querySelectorAll('.cs-pista.tachada')].map(x => +x.dataset.de).sort((a, b) => a - b)`);
const tapCross = i => ev(`document.querySelector('.cs-pista[data-de="${i}"] .tachar').click(); 1`);
const free = (await ev(`[...document.querySelectorAll('.cs-pista:not(.tachada)')].map(x => +x.dataset.de)`))[0];
const usedBefore = await used();
const byHand = usedBefore.includes(free) ? null : free;
if (byHand !== null && byHand !== undefined) {
  await tapCross(byHand); await sleep(80);
  ok((await crossedInDom()).includes(byHand) && await ev(`document.querySelector('.cs-pista[data-de="${byHand}"] .tachar').getAttribute('aria-pressed')`) === 'true', 'the ✓ crosses out a clue by hand');
}
let uncrossed = null, automatic = 0, mismatches = [];
const checkCrossed = async () => {
  const u = await used();
  if (uncrossed === null) {
    const other = u.find(i => i !== byHand);
    if (other !== undefined) {
      await tapCross(other); await sleep(80);
      uncrossed = other;
      ok(!(await crossedInDom()).includes(other), 'the ✓ un-crosses a clue crossed out by itself');
    }
  }
  automatic = Math.max(automatic, u.filter(i => i !== uncrossed && i !== byHand).length);
  const expected = [...new Set([...u.filter(i => i !== uncrossed), ...(byHand != null ? [byHand] : [])])].sort((a, b) => a - b);
  const actual = await crossedInDom();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) mismatches.push({ expected, actual });
};

// Solve it entirely, always with what can be deduced
for (let g = 0; g < 40; g++) {
  const s = await deducible();
  if (s.done || !Object.keys(s.d).length) break;
  for (const [i, v] of Object.entries(s.d)) { await mark(i, v); await checkCrossed(); }
}
ok(automatic > 0 && !mismatches.length, `the clues used get crossed out by themselves, and the hand-crossed and the un-crossed stay as the player left them (${automatic} automatic at once; ${JSON.stringify(mismatches.slice(0, 2))})`);
ok(await waitFor(`!!document.getElementById('btn-fin')`), 'the case is solved without guessing');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await waitFor(`!!document.querySelector('.score-big')`), `the result: ${await ev(`document.querySelector('.score-big')?.textContent`)}`);

// The end: share the same case, another case, today's and the comment
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'the result can be shared');
const another = await ev(`document.getElementById('btn-otra')?.getAttribute('href') || ''`);
ok(/seed=[A-Z]{5}/.test(another) && !another.includes(SEED) && /Otro caso/.test(await ev(`document.getElementById('btn-otra').textContent`)), `"Otro caso" opens a new one (${another})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), 'and since it was not today\'s, it offers today\'s case');
ok(await ev(`!!document.querySelector('.comentario textarea')`), 'at the end there is the comment form (D-265)');
ok(await ev(`(()=>{const k=[...document.getElementById('resultado-body').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario')})()`), 'and it is the last thing in the result (D-268)');
await ev(`window.__sent = []; window.fetch = async (u, o) => { window.__sent.push({ u: String(u), o }); return { ok: true }; }; document.getElementById('btn-enviar-comentario').click(); 1`); await sleep(200);
ok(/Escribe algo/.test(await ev(`document.querySelector('.comentario .labs-error').textContent`)), 'empty is not sent');
// The optional email (D-317): it says what it's for, and a malformed one doesn't go
ok(await ev(`(()=>{const c=document.querySelector('.comentario input[type=email]');return !!c && c.offsetParent!==null && /opcional/.test(c.placeholder) && /solo para responderte.*90 días/i.test(document.getElementById(c.getAttribute('aria-describedby'))?.textContent||'')})()`), 'the form has the optional email, with what it is for');
await ev(`document.querySelector('.comentario textarea').value = 'Me trabé con una pista'; document.querySelector('.comentario input[type=email]').value = 'ana@'; document.getElementById('btn-enviar-comentario').click(); 1`); await sleep(200);
ok(/correo/.test(await ev(`document.querySelector('.comentario .labs-error').textContent`)), 'a malformed email is not sent');
await ev(`document.querySelector('.comentario input[type=email]').value = 'ana@correo.cl'; document.getElementById('btn-enviar-comentario').click(); 1`); await sleep(400);
// In test mode it stays in local storage, like La Copa's reports, and nothing goes out to the network
const saved = await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:copa:prueba:reportes') || '[]')`);
ok(saved.length === 1 && saved[0].texto === 'Me trabé con una pista' && /"juego":"caso"/.test(saved[0].contexto) && saved[0].contexto.includes(SEED), `the comment is saved with the case (${saved[0]?.contexto?.slice(0, 80)})`);
ok(saved[0]?.correo === 'ana@correo.cl', 'with the email');
ok(!await ev(`window.__sent.some(x => x.u.includes('feedback'))`), 'and in test mode it does not go to Firebase');
ok(/Gracias/.test(await ev(`document.querySelector('.comentario').textContent`)), 'and it says thanks in the same place');
await b.shot('03-final');
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ el caso (labs)');
