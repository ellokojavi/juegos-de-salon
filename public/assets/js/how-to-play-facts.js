/**
 * Who plays, how and what it costs, as the first line of a game's "Cómo se juega" (#887, #888).
 * The owner's rule (D-488): one block explains the game, so this is part of "Cómo se juega", never a
 * separate FAQ beside it. Every fact is built from data the app already has —the players and
 * minutes in games.js, the modes the cover offers— so it cannot say something the game stopped doing.
 *
 * Tried in the lab first (D-395, D-409); everyone sees it since it launched (D-488).
 */
import { gameById } from './games.js';

const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
/** '1–6' → [1, 6]; '2' → [2, 2] */
const span = s => { const [a, b = a] = String(s).split(/[–-]/).map(Number); return [a, b]; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export const TEXTS = {
  es: {
    players: 'De {min} a {max} jugadores, {duration} minutos.',
    one: 'Un jugador, {duration} minutos.',
    free: 'Gratis, sin instalar nada y sin cuenta.',
    or: ' o ',
    local: 'todos en un mismo celular',
    online: 'cada uno en su celular',
    alone: 'solo contra el celular',
  },
  en: {
    players: '{min} to {max} players, {duration} minutes.',
    one: 'One player, {duration} minutes.',
    free: 'Free, nothing to install and no account.',
    or: ' or ',
    local: 'everyone sharing one phone',
    online: 'each on their own phone',
    alone: 'alone against the phone',
  },
  pt: {
    players: 'De {min} a {max} jogadores, {duration} minutos.',
    one: 'Um jogador, {duration} minutos.',
    free: 'De graça, sem instalar nada e sem conta.',
    or: ' ou ',
    local: 'todos em um celular que vai passando',
    online: 'cada um no seu celular',
    alone: 'sozinho contra o celular',
  },
  de: {
    players: '{min} bis {max} Spieler, {duration} Minuten.',
    one: 'Ein Spieler, {duration} Minuten.',
    free: 'Kostenlos, ohne Installation und ohne Konto.',
    or: ' oder ',
    local: 'alle an einem Handy',
    online: 'jeder an seinem eigenen Handy',
    alone: 'allein gegen das Handy',
  },
};

/**
 * The line, as text. `T` is the game's own texts: its mode keys (modeLocal, modeOnline, modeSolo
 * or modeCpu) say which modes its cover offers.
 */
export function factsLine(gameId, T, lang) {
  const L = TEXTS[lang] || TEXTS.es;
  const g = gameById(gameId);
  const [min, max] = span(g.players);
  const duration = String(g.duration).replace('-', '–');
  const modes = [['modeLocal', 'local'], ['modeOnline', 'online'], [T.modeSolo ? 'modeSolo' : 'modeCpu', 'alone']]
    .filter(([k]) => T[k]).map(([, m]) => L[m]);
  const list = modes.length > 1 ? `${modes.slice(0, -1).join(', ')}${L.or}${modes.at(-1)}` : modes[0] || '';
  return [
    fill(max > 1 ? L.players : L.one, { min, max, duration }),
    list && `${cap(list)}.`,
    L.free,
  ].filter(Boolean).join(' ');
}

/** Puts the line first inside the game's "Cómo se juega". */
export function mountHowToPlayFacts(gameId, T, lang) {
  const title = document.querySelector('[data-i18n="howTitle"], [data-i18n="rulesSummary"]');
  if (!title) return;
  const p = document.createElement('p');
  p.className = 'muted how-facts';
  p.textContent = factsLine(gameId, T, lang);
  title.after(p);
}
