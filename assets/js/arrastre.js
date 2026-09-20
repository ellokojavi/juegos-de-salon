/**
 * Arrastrar y soltar, compartido por los juegos que lo necesiten (canon C-2).
 *
 * La regla de la casa, y la razón de que este módulo no sepa nada de las reglas de ningún
 * juego: **arrastrar es elegir, nunca confirmar** (C-8, D-85). Soltar sobre un destino deja
 * la jugada elegida; la acción irreversible sigue colgando del botón que la nombra. Así el
 * arrastre es un atajo hacia el mismo estado al que se llega tocando, y el motor no se entera.
 *
 * Tres cosas que parecen detalles y son el módulo entero:
 *
 * 1. **Los destinos se miden en coordenadas de documento**, no de pantalla. Así la página se
 *    puede correr sola mientras se arrastra sin que lo medido deje de valer.
 * 2. **Se vuelve a medir cada vez que cambia el destino**, porque pintarlo puede mover la
 *    página bajo el dedo (en Línea de Tiempo el hueco abre la línea, D-85).
 * 3. **El puntero lo toma el contenedor, no el elemento arrastrado, y recién cuando el gesto ya
 *    es un arrastre.** El elemento se destruye en el primer redibujo; el contenedor sobrevive, y
 *    con él la captura y los oyentes. Y tomarlo al apoyar el dedo le cambia el destino al `click`
 *    que el navegador fabrica después: el toque muere en el contenedor y nunca llega a lo que se
 *    tocó (D-90, donde esto rompió la selección de barcos en Batalla Naval).
 *
 * El eje de la fuente evita el gesto ambiguo sin pedir un toque largo: en una tira que se
 * desplaza a lo ancho (`eje: 'vertical'` + `touch-action: pan-x` en el CSS), el navegador se
 * queda con el movimiento lateral —que es scroll— y nos entrega el vertical, que es el arrastre.
 */

/** Píxeles de movimiento antes de que un toque se convierta en arrastre. */
export const UMBRAL = 8;
/** Píxeles que la carta sube por sobre el dedo: ahí abajo el pulgar tapa justo el texto. */
export const DESFASE = 60;
/** Franja de borde de pantalla donde la página empieza a correrse sola. */
export const ZONA = 96;
/** Píxeles por cuadro del autoscroll, a fondo. */
export const PASO_MAX = 14;
/** Más lejos que esto del destino más cercano, se entiende que se soltó fuera. */
export const ALCANCE = 220;

/**
 * Destino más cercano a una altura, en coordenadas de documento.
 * @param {number} y
 * @param {{clave: *, y: number}[]} destinos
 * @param {number} alcance  distancia máxima para que cuente como destino
 * @returns {*|null} la clave del destino, o null si no hay ninguno a tiro
 */
export function destinoMasCercano(y, destinos, alcance = ALCANCE) {
  let clave = null, dist = Infinity;
  for (const d of destinos) {
    const n = Math.abs(y - d.y);
    if (n < dist) { dist = n; clave = d.clave; }
  }
  return dist <= alcance ? clave : null;
}

/**
 * Cuánto correr la página en este cuadro, según lo cerca del borde que esté el dedo.
 * Crece con la distancia dentro de la franja para que el borde no sea un interruptor.
 * @returns {number} píxeles (negativo hacia arriba), 0 si el dedo va por el medio
 */
export function pasoDeAutoscroll(clientY, alto, zona = ZONA, max = PASO_MAX) {
  if (clientY < zona) return -Math.round(max * (zona - clientY) / zona);
  if (clientY > alto - zona) return Math.round(max * (clientY - (alto - zona)) / zona);
  return 0;
}

/**
 * @typedef {object} Fuente
 * @property {Element} contenedor  elemento estable que delega y toma el puntero
 * @property {string}  item        selector de lo arrastrable dentro del contenedor
 * @property {'vertical'|'libre'} [eje]  'vertical' abandona el gesto si el desliz es lateral
 * @property {string}  [nombre]    lo que se le pasa al juego para saber de dónde salió
 *
 * @param {object} o
 * @param {Fuente[]} o.fuentes
 * @param {() => boolean} o.activo      si ahora se puede arrastrar (por ejemplo, si es mi turno)
 * @param {(item: Element) => Node} o.avatar   la carta en vilo: la dibuja el juego
 * @param {() => {clave: *, y: number}[]} o.medir   destinos en coordenadas de documento
 * @param {(clave: *|null) => void} o.sobre  pinta el destino de turno (puede mover la página)
 * @param {(item: Element, nombre: string) => void} [o.apretar]   al apretar, antes de saber si es arrastre
 * @param {(item: Element, nombre: string) => void} [o.alAlzar]   el gesto ya es arrastre, justo antes de medir
 *   `soltar` es responsable de dejar la pantalla consistente: el módulo no vuelve a llamar a `sobre`.
 * @param {(item: Element, nombre: string) => void} [o.abandonar] el gesto era scroll: deshacer lo de apretar
 * @param {(item: Element, nombre: string) => void} [o.toque]     se levantó el dedo sin llegar a arrastrar
 * @param {(clave: *|null, info: {nombre: string, cancelado: boolean}) => void} o.soltar
 * @param {(ms: number|number[]) => void} [o.vibrar]
 * @returns {{destruir: () => void, activa: () => boolean}}
 */
export function crearArrastre({ fuentes, activo, avatar, medir, sobre, apretar, alAlzar, abandonar, toque, soltar, vibrar }) {
  let vilo = null;          // contenedor fijo de la carta en vilo
  let gesto = null;         // gesto en curso
  let raf = 0;
  const zumbar = ms => { try { if (vibrar) vibrar(ms); } catch (_) { /* nada */ } };

  const montarVilo = nodo => {
    if (!vilo) {
      vilo = document.createElement('div');
      vilo.className = 'vilo';
      vilo.setAttribute('aria-hidden', 'true');
      document.body.append(vilo);
    }
    vilo.innerHTML = '';
    vilo.append(nodo);
    vilo.classList.add('on');
  };

  const mover = (x, y) => { if (vilo) vilo.style.transform = `translate3d(${x}px, ${y - DESFASE}px, 0)`; };

  const repasar = () => {
    if (!gesto) return;
    const clave = destinoMasCercano(gesto.clientY + window.scrollY, gesto.destinos);
    if (clave === gesto.clave) return;
    gesto.clave = clave;
    sobre(clave);
    if (clave !== null) zumbar(8);
    // Pintar el destino puede haber movido la línea: lo medido antes ya no vale.
    gesto.destinos = medir();
  };

  const correr = () => {
    raf = 0;
    if (!gesto) return;
    const paso = pasoDeAutoscroll(gesto.clientY, window.innerHeight);
    if (paso) { window.scrollBy(0, paso); repasar(); }
    raf = requestAnimationFrame(correr);
  };

  const alzar = ev => {
    // El avatar se dibuja con el elemento todavía vivo: `alAlzar` puede redibujar y matarlo.
    const nodo = avatar(gesto.item, gesto.nombre);
    if (alAlzar) alAlzar(gesto.item, gesto.nombre);
    montarVilo(nodo);
    document.body.classList.add('arrastrando');
    gesto.alzada = true;
    gesto.destinos = medir();
    gesto.clave = null;
    mover(ev.clientX, ev.clientY);
    repasar();
    if (!raf) raf = requestAnimationFrame(correr);
    zumbar(12);
  };

  const bajar = cancelado => {
    const g = gesto; gesto = null;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (vilo) { vilo.classList.remove('on'); vilo.innerHTML = ''; }
    document.body.classList.remove('arrastrando');
    // Aquí no se llama a `sobre`: redibujar el destino y enseguida el estado final hace
    // parpadear la línea. Dejarla consistente es trabajo de `soltar`.
    soltar(cancelado ? null : g.clave, { nombre: g.nombre, cancelado });
  };

  const escuchas = [];
  for (const f of fuentes) {
    const { contenedor, item: selector, eje = 'libre', nombre = '' } = f;

    const onMove = ev => {
      if (!gesto || gesto.muerto) return;
      const dx = Math.abs(ev.clientX - gesto.inicio.x), dy = Math.abs(ev.clientY - gesto.inicio.y);
      if (!gesto.alzada) {
        // Desliz lateral en una tira que se desplaza: era scroll, no arrastre (D-38).
        if (eje === 'vertical' && dx > dy && dx >= UMBRAL) {
          gesto.muerto = true;
          quitar();
          if (abandonar) abandonar(gesto.item, nombre);
          gesto = null;
          return;
        }
        if (Math.max(dx, dy) < UMBRAL || (eje === 'vertical' && dx > dy)) return;
        try { contenedor.setPointerCapture(ev.pointerId); } catch (_) { /* nada */ }
        alzar(ev);
      }
      gesto.clientY = ev.clientY;
      mover(ev.clientX, ev.clientY);
      repasar();
      ev.preventDefault();
    };
    const onUp = ev => {
      if (!gesto) return;
      quitar();
      if (gesto.alzada) { bajar(false); ev.preventDefault(); }
      else { const g = gesto; gesto = null; if (toque) toque(g.item, g.nombre); }
    };
    // Una llamada entrante, un gesto del sistema: la carta vuelve a donde estaba.
    const onCancel = () => { if (!gesto) return; quitar(); if (gesto.alzada) bajar(true); else gesto = null; };
    const quitar = () => {
      contenedor.removeEventListener('pointermove', onMove);
      contenedor.removeEventListener('pointerup', onUp);
      contenedor.removeEventListener('pointercancel', onCancel);
    };

    const onDown = ev => {
      if (gesto || !activo()) return;
      const item = ev.target.closest(selector);
      if (!item || !contenedor.contains(item)) return;
      gesto = { item, nombre, inicio: { x: ev.clientX, y: ev.clientY }, clientY: ev.clientY, alzada: false, muerto: false, clave: null, destinos: [] };
      if (apretar) apretar(item, nombre);
      contenedor.addEventListener('pointermove', onMove);
      contenedor.addEventListener('pointerup', onUp);
      contenedor.addEventListener('pointercancel', onCancel);
    };
    contenedor.addEventListener('pointerdown', onDown);
    escuchas.push(() => { contenedor.removeEventListener('pointerdown', onDown); quitar(); });
  }

  return {
    activa: () => !!(gesto && gesto.alzada),
    destruir() {
      escuchas.forEach(q => q());
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (vilo) { vilo.remove(); vilo = null; }
      document.body.classList.remove('arrastrando');
      gesto = null;
    },
  };
}
