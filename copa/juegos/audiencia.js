/**
 * El público de una copa (D-187): 🌎 global, 🇨🇱 Chile o 🇧🇷 Brasil. Decide qué contenido local
 * entra. Lo que se conoce solo en Chile va marcado 'cl' y lo de Brasil 'br': temáticas y cartas
 * de Línea de Tiempo, grillas de Conexiones, palabras y ciudades.
 *
 * Sin público (`null`) se juega como las copas de antes de D-186: todo lo local, salvo la
 * temática Brasil (D-111). Así una copa que ya existía no cambia de contenido.
 */
export const AUDIENCIAS = ['global', 'cl', 'br'];
const FUERA = { global: ['cl', 'br'], cl: ['br'], br: ['cl'] };

/** ¿Queda fuera, para ese público, algo marcado con `local`? */
export const fuera = (local, aud) => !!local && (FUERA[aud] || []).includes(local);

/** El público de una copa: el suyo, o global si es de las que se marcaban `intl` (D-186). */
export const audienciaDe = meta => (AUDIENCIAS.includes(meta?.aud) ? meta.aud : meta?.intl ? 'global' : null);
