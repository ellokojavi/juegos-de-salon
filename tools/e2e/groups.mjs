// The end-to-end scripts, in even groups (D-307): GitHub runs each group in a job, one after
// another inside the job, and all the groups at once. It used to be one job per script (58): more
// than the 20 runners GitHub gives at a time, so the last ones waited in the queue, and each job
// paid ~17 s of setup (checkout, node, Chrome).
//
// The groups are built from how long each script actually took (`durations.json`, in seconds):
// the longest first, always into the lightest group. How many groups: as many as needed so none
// goes over TARGET_S (or over the longest script, if that is more), up to MAXIMUM.
//
//   node tools/e2e/groups.mjs show                # today's groups, with their estimated time
//   node tools/e2e/groups.mjs measure [--runs 5]  # updates durations.json with GitHub's latest runs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DURATIONS = join(HERE, 'durations.json');
export const TARGET_S = 300;       // ~5 min per group: with ~1 min of setup, the check in ~6 (270 until D-421: with Agentes' two jobs the 18 runners no longer fit)
export const MAXIMUM = 18;         // and 2 runners free out of the 20, for list and end-to-end
export const UNMEASURED_S = 90;    // a new script, until it is measured
const REPO = process.env.REPO || 'ellokojavi/juegos-de-salon';

export const readDurations = () => existsSync(DURATIONS) ? JSON.parse(readFileSync(DURATIONS, 'utf8')) : {};

/** How long a job (`script` or `script:part`) takes, as measured. */
export const duration = (t, dur) => dur[t] ?? UNMEASURED_S;

/**
 * Splits the jobs into even groups: `[{ name, scripts: [...], s }]`, the heaviest first.
 * Deterministic: the same durations give the same groups.
 */
export function group(jobs, dur, { target = TARGET_S, maximum = MAXIMUM } = {}) {
  if (!jobs.length) return [];
  const t = jobs.map(g => ({ g, s: duration(g, dur) })).sort((a, b) => b.s - a.s || a.g.localeCompare(b.g));
  const total = t.reduce((x, y) => x + y.s, 0);
  const k = Math.max(1, Math.min(maximum, t.length, Math.ceil(total / Math.max(target, t[0].s))));
  const groups = Array.from({ length: k }, () => ({ scripts: [], s: 0 }));
  for (const x of t) {
    const g = groups.reduce((m, y) => y.s < m.s ? y : m);
    g.scripts.push(x.g); g.s += x.s;
  }
  return groups.sort((a, b) => b.s - a.s).map((g, i) => ({
    name: `g${String(i + 1).padStart(2, '0')} · ${g.scripts[0]}${g.scripts.length > 1 ? ` +${g.scripts.length - 1}` : ''}`,
    scripts: g.scripts, s: Math.round(g.s),
  }));
}

/** The line ci.mjs leaves in the run with how long each script took: `::notice title=Durations::{json}`. */
export const NOTICE = 'Durations';
const OLD_NOTICE = 'Duraciones';   // runs from before D-316
export const readNotice = message => { try { return JSON.parse(message); } catch (_) { return null; } };

const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'show') {
    // ci.mjs imports this file: it is asked separately, so as not to import it back
    const dur = readDurations();
    const groups = JSON.parse(execFileSync(process.execPath, [join(HERE, 'ci.mjs'), '--groups'], { encoding: 'utf8' }))
      .map(g => ({ ...g, scripts: g.scripts.split(' ') })).map(g => ({ ...g, s: g.scripts.reduce((x, t) => x + duration(t, dur), 0) }));
    for (const g of groups) console.log(`${g.name.padEnd(48)} ${String(g.s).padStart(4)} s  ${g.scripts.join(', ')}`);
    console.log(`${groups.length} groups; the longest, ${groups[0]?.s} s`);
  } else if (cmd === 'measure') {
    const n = Number(args.includes('--runs') ? args[args.indexOf('--runs') + 1] : 5);
    const gh = (...a) => JSON.parse(execFileSync('gh', ['api', ...a], { encoding: 'utf8', maxBuffer: 1e8 }));
    const runs = gh(`repos/${REPO}/actions/workflows/e2e.yml/runs?status=success&per_page=30`).workflow_runs;
    const measured = {};
    let used = 0;
    for (const r of runs) {
      if (used >= n) break;
      let any = false;
      for (const j of gh(`repos/${REPO}/actions/runs/${r.id}/jobs?per_page=100`).jobs) {
        for (const a of gh(`repos/${REPO}/check-runs/${j.id}/annotations`)) {
          if (a.title !== NOTICE && a.title !== OLD_NOTICE) continue;
          for (const [g, s] of Object.entries(readNotice(a.message) || {})) (measured[g] ||= []).push(s);
          any = true;
        }
      }
      if (any) used++;
    }
    if (!used) { console.error('no run with durations yet'); process.exit(1); }
    const dur = { ...readDurations() };
    for (const [g, xs] of Object.entries(measured)) dur[g] = Math.round(median(xs));
    writeFileSync(DURATIONS, JSON.stringify(Object.fromEntries(Object.entries(dur).sort()), null, 1) + '\n');
    console.log(`durations.json: ${Object.keys(measured).length} scripts measured in ${used} run(s)`);
  } else {
    console.error('Usage: node tools/e2e/groups.mjs show | measure [--runs n]');
    process.exit(1);
  }
}
