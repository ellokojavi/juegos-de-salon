// The conformance suite's browser half (#1249 step 8): the same checks for every game, driven by its
// game.json. The node half is public/assets/js/conformance.test.mjs.
//
//   node tools/e2e/conformance.mjs [<output-folder>] <folder>…   # hangman, liars-dice, labs/julep…
//   node tools/e2e/conformance.mjs [<output-folder>] --part <name>  # one game, by its folder's last segment (CI)
//   node tools/e2e/conformance.mjs [<output-folder>]               # every game with a game.json
//
// Per game: load (the page opens with no console errors), languages (each of `languages` renders
// with every data-i18n key found), back (the header ‹ goes to its logical parent: the home page for
// a registered game, /labs/ for a lab one), resume (C-6: a started game offers to continue after a
// reload), share (the page loads compartir.js, C-7) and result (the exits come from fin.js, C-19).
// A check is skipped by an exception to its canon whose reason names what it checks, printed.
import { output, isFolder } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { manifestFolders, readManifest } from '../generators/manifests.mjs';
import { excuses } from '../generators/conformance.mjs';
import { gameById } from '../../public/assets/js/games.js';

const SITE = process.env.SITE || 'http://localhost:8765';
const args = process.argv.slice(2);
const OUT = output('/tmp/conformance', isFolder(args[0]) && !manifestFolders().includes(args[0]) ? process.argv : [...process.argv.slice(0, 2), '-']);
const all = manifestFolders();
const part = args.includes('--part') ? args[args.indexOf('--part') + 1] : null;
const named = args.filter(a => all.includes(a));
const chosen = part ? all.filter(f => f.split('/').pop() === part) : named.length ? named : all;
if (part && !chosen.length) throw new Error(`--part ${part}: no game.json for it (${all.join(', ')})`);

/**
 * How to start a game so it saves something to resume. The default works for a game whose intro
 * lists `.mode` buttons and whose setup starts with its first main button; a game built otherwise
 * names its own steps here.
 */
const START = {
  default: [
    `(document.querySelector('.mode[data-mode=solo]')||document.querySelector('.mode[data-mode=cpu]')||document.querySelector('.mode[data-mode=local]')||document.querySelector('.mode')).click()`,
    `[...document.querySelectorAll('.screen.active input[type=text], .screen.active input:not([type])')].forEach((i,k)=>{if(!i.value){i.value='Ana'+k;i.dispatchEvent(new Event('input',{bubbles:true}))}})`,
    `[...document.querySelectorAll('#setup-actions .btn, .screen.active .btn')].filter(x=>!x.disabled&&!x.classList.contains('btn--ghost'))[0].click()`,
  ],
  'labs/fourth-king': [
    `document.getElementById('btn-go-setup').click()`,
    `[...document.querySelectorAll('#players-form input')].forEach((i,k)=>{i.value=['Ana','Bea','Caro','Dani'][k]||'X'+k;i.dispatchEvent(new Event('input',{bubbles:true}))})`,
    `document.getElementById('btn-start').click()`,
    `document.getElementById('card').click()`,
  ],
  // A level is the whole setup: tapping it opens the board, which is already saved
  'labs/sudoku': [`document.getElementById('btn-level-easy').click()`],
};

const b = await launch({ port: 0, dir: `${OUT}/p`, out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

for (const folder of chosen) {
  const m = readManifest(folder);
  const url = `${SITE}/${folder}/`;
  // Skipped only by an exception to that canon whose reason names the check's subject (conformance.mjs's rule)
  const skip = (canon, subject) => { const e = excuses(m, canon, subject); if (e) console.log(`– ${folder} · ${canon} skipped: ${e.why}`); return !!e; };
  const fresh = async (lang = 'es') => {
    await b.open(url, 1500);
    await b.evaluate(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); 1`);
    await b.open(url, 2000);
  };

  // load
  const e0 = b.errors.length, l0 = b.logs.length;
  await fresh();
  const errs = b.errors.slice(e0), logs = b.logs.slice(l0).filter(l => /error|failed|uncaught/i.test(l));
  ok(!errs.length && !logs.length, `${folder} · load: no console errors${errs.length || logs.length ? ': ' + [...errs, ...logs][0].slice(0, 160) : ''}`);
  ok(await b.evaluate(`!!document.querySelector('.screen.active')`), `${folder} · load: a screen is showing`);
  await b.shot(`${folder.replace('/', '-')}-intro`);

  // share and result: the page goes through the shared modules
  const loaded = await b.evaluate(`JSON.stringify(performance.getEntriesByType('resource').map(r => new URL(r.name).pathname))`).then(JSON.parse);
  if (!skip('C-7', 'compartir.js')) ok(loaded.includes('/assets/js/compartir.js'), `${folder} · share: the page loads compartir.js (C-7)`);
  if (!skip('C-19', 'fin.js')) {
    ok(loaded.includes('/assets/js/fin.js'), `${folder} · result: the page loads fin.js (C-19)`);
    const exits = await b.evaluate(`import('/assets/js/fin.js').then(f => { const n = f.salidasFin('suelto', { lang: 'es' }); return n && n.querySelectorAll ? n.querySelectorAll('a,button').length : -1; })`);
    ok(exits > 0, `${folder} · result: fin.js builds the exits of a game played on its own (${exits})`);
  }

  // languages
  for (const lang of m.languages) {
    await fresh(lang);
    const r = JSON.parse(await b.evaluate(`(async () => {
      const { LOCALES } = await import('/${folder}/rules.js');
      const { COMMON } = await import('/assets/js/i18n.js');
      // A game's static texts are LOCALES[lang] itself or its .ui (Dudo), plus the shared COMMON
      const dicts = [LOCALES['${lang}'], LOCALES['${lang}']?.ui, COMMON['${lang}']].filter(Boolean);
      const has = k => dicts.some(d => k in d);
      const missing = [...document.querySelectorAll('[data-i18n]')].map(e => e.dataset.i18n).filter(k => !has(k));
      const text = document.body.innerText;
      return JSON.stringify({ lang: document.documentElement.lang, missing: [...new Set(missing)], broken: text.match(/\\bundefined\\b|\\bNaN\\b|\\{[a-zA-Z]\\w*\\}/g) });
    })()`));
    ok(r.lang === lang && !r.missing.length && !r.broken, `${folder} · ${lang}: renders in ${lang} with every key${r.lang !== lang ? ` (the page says ${r.lang})` : ''}${r.missing.length ? `, missing ${r.missing.slice(0, 4).join(', ')}` : ''}${r.broken ? `, half-built ${r.broken[0]}` : ''}`);
  }

  // back: a registered game goes home, a lab one to /labs/
  await fresh();
  const parent = gameById(m.id) ? '/' : '/labs/';
  const href = await b.evaluate(`document.querySelector('a.back') ? new URL(document.querySelector('a.back').getAttribute('href'), location.href).pathname : null`);
  ok(href === parent, `${folder} · back: the header ‹ goes to ${parent}${href === parent ? '' : ` (it goes to ${href})`}`);
  if (href) {
    await b.evaluate(`document.querySelector('a.back').click(); 1`); await sleep(1200);
    const at = await b.evaluate(`location.pathname`);
    ok(at === parent, `${folder} · back: tapping it lands on ${parent}${at === parent ? '' : ` (on ${at})`}`);
  }

  // resume (C-6)
  if (!skip('C-6', 'session.js')) {
    await fresh();
    for (const step of START[folder] || START.default) {
      try { await b.evaluate(`(() => { ${step}; return 1 })()`); } catch (e) { ok(false, `${folder} · resume: a start step failed (${e.message.split('\n')[0]})`); break; }
      await b.settle(900);
    }
    await sleep(600);
    const saved = await b.evaluate(`(() => { try { const d = JSON.parse(localStorage.getItem('${m.memory}')); return d ? (d.done ? 'done' : 'saved') : 'none'; } catch (_) { return 'bad'; } })()`);
    ok(saved === 'saved', `${folder} · resume: a started game is saved under ${m.memory} (${saved})`);
    await b.open(url, 2000);
    ok(await b.until(`document.querySelector('#resume-slot .btn')`, 2500), `${folder} · resume: after a reload the intro offers to continue`);
    await b.shot(`${folder.replace('/', '-')}-resume`);
  }
}
b.close();
console.log(failures ? `✗ conformance: ${failures} check(s) in red` : `conformance: ${chosen.join(', ')} conform`);
process.exit(failures ? 1 : 0);
