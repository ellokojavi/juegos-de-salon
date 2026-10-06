/**
 * Los avisos de La Copa en la pantalla (D-223): la campana de la copa, la tarjeta que los ofrece
 * y las hojas (agregar a inicio en iPhone, abrir en Safari, avisos bloqueados y los ajustes).
 * La lógica del navegador está en assets/js/push.js; el diseño, en docs/PWA-NOTIFICACIONES.md.
 *
 * Reglas de la experiencia:
 * - El permiso se pide solo después de un toque en "Avisarme" (el "No" del sistema es definitivo).
 * - La tarjeta sale una vez por copa; "Ahora no" la apaga en esa copa. La campana queda siempre.
 * - Si el celular ya tiene avisos en otra copa, la copa nueva los trae puestos, con "Cambiar".
 * - Nada se ofrece si el celular no puede (camino 'no') o fuera del laboratorio (AVISOS_EN_LABS).
 */
import { el, $ } from '../assets/js/ui.js';
import {
  avisosVisibles, celular, camino as caminoDe, permiso, pedirPermiso, suscribir, suscripcionActual, subIdDe,
  paraGuardar, zonaHoraria, avisoDePrueba, anular,
} from '../assets/js/push.js';

/** "Toca **Compartir**" → nodos con negritas. */
const conNegritas = texto => String(texto).split(/\*\*(.+?)\*\*/).map((t, i) => (i % 2 ? el('b', {}, t) : t));

/** La marca del celular que comparte avisos entre copas: si ya los activó en una, las demás los traen. */
const CELULAR = 'juegos-de-salon:avisos:celular';
const leerCelular = () => { try { return localStorage.getItem(CELULAR) || ''; } catch (_) { return ''; } };
const guardarCelular = subId => { try { localStorage.setItem(CELULAR, subId); } catch (_) { /* nada */ } };

/**
 * @param {object} o
 * @param {object} o.T        los textos de La Copa en el idioma de quien mira
 * @param {string} o.lang     ese idioma (va con la suscripción: el aviso llega en él)
 * @param {object} o.cuenta   lo que La Copa recuerda en el celular (cuenta.js)
 * @param {() => object} o.store   el almacén (Firebase o el de prueba)
 * @param {() => {code, pid, nombre, url}} o.copa   la copa abierta y quién es este celular en ella
 * @param {() => void} o.redibujar   vuelve a dibujar la pantalla cuando cambia el estado
 * @param {(t: string) => void} o.toast
 * @param {() => void} [o.tap]  el sonido del toque
 */
export function crearAvisos({ T, lang, cuenta, store, copa, redibujar, toast, tap = () => {}, fmt }) {
  const cel = celular();
  const camino = caminoDe(cel);
  const disponible = () => avisosVisibles() && camino !== 'no';
  const estado = () => {
    const { code } = copa();
    const guardado = cuenta.avisos.leer(code);
    if (camino === 'push' && permiso() === 'denied') return 'bloqueado';
    if (guardado?.subId && permiso() === 'granted') return 'activo';
    return 'apagado';
  };
  const enCurso = new Set(), revisadas = new Set();
  const titulo = () => `🏆 ${fmt(T.shareHead, { copa: copa().nombre })}`;

  /* ---------------- Hojas ---------------- */

  let hojaAbierta = null;
  function hoja(id, ...hijos) {
    cerrar();
    const fondo = el('div', { class: 'hoja-fondo', onClick: cerrar });
    const panel = el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', id }, el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }), ...hijos);
    hojaAbierta = el('div', { class: 'hoja-capa' }, fondo, panel);
    document.body.append(hojaAbierta);
    panel.querySelector('button')?.focus();
    return panel;
  }
  function cerrar() { hojaAbierta?.remove(); hojaAbierta = null; }
  const botonCerrar = (texto = T.avClose) => el('button', { class: 'btn btn--ghost', onClick: () => { tap(); cerrar(); } }, texto);

  function hojaInstalar() {
    // La app instalada empieza sin nada de Safari. iOS la abre en la portada (el start_url, D-226), así
    // que los pasos dan el código; la dirección igual lleva la copa y el jugador (no el PIN), por si otra versión la respeta
    try {
      const u = new URL(location.href);
      u.searchParams.set('app', copa().pid);
      history.replaceState(history.state, '', u.href);
    } catch (_) { /* queda la dirección de siempre */ }
    const paso = (n, texto, icono, nota) => el('div', { class: 'hoja-paso' },
      el('span', { class: 'hoja-num' }, String(n)),
      el('div', {}, el('p', {}, ...conNegritas(texto)), nota ? el('small', { class: 'muted' }, nota) : null),
      el('span', { class: 'hoja-icono', 'aria-hidden': 'true' }, icono));
    const despues = el('p', { class: 'muted', hidden: true }, T.avInstalledNext);
    hoja('hoja-instalar',
      el('h2', {}, T.avInstallTitle),
      el('p', { class: 'muted' }, T.avInstallLead),
      paso(1, T.avStep1, '⬆️', T.avStep1b),
      paso(2, T.avStep2, '➕'),
      paso(3, fmt(T.avStep3, { code: copa().code }), '🎲'),
      despues,
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn btn--yellow', id: 'btn-ya-agregue', onClick: () => { tap(); despues.hidden = false; } }, T.avInstalled),
        botonCerrar()));
  }

  function hojaOtraApp() {
    const url = copa().url;
    hoja('hoja-otra-app',
      el('h2', {}, T.avOtherTitle),
      el('p', { class: 'muted' }, ...conNegritas(T.avOtherLead)),
      el('p', { class: 'hoja-link' }, url.replace(/^https?:\/\//, '')),
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn btn--yellow', onClick: async () => {
          tap();
          try { await navigator.clipboard.writeText(url); toast(T.avCopied); } catch (_) { toast(url); }
        } }, T.avCopy),
        botonCerrar()));
  }

  function hojaBloqueados() {
    const android = /Android/.test(navigator.userAgent);
    hoja('hoja-bloqueados',
      el('h2', {}, T.avBlockedTitle),
      el('p', { class: 'muted' }, T.avBlockedLead),
      el('p', { class: 'hoja-caja' }, ...conNegritas(cel.ios ? T.avBlockedIos : android ? T.avBlockedAndroid : T.avBlockedOther)),
      botonCerrar(T.avOk));
  }

  function hojaAjustes() {
    const { code } = copa();
    const g = cuenta.avisos.leer(code) || {};
    const interruptor = (id, titulo2, sub, on) => {
      const input = el('input', { type: 'checkbox', role: 'switch', id, checked: on ? true : null });
      input.checked = on;
      input.addEventListener('change', () => { tap(); guardarPrefs(); });
      return { input, nodo: el('label', { class: 'hoja-switch', for: id }, el('span', {}, el('b', {}, titulo2), el('small', { class: 'muted' }, sub)), input) };
    };
    const dia = interruptor('av-dia', T.avSetDay, T.avSetDaySub, g.dia !== false);
    const plazo = interruptor('av-plazo', T.avSetDue, T.avSetDueSub, g.plazo !== false);
    async function guardarPrefs() {
      try { await activar({ dia: dia.input.checked, plazo: plazo.input.checked, silencioso: true }); } catch (_) { toast(T.avError); }
    }
    hoja('hoja-ajustes',
      el('h2', {}, T.avSetTitle),
      dia.nodo, plazo.nodo,
      el('p', { class: 'muted' }, T.avSetNote),
      el('button', { class: 'btn btn--ghost', id: 'btn-probar-avisos', onClick: async () => {
        tap();
        try { await avisoDePrueba({ titulo: titulo(), texto: T.avTestBody, url: copa().url }); } catch (_) { toast(T.avError); }
      } }, T.avTest),
      el('button', { class: 'btn btn--ghost btn--peligro', id: 'btn-silenciar', onClick: async () => { tap(); await silenciar(); cerrar(); } }, T.avMute),
      botonCerrar());
  }

  /* ---------------- Acciones ---------------- */

  /** Suscribe este celular y anota la copa. Lanza si algo falla. */
  async function activar({ dia = true, plazo = true, silencioso = false } = {}) {
    const { code, pid } = copa();
    let sub = await suscribir();
    let subId = await subIdDe(sub.endpoint);
    const guardar = () => store().guardarAvisos(code, pid, subId, paraGuardar(sub, { lang, tz: zonaHoraria() }), { dia, plazo });
    try { await guardar(); } catch (e) {
      // La suscripción ya está en la base a nombre de otra identidad de este mismo celular (Firebase
      // le dio un uid anónimo nuevo): las reglas no dejan reescribirla. Se anula y se pide otra.
      if (e?.code !== 'permiso') throw e;
      await anular();
      sub = await suscribir();
      subId = await subIdDe(sub.endpoint);
      await guardar();
    }
    cuenta.avisos.guardar(code, { subId, dia, plazo });
    guardarCelular(subId);
    if (!silencioso) {
      try { await avisoDePrueba({ titulo: titulo(), texto: T.avReady, url: copa().url }); } catch (_) { toast(T.avReady); }
    }
  }

  async function silenciar() {
    const { code, pid } = copa();
    const g = cuenta.avisos.leer(code);
    if (g?.subId) { try { await store().quitarAvisos(code, pid, g.subId); } catch (_) { /* queda anotado en el celular igual */ } }
    cuenta.avisos.guardar(code, { no: true });
    toast(T.avMuted);
    redibujar();
  }

  /** El toque en "Avisarme" o en la campana apagada: el camino que le toca a este celular. */
  async function pedir() {
    tap();
    if (camino === 'instalar') return hojaInstalar();
    if (camino === 'otra-app') return hojaOtraApp();
    if (permiso() === 'denied') return hojaBloqueados();
    const p = permiso() === 'granted' ? 'granted' : await pedirPermiso();
    if (p === 'denied') { redibujar(); return hojaBloqueados(); }
    if (p !== 'granted') return; // cerró el diálogo sin elegir: se puede volver a preguntar
    try { await activar(); } catch (_) { toast(T.avError); }
    redibujar();
  }

  /* ---------------- Lo que se ve ---------------- */

  /** La campana de la cabecera de la copa, con su estado. */
  function boton() {
    if (!disponible()) return null;
    const e = estado();
    const [texto, clase, accion] = {
      apagado: [T.avOff, 'btn--ghost', pedir],
      activo: [T.avOn, 'btn--ghost aviso-activo', () => { tap(); hojaAjustes(); }],
      bloqueado: [T.avBlocked, 'btn--ghost aviso-bloqueado', () => { tap(); hojaBloqueados(); }],
    }[e];
    return el('button', { class: `btn ${clase} btn--sm`, id: 'btn-avisos', 'data-estado': e, onClick: accion }, texto);
  }

  /**
   * La tarjeta que ofrece los avisos: después de jugar el día (`dia`), antes de que parta la copa
   * (`fecha`), o al abrir la copa desde la app instalada (`app`). Una sola vez por copa.
   */
  function tarjeta({ dia = null, fecha = null, app = false } = {}) {
    if (!disponible()) return null;
    const { code } = copa();
    const g = cuenta.avisos.leer(code);
    if (g?.no || estado() !== 'apagado') return null;
    // El celular ya dijo que sí en otra copa: esta los trae puestos, sin volver a preguntar
    if (leerCelular() && permiso() === 'granted' && camino === 'push') {
      const linea = el('p', { class: 'aviso-auto', id: 'aviso-auto' }, T.avAuto, ' ',
        el('button', { class: 'linkish', onClick: () => { tap(); hojaAjustes(); } }, T.avChange));
      // La copa se redibuja seguido (cada minuto, y con cada jugada de otros): se suscribe una vez
      if (!enCurso.has(code)) {
        enCurso.add(code);
        activar({ silencioso: true }).catch(() => linea.remove()).finally(() => enCurso.delete(code));
      }
      return linea;
    }
    const pregunta = app ? T.avOfferApp : fecha ? fmt(T.avOfferStart, { fecha }) : fmt(T.avOfferDay, { d: dia });
    const caja = el('div', { class: 'panel aviso-oferta', id: 'aviso-oferta' },
      el('p', { class: 'lead' }, pregunta),
      el('p', { class: 'muted' }, app ? T.avOfferAppSub : T.avOfferSub),
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn btn--yellow', id: 'btn-avisarme', onClick: pedir }, T.avYes),
        el('button', { class: 'btn btn--ghost', id: 'btn-ahora-no', onClick: () => { tap(); cuenta.avisos.guardar(code, { no: true }); caja.remove(); redibujar(); } }, T.avNo)));
    return caja;
  }

  /** Al abrir la copa: si el permiso se quitó desde los ajustes, la copa deja de contar como activa. */
  async function revisar() {
    if (!disponible()) return;
    const { code } = copa();
    if (revisadas.has(code)) return;
    revisadas.add(code);
    const g = cuenta.avisos.leer(code);
    if (!g?.subId) return;
    const actual = await suscripcionActual();
    if (permiso() !== 'granted' || !actual) { cuenta.avisos.borrar(code); redibujar(); return; }
    // El navegador renovó la suscripción: se vuelve a guardar con la misma elección
    if (await subIdDe(actual.endpoint) !== g.subId) { try { await activar({ dia: g.dia, plazo: g.plazo, silencioso: true }); } catch (_) { /* la próxima vez */ } }
  }

  return { disponible, boton, tarjeta, revisar, camino, cerrar, abiertaDesdeApp: () => cel.instalada && (cel.ios || !!new URLSearchParams(location.search).get('app')) };
}

/** Para las pruebas: qué hoja está abierta. */
export const hojaVisible = () => $('.hoja')?.id || null;
