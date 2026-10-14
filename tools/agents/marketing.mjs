/**
 * Does the marketing material show today's app? (U-34)
 *
 *   node tools/agents/marketing.mjs check                  which asset of the marketing registry fell behind
 *   node tools/agents/marketing.mjs record <id> --up-to-date
 *   node tools/agents/marketing.mjs record <id> --pending "Desenredo is missing" [--pending "…"]
 *
 * `check` compares what each asset declares (the app version it shows, the games that appear)
 * against today's cover page (public/assets/js/games.js) and the version published in index.html,
 * and lists the commits that touched the games it shows since the asset's date. It does not
 * decide: the usability agent looks and records with `record` in the registry's `revision` field.
 * Redoing the asset is another task (each asset's skill; the video, `promo-video`), and the owner
 * decides it. The registry's fields (`titulo`, `fecha`, `juegos`, `revision.al_dia`…) are data and
 * keep their names.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GAMES, SUELTOS, PORTADA } from '../../public/assets/js/games.js';
import { todayVersion } from '../release/version.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// marketing/log.json from D-316 on; marketing/registro.json while that file has not been renamed
const REGISTRY = ['log.json', 'registro.json'].map(f => join(ROOT, 'marketing', f)).find(existsSync) || join(ROOT, 'marketing', 'log.json');

/** What an asset has fallen behind on compared to today's app. Pure: tested without disk. */
export function behind(asset, { cover, version, name = id => id }) {
  const shows = new Set([...(asset.juegos || []), ...(asset.grilla_mas || [])]);
  const today = new Set(cover);
  const warnings = [];
  // `seleccion`: the asset shows only some games on purpose (the video since v6), so a new one on
  // the cover page does not leave it behind
  const missing = asset.seleccion ? [] : cover.filter(id => !shows.has(id) && id !== 'copa');
  if (missing.length) warnings.push(`cover-page games that do not appear: ${missing.map(name).join(', ')}`);
  // `laboratorio`: games not yet on the cover page on purpose (the El caso teaser, U-34)
  const extra = [...shows].filter(id => !today.has(id) && !(asset.laboratorio || []).includes(id));
  if (extra.length) warnings.push(`games that are no longer on the cover page appear: ${extra.map(name).join(', ')}`);
  if (asset.app && version && older(asset.app, version)) warnings.push(`shows app ${asset.app}; today it is ${version}`);
  return warnings;
}

// "0.82.x" < "0.88.0": compares major and minor, which is where the screens change.
function older(a, b) {
  const [a1, a2] = a.split('.').map(Number), [b1, b2] = b.split('.').map(Number);
  return a1 < b1 || (a1 === b1 && a2 < b2);
}

function commitsSince(date, folders) {
  try {
    return execFileSync('git', ['log', '--oneline', '--no-merges', `--since=${date}`, '--', ...folders,
      // Until D-205 set-version.py stamped every page: that does not change what is seen.
      ':(exclude,glob)**/index.html'],
      { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch { return []; }
}

// Folders are in English and are not the id (D-192): a game lives in public/<path>; a standalone
// game, in public/<slug>/, and its engine and screen in public/cup/games/<slug>/.
const folders = id => {
  const g = GAMES.find(x => x.id === id);
  if (g) return [`public/${g.path}`];
  const m = SUELTOS.find(x => x.id === id);
  return m ? [`public/${m.path}`, `public/cup/games/${m.slug}/`] : [];
};

function check() {
  const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
  const cover = PORTADA.filter(g => g.available).map(g => g.id);
  const names = Object.fromEntries(PORTADA.map(g => [g.id, `${g.emoji} ${g.name.es}`]));
  const version = todayVersion();
  for (const a of registry.assets) {
    console.log(`\n${a.titulo} (${a.id}) · v${a.version} · ${a.fecha} · ${a.estado || ''}`);
    const warnings = behind(a, { cover, version, name: id => names[id] || id });
    for (const t of warnings) console.log(`  ⚠️  ${t}`);
    const commits = commitsSince(a.fecha, (a.juegos || []).flatMap(folders));
    if (commits.length) {
      console.log(`  🔎 ${commits.length} commits touched the games it shows since ${a.fecha} (did something visible change?):`);
      for (const c of commits.slice(0, 15)) console.log(`     ${c}`);
      if (commits.length > 15) console.log(`     … and ${commits.length - 15} more`);
    }
    if (!warnings.length && !commits.length) console.log('  ✅ nothing new since its date');
    if (a.revision) console.log(`  📝 last review ${a.revision.fecha}: ${a.revision.al_dia ? 'up to date' : a.revision.pendiente.join(' · ')}`);
  }
}

function record(id, args) {
  const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
  const a = registry.assets.find(x => x.id === id);
  if (!a) throw new Error(`there is no asset "${id}" in ${REGISTRY.slice(ROOT.length + 1)}`);
  const pending = [];
  for (let i = 0; i < args.length; i++) if (args[i] === '--pending') pending.push(args[++i]);
  if (!args.includes('--up-to-date') && !pending.length) throw new Error('missing --up-to-date or --pending "…"');
  a.revision = { fecha: new Date().toISOString().slice(0, 10), app: todayVersion(), al_dia: !pending.length, pendiente: pending };
  writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n');
  console.log(`${id}: ${a.revision.al_dia ? 'up to date' : `pending: ${pending.join(' · ')}`}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, ...rest] = process.argv.slice(2);
  try {
    if (command === 'check') check();
    else if (command === 'record') record(rest[0], rest.slice(1));
    else { console.log('usage: node tools/agents/marketing.mjs check | record <id> (--up-to-date | --pending "…")'); process.exit(1); }
  } catch (e) { console.error(e.message); process.exit(1); }
}
