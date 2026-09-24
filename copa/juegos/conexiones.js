/**
 * 🔗 Conexiones — motor puro. Dieciséis palabras que se separan en cuatro grupos de cuatro.
 * Se eligen cuatro y se confirma; hay cuatro errores permitidos. Si quedó a una de un grupo,
 * se avisa "a una".
 */
import { GRILLAS, GRILLA_ENSAYO } from './grillas.js';
import { azar, hash32 } from './semilla.js';

export const ERRORES = 4;
export const COLORES = ['amarillo', 'verde', 'azul', 'morado'];
export const EMOJIS = ['🟨', '🟩', '🟦', '🟪'];

/** La grilla de la copa: una por copa (la semilla del código, no la del día). */
export const grillaDe = codigo => GRILLAS[hash32(`${codigo}:grilla`) % GRILLAS.length];

export function generar(codigo, dia, { sal = 'conexiones', grilla } = {}) {
  const g = grilla || grillaDe(codigo);
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
export const ensayo = (codigo, dia) => generar(codigo, dia, { sal: 'ensayo', grilla: GRILLA_ENSAYO });
