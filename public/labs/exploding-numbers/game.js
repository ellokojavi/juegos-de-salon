/**
 * Números explosivos — prototipo de laboratorio (D-297), inspirado en Number Match (Easybrain): se
 * tachan de a pares dos números iguales o que suman 10, si están juntos en línea, hasta dejar el
 * tablero limpio. Cada par estalla, una fila entera explota y se va, y al limpiarlo todo explota
 * (pedido del dueño). Solo en español, para probar con amigos. Sin `?seed=` es el tablero de hoy, el
 * mismo para todos. El motor está en engine.js.
 */
import { salidasFin } from '../../assets/js/fin.js';
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { fechaLocal } from '../../assets/js/uno-al-dia.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { mmss } from '../../assets/js/time-format.js';
import {
  generar, nuevaPartida, une, quitar, agregar, pares, indice, quedan, avance, puntaje, tarjeta,
  COLUMNAS, MAS, MAXIMO, PUNTOS_LIMPIO, PUNTOS_MAS, RESTA_AYUDA,
} from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'numeros-explosivos';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NUMBER_MATCH = 'https://easybrain.com/numbermatch';
const T = {
  nombre: 'Números explosivos',
  lema: 'Haz estallar los números de a pares hasta dejar el tablero limpio.',
  hoy: 'El tablero de hoy es el mismo para todos.',
  como: [
    ['💥', 'Toca dos números iguales (7 y 7) o que sumen 10 (4 y 6): estallan.'],
    ['↔️', 'Deben estar en línea (de lado, arriba, abajo o en diagonal) o al final de una fila y al inicio de la siguiente. Lo estallado no estorba.'],
    ['➕', `¿Sin pares? ➕ copia abajo los que quedan (${MAS} veces). Cada ➕ sin usar suma ${PUNTOS_MAS}.`],
  ],
  empezar: '💥 Empezar', aJugar: '¡A estallar!',
  quedan: ['Queda 1 número', 'Quedan {n} números'],
  mas: '➕ Agregar ({n})', masSeguro: 'Hay pares: ¿seguro?', masNada: '➕ No quedan',
  ayuda: '💡 Ayuda (−{pts})', ayudaSeguro: 'Toca de nuevo (−{pts})', ayudaVer: '💡 Ver la ayuda', ayudaDice: '💡 Esos dos estallan juntos.',
  rendirse: '🏳️ Rendirse', rendirseSeguro: '🏳️ ¿Seguro?',
  no: {
    numeros: '{a} y {b} no son iguales ni suman 10.',
    tapado: 'Hay números entre medio: haz estallar esos primero.',
    linea: 'No están en línea: de lado, arriba o en diagonal.',
  },
  sinPares: '💥 No quedan pares: usa ➕.',
  fila: ['💥 ¡Fila!', '💥 ¡{n} filas!'],
  agregados: '➕ {n} números más abajo.',
  fin: { limpio: '¡Limpio!', trabado: 'Sin jugadas', rendido: 'Te rendiste' },
  trabadoDice: 'No quedan pares ni ➕.',
  desglose: {
    limpio: `💥 Tablero limpio: ${PUNTOS_LIMPIO}.`,
    mas: ['➕ Sin usar: ninguno.', '➕ Sin usar: 1 × {u} = {pts}.', '➕ Sin usar: {n} × {u} = {pts}.'],
    parte: `🧹 Estallaste el {p} %: {pts} de ${PUNTOS_LIMPIO}.`,
    ayudas: ['💡 1 ayuda: −{pts}.', '💡 {n} ayudas: −{pts}.'],
  },
  tiempo: 'Tiempo: {t}.',
  otraVez: '🔁 Otro tablero', deHoy: '📅 El de hoy', laboratorio: '‹ Volver al laboratorio',
  comentarAbrir: '💬 Dejar un comentario',
  comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendía qué números se pueden unir, si te quedaste sin jugadas y qué le cambiarías.', ph: 'Por ejemplo: no veía que se podía unir en diagonal.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const espera = ms => new Promise(r => setTimeout(r, ms));
/** ➕ es un emoji gris oscuro que sobre el fondo no se ve: va con el halo claro de base.css. */
const conMas = texto => String(texto).split('➕').flatMap((x, k) => (k ? [el('span', { class: 'emoji-claro' }, '➕'), x] : [x])).filter(x => x !== '');
const poner = (nodo, texto) => nodo.replaceChildren(...conMas(texto));

/** El color de cada número: los que se pueden unir sumando 10 son de la misma familia (1 y 9, 2 y 8…). */
const FAMILIA = { 1: '#ff2e88', 9: '#ff2e88', 2: '#2ee6d6', 8: '#2ee6d6', 3: '#ffd23f', 7: '#ffd23f', 4: '#9dff3a', 6: '#9dff3a', 5: '#ff8a3d' };

const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const params = new URLSearchParams(location.search);
const SEMILLA_URL = (params.get('seed') || '').trim();
const P = { semilla: '', t: null, p: null, desde: 0, rendido: false, fin: null };

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, semilla: P.semilla, quedan: P.p ? quedan(P.p) : null, mas: P.p?.mas,
  url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

const tituloJuego = (chico = false) => el('h1', { class: `titulo-ne${chico ? ' chico' : ''}` },
  el('span', { class: 'bomba', 'aria-hidden': 'true' }, '💥'), el('span', { class: `display ${chico ? '' : 'display--lg '}rainbow` }, T.nombre));
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: NUMBER_MATCH, target: '_blank', rel: 'noopener', id: 'link-number-match' }, 'Number Match'), ', de Easybrain.');

/* ------------------------------------------------------------------ */
/* Las explosiones                                                     */
/* ------------------------------------------------------------------ */

let capa = null;
/** La capa de las chispas, sobre toda la página: las chispas vuelan fuera del tablero. */
function capaChispas() {
  if (!capa || !capa.isConnected) { capa = el('div', { class: 'chispas', 'aria-hidden': 'true' }); document.body.append(capa); }
  return capa;
}
/**
 * Un número que estalla: una onda que se abre, un destello, pedazos del número y chispas de su color
 * que salen volando. `fuerza` agranda todo (una fila, el tablero entero).
 */
function estallar(nodo, { fuerza = 1, color } = {}) {
  if (QUIETO || !nodo) return;
  const r = nodo.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const c = color || FAMILIA[nodo.dataset.v] || '#ffd23f';
  const L = capaChispas();
  const onda = el('span', { class: 'onda', style: `left:${x}px;top:${y}px;--c:${c};--t:${(r.width * 2.6 * fuerza).toFixed(0)}px` });
  const destello = el('span', { class: 'destello', style: `left:${x}px;top:${y}px;--t:${(r.width * 1.4 * fuerza).toFixed(0)}px` });
  // Y el 💥 de historieta, encima
  const kaboom = el('span', { class: 'kaboom', style: `left:${x}px;top:${y}px;--t:${(r.width * 1.5 * Math.sqrt(fuerza)).toFixed(0)}px;--g:${(Math.random() * 50 - 25).toFixed(0)}deg` }, '💥');
  L.append(onda, destello, kaboom);
  const n = Math.round(16 * fuerza);
  for (let k = 0; k < n; k++) {
    const ang = (k / n) * Math.PI * 2 + Math.random() * 0.6;
    const d = (40 + Math.random() * 60) * fuerza;
    // Algunos pedazos son el número mismo, que se rompe; el resto, chispas
    const pedazo = k % 4 === 0 && nodo.dataset.v;
    const dura = 480 + Math.random() * 260;
    const ch = el('span', {
      class: pedazo ? 'pedazo' : 'chispa',
      style: `left:${x}px;top:${y}px;--c:${c};--dx:${(Math.cos(ang) * d).toFixed(1)}px;--dy:${(Math.sin(ang) * d).toFixed(1)}px;--g:${(Math.random() * 540 - 270).toFixed(0)}deg;--d:${dura.toFixed(0)}ms`,
    }, pedazo ? nodo.dataset.v : '');
    L.append(ch);
    setTimeout(() => ch.remove(), dura + 60);
  }
  setTimeout(() => { onda.remove(); destello.remove(); kaboom.remove(); }, 700);
}
/** El tablero tiembla: más fuerte con una fila. */
function temblor(nodo, fuerte = false) {
  if (QUIETO || !nodo) return;
  nodo.classList.remove('tiembla', 'tiembla-fuerte'); void nodo.offsetWidth;
  nodo.classList.add(fuerte ? 'tiembla-fuerte' : 'tiembla');
}

/* ------------------------------------------------------------------ */
/* La grilla                                                           */
/* ------------------------------------------------------------------ */

/** Las casillas de una partida, en 9 columnas (el tablero, la portada y el final usan la misma). */
function casillas(p, { botones = false } = {}) {
  return p.celdas.map((c, i) => el(botones ? 'button' : 'span', {
    ...(botones ? { type: 'button' } : {}),
    class: `num${c.fuera ? ' fuera' : ''}`, 'data-id': c.id, 'data-i': i, 'data-v': c.v, style: `--c:${FAMILIA[c.v]}`,
    ...(botones ? { 'aria-label': c.fuera ? `${c.v}, estallado` : String(c.v), disabled: c.fuera } : {}),
  }, String(c.v)));
}

/* ------------------------------------------------------------------ */
/* La portada                                                          */
/* ------------------------------------------------------------------ */

// La portada: una partida de verdad, en chico, que se juega sola en su orden: cada par se marca y
// estalla, las filas se van, y al limpiarse dice «¡Limpio!». Después, otro tablero.
let demoVez = 0;
function portada() {
  // El tablero chico y, encima, al centro, el «¡Limpio!» que lo reemplaza al terminar (pedido del dueño)
  const caja = el('div', { class: 'demo-tablero' });
  const rotulo = el('p', { class: 'demo-rotulo' }, '');
  vista.replaceChildren(...[
    el('div', { class: 'portada' }, tituloJuego(), el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), el('div', { class: 'demo', 'aria-hidden': 'true' }, caja, rotulo)),
    SEMILLA_URL ? null : el('p', { class: 'muted center', style: 'margin:0' }, `📅 ${T.hoy}`),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar),
    // The steps go after Empezar, so it is seen without scrolling on a small phone (U-39)
    el('div', { class: 'panel' }, el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ...conMas(ico)), el('span', {}, ...conMas(x)))))),
  ].filter(Boolean));
  pieComentario('portada');
  partidaDemo(caja, rotulo);
}

function partidaDemo(caja, rotulo) {
  const vez = ++demoVez;
  const sigue = () => vez === demoVez && caja.isConnected;
  if (QUIETO) { caja.replaceChildren(el('div', { class: 'tablero-ne chico' }, ...casillas(nuevaPartida(generar('portada-demo', { n: 18 }))))); return; }
  (async () => {
    for (let ronda = 0; sigue(); ronda++) {
      const t = generar(`portada-demo-${ronda % 8}`, { n: 18 }), p = nuevaPartida(t);
      const g = el('div', { class: 'tablero-ne chico entra' }, ...casillas(p));
      caja.replaceChildren(g);
      rotulo.textContent = ''; rotulo.className = 'demo-rotulo';
      await espera(900);
      for (const [a, b] of t.orden) {
        if (!sigue()) return;
        const na = g.querySelector(`[data-id="${a}"]`), nb = g.querySelector(`[data-id="${b}"]`);
        na.classList.add('sel'); await espera(260); nb.classList.add('sel'); await espera(220);
        if (!sigue()) return;
        const antes = p.celdas.map(c => c.id);
        const r = quitar(p, indice(p, a), indice(p, b));
        for (const n of [na, nb]) { estallar(n, { fuerza: 0.7 }); n.classList.remove('sel'); n.classList.add('fuera', 'boom'); }
        if (r.filas.length) {
          await espera(240);
          for (const f of r.filas) for (const id of antes.slice(f * COLUMNAS, (f + 1) * COLUMNAS)) g.querySelector(`[data-id="${id}"]`)?.classList.add('se-va');
          temblor(g, true);
          await espera(420);
          if (!sigue()) return;
          g.replaceChildren(...casillas(p));
        }
        await espera(380);
      }
      if (!sigue()) return;
      // Sin 💥: el título ya lo tiene (pedido del dueño)
      rotulo.textContent = T.fin.limpio; rotulo.className = 'demo-rotulo ve';
      estallar(rotulo, { fuerza: 0.5, color: '#ffd23f' });
      await espera(2200);
    }
  })();
}

/* ------------------------------------------------------------------ */
/* La partida                                                          */
/* ------------------------------------------------------------------ */

function empezar() {
  P.semilla = SEMILLA_URL || `dia:${fechaLocal()}`;
  P.t = generar(P.semilla);
  P.p = nuevaPartida(P.t);
  P.rendido = false; P.fin = null;
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  // El 3, 2, 1 de La Copa (D-105): el tablero se arma con el "¡A estallar!", y el tiempo corre desde ahí
  vista.replaceChildren(); pie.replaceChildren();
  cuentaRegresiva({ titulo: '💥 Números explosivos', ya: T.aJugar }).then(() => { P.desde = Date.now(); jugar(); });
}

function jugar() {
  const { p } = P;
  const marcador = el('p', { class: 'marcador', id: 'marcador' });
  const aviso = el('p', { class: 'aviso-ne', 'aria-live': 'polite' }, '');
  const tablero = el('div', { class: 'tablero-ne', id: 'tablero', 'data-tablero': 'numeros' });
  let sel = null, pagada = null;   // pagada: la última ayuda cobrada ({ a, b } ids), hasta que estallen
  P.ocupado = false;   // mientras una fila explota, los toques esperan

  /** Un botón que pide un segundo toque antes de algo que cuesta (como la ayuda de Pintaminas, #351). */
  const dosToques = (boton, { listo, seguro, accion }) => {
    let armado = false, timer = null;
    const desarmar = () => { armado = false; clearTimeout(timer); boton.classList.remove('armado'); poner(boton, listo()); };
    boton.addEventListener('click', () => {
      if (P.fin || P.ocupado) return;
      const pide = seguro();
      if (pide && !armado) {
        armado = true; SFX.tap(); vibrate(15); poner(boton, pide); boton.classList.add('armado');
        timer = setTimeout(desarmar, 3000);
        return;
      }
      desarmar();
      accion();
    });
    return desarmar;
  };
  const botonMas = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-mas' });
  const botonAyuda = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-ayuda' });
  const botonRendirse = el('button', { type: 'button', class: 'btn btn--ghost btn--sm rendirse', id: 'btn-rendirse' }, T.rendirse);
  const textoMas = () => (p.mas ? fmt(T.mas, { n: p.mas }) : T.masNada);
  const verPagada = () => pagada && indice(p, pagada.a) >= 0 && !p.celdas[indice(p, pagada.a)].fuera && !p.celdas[indice(p, pagada.b)].fuera;
  const textoAyuda = () => (verPagada() ? T.ayudaVer : fmt(T.ayuda, { pts: RESTA_AYUDA }));
  const desarmarMas = dosToques(botonMas, { listo: textoMas, seguro: () => (pares(p).length ? T.masSeguro : null), accion: () => usarMas() });
  const desarmarAyuda = dosToques(botonAyuda, { listo: textoAyuda, seguro: () => (verPagada() ? null : fmt(T.ayudaSeguro, { pts: RESTA_AYUDA })), accion: () => pedirAyuda() });
  dosToques(botonRendirse, { listo: () => T.rendirse, seguro: () => T.rendirseSeguro, accion: () => { P.rendido = true; terminar('rendido'); } });
  const acciones = el('div', { class: 'acciones-ne' }, botonMas, botonAyuda, botonRendirse);

  const dibujar = () => {
    tablero.replaceChildren(...casillas(p, { botones: true }));
    const n = quedan(p);
    marcador.textContent = fmt(T.quedan[n === 1 ? 0 : 1], { n });
    botonMas.disabled = !p.mas; poner(botonMas, textoMas());
    poner(botonAyuda, textoAyuda());
    botonMas.classList.toggle('llama', !!p.mas && !pares(p).length);
    if (sel !== null) nodo(sel)?.classList.add('sel');
    if (verPagada()) marcarPista(pagada);
  };
  const nodo = id => tablero.querySelector(`[data-id="${id}"]`);
  const marcarPista = ({ a, b }) => { nodo(a)?.classList.add('pista'); nodo(b)?.classList.add('pista'); };
  const decir = (texto, clase = '') => { aviso.className = `aviso-ne ${clase}`; poner(aviso, texto); };

  tablero.addEventListener('click', ev => {
    const b = ev.target.closest('.num');
    if (!b || b.disabled || P.fin || P.ocupado) return;
    desarmarMas(); desarmarAyuda();
    const id = +b.dataset.id;
    if (sel === null) { sel = id; b.classList.add('sel'); SFX.tap(); vibrate(8); return; }
    if (sel === id) { sel = null; b.classList.remove('sel'); return; }
    const i = indice(p, sel), j = indice(p, id);
    const u = une(p, i, j);
    if (!u.ok) {
      // No se unen: tiemblan los dos, dice por qué y se sueltan: la jugada siguiente parte de cero
      SFX.error(); vibrate([40, 30, 40]);
      for (const n of [nodo(sel), b]) { n?.classList.remove('sel', 'no'); void n?.offsetWidth; n?.classList.add('no'); }
      decir(fmt(T.no[u.motivo], { a: p.celdas[i].v, b: p.celdas[j].v }), 'mal');
      sel = null;
      return;
    }
    explotar(sel, id);
  });

  async function explotar(a, b) {
    sel = null;
    const antes = p.celdas.map(c => c.id);
    const r = quitar(P.p, indice(p, a), indice(p, b));
    const na = nodo(a), nb = nodo(b);
    for (const n of [na, nb]) { n.classList.remove('sel', 'pista'); estallar(n); n.classList.add('fuera', 'boom'); n.disabled = true; }
    SFX.hit(); vibrate(25); temblor(tablero);
    decir('');
    if (r.filas.length) {
      P.ocupado = true;
      await espera(QUIETO ? 0 : 220);
      // La fila entera explota de punta a punta, y se va
      SFX.sink(); vibrate([30, 20, 60]);
      for (const f of r.filas) antes.slice(f * COLUMNAS, (f + 1) * COLUMNAS).forEach((id, k) => {
        const n = nodo(id); if (!n) return;
        n.classList.add('se-va');
        setTimeout(() => estallar(n, { fuerza: 0.6, color: '#ffd23f' }), k * 28);
      });
      temblor(tablero, true);
      decir(fmt(T.fila[r.filas.length === 1 ? 0 : 1], { n: r.filas.length }), 'fila');
      await espera(QUIETO ? 0 : 520);
      P.ocupado = false;
    }
    dibujar();
    if (r.limpio) return terminar('limpio');
    if (!pares(p).length) {
      if (p.mas) decir(T.sinPares, 'ojo');
      else terminar('trabado');
    }
  }

  function usarMas() {
    const antes = p.celdas.length;
    const n = agregar(p);
    if (!n) return;
    SFX.flip(); vibrate([10, 20, 10]);
    sel = null;
    dibujar();
    // Los nuevos caen de a uno
    if (!QUIETO) [...tablero.children].slice(antes).forEach((x, k) => { x.style.setProperty('--k', k); x.classList.add('nace'); });
    decir(fmt(T.agregados, { n }));
    tablero.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: QUIETO ? 'auto' : 'smooth' });
    if (!pares(p).length && !p.mas) setTimeout(() => terminar('trabado'), 600);
  }

  function pedirAyuda() {
    if (!verPagada()) {
      const par = pares(p)[0];
      if (!par) { decir(p.mas ? T.sinPares : T.trabadoDice, 'ojo'); return; }
      p.ayudas++;
      pagada = { a: p.celdas[par.i].id, b: p.celdas[par.j].id };
    }
    SFX.tap(); vibrate(10);
    sel = null;
    dibujar();
    nodo(pagada.a)?.scrollIntoView({ block: 'nearest', behavior: QUIETO ? 'auto' : 'smooth' });
    decir(T.ayudaDice, 'ayuda');
  }

  // Un solo final, como en los otros juegos: el resumen aparece de inmediato, y al limpiar el
  // tablero las explosiones grandes estallan sobre él (pedido del dueño)
  function terminar(motivo) {
    if (P.fin) return;
    P.fin = motivo;
    resultado();
  }

  vista.replaceChildren(tituloJuego(true), marcador, tablero, aviso, acciones);
  dibujar();
  pieComentario('juego');
}

/* ------------------------------------------------------------------ */
/* El resultado                                                        */
/* ------------------------------------------------------------------ */

const enlace = semilla => (semilla ? `?seed=${encodeURIComponent(semilla)}` : '');

function resultado() {
  const { p } = P;
  const s = puntaje(p), ms = Date.now() - P.desde, limpio = P.fin === 'limpio';
  trackFinish({ detalle: `${s}/${MAXIMO} · ${P.fin} · ${Math.round(100 * avance(p))} % · ${MAS - p.mas} ➕ · ${p.ayudas} ayudas · ${mmss(ms)}` });
  pie.replaceChildren();
  const lineas = [];
  if (limpio) {
    lineas.push(T.desglose.limpio);
    lineas.push(fmt(T.desglose.mas[Math.min(p.mas, 2)], { n: p.mas, u: PUNTOS_MAS, pts: p.mas * PUNTOS_MAS }));
  } else {
    if (P.fin === 'trabado') lineas.push(T.trabadoDice);
    lineas.push(fmt(T.desglose.parte, { p: Math.round(100 * avance(p)), pts: Math.round(PUNTOS_LIMPIO * avance(p)) }));
  }
  if (p.ayudas) lineas.push(fmt(T.desglose.ayudas[p.ayudas === 1 ? 0 : 1], { n: p.ayudas, pts: RESTA_AYUDA * p.ayudas }));
  vista.replaceChildren(el('div', { class: 'resultado' },
    tituloJuego(true),
    el('p', { class: `sello-ne${limpio ? '' : ' mal'}` }, T.fin[P.fin]),
    el('div', { class: 'score-big', id: 'puntaje' }, `${s}/${MAXIMO}`),
    el('ul', { class: 'desglose muted' }, ...lineas.map(x => el('li', {}, ...conMas(x)))),
    el('p', { class: 'lead', style: 'margin:0' }, fmt(T.tiempo, { t: mmss(ms) })),
    botonResultadoSolo({ C: COMMON.es, emoji: '💥', juego: T.nombre, puntaje: `${s}/${MAXIMO}`, tiempo: mmss(ms), tarjeta: tarjeta(p), url: `${SITIO}labs/exploding-numbers/${enlace(SEMILLA_URL)}`, alTocar: () => SFX.tap() }),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: enlace(Math.random().toString(36).slice(2, 8)) }, T.otraVez),
    SEMILLA_URL ? el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-de-hoy', href: location.pathname }, T.deHoy) : null,
    salidasFin('lab', { raiz: '../../' }),
    // Una línea separa lo del juego del comentario para quienes lo prueban, como en los otros del laboratorio
    el('hr', { class: 'divisor' }),
    formularioComentario({ T: T.comentario, contexto: contexto('resultado') })));
  scrollTo(0, 0);
  if (limpio) {
    // Todo explota, sobre el puntaje
    SFX.win(); vibrate([40, 30, 40, 30, 120]);
    if (!QUIETO) {
      // Un punto de 60 px en el centro del puntaje: de ahí salen los tres estallidos
      const r = document.getElementById('puntaje').getBoundingClientRect();
      const centro = el('span', { 'aria-hidden': 'true', style: `position:fixed;left:${r.left + r.width / 2 - 30}px;top:${r.top + r.height / 2 - 30}px;width:60px;height:60px;pointer-events:none` });
      document.body.append(centro);
      for (let k = 0; k < 3; k++) setTimeout(() => estallar(centro, { fuerza: 2.4 - k * 0.5, color: ['#ffd23f', '#ff2e88', '#2ee6d6'][k] }), 120 + k * 160);
      setTimeout(() => centro.remove(), 1000);
      confetti({ count: 180, duration: 2400 });
    }
  } else if (P.fin === 'trabado') SFX.error();
  else SFX.tap();
}

document.getElementById('sound-slot').append(soundToggle());
initSound();
sparkles();
portada();
window.__explosivos = { P };
