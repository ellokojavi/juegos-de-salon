#!/usr/bin/env node
/**
 * Is anyone playing right now? Live rooms and running cups, read from Firebase as administrator
 * (read only). It helps decide when to merge to main without cutting anyone's game short.
 *
 *   node tools/firebase/in-progress.mjs            the summary
 *   node tools/firebase/in-progress.mjs --all      also the abandoned rooms and the finished cups
 *   node tools/firebase/in-progress.mjs --json     as is, to process it
 *
 * Exits with 0 if nothing is being played and with 3 if something is (1 and 2 are left for errors).
 * Needs the service account key (see tools/firebase/firebase-admin.mjs).
 */
import { token, read } from './firebase-admin.mjs';
import { GAMES } from '../../public/assets/js/games.js';
import { IDLE_TTL, ROOM_TTL } from '../../public/assets/js/transport/cleanup.js';
import { diaActual, juegoDelDia, terminada, inscripcionAbierta } from '../../public/cup/engine.js';
import { JUEGOS_COPA } from '../../public/cup/rules.js';

/** A room with a move less than this long ago counts as a live game; longer, as a pause. */
const PLAYING_MS = 5 * 60 * 1000;

const args = process.argv.slice(2);
const all = args.includes('--all') || args.includes('--todo'); // --todo: the name from before D-316
const t = await token();
// `torneos` is the Firebase path (persisted, D-316 section 6)
const [rooms, cupsData] = await Promise.all([read('rooms', t), read('torneos', t)]);
const now = Date.now();

const ago = ms => {
  const m = Math.round((now - ms) / 60000);
  if (m < 1) return 'just now';
  if (m < 90) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
};
// The cup's last day in its own zone: `end` is the midnight at which it already finished.
const lastDay = (end, tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(end - 1));
const gameName = id => GAMES.find(g => g.id === id)?.name.es || id || '(no game)';

// Rooms: alive while the cleanup cannot delete them (same count as cleanup.js and the rules).
const roomList = Object.entries(rooms || {}).map(([code, r]) => {
  const last = r.lastAt || r.createdAt || 0;
  const present = Object.values(r.players || {}).filter(p => !p.left);
  const dead = !present.length || now - (r.createdAt || 0) > ROOM_TTL || now - last > IDLE_TTL;
  const status = dead ? 'abandoned' : now - last < PLAYING_MS ? 'playing' : 'paused';
  return { code, game: r.game, status, last, players: present.length, online: present.filter(p => p.online).length };
}).sort((a, b) => b.last - a.last);

// Cups: running until the last day ends, even if nobody has played yet today.
const cups = Object.entries(cupsData || {}).filter(([, x]) => x.meta?.win).map(([code, x]) => {
  const m = x.meta;
  const day = diaActual(m, now);
  const today = day >= 1 && day <= m.days ? juegoDelDia(m, day) : null;
  const players = Object.values(x.players || {}).filter(p => !p.out);
  const done = Object.keys(x.results?.[day] || {}).length;
  const stamps = Object.values(x.results || {}).flatMap(d => Object.values(d || {}).map(r => r?.at || 0));
  return {
    code, name: m.name, alias: m.alias || null, test: !!m.lab, days: m.days, day,
    status: terminada(m, now) ? 'finished' : day === 0 ? 'not started' : 'running',
    today, todayName: today ? JUEGOS_COPA[today]?.nombre || today : null,
    players: players.length, playedToday: done, registration: inscripcionAbierta(m, now),
    ends: m.end, tz: m.tz, lastResult: Math.max(0, ...stamps) || null,
  };
}).sort((a, b) => a.ends - b.ends);

const liveRooms = roomList.filter(s => s.status !== 'abandoned');
const liveCups = cups.filter(c => c.status !== 'finished');
const anything = liveRooms.length + liveCups.length > 0;

if (args.includes('--json')) {
  console.log(JSON.stringify({ now, rooms: all ? roomList : liveRooms, cups: all ? cups : liveCups }, null, 2));
  process.exit(anything ? 3 : 0);
}

const shownRooms = all ? roomList : liveRooms;
const asleep = roomList.length - liveRooms.length;
console.log(`Live rooms: ${liveRooms.length}${asleep && !all ? ` (and ${asleep} abandoned one(s) the cleanup will delete)` : ''}`);
for (const s of shownRooms) {
  console.log(`  ${s.code}  ${gameName(s.game).padEnd(16)} ${s.status.padEnd(10)} last move ${ago(s.last)} · ${s.players} player(s), ${s.online} online`);
}

const shownCups = all ? cups : liveCups;
const past = cups.length - liveCups.length;
console.log(`\nRunning cups: ${liveCups.length}${past && !all ? ` (and ${past} finished)` : ''}`);
for (const c of shownCups) {
  const when = c.status === 'running' ? `day ${c.day} of ${c.days}: ${c.todayName}, ${c.playedToday} of ${c.players} played` : c.status;
  console.log(`  ${c.code}  ${c.name}${c.test ? ' · lab' : ''}${c.alias ? ` · /${c.alias}` : ''}`);
  console.log(`         ${when} · last day ${lastDay(c.ends, c.tz)} (${c.tz}) · last result ${c.lastResult ? ago(c.lastResult) : 'none'}${c.registration && c.status !== 'finished' ? ' · registration open' : ''}`);
}

console.log(`\n${anything ? '⚠ People are playing: merging to main changes their app mid-game.' : '✓ Nothing is being played.'}`);
process.exit(anything ? 3 : 0);
