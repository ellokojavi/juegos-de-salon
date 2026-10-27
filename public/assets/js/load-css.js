/**
 * Adds a stylesheet to the page once, and resolves when it has loaded (D-468): a Cup game brings its
 * own style.css when its code loads, so no page links every game's stylesheet. Waiting for `load`
 * keeps the game's first screen from showing unstyled. A failed load resolves too: the game still
 * plays. Outside a browser (the Node tests) it does nothing.
 */
const pending = new Map();

export function loadCss(url) {
  if (typeof document === 'undefined') return Promise.resolve();
  const href = new URL(url, document.baseURI).href;
  if (pending.has(href)) return pending.get(href);
  const done = new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', resolve, { once: true });
    document.head.append(link);
  });
  pending.set(href, done);
  return done;
}
