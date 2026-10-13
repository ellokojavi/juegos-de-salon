/**
 * Loteo — prototipo de laboratorio (D-310), inspirado en Shikaku (Nikoli, 1989): una grilla con algunos
 * números se divide entera en rectángulos (los lotes), cada uno con un solo número, que dice cuántas
 * casillas tiene. Se arrastra de una esquina a otra para dibujar un lote; tocarlo lo borra. Son tres
 * tableros (5×5, 6×6 y 7×7) con el reloj corriendo. Solo en español, para probar con amigos. Sin
 * `?seed=` es el tablero de hoy, el mismo para todos. El motor está en engine.js.
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { fechaLocal } from '../../assets/js/uno-al-dia.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import {
  generar, generarEtapa, validar, poner, resuelto, pista, puntajePartida, tarjeta, iguales, contiene, ancho, alto,
  ETAPAS, MAXIMO, RESTA_AYUDA,
} from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'loteo';
const EMOJI = '🧱';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SHIKAKU = 'https://en.wikipedia.org/wiki/Shikaku';
const T = {
  nombre: 'Loteo',
  lema: 'Cada número es un lote: dibújalo del tamaño justo.',
  hoy: 'El tablero de hoy es el mismo para todos.',
  como: [
    ['🧱', 'Divide el tablero en lotes: rectángulos con un solo número cada uno.'],
    ['🔢', 'El número dice cuántas casillas tiene su lote: un 6 puede ser de 2×3 o de 1×6.'],
    ['👆', `Arrastra de una esquina a otra para dibujar un lote; tócalo para borrarlo. Son ${ETAPAS.length} tableros contra el reloj.`],
  ],
  empezar: '🧱 Empezar', aJugar: '¡A lotear!',
  etapa: 'Tablero {n} de {t}', etapaLista: '🧱 ¡Tablero {n} listo!',
  reloj: '⏱ {t}',
  medida: '{w}×{h} = {a}',
  no: {
    'sin-numero': 'Ese rectángulo no tiene número.',
    'dos-numeros': 'Tiene {k} números: cada uno va en su propio lote.',
    area: 'El {n} pide {n} {casillas}; ese tiene {a}.',
  },
  arrastra: 'Arrastra de una esquina a otra para dibujar un lote.',
  borrado: 'Lote borrado.',
  deshacer: '↩ Deshacer', deshecho: 'Deshiciste la última jugada.',
  ayuda: '💡 Ayuda (−{pts})', ayudaSeguro: 'Toca de nuevo (−{pts})', ayudaDice: '💡 Ese lote va así.',
  rendirse: '🏳️ Rendirse', rendirseSeguro: '🏳️ ¿Seguro?',
  fin: { completa: '¡Todo loteado!', rendido: 'Te rendiste' },
  asiSe: 'Así se resolvía el tablero {n}.',
  capas: {
    etapas: '🧱 Tableros ({n} de {t}): +{p}.', rapidez: '⏱ Rapidez ({t}): +{p}.', sinRapidez: '⏱ Rapidez: +0 (faltaron tableros).',
    ayudas: ['💡 1 ayuda: −{pts}.', '💡 {n} ayudas: −{pts}.'],
  },
  tiempo: 'Tiempo: {t}.',
  otraVez: '🔁 Otro tablero', deHoy: '📅 El de hoy', laboratorio: '‹ Volver al laboratorio',
  listo: '¡Listo!',
  comentarAbrir: '💬 Dejar un comentario',
  comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendía cómo dibujar los lotes, si los tableros te parecieron justos y qué le cambiarías.', ph: 'Por ejemplo: me costó borrar un lote mal puesto.', nombre: 'Tu nombre (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const espera = ms => new Promise(r => setTimeout(r, ms));

/** Los colores de los lotes: claros y alegres, para que el tablero termine como un mosaico. */
const PALETA = ['#ff9fb8', '#ffd166', '#9be58f', '#8fd3ff', '#c3a6ff', '#ffb27a', '#7fe7d3', '#f59bff', '#d4ef7a', '#a8b8ff'];
/** ¿Comparten un borde? (para que dos lotes vecinos no salgan del mismo color) */
const vecinos = (a, b) => {
  const filas = a.f1 <= b.f2 && b.f1 <= a.f2, cols = a.c1 <= b.c2 && b.c1 <= a.c2;
  return (filas && (a.c2 + 1 === b.c1 || b.c2 + 1 === a.c1)) || (cols && (a.f2 + 1 === b.f1 || b.f2 + 1 === a.f1));
};
/** El color de un lote nuevo: el de su número, salvo que un vecino ya lo tenga. */
function colorPara(t, parcelas, r) {
  const k = t.pistas.findIndex(p => contiene(r, Math.floor(p.i / t.lado), p.i % t.lado));
  const usados = new Set(parcelas.filter(p => vecinos(p, r)).map(p => p.color));
  for (let d = 0; d < PALETA.length; d++) { const c = PALETA[(Math.max(0, k) * 3 + d) % PALETA.length]; if (!usados.has(c)) return c; }
  return PALETA[0];
}

const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const params = new URLSearchParams(location.search);
const SEMILLA_URL = (params.get('seed') || '').trim();
const P = { semilla: '', etapa: 0, t: null, parcelas: [], historial: [], hechas: 0, ayudas: 0, desde: 0, segundos: 0, terminado: false, acabado: false, reloj: null, oculto: 0 };
// El reloj se pausa con la pantalla oculta (U-20): el rato oculto se le descuenta al comienzo
const usado = () => Math.max(0, ((P.oculto || Date.now()) - P.desde) / 1000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (P.desde && !P.acabado) P.oculto = Date.now(); }
  else if (P.oculto) { P.desde += Date.now() - P.oculto; P.oculto = 0; }
});

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, semilla: P.semilla, etapa: P.etapa + 1, hechas: P.hechas, ayudas: P.ayudas, lotes: P.parcelas.length,
  url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

const tituloJuego = () => el('h1', { class: 'titulo-lt' },
  el('span', { class: 'ladrillo', 'aria-hidden': 'true' }, EMOJI), el('span', { class: 'display display--lg rainbow' }, T.nombre));
/** De dónde viene el juego, con el link a su página (como los otros del laboratorio). */
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: SHIKAKU, target: '_blank', rel: 'noopener', id: 'link-shikaku' }, 'Shikaku'), ', de Nikoli (1989).');

/* ------------------------------------------------------------------ */
/* El tablero                                                          */
/* ------------------------------------------------------------------ */

const pos = (r, lado) => ({
  left: `${r.c1 * 100 / lado}%`, top: `${r.f1 * 100 / lado}%`,
  width: `${ancho(r) * 100 / lado}%`, height: `${alto(r) * 100 / lado}%`,
});

/**
 * El tablero: el fondo cuadriculado, los lotes encima (cada uno de su color) y los números arriba de
 * todo. Interactivo, arrastrar dibuja un rectángulo (el arrastre de Rutas rotas) y un toque sin
 * moverse es `alTocar`.
 */
function crearTablero(t, { interactivo = false, alDibujar, alTocar, alMedir } = {}) {
  const { lado } = t;
  const caja = el('div', { class: 'tablero-lt', id: interactivo ? 'tablero' : null, style: `--lado:${lado}` });
  const fondo = el('div', { class: 'fondo' }, ...t.numeros.map(() => el('span', { class: 'celda' })));
  const lotes = el('div', { class: 'lotes' });
  const nums = el('div', { class: 'nums' }, ...t.numeros.map((n, i) => el('span', { class: 'num', 'data-i': i }, n ? String(n) : '')));
  const marco = el('div', { class: 'seleccion', 'aria-hidden': 'true' });
  caja.append(fondo, lotes, nums, marco);

  /** Dibuja los lotes; `nuevo` (un rectángulo) entra con un salto. */
  const pintar = (parcelas, { nuevo = null } = {}) => {
    lotes.replaceChildren(...parcelas.map(p => {
      const n = el('div', { class: `lote${p.ayuda ? ' ayudado' : ''}${nuevo && iguales(p, nuevo) ? ' nace' : ''}`, style: `--c:${p.color}` });
      Object.assign(n.style, pos(p, lado));
      return n;
    }));
    const cubiertos = new Set();
    for (const p of parcelas) for (let f = p.f1; f <= p.f2; f++) for (let c = p.c1; c <= p.c2; c++) cubiertos.add(f * lado + c);
    nums.querySelectorAll('.num').forEach(n => n.classList.toggle('cubierto', cubiertos.has(+n.dataset.i)));
  };
  /** Marca un rectángulo con el marco (o lo esconde, con null). */
  const marcar = r => {
    marco.classList.remove('mal');
    if (!r) { marco.classList.remove('ve'); return; }
    Object.assign(marco.style, pos(r, lado));
    marco.classList.add('ve');
  };
  /** El marco tiembla en rojo y se va: el rectángulo no vale. */
  const rechazar = r => {
    Object.assign(marco.style, pos(r, lado));
    marco.classList.remove('mal'); void marco.offsetWidth;
    marco.classList.add('ve', 'mal');
    clearTimeout(marco._t);
    marco._t = setTimeout(() => marco.classList.remove('ve', 'mal'), QUIETO ? 700 : 520);
  };

  if (interactivo) {
    caja.style.touchAction = 'none';
    let desde = null, hasta = null, movio = false;
    const lugarEn = ev => {
      const b = caja.getBoundingClientRect();
      const c = Math.min(lado - 1, Math.max(0, Math.floor((ev.clientX - b.left) / (b.width / lado))));
      const f = Math.min(lado - 1, Math.max(0, Math.floor((ev.clientY - b.top) / (b.height / lado))));
      return { f, c };
    };
    const rectDe = () => ({ f1: Math.min(desde.f, hasta.f), c1: Math.min(desde.c, hasta.c), f2: Math.max(desde.f, hasta.f), c2: Math.max(desde.c, hasta.c) });
    const bloqueado = () => caja.classList.contains('bloqueado');
    caja.addEventListener('pointerdown', ev => {
      if (bloqueado()) return;
      desde = hasta = lugarEn(ev); movio = false;
      try { caja.setPointerCapture(ev.pointerId); } catch { /* un toque simulado */ }
      clearTimeout(marco._t);
      marcar(rectDe());
    });
    caja.addEventListener('pointermove', ev => {
      if (!desde) return;
      const l = lugarEn(ev);
      if (l.f !== hasta.f || l.c !== hasta.c) { hasta = l; movio = true; const r = rectDe(); marcar(r); alMedir?.(r); vibrate(5); }
    });
    const soltar = ev => {
      if (!desde) return;
      const r = rectDe(), toque = !movio && desde.f === hasta.f && desde.c === hasta.c;
      desde = hasta = null;
      marcar(null);
      if (ev.type !== 'pointerup') { alMedir?.(null); return; }
      if (toque) alTocar?.(r.f1, r.c1); else alDibujar?.(r);
    };
    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', soltar);
    // Las pruebas dibujan y tocan sin el dedo: el mismo camino que un arrastre o un toque
    caja.addEventListener('dibujar', ev => { if (!bloqueado()) alDibujar?.(ev.detail); });
    caja.addEventListener('tocar', ev => { if (!bloqueado()) alTocar?.(ev.detail.f, ev.detail.c); });
  }
  return { caja, pintar, marcar, rechazar };
}

/* ------------------------------------------------------------------ */
/* La portada                                                          */
/* ------------------------------------------------------------------ */

// La portada: un 5×5 que se resuelve solo, lote por lote: el marco crece de una esquina a la otra, como
// cuando se arrastra, y el lote se pinta de su color. Al final, «¡Listo!» grande al centro, y otro tablero.
let demoVez = 0;
function portada() {
  const caja = el('div', { class: 'demo', 'aria-hidden': 'true' });
  const rotulo = el('p', { class: 'demo-rotulo' }, T.listo);
  vista.replaceChildren(...[
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), el('div', { class: 'demo-caja' }, caja, rotulo)),
    el('div', { class: 'panel' }, el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))))),
    SEMILLA_URL ? null : el('p', { class: 'muted center', style: 'margin:0' }, `📅 ${T.hoy}`),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar),
  ].filter(Boolean));
  pieComentario('portada');
  const vez = ++demoVez;
  const sigue = () => vez === demoVez && caja.isConnected;
  const lotesDe = (t, rects) => rects.reduce((ps, r) => [...ps, { ...r, color: colorPara(t, ps, r) }], []);
  if (QUIETO) {
    const t = generar('portada-demo-0', { lado: 5 });
    const tab = crearTablero(t); tab.caja.classList.add('chico', 'resuelto');
    tab.pintar(lotesDe(t, t.solucion));
    caja.replaceChildren(tab.caja);
    return;
  }
  (async () => {
    for (let ronda = 0; sigue(); ronda++) {
      const t = generar(`portada-demo-${ronda % 8}`, { lado: 5 });
      const tab = crearTablero(t);
      tab.caja.classList.add('chico', 'entra');
      caja.replaceChildren(tab.caja);
      rotulo.classList.remove('ve');
      await espera(900);
      let ps = [];
      for (const r of t.solucion) {
        // El marco crece de la esquina de arriba a la izquierda a la de abajo a la derecha
        const pasos = Math.max(alto(r), ancho(r));
        for (let k = 0; k < pasos; k++) {
          if (!sigue()) return;
          tab.marcar({ f1: r.f1, c1: r.c1, f2: r.f1 + Math.min(k, alto(r) - 1), c2: r.c1 + Math.min(k, ancho(r) - 1) });
          await espera(150);
        }
        await espera(160);
        if (!sigue()) return;
        tab.marcar(null);
        ps = [...ps, { ...r, color: colorPara(t, ps, r) }];
        tab.pintar(ps, { nuevo: r });
        await espera(380);
      }
      if (!sigue()) return;
      tab.caja.classList.add('resuelto');
      await espera(500);
      // Sin emoji: el título ya lo tiene
      rotulo.classList.add('ve');
      await espera(2200);
    }
  })();
}

/* ------------------------------------------------------------------ */
/* La partida                                                          */
/* ------------------------------------------------------------------ */

function empezar() {
  P.semilla = SEMILLA_URL || `dia:${fechaLocal()}`;
  P.etapa = 0; P.hechas = 0; P.ayudas = 0; P.acabado = false; P.segundos = 0;
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  // El 3, 2, 1 de La Copa (D-105): el tablero se arma con el "¡A lotear!", y el reloj corre desde ahí
  vista.replaceChildren(); pie.replaceChildren();
  cuentaRegresiva({ titulo: `${EMOJI} ${T.nombre}`, ya: T.aJugar }).then(() => { P.desde = Date.now(); jugar(); });
}

/** Los puntos de los tableros: hechos (verde), el actual y los que vienen. */
const progreso = () => el('div', { class: 'etapas', 'aria-hidden': 'true' }, ...ETAPAS.map((_, k) =>
  el('span', { class: `punto${k < P.hechas ? ' hecha' : k === P.etapa ? ' actual' : ''}` })));

function jugar() {
  const t = P.t = generarEtapa(P.semilla, P.etapa);
  P.parcelas = []; P.historial = []; P.terminado = false;
  const cabeza = el('div', { class: 'cabeza-etapa entra', id: 'etapa' },
    el('p', { class: 'n-etapa' }, fmt(T.etapa, { n: P.etapa + 1, t: ETAPAS.length })), progreso());
  const reloj = el('p', { class: 'reloj-lt', id: 'reloj' });
  const tic = () => { reloj.textContent = fmt(T.reloj, { t: mmss(usado() * 1000) }); };
  clearInterval(P.reloj); P.reloj = setInterval(tic, 250);
  const aviso = el('p', { class: 'aviso-lt', id: 'aviso', 'aria-live': 'polite' }, '');
  const decir = (texto, clase = '') => { aviso.className = `aviso-lt ${clase}`; aviso.textContent = texto; };

  /** Una jugada: guarda cómo estaba (para deshacer) y pone los lotes nuevos. */
  const jugada = (parcelas, nuevo = null) => {
    P.historial.push(P.parcelas);
    P.parcelas = parcelas;
    tab.pintar(P.parcelas, { nuevo });
    pintarBotones();
    if (resuelto(t, P.parcelas)) terminar();
  };
  const tab = crearTablero(t, {
    interactivo: true,
    alMedir: r => decir(r ? fmt(T.medida, { w: ancho(r), h: alto(r), a: ancho(r) * alto(r) }) : '', 'medida'),
    alDibujar: r => {
      if (P.terminado) return;
      desarmarAyuda();
      const v = validar(t, r);
      if (!v.ok) {
        SFX.error(); vibrate([40, 30, 40]);
        tab.rechazar(r);
        decir(fmt(T.no[v.motivo], { k: v.cuantos, n: v.n, a: v.area, casillas: v.n === 1 ? 'casilla' : 'casillas' }), 'mal');
        return;
      }
      SFX.flip(); vibrate(15);
      decir('');
      jugada(poner(P.parcelas, { ...r, color: colorPara(t, P.parcelas.filter(p => !iguales(p, r)), r) }), r);
    },
    alTocar: (f, c) => {
      if (P.terminado) return;
      desarmarAyuda();
      const lote = P.parcelas.find(p => contiene(p, f, c));
      if (lote) {
        SFX.tap(); vibrate(10);
        decir(T.borrado);
        jugada(P.parcelas.filter(p => p !== lote));
        return;
      }
      // Un 1 se dibuja con un toque: es su propio lote
      if (t.numeros[f * t.lado + c] === 1) { tab.caja.dispatchEvent(new CustomEvent('dibujar', { detail: { f1: f, c1: c, f2: f, c2: c } })); return; }
      decir(T.arrastra, 'ojo');
    },
  });

  /** Un botón que pide un segundo toque antes de algo que cuesta (como la ayuda de Pintaminas, #351). */
  const dosToques = (boton, { listo, seguro, accion }) => {
    let armado = false, timer = null;
    const desarmar = () => { armado = false; clearTimeout(timer); boton.classList.remove('armado'); boton.textContent = listo(); };
    boton.addEventListener('click', () => {
      if (P.terminado) return;
      if (!armado) {
        armado = true; SFX.tap(); vibrate(15); boton.textContent = seguro(); boton.classList.add('armado');
        timer = setTimeout(desarmar, 3000);
        return;
      }
      desarmar();
      accion();
    });
    return desarmar;
  };
  const deshacer = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-deshacer', onClick: () => {
    if (P.terminado || !P.historial.length) return;
    SFX.tap(); vibrate(10); desarmarAyuda();
    P.parcelas = P.historial.pop();
    tab.pintar(P.parcelas);
    pintarBotones();
    decir(T.deshecho);
  } }, T.deshacer);
  const botonAyuda = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-ayuda' }, fmt(T.ayuda, { pts: RESTA_AYUDA }));
  const botonRendirse = el('button', { type: 'button', class: 'btn btn--ghost btn--sm rendirse', id: 'btn-rendirse' }, T.rendirse);
  const desarmarAyuda = dosToques(botonAyuda, {
    listo: () => fmt(T.ayuda, { pts: RESTA_AYUDA }), seguro: () => fmt(T.ayudaSeguro, { pts: RESTA_AYUDA }),
    accion: () => {
      const r = pista(t, P.parcelas);
      if (!r) return;
      P.ayudas++;
      SFX.reveal(); vibrate(10);
      decir(T.ayudaDice, 'ayuda');
      jugada(poner(P.parcelas, { ...r, ayuda: true, color: colorPara(t, P.parcelas.filter(p => !iguales(p, r)), r) }), r);
    },
  });
  dosToques(botonRendirse, { listo: () => T.rendirse, seguro: () => T.rendirseSeguro, accion: () => acabar('rendido') });
  const pintarBotones = () => { deshacer.disabled = !P.historial.length || P.terminado; };

  // Tablero listo: brilla, y viene el siguiente o, tras el último, el resultado
  const terminar = () => {
    P.terminado = true;
    P.hechas++;
    const ultimo = P.hechas === ETAPAS.length;
    if (ultimo) { P.segundos = usado(); clearInterval(P.reloj); }
    tab.caja.classList.add('bloqueado', 'resuelto');
    acciones.querySelectorAll('button').forEach(b => { b.disabled = true; });
    decir(fmt(T.etapaLista, { n: P.etapa + 1 }), 'bien');
    cabeza.querySelector('.etapas').replaceWith(progreso());
    SFX.reveal(); vibrate([20, 30, 40]);
    setTimeout(() => {
      if (P.acabado) return;
      if (ultimo) acabar('completa'); else { P.etapa++; jugar(); }
    }, ultimo ? (QUIETO ? 300 : 700) : (QUIETO ? 900 : 1700));
  };

  const acciones = el('div', { class: 'acciones-lt' }, deshacer, botonAyuda, botonRendirse);
  vista.replaceChildren(cabeza, el('div', { class: 'fila-marcador' }, reloj), aviso, tab.caja, acciones);
  tab.pintar(P.parcelas);
  tic(); pintarBotones();
  pieComentario('juego');
}

/** Se acaba la partida: los tres tableros, o se rindió. */
function acabar(motivo) {
  if (P.acabado) return;
  P.acabado = true; P.terminado = true;
  clearInterval(P.reloj);
  if (motivo !== 'completa') P.segundos = usado();
  resultado(motivo);
}

/** El link de una partida: su semilla. */
const enlace = semilla => (semilla ? `?seed=${encodeURIComponent(semilla)}` : '');

function resultado(motivo) {
  const r = puntajePartida(P.hechas, P.segundos, P.ayudas), s = r.total, ms = P.segundos * 1000;
  trackFinish({ detalle: `${s}/${MAXIMO} · ${motivo} · ${P.hechas}/${ETAPAS.length} tableros · ${P.ayudas} ayudas · ${mmss(ms)}` });
  pie.replaceChildren();
  const lineas = [fmt(T.capas.etapas, { n: P.hechas, t: ETAPAS.length, p: r.base }),
    r.completa ? fmt(T.capas.rapidez, { t: mmss(ms), p: r.ptsRapidez }) : T.capas.sinRapidez];
  if (P.ayudas) lineas.push(fmt(T.capas.ayudas[P.ayudas === 1 ? 0 : 1], { n: P.ayudas, pts: r.resta }));
  // El último tablero: el del jugador si lo terminó; si se rindió, cómo se resolvía
  const t = P.t;
  const fin = crearTablero(t);
  fin.caja.classList.add('chico');
  const completa = motivo === 'completa';
  if (completa) { fin.caja.classList.add('resuelto'); fin.pintar(P.parcelas); }
  else fin.pintar(t.solucion.reduce((ps, x) => [...ps, { ...x, color: colorPara(t, ps, x) }], []));
  vista.replaceChildren(el('div', { class: 'resultado' },
    fin.caja,
    completa ? null : el('p', { class: 'muted', style: 'margin:0' }, fmt(T.asiSe, { n: P.etapa + 1 })),
    el('p', { class: `sello-lt${completa ? '' : ' mal'}` }, T.fin[motivo]),
    el('div', { class: 'score-big', id: 'puntaje' }, `${s}/${MAXIMO}`),
    el('ul', { class: 'desglose muted', id: 'desglose' }, ...lineas.map(x => el('li', {}, x))),
    // Completos, el tiempo ya lo dice la rapidez (U-8)
    r.completa ? null : el('p', { class: 'lead', style: 'margin:0' }, fmt(T.tiempo, { t: mmss(ms) })),
    botonResultadoSolo({ C: COMMON.es, emoji: EMOJI, juego: T.nombre, puntaje: `${s}/${MAXIMO}`, tiempo: mmss(ms), tarjeta: tarjeta(P.hechas, P.ayudas), url: `${SITIO}labs/plots/${enlace(SEMILLA_URL)}`, alTocar: () => SFX.tap() }),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: enlace(Math.random().toString(36).slice(2, 8)) }, T.otraVez),
    SEMILLA_URL ? el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-de-hoy', href: location.pathname }, T.deHoy) : null,
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio),
    // Una línea separa lo del juego del comentario para quienes lo prueban, como en los otros del laboratorio
    el('hr', { class: 'divisor' }),
    formularioComentario({ T: T.comentario, contexto: contexto('resultado') })));
  scrollTo(0, 0);
  if (completa) { SFX.win(); vibrate([40, 30, 40, 30, 120]); if (!QUIETO) confetti({ count: 180, duration: 2400 }); }
  else SFX.tap();
}

document.getElementById('sound-slot').append(soundToggle());
initSound();
sparkles();
portada();
window.__loteo = {
  P,
  // Para las pruebas: dibujar un rectángulo o tocar una casilla, como con el dedo
  dibujar: r => document.getElementById('tablero')?.dispatchEvent(new CustomEvent('dibujar', { detail: r })),
  tocar: (f, c) => document.getElementById('tablero')?.dispatchEvent(new CustomEvent('tocar', { detail: { f, c } })),
};
