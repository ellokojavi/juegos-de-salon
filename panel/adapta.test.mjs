// Ejecutar: node panel/adapta.test.mjs
/**
 * El panel se entera solo (C-16).
 *
 * Un juego, un modo, un idioma o un entorno nuevo tiene que aparecer en el panel sin que
 * nadie se acuerde de ir a tocarlo. Lo que lo garantiza no es la buena memoria: es que las
 * listas viven en un solo lugar y que lo desconocido se dibuja igual, con su clave por
 * nombre. Este test es el que no deja que vuelva a haber una lista copiada en el panel ni
 * una enumeración en las reglas de la base.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  GAMES, GAME_IDS, MODES, MODE_IDS, MODE_KEY, LOCAL_MODES, ROOM_MODE, MAX_PLAYERS,
  gameLabel, isLocalMode, modeIcon,
} from '../assets/js/games.js';
import { LANGS } from '../assets/js/i18n.js';
import { startChanges } from '../assets/js/transport/stats.js';
import { summarize, modesOf } from './aggregate.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = r => readFileSync(join(RAIZ, r), 'utf8');
const dia = 20342;

// --- El registro se sostiene solo ---------------------------------------
for (const m of MODE_IDS) {
  assert.ok(MODES[m].icon, `el modo ${m} necesita ícono para el panel`);
  assert.ok(MODES[m].label, `el modo ${m} necesita nombre para la leyenda`);
}
assert.ok(ROOM_MODE && MODES[ROOM_MODE].room, 'tiene que haber un modo de sala');
assert.deepEqual(LOCAL_MODES, MODE_IDS.filter(m => m !== ROOM_MODE));
assert.equal(isLocalMode(ROOM_MODE), false, 'el de la sala se cuenta por sala, no por contador');
// El tope de jugadores sale de los juegos registrados, no de un número escrito a mano
assert.equal(MAX_PLAYERS, Math.max(...GAMES.filter(g => !g.torneo).map(g => Number(g.players.split(/[^\d]+/).pop()))));

// --- Un juego que el panel no conoce ------------------------------------
// Pasa de verdad: la app publicada empieza a mandar señales de un juego nuevo antes de que
// nadie mire el panel, y también quedan guardadas las de un juego que ya se fue del menú.
const nuevo = 'juego-nuevo';
assert.equal(GAME_IDS.includes(nuevo), false, 'el juego inventado no puede existir de verdad');
const conJuegoNuevo = summarize({
  [dia]: { local: { [nuevo]: { solo: { 1: 3 } } }, rooms: { ABCD: { game: nuevo, players: { A: 'a', B: 'b' } } } },
}, { from: dia, to: dia });
assert.equal(conJuegoNuevo.partidas, 4, 'las partidas de un juego desconocido se cuentan igual');
assert.equal(conJuegoNuevo.byGame[nuevo].total, 4);
assert.equal(gameLabel(nuevo), nuevo, 'y se nombra con su id, que es mejor que no verlo');

// --- Un modo que el panel no conoce -------------------------------------
const modo = 'equipos';
assert.equal(MODE_IDS.includes(modo), false, 'el modo inventado no puede existir de verdad');
assert.ok(MODE_KEY.test(modo) && isLocalMode(modo), 'un modo nuevo se acepta por forma');
// El celular lo manda sin que haya que tocar el registro de señales
assert.ok(`local/dudo/${modo}/4` in startChanges({ tz: 'x', lang: 'es', app: 'es', hour: 3 }, { game: 'dudo', mode: modo, players: 4 }));
const conModoNuevo = summarize({ [dia]: { local: { dudo: { [modo]: { 4: 2 }, solo: { 1: 1 } } } } }, { from: dia, to: dia });
assert.equal(conModoNuevo.byGame.dudo.total, 3, 'el modo desconocido suma al total del juego');
assert.equal(conModoNuevo.byGame.dudo[modo], 2);
assert.deepEqual(conModoNuevo.modes, [...MODE_IDS, modo], 'los conocidos en su orden y el nuevo detrás');
assert.equal(modeIcon(modo), '·', 'sin ícono propio, pero con lugar en la barra');
// Lo que no tiene forma de modo sigue siendo basura y no cuenta
assert.equal(summarize({ [dia]: { local: { dudo: { 'NO ES': { 1: 9 } } } } }, { from: dia, to: dia }).partidas, 0);
assert.deepEqual(modesOf({}), MODE_IDS, 'sin datos se muestran los modos conocidos');

// --- Un juego con más gente ---------------------------------------------
const lleno = summarize({
  [dia]: {
    local: { 'cuarto-rey': { local: { [MAX_PLAYERS]: 1 } } },
    rooms: { ABCD: { game: 'dudo', players: Object.fromEntries([...Array(MAX_PLAYERS)].map((_, i) => [i, 'x'])) } },
  },
}, { from: dia, to: dia });
assert.equal(lleno.byPlayers[MAX_PLAYERS], 2, 'la partida más numerosa que existe no se recorta');

// --- El panel no copia listas -------------------------------------------
const fuentes = ['panel/panel.js', 'panel/aggregate.js', 'panel/copas.js'].map(r => [r, leer(r)]);
for (const [ruta, src] of fuentes) {
  for (const id of GAME_IDS) assert.ok(!src.includes(`'${id}'`), `${ruta} nombra el juego ${id}: los juegos salen de games.js (C-16)`);
  for (const m of MODE_IDS) assert.ok(!src.includes(`'${m}'`), `${ruta} nombra el modo ${m}: los modos salen de games.js (C-16)`);
  for (const l of LANGS.filter(x => x !== 'es')) assert.ok(!src.includes(`'${l}'`), `${ruta} nombra el idioma ${l}: el panel es solo en español y los idiomas salen de i18n.js`);
}
const html = leer('panel/index.html');
assert.match(html, /<select id="env"><\/select>/, 'los entornos los pone panel.js, no el HTML');
assert.match(html, /id="modes-legend"><\/p>/, 'la leyenda de modos la escribe panel.js');
for (const m of MODE_IDS) assert.ok(!html.includes(MODES[m].icon), `el HTML del panel dibuja el ícono de ${m} a mano`);

// --- Las reglas de la base validan por forma, no por lista --------------
const reglas = leer('firebase/database.rules.json');
for (const id of GAME_IDS) assert.ok(!reglas.includes(id), `las reglas enumeran el juego ${id}`);
for (const m of LOCAL_MODES) assert.ok(!reglas.includes(`|${m}`) && !reglas.includes(`(${m}|`), `las reglas enumeran el modo ${m}`);
const patron = etiqueta => new RegExp(`\\$${etiqueta}\\.matches\\(/(.+?)/\\)`).exec(reglas)?.[1];
assert.equal(patron('mode'), MODE_KEY.source, 'la forma de un modo es la misma en el código y en las reglas');
assert.match(String(MAX_PLAYERS), new RegExp(patron('n')), `las reglas no aceptan partidas de ${MAX_PLAYERS} jugadores`);
assert.match(modo, new RegExp(patron('mode')), 'las reglas rechazarían un modo nuevo');

console.log('adapta.test.mjs: todo en verde');
