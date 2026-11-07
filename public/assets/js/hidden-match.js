// The phases of a two-player game with something hidden (Battleship's fleet, Bulls and Cows' secret):
//
//   lobby ─both seated─▶ hide ─both committed─▶ play ─someone won─▶ reveal ─both revealed─▶ done
//
// The phase is never stored: it is worked out from the match each time, so it cannot fall out of step.
// `hide` is what each game calls its own step ('placing', 'secret').
//
// The commit and the reveal are accepted in any phase on purpose: messages are ordered by each phone's
// own clock, so a reveal can land just before the last reply it followed. Dropping it would leave the
// game stuck in 'reveal' forever; keeping it costs nothing, since a phone only sends its own.
export function hiddenPhase({ seated, committed, done, revealed }, hide) {
  if (!seated) return 'lobby';
  if (!committed) return hide;
  if (!done) return 'play';
  if (!revealed) return 'reveal';
  return 'done';
}

/** The same, read from a match that keeps `names`, `commits` and `reveals` by seat (A, B). */
export const phaseOf = (M, done, hide) => hiddenPhase({
  seated: !!(M.names.A && M.names.B),
  committed: !!(M.commits.A && M.commits.B),
  done: !!done,
  revealed: !!(M.reveals.A && M.reveals.B),
}, hide);
