// Runs the end-to-end tests that don't touch the production Firebase (D-193).
//
// Usage:
//   node tools/e2e/ci.mjs                 # all of them, one after another, with the summary at the end
//   node tools/e2e/ci.mjs --list          # the scripts that run, in JSON
//   node tools/e2e/ci.mjs --list --changes <file>      # [] if the PR touches nothing in the browser (D-205, D-299)
//   node tools/e2e/ci.mjs --groups [--changes <file>]  # the same, in even groups for GitHub's matrix (D-307)
//   node tools/e2e/ci.mjs --groups --changes <file> --smoke   # always with smoke.mjs: a merge on main (D-496)
//   node tools/e2e/ci.mjs --scope --changes <file>     # the PR's test scope, as Markdown for the run's summary (D-378)
//   node tools/e2e/ci.mjs cup/tournament.mjs        # only those (the path from tools/e2e/)
//   node tools/e2e/ci.mjs cup/tournament.mjs:cup    # only one part of a long script (see PARTS)
//
// Needs the site served at http://localhost:8765 (or in SITE) and Chrome in CHROME. A script
// fails if it exits with an error, if it prints a line with ✗ or ❌, or if it doesn't finish in
// CAP_MS. Many scripts only print what they see, for a person to read: in CI they still catch
// what breaks completely (a button that is no longer there makes the script crash).
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, statSync, mkdirSync, appendFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUELTOS } from '../../public/assets/js/games.js';
import { noBrowser } from './changes.mjs';
import { affectedJobs, changeLevel, scopeReport } from './affected.mjs';
import { group, readDurations, NOTICE } from './groups.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// E2E_OUT; SALIDA_E2E is its old name (D-316)
const OUT = process.env.E2E_OUT || process.env.SALIDA_E2E || '/tmp/e2e';
const CAP_MS = 15 * 60 * 1000;

// Not tests: they look at screens or build screenshot sheets
const TOOLS = new Set(['cdp.mjs', 'ci.mjs', 'look.mjs', 'spacing-common.mjs', 'contact-sheet.mjs', 'paths.mjs', 'languages-common.mjs', 'changes.mjs', 'groups.mjs', 'already-tested.mjs', 'output.mjs', 'affected.mjs', 'since-passed.mjs']);
// They open rooms or join them in the production Firebase: still run by hand
const WITH_FIREBASE = /(^|\/)(online|chat)\.mjs$/;
const ALSO_FIREBASE = new Set([
  'versioning.mjs',              // opens a room to see that firebase.js loads versioned
  'share-room.mjs',              // opens a Línea de Tiempo room
  'invite-link.mjs',             // enters ?room= in the four games with rooms
  'lang-from-url.mjs',           // opens /liars-dice/?room=WFBN
  'timeline/verdict.mjs',        // two phones in a room
  'timeline/pool.mjs',           // the second half plays in a room
  'liars-dice/rooms-classic.mjs', // the 🧪 classic rules in a room, with 2 to 5 phones
]);

// They test something that no longer exists: left out until someone rewrites them
const OBSOLETE = new Set([
  'timeline/error.mjs',          // played against the phone, a mode Línea de Tiempo no longer has (D-142)
]);

// The long scripts are split into parts, each in its own GitHub job: the slowest sets how long
// the whole check takes. Each part reaches the script as `--part <name>`. Here, without a part,
// they run whole.
export const PARTS = {
  'cup/tournament.mjs': ['cup', 'labs', 'demos', 'weekend'],
  'cup/languages.mjs': ['cup', 'standalone', 'screens-a', 'screens-b'],
  'cup-games/languages.mjs': SUELTOS.map(m => m.slug),
};

/** The scripts, with their path from tools/e2e/: each game's go in its folder (D-192). */
const all = (dir = '') => readdirSync(join(HERE, dir)).flatMap(f => {
  const rel = dir ? `${dir}/${f}` : f;
  return statSync(join(HERE, rel)).isDirectory() ? all(rel) : [rel];
});

/**
 * Whether a changed file is nothing CI could run: a page loads none of it (changes.mjs), or it is
 * a script left out above (it opens rooms in the production Firebase, or is obsolete), which no
 * job runs, so changing it must not make the PR run every script.
 */
const shared = f => {
  if (noBrowser([f])) return true;
  const rel = f.startsWith('tools/e2e/') ? f.slice('tools/e2e/'.length) : null;
  return !!rel && rel.endsWith('.mjs') && (WITH_FIREBASE.test(rel) || ALSO_FIREBASE.has(rel) || OBSOLETE.has(rel));
};

export const scripts = () => all()
  .filter(f => f.endsWith('.mjs') && !f.endsWith('.test.mjs'))
  .filter(f => !TOOLS.has(f) && !WITH_FIREBASE.test(f) && !ALSO_FIREBASE.has(f) && !OBSOLETE.has(f))
  .sort();

/**
 * What GitHub runs: each script, or each part of those that have them (`cup/tournament.mjs:cup`).
 * The longest first (the script's size works as an approximation): GitHub runs about twenty jobs
 * at a time and starts the matrix in order, so a long one at the end of the list waits in the
 * queue and stretches the whole check.
 */
export const jobs = () => scripts()
  .sort((a, b) => statSync(join(HERE, b)).size - statSync(join(HERE, a)).size)
  .flatMap(g => PARTS[g] ? PARTS[g].map(p => `${g}:${p}`) : [g]);

// If ci.mjs is cut, it passes it to its scripts, which close their Chrome before exiting
const alive = new Set();
for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, () => { for (const p of alive) p.kill(s); process.exit(128 + { SIGINT: 2, SIGTERM: 15, SIGHUP: 1 }[s]); });

/** The screenshot folder of a script or of one of its parts. */
const folder = script => { const [file, part] = script.split(':'); return join(OUT, file.replace(/\.mjs$/, ''), part || ''); };

/** Runs a script or one of its parts (`script:part`); resolves with { ok, reason, ms, bad }. */
function run(script, suffix = '') {
  const [file, part] = script.split(':');
  const dir = join(folder(script), suffix);
  mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  return new Promise(ok => {
    const p = spawn(process.execPath, [join(HERE, file), dir, ...(part ? ['--part', part] : [])], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const record = d => { output += d; process.stdout.write(d); };
    p.stdout.on('data', record);
    p.stderr.on('data', record);
    // SIGTERM first, so the script gets to close its Chrome (cdp.mjs); if it doesn't exit, SIGKILL
    let expired = false, finish;
    const timer = setTimeout(() => { expired = true; p.kill('SIGTERM'); finish = setTimeout(() => p.kill('SIGKILL'), 5000); }, CAP_MS);
    alive.add(p);
    p.on('close', (code, signal) => {
      clearTimeout(timer); clearTimeout(finish); alive.delete(p);
      const bad = output.split('\n').filter(l => /✗|❌/.test(l));
      const reason = expired || signal ? `didn't finish in ${CAP_MS / 60000} min`
        : code ? `exited with ${code}`
        : bad.length ? `${bad.length} check(s) red` : '';
      ok({ script, ok: !reason, reason, bad, ms: Date.now() - t0 });
    });
  });
}

/**
 * The jobs a PR needs: none if it touches nothing in the browser (D-205, D-299), only the scripts
 * whose pages load what it changed (affected.mjs, D-329), all of them without a list (main).
 */
export function chosenJobs(changes = null, { smoke = false } = {}) {
  if (!changes) return jobs();
  const chosen = noBrowser(changes) ? [] : affectedJobs(jobs(), changes, shared) || jobs();
  // A merge on main always opens every page (D-496), also when its diff reaches no script
  return smoke && !chosen.includes('smoke.mjs') ? [...chosen, 'smoke.mjs'] : chosen;
}

/** What GitHub runs, in groups (D-307); [] if there is nothing to run. */
export function groups(changes = null, opts = {}) {
  const chosen = chosenJobs(changes, opts);
  return chosen.length ? group(chosen, readDurations()) : [];
}

/**
 * Runs the chosen ones one after another. With `retries` (CI_RETRIES on GitHub, D-299), a script
 * that fails is repeated on the spot: if it passes, it stays green as flaky, with a notice that names it.
 */
async function runAll(chosen, retries) {
  const results = [];
  for (const g of chosen) {
    console.log(`\n▶ ${g}`);
    let r = await run(g);
    if (!r.ok && retries > 0) {
      console.log(`::warning title=Flaky::${g} failed on the first attempt (${r.reason}); repeating it once (D-299)`);
      console.log(`\n▶ ${g} (second attempt)`);
      const again = await run(g, 'second-attempt');
      if (again.ok) console.log(`::warning title=Flaky::${g} passed on the second attempt: it fails sometimes (the first attempt's screenshots are in the artifact)`);
      r = { ...again, flaky: again.ok, first: r };
    }
    if (!r.ok) console.log(`::error title=Failed ${g}::${r.reason}${r.bad[0] ? ': ' + r.bad[0].slice(0, 200) : ''}`);
    results.push(r);
  }
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  // The PR's files, one per line: if nothing reaches the browser, there is nothing to run
  const changesOf = () => args.includes('--changes') ? readFileSync(args[args.indexOf('--changes') + 1], 'utf8').split('\n') : null;
  // The change's test level (D-346), on stderr so the workflow logs it and the JSON stays clean
  const said = changesOf();
  if (said) { const l = changeLevel(jobs(), said, shared, noBrowser(said)); console.error(`test level ${l.level} · ${l.name}: ${l.reason}`); }
  if (args.includes('--scope')) {
    // The PR's test scope for the run's summary (D-378): what runs, and what reaches where through what
    const report = scopeReport(jobs(), changesOf() || [], shared).join('\n');
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
  } else if (args.includes('--groups')) {
    const gs = groups(changesOf(), { smoke: args.includes('--smoke') });
    if (!gs.length) console.error('the PR changes nothing an end-to-end script loads: none runs (D-205, D-299, D-329)');
    console.log(JSON.stringify(gs.map(g => ({ name: g.name, scripts: g.scripts.join(' ') }))));
  } else if (args.includes('--list')) {
    const chosen = chosenJobs(changesOf(), { smoke: args.includes('--smoke') });
    if (!chosen.length) console.error('the PR changes nothing an end-to-end script loads: none runs (D-205, D-299, D-329)');
    console.log(JSON.stringify(chosen));
  } else {
    const chosen = args.length ? args : scripts();
    // CI_RETRIES; CI_REINTENTOS is its old name (D-316)
    const results = await runAll(chosen, Number(process.env.CI_RETRIES || process.env.CI_REINTENTOS || 0));
    const rows = results.map(r => `| ${r.ok ? (r.flaky ? '⚠️' : '✅') : '❌'} | \`${r.script}\` | ${Math.round(r.ms / 1000)} s | ${r.flaky ? `passed on the second attempt (the first: ${r.first.reason})` : r.reason || ''} |`);
    const summary = ['| | Script | Time | |', '|---|---|---|---|', ...rows,
      ...results.filter(r => r.bad.length).flatMap(r => ['', `**${r.script}**`, '```', ...r.bad.slice(0, 30), '```'])].join('\n');
    console.log('\n' + summary);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
    if (process.env.GITHUB_ACTIONS) {
      // How long each script took, so `groups.mjs measure` rebuilds the groups with data (D-307)
      const durs = Object.fromEntries(results.filter(r => r.ok && !r.flaky).map(r => [r.script, Math.round(r.ms / 1000)]));
      console.log(`::notice title=${NOTICE}::${JSON.stringify(durs)}`);
      // The useful screenshots are those of what failed or passed on the second attempt: the rest isn't uploaded
      for (const r of results) if (r.ok && !r.flaky) rmSync(folder(r.script), { recursive: true, force: true });
    }
    process.exitCode = results.every(r => r.ok) ? 0 : 1;
  }
}
