// A notify.mjs round (D-224) against a fake database and push service: it records what was
// delivered, deletes the dead subscriptions and cleans the old cups. Usage: node tools/push/notify.test.mjs
import assert from 'node:assert/strict';
import { round } from './notify.mjs';
import { nuevaMeta } from '../../public/cup/engine.js';

let n = 0;
const test = async (name, fn) => { try { await fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };
const HOUR = 3600e3;
const TZ = 'America/Santiago';
const meta = nuevaMeta({ nombre: 'Los Primos', dias: 7, inicio: '2026-10-12', tz: TZ, admin: 'aaaaaa', creada: 1 });
const S1 = 'a'.repeat(32), S2 = 'b'.repeat(32);

function base() {
  const data = {
    torneos: {
      KQRST: { meta, players: { aaaaaa: { name: 'Ana', at: 1 }, bbbbbb: { name: 'Beto', at: 2 } } },
      VIEJA: { meta: { ...meta, end: meta.end - 30 * 24 * HOUR } },
    },
    pushCopa: {
      KQRST: { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } }, bbbbbb: { [S2]: { dia: true, plazo: true, at: 0 } } },
      VIEJA: { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } } },
      BORRADA: { aaaaaa: { [S1]: { dia: true, plazo: true, at: 0 } } },
    },
    push: { [S1]: { endpoint: 'https://fcm.googleapis.com/x', lang: 'es', tz: TZ }, [S2]: { endpoint: 'https://web.push.apple.com/y', lang: 'es', tz: TZ } },
    pushEnviados: {},
  };
  const changes = [];
  return {
    data, changes,
    read: async path => path.split('/').reduce((o, k) => o?.[k], data) ?? null,
    update: async c => { changes.push(c); },
  };
}
const now = meta.win[2].a + 10 * HOUR;

await test('sends what is due and records what was delivered', async () => {
  const db = base();
  const sentOut = [];
  const r = await round({ db, now, log: () => {}, deliver: async (sub, notification) => { sentOut.push([sub.endpoint, notification.body]); return { status: 201 }; } });
  assert.equal(r.notifications, 2);
  assert.equal(r.delivered, 2);
  assert.equal(sentOut.length, 2);
  const c = db.changes[0];
  assert.equal(c[`pushEnviados/KQRST/${S1}/dia:2`], now);
  assert.equal(c[`pushEnviados/KQRST/${S2}/dia:2`], now);
  // What the dashboard looks at (D-233)
  const day = Math.floor(now / (24 * HOUR));
  assert.deepEqual(c[`stats/prod/days/${day}/mandados/dia`], { '.sv': { increment: 2 } });
  assert.equal(c['stats/prod/push/vuelta'], now);
  assert.equal(c['stats/prod/push/vivas'], 2);
  assert.equal(c['stats/prod/push/torneos'], 1);
});

await test('new days of two cups for one phone: one notification, recorded in both (D-229)', async () => {
  const db = base();
  db.data.torneos.MNPQR = { meta: { ...meta, name: 'La Oficina' }, players: { cccccc: { name: 'Ana', at: 1 } } };
  db.data.pushCopa.MNPQR = { cccccc: { [S1]: { dia: true, plazo: true, at: 0 } } };
  const sentOut = [];
  const r = await round({ db, now, log: () => {}, deliver: async (sub, notification) => { sentOut.push([sub.endpoint, notification.body]); return { status: 201 }; } });
  assert.equal(r.notifications, 2, 'Ana, one with both cups; Beto, his own');
  assert.ok(sentOut.some(([e, b]) => /fcm/.test(e) && b === '🎲 Tienes un día nuevo en 2 copas: Los Primos y La Oficina.'));
  const c = db.changes[0];
  assert.equal(c[`pushEnviados/KQRST/${S1}/dia:2`], now);
  assert.equal(c[`pushEnviados/MNPQR/${S1}/dia:2`], now);
});

await test('cleans the cups that ended more than a week ago or no longer exist', async () => {
  const db = base();
  const r = await round({ db, now, log: () => {}, deliver: async () => ({ status: 201 }) });
  assert.equal(r.cleaned, 2);
  const c = db.changes[0];
  for (const code of ['VIEJA', 'BORRADA']) { assert.equal(c[`pushCopa/${code}`], null); assert.equal(c[`pushEnviados/${code}`], null); }
  assert.ok(!(`pushCopa/KQRST` in c));
});

await test('a dead subscription is deleted with its cups; a passing failure is not recorded', async () => {
  const db = base();
  const r = await round({ db, now, log: () => {}, deliver: async sub => (sub.endpoint.includes('apple') ? { status: 410, dead: true } : { status: 429, text: 'slow' }) });
  assert.deepEqual([r.dead, r.failures, r.delivered], [1, 1, 0]);
  const c = db.changes[0];
  assert.equal(c[`push/${S2}`], null);
  assert.equal(c[`pushCopa/KQRST/bbbbbb/${S2}`], null);
  assert.ok(!(`push/${S1}` in c), 'the 429 one stays');
  assert.ok(!Object.keys(c).some(k => k.startsWith('pushEnviados/KQRST/')), 'what was not delivered is tried again');
});

await test('--dry-run neither sends nor records', async () => {
  const db = base();
  const lines = [];
  const r = await round({ db, now, dryRun: true, log: l => lines.push(l), deliver: async () => { throw new Error('it should not send'); } });
  assert.equal(r.notifications, 2);
  assert.equal(db.changes.length, 0);
  assert.ok(lines.every(l => l.startsWith('· would send')));
});

await test('what was already sent is not repeated in the next round', async () => {
  const db = base();
  await round({ db, now, log: () => {}, deliver: async () => ({ status: 201 }) });
  for (const [k, v] of Object.entries(db.changes[0])) {
    if (!k.startsWith('pushEnviados/KQRST/')) continue;
    const [, code, sub, key] = k.split('/');
    ((db.data.pushEnviados[code] ||= {})[sub] ||= {})[key] = v;
  }
  const r = await round({ db, now: now + 15 * 60e3, log: () => {}, deliver: async () => ({ status: 201 }) });
  assert.equal(r.notifications, 0);
});

await test('--test: only that cup, to each phone, without recording or cleaning (except the signals)', async () => {
  const db = base();
  const sentOut = [];
  const r = await round({ db, now: meta.win[2].a + 3 * HOUR, testCode: 'KQRST', log: () => {}, deliver: async (sub, notification) => { sentOut.push(notification.body); return { status: 201 }; } });
  assert.deepEqual([r.notifications, r.delivered, r.cleaned], [2, 2, 0]);
  assert.deepEqual(sentOut, ['Así se verán los avisos de esta copa.', 'Así se verán los avisos de esta copa.']);
  // Only the dashboard's signals (D-233): nothing in pushEnviados nor cleanups
  assert.deepEqual(Object.keys(db.changes[0]).filter(k => !k.startsWith('stats/')), []);
  assert.deepEqual(Object.values(db.changes[0]).find(v => v?.['.sv']), { '.sv': { increment: 2 } });
});

await test('--dry-run writes nothing, not even the signals', async () => {
  const db = base();
  await round({ db, now, dryRun: true, log: () => {}, deliver: async () => ({ status: 201 }) });
  assert.equal(db.changes.length, 0);
});

await test("One a Day: sends today's, records it and deletes a gone subscription's data", async () => {
  const db = base();
  const { numDia } = await import('../../public/assets/js/uno-al-dia.js');
  const t = Date.parse('2026-10-07T13:10:00Z');   // 10:10 in Santiago
  const n = numDia('2026-10-07');
  db.data.pushDia = { [S1]: { h: 9, d: true, r: true, w: true, u: n - 1, c: 3, k: 0, m: 3, at: 0 }, ['c'.repeat(32)]: { h: 9, at: 0 } };
  db.data.pushEnviadosDia = {};
  const sentOut = [];
  await round({ db, now: t, log: () => {}, deliver: async (sub, notification) => { sentOut.push(notification.body); return { status: 201 }; } });
  assert.ok(sentOut.some(b => /Uno al día n\.° \d+ ya está\. 🔥 Racha: 3 días\./.test(b)), sentOut.join(' | '));
  const c = Object.assign({}, ...db.changes);
  assert.equal(c[`pushEnviadosDia/${S1}/dia:${n}`], t);
  assert.equal(c[`pushDia/${'c'.repeat(32)}`], null);
  assert.equal(c[`stats/prod/days/${Math.floor(t / 864e5)}/mandados/uaddia`]?.['.sv']?.increment, 1);
});

console.log(`notify: ${n} cases green`);
