/**
 * Las direcciones del panel (D-207). Todo lo que se mira queda en el `#` de la URL, así que un
 * enlace guardado, una recarga o el botón Atrás vuelven al mismo lugar:
 *
 *   #/ahora                      lo que está pasando
 *   #/torneo                     La Copa: cifras, juegos y la lista de copas
 *   #/torneo/OFICI               la ficha de una copa
 *   #/juegos                     los juegos de una partida
 *   #/juego/<id>                 la ficha de un juego (el id del registro, no su carpeta)
 *   #/sala/ABCD                  la ficha de una sala; #/sala/ABCD/20342 si es la de ese día
 *   #/trafico                    visitas al sitio, de dónde llegan y cuántas terminan jugando (D-208)
 *   #/audiencia                  de dónde, idiomas y hora
 *
 * El rango y el entorno van detrás, solo si no son los de siempre: `#/torneo?r=30d&e=dev`.
 * Puro y sin DOM, para probarlo con node (`node public/panel/rutas.test.mjs`).
 */

/** Las secciones, en el orden de la navegación. La primera es la que abre el panel. */
export const SECCIONES = ['ahora', 'torneo', 'juegos', 'trafico', 'audiencia'];

/** A qué sección pertenece cada ficha: es la que queda marcada en la navegación. */
const FICHAS = { juego: 'juegos', sala: 'juegos' };

/** Las vistas de antes de D-207 (`#torneo`), para que un enlace guardado siga sirviendo. */
const ANTES = { resumen: 'ahora', torneo: 'torneo', juegos: 'juegos' };

/**
 * `#/torneo/OFICI?r=30d` → `{ sec: 'torneo', args: ['OFICI'], r: '30d', e: null }`. Lo que no se
 * entiende cae en la primera sección: una dirección rota no deja el panel en blanco.
 */
export function leerRuta(hash = '') {
  const [camino, consulta = ''] = String(hash).replace(/^#/, '').split('?');
  const partes = camino.replace(/^\//, '').split('/').filter(Boolean).map(decodeURIComponent);
  const q = new URLSearchParams(consulta);
  const extra = { r: q.get('r') || null, e: q.get('e') || null };
  let [sec, ...args] = partes;
  if (!camino.startsWith('/') && ANTES[sec]) return { sec: ANTES[sec], args: [], ...extra };
  if (sec in FICHAS && args.length) return { sec, args, ...extra };
  if (!SECCIONES.includes(sec)) return { sec: SECCIONES[0], args: [], ...extra };
  return { sec, args, ...extra };
}

/** La dirección de una vista, con el rango y el entorno solo si no son los de siempre. */
export function rutaA(sec, args = [], { r = null, e = null, rDefecto = null, eDefecto = null } = {}) {
  const q = new URLSearchParams();
  if (r && r !== rDefecto) q.set('r', r);
  if (e && e !== eDefecto) q.set('e', e);
  const camino = ['', sec, ...args.map(a => encodeURIComponent(String(a)))].join('/');
  return `#${camino}${q.toString() ? `?${q}` : ''}`;
}

/** La sección que la navegación marca para una ruta: la ficha de un juego es parte de Juegos. */
export const seccionDe = ruta => FICHAS[ruta.sec] || ruta.sec;
