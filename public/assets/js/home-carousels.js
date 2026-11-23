/**
 * The home page's games as carousels, in place of the filters and the long list (lab flag
 * `home-carousels`, lab: #seccion-home-carousels). The top of the page stays as it is: bar, title,
 * tagline, the dice, La Copa and Uno al día. Under them, one row per way of choosing, each sliding
 * sideways: favourites (once one is marked), popular, new, solo or with friends (the owner, 2026-11-19), dexterity (the quick games and the skill ones together), and one per type.
 * The rows are grids of three, and a game is in one row only. A game says its icon and its name, nothing else (the owner, 2026-11-18): the row it is in already says what
 * kind it is, and how long it takes and how many play are in its sheet. A tap opens the game's cover (for everyone since
 * 2026-11-21, the owner); with lab sub-flag home-carousels-sheet it opens a sheet instead, with what the game is, its
 * ranking and ▶ Jugar; the ⭐ lives there too. On top of the details, the game's cover animation plays (the demo
 * of its waiting room, or its "how to play" drawing), in a frame of `cup/cover/`: it shows how the game is played.
 *
 * It reads the same games the list does (`PORTADA` without Toque y Fama: Palabra), so a game that
 * reaches the home page reaches a carousel (C-21). Only the home page loads this file.
 */
import { TIPOS, SOLO_TABLES, FIRST_VARIANT_TABLES, SUELTOS, rangoJugadores, esNuevo, populares } from './games.js';
import { el, ICONO_COMPARTIR } from './ui.js';
import { gameIcon } from './game-icon.js';
import { pickLang, homeUrl } from './i18n.js';
import { compartir } from './compartir.js';
import { coverShareText } from './cover-share.js';
import { favoritos, alternarFavorito } from './favoritos.js';
import { loadCss } from './load-css.js';

/** What this phone last knew of the flag: the page hides the filters before any module arrives. */
export const HINT = 'juegos-de-salon:home-carousels';

/** A game is quick when its longest play is this many minutes or fewer. */
export const QUICK_MINUTES = 3;
/** The skill type (🎯 Pulso in the list's filters) has no row of its own here: its games go in Destreza (the owner, 2026-11-19). */
export const IN_DEXTERITY = 'skill';
/** The words type has no row here either (the owner, 2026-11-20): Agents moved to Logic; the other word games sit in their other rows. */
export const NO_ROW = ['words'];

export const TEXTS = {
  es: { friends: 'Solo o con amigos', dexterity: 'Destreza', details: 'Detalles', play: '▶ Jugar' },
  en: { friends: 'Solo or with friends', dexterity: 'Dexterity', details: 'Details', play: '▶ Play' },
  pt: { friends: 'Sozinho ou com amigos', dexterity: 'Destreza', details: 'Detalhes', play: '▶ Jogar' },
};

/** The longest a game takes, in minutes; a game counted in another unit (La Copa's days) is never quick. */
export const maxMinutes = g => (g.durationUnit ? Infinity : Number(String(g.duration || '').split(/[^\d]+/).filter(Boolean).pop()) || Infinity);

/**
 * The rows, in order, each with the games it holds in the home page's own order; a row with no
 * game is left out, so none is ever empty, and no game is in two rows. Pure, for node.
 */
export function shelves(games, { favs = [], top = populares(), isNew = esNuevo } = {}) {
  const open = games.filter(g => g.available && !g.torneo);
  const rows = [
    ['favorites', '⭐', g => favs.includes(g.id)],
    ['popular', '🔥', g => top.has(g.id)],
    ['new', '✨', g => isNew(g)],
    ['friends', '👥', g => rangoJugadores(g.players)[1] > 1],
    ['dexterity', '🤹', g => maxMinutes(g) <= QUICK_MINUTES || (g.tipos || []).includes(IN_DEXTERITY)],
    ...Object.entries(TIPOS).filter(([id]) => id !== IN_DEXTERITY && !NO_ROW.includes(id)).map(([id, t]) => [id, t.emoji, g => (g.tipos || []).includes(id)]),
  ];
  // A game shows once on the whole page (the owner, 2026-11-18): it stays in the first row that holds it, in this
  // order, and leaves the ones after it; a row left with no game is not drawn
  const seen = new Set();
  return rows.map(([id, emoji, test]) => {
    const mine = open.filter(g => !seen.has(g.id) && test(g));
    mine.forEach(g => seen.add(g.id));
    return { id, emoji, games: mine };
  }).filter(s => s.games.length);
}

/** A game's name in a link: the folder of its page, in English (`reinas` lives in `queens/`, C-18). */
export const slugOf = g => String(g.path || '').replace(/^\.?\//, '').split('/')[0];
/** The link that opens the home page with this game's sheet over it: what the sheet's share button sends. */
export const sheetUrl = (g, lang, home = homeUrl(lang)) => `${home}?game=${slugOf(g)}`;

/**
 * The table a game's sheet shows: its solo scores when it has them, else its wins when it is played in a room. A game
 * with both (Generala, Toque y Fama, Ahorcado) shows the solo one, as its own cover puts it on top (D-274): almost all of
 * its games are played alone, and its wins table was the empty one (the owner, 2026-11-19).
 */
export const rankingOf = g => (SOLO_TABLES[g.id] || !g.jugadas
  ? { table: SOLO_TABLES[g.id] || FIRST_VARIANT_TABLES[g.id] || g.id, wins: false }
  : { table: `${g.id}_victorias`, wins: true });

/**
 * The page that draws a game's cover animation alone (cup/cover/), for the sheet's frame; null for a game
 * that is not one of La Copa's, which has none. In a frame, so the home page loads no game's code or styles (D-378).
 */
const SOLO_IDS = new Set(SUELTOS.map(g => g.id));
export const demoUrl = (g, lang, base = import.meta.url) => (SOLO_IDS.has(g.id) ? new URL(`../../cup/cover/?game=${g.id}&lang=${lang}`, base).href : null);

const fmt = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? `{${k}}`);

/**
 * Draws the carousels under the games list and hides the filters and the list's cards (the CSS
 * does, from `html.carousels`). Returns `{ remove() }`, which puts the page back as it was.
 */
/** A tap on an icon goes straight to the game's cover, as the list's cards do; sub-flag home-carousels-sheet opens its sheet instead. */
function goCover(g) {
  import('./transport/stats.js').then(m => m.markOrigin('card', new URL(g.path, location.href).href)).catch(() => {});
  location.href = g.path;
}

/**
 * `direct` (false with sub-flag home-carousels-sheet) may be a promise: the rows are drawn at once, a tap opening the
 * cover, and they open the sheet once it says so. Waiting for it held the whole drawing behind two reads from Firebase (the flags and the lab key).
 */
export async function drawCarousels({ lang, T, games, tap = () => {}, doc = document, openSlug = null, direct = false }) {
  const t = TEXTS[lang] || TEXTS.es;
  let isDirect = direct !== false;
  const root = doc.documentElement;
  root.classList.add('carousels');
  // A filter kept in the link hid Uno al día's card: with no filters there is nothing to filter
  root.classList.remove('filtrado');
  await loadCss(new URL('../css/home-carousels.css', import.meta.url).href);

  const titles = { favorites: T.favorites, popular: T.filterPopular, new: T.filterNew, friends: t.friends, dexterity: t.dexterity };
  const titleOf = id => titles[id] || pickLang(TIPOS[id].name, lang);
  const unit = g => (g.durationUnit ? pickLang(g.durationUnit, lang) : T.minutes);

  const box = el('section', { class: 'shelves', id: 'shelves' });
  doc.getElementById('games').after(box);

  /* ---------------- the sheet ---------------- */
  let layer = null, before = null, pinned = null, onDemo = null, kept = null;
  const onKey = e => {
    if (e.key === 'Escape') return close();
    // A modal dialog keeps Tab inside it: the page behind is not reachable while the sheet is open
    if (e.key !== 'Tab' || !layer) return;
    const all = [...layer.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')].filter(n => !n.closest('[hidden], [inert]') && n.tabIndex >= 0);
    if (!all.length) return;
    const first = all[0], last = all[all.length - 1], at = doc.activeElement;
    if (e.shiftKey && (at === first || !layer.contains(at))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (at === last || !layer.contains(at))) { e.preventDefault(); first.focus(); }
  };
  // The page behind does not scroll while the sheet is open (as the share sheet does)
  const pin = () => {
    const b = doc.body, y = doc.defaultView?.scrollY || 0;
    pinned = { y, style: b.getAttribute('style') };
    Object.assign(b.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' });
  };
  const unpin = () => {
    if (!pinned) return;
    if (pinned.style === null) doc.body.removeAttribute('style'); else doc.body.setAttribute('style', pinned.style);
    doc.defaultView?.scrollTo(0, pinned.y);
    pinned = null;
  };
  function close() {
    if (!layer) return;
    layer.remove(); layer = null;
    if (onDemo) { doc.defaultView.removeEventListener('message', onDemo); onDemo = null; }
    kept?.disconnect(); kept = null;
    unpin();
    doc.removeEventListener('keydown', onKey);
    // The tile may have been drawn again meanwhile (a ⭐ marked): the one in its place takes the focus
    const again = before && box.querySelector(`[data-shelf="${before.shelf}"] [data-id="${before.id}"]`);
    (again || box.querySelector(`[data-id="${before?.id}"]`))?.focus?.();
  }

  function open(g, shelf) {
    close();
    before = { id: g.id, shelf };
    const name = pickLang(g.name, lang);
    const [, max] = rangoJugadores(g.players);
    const favLabel = T.favorite.replace('{juego}', name);
    const fav = el('button', { type: 'button', class: 'icon-btn game-sheet-fav', id: 'btn-game-sheet-fav', 'aria-label': favLabel, title: favLabel });
    const paintFav = () => { const on = favoritos().includes(g.id); fav.textContent = on ? '★' : '☆'; fav.classList.toggle('on', on); fav.setAttribute('aria-pressed', String(on)); };
    fav.addEventListener('click', () => { tap(); alternarFavorito(g.id); paintFav(); doc.dispatchEvent(new CustomEvent('favoritos')); });
    paintFav();
    // Share this sheet as the game's cover (the owner, 2026-11-18): the link opens the home page with this sheet over it
    const share = el('button', { type: 'button', class: 'icon-btn', id: 'btn-game-sheet-share', 'aria-label': T.shareGame, title: T.shareGame });
    share.innerHTML = ICONO_COMPARTIR;
    share.addEventListener('click', async () => {
      tap();
      const r = await compartir({ titulo: name, texto: coverShareText({ C: T, emoji: g.emoji, name }), url: sheetUrl(g, lang), que: 'cover' });
      // Without a share menu the message is copied: the icon turns into a check for a moment
      if (r === 'copied') {
        share.textContent = '✓'; share.title = T.shareCopied; share.setAttribute('aria-label', T.shareCopied);
        setTimeout(() => { if (!share.isConnected) return; share.innerHTML = ICONO_COMPARTIR; share.title = T.shareGame; share.setAttribute('aria-label', T.shareGame); }, 2000);
      }
    });

    // The game's cover animation, in a frame that takes the height its page says; put away if the game has none.
    // It starts with no height (never `hidden`: a demo measures its width to draw) and nothing in it is tapped
    // A game with no animation shows its icon, big, in the animation's place: the sheet has the room of ten ranking rows
    const hero = () => el('div', { class: 'game-sheet-hero', id: 'game-sheet-hero', 'aria-hidden': 'true' }, gameIcon(g, { size: 5 }));
    const src = demoUrl(g, lang);
    const demo = src && el('iframe', { class: 'game-sheet-demo', id: 'game-sheet-demo', src, title: name, tabindex: '-1', 'aria-hidden': 'true', scrolling: 'no' });
    if (demo) {
      const win = doc.defaultView;
      onDemo = e => {
        if (e.origin !== win.location.origin || e.source !== demo.contentWindow || e.data?.type !== 'cover-demo' || e.data.game !== g.id) return;
        const h = Number(e.data.height) || 0;
        // Its own height: the frame also takes whatever the sheet has left over (the two tabs share one height), and its page grows the drawing to fill it
        // On a short screen it gives way first, down to half, so the game's line stays in sight under it
        if (h <= 0) demo.replaceWith(hero());
        else demo.classList.add('on'); // the slot's size is fixed from the first frame: it only fades in
      };
      win.addEventListener('message', onDemo);
    }
    const details = el('div', { class: 'game-sheet-details', id: 'game-sheet-details' },
      demo || hero(),
      el('p', {}, pickLang(g.tagline, lang)),
      el('div', { class: 'chips' },
        el('span', { class: 'chip' }, `👥 ${g.players} ${max === 1 ? T.player : T.players}`),
        el('span', { class: 'chip' }, `⏱ ${g.duration} ${unit(g)}`),
        (g.tipos || []).filter(id => TIPOS[id]).map(id => el('span', { class: 'chip' }, `${TIPOS[id].emoji} ${pickLang(TIPOS[id].name, lang)}`))));
    const ranking = el('div', { id: 'game-sheet-ranking' });
    const body = el('div', { class: 'game-sheet-body', role: 'tabpanel', id: 'game-sheet-panel' }, details, ranking);

    // One height for both tabs (the owner, 2026-11-18): Detalles and Ranking are laid one over the other in the same
    // cell, so the sheet is as tall as the taller of the two (up to what the screen gives) and does not move when the
    // tab changes; the one not shown is invisible and inert. The height only grows while the sheet is open (a longer
    // table arriving, Semana to Siempre). So the ranking is read as the sheet opens, not when its tab is first tapped
    let asked = false;
    const showRanking = () => {
      if (asked) return;
      asked = true;
      ranking.replaceChildren(el('p', { class: 'muted rk-centro' }, T.rk.loading));
      Promise.all([import('./ranking.js'), loadCss(new URL('../css/ranking.css', import.meta.url).href)]).then(([{ bloqueRanking }]) => {
        const { table, wins } = rankingOf(g);
        ranking.replaceChildren(bloqueRanking({ juego: table, titulo: fmt(wins ? T.rk.winsOf : T.rk.titleOf, { game: name }),
          hint: wins ? T.rk.winsHint : null, pestanas: ['semana', 'siempre'], alTocar: tap, rapido: true }));
        ranking.firstElementChild?.classList.add('rk-ten');
      }).catch(() => { asked = false; ranking.replaceChildren(); });
    };
    const TABS = [['details', t.details], ['ranking', `🏅 ${T.rk.title}`]];
    let tab = 'details';
    const tabs = el('div', { class: 'hoja-pestanas', role: 'tablist', 'aria-label': name });
    const show = k => {
      tab = k;
      tabs.querySelectorAll('button').forEach(b => { const on = b.dataset.k === k; b.setAttribute('aria-selected', String(on)); b.classList.toggle('on', on); b.tabIndex = on ? 0 : -1; });
      body.setAttribute('aria-labelledby', `game-sheet-tab-${k}`);
      for (const [id, pane] of [['details', details], ['ranking', ranking]]) { const off = id !== k; pane.classList.toggle('off', off); pane.inert = off; pane.setAttribute('aria-hidden', String(off)); }
    };
    for (const [k, label] of TABS) {
      const b = el('button', { type: 'button', role: 'tab', class: 'hoja-pestana', 'data-k': k, id: `game-sheet-tab-${k}`, 'aria-controls': 'game-sheet-panel' }, label);
      b.addEventListener('click', () => { if (k !== tab) { tap(); show(k); } });
      tabs.append(b);
    }
    tabs.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const k = tab === 'details' ? 'ranking' : 'details';
      show(k); tabs.querySelector(`[data-k="${k}"]`).focus();
    });

    const play = el('a', { class: 'btn btn--yellow', id: 'btn-game-sheet-play', href: g.path }, t.play);
    play.addEventListener('click', () => {
      tap();
      // Where the game came from (as a card does)
      import('./transport/stats.js').then(m => m.markOrigin('card', play.href)).catch(() => {});
    });

    const panel = el('div', { class: 'hoja game-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'game-sheet-title', id: 'game-sheet', 'data-id': g.id },
      el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
      el('div', { class: 'hoja-cabeza' },
        el('span', { class: 'game-sheet-icon', 'aria-hidden': 'true' }, gameIcon(g, { size: 1 })),
        el('h2', { id: 'game-sheet-title' }, name),
        share, fav,
        el('button', { type: 'button', class: 'icon-btn', id: 'btn-game-sheet-close', 'aria-label': T.shareSheet.close, title: T.shareSheet.close, onClick: () => { tap(); close(); } }, '✕')),
      tabs, body, play);
    layer = el('div', { class: 'hoja-capa', id: 'game-sheet-layer' }, el('div', { class: 'hoja-fondo', onClick: close }), panel);
    doc.body.append(layer);
    show('details');
    showRanking();
    let tallest = 0;
    kept = new ResizeObserver(() => { const h = Math.ceil(body.getBoundingClientRect().height); if (h > tallest) { tallest = h; body.style.minHeight = `${h}px`; } });
    kept.observe(body);
    pin();
    doc.addEventListener('keydown', onKey);
    play.focus();
  }

  /* ---------------- the rows ---------------- */
  function draw() {
    box.replaceChildren(
      // A line between La Copa and Uno al día, above, and the games (the list's own divider)
      el('hr', { class: 'filtros-fin shelves-rule', 'aria-hidden': 'true' }),
      ...shelves(games, { favs: favoritos() }).map(s => {
        const row = el('div', { class: 'shelf-row', 'data-shelf': s.id, role: 'list' }, s.games.map(g =>
          el('div', { role: 'listitem' }, el('button', { type: 'button', class: 'shelf-tile', 'data-id': g.id, 'aria-haspopup': isDirect ? null : 'dialog', onClick: () => { tap(); if (isDirect) goCover(g); else open(g, s.id); } },
            el('span', { class: 'emoji', 'aria-hidden': 'true' }, gameIcon(g, { size: 1 })),
            el('span', { class: 'name' }, pickLang(g.name, lang))))));
        return el('section', { class: 'shelf', 'aria-labelledby': `shelf-${s.id}` },
          el('h2', { class: 'display display--sm', id: `shelf-${s.id}` }, el('span', { 'aria-hidden': 'true' }, `${s.emoji} `), titleOf(s.id)), row);
      }));
  }
  draw();
  if (direct !== true && direct !== false) {
    Promise.resolve(direct).then(d => {
      isDirect = !!d;
      box.querySelectorAll('.shelf-tile').forEach(b => (isDirect ? b.removeAttribute('aria-haspopup') : b.setAttribute('aria-haspopup', 'dialog')));
    }).catch(() => {});
  }
  // A shared link (`?game=<slug>`) opens that game's sheet at once, over the page
  if (openSlug) {
    const tile = [...box.querySelectorAll('.shelf-tile')].find(b => slugOf(games.find(g => g.id === b.dataset.id) || {}) === openSlug);
    // The shared sheet opens whatever the taps do; the taps after it still follow the flag (a cover, or a sheet in the lab)
    const was = isDirect;
    isDirect = false;
    tile?.click();
    isDirect = was;
  }
  const onFav = () => draw();
  doc.addEventListener('favoritos', onFav);

  return {
    remove() {
      close();
      doc.removeEventListener('favoritos', onFav);
      box.remove();
      root.classList.remove('carousels');
    },
  };
}
