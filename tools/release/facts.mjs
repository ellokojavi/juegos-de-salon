/**
 * The app's fact sheet: what the README claims, read from the real code.
 *
 *   node tools/release/facts.mjs            prints the JSON
 *
 * It makes nothing up and describes nothing: it only gathers the data the README tells
 * (games, modes, themes, languages, modules, tests, documents, screenshots) by importing
 * the real modules. The README's generated blocks come from here, and so does the
 * comparison `tools/release/readme.py check` makes to warn that a change left the text stale.
 *
 * Rule for what goes in here: a fact that, if it changes, forces a look at the README.
 * Help texts and taglines stay out on purpose: they change often and the README does not
 * quote them, and a tattletale that shouts about everything is one nobody looks at.
 *
 * The keys are the ones sealed in docs/facts.json: renaming one means migrating that file too.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { todayVersion } from './version.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = r => readFileSync(join(ROOT, r), 'utf8');
const exists = r => { try { statSync(join(ROOT, r)); return true; } catch { return false; } };

const IGNORE = new Set(['.git', '.claude', 'node_modules', 'arte-original']);
function files(dir = '', filter = () => true) {
  const out = [];
  // A newly added game has no screenshot folder yet: that is zero screenshots,
  // not a failure of the tool.
  if (!exists(dir)) return out;
  for (const name of readdirSync(join(ROOT, dir))) {
    if (name.startsWith('.') || IGNORE.has(name)) continue;
    const rel = dir ? `${dir}/${name}` : name;
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...files(rel, filter));
    else if (filter(rel)) out.push(rel);
  }
  return out.sort();
}

// ------------------------------------------------------------------ games

const { GAMES, SUELTOS } = await import(join(ROOT, 'public/assets/js/games.js'));
const { DECKS } = await import(join(ROOT, 'public/timeline/decks/index.js'));
const { LANGS, COMMON } = await import(join(ROOT, 'public/assets/js/i18n.js'));
const { FRASES } = await import(join(ROOT, 'public/assets/js/frases.js'));

/** The game's published status, according to the header of its spec. */
function status(g) {
  const path = `docs/games/${folder(g)}.md`;
  if (!exists(path)) return null;
  const header = read(path).split('\n').slice(0, 6).join(' ');
  const m = header.match(/\(v(\d+\.\d+)[^)]*\)/) || header.match(/\*\*Versi[oó]n:\*\*\s*(\d+\.\d+)/);
  return m ? `v${m[1]}` : null;
}

/** The game modes: the modeX keys that have their modeXHint next to them.
    They go in both languages because the README is in English and the games table comes from here (D-78). */
function modes(L, EN) {
  return Object.keys(L).filter(k => /^mode[A-Z]/.test(k) && L[k + 'Hint'] !== undefined)
    .map(k => ({ key: k, es: L[k], en: EN[k] || L[k] }));
}

/** A game's variants: modeX keys without their own hint (the deal in Timeline). */
function variants(L, EN) {
  return Object.keys(L).filter(k => /^mode[A-Z]/.test(k) && !k.endsWith('Hint') && L[k + 'Hint'] === undefined)
    .map(k => ({ key: k, es: L[k], en: EN[k] || L[k] }));
}

/** The game's folder, which is its URL and not its id (D-192): 'ahorcado' lives in public/hangman/. */
// A game in La Bodega lives in /labs/<slug>/, but its docs and screenshots keep their folder (D-420)
const folder = g => g.slug || g.path.replace(/\/$/, '');

const games = [];
for (const g of GAMES) {
  const { LOCALES } = await import(join(ROOT, 'public', g.path, 'rules.js'));
  // There are two ways to write a rules.js: loose texts (Hangman) or inside `ui`
  // (Fourth King, Dudo). Both are looked at, or those games' modes are not seen from here.
  const es = { ...LOCALES.es, ...(LOCALES.es.ui || {}) };
  const EN = LOCALES.en || LOCALES.es; // The Cup is Spanish only for now (D-98)
  const en = { ...EN, ...(EN.ui || {}) };
  const html = read(`public/${g.path}index.html`);
  games.push({
    id: g.id,
    emoji: g.emoji,
    name: g.name,
    players: g.players.replace('–', ' to '),   // "1 to 6": read by the README table, which is in English
    duration: g.duration,
    available: g.available,
    labs: !!g.labs,
    status: status(g),
    modes: g.formato ? [{ key: 'formato', es: g.formato.es, en: g.formato.en }] : modes(es, en),
    variants: variants(es, en),
    screens: [...html.matchAll(/id="screen-([a-z-]+)"/g)].map(m => m[1]),
    chat: /id="chat"/.test(html),
    files: files(`public/${folder(g)}`, r => !r.endsWith('.test.mjs')),
  });
}

// The Cup's games played standalone from the home page (D-142): they go in the README's games
// table, apart, because they have no rules.js nor modes.
const standalone = SUELTOS.map(m => ({
  id: m.id, emoji: m.emoji, name: m.name, kinds: m.tipos, duration: m.duration, labs: !!m.labs, path: m.path,
}));

// ------------------------------------------------------------- the shared parts

const years = cards => [Math.min(...cards.map(c => c.year)), Math.max(...cards.map(c => c.year))];
const themes = DECKS.map(d => ({
  id: d.id, emoji: d.emoji, name: d.name, hint: d.hint, cards: d.cards.length, from: years(d.cards)[0], to: years(d.cards)[1],
}));

// They all go into the import map on their own (set-version.py, D-192): no more "unversioned" to watch
const modules = files('public', r => r.endsWith('.js'));
const tests = files('', r => r.endsWith('.test.mjs'));
const e2e = files('tools/e2e', r => r.endsWith('.mjs') && !r.endsWith('cdp.mjs')).map(r => r.replace('tools/e2e/', ''));

// The title is the document's H1, without the emoji it ends with.
const title = path => (read(path).match(/^#\s+(.+)$/m) || [, path])[1]
  .replace(/[\p{Extended_Pictographic}\uFE0F\s]+$/u, '').trim();
const documents = [
  // Each decision is its own file (D-394): the index, docs/DECISIONS.md, stands for them all
  ...files('docs', r => r.endsWith('.md') && !r.startsWith('docs/decisions/')),
  'firebase/README.md', 'tools/e2e/README.md', 'CHANGELOG.md',
].filter(exists).map(path => ({ path, title: title(path) }));

const screenshots = Object.fromEntries(GAMES.map(g => [g.id, files(`docs/screenshots/${folder(g)}`, r => r.endsWith('.png')).length]));

console.log(JSON.stringify({
  version: todayVersion(),
  app: Object.fromEntries(LANGS.map(l => [l, COMMON[l].appTitle])),
  languages: LANGS,
  phrases: Object.fromEntries(LANGS.map(l => [l, FRASES[l].length])),
  commonKeys: Object.keys(COMMON.es).length,
  games,
  standalone,
  themes,
  modules,
  tests,
  e2e,
  documents,
  screenshots,
}, null, 2));
