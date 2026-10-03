/**
 * 🔗 Conexiones — motor puro. Dieciséis palabras que se separan en cuatro grupos de cuatro.
 * Se eligen cuatro y se confirma; hay cuatro errores permitidos. Si quedó a una de un grupo,
 * se avisa "a una".
 */
import { fuera } from './audiencia.js';
import { GRILLAS, GRILLA_ENSAYO, GRILLAS_ANTES_D128, CAMBIO_D128 } from './grillas.js';
import * as EN from './grillas-en.js';
import * as PT from './grillas-pt.js';
import { azar, hash32 } from './semilla.js';

export const ERRORES = 4;
export const COLORES = ['amarillo', 'verde', 'azul', 'morado'];
export const EMOJIS = ['🟨', '🟩', '🟦', '🟪'];

/** Las grillas de cada idioma (D-170): cada uno tiene las suyas, no una traducción. */
const IDIOMAS = { en: EN, pt: PT };

/**
 * La grilla de una copa: la misma posición de la lista para siempre. `desde` es cuándo empieza
 * el día de Conexiones de esa copa: si empezó antes del cambio a grupos por significado (D-128),
 * se sigue con la grilla de antes, para no cambiarla a mitad del día.
 */
export const grillaDe = (codigo, { desde = null, lang = 'es', aud = null } = {}) => {
  // D-128 es anterior a los otros idiomas: solo el español tiene grillas de antes
  const todas = IDIOMAS[lang]?.GRILLAS || (desde !== null && desde < CAMBIO_D128 ? GRILLAS_ANTES_D128 : GRILLAS);
  // Sin las grillas con palabras de un país que no es el del público (D-186, D-187)
  const lista = aud ? todas.filter(g => !fuera(g.local, aud)) : todas;
  return lista[hash32(`${codigo}:grilla`) % lista.length];
};

/** `palabras`: el idioma de las palabras, el de la copa (D-170); sin él, `lang`. */
export function generar(codigo, dia, { sal = 'conexiones', grilla, desde = null, lang = 'es', palabras = lang, aud = null } = {}) {
  const g = grilla || grillaDe(codigo, { desde, lang: palabras, aud });
  const a = azar(codigo, dia, sal);
  return {
    id: g.id,
    grupos: g.grupos.map((x, nivel) => ({ nombre: x.nombre, nivel, palabras: x.palabras.slice() })),
    orden: a.barajar(g.grupos.flatMap(x => x.palabras)),
  };
}

const nivelDe = (p, palabra) => p.grupos.findIndex(g => g.palabras.includes(palabra));

/**
 * El estado a partir de los intentos (cada uno, cuatro palabras). Un intento repetido no
 * cuenta dos veces: si ya se probó ese mismo grupo, se ignora.
 */
export function estado(p, intentos) {
  const resueltos = [];
  const filas = [];
  const vistos = new Set();
  let errores = 0;
  for (const it of intentos) {
    if (errores >= ERRORES || resueltos.length === 4) break;
    const clave = it.slice().sort().join('|');
    if (vistos.has(clave) || it.length !== 4) continue;
    vistos.add(clave);
    const niveles = it.map(w => nivelDe(p, w));
    filas.push(niveles);
    const cuenta = {};
    niveles.forEach(n => { cuenta[n] = (cuenta[n] || 0) + 1; });
    const max = Math.max(...Object.values(cuenta));
    if (max === 4) resueltos.push(niveles[0]);
    else errores++;
  }
  const perdio = errores >= ERRORES && resueltos.length < 4;
  const fin = perdio || resueltos.length === 4;
  const restantes = p.orden.filter(w => !resueltos.includes(nivelDe(p, w)));
  return { filas, resueltos, errores, fin, perdio, restantes };
}

/** ¿Quedó a una? (tres de las cuatro son del mismo grupo). Para el aviso después de un error. */
export function aUna(p, intento) {
  const cuenta = {};
  intento.forEach(w => { const n = nivelDe(p, w); cuenta[n] = (cuenta[n] || 0) + 1; });
  return Math.max(...Object.values(cuenta)) === 3;
}

/** ¿Ya se probó exactamente este grupo? */
export function repetido(intentos, intento) {
  const clave = intento.slice().sort().join('|');
  return intentos.some(it => it.slice().sort().join('|') === clave);
}

/** 25 por grupo menos 5 por error: de 0 a 100. */
export const puntaje = e => Math.max(0, 25 * e.resueltos.length - 5 * e.errores);

/** Una fila de colores por intento, como Connections. */
export const tarjeta = e => e.filas.map(f => f.map(n => EMOJIS[n]).join('')).join('\n');

/** La sesión de prueba juega su propia grilla, fuera del sorteo (D-103). */
export const ensayo = (codigo, dia, { lang = 'es', palabras = lang } = {}) => generar(codigo, dia, { sal: 'ensayo', grilla: IDIOMAS[palabras]?.GRILLA_ENSAYO || GRILLA_ENSAYO });
