// Drift's scenery (scenery.js): the same props for everyone, none on the road, every setting complete.
// Run: node public/labs/drift/scenery.test.mjs
import assert from 'node:assert/strict';
import { buildTrack } from './engine.js';
import { TRACKS } from './tracks.js';
import { SETTINGS, SETTING_NAMES, scenery, near, seeded } from './scenery.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('✓ ' + name); };
const track = buildTrack(TRACKS.first);
const all = map => [...map.values()].flat();

ok('the three settings the plan names, each with its palette and props', () => {
  assert.deepEqual(SETTING_NAMES, ['meadow', 'forest', 'plain']);
  for (const [name, S] of Object.entries(SETTINGS)) {
    for (const k of ['ground', 'shoulder', 'road', 'shadow', 'tyre']) assert.ok(S[k], `${name}.${k}`);
    assert.ok(S.ruts || S.lines, `${name}: ruts on gravel or lines on asphalt`);
    const p = Object.values(S.props).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(p - 1) < 1e-9, `${name}: the props' shares add to 1 (${p})`);
    // Every prop kind a setting grows has its colours
    for (const kind of Object.keys(S.props)) {
      const need = { tree: 'trees', dead: 'dead', stump: 'dead', bush: 'bush', rock: 'rock', hay: 'hay' }[kind];
      assert.ok(S[need], `${name}: ${kind} needs ${need}`);
    }
  }
});

ok('the same stage and setting give the same props, on every phone', () => {
  const a = all(scenery(track, 'meadow').cells), b = all(scenery(track, 'meadow').cells);
  assert.deepEqual(a, b);
  assert.notDeepEqual(all(scenery(track, 'forest').cells).slice(0, 5), a.slice(0, 5));
  assert.equal(seeded('x')(), seeded('x')());
});

ok('no prop stands on the road or its shoulder, and there are plenty of them', () => {
  for (const name of SETTING_NAMES) {
    const props = all(scenery(track, name).cells);
    assert.ok(props.length > 300, `${name}: ${props.length} props`);
    for (const it of props) {
      let d = Infinity;
      for (const p of track.pts) d = Math.min(d, Math.hypot(p.x - it.x, p.y - it.y) - p.w / 2);
      assert.ok(d > it.r + 2.4, `${name}: a ${it.kind} ${d.toFixed(1)} m from the road`);
    }
  }
});

ok('near() returns only the cells around a point', () => {
  const { cells } = scenery(track, 'meadow');
  const p = track.pts[200], got = near(cells, p.x, p.y, 60);
  assert.ok(got.length > 0 && got.length < all(cells).length);
  for (const it of got) assert.ok(Math.abs(it.x - p.x) < 60 + 40 && Math.abs(it.y - p.y) < 60 + 40);
});

console.log(`${n} tests, all green`);
