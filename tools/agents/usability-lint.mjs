/**
 * The measurable usability rules as a check (D-520, #1086): what a program can tell, a program tells,
 * and the usability agent spends its review on what needs judgment (docs/USABILIDAD.md marks each
 * U-n 🤖 checked or 👁 judged).
 *
 *   node tools/agents/usability-lint.mjs          (lists every hit; exits 1 on one not allowlisted)
 *   node tools/agents/usability-lint.mjs --all    (also shows the allowlisted ones)
 *
 * It reads the player's texts in es/en/pt: the exported text tables (i18n.js, games.js, each game's
 * rules.js or texts.js, La Copa's rules, the privacy page, the splash CAMPAIGNS…) and the `T` object
 * of the lab games (one language, the lab's, D-191). A function among the texts is read by its string
 * literals, which is where a hard-coded plural hides.
 *
 * The rules:
 *   U-2   an emoji mid-sentence (a word before it and after it on the same line).
 *   U-4   an article before a proper name ("la Copa:", "la {cup name}").
 *   U-5   a banned synonym of a settled term (docs/usability-glossary.json).
 *   U-6   a hard-coded plural right after a count placeholder ("${n} jugadores", "{n} pistas").
 *   U-17  a button label longer than what fits in one line at 320 px (BUDGET per language).
 *   U-18  "How to play" of the lab and menu games: up to 3 steps and 280 characters (La Copa's are
 *         in public/cup/games/juegos.test.mjs).
 *
 * Every exception is in docs/usability-allowlist.json with its reason: none is silent. An entry whose
 * text no longer hits is reported as stale, so the list does not rot.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { coverOf, resolvedSteps } from './covers.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LANGS = ['es', 'en', 'pt'];

/** The exported text tables: modules that import without a page. */
const MODULES = [
  'public/assets/js/i18n.js', 'public/assets/js/games.js', 'public/assets/js/splash.js',
  'public/assets/js/azar.js', 'public/assets/js/how-to-play-facts.js', 'public/assets/js/month-end.js',
  'public/assets/js/recap.js', 'public/assets/js/search.js', 'public/assets/js/support.js',
  'public/privacy/texts.js', 'public/cup/rules.js',
];

/** Every module the lint reads: the fixed ones, each game's rules.js and La Copa's games' texts.js. */
export function sources() {
  const ls = execFileSync('git', ['ls-files', 'public/*rules.js', 'public/*texts.js', 'public/labs/*/game.js'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(f => f && !f.includes('.test.'));
  const modules = [...new Set([...MODULES, ...ls.filter(f => !f.endsWith('game.js'))])];
  const labs = ls.filter(f => f.endsWith('game.js') && /^const T = \{/m.test(readFileSync(join(ROOT, f), 'utf8')));
  return { modules, labs };
}

/** The `const T = {…}` literal of a lab game.js, evaluated with its engine's constants (or the names left as they are). */
export function labTexts(source, constants = {}) {
  const i = source.search(/^const T = \{/m);
  if (i < 0) return null;
  let depth = 0, j = source.indexOf('{', i), quote = null;
  for (let k = j; k < source.length; k++) {
    const c = source[k];
    if (quote) { if (c === '\\') k++; else if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { j = [j, k + 1]; break; }
  }
  const literal = source.slice(j[0], j[1]);
  const scope = new Proxy({ ...constants }, { has: (_, k) => k !== 'undefined', get: (t, k) => (k in t ? t[k] : k === Symbol.unscopables ? undefined : `{${String(k)}}`) });
  try { return new Function('scope', `with (scope) { return (${literal}); }`)(scope); } catch { return null; }
}

/** The string literals in a function's source, with `${…}` left as written. */
export function literalsOf(fn) {
  return [...String(fn).matchAll(/'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`|"((?:[^"\\]|\\.)*)"/g)].map(m => m[1] ?? m[2] ?? m[3]).filter(s => /\p{L}{2}/u.test(s));
}

/** Every text leaf under a value: { path, lang, text }, the language taken from the nearest es/en/pt key. */
export function walk(value, path = '', lang = null, out = [], seen = new Set()) {
  if (typeof value === 'string') { if (/\p{L}{2}/u.test(value)) out.push({ path, lang, text: value }); return out; }
  if (typeof value === 'function') { literalsOf(value).forEach((text, k) => out.push({ path: `${path}()#${k}`, lang, text })); return out; }
  if (!value || typeof value !== 'object' || seen.has(value)) return out;
  seen.add(value);
  for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, LANGS.includes(k) ? k : lang, out, seen);
  return out;
}

/** All the player's texts: { file, path, lang, text }, lang null when the table has none (a lab game: one language). */
export async function collect() {
  const { modules, labs } = sources();
  const texts = [], seen = new Set();
  // A game's texts.js first: La Copa's rules.js re-exports them, and a text is reported once, where it is written
  for (const file of [...modules].sort((a, b) => b.endsWith('texts.js') - a.endsWith('texts.js'))) {
    let mod;
    try { mod = await import(pathToFileURL(join(ROOT, file))); } catch { continue; }
    for (const [name, v] of Object.entries(mod)) {
      for (const t of walk(v, name)) {
        const id = `${t.lang}|${t.path.split('.').pop()}|${t.text}`;
        if (t.lang && !seen.has(id)) { seen.add(id); texts.push({ file, ...t }); }
      }
    }
  }
  for (const file of labs) {
    const source = readFileSync(join(ROOT, file), 'utf8');
    const engine = join(ROOT, dirname(file), 'engine.js');
    let constants = {};
    if (existsSync(engine)) try { constants = { ...(await import(pathToFileURL(engine))) }; } catch { /* the names stay */ }
    const T = labTexts(source, constants);
    if (T) for (const t of walk(T, 'T')) texts.push({ file, ...t, lang: t.lang ?? 'lab' });
  }
  return texts;
}

// ---- The rules -------------------------------------------------------------------------------------

const EMOJI = /\p{Extended_Pictographic}/u;
const LETTER = /\p{L}/u;

/** U-2: an emoji with a word right before and a word right after it, on the same line. */
export function emojiMidSentence(text) {
  for (const line of text.split('\n')) {
    const clean = line.replace(/\$\{[^}]*\}|\{\w+\}/g, 'x');
    const chars = [...clean];
    for (let k = 0; k < chars.length; k++) {
      if (!EMOJI.test(chars[k])) continue;
      const before = chars.slice(0, k).join('').replace(/[\s️‍]+$/u, '');
      const after = chars.slice(k + 1).join('').replace(/^[\s️‍\p{Extended_Pictographic}\p{Emoji_Modifier}]+/u, '');
      // A word right before (not the end of a sentence, a colon or a bracket) and a word right after
      if (LETTER.test(before.slice(-1)) && LETTER.test(after[0] || '')) return chars[k];
    }
  }
  return null;
}

/** U-4: an article before a proper name. */
const ARTICLE = {
  es: /\b(la|el|del|al) (Copa:|\{(?:copa|nombreCopa|cup|cupName)\}|\$\{(?:copa|nombreCopa|cup|cupName)[^}]*\})/,
  en: /\bthe (Cup:|\{(?:copa|nombreCopa|cup|cupName)\}|\$\{(?:copa|nombreCopa|cup|cupName)[^}]*\})/,
  pt: /\b(a|o|da|do|na|no) (Copa:|\{(?:copa|nombreCopa|cup|cupName)\}|\$\{(?:copa|nombreCopa|cup|cupName)[^}]*\})/,
};
export function articleBeforeName(text, lang) {
  const re = ARTICLE[lang];
  const m = re && text.match(re);
  return m ? m[0] : null;
}

/** U-5: a banned synonym of a settled term (the glossary's `banned` per language). */
export function bannedSynonym(text, lang, glossary) {
  for (const [concept, entry] of Object.entries(glossary.terms)) {
    const banned = lang === 'lab' ? LANGS.flatMap(l => entry.banned?.[l] ?? []) : entry.banned?.[lang] ?? [];
    for (const word of banned) {
      if (new RegExp(`(^|[^\\p{L}])${word}(?![\\p{L}])`, 'iu').test(text)) return `${word} (→ ${entry.use?.[lang] ?? entry.use?.en ?? concept})`;
    }
  }
  return null;
}

/**
 * U-6: the number and the noun agree. What a table shows by itself: a hard-coded "1" before a
 * plural ("1 jugadores", "1 points"), and a singular slot (a key ending in One/Uno/Singular) that
 * carries a count placeholder before a plural. Whether the code picks the singular key for 1 is
 * the caller's, and stays judged (👁).
 */
const ONE_PLURAL = {
  es: /(?:^|[^\d.,])1 (?!de\b|vez\b|mes\b|país\b)(\p{Ll}{3,}s)\b/u,
  en: /(?:^|[^\d.,])1 (?!of\b|is\b|has\b|was\b|plus\b|minus\b)(\p{Ll}{3,}s)\b/u,
  pt: /(?:^|[^\d.,])1 (?!de\b|vez\b|mês\b|país\b)(\p{Ll}{3,}s)\b/u,
};
const COUNT_PLURAL = /(?:\{(?:n|count|total)\}|\$\{(?:n|count|total)\}) (\p{Ll}{3,}s)\b/u;
const NOT_PLURAL = /^(?:mes|país|gás|lápis|ônibus|virus|bus|plus|less|this|was|has|its|yes|gas|bonus|bônus|vs|dos|tres|seis|pois|depois|mais|menos|antes|después|lunes|martes|miércoles|jueves|viernes|atrás|através)$/;
export function hardPlural(text, lang, path = '') {
  const re = ONE_PLURAL[lang === 'lab' ? 'en' : lang];
  const m = re && text.match(re);
  if (m && !NOT_PLURAL.test(m[1]) && !/(ss|us|is)$/.test(m[1])) return m[0].trim();
  const c = /(One|Uno|Singular)$/.test(path) && text.match(COUNT_PLURAL);
  return c && !NOT_PLURAL.test(c[1]) ? `${c[0]} in a singular slot` : null;
}

/**
 * U-17: a button's label fits on one line at 320 px. A button is a text whose key is drawn by an
 * `el('button', …)` (or a `.btn` link) in a file of the same public/<folder>, or whose key says so
 * (`…Btn`, `boton`, `…Button`); measured without its emoji. BUDGET is calibrated on 2026-10-31: a
 * full-width button at 320 px holds about 28 characters of Nunito bold; the guide's "about 18" is the aim.
 */
export const BUDGET = { es: 28, en: 28, pt: 28, lab: 28 };
const BUTTON_KEY = /(^|\.)\w*(btn|button|boton)\w*$/i;
const top = f => f.split('/')[1];

/** The keys drawn as a button, by the folder that draws them: Map key → Set of public/<folder>. */
export function buttonKeys() {
  const files = execFileSync('git', ['ls-files', 'public/*.js'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => f && !f.includes('.test.'));
  const keys = new Map();
  for (const f of files) {
    const s = readFileSync(join(ROOT, f), 'utf8');
    for (const m of s.matchAll(/el\('(?:button|a)',\s*\{(?:[^{}]|\{[^{}]*\})*?\}\s*,\s*([^)]{0,120})/g)) {
      if (m[0].startsWith("el('a'") && !/class: '[^']*\bbtn\b/.test(m[0])) continue;
      for (const k of m[1].matchAll(/\b[A-Za-z]{1,3}\.([A-Za-z]\w*)(?![\w.(])/g)) {
        if (!keys.has(k[1])) keys.set(k[1], new Set());
        keys.get(k[1]).add(top(f));
      }
    }
  }
  return keys;
}
export function isButton(t, keys = new Map()) {
  if (/\(\)#/.test(t.path)) return false;
  if (BUTTON_KEY.test(t.path)) return true;
  return keys.get(t.path.split('.').pop())?.has(top(t.file)) ?? false;
}
export function labelLength(text) {
  return [...text.replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|[️‍]/gu, '').trim()].length;
}

/** U-18: the lab and menu games' "How to play" (La Copa's: juegos.test.mjs). */
export function stepsCheck(steps, constants = {}) {
  const { length } = resolvedSteps(steps, constants);
  return { count: steps.length, length, ok: steps.length <= 3 && length <= 280 };
}

/** Every hit: { rule, file, path, lang, text, found }. */
export async function lint({ texts, glossary = readJSON('docs/usability-glossary.json') } = {}) {
  texts ??= await collect();
  const hits = [];
  const add = (rule, t, found) => found && hits.push({ rule, file: t.file, path: t.path, lang: t.lang, text: t.text, found });
  const keys = buttonKeys();
  for (const t of texts) {
    const button = isButton(t, keys);
    add('U-2', t, button ? null : emojiMidSentence(t.text));
    add('U-4', t, articleBeforeName(t.text, t.lang));
    add('U-5', t, bannedSynonym(t.text, t.lang, glossary));
    add('U-6', t, hardPlural(t.text, t.lang, t.path));
    if (button) {
      const n = labelLength(t.text);
      add('U-17', t, n > BUDGET[t.lang] ? `${n} characters (budget ${BUDGET[t.lang]})` : null);
    }
  }
  hits.push(...await stepsHits());
  return hits;
}

/** U-18 over the lab games' `como` and the menu games' LOCALES[lang].como. */
async function stepsHits() {
  const hits = [];
  const { labs, modules } = sources();
  for (const file of labs) {
    const { steps } = coverOf(readFileSync(join(ROOT, file), 'utf8'));
    if (!steps.length) continue;
    const engine = join(ROOT, dirname(file), 'engine.js');
    let constants = {};
    if (existsSync(engine)) try { constants = { ...(await import(pathToFileURL(engine))) }; } catch { /* none */ }
    const r = stepsCheck(steps, constants);
    if (!r.ok) hits.push({ rule: 'U-18', file, path: 'T.como', lang: 'lab', text: steps.join(' '), found: `${r.count} steps, ${r.length} characters (up to 3 and 280)` });
  }
  for (const file of modules.filter(f => f.endsWith('rules.js') && !f.startsWith('public/cup/'))) {
    let mod;
    try { mod = await import(pathToFileURL(join(ROOT, file))); } catch { continue; }
    for (const lang of LANGS) {
      const como = mod.LOCALES?.[lang]?.como;
      if (!Array.isArray(como)) continue;
      const steps = como.map(s => (Array.isArray(s) ? s.join(' ') : String(s)));
      const length = steps.map(p => p.replace(/^\S+ /, '')).join(' ').length;
      if (steps.length > 3 || length > 280) hits.push({ rule: 'U-18', file, path: 'LOCALES.como', lang, text: steps.join(' '), found: `${steps.length} steps, ${length} characters (up to 3 and 280)` });
    }
  }
  return hits;
}

export function readJSON(rel) { return JSON.parse(readFileSync(join(ROOT, rel), 'utf8')); }

/** Splits the hits into those the allowlist covers (same rule, file, path and language) and the rest; and the stale entries. */
export function judge(hits, allowlist) {
  // `*` in file, path or lang stands for any run of characters (one entry for the three languages of a text)
  const glob = s => new RegExp(`^${String(s).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
  const entries = Object.entries(allowlist).filter(([rule]) => !rule.startsWith('_'))
    .flatMap(([rule, list]) => list.map(e => ({ rule, ...e, re: [glob(e.file), glob(e.path), glob(e.lang ?? '*')] })));
  const used = new Set();
  const failing = [], excused = [];
  for (const h of hits) {
    const e = entries.find(e => e.rule === h.rule && e.re[0].test(h.file) && e.re[1].test(h.path) && e.re[2].test(h.lang));
    if (e) { used.add(e); excused.push({ ...h, reason: e.reason }); } else failing.push(h);
  }
  const stale = entries.filter(e => !used.has(e)).map(e => ({ key: `${e.rule}|${e.file}|${e.path}|${e.lang ?? '*'}`, ...e }));
  const unreasoned = entries.filter(e => !e.reason || e.reason.length < 10);
  return { failing, excused, stale, unreasoned };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const all = process.argv.includes('--all');
  const { failing, excused, stale, unreasoned } = judge(await lint(), readJSON('docs/usability-allowlist.json'));
  const show = h => `  ${h.rule} ${h.file} ${h.path} [${h.lang}]: ${h.found}\n      «${h.text.slice(0, 140)}»`;
  if (all) for (const h of excused) console.log(`${show(h)}\n      allowlisted: ${h.reason}`);
  for (const h of failing) console.log(`✗${show(h)}`);
  for (const s of stale) console.log(`✗ stale allowlist entry (no longer hits, remove it): ${s.key}`);
  for (const s of unreasoned) console.log(`✗ allowlist entry without a reason: ${s.file} ${s.path}`);
  const bad = failing.length + stale.length + unreasoned.length;
  console.log(bad ? `\n${bad} usability problem(s): fix the text in es/en/pt, or allowlist it with a reason in docs/usability-allowlist.json` : `✓ usability lint: ${excused.length} allowlisted, nothing else`);
  process.exit(bad ? 1 : 0);
}
