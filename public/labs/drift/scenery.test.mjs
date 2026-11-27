// Drift's scenery (scenery.js): the same props for everyone, none on the road, every setting complete.
// Run: node public/labs/drift/scenery.test.mjs
import assert from 'node:assert/strict';
import { buildTrack, newGame, step, autopilot } from './engine.js';
import { TRACKS } from './tracks.js';
import { SETTINGS, SETTING_NAMES, scenery, near, seeded, people, solids } from './scenery.js';

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
  // The trees change with the setting; the people do not
  const nature = list => list.filter(it => it.kind !== 'fan' && it.kind !== 'bale').slice(0, 5);
  assert.notDeepEqual(nature(all(scenery(track, 'forest').cells)), nature(a));
  assert.equal(seeded('x')(), seeded('x')());
});

ok('no prop stands on the road, its forks or their shoulders, and there are plenty of them', () => {
  for (const name of SETTING_NAMES) {
    const props = all(scenery(track, name).cells);
    assert.ok(props.length > 300, `${name}: ${props.length} props`);
    for (const it of props) {
      let d = Infinity;
      for (const p of [track.pts, ...track.branches.map(b => b.pts)].flat()) d = Math.min(d, Math.hypot(p.x - it.x, p.y - it.y) - p.w / 2);
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

ok('people: a grandstand by the start and the finish, a crowd behind bales on the outside of every tight bend', () => {
  for (const id of ['first', 'split', 'rain']) {
    const t = buildTrack(TRACKS[id]), { stands, crowd } = people(t);
    assert.equal(stands.length, 2, `${id}: two grandstands`);
    const fans = crowd.filter(c => c.kind === 'fan'), bales = crowd.filter(c => c.kind === 'bale');
    assert.ok(fans.length >= 30 && bales.length >= 15, `${id}: ${fans.length} fans, ${bales.length} bales`);
    const road = [t.pts, ...t.branches.map(b => b.pts)].flat();
    const fromRoad = it => Math.min(...road.map(p => Math.hypot(p.x - it.x, p.y - it.y) - p.w / 2));
    // Nobody on the road, and the bales stand nearer to it than the people behind them
    const nearestFan = Math.min(...fans.map(fromRoad)), farthestBale = Math.max(...bales.map(fromRoad));
    assert.ok(nearestFan > 4.4, `${id}: a fan ${nearestFan.toFixed(1)} m from the road`);
    assert.ok(Math.min(...bales.map(fromRoad)) > 3, `${id}: a bale on the shoulder`);
    assert.ok(farthestBale < 7, `${id}: a bale ${farthestBale.toFixed(1)} m out`);
    // The grandstands and the bales are solid; the people are not
    const solid = solids(scenery(t, 'meadow'));
    for (const st of stands) assert.ok(solid.some(o => Math.hypot(o.x - st.x, o.y - st.y) < 1), `${id}: a grandstand the car can hit`);
    assert.ok(!solid.some(o => fans.some(f => f.x === o.x && f.y === o.y)), `${id}: a fan is solid`);
    // The autopilot drives it with every solid in place, the bales and grandstands too, and hits none of them
    t.solids = solid;
    const run = (() => { const r = newGame({ track: t }); while (r.mode !== 'done') { step(r, autopilot(r)); r.events.length = 0; } return r; })();
    assert.equal(run.lives, 10, `${id}: the autopilot crashed`); assert.equal(run.missed, 0, `${id}: a missed gate`);
    // No tree grows in a grandstand
    const trees = all(scenery(t, 'meadow').cells).filter(it => it.kind === 'tree');
    for (const st of stands) assert.ok(trees.every(it => Math.hypot(it.x - st.x, it.y - st.y) > st.len / 2), `${id}: a tree in a grandstand`);
  }
});

console.log(`${n} tests, all green`);
