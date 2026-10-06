/**
 * 📍 ¿Dónde queda? — pantalla. Un globo sin nombres (`globo.js`) que se gira sin fin
 * arrastrando, se acerca pellizcando, con doble toque (o con la rueda y los botones + y −) y se
 * gira con dos dedos, como un mapa del celular; la brújula vuelve a poner el norte arriba (D-200). Un
 * toque pone el alfiler; tocar otra vez lo mueve; el doble toque solo acerca. El alfiler no se
 * arrastra, porque arrastrar ya gira el globo. Confirmar es el botón (C-8). Las jugadas son `[lat, lon]` de cada alfiler confirmado.
 *
 * La portada del juego (`portada`) es el mismo globo, chico y girando solo.
 *
 * Se juega a pantalla completa (D-203): el globo ocupa toda la ventana y lo demás flota encima,
 * arriba la ciudad y abajo Confirmar (o el resultado y Siguiente). La cáscara lo sabe por
 * `pantallaCompleta` y deja flotando su barra, el reloj y las reglas plegadas.
 */
import * as motor from './engine.js';
import * as globo from './globo.js';
import { UMBRAL } from '../../../assets/js/arrastre.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

/** Dos toques más juntos que esto, en tiempo y en distancia, son un doble toque: acercan. */
const DOBLE_MS = 320;
const DOBLE_PX = 30;
/**
 * Cuánto se puede acercar, en radio del globo en píxeles: unos 2 km por píxel. Más allá la imagen
 * satelital (4096 px de ancho, D-159) ya no tiene detalle que mostrar. Va en píxeles y no en veces
 * el globo entero porque a pantalla completa el globo de un computador es el doble que el de un celular.
 */
const RADIO_MAX = 11000;  // ≈ 64 veces en un celular (D-202 de main)
/** Al mostrar la respuesta, se acerca a lo más esto: dos puntos muy juntos no llenan la pantalla. */
const RADIO_RESPUESTA = 2200;
/** Hacia dónde mira el globo al empezar cada ciudad: el Atlántico, con América, Europa y África. */
const CENTRO_INICIAL = [10, -40];
/**
 * El globo entero se centra entre los widgets de arriba y de abajo, y puede pasar esto por debajo
 * de ellos: flotan encima, y en un computador ganan unos 120 px de globo.
 */
const DESBORDE = 60;
/**
 * Dos dedos solo giran el mapa pasado este ángulo, como en los mapas del celular: sin esto, cada
 * pellizco lo torcería un poco. Y al soltar cerca del norte, el norte queda justo arriba.
 */
const GIRO_UMBRAL = 12;
const GIRO_IMAN = 6;
const RAD = Math.PI / 180;
const envolver = lon => ((((lon + 180) % 360) + 360) % 360) - 180;

/**
 * El globo del juego: girar, acercar y tocar. `alTocar([lat, lon])` recibe el lugar tocado.
 * El canvas lleva `.globo` con `aPantalla(lat, lon)` y `girarA(lat, lon)`: la respuesta los usa,
 * y también las pruebas de punta a punta, que tocan donde queda cada ciudad.
 */
function crearGlobo({ T, alTocar, alGirar, zona }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'mapa-globo';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', T.mapLabel);
  // Debajo, la imagen satelital (D-159); encima, en `canvas`, las marcas y los toques
  const fondo = document.createElement('canvas');
  fondo.className = 'mapa-satelite';
  fondo.setAttribute('aria-hidden', 'true');
  const v = { centro: CENTRO_INICIAL.slice(), z: 1, rumbo: 0 };
  const marcas = {};
  let w = 0, h = 0, pedido = false;
  // La franja libre entre los widgets, en coordenadas del canvas: ahí va el centro del globo
  let arriba = 0, abajo = 0;
  const sat = globo.satelite(fondo, () => redibujar());

  const medir = () => {
    const r = canvas.getBoundingClientRect(), z = zona?.();
    arriba = Math.max(0, (z?.arriba ?? r.top) - r.top);
    abajo = Math.min(h, (z?.abajo ?? r.bottom) - r.top);
    if (abajo - arriba < 120) { arriba = 0; abajo = h; }
  };
  const radioBase = () => Math.max(40, Math.min(w / 2, (abajo - arriba) / 2 + DESBORDE) - 10);
  const cy = () => (arriba + abajo) / 2;
  const zMax = () => Math.max(4, RADIO_MAX / radioBase());
  const V = () => globo.vista({ centro: v.centro, rumbo: v.rumbo, r: radioBase() * v.z, cx: w / 2, cy: cy() });
  const pintar = () => {
    pedido = false;
    if (!canvas.isConnected) return;
    [w, h] = globo.ajustar(canvas);
    if (!w || !h) return;
    medir();
    const vista = V();
    sat?.dibujar(vista, w, h);
    if (esperar(sat, canvas, w, h, fondo)) return;
    globo.dibujar(canvas.getContext('2d'), w, h, vista, { marcas, satelital: !!sat?.lista() });
  };
  const redibujar = () => { if (!pedido) { pedido = true; requestAnimationFrame(pintar); } };

  const local = (px, py) => { const r = canvas.getBoundingClientRect(); return [px - r.left, py - r.top]; };
  /** El lugar del globo bajo un punto de la pantalla, o null si ahí hay espacio. */
  const bajo = (px, py) => {
    const [x, y] = local(px, py), R = radioBase() * v.z;
    return motor.tocado((x - w / 2) / R, (cy() - y) / R, v.centro, v.rumbo);
  };
  const girar = (dx0, dy0) => {
    alGirar?.();
    // El arrastre, llevado a la vista con el norte arriba
    const sr = Math.sin(v.rumbo * RAD), cr = Math.cos(v.rumbo * RAD);
    const dx = cr * dx0 - sr * dy0, dy = sr * dx0 + cr * dy0;
    const R = radioBase() * v.z;
    v.centro = [Math.max(-89, Math.min(89, v.centro[0] + (dy / R) / RAD)), envolver(v.centro[1] - (dx / R) / RAD)];
    redibujar();
  };
  // La brújula: aparece con el mapa girado, apunta al norte y al tocarla lo vuelve arriba
  const aguja = document.createElement('span');
  aguja.className = 'brujula-aguja';
  aguja.textContent = 'N';
  const brujula = document.createElement('button');
  brujula.type = 'button';
  brujula.className = 'btn btn--ghost brujula';
  brujula.id = 'btn-norte';
  brujula.hidden = true;
  brujula.setAttribute('aria-label', T.northUp);
  brujula.append(aguja);
  const rumbo = r => {
    v.rumbo = envolver(r);
    brujula.hidden = v.rumbo === 0;
    aguja.style.transform = `rotate(${-v.rumbo}deg)`;
    canvas.dataset.rumbo = Math.round(v.rumbo);
  };
  let animando = 0;
  brujula.addEventListener('click', () => {
    const r0 = v.rumbo, t0 = performance.now(), id = ++animando;
    const paso = t => {
      if (id !== animando) return;
      const k = Math.min(1, (t - t0) / 250);
      rumbo(k < 1 ? r0 * (1 - k) ** 2 : 0);
      redibujar();
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });

  function zoom(f, px, py, giro = 0) {
    const g = px === undefined ? null : bajo(px, py);
    v.z = Math.min(zMax(), Math.max(1, v.z * f));
    if (giro) { animando++; rumbo(v.rumbo + giro); }
    // Lo que estaba bajo el dedo sigue bajo el dedo: se corrige el centro un par de veces
    for (let k = 0; g && k < 3; k++) {
      const g2 = bajo(px, py);
      if (!g2) break;
      v.centro = [Math.max(-89, Math.min(89, v.centro[0] + g[0] - g2[0])), envolver(v.centro[1] + envolver(g[1] - g2[1]))];
    }
    redibujar();
  }

  // Un dedo que se mueve gira el globo; dos, lo acercan; un toque quieto es el alfiler
  const dedos = new Map();
  let movido = false, varios = false, previa = null, ultimo = null, torsion = 0, girando = false;
  const pinza = () => {
    const [a, b] = [...dedos.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, a: Math.atan2(b.y - a.y, b.x - a.x) / RAD };
  };
  canvas.addEventListener('pointerdown', e => {
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    if (dedos.size === 1) { movido = false; varios = false; } else { varios = true; previa = pinza(); torsion = 0; girando = false; }
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    const d = dedos.get(e.pointerId);
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.x = e.clientX; d.y = e.clientY;
    if (dedos.size >= 2) {
      const ahora = pinza();
      if (previa && previa.d > 0) {
        // Los dedos giran a favor del reloj en la pantalla (y hacia abajo): el rumbo, al revés
        const da = -envolver(ahora.a - previa.a);
        torsion += da;
        if (Math.abs(torsion) > GIRO_UMBRAL) girando = true;
        girar(ahora.x - previa.x, ahora.y - previa.y);
        zoom(ahora.d / previa.d, ahora.x, ahora.y, girando ? da : 0);
      }
      previa = ahora;
      return;
    }
    if (!movido && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < UMBRAL) return;
    movido = true;
    girar(dx, dy);
  });
  const soltar = e => {
    if (!dedos.has(e.pointerId)) return;
    const unico = dedos.size === 1 && !movido && !varios;
    dedos.delete(e.pointerId);
    previa = dedos.size >= 2 ? pinza() : null;
    if (girando && dedos.size < 2) {
      girando = false;
      if (Math.abs(v.rumbo) < GIRO_IMAN) { rumbo(0); redibujar(); }
    }
    if (!unico || e.type !== 'pointerup') return;
    // Un toque espera un momento antes de poner el alfiler: si llega un segundo toque, era un
    // doble toque, que solo acerca en torno al dedo y no pone ni mueve el alfiler
    const t = e.timeStamp;
    if (ultimo && t - ultimo.t < DOBLE_MS && Math.hypot(e.clientX - ultimo.x, e.clientY - ultimo.y) < DOBLE_PX) {
      clearTimeout(ultimo.espera);
      ultimo = null;
      zoom(2, e.clientX, e.clientY);
      return;
    }
    const g = bajo(e.clientX, e.clientY);
    ultimo = { t, x: e.clientX, y: e.clientY, espera: g ? setTimeout(() => { ultimo = null; alTocar(g); }, DOBLE_MS) : null };
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY); }, { passive: false });
  new ResizeObserver(redibujar).observe(canvas);

  canvas.globo = {
    aPantalla(lat, lon) {
      const p = globo.enPantalla(V(), lat, lon);
      if (!p) return null;
      const r = canvas.getBoundingClientRect();
      return [r.left + p[0], r.top + p[1]];
    },
    girarA(lat, lon) { v.centro = [lat, lon]; pintar(); },
    vista: () => ({ centro: v.centro.slice(), z: v.z, rumbo: v.rumbo }),
  };
  return {
    canvas,
    fondo,
    brujula,
    zoom: f => { const r = canvas.getBoundingClientRect(); zoom(f, r.left + r.width / 2, r.top + r.height / 2); },
    alfiler(q) { marcas.alfiler = q; canvas.dataset.alfiler = q ? '1' : ''; redibujar(); },
    /** La respuesta: el alfiler, la ciudad y el arco entre los dos, con los dos a la vista. */
    respuesta(p, q) {
      Object.assign(marcas, { alfiler: p, ciudad: q, linea: true });
      v.centro = motor.medio(p, q);
      const th = motor.distancia(p, q) / 6371;
      // Un lugar a θ/2 del centro se ve a R·sen(θ/2) del centro: que quede dentro de la franja
      // libre, con la cabeza del alfiler arriba y el aro de la ciudad abajo
      v.z = Math.max(1, Math.min(RADIO_RESPUESTA / radioBase(), (0.3 * Math.min(w || 300, (abajo - arriba) || 300)) / (radioBase() * Math.sin(Math.min(th / 2, Math.PI / 2)) || 1)));
      redibujar();
    },
    pintar,
  };
}

/**
 * Mientras baja la imagen satelital el globo queda vacío, en vez de mostrar el mapa vectorial por
 * un instante; al llegar aparece con un fundido. Devuelve si hay que esperar.
 */
function esperar(sat, canvas, w, h, fondo) {
  if (sat?.esperando()) { canvas.getContext('2d').clearRect(0, 0, w, h); canvas.dataset.esperando = ''; return true; }
  if ('esperando' in canvas.dataset) {
    delete canvas.dataset.esperando;
    for (const c of [fondo, canvas]) c.classList.add('globo-aparece');
  }
  return false;
}

/**
 * La portada: el globo chico girando solo, con el alfiler en Brasil y la estrella en Valparaíso,
 * como el afiche de "Próximamente". Con movimiento reducido (C-8) queda quieto.
 */
export function portada() {
  const caja = document.createElement('div');
  caja.className = 'globo-portada';
  caja.setAttribute('aria-hidden', 'true');
  const fondo = document.createElement('canvas'), canvas = document.createElement('canvas');
  caja.append(fondo, canvas);
  // Quieta (movimiento reducido) se dibuja una sola vez: se redibuja cuando llega la imagen
  const sat = globo.satelite(fondo, () => { if (quieto) requestAnimationFrame(cuadro); });
  const marcas = { alfiler: [-12, -50], ciudad: [-33.05, -71.62], linea: true };
  const quieto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  let ultimo = 0;
  const cuadro = ahora => {
    if (!canvas.isConnected && ahora - t0 > 1000) return;
    // 30 cuadros por segundo alcanzan para 8° por segundo, y el celular lo agradece
    if (ahora - ultimo >= 33) {
      ultimo = ahora;
      const [w, h] = globo.ajustar(canvas);
      if (w) {
        const lon = quieto ? -60 : -60 + ((ahora - t0) / 1000) * 8;
        const vista = globo.vista({ centro: [-12, envolver(lon)], r: Math.min(w, h) / 2 - 8, cx: w / 2, cy: h / 2 });
        sat?.dibujar(vista, w, h);
        if (!esperar(sat, canvas, w, h, fondo)) globo.dibujar(canvas.getContext('2d'), w, h, vista, { marcas, liviano: true, escala: 0.7, perspectiva: true, satelital: !!sat?.lista() });
      }
    }
    if (!quieto) requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
  return caja;
}

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let revelado = null;
  // La pista de que el globo se gira (#88): solo en la primera ciudad, hasta el primer arrastre
  let girado = jugadas.length > 0;

  // El globo va detrás, a pantalla completa; los botones de acercar flotan a la derecha, sobre la acción
  const caja = mapa => el('div', { class: 'mapa-caja' }, mapa.fondo, mapa.canvas);
  const zoom = mapa => el('div', { class: 'mapa-zoom' }, mapa.brujula,
    el('button', { type: 'button', class: 'btn btn--ghost', id: 'btn-acercar', 'aria-label': T.zoomIn, onClick: () => mapa.zoom(2) }, '+'),
    el('button', { type: 'button', class: 'btn btn--ghost', id: 'btn-alejar', 'aria-label': T.zoomOut, onClick: () => mapa.zoom(0.5) }, '−'));

  // Arriba, la ciudad: el widget que dice qué buscar y cuál va
  const titulo = (i, c) => el('div', { class: 'carta actual donde-ciudad donde-arriba' },
    el('span', { class: 'carta-emoji' }, '📍'),
    el('span', { class: 'donde-nombre' },
      el('small', { class: 'donde-cual' }, fmt(T.cityOf, { i: i + 1, n: p.ciudades.length })),
      el('b', {}, motor.nombre(c, ctx.lang))));
  // Abajo: la pista y los botones de acercar en una fila, y debajo la acción
  const abajo = (mapa, pista, ...accion) => el('div', { class: 'donde-abajo' },
    el('div', { class: 'donde-fila' }, pista, zoom(mapa)),
    el('div', { class: 'stack donde-accion' }, ...accion));
  // La franja libre para el globo: entre la ciudad y la acción
  const zona = pantalla => () => ({
    arriba: pantalla.querySelector('.donde-arriba')?.getBoundingClientRect().bottom,
    abajo: pantalla.querySelector('.donde-accion')?.getBoundingClientRect().top,
  });

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.(e);
    raiz.innerHTML = '';
    const pantalla = el('div', { class: 'stack donde-juego' });
    if (revelado !== null) {
      const f = e.filas[revelado];
      const mapa = crearGlobo({ T, alTocar: () => {}, zona: zona(pantalla) });
      poner(pantalla, titulo(revelado, f.ciudad), caja(mapa), abajo(mapa, null,
        el('div', { class: 'aviso ' + (f.pts >= 50 ? 'bien' : 'mal'), id: 'donde-aviso' }, `${motor.marca(f.km)} ${fmt(f.pts === 1 ? T.pinWasOne : T.pinWas, { km: motor.km(f.km, ctx.lang), pts: f.pts })}`),
        e.fin
          ? el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults)
          : el('button', { class: 'btn btn--yellow', id: 'btn-siguiente', onClick: () => { SFX.tap(); revelado = null; dibujar(); } }, T.next)));
      poner(raiz, pantalla);
      mapa.pintar();
      mapa.respuesta(f.r, [f.ciudad.lat, f.ciudad.lon]);
      return;
    }
    if (e.fin) { revelado = e.filas.length - 1; dibujar(); return; }
    const c = e.actual;
    let pin = null;
    const confirmar = el('button', { class: 'btn btn--yellow', id: 'btn-confirmar', disabled: true, onClick: () => {
      if (!pin) return;
      jugadas.push(motor.jugada(pin[0], pin[1]));
      girado = true; // pasada la primera ciudad, la pista no vuelve
      ctx.guardar(jugadas);
      revelado = jugadas.length - 1;
      const pts = motor.estado(p, jugadas).filas[revelado].pts;
      if (pts >= 80) SFX.reveal(); else if (pts >= 20) SFX.tap(); else SFX.error();
      dibujar();
    } }, `📍 ${T.confirm}`);
    const pista = girado ? null : el('div', { class: 'globo-pista', id: 'globo-pista', 'aria-hidden': 'true' }, T.spinHint);
    const mapa = crearGlobo({
      T,
      zona: zona(pantalla),
      alTocar: q => {
        SFX.tap();
        pin = q;
        mapa.alfiler(q);
        confirmar.disabled = false;
      },
      alGirar: () => { if (!girado) { girado = true; pista?.remove(); } },
    });
    poner(pantalla, titulo(e.filas.length, c), caja(mapa), abajo(mapa, pista, confirmar));
    poner(raiz, pantalla);
    mapa.pintar();
  };
  dibujar();
}

/** La cáscara deja la pantalla entera al globo y hace flotar su barra, el reloj y las reglas. */
export const pantallaCompleta = true;

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
