// The part of an online match every game with rooms shares: who is in the room, the host's start,
// and the rematch offers. Written down as one machine so the four games follow the same rules:
//
//   lobby ──start (host 'A', once, enough named players)──▶ playing
//
// - A message with an id already seen is dropped (replays on reconnect).
// - `hello` names a seat in either state (a player reconnecting says hello again).
// - `start` only moves lobby → playing; a second one, or one not from the host, is ignored.
// - `rematch`: the first offer from each seat wins, so a double tap or a late echo cannot swap the code.
// What each game does while playing (its moves) stays in its own apply().

/** 'lobby' until the host starts, then 'playing'. */
export const roomPhase = M => (M.players ? 'playing' : 'lobby');

/**
 * Applies the shared messages to the match `M`.
 * Returns 'seen' (a repeat, drop it), 'handled' (it was a room message) or null (the game's to apply).
 * `onStart(msg)` lets a game copy something more from the host's start (Hangman's seed), and
 * `onHello(msg)` from a seat's hello (Julep's key for its sealed hand, D-81). A two-seat game with no
 * host start (Battleship, Bulls and Cows) leaves out `minPlayers`: it never sends `start`.
 */
export function roomMessage(M, msg, { minPlayers, onStart, onHello } = {}) {
  if (msg.id) { if (M.seen.has(msg.id)) return 'seen'; M.seen.add(msg.id); }
  switch (msg.t) {
    case 'hello': M.names[msg.from] = msg.name; onHello?.(msg); return 'handled';
    case 'start': {
      if (roomPhase(M) !== 'lobby' || msg.from !== 'A') return 'handled';
      const order = (msg.order || []).filter(r => M.names[r]);
      if (order.length >= minPlayers) { M.players = order; onStart?.(msg); }
      return 'handled';
    }
    case 'rematch': if (!M.rematch[msg.from]) M.rematch[msg.from] = msg.code || true; return 'handled';
  }
  return null;
}
