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

/** Todas las combinaciones válidas (5040 con 4 cifras, 30240 con 5). */
export function allCandidates(digits, { zeroFirst = true } = {}) {
  const out = [];
  const rec = (prefix, used) => {
    if (prefix.length === digits) { out.push(prefix); return; }
    for (let d = 0; d <= 9; d++) {
      if (used & (1 << d)) continue;
      if (prefix.length === 0 && d === 0 && !zeroFirst) continue;
      rec(prefix + d, used | (1 << d));
    }
  };
  rec('', 0);
  return out;
}

/**
 * Solver por eliminación: mantiene los candidatos consistentes con las respuestas recibidas.
 * Con 4 cifras adivina en 5 a 7 intentos, como un buen jugador humano.
 */
export class Solver {
  constructor(digits, opts = {}) {
    this.digits = digits;
    this.candidates = allCandidates(digits, opts);
  }
  /** Próximo intento: un candidato al azar entre los consistentes. */
  next() {
    if (!this.candidates.length) return null;
    return this.candidates[Math.floor(Math.random() * this.candidates.length)];
  }
  /** Registra la respuesta a un intento y filtra candidatos. */
  learn(guess, { famas, toques }) {
    this.candidates = this.candidates.filter(c => {
      const s = score(guess, c);
      return s.famas === famas && s.toques === toques;
    });
    return this.candidates.length;
  }
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
