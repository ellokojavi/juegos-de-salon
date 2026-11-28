/**
 * Drift: the name over the ghost (the owner, 2026-11-28: «el fantasma debe incluir un nombre arriba de
 * él que represente el jugador que es, si es que es una ruta real de un jugador real»). Both scenes
 * place it: they know where the ghost is on the screen; this keeps one small label over the stage
 * (the canvas's parent, `.dr-stage`), moved there each frame and hidden when there is nothing to name.
 *
 *   ghostLabel(canvas) → { show(name, x, y, alpha), hide(), dispose() }   x, y in CSS px over the canvas
 */
export function ghostLabel(canvas) {
  let node = null, text = '';
  const make = () => {
    if (node || !canvas.parentNode || !globalThis.document) return node;
    node = document.createElement('div');
    node.className = 'dr-ghost-name'; node.setAttribute('aria-hidden', 'true'); node.hidden = true;
    canvas.parentNode.appendChild(node);
    return node;
  };
  return {
    show(name, x, y, alpha = 1) {
      if (!make()) return;
      if (text !== name) { node.textContent = name; text = name; }
      node.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
      node.style.opacity = String(Math.max(0, Math.min(1, alpha)));
      node.hidden = alpha <= 0.02;
    },
    hide() { if (node) node.hidden = true; },
    dispose() { node?.remove(); node = null; text = ''; },
  };
}
