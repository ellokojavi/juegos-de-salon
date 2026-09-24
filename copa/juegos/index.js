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
import * as solitario from './solitario.js';
import * as dudo from './dudo.js';
import * as anio from './anio.js';
import * as final from './final.js';
import * as uiLinea from './ui-linea.js';
import * as uiNumero from './ui-numero.js';
import * as uiConexiones from './ui-conexiones.js';
import * as uiSolitario from './ui-solitario.js';
import * as uiDudo from './ui-dudo.js';
import * as uiAnio from './ui-anio.js';
import * as uiFinal from './ui-final.js';

const juego = (motor, ui) => ({ generar: motor.generar, montar: ui.montar, resultado: ui.resultado });

export const JUEGOS = {
  linea: juego(linea, uiLinea),
  numero: juego(numero, uiNumero),
  conexiones: juego(conexiones, uiConexiones),
  solitario: juego(solitario, uiSolitario),
  dudo: juego(dudo, uiDudo),
  anio: juego(anio, uiAnio),
  final: juego(final, uiFinal),
};
