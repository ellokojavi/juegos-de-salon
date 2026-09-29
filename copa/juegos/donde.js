/**
 * 📍 ¿Dónde queda? — motor puro. Cinco ciudades, una por una: la capital de cualquier país del
 * mundo o una ciudad famosa, con su país. Se toca el mapa donde se cree que queda; cada ciudad
 * vale hasta 100 puntos y se pierden 4 por cada 100 km de error.
 *
 * El mapa es propio y sin nombres (`mapa.js`, lo genera `tools/mapa.mjs`): uno de internet
 * trae los nombres de las ciudades escritos encima. Va en proyección de Miller, que se parece al
 * mapa del colegio y se invierte con una fórmula; la distancia se mide sobre la esfera, así que lo
 * que la proyección estira no cambia el puntaje.
 */
import { azar } from './semilla.js';
import { CIUDADES } from './ciudades.js';

export const CIUDADES_POR_JUEGO = 5;
/** Dos fáciles, dos medianas y una difícil, en ese orden: sin esto, casi todas serían Funafuti. */
export const NIVELES = [1, 1, 2, 2, 3];
/** Kilómetros que cuestan un punto: 4 puntos cada 100 km, así que a 2.500 km ya no hay. */
export const KM_POR_PUNTO = 25;
/** A esta distancia o menos, 🎯: es lo que mide una ciudad grande. */
export const EXACTO_KM = 25;
const RADIO_KM = 6371;

// El mapa: 10 unidades por grado de longitud, de 84° N a 57° S (lo que queda afuera es hielo)
export const UNIDADES_POR_GRADO = 10;
export const NORTE = 84;
export const SUR = -57;
const RAD = Math.PI / 180;
const K = UNIDADES_POR_GRADO / RAD;
const miller = lat => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * RAD));
export const ANCHO = 360 * UNIDADES_POR_GRADO;
export const ALTO = Math.round((miller(NORTE) - miller(SUR)) * K);

/** Del globo al mapa: `[x, y]` en unidades del dibujo, con y hacia abajo. */
export const proyectar = (lat, lon) => [(lon + 180) * UNIDADES_POR_GRADO, (miller(NORTE) - miller(lat)) * K];

/** Del mapa al globo: `[lat, lon]`. La longitud se da vuelta al pasar el borde. */
export function desproyectar(x, y) {
  const m = miller(NORTE) - y / K;
  const lat = (2.5 * Math.atan(Math.exp(0.8 * m)) - 0.625 * Math.PI) / RAD;
  const lon = ((((x / UNIDADES_POR_GRADO) % 360) + 360) % 360) - 180;
  return [lat, lon];
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

/** El nombre como se muestra: "Valparaíso, Chile". Si la ciudad se llama igual que el país, una vez. */
export const nombre = c => (c.ciudad === c.pais ? c.ciudad : `${c.ciudad}, ${c.pais}`);

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

/** "1.250 km": con punto de miles, como se escribe en Chile. */
export const km = n => `${Math.round(n).toLocaleString('es-CL')} km`;
