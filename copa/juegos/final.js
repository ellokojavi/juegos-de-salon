/**
 * 🏁 La Gran Final — motor puro. Cinco rondas cortas seguidas, una de cada minijuego de la
 * semana que tiene versión corta, cada una de 0 a 100. Vale doble en la tabla.
 */
import * as linea from './linea.js';
import * as numero from './numero.js';
import * as reinas from './reinas.js';
import * as letras from './letras.js';
import * as anio from './anio.js';
import { temasDeLaCopa } from './mazos.js';

export const RONDAS = ['linea', 'numero', 'reinas', 'letras', 'anio'];
export const EMOJI = { linea: '⏳', numero: '🔢', reinas: '👑', letras: '🔤', anio: '📅' };

export const NUMERO_CIFRAS = 3;
export const NUMERO_INTENTOS = 7;
export const LETRAS_INTENTOS = 6;

export function generar(codigo, dia) {
  const tema = temasDeLaCopa(codigo).final;
  return {
    linea: linea.generar(codigo, dia, { n: 4, tema, sal: 'final-linea' }),
    numero: numero.generar(codigo, dia, { cifras: NUMERO_CIFRAS, sal: 'final-numero' }),
    reinas: reinas.generar(codigo, dia, { n: 6, sal: 'final-reinas' }),
    letras: letras.generar(codigo, dia, { max: LETRAS_INTENTOS, sal: 'final-letras' }),
    anio: anio.generar(codigo, dia, { n: 2, tema, sal: 'final-anio' }),
  };
}

/** De 0 a 100 por ronda, a partir del estado de cada motor. */
export const puntosRonda = {
  linea: e => Math.round((100 * e.aciertos) / e.marcas.length || 0),
  numero: e => (e.resuelto ? Math.max(10, 100 - 15 * (e.usados - 1)) : 0),
  reinas: e => (e.fin && !e.rendido ? 100 : 0), // sin castigo por error (D-107); el tiempo de la final desempata
  letras: e => letras.puntaje(e), // las mismas famas y el mismo bono del día (D-108)
  anio: e => Math.round(e.total / e.filas.length || 0),
};

/** `rondas` = { linea: estado, numero: estado, ... } de las rondas terminadas. */
export const puntaje = rondas => RONDAS.reduce((s, r) => s + (rondas[r] ? puntosRonda[r](rondas[r]) : 0), 0);

export const tarjeta = rondas => RONDAS.map(r => `${EMOJI[r]}${rondas[r] ? puntosRonda[r](rondas[r]) : 0}`).join(' ');
