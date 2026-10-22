/**
 * 🕵️ Agentes — the engine (D-286; out of the lab and into La Copa in D-421): a one-player Codenames,
 * where the game gives the clues and you guess. A board of 15 words: 4 groups of agents (one per
 * clue; three of 3 and one of 2, which one changes with each board), 3 neutrals and 1 assassin that
 * tempts. The clues come one at a time, with their number. Touching an agent scores (also if it is
 * another clue's: it is one of yours); a neutral or the assassin subtract and cut the clue. You can
 * pass to the next clue whenever you want. No DOM: engine.test.mjs tests it.
 *
 * Each language has its own deck (D-170): `clues.js` (Spanish, from Chile), `clues-en.js`,
 * `clues-pt.js` and `clues-de.js`. In a cup the words are the cup's language (`palabras`), so
 * everybody plays the same board.
 */
import { PISTAS as ES } from './clues.js';
import { PISTAS as EN } from './clues-en.js';
import { PISTAS as PT } from './clues-pt.js';
import { PISTAS as DE } from './clues-de.js';
import { hash32 } from '../semilla.js';
import { rng } from '../../../assets/js/rng.js';

export const MAZOS = { es: ES, en: EN, pt: PT, de: DE };
/** The deck of a language; Spanish if there is none. */
export const mazoDe = lang => MAZOS[lang] || ES;

import { POR_PISTA, CUANTAS, CORTAS, NEUTRALES, AGENTES, RESTA_NEUTRAL, RESTA_ASESINO, ENSAYO } from './numbers.js';
export { POR_PISTA, CUANTAS, CORTAS, NEUTRALES, AGENTES, RESTA_NEUTRAL, RESTA_ASESINO, ENSAYO };

const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/**
 * The board of a seed: `pistas` (the word and how many go with it) and `cartas` in grid order, each
 * `{ w, tipo: 'agente'|'neutral'|'asesino', p }` (`p`: the agent's clue; the assassin and the
 * neutrals also carry `tienta`: the clue they look like).
 * No agent also goes with another of the board's clues; the assassin and the neutrals look like one
 * (they come from its temptations, `casi`) but go with none, so the cards that are not yours look
 * like some clue's. A clue that is a word (or a temptation) of another never shares a board with it.
 */
export function generar(semilla, { lang = 'es', cuantas = CUANTAS, neutrales: nNeutrales = NEUTRALES } = {}) {
  const PISTAS = mazoDe(lang);
  const r = rng(hash32(`agentes:${semilla}`));
  for (let intento = 0; intento < 500; intento++) {
    const elegidas = barajar(PISTAS, r).slice(0, cuantas);
    const si = new Set(elegidas.flatMap(x => x.si)), casi = new Set(elegidas.flatMap(x => x.casi));
    if (elegidas.some(x => si.has(x.pista) || casi.has(x.pista))) continue;
    // A clue is never on its own board (PLAYA is a clue and also goes with MAR)
    const usadas = new Set(elegidas.map(x => x.pista));
    const cartas = [];
    let bien = true;
    const corta = Math.floor(r() * cuantas);
    const cuantos = p => POR_PISTA - (p === corta ? CORTAS : 0);
    elegidas.forEach((x, p) => {
      // Its own, that go with no other of the chosen ones
      const propias = barajar(x.si.filter(w => !usadas.has(w) && elegidas.every((y, q) => q === p || !y.si.includes(w))), r).slice(0, cuantos(p));
      if (propias.length < cuantos(p)) bien = false;
      for (const w of propias) { usadas.add(w); cartas.push({ w, tipo: 'agente', p }); }
    });
    if (!bien) continue;
    // The assassin: it looks like one of the clues, but goes with none
    const asesino = barajar([...casi].filter(w => !si.has(w) && !usadas.has(w)), r)[0];
    if (!asesino) continue;
    usadas.add(asesino);
    const tientaA = w => elegidas.findIndex(x => x.casi.includes(w));
    cartas.push({ w: asesino, tipo: 'asesino', p: null, tienta: tientaA(asesino) });
    // The neutrals tempt too: from the temptations left, preferably of other clues than the
    // assassin's, so the trap is not all on one
    const quedan = barajar([...casi].filter(w => !si.has(w) && !usadas.has(w)), r);
    const neutrales = [...quedan.filter(w => tientaA(w) !== tientaA(asesino)), ...quedan.filter(w => tientaA(w) === tientaA(asesino))].slice(0, nNeutrales);
    if (neutrales.length < nNeutrales) continue;
    for (const w of neutrales) { usadas.add(w); cartas.push({ w, tipo: 'neutral', p: null, tienta: tientaA(w) }); }
    return { pistas: elegidas.map((x, p) => ({ pista: x.pista, n: cuantos(p) })), cartas: barajar(cartas, r) };
  }
  throw new Error('no se pudo armar un tablero');
}

/**
 * The board of a cup day, its trial and the standalone game (D-331's `generarDia`): the code, the
 * day and the salt decide it, and the words are the cup's language (`palabras`), or the player's.
 */
export function generarDia(codigo, dia, { sal = '', lang = 'es', palabras = lang, ensayo = false } = {}) {
  return generar(`${codigo}:${dia}${sal ? `:${sal}` : ''}`, { lang: palabras, ...(ensayo ? ENSAYO : {}) });
}

/** How many agents a board has: 11, or 5 in the trial. */
export const agentesDe = t => t.pistas.reduce((a, p) => a + p.n, 0);

/**
 * The state from the moves (C-7): each move is `{ i }` (touch card i) or `{ pasar: true }`.
 * It returns the current clue (`actual`, or null at the end), the touched cards, the agents found,
 * the neutrals and the assassin touched, and how many of the current clue are missing.
 */
export function estado(t, jugadas = []) {
  let actual = 0;
  const tocadas = new Set();
  let neutrales = 0, asesino = false;
  const faltan = p => t.cartas.filter((c, i) => c.tipo === 'agente' && c.p === p && !tocadas.has(i)).length;
  const avanzar = () => { actual++; while (actual < t.pistas.length && faltan(actual) === 0) actual++; };
  for (const j of jugadas) {
    if (actual >= t.pistas.length) break;
    if (j.pasar) { avanzar(); continue; }
    if (tocadas.has(j.i) || !t.cartas[j.i]) continue;
    tocadas.add(j.i);
    const c = t.cartas[j.i];
    if (c.tipo === 'neutral') { neutrales++; avanzar(); }
    else if (c.tipo === 'asesino') { asesino = true; avanzar(); }
    else if (faltan(actual) === 0) avanzar();
  }
  const encontrados = t.cartas.filter((c, i) => c.tipo === 'agente' && tocadas.has(i)).length;
  const fin = actual >= t.pistas.length;
  return { actual: fin ? null : actual, tocadas, encontrados, total: agentesDe(t), neutrales, asesino, fin, faltan: fin ? 0 : faltan(actual) };
}

/** The agents' part of the score: 100 × found / total. */
export const base = e => Math.round(100 * e.encontrados / (e.total || AGENTES));
/** From 0 to 100: the agents found, minus 15 per neutral and 40 for the assassin. */
export const puntaje = e => Math.max(0, base(e) - RESTA_NEUTRAL * e.neutrales - (e.asesino ? RESTA_ASESINO : 0));

/** The share card: one square per card, in grid order (3 columns). */
export function tarjeta(t, e) {
  const casilla = (c, i) => (c.tipo === 'agente' ? (e.tocadas.has(i) ? '🟩' : '🟨') : c.tipo === 'asesino' ? (e.tocadas.has(i) ? '💀' : '⬛') : (e.tocadas.has(i) ? '🟥' : '⬜'));
  const filas = [];
  for (let k = 0; k < t.cartas.length; k += 3) filas.push(t.cartas.slice(k, k + 3).map((c, j) => casilla(c, k + j)).join(''));
  return filas.join('\n');
}
