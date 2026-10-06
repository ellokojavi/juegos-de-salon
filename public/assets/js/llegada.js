/**
 * La llegada desde Juego al azar (D-188, D-235): el dado se va fundiéndose en el fondo de la app
 * y deja una marca en `sessionStorage`; la página del juego la ve y aparece con un fundido sobre
 * ese mismo fondo (`.azar-llega` en base.css), en vez de golpe. Lo importa instalable.js, que
 * cargan todas las páginas en el <head>, antes de que el juego dibuje nada.
 */
export const LLEGA = 'azar-llega';

try {
  if (globalThis.sessionStorage?.getItem(LLEGA)) {
    sessionStorage.removeItem(LLEGA);
    const raiz = document.documentElement;
    raiz.classList.add(LLEGA);
    // Solo la primera pantalla: lo que el juego dibuje después aparece como siempre
    addEventListener('load', () => setTimeout(() => raiz.classList.remove(LLEGA), 900), { once: true });
  }
} catch { /* sin almacenamiento, la página aparece como siempre */ }
