// La clave (lab prototype, D-270) end to end, with its 4 cards: the lab offers it; tapping a card
// puts it on the base and selects it; ↻ and ⇋ orient it and ✕ removes it; a stroke on top of another
// shows striped with the clashing colors (no text); with all of them upright the code reads (and not
// before) with no clashes; a wrong one counts and the right one opens; the link to the comment goes at
// the end of each view and the result ends with the form.
// And Palabra (Spanish only): flipping shows the other face and the word opens.
// At 320 px and in the four languages, without overflowing. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/code-lab');
const b = await launch({ port: 9394, dir: `${OUT}/p`, out: OUT, width: 320, height: 760 });
const ev = e => b.evaluate(e);
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const click = sel => ev(`document.querySelector(${JSON.stringify(sel)}).click(); 1`);
const typeIn = async v => { for (const d of v) await ev(`[...document.querySelectorAll('.keypad button')].find(b=>b.dataset.d==='${d}').click(); 1`); await click('.keypad .ok'); await sleep(250); };
// What reads now on the base, with the engine and what the player did
const reading = () => ev(`(async()=>{const m=await import('/labs/code/engine.js');const P=window.__clave.P;return m.juntos(P.clave,P.g,P.puestas).map(m.leer).map(x=>x??'·').join('')})()`);
const STEPS = { I: [], R: ['#btn-girar'], H: ['#btn-voltear'], V: ['#btn-girar', '#btn-voltear'] };
const noOverflow = () => ev(`document.documentElement.scrollWidth <= innerWidth`);

await b.go(`${SITE}/labs/`);
ok(await ev(`document.querySelector('#bodega #btn-clave')?.getAttribute('href')`) === 'code/', 'the lab offers La clave, in La Bodega (D-280)');

for (const lang of ['es', 'en', 'pt']) {
  const n = 4;
  await b.go(`${SITE}/labs/code/`);
  await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); 1`);
  await b.go(`${SITE}/labs/code/`, 900);
  ok(await ev(`!!document.querySelector('.portada .titulo-clave .rainbow') && !!document.querySelector('.demo .capa-demo') && document.querySelectorAll('.pasos li').length === 3`), `${lang}: the cover with the gradient title, the animated illustration and the three steps`);
  ok(await ev(`!!document.querySelector('#pie #btn-comentario')`) && await noOverflow() && !await ev(`!!document.querySelector('#btn-empezar-8')`) && (lang !== 'es') !== await ev(`!!document.getElementById('btn-empezar-palabra')`), `${lang}: the cover (with Palabra only in Spanish), without the 8-card mode, with the comment link at the end`);
  await click('#btn-empezar'); await sleep(300);
  const { codigo: code, cartas: cards } = await ev(`JSON.stringify(window.__clave.P.clave)`).then(JSON.parse);
  ok(await ev(`!!document.querySelector('#vista > .titulo-clave .rainbow') && !!document.querySelector('.reglas-clave')`), `${lang}: the game has the title and ¿Cómo se juega? at the end`);
  ok(cards.length === n && await ev(`document.querySelectorAll('.carta').length`) === n, `${lang}: ${n} cards in the tray`);
  ok(await ev(`[...document.querySelectorAll('.controles button')].every(x => x.disabled)`), `${lang}: with no card selected, ↻ ⇋ ✕ do nothing`);
  // Tapping a card places and selects it; ✕ removes it
  await click('.carta[data-k="0"]'); await sleep(120);
  ok(await ev(`window.__clave.P.puestas[0] && window.__clave.P.elegida === 0 && document.querySelector('.carta[data-k="0"]').classList.contains('elegida')`), `${lang}: tapping a card places and selects it`);
  await click('#btn-quitar'); await sleep(120);
  ok(!await ev(`window.__clave.P.puestas[0]`), `${lang}: ✕ removes it`);
  // Place them all, without orienting (none comes upright): the code doesn't read
  for (let k = 0; k < n; k++) { await click(`.carta[data-k="${k}"]`); await sleep(40); }
  ok(await reading() !== code, `${lang}: placed but not oriented, the code doesn't read (${await reading()})`);
  // A combination with strokes on top of others: they show striped, no text
  const clash = await ev(`(async()=>{const m=await import('/labs/code/engine.js');const c=window.__clave.P.clave;const O=m.ORIENTACIONES;for(const a of O)for(const b of O)for(const d of O)for(const e of O){const g=[a,b,d,e];const ch=m.choques(c,g);if(ch.length)return JSON.stringify({g,n:ch.length})}return 'null'})()`).then(JSON.parse);
  if (clash) {
    const orient = async g => { for (let k = 0; k < n; k++) { const now = await ev(`window.__clave.P.g[${k}]`); const needed = await ev(`(async()=>{const m=await import('/labs/code/engine.js');return m.componer('${now}','${g[k]}')})()`); await click(`.carta[data-k="${k}"]`); for (const sel of STEPS[needed]) { await click(sel); await sleep(30); } } };
    await orient(clash.g); await sleep(200);
    ok(await ev(`document.querySelectorAll('#choques line.choque').length`) === clash.n && await ev(`[...document.querySelectorAll('#choques line.choque')].every(l => /^url\\(#rayas-/.test(l.getAttribute('stroke')))`) && !/⚠️/.test(await ev(`document.getElementById('aviso').textContent`)), `${lang}: ${clash.n} stroke(s) on top of others, striped with the clashing colors and no text`);
    if (lang === 'es') await b.shot('1-clash');
  }
  // Orient each one correctly
  for (let k = 0; k < n; k++) {
    const needed = await ev(`(async()=>{const m=await import('/labs/code/engine.js');return m.componer(window.__clave.P.g[${k}], window.__clave.P.clave.cartas[${k}].o)})()`);
    await click(`.carta[data-k="${k}"]`); await sleep(40);
    for (const sel of STEPS[needed]) { await click(sel); await sleep(40); }
  }
  await sleep(500);
  ok(await reading() === code && await ev(`document.querySelectorAll('#choques line').length`) === 0, `${lang}: with all upright it reads ${code}, no clashes`);
  ok(await noOverflow() && await ev(`!!document.querySelector('#pie #btn-comentario')`), `${lang}: the game doesn't overflow and ends with the comment link`);
  if (lang === 'es') await b.shot('2-upright');
  // A wrong code counts; the right one opens
  await typeIn(code === '00000' ? '11111' : '00000');
  ok(await ev(`window.__clave.P.errores`) === 1, `${lang}: a wrong code counts as a failed attempt`);
  await typeIn(code);
  const end = await ev(`JSON.stringify({ code: document.getElementById('codigo')?.textContent, summary: document.getElementById('resumen')?.textContent, formLast: document.querySelector('.resultado')?.lastElementChild?.classList.contains('comentario'), footer: document.getElementById('pie').children.length, share: !!document.getElementById('btn-compartir-resultado') })`).then(JSON.parse);
  ok(end.code === code && end.formLast && end.footer === 0 && end.share, `${lang}: the right code opens (${end.summary}), with share and the form at the end`);
  if (lang === 'es') await b.shot('3-open');
}
// Palabra (Spanish only): fourteen-segment letters and two-faced cards
{
  await b.go(`${SITE}/labs/code/`);
  await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', 'es'); 1`);
  await b.go(`${SITE}/labs/code/`, 900);
  await click('#btn-empezar-palabra'); await sleep(300);
  const { palabra: word, cartas: cards } = await ev(`JSON.stringify(window.__clave.P.clave)`).then(JSON.parse);
  const readWord = () => ev(`(()=>{const m=window.__clave.palabra,P=window.__clave.P;return m.juntos(P.clave,P.e,P.puestas).map(m.leer).map(x=>x??'·').join('')})()`);
  for (let k = 0; k < cards.length; k++) { await click(`.carta[data-k="${k}"]`); await sleep(40); }
  ok(await ev(`document.querySelectorAll('.carta .caras i').length`) === 8, 'palabra: each card shows its two faces');
  // Flipping changes the strokes (the other face), it doesn't mirror them
  const before = await ev(`document.querySelector('#marco .capa[data-k="0"]').innerHTML`);
  await click('.carta[data-k="0"]'); await click('#btn-voltear'); await sleep(350);
  ok(await ev(`document.querySelector('#marco .capa[data-k="0"]').innerHTML`) !== before && await ev(`window.__clave.P.e[0][0]`) === 1, 'palabra: flipping shows the other face');
  for (let k = 0; k < cards.length; k++) {
    await click(`.carta[data-k="${k}"]`); await sleep(40);
    const [face, turned] = cards[k].bien;
    if (await ev(`window.__clave.P.e[${k}][0]`) !== face) { await click('#btn-voltear'); await sleep(300); }
    if (await ev(`window.__clave.P.e[${k}][1]`) !== turned) { await click('#btn-girar'); await sleep(60); }
  }
  await sleep(500);
  ok(await readWord() === word && await ev(`document.querySelectorAll('#choques line.choque').length`) === 0, `palabra: with the right face and turn it reads ${word}, no clashes`);
  ok(await noOverflow(), 'palabra: the letter keypad fits at 320 px');
  await b.shot('4-word');
  const write = async v => { for (const d of v) await ev(`[...document.querySelectorAll('.keypad button')].find(b=>b.dataset.d==='${d}').click(); 1`); await click('.keypad .ok'); await sleep(250); };
  await write(word === 'ACERO' ? 'BARCO' : 'ACERO');
  ok(await ev(`window.__clave.P.errores`) === 1, 'palabra: a wrong word counts');
  await write(word);
  ok(await ev(`document.getElementById('codigo')?.textContent`) === word, 'palabra: the right one opens and shows it');
}
ok(!b.errors.length, `no errors on the page ${JSON.stringify(b.errors)}`);
b.close();
if (failures) { console.log(`✗ ${failures} failures`); process.exit(1); }
console.log('✓ la clave (labs)');
