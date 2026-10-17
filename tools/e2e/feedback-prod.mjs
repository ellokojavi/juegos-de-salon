// The "💬 Suggestions and comments" inbox in production (D-345, U-38): at the end of a game, after
// its buttons, a quiet link that unfolds the form in place; sending saves the message (in `?test`'s
// local store) with its kind; the link rests the rest of the day and 14 days after sending; and it
// reads well in the four languages at 320 px. The home footer link opens the form in its overlay.
// Usage: node tools/e2e/feedback-prod.mjs /tmp/feedback-prod
import { output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { PATHS } from './paths.mjs';
import { COMMON } from '../../public/assets/js/i18n.js';
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output('/tmp/feedback-prod');
let bad = 0;
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) bad++; };
const KEY = 'juegos-de-salon:buzon', TEST = 'juegos-de-salon:buzon:prueba';
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 700 });
const run = async steps => { for (const s of steps) { await b.evaluate(`(()=>{ ${s} ; return 1})()`); await sleep(700); } await sleep(400); };
const state = () => b.evaluate(`JSON.stringify({
  link: !!document.querySelector('.screen.active #buzon-pie'),
  after: (() => { const a = document.getElementById('solo-actions'), l = document.getElementById('buzon-pie');
    return !!(a && l && (a.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING)); })(),
  text: document.getElementById('btn-buzon')?.textContent || '',
  scroll: document.documentElement.scrollWidth > innerWidth,
  sent: JSON.parse(localStorage.getItem('${TEST}') || '[]'),
  rule: JSON.parse(localStorage.getItem('${KEY}') || '{}'),
})`).then(JSON.parse);
const result = PATHS['toque-y-fama']['solo-result'];
const fresh = async (lang, seed) => {
  await b.go(`${SITE}/bulls-and-cows/?test`, 1200);
  await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); ${seed ? `localStorage.setItem('${KEY}', '${JSON.stringify(seed)}');` : ''} 1`);
  await b.go(`${SITE}/bulls-and-cows/?test`, 1200);
};

// A new device: its first 2 games end without the link, the 3rd has it, after the buttons
await fresh('es');
await run(result);
check(!(await state()).link, 'the 1st game of a new device ends without the link');
await b.go(`${SITE}/bulls-and-cows/?test`, 1200); await run(result);
check(!(await state()).link, 'neither does the 2nd');
await b.go(`${SITE}/bulls-and-cows/?test`, 1200); await run(result);
let e = await state();
check(e.link && e.after, 'the 3rd ends with the link, after the main buttons');
check(e.text === COMMON.es.buzon.abrir, `it reads «${e.text}»`);

// Tapping unfolds the form in place, no overlay; sending saves it with its kind
await b.evaluate(`document.getElementById('btn-buzon').click(); 1`); await sleep(800);
check(await b.evaluate(`!!document.querySelector('#buzon-pie textarea') && !document.querySelector('.labs-capa')`), 'tapping unfolds the form in place, not a popup');
check(await b.evaluate(`document.querySelectorAll('#buzon-pie .buzon-tipo').length`) === 4, 'with the four optional kinds');
await b.evaluate(`document.querySelector('.buzon-tipo[data-tipo="idea"]').click(); const t = document.querySelector('#buzon-pie textarea'); t.value = 'Me gustaría jugar al dominó'; t.dispatchEvent(new Event('input')); 1`);
await b.shot('form-es-320');
await b.evaluate(`document.getElementById('btn-enviar-comentario').click(); 1`); await sleep(800);
e = await state();
check(e.sent.length === 1 && e.sent[0].tipo === 'idea' && /dominó/.test(e.sent[0].texto), 'sending saves the message with its kind');
check(JSON.parse(e.sent[0].contexto || '{}').juego === 'toque-y-fama', 'and the game it was written from');
check(await b.evaluate(`/Gracias/.test(document.getElementById('buzon-pie').textContent)`), 'and says thanks in the same place');
check(e.rule.enviado > 0, 'the device remembers it sent one');

// The rest of the day it doesn't show again; 14 days after sending, it doesn't either
await fresh('es', { partidas: 5, visto: new Date().toLocaleDateString('sv') });
await run(result);
check(!(await state()).link, 'once seen today, the next game today ends without it');
await fresh('es', { partidas: 5, visto: '2000-01-01', enviado: Date.now() - 3 * 864e5 });
await run(result);
check(!(await state()).link, '3 days after sending, it still rests');
await fresh('es', { partidas: 5, visto: '2000-01-01', enviado: Date.now() - 15 * 864e5 });
await run(result);
check((await state()).link, '15 days after sending, it is back');

// The four languages at 320 px
for (const lang of ['es', 'en', 'pt', 'de']) {
  await fresh(lang, { partidas: 2 });
  await run(result);
  e = await state();
  check(e.link && e.after && e.text === COMMON[lang].buzon.abrir && !e.scroll, `${lang}: the link after the buttons, in its language, no horizontal scroll at 320 px`);
  await b.shot(`link-${lang}-320`);
  await b.evaluate(`document.getElementById('btn-buzon').click(); 1`); await sleep(800);
  const f = await b.evaluate(`JSON.stringify({ h: document.querySelector('#buzon-pie h2')?.textContent, scroll: document.documentElement.scrollWidth > innerWidth })`).then(JSON.parse);
  check(f.h === `💬 ${COMMON[lang].buzon.titulo}` && !f.scroll, `${lang}: the form unfolds with its title, no horizontal scroll`);
  await b.shot(`form-${lang}-320`);
}

// The fixed place: the home footer, always there, opening the overlay
await b.go(`${SITE}/?test`, 1500);
await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', 'es'); 1`);
await b.go(`${SITE}/?test`, 1500);
const home = await b.evaluate(`JSON.stringify({ t: document.getElementById('btn-buzon-portada')?.textContent, foot: !!document.querySelector('footer #btn-buzon-portada') })`).then(JSON.parse);
check(home.foot && home.t === COMMON.es.buzon.abrir, 'the home footer has the link, even on a new device');
await b.evaluate(`document.getElementById('btn-buzon-portada').click(); 1`); await sleep(900);
check(await b.evaluate(`!!document.querySelector('.labs-capa [role="dialog"] textarea')`), 'and it opens the form in its overlay');
await b.shot('home-overlay-320');

await b.close();
console.log(bad ? `\n✗ ${bad} failed` : '\n✓ all good');
process.exit(bad ? 1 : 0);
