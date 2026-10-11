/**
 * Agentes — el motor del prototipo de laboratorio (D-286): un Codenames de uno, donde el juego da
 * las pistas y tú adivinas. Un tablero de 12 palabras: 3 grupos de 3 agentes (uno por pista), 2
 * neutrales y 1 asesino que tienta. Las pistas llegan de a una, con su número. Tocar un agente suma
 * (también si es de otra pista: es de los tuyos); una neutral o el asesino restan y cortan la pista.
 * Se puede pasar a la siguiente pista cuando quieras. Sin DOM: lo prueba engine.test.mjs.
 */
import { PISTAS } from './pistas.js';

export const POR_PISTA = 3, CUANTAS = 3, NEUTRALES = 2;
export const AGENTES = POR_PISTA * CUANTAS;
export const RESTA_NEUTRAL = 15, RESTA_ASESINO = 40;

/** Un azar que sale de la semilla: el mismo tablero para todos con la misma. */
function azar(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) { h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/**
 * El tablero de una semilla: `pistas` (la palabra y cuántas van con ella) y `cartas` en el orden de
 * la grilla, cada una `{ w, tipo: 'agente'|'neutral'|'asesino', p }` (`p`: la pista del agente).
 * Ningún agente va también con otra de las pistas del tablero, el asesino se le parece a una pero
 * no va con ninguna, y las neutrales no tientan.
 */
export function generar(semilla) {
  const r = azar(String(semilla));
  for (let intento = 0; intento < 500; intento++) {
    const elegidas = barajar(PISTAS, r).slice(0, CUANTAS);
    const si = new Set(elegidas.flatMap(x => x.si)), casi = new Set(elegidas.flatMap(x => x.casi));
    if (elegidas.some(x => si.has(x.pista) || casi.has(x.pista))) continue;
    // Una pista nunca está en su propio tablero (PLAYA es pista y también va con MAR)
    const usadas = new Set(elegidas.map(x => x.pista));
    const cartas = [];
    let bien = true;
    elegidas.forEach((x, p) => {
      // Las suyas, que no vayan con ninguna otra de las elegidas
      const propias = barajar(x.si.filter(w => !usadas.has(w) && elegidas.every((y, q) => q === p || !y.si.includes(w))), r).slice(0, POR_PISTA);
      if (propias.length < POR_PISTA) bien = false;
      for (const w of propias) { usadas.add(w); cartas.push({ w, tipo: 'agente', p }); }
    });
    if (!bien) continue;
    // El asesino: se le parece a una de las pistas, pero no va con ninguna
    const asesino = barajar([...casi].filter(w => !si.has(w) && !usadas.has(w)), r)[0];
    if (!asesino) continue;
    usadas.add(asesino);
    cartas.push({ w: asesino, tipo: 'asesino', p: null });
    // Las neutrales: de otras pistas, sin parecido con estas
    const otras = PISTAS.filter(x => !elegidas.includes(x)).flatMap(x => x.si).filter(w => !si.has(w) && !casi.has(w) && !usadas.has(w));
    const neutrales = barajar([...new Set(otras)], r).slice(0, NEUTRALES);
    if (neutrales.length < NEUTRALES) continue;
    for (const w of neutrales) { usadas.add(w); cartas.push({ w, tipo: 'neutral', p: null }); }
    return { pistas: elegidas.map(x => ({ pista: x.pista, n: POR_PISTA })), cartas: barajar(cartas, r) };
  }
  throw new Error('no se pudo armar un tablero');
}

/**
 * El estado a partir de las jugadas (C-7): cada jugada es `{ i }` (tocar la carta i) o `{ pasar: true }`.
 * Devuelve la pista en curso (`actual`, o null al terminar), las cartas tocadas, los agentes
 * encontrados, las neutrales y el asesino tocados, y cuántos de la pista en curso faltan.
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
    if (tocadas.has(j.i)) continue;
    tocadas.add(j.i);
    const c = t.cartas[j.i];
    if (c.tipo === 'neutral') { neutrales++; avanzar(); }
    else if (c.tipo === 'asesino') { asesino = true; avanzar(); }
    else if (faltan(actual) === 0) avanzar();
  }
  const encontrados = t.cartas.filter((c, i) => c.tipo === 'agente' && tocadas.has(i)).length;
  const fin = actual >= t.pistas.length;
  return { actual: fin ? null : actual, tocadas, encontrados, neutrales, asesino, fin, faltan: fin ? 0 : faltan(actual) };
}

/** De 0 a 100: los agentes encontrados, menos 15 por neutral y 40 por el asesino. */
export const puntaje = e => Math.max(0, Math.round(100 * e.encontrados / AGENTES) - RESTA_NEUTRAL * e.neutrales - (e.asesino ? RESTA_ASESINO : 0));

/** La tarjeta para compartir: una casilla por carta, en el orden de la grilla (3 columnas). */
export function tarjeta(t, e) {
  const casilla = (c, i) => (c.tipo === 'agente' ? (e.tocadas.has(i) ? '🟩' : '🟨') : c.tipo === 'asesino' ? (e.tocadas.has(i) ? '💀' : '⬛') : (e.tocadas.has(i) ? '🟥' : '⬜'));
  const filas = [];
  for (let k = 0; k < t.cartas.length; k += 3) filas.push(t.cartas.slice(k, k + 3).map((c, j) => casilla(c, k + j)).join(''));
  return filas.join('\n');
}
