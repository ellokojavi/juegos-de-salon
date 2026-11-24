// How the profile is used (D-615): where a visit came from, the anonymous and the named changes.
import assert from 'node:assert/strict';
import { markVia, takeVia, eventChanges, seenChange, namedChanges, pacificDate, isProfilePath, VIA_MS, FIELDS, EVENTS } from './profile-usage.js';

const mk = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const T = Date.UTC(2027, 0, 15, 6); // 2027-01-14 22:00 Pacific
{
  const s = mk();
  markVia('pill', s, T);
  assert.equal(takeVia({ sesion: s, now: T + 1000, referrer: '', host: 'x' }), 'pill');
  assert.equal(takeVia({ sesion: s, now: T + 2000, referrer: '', host: 'x' }), 'direct', 'read once');
  markVia('bubble', s, T);
  assert.equal(takeVia({ sesion: s, now: T + VIA_MS + 1, referrer: 'https://x/', host: 'x' }), 'link', 'an old mark is not the way in');
  markVia('nope', s, T);
  assert.equal(takeVia({ sesion: s, now: T, referrer: 'https://y/', host: 'x' }), 'direct', 'another site is straight in');
}
{
  const c = eventChanges(['peek', 'nope', 'visit'], T);
  assert.deepEqual(Object.keys(c), [`perfilPt/${Math.floor(Date.UTC(2027, 0, 14) / 864e5)}/peek`], 'Pacific day; only known events');
  assert.ok(EVENTS.every(e => /^[a-z0-9-]{1,24}$/.test(e)));
}
{
  const l = mk();
  const a = seenChange(l, T);
  assert.equal(Object.keys(a).length, 1);
  assert.match(Object.keys(a)[0], /^perfilIdPt\/\d{5}\/[a-z0-9]{10}$/);
  assert.deepEqual(seenChange(l, T + 3600e3), {}, 'once a day');
  assert.equal(Object.keys(seenChange(l, T + 864e5)).length, 1, 'again the next day');
}
{
  assert.equal(pacificDate(T), '2027-01-14');
  assert.deepEqual(Object.keys(namedChanges('abcd1234', ['visit', 'tab-badges', 'aw-shown'], T)), ['perfilUso/abcd1234/2027-01-14/v', 'perfilUso/abcd1234/2027-01-14/b']);
  assert.deepEqual(namedChanges('bad', ['visit'], T), {}, 'only a player id');
  assert.ok(Object.values(FIELDS).every(f => /^[vbrspowic]$/.test(f)), 'the fields the rules take');
  assert.ok(isProfilePath('/profile/') && isProfilePath('/profile') && !isProfilePath('/records/'));
}
console.log('✓ profile usage');
