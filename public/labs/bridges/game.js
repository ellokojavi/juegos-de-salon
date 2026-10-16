/**
 * 🚂 Tren en Vilo — lab demo: build a bridge of beams over a gap, then the train crosses; if a beam
 * stretches too much it snaps. Five stages in 7 minutes; the score is the stages done and the speed,
 * like Rutas rotas (D-295). Spanish only, a prototype. The engine (physics, stages, score) is
 * engine.js. It sends no usage signal and has no comment form: it is a local demo for the owner.
 */
import { el, vibrate, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { ETAPAS, TIEMPO_S, ALTO, LARGO_MAX, PIEZAS, fijos, vigaValida, crearSim, paso, DT, FISICA, puntajePartida, alturaCamino, PUNTOS_ETAPA, PUNTOS_AHORRO, BONO_RAPIDEZ, RAPIDO_S } from './engine.js';
import { pixelado, particulas, LOCO, VAGON, CHIMENEA, PALETA_TREN, PAJARO, PALETA_PAJARO, PLATILLO, PALETA_PLATILLO, PREGUNTA, BALLENA, PALETA_BALLENA, PEZ, PALETA_PEZ, TOPO, PALETA_TOPO } from './pixel.js';

const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
// `?ovni`: the saucer comes right away (to look at it without waiting for chance)
const OVNI_YA = new URLSearchParams(location.search).has('ovni');
// `?ovni=mira` or `?ovni=pesca` picks the saucer's act; without it, chance picks one
const OVNI_MODO = new URLSearchParams(location.search).get('ovni') || '';
// `?ballena`: the whale jumps right away
const BALLENA_YA = new URLSearchParams(location.search).has('ballena');
// `?topo`: the mole comes right away
const TOPO_YA = new URLSearchParams(location.search).has('topo');
// `?ballena=salto` or `?ballena=chorro` picks the whale's act; without it, chance picks one
const BALLENA_MODO = new URLSearchParams(location.search).get('ballena') || '';
const POLY_BRIDGE = 'https://en.wikipedia.org/wiki/Poly_Bridge';
const T = {
  nombre: 'Tren en Vilo',
  lema: 'Arma un puente que aguante el tren.',
  como: [
    ['🌉', 'Arrastra de un punto a otro para tender una viga. Tócala para quitarla.'],
    ['🚂', 'Toca Probar: cruza el tren. Si una viga se estira de más, se corta.'],
    ['⏱', `Son ${ETAPAS.length} etapas en ${TIEMPO_S / 60} minutos, con pocas vigas. Suman las etapas que pasa el tren, las vigas que te sobran y la rapidez.`],
  ],
  empezar: '🚂 Empezar', aJugar: '¡A construir!',
  etapa: 'Etapa {n} de {total}', vigas: 'Vigas: {n} de {max}', letrero: '{n} vigas para cruzar',
  probar: '🚂 Probar', arreglar: '✏️ Arreglar', deshacer: '↩ Deshacer', borrar: '🧹 Borrar', borrarSeguro: '🧹 ¿Seguro?',
  rendirse: '🏳️ Rendirse', rendirseSeguro: '🏳️ ¿Seguro?',
  aviso: {
    inicio: 'Arrastra desde un punto marcado: las orillas o una viga que ya pusiste.',
    larga: 'Muy larga: una viga mide hasta 2 cuadros.', fuera: 'Fuera del área de construcción.',
    repetida: 'Ya hay una viga ahí.', presupuesto: 'No te quedan vigas: quita alguna.', suelta: 'Empieza en un punto marcado.',
    quitada: 'Viga quitada.', borrado: 'Borraste el puente: ↩ Deshacer lo trae de vuelta.',
    cruza: '🚂 Cruzando…', paso: '✅ ¡El tren pasó!', cayo: '💥 Se cayó el puente. Arréglalo y prueba otra vez.',
  },
  fin: { todas: '¡Todos los puentes en pie!', tiempo: 'Se acabó el tiempo', rendido: 'Te rendiste' },
  cuenta: {
    titulo: '🧮 Cómo se calculó',
    cabeza: ['Etapa', '', 'Vigas', 'Mín.', 'Etapa', 'Ahorro'],
    subtotal: 'Suma',
    notaAhorro: 'Cada etapa pasada vale 12. El ahorro da hasta {u} por etapa: todo si usaste lo mínimo conocido, nada si usaste todas las vigas.',
    rapidez: '⏱ Rapidez ({t})',
    notaRapidez: 'Hasta {u}: todo en {rapido} o menos, nada a los {max}. Te tocó el {f}, por {n} de {total} etapas.',
    total: 'Total: {a} + {b} + {c}',
  },
  otraVez: '🔁 Jugar otra vez', laboratorio: '‹ Volver al laboratorio',
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const vista = document.getElementById('vista');
const CONFIRMAR_MS = 3000;

const tituloJuego = (chico = false) => el('h1', { class: `titulo-tv${chico ? ' chico' : ''}` },
  el('span', { class: 'tren', 'aria-hidden': 'true' }, '🚂'), el('span', { class: `display ${chico ? '' : 'display--lg '}rainbow` }, T.nombre));
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: POLY_BRIDGE, target: '_blank', rel: 'noopener' }, 'Poly Bridge'), ', de Dry Cactus.');

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const MARGEN = 1.3;          // the cliffs, on each side, in grid units
const ARRIBA = ALTO[1] + 0.6, ABAJO = ALTO[0] - 1.1;

/** A canvas sized to its box, in device pixels; returns the world ↔ screen mapping. */
function lienzo(e, { arriba = ARRIBA, abajo = ABAJO } = {}) {
  const c = el('canvas', { class: 'tv-lienzo' });
  c._v = { arriba, abajo };
  const ajustar = () => {
    const w = Math.min(c.parentElement?.clientWidth || 340, 560);
    const escala = w / (e.ancho + 2 * MARGEN);
    const h = Math.round(escala * (arriba - abajo));
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.width = `${w}px`; c.style.height = `${h}px`;
    c._m = { escala, dpr, w, h };
    // A fixed 16 art pixels per grid unit: the train is the same size on every stage, its wagons coupled
    c._r = pixelado(c, { px: escala / ARTE });
  };
  c._ajustar = ajustar;
  return c;
}
const aPantalla = (c, x, y) => [(x + MARGEN) * c._m.escala, (c._v.arriba - y) * c._m.escala];
const aMundo = (c, px, py) => [px / c._m.escala - MARGEN, c._v.arriba - py / c._m.escala];

/** Screen pixels per art pixel: the size of the pixel-art grid. */
const ARTE = 16;

/** The color of a beam by how stretched or squeezed it is: wood that warms to red, in steps. */
const TENSION = ['#c8874a', '#d9a23a', '#e8b13a', '#f08a2c', '#ff5a3c', '#ff2e4a'];
const colorTension = t => TENSION[Math.min(TENSION.length - 1, Math.floor((Math.abs(t) / FISICA.quiebre) * TENSION.length))];

const CIELO = ['#1d0838', '#26093f', '#2f0c48', '#3a1152', '#46175c', '#521e66', '#5e2670'];
const ROCA = { base: '#5a2f8a', claro: '#7444a8', oscuro: '#3d1d63', borde: '#25103f' };
const MADERA = { borde: '#3a1d10', riel: '#e6e6f0' };
const HUMO = ['rgba(255,255,255,0.95)', 'rgba(235,232,245,0.85)', 'rgba(200,196,220,0.7)', 'rgba(160,156,188,0.5)', 'rgba(130,126,160,0.3)'];
const CHISPAS = ['#fff3a0', '#ffd23f', '#ff8a3d', '#ff2e4a'];
const ASTILLAS = ['#e8b070', '#c8874a', '#8a5a30'];
const AGUA = ['#bff8ff', '#7af0ff', '#2ec4d6'];

/** A fixed pseudo-random number for a position: the stars and the rock grain don't flicker. */
const ruido = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };

/**
 * Draws a stage in pixel art: sky, clouds, cliffs, water, the grid (while building), the beams and
 * the train with its smoke. `sim` (while it runs) gives positions and tensions; without it, the
 * beams as laid. The scene keeps its own particles and clock on the canvas (`c._esc`).
 */
function dibujar(c, e, { vigas = [], sim = null, grilla = false, arrastre = null, usados = new Set(), rotasAntes = new Set(), visitas = null } = {}) {
  const r = c._r;
  if (!r) return;
  const ahora = performance.now() / 1000;
  const esc = c._esc ||= { parts: particulas(), ultimo: ahora, humo: 0, rotas: new Set(), caida: null, sim: null };
  const dt = Math.min(0.05, ahora - esc.ultimo); esc.ultimo = ahora;
  if (esc.sim !== sim) { esc.sim = sim; esc.rotas = new Set(); esc.caida = null; esc.sueltos = new Set(); }
  const A = (x, y) => { const [px, py] = aPantalla(c, x, y); return [px / r.px, py / r.px]; };
  const u = ARTE;                        // art pixels per grid unit
  const { W, H } = r;

  // The sky, in bands, with stars that twinkle and two clouds drifting by
  for (let y = 0; y < H; y++) r.rect(0, y, W, 1, CIELO[Math.min(CIELO.length - 1, Math.floor((y / H) * CIELO.length * 1.3))]);
  for (let k = 0; k < 26; k++) {
    const x = Math.floor(ruido(k, 1) * W), y = Math.floor(ruido(k, 2) * H * 0.45);
    if (Math.sin(ahora * (1 + ruido(k, 3) * 2) + k) > -0.3) r.punto(x, y, ruido(k, 4) > 0.5 ? '#fff3a0' : '#ffffff');
  }
  // Clouds, each with its own shape (puffs of different sizes drawn once per scene), height and speed;
  // the top of each puff a little lighter
  esc.nubes ||= Array.from({ length: 3 }, (_, k) => {
    const n = 3 + Math.floor(Math.random() * 4), puffs = [];
    let x = 0;
    for (let i = 0; i < n; i++) { const rr = 2 + Math.floor(Math.random() * 4); puffs.push([x, -Math.floor(Math.random() * 3), rr]); x += rr + Math.floor(Math.random() * 3); }
    return { puffs, ancho: x + 4, y: H * (0.06 + 0.13 * k + Math.random() * 0.05), v: 1.5 + Math.random() * 3, desfase: Math.random() * (W + 60) };
  });
  for (const nb of esc.nubes) {
    const x = ((ahora * nb.v + nb.desfase) % (W + nb.ancho + 20)) - nb.ancho - 10;
    for (const [dx, dy, rr] of nb.puffs) r.circulo(x + dx, nb.y + dy, rr, 'rgba(255,255,255,0.08)');
    for (const [dx, dy, rr] of nb.puffs) r.circulo(x + dx, nb.y + dy - 1, Math.max(1, rr - 1), 'rgba(255,255,255,0.05)');
  }

  // Visitors, only in the game (never on the cover: they are a surprise). `visitas` comes from the game:
  // { ovni: may the saucer come in this stage, retraso: after how long, verOvni(): it came }
  if (visitas && !QUIETO) {
    esc.inicio ??= ahora;
    // A bird, now and then: high, muted, slow, so it hardly takes the eye off the bridge
    esc.proximoPajaro ??= ahora + 6 + Math.random() * 8;
    if (!esc.pajaros && ahora >= esc.proximoPajaro) {
      const izq = Math.random() < 0.5, n = Math.random() < 0.7 ? 1 : 2, y = H * (0.05 + Math.random() * 0.15);
      esc.pajaros = Array.from({ length: n }, (_, k) => ({ x: izq ? -10 - k * 10 : W + 10 + k * 10, y: y + k * 4, fase: Math.random() * 6, v: (izq ? 1 : -1) * (11 + Math.random() * 5) }));
    }
    if (esc.pajaros) {
      for (const p of esc.pajaros) {
        p.x += p.v * dt; p.fase += dt;
        // Wings up, spread, down, spread; it barely rises on the downstroke, no waving
        const ala = [0, 1, 2, 1][Math.floor(p.fase * 7) % 4];
        r.sprite(PAJARO[ala], PALETA_PAJARO, p.x, p.y - (ala === 2 ? 1 : 0), { voltear: p.v < 0 });
      }
      if (esc.pajaros.every(p => p.x < -20 || p.x > W + 20)) { esc.pajaros = null; esc.proximoPajaro = ahora + 14 + Math.random() * 14; }
    }
    // The saucer: once in the whole game, in the stage drawn at the start. It glides in, stops above
    // the bridge with a beam of light, shows a "?", and shoots off up and away
    if (visitas.ovni && !esc.ovni && ahora - esc.inicio >= visitas.retraso) {
      visitas.verOvni();
      const izq = Math.random() < 0.5;
      // Fishing, it stays near the cliff it came from, not in the middle: the bridge keeps the attention
      const [gx0] = A(0, 0), [gx1] = A(e.ancho, 0);
      const destino = visitas.modoOvni === 'pesca' ? (izq ? gx0 + 12 : gx1 - 12) : W * (0.35 + Math.random() * 0.3);
      esc.ovni = { modo: visitas.modoOvni, x: izq ? -12 : W + 12, y: Math.max(26, H * 0.2), destino, dir: izq ? 1 : -1, fase: 'llega', t: 0 };
    }
    if (esc.ovni && !esc.ovni.fuera) {
      const o = esc.ovni;
      o.t += dt;
      const vuelo = Math.sin(ahora * 3) * 1.5;
      if (o.modo === 'pesca') {
        // Act two, "the catch": it comes down over the gap, lowers its beam to the water, a fish rises
        // spinning up the light into the saucer, and it goes away into the distance
        const [, yAguaO] = A(0, c._v.abajo + 0.7), bajo = yAguaO - 60;
        if (o.fase === 'llega') {
          o.x += o.dir * 34 * dt; o.y += (bajo - o.y) * Math.min(1, dt * 1.5);
          if ((o.dir > 0 && o.x >= o.destino) || (o.dir < 0 && o.x <= o.destino)) { o.fase = 'pesca'; o.t = 0; }
        } else if (o.fase === 'pesca') {
          if (o.t > 3.2) { o.fase = 'se va'; o.t = 0; }
        } else { o.x += o.dir * 14 * dt; o.y -= 18 * dt; o.escala = Math.max(0, 1 - o.t / 1.1); }
        const oy = o.y + vuelo, ox = o.x;
        if (o.fase === 'pesca' && o.t > 0.3) {
          const largo = yAguaO - oy - 3;
          for (let k = 0; k < largo; k += 2) r.rect(ox - 2 - k / 6, oy + 3 + k, 4 + k / 3, 2, `rgba(155,232,255,${0.2 - (k / largo) * 0.12})`);
          // The fish: it leaps out of the water and rises up the beam, flipping as it goes
          const k = Math.min(1, Math.max(0, (o.t - 0.9) / 1.8));
          if (k > 0 && k < 1) {
            const fy = yAguaO - k * (yAguaO - oy - 4);
            r.sprite(PEZ, PALETA_PEZ, ox + Math.sin(k * 12) * 2, fy, { voltear: Math.floor(k * 10) % 2 === 1 });
            if (!o.salpico) { o.salpico = true; if (!QUIETO) for (let n = 0; n < 8; n++) esc.parts.agregar({ x: ox, y: yAguaO, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 20, g: 110, vida: 0.6, colores: AGUA }); }
          }
        }
        // Leaving, it goes away into the distance: smaller and smaller, drifting up on a diagonal, until it is gone
        if ((o.escala ?? 1) > 0.08) r.sprite(PLATILLO[Math.floor(ahora * 5) % 2], PALETA_PLATILLO, ox, oy, { escala: o.escala ?? 1 });
        else o.fuera = true;
      } else {
        // Act one, "the look": it glides in, stops above the bridge with a beam, shows a "?", and shoots off
        if (o.fase === 'llega') {
          o.x += o.dir * 34 * dt;
          if ((o.dir > 0 && o.x >= o.destino) || (o.dir < 0 && o.x <= o.destino)) { o.fase = 'mira'; o.t = 0; }
        } else if (o.fase === 'mira') {
          if (o.t > 2.6) { o.fase = 'se va'; o.t = 0; }
        } else { o.x += o.dir * 90 * o.t * dt * 4; o.y -= 60 * o.t * dt * 3; }
        if (o.fase === 'mira' && o.t > 0.3) for (let k = 0; k < 18; k++) r.rect(o.x - 2 - k / 3, o.y + 3 + k * 2, 4 + (2 * k) / 3, 2, `rgba(155,232,255,${0.16 - k * 0.008})`);
        r.sprite(PLATILLO[Math.floor(ahora * 5) % 2], PALETA_PLATILLO, o.x, o.y + vuelo);
        if (o.fase === 'mira' && o.t > 0.7 && o.t < 2.4) r.sprite(PREGUNTA, PALETA_PLATILLO, o.x, o.y + vuelo - 10 - Math.round(Math.sin(o.t * 6)));
        if (o.y < -20 || o.x < -40 || o.x > W + 40) o.fuera = true;
      }
    }
  }

  // The water, with waves that run and glint
  const [, yAgua] = A(0, c._v.abajo + 0.7);
  r.rect(0, yAgua, W, H - yAgua, '#11415e');
  r.rect(0, yAgua + 3, W, H - yAgua, '#0b2c48');
  for (let x = 0; x < W; x++) {
    const ola = Math.round(Math.sin(x * 0.35 + ahora * 2.2) * 1.2);
    r.punto(x, yAgua + ola, AGUA[1]);
    if (ruido(x, Math.floor(ahora * 3)) > 0.93) r.punto(x, yAgua + 2 + ola, AGUA[0]);
  }

  // A whale, now and then (in the game only): it breaches out of the water in an arc, tilting with
  // its flight, and falls back in, with a splash on the way out and on the way in
  if (visitas && !QUIETO) {
    const [gx0] = A(0, 0), [gx1] = A(e.ancho, 0);
    esc.inicio ??= ahora;
    if (visitas.ballena && !esc.ballena && ahora - esc.inicio >= visitas.retrasoBallena && gx1 - gx0 > 60) {
      visitas.verBallena();
      const dir = Math.random() < 0.5 ? 1 : -1, largo = Math.min(30, (gx1 - gx0) * 0.35);
      const x = dir > 0 ? gx0 + 14 + Math.random() * (gx1 - gx0 - largo - 28) : gx1 - 14 - Math.random() * (gx1 - gx0 - largo - 28);
      const modo = visitas.modoBallena;
      esc.ballena = { modo, x, dir, largo, alto: 12 + Math.random() * 6, t: 0, dura: modo === 'chorro' ? 3 : 1.15, salpicoSalida: false, salpicoEntrada: false };
    }
    if (esc.ballena && !esc.ballena.fuera) {
      const b = esc.ballena; b.t += dt;
      const u = Math.min(1, b.t / b.dura);
      if (b.modo === 'chorro') {
        // Three parts, always moving the same way: it surfaces on a diagonal (head up), floats level
        // with half its body out and blows its spout, then dives on a diagonal (head down)
        const T1 = 0.7, T2 = 2.3, T3 = 3.0;
        let cuadroB, bx, by;
        if (b.t < T1) {
          const k = b.t / T1;
          cuadroB = BALLENA.sube; bx = b.x + b.dir * 10 * k; by = yAgua + 14 - 10 * k;
        } else if (b.t < T2) {
          const k = (b.t - T1) / (T2 - T1);
          cuadroB = BALLENA.arriba; bx = b.x + b.dir * (14 + 4 * k); by = yAgua + 3;
        } else {
          const k = Math.min(1, (b.t - T2) / (T3 - T2));
          cuadroB = BALLENA.baja; bx = b.x + b.dir * (20 + 12 * k); by = yAgua + 1 + 15 * k;
        }
        if (!b.salpicoSalida && b.t > 0.2) { b.salpicoSalida = true; for (let n = 0; n < 8; n++) esc.parts.agregar({ x: bx + (Math.random() - 0.5) * 10, y: yAgua, vx: (Math.random() - 0.5) * 20, vy: -12 - Math.random() * 12, g: 90, vida: 0.6, colores: AGUA }); }
        if (!b.salpicoEntrada && b.t > T2 + 0.3) { b.salpicoEntrada = true; for (let n = 0; n < 6; n++) esc.parts.agregar({ x: bx + (Math.random() - 0.5) * 10, y: yAgua, vx: (Math.random() - 0.5) * 16, vy: -10 - Math.random() * 10, g: 90, vida: 0.5, colores: AGUA }); }
        // The spout: drops that shoot up from the blowhole and fan out, while it floats
        if (b.t > T1 + 0.2 && b.t < T2 - 0.3) {
          const hx = bx + b.dir * 5, hy = by - 8;
          for (let n = 0; n < 3; n++) esc.parts.agregar({ x: hx + (Math.random() - 0.5) * 2, y: hy, vx: (Math.random() - 0.5) * 18, vy: -48 - Math.random() * 18, g: 95, vida: 0.75, colores: AGUA });
        }
        if (b.t < T3) r.sprite(cuadroB, PALETA_BALLENA, bx, by, { voltear: b.dir < 0, cortarY: yAgua });
        if (b.t > T3 + 0.7) { esc.ballena = { fuera: true }; }
      } else {
      const bx = b.x + b.dir * b.largo * u, by = yAgua + 8 - b.alto * Math.sin(Math.PI * u);
      const salpica = xx => { for (let n = 0; n < 10; n++) esc.parts.agregar({ x: xx + (Math.random() - 0.5) * 8, y: yAgua, vx: (Math.random() - 0.5) * 36, vy: -22 - Math.random() * 28, g: 150, vida: 0.9, colores: AGUA }); };
      if (!b.salpicoSalida && u > 0.06) { b.salpicoSalida = true; salpica(b.x); }
      if (!b.salpicoEntrada && u > 0.94) { b.salpicoEntrada = true; salpica(b.x + b.dir * b.largo); }
      // A drawn frame for each part of the jump: head up going out, level at the top, head down coming back
      const cuadroB = u < 0.38 ? BALLENA.sube : u < 0.62 ? BALLENA.arriba : BALLENA.baja;
      if (u < 1) r.sprite(cuadroB, PALETA_BALLENA, bx, by, { voltear: b.dir < 0, cortarY: yAgua });
      if (b.t > b.dura + 0.8) { esc.ballena = { fuera: true }; }
      }
    }
  }

  // The cliffs: rock with grain, an outline and grass on top
  const [x0, y0] = A(0, 0), [x1] = A(e.ancho, 0);
  const roca = (xa, xb) => {
    r.rect(xa, y0, xb - xa, H - y0, ROCA.base);
    for (let y = Math.ceil(y0) + 2; y < H; y++) for (let x = Math.floor(xa); x < xb; x++) {
      const n = ruido(x, y);
      if (n > 0.9) r.punto(x, y, ROCA.claro); else if (n < 0.08) r.punto(x, y, ROCA.oscuro);
    }
  };
  roca(0, x0); roca(x1, W);
  r.rect(x0 - 1, y0, 1, H - y0, ROCA.borde); r.rect(x1, y0, 1, H - y0, ROCA.borde);
  for (const [xa, xb] of [[0, x0], [x1, W]]) {
    r.rect(xa, y0 - 1, xb - xa, 2, '#6fd42a'); r.rect(xa, y0 - 2, xb - xa, 1, '#9dff3a');
    for (let x = Math.floor(xa); x < xb; x += 3) if (ruido(x, 7) > 0.5) r.punto(x, y0 - 3, '#9dff3a');
  }
  // The mole: it comes in through the earth from the outer side of a cliff, digging a tunnel toward the
  // gap; at the edge it tumbles out and falls into the water. The tunnel fades a while later
  if (visitas && !QUIETO) {
    esc.inicio ??= ahora;
    if (visitas.topo && !esc.topo && ahora - esc.inicio >= visitas.retrasoTopo) {
      visitas.verTopo();
      const izq = Math.random() < 0.5;
      esc.topo = { izq, x: izq ? -6 : W + 6, borde: izq ? x0 - 2 : x1 + 2, y: Math.round(y0 + 18 + Math.random() * Math.max(4, (yAgua - y0) - 34)), t: 0, fase: 'cava', vy: 0, giro: 0 };
    }
    if (esc.topo && !esc.topo.fuera) {
      const tp = esc.topo, dir = tp.izq ? 1 : -1; tp.t += dt;
      // The tunnel: dark from where it came in to where it is, fading once the mole is gone
      const desde = tp.izq ? 0 : W, hasta = tp.fase === 'cava' ? tp.x : tp.borde;
      const sombra = tp.fase === 'cae' ? Math.max(0, 1 - tp.caido / 2.5) : 1;
      if (sombra > 0) r.rect(Math.min(desde, hasta), tp.y - 6, Math.abs(hasta - desde), 7, `rgba(26,11,46,${0.9 * sombra})`);
      if (tp.fase === 'cava') {
        tp.x += dir * 11 * dt;
        if (Math.random() < 0.35) esc.parts.agregar({ x: tp.x + dir * 5, y: tp.y - 3, vx: -dir * (8 + Math.random() * 14), vy: -6 - Math.random() * 10, g: 70, vida: 0.5, colores: ['#9a6440', '#7a4a2a', '#5a3a20'] });
        r.sprite(TOPO[Math.floor(tp.t * 6) % 2], PALETA_TOPO, tp.x, tp.y, { voltear: dir < 0 });
        if ((dir > 0 && tp.x >= tp.borde) || (dir < 0 && tp.x <= tp.borde)) { tp.fase = 'cae'; tp.caido = 0; tp.vy = -20; }
      } else {
        // It tumbles: forward a little, down with gravity, turning over, and splashes in the water
        tp.caido += dt; tp.vy += 160 * dt; tp.x += dir * 10 * dt; tp.y += tp.vy * dt;
        if (tp.y < yAgua + 2) r.sprite(TOPO[0], PALETA_TOPO, tp.x, tp.y, { voltear: (Math.floor(tp.caido * 8) % 2 === 0) === (dir < 0) });
        else if (!tp.salpico) { tp.salpico = true; for (let n = 0; n < 12; n++) esc.parts.agregar({ x: tp.x, y: yAgua, vx: (Math.random() - 0.5) * 36, vy: -24 - Math.random() * 26, g: 130, vida: 0.8, colores: AGUA }); }
        if (tp.caido > 2.6) tp.fuera = true;
      }
    }
  }

  for (const [ax, ay] of e.anclas) {
    const [px, py] = A(ax, ay);
    r.rect(px - u * 0.35, py, u * 0.7, u * 0.35, ROCA.base); r.rect(px - u * 0.35, py, u * 0.7, 1, ROCA.claro);
  }

  // The grid of points where a beam can go
  // While dragging, the points the beam can reach light up, and a ring marks where it will land
  if (grilla) for (let x = 0; x <= e.ancho; x++) for (let y = ALTO[0]; y <= ALTO[1]; y++) {
    const [px, py] = A(x, y);
    const alcanza = arrastre && Math.hypot(x - arrastre.a[0], y - arrastre.a[1]) <= LARGO_MAX + 1e-9 && !(x === arrastre.a[0] && y === arrastre.a[1]);
    if (alcanza) r.rect(px - 1, py - 1, 2, 2, 'rgba(157,255,58,0.85)'); else r.punto(px, py, arrastre ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.45)');
  }

  // The beams as planks: a dark edge, the wood (warming to red with the strain), rails on the road
  // Thin planks: on a phone the grid is small, and a thick beam hides where it starts and ends
  const grosor = Math.max(1, Math.round(u * 0.07));
  const pos = sim ? i => [sim.nudos[i].x, sim.nudos[i].y] : null;
  const lista = sim ? sim.vigas.map((v, k) => ({ k, a: pos(v.i), b: pos(v.j), t: v.tension, rota: v.rota, camino: v.camino }))
    : vigas.map(v => ({ a: v.a, b: v.b, t: 0, camino: v.a[1] === 0 && v.b[1] === 0 }));
  const parpadeo = Math.sin(ahora * 8) > 0;
  for (const v of lista) {
    if (v.rota) continue;
    const [ax, ay] = A(...v.a), [bx, by] = A(...v.b), g = v.camino ? grosor + 1 : grosor;
    // A beam that snapped in the last test glows red while you fix the bridge
    if (!sim && rotasAntes.has(`${v.a}|${v.b}`) && parpadeo) r.linea(ax, ay, bx, by, '#ff2e4a', g + 3);
    r.linea(ax, ay, bx, by, MADERA.borde, g + 1);
    r.linea(ax, ay, bx, by, sim ? colorTension(v.t) : '#c8874a', g);
    if (v.camino) r.linea(ax, ay - Math.ceil(g / 2), bx, by - Math.ceil(g / 2), MADERA.riel, 1);
  }
  // A beam that just snapped throws sparks and splinters
  if (sim) for (const v of lista) {
    if (!v.rota || esc.rotas.has(v.k)) continue;
    esc.rotas.add(v.k);
    if (!QUIETO) c.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-1px)' }, { transform: 'translate(-1px,1px)' }, { transform: 'translate(0,0)' }], { duration: 240 });
    const [ax, ay] = A(...v.a), [bx, by] = A(...v.b), mx = (ax + bx) / 2, my = (ay + by) / 2;
    if (!QUIETO) {
      for (let n = 0; n < 12; n++) esc.parts.agregar({ x: mx, y: my, vx: (Math.random() - 0.5) * 70, vy: -Math.random() * 60, g: 120, vida: 0.5 + Math.random() * 0.4, colores: CHISPAS });
      for (let n = 0; n < 6; n++) esc.parts.agregar({ x: mx, y: my, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 30, g: 160, vida: 1.2, radio: 1, colores: ASTILLAS });
    }
  }
  // The joints: bolts; the fixed ones are pink plates
  const nudos = sim ? sim.nudos.map(n => ({ x: n.x, y: n.y, fijo: n.fijo })) : [...fijos(e).map(([x, y]) => ({ x, y, fijo: true })),
    ...[...usados].map(k => k.split(',').map(Number)).filter(([x, y]) => !fijos(e).some(([a, b]) => a === x && b === y)).map(([x, y]) => ({ x, y }))];
  for (const n of nudos) {
    const [px, py] = A(n.x, n.y);
    if (n.fijo) { r.rect(px - 2, py - 2, 5, 5, '#25103f'); r.rect(px - 1, py - 1, 3, 3, '#ff2e88'); r.punto(px - 1, py - 1, '#ff9cc8'); }
    else { r.circulo(px, py, 2, '#25103f'); r.circulo(px, py, 1, '#e6e6f0'); }
  }
  // The beam being dragged: dashes, green if it can go, red if not
  if (arrastre) {
    const [ax, ay] = A(...arrastre.a), [bx, by] = A(...arrastre.b), col = arrastre.ok ? '#9dff3a' : '#ff2e88';
    if (Number.isInteger(arrastre.b[0]) && Number.isInteger(arrastre.b[1])) { r.circulo(bx, by, 4, col); r.circulo(bx, by, 3, 'rgba(20,8,31,0.9)'); }
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 3));
    for (let k = 0; k < n; k += 2) r.linea(ax + (bx - ax) * k / n, ay + (by - ay) * k / n, ax + (bx - ax) * Math.min(1, (k + 1) / n), ay + (by - ay) * Math.min(1, (k + 1) / n), col, grosor);
  }

  // The train: the locomotive and two wagons, each on the deck where it is, with smoke from the chimney
  if (sim) {
    // The wheel frame, from the distance run (positive also while the train is still left of the gap)
    const tr = sim.tren, cuadro = ((Math.floor(tr.x * 7) % 6) + 6) % 6;
    const piezas = PIEZAS.map((pz, k) => ({ x: tr.x + pz.dx, k, loco: k === 0, spr: k === 0 ? LOCO[cuadro % 3] : VAGON[(cuadro + k) % 2] }));
    if (tr.cayo && !esc.caida) esc.caida = { dy: 0, vy: 0, salpico: false };
    if (esc.caida) { esc.caida.vy += 220 * dt; esc.caida.dy += esc.caida.vy * dt; }
    // The couplings first, under the bodies: a short dark bar between each pair, at wheel height
    const en = piezas.map(p => { const h = alturaCamino(sim, p.x); const [px, py] = A(p.x, h ?? tr.y); return [px, py + (esc.caida && (h === null || p.k === tr.cayoPieza) ? esc.caida.dy : 0)]; });
    // A coupling is rigid: if two pieces part (one falls), it snaps for good, with a spark, and each falls on its own
    esc.sueltos ||= new Set();
    for (let k = 1; k < en.length; k++) {
      if (esc.sueltos.has(k)) continue;
      if (Math.abs(en[k][1] - en[k - 1][1]) > 3) {
        esc.sueltos.add(k);
        if (!QUIETO) for (let n = 0; n < 8; n++) esc.parts.agregar({ x: en[k][0] + 10, y: en[k][1] - 4, vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 40, g: 120, vida: 0.45, colores: CHISPAS });
        continue;
      }
      r.linea(en[k][0] + 6, en[k][1] - 4, en[k - 1][0] - 9, en[k - 1][1] - 4, '#14081f', 2);
    }
    // Departure: steam puffs from under the wheels while it starts
    if (!QUIETO && sim.t < 1.2 && Math.random() < 0.5) for (const sx of [-1, 1]) esc.parts.agregar({ x: en[0][0] + sx * 9, y: en[0][1] - 2, vx: sx * (10 + Math.random() * 10), vy: -4, vida: 0.8, radio: 1, crece: 3, colores: HUMO });
    // The headlight: a soft cone ahead of the locomotive
    if (!tr.cayo) for (let k = 0; k < 10; k++) r.rect(en[0][0] + 12 + k, en[0][1] - 9 - k / 4, 1, 2 + k / 2, `rgba(255,243,160,${0.32 - k * 0.03})`);
    for (const p of piezas) {
      let [px, py] = en[p.k];
      if (py > yAgua + 4) {
        if (!esc.caida.salpico && !QUIETO) {
          esc.caida.salpico = true;
          for (let n = 0; n < 22; n++) esc.parts.agregar({ x: px, y: yAgua, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 50, g: 140, vida: 1, colores: AGUA });
        }
        continue;
      }
      r.sprite(p.spr, PALETA_TREN, px, py - 1);
      if (p.loco && !tr.cayo && !QUIETO) {
        esc.humo += dt;
        if (esc.humo > 0.09) {
          esc.humo = 0;
          esc.parts.agregar({ x: px + CHIMENEA.dx, y: py + CHIMENEA.dy, vx: -8 - Math.random() * 8, vy: -16 - Math.random() * 6, vida: 1.5, radio: 1, crece: 2.6, colores: HUMO });
        }
      }
    }
  }
  esc.parts.paso(dt);
  esc.parts.dibujar(r);
  r.volcar();
}

/* ------------------------------------------------------------------ */
/* The cover: a truss that a train crosses, over and over               */
/* ------------------------------------------------------------------ */

const DEMO = (() => {
  const W = 4, v = [], V = (a, b) => v.push({ a, b });
  for (let i = 0; i < W; i++) V([i, 0], [i + 1, 0]);
  V([1, 1], [2, 1]); V([2, 1], [3, 1]);
  for (let i = 1; i < W; i++) V([i, 0], [i, 1]);
  V([0, 0], [1, 1]); V([W, 0], [W - 1, 1]); V([1, 1], [2, 0]); V([3, 1], [2, 0]);
  return v;
})();

function portada() {
  const e = ETAPAS[0];
  // The cover shows only the bridge and the water right under it
  const c = lienzo(e, { arriba: 1.9, abajo: -2.2 });
  vista.replaceChildren(
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), el('div', { class: 'tv-demo', 'aria-hidden': 'true' }, c)),
    el('div', { class: 'panel' }, el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))))),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); parar(); empezar(); } }, T.empezar));
  c._ajustar();
  let sim = crearSim(e, DEMO), vivo = true;
  window.__portada = () => sim;
  const parar = () => { vivo = false; };
  if (QUIETO) { dibujar(c, e, { vigas: DEMO }); return; }
  const cuadro = () => {
    if (!vivo || !c.isConnected) return;
    for (let k = 0; k < Math.round(1 / 60 / DT); k++) paso(sim);
    dibujar(c, e, { sim });
    if (sim.fin && (sim.tren.cayo || fueraDeEscena(sim, e))) sim = crearSim(e, DEMO);
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

const P = { topo: { etapa: -1, retraso: 0, visto: true }, ovni: { etapa: -1, retraso: 0, visto: true, modo: 'mira' }, ballena: { etapa: -1, retraso: 0, visto: true, modo: 'chorro' }, rotasAntes: new Set(), etapa: 0, hechas: 0, usadas: [], inicio: 0, fin: null, vigas: [], historial: [], reloj: null, simulando: false };
const segundos = () => (P.fin?.segundos ?? (Date.now() - P.inicio) / 1000);

/**
 * What may visit the current stage. One character per game, drawn at the start: the saucer (it looks
 * and asks, or it fishes), the whale (it jumps, or it blows its spout) or the mole (it digs a
 * tunnel through a cliff and falls into the water), once, in one stage. Birds
 * and clouds are the background: they come and go on their own.
 */
const visitasDe = () => ({
  ovni: P.ovni.etapa === P.etapa && !P.ovni.visto, retraso: P.ovni.retraso, modoOvni: P.ovni.modo, verOvni: () => { P.ovni.visto = true; },
  topo: P.topo.etapa === P.etapa && !P.topo.visto, retrasoTopo: P.topo.retraso, verTopo: () => { P.topo.visto = true; },
  ballena: P.ballena.etapa === P.etapa && !P.ballena.visto, retrasoBallena: P.ballena.retraso, modoBallena: P.ballena.modo, verBallena: () => { P.ballena.visto = true; },
});

function empezar() {
  cuentaRegresiva({ titulo: `🚂 ${T.nombre}`, ya: T.aJugar }).then(() => {
    // One character per game, drawn at the start: the saucer or the whale (never both), with its act,
    // its stage and its moment. `?ovni[=mira|pesca]` or `?ballena[=salto|chorro]` picks it, in stage 1
    const forzado = OVNI_YA || BALLENA_YA || TOPO_YA;
    const quien = OVNI_YA ? 'ovni' : BALLENA_YA ? 'ballena' : TOPO_YA ? 'topo' : ['ovni', 'ballena', 'topo'][Math.floor(Math.random() * 3)];
    const etapaSorteada = forzado ? 0 : Math.floor(Math.random() * ETAPAS.length);
    const retraso = forzado ? 0.8 : 5 + Math.random() * 15;
    P.ovni = { etapa: quien === 'ovni' ? etapaSorteada : -1, retraso, visto: quien !== 'ovni',
      modo: ['mira', 'pesca'].includes(OVNI_MODO) ? OVNI_MODO : Math.random() < 0.5 ? 'mira' : 'pesca' };
    P.ballena = { etapa: quien === 'ballena' ? etapaSorteada : -1, retraso, visto: quien !== 'ballena',
      modo: ['salto', 'chorro'].includes(BALLENA_MODO) ? BALLENA_MODO : Math.random() < 0.5 ? 'salto' : 'chorro' };
    P.topo = { etapa: quien === 'topo' ? etapaSorteada : -1, retraso, visto: quien !== 'topo' };
    Object.assign(P, { rotasAntes: new Set(), etapa: 0, hechas: 0, usadas: [], inicio: Date.now(), fin: null, vigas: [], historial: [] });
    jugar();
    clearInterval(P.reloj);
    P.reloj = setInterval(() => {
      const quedan = TIEMPO_S - segundos();
      const r = document.getElementById('tv-reloj');
      if (r) { r.textContent = `⏱ ${mmss(Math.max(0, quedan))}`; r.classList.toggle('apurado', quedan <= 60); }
      if (quedan <= 0) terminar('tiempo');
    }, 250);
  });
}

function jugar() {
  const e = ETAPAS[P.etapa];
  const c = lienzo(e);
  const aviso = el('p', { class: 'tv-aviso', 'aria-live': 'polite' }, T.aviso.inicio);
  const puntos = el('div', { class: 'tv-puntos', 'aria-hidden': 'true' },
    ...ETAPAS.map((_, k) => el('span', { class: k < P.hechas ? 'hecha' : k === P.etapa ? 'actual' : '' })));
  const cuenta = el('span', { class: 'tv-cuenta', id: 'tv-cuenta' });
  const botonProbar = el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-probar', onClick: () => probarPuente() }, T.probar);
  const armados = {};
  const conConfirmacion = (clave, rotulo, rotuloArmado, accion, attrs = {}) => {
    const b = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', ...attrs, onClick: () => {
      if (armados[clave]) { clearTimeout(armados[clave]); armados[clave] = null; b.textContent = rotulo; b.classList.remove('armado'); accion(); return; }
      SFX.tap(); vibrate(15); b.textContent = rotuloArmado; b.classList.add('armado');
      armados[clave] = setTimeout(() => { armados[clave] = null; b.textContent = rotulo; b.classList.remove('armado'); }, CONFIRMAR_MS);
    } }, rotulo);
    return b;
  };
  const botonDeshacer = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer', onClick: () => {
    if (!P.historial.length) return;
    P.vigas = P.historial.pop(); SFX.tap(); repintar();
  } }, T.deshacer);
  const botonBorrar = conConfirmacion('borrar', T.borrar, T.borrarSeguro, () => {
    if (!P.vigas.length) return;
    P.historial.push(P.vigas); P.vigas = []; SFX.splash?.(); aviso.textContent = T.aviso.borrado; repintar();
  }, { id: 'btn-borrar' });
  const botonRendirse = conConfirmacion('rendirse', T.rendirse, T.rendirseSeguro, () => terminar('rendido'), { id: 'btn-rendirse' });
  const fila = el('div', { class: 'tv-acciones' }, botonDeshacer, botonBorrar, botonRendirse);

  vista.replaceChildren(
    el('div', { class: 'tv-cabeza' },
      el('span', { class: 'tv-etapa' }, fmt(T.etapa, { n: P.etapa + 1, total: ETAPAS.length })), puntos,
      el('span', { class: 'tv-reloj', id: 'tv-reloj' }, `⏱ ${mmss(Math.max(0, TIEMPO_S - segundos()))}`)),
    el('div', { class: 'tv-tablero' }, c,
      el('div', { class: 'tv-letrero', 'aria-hidden': 'true' }, el('b', {}, fmt(T.etapa, { n: P.etapa + 1, total: ETAPAS.length })), el('span', {}, fmt(T.letrero, { n: e.presupuesto })))),
    el('div', { class: 'tv-barra' }, cuenta, aviso),
    botonProbar, fila);
  c._ajustar();

  const usados = () => new Set([...fijos(e).map(([x, y]) => `${x},${y}`), ...P.vigas.flatMap(v => [v.a.join(','), v.b.join(',')])]);
  function repintar(arrastre = null) {
    cuenta.textContent = fmt(T.vigas, { n: P.vigas.length, max: e.presupuesto });
    cuenta.classList.toggle('lleno', P.vigas.length >= e.presupuesto);
    botonDeshacer.disabled = !P.historial.length || P.simulando;
    botonProbar.disabled = P.simulando || !P.vigas.length;
    botonBorrar.disabled = P.simulando || !P.vigas.length;
    dibujar(c, e, { vigas: P.vigas, grilla: !P.simulando, arrastre, usados: usados(), rotasAntes: P.rotasAntes, visitas: visitasDe() });
  }
  repintar();
  // While building, the scene stays alive (clouds, water, stars): repaint every frame
  let ultimoArrastre = null;
  const vivo = () => {
    if (!c.isConnected || P.fin) return;
    if (!P.simulando) dibujar(c, e, { vigas: P.vigas, grilla: true, arrastre: ultimoArrastre, usados: usados(), rotasAntes: P.rotasAntes, visitas: visitasDe() });
    requestAnimationFrame(vivo);
  };
  if (!QUIETO) requestAnimationFrame(vivo);

  // Dragging from a joint in use to any grid point lays a beam; a tap on a beam removes it
  const punto = ev => { const r = c.getBoundingClientRect(); return aMundo(c, ev.clientX - r.left, ev.clientY - r.top); };
  const cercano = ([x, y]) => [Math.round(x), Math.round(y)];
  const cerca = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= 0.45;
  let desde = null, inicioPx = null;
  c.addEventListener('pointerdown', ev => {
    if (P.simulando || P.fin) return;
    const m = punto(ev), g = cercano(m);
    inicioPx = [ev.clientX, ev.clientY];
    desde = cerca(m, g) && usados().has(g.join(',')) ? g : null;
    c.setPointerCapture(ev.pointerId);
  });
  c.addEventListener('pointermove', ev => {
    if (!desde) return;
    const m = punto(ev), g = cercano(m);
    const hasta = cerca(m, g) ? g : m;
    const motivo = Array.isArray(hasta) && Number.isInteger(hasta[0]) && Number.isInteger(hasta[1]) ? vigaValida(e, P.vigas, desde, hasta) : 'suelta';
    ultimoArrastre = { a: desde, b: hasta, ok: !motivo && P.vigas.length < e.presupuesto };
    repintar(ultimoArrastre);
  });
  c.addEventListener('pointerup', ev => {
    const m = punto(ev), g = cercano(m);
    const toque = inicioPx && Math.hypot(ev.clientX - inicioPx[0], ev.clientY - inicioPx[1]) < 8;
    if (toque) {
      // A tap: removes the beam under the finger, if there is one
      const i = vigaBajo(m);
      if (i >= 0) { P.historial.push(P.vigas); P.vigas = P.vigas.filter((_, k) => k !== i); SFX.tap(); aviso.textContent = T.aviso.quitada; }
      else if (!desde) aviso.textContent = T.aviso.suelta;
      desde = null; ultimoArrastre = null; repintar(); return;
    }
    if (desde) {
      const hasta = cerca(m, g) ? g : null;
      const motivo = !hasta ? 'fuera' : P.vigas.length >= e.presupuesto ? 'presupuesto' : vigaValida(e, P.vigas, desde, hasta);
      if (motivo) { if (motivo !== 'cero') { aviso.textContent = T.aviso[motivo] || T.aviso.fuera; SFX.error(); vibrate([30, 30, 30]); } }
      else { P.historial.push(P.vigas); P.vigas = [...P.vigas, { a: desde, b: hasta }]; SFX.tap(); vibrate(10); aviso.textContent = ''; }
    }
    desde = null; ultimoArrastre = null; repintar();
  });
  function vigaBajo([x, y]) {
    let mejor = -1, d = 0.22;
    P.vigas.forEach((v, k) => {
      const [ax, ay] = v.a, [bx, by] = v.b, dx = bx - ax, dy = by - ay;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      const dd = Math.hypot(x - (ax + u * dx), y - (ay + u * dy));
      if (dd < d) { d = dd; mejor = k; }
    });
    return mejor;
  }

  // Testing: the train crosses in real time; the beams change color with the strain
  function probarPuente() {
    if (P.simulando) {
      // ✏️ Arreglar: back to building, with the same beams
      P.simulando = false; botonProbar.textContent = T.probar; aviso.textContent = ''; repintar(); return;
    }
    SFX.tap();
    P.simulando = true; botonProbar.textContent = T.arreglar; botonProbar.disabled = true;
    aviso.textContent = T.aviso.cruza;
    repintar();
    const sim = crearSim(e, P.vigas);
    let rotas = 0, cierre = 0, avisado = false;
    const cuadro = () => {
      if (!P.simulando || !c.isConnected || P.fin) return;
      for (let k = 0; k < Math.round(1 / 60 / DT); k++) paso(sim);
      const ahora = sim.vigas.filter(v => v.rota).length;
      if (ahora > rotas) { rotas = ahora; SFX.error(); vibrate(40); }
      dibujar(c, e, { sim, visitas: visitasDe() });
      if (!sim.fin) { requestAnimationFrame(cuadro); return; }
      // It made it: the notice now, and the scene runs on until the last wagon leaves the screen
      if (sim.tren.llego) {
        if (!avisado) { avisado = true; aviso.textContent = T.aviso.paso; SFX.win(); vibrate([30, 50, 30]); P.hechas++; P.usadas.push(P.vigas.length); P.rotasAntes = new Set(); }
        if (!fueraDeEscena(sim, e)) { requestAnimationFrame(cuadro); return; }
        setTimeout(() => {
          if (P.fin) return;
          P.simulando = false;
          if (P.hechas >= ETAPAS.length) { terminar('todas'); return; }
          P.etapa++; P.vigas = []; P.historial = []; jugar();
        }, 350);
        return;
      }
      // It fell: the scene keeps moving a moment (the fall, the splash, the smoke clearing)
      if (!cierre) cierre = performance.now();
      if (!avisado) {
        avisado = true; aviso.textContent = T.aviso.cayo; botonProbar.disabled = false;
        // The beams that snapped stay marked while you fix the bridge
        P.rotasAntes = new Set(sim.vigas.map((v, k) => (v.rota ? `${P.vigas[k].a}|${P.vigas[k].b}` : null)).filter(Boolean));
      }
      if (performance.now() - cierre < 1800) requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  }
}

/** Has the last wagon left the screen, past the right cliff? */
const fueraDeEscena = (sim, e) => sim.tren.x + PIEZAS[PIEZAS.length - 1].dx - 0.6 > e.ancho + MARGEN;

function terminar(motivo) {
  if (P.fin) return;
  clearInterval(P.reloj);
  P.simulando = false;
  P.fin = { motivo, segundos: Math.min(TIEMPO_S, (Date.now() - P.inicio) / 1000) };
  resultado();
}

/** A number with at most one decimal, with a comma: 3,3. */
const num = x => (Math.round(x * 10) / 10).toString().replace('.', ',');
const pct = x => `${Math.round(x * 100)} %`;

/**
 * The result: the score, and under it the arithmetic as a table, one row per stage (passed or
 * not, with its beams and its points), then the three parts and the total.
 */
function resultado() {
  const { motivo, segundos: seg } = P.fin;
  const p = puntajePartida(P.usadas, seg);
  const todas = P.hechas === ETAPAS.length, C = T.cuenta;
  const td = (x, cls = '') => el('td', { class: cls }, x);
  const filas = ETAPAS.map((e, k) => {
    const a = p.ahorros[k];
    return el('tr', { class: a ? '' : 'no' },
      td(`${k + 1}`, 'num'), td(a ? '✅' : '⬛'),
      td(a ? `${a.usadas} / ${e.presupuesto}` : '—', 'num'), td(`${e.minimo}`, 'num muted'),
      td(a ? `+${PUNTOS_ETAPA}` : '0', 'num'), td(a ? `+${num(a.puntos)}` : '0', 'num'));
  });
  const tabla = el('table', { class: 'tv-tabla' },
    el('thead', {}, el('tr', {}, ...C.cabeza.map((x, k) => el('th', { class: k > 1 ? 'num' : '' }, x)))),
    el('tbody', {}, ...filas),
    el('tfoot', {}, el('tr', {}, el('td', { colspan: '4' }, C.subtotal), td(`${p.etapas}`, 'num'), td(`${p.ahorro}`, 'num'))));
  const cuenta = el('div', { class: 'panel tv-cuenta-final', id: 'cuenta' },
    el('p', { class: 'lead' }, C.titulo),
    el('div', { class: 'tv-tabla-caja' }, tabla),
    el('p', { class: 'muted tv-nota' }, fmt(C.notaAhorro, { u: PUNTOS_AHORRO })),
    el('div', { class: 'tv-linea' }, el('span', {}, fmt(C.rapidez, { t: mmss(seg) })), el('b', {}, `+${p.rapidez}`)),
    el('p', { class: 'muted tv-nota' }, fmt(C.notaRapidez, { u: BONO_RAPIDEZ, rapido: mmss(RAPIDO_S), max: mmss(TIEMPO_S), f: pct(p.fraccionTiempo), n: p.pasadas, total: ETAPAS.length })),
    el('div', { class: 'tv-linea total' }, el('span', {}, fmt(C.total, { a: p.etapas, b: p.ahorro, c: p.rapidez })), el('b', {}, `${p.total}`)));
  vista.replaceChildren(el('div', { class: 'resultado' },
    tituloJuego(true),
    el('p', { class: `tv-sello${todas ? '' : ' mal'}` }, T.fin[motivo]),
    el('div', { class: 'score-big', id: 'puntaje' }, `${p.total}/100`),
    cuenta,
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-otro', onClick: () => { SFX.tap(); empezar(); } }, T.otraVez),
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio)));
  scrollTo(0, 0);
  if (todas) { SFX.win(); vibrate([40, 30, 40, 30, 120]); if (!QUIETO) confetti({ count: 160, duration: 2200 }); }
  else SFX.tap();
}

document.getElementById('sound-slot').append(soundToggle());
initSound?.();
// While building, the page doesn't scroll under the finger that drags a beam
addEventListener('resize', () => { const c = document.querySelector('.tv-lienzo'); if (c?._ajustar && !P.simulando) { c._ajustar(); } });
portada();
// For the end-to-end scripts and the owner's console
window.__trenEnVilo = { P, ETAPAS };
