/**
 * Toque y Fama — motor puro (sin DOM). Testeable con node.
 * fama = cifra correcta en la posición correcta · toque = cifra correcta en otra posición.
 */

/** Compara un intento con el secreto. Ambos son strings de cifras distintas y mismo largo. */
export function score(guess, secret) {
  let famas = 0, toques = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) famas++;
    else if (secret.includes(guess[i])) toques++;
  }
  return { famas, toques };
}

/** Valida un número: largo exacto, solo cifras, sin repetir, y cero inicial según config. */
export function isValid(value, digits, { zeroFirst = true } = {}) {
  if (typeof value !== 'string' || value.length !== digits) return false;
  if (!/^\d+$/.test(value)) return false;
  if (new Set(value).size !== digits) return false;
  if (!zeroFirst && value[0] === '0') return false;
  return true;
}

/** Número secreto al azar. */
export function randomSecret(digits, { zeroFirst = true } = {}) {
  const pool = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let out;
  do {
    const p = pool.slice();
    out = '';
    for (let i = 0; i < digits; i++) out += p.splice(Math.floor(Math.random() * p.length), 1)[0];
  } while (!isValid(out, digits, { zeroFirst }));
  return out;
}

/** SHA-256 en hexadecimal (requiere contexto seguro: https o localhost). */
export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Nonce aleatorio en hexadecimal. */
export function randomNonce(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica el compromiso y que todas las respuestas dadas por un jugador coincidan con su secreto.
 * El compromiso es sha256(secreto + sal privada). La sal se revela al final; el nonce del sorteo es público
 * y por eso NO se usa en el compromiso (con solo 5040 secretos posibles sería trivial de romper).
 */
export async function verifyPlayer({ secret, salt, commit, repliesGiven }) {
  const hashOk = (await sha256(secret + salt)) === commit;
  const repliesOk = repliesGiven.every(r => { const s = score(r.value, secret); return s.famas === r.famas && s.toques === r.toques; });
  return { hashOk, repliesOk, ok: hashOk && repliesOk };
}
