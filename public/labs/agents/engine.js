/**
 * Agentes — el motor del prototipo de laboratorio (D-286): un Codenames de uno, donde el juego da
 * las pistas y tú adivinas. Un tablero de 15 palabras: 4 grupos de agentes (uno por pista; tres de 3 y uno de 2, cuál cambia
 * con cada tablero), 3
 * neutrales y 1 asesino que tienta. Las pistas llegan de a una, con su número. Tocar un agente suma
 * (también si es de otra pista: es de los tuyos); una neutral o el asesino restan y cortan la pista.
 * Se puede pasar a la siguiente pista cuando quieras. Sin DOM: lo prueba engine.test.mjs.
 */
import { PISTAS, CLASICAS, ABSTRACTAS } from './pistas.js';

// Una de las pistas lleva un agente menos (CORTAS): no se sabe de antemano que todas son de 3, y queda
// lugar para una trampa más
export const POR_PISTA = 3, CUANTAS = 4, CORTAS = 1, NEUTRALES = 3;
export const AGENTES = POR_PISTA * CUANTAS - CORTAS;
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
 * la grilla, cada una `{ w, tipo: 'agente'|'neutral'|'asesino', p }` (`p`: la pista del agente; el asesino
 * lleva además `tienta`: la pista a la que se parece).
 * Ningún agente va también con otra de las pistas del tablero; el asesino y las neutrales se le
 * parecen a una (salen de sus tentaciones, `casi`) pero no van con ninguna: así las tres cartas que
 * no son tuyas parecen de alguna pista. Las neutrales llevan también `tienta`.
 */
/** Si en el grupo hay una pista que es palabra (o tentación) de otra: no van juntas. */
const sePisan = grupo => {
  const si = new Set(grupo.flatMap(x => x.si)), casi = new Set(grupo.flatMap(x => x.casi));
  return grupo.some(x => si.has(x.pista) || casi.has(x.pista));
};

/**
 * El calendario (D-288): los tableros del día recorren todas las pistas en vueltas barajadas, y una
 * pista no vuelve antes de SIN_REPETIR días. Se calcula día a día desde ANCLA (lo que pasó antes
 * decide lo que queda), así que es igual en todos los celulares. `null` si un día no se puede armar,
 * o es anterior a ANCLA: entonces se elige al azar, como «Otro tablero».
 */
export const SIN_REPETIR = 15;
const ANCLA = Math.floor(Date.UTC(2026, 9, 1) / 864e5);
// Las de ideas (ABSTRACTAS, #383) entran al calendario este día, barajadas con las que quedaban en
// la cola: los días de antes siguen siendo los que se jugaron
export const ABSTRACTAS_DESDE = Math.floor(Date.UTC(2026, 9, 16) / 864e5);
export function pistasDelDia(n) {
  if (n < ANCLA) return null;
  let cola = [], vuelta = 0, grupo = null;
  const recientes = [];
  for (let d = ANCLA; d <= n; d++) {
    const todas = d < ABSTRACTAS_DESDE ? CLASICAS : PISTAS;
    if (d === ABSTRACTAS_DESDE) cola = barajar([...cola, ...ABSTRACTAS], azar('abstractas'));
    if (cola.length < todas.length / 2) cola = cola.concat(barajar(todas, azar(`vuelta:${vuelta++}`)).filter(x => !cola.includes(x)));
    const bloqueadas = new Set(recientes.flat());
    grupo = [];
    for (const x of cola) { if (grupo.length === CUANTAS) break; if (!bloqueadas.has(x) && !sePisan([...grupo, x])) grupo.push(x); }
    if (grupo.length < CUANTAS) grupo = null; else cola = cola.filter(x => !grupo.includes(x));
    recientes.push(grupo || []);
    if (recientes.length > SIN_REPETIR) recientes.shift();
  }
  return grupo;
}
const DIA = /^dia:(\d{4})-(\d{2})-(\d{2})$/;
/** El número de día de una semilla `dia:AAAA-MM-DD` (días desde 1970), o null. */
export const numeroDeDia = semilla => { const m = DIA.exec(String(semilla)); return m ? Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5) : null; };

export function generar(semilla) {
  const r = azar(String(semilla));
  const dia = numeroDeDia(semilla), fijas = dia === null ? null : pistasDelDia(dia);
  for (let intento = 0; intento < 500; intento++) {
    // El tablero del día usa las pistas del calendario; si con ellas no se arma (raro), se eligen al azar
    const elegidas = fijas && intento < 60 ? fijas : barajar(PISTAS, r).slice(0, CUANTAS);
    const si = new Set(elegidas.flatMap(x => x.si)), casi = new Set(elegidas.flatMap(x => x.casi));
    if (elegidas.some(x => si.has(x.pista) || casi.has(x.pista))) continue;
    // Una pista nunca está en su propio tablero (PLAYA es pista y también va con MAR)
    const usadas = new Set(elegidas.map(x => x.pista));
    const cartas = [];
    let bien = true;
    const corta = Math.floor(r() * CUANTAS);
    const cuantos = p => POR_PISTA - (p === corta ? CORTAS : 0);
    elegidas.forEach((x, p) => {
      // Las suyas, que no vayan con ninguna otra de las elegidas
      const propias = barajar(x.si.filter(w => !usadas.has(w) && elegidas.every((y, q) => q === p || !y.si.includes(w))), r).slice(0, cuantos(p));
      if (propias.length < cuantos(p)) bien = false;
      for (const w of propias) { usadas.add(w); cartas.push({ w, tipo: 'agente', p }); }
    });
    if (!bien) continue;
    // El asesino: se le parece a una de las pistas, pero no va con ninguna
    const asesino = barajar([...casi].filter(w => !si.has(w) && !usadas.has(w)), r)[0];
    if (!asesino) continue;
    usadas.add(asesino);
    // `tienta`: la pista a la que se parece, para explicar la trampa al final
    cartas.push({ w: asesino, tipo: 'asesino', p: null, tienta: elegidas.findIndex(x => x.casi.includes(asesino)) });
    // Las neutrales también tientan: de las tentaciones que quedan, de preferencia de otras pistas
    // que la del asesino, para que la trampa no se concentre en una sola
    const quedan = barajar([...casi].filter(w => !si.has(w) && !usadas.has(w)), r);
    const tientaA = w => elegidas.findIndex(x => x.casi.includes(w));
    const neutrales = [...quedan.filter(w => tientaA(w) !== tientaA(asesino)), ...quedan.filter(w => tientaA(w) === tientaA(asesino))].slice(0, NEUTRALES);
    if (neutrales.length < NEUTRALES) continue;
    for (const w of neutrales) { usadas.add(w); cartas.push({ w, tipo: 'neutral', p: null, tienta: tientaA(w) }); }
    return { pistas: elegidas.map((x, p) => ({ pista: x.pista, n: cuantos(p) })), cartas: barajar(cartas, r) };
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
