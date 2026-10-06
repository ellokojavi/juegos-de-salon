/**
 * Los juegos favoritos de la portada (D-238): los marca cada uno con la ⭐ de su tarjeta, y la
 * ficha "⭐ Favoritos" deja ver solo esos. Son de este navegador: se guardan por id de juego
 * ('ahorcado', no la carpeta), sin cuenta ni Firebase.
 */
export const CLAVE = 'juegos-de-salon:favoritos';

/** El almacén del navegador, o uno de mentira donde no lo hay (pruebas, modo privado que falla). */
const almacen = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };

/** Los ids marcados, en el orden en que se marcaron. Un valor roto vale como ninguno. */
export function favoritos(ls = almacen()) {
  try {
    const v = JSON.parse(ls?.getItem(CLAVE) || '[]');
    return Array.isArray(v) ? [...new Set(v.filter(x => typeof x === 'string' && x))] : [];
  } catch (_) { return []; }
}

/** Marca o desmarca un juego; devuelve si quedó marcado. Si no se puede guardar, igual responde. */
export function alternarFavorito(id, ls = almacen()) {
  const lista = favoritos(ls);
  const marcado = !lista.includes(id);
  const nueva = marcado ? [...lista, id] : lista.filter(x => x !== id);
  try { if (nueva.length) ls?.setItem(CLAVE, JSON.stringify(nueva)); else ls?.removeItem(CLAVE); } catch (_) { /* queda por esta visita */ }
  return marcado;
}
