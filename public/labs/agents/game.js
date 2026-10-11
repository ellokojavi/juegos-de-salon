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
import { generar, estado, puntaje, tarjeta, AGENTES, RESTA_NEUTRAL, RESTA_ASESINO } from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'agentes';
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CODENAMES = 'https://czechgames.com/en/codenames/';
const T = {
  nombre: 'Agentes', lema: 'El juego te da una pista; tú encuentras a tus agentes entre 12 palabras.',
  hoy: 'El tablero de hoy es el mismo para todos.',
  como: [
    ['🕵️', 'Llegan 3 pistas, de a una, con su número: «MAR · 3» quiere decir que 3 palabras van con MAR. Toca las que creas.'],
    ['⚠️', `Hay 2 palabras neutrales (−${RESTA_NEUTRAL}) y un asesino (−${RESTA_ASESINO}) que se parece a una pista: tocarlos corta la pista.`],
    ['⏭️', 'Si dudas, pasa a la siguiente pista. Cada agente que encuentras suma.'],
  ],
  empezar: '🕵️ Empezar', pista: 'Pista {n} de {t}', faltan: 'Te faltan {n}', faltaUna: 'Te falta 1',
  pasar: '⏭️ Siguiente pista', terminar: '🏁 Terminar',
  bien: '¡Bien! Es de los tuyos.', otra: '¡Es de los tuyos! Pero de otra pista: igual suma.',
  neutral: `Neutral: −${RESTA_NEUTRAL}. Se corta la pista.`, asesino: `¡El asesino! −${RESTA_ASESINO}. Se corta la pista.`,
  fin: '¡Misión cumplida!', finMal: 'Misión terminada',
  desglose: ['Encontraste {n} de {t} agentes: {pts} puntos.', 'Tocaste {n} neutral(es): −{pts}.', 'Tocaste al asesino: −{pts}.'],
  total: 'Total: {s}/100 en {t}.',
  pistasEran: 'Las pistas eran', otraVez: '🔁 Otro tablero', deHoy: '📅 El de hoy', laboratorio: '‹ Volver al laboratorio',
  comentarAbrir: '💬 Dejar un comentario',
  comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si las pistas se entendían, si alguna palabra era injusta y qué le cambiarías.', ph: 'Por ejemplo: la pista FUEGO con BOMBERO me costó; el asesino me engañó.', nombre: 'Tu nombre (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', contexto: 'Lo que se envía junto', cancelar: 'Cancelar', cerrar: 'Cerrar' },
};
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const params = new URLSearchParams(location.search);
const SEMILLA_URL = (params.get('seed') || '').trim();
const P = { semilla: '', t: null, jugadas: [], desde: 0 };

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, semilla: P.semilla, pistas: P.t?.pistas.map(p => p.pista).join(','), jugadas: P.jugadas.length,
  url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

const tituloJuego = () => el('h1', { class: 'titulo-agentes' },
  el('span', { class: 'lupa', 'aria-hidden': 'true' }, '🕵️'), el('span', { class: 'display display--lg rainbow' }, T.nombre));
/** De dónde viene el juego, con el link a la página de Codenames de su editorial (pedido del dueño). */
const credito = () => el('p', { class: 'credito' }, 'Inspirado en ',
  el('a', { href: CODENAMES, target: '_blank', rel: 'noopener', id: 'link-codenames' }, 'Codenames'),
  ', de Vlaada Chvátil (Czech Games Edition).');

function portada() {
  const COLORES = ['#9dff3a', '#ffffff', '#9dff3a', '#ff6fa8', '#9dff3a', '#9dff3a'];
  const demo = el('div', { class: 'demo-cartas', 'aria-hidden': 'true' },
    ...['OLA', 'LUNA', 'BARCO', 'ARENA', 'ISLA', 'PUERTO'].map((w, k) => el('span', { style: `--k:${k};--c:${COLORES[k]}` }, w)));
  vista.replaceChildren(
    el('div', { class: 'portada' }, tituloJuego(), credito(), demo, el('p', { class: 'lead', style: 'margin:0' }, T.lema)),
    el('div', { class: 'panel' }, el('ol', { class: 'pasos' }, ...T.como.map(([ico, x]) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ico), el('span', {}, x))))),
    SEMILLA_URL ? null : el('p', { class: 'muted center', style: 'margin:0' }, `📅 ${T.hoy}`),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar));
  pieComentario('portada');
}

function empezar() {
  P.semilla = SEMILLA_URL || `dia:${fechaLocal()}`;
  P.t = generar(P.semilla);
  P.jugadas = [];
  P.desde = Date.now();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  jugar();
}

function jugar() {
  const { t } = P;
  const aviso = el('p', { class: 'aviso-ag', 'aria-live': 'polite' }, '');
  const caja = el('div', { class: 'pista', id: 'pista' });
  const botones = el('div', { class: 'stack' });
  const cartas = t.cartas.map((c, i) => el('button', { type: 'button', class: 'carta', 'data-i': i, onClick: () => tocar(i) }, c.w));
  let antes = 0;
  const decir = (clase, texto) => { aviso.className = `aviso-ag ${clase}`; aviso.textContent = texto; };
  const dibujar = () => {
    const e = estado(t, P.jugadas);
    cartas.forEach((b, i) => {
      const c = t.cartas[i], tocada = e.tocadas.has(i);
      b.disabled = tocada || e.fin;
      b.className = 'carta' + (tocada ? ` ${c.tipo}` : '');
    });
    if (e.fin) return resultado();
    if (e.actual !== antes || !caja.textContent) {
      caja.classList.remove('entra'); void caja.offsetWidth; caja.classList.add('entra');
      antes = e.actual;
    }
    const p = t.pistas[e.actual];
    caja.replaceChildren(
      el('p', { class: 'de' }, fmt(T.pista, { n: e.actual + 1, t: t.pistas.length })),
      el('p', { class: 'palabra' }, p.pista, ' · ', el('b', {}, String(p.n))),
      el('p', { class: 'falta' }, e.faltan === 1 ? T.faltaUna : fmt(T.faltan, { n: e.faltan })));
    botones.replaceChildren(el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-pasar', onClick: () => { SFX.tap(); P.jugadas.push({ pasar: true }); decir('', ''); dibujar(); } },
      e.actual === t.pistas.length - 1 ? T.terminar : T.pasar));
  };
  const tocar = i => {
    const e0 = estado(t, P.jugadas);
    if (e0.fin || e0.tocadas.has(i)) return;
    const c = t.cartas[i];
    P.jugadas.push({ i });
    cartas[i].classList.add('volteo');
    if (c.tipo === 'agente' && c.p === e0.actual) { SFX.letterHit(); vibrate(20); decir('bien', T.bien); }
    else if (c.tipo === 'agente') { SFX.letterHit(); vibrate(20); decir('otra', T.otra); }
    else if (c.tipo === 'neutral') { SFX.letterMiss(); vibrate([30, 30]); decir('mal', T.neutral); }
    else { SFX.error(); vibrate([60, 40, 60]); decir('mal', T.asesino); }
    // Si la pista se cortó o se completó, el cambio se ve un momento antes de la siguiente
    const e1 = estado(t, P.jugadas);
    if (e1.actual !== e0.actual) { cartas.forEach(b => { b.disabled = true; }); setTimeout(dibujar, QUIETO ? 0 : 900); }
    else dibujar();
  };
  vista.replaceChildren(tituloJuego(), caja, aviso, el('div', { class: 'tablero', id: 'tablero' }, ...cartas), botones);
  dibujar();
  pieComentario('juego');
}

function resultado() {
  const { t } = P;
  const e = estado(t, P.jugadas);
  const s = puntaje(e), ms = Date.now() - P.desde;
  trackFinish({ detalle: `${s}/100 · ${e.encontrados}/${AGENTES} agentes · ${e.neutrales} neutrales${e.asesino ? ' · asesino' : ''} · ${mmss(ms)}` });
  SFX.win();
  if (!QUIETO && s >= 70) confetti({ count: 160, duration: 2400 });
  pie.replaceChildren();
  const lineas = [fmt(T.desglose[0], { n: e.encontrados, t: AGENTES, pts: Math.round(100 * e.encontrados / AGENTES) })];
  if (e.neutrales) lineas.push(fmt(T.desglose[1], { n: e.neutrales, pts: RESTA_NEUTRAL * e.neutrales }));
  if (e.asesino) lineas.push(fmt(T.desglose[2], { pts: RESTA_ASESINO }));
  // El tablero entero, con lo que era cada carta
  const tablero = el('div', { class: 'tablero', id: 'tablero-fin' }, ...t.cartas.map((c, i) => el('div', {
    class: `carta ${c.tipo === 'agente' ? 'agente' : c.tipo}${e.tocadas.has(i) ? '' : ' sin-tocar'}`,
  }, c.tipo === 'agente' ? `${c.w} · ${t.pistas[c.p].pista}` : c.tipo === 'asesino' ? `💀 ${c.w}` : c.w)));
  vista.replaceChildren(el('div', { class: 'resultado' },
    el('div', { class: 'trofeo' }, e.asesino ? '💀' : s >= 70 ? '🏆' : '🕵️'),
    el('h2', { class: 'display display--lg', style: 'margin:0' }, s >= 70 ? T.fin : T.finMal),
    el('div', { class: 'score-big', id: 'puntaje' }, `${s}/100`),
    el('ul', { class: 'desglose muted' }, ...lineas.map(x => el('li', {}, x))),
    el('p', { class: 'lead', style: 'margin:0' }, fmt(T.total, { s, t: mmss(ms) })),
    el('div', { class: 'tarjeta', 'aria-hidden': 'true' }, tarjeta(t, e)),
    el('p', { class: 'muted', style: 'margin:0' }, `${T.pistasEran}: ${t.pistas.map(p => p.pista).join(' · ')}`),
    tablero,
    botonResultadoSolo({ C: COMMON.es, emoji: '🕵️', juego: T.nombre, puntaje: `${s}/100`, tiempo: mmss(ms), tarjeta: tarjeta(t, e), url: `${SITIO}labs/agents/${SEMILLA_URL ? `?seed=${encodeURIComponent(SEMILLA_URL)}` : ''}`, alTocar: () => SFX.tap() }),
    el('a', { class: 'btn btn--yellow', id: 'btn-otro', href: `?seed=${Math.random().toString(36).slice(2, 8)}` }, T.otraVez),
    SEMILLA_URL ? el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-de-hoy', href: location.pathname }, T.deHoy) : null,
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio),
    credito(),
    // El comentario va abierto y al final de todo (D-265, D-268)
    formularioComentario({ T: T.comentario, contexto: contexto('resultado') })));
  scrollTo(0, 0);
}

document.getElementById('sound-slot').append(soundToggle());
initSound();
sparkles();
portada();
window.__agentes = { P, estado: () => (P.t ? estado(P.t, P.jugadas) : null) };
