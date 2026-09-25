/**
 * Registro de los minijuegos de La Copa. Cada uno: `generar(código, día)` (motor puro, igual
 * en todos los celulares), `montar(raíz, ctx)` (su pantalla) y `resultado(estado)` →
 * { s: puntaje, t: tarjeta, resumen }.
 *
 * Agregar un minijuego: su motor y su pantalla en esta carpeta, su texto en MINIJUEGOS de
 * rules.js y una entrada acá. Para que aparezca en una copa, sumarlo a CALENDARIOS (engine.js).
 */
import * as linea from './linea.js';
import * as numero from './numero.js';
import * as conexiones from './conexiones.js';
import * as reinas from './reinas.js';
import * as letras from './letras.js';
import * as zip from './zip.js';
import * as tango from './tango.js';
import * as anio from './anio.js';
import * as final from './final.js';
import * as uiLinea from './ui-linea.js';
import * as uiNumero from './ui-numero.js';
import * as uiConexiones from './ui-conexiones.js';
import * as uiReinas from './ui-reinas.js';
import * as uiLetras from './ui-letras.js';
import * as uiZip from './ui-zip.js';
import * as uiTango from './ui-tango.js';
import * as uiAnio from './ui-anio.js';
import * as uiFinal from './ui-final.js';

import { temasDeLaCopa, DECKS } from './mazos.js';
import { LETRAS } from '../engine.js';

/**
 * El código con que se arma la sesión de prueba (D-103): otro, derivado del de la copa, para que
 * el contenido sea distinto del de verdad pero igual para todos los que prueban.
 */
export const codigoEnsayo = codigo => [...codigo].map(l => LETRAS[(LETRAS.indexOf(l) + 7) % LETRAS.length]).join('');

/** Una temática que la copa no usa: probar Línea o ¿En qué año? no puede adelantar cartas. */
const temaLibre = codigo => {
  const usados = Object.values(temasDeLaCopa(codigo));
  return DECKS.map(d => d.id).find(id => !usados.includes(id));
};

const juego = (motor, ui, ensayo) => ({ generar: motor.generar, montar: ui.montar, resultado: ui.resultado, ejemplo: ui.ejemplo, ensayo });

export const JUEGOS = {
  linea: juego(linea, uiLinea, (c, d) => linea.generar(codigoEnsayo(c), d, { n: 5, tema: temaLibre(c), sal: 'ensayo' })),
  numero: juego(numero, uiNumero, (c, d) => numero.generar(codigoEnsayo(c), d, { cifras: 3, sal: 'ensayo' })),
  conexiones: juego(conexiones, uiConexiones, (c, d) => conexiones.ensayo(c, d)),
  reinas: juego(reinas, uiReinas, (c, d) => reinas.generar(codigoEnsayo(c), d, { n: 5, sal: 'ensayo' })),
  letras: juego(letras, uiLetras, (c, d) => {
    const real = letras.generar(c, d).secreto;
    for (let k = 0; ; k++) { const p = letras.generar(codigoEnsayo(c), d, { sal: `ensayo-${k}` }); if (p.secreto !== real) return p; }
  }),
  // Zip se arma nivel por nivel dentro de la pantalla: lo generado es solo la semilla del día (D-103)
  zip: { generar: (codigo, dia) => ({ codigo, dia }), montar: uiZip.montar, resultado: uiZip.resultado, ensayo: (c, d) => ({ codigo: codigoEnsayo(c), dia: d, tiempo: 60 * 1000 }) },
  tango: juego(tango, uiTango, (c, d) => tango.generar(codigoEnsayo(c), d, { sal: 'ensayo' })),
  anio: juego(anio, uiAnio, (c, d) => anio.generar(codigoEnsayo(c), d, { n: 2, tema: temaLibre(c), sal: 'ensayo' })),
  final: juego(final, uiFinal, (c, d) => final.generar(codigoEnsayo(c), d)),
};
