// The jobs registry (D-369): every scheduled workflow is in it with the same cron, every job is
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
    assert.ok(['github', 'mac', 'app', 'hook'].includes(j.where), `${j.id}: where`);
    assert.ok(j.what && j.decisions?.length, `${j.id}: what and decisions`);
    if (j.where === 'github') assert.ok(j.workflow && j.cron, `${j.id}: workflow and cron`);
    if (j.where === 'mac') assert.ok(Number.isInteger(j.every) && j.every >= 60 && j.command?.length, `${j.id}: every and command`);
    if (j.where === 'app') assert.ok(j.task && j.cron, `${j.id}: task and cron`);
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
});

if (failed) { console.log(`❌ ${failed} failed`); process.exit(1); }
