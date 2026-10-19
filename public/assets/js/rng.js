/**
 * A seeded pseudo-random generator (mulberry32): the same deck, board or day on every device. Out of
 * the Timeline engine (D-378), where it was born: La Copa's seeds and Uno al día need only this, and
 * loading the whole engine for it put Timeline in every page that shows Uno al día.
 */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
