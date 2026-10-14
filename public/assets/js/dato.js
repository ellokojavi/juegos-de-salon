/**
 * El dato de una carta con fecha (D-277): una frase que cuenta algo del hecho, un porqué o una
 * anécdota, para que cada jugada deje algo aprendido. Lo usan Línea de Tiempo, ⏳ Línea
 * Relámpago y 📅 ¿En qué año?. Los estilos están en assets/css/linea.css.
 *
 * - Va en el veredicto, al errar y al acertar (D-314), y el reloj se pausa mientras se lee, con
 *   tope (`PAUSA_DATO_MS`): una barra que se vacía dice cuánto rato es gratis. El error se queda
 *   hasta tocarlo; el acierto se cierra solo cuando la barra se vacía, o antes con un toque.
 * - Al terminar, en la línea como quedó: los errores con su dato a la vista y el resto a un toque.
 */

/** Lo que el reloj se detiene para leer el dato de un error: una frase se lee en unos 3 s. */
export const PAUSA_DATO_MS = 6000;

/** El dato en el idioma pedido, o null si la carta no tiene. */
export const datoDe = (c, lang) => (c && c.dato ? (typeof c.dato === 'string' ? c.dato : c.dato[lang] || c.dato.es) : null) || null;

/** El bloque del veredicto; con `pausa`, la barra del tiempo gratis. */
export function bloqueDato(el, texto, { pausa = 0 } = {}) {
  if (!texto) return null;
  return el('div', { class: 'dato' }, el('span', { class: 'dato-t' }, `💡 ${texto}`),
    pausa ? el('span', { class: 'dato-pausa', style: `animation-duration:${pausa}ms` }) : null);
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
