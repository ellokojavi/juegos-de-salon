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

/**
 * Nothing overlaps (U-12, D-520): two buttons of the same screen never cover each other. Every
 * screenshot of the scripts checks it (`b.shot()` in cdp.mjs), like the board spacing (U-11,
 * spacing-common.mjs), and `look.mjs` reports it, so every e2e script watches it on every screen it
 * photographs and the scope rules (D-391) still decide which scripts run.
 *
 * A button is a visible `button` or `a.btn` of the active screen (or the open dialog). Floating
 * ones (position fixed or sticky: the chat bubble, a toast) float on purpose and are left out, as is
 * a button inside another one. Two overlap when they share more than MIN_OVERLAP px in both
 * directions. Only what the screenshot shows counts: a button outside the viewport, or one whose
 * centre another layer covers (under an open sheet), is left out. An element marked `data-overlap-ok` (a deliberate stack) is left out too.
 */
export const MIN_OVERLAP = 4;

/** Code to evaluate in the page: returns JSON with the pairs of buttons that overlap. */
export const measureOverlap = `(()=>{
  const root = document.querySelector('.screen.active') || document.body;
  const floating = x => { for (let e = x; e && e !== document.body; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  const visible = x => { const s = getComputedStyle(x); const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (!x.checkVisibility || x.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) && s.pointerEvents !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0 && x.closest('[aria-hidden="true"]') === null; };
  const scopes = [root, ...document.querySelectorAll('dialog[open], .confirm')].filter((x, i, a) => a.indexOf(x) === i);
  const buttons = [...new Set(scopes.flatMap(s => [...s.querySelectorAll('button, a.btn')]))]
    .filter(x => visible(x) && !floating(x) && !x.closest('[data-overlap-ok]') && !x.parentElement.closest('button, a.btn'))
    // A button under an open sheet or dialog is not on this screen: one whose own centre another
    // layer covers is left out (the sheet's buttons over the result screen's are not an overlap)
    .filter(x => { const r = x.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      // Only what the screenshot shows: a button outside the viewport cannot be hit-tested
      if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return false;
      const hit = document.elementFromPoint(cx, cy); return !hit || x.contains(hit) || hit.contains(x); });
  const label = x => (x.textContent || x.getAttribute('aria-label') || x.className || x.tagName).toString().trim().replace(/\\s+/g, ' ').slice(0, 20);
  const pairs = [];
  for (let i = 0; i < buttons.length; i++) for (let j = i + 1; j < buttons.length; j++) {
    const a = buttons[i].getBoundingClientRect(), b = buttons[j].getBoundingClientRect();
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w > ${MIN_OVERLAP} && h > ${MIN_OVERLAP}) pairs.push(label(buttons[i]) + ' × ' + label(buttons[j]) + ' (' + Math.round(w) + '×' + Math.round(h) + ' px)');
  }
  return JSON.stringify(pairs);
})()`;
