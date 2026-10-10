/**
 * Las direcciones del panel (D-207). Todo lo que se mira queda en el `#` de la URL, así que un
 * enlace guardado, una recarga o el botón Atrás vuelven al mismo lugar:
 *
 *   #/now                        lo que está pasando
 *   #/cup                        La Copa: cifras, juegos y la lista de copas
 *   #/cup/OFICI                  la ficha de una copa
 *   #/games                      los juegos de una partida
 *   #/game/<juego>               la ficha de un juego, con su nombre en la URL (`hangman`; el id del registro también sirve)
 *   #/room/ABCD                  la ficha de una sala; #/room/ABCD/20342 si es la de ese día
 *   #/traffic                    visitas al sitio, de dónde llegan y cuántas terminan jugando (D-208)
 *   #/audience                   de dónde, idiomas y hora
 *   #/health                     lo que le falla a quien juega: no arrancó, errores, lentitud (D-251)
 *
 * En la URL van en inglés (C-18, D-266); por dentro las secciones siguen con su nombre de siempre
 * (`torneo`, `sala`), y las direcciones de antes (`#/torneo/OFICI`, `#/juego/ahorcado`) se leen igual.
 * El rango y el entorno van detrás, solo si no son los de siempre: `#/cup?r=30d&e=dev`.
 * Puro y sin DOM, para probarlo con node (`node public/panel/rutas.test.mjs`).
 */
import { slugDe, idDeSlug } from '../assets/js/games.js';

/** Las secciones, en el orden de la navegación. La primera es la que abre el panel. */
export const SECCIONES = ['ahora', 'torneo', 'juegos', 'trafico', 'audiencia', 'salud'];

/** A qué sección pertenece cada ficha: es la que queda marcada en la navegación. */
const FICHAS = { juego: 'juegos', sala: 'juegos' };

/** Cómo se escribe cada sección en la URL (D-266). */
const EN_URL = { ahora: 'now', torneo: 'cup', juegos: 'games', trafico: 'traffic', audiencia: 'audience', salud: 'health', juego: 'game', sala: 'room' };
const DE_URL = Object.fromEntries(Object.entries(EN_URL).map(([es, en]) => [en, es]));

/** Las vistas de antes de D-207 (`#torneo`), para que un enlace guardado siga sirviendo. */
const ANTES = { resumen: 'ahora', torneo: 'torneo', juegos: 'juegos' };

/**
 * `#/cup/OFICI?r=30d` → `{ sec: 'torneo', args: ['OFICI'], r: '30d', e: null }`. Lo que no se
 * entiende cae en la primera sección: una dirección rota no deja el panel en blanco.
 */
export function leerRuta(hash = '') {
  const [camino, consulta = ''] = String(hash).replace(/^#/, '').split('?');
  const partes = camino.replace(/^\//, '').split('/').filter(Boolean).map(decodeURIComponent);
  const q = new URLSearchParams(consulta);
  const extra = { r: q.get('r') || null, e: q.get('e') || null };
  let [sec, ...args] = partes;
  if (!camino.startsWith('/') && ANTES[sec]) return { sec: ANTES[sec], args: [], ...extra };
  if (Object.hasOwn(DE_URL, sec)) sec = DE_URL[sec];
  if (sec === 'juego' && args.length) args = [idDeSlug(args[0]), ...args.slice(1)];
  if (sec in FICHAS && args.length) return { sec, args, ...extra };
  if (!SECCIONES.includes(sec)) return { sec: SECCIONES[0], args: [], ...extra };
  return { sec, args, ...extra };
}

/** La dirección de una vista, con el rango y el entorno solo si no son los de siempre. */
export function rutaA(sec, args = [], { r = null, e = null, rDefecto = null, eDefecto = null } = {}) {
  const q = new URLSearchParams();
  if (r && r !== rDefecto) q.set('r', r);
  if (e && e !== eDefecto) q.set('e', e);
  const enUrl = sec === 'juego' ? args.map((a, i) => (i ? a : slugDe(a))) : args;
  const camino = ['', EN_URL[sec] || sec, ...enUrl.map(a => encodeURIComponent(String(a)))].join('/');
  return `#${camino}${q.toString() ? `?${q}` : ''}`;
}

/** La sección que la navegación marca para una ruta: la ficha de un juego es parte de Juegos. */
export const seccionDe = ruta => FICHAS[ruta.sec] || ruta.sec;
