// Seats in a room against real Firebase: phones that join at the same instant get different
// seats, and when one seat is left only one of two phones gets it (#850). Two Chromes on two
// origins, each joining with two transports at once; the room is disposed at the end.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each one serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const SITE_B = SITE.replace('localhost', '127.0.0.1');
const OUT = output();
const A = await launch({ dir: `${OUT}/pA`, out: OUT });
const B = await launch({ dir: `${OUT}/pB`, out: OUT });
await A.go(`${SITE}/bulls-and-cows/?test`); await B.go(`${SITE_B}/bulls-and-cows/?test`);

const LOAD = `window.__fb = window.__fb || await import('/assets/js/transport/firebase.js');`;
/** Joins `n` transports to the room at once; each answers its role or the error it got. */
const joinAll = (dev, code, names) => dev.evaluate(`(async () => {
  ${LOAD}
  window.__ts = window.__ts || [];
  const out = await Promise.allSettled(${JSON.stringify(names)}.map(name => {
    const t = __fb.createFirebaseTransport({ game: 'toque-y-fama', maxPlayers: 6 });
    __ts.push(t);
    return t.join('${code}', { name }).then(r => r.role);
  }));
  return JSON.stringify(out.map(r => r.status === 'fulfilled' ? r.value : 'error:' + r.reason?.message));
})()`).then(JSON.parse);

let failed = false;
const fail = msg => { failed = true; console.log('✗', msg); };

// A opens a room for six (seat A)
const code = await A.evaluate(`(async () => {
  ${LOAD}
  const t = __fb.createFirebaseTransport({ game: 'toque-y-fama', maxPlayers: 6 });
  window.__host = t;
  return t.create({ config: { digits: 4 }, name: 'Host' });
})()`);
console.log('room:', code);

// Four phones at the same instant, two per Chrome, for the five free seats
const [ra, rb] = await Promise.all([joinAll(A, code, ['A1', 'A2']), joinAll(B, code, ['B1', 'B2'])]);
const first = [...ra, ...rb];
console.log('four at once →', first.join(' '));
if (first.some(r => !/^[B-F]$/.test(r))) fail(`a join failed or got the host's seat: ${first}`);
if (new Set(first).size !== first.length) fail(`two phones share a seat: ${first}`);

// One seat left and two phones for it, one in each Chrome
const [la, lb] = await Promise.all([joinAll(A, code, ['A3']), joinAll(B, code, ['B3'])]);
const last = [...la, ...lb];
console.log('two for the last seat →', last.join(' '));
const seated = last.filter(r => /^[B-F]$/.test(r));
if (seated.length !== 1) fail(`expected exactly one to sit: ${last}`);
if (seated.some(r => first.includes(r))) fail(`the last seat was one already taken: ${last}`);
if (!last.some(r => r === 'error:full')) fail(`the other should hear the room is full: ${last}`);

// What the room holds: six seats, six different phones
const players = await A.evaluate(`(async () => {
  const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js');
  return JSON.stringify((await get(ref(getDatabase(), 'rooms/${code}/players'))).val());
})()`).then(JSON.parse);
const uids = Object.values(players || {}).map(p => p.uid);
console.log('seats:', Object.entries(players || {}).map(([r, p]) => `${r}=${p.name}`).join(' '));
if (uids.length !== 6 || new Set(uids).size !== 6) fail(`expected six seats with six phones: ${JSON.stringify(players)}`);
const names = Object.fromEntries(Object.entries(players || {}).map(([r, p]) => [r, p.name]));
for (const [i, r] of first.entries()) if (names[r] !== ['A1', 'A2', 'B1', 'B2'][i]) fail(`seat ${r} holds ${names[r]}, not ${['A1', 'A2', 'B1', 'B2'][i]}`);

// Everyone leaves on purpose: the room is deleted (dispose.js)
await B.evaluate(`(async () => { for (const t of __ts) await t.dispose(); return 1 })()`);
await A.evaluate(`(async () => { for (const t of __ts) await t.dispose(); await __host.dispose(); return 1 })()`);
await sleep(500);
console.log(failed ? '✗ seats: failed' : '✓ seats: every phone in its own seat');
process.exit(failed ? 1 : 0);
