/**
 * The once-only sheet of offline mode (D-538, docs/OFFLINE.md, PR 6): the first time this phone goes
 * offline with the flag on, one sheet says what still works, what comes back with the signal and what
 * happens to the scores. One button, "Entendido". Never again on this phone (SEEN_KEY).
 *
 * On an iPhone outside the installed app, one more line: Safari may clear a site's data after some days
 * unvisited, and with it the games still to upload, so the app on the home screen keeps them safest.
 *
 * The same sheet opens again whenever the player taps the "Sin conexión" chip (offline-ui.js):
 * `openOfflineSheet` shows it without looking at SEEN_KEY.
 *
 * Built on the same sheet as the support card (`.hoja`, `.hoja-capa`): pinned page behind, a tap
 * outside, Escape or the button closes it.
 */
import { el } from './ui.js';
import { getLang } from './i18n.js';
import { pasosDe } from './instalar.js';

export const SEEN_KEY = 'juegos-de-salon:offline-sheet-seen';

export const TEXTS = {
  es: {
    title: '📴 Estás sin conexión',
    lines: [
      '🎲 Puedes seguir jugando los juegos que se juegan en un solo celular.',
      '📡 Las salas con varios celulares, La Copa y los rankings vuelven con la señal.',
      '💾 Tus puntajes quedan guardados aquí y se suben solos al volver la señal.',
    ],
    cup: [
      '📡 Las salas con varios celulares y los rankings vuelven con la señal.',
      '🏆 La Copa: si la abriste antes con señal en este celular, puedes jugar tu fecha pendiente. Se sube sola al volver la señal, si la fecha sigue abierta.',
    ],
    ios: '📲 En iPhone, tus puntajes quedan más seguros con la app en la pantalla de inicio: Safari puede borrar los datos de un sitio que no abres en unos días.',
    ok: 'Entendido',
  },
  en: {
    title: '📴 You are offline',
    lines: [
      '🎲 You can keep playing the games that need only one phone.',
      '📡 Rooms with several phones, La Copa and the leaderboards come back with the signal.',
      '💾 Your scores are saved here and upload by themselves when the signal is back.',
    ],
    cup: [
      '📡 Rooms with several phones and the leaderboards come back with the signal.',
      '🏆 La Copa: if you opened it with signal on this phone, you can play your pending day. It uploads by itself when the signal is back, if the day is still open.',
    ],
    ios: '📲 On iPhone, your scores are safest with the app on your home screen: Safari may clear the data of a site you have not opened for a few days.',
    ok: 'Got it',
  },
  pt: {
    title: '📴 Você está sem conexão',
    lines: [
      '🎲 Você pode continuar jogando os jogos que se jogam em um só celular.',
      '📡 As salas com vários celulares, La Copa e os rankings voltam com o sinal.',
      '💾 Suas pontuações ficam salvas aqui e são enviadas sozinhas quando o sinal voltar.',
    ],
    cup: [
      '📡 As salas com vários celulares e os rankings voltam com o sinal.',
      '🏆 La Copa: se você a abriu antes com sinal neste celular, pode jogar sua rodada pendente. Ela é enviada sozinha quando o sinal voltar, se a rodada ainda estiver aberta.',
    ],
    ios: '📲 No iPhone, suas pontuações ficam mais seguras com o app na tela de início: o Safari pode apagar os dados de um site que você não abre há alguns dias.',
    ok: 'Entendi',
  },
};

/** Whether this phone already saw the sheet. Without storage, it counts as seen: never shown in a loop. */
export function seen(storage = globalThis.localStorage) {
  try { return storage.getItem(SEEN_KEY) === '1'; } catch (_) { return true; }
}

/** The sheet's lines for this phone: the three (with La Copa's own two when it plays offline here,
 *  flag `cup-offline`, D-544), and the iPhone one when it applies. */
export function sheetLines(lang = getLang(), { steps = pasosDe(), cup = false } = {}) {
  const T = TEXTS[lang] || TEXTS.es;
  const lines = cup ? [T.lines[0], ...T.cup, T.lines[2]] : T.lines;
  return [...lines, ...(String(steps || '').startsWith('ios') ? [T.ios] : [])];
}

/** Opens the sheet once per phone; returns its panel, or null when already seen. */
export function showOfflineSheetOnce({ doc = globalThis.document, storage = globalThis.localStorage, lang = getLang(), steps, cup = false } = {}) {
  if (seen(storage) || doc.getElementById('hoja-offline')) return null;
  try { storage.setItem(SEEN_KEY, '1'); } catch (_) { /* no storage: seen() already said seen */ }
  return openOfflineSheet({ doc, lang, steps, cup });
}

/** Opens the sheet now, seen or not (a tap on the chip); null when it is already open. */
export function openOfflineSheet({ doc = globalThis.document, lang = getLang(), steps, cup = false } = {}) {
  if (doc.getElementById('hoja-offline')) return null;
  const T = TEXTS[lang] || TEXTS.es;
  let layer = null;
  const y = doc.defaultView?.scrollY || 0;
  const bodyStyle = doc.body.getAttribute('style');
  const close = () => {
    if (!layer) return;
    layer.remove(); layer = null;
    if (bodyStyle === null) doc.body.removeAttribute('style'); else doc.body.setAttribute('style', bodyStyle);
    doc.defaultView?.scrollTo?.(0, y);
    doc.removeEventListener('keydown', onKey);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const panel = el('div', { class: 'hoja hoja-offline', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hoja-offline-titulo', id: 'hoja-offline' },
    el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
    el('h2', { id: 'hoja-offline-titulo' }, T.title),
    ...sheetLines(lang, { steps: steps === undefined ? pasosDe() : steps, cup }).map(p => el('p', {}, p)),
    el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-offline-ok', onClick: close }, T.ok)));
  layer = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: close }), panel);
  doc.body.append(layer);
  Object.assign(doc.body.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' });
  doc.addEventListener('keydown', onKey);
  panel.querySelector('.btn')?.focus?.();
  return panel;
}
