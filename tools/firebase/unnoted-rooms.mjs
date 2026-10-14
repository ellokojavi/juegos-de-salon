#!/usr/bin/env node
/**
 * Rooms that no cleanup bucket names (D-321). The sweep only deletes the rooms noted in a
 * bucket, so a room created without its note stays in the database forever. Since D-321 the
 * app writes the room and its note together; this finds the ones that leaked before, or any
 * that a future bug lets through.
 *
 *   node tools/firebase/unnoted-rooms.mjs          lists them (read only)
 *   node tools/firebase/unnoted-rooms.mjs --fix    deletes the expired ones and notes the live
 *                                                  ones, so the sweep deletes them when they expire
 *
 * Exits with 0 when every room is noted and with 3 when it found unnoted ones (before --fix).
 * Needs the service account key (see tools/firebase/firebase-admin.mjs).
 */
import { fileURLToPath } from 'node:url';
import { IDLE_TTL, ROOM_TTL, dayOf } from '../../public/assets/js/transport/cleanup.js';

/** Expired by the same two clocks as the rules (D-89): six hours since created, half an hour idle. */
export const expired = (room, now) => now - (room?.createdAt || 0) > ROOM_TTL
  || (typeof room?.lastAt === 'number' && now - room.lastAt > IDLE_TTL);

/** The rooms of `rooms/` that no bucket of `cleanup/days` names, oldest first. */
export function unnoted(rooms, days, now) {
  const noted = new Set(Object.values(days || {}).flatMap(b => Object.keys(b?.rooms || {})));
  return Object.entries(rooms || {})
    .filter(([code]) => !noted.has(code))
    .map(([code, r]) => ({ code, game: r?.game || null, createdAt: r?.createdAt || 0, expired: expired(r, now) }))
    .sort((a, b) => a.createdAt - b.createdAt);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { token, read, write } = await import('./firebase-admin.mjs');
  const fix = process.argv.includes('--fix');
  const t = await token();
  const [rooms, days] = await Promise.all([read('rooms', t), read('cleanup/days', t)]);
  const now = Date.now();
  const found = unnoted(rooms, days, now);
  const when = ms => new Date(ms).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  console.log(`Rooms: ${Object.keys(rooms || {}).length} · not noted in any bucket: ${found.length}`);
  for (const r of found) console.log(`  ${r.code}  ${(r.game || '(no game)').padEnd(16)} created ${when(r.createdAt)} · ${r.expired ? 'expired' : 'alive'}`);
  if (!found.length) process.exit(0);
  if (!fix) { console.log('\nRun it with --fix to delete the expired ones and note the live ones.'); process.exit(3); }
  for (const r of found) {
    if (r.expired) await write(`rooms/${r.code}`, 'DELETE', undefined, t);
    // A live room goes into its day's bucket, with lastAt now: the bucket opens when it expired
    else await write(`cleanup/days/${dayOf(r.createdAt || now)}`, 'PATCH', { lastAt: { '.sv': 'timestamp' }, [`rooms/${r.code}`]: true }, t);
    console.log(`  ${r.code}: ${r.expired ? 'deleted' : 'noted'}`);
  }
}
