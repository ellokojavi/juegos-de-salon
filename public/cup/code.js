/**
 * A cup's code and the random numbers behind it (D-377): out of engine.js, which re-exports them, so
 * a game that only needs a code (Toque y Fama, Línea de tiempo) does not load La Copa.
 */

/** Código de copa: 5 letras sin las ambiguas (I, O). 24⁵ ≈ 7,9 millones. */
export const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const CODIGO = /^[A-HJ-NP-Z]{5}$/;
export const esCodigo = c => typeof c === 'string' && CODIGO.test(c);

export function codigoAlAzar(rand = cryptoRand) {
  let out = '';
  for (let i = 0; i < 5; i++) out += LETRAS[Math.floor(rand() * LETRAS.length)];
  return out;
}

export function cryptoRand() {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return b[0] / 4294967296;
}
