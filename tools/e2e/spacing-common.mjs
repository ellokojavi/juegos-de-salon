/**
 * The space between a board and its buttons (D-309, U-11): what every screenshot of the scripts
 * measures (`b.shot()` in cdp.mjs) and what `look.mjs` warns about on each screen. It lives in a
 * module of its own so both can share it.
 *
 * A board is any visible element with `data-tablero`. Its first button below is the closest
 * visible button (`.btn`, `button`, `a.btn`) that starts under its bottom edge and overlaps it
 * horizontally. The distance between the two must be MIN_SPACING px or more.
 */
export const MIN_SPACING = 24;

/** Code to evaluate in the page: returns JSON with the boards, their spacing and the ones that fail. */
export const measureSpacing = `(()=>{
  const visible = x => x.getClientRects().length > 0 && getComputedStyle(x).visibility !== "hidden" && x.getBoundingClientRect().height > 0;
  const root = document.querySelector('.screen.active') || document.body;
  // A board inside another (the guesses board inside a review) doesn't count: the outer one does
  const boards = [...root.querySelectorAll('[data-tablero]')].filter(t => visible(t) && !t.parentElement.closest('[data-tablero]'));
  const buttons = [...root.querySelectorAll('.btn, button, a.btn')].filter(visible);
  const rows = boards.map(t => {
    const r = t.getBoundingClientRect();
    const below = buttons
      .filter(b => !t.contains(b))
      .map(b => ({ b, q: b.getBoundingClientRect() }))
      .filter(({ q }) => q.top >= r.bottom - 1 && q.left < r.right && q.right > r.left)
      .sort((x, y) => x.q.top - y.q.top)[0];
    if (!below) return null;
    return {
      board: (t.dataset.tablero || t.className || t.tagName).toString().slice(0, 30),
      button: (below.b.textContent || below.b.className).trim().replace(/\\s+/g, ' ').slice(0, 24),
      spacing: Math.round(below.q.top - r.bottom),
    };
  }).filter(Boolean);
  return JSON.stringify(rows);
})()`;

/** The ones that fail, one line each: "board → button (12 px)". */
export const lacksSpacing = rows => rows.filter(f => f.spacing < MIN_SPACING).map(f => `${f.board} → ${f.button} (${f.spacing} px)`);
