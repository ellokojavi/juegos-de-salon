/**
 * Publishes at a set time what the owner would switch by hand (D-529): flags to *all* (as their
 * /labs/ card does, `flags/<id>` = { state: 'all', at }) and splash campaigns on (as the panel's
 * 📣 Campaigns does, `splash/<id>` patched with { on: true, at }). Run by the `launch` workflow,
 * which a scheduled task dispatches at the hour.
 *
 *   node tools/firebase/launch.mjs --flag stick --flag stack --splash shinobi-babel \
 *     --not-before 2026-11-02T08:00:00Z [--apply]
 *
 * Without --apply it only says what it would write. Before --not-before it writes nothing and ends
 * green, so an early run is harmless; a second run rewrites the same values.
 */
import { token, read, write, fail } from './firebase-admin.mjs';

export function parse(argv) {
  const o = { flags: [], splash: [], notBefore: null, apply: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = argv[i + 1];
    if (a === '--flag') { o.flags.push(v); i++; }
    else if (a === '--splash') { o.splash.push(v); i++; }
    else if (a === '--not-before') { o.notBefore = v; i++; }
    else if (a === '--apply') o.apply = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  const id = /^[a-z][a-z0-9-]{0,40}$/;
  for (const x of [...o.flags, ...o.splash]) if (!id.test(x || '')) throw new Error(`Not an id: ${x}`);
  if (o.notBefore && Number.isNaN(Date.parse(o.notBefore))) throw new Error(`Not a date: ${o.notBefore}`);
  if (!o.flags.length && !o.splash.length) throw new Error('Nothing to launch: give --flag or --splash');
  return o;
}

/** What to write, `[path, method, body]`, at moment `now`. */
export const plan = (o, now) => [
  ...o.flags.map(f => [`flags/${f}`, 'PUT', { state: 'all', at: now }]),
  ...o.splash.map(s => [`splash/${s}`, 'PATCH', { on: true, at: now }]),
];

if (import.meta.url === `file://${process.argv[1]}`) {
  let o;
  try { o = parse(process.argv.slice(2)); } catch (e) { fail(e.message); }
  const now = Date.now();
  if (o.notBefore && now < Date.parse(o.notBefore)) {
    console.log(`Not yet: it launches from ${o.notBefore} (now ${new Date(now).toISOString()}). Nothing written.`);
    process.exit(0);
  }
  const t = o.apply ? await token() : null;
  for (const s of o.splash) if (o.apply && !(await read(`splash/${s}`, t))) fail(`splash/${s} does not exist: create the campaign first.`);
  for (const [path, method, body] of plan(o, now)) {
    console.log(`${o.apply ? '✓' : '(dry run)'} ${method} ${path} ${JSON.stringify(body)}`);
    if (o.apply) await write(path, method, body, t);
  }
}
