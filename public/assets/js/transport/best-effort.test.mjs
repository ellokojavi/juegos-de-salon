// Run: node public/assets/js/transport/best-effort.test.mjs
// Also scans firebase.js: a write nobody awaits must go through quiet() or message() (D-320).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { message, quiet } from './best-effort.js';

const unhandled = [];
process.on('unhandledRejection', e => { unhandled.push(e); });
const warned = [];
console.warn = (...a) => { warned.push(a.join(' ')); };
const settle = () => new Promise(r => setTimeout(r, 20));
const denied = () => Object.assign(new Error('PERMISSION_DENIED: Permission denied'), { code: 'PERMISSION_DENIED' });

/* The 2026-10-14 case: the SDK resends a message the server already has, the rules deny it */
{
  warned.length = 0;
  const p = Promise.reject(denied());
  assert.equal(message(p, async () => true), p, 'returns the same promise');
  await settle();
  assert.deepEqual(unhandled, [], 'no unhandled rejection');
  assert.deepEqual(warned, [], 'a resend of a message that is in the room is not reported');
}

/* Denied and not in the room: a real failure, logged but not left unhandled */
{
  warned.length = 0;
  message(Promise.reject(denied()), async () => false);
  await settle();
  assert.deepEqual(unhandled, []);
  assert.equal(warned.length, 1);
}

/* Reading it back fails too: logged, still handled */
{
  warned.length = 0;
  message(Promise.reject(denied()), async () => { throw new Error('offline'); });
  await settle();
  assert.deepEqual(unhandled, []);
  assert.equal(warned.length, 1);
}

/* Another error: logged without reading back */
{
  warned.length = 0;
  let read = false;
  message(Promise.reject(new Error('network')), async () => { read = true; return true; });
  await settle();
  assert.equal(read, false);
  assert.equal(warned.length, 1);
}

/* A caller that awaits still sees the error */
{
  const p = message(Promise.reject(denied()), async () => true);
  await assert.rejects(p, /PERMISSION_DENIED/);
}

/* quiet: a presence write on a room that expired */
{
  warned.length = 0;
  quiet(Promise.reject(denied()), 'presence');
  await settle();
  assert.deepEqual(unhandled, []);
  assert.match(warned[0], /presence/);
  assert.equal(quiet(undefined), undefined, 'tolerates a non-promise');
}

/* Success: nothing logged */
{
  warned.length = 0;
  await message(Promise.resolve('ok'), async () => true);
  await quiet(Promise.resolve());
  await settle();
  assert.deepEqual(warned, []);
}

/**
 * The transport: every Firebase write or read whose result nobody awaits has to be wrapped,
 * otherwise a denied write becomes an unhandled rejection on the Health panel. A call is fine
 * when it is awaited, returned, wrapped (quiet, message, withTimeout), the body of an arrow
 * function (whoever calls it gets the promise), assigned to `p` and handed to message(), or
 * followed by `.catch(` on the same line.
 */
export function bareWrites(src) {
  const out = [];
  const call = /\b(set|update|push|get)\((?:ref\(|meRef|roomRef)|\bonDisconnect\([^)]*\)\.(?:update|set|remove)\(/g;
  src.split('\n').forEach((line, i) => {
    if (/^\s*(\*|\/\/|import\b)/.test(line)) return;
    for (const m of line.matchAll(call)) {
      const before = line.slice(0, m.index);
      const after = line.slice(m.index);
      const ok = /(?:await|return|quiet\(|message\(|withTimeout\(|=>|const p =)\s*\(?$/.test(before) || /\.catch\(/.test(after);
      if (!ok) out.push(`${i + 1}: ${line.trim()}`);
    }
  });
  return out;
}

{
  const src = readFileSync(new URL('./firebase.js', import.meta.url), 'utf8');
  assert.deepEqual(bareWrites(src), [], 'firebase.js: wrap these writes with quiet() or message() (D-320)');
  // The check itself catches what got through before D-320
  assert.equal(bareWrites('      onDisconnect(meRef).update({ online: false });').length, 1);
  assert.equal(bareWrites('  s => { if (s.val()) { update(meRef, { online: true }); } }').length, 1);
  assert.equal(bareWrites('        get(ref(d, `rooms/${code}/createdAt`)).then(snap => {').length, 1);
  assert.equal(bareWrites('      return push(ref(d, path), msg);').length, 0);
  assert.equal(bareWrites('      await set(meRef, { name });').length, 0);
}

await settle();
assert.deepEqual(unhandled, [], 'no unhandled rejection in the whole run');
console.log('ok best-effort');
