/**
 * El dato de una carta con fecha (D-277): una frase que cuenta algo del hecho, un porqué o una
 * anécdota, para que cada jugada deje algo aprendido. Lo usan Línea de Tiempo, ⏳ Línea
 * Relámpago y 📅 ¿En qué año?. Los estilos están en assets/css/linea.css.
 *
 * - Al errar va en el veredicto, que se queda hasta tocarlo, y el reloj se pausa mientras se lee,
 *   con tope (`PAUSA_DATO_MS`): una barra que se vacía dice cuánto rato es gratis.
 * - Al acertar no frena nada: aparece en una franja sobre el botón de colocar y se va sola.
 * - Al terminar, en la línea como quedó: los errores con su dato a la vista y el resto a un toque.
 */

/** Lo que el reloj se detiene para leer el dato de un error: una frase se lee en unos 3 s. */
export const PAUSA_DATO_MS = 6000;
/** Lo que se queda la franja del acierto antes de irse sola. */
export const FRANJA_MS = 6000;

/** El dato en el idioma pedido, o null si la carta no tiene. */
export const datoDe = (c, lang) => (c && c.dato ? (typeof c.dato === 'string' ? c.dato : c.dato[lang] || c.dato.es) : null) || null;

/** El bloque del veredicto; con `pausa`, la barra del tiempo gratis. */
export function bloqueDato(el, texto, { pausa = 0 } = {}) {
  if (!texto) return null;
  return el('div', { class: 'dato' }, el('span', { class: 'dato-t' }, `💡 ${texto}`),
    pausa ? el('span', { class: 'dato-pausa', style: `animation-duration:${pausa}ms` }) : null);
}

/**
 * La franja del acierto, al principio de `fila` (la del botón de colocar, pegada abajo). No tapa
 * la línea ni la mano; un toque la cierra y repintar la fila no la borra (ver `conservarFranja`).
 * `de` es el hito del que habla ("Violeta Parra graba Gracias a la vida"): cuando la franja
 * aparece, el veredicto con la carta ya se cerró, y un dato sin sujeto no dice de quién es (U-1).
 */
export function franjaDato(fila, el, texto, { de = '', ms = FRANJA_MS } = {}) {
  fila.querySelector('.dato-franja')?.remove();
  if (!texto) return;
  const f = el('button', { type: 'button', class: 'dato dato-franja', onClick: () => f.remove() },
    el('span', {}, '💡 ', de ? el('b', {}, `${de.replace(/[.!?]$/, '')}.`) : null, de ? ' ' : null, texto));
  fila.prepend(f);
  setTimeout(() => { f.classList.add('sale'); setTimeout(() => f.remove(), 400); }, ms);
}

/** Vacía la fila del botón dejando la franja, si hay una. */
export function conservarFranja(fila) {
  const f = fila.querySelector('.dato-franja');
  fila.innerHTML = '';
  if (f) fila.append(f);
}

/** En la línea final: el dato bajo el hito, abierto si `abierto`, y el hito lo abre y lo cierra. */
export function conDato(fila, el, texto, { abierto = false } = {}) {
  if (!texto) return fila;
  const d = el('span', { class: 'ev-dato' }, `💡 ${texto}`);
  d.hidden = !abierto;
  fila.classList.add('con-dato');
  fila.append(d);
  fila.addEventListener('click', () => { d.hidden = !d.hidden; });
  return fila;
}
