/**
 * The "💬 Suggestions and comments" inbox (D-341, U-38): a quiet link at the end of the experience,
 * after the result and the main buttons, that unfolds the form in place. Never during a game, never
 * a popup. `enlaceBuzon` decides whether this ending gets it, from a rule kept on the device:
 *
 * - not during the first 2 games a new device plays;
 * - at most once per day;
 * - after the player sends something, it rests for 14 days.
 *
 * The form itself (buzon-form.js) loads only on tap. The home page footer has a link that is always
 * there (`abrirBuzon`). Messages go to `feedback/` as always (D-104, D-275, D-317), with `tipo`.
 */
import { el } from './ui.js';
import { COMMON, getLang } from './i18n.js';
import { tiene } from './parametros.js';

const CLAVE = 'juegos-de-salon:buzon';
export const PRIMERAS = 2;
export const DESCANSO_DIAS = 14;
const DIA_MS = 24 * 60 * 60 * 1000;

const dia = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const leer = almacen => { try { return JSON.parse(almacen?.getItem(CLAVE) || '{}') || {}; } catch (_) { return {}; } };
const guardar = (almacen, e) => { try { almacen?.setItem(CLAVE, JSON.stringify(e)); } catch (_) { /* no storage: nothing is remembered */ } };

/**
 * Counts one finished game and says whether its ending shows the link (and if so, remembers today).
 * Pure apart from the store, for the tests.
 */
export function tocaBuzon(almacen = globalThis.localStorage, ahora = Date.now()) {
  const e = leer(almacen);
  e.partidas = (e.partidas || 0) + 1;
  const hoy = dia(ahora);
  const toca = e.partidas > PRIMERAS && e.visto !== hoy && !(e.enviado && ahora - e.enviado < DESCANSO_DIAS * DIA_MS);
  if (toca) e.visto = hoy;
  guardar(almacen, e);
  return toca;
}

/** The player sent a message: the link rests for 14 days. */
export function buzonEnviado(almacen = globalThis.localStorage, ahora = Date.now()) {
  guardar(almacen, { ...leer(almacen), enviado: ahora });
}

const textos = () => (COMMON[getLang()] || COMMON.es).buzon;

/** What goes with the message, unseen: where it was written. */
function contexto(extra = {}) {
  const pantalla = document.querySelector('.screen.active')?.id || null;
  return {
    ...extra, idioma: document.documentElement.lang || null, url: location.pathname + location.search, pantalla,
    pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
  };
}

/** With `?test`, the message stays on the device (the e2e scripts read it) instead of going to Firebase. */
const PRUEBA_CLAVE = 'juegos-de-salon:buzon:prueba';
const enviarPrueba = async r => {
  const lista = JSON.parse(localStorage.getItem(PRUEBA_CLAVE) || '[]');
  lista.push({ ...r, at: Date.now() });
  localStorage.setItem(PRUEBA_CLAVE, JSON.stringify(lista));
};
const enviar = () => (tiene('test') ? enviarPrueba : undefined);

/**
 * The link for this ending, or null when the rule above says not today. Tapping it unfolds the form
 * in its place. `juego` is the game id; `contexto` adds what helps read the message (seed, score…).
 */
export function enlaceBuzon({ juego = null, contexto: extra = {}, almacen = globalThis.localStorage, ahora = Date.now() } = {}) {
  try {
    if (!tocaBuzon(almacen, ahora)) return null;
    const T = textos();
    const caja = el('div', { class: 'buzon-pie', id: 'buzon-pie' });
    const boton = el('button', {
      type: 'button', class: 'link-btn buzon-link', id: 'btn-buzon',
      onClick: async () => {
        const { formularioComentario } = await import('./buzon-form.js');
        const form = formularioComentario({ T, enviar: enviar(), contexto: contexto({ juego, ...extra }), alEnviar: () => buzonEnviado(almacen) });
        caja.replaceChildren(form);
        form.querySelector('textarea')?.focus();
      },
    }, T.abrir);
    caja.append(boton);
    return caja;
  } catch (_) { return null; /* the inbox never gets in the way of an ending */ }
}

/** One way to write per screen (U-1): where the inbox shows, La Copa's 🐞 report link steps aside. */
export const sinDoble = en => en.querySelectorAll('#btn-reporte').forEach(b => { b.hidden = true; });

let ultimo = -Infinity;
/**
 * Puts the link at the very end of `en` (the result screen), after everything else, replacing the
 * one a previous game left there. One ending is counted once: an ending that reaches here twice
 * (its ranking notice and its own result, or a redraw) within a few seconds is the same game.
 */
export function ponerBuzon(en, opciones = {}) {
  const ahora = opciones.ahora ?? Date.now();
  if (!en || ahora - ultimo < 3000) return null;
  ultimo = ahora;
  en.querySelector('#buzon-pie')?.remove();
  const caja = enlaceBuzon(opciones);
  if (caja) { en.append(caja); sinDoble(en); }
  return caja;
}

/** The fixed place (the home footer): opens the form in its overlay, whenever. */
export async function abrirBuzon(extra = {}) {
  const { abrirComentario } = await import('./buzon-form.js');
  abrirComentario({ T: textos(), enviar: enviar(), contexto: contexto(extra), alEnviar: () => buzonEnviado() });
}
