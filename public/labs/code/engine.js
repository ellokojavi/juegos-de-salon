/**
 * La clave — el motor del prototipo de laboratorio (D-270). Un código de 4 cifras dibujadas con
 * siete segmentos, repartido entre dos figuras transparentes: cada una tiene solo una parte de los
 * trazos y sola no se lee. La segunda se muestra girada o volteada; al ponerla encima de la
 * primera con la misma orientación, los trazos se juntan y aparecen las cifras.
 *
 * Las orientaciones son las cuatro de una tarjeta rectangular que se puede girar media vuelta y
 * voltear: I (como está), R (girada 180°), H (volteada de lado) y V (volteada de arriba abajo).
 * Forman un grupo en que cada una es su propia inversa y R·H = V, así que con "girar" y "voltear"
 * se llega a todas. Sin DOM: lo prueba engine.test.mjs.
 */
export const CIFRAS_CODIGO = 4;

/** Los segmentos de cada cifra: a arriba, b arriba a la derecha, c abajo a la derecha, d abajo, e abajo a la izquierda, f arriba a la izquierda, g al medio. */
export const SEGMENTOS = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
};

/** Cómo mueve cada orientación un segmento: la cifra (de izquierda a derecha) y la letra. */
const MAPA = {
  I: { cifra: i => i, seg: {} },
  R: { cifra: i => CIFRAS_CODIGO - 1 - i, seg: { a: 'd', d: 'a', b: 'e', e: 'b', c: 'f', f: 'c' } },
  H: { cifra: i => CIFRAS_CODIGO - 1 - i, seg: { b: 'f', f: 'b', c: 'e', e: 'c' } },
  V: { cifra: i => i, seg: { a: 'd', d: 'a', b: 'c', c: 'b', e: 'f', f: 'e' } },
};
export const ORIENTACIONES = Object.keys(MAPA);

/** Un segmento `{ i, s }` (cifra y letra) visto con la orientación `o`. */
export const mover = (o, { i, s }) => ({ i: MAPA[o].cifra(i), s: MAPA[o].seg[s] || s });

/** Las dos orientaciones seguidas (el grupo es conmutativo y cada una es su inversa). */
export function componer(x, y) {
  if (x === 'I') return y;
  if (y === 'I') return x;
  if (x === y) return 'I';
  return ORIENTACIONES.find(o => o !== 'I' && o !== x && o !== y);
}
export const girar = o => componer(o, 'R');
export const voltear = o => componer(o, 'H');

const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/**
 * Arma una clave: el código, los trazos de la figura A (fija) y los de la B tal como se muestra
 * (`b`), y la orientación que hay que darle a la B para que calce (`o`, nunca I: siempre hay que
 * girarla o voltearla). Cada cifra tiene al menos un trazo en cada figura.
 */
export function generar(r = Math.random) {
  const codigo = Array.from({ length: CIFRAS_CODIGO }, () => Math.floor(r() * 10));
  const a = [], bBien = [];
  codigo.forEach((d, i) => {
    const segs = barajar([...SEGMENTOS[d]], r);
    const k = 1 + Math.floor(r() * (segs.length - 1));
    segs.forEach((s, j) => (j < k ? a : bBien).push({ i, s }));
  });
  const o = ['R', 'H', 'V'][Math.floor(r() * 3)];
  // La B se muestra "deshecha": con la orientación inversa de la que la arregla (que es la misma)
  const b = bBien.map(x => mover(o, x));
  return { codigo: codigo.join(''), a, b, o };
}

/** Lo que se ve con la B encima de la A en la orientación `g`: los segmentos de cada cifra, juntos. */
export function juntos(clave, g) {
  const out = Array.from({ length: CIFRAS_CODIGO }, () => new Set());
  for (const x of clave.a) out[x.i].add(x.s);
  for (const x of clave.b) { const m = mover(g, x); out[m.i].add(m.s); }
  return out;
}

/** La cifra que dibujan esos segmentos, o null si no es ninguna. */
export function leer(segs) {
  const k = [...segs].sort().join('');
  const d = Object.entries(SEGMENTOS).find(([, v]) => [...v].sort().join('') === k);
  return d ? d[0] : null;
}

export const calza = (clave, g) => g === clave.o;
