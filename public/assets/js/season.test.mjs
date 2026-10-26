// The seasonal templates (D-457): which days each one is on, what the address forces, that each
// template's fields are well formed, and that only the navigation pages load season.js, never a game.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TEMPLATES, seasonOf, chooseSeason, within, iconUrl } from './season.js';

const day = s => new Date(`${s}T12:00:00`);
assert.equal(seasonOf(day('2026-10-25')), null);
assert.equal(seasonOf(day('2026-10-26')), 'halloween');
assert.equal(seasonOf(day('2026-10-31')), 'halloween');
assert.equal(seasonOf(day('2026-11-01')), null);
assert.equal(seasonOf(day('2027-10-28')), 'halloween', 'every year, with no PR');

// A template may cross New Year
assert.ok(within('12-31', '12-31', '01-01') && within('01-01', '12-31', '01-01'));
assert.ok(!within('01-02', '12-31', '01-01') && !within('12-30', '12-31', '01-01'));
assert.equal(seasonOf(day('2027-01-01'), { ny: { from: '12-31', to: '01-01' } }), 'ny');

const oct = day('2026-10-28'), may = day('2026-05-05');
assert.equal(chooseSeason({ search: '', date: oct }).id, 'halloween');
assert.equal(chooseSeason({ search: '', date: oct }).lab, !TEMPLATES.halloween.public);
assert.equal(chooseSeason({ search: '', date: may }), null);
assert.equal(chooseSeason({ search: '?test', date: oct }), null, '?test keeps the scripts and screenshots as always');
assert.equal(chooseSeason({ search: '?season=off', date: oct }), null);
assert.deepEqual(chooseSeason({ search: '?test&season=halloween', date: may }), { id: 'halloween', lab: !TEMPLATES.halloween.public, forced: true });
assert.equal(chooseSeason({ search: '?season=nope', date: may }), null);

assert.match(decodeURIComponent(iconUrl({ emoji: '🎃', colors: ['#000', '#fff'] })), /^data:image\/svg\+xml,<svg .*🎃/);

const emojis = (id, f, list) => assert.ok(Array.isArray(list) && list.length && list.every(e => typeof e === 'string' && e), `${id}.${f}: a list of emojis`);
const days = Object.keys(TEMPLATES).map(id => [id, TEMPLATES[id]]);
for (const [id, t] of days) {
  assert.match(id, /^[a-z0-9-]+$/, `${id}: the id goes in a class and a URL`);
  for (const f of ['from', 'to']) assert.match(t[f], /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, `${id}.${f} is MM-DD`);
  assert.equal(typeof t.public, 'boolean', `${id}.public: true or false`);
  if (t.css) assert.ok(existsSync(fileURLToPath(t.css)), `${id}: ${t.css} is missing`);
  if (t.icon) { assert.ok(t.icon.emoji && t.icon.colors?.length === 2, `${id}.icon: { emoji, colors: [a, b] }`); }
  for (const f of ['hero', 'motes']) if (t[f]) emojis(id, f, t[f]);
  if (t.peek) assert.ok(t.peek.emoji && t.peek.chance > 0 && t.peek.chance <= 1, `${id}.peek: { emoji, chance }`);
  if (t.corner) assert.ok(t.css && readFileSync(fileURLToPath(t.css), 'utf8').includes('.season-corner'), `${id}.corner: its css draws .season-corner`);
}
// Two templates never share a day: one would hide the other
for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
  const md = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const on = days.filter(([, t]) => within(md, t.from, t.to)).map(([id]) => id);
  assert.ok(on.length <= 1, `${md}: ${on.join(' and ')} overlap`);
}

// Only the pages players move around in: the games look the same all year (the owner's call)
const site = new URL('../../', import.meta.url);
for (const page of ['index.html', 'records/index.html']) assert.match(readFileSync(new URL(page, site), 'utf8'), /season\.js/, `${page} should load season.js`);
for (const shared of ['ui.js', 'i18n.js', 'sound.js', 'fin.js']) assert.doesNotMatch(readFileSync(new URL(shared, import.meta.url), 'utf8'), /season\.js/, `${shared} is loaded by the games: season.js does not go there`);
// start() runs while the module loads, and a public template reaches decorate() with no await on
// the way: every top-level const it uses must be declared before `season` (D-457: on launch day
// it threw "Cannot access 'deco' before initialization" and only the palette showed).
const engine = readFileSync(new URL('season.js', import.meta.url), 'utf8');
const startsAt = engine.indexOf('export const season');
for (const [, name] of engine.matchAll(/^const (\w+)/gm)) assert.ok(engine.indexOf(`const ${name}`) < startsAt, `season.js: const ${name} is declared after \`season = start()\``);
console.log(`✓ seasons: ${Object.keys(TEMPLATES).join(', ')}`);
