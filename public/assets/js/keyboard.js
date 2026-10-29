/**
 * The phone's on-screen keyboard. On iOS it does not shrink the window: it covers the bottom of it,
 * and a fixed layer anchored there (a bottom card with its Send button) ends up under it. The
 * visualViewport says how much it covers; `followKeyboard` writes that as `--kb` on a node, so its
 * CSS can lift itself by that much (the chat does the same, D-28). Without visualViewport, `--kb`
 * stays 0px and nothing moves.
 */

/** How many px of the window's bottom the keyboard covers, from a visualViewport. Pure, for node. */
export const coveredBy = (innerHeight, vv) => (vv ? Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)) : 0);

/** Keeps `--kb` on `node` up to date while the keyboard opens and closes. Returns the function that stops it. */
export function followKeyboard(node, win = globalThis.window) {
  const vv = win?.visualViewport;
  const update = () => node.style.setProperty('--kb', `${coveredBy(win.innerHeight, vv)}px`);
  update();
  if (!vv) return () => {};
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
}
