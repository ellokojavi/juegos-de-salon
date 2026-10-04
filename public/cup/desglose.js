/**
 * Cómo se llegó al puntaje (D-106): la cuenta de cada juego, línea por línea, a partir del
 * estado con que terminó. Se muestra al terminar el día, la práctica y la sesión de prueba. Los
 * textos son de rules.js (C-3); aquí solo se hacen las cuentas, con las mismas funciones del motor.
 */
import * as numero from './games/number/engine.js';
import * as letras from './games/word/engine.js';
import * as tango from './games/tango/engine.js';
import * as anio from './games/year/engine.js';
import * as final from './games/final/engine.js';
import * as donde from './games/where/engine.js';
import { juegosCopa } from './rules.js';

/**
 * Las líneas del desglose; la última es el total. `null` si el juego no lo tiene. Con `copa: false`
 * (la práctica, el suelto, la sesión de prueba) no se habla de empates: no hay con quién (dilema #72).
 */
export function desglose(id, e, { T, fmt, mmss, copa = true, lang = 'es' }) {
  if (!e) return null;
  const intentos = (x, max) => (x.resuelto
    ? [fmt(T.bdTries, { u: x.usados, max }), fmt(T.bdTriesPts, { menos: 10 * (x.usados - 1), s: numero.puntaje(x, max) })]
    : [T.bdNotSolved]);
  // Un descuento en cero no se nombra; uno solo va en singular (las claves terminadas en One)
  const resta = (clave, n, v) => (n ? fmt(n === 1 ? T[`${clave}One`] : T[clave], { n, ...v }) : null);
  switch (id) {
    case 'linea': return [fmt(T.bdLinea, { n: e.aciertos, total: e.marcas.length, s: Math.round((100 * e.aciertos) / (e.marcas.length || 1)) })];
    case 'numero': return intentos(e, numero.MAX_INTENTOS);
    case 'letras': return [
      e.encontradas ? fmt(e.encontradas === 1 ? T.bdFamasOne : T.bdFamas, { n: e.encontradas, pts: letras.PUNTOS_FAMA * e.encontradas }) : T.bdNoFamas,
      e.resuelto ? fmt(e.usados === 1 ? T.bdWordBonusFirst : T.bdWordBonus, { u: e.usados, b: letras.bono(e.usados) }) : T.bdWordNoBonus,
    ];
    case 'conexiones': return [
      fmt(T.bdGroups, { n: e.resueltos.length, pts: 25 * e.resueltos.length }),
      resta('bdMistakes', e.errores, { pts: 5 * e.errores, c: 5 }),
    ].filter(Boolean);
    case 'reinas': if (e.rendido) return [T.bdGaveUp];
      return e.fin ? [fmt(T.bdQueensTime, { t: mmss(e.ms || 0) }), T.bdQueensScale] : [T.bdNotSolved];
    case 'tango': return e.fin ? [
      T.bdStart100,
      resta('bdRuleBreaks', e.errores, { pts: 10 * e.errores }) || T.bdNoRuleBreaks,
      resta('bdHints', e.pistas || 0, { pts: tango.COSTO_PISTA * (e.pistas || 0), c: tango.COSTO_PISTA }),
      T.bdFloor10,
    ].filter(Boolean) : [T.bdNotSolved];
    case 'zip': case 'desenredo': return [
      fmt(e.hechos === 1 ? T.bdLevelsOne : T.bdLevels, { n: e.hechos || 0, pts: Math.min(100, 10 * (e.hechos || 0)) }),
      e.hechos ? fmt(copa ? T.bdLastLevel : T.bdLastLevelSolo, { t: mmss(e.ultimo || 0) }) : null,
    ].filter(Boolean);
    case 'anio': return [...e.filas.map(f => fmt(T.bdYear, { hito: f.hito.texto, r: anio.anioLabel(f.r, lang), y: anio.anioLabel(f.hito.year, lang), pts: f.pts })), T.bdAverage];
    case 'donde': return [...e.filas.map(f => fmt(T.bdCity, { c: donde.nombre(f.ciudad, lang), km: donde.km(f.km, lang), pts: f.pts })), T.bdAverage];
    case 'final': return [...final.RONDAS.map(r => fmt(T.bdRound, {
      emoji: final.EMOJI[r], juego: juegosCopa(lang)[r].nombre, pts: e[r] ? final.puntosRonda[r](e[r]) : 0,
    })), T.bdAverage];
    default: return null;
  }
}
