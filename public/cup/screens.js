// La Copa's screens, written down in one place. Only one is active at a time (`mostrar(id)` in
// game.js); each id is a `<section class="screen" id="screen-<id>">` in index.html, and
// screens.test.mjs checks that every mostrar('<id>') in the cup's code is on this list.
export const PANTALLAS = ['intro', 'crear', 'entrar', 'tablero', 'jugar', 'resultado', 'admin', 'reporte', 'espera'];

/**
 * The screens that depend on the open cup and are drawn again when it changes (or when coming back
 * to them from the report form). `dibujar` maps each to its draw function; it returns true when it
 * redrew `id`, false when `id` has nothing to redraw (the caller then just shows it, or does nothing).
 * `solo` narrows which of them a caller redraws.
 */
export const REDIBUJABLES = ['tablero', 'admin', 'resultado', 'entrar'];

export function redibujarCon(dibujar, id, solo = REDIBUJABLES) {
  if (!solo.includes(id) || !dibujar[id]) return false;
  return dibujar[id]() !== false;
}
