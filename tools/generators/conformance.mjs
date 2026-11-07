/**
 * The conformance suite's static half (#1249 step 8): what can be checked about a game from its
 * files alone, driven by its `game.json`. `public/assets/js/conformance.test.mjs` runs it on every
 * manifest in the repo; `tools/generators/new-game.test.mjs` runs it on a freshly generated game; the
 * browser half is `tools/e2e/conformance.mjs`.
 *
 * Each check names its canon. A game whose `canonExceptions` lists that canon skips the check: the
 * exception, with its reason, lives in the manifest and not in this file.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateManifest } from '../../public/assets/js/game-manifest.js';

/** C-2's files, in every game folder. */
export const C2_FILES = ['index.html', 'style.css', 'rules.js', 'engine.js', 'engine.test.mjs', 'game.js'];

/** The dotted paths of an object's leaves ("a.b.c"), sorted: two languages match when these do. */
export const leafKeys = (o, pre = '') => Object.entries(o || {}).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? leafKeys(v, `${pre}${k}.`) : [`${pre}${k}`]).sort();

/** Does game.js import `name` from the shared module `file` (assets/js/<file>)? */
const imports = (src, name, file) => new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*'[./]*assets/js/${file.replace('.', '\\.')}'`).test(src);

/**
 * The problems of the game in `public/<folder>/` (folder like 'hangman' or 'labs/julep'), as
 * "C-n: what" strings; empty when it conforms. `publicDir` is the site root (a temp copy in tests).
 */
export async function staticConformance(publicDir, folder) {
  const dir = join(publicDir, folder);
  const out = [];
  if (!existsSync(join(dir, 'game.json'))) return ['manifest: no game.json'];
  let m;
  try { m = JSON.parse(readFileSync(join(dir, 'game.json'), 'utf8')); } catch (e) { return [`manifest: game.json is not JSON (${e.message})`]; }
  for (const p of validateManifest(m)) out.push(`manifest: ${p}`);
  if (m.path !== `${folder}/`) out.push(`manifest: path ${m.path} is not its folder ${folder}/`);
  const excused = new Set((m.canonExceptions || []).map(e => e.canon));
  const check = (canon, ok, what) => { if (!ok && !excused.has(canon)) out.push(`${canon}: ${what}`); };

  // C-2: the files
  for (const f of C2_FILES) check('C-2', existsSync(join(dir, f)), `${folder}/${f} is missing`);

  // C-3: rules.js has the id and LOCALES for each language, with the same keys as Spanish
  if (existsSync(join(dir, 'rules.js'))) {
    let rules = null;
    try { rules = await import(pathToFileURL(join(dir, 'rules.js')).href); } catch (e) { out.push(`C-2: rules.js does not load in node (${e.message.split('\n')[0]})`); }
    if (rules) {
      check('C-2', rules.GAME_ID === m.id, `rules.js GAME_ID is ${rules.GAME_ID}, the manifest id is ${m.id}`);
      const L = rules.LOCALES || {};
      const es = leafKeys(L.es);
      check('C-3', es.length > 0, 'rules.js has no LOCALES.es');
      for (const lang of m.languages || []) {
        check('C-3', !!L[lang], `rules.js has no LOCALES.${lang}`);
        if (!L[lang] || lang === 'es') continue;
        const keys = leafKeys(L[lang]);
        const missing = es.filter(k => !keys.includes(k)), extra = keys.filter(k => !es.includes(k));
        check('C-3', !missing.length && !extra.length, `LOCALES.${lang} differs from es${missing.length ? `, missing ${missing.slice(0, 3).join(', ')}` : ''}${extra.length ? `, extra ${extra.slice(0, 3).join(', ')}` : ''}`);
      }
    }
  }

  // The shared modules game.js must go through
  const game = existsSync(join(dir, 'game.js')) ? readFileSync(join(dir, 'game.js'), 'utf8') : '';
  check('C-6', imports(game, 'createSessionStore', 'session.js') && /createSessionStore\(\s*GAME_ID\b/.test(game), 'game.js does not save with createSessionStore(GAME_ID) from session.js');
  check('C-19', imports(game, 'salidasFin', 'fin.js') && /salidasFin\(/.test(game), 'game.js does not take its result exits from salidasFin in fin.js');
  check('C-7', /from\s*'[./]*assets\/js\/compartir\.js'/.test(game), 'game.js does not share through compartir.js');
  check('C-7', imports(game, 'trackStart', 'transport/stats.js') && imports(game, 'trackFinish', 'transport/stats.js'), 'game.js does not send trackStart/trackFinish from transport/stats.js');

  // The header's ‹ exists and points somewhere (the browser half follows it)
  const html = existsSync(join(dir, 'index.html')) ? readFileSync(join(dir, 'index.html'), 'utf8') : '';
  check('C-2', /<a class="back" href="[^"]+"/.test(html), 'index.html has no header ‹ (a.back with an href)');
  check('C-6', /id="resume-slot"/.test(html), 'index.html has no #resume-slot for the "game in progress" panel');
  return out;
}
