/**
 * Swipe between games (flag `game-swipe`, the owner's request 2026-11-14): on a game's cover, a swipe to
 * the left opens the next game of the list the player came from, and a swipe to the right the previous
 * one, so trying games is one gesture. The list is the one that was on screen: the home page keeps the
 * cards it was showing (its filter and search included) when one is tapped (`rememberList`), in that
 * order, and the cover reads it back. Without a list, or on a page that is not in it, nothing happens.
 *
 * Only on the cover: the same test as the share button (cover-share.js), so a game in progress keeps
 * its own gestures. A swipe that starts on a field, a board or anything that scrolls sideways is the
 * page's, not ours. Two small tabs at the screen's edges say where each side goes, and a tap on them
 * does the same as the swipe.
 */
import { el } from './ui.js';
import { getLang, COMMON, pickLang } from './i18n.js';

export const LIST_KEY = 'juegos-de-salon:swipe-list';
/** A list older than this is from another visit: the cover ignores it. */
export const LIST_MS = 6 * 60 * 60 * 1000;
/** How far and how flat a swipe must be: a scroll or a tap is not one. */
export const MIN_DX = 70, MAX_MS = 700;

const clean = p => String(p || '').replace(/index\.html$/, '').replace(/\/?$/, '/');

/** Keeps the list of games on screen, as their paths in order, for the cover to swipe through. */
export function rememberList(paths, { from = '/', store = globalThis.sessionStorage, now = Date.now() } = {}) {
  try { store?.setItem(LIST_KEY, JSON.stringify({ from, paths: paths.map(p => clean(new URL(p, globalThis.location?.href || 'https://x/').pathname)), at: now })); } catch (_) { /* best effort */ }
}

/** The previous and next game of this page in the kept list, wrapping around, or null without one. */
export function neighbours(pathname = globalThis.location?.pathname, { store = globalThis.sessionStorage, now = Date.now() } = {}) {
  try {
    const v = JSON.parse(store?.getItem(LIST_KEY) || 'null');
    if (!v || !Array.isArray(v.paths) || v.paths.length < 2 || !(now - v.at < LIST_MS)) return null;
    const i = v.paths.indexOf(clean(pathname));
    if (i < 0) return null;
    const n = v.paths.length;
    return { prev: v.paths[(i - 1 + n) % n], next: v.paths[(i + 1) % n] };
  } catch (_) { return null; }
}

/** Is a gesture that starts on `node` the page's own (a field, a board, a sideways scroll)? */
export function ownGesture(node) {
  for (let n = node; n && n.nodeType === 1; n = n.parentElement) {
    if (n.matches('input, textarea, select, [contenteditable], canvas, [data-tablero], [data-no-swipe], .seg, .lang-pop')) return true;
    const ox = getComputedStyle(n).overflowX;
    if ((ox === 'auto' || ox === 'scroll') && n.scrollWidth > n.clientWidth) return true;
  }
  return false;
}

/** A game of the catalog by its path, for the tabs' emoji and name. */
async function gameAt(path) {
  const { ALL_GAMES } = await import('./games.js');
  const root = new URL('../../', import.meta.url).pathname;
  return ALL_GAMES.find(g => g.path && clean(root + g.path) === path) || null;
}

export async function mountGameSwipe({ cover = null, doc = document, lang = getLang() } = {}) {
  const nb = neighbours();
  if (!nb || doc.getElementById('game-swipe')) return null;
  const C = COMMON[lang] || COMMON.es;
  const [prev, next] = await Promise.all([gameAt(nb.prev), gameAt(nb.next)]);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const go = (path, dir) => {
    if (reduce) { location.href = path; return; }
    doc.body.classList.add(dir > 0 ? 'swipe-out-left' : 'swipe-out-right');
    setTimeout(() => { location.href = path; }, 170);
  };
  const tab = (path, g, dir) => el('a', {
    class: `swipe-tab ${dir > 0 ? 'next' : 'prev'}`, href: path,
    'aria-label': (dir > 0 ? C.swipeNext : C.swipePrev).replace('{game}', g ? pickLang(g.name, lang) : ''),
    title: (dir > 0 ? C.swipeNext : C.swipePrev).replace('{game}', g ? pickLang(g.name, lang) : ''),
    onClick: e => { e.preventDefault(); go(path, dir); },
  }, dir > 0 ? '' : '‹', el('span', { class: 'swipe-emoji' }, g?.emoji || '🎲'), dir > 0 ? '›' : '');
  const box = el('div', { id: 'game-swipe' }, tab(nb.prev, prev, -1), tab(nb.next, next, 1));
  doc.body.append(box);

  const onCover = () => !!cover?.isConnected && !cover.parentElement?.closest('[hidden], .screen:not(.active)');
  const sync = () => { const h = !onCover(); if (box.hidden !== h) box.hidden = h; };
  new MutationObserver(sync).observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  sync();

  let start = null;
  doc.addEventListener('touchstart', e => {
    start = null;
    if (e.touches.length !== 1 || !onCover() || ownGesture(e.target)) return;
    const t = e.touches[0];
    start = { x: t.clientX, y: t.clientY, at: Date.now() };
  }, { passive: true });
  doc.addEventListener('touchend', e => {
    if (!start) return;
    const t = e.changedTouches[0], dx = t.clientX - start.x, dy = t.clientY - start.y, quick = Date.now() - start.at < MAX_MS;
    start = null;
    if (!quick || Math.abs(dx) < MIN_DX || Math.abs(dx) < Math.abs(dy) * 2) return;
    // Like turning a page: the finger to the left brings the next one
    if (dx < 0) go(nb.next, 1); else go(nb.prev, -1);
  }, { passive: true });
  return box;
}
