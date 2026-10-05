/**
 * La clave pública VAPID de los avisos al celular (D-223). Es pública, como firebase-config.js:
 * identifica a quién manda los avisos, no da acceso a nada. La privada es el secreto
 * `VAPID_PRIVADA` de GitHub y nunca está en el repo.
 *
 * La escribe `node tools/push/vapid.mjs` (una sola vez, el dueño). Vacía, los avisos no se
 * ofrecen en ningún celular.
 */
export const VAPID_PUBLICA = '';
