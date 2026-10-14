/**
 * El aire entre un tablero y sus botones (D-309, U-11): lo que mide cada captura de los guiones
 * (`b.shot()` de cdp.mjs) y lo que avisa `look.mjs` en cada pantalla. Va en un módulo aparte
 * para que los dos lo compartan.
 *
 * Un tablero es todo elemento visible con `data-tablero`. Su primer botón de abajo es el botón
 * visible (`.btn`, `button`, `a.btn`) más cercano que empieza por debajo de su borde y se le cruza
 * en horizontal. La distancia entre los dos tiene que ser de AIRE_MIN px o más.
 */
export const AIRE_MIN = 24;

/** Código para evaluar en la página: devuelve JSON con los tableros, su aire y los que no cumplen. */
export const medirAire = `(()=>{
  const visible = x => x.getClientRects().length > 0 && getComputedStyle(x).visibility !== "hidden" && x.getBoundingClientRect().height > 0;
  const raiz = document.querySelector('.screen.active') || document.body;
  // Un tablero dentro de otro (el de intentos dentro de un repaso) no cuenta: cuenta el de afuera
  const tableros = [...raiz.querySelectorAll('[data-tablero]')].filter(t => visible(t) && !t.parentElement.closest('[data-tablero]'));
  const botones = [...raiz.querySelectorAll('.btn, button, a.btn')].filter(visible);
  const filas = tableros.map(t => {
    const r = t.getBoundingClientRect();
    const abajo = botones
      .filter(b => !t.contains(b))
      .map(b => ({ b, q: b.getBoundingClientRect() }))
      .filter(({ q }) => q.top >= r.bottom - 1 && q.left < r.right && q.right > r.left)
      .sort((x, y) => x.q.top - y.q.top)[0];
    if (!abajo) return null;
    return {
      tablero: (t.dataset.tablero || t.className || t.tagName).toString().slice(0, 30),
      boton: (abajo.b.textContent || abajo.b.className).trim().replace(/\\s+/g, ' ').slice(0, 24),
      aire: Math.round(abajo.q.top - r.bottom),
    };
  }).filter(Boolean);
  return JSON.stringify(filas);
})()`;

/** Los que no cumplen, en una línea: "tablero → botón (12 px)". */
export const sinAire = filas => filas.filter(f => f.aire < AIRE_MIN).map(f => `${f.tablero} → ${f.boton} (${f.aire} px)`);
