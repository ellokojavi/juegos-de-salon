// Which end-to-end scripts does a PR need? (D-329) Only those whose pages load something the PR
// changed. The site has no build: every page is an index.html that links its CSS and scripts, and
// the scripts import each other with plain ES `import`s, so the graph can be read straight from the
// files. A change reaches a page if the page's closure (its HTML, what it links, what that imports)
// contains the changed file.
//
// When in doubt, everything runs (and scope-guard.test.mjs fails the PR that creates the doubt, D-391):
//   - a file in public/ that no page's closure contains (an image fetched at run time, a JSON);
//   - anything outside public/ that changes.mjs doesn't already skip and a script may depend on
//     (tools/e2e/'s shared code, the e2e workflow, a tool a script imports, a file at the root);
//   - a script whose pages can't be read from its source (it builds its routes in a loop), or that
//     builds its routes without naming them: it runs whenever any page is affected.
// A changed script always runs itself.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../..');
const PUBLIC = join(ROOT, 'public');
// The lab's pages, its own index (`labs`) among them (D-391)
const isLab = p => p === 'labs' || p.startsWith('labs/');

/* ------------------------------------------------------------------ */
/* Pure: the references in a file, and the closures                  */
/* ------------------------------------------------------------------ */

/** The local paths a file refers to, resolved against its own folder (posix, from public/). */
export function references(path, text) {
  const dir = posix.dirname(path);
  const found = [];
  const add = ref => {
    const r = ref.split(/[?#]/)[0];
    if (!r || /^(?:[a-z]+:|\/\/|#|data:|mailto:)/i.test(r) || r.includes('${')) return;
    found.push(r.startsWith('/') ? r.slice(1) : posix.normalize(posix.join(dir, r)));
  };
  if (path.endsWith('.html')) {
    for (const m of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) add(m[1]);
    // Inline modules import too
    for (const m of text.matchAll(/\bimport\s*(?:[^'"()]*?\bfrom\s*)?["']([^"']+)["']/g)) add(m[1]);
    // And load modules on demand (`import('./labs/home/search.js')`, D-391)
    for (const m of text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) add(m[1]);
  } else if (path.endsWith('.js') || path.endsWith('.mjs')) {
    for (const m of text.matchAll(/\b(?:import|export)\s*(?:[^'"();]*?\bfrom\s*)?["']([^"']+)["']/g)) add(m[1]);
    for (const m of text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) add(m[1]);
  } else if (path.endsWith('.css')) {
    for (const m of text.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s]+)/g)) add(m[1]);
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) add(m[1]);
  }
  // A folder link is its index.html
  return found.map(f => (f.endsWith('/') || f === '.' ? posix.join(f, 'index.html') : f));
}

/**
 * The site's files a script builds a URL to at run time (`new URL('assets/css/splash.css', ROOT)`,
 * `register(new URL('sw.js', root))`, D-391): the first argument of `new URL`, when it is a real file, read from the script's own folder or from the
 * site's root, and the media it names by its path from the root. Only scripts: a page's HTML says what it loads in its tags.
 */
export function assetsNamed(path, text, files) {
  if (!/\.m?js$/.test(path)) return [];
  const dir = posix.dirname(path);
  const out = [];
  // Only `new URL('<file>', …)`: a bare name in a comment or a message is not a load
  for (const m of text.matchAll(/\bnew URL\(\s*["'`]((?:\.{0,2}\/)?[\w./-]+\.(?:m?js|css|html))["'`]/g)) {
    const ref = m[1].replace(/^\//, '');
    for (const f of [posix.normalize(posix.join(dir, ref)), posix.normalize(ref)]) if (files[f] != null && f !== path) { out.push(f); break; }
  }
  // And the media it names by path from the site's root (`img: 'assets/splash/bridges-teaser.gif'` in
  // splash.js): a changed clip or picture reaches the pages that load the script, not every page
  for (const m of text.matchAll(/["'`](assets\/[\w./-]+\.(?:gif|png|jpe?g|webp|svg|mp4|webm))["'`]/g)) out.push(posix.normalize(m[1]));
  // And a folder next to it that it fetches files from by name (`new URL('earth-2004-09/', import.meta.url)`,
  // the globe's images and its 128 tiles, D-460): kept with its slash, it reaches every file under it
  // (`loads`). Only against the script's own URL, and not a page: `new URL('../../today/', import.meta.url)`
  // is a link to one
  for (const m of text.matchAll(/\bnew URL\(\s*["'`]((?:\.{1,2}\/)*[\w-][\w.-]*(?:\/[\w.-]+)*\/)["'`]\s*,\s*import\.meta\.url\s*\)/g)) {
    const folder = posix.join(dir, m[1]);
    if (files[`${folder}index.html`] == null) out.push(folder);
  }
  return out;
}

/** Each page's closure: { 'hangman': Set(['hangman/index.html', 'assets/js/ui.js', …]) }. */
export function closures(files) {
  const pages = Object.keys(files).filter(f => f === 'index.html' || f.endsWith('/index.html'));
  const out = {};
  for (const page of pages) {
    const seen = new Set();
    const queue = [page];
    while (queue.length) {
      const f = queue.pop();
      if (seen.has(f)) continue;
      seen.add(f);
      // Other pages it links to are not part of it: they are pages of their own
      if (f !== page && f.endsWith('index.html')) continue;
      if (files[f] != null) queue.push(...references(f, files[f]), ...assetsNamed(f, files[f], files));
    }
    out[page === 'index.html' ? '' : page.slice(0, -'/index.html'.length)] = new Set([...seen].filter(f => f === page || !f.endsWith('index.html')));
  }
  return out;
}

/** The pages a script opens, read from its source: `${SITE}/hangman/` → 'hangman'; `${SITE}/` → ''. */
export function scriptPages(source, pages) {
  const known = new Set(pages);
  const found = new Set();
  for (const m of source.matchAll(/\$\{(?:SITE|SITIO|BASE)\}\/([a-z0-9/_-]*)/gi)) {
    let p = m[1].replace(/\/+$/, '');
    // The longest prefix that is a page (`timeline/decks/index` → 'timeline')
    while (p && !known.has(p)) p = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
    found.add(p);
  }
  return found;
}

/**
 * A script that builds its routes (`${SITE}/${game}/`) names its pages as plain strings
 * ('hangman', 'battleship/'): those count. If it names none, it can't be narrowed.
 */
export function dynamicPages(source, pages) {
  if (!/\$\{(?:SITE|SITIO|BASE)\}\/\$\{/.test(source)) return { dynamic: false, found: new Set() };
  const known = new Set(pages.filter(Boolean));
  const found = new Set();
  for (const m of source.matchAll(/['"`]([a-z0-9/_-]+?)\/?['"`]/gi)) if (known.has(m[1])) found.add(m[1]);
  return { dynamic: true, found };
}

/**
 * The decision. `changes`: the PR's files (from the repo root). `graph`: page → closure.
 * `scripts`: [{ name: 'hangman/local.mjs', source }]. Returns { scripts, pages, changedScripts }, or
 * null for all.
 */
/**
 * Of the pages that load `f`, those that run it (D-378). A game's files that La Copa plays (cup/games/<game>/…,
 * and the engines it takes from bulls-and-cows/ and timeline/) are named by every screen of La Copa,
 * through the `import()`s of cup/games/index.js (each page fetches only the game it plays, D-468), but
 * only played on that game's page, on La Copa's pages that play them all
 * (the cup and cup/suelto) and on a page that reuses it on purpose (REUSES). On the screens of La Copa's
 * other games they are only loaded, and a load error there is what smoke.mjs, which opens every page,
 * catches on any change.
 */
export function playedOn(f, hit, graph) {
  // A Cup game's folder, or a game whose engine La Copa plays too (bulls-and-cows/, timeline/)
  const game = f.match(/^cup\/games\/([^/]+)\//)?.[1] || (f.startsWith('cup/') || f.startsWith('assets/') ? null : f.split('/')[0]);
  if (!game) return hit;
  // Only the screens of La Copa's other games import it without playing it
  const onlyImports = p => graph[p]?.has('cup/game.js') && p !== 'cup' && p !== 'cup/suelto' && p !== game && p !== `labs/${game}`
    && !p.startsWith(`${game}/`) && !(REUSES[p] || []).some(x => f.startsWith(x));
  return hit.filter(p => !onlyImports(p));
}

/** Does this closure load `f`: by name, or under a media folder it names (`cup/games/where/earth-2004-09/`, D-460)? */
export function loads(closure, f) {
  if (closure.has(f)) return true;
  for (const x of closure) if (x.endsWith('/') && f.startsWith(x)) return true;
  return false;
}

/**
 * `exists(f)`: is the site file still there? A deleted file that no page names any more cannot break a
 * page (the one that used it changes in the same PR, and runs for that): it narrows nothing (D-460).
 */
export function select({ changes, graph, scripts, shared, exists = () => true }) {
  const pages = Object.keys(graph);
  const changedScripts = new Set();
  const changedPublic = [];
  for (const raw of changes.map(c => c.trim()).filter(Boolean)) {
    // The site's own unit tests and notes: GitHub's `tests` check runs them, no page loads them
    if (raw.startsWith('public/') && /\.test\.m?js$|\.md$/.test(raw)) continue;
    if (raw.startsWith('public/')) changedPublic.push(raw.slice('public/'.length));
    // What no browser loads (docs, the agents, durations.json…), before tools/e2e/'s own rule: a new
    // script measured in durations.json, next to its game, used to make the whole PR run everything
    else if (shared(raw)) continue;
    else if (raw.startsWith('tools/e2e/')) {
      const rel = raw.slice('tools/e2e/'.length);
      if (rel.endsWith('.test.mjs') || rel.endsWith('.md')) continue;
      if (scripts.some(s => s.name === rel)) changedScripts.add(rel);
      else return null; // cdp.mjs, ci.mjs, paths.mjs…: everything
    }
    // The workshop the scripts don't import (tools/release/, tools/generators/…): it never reaches them
    else if (raw.startsWith('tools/') && !scripts.some(s => s.source.includes(raw.slice('tools/'.length)))) continue;
    else return null;
  }
  const affected = new Set();
  if (!changedPublic.length && !changedScripts.size) return { scripts: [], pages: affected, changedScripts };
  for (const f of changedPublic) {
    const hit = pages.filter(p => loads(graph[p], f));
    if (!hit.length && !exists(f)) continue; // deleted, and nothing names it any more
    if (!hit.length) return null; // no page loads it directly: it may be fetched at run time
    playedOn(f, hit, graph).forEach(p => affected.add(p));
  }
  // Only the home page changed, maybe with lab pages (D-388): its own scripts run (home/*, smoke.mjs,
  // and those that never leave it, like favorites.mjs) and the lab pages' ones, not the games that
  // start on the home page and click their card
  const labs = [...affected].filter(p => isLab(p));
  const homeOnly = affected.has('') && affected.size === labs.length + 1;
  const runs = scripts.filter(s => {
    if (changedScripts.has(s.name)) return true;
    if (homeOnly) {
      if (s.name.startsWith('home/') || s.name === 'smoke.mjs') return true;
      if (changedPublic.some(f => s.source.includes(`public/${f}`))) return true;
      const named = scriptPages(s.source, pages);
      if (labs.some(p => named.has(p))) return true;
      return named.has('') && [...named].every(p => p === '') && !dynamicPages(s.source, pages).dynamic;
    }
    // It imports a changed module itself (`../../public/hangman/rules.js`)
    if (changedPublic.some(f => s.source.includes(`public/${f}`))) return true;
    if (!affected.size) return false;
    const own = scriptPages(s.source, pages);
    const dyn = dynamicPages(s.source, pages);
    if (dyn.dynamic && !dyn.found.size) return true; // it builds routes it doesn't name
    dyn.found.forEach(p => own.add(p));
    // Its folder's game, under its name or in the lab (`case/lab.mjs` → 'case', 'labs/case')
    const folder = s.name.includes('/') ? s.name.split('/')[0] : null;
    if (folder) pages.filter(p => p === folder || p.endsWith(`/${folder}`)).forEach(p => own.add(p));
    if (!own.size) return true; // it doesn't say where it goes
    return [...own].some(p => affected.has(p));
  }).map(s => s.name);
  return { scripts: runs, pages: affected, changedScripts };
}

/**
 * The jobs among `jobs` ('script' or 'script:part') to run. A part named after a game runs only if
 * that game's page is affected (`cup-games/languages.mjs:year` → 'year'); other parts go with
 * their script. null: all.
 */
export function chooseJobs(jobs, choice, pages) {
  if (!choice) return null;
  return jobs.filter(j => {
    const [script, part] = j.split(':');
    if (!choice.scripts.includes(script)) return false;
    if (!part || choice.changedScripts.has(script)) return true;
    const own = pages.filter(p => p === part || p.endsWith(`/${part}`));
    return !own.length || own.some(p => choice.pages.has(p));
  });
}

/**
 * The test level of a change (D-346), from what it reaches; the processes agent owns the criterion.
 *   N0 · no browser: docs, tools, data, the agents (only the unit tests, the `tests` check).
 *   N1 · lab: only pages under labs/ (their scripts and the smoke test of every page).
 *   N2 · game: some public pages, not the home page and not most of them (their scripts and smoke).
 *   N3 · core: the home page, a third of the pages or more, or anything the graph can't narrow
 *        (shared modules, styles, the e2e tools, the workflows): every script.
 * `choice` is select()'s result (null: everything); `total`, how many pages the site has.
 */
export function levelOf(choice, total) {
  if (choice && !choice.scripts.length) return { level: 'N0', name: 'no browser', reason: 'nothing a page loads changed: unit tests only' };
  if (!choice) return { level: 'N3', name: 'core', reason: 'a change the page graph cannot narrow: every script' };
  const pages = [...choice.pages];
  if (pages.includes('') && pages.every(p => p === '' || isLab(p))) return { level: 'N2', name: 'home', reason: `the home page${pages.length > 1 ? ' and the lab' : ''} only: its ${choice.scripts.length} script(s), not the games (D-388)` };
  if (pages.includes('') || pages.length * 3 >= total) return { level: 'N3', name: 'core', reason: `${pages.includes('') ? 'the home page' : `${pages.length} of ${total} pages`}: every affected script` };
  if (pages.length && pages.every(p => isLab(p))) return { level: 'N1', name: 'lab', reason: `lab only (${pages.join(', ')}): ${choice.scripts.length} script(s)` };
  return { level: 'N2', name: 'game', reason: `${pages.join(', ') || 'a changed script'}: ${choice.scripts.length} script(s)` };
}

/* ------------------------------------------------------------------ */
/* Reading the repo                                                    */
/* ------------------------------------------------------------------ */

const walk = (dir, base = dir) => readdirSync(dir).flatMap(f => {
  const full = join(dir, f);
  return statSync(full).isDirectory() ? walk(full, base) : [relative(base, full).split('\\').join('/')];
});

/**
 * The scripts that run on every change a page reaches, on purpose: they say no page because they open
 * them all. Any other script must name its pages, so the graph can leave it out (D-391).
 */
export const EVERY_PAGE = new Set(['smoke.mjs', 'structured-data.mjs']);

/** The site's text files, path → contents, and the page graph. */
export function siteFiles() {
  const files = {};
  for (const f of walk(PUBLIC)) if (/\.(html|m?js|css)$/.test(f) && !/\.test\.m?js$/.test(f)) files[f] = readFileSync(join(PUBLIC, f), 'utf8');
  return files;
}
/** Is this site file (from public/) still on disk? */
const inPublic = f => existsSync(join(PUBLIC, f));
export function siteGraph() {
  return closures(siteFiles());
}

/** The test level of these changes (D-346): { level, name, reason }. */
export function changeLevel(jobs, changes, shared, noBrowser = false) {
  if (noBrowser) return levelOf({ scripts: [], pages: new Set(), changedScripts: new Set() }, 1);
  const names = [...new Set(jobs.map(j => j.split(':')[0]))];
  const scripts = names.map(name => ({ name, source: existsSync(join(HERE, name)) ? readFileSync(join(HERE, name), 'utf8') : '' }));
  const graph = siteGraph();
  return levelOf(select({ changes, graph, scripts, shared, exists: inPublic }), Object.keys(graph).length);
}

/** Which of `jobs` (tools/e2e/ scripts, or `script:part`) to run for these changes; null means all. */
export function affectedJobs(jobs, changes, shared) {
  const names = [...new Set(jobs.map(j => j.split(':')[0]))];
  const scripts = names.map(name => ({ name, source: existsSync(join(HERE, name)) ? readFileSync(join(HERE, name), 'utf8') : '' }));
  const graph = siteGraph();
  return chooseJobs(jobs, select({ changes, graph, scripts, shared, exists: inPublic }), Object.keys(graph));
}

/* ------------------------------------------------------------------ */
/* Whose files a page may load (D-377, D-378)                         */
/* ------------------------------------------------------------------ */

// La Copa's own pages besides its screens (which load cup/game.js, that plays the games La Copa is made
// of): the three that show its data
const SHOWS_CUP = new Set(['today', 'records', 'panel']);
// Small modules every page may load, though they live in a game's folder
export const SHARED = {
  'cup/reportes.js': 'the 🐞 reports and the inbox, from every page (D-341)',
  'cup/games/semilla.js': "the seeds of La Copa's games, that Uno al día uses on every page",
  'cup/games/solo.js': 'a Cup game played alone: the solo mode of Generala, Toque y Fama and Línea de tiempo',
  'cup/clock.js': 'the active-time clock (D-95, D-377)',
  'cup/code.js': 'the cup code and a random one (D-377)',
  'cup/games/audiencia.js': 'who a deck or word list is for, shared by the Cup and the games that reuse its words',
};
// A game that plays another one's engine on purpose: its solo mode is that game
export const REUSES = {
  'bulls-and-cows': ['cup/games/number/'],
  timeline: ['cup/games/timeline/', 'cup/games/year/engine.js', 'cup/games/mazos.js'],
  'labs/code': ['cup/games/word/'],
  // The owner's sheets of 🚂 Tren en Vilo's trains and visitors, kept in the lab after the game left it (D-456)
  'labs/bridges/trains': ['cup/games/bridges/'],
  'labs/bridges/visitors': ['cup/games/bridges/'],
  // The home page's lab experiments (D-363, D-387): loaded only with ?lab or their parameter
  '': ['labs/home/', 'labs/experiments.css'],
};

/** The game a file belongs to (the first folder of its path, when that folder is a page), or null. */
const ownerIn = (pages, f) => {
  const root = f.split('/')[0];
  return !f.startsWith('assets/') && pages.some(p => p === root || p.startsWith(`${root}/`)) ? root : null;
};

/** May `page` load `f`? Its own game's files, the shared ones, La Copa's pages anything La Copa plays, and the reuses. */
export function mayLoad(graph, page, f) {
  const pages = Object.keys(graph), owner = ownerIn(pages, f);
  if (!owner || f.endsWith('index.html')) return true;
  if (page === owner || page.startsWith(`${owner}/`)) return true;
  if (owner === 'cup' && SHARED[f]) return true;
  if (graph[page].has('cup/game.js') || SHOWS_CUP.has(page)) return true;
  return (REUSES[page] || []).some(x => f.startsWith(x));
}

/** Every page that loads another game's file it should not: [{ page, file }]. */
export function crossLoads(graph = siteGraph()) {
  const out = [];
  for (const [page, files] of Object.entries(graph)) for (const f of files) if (!mayLoad(graph, page, f)) out.push({ page, file: f });
  return out;
}

/**
 * The PR's test scope, for the run's summary (D-378): how many scripts run, and for each changed file of
 * the site the pages and scripts it reaches. A file loaded by other games' pages names the import that
 * takes it there, so a leak shows on the PR that makes it, not months later. Markdown lines.
 */
export function scopeReport(jobs, changes, shared) {
  const all = affectedJobs(jobs, changes, shared);
  const n = all === null ? jobs.length : all.length;
  const lines = [`### Test scope: ${n} of ${jobs.length} end-to-end jobs`];
  const site = changes.map(c => c.trim()).filter(c => c.startsWith('public/') && !/\.test\.m?js$|\.md$/.test(c));
  if (!site.length) return lines;
  const files = siteFiles(), graph = closures(files), pages = Object.keys(graph);
  // The first file on the way from a page to `to` that is not the page's own: the import that brings it
  const via = (page, to) => {
    const start = page ? `${page}/index.html` : 'index.html';
    const prev = { [start]: null }, queue = [start];
    while (queue.length) {
      const c = queue.shift();
      if (c === to) { const path = []; for (let x = c; x; x = prev[x]) path.unshift(x); return path.slice(1).find(f => !f.startsWith(`${page}/`)) || to; }
      if (c !== start && c.endsWith('index.html')) continue;
      for (const r of references(c, files[c] || '')) if (!(r in prev) && files[r] != null) { prev[r] = c; queue.push(r); }
    }
    return null;
  };
  lines.push('', '| Changed file | Pages | Jobs | Reaches other games\' pages through |', '|---|---|---|---|');
  for (const c of site.slice(0, 40)) {
    const f = c.slice('public/'.length);
    const on = pages.filter(p => loads(graph[p], f));
    const jobsOf = affectedJobs(jobs, [c], shared);
    const owner = ownerIn(pages, f);
    const foreign = owner ? on.filter(p => !mayLoad(graph, p, f)) : [];
    const hops = {};
    for (const p of foreign) { const h = via(p, f); if (h && h !== f) (hops[h] ||= []).push(p || 'home'); }
    const how = Object.entries(hops).sort((a, b) => b[1].length - a[1].length).slice(0, 3).map(([h, ps]) => `\`${h}\` (${ps.length})`).join(', ');
    lines.push(`| \`${f}\` | ${on.length} | ${jobsOf === null ? 'all' : jobsOf.length} | ${owner ? how || '—' : 'shared module'} |`);
  }
  return lines;
}
