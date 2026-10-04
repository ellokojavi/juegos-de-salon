/**
 * Sobres cerrados: cómo se le manda algo tapado a un jugador de la sala.
 *
 * La sala se lee con solo saber el código (C-15): todo lo que viaja por ahí lo puede leer
 * cualquiera que abra la consola. Para los dados del Dudo alcanzó con publicar un hash (C-10),
 * porque ahí el secreto se destapa entero al final. Las cartas son otra cosa: hay que
 * **entregárselas** a alguien y que nadie más las vea mientras se juega.
 *
 * Cada celular genera un par de llaves al entrar a la sala y publica la pública con su nombre.
 * Quien reparte cierra la mano de cada uno con la llave de esa persona (RSA-OAEP, del propio
 * navegador: sin biblioteca y sin instalar nada, C-14). Solo ese celular puede abrirlo.
 *
 * Lo que esto **no** evita: quien reparte arma las manos, así que en su propio celular pasan
 * por la memoria en claro. Es exactamente el trato de la mesa real —el que baraja podría
 * marcar las cartas— y por eso el reparto rota en cada mano (D-81).
 *
 * Necesita contexto seguro (https o localhost). Si no lo hay, `haySobres()` dice que no y el
 * juego decide qué hacer; nunca se falla en silencio.
 */

const ALGO = { name: 'RSA-OAEP', hash: 'SHA-256' };
const PAR = { ...ALGO, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) };

/** ¿Este navegador puede cerrar y abrir sobres? En http:// sin más, no. */
export const haySobres = () => !!globalThis.crypto?.subtle;

const aB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = txt => Uint8Array.from(atob(txt), c => c.charCodeAt(0));

/**
 * Un par de llaves nuevo. La pública va como texto para publicarla en la sala; la privada
 * queda en JWK para guardarla en el celular (en `private` de la partida, C-6): sin ella, un
 * celular que recarga no podría abrir la mano que le repartieron.
 */
export async function nuevasLlaves() {
  const par = await crypto.subtle.generateKey(PAR, true, ['encrypt', 'decrypt']);
  return {
    publica: aB64(await crypto.subtle.exportKey('spki', par.publicKey)),
    privada: await crypto.subtle.exportKey('jwk', par.privateKey),
  };
}

const cache = new Map();
const importar = async (clave, tipo, uso) => {
  const k = tipo + (typeof clave === 'string' ? clave : JSON.stringify(clave));
  if (!cache.has(k)) {
    cache.set(k, crypto.subtle.importKey(tipo, tipo === 'spki' ? deB64(clave) : clave, ALGO, false, [uso]));
  }
  return cache.get(k);
};

/** Cierra un texto corto (hasta 190 bytes) para quien tenga esa llave pública. */
export async function cierra(publica, texto) {
  const key = await importar(publica, 'spki', 'encrypt');
  return aB64(await crypto.subtle.encrypt(ALGO, key, new TextEncoder().encode(texto)));
}

/** Abre un sobre con la llave privada propia. Devuelve null si el sobre no es para este celular. */
export async function abre(privada, sobre) {
  try {
    const key = await importar(privada, 'jwk', 'decrypt');
    return new TextDecoder().decode(await crypto.subtle.decrypt(ALGO, key, deB64(sobre)));
  } catch (_) {
    return null;
  }
}
