// The jobs registry (D-365): every scheduled workflow is in it with the same cron, every job is
// well formed, and the launchd plist is what launchd expects.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { jobs, plist, LABEL } from './jobs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const list = jobs();
let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`✓ ${name}`); } catch (e) { failed++; console.log(`✗ ${name}: ${e.message}`); } };

check('ids are unique and kebab-case', () => {
  assert.equal(new Set(list.map(j => j.id)).size, list.length);
  for (const j of list) assert.match(j.id, /^[a-z0-9-]+$/, j.id);
});

check('each job says where, what and why', () => {
  for (const j of list) {
    assert.ok(['github', 'mac', 'hook'].includes(j.where), `${j.id}: where`);
    assert.ok(j.what && j.decisions?.length, `${j.id}: what and decisions`);
    if (j.where === 'github') assert.ok(j.workflow && j.cron, `${j.id}: workflow and cron`);
    if (j.where === 'mac') assert.ok(((Number.isInteger(j.every) && j.every >= 60) !== !!j.at) && j.command?.length, `${j.id}: every or at, and command`);
    if (j.at) assert.ok(Number.isInteger(j.at.hour) && Number.isInteger(j.at.minute), `${j.id}: at.hour and at.minute`);
    if (j.where === 'hook') assert.ok(j.trigger, `${j.id}: trigger`);
  }
});

check('every scheduled workflow is in the registry, with its cron', () => {
  const dir = join(ROOT, '.github/workflows');
  for (const f of readdirSync(dir).filter(f => f.endsWith('.yml'))) {
    const crons = [...readFileSync(join(dir, f), 'utf8').matchAll(/^\s*- cron: '([^']+)'/gm)].map(m => m[1]);
    if (!crons.length) continue;
    const j = list.find(x => x.workflow === f);
    assert.ok(j, `${f} is scheduled but not in tools/jobs/jobs.json`);
    assert.deepEqual([j.cron], crons, `${f}: cron`);
  }
  for (const j of list.filter(x => x.where === 'github')) assert.ok(existsSync(join(dir, j.workflow)), j.workflow);
});

check('mac jobs run a script that exists', () => {
  for (const j of list.filter(x => x.where === 'mac')) {
    const script = j.command.find(a => /\.(mjs|js|py|sh)$/.test(a));
    assert.ok(script && existsSync(join(ROOT, script)), `${j.id}: ${script}`);
  }
});

check('the plist runs the job through jobs.mjs run, from the main folder', () => {
  const p = plist({ id: 'x', every: 300 }, { repo: '/r', node: '/n/node', path: '/n:/bin' });
  assert.match(p, new RegExp(`<string>${LABEL('x')}</string>`));
  assert.match(p, /<string>\/n\/node<\/string><string>\/r\/tools\/jobs\/jobs.mjs<\/string><string>run<\/string><string>x<\/string>/);
  assert.match(p, /<key>StartInterval<\/key><integer>300<\/integer>/);
  assert.match(p, /<key>WorkingDirectory<\/key><string>\/r<\/string>/);
  const at = plist({ id: 'y', at: { weekday: 0, hour: 8, minute: 0 } }, { repo: '/r', node: '/n/node', path: '/n:/bin' });
  assert.match(at, /<key>StartCalendarInterval<\/key>\s*<dict><key>Hour<\/key><integer>8<\/integer><key>Minute<\/key><integer>0<\/integer><key>Weekday<\/key><integer>0<\/integer><\/dict>/);
  assert.doesNotMatch(at, /RunAtLoad/);
});

check('Claude jobs keep their prompt in the repo, and it names only files that exist (D-440, D-451)', () => {
  for (const j of list.filter(x => x.command?.includes('tools/jobs/claude-task.mjs'))) {
    j.prompt = j.command.at(-1);
    assert.ok(existsSync(join(ROOT, j.prompt)), `${j.id}: prompt ${j.prompt} is missing`);
    // The paths it names in backticks, like `.claude/agents/processes.md`: in October 2026 the old
    // tasks kept naming procesos.md after it was renamed, and the round stopped without a word
    const text = readFileSync(join(ROOT, j.prompt), 'utf8');
    for (const [, path] of text.matchAll(/`((?:\.claude|tools|docs|\.github)\/[^`\s<>*]+\.(?:mjs|md|json|py|yml))`/g))
      assert.ok(existsSync(join(ROOT, path)), `${j.prompt} names ${path}, which does not exist`);
  }
});

if (failed) { console.log(`❌ ${failed} failed`); process.exit(1); }
