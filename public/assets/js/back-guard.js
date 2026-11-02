/**
 * The back-swipe guard (D-432), for everyone since the owner validated it in the lab.
 *
 * `overscroll-behavior: none` (D-86) already keeps Chrome's own swipe from taking the page, but
 * iOS's edge swipe and Android's system Back belong to the phone, and no page can stop them. Both
 * only go back one entry, though: while a game is on, the page adds one entry for its own address,
 * so a back swipe lands on it instead of leaving, and asks "Leave the game?". `trackStart` arms it
 * and `trackFinish` / `trackEnd` disarm it (`transport/stats.js`), so every game gets it at once.
 * The header's «‹ Menú» is the same wish to leave, so while a game is on it asks the same.
 *
 * Chrome skips, on Back, an entry a page added without a tap: `arm()` runs inside the tap that
 * starts the game.
 */
import { el } from './ui.js';
import { COMMON, getLang } from './i18n.js';

const MARK = 'backGuard';

/** The header's way out of a game: «‹ Menú» (or «‹ Laboratorio» in a lab game). */
export const MENU = 'a.back';

/**
 * The guard, with what it touches passed in so node can test it: `win` (history, location,
 * popstate and the document's clicks) and `ask`, which resolves true when the player chose to leave.
 */
export function createBackGuard({ win = globalThis.window, ask = askLeave } = {}) {
  let armed = false, asking = false;
  const ours = () => !!win.history.state?.[MARK];
  const push = () => win.history.pushState({ [MARK]: true }, '', win.location.href);
  function onPop() {
    if (!armed) return;
    // The swipe already left our entry: put it back, so a second swipe asks again instead of leaving
    push();
    if (asking) return;
    asking = true;
    Promise.resolve(ask()).then(leave => {
      asking = false;
      if (!leave || !armed) return;
      off();
      // Our entry and the game's: back to the page before the game
      win.history.go(-2);
    }, () => { asking = false; });
  }
  // «‹ Menú» mid-game: the same question; Leave follows the link
  function onClick(ev) {
    const a = ev.target?.closest?.(MENU);
    if (!armed || !a || ev.defaultPrevented || ev.button > 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    ev.preventDefault();
    if (asking) return;
    asking = true;
    Promise.resolve(ask()).then(leave => {
      asking = false;
      if (!leave || !armed) return;
      off();
      win.location.assign(a.href);
    }, () => { asking = false; });
  }
  function off() {
    armed = false;
    if (win.document?.documentElement) delete win.document.documentElement.dataset.enJuego;
    win.removeEventListener('popstate', onPop);
    win.document?.removeEventListener('click', onClick);
  }
  return {
    get armed() { return armed; },
    arm() {
      if (armed || !win?.history?.pushState) return;
      armed = true;
      // While a game is played: the tester ribbon hides (tester-ribbon.js)
      if (win.document?.documentElement) win.document.documentElement.dataset.enJuego = '';
      if (!ours()) push();
      win.addEventListener('popstate', onPop);
      win.document?.addEventListener('click', onClick);
    },
    disarm() {
      if (!armed) return;
      off();
      // The game is over: our entry goes, so Back works as on any page
      if (ours()) win.history.back();
    },
  };
}

/** "Leave the game?", the bottom sheet of the rest of the app. Resolves true on Leave. */
export function askLeave({ doc = globalThis.document, lang = getLang() } = {}) {
  const t = (COMMON[lang] || COMMON.es).backGuard;
  return new Promise(resolve => {
    doc.getElementById('back-guard')?.remove();
    let done = false;
    const close = leave => {
      if (done) return;
      done = true;
      capa.remove();
      doc.removeEventListener('keydown', onKey);
      resolve(leave);
    };
    const onKey = e => { if (e.key === 'Escape') close(false); };
    const stay = el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-back-guard-stay', onClick: () => close(false) }, t.stay);
    const panel = el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'back-guard-title' },
      el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
      el('h2', { id: 'back-guard-title' }, t.title),
      el('p', {}, t.body),
      el('div', { class: 'btn-row' },
        stay,
        el('button', { type: 'button', class: 'btn btn--ghost', id: 'btn-back-guard-leave', onClick: () => close(true) }, t.leave)));
    const capa = el('div', { class: 'hoja-capa', id: 'back-guard' }, el('div', { class: 'hoja-fondo', onClick: () => close(false) }), panel);
    doc.body.append(capa);
    doc.addEventListener('keydown', onKey);
    stay.focus();
  });
}

let shared = null;
/** The page's guard. Without a window (node), one that does nothing. */
export function backGuard() {
  if (!shared) {
    shared = globalThis.window?.history ? createBackGuard() : { armed: false, arm() {}, disarm() {} };
  }
  return shared;
}
