#!/usr/bin/env node
/**
 * The nightly room sweep (D-499): the single authority that deletes expired rooms. Phones used to
 * sweep the cleanup buckets in the background (D-39); a bucket nobody reached, or older than the
 * 30 days a phone looked back, stayed forever. As administrator it reads `rooms/` and every
 * bucket of `cleanup/days` once and:
 *
 *   - sweeps every bucket of a day before today whose `lastAt` is over six hours old (ROOM_TTL),
 *     however old it is: deletes the rooms it names and the bucket;
 *   - deletes the expired rooms no bucket names and notes the live ones (what
 *     `unnoted-rooms.mjs --fix` does, D-321).
 *
 * A room is deleted only if it is expired by the two clocks of the rules (D-89): the admin key goes
 * over the rules, so the check that kept a phone from deleting a live room is made here. A code
 * noted in an old bucket and reused today by a live room is left alone, and noted in its own day.
 *
 *   node tools/firebase/room-sweep.mjs            what it would delete (read only)
 *   node tools/firebase/room-sweep.mjs --apply    deletes and notes
 *
 * Needs the service account key (see tools/firebase/firebase-admin.mjs). The room-sweep workflow
 * runs it every night.
 */
import { fileURLToPath } from 'node:url';
import { ROOM_TTL, dayOf } from '../../public/assets/js/transport/cleanup.js';
import { expired, unnoted } from './unnoted-rooms.mjs';

/**
 * What the sweep does, without touching anything: `buckets` (days to delete), `rooms` (codes to
 * delete) and `note` ({ code, day } for live rooms no bucket names), plus `kept` (codes an old
 * bucket names that a live room uses again).
 */
export function plan(rooms, days, now) {
  rooms = rooms || {};
  const today = dayOf(now);
  const buckets = [], del = new Set(), kept = [];
  for (const [day, b] of Object.entries(days || {})) {
    if (!(Number(day) < today) || !(b?.lastAt < now - ROOM_TTL)) continue;
    buckets.push(day);
    for (const code of Object.keys(b.rooms || {})) {
      if (!rooms[code]) continue; // already gone: the note is work done
      if (expired(rooms[code], now)) del.add(code); else kept.push(code);
    }
  }
  const loose = unnoted(rooms, days, now);
  for (const r of loose) if (r.expired) del.add(r.code);
  const note = loose.filter(r => !r.expired).map(r => ({ code: r.code, day: dayOf(r.createdAt || now) }));
  // A kept code whose only note is in a bucket being deleted would be left unnoted: note it again
  const left = new Set(Object.entries(days || {}).filter(([d]) => !buckets.includes(d)).flatMap(([, b]) => Object.keys(b?.rooms || {})));
  for (const code of kept) if (!left.has(code)) note.push({ code, day: dayOf(rooms[code].createdAt || now) });
  return { buckets: buckets.sort((a, b) => a - b), rooms: [...del].sort(), note, kept };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { token, read, write } = await import('./firebase-admin.mjs');
  const apply = process.argv.includes('--apply');
  const t = await token();
  const [rooms, days] = await Promise.all([read('rooms', t), read('cleanup/days', t)]);
  const now = Date.now();
  const p = plan(rooms, days, now);
  console.log(`Rooms: ${Object.keys(rooms || {}).length} · buckets: ${Object.keys(days || {}).length}`);
  console.log(`To sweep: ${p.buckets.length} buckets, ${p.rooms.length} expired rooms; to note: ${p.note.length} live rooms`
    + (p.kept.length ? `; kept (a live room reuses the code): ${p.kept.join(' ')}` : ''));
  if (!apply) { console.log('Dry run: --apply deletes and notes.'); process.exit(0); }
  for (const code of p.rooms) await write(`rooms/${code}`, 'DELETE', undefined, t);
  // A live room goes into its day's bucket with lastAt now: the bucket opens when the room expired
  for (const { code, day } of p.note) await write(`cleanup/days/${day}`, 'PATCH', { lastAt: { '.sv': 'timestamp' }, [`rooms/${code}`]: true }, t);
  for (const day of p.buckets) if (!p.note.some(n => String(n.day) === day)) await write(`cleanup/days/${day}`, 'DELETE', undefined, t);
  if (p.buckets.length) await write('cleanup', 'PATCH', { sweptDay: Math.max(...p.buckets.map(Number)) }, t);
  console.log(`Swept ${p.buckets.length} buckets and ${p.rooms.length} rooms; noted ${p.note.length}.`);
}
