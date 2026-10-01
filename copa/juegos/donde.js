/**
 * 📍 ¿Dónde queda? — motor puro. Cinco ciudades, una por una: la capital de cualquier país del
 * mundo o una ciudad famosa, con su país. Se toca el mapa donde se cree que queda; cada ciudad
 * vale hasta 100 puntos y se pierden 4 por cada 100 km de error.
 *
 * El mapa es propio y sin nombres (`mapa.js`, lo genera `tools/mapa.mjs`): uno de internet
 * trae los nombres de las ciudades escritos encima. Se dibuja como un globo que se gira sin fin
 * (`globo.js`); la vista y su inversa están aquí, y la distancia se mide sobre la esfera.
 */
import { azar } from './semilla.js';
import { CIUDADES } from './ciudades.js';
import { ciudad, pais } from './nombres.js';

export const CIUDADES_POR_JUEGO = 5;
/** Dos fáciles, dos medianas y una difícil, en ese orden: sin esto, casi todas serían Funafuti. */
export const NIVELES = [1, 1, 2, 2, 3];
/** Kilómetros que cuestan un punto: 4 puntos cada 100 km, así que a 2.500 km ya no hay. */
export const KM_POR_PUNTO = 25;
/** A esta distancia o menos, 🎯: es lo que mide una ciudad grande. */
export const EXACTO_KM = 25;
const RADIO_KM = 6371;

// El mapa: coordenadas enteras en décimas de grado (x = longitud, y = latitud), que el globo
// convierte a vectores de la esfera una sola vez
export const UNIDADES_POR_GRADO = 10;
const RAD = Math.PI / 180;

/** Del globo a la esfera: el vector unitario [x, y, z] de una latitud y longitud. */
export const vector = (lat, lon) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];

/**
 * La vista del globo (proyección ortográfica) mirando al punto `[lat0, lon0]`: de un vector de
 * la esfera a `[x, y, prof]`, con x a la derecha, y hacia arriba, en radios del globo; `prof > 0`
 * es la cara que se ve.
 */
export function ver([X, Y, Z], [lat0, lon0]) {
  const s0 = Math.sin(lat0 * RAD), c0 = Math.cos(lat0 * RAD), sl = Math.sin(lon0 * RAD), cl = Math.cos(lon0 * RAD);
  const A = X * cl + Y * sl, B = Y * cl - X * sl;
  return [B, c0 * Z - s0 * A, s0 * Z + c0 * A];
}

/** Lo contrario: el `[lat, lon]` que se ve en `[x, y]` (en radios), o `null` fuera del globo. */
export function tocado(x, y, [lat0, lon0]) {
  const q = x * x + y * y;
  if (q > 1) return null;
  const prof = Math.sqrt(1 - q);
  const s0 = Math.sin(lat0 * RAD), c0 = Math.cos(lat0 * RAD), sl = Math.sin(lon0 * RAD), cl = Math.cos(lon0 * RAD);
  const Z = c0 * y + s0 * prof, A = -s0 * y + c0 * prof;
  const X = A * cl - x * sl, Y = A * sl + x * cl;
  return [Math.asin(Math.max(-1, Math.min(1, Z))) / RAD, Math.atan2(Y, X) / RAD];
}

/** El punto medio del arco entre dos lugares (para centrar la respuesta). */
export function medio([la1, lo1], [la2, lo2]) {
  const a = vector(la1, lo1), b = vector(la2, lo2);
  const m = [a[0] + b[0], a[1] + b[1], a[2] + b[2]], n = Math.hypot(...m) || 1;
  return [Math.asin(m[2] / n) / RAD, Math.atan2(m[1], m[0]) / RAD];
}

/** Distancia sobre la esfera (haversine), en kilómetros. */
export function distancia([lat1, lon1], [lat2, lon2]) {
  const a = Math.sin(((lat2 - lat1) * RAD) / 2) ** 2
    + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(((lon2 - lon1) * RAD) / 2) ** 2;
  return 2 * RADIO_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export const puntos = km => (Number.isFinite(km) ? Math.max(0, Math.min(100, Math.round(100 - km / KM_POR_PUNTO))) : 0);

/** 🎯 a 25 km o menos · 🟩 hasta 500 · 🟨 hasta 1.250 · 🟧 hasta 2.000 · ⬛ más lejos. */
export function marca(km) {
  if (km <= EXACTO_KM) return '🎯';
  const p = puntos(km);
  return p >= 80 ? '🟩' : p >= 50 ? '🟨' : p >= 20 ? '🟧' : '⬛';
}

/**
 * El nombre como se muestra: "Valparaíso, Chile". Si la ciudad se llama igual que el país, una vez.
 * En inglés y portugués, con los nombres de nombres.js (D-170).
 */
export const nombre = (c, lang = 'es') => {
  const x = ciudad(c.ciudad, lang), y = pais(c.pais, lang);
  return x === y ? x : `${x}, ${y}`;
};

/**
 * Las ciudades del día, de la fácil a la difícil, cada una de un país distinto. `sin` deja
 * afuera las de otra partida (la sesión de prueba no puede adelantar las del día).
 */
export function generar(codigo, dia, { niveles = NIVELES, sal = 'donde', sin = [] } = {}) {
  const a = azar(codigo, dia, sal);
  const fuera = new Set(sin.map(c => c.ciudad));
  const paises = new Set();
  const ciudades = niveles.map(n => {
    const c = a.barajar(CIUDADES.filter(x => x.nivel === n && !fuera.has(x.ciudad) && !paises.has(x.pais)))[0];
    paises.add(c.pais);
    return c;
  });
  return { ciudades };
}

/** Una jugada: `[lat, lon]` redondeados a dos decimales (un kilómetro), que es lo que se guarda. */
export const jugada = (lat, lon) => [Math.round(lat * 100) / 100, Math.round(lon * 100) / 100];

export function estado(p, jugadas) {
  const filas = jugadas.slice(0, p.ciudades.length).map((r, i) => {
    const c = p.ciudades[i], km = distancia([c.lat, c.lon], r);
    return { ciudad: c, r, km: Math.round(km), pts: puntos(km) };
  });
  return { filas, fin: filas.length >= p.ciudades.length, actual: p.ciudades[filas.length] || null, total: filas.reduce((s, f) => s + f.pts, 0) };
}

/** De 0 a 100 (D-113): el promedio de las ciudades, que valen hasta 100 cada una. */
export const puntaje = e => (e.filas.length ? Math.round(e.total / e.filas.length) : 0);

export const tarjeta = e => e.filas.map(f => marca(f.km)).join('');

/** "1.250 km": con punto de miles, como se escribe en Chile ("1,250 km" en inglés). */
export const km = (n, lang = 'es') => `${Math.round(n).toLocaleString({ en: 'en-US', pt: 'pt-BR' }[lang] || 'es-CL')} km`;
