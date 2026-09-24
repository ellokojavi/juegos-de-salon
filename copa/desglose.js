/**
 * Cómo se llegó al puntaje (D-106): la cuenta de cada minijuego, línea por línea, a partir del
 * estado con que terminó. Se muestra al terminar el día, la práctica y la sesión de prueba. Los
 * textos son de rules.js (C-3); aquí solo se hacen las cuentas, con las mismas funciones del motor.
 */
import * as numero from './juegos/numero.js';
import * as letras from './juegos/letras.js';
import * as tango from './juegos/tango.js';
import * as anio from './juegos/anio.js';
import * as final from './juegos/final.js';
import { MINIJUEGOS } from './rules.js';

/** Las líneas del desglose; la última es el total. `null` si el juego no lo tiene. */
export function desglose(id, e, { T, fmt, mmss }) {
  if (!e) return null;
  const intentos = (x, max) => (x.resuelto
    ? [fmt(T.bdTries, { u: x.usados, max }), fmt(T.bdTriesPts, { max, u: x.usados, s: max + 1 - x.usados })]
    : [T.bdNotSolved]);
  // Un descuento en cero no se nombra; uno solo va en singular (las claves terminadas en One)
  const resta = (clave, n, v) => (n ? fmt(n === 1 ? T[`${clave}One`] : T[clave], { n, ...v }) : null);
  switch (id) {
    case 'linea': return [fmt(T.bdLinea, { n: e.aciertos, total: e.marcas.length })];
    case 'numero': return intentos(e, numero.MAX_INTENTOS);
    case 'letras': return [
      e.encontradas ? fmt(e.encontradas === 1 ? T.bdFamasOne : T.bdFamas, { n: e.encontradas, pts: letras.PUNTOS_FAMA * e.encontradas }) : T.bdNoFamas,
      e.resuelto ? fmt(e.usados === 1 ? T.bdWordBonusFirst : T.bdWordBonus, { u: e.usados, b: letras.bono(e.usados) }) : T.bdWordNoBonus,
    ];
    case 'conexiones': return [
      fmt(T.bdGroups, { n: e.resueltos.length, pts: 25 * e.resueltos.length }),
      resta('bdMistakes', e.errores, { pts: 5 * e.errores, c: 5 }),
    ].filter(Boolean);
    case 'reinas': return e.fin ? [fmt(T.bdQueensTime, { t: mmss(e.ms || 0) }), T.bdQueensScale] : [T.bdNotSolved];
    case 'tango': return e.fin ? [
      T.bdStart100,
      resta('bdRuleBreaks', e.errores, { pts: 10 * e.errores }) || T.bdNoRuleBreaks,
      resta('bdHints', e.pistas || 0, { pts: tango.COSTO_PISTA * (e.pistas || 0), c: tango.COSTO_PISTA }),
      T.bdFloor10,
    ].filter(Boolean) : [T.bdNotSolved];
    case 'zip': return [
      fmt(e.hechos === 1 ? T.bdLevelsOne : T.bdLevels, { n: e.hechos || 0 }),
      e.hechos ? fmt(T.bdLastLevel, { t: mmss(e.ultimo || 0) }) : null,
    ].filter(Boolean);
    case 'anio': return e.filas.map(f => fmt(T.bdYear, { hito: f.hito.texto, r: anio.anioLabel(f.r), y: anio.anioLabel(f.hito.year), pts: f.pts }));
    case 'final': return final.RONDAS.map(r => fmt(T.bdRound, {
      emoji: final.EMOJI[r], juego: MINIJUEGOS[r].nombre, pts: e[r] ? final.puntosRonda[r](e[r]) : 0,
    }));
    default: return null;
  }
}
