/**
 * Registro de los juegos de La Copa. Cada uno: `generar(código, día)` (motor puro, igual
 * en todos los celulares), `montar(raíz, ctx)` (su pantalla) y `resultado(estado)` →
 * { s: puntaje, t: tarjeta, resumen }.
 * Opcionales: `ejemplo` (el dibujo de cómo se juega), `portada` (lo de arriba de la antesala),
 * `titulo` (el nombre en la antesala), `pruebaCompleta` (la prueba es igual de larga y difícil
 * que el juego) y `pantallaCompleta`.
 *
 * Agregar un juego: su motor y su pantalla en esta carpeta, su texto en JUEGOS_COPA de
 * rules.js y una entrada acá. Para que se pueda elegir en una copa, sumarlo a POZO (engine.js).
 */
import * as linea from './timeline/engine.js';
import * as numero from './number/engine.js';
import * as conexiones from './connections/engine.js';
import * as reinas from './queens/engine.js';
import * as letras from './word/engine.js';
import * as zip from './zip/engine.js';
import * as tango from './tango/engine.js';
import * as anio from './year/engine.js';
import * as final from './final/engine.js';
import * as donde from './where/engine.js';
import * as desenredo from './untangle/engine.js';
import * as caso from './case/engine.js';
import * as uiLinea from './timeline/ui.js';
import * as uiNumero from './number/ui.js';
import * as uiConexiones from './connections/ui.js';
import * as uiReinas from './queens/ui.js';
import * as uiLetras from './word/ui.js';
import * as uiZip from './zip/ui.js';
import * as uiTango from './tango/ui.js';
import * as uiAnio from './year/ui.js';
import * as uiFinal from './final/ui.js';
import * as uiDonde from './where/ui.js';
import * as uiDesenredo from './untangle/ui.js';
import * as uiCaso from './case/ui.js';

import { temasDeLaCopa, decksDe } from './mazos.js';
import { LETRAS } from '../engine.js';

/**
 * El código con que se arma la sesión de prueba (D-103): otro, derivado del de la copa, para que
 * el contenido sea distinto del de verdad pero igual para todos los que prueban.
 */
export const codigoEnsayo = codigo => [...codigo].map(l => LETRAS[(LETRAS.indexOf(l) + 7) % LETRAS.length]).join('');

/** Una temática que la copa no usa: probar Línea o ¿En qué año? no puede adelantar cartas. */
const temaLibre = (codigo, aud = null) => {
  const usados = Object.values(temasDeLaCopa(codigo, { aud }));
  return decksDe({ aud }).map(d => d.id).find(id => !usados.includes(id));
};

const juego = (motor, ui, ensayo) => ({ generar: motor.generar, montar: ui.montar, resultado: ui.resultado, ejemplo: ui.ejemplo, portada: ui.portada, titulo: ui.titulo, pruebaCompleta: !!ui.pruebaCompleta, pantallaCompleta: !!ui.pantallaCompleta, ensayo });

/**
 * `generar(código, día, opciones)` y `ensayo(código, día, opciones)` reciben el idioma (D-170):
 * `lang`, el de quien juega, para los textos (hitos, ciudades), y `palabras`, el de la copa, para
 * las palabras que todos tienen que jugar iguales (Conexiones y Palabra). Sin `palabras`, `lang`.
 */
export const JUEGOS = {
  linea: juego(linea, uiLinea, (c, d, o = {}) => linea.generar(codigoEnsayo(c), d, { n: 5, tema: temaLibre(c, o.aud), sal: 'ensayo', lang: o.lang, aud: o.aud })),
  numero: juego(numero, uiNumero, (c, d) => numero.generar(codigoEnsayo(c), d, { cifras: 3, sal: 'ensayo' })),
  conexiones: juego(conexiones, uiConexiones, (c, d, o) => conexiones.ensayo(c, d, o)),
  reinas: juego(reinas, uiReinas, (c, d) => reinas.generar(codigoEnsayo(c), d, { n: 5, sal: 'ensayo' })),
  letras: juego(letras, uiLetras, (c, d, o = {}) => {
    const real = letras.generar(c, d, o).secreto;
    for (let k = 0; ; k++) { const p = letras.generar(codigoEnsayo(c), d, { ...o, sal: `ensayo-${k}` }); if (p.secreto !== real) return p; }
  }),
  // Zip se arma nivel por nivel dentro de la pantalla: lo generado es solo la semilla del día (D-103)
  zip: { generar: (codigo, dia) => ({ codigo, dia }), montar: uiZip.montar, resultado: uiZip.resultado, ejemplo: uiZip.ejemplo, ensayo: (c, d) => ({ codigo: codigoEnsayo(c), dia: d, tiempo: 60 * 1000 }) },
  // Como Zip: los niveles se arman dentro de la pantalla y lo generado es solo la semilla del día (D-179)
  desenredo: { generar: (codigo, dia) => ({ codigo, dia }), montar: uiDesenredo.montar, resultado: uiDesenredo.resultado, ejemplo: uiDesenredo.ejemplo, ensayo: (c, d) => ({ codigo: codigoEnsayo(c), dia: d, tiempo: 60 * 1000 }) },
  tango: juego(tango, uiTango, (c, d) => tango.generar(codigoEnsayo(c), d, { sal: 'ensayo' })),
  anio: juego(anio, uiAnio, (c, d, o = {}) => anio.generar(codigoEnsayo(c), d, { n: 2, tema: temaLibre(c, o.aud), sal: 'ensayo', lang: o.lang, aud: o.aud })),
  // Dos ciudades que no son las del día: la prueba no puede adelantar ninguna
  donde: juego(donde, uiDonde, (c, d, o = {}) => donde.generar(codigoEnsayo(c), d, { niveles: [1, 2], sal: 'ensayo', aud: o.aud, sin: donde.generar(c, d, { aud: o.aud }).ciudades })),
  // En el laboratorio (D-257): se juega suelto y en la práctica, pero no está en POZO, así que una copa todavía no lo elige
  caso: juego(caso, uiCaso, (c, d) => caso.generar(codigoEnsayo(c), d, { sal: 'ensayo' })),
  final: juego(final, uiFinal, (c, d, o) => final.generar(codigoEnsayo(c), d, o)),
};
