/**
 * Agentes — prototipo de laboratorio (D-286), inspirado en Codenames (Vlaada Chvátil, Czech Games
 * Edition): una versión de uno en que el juego da las pistas y tú adivinas. Solo en español, para
 * probar con amigos; si gusta, la idea es que entre a La Copa. Sin `?seed=` es el tablero de hoy,
 * el mismo para todos. El motor está en engine.js y las pistas en pistas.js.
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { COMMON, SITIO } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { fechaLocal } from '../../assets/js/uno-al-dia.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { LONG_PRESS_MS } from '../../assets/js/teclado.js';   // el toque largo de las notas de Toque y Fama
import { generar, estado, puntaje, tarjeta, AGENTES, CUANTAS, NEUTRALES, RESTA_NEUTRAL, RESTA_ASESINO } from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'agentes';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CODENAMES = 'https://czechgames.com/en/codenames/';
const T = {
  nombre: 'Agentes', // El cuento de Codenames en una línea: sin él, «agente» no se entiende (pedido del dueño)
  lema: 'Cada palabra es el nombre en clave de un espía. Con las pistas, encuentra a los tuyos.',
  hoy: 'El tablero de hoy es el mismo para todos.',
  como: [
    ['🕵️', `Toca las palabras que van con la pista: «MAR · 3» son 3. Llegan ${CUANTAS} pistas, de a una.`],
    ['⚠️', `Evita las ${NEUTRALES} neutrales (−${RESTA_NEUTRAL}) y al asesino (−${RESTA_ASESINO}): se parecen a una pista y la cortan.`],
    ['📌', 'Si dudas de una carta, mantenla apretada para marcarla, o pasa de pista. Un agente de otra pista también suma.'],
  ],
  empezar: '🕵️ Empezar', aJugar: '¡A jugar!', pista: 'Pista {n} de {t}', faltan: 'Te faltan {n}', faltaUna: 'Te falta 1',
  pasar: '⏭️ Siguiente pista', terminar: '🏁 Terminar', seguro: '🏁 Sí, terminar',
  quedan: ['Queda 1 agente sin encontrar. ¿Terminas igual?', 'Quedan {n} agentes sin encontrar. ¿Terminas igual?'],
  // Las marcas (como las notas de Toque y Fama): un toque largo marca 📌, otro 🚫, otro la quita
  marcas: '💡 Mantén apretada una carta para marcarla como sospecha 📌. Repite para descartarla 🚫 y otra vez para quitar la marca.',
  descartada: '🚫 Descartada: mantenla apretada para quitarle la marca.',
  // Lo que dice cada marca al ponerla: un toque que duró de más marca en vez de destapar, y sin aviso parecía elegida
  marcada: { sospecha: '📌 Marcada, sin destapar. Tócala para destaparla.', descarte: '🚫 Descartada: así no la destapas por error.', nada: 'Sin marca.' },
  bien: '¡Bien! Es de los tuyos.', otra: '¡Es de los tuyos! Pero de otra pista: igual suma.',
  neutral: `Neutral: −${RESTA_NEUTRAL}. Se corta la pista.`, asesino: `¡El asesino! −${RESTA_ASESINO}. Se corta la pista.`,
  // El final tiene tres caras: victoria (70 o más), a medias y fracaso (el asesino, o menos de 35)
  fin: { victoria: '¡Misión cumplida!', medias: 'Misión a medias', fracaso: 'Misión fracasada', asesino: 'Te descubrió el asesino' },
  sello: { completa: 'Completa', cortada: 'Cortada', pasada: 'Pasada' }, clasificado: 'Clasificado',
  desglose: ['Encontraste {n} de {t} agentes: {pts} puntos.', ['Tocaste 1 neutral: −{pts}.', 'Tocaste {n} neutrales: −{pts}.'], 'Tocaste al asesino: −{pts}.'],
  tiempo: 'Tiempo: {t}.',
  // La trampa, explicada: con qué pista tentaba el asesino
  trampa: ['💀 Caíste con {w}: parecía de {p}, pero no era de los tuyos.', '💀 Esquivaste al asesino: {w}, que parecía de {p}.'], tienta: '≈ {p}',
  tableroEntero: '🗺️ El tablero entero',
  otraVez: '🔁 Otro tablero', deHoy: '📅 El de hoy', laboratorio: '‹ Volver al laboratorio',
  comentarAbrir: '💬 Dejar un comentario',
  comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si las pistas se entendían, si alguna palabra era injusta y qué le cambiarías.', ph: 'Por ejemplo: la pista FUEGO con BOMBERO me costó; el asesino me engañó.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const params = new URLSearchParams(location.search);
const SEMILLA_URL = (params.get('seed') || '').trim();
const P = { semilla: '', t: null, jugadas: [], desde: 0, marcas: new Map(), marcadas: 0 };

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, semilla: P.semilla, pistas: P.t?.pistas.map(p => p.pista).join(','), jugadas: P.jugadas.length, marcas: P.marcadas,
  url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

const tituloJuego = () => el('h1', { class: 'titulo-agentes' },
  el('span', { class: 'lupa', 'aria-hidden': 'true' }, '🕵️'), el('span', { class: 'display display--lg rainbow' }, T.nombre));
/** De dónde viene el juego, con el link a la página de Codenames de su editorial (pedido del dueño). */
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: CODENAMES, target: '_blank', rel: 'noopener', id: 'link-codenames' }, 'Codenames'),
  ', de Vlaada Chvátil (Czech Games Edition).');

// La portada juega sola: llega una pista, la lupa encuentra a sus 3 agentes y al final se destapa el
// asesino, que se parece a la pista. Después, otra pista. Con movimiento reducido queda la primera, resuelta
const DEMO = [
  { pista: 'MAR', cartas: ['LUNA', 'OLA', 'RÍO', 'BARCO', 'NUBE', 'ISLA'], agentes: [1, 3, 5], asesino: 2 },
  { pista: 'NOCHE', cartas: ['VELA', 'PAN', 'BÚHO', 'AUTO', 'DÍA', 'LUNA'], agentes: [0, 2, 5], asesino: 4 },
  { pista: 'CIRCO', cartas: ['TIGRE', 'PAYASO', 'MESA', 'CARPA', 'ZOO', 'LIBRO'], agentes: [1, 3, 0], asesino: 4 },
];
let demoVez = 0;
function portada() {
  const palabra = el('span', { class: 'dp-palabra' }, DEMO[0].pista);
  const pistaDemo = el('div', { class: 'demo-pista' }, palabra, ' · ', el('b', {}, '3'));
  const cartas = DEMO[0].cartas.map(w => el('span', { class: 'dc' }, w));
  const lupa = el('span', { class: 'demo-lupa' }, '🔍');
  const mesa = el('div', { class: 'demo-cartas' }, ...cartas, lupa);
  const demo = el('div', { class: 'demo', 'aria-hidden': 'true' }, pistaDemo, mesa);
  // replaceChildren escribe "null" si le llega un null: lo que no va se filtra
  vista.replaceChildren(...[
    el('div', { class: 'portada' },
      el('div', { class: 'titulo-sello' }, tituloJuego(), el('span', { class: 'sello sello--rojo sello--titulo' }, T.clasificado)),
      el('p', { class: 'lead', style: 'margin:0' }, T.lema), credito(), demo),
    SEMILLA_URL ? null : el('p', { class: 'muted center', style: 'margin:0' }, `📅 ${T.hoy}`),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar),
    // The steps go after Empezar, so it is seen without scrolling on a small phone (U-39)
    el('div', { class: 'panel' }, el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))))),
  ].filter(Boolean));
  pieComentario('portada');
  const vez = ++demoVez;
  const sigue = () => vez === demoVez && demo.isConnected;
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const ronda = async d => {
    cartas.forEach((c, i) => { c.className = 'dc'; c.textContent = d.cartas[i]; });
    lupa.classList.remove('ve');
    await descifrar(palabra, d.pista);
    for (const i of d.agentes) {
      if (!sigue()) return;
      lupa.style.left = `${cartas[i].offsetLeft + cartas[i].offsetWidth / 2}px`;
      lupa.style.top = `${cartas[i].offsetTop + cartas[i].offsetHeight / 2}px`;
      lupa.classList.add('ve');
      await espera(650);
      cartas[i].classList.add('agente', 'volteo');
      await espera(350);
    }
    lupa.classList.remove('ve');
    await espera(500);
    if (!sigue()) return;
    cartas[d.asesino].classList.add('asesino', 'volteo');
    cartas[d.asesino].textContent = `💀 ${d.cartas[d.asesino]}`;
    await espera(2200);
  };
  if (QUIETO) {
    const d = DEMO[0];
    d.agentes.forEach(i => cartas[i].classList.add('agente'));
    cartas[d.asesino].classList.add('asesino'); cartas[d.asesino].textContent = `💀 ${d.cartas[d.asesino]}`;
    return;
  }
  (async () => { for (let k = 0; sigue(); k++) { await ronda(DEMO[k % DEMO.length]); await espera(200); } })();
}

/** La palabra aparece descifrándose: letras al azar que se van fijando de izquierda a derecha. */
function descifrar(nodo, palabra, ms = 650) {
  if (QUIETO) { nodo.textContent = palabra; return Promise.resolve(); }
  const ABC = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  const t0 = performance.now();
  return new Promise(listo => {
    const paso = ahora => {
      const fijas = Math.floor(palabra.length * Math.min(1, (ahora - t0) / ms));
      nodo.textContent = [...palabra].map((c, i) => (i < fijas || c === ' ' ? c : ABC[Math.floor(Math.random() * ABC.length)])).join('');
      if (fijas < palabra.length) requestAnimationFrame(paso); else listo();
    };
    requestAnimationFrame(paso);
  });
}

function empezar() {
  P.semilla = SEMILLA_URL || `dia:${fechaLocal()}`;
  P.t = generar(P.semilla);
  P.jugadas = [];
  P.marcas = new Map(); P.marcadas = 0;
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  // El 3, 2, 1 de La Copa (D-105): el tablero se arma debajo con el "¡A jugar!", y el tiempo corre desde ahí
  vista.replaceChildren(); pie.replaceChildren();
  cuentaRegresiva({ titulo: '🕵️ Agentes', ya: T.aJugar }).then(() => { P.desde = Date.now(); jugar(); });
}

function jugar() {
  const { t } = P;
  const aviso = el('p', { class: 'aviso-ag', 'aria-live': 'polite' }, '');
  const caja = el('div', { class: 'pista', id: 'pista' });
  const botones = el('div', { class: 'stack' });
  const ayuda = el('p', { class: 'muted ayuda-marcas', id: 'ayuda-marcas' }, T.marcas);
  // Un toque largo marca la carta sin destaparla: nada → 📌 → 🚫 → nada. El toque que sigue no la destapa
  const cartas = t.cartas.map((c, i) => {
    let reloj = null, largo = false;
    // Mientras se mantiene apretada, un borde se va llenando: se ve que viene una marca y no un destape
    const corta = () => { if (reloj) { clearTimeout(reloj); reloj = null; } cartas[i]?.classList.remove('apretando'); };
    return el('button', {
      type: 'button', class: 'carta', 'data-i': i, style: `--n:${c.w.length};--largo:${LONG_PRESS_MS}ms`,
      onClick: () => { if (largo) { largo = false; return; } tocar(i); },
      onPointerdown: () => {
        largo = false;
        if (!cartas[i].disabled) cartas[i].classList.add('apretando');
        reloj = setTimeout(() => { reloj = null; largo = true; cartas[i].classList.remove('apretando'); marcar(i); }, LONG_PRESS_MS);
      },
      onPointerup: corta, onPointerleave: corta, onPointercancel: corta,
      onContextmenu: ev => ev.preventDefault(),
    }, c.w);
  });
  const marcar = i => {
    if (estado(t, P.jugadas).tocadas.has(i) || cartas[i].disabled) return;
    const m = P.marcas.get(i);
    if (!m) P.marcas.set(i, 'sospecha'); else if (m === 'sospecha') P.marcas.set(i, 'descarte'); else P.marcas.delete(i);
    P.marcadas++;
    vibrate([30, 40, 30]); SFX.dice();
    decir('marca', T.marcada[P.marcas.get(i) || 'nada']);
    ayuda.hidden = true;
    dibujar();
  };
  let antes = -1;
  const tablero = el('div', { class: 'tablero', id: 'tablero', 'data-tablero': 'agentes' }, ...cartas);
  // Terminar deja agentes sin encontrar y no se deshace: el primer toque avisa cuántos quedan y pide otro (U-15)
  let confirmando = false;
  const decir = (clase, texto) => { aviso.className = `aviso-ag ${clase}`; aviso.textContent = texto; };
  const dibujar = () => {
    const e = estado(t, P.jugadas);
    cartas.forEach((b, i) => {
      const c = t.cartas[i], tocada = e.tocadas.has(i);
      b.disabled = tocada || e.fin;
      const m = !tocada && P.marcas.get(i);
      // Cada agente toma el color de su pista; los de pistas ya cerradas se apagan: ya no cuentan para la jugada
      const grupo = tocada && c.tipo === 'agente' ? ` g${c.p}${e.fin || c.p >= e.actual ? '' : ' cerrada'}` : '';
      b.className = 'carta' + (tocada ? ` ${c.tipo}` : '') + grupo + (m ? ` marca-${m}` : '');
      b.setAttribute('aria-label', c.w + (m === 'sospecha' ? ' (sospecha)' : m === 'descarte' ? ' (descartada)' : ''));
    });
    if (e.fin) return revelar(e);
    // Una pista nueva entra girando y su palabra se descifra. El aviso de cómo terminó la anterior
    // ("¡El asesino! −40…") queda hasta el próximo toque: el sello dura un segundo y no alcanza a leerse
    const nueva = e.actual !== antes;
    if (nueva) { caja.className = `pista g${e.actual}`; void caja.offsetWidth; caja.classList.add('entra'); antes = e.actual; }
    const p = t.pistas[e.actual];
    const palabra = el('span', { class: 'pp' }, p.pista);
    caja.replaceChildren(
      el('p', { class: 'de' }, fmt(T.pista, { n: e.actual + 1, t: t.pistas.length })),
      el('p', { class: 'palabra' }, palabra, ' · ', el('b', {}, String(p.n))),
      el('p', { class: 'falta' }, e.faltan === 1 ? T.faltaUna : fmt(T.faltan, { n: e.faltan })));
    const ultima = e.actual === t.pistas.length - 1;
    confirmando = false;
    const boton = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-pasar', onClick: () => {
      SFX.tap();
      if (ultima && !confirmando) {
        confirmando = true;
        const quedan = AGENTES - estado(t, P.jugadas).encontrados;
        decir('', quedan === 1 ? T.quedan[0] : fmt(T.quedan[1], { n: quedan }));
        boton.textContent = T.seguro;
        return;
      }
      P.jugadas.push({ pasar: true }); decir('', ''); cerrarPista('pasada');
    } }, ultima ? T.terminar : T.pasar);
    botones.replaceChildren(boton);
    if (nueva) descifrar(palabra, p.pista);
  };
  // Al cerrarse una pista le cae un sello (Completa, Cortada o Pasada), se va girando y llega la otra
  const cerrarPista = motivo => {
    cartas.forEach(b => { b.disabled = true; });
    botones.querySelector('button')?.setAttribute('disabled', '');
    caja.append(el('span', { class: `sello sello--pista sello--${motivo === 'completa' ? 'verde' : motivo === 'cortada' ? 'rojo' : 'amarillo'}` }, T.sello[motivo]));
    if (motivo === 'completa') SFX.reveal(); else if (motivo === 'pasada') SFX.pass();
    setTimeout(() => {
      if (estado(t, P.jugadas).fin) return dibujar();
      caja.classList.remove('entra'); caja.classList.add('sale');
      setTimeout(dibujar, QUIETO ? 0 : 280);
    }, 800);
  };
  // Al terminar, las cartas que nadie tocó se destapan de a una, y después el resultado
  let revelando = false;
  const revelar = e => {
    if (revelando) return;
    revelando = true;
    const quedan = cartas.map((b, i) => i).filter(i => !e.tocadas.has(i));
    quedan.forEach((i, k) => setTimeout(() => {
      const c = t.cartas[i];
      cartas[i].className = `carta ${c.tipo} sin-tocar${QUIETO ? '' : ' volteo'}`;
      if (c.tipo === 'asesino') cartas[i].textContent = `💀 ${c.w}`;
    }, QUIETO ? 0 : 120 * k));
    if (quedan.length) SFX.flip();
    setTimeout(resultado, (QUIETO ? 0 : 120 * quedan.length) + 1100);
  };
  const tocar = i => {
    const e0 = estado(t, P.jugadas);
    if (e0.fin || e0.tocadas.has(i)) return;
    // Una descartada no se destapa por error: se sacude, como una tecla tachada
    if (P.marcas.get(i) === 'descarte') {
      cartas[i].classList.remove('shake'); void cartas[i].offsetWidth; cartas[i].classList.add('shake');
      vibrate([20, 30, 20]); decir('', T.descartada); return;
    }
    const c = t.cartas[i];
    P.jugadas.push({ i });
    const e1 = estado(t, P.jugadas);
    const cambia = e1.fin || e1.actual !== e0.actual;
    if (cambia) cartas[i].className = `carta ${c.tipo}${c.tipo === 'agente' ? ` g${c.p}` : ''}`; else dibujar();
    cartas[i].classList.add('volteo', c.tipo === 'agente' ? 'acierto' : 'falla');
    if (c.tipo === 'agente' && c.p === e0.actual) { SFX.letterHit(); vibrate(20); decir(`bien g${c.p}`, T.bien); }
    else if (c.tipo === 'agente') { SFX.letterHit(); vibrate(20); decir(`otra g${c.p}`, T.otra); }
    else if (c.tipo === 'neutral') { SFX.letterMiss(); vibrate([30, 30]); decir('mal', T.neutral); }
    else {
      SFX.error(); vibrate([60, 40, 60]); decir('mal', T.asesino);
      cartas[i].textContent = `💀 ${c.w}`;
      destello();
      if (!QUIETO) { tablero.classList.add('tiembla'); setTimeout(() => tablero.classList.remove('tiembla'), 500); }
    }
    // Si la pista se cortó o se completó, el sello se ve un momento antes de la siguiente
    if (cambia) cerrarPista(c.tipo === 'agente' ? 'completa' : 'cortada');
  };
  vista.replaceChildren(tituloJuego(), caja, aviso, tablero, ayuda, botones);
  dibujar();
  pieComentario('juego');
}

function resultado() {
  const { t } = P;
  const e = estado(t, P.jugadas);
  const s = puntaje(e), ms = Date.now() - P.desde;
  trackFinish({ detalle: `${s}/100 · ${e.encontrados}/${AGENTES} agentes · ${e.neutrales} neutrales${e.asesino ? ' · asesino' : ''} · ${P.marcadas} marcas · ${mmss(ms)}` });
  // Tres caras: victoria, a medias y fracaso (con el asesino, o con muy poco)
  const cara = s >= 70 ? 'victoria' : e.asesino ? 'asesino' : s < 35 ? 'fracaso' : 'medias';
  const mal = cara === 'asesino' || cara === 'fracaso';
  if (mal) { SFX.hang(); destello(); } else SFX.win();
  if (!QUIETO && cara === 'victoria') confetti({ count: 180, duration: 2600 });
  pie.replaceChildren();
  const lineas = [fmt(T.desglose[0], { n: e.encontrados, t: AGENTES, pts: Math.round(100 * e.encontrados / AGENTES) })];
  if (e.neutrales) lineas.push(fmt(T.desglose[1][e.neutrales === 1 ? 0 : 1], { n: e.neutrales, pts: RESTA_NEUTRAL * e.neutrales }));
  if (e.asesino) lineas.push(fmt(T.desglose[2], { pts: RESTA_ASESINO }));
  // El tablero entero, con lo que era cada carta. Va plegado (C-8: los bloques largos, colapsados):
  // abierto, sus 15 cartas dejaban los botones del final bajo el pliegue (D-309)
  const tablero = el('div', { class: 'tablero tablero--fin', id: 'tablero-fin' }, ...t.cartas.map((c, i) => el('div', {
    class: `carta ${c.tipo === 'agente' ? `agente g${c.p}` : c.tipo}${e.tocadas.has(i) ? '' : ' sin-tocar'}`,
    style: `--n:${c.w.length};--k:${i}`,
  }, c.tipo === 'asesino' ? `💀 ${c.w}` : c.w,
  c.tipo !== 'agente' && t.pistas[c.tienta] ? el('span', { class: 'de-pista' }, fmt(T.tienta, { p: t.pistas[c.tienta].pista })) : null,
  // Bajo cada agente, su pista: así el tablero dice también cuáles eran las pistas
  c.tipo === 'agente' ? el('span', { class: 'de-pista' }, t.pistas[c.p].pista) : null)));
  const asesino = t.cartas.find(c => c.tipo === 'asesino');
  const nodoPuntaje = el('div', { class: 'score-big', id: 'puntaje', 'data-final': s }, QUIETO ? `${s}/100` : '0/100');
  vista.replaceChildren(el('div', { class: `resultado resultado--${cara}` },
    el('div', { class: 'trofeo' }, { victoria: '🏆', medias: '🕵️', fracaso: '😵', asesino: '💀' }[cara]),
    el('h2', { class: `sello-fin sello-fin--${mal ? 'mal' : cara}` }, T.fin[cara]),
    nodoPuntaje,
    el('ul', { class: 'desglose muted' }, ...lineas.map(x => el('li', {}, x))),
    el('p', { class: 'lead', style: 'margin:0' }, fmt(T.tiempo, { t: mmss(ms) })),
    asesino && t.pistas[asesino.tienta] ? el('p', { class: `trampa${e.asesino ? ' trampa--mal' : ''}`, id: 'trampa' },
      fmt(T.trampa[e.asesino ? 0 : 1], { w: asesino.w, p: t.pistas[asesino.tienta].pista })) : null,
    // La tarjeta de emojis va solo en el mensaje para compartir: aquí ya está el tablero con cada carta (pedido del dueño)
    el('details', { class: 'panel tablero-entero', id: 'repaso-agentes', 'data-tablero': 'agentes' }, el('summary', {}, T.tableroEntero), tablero),
    botonResultadoSolo({ C: COMMON.es, emoji: '🕵️', juego: T.nombre, puntaje: `${s}/100`, tiempo: mmss(ms), tarjeta: tarjeta(t, e), url: `${SITIO}labs/agents/${SEMILLA_URL ? `?seed=${encodeURIComponent(SEMILLA_URL)}` : ''}`, alTocar: () => SFX.tap() }),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: `?seed=${Math.random().toString(36).slice(2, 8)}` }, T.otraVez),
    SEMILLA_URL ? el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-de-hoy', href: location.pathname }, T.deHoy) : null,
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio),
    // El comentario va abierto y al final de todo (D-265, D-268)
    // Una línea separa lo del juego del comentario para quienes lo prueban (pedido del dueño)
    el('hr', { class: 'divisor' }),
    formularioComentario({ T: T.comentario, contexto: contexto('resultado') })));
  scrollTo(0, 0);
  if (!QUIETO) contar(nodoPuntaje, s);
}

/** El puntaje sube de 0 al final, frenando al llegar. */
function contar(nodo, s, ms = 1100) {
  const t0 = performance.now() + 450;
  const paso = ahora => {
    const x = Math.max(0, Math.min(1, (ahora - t0) / ms));
    nodo.textContent = `${Math.round(s * (1 - (1 - x) ** 3))}/100`;
    if (x < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/** Un destello rojo en toda la pantalla: el asesino, o una misión que fracasó. */
function destello() {
  if (QUIETO) return;
  const x = el('div', { class: 'destello', 'aria-hidden': 'true' });
  document.body.append(x);
  setTimeout(() => x.remove(), 800);
}

document.getElementById('sound-slot').append(soundToggle());
initSound();
sparkles();
portada();
window.__agentes = { P, estado: () => (P.t ? estado(P.t, P.jugadas) : null) };
