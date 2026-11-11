/**
 * The key margins of the design system (docs/DESIGN.md §3 "Margins", the owner, 2026-11-11), measured
 * on every screenshot the scripts take (`b.shot()` in cdp.mjs) and reported by `look.mjs`, like the board
 * spacing (U-11) and overlaps (U-12): every e2e script watches them on every screen it photographs.
 *
 * - **M-1 Centered column:** the app's column (`.app`) is as far from the left of the window as from the right.
 * - **M-2 Even padding:** a card (`.panel`, `.notice`, `.mode`, a sheet, a splash window or card) has the same
 *   padding on its left and its right.
 * - **M-3 Even media:** a picture or clip that opens a card (its first child) is flush with the card on
 *   top and both sides, or keeps the same gap above as on each side (rule 7, `splash/margins.mjs`).
 *
 * An element marked `data-margins-ok` (a deliberate exception, with its reason next to it) is left out.
 */
export const TOLERANCE = 1;
export const CARDS = '.panel, .notice, .mode, .hoja, .splash, .splash-item, .splash-item-cuerpo';

/** Code to evaluate in the page: JSON with one line per margin that breaks a rule. */
export const measureMargins = `(()=>{
  const T = ${TOLERANCE};
  const off = [];
  const visible = x => { const s = getComputedStyle(x), r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0; };
  const name = e => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') || e.tagName.toLowerCase();
  const skip = e => e.closest('[data-margins-ok]');
  const px = v => parseFloat(v) || 0;
  // M-1
  const app = document.querySelector('.app');
  if (app && visible(app) && !skip(app)) {
    const r = app.getBoundingClientRect(), W = document.documentElement.clientWidth;
    const l = r.left, rt = W - r.right;
    if (l >= 0 && rt >= 0 && Math.abs(l - rt) > T) off.push('M-1 ' + name(app) + ': ' + Math.round(l) + ' px left, ' + Math.round(rt) + ' px right');
  }
  // M-2
  for (const c of document.querySelectorAll(${JSON.stringify(CARDS)})) {
    if (!visible(c) || skip(c)) continue;
    const s = getComputedStyle(c), pl = px(s.paddingLeft), pr = px(s.paddingRight);
    if (Math.abs(pl - pr) > T) off.push('M-2 ' + name(c) + ': padding ' + pl + ' px left, ' + pr + ' px right');
  }
  // M-3
  for (const c of document.querySelectorAll(${JSON.stringify(CARDS)})) {
    if (!visible(c) || skip(c)) continue;
    const m = c.firstElementChild;
    if (!m || !m.matches('img, video, canvas, picture') || !visible(m) || skip(m)) continue;
    const s = getComputedStyle(c), a = m.getBoundingClientRect(), b = c.getBoundingClientRect();
    const top = a.top - b.top - px(s.borderTopWidth), left = a.left - b.left - px(s.borderLeftWidth), right = b.right - px(s.borderRightWidth) - a.right;
    if (Math.abs(left - right) > T || Math.abs(top - (left + right) / 2) > T)
      off.push('M-3 ' + name(m) + ' in ' + name(c) + ': ' + Math.round(top) + ' px above, ' + Math.round(left) + ' / ' + Math.round(right) + ' px at the sides');
  }
  return JSON.stringify(off);
})()`;
