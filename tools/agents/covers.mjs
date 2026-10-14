/**
 * The cover page up to date (U-36): which games a PR touches and what their cover page says, to reread it.
 *
 *   node tools/agents/covers.mjs check [base]     (base: origin/main)
 *
 * For each lab game the PR changes (public/labs/<folder>/), it shows the tagline, the steps of
 * "How to play" and its card in the lab, and warns ⚠️ if the game changed but its cover page did
 * not: that is what happened to Pintaminas, which added colors, help and giving up with the steps
 * of its first day. For the menu and La Copa games it names the files, to reread their intro by
 * hand. It decides nothing: the usability agent rereads and fixes in the same PR.
 *
 * And it says the PR's stage, which decides how much usability review it gets (D-304): 🧪 lab only
 * (short: this and the screens that changed, at 320 px), 🎓 a game that leaves the lab (full pass
 * over the whole game), or the site (as always).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' });

/** The tagline and the "How to play" steps of a lab game.js (the `T` texts object: `lema`, `como`). */
export function coverOf(source) {
  const tagline = (source.match(/^\s*lema: (['`])(.*?)\1/m) || [])[2] || null;
  const i = source.indexOf('como: [');
  const block = i < 0 ? '' : source.slice(i, source.indexOf('\n  ],', i));
  const steps = [...block.matchAll(/\['([^']+)', ([`'])(.*?)\2\]/g)].map(m => `${m[1]} ${m[3]}`);
  return { tagline, steps };
}

/**
 * The steps with their `${…}` resolved against the game's constants (those of its engine.js), and
 * their joint length, as the U-18 test counts it for La Copa games: the lab does not have it.
 */
export function resolvedSteps(steps, constants) {
  const names = Object.keys(constants), values = Object.values(constants);
  const resolved = steps.map(p => p.replace(/\$\{([^}]+)\}/g, (_, expr) => String(new Function(...names, `return (${expr})`)(...values))));
  return { resolved, length: resolved.map(p => p.replace(/^\S+ /, '')).join(' ').length };
}

/** The games the changed files touch: the lab ones by their folder, and the rest apart. */
export function touchedGames(files) {
  const labs = new Set(), others = new Set();
  for (const f of files) {
    const l = f.match(/^public\/labs\/([a-z-]+)\//);
    if (l) { labs.add(l[1]); continue; }
    const c = f.match(/^public\/cup\/games\/([a-z-]+)\//) || f.match(/^public\/([a-z-]+)\/(game|engine|ui|rules)[^/]*\.js$/);
    if (c) others.add(c[1]);
  }
  return { labs: [...labs], others: [...others] };
}

/**
 * The games a PR takes out of the lab (D-304): those that lose `labs: true` in games.js or in
 * cup/rules.js (like Desenredo, D-190), and the folders that move from public/labs/<x>/ elsewhere
 * (D-267). `diff` is that of those two files; `names`, that of `git diff --name-status -M`.
 */
export function labsExits(diff, names) {
  const leaving = new Set();
  const lines = diff.split('\n');
  lines.forEach((l, i) => {
    if (!/^-.*\blabs: true\b/.test(l) || lines.some(x => x === '+' + l.slice(1))) return; // moved, not removed
    const inLine = l.match(/^-\s*'?([\w-]+)'?: \{.*labs: true/);
    if (inLine) return leaving.add(inLine[1]);
    for (let j = i - 1; j >= 0 && !lines[j].startsWith('@@'); j--) {
      const m = lines[j].match(/^[ -]\s*(?:slug|id): '([^']+)'/);
      if (m) return leaving.add(m[1]);
    }
    leaving.add('(a game)');
  });
  for (const l of names.split('\n')) {
    const [status, before, after] = l.split('\t');
    const m = /^R/.test(status || '') && before.match(/^public\/labs\/([a-z-]+)\//);
    if (m && !after.startsWith('public/labs/')) leaving.add(m[1]);
  }
  return [...leaving];
}

/** A PR's stage (D-304): 'leaves', 'labs', 'site' or 'no-app'. */
export function stage(files, exits) {
  if (exits.length) return 'leaves';
  const app = files.filter(f => f.startsWith('public/'));
  if (!app.length) return 'no-app';
  return app.every(f => f.startsWith('public/labs/')) ? 'labs' : 'site';
}

export const STAGES = {
  leaves: s => `🎓 ${s.join(', ')} leaves the lab: full usability pass over the whole game —all its screens, the four languages, 320 px, its cover page and its place on the main cover page— and documentation with the README and the social card (D-304)`,
  labs: () => '🧪 Lab-only PR: short usability —this cover-page check and the screens that changed, at 320 px— and documentation (D-304)',
  site: () => 'Site PR: usability and documentation, as always (D-132, D-204)',
  'no-app': () => 'The PR does not touch public/: usability has no screens to look at',
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, base = 'origin/main'] = process.argv.slice(2);
  if (cmd !== 'check') { console.error('Usage: node tools/agents/covers.mjs check [base]'); process.exit(1); }
  const files = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean);
  const exits = labsExits(git('diff', `${base}...HEAD`, '--', 'public/assets/js/games.js', 'public/cup/rules.js'), git('diff', '--name-status', '-M', `${base}...HEAD`));
  console.log(`Stage: ${STAGES[stage(files, exits)](exits)}`);
  const { labs, others } = touchedGames(files);
  if (!labs.length && !others.length) { console.log('✓ the PR touches no game: no cover pages to reread'); process.exit(0); }
  const index = existsSync(join(ROOT, 'public/labs/index.html')) ? readFileSync(join(ROOT, 'public/labs/index.html'), 'utf8') : '';
  for (const slug of labs) {
    const file = `public/labs/${slug}/game.js`;
    if (!existsSync(join(ROOT, file))) continue;
    const { tagline, steps } = coverOf(readFileSync(join(ROOT, file), 'utf8'));
    const diff = git('diff', `${base}...HEAD`, '--', file);
    const coverChanged = /^[+-]\s*(lema:|\['[^']+', [`'])/m.test(diff);
    const code = files.filter(f => f.startsWith(`public/labs/${slug}/`) && !f.endsWith('.css'));
    console.log(`\n🕹️  ${slug} — changed: ${code.join(', ') || '(styles only)'}`);
    console.log(`   tagline: ${tagline ?? '(no tagline)'}`);
    const engine = join(ROOT, `public/labs/${slug}/engine.js`);
    const { resolved, length } = resolvedSteps(steps, existsSync(engine) ? { ...(await import(engine)) } : {});
    resolved.forEach((p, k) => console.log(`   ${k + 1}. ${p}`));
    console.log(`   ${length <= 280 && steps.length <= 3 ? '✓' : '⚠️ '} ${steps.length} steps, ${length} characters (U-18: up to 3 and 280)`);
    const card = (index.match(new RegExp(`href="${slug}/"`)) && index.split(`href="${slug}/"`)[0].split('<section').pop().replace(/^[^>]*>/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) || '';
    if (card) console.log(`   lab card: ${card.replace(/\s*<a class.*$/, '').slice(0, 400)}`);
    if (code.some(f => /(engine|game)\.js$/.test(f)) && !coverChanged) console.log('   ⚠️  the game changed and its cover page did not: reread that the tagline, the steps and the card say how it is played today (U-36)');
    else console.log('   ✓ the cover page changed in this PR: reread that it is complete and says how it is played today');
  }
  for (const id of others) console.log(`\n🕹️  ${id} (menu or La Copa): reread its intro and its rules (La Copa's in public/cup/rules.js) against what changed (U-36)`);
}
