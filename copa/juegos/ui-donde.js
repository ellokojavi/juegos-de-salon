/**
 * 📍 ¿Dónde queda? — pantalla. Un mapa sin nombres que se acerca pellizcando, con doble toque
 * (o con la rueda y los botones + y −) y se corre arrastrando. Tocar pone el alfiler; tocar otra vez lo mueve: el
 * alfiler no se arrastra, porque arrastrar ya es correr el mapa. Confirmar es el botón (C-8).
 * Las jugadas son `[lat, lon]` de cada alfiler confirmado.
 */
import * as motor from './donde.js';
import { MAPA } from './mapa.js';
import { UMBRAL } from '../../assets/js/arrastre.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

/** Dos toques más juntos que esto, en tiempo y en distancia, son un doble toque: acercan. */
const DOBLE_MS = 320;
const DOBLE_PX = 30;
/** Cuánto se puede acercar: en un celular, unos 7 km por píxel. */
const ZOOM_MAX = 24;
/** Al mostrar la respuesta, se acerca a lo más esto: dos puntos muy juntos no llenan la pantalla. */
const ZOOM_RESPUESTA = 10;
const { ancho: W, alto: H } = MAPA;
/**
 * Dónde parte la vista: a 10° O, para que en un celular vertical se vean Sudamérica, Europa y
 * África. Parte acercada hasta llenar el alto de la caja (dilema #85): con el mundo entero, en un
 * celular quedaba una franja de mar vacío arriba y abajo. Alejando se vuelve a ver entero.
 */
const LON_INICIAL = -10;

/** Los dibujos, en píxeles de pantalla: se escalan para verse del mismo tamaño con cualquier zoom. */
const ALFILER = 'M0 0C-2-7-10-11-10-19a10 10 0 1 1 20 0c0 8-8 12-10 19z';

/**
 * El mapa: pan, zoom y toques. `alTocar([x, y])` recibe el punto en unidades del dibujo.
 */
function crearMapa({ T, alTocar }) {
  const svg = s('svg', { class: 'mapa-svg', preserveAspectRatio: 'none', role: 'img', 'aria-label': T.mapLabel });
  // Lo que cruza la línea de cambio de fecha viene dibujado a los dos lados: se recorta en el borde
  const recorte = s('clipPath', { id: 'mapa-recorte' });
  recorte.append(s('rect', { x: 0, y: 0, width: W, height: H }));
  const defs = s('defs');
  defs.append(recorte);
  svg.append(defs, s('rect', { x: -W, y: -H, width: 3 * W, height: 3 * H, class: 'mapa-mar' }), s('path', { d: MAPA.d, class: 'mapa-tierra', 'clip-path': 'url(#mapa-recorte)' }));
  const capa = s('g');
  svg.append(capa);
  const v = { cx: W / 2, cy: H / 2, z: 1 };
  let inicial = true;

  const caja = () => svg.getBoundingClientRect();
  /** El ancho visible sin zoom: el mapa entero, contenido en la caja. */
  const base = r => Math.max(W, (H * r.width) / r.height);
  const medidas = r => { const w = base(r) / v.z; return { w, h: (w * r.height) / r.width }; };

  function aplicar() {
    const r = caja();
    if (!r.width || !r.height) return;
    if (inicial) {
      // El zoom con que el mapa llena el alto; en una caja apaisada (computador) ya lo llena sin zoom
      inicial = false;
      v.z = Math.max(1, base(r) / ((H * r.width) / r.height));
      v.cx = motor.proyectar(0, LON_INICIAL)[0];
    }
    const { w, h } = medidas(r);
    v.cx = w >= W ? W / 2 : Math.min(W - w / 2, Math.max(w / 2, v.cx));
    v.cy = h >= H ? H / 2 : Math.min(H - h / 2, Math.max(h / 2, v.cy));
    svg.setAttribute('viewBox', `${v.cx - w / 2} ${v.cy - h / 2} ${w} ${h}`);
    const k = w / r.width;
    for (const m of capa.querySelectorAll('[data-x]')) m.setAttribute('transform', `translate(${m.dataset.x} ${m.dataset.y}) scale(${k})`);
  }

  const aMapa = (px, py) => {
    const r = caja(), { w, h } = medidas(r);
    return [v.cx - w / 2 + ((px - r.left) / r.width) * w, v.cy - h / 2 + ((py - r.top) / r.height) * h];
  };

  function zoom(f, px, py) {
    const [mx, my] = aMapa(px, py);
    const z = Math.min(ZOOM_MAX, Math.max(1, v.z * f));
    const g = z / v.z;
    v.z = z;
    v.cx = mx + (v.cx - mx) / g;
    v.cy = my + (v.cy - my) / g;
    aplicar();
  }

  // Un dedo que se mueve corre el mapa; dos, lo acercan; un toque quieto es el alfiler
  const dedos = new Map();
  let movido = false, varios = false, previa = null, ultimo = null;
  const pinza = () => {
    const [a, b] = [...dedos.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };
  svg.addEventListener('pointerdown', e => {
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    if (dedos.size === 1) { movido = false; varios = false; } else { varios = true; previa = pinza(); }
    svg.setPointerCapture?.(e.pointerId);
  });
  svg.addEventListener('pointermove', e => {
    const d = dedos.get(e.pointerId);
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.x = e.clientX; d.y = e.clientY;
    if (dedos.size >= 2) {
      const ahora = pinza();
      if (previa && previa.d > 0) {
        const r = caja(), k = medidas(r).w / r.width;
        v.cx -= (ahora.x - previa.x) * k; v.cy -= (ahora.y - previa.y) * k;
        zoom(ahora.d / previa.d, ahora.x, ahora.y);
      }
      previa = ahora;
      return;
    }
    if (!movido && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < UMBRAL) return;
    movido = true;
    const r = caja(), k = medidas(r).w / r.width;
    v.cx -= dx * k; v.cy -= dy * k;
    aplicar();
  });
  const soltar = e => {
    if (!dedos.has(e.pointerId)) return;
    const unico = dedos.size === 1 && !movido && !varios;
    dedos.delete(e.pointerId);
    previa = dedos.size >= 2 ? pinza() : null;
    if (unico && e.type === 'pointerup') {
      // El primer toque ya puso el alfiler ahí mismo; el segundo solo acerca, en torno al dedo
      const t = e.timeStamp;
      if (ultimo && t - ultimo.t < DOBLE_MS && Math.hypot(e.clientX - ultimo.x, e.clientY - ultimo.y) < DOBLE_PX) {
        ultimo = null;
        zoom(2, e.clientX, e.clientY);
        return;
      }
      ultimo = { t, x: e.clientX, y: e.clientY };
      const [x, y] = aMapa(e.clientX, e.clientY);
      alTocar([x, Math.min(H, Math.max(0, y))]);
    }
  };
  svg.addEventListener('pointerup', soltar);
  svg.addEventListener('pointercancel', soltar);
  svg.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY); }, { passive: false });
  new ResizeObserver(aplicar).observe(svg);

  const marcador = (clase, [x, y], ...formas) => {
    const g = s('g', { class: clase, 'data-x': x, 'data-y': y });
    g.append(...formas);
    capa.append(g);
    return g;
  };
  return {
    svg,
    /** El botón del centro de la caja, para los botones + y −. */
    zoom: f => { const r = caja(); zoom(f, r.left + r.width / 2, r.top + r.height / 2); },
    alfiler(p) {
      capa.querySelector('.mapa-alfiler')?.remove();
      if (p) marcador('mapa-alfiler', p, s('path', { d: ALFILER }), s('circle', { cx: 0, cy: -19, r: 4, class: 'ojo' }));
      aplicar();
    },
    /** La respuesta: el alfiler, la ciudad y la línea entre los dos. */
    respuesta(p, q) {
      inicial = false;
      capa.innerHTML = '';
      // Por el lado corto: si están a más de medio mundo en el dibujo, la línea sale por el borde
      const lineas = Math.abs(p[0] - q[0]) > W / 2
        ? [[p, [q[0] + (q[0] < p[0] ? W : -W), q[1]]], [q, [p[0] + (p[0] < q[0] ? W : -W), p[1]]]]
        : [[p, q]];
      for (const [a, b] of lineas) capa.append(s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'mapa-linea' }));
      marcador('mapa-ciudad', q, s('circle', { r: 13, class: 'aro' }), s('circle', { r: 6 }));
      marcador('mapa-alfiler', p, s('path', { d: ALFILER }), s('circle', { cx: 0, cy: -19, r: 4, class: 'ojo' }));
      // Se encuadran los dos, salvo que la línea dé la vuelta al mundo
      if (lineas.length === 1) {
        const r = caja();
        const bw = Math.abs(p[0] - q[0]) + 60, bh = Math.abs(p[1] - q[1]) + 60;
        const zw = r.width ? base(r) / (bw * 1.6) : 1, zh = r.width ? (base(r) * r.height) / r.width / (bh * 1.8) : 1;
        v.z = Math.max(1, Math.min(ZOOM_RESPUESTA, zw, zh));
        v.cx = (p[0] + q[0]) / 2; v.cy = (p[1] + q[1]) / 2;
      } else v.z = 1;
      aplicar();
    },
    aplicar,
  };
}

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let revelado = null;

  const caja = mapa => el('div', { class: 'mapa-caja' }, mapa.svg,
    el('div', { class: 'mapa-zoom' },
      el('button', { type: 'button', class: 'btn btn--ghost', id: 'btn-acercar', 'aria-label': T.zoomIn, onClick: () => mapa.zoom(2) }, '+'),
      el('button', { type: 'button', class: 'btn btn--ghost', id: 'btn-alejar', 'aria-label': T.zoomOut, onClick: () => mapa.zoom(0.5) }, '−')));

  const titulo = (i, c) => [
    el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.cityOf, { i: i + 1, n: p.ciudades.length })),
    el('div', { class: 'carta actual donde-ciudad' }, el('span', { class: 'carta-emoji' }, '📍'), el('b', {}, motor.nombre(c))),
  ];

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.(e);
    raiz.innerHTML = '';
    const pantalla = el('div', { class: 'stack donde-juego' });
    if (revelado !== null) {
      const f = e.filas[revelado];
      const mapa = crearMapa({ T, alTocar: () => {} });
      poner(pantalla, titulo(revelado, f.ciudad), caja(mapa),
        el('div', { class: 'aviso ' + (f.pts >= 50 ? 'bien' : 'mal'), id: 'donde-aviso' }, `${motor.marca(f.km)} ${fmt(f.pts === 1 ? T.pinWasOne : T.pinWas, { km: motor.km(f.km), pts: f.pts })}`),
        e.fin
          ? el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults)
          : el('button', { class: 'btn btn--yellow', id: 'btn-siguiente', onClick: () => { SFX.tap(); revelado = null; dibujar(); } }, T.next));
      poner(raiz, pantalla);
      mapa.respuesta(motor.proyectar(f.r[0], f.r[1]), motor.proyectar(f.ciudad.lat, f.ciudad.lon));
      return;
    }
    if (e.fin) { revelado = e.filas.length - 1; dibujar(); return; }
    const c = e.actual;
    let pin = null;
    const confirmar = el('button', { class: 'btn btn--yellow', id: 'btn-confirmar', disabled: true, onClick: () => {
      if (!pin) return;
      const [lat, lon] = motor.desproyectar(pin[0], pin[1]);
      jugadas.push(motor.jugada(lat, lon));
      ctx.guardar(jugadas);
      revelado = jugadas.length - 1;
      const pts = motor.estado(p, jugadas).filas[revelado].pts;
      if (pts >= 80) SFX.reveal(); else if (pts >= 20) SFX.tap(); else SFX.error();
      dibujar();
    } }, `📍 ${T.confirm}`);
    const mapa = crearMapa({ T, alTocar: q => {
      SFX.tap();
      pin = q;
      mapa.alfiler(q);
      confirmar.disabled = false;
    } });
    poner(pantalla, titulo(e.filas.length, c), caja(mapa), confirmar);
    poner(raiz, pantalla);
    mapa.aplicar();
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
