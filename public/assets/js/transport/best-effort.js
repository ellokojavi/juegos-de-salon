/**
 * Room writes nobody waits for (D-320).
 *
 * The games fire `transport.send()` and the presence writes and move on: none of them awaits the
 * promise. A rejection there used to end up as an unhandled rejection, which the vigía counts as
 * a failure on the Health panel even when nothing went wrong for the player.
 *
 * The usual case is a resend. When the connection drops before the server's ack arrives, the
 * Firebase SDK sends every write still waiting for one again after reconnecting, even if the
 * server already applied it. `rooms/<CODE>/messages/<id>` can only be written once (the room is
 * append-only), so the resend is denied with PERMISSION_DENIED although the message is already
 * in the room. That happened on 2026-10-14 in Batalla Naval: a phone locked right after sending
 * its fleet, and on waking up the SDK sent the same message again.
 *
 * Kept free of Firebase imports so node can test it.
 */

const denied = e => /PERMISSION_DENIED|permission_denied/i.test(String(e?.code || '') + ' ' + String(e?.message || ''));

/** A write that may fail without consequence: the rejection is logged, never left unhandled. */
export function quiet(p, what = 'write') {
  if (p && typeof p.catch === 'function') p.catch(e => { console.warn(`[room] ${what} failed:`, e?.message || e); });
  return p;
}

/**
 * A room message. A denied write whose message is already on the server (`exists` reads it back)
 * is a resend after a reconnect: it went through the first time, so it is not reported. Any other
 * failure is a move that really didn't get through: it is raised again, unhandled, so the vigía
 * still counts it on the Health panel. The same promise is returned, so a caller that does await
 * it sees the error too.
 */
export function message(p, exists) {
  if (p && typeof p.catch === 'function') {
    p.catch(async e => {
      if (denied(e)) {
        let there = false;
        try { there = await exists(); } catch (_) { /* can't tell: report it */ }
        if (there) return;
      }
      throw e;
    });
  }
  return p;
}
