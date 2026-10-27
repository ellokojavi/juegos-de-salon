/**
 * Frequently asked questions under a game's rules (#887, W1.2 of #883): three questions a search
 * engine and a new player both ask, collapsed so the cover stays as short as it is (U-36, U-39).
 * The rules themselves are already on the cover ("Cómo se juega"); this adds who plays, how, and
 * what it costs. Every answer is built from data the app already has —the players and minutes in
 * games.js, the modes the game offers— so it cannot say something the game stopped doing.
 *
 * In the lab first (D-395, D-409): it shows only to a lab key holder. lab: #seccion-faq
 */
import { gameById } from './games.js';
import { labAccess } from './lab-access.js';

const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
/** '1–6' → [1, 6]; '2' → [2, 2] */
const span = s => { const [a, b = a] = String(s).split(/[–-]/).map(Number); return [a, b]; };

export const TEXTS = {
  es: {
    title: '❓ Preguntas frecuentes',
    qPlayers: '¿Cuántos pueden jugar y cuánto dura?',
    aPlayers: 'De {min} a {max} jugadores. Una partida dura entre {duration} minutos.',
    aPlayersOne: 'Se juega solo. Una partida dura entre {duration} minutos.',
    qModes: '¿Se juega en un celular o en varios?',
    aModes: 'Elige al empezar: {modes}.',
    qFree: '¿Es gratis? ¿Hay que instalar algo?',
    aFree: 'Es gratis, sin anuncios y sin cuenta. Se juega en el navegador del celular, sin instalar nada.',
    or: ' o ',
    local: 'todos en un celular que se van pasando',
    online: 'cada uno en su celular',
    alone: 'solo contra el celular',
    and: ' y ',
  },
  en: {
    title: '❓ Frequently asked questions',
    qPlayers: 'How many can play, and how long does it take?',
    aPlayers: 'From {min} to {max} players. A game takes {duration} minutes.',
    aPlayersOne: 'You play alone. A game takes {duration} minutes.',
    qModes: 'Is it played on one phone or several?',
    aModes: 'You choose when you start: {modes}.',
    qFree: 'Is it free? Do I have to install anything?',
    aFree: 'It is free, with no ads and no account. You play in your phone\'s browser, with nothing to install.',
    or: ' or ',
    local: 'everyone sharing one phone',
    online: 'each on their own phone',
    alone: 'alone against the phone',
    and: '–',
  },
  pt: {
    title: '❓ Perguntas frequentes',
    qPlayers: 'Quantos podem jogar e quanto tempo dura?',
    aPlayers: 'De {min} a {max} jogadores. Uma partida dura entre {duration} minutos.',
    aPlayersOne: 'Joga-se sozinho. Uma partida dura entre {duration} minutos.',
    qModes: 'Joga-se em um celular ou em vários?',
    aModes: 'Escolha ao começar: {modes}.',
    qFree: 'É de graça? Precisa instalar alguma coisa?',
    aFree: 'É de graça, sem anúncios e sem conta. Joga-se no navegador do celular, sem instalar nada.',
    or: ' ou ',
    local: 'todos em um só celular passado de mão em mão',
    online: 'cada um no seu celular',
    alone: 'sozinho contra o celular',
    and: ' e ',
  },
  de: {
    title: '❓ Häufige Fragen',
    qPlayers: 'Wie viele können mitspielen, und wie lange dauert es?',
    aPlayers: '{min} bis {max} Spieler. Eine Partie dauert {duration} Minuten.',
    aPlayersOne: 'Man spielt allein. Eine Partie dauert {duration} Minuten.',
    qModes: 'Spielt man auf einem Handy oder auf mehreren?',
    aModes: 'Das wählst du zu Beginn: {modes}.',
    qFree: 'Ist es kostenlos? Muss ich etwas installieren?',
    aFree: 'Es ist kostenlos, ohne Werbung und ohne Konto. Man spielt im Browser des Handys, ohne etwas zu installieren.',
    or: ' oder ',
    local: 'alle an einem Handy',
    online: 'jeder an seinem eigenen Handy',
    alone: 'allein gegen das Handy',
    and: '–',
  },
};

/**
 * The three questions and answers, as text. `T` is the game's own texts: its mode keys
 * (modeLocal, modeOnline, modeSolo or modeCpu) say which modes its cover offers.
 */
export function faqItems(gameId, T, lang) {
  const L = TEXTS[lang] || TEXTS.es;
  const g = gameById(gameId);
  const [min, max] = span(g.players);
  const duration = g.duration.replace(/[–-]/, L.and);
  // Which modes the cover offers, said in one phrase each: their buttons' names do not read as a list
  const modes = [['modeLocal', 'local'], ['modeOnline', 'online'], [T.modeSolo ? 'modeSolo' : 'modeCpu', 'alone']]
    .filter(([k]) => T[k]).map(([, m]) => L[m]);
  const list = modes.length > 1 ? `${modes.slice(0, -1).join(', ')}${L.or}${modes.at(-1)}` : modes[0] || '';
  return [
    [L.qPlayers, fill(max > 1 ? L.aPlayers : L.aPlayersOne, { min, max, duration })],
    ...(modes.length ? [[L.qModes, fill(L.aModes, { modes: list })]] : []),
    [L.qFree, L.aFree],
  ];
}

/** Puts the collapsed block in `slot`, only for a lab key holder. */
export async function mountFaq(slot, gameId, T, lang) {
  if (!slot || !(await labAccess())) return;
  const L = TEXTS[lang] || TEXTS.es;
  const box = document.createElement('details');
  box.className = 'panel faq';
  const summary = document.createElement('summary');
  summary.textContent = L.title;
  box.append(summary);
  for (const [q, a] of faqItems(gameId, T, lang)) {
    const h = document.createElement('h3');
    h.textContent = q;
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = a;
    box.append(h, p);
  }
  slot.append(box);
}
