/**
 * Uno al día en pantalla (D-230): el botón de la portada, el dado que revela el juego de hoy y la
 * tarjeta que va bajo el resultado. La lógica y la memoria están en `uno-al-dia.js`; la página
 * con todo lo acumulado, en `/today/`. Los textos van en `COMMON[lang].uad` (i18n.js).
 */
import { el } from './ui.js';
import { COMMON, SITIO, withLang } from './i18n.js';
import { SUELTOS, PORTADA } from './games.js';
import { tirar, TEXTOS as AZAR } from './azar.js';
import { botonCompartir, cabecera, laminaResultado, nombreArchivo } from './compartir.js';
import { JUEGOS_DIA, estado, rutaDel, numeroDel, racha, leer } from './uno-al-dia.js';

export const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const textos = lang => (COMMON[lang] || COMMON.es);
const SLUGS = Object.fromEntries(SUELTOS.map(g => [g.id, g.slug]));
/** Dónde se juega hoy, desde la raíz del sitio. */
export const rutaHoy = id => rutaDel(id, SLUGS);
/** El link de Uno al día que se comparte. */
export const URL_HOY = `${SITIO}today/`;

/** "🔥 Racha: 6 días" (o "1 día"). */
export const textoRacha = (n, lang) => (n === 1 ? textos(lang).uad.racha1 : fmt(textos(lang).uad.racha, { n }));

/**
 * Los juegos del dado, con su nombre en cada idioma. El nombre está en las reglas de La Copa, que
 * pesan: se cargan recién al tirar, no al dibujar la portada.
 */
async function caras() {
  const { juegosCopa, LOCALES } = await import('../../cup/rules.js');
  const por = Object.fromEntries(Object.keys(LOCALES).map(l => [l, juegosCopa(l)]));
  return JUEGOS_DIA.map(j => ({ id: j.id, emoji: j.emoji, name: Object.fromEntries(Object.keys(por).map(l => [l, por[l][j.id].nombre])) }));
}

/**
 * Tira el dado del día: rueda igual que Juego al azar, cae siempre en el juego de hoy (decisión
 * del dueño) y lo abre. `raiz` es lo que lleva de la página a la raíz del sitio ('' o '../').
 */
export async function tirarHoy({ lang, raiz = '' }) {
  const e = estado();
  if (!e.juego) return;
  const pool = await caras();
  const T = textos(lang).uad;
  tirar(pool, {
    lang, T: { boton: T.nombre, tocó: fmt(T.tocó, { n: e.numero }) },
    elegido: pool.find(g => g.id === e.juego), destino: raiz + rutaHoy(e.juego),
  });
}

/**
 * El botón de la portada, al lado de Juego al azar: una ficha de dos líneas, arriba "📅 Uno al
 * día" y abajo su estado (🔥 racha y "Jugar el de hoy", o "✅ Listo"). Mientras no juegue el de
 * hoy, un punto brilla. Si ya jugó, abre su página en vez del dado.
 */
/** Lo que dice el acceso según el día: si ya jugó, y la segunda línea ("🔥 1 · Jugar el de hoy" o "✅ Listo · 🔥 1"). */
function estadoAcceso(lang, raiz, alTocar) {
  const T = textos(lang).uad;
  const e = estado();
  const hecho = !!e.dia;
  const linea2 = hecho
    ? `✅ ${T.listo}${e.racha ? ` · 🔥 ${e.racha}` : ''}`
    : `${e.racha ? `🔥 ${e.racha} · ` : ''}${T.jugar}`;
  const abrir = () => { alTocar?.(); if (hecho) location.href = `${raiz}today/`; else tirarHoy({ lang, raiz }); };
  return { T, hecho, linea2, abrir, aria: hecho ? T.ariaListo : T.aria };
}

export function botonUnoAlDia({ lang, raiz = '', alTocar }) {
  const { T, hecho, linea2, abrir, aria } = estadoAcceso(lang, raiz, alTocar);
  return el('button', { type: 'button', class: 'btn-uad' + (hecho ? ' hecho' : ''), id: 'btn-uno-al-dia', 'aria-label': aria, onClick: abrir },
    el('span', { class: 'btn-uad-titulo' }, el('span', { 'aria-hidden': 'true' }, '📅'), el('span', {}, T.nombre)),
    el('span', { class: 'btn-uad-estado' }, linea2),
    hecho ? null : el('span', { class: 'btn-uad-punto', 'aria-hidden': 'true' }));
}

/**
 * La otra forma de ponerlo en la portada (a prueba, la elige el dueño): una tarjeta de media fila
 * al lado de La Copa, como acceso de más jerarquía que los juegos. Misma lógica que el botón.
 */
export function tarjetaUnoAlDia({ lang, raiz = '', alTocar }) {
  const { T, hecho, linea2, abrir, aria } = estadoAcceso(lang, raiz, alTocar);
  return el('button', { type: 'button', class: 'game-card alta uad-card' + (hecho ? ' hecho' : ''), id: 'btn-uno-al-dia', 'aria-label': aria, onClick: abrir },
    el('div', { class: 'emoji' }, el('span', { 'aria-hidden': 'true' }, '📅')),
    el('div', { class: 'texto' }, el('h2', {}, el('span', {}, T.nombre)), el('div', { class: 'tag' }, T.sub)),
    el('div', { class: 'meta' }, el('span', { class: 'uad-card-estado' }, linea2)),
    hecho ? null : el('span', { class: 'btn-uad-punto', 'aria-hidden': 'true' }));
}

/** Tira el dado de Juego al azar con los juegos de la portada: "🎲 Jugar otro". */
export function jugarOtro({ lang, raiz }) {
  const pool = PORTADA.filter(g => g.available && !g.torneo);
  tirar(pool, { lang, base: raiz, T: AZAR[lang] || AZAR.es });
}

/**
 * El botón de compartir el resultado: la imagen de siempre pero sin el juego, y el texto con la
 * cabecera, la racha y el link (U-30, U-33). Ni el texto ni la imagen dicen qué juego tocó (#215).
 */
export function compartirHoy({ lang, fecha, dia, alTocar, mmss }) {
  const C = textos(lang);
  const titulo = fmt(C.uad.compartirTitulo, { n: numeroDel(fecha) });
  const cab = { emoji: '📅', titulo };
  const url = withLang(URL_HOY, lang);
  return botonCompartir({
    rotulo: C.shareResult, id: 'btn-compartir-uad', alTocar,
    avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
    armar: async () => ({
      titulo, url,
      texto: [cabecera(cab), textoRacha(racha(leer().dias, fecha), lang)].join('\n'),
      imagen: await laminaResultado({ cab, url, puntaje: fmt(C.uad.puntos, { s: dia.s }), detalle: dia.ms ? `⏱ ${mmss(dia.ms)}` : '', pie: C.shareSoloImage, archivo: nombreArchivo('uno-al-dia', String(numeroDel(fecha))) }),
    }),
  });
}

/**
 * La tarjeta bajo el resultado de un juego jugado como Uno al día: la racha, lo que cuenta de hoy
 * y qué hacer ahora (compartir, jugar otro, repetirlo o ver todo). `primera` dice si esta partida
 * fue el resultado del día o una práctica; `dia` es lo anotado para hoy.
 */
export function tarjetaResultado({ lang, fecha, primera, dia, raiz = '', alTocar, mmss }) {
  const T = textos(lang).uad;
  const n = racha(leer().dias, fecha);
  return el('div', { class: 'panel uad-tarjeta', id: 'uad-tarjeta' },
    el('p', { class: 'uad-racha' }, textoRacha(n, lang)),
    el('p', { class: 'muted', style: 'margin:0' }, fmt(T.vuelve, { n: n + 1 })),
    el('p', { style: 'margin:0' }, primera ? fmt(T.hoyPuntos, { s: dia.s }) : fmt(T.practica, { s: dia.s })),
    el('div', { class: 'uad-acciones' },
      compartirHoy({ lang, fecha, dia, alTocar, mmss }),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-uad-otro', onClick: () => { alTocar?.(); jugarOtro({ lang, raiz }); } }, T.jugarOtro)),
    el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-uad-todo', href: `${raiz}today/` }, T.verTodo),
    el('a', { class: 'link-btn', id: 'btn-uad-repetir', href: `${raiz}${rutaHoy(dia.j)}` }, T.repetir));
}
