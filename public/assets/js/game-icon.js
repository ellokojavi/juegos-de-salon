/**
 * A game's icon on screen (docs/DESIGN.md, "Game icons"): its drawing when the game has one
 * (`icon` in games.js, a path from the site's root, like Sudoku's), else its emoji in a span with
 * the light outline the dark ones need (`con`). Every screen that shows a game's icon in the page
 * uses this; text (share messages, `<title>`, notifications, a game without a drawing on a canvas) keeps the
 * emoji, which stands in for the drawing. `game-icons.test.mjs` keeps new screens on it.
 */
import { el, con } from './ui.js';
import { gameById } from './games.js';

/** The site's root, from this file (assets/js/), whatever the page's depth. */
const ROOT = new URL('../../', import.meta.url);

/** The drawing's path for a game (its entry, a La Copa `J` or an id), or null. */
export function iconOf(game) {
  if (!game) return null;
  if (typeof game === 'string') return gameById(game)?.icon || null;
  return game.icon || (game.id ? gameById(game.id)?.icon : null) || null;
}

/** The drawing's absolute URL, or null. */
export const iconUrl = game => { const p = iconOf(game); return p ? new URL(p, ROOT).href : null; };

/**
 * The icon as a node. `size` is in em (1 = the text's size); the `<img>` carries width and height
 * and an inline size in em, so it never shows at its natural size before the CSS loads. `class`
 * goes on either node; `emoji` overrides the stand-in (a La Copa J carries its own).
 */
export function gameIcon(game, { size = 1, class: clase = '', emoji } = {}) {
  const e = emoji ?? (typeof game === 'string' ? gameById(game)?.emoji : game?.emoji) ?? '';
  const src = iconUrl(game);
  if (!src) return el('span', { class: con(clase, e) }, e);
  const px = Math.round(size * 24);
  return el('img', {
    class: ['game-icon', clase].filter(Boolean).join(' '), src, alt: '', width: px, height: px, decoding: 'async',
    style: `width:${size}em;height:${size}em;vertical-align:-0.15em;object-fit:contain`,
  });
}

/** "icon Name" as nodes, the drop-in for `conEmoji(g.emoji, name)`. */
export const withIcon = (game, text, opts) => [gameIcon(game, opts), ` ${text}`];

/**
 * For a place that was plain text (`${J.emoji} ${T.start}` on a button): a game without a drawing keeps
 * exactly that one text node, since a separate span moved the button's text a pixel or two (the visual
 * check caught it on Toque y Fama: Palabra); a game with a drawing gets the image and the text.
 */
export const textWithIcon = (game, text, opts) => {
  if (!iconOf(game)) return `${opts?.emoji ?? (typeof game === 'string' ? gameById(game)?.emoji : game?.emoji) ?? ''} ${text}`;
  return [gameIcon(game, opts), ` ${text}`];
};
