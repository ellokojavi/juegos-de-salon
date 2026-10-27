/**
 * Taking a seat in a room: one phone per seat, even when two join at the same instant.
 *
 * A seat is `rooms/<CODE>/players/<ROLE>: { name, online, uid }`, and `uid` names the phone
 * (the transport instance) that holds it. A seat is taken with a transaction: the server only
 * accepts the write if the seat is still as this phone last saw it, so of two phones joining
 * together exactly one gets it, and the other moves on to the next free seat.
 *
 * The write that resumes a seat after a reload is not here: the page that comes back is a new
 * transport with a new `uid`, and its saved session (`previousRole`) is what says the seat is
 * its own. That is why the rules cannot require the stored `uid` to match (firebase/README.md).
 *
 * Everything goes through `api` so this can be tested with node, without Firebase:
 *   { transact(path, update) → Promise<{ committed, value }> }
 * where `update(current)` returns the new value, or `undefined` to leave it as it is.
 */

/** The transaction's update: write this phone's seat unless another phone holds it. */
export function seatUpdate({ uid, name }) {
  return current => {
    if (current && current.uid !== uid) return undefined;   // someone else's: leave it
    return { name, online: true, uid };
  };
}

/**
 * Takes the first free seat of `candidates` and returns its role. Throws `full` if another phone
 * got every one of them first.
 */
export async function claimSeat(api, code, candidates, me) {
  for (const role of candidates) {
    const { committed, value } = await api.transact(`rooms/${code}/players/${role}`, seatUpdate(me));
    if (committed && value?.uid === me.uid) return role;
  }
  throw new Error('full');
}
