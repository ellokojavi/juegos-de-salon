/**
 * ↩️ Deshacer (D-283): vuelve atrás la última jugada de un tablero que se guarda como una lista de
 * jugadas (Reinas hoy; Zip puede sumarlo con lo mismo). Deshacer no es una jugada: quita
 * jugadas de la lista y la pantalla vuelve a dibujar desde lo que queda. El reloj y el puntaje no
 * se tocan. Tango uses only the button: its Undo is a play, because its score counts mistakes (D-342).
 *
 * Un **paso** es lo que hizo un gesto: un toque es una jugada, pero un arrastre que pinta una fila
 * de X son varias, y se deshacen juntas. La pantalla avisa dónde empieza cada paso con `abrir()`.
 * Esos cortes viven en memoria: al recargar la partida se pierden, y de ahí en adelante cada toque
 * de Deshacer quita una jugada.
 */

/** Los cortes entre pasos: el largo de la lista de jugadas cuando empezó cada uno. */
export function pasos() {
  const inicios = [];
  return {
    /** Empieza un paso nuevo, con la lista de jugadas de este largo. */
    abrir(largo) { if (inicios.at(-1) !== largo) inicios.push(largo); },
    /** Las jugadas sin el último paso (una lista nueva; la que llega no se toca). */
    deshacer(jugadas) {
      while (inicios.length && inicios.at(-1) >= jugadas.length) inicios.pop();
      const desde = inicios.length ? inicios.pop() : jugadas.length - 1;
      return jugadas.slice(0, Math.max(0, desde));
    },
  };
}

/**
 * El botón, chico y fantasma como Borrar todo (`btn--sm`), para la fila de acciones bajo el
 * tablero. Apagado si no hay nada que deshacer. No pide confirmación: lo que deshace se rehace
 * con el mismo toque que lo hizo.
 */
export function botonDeshacer({ el, T, SFX, vibrate, puede, alDeshacer }) {
  return el('button', {
    type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer', disabled: !puede,
    onClick: () => { SFX.tap(); vibrate(10); alDeshacer(); },
  }, `↩️ ${T.undo}`);
}
