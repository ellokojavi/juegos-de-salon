// La Copa in each offered language other than Spanish (D-170, D-199): personal things in the
// viewer's language, group things in the cup's. Creates a cup with the test store (`?test`)
// in each language, checks that it saves its words' language, that the invitation warns if the
// words are in another language and that what is shared comes out in the cup's; then it opens the
// standalone games. The expected texts come from the dictionaries: a new language joins on its own.
//
// Usage: python3 -m http.server 8765 (in another terminal) and node tools/e2e/cup/languages.mjs <output-folder>
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { checkLanguages } from '../languages-common.mjs';
import { mkdirSync } from 'node:fs';
import { LANGS, COMMON } from '../../../public/assets/js/i18n.js';
import { SUELTOS } from '../../../public/assets/js/games.js';
import { LOCALES } from '../../../public/cup/rules.js';

const OUT = output('/tmp/cup-languages');
mkdirSync(OUT, { recursive: true });
const b = await launch({ port: Number(process.env.CDP_PORT) || 9378, dir: `${OUT}/profile`, out: OUT });
const SITE = process.env.SITE || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const screenText = () => ev(`document.querySelector('.screen.active').innerText`);
const prepare = () => ev(`(()=>{window.confirm=()=>true;window.__shared=[];navigator.share=async d=>{window.__shared.push(d)};navigator.canShare=()=>true;return 1})()`);
/** C-8: no horizontal scroll and no buttons under 44 px (on boards, the cells don't count). */
const check = async (name, { buttons = true } = {}) => {
  const r = await ev(`(()=>{const wide=document.documentElement.scrollWidth>innerWidth;const small=[...document.querySelectorAll('.screen.active button, .screen.active a.btn')].filter(x=>{const q=x.getBoundingClientRect();return q.width&&q.height&&q.height<43.5&&!x.closest('.sol-grid')}).map(x=>x.textContent.trim().slice(0,20));return {wide,small}})()`);
  ok(!r.wide, `${name}: no horizontal scroll`);
  if (buttons) ok(!r.small.length, `${name}: buttons of 44 px or more ${r.small.length ? JSON.stringify(r.small) : ''}`);
  await b.shot(name);
};

const OTHERS = LANGS.filter(l => l !== 'es');
const noEmoji = t => t.replace(/^\P{L}+/u, '').trim();
const has = (text, sought) => text.toLowerCase().includes(sought.toLowerCase());

for (const [i, lang] of OTHERS.entries()) {
  const T = LOCALES[lang];
  // A new cup, created with the screen in `lang`: its words start in that language
  // No fixed pauses (D-307): each wait ends when met, with the old pause as its cap
  await b.open(`${SITE}/cup/?test&lang=${lang}`, 1800);
  await ev(`sessionStorage.clear(); 1`);
  await b.open(`${SITE}/cup/?test`, 1800);
  // With several Chromes at once (or a runner's first one) the home page takes longer than the fixed wait
  for (let k = 0; k < 40 && !(await ev(`!!document.getElementById('btn-crear')?.offsetParent && document.documentElement.lang === '${lang}'`)); k++) await sleep(250);
  ok(await ev(`document.documentElement.lang`) === lang, `${lang}: the page stays in the language the link asked for`);
  const home = await screenText();
  ok(has(home, noEmoji(T.create)), `${lang}: the home page is translated (${noEmoji(T.create)})`);
  await check(`${lang}-00-home`);
  await ev(`document.getElementById('btn-crear').click(); 1`); await b.until(`document.querySelectorAll('#crear-body input').length >= 4`, 800); await b.settle(800);
  await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)')];i[0].value='Copa ${lang}';i[1].value='Ana';i[2].value='1111';i[3].value='1111';return 1})()`);
  await ev(`(()=>{const o=[...document.querySelectorAll('#crear-body .opcion')];o[1].click();o[3].click();return 1})()`);
  const pickedLanguage = await ev(`[...document.querySelectorAll('#crear-body .opcion.on')].map(x=>x.textContent).join('|')`);
  ok(has(pickedLanguage, T.langNames[lang]), `${lang}: the words' language starts as the creator's (${pickedLanguage})`);
  await check(`${lang}-01-create`);
  await ev(`document.getElementById('btn-crear-go').click(); 1`); await b.until(`__copa.estado.copa?.meta`, 1500); await b.settle(1500);
  const meta = await ev(`__copa.estado.copa.meta`);
  ok(meta?.lang === lang, `${lang}: the cup saves meta.lang = ${meta?.lang}`);
  await check(`${lang}-02-admin`);

  // What goes to the group, in the cup's language even if the sharer views it in another (D-170)
  await prepare();
  // The viewer uses another language: the next one in the list
  const other = OTHERS[(i + 1) % OTHERS.length];
  await ev(`localStorage.setItem('juegos-de-salon:lang','${other}'); 1`);
  await b.open(`${SITE}/cup/?test&${meta ? (await ev('__copa.estado.code')) : ''}`, 2500);
  await prepare();
  const inOther = await screenText();
  ok(has(inOther, LOCALES[other].tableTitle) || has(inOther, LOCALES[other].calendarTitle), `${lang}: the screen follows the viewer's language (${other})`);
  await ev(`(()=>{const b=document.getElementById('btn-invitar')||[...document.querySelectorAll('button')].find(x=>/📤/.test(x.textContent));b&&b.click();return 1})()`); await b.until(`window.__shared.length`, 800);
  const shared = await ev(`JSON.stringify(window.__shared.at(-1)||null)`);
  ok(shared && (shared.includes(T.title) || shared.includes(T.ctxInvite)), `${lang}: what is shared goes in the cup's language`);
  ok(shared && shared.includes(`lang=${lang}`), `${lang}: the shared link carries ?lang=${lang}`);
  await b.shot(`${lang}-03-board-in-${other}`);
  await ev(`localStorage.setItem('juegos-de-salon:lang','${lang}'); 1`);
}

// The standalone games, in the player's language, in every language. The id is the usual one
// ('letras'); the folder, in English ('word'): D-192. All their screens in every language are
// walked by cup-games/languages.mjs; here, what depends on each language's content.
const STANDALONE = Object.fromEntries(SUELTOS.map(m => [m.id, m]));
for (const id of ['letras', 'agentes', 'conexiones', 'anio', 'reinas', 'donde']) for (const lang of OTHERS) {
  await b.open(`${SITE}/${STANDALONE[id].slug}/?test&lang=${lang}`, 2000);
  const t = await screenText();
  ok(has(t, STANDALONE[id].name[lang]), `${id} (${lang}): the lobby is translated (${STANDALONE[id].name[lang]})`);
  ok(!t.includes(`🇪🇸 ${COMMON[lang].onlySpanish}`), `${id} (${lang}): without the "only in Spanish" pill`);
  await check(`${lang}-standalone-${id}-lobby`);
  // The 3-to-1 countdown (D-105) lasts what it lasts: wait for it to appear and go, not a fixed 4.8 s
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  await b.until(`document.getElementById('cuenta')`, 1500); await b.until(`!document.getElementById('cuenta')`, 4800); await b.settle(400);
  if (id === 'letras') ok(!(await ev(`[...document.querySelectorAll('.keypad button')].some(x=>x.textContent==='Ñ')`)), `letras (${lang}): the keyboard has no Ñ`);
  if (id === 'agentes') ok(await ev(`(async()=>{const m=await import('/cup/games/agents/engine.js');const words=new Set(m.mazoDe('${lang}').flatMap(x=>[...x.si,...x.casi]));const w=[...document.querySelectorAll('#ag-tablero .ag-carta')].map(x=>x.textContent.replace('💀 ',''));return w.length===15&&w.every(x=>words.has(x))})()`), `agentes (${lang}): the board is its language's deck`);
  if (id === 'conexiones') ok(await ev(`(async()=>{const m=await import('/cup/games/connections/grillas-${lang}.js');const w=[...document.querySelectorAll('#jugar-body button')].map(x=>x.textContent);return m.GRILLAS.some(g=>g.grupos.flatMap(x=>x.palabras).includes(w[0]))})()`), `conexiones (${lang}): the grid is one of its language's`);
  await check(`${lang}-standalone-${id}-game`, { buttons: false });
}

// The screens in paths.mjs in every language, against Spanish (D-199)
b.close();
await checkLanguages('copa', { dicts: [LOCALES], port: 9379, query: '?test', out: `${OUT}/screens` });

ok(!b.errors.length, `no errors in the console${b.errors.length ? ': ' + b.errors.join(' | ') : ''}`);
process.exit();
