/**
 * A drawing loop that sleeps while its node is off the screen (#883 §2.8). The covers' demos
 * animate on their own; scrolled away, nobody sees them, so they stop asking for frames and
 * pick up again when they come back. A hidden tab needs nothing: the browser already holds
 * requestAnimationFrame there.
 *
 *   const paso = now => { ...; otro(); };   // instead of requestAnimationFrame(paso)
 *   const otro = onScreen(lienzo, paso);
 *   otro();
 *
 * The node may be observed before it is on the page: the observer wakes it once it arrives.
 *
 * Without IntersectionObserver the node counts as always visible: the loop runs as before.
 */
export function onScreen(nodo, cuadro, { raf = f => requestAnimationFrame(f), IO = globalThis.IntersectionObserver } = {}) {
  let visible = true, dormido = false;
  if (IO) {
    const mirando = new IO(entradas => {
      visible = entradas[entradas.length - 1].isIntersecting;
      if (visible && dormido) { dormido = false; raf(cuadro); }
    });
    mirando.observe(nodo);
  }
  return () => {
    if (visible) raf(cuadro); else dormido = true;
  };
}
