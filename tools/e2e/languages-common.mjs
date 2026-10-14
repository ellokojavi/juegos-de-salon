/**
 * A game in every language offered (D-199). It is not a script: the `<game>/languages.mjs` call
 * it, one per game, so GitHub runs them in parallel and says which one failed.
 *
 * Goes through each screen in `paths.mjs` in each language of `LANGS` —today es, en, pt and de; a
 * new one gets in on its own— and compares it with Spanish, which is the one written first:
 *
 *   - the page is in that language (`<html lang>`) and reaches the same screen as in Spanish;
 *   - no half-built text shows up: undefined, NaN, [object …] or an unreplaced {placeholder};
 *   - nothing is left in Spanish: no text from the dictionaries (the game's and COMMON) that
 *     says something else in that language, and no long line identical to the one on the
 *     Spanish screen, which is how a text written by hand outside the dictionaries gives itself away;
 *   - the language doesn't break the screen (C-8): a longer text —German is— can't bring
 *     horizontal scroll, buttons under 44 px or buttons overflowing at the bottom that the
 *     Spanish one doesn't have.
 *
 * What is already wrong in Spanish is counted by the game's scripts; here only what changes with
 * the language is checked. Each shot is kept as a screenshot: `<screen>-<lang>.png`.
 *
 */
import { output as outputFolder } from './output.mjs';
import { mkdirSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
import { LANGS, EN_LABS, LABS_KEY, COMMON } from '../../public/assets/js/i18n.js';
import { gameById } from '../../public/assets/js/games.js';
import { PATHS } from './paths.mjs';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const MIN_LENGTH = 12;   // a shorter fragment ("Menú", "Listo") can repeat by chance

/** The text leaves of a dictionary, with their path: [['intro.title', 'Hola'], …]. */
const leaves = (o, path = '') => typeof o === 'string' ? [[path, o]]
  : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k)) : [];

/**
 * The Spanish chunks that shouldn't show in `lang`: from each text that says something else in
 * that language, its pieces between placeholders, tags and line breaks, without the very short ones.
 */
export function spanishChunks(dicts, lang) {
  const chunks = new Set();
  for (const d of dicts) {
    const other = new Map(leaves(d[lang]));
    for (const [path, es] of leaves(d.es)) {
      if (other.get(path) === es) continue;   // the same in both languages ("Tango", "OK")
      for (const t of es.split(/\{[^}]*\}|<[^>]*>|\n|\*/)) {
        const clean = t.trim();
        if (clean.length >= MIN_LENGTH) chunks.add(clean);
      }
    }
  }
  // A chunk that is also text of the other language gives nothing away ("Toque y Fama" in pt)
  const ofOther = dicts.flatMap(d => leaves(d[lang]).map(([, v]) => v)).join('\n');
  return [...chunks].filter(t => !ofOther.includes(t));
}

const MEASURE = `(()=>{
  const visible = x => x.offsetParent !== null && x.getBoundingClientRect().height > 0;
  const name = x => (x.textContent || x.className).trim().replace(/\\s+/g, ' ').slice(0, 24);
  const active = document.querySelector('.screen.active');
  return {
    lang: document.documentElement.lang,
    screen: active?.id || '',
    text: document.body.innerText,
    scroll: document.documentElement.scrollWidth > innerWidth,
    small: [...new Set([...document.querySelectorAll('.screen.active button, .confirm button')]
      .filter(x => visible(x) && x.getBoundingClientRect().height < 43.5).map(name))],
    // What only looks like a button (aria-hidden, like the "Entrar" of the D-249 card) doesn't count
    outside: [...new Set([...document.querySelectorAll('.screen.active .btn:not([aria-hidden="true"]), .confirm .btn')]
      .filter(x => visible(x) && x.getBoundingClientRect().bottom > innerHeight + 1).map(name))],
  };
})()`;

/**
 * Goes through `game` (its id) in every language.
 * @param {object} op
 * @param {object[]} op.dicts     the game's dictionaries ({ es, en, pt, de }); COMMON is added on its own
 * @param {number}   op.port      the Chrome's name; the real port is chosen by cdp.mjs (D-213)
 * @param {string[]} [op.screens] which ones; by default, all in its path
 * @param {string[]} [op.allowed] Spanish chunks that may show (content, not interface)
 * @param {string}   [op.query]   what goes after the folder ('?test' in La Copa)
 * @param {string}   [op.out]     where to leave the screenshots; by default, the script's folder
 * @returns {Promise<number>} how many checks came out red
 */
export async function checkLanguages(game, { dicts = [], port, screens, allowed = [], width = 390, height = 844, out, query }) {
  const OUT = out || outputFolder(`/tmp/languages-${game}`);
  mkdirSync(OUT, { recursive: true });
  const paths = PATHS[game];
  if (!paths) throw new Error(`No paths for "${game}" in paths.mjs`);
  const route = (gameById(game)?.path || `${game}/`) + (query ?? '');
  const shots = screens || Object.keys(paths);
  const all = [...dicts, COMMON];
  const chunks = Object.fromEntries(LANGS.filter(l => l !== 'es')
    .map(l => [l, spanishChunks(all, l).filter(t => !allowed.includes(t))]));

  // What the language says the same as Spanish on purpose ("Tango", a proper name)
  const ofLang = Object.fromEntries(LANGS.map(l => [l, all.flatMap(d => leaves(d[l]).map(([, v]) => v)).join('\n')]));
  // And its templates already filled in ("Entrar como {name}" comes out "ENTRAR COMO JAVI" on a button)
  const escape = t => t.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  const templates = Object.fromEntries(LANGS.map(l => [l, all.flatMap(d => leaves(d[l]).map(([, v]) => v))
    .filter(v => typeof v === 'string' && /\{\w+\}/.test(v) && (v.replace(/\{\w+\}/g, '').match(/\p{L}{3,}/gu) || []).length >= 2)
    .map(v => new RegExp(`^${escape(v).replace(/\\?\{\w+\\?\}/g, '.+')}$`, 'iu'))]));
  const isOfLang = (lang, l) => ofLang[lang].includes(l) || templates[lang].some(re => re.test(l));

  const b = await launch({ port, dir: `${OUT}/profile`, out: OUT, width, height });
  let failures = 0;
  const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
  console.log(`${game}: ${shots.length} screens × ${LANGS.join(', ')}`);

  for (const shot of shots) {
    let es = null;
    for (const lang of ['es', ...LANGS.filter(l => l !== 'es')]) {
      // No fixed pauses (D-307): each wait ends when the page loaded and stopped changing, with
      // the cap that used to be the whole pause (800, 1500 and 700 ms)
      await b.open(`${SITE}/${route}`, 800);
      const labs = EN_LABS.includes(lang) ? `localStorage.setItem('${LABS_KEY}', '${lang}');` : '';
      await b.evaluate(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); ${labs} 1`);
      await b.open(`${SITE}/${route}`, 1500);
      const before = b.errors.length;
      for (const step of paths[shot]) {
        try { await b.evaluate(`(()=>{ ${step} ; return 1})()`); }
        catch (e) { ok(false, `${shot} · ${lang}: a step of the path failed (${e.message.split('\n')[0]})`); }
        // A `1` step is a deliberate wait (paths.mjs): let the confetti pass, let the phone play.
        // That one stays at 700 ms; the others end when the screen stands still
        if (String(step).trim() === '1') await sleep(700); else await b.settle(700);
      }
      await b.settle(500);
      const m = await b.evaluate(MEASURE);
      await b.shot(`${shot}-${lang}`);
      const fresh = b.errors.slice(before);
      ok(!fresh.length, `${shot} · ${lang}: no console errors${fresh.length ? ': ' + fresh[0].slice(0, 160) : ''}`);
      ok(m.lang === lang, `${shot} · ${lang}: the page is in ${lang}${m.lang === lang ? '' : ` (it says ${m.lang})`}`);
      const broken = m.text.match(/\bundefined\b|\bNaN\b|\[object \w+\]|\{[a-zA-Z]\w*\}/g);
      ok(!broken, `${shot} · ${lang}: no half-built texts${broken ? ': ' + [...new Set(broken)].join(', ') : ''}`);
      if (lang === 'es') { es = m; continue; }

      ok(m.screen === es.screen, `${shot} · ${lang}: reaches the same screen as in Spanish (${m.screen || '—'})`);
      const inSpanish = chunks[lang].filter(t => m.text.includes(t));
      ok(!inSpanish.length, `${shot} · ${lang}: nothing left in Spanish${inSpanish.length ? ': ' + inSpanish.slice(0, 3).map(t => JSON.stringify(t)).join(', ') : ''}`);
      // Written by hand: a line with words that comes out the same as in Spanish
      const esLines = new Set(es.text.split('\n').map(l => l.trim()));
      const same = m.text.split('\n').map(l => l.trim())
        .filter(l => l.length >= MIN_LENGTH && (l.match(/\p{L}{3,}/gu) || []).length >= 3 && esLines.has(l))
        .filter(l => !isOfLang(lang, l) && !allowed.some(p => l.includes(p)));
      ok(!same.length, `${shot} · ${lang}: no line identical to the Spanish one${same.length ? ': ' + same.slice(0, 3).map(t => JSON.stringify(t)).join(', ') : ''}`);
      ok(!m.scroll || es.scroll, `${shot} · ${lang}: no horizontal scroll (C-8)`);
      const small = m.small.length - es.small.length;
      ok(small <= 0, `${shot} · ${lang}: no more buttons under 44 px than in Spanish${small > 0 ? ': ' + m.small.join(', ') : ''}`);
      const outside = m.outside.length - es.outside.length;
      ok(outside <= 0, `${shot} · ${lang}: no more buttons overflowing at the bottom${outside > 0 ? ': ' + m.outside.join(', ') : ''}`);
    }
  }
  console.log(failures ? `\n✗ ${game}: ${failures} check(s) red · screenshots in ${OUT}` : `\n${game}: all good in ${LANGS.join(', ')} · screenshots in ${OUT}`);
  b.close();
  if (failures) process.exitCode = 1;
  return failures;
}
