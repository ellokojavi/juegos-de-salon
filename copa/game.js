/**
 * La Copa — pantallas. Lo único que toca el DOM (C-2).
 *
 * Una copa es un torneo de 3 o 7 días: cada día un minijuego igual para todos que se juega
 * una vez (ver docs/juegos/copa.md). Las reglas del torneo viven en engine.js; los datos en
 * el almacén (Firebase, o el de prueba con `?prueba`); cada minijuego se dibuja con su
 * módulo de juegos/ui-*.js.
 *
 * URL: /copa/ (portada) · /copa/?K7Q2X (una copa) · /copa/?K7Q2X&prueba (sin Firebase).
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti, shareLink, canShare } from '../assets/js/ui.js';
import { applyStatic } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { trackStart, versionOf } from '../assets/js/transport/stats.js';
import {
  CALENDARIOS, MAX_JUGADORES, COPA_MAX, aliasLimpio, esAlias, CODIGO, esCodigo, codigoAlAzar, pidAlAzar, limpiarNombre, claveNombre, esPin, hashPin,
  fechaEn, sumarDias, nuevaMeta, diaActual, abierto, cerrado, terminada, inscripcionAbierta, estadoDia, comodinDe, moverInicio, sinEmpezar, pasarDia, MAX_DIAS_INICIO, faltaGente,
  medianoche, menosJuegos, provisoria, ultimoDiaVisto, puedeComodin, multiplicador, posicionesDelDia, tabla, faltan, medallas, evolucion, visibleDia, reloj, mmss, juegoDelDia, esFinal, activos, ZONA,
} from './engine.js';
import { GAME_ID, LOCALES, MINIJUEGOS, RONDAS_FINAL } from './rules.js';
import { createCuenta } from './cuenta.js';
import { JUEGOS } from './juegos/index.js';
import { desglose } from './desglose.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

const T = LOCALES.es;
const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */

const busqueda = location.search.slice(1).split('&').filter(Boolean);
const PRUEBA = busqueda.includes('prueba');
// La Copa vive en el laboratorio (D-101): desde /labs/ se llega con ?labs, que ofrece también
// la Copa de 3 días (D-100). ?tres se mantiene por los links que ya circulan.
const LABS = busqueda.includes('labs');
const TRES = PRUEBA || LABS || busqueda.includes('tres');
const PRACTICA = new URLSearchParams(location.search).get('practica');
const SEMILLA = (new URLSearchParams(location.search).get('semilla') || '').toUpperCase();
// Las demos del laboratorio (D-110): solo en el modo de prueba, con el almacén local
const DEMO = PRUEBA ? new URLSearchParams(location.search).get('demo') : null;
const codigoUrl = (busqueda.find(x => CODIGO.test(x.toUpperCase()) && x.length === 5) || new URLSearchParams(location.search).get('c') || '').toUpperCase();
/** Palabras de la URL que no pueden ser el link de una copa. */
const RESERVADAS = ['prueba', 'labs', 'tres', 'practica', 'demo', 'semilla', 'copa'];
// Un link propio: la palabra de la URL que no es un código ni un parámetro (D-121)
const aliasUrl = busqueda.filter(y => !y.includes('=') && !(CODIGO.test(y.toUpperCase()) && y.length === 5))
  .map(y => aliasLimpio(decodeURIComponent(y))).find(a => esAlias(a) && !RESERVADAS.includes(a)) || '';

const cuenta = createCuenta({ prueba: PRUEBA });
let store = null;

async function abrirStore() {
  if (store) return store;
  store = PRUEBA
    ? (await import('./store-local.js')).createLocalStore()
    : (await import('./store-firebase.js')).createFirebaseStore();
  return store;
}

/** Estado de la pantalla: la copa abierta, quién soy en ella y qué se está mirando. */
const S = { code: null, L: null, yo: null, pantalla: null, off: null, juego: null, reloj: null, tic: null };

// El link de una copa: su nombre propio si lo tiene (?pirata), si no su código. Sin &labs: la
// copa ya sabe por dentro si es del laboratorio (D-121)
const enlace = code => (S.code === code && S.L?.meta?.alias) || code;
const urlCopa = code => `${location.origin}${location.pathname}?${enlace(code)}${PRUEBA ? '&prueba' : ''}`;
const urlPublica = code => (PRUEBA ? urlCopa(code) : `https://juegosdesalon.cl/copa/?${enlace(code)}`);

function mostrar(id) {
  S.pantalla = id;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${id}`));
  window.scrollTo(0, 0);
}

function errorDe(e) {
  const code = e?.code || e?.message;
  const mapa = {
    pin: 'errPinWrong', 'nombre-repetido': 'errRepetido', llena: 'errLlena', 'no-existe': 'errNoExiste',
    ventana: 'errVentana', 'ya-jugado': 'errYaJugado', comodin: 'errComodin', permiso: 'errPermiso',
    config: 'errConfig', offline: 'errOffline', busy: 'errOffline', cerrada: 'errCerrada',
    reporte: 'errReport', empezada: 'errEmpezada', terminada: 'errTerminada', faltan: 'errFaltan', alias: 'errAlias',
  };
  if (!mapa[code]) console.error(e);
  return T[mapa[code] || 'errNet'];
}

/** Un aviso de error que se queda hasta que se toca (C-8b). */
function avisoError(caja, texto) {
  caja.textContent = texto;
  caja.classList.remove('shake'); void caja.offsetWidth; caja.classList.add('shake');
  SFX.error(); vibrate([40, 40, 40]);
}

const fechaLarga = (ms, tz = ZONA) => new Intl.DateTimeFormat('es-CL', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ms)).replace(',', '');
/** El nombre de la zona horaria de una copa, para decirlo en palabras (D-113). */
const zonaTexto = tz => T.zones[tz] || fmt(T.zoneOther, { tz });
const fechaCorta = (ms, tz = ZONA) => new Intl.DateTimeFormat('es-CL', { timeZone: tz, weekday: 'short', day: 'numeric' }).format(new Date(ms));

function faltaPara(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h} h ${m % 60} min` : `${Math.floor(h / 24)} días`;
}

/* ------------------------------------------------------------------ */
/* Portada                                                             */
/* ------------------------------------------------------------------ */

function portada() {
  mostrar('intro');
  const body = $('#intro-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const input = el('input', { class: 'code', maxlength: '5', placeholder: T.codePlaceholder, autocomplete: 'off', autocapitalize: 'characters', 'aria-label': T.codeLabel });
  const ir = () => {
    const c = input.value.trim().toUpperCase();
    if (!esCodigo(c)) { avisoError(err, T.errCodigo); return; }
    location.search = `?${c}${PRUEBA ? '&prueba' : ''}${LABS ? '&labs' : ''}`;
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') ir(); });

  const mias = cuenta.mias();
  poner(body, 
    el('button', { class: 'btn btn--yellow', id: 'btn-crear', onClick: () => { SFX.tap(); crearCopa(); } }, T.create),
    mias.length ? el('div', { class: 'panel' },
      el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.mine),
      el('div', { class: 'mias' }, mias.map(c => el('a', { class: 'mia', href: urlCopa(c.code) },
        el('b', {}, c.copa || c.code), el('small', {}, `${c.nombre} · ${c.code}`), el('span', { class: 'go' }, '›'))))) : null,
    el('div', { class: 'panel' },
      el('div', { class: 'field' }, el('label', {}, T.haveCode), input),
      el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%', onClick: ir }, T.go),
      err),
    el('details', { class: 'panel' },
      el('summary', {}, T.howTitle),
      el('ol', { class: 'como' }, T.howItems.map(x => el('li', {}, x)))),
  );
}

/* ------------------------------------------------------------------ */
/* Formularios de cuenta                                               */
/* ------------------------------------------------------------------ */

/**
 * Un campo con su etiqueta. Si tiene largo máximo y `contador`, muestra cuántos caracteres van
 * ("24 / 40") para que el límite se vea antes de chocar con él (D-119).
 */
function campo(label, attrs = {}, { contador = false } = {}) {
  const input = el('input', { autocomplete: 'off', ...attrs });
  const max = Number(attrs.maxlength) || 0;
  const cuenta = contador && max ? el('small', { class: 'contador muted', 'aria-live': 'polite' }) : null;
  const pintar = () => { if (!cuenta) return; const n = input.value.length; cuenta.textContent = `${n} / ${max}`; cuenta.classList.toggle('lleno', n >= max); };
  input.addEventListener('input', pintar);
  pintar();
  return { input, nodo: el('div', { class: 'field' }, el('label', {}, label), input, cuenta) };
}
const campoPin = label => campo(label, { inputmode: 'numeric', pattern: '[0-9]*', maxlength: '4', type: 'password', class: 'pin' });

/** Un grupo de opciones sin nada elegido de entrada (C-8, D-38). */
function opciones(items, onChange) {
  let valor = null;
  const botones = items.map(it => el('button', {
    type: 'button', class: 'opcion', 'aria-pressed': 'false',
    onClick: () => {
      SFX.tap();
      valor = it.valor;
      botones.forEach((b, i) => { const on = items[i].valor === valor; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      onChange?.(valor);
    },
  }, el('b', {}, it.titulo), it.sub ? el('small', {}, it.sub) : null));
  return { nodo: el('div', { class: 'opciones' }, botones), get valor() { return valor; } };
}

/** Un selector de fecha, de hoy a 30 días más (D-115). Parte oculto. */
function campoFecha(hoy) {
  const max = sumarDias(hoy, MAX_DIAS_INICIO);
  const input = el('input', { type: 'date', class: 'fecha', min: hoy, max, value: sumarDias(hoy, 2), 'aria-label': T.startOther });
  const nodo = el('div', { class: 'field fecha-campo', hidden: true }, input);
  return { nodo, input, valida: () => /^\d{4}-\d{2}-\d{2}$/.test(input.value) && input.value >= hoy && input.value <= max };
}

function crearCopa() {
  mostrar('crear');
  const body = $('#crear-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const nombre = campo(T.fCopa, { placeholder: T.fCopaPh, maxlength: String(COPA_MAX) }, { contador: true });
  // La Copa de 3 días es solo para probar con amigos (D-100): se ofrece con ?tres en la URL
  // o en el modo de prueba, nunca en la portada.
  const modo = opciones([
    TRES ? { valor: 3, titulo: T.mode3, sub: `${T.mode3Sub} ${CALENDARIOS[3].map(j => MINIJUEGOS[j].emoji).join(' ')}` } : null,
    { valor: 7, titulo: T.mode7, sub: `${T.mode7Sub} ${CALENDARIOS[7].map(j => MINIJUEGOS[j].emoji).join(' ')}` },
  ].filter(Boolean));
  // Hoy, mañana u otra fecha de un calendario, hasta 30 días desde hoy (D-115)
  const hoyCrear = fechaEn(Date.now(), ZONA);
  const otraFecha = campoFecha(hoyCrear);
  const inicio = opciones([{ valor: 0, titulo: T.startToday }, { valor: 1, titulo: T.startTomorrow }, { valor: 'otra', titulo: T.startOther }],
    v => { otraFecha.nodo.hidden = v !== 'otra'; if (v === 'otra') otraFecha.input.focus(); });
  inicio.nodo.classList.add('tres');
  const yo = campo(T.fYou, { placeholder: T.fYouPh, maxlength: '20', value: cuenta.nombre.get() }, { contador: true });
  const pin1 = campoPin(T.fPin), pin2 = campoPin(T.fPin2);
  const boton = el('button', { class: 'btn btn--yellow', id: 'btn-crear-go' }, T.createGo);
  // El link propio, opcional (D-121): se ve cómo queda y si está libre mientras se escribe
  const link = campo(T.fLink, { placeholder: T.fLinkPh, maxlength: '20', id: 'crear-link', autocapitalize: 'none', spellcheck: 'false' });
  const linkEstado = el('small', { class: 'muted link-estado', id: 'link-estado', 'aria-live': 'polite' }, T.fLinkHint);
  link.nodo.append(linkEstado);
  let linkTimer = null, linkLibre = null;
  const revisarLink = async () => {
    const a = aliasLimpio(link.input.value);
    linkLibre = null;
    if (!link.input.value.trim()) { linkEstado.textContent = T.fLinkHint; linkEstado.className = 'muted link-estado'; return; }
    const url = `juegosdesalon.cl/copa/?${a}`;
    if (!esAlias(a) || RESERVADAS.includes(a)) { linkEstado.textContent = fmt(T.fLinkBad, { url }); linkEstado.className = 'link-estado mal'; return; }
    linkEstado.textContent = fmt(T.fLinkChecking, { url }); linkEstado.className = 'muted link-estado';
    try {
      const st = await abrirStore(); await st.listo();
      const x = await st.alias(a);
      if (aliasLimpio(link.input.value) !== a) return;
      linkLibre = !(x && x.hasta > st.now());
      linkEstado.textContent = fmt(linkLibre ? T.fLinkFree : T.fLinkTaken, { url });
      linkEstado.className = 'link-estado ' + (linkLibre ? 'ok' : 'mal');
    } catch (_) { linkEstado.textContent = fmt(T.fLinkChecking, { url }); }
  };
  link.input.addEventListener('input', () => { clearTimeout(linkTimer); linkTimer = setTimeout(revisarLink, 350); });

  boton.addEventListener('click', async () => {
    SFX.tap();
    const n = limpiarNombre(nombre.input.value, COPA_MAX), quien = limpiarNombre(yo.input.value);
    if (!n) return avisoError(err, T.errCopa);
    if (!modo.valor) return avisoError(err, TRES ? T.errMode : T.errMode7);
    if (inicio.valor === null) return avisoError(err, T.errStart);
    if (inicio.valor === 'otra' && !otraFecha.valida()) return avisoError(err, fmt(T.errStartDate, { n: MAX_DIAS_INICIO }));
    if (!quien) return avisoError(err, T.errNombre);
    if (!esPin(pin1.input.value)) return avisoError(err, T.errPin);
    if (pin1.input.value !== pin2.input.value) return avisoError(err, T.errPin2);
    const alias = link.input.value.trim() ? aliasLimpio(link.input.value) : null;
    if (alias && (!esAlias(alias) || RESERVADAS.includes(alias))) return avisoError(err, fmt(T.fLinkBad, { url: `juegosdesalon.cl/copa/?${alias}` }));
    boton.disabled = true; boton.textContent = T.creating; err.textContent = '';
    try {
      const st = await abrirStore();
      await st.listo();
      let code = null;
      for (let i = 0; i < 8 && !code; i++) { const c = codigoAlAzar(); if (!(await st.existe(c))) code = c; }
      if (!code) throw Object.assign(new Error('busy'), { code: 'busy' });
      const pid = pidAlAzar();
      const now = st.now();
      if (alias) { const x = await st.alias(alias); if (x && x.hasta > now) throw Object.assign(new Error('alias'), { code: 'alias' }); }
      const fechaInicio = inicio.valor === 'otra' ? otraFecha.input.value : sumarDias(fechaEn(now, ZONA), inicio.valor);
      // Las copas del laboratorio (y las de prueba) llevan la marca que deja pasar de día (D-115)
      const meta = nuevaMeta({ nombre: n, dias: modo.valor, inicio: fechaInicio, tz: ZONA, admin: pid, creada: now, lab: LABS || PRUEBA, alias });
      await st.crear(code, meta, { pid, name: quien, at: now, pinHash: await hashPin(code, pid, pin1.input.value) });
      cuenta.nombre.set(quien);
      cuenta.recordar(code, pid, { nombre: quien, copa: n, fin: meta.end });
      history.replaceState(null, '', `${location.pathname}?${alias || code}${PRUEBA ? '&prueba' : ''}`);
      await abrirCopa(code, { recienCreada: true });
    } catch (e) {
      avisoError(err, errorDe(e));
      boton.disabled = false; boton.textContent = T.createGo;
    }
  });

  poner(body, 
    el('div', { class: 'panel' }, nombre.nodo,
      el('div', { class: 'field' }, el('label', {}, T.fMode), modo.nodo),
      el('div', { class: 'field' }, el('label', {}, T.fStart), inicio.nodo, otraFecha.nodo, el('small', { class: 'muted' }, fmt(T.startHint, { zona: zonaTexto(ZONA) })))),
    el('div', { class: 'panel' }, link.nodo),
    el('div', { class: 'panel' }, yo.nodo, pin1.nodo, pin2.nodo, el('small', { class: 'muted' }, T.pinHint)),
    err, boton,
    el('button', { class: 'btn btn--ghost btn--sm', onClick: () => portada() }, '‹ ' + T.menu.replace('‹ ', '')),
  );
}

/* ------------------------------------------------------------------ */
/* Abrir una copa                                                      */
/* ------------------------------------------------------------------ */

function espera(texto, { error = false, reintentar = null } = {}) {
  mostrar('espera');
  const body = $('#espera-body');
  body.innerHTML = '';
  poner(body, el('div', { class: error ? 'form-error' : 'waiting' }, texto));
  if (reintentar) poner(body, el('button', { class: 'btn btn--cyan', onClick: reintentar }, T.retry));
  if (error) poner(body, el('a', { class: 'btn btn--ghost btn--sm', href: location.pathname + (PRUEBA ? '?prueba' : '') }, T.menu));
}

async function abrirCopa(code, { recienCreada = false, pantalla = null } = {}) {
  S.code = code;
  espera('…');
  let st;
  try { st = await abrirStore(); await st.listo(); } catch (e) { espera(errorDe(e), { error: true, reintentar: () => location.reload() }); return; }
  if (S.off) S.off();
  let primera = true;
  S.off = st.escuchar(code, L => {
    const habia = !!S.L?.meta;
    S.L = L;
    if (!L || !L.meta) {
      // La borró su admin (D-117): quien la tenía abierta se entera, y este celular la olvida
      if (S.eliminando) return;
      if (habia) { cuenta.olvidar(code); espera(T.copaDeleted, { error: true }); return; }
      espera(T.errNoExiste, { error: true }); return;
    }
    if (primera) {
      primera = false;
      // Si la copa tiene link propio, la dirección lo muestra aunque se haya entrado por el código
      // (la lista de tus copas, un link viejo): así lo que se copie de la barra es el link bonito (D-121)
      if (L.meta.alias && !new URLSearchParams(location.search).has('demo')) {
        history.replaceState(null, '', `${location.pathname}?${L.meta.alias}${PRUEBA ? '&prueba' : ''}`);
      }
      const pid = cuenta.quien(code);
      if (pid && L.players?.[pid]) {
        S.yo = pid;
        cuenta.recordar(code, pid, { nombre: L.players[pid].name, copa: L.meta.name, fin: L.meta.end });
        // Recién creada, el admin parte en Administrar, con la guía de la primera vez (D-110)
        if (recienCreada) { S.bienvenida = true; admin(); } else if (pantalla === 'admin') admin(); else tablero();
      } else entrar();
      return;
    }
    // Lo que llega mientras se mira algo que depende de la copa, se redibuja
    if (S.pantalla === 'tablero') tablero();
    else if (S.pantalla === 'admin') admin();
    else if (S.pantalla === 'resultado' && S.verDia) resultado(S.verDia);
    else if (S.pantalla === 'entrar') entrar({ mantener: true });
  }, e => espera(errorDe(e), { error: true, reintentar: () => location.reload() }));
}

const L = () => S.L;
const ahora = () => store.now();
const nombreDe = pid => L().players?.[pid]?.name || '?';

/* ------------------------------------------------------------------ */
/* Entrar: inscribirse o sentarse                                      */
/* ------------------------------------------------------------------ */

let entrarModo = null;

function entrar({ mantener = false } = {}) {
  const { meta, players = {} } = L();
  const body = $('#entrar-body');
  // Si alguien está escribiendo, no se le borra el formulario por una actualización
  if (mantener && body.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  mostrar('entrar');
  body.innerHTML = '';
  const now = ahora();
  const d = diaActual(meta, now);
  const jug = activos(L());
  // "7 días · Parte el viernes 25 de septiembre · 3 jugadores inscritos" (D-120)
  const inscritos = fmt(jug.length === 1 ? T.signedUpOne : T.signedUp, { n: jug.length });
  const info = d === 0
    ? fmt(T.inviteInfo, { dias: meta.days, fecha: fechaLarga(meta.win[1].a, meta.tz), inscritos })
    : terminada(meta, now) ? fmt(T.inviteEnded, { dias: meta.days, inscritos })
    : fmt(T.inviteStarted, { dias: meta.days, d: Math.min(d, meta.days), n: meta.days, inscritos });
  const err = el('div', { class: 'form-error', role: 'alert' });
  const puedeEntrar = inscripcionAbierta(meta, now, L().closed) && jug.length < MAX_JUGADORES;

  const caja = el('div', { class: 'stack' });
  const nuevo = () => {
    entrarModo = 'nuevo';
    caja.innerHTML = '';
    const yo = campo(T.fYou, { placeholder: T.fYouPh, maxlength: '20', value: cuenta.nombre.get() }, { contador: true });
    const p1 = campoPin(T.fPin), p2 = campoPin(T.fPin2);
    const b = el('button', { class: 'btn btn--yellow', id: 'btn-inscribir' }, T.joinGo);
    b.addEventListener('click', async () => {
      SFX.tap();
      const n = limpiarNombre(yo.input.value);
      if (!n) return avisoError(err, T.errNombre);
      if (!esPin(p1.input.value)) return avisoError(err, T.errPin);
      if (p1.input.value !== p2.input.value) return avisoError(err, T.errPin2);
      // Un nombre que ya está: si el PIN es el suyo, cuenta como entrar, sin volver a escribirlo (D-120)
      const existente = Object.entries(L().players || {}).find(([, x]) => !x.out && claveNombre(x.name) === claveNombre(n));
      if (existente) {
        const [pid, x] = existente;
        b.disabled = true; b.textContent = T.joining;
        try {
          await store.sentarse(S.code, pid, await hashPin(S.code, pid, p1.input.value));
          cuenta.recordar(S.code, pid, { nombre: x.name, copa: meta.name, fin: meta.end });
          S.yo = pid;
          SFX.reveal(); toast(fmt(T.welcomeBack, { name: x.name }));
          tablero();
        } catch (e) {
          avisoError(err, e?.code === 'pin' ? fmt(T.errRepetidoPin, { name: x.name }) : errorDe(e));
          b.disabled = false; b.textContent = T.joinGo;
        }
        return;
      }
      if (Object.values(L().players || {}).some(p => claveNombre(p.name) === claveNombre(n))) return avisoError(err, T.errRepetido);
      b.disabled = true; b.textContent = T.joining;
      try {
        const pid = pidAlAzar();
        await store.inscribir(S.code, { pid, name: n, at: ahora(), pinHash: await hashPin(S.code, pid, p1.input.value) });
        cuenta.nombre.set(n);
        cuenta.recordar(S.code, pid, { nombre: n, copa: meta.name, fin: meta.end });
        S.yo = pid;
        SFX.reveal();
        tablero();
      } catch (e) { avisoError(err, errorDe(e)); b.disabled = false; b.textContent = T.joinGo; }
    });
    poner(caja, el('div', { class: 'panel' }, yo.nodo, p1.nodo, p2.nodo, el('small', { class: 'muted' }, T.pinHint)),
      d > 1 ? el('p', { class: 'muted center' }, T.lateJoin) : null, err, b);
  };
  const inscrito = () => {
    entrarModo = 'inscrito';
    caja.innerHTML = '';
    let elegido = null;
    const p = campoPin(T.fPin);
    const b = el('button', { class: 'btn btn--yellow', id: 'btn-sentarse', disabled: true }, T.pickName);
    const nombres = el('div', { class: 'nombres' }, Object.entries(players).filter(([, x]) => !x.out)
      .sort((a, b2) => a[1].name.localeCompare(b2[1].name, 'es'))
      .map(([pid, x]) => el('button', {
        type: 'button', class: 'chip-btn', 'data-pid': pid,
        onClick: ev => {
          SFX.tap(); elegido = pid;
          $$('.chip-btn', nombres).forEach(c => c.classList.toggle('on', c === ev.currentTarget));
          b.disabled = false; b.textContent = fmt(T.loginGo, { name: x.name });
          p.input.focus();
        },
      }, x.name)));
    b.addEventListener('click', async () => {
      SFX.tap();
      if (!elegido) return;
      if (!esPin(p.input.value)) return avisoError(err, T.errPin);
      b.disabled = true;
      try {
        await store.sentarse(S.code, elegido, await hashPin(S.code, elegido, p.input.value));
        cuenta.recordar(S.code, elegido, { nombre: players[elegido].name, copa: meta.name, fin: meta.end });
        S.yo = elegido;
        SFX.reveal();
        tablero();
      } catch (e) {
        avisoError(err, e?.code === 'pin' ? fmt(T.errPinWrong, { name: players[elegido].name }) : errorDe(e));
        b.disabled = false;
      }
    });
    poner(caja, el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.pickName), nombres, p.nodo), err, b);
  };

  const tabs = el('div', { class: 'seg' },
    puedeEntrar ? el('button', { type: 'button', id: 'tab-nuevo', onClick: ev => { SFX.tap(); marcar(ev); nuevo(); } }, T.imNew) : null,
    el('button', { type: 'button', id: 'tab-inscrito', onClick: ev => { SFX.tap(); marcar(ev); inscrito(); } }, T.imIn));
  const marcar = ev => $$('button', tabs).forEach(x => x.classList.toggle('on', x === ev.currentTarget));

  poner(body, 
    el('div', { class: 'intro-hero' }, el('span', { class: 'icon' }, '🏆'),
      el('p', { class: 'muted', style: 'margin:0' }, T.inviteTitle),
      el('h1', { class: 'display display--lg rainbow' }, meta.name),
      el('p', { class: 'lead' }, info)),
    el('div', { class: 'cal-mini' }, CALENDARIOS[meta.days].map(j => el('span', { title: MINIJUEGOS[j].nombre }, MINIJUEGOS[j].emoji))),
    puedeEntrar ? null : el('p', { class: 'muted center' }, terminada(meta, now) ? T.closedEnded : L().closed && inscripcionAbierta(meta, now) ? T.closedByAdmin : T.closedJoin),
    tabs, caja,
  );
  if (!puedeEntrar || entrarModo === 'inscrito') $('#tab-inscrito').click();
  else $('#tab-nuevo').click();
}

/* ------------------------------------------------------------------ */
/* Tablero                                                             */
/* ------------------------------------------------------------------ */

function esAdmin() { return L()?.meta?.admin === S.yo; }

/** Hasta cuándo se puede jugar un día, dicho como lo entiende una persona. */
function hastaCuando(d, est, now) {
  const { meta } = L();
  const falta = faltaPara(meta.win[d].b - now);
  if (est === 'jugado') return fmt(T.closesIn, { t: falta });
  if (est === 'gracia' || esFinal(meta, d)) return fmt(T.untilTonight, { t: falta });
  return T.untilTomorrowNight;
}

function tarjetaDia(d, rotulo) {
  const Lc = L(), { meta } = Lc;
  const id = juegoDelDia(meta, d), J = MINIJUEGOS[id];
  const now = ahora();
  const est = estadoDia(Lc, d, S.yo, now);
  const x2 = multiplicador(Lc, d, S.yo) === 2;
  const jugaron = activos(Lc).filter(j => Lc.results?.[d]?.[j.pid]);
  const falta = faltan(Lc, d, now);
  let accion;
  if (est === 'jugado') accion = el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { SFX.tap(); resultado(d); } }, T.seeResult);
  // Con el admin solo no se juega (D-118): falta con quién competir
  else if ((est === 'hoy' || est === 'gracia') && faltaGente(Lc)) accion = el('div', { class: 'aviso', id: 'falta-gente' }, T.needSecond);
  else if (est === 'hoy' || est === 'gracia') accion = el('button', { class: 'btn btn--yellow', 'data-dia': d, onClick: () => { SFX.tap(); antesDeJugar(d); } }, `${J.emoji} ${T.play}`);
  else if (est === 'en-curso') accion = el('button', { class: 'btn btn--yellow', 'data-dia': d, onClick: () => { SFX.tap(); jugar(d); } }, `${J.emoji} ${T.resume}`);
  return el('div', { class: `panel dia-card ${est}` },
    el('div', { class: 'dia-top' },
      el('span', { class: 'chip' + (rotulo === T.today ? ' chip--hot' : '') }, rotulo),
      el('span', { class: 'muted' }, `${fmt(T.dayOf, { d, n: meta.days })} · ${fechaCorta(meta.win[d].a, meta.tz)}`),
      x2 ? el('span', { class: 'chip chip--gold' }, esFinal(meta, d) ? T.x2 : `${T.x2} ${T.wildUsed}`) : null),
    el('div', { class: 'dia-juego' }, el('span', { class: 'dia-emoji' }, J.emoji), el('div', {}, el('b', {}, J.nombre), el('small', { class: 'muted' }, hastaCuando(d, est, now)))),
    est === 'jugado' ? el('p', { class: 'ok' }, `✅ ${T.played}`) : null,
    accion,
    el('p', { class: 'muted quienes' }, jugaron.length ? fmt(T.whoPlayed, { names: jugaron.map(j => j.name).join(', ') }) : T.nobodyPlayed),
    falta.length && jugaron.length ? el('p', { class: 'muted quienes' }, fmt(T.missing, { names: falta.map(j => j.name).join(', ') })) : null,
  );
}

/**
 * La tabla con un bloque por día de la copa, los siete (D-131): con puntos si ya se ven, ✓ si
 * jugó pero todavía no los puedes ver, "por jugar" si el día está abierto y no ha jugado, "–" si
 * se cerró sin jugarlo, y vacío si el día todavía no abre.
 */
function vistaTabla(filas, { dias, meta, now }) {
  const bloque = (f, d) => {
    const x = f.dias[d];
    if (!x) return el('span', { class: 'pd pendiente', title: T.blockPending }, '');
    if (x.oculto) return x.jugo ? el('span', { class: 'pd oculto', title: T.blockHidden }, '✓') : el('span', { class: 'pd abierto', title: T.blockOpen }, '•');
    if (!x.jugo) return abierto(meta, d, now) ? el('span', { class: 'pd abierto', title: T.blockOpen }, '•') : el('span', { class: 'pd perdido', title: T.blockMissed }, '–');
    return el('span', { class: 'pd' + (x.x === 2 ? ' doble' : '') + (x.pos === 1 ? ' oro' : '') }, String(x.pts));
  };
  return el('div', { class: 'tabla' }, filas.map(f => el('div', { class: 'fila' + (f.pid === S.yo ? ' yo' : '') },
    el('span', { class: 'lugar' }, String(f.lugar)),
    el('span', { class: 'flecha ' + (f.flecha > 0 ? 'sube' : f.flecha < 0 ? 'baja' : '') }, f.flecha > 0 ? '▲' : f.flecha < 0 ? '▼' : ''),
    el('div', { class: 'quien' },
      el('b', {}, f.name, f.pid === S.yo ? el('small', { class: 'muted' }, ` (${T.you})`) : null),
      el('div', { class: 'puntitos' }, dias.map(d => bloque(f, d)))),
    el('span', { class: 'total' }, String(f.total), el('small', {}, ` ${T.pts}`)))));
}

/**
 * Tus días, de arriba abajo (LIG-38): los pasados con su resultado y deshabilitados para
 * jugar (tocarlos muestra el resultado), el de hoy abierto como tarjeta grande, el de ayer
 * habilitado mientras dure su día de gracia, y los que vienen deshabilitados.
 */
function misDias(d, now) {
  const Lc = L(), { meta } = Lc;
  const pids = activos(Lc).map(j => j.pid);
  const w = comodinDe(Lc, S.yo);
  const filas = [];
  for (let k = 1; k <= meta.days; k++) {
    if (k === d) { filas.push(tarjetaDia(k, T.today)); continue; }
    const J = MINIJUEGOS[juegoDelDia(meta, k)];
    const est = estadoDia(Lc, k, S.yo, now);
    const x2 = esFinal(meta, k) || w === k;
    let detalle, accion = null, clase = est;
    if (est === 'jugado') {
      const r = Lc.results[k][S.yo];
      const pos = posicionesDelDia(Lc.results[k], pids)[S.yo];
      detalle = visibleDia(Lc, k, S.yo, now) && pos ? `${r.r || r.s} · ${pos.pos}º · +${pos.pts * multiplicador(Lc, k, S.yo)} ${T.pts}` : `${r.r || r.s}`;
    } else if (est === 'gracia') {
      detalle = T.lastDay;
      accion = faltaGente(Lc) ? null : el('button', { class: 'btn btn--yellow btn--sm', 'data-dia': k, onClick: () => { SFX.tap(); antesDeJugar(k); } }, `${J.emoji} ${T.play}`);
    } else if (est === 'en-curso') {
      detalle = T.lastDay;
      accion = el('button', { class: 'btn btn--yellow btn--sm', 'data-dia': k, onClick: () => { SFX.tap(); jugar(k); } }, `${J.emoji} ${T.resume}`);
    } else if (est === 'perdido') detalle = T.notPlayed;
    else detalle = fmt(T.opensOn, { fecha: fechaCorta(meta.win[k].a, meta.tz) });
    const contenido = [
      el('span', { class: 'md-dia' }, el('b', {}, fmt(T.dayShort, { d: k })), el('small', {}, fechaCorta(meta.win[k].a, meta.tz))),
      el('span', { class: 'md-emoji' }, J.emoji),
      el('span', { class: 'md-info' }, el('b', {}, J.nombre, x2 ? el('span', { class: 'chip chip--gold md-x2' }, T.x2) : null), el('small', {}, detalle)),
      est === 'jugado' ? el('span', { class: 'md-go' }, '›') : accion,
    ];
    filas.push(est === 'jugado'
      ? el('button', { type: 'button', class: `md-fila ${clase}`, onClick: () => { SFX.tap(); resultado(k); } }, ...contenido)
      : el('div', { class: `md-fila ${clase}`, 'aria-disabled': accion ? null : 'true' }, ...contenido));
  }
  return el('div', { class: 'panel mis-dias' }, el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.myDays), filas);
}

/**
 * Tu posición día a día: una línea por jugador, la tuya de color y el resto en gris, con el
 * 1º arriba. Solo los días que ya puedes ver (los que jugaste o los cerrados), así el gráfico
 * tampoco delata el día de hoy. Tocar un punto muestra quién era y en qué lugar iba.
 */
/** Un color por jugador en el gráfico (D-125): los de la app, bien distintos entre sí. */
const COLORES_GRAFICO = ['#2ee6d6', '#ffd23f', '#ff2e88', '#9dff3a', '#ff7a1a', '#a78bff', '#5ab0ff', '#ff9ecb', '#e8e8e8', '#c7a36b'];

/** Los jugadores por orden de inscripción, y el color fijo de cada uno (D-125). */
const llegada = Lc => Object.entries(Lc.players || {}).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).map(([pid]) => pid);
const colorDe = (Lc, pid) => COLORES_GRAFICO[Math.max(0, llegada(Lc).indexOf(pid)) % COLORES_GRAFICO.length];

function grafico(now) {
  const Lc = L(), { meta } = Lc;
  const ev = evolucion(Lc, S.yo, now);
  if (!ev.dias.length) return null;
  // "(-1J)" junto a quien lleva menos juegos, como en la imagen que se comparte (D-126)
  const menos = menosJuegos(tabla(Lc, S.yo, now));
  const n = ev.filas.length;
  const W = 320, fila = 24, arriba = 14, abajo = 26, izq = 26, der = 92; // espacio a la derecha para "Nombre 3º (-1J)"
  const H = arriba + (n - 1) * fila + abajo;
  const x = k => izq + (meta.days === 1 ? 0 : ((k - 1) * (W - izq - der)) / (meta.days - 1));
  const y = lugar => arriba + (lugar - 1) * fila;
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, ...hijos) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    hijos.forEach(h => e.append(h));
    return e;
  };
  const leyenda = el('p', { class: 'muted grafico-nota', 'aria-live': 'polite' }, T.progressHint);
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafico', role: 'img', 'aria-label': T.progressTitle });
  for (let l = 1; l <= n; l++) {
    svg.append(svgEl('line', { x1: izq, x2: W - der, y1: y(l), y2: y(l), class: 'g-grid' }));
    svg.append(svgEl('text', { x: izq - 8, y: y(l) + 4, class: 'g-eje', 'text-anchor': 'end' }, `${l}º`));
  }
  for (let k = 1; k <= meta.days; k++) svg.append(svgEl('text', { x: x(k), y: H - 6, class: 'g-eje', 'text-anchor': 'middle' }, fmt(T.dayShort, { d: k })));
  // Cada jugador con su color (D-125), fijo por orden de inscripción; tu línea, más gruesa y encima
  const porLlegada = llegada(Lc);
  const color = pid => colorDe(Lc, pid);
  const orden = [...ev.filas.filter(f => f.pid !== S.yo), ...ev.filas.filter(f => f.pid === S.yo)];
  const grupos = {};
  // Empatados en el mismo lugar: sus nombres se apilan en vez de encimarse (el lugar siguiente
  // queda vacío en un empate, así que hay espacio)
  const enLugar = {};
  for (const f of orden) {
    const mia = f.pid === S.yo;
    const g = svgEl('g', { class: 'g-jugador' + (mia ? ' mia' : ''), 'data-pid': f.pid, style: `--c:${color(f.pid)}` });
    grupos[f.pid] = g;
    const pts = f.lugares.map((l, i) => [x(ev.dias[i]), y(l)]);
    if (pts.length > 1) g.append(svgEl('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'g-linea' }));
    pts.forEach(([px, py], i) => {
      const texto = fmt(T.progressPoint, { d: ev.dias[i], name: f.name, pos: f.lugares[i] });
      g.append(svgEl('circle', { cx: px, cy: py, r: mia ? 5 : 4, class: 'g-punto' }));
      const blanco = svgEl('circle', { cx: px, cy: py, r: 11, class: 'g-toque' }, svgEl('title', {}, texto));
      blanco.addEventListener('click', () => { leyenda.textContent = texto; destacar(f.pid); });
      g.append(blanco);
    });
    if (pts.length) {
      const [px, py] = pts[pts.length - 1];
      const corto = f.name.length > 10 ? `${f.name.slice(0, 9)}…` : f.name;
      const marca = menos[f.pid] > 0 ? ` (-${menos[f.pid]}J)` : '';
      const ultimo = f.lugares[f.lugares.length - 1];
      const k = (enLugar[ultimo] = (enLugar[ultimo] ?? -1) + 1);
      g.append(svgEl('text', { x: px + 9, y: py + 4 + k * 11, class: 'g-rotulo' }, `${corto} ${ultimo}º${marca}`));
    }
    svg.append(g);
  }
  // Tocar un nombre (o un punto) destaca su línea y apaga las demás; tocarlo otra vez, todas
  let destacado = null;
  const destacar = pid => {
    destacado = destacado === pid ? null : pid;
    svg.classList.toggle('con-destacado', !!destacado);
    Object.entries(grupos).forEach(([p, g]) => g.classList.toggle('destacado', p === destacado));
    chips.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.pid === destacado));
  };
  const chips = el('div', { class: 'grafico-chips' }, ev.filas.slice().sort((a, b) => porLlegada.indexOf(a.pid) - porLlegada.indexOf(b.pid)).map(f =>
    el('button', { type: 'button', class: 'g-chip' + (f.pid === S.yo ? ' mia' : ''), 'data-pid': f.pid, style: `--c:${color(f.pid)}`, onClick: () => { SFX.tap(); destacar(f.pid); } },
      el('span', { class: 'g-color', 'aria-hidden': 'true' }), nombreConJuegos(f.pid === S.yo ? fmt(T.progressYou, { name: f.name }) : f.name, menos[f.pid]))));
  const notaJuegos = Object.values(menos).some(x => x > 0) ? el('p', { class: 'muted grafico-nota', id: 'nota-juegos' }, T.fewerGamesNote) : null;
  return el('div', { class: 'panel' }, el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.progressTitle), svg, chips, notaJuegos, leyenda,
    el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-imagen', onClick: async ev2 => {
      SFX.tap(); const b = ev2.currentTarget; b.disabled = true;
      try { await compartirImagen(); } finally { b.disabled = false; }
    } }, `📤 ${T.shareImage}`));
}

function tablero() {
  const Lc = L();
  if (!Lc || !S.yo) return;
  if (!Lc.players?.[S.yo]) { cuenta.olvidar(S.code); S.yo = null; entrar(); return; }
  mostrar('tablero');
  const { meta } = Lc;
  const now = ahora();
  const d = diaActual(meta, now);
  const body = $('#tablero-body');
  body.innerHTML = '';
  const dias = Array.from({ length: meta.days }, (_, i) => i + 1);

  let estadoTxt;
  if (d === 0) estadoTxt = fmt(T.before, { fecha: fechaLarga(meta.win[1].a, meta.tz) });
  else if (d > meta.days) estadoTxt = T.over;
  // El día de la copa y la fecha, para que se lea igual que el calendario (D-120)
  else estadoTxt = `${fmt(T.dayOf, { d, n: meta.days })} · ${fechaLarga(meta.win[d].a, meta.tz)}`;

  poner(body, el('div', { class: 'copa-head' },
    el('h1', { class: 'display display--md rainbow' }, `🏆 ${meta.name}`),
    el('p', { class: 'lead', style: 'margin:0' }, estadoTxt),
    el('div', { class: 'btn-row' },
      // Invitar tiene sentido antes de que parta; después, el admin lo tiene en Administrar
      d === 0 && !L().closed ? el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-invitar', onClick: () => { SFX.tap(); invitar(); } }, T.shareInvite) : null,
      esAdmin() ? el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-admin', onClick: () => { SFX.tap(); admin(); } }, T.adminTab) : null)));

  if (terminada(meta, now)) poner(body, podio());
  if (d === 0) poner(body, el('div', { class: 'panel center' }, el('p', { class: 'lead' }, faltaGente(L()) ? T.needSecondBefore : T.beforeSub)));

  // Tus días: el historial, el de hoy habilitado y los que vienen deshabilitados
  poner(body, misDias(d, now));

  if (d >= 1) {
    const filas = tabla(Lc, S.yo, now);
    const hayOcultos = filas.some(f => Object.values(f.dias).some(x => x.oculto));
    // La leyenda de los bloques (D-131)
    const leyenda = el('div', { class: 'tabla-leyenda' },
      el('span', {}, el('span', { class: 'pd oro' }, '10'), T.legendPoints),
      hayOcultos ? el('span', {}, el('span', { class: 'pd oculto' }, '✓'), T.legendHidden) : null,
      el('span', {}, el('span', { class: 'pd abierto' }, '•'), T.legendOpen),
      el('span', {}, el('span', { class: 'pd perdido' }, '–'), T.legendMissed),
      el('span', {}, el('span', { class: 'pd pendiente' }, ''), T.legendPending));
    poner(body, el('div', { class: 'panel' },
      el('p', { class: 'lead', style: 'margin-bottom:8px' }, provisoria(Lc, filas, now) ? T.tableTitleProvisional : T.tableTitle),
      vistaTabla(filas, { dias, meta, now }),
      leyenda,
      hayOcultos ? el('small', { class: 'muted' }, T.tableHidden) : null));
    poner(body, grafico(now));
  } else {
    const jug = activos(Lc);
    poner(body, el('div', { class: 'panel' },
      el('p', { class: 'lead', style: 'margin-bottom:8px' }, fmt(T.players, { n: jug.length, max: MAX_JUGADORES })),
      el('div', { class: 'nombres' }, jug.map(j => el('span', { class: 'chip' + (j.pid === S.yo ? ' chip--hot' : '') }, j.name)))));
  }

  poner(body, botonReporte(), el('button', {
    class: 'link-btn', onClick: () => {
      if (!confirm(T.leaveConfirm)) return;
      cuenta.olvidar(S.code); S.yo = null; entrar();
    },
  }, T.leave));

  clearInterval(S.tic);
  S.tic = setInterval(() => { if (S.pantalla === 'tablero' && !document.hidden) tablero(); }, 60000);
}

/* ------------------------------------------------------------------ */
/* Podio                                                               */
/* ------------------------------------------------------------------ */

let celebrado = false;

function podio() {
  const Lc = L();
  const m = medallas(Lc);
  const filas = tabla(Lc, S.yo, Lc.meta.end);
  const top = filas.slice(0, 3);
  const titulo = m.campeon?.length === 1 ? fmt(T.podiumTitle, { name: m.campeon[0].name }) : T.podiumTie;
  if (!celebrado) { celebrado = true; setTimeout(() => { confetti(); SFX.win(); }, 300); }
  const medalla = (rotulo, lista, extra = '') => (lista?.length ? el('div', { class: 'medalla' }, el('b', {}, rotulo), el('span', {}, lista.map(f => f.name).join(', ') + extra)) : null);
  return el('div', { class: 'panel podio' },
    el('h2', { class: 'display display--md center' }, titulo),
    el('div', { class: 'escalones' }, [1, 0, 2].map(i => top[i] ? el('div', { class: `escalon e${i + 1}` },
      el('span', { class: 'medal' }, ['🥇', '🥈', '🥉'][i]), el('b', {}, top[i].name), el('small', {}, `${top[i].total} ${T.pts}`)) : null)),
    medalla(T.medalChamp, m.campeon),
    medalla(T.medalWins, m.ganador?.filas, m.ganador ? ` (${m.ganador.n})` : ''),
    medalla(T.medalComeback, m.remontada?.filas, m.remontada ? ` (+${m.remontada.n})` : ''),
    medalla(T.medalLast, m.farolito),
    el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%', onClick: () => compartir(mensajeFinal()) }, T.shareSummary));
}

/* ------------------------------------------------------------------ */
/* Mensajes para el grupo (D-99)                                       */
/* ------------------------------------------------------------------ */

async function compartir(texto, url = urlPublica(S.code)) {
  // El link va dentro del texto, en su propia línea al final (D-124): si va aparte, Android lo
  // pega pegado a la última frase ("…Mica. https://…")
  const r = await shareLink({ title: L().meta.name, text: `${texto}\n\n🔗 ${url}` });
  if (r === 'copied') toast(T.copied);
}

function toast(texto) {
  const t = el('div', { class: 'toast', role: 'status' }, texto);
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}

/**
 * La invitación promocional (D-127): el reto, cuándo parte, cuánto toma y quiénes ya están.
 * Los minijuegos no se nombran: son sorpresa.
 */
function mensajeInvitacion() {
  const Lc = L(), { meta } = Lc;
  const nombres = activos(Lc).map(j => j.name);
  const lista = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0] || '';
  return fmt(T.shareInviteText, {
    copa: meta.name, dias: meta.days, fecha: fechaLarga(meta.win[1].a, meta.tz),
    inscritos: nombres.length ? fmt(nombres.length === 1 ? T.shareInviteJoinedOne : T.shareInviteJoined, { names: lista }) : '',
  }).replace(/\n{3,}/g, '\n\n');
}

function invitar() {
  const { meta } = L();
  return compartir(mensajeInvitacion());
}

/**
 * El recordatorio del admin (LIG-25): sirve cualquier día. Antes de empezar recuerda cuándo
 * parte; durante la copa dice qué toca hoy, hasta cuándo, si queda el de ayer en su día de
 * gracia y quién falta.
 */
function mensajeHoy() {
  const Lc = L(), { meta } = Lc;
  const now = ahora();
  const d = diaActual(meta, now);
  if (d === 0) {
    const J1 = MINIJUEGOS[juegoDelDia(meta, 1)];
    return fmt(Lc.closed ? T.shareBeforeClosed : T.shareBeforeText, { copa: meta.name, fecha: fechaLarga(meta.win[1].a, meta.tz), juego: `${J1.emoji} ${J1.nombre}` });
  }
  const hoy = Math.min(d, meta.days);
  const J = MINIJUEGOS[juegoDelDia(meta, hoy)];
  const hasta = esFinal(meta, hoy) ? T.untilToday : T.untilTomorrow;
  const partes = [fmt(T.shareTodayText, { d: hoy, n: meta.days, copa: meta.name, juego: `${J.emoji} ${J.nombre}`, hasta })];
  if (hoy > 1 && abierto(meta, hoy - 1, now) && faltan(Lc, hoy - 1, now).length) {
    const Ja = MINIJUEGOS[juegoDelDia(meta, hoy - 1)];
    partes.push(fmt(T.shareTodayGrace, { juego: `${Ja.emoji} ${Ja.nombre}` }));
  }
  const falta = faltan(Lc, hoy, now);
  if (falta.length && falta.length < activos(Lc).length) partes.push(fmt(T.shareTodayMissing, { names: falta.map(j => j.name).join(', ') }));
  return partes.join('\n');
}

function mensajeTabla() {
  const Lc = L(), { meta } = Lc;
  const now = ahora();
  const d = Math.min(diaActual(meta, now), meta.days);
  // La tabla que se comparte es la que ve el admin: no delata días que él no ha jugado
  const filas = tabla(Lc, S.yo, now);
  // Quien lleva menos juegos va marcado "(-1J)": la tabla parcial no lo castiga, lo explica (D-126)
  const menos = menosJuegos(filas);
  const lista = filas.map(f => `${['🥇', '🥈', '🥉'][f.lugar - 1] || `${f.lugar}.`} ${nombreConJuegos(f.name, menos[f.pid])} · ${f.total} pts`).join('\n');
  const falta = faltan(Lc, d, now);
  // El título lleva el último día que muestra la tabla; el aviso de abajo, el día que corre (#67)
  let txt = fmt(provisoria(Lc, filas, now) ? T.shareTableTextProvisional : T.shareTableText, { copa: meta.name, d: ultimoDiaVisto(filas) || d, tabla: lista });
  if (falta.length) txt += `\n\n${fmt(T.shareTableMissing, { d, names: falta.map(j => j.name).join(', ') })}`;
  return txt;
}

/** "Tomario (-1J)": el nombre con cuántos juegos menos lleva (D-126). */
const nombreConJuegos = (name, n) => (n > 0 ? fmt(T.fewerGames, { name, n }) : name);

/**
 * La tabla parcial como imagen para compartir (D-126, D-142): a la izquierda, el gráfico de
 * posiciones con una columna por cada día que ya se ve (todos, sin saltarse ninguno); a la
 * derecha, la tabla. Gráfico y tabla comparten el eje: la línea de cada jugador termina en su
 * fila, así cada nombre aparece una sola vez. Se dibuja en un canvas con las fuentes de la app
 * y se comparte como archivo; si el celular no puede, se descarga.
 */
async function compartirImagen() {
  const Lc = L(), { meta } = Lc;
  const now = ahora();
  const filas = tabla(Lc, S.yo, now);
  const menos = menosJuegos(filas);
  const ev = evolucion(Lc, S.yo, now);
  // El último día que muestra la tabla, no el de hoy si quien comparte todavía no lo juega (#67)
  const d = ultimoDiaVisto(filas) || Math.min(Math.max(diaActual(meta, now), 1), meta.days);
  const n = filas.length;
  const W = 1080;
  const pie = Object.values(menos).some(x => x > 0) ? 170 : 130;
  // Filas más bajas si son muchos: hasta 10 jugadores cabe en 1080 × 1080; con más, se alarga
  const fila = Math.max(60, Math.min(104, (1080 - 240 - 60 - pie) / Math.max(1, n)));
  const H = Math.max(1080, 240 + n * fila + 60 + pie);
  const g0 = 240 + (H - (240 + n * fila + 60 + pie)) / 2; // con pocos jugadores, centrado
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  try { await document.fonts?.ready; } catch (_) { /* nada */ }
  const fuente = (peso, px, familia = 'Nunito, system-ui, sans-serif') => `${peso} ${px}px ${familia}`;
  const caja = (x0, y0, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x0, y0, w, h, r); else c.rect(x0, y0, w, h); };
  // Fondo como el de la app
  const fondo = c.createLinearGradient(0, 0, W, H);
  fondo.addColorStop(0, '#3a0d5c'); fondo.addColorStop(1, '#120a2e');
  c.fillStyle = fondo; c.fillRect(0, 0, W, H);
  // Títulos
  c.textAlign = 'center';
  c.fillStyle = '#ffd23f';
  // El nombre de la copa, achicando la letra hasta que quepa (llega a 40 caracteres)
  let tam = 76;
  do { c.font = fuente(400, tam, 'Bangers, Impact, sans-serif'); tam -= 4; } while (c.measureText(`🏆 ${meta.name}`).width > W - 100 && tam > 30);
  c.fillText(`🏆 ${meta.name}`, W / 2, 115);
  c.fillStyle = '#ffffff'; c.font = fuente(800, 40);
  // Si alguien todavía puede jugar el último día que se ve, la tabla lo dice
  const prov = provisoria(Lc, filas, now);
  c.fillText(fmt(prov ? T.imageSubtitleProvisional : T.imageSubtitle, { d, n: meta.days }), W / 2, 180);
  // El eje que comparten: el centro de la fila i (0 = arriba) es también la altura del lugar i+1
  const yFila = i => g0 + (i + 0.5) * fila;
  const color = pid => colorDe(Lc, pid);
  const izq = 70, tabla0 = 470, derTabla = W - 40; // el gráfico va de izq a tabla0 - 30
  const m = ev.dias.length;
  const x = i => (m <= 1 ? izq : izq + (i * (tabla0 - 40 - izq)) / (m - 1));
  // Una guía por fila y el rótulo de cada día que se ve
  c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.10)';
  for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(izq, yFila(i)); c.lineTo(tabla0, yFila(i)); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = fuente(800, m > 10 ? 22 : 28); c.textAlign = 'center';
  ev.dias.forEach((dia, i) => c.fillText(fmt(T.dayShort, { d: dia }), x(i), g0 + n * fila + 44));
  // Las filas de la tabla, detrás de las líneas que llegan a ellas
  const filaDe = Object.fromEntries(filas.map((f, i) => [f.pid, i]));
  filas.forEach((f, i) => {
    const y0 = yFila(i) - fila / 2 + 6, h = fila - 12;
    c.fillStyle = f.pid === S.yo ? 'rgba(46,230,214,0.18)' : 'rgba(0,0,0,0.28)';
    caja(tabla0, y0, derTabla - tabla0, h, 18); c.fill();
    if (f.pid === S.yo) { c.lineWidth = 4; c.strokeStyle = '#2ee6d6'; c.stroke(); }
  });
  // Las líneas: una columna por día visto; el último punto cae en la fila del jugador y de ahí
  // sigue derecho hasta ella. La tuya, más gruesa y encima.
  // Los empatados comparten lugar: sus líneas van lado a lado, como las de un plano de metro,
  // en el orden de la tabla de hoy, para que ninguna tape a otra (y se vea que iban empatados)
  const junto = ev.dias.map((_, i) => {
    const grupos = {};
    ev.filas.filter(f => f.lugares[i]).sort((a, b) => (filaDe[a.pid] ?? n) - (filaDe[b.pid] ?? n))
      .forEach(f => (grupos[f.lugares[i]] ||= []).push(f.pid));
    const r = {};
    for (const g of Object.values(grupos)) g.forEach((pid, k) => { r[pid] = (k - (g.length - 1) / 2) * Math.min(12, fila / (g.length + 1)); });
    return r;
  });
  const orden = [...ev.filas.filter(f => f.pid !== S.yo), ...ev.filas.filter(f => f.pid === S.yo)];
  for (const f of orden) {
    if (!f.lugares.length || filaDe[f.pid] === undefined) continue;
    const pts = f.lugares.map((l, i) => [x(i), (i === m - 1 ? yFila(filaDe[f.pid]) : yFila(l - 1) + junto[i][f.pid])]);
    const mia = f.pid === S.yo;
    c.strokeStyle = color(f.pid); c.fillStyle = color(f.pid); c.lineWidth = mia ? 10 : 6; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.lineTo(tabla0 + 6, pts[pts.length - 1][1]); c.stroke();
    pts.forEach(([px, py]) => { c.beginPath(); c.arc(px, py, mia ? 13 : 10, 0, Math.PI * 2); c.fill(); });
  }
  // El texto de cada fila: lugar, flecha, nombre (con "(-1J)") y puntos
  const tamFila = Math.round(Math.min(38, fila * 0.42));
  filas.forEach((f, i) => {
    const y = yFila(i) + tamFila * 0.36;
    c.textAlign = 'center'; c.font = fuente(900, tamFila); c.fillStyle = '#ffd23f';
    c.fillText(String(f.lugar), tabla0 + 42, y);
    if (f.flecha) { c.font = fuente(900, tamFila * 0.6); c.fillStyle = f.flecha > 0 ? '#9dff3a' : '#ff2e88'; c.fillText(f.flecha > 0 ? '▲' : '▼', tabla0 + 82, y - 2); }
    c.textAlign = 'right'; c.font = fuente(900, tamFila); c.fillStyle = '#ffd23f';
    const puntos = `${f.total} ${T.pts}`;
    c.fillText(puntos, derTabla - 22, y);
    const libre = derTabla - 22 - c.measureText(puntos).width - 20 - (tabla0 + 104);
    c.textAlign = 'left'; c.fillStyle = '#ffffff';
    let nombre = nombreConJuegos(f.name, menos[f.pid]), t = tamFila;
    do { c.font = fuente(800, t); t -= 2; } while (c.measureText(nombre).width > libre && t > 20);
    while (c.measureText(nombre).width > libre && f.name.length > 1) { f = { ...f, name: f.name.slice(0, -1) }; nombre = nombreConJuegos(`${f.name}…`, menos[f.pid]); }
    c.fillText(nombre, tabla0 + 104, y);
  });
  if (pie > 130) { c.textAlign = 'center'; c.font = fuente(700, 28); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText(T.fewerGamesNote, W / 2, H - 120); }
  // El link
  c.textAlign = 'center'; c.font = fuente(800, 34); c.fillStyle = '#2ee6d6';
  c.fillText(urlPublica(S.code).replace(/^https?:\/\//, ''), W / 2, H - 55);
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  const archivo = new File([blob], `copa-${meta.alias || S.code.toLowerCase()}-dia-${d}.png`, { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], title: meta.name, text: `${fmt(prov ? T.shareTableTextProvisional : T.shareTableText, { copa: meta.name, d, tabla: '' }).trim()}\n\n🔗 ${urlPublica(S.code)}` });
      return;
    }
  } catch (e) { if (e?.name === 'AbortError') return; }
  // Sin compartir archivos (computador): se descarga
  const a = el('a', { href: URL.createObjectURL(blob), download: archivo.name });
  document.body.append(a); a.click(); a.remove();
  toast(T.imageDownloaded);
}

function mensajeFinal() {
  const Lc = L();
  const m = medallas(Lc);
  const filas = tabla(Lc, S.yo, Lc.meta.end);
  const campeon = m.campeon?.length === 1 ? fmt(T.shareFinalChamp, { name: m.campeon[0].name, pts: m.campeon[0].total }) : T.podiumTie;
  const podioTxt = filas.slice(0, 3).map((f, i) => `${['🥇', '🥈', '🥉'][i]} ${f.name} · ${f.total} pts`).join('\n');
  const extras = [
    m.ganador && `${T.medalWins}: ${m.ganador.filas.map(f => f.name).join(', ')} (${m.ganador.n})`,
    m.remontada && `${T.medalComeback}: ${m.remontada.filas.map(f => f.name).join(', ')}`,
    m.farolito && `${T.medalLast}: ${m.farolito.map(f => f.name).join(', ')}`,
  ].filter(Boolean).join('\n');
  return fmt(T.shareFinalText, { copa: Lc.meta.name, campeon, podio: podioTxt }) + (extras ? `\n\n${extras}` : '');
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

function admin({ forzar = false } = {}) {
  if (!esAdmin()) { tablero(); return; }
  const Lc = L(), { meta } = Lc;
  const body = $('#admin-body');
  // Si alguien escribe (un nombre, un PIN) no se le borra el campo por una actualización; el calendario no cuenta
  if (!forzar && S.pantalla === 'admin' && body.contains(document.activeElement) && document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'date') return;
  mostrar('admin');
  body.innerHTML = '';
  const now = ahora();
  const d = diaActual(meta, now);
  const msg = (rotulo, fn, id) => el('button', { class: 'btn btn--cyan btn--sm', id, onClick: () => { SFX.tap(); compartir(fn()); } }, `📤 ${rotulo}`);
  const jug = activos(Lc);
  const err = el('div', { class: 'form-error', role: 'alert' });
  // La primera vez (recién creada, o mientras el admin siga solo): qué hacer ahora (D-110)
  if ((S.bienvenida || jug.length <= 1) && d === 0) {
    poner(body, el('div', { class: 'panel stack bienvenida', id: 'admin-bienvenida' },
      el('p', { class: 'lead', style: 'margin:0' }, `🎉 ${T.adminWelcomeTitle}`),
      el('ol', { class: 'como' },
        el('li', {}, T.adminWelcome1),
        el('li', {}, fmt(T.adminWelcome2, { fecha: fechaLarga(meta.win[1].a, meta.tz) })),
        el('li', {}, T.adminWelcome3),
        meta.alias ? el('li', {}, T.adminWelcomeAlias) : null)));
  }
  const accion = (rotulo, id, fn, clase = 'btn btn--ghost btn--sm') => el('button', { class: clase, id, onClick: async ev => {
    SFX.tap(); ev.currentTarget.disabled = true;
    const b = ev.currentTarget;
    try { await fn(); err.textContent = ''; } catch (e) { if (e?.code !== 'cancelado') avisoError(err, errorDe(e)); b.disabled = false; }
  } }, rotulo);
  poner(body, el('div', { class: 'panel stack' },
    el('p', { class: 'lead', style: 'margin:0' }, T.adminMsgs),
    // Cada mensaje, solo cuando tiene sentido (D-116): la invitación antes de partir y con la
    // inscripción abierta; la tabla parcial mientras se juega; el resumen, al terminar
    d === 0 && !Lc.closed ? msg(T.msgInvite, mensajeInvitacion, 'msg-invitar') : null,
    !terminada(meta, now) ? msg(T.msgToday, mensajeHoy, 'msg-hoy') : null,
    d >= 1 && !terminada(meta, now) ? msg(T.msgTable, mensajeTabla, 'msg-tabla') : null,
    terminada(meta, now) ? msg(T.msgFinal, mensajeFinal, 'msg-final') : null));

  // El nombre de la copa se puede cambiar mientras no termine (D-148); el link sigue igual
  if (!terminada(meta, now)) {
    // Sin etiqueta a la vista: el título del panel ya lo dice
    const nombre = campo('', { value: meta.name, maxlength: String(COPA_MAX), 'aria-label': T.fCopa }, { contador: true });
    nombre.nodo.querySelector('label').remove();
    const nombreErr = el('div', { class: 'form-error', role: 'alert' });
    nombre.nodo.hidden = true;
    const cambiar = el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-nombre', onClick: () => {
      SFX.tap(); nombre.nodo.hidden = false; cambiar.hidden = true; nombre.input.focus(); nombre.input.select();
    } }, `✏️ ${T.nameEdit}`);
    nombre.nodo.append(el('div', { class: 'btn-row' },
      accion(T.nameSave, 'btn-nombre-ok', async () => {
        const n = limpiarNombre(nombre.input.value, COPA_MAX);
        if (!n) { avisoError(nombreErr, T.errCopa); throw { code: 'cancelado' }; }
        if (n !== meta.name) await store.renombrarCopa(S.code, n);
        admin({ forzar: true });
        if (n !== meta.name) { SFX.reveal(); toast(fmt(T.nameDone, { copa: n })); }
      }, 'btn btn--yellow btn--sm'),
      el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-nombre-no', onClick: () => { SFX.tap(); admin({ forzar: true }); } }, T.nameCancel)),
      nombreErr);
    poner(body, el('div', { class: 'panel stack', id: 'admin-nombre' },
      el('p', { class: 'lead', style: 'margin:0' }, T.fCopa),
      el('p', { class: 'muted', style: 'margin:0' }, fmt(T.nameIs, { copa: meta.name })),
      cambiar, nombre.nodo));
  }

  // El inicio se puede mover a hoy o mañana mientras nadie haya jugado (D-110)
  if (sinEmpezar(Lc) && !terminada(meta, now)) {
    const hoy = fechaEn(now, meta.tz), manana = sumarDias(hoy, 1);
    const quedanHoy = medianoche(manana, meta.tz) - now;
    let alerta = null;
    if (d >= 1) alerta = T.startPassed;
    else if (meta.start === hoy && quedanHoy < 6 * 3600000) alerta = T.startLate;
    const moverA = async fecha => {
      if (!confirm(fmt(T.startMoveConfirm, { fecha: fechaLarga(medianoche(fecha, meta.tz), meta.tz) }))) throw { code: 'cancelado' };
      await store.reprogramar(S.code, moverInicio(meta, fecha));
      // El calendario tiene el foco (y en Chrome no lo suelta con blur), y con un campo enfocado
      // Administrar no se redibuja: aquí se fuerza
      admin({ forzar: true });
      SFX.reveal(); toast(fmt(T.startMoved, { fecha: fechaLarga(medianoche(fecha, meta.tz), meta.tz) }));
    };
    const mover = (fecha, rotulo, id) => meta.start === fecha
      ? el('button', { class: 'btn btn--yellow btn--sm', id, disabled: true }, `✓ ${rotulo}`)
      : accion(rotulo, id, () => moverA(fecha));
    // Otra fecha: un calendario de hoy a 30 días más (D-115)
    const otra = campoFecha(hoy);
    const esOtra = meta.start !== hoy && meta.start !== manana;
    if (esOtra && meta.start > hoy) otra.input.value = meta.start;
    const otraErr = el('div', { class: 'form-error', role: 'alert' });
    otra.nodo.append(accion(T.startOtherGo, 'btn-inicio-otra-ok', async () => {
      if (!otra.valida()) { avisoError(otraErr, fmt(T.errStartDate, { n: MAX_DIAS_INICIO })); throw { code: 'cancelado' }; }
      await moverA(otra.input.value);
    }, 'btn btn--yellow btn--sm'), otraErr);
    const botonOtra = el('button', { class: 'btn btn--ghost btn--sm' + (esOtra ? ' on' : ''), id: 'btn-inicio-otra', onClick: () => {
      SFX.tap(); otra.nodo.hidden = !otra.nodo.hidden; if (!otra.nodo.hidden) otra.input.focus();
    } }, `📅 ${T.startOther}`);
    poner(body, el('div', { class: 'panel stack', id: 'admin-inicio' },
      el('p', { class: 'lead', style: 'margin:0' }, T.startTitle),
      el('p', { class: 'muted', style: 'margin:0' }, fmt(d >= 1 ? T.startWas : T.startIs, { fecha: fechaLarga(meta.win[1].a, meta.tz) })),
      el('p', { class: 'muted', id: 'admin-zona', style: 'margin:0' }, fmt(T.startZone, { zona: zonaTexto(meta.tz) })),
      alerta ? el('div', { class: 'aviso' }, alerta) : null,
      el('div', { class: 'btn-row tres' }, mover(hoy, T.startTodayBtn, 'btn-inicio-hoy'), mover(manana, T.startTomorrowBtn, 'btn-inicio-manana'), botonOtra),
      otra.nodo));
  }

  // Solo en las copas del laboratorio: pasar al día siguiente para probar sin esperar (D-115)
  if (meta.lab && !terminada(meta, now)) {
    const siguiente = Math.min(d + 1, meta.days + 1);
    poner(body, el('div', { class: 'panel stack lab-panel', id: 'admin-lab' },
      el('p', { class: 'lead', style: 'margin:0' }, `🧪 ${T.labTitle}`),
      el('p', { class: 'muted', style: 'margin:0' }, T.labLead),
      faltaGente(Lc) ? el('div', { class: 'aviso', id: 'lab-falta-gente' }, T.labNeedSecond) : null,
      faltaGente(Lc) ? null : accion(`⏭️ ${siguiente > meta.days ? T.labEnd : fmt(T.labNext, { d: siguiente })}`, 'btn-pasar-dia', async () => {
        if (!confirm(siguiente > meta.days ? T.labEndConfirm : fmt(T.labNextConfirm, { d: siguiente, hoy: Math.max(d, 1) }))) throw { code: 'cancelado' };
        await store.reprogramar(S.code, pasarDia(meta));
        SFX.reveal(); toast(siguiente > meta.days ? T.labEndDone : fmt(T.labNextDone, { d: siguiente }));
      }, 'btn btn--ghost')));
  }

  // Cerrar o reabrir la inscripción, mientras todavía se pueda entrar (hasta la final)
  if (inscripcionAbierta(meta, now)) {
    poner(body, el('div', { class: 'panel stack', id: 'admin-inscripcion' },
      el('p', { class: 'lead', style: 'margin:0' }, T.joinTitle),
      el('p', { class: 'muted', style: 'margin:0' }, Lc.closed ? T.joinIsClosed : fmt(T.joinIsOpen, { n: jug.length, max: MAX_JUGADORES })),
      Lc.closed
        ? accion(`🔓 ${T.joinReopen}`, 'btn-reabrir', () => store.cerrarInscripcion(S.code, false))
        : accion(`🔒 ${T.joinClose}`, 'btn-cerrar-inscripcion', async () => {
          if (!confirm(T.joinCloseConfirm)) throw { code: 'cancelado' };
          await store.cerrarInscripcion(S.code, true);
        })));
  }

  const lista = el('div', { class: 'admin-jugadores' });
  const fila = (pid, p) => {
    const acciones = el('div', { class: 'acciones' });
    const editar = (rotulo, attrs, guardar) => {
      acciones.innerHTML = '';
      const input = el('input', { class: 'mini', ...attrs });
      poner(acciones, input, el('button', {
        class: 'btn btn--yellow btn--sm', onClick: async () => {
          try { await guardar(input.value); err.textContent = ''; admin(); } catch (e) { avisoError(err, typeof e === 'string' ? e : errorDe(e)); }
        },
      }, '✓'), el('button', { class: 'btn btn--ghost btn--sm', onClick: () => admin() }, '✕'));
      input.focus();
    };
    const esElAdmin = pid === meta.admin;
    // Renombrar va a la derecha del nombre, en la misma línea (no gasta alto); el resto, debajo
    const renombrar = el('button', { class: 'mini-btn', onClick: () => editar(T.rename, { value: p.name, maxlength: '20', 'aria-label': fmt(T.renamePrompt, { name: p.name }) }, async v => {
        const n = limpiarNombre(v);
        if (!n) throw T.errNombre;
        if (Object.entries(Lc.players).some(([q, x]) => q !== pid && claveNombre(x.name) === claveNombre(n))) throw T.errRepetido;
        await store.renombrar(S.code, pid, n);
      }) }, T.rename);
    poner(acciones,
      esElAdmin ? null : el('button', { class: 'mini-btn', onClick: () => editar(T.newPin, { inputmode: 'numeric', maxlength: '4', 'aria-label': fmt(T.pinPrompt, { name: p.name }) }, async v => {
        if (!esPin(v)) throw T.errPin;
        await store.cambiarPin(S.code, pid, await hashPin(S.code, pid, v));
        toast(fmt(T.pinDone, { name: p.name, pin: v }));
      }) }, T.newPin),
      // Terminada la copa, sacar a alguien cambiaría el podio: ya no se ofrece
      esElAdmin || terminada(meta, now) ? null : el('button', { class: 'mini-btn', onClick: async () => {
        if (!p.out && !confirm(fmt(T.kickConfirm, { name: p.name }))) return;
        try { await store.sacar(S.code, pid, !p.out); } catch (e) { avisoError(err, errorDe(e)); }
      } }, p.out ? T.unkick : T.kick));
    const nombre = el('div', { class: 'admin-nombre' },
      el('b', {}, p.name, esElAdmin ? el('small', { class: 'muted' }, ` (${T.youAdmin})`) : null, p.out ? el('small', { class: 'muted' }, ` (${T.kicked})`) : null), renombrar);
    return el('div', { class: 'admin-fila' + (p.out ? ' fuera' : '') }, nombre, acciones);
  };
  Object.entries(Lc.players || {}).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).forEach(([pid, p]) => poner(lista, fila(pid, p)));
  poner(body, el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.adminPlayers), lista, err),
    el('button', { class: 'btn btn--ghost', onClick: () => { SFX.tap(); S.bienvenida = false; tablero(); } }, T.toBoard));

  // Eliminar la copa (D-117): al final, en rojo, con dos confirmaciones (la segunda, escribir el nombre)
  const errBorrar = el('div', { class: 'form-error', role: 'alert' });
  poner(body, el('div', { class: 'panel stack peligro', id: 'admin-eliminar' },
    el('p', { class: 'lead', style: 'margin:0' }, T.deleteTitle),
    el('p', { class: 'muted', style: 'margin:0' }, T.deleteLead),
    errBorrar,
    el('button', { class: 'btn btn--red', id: 'btn-eliminar', onClick: async ev => {
      SFX.tap();
      if (!confirm(fmt(T.deleteConfirm1, { copa: meta.name }))) return;
      const escrito = prompt(fmt(T.deleteConfirm2, { copa: meta.name }));
      if (escrito === null) return;
      if (claveNombre(escrito, COPA_MAX) !== claveNombre(meta.name, COPA_MAX)) { avisoError(errBorrar, T.deleteMismatch); return; }
      const b = ev.currentTarget; b.disabled = true;
      S.eliminando = true;
      try {
        await store.eliminar(S.code);
        const nombre = meta.name;
        cuenta.olvidar(S.code);
        if (S.off) { S.off(); S.off = null; }
        S.code = null; S.yo = null; S.L = null;
        history.replaceState(null, '', `${location.pathname}${PRUEBA ? '?prueba' : LABS ? '?labs' : ''}`);
        SFX.splash();
        eliminada(nombre);
      } catch (e) { S.eliminando = false; b.disabled = false; avisoError(errBorrar, errorDe(e)); }
    } }, `🗑️ ${T.deleteGo}`)));
}

/** La confirmación al admin de que su copa se borró (D-117). */
function eliminada(nombre) {
  mostrar('espera');
  const body = $('#espera-body');
  body.innerHTML = '';
  poner(body, el('div', { class: 'stack center', id: 'copa-eliminada' },
    el('div', { class: 'result-hero' }, el('span', { class: 'trophy pop' }, '🗑️'),
      el('h2', { class: 'display display--md' }, T.deletedTitle)),
    el('div', { class: 'aviso bien' }, fmt(T.deletedDone, { copa: nombre })),
    el('button', { class: 'btn btn--yellow', onClick: () => { SFX.tap(); S.eliminando = false; portada(); } }, T.deletedBack)));
}

/* ------------------------------------------------------------------ */
/* Antes de jugar: cómo se juega y el comodín                          */
/* ------------------------------------------------------------------ */

function antesDeJugar(d) {
  const Lc = L(), { meta } = Lc;
  const id = juegoDelDia(meta, d), J = MINIJUEGOS[id];
  mostrar('jugar');
  $('#jugar-head').innerHTML = '';
  const body = $('#jugar-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const now = ahora();
  const w = comodinDe(Lc, S.yo);
  let comodin;
  if (esFinal(meta, d)) comodin = el('p', { class: 'muted' }, T.wildFinal);
  else if (w === d) comodin = el('p', { class: 'ok' }, `🃏 ${T.wildOn}`);
  else if (w) comodin = el('p', { class: 'muted' }, fmt(T.wildGone, { d: w }));
  else if (puedeComodin(Lc, d, S.yo, now)) {
    comodin = el('div', {},
      el('p', { class: 'muted' }, T.wildOff),
      el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-comodin', onClick: async ev => {
        if (!confirm(fmt(T.wildConfirm, { d }))) return;
        ev.currentTarget.disabled = true;
        try { await store.comodin(S.code, d, S.yo); SFX.king(); antesDeJugar(d); } catch (e) { avisoError(err, errorDe(e)); ev.currentTarget.disabled = false; }
      } }, `🃏 ${T.wildUse}`));
  }
  const sinGente = faltaGente(Lc);
  const empezar = el('button', { class: 'btn btn--yellow', id: 'btn-empezar', disabled: sinGente }, `${J.emoji} ${T.start}`);
  if (sinGente) avisoError(err, T.needSecond);
  empezar.addEventListener('click', async () => {
    SFX.tap();
    empezar.disabled = true;
    try {
      await store.empezar(S.code, d, S.yo);
      // Una copa de ?prueba es de mentira (vive en este navegador): no suma en las estadísticas.
      // Las del laboratorio sí: hoy son las copas reales con amigos (D-101).
      if (!PRUEBA) trackStart({ game: GAME_ID, mode: GAME_ID, players: 1 });
      jugar(d);
    } catch (e) { avisoError(err, errorDe(e)); empezar.disabled = false; }
  });
  poner(body, el('div', { class: 'stack' },
    el('div', { class: 'intro-hero' }, el('span', { class: 'icon' }, J.emoji),
      el('p', { class: 'muted', style: 'margin:0' }, fmt(T.dayOf, { d, n: meta.days })),
      el('h2', { class: 'display display--lg' }, J.nombre)),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.howToPlay), dibujo(id), el('ol', { class: 'como' }, J.como.map(x => el('li', {}, x))),
      el('p', { class: 'lead', style: 'margin:10px 0 4px' }, T.scoring), el('p', { class: 'muted' }, J.puntaje)),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.wildTitle), comodin),
    JUEGOS[id].ensayo ? el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-ensayo', onClick: () => { SFX.tap(); ensayo(d); } }, `🧪 ${T.tryFirst}`) : null,
    el('p', { class: 'muted center' }, T.startWarn), err, empezar,
    el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { SFX.tap(); tablero(); } }, T.toBoard)));
}

/* ------------------------------------------------------------------ */
/* Jugar                                                               */
/* ------------------------------------------------------------------ */

/**
 * Cuenta de 3 a 1 y "¡A jugar!" antes de un juego con reloj (D-105): todos los de La Copa lo
 * tienen, porque el tiempo desempata. El reloj parte cuando aparece "¡A jugar!", y ese cartel se
 * desvanece solo sobre el tablero. Resuelve la promesa en ese momento.
 */
/** El dibujo que explica el minijuego antes del texto, si lo tiene (Reinas, Tango y Zip). */
const dibujo = id => JUEGOS[id]?.ejemplo?.({ el, T }) ?? null;

/**
 * Las reglas del minijuego, plegadas debajo del tablero (D-133): no molestan mientras se juega y
 * están a mano ante la duda. Son las mismas de la pantalla de antes de jugar, con las palabras
 * de los botones que se ven al jugar. En la final, además, las cinco rondas.
 */
function panelReglas(id) {
  const J = MINIJUEGOS[id];
  const caja = $('#jugar-reglas');
  caja.innerHTML = '';
  if (!J) return;
  poner(caja, el('details', { class: 'panel reglas', id: 'reglas' },
    el('summary', {}, `📖 ${fmt(T.rulesOf, { juego: J.nombre })}`),
    dibujo(id),
    el('ol', { class: 'como' }, J.como.map(x => el('li', {}, x))),
    id === 'final' ? [el('p', { class: 'lead' }, T.finalRounds),
      el('ul', { class: 'como' }, Object.entries(RONDAS_FINAL).map(([r, x]) => el('li', {}, `${MINIJUEGOS[r].emoji} ${MINIJUEGOS[r].nombre}: ${x}`)))] : null,
    el('p', { class: 'lead' }, T.scoring),
    el('p', { class: 'muted' }, J.puntaje)));
}

function cuentaRegresiva(J) {
  // La Gran Final no la lleva: cada ronda ya parte con su propia presentación
  if (J === MINIJUEGOS.final) return Promise.resolve();
  $('#jugar-head').replaceChildren(el('span', { class: 'jugar-titulo' }, `${J.emoji} ${J.nombre}`));
  $('#jugar-body').innerHTML = '';
  return new Promise(listo => {
    const num = el('span', { class: 'cuenta-num' });
    const capa = el('div', { class: 'cuenta', id: 'cuenta', role: 'status', 'aria-live': 'assertive' },
      el('p', { class: 'cuenta-juego' }, `${J.emoji} ${J.nombre}`), num);
    document.body.append(capa);
    let n = 3;
    const paso = () => {
      if (!capa.isConnected) return;
      num.classList.remove('late'); void num.offsetWidth; num.classList.add('late');
      if (n > 0) { num.textContent = String(n); SFX.tick(); vibrate(10); n--; setTimeout(paso, 1000); return; }
      num.textContent = T.letsPlay;
      capa.classList.add('ya');
      SFX.turn(); vibrate([20, 40, 20]);
      listo();
      setTimeout(() => capa.remove(), 900);
    };
    paso();
  });
}

async function jugar(d) {
  const Lc = L(), { meta } = Lc;
  const id = juegoDelDia(meta, d), J = MINIJUEGOS[id], mod = JUEGOS[id];
  const guardado = cuenta.intento.leer(S.code, d, S.yo) || {};
  // Si ya había terminado pero no se alcanzó a guardar el resultado, se reintenta de una
  if (guardado.fin) { enviar(d, guardado.fin); return; }
  mostrar('jugar');
  keepAwake();
  // La cuenta va solo al empezar: si se retoma una partida, el tablero vuelve de una
  if (!guardado.reloj) await cuentaRegresiva(J);
  // Conexiones necesita saber cuándo empezó su día, para no cambiar de grilla a mitad (D-128)
  const p = mod.generar(S.code, d, id === 'conexiones' ? { desde: meta.win[d].a } : undefined);
  const now = ahora();
  // El reloj se detiene cuando el tablero termina, no cuando se toca "Ver resultado" (D-130).
  // Detenido, queda así aunque se recargue la página.
  let detenido = !!guardado.detenido;
  let rel = guardado.reloj ? (detenido ? guardado.reloj : reloj.seguir(guardado.reloj, now)) : reloj.nuevo(now);
  let jugadas = guardado.jugadas;
  const persistir = () => cuenta.intento.guardar(S.code, d, S.yo, { jugadas, reloj: reloj.pausar(rel, ahora()), detenido });
  persistir();

  const head = $('#jugar-head');
  head.innerHTML = '';
  const cron = el('span', { class: 'cron' }, fmt(T.timer, { t: mmss(reloj.leer(rel, now)) }));
  head.append(el('span', { class: 'jugar-titulo' }, `${J.emoji} ${J.nombre}`), cron);
  clearInterval(S.reloj);
  S.reloj = setInterval(() => { if (S.pantalla === 'jugar') cron.textContent = fmt(T.timer, { t: mmss(reloj.leer(rel, ahora())) }); }, 1000);
  S.visibilidad && document.removeEventListener('visibilitychange', S.visibilidad);
  S.visibilidad = () => {
    if (detenido) return;
    rel = document.hidden ? reloj.pausar(rel, ahora()) : reloj.seguir(rel, ahora());
    persistir();
  };
  document.addEventListener('visibilitychange', S.visibilidad);

  const body = $('#jugar-body');
  body.innerHTML = '';
  panelReglas(id);
  S.juego = { d, id };
  mod.montar(body, {
    p, jugadas, T, fmt, el, SFX, vibrate,
    guardar(j) { jugadas = j; persistir(); },
    tiempo: () => Math.round(reloj.leer(rel, ahora())),
    // Cada juego lo llama cuando su tablero termina (resuelto, perdido o sin tiempo): el tiempo
    // queda ahí, y lo que se tarde en tocar "Ver resultado" no cuenta (D-130)
    pararReloj() {
      if (!detenido) { rel = reloj.pausar(rel, ahora()); detenido = true; persistir(); }
      clearInterval(S.reloj); cron.textContent = fmt(T.timer, { t: mmss(reloj.leer(rel, ahora())) });
    },
    terminar(estado) {
      const ms = Math.round(reloj.leer(rel, ahora()));
      clearInterval(S.reloj);
      document.removeEventListener('visibilitychange', S.visibilidad);
      const r = mod.resultado(estado);
      const fin = { s: r.s, ms: r.ms ?? ms, t: r.t, resumen: r.resumen, det: desglose(id, estado, { T, fmt, mmss }) };
      cuenta.intento.guardar(S.code, d, S.yo, { jugadas, reloj: reloj.pausar(rel, ahora()), fin });
      enviar(d, fin);
    },
  });
}

async function enviar(d, fin) {
  mostrar('resultado');
  const body = $('#resultado-body');
  body.innerHTML = '';
  poner(body, el('div', { class: 'waiting center' }, T.sending));
  try {
    const t = String(fin.t || '').slice(0, 300);
    await store.resultado(S.code, d, S.yo, { s: fin.s, ms: fin.ms, t, r: String(fin.resumen || '').slice(0, 30) });
  } catch (e) {
    if (e?.code !== 'ya-jugado') {
      body.innerHTML = '';
      const err = el('div', { class: 'form-error', role: 'alert' });
      poner(body, err, el('button', { class: 'btn btn--yellow', onClick: () => enviar(d, fin) }, T.retry),
        el('button', { class: 'btn btn--ghost btn--sm', onClick: () => tablero() }, T.toBoard));
      avisoError(err, e?.code === 'ventana' ? T.errVentana : `${errorDe(e)} ${T.sendFail}`);
      return;
    }
  }
  cuenta.intento.borrar(S.code, d, S.yo);
  SFX.win(); vibrate([30, 50, 30]);
  // La copa llega por el oyente; si todavía no trae el resultado, se dibuja con el propio
  const Lc = L();
  if (!Lc.results?.[d]?.[S.yo]) {
    Lc.results ||= {}; Lc.results[d] ||= {};
    Lc.results[d][S.yo] = { s: fin.s, ms: fin.ms, t: fin.t, r: fin.resumen };
  }
  resultado(d, { recien: true, det: fin.det });
}

/* ------------------------------------------------------------------ */
/* Resultado del día                                                   */
/* ------------------------------------------------------------------ */

function resultado(d, { recien = false, det = null } = {}) {
  const Lc = L(), { meta } = Lc;
  const mio = Lc.results?.[d]?.[S.yo];
  if (!mio) { tablero(); return; }
  S.verDia = d;
  mostrar('resultado');
  const id = juegoDelDia(meta, d), J = MINIJUEGOS[id];
  const now = ahora();
  const jug = activos(Lc);
  const pos = posicionesDelDia(Lc.results[d], jug.map(j => j.pid));
  const n = Object.keys(pos).length;
  const x = multiplicador(Lc, d, S.yo);
  const yo = pos[S.yo];
  const body = $('#resultado-body');
  body.innerHTML = '';
  const ranking = jug.filter(j => pos[j.pid]).sort((a, b) => pos[a.pid].pos - pos[b.pid].pos);
  // Completa (D-124): la copa, el día, el juego, quién lo jugó y cómo le fue
  const tarjeta = `${fmt(T.shareCardText, { copa: meta.name, d, emoji: J.emoji, juego: J.nombre, name: nombreDe(S.yo), resumen: mio.r || '' })}\n${mio.t || ''}`;
  poner(body, 
    el('div', { class: 'result-hero' },
      el('span', { class: 'trophy' + (recien ? ' pop' : '') }, J.emoji),
      el('h2', { class: 'display display--md' }, fmt(T.resultTitle, { d, juego: J.nombre })),
      el('p', { class: 'muted', style: 'margin:0' }, T.yourScore),
      el('div', { class: 'score-big' }, mio.r || String(mio.s)),
      ...bajoElPuntaje(mio.t, mio.ms)),
    el('p', { class: 'lead center' }, cerrado(meta, d, now) || terminada(meta, now)
      ? fmt(T.finalPos, { pos: `${yo.pos}º`, n, pts: yo.pts * x })
      : fmt(T.provisional, { pos: `${yo.pos}º`, n })),
    explicacion(J, { s: mio.s, ms: mio.ms, det, x, final: esFinal(meta, d) }),
    el('button', { class: 'btn btn--cyan', id: 'btn-tarjeta', onClick: () => { SFX.tap(); compartir(tarjeta); } }, T.shareCard),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.dayTable),
      el('div', { class: 'tabla' }, ranking.map(j => el('div', { class: 'fila' + (j.pid === S.yo ? ' yo' : '') },
        el('span', { class: 'lugar' }, `${pos[j.pid].pos}`),
        el('span', { class: 'flecha' }),
        el('div', { class: 'quien' }, el('b', {}, j.name), el('small', { class: 'muted' }, `${Lc.results[d][j.pid].r || Lc.results[d][j.pid].s} · ⏱ ${mmss(Lc.results[d][j.pid].ms)}`)),
        el('span', { class: 'total' }, `+${pos[j.pid].pts * multiplicador(Lc, d, j.pid)}`))))),
    el('button', { class: 'btn btn--yellow', id: 'btn-volver', onClick: () => { SFX.tap(); S.verDia = null; tablero(); } }, T.toBoard),
    botonReporte({ juego: id, dia: d }),
  );
}

/**
 * Lo que va bajo el puntaje (D-114): la tarjeta para compartir y el tiempo, pero el tiempo solo
 * si la tarjeta no lo trae ya (la de Reinas es "👑 ⏱ 1:23 ✅"): se veía dos veces.
 */
function bajoElPuntaje(t, ms) {
  return [
    t ? el('pre', { class: 'tarjeta' }, t) : null,
    String(t || '').includes('⏱') ? null : el('p', { class: 'muted' }, `⏱ ${mmss(ms)}`),
  ];
}

/**
 * Cómo se calculó el puntaje (D-106). Recién terminado trae el desglose línea por línea; si se
 * mira después (el desglose no se guarda en la copa), la regla del juego. En la copa suma cómo el
 * lugar del día se vuelve puntos, y si ese día valía el doble.
 */
function explicacion(J, { s, ms, det, x = 1, final = false, copa = true }) {
  const lineas = det?.length ? det : [J.puntaje];
  return el('details', { class: 'panel explicacion', id: 'explicacion', open: true },
    el('summary', { class: 'lead' }, `🧮 ${T.bdTitle}`),
    el('ul', {}, lineas.map(t => el('li', {}, t))),
    det?.length ? el('p', { class: 'explicacion-total' }, fmt(s === 1 ? T.bdTotalOne : T.bdTotal, { s })) : null,
    J === MINIJUEGOS.zip ? null : el('p', { class: 'muted' }, fmt(T.bdTime, { t: mmss(ms) })),
    copa ? el('p', { class: 'muted' }, T.bdPlaces) : null,
    copa && x > 1 ? el('p', { class: 'ok' }, final ? T.bdFinal : T.bdWild) : null);
}

/* ------------------------------------------------------------------ */
/* Práctica: un minijuego suelto, sin copa ni Firebase (LIG-41)        */
/* ------------------------------------------------------------------ */

/**
 * `/copa/?practica=<id>` juega un minijuego suelto con contenido al azar, para probar su
 * mecánica antes de armar una copa. La semilla se muestra al final y va en la URL
 * (`&semilla=K7Q2X`): con ella se repite exactamente la misma partida para reportar un error.
 */
/**
 * Desde la portada (D-142) la práctica es el minijuego suelto: vuelve al menú, no ofrece la sesión
 * de prueba (jugar otra vez ya es probar) ni muestra la semilla, y manda su señal de uso. Desde el
 * laboratorio llega con `&labs` y queda como estaba.
 */
const volverDePractica = () => (LABS
  ? el('a', { class: 'btn btn--ghost btn--sm', href: '../labs/' }, T.backToLabs)
  : el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.backToMenu));

function practica(id) {
  const J = MINIJUEGOS[id], mod = JUEGOS[id];
  if (!J || !mod) { portada(); return; }
  if (!LABS) document.title = `${J.nombre} ${J.emoji} · Juegos de Salón`;
  const semilla = esCodigo(SEMILLA) ? SEMILLA : codigoAlAzar();
  const zipSeg = new URLSearchParams(location.search).get('zipSeg');
  history.replaceState(null, '', `${location.pathname}?practica=${id}&semilla=${semilla}${PRUEBA ? '&prueba' : ''}${LABS ? '&labs' : ''}${zipSeg ? `&zipSeg=${zipSeg}` : ''}`);
  S.juego = { d: 1, id, practica: true, semilla };
  mostrar('jugar');
  $('#jugar-head').innerHTML = '';
  $('#jugar-reglas').innerHTML = ''; // en la antesala las reglas ya están a la vista
  const body = $('#jugar-body');
  body.innerHTML = '';
  poner(body, el('div', { class: 'stack' },
    el('div', { class: 'intro-hero' }, el('span', { class: 'icon' }, J.emoji),
      el('p', { class: 'muted', style: 'margin:0' }, LABS ? T.practiceTitle : T.looseTitle),
      el('h2', { class: 'display display--lg' }, J.nombre)),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.howToPlay), dibujo(id), el('ol', { class: 'como' }, J.como.map(x => el('li', {}, x))),
      el('p', { class: 'lead', style: 'margin:10px 0 4px' }, T.scoring), el('p', { class: 'muted' }, J.puntaje)),
    // La misma antesala que un día de la copa (D-109): la sesión de prueba se elige antes de jugar
    mod.ensayo && LABS ? el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-ensayo', onClick: () => { SFX.tap(); ensayoPractica(id, semilla); } }, `🧪 ${T.tryFirst}`) : null,
    el('p', { class: 'muted center' }, LABS ? T.practiceHint : T.looseHint),
    el('button', { class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); jugarPractica(id, semilla); } }, `${J.emoji} ${T.start}`),
    volverDePractica()));
}

function jugarPractica(id, semilla) {
  const p = JUEGOS[id].generar(semilla, 1);
  // Solo en el modo de prueba: `&zipSeg=8` acorta el reloj de Zip para los guiones de punta a punta
  const seg = Number(new URLSearchParams(location.search).get('zipSeg'));
  if (PRUEBA && id === 'zip' && seg > 0) p.tiempo = seg * 1000;
  // Señal de uso para el panel (D-44): el suelto se cuenta como su propio juego; el laboratorio no
  if (!LABS && !PRUEBA) trackStart({ game: id, mode: 'solo', players: 1 });
  jugarSinPuntaje(id, p, r => resultadoPractica(id, semilla, r));
}

/**
 * Juega un minijuego sin que cuente: la práctica del laboratorio y la sesión de prueba antes de
 * un día de la copa (D-103). Nada se guarda ni se envía; el reloj corre igual, para que se vea.
 */
async function jugarSinPuntaje(id, p, alTerminar, { ensayo = false } = {}) {
  const J = MINIJUEGOS[id], mod = JUEGOS[id];
  await cuentaRegresiva(J);
  let rel = reloj.nuevo(Date.now());
  const head = $('#jugar-head');
  head.innerHTML = '';
  const cron = el('span', { class: 'cron' }, fmt(T.timer, { t: '0:00' }));
  poner(head, el('span', { class: 'jugar-titulo' }, `${J.emoji} ${J.nombre}`), ensayo ? el('span', { class: 'chip chip--gold' }, T.trialChip) : null, cron);
  clearInterval(S.reloj);
  S.reloj = setInterval(() => { if (S.pantalla === 'jugar') cron.textContent = fmt(T.timer, { t: mmss(reloj.leer(rel, Date.now())) }); }, 1000);
  S.visibilidad && document.removeEventListener('visibilitychange', S.visibilidad);
  let detenido = false;
  S.visibilidad = () => { if (!detenido) rel = document.hidden ? reloj.pausar(rel, Date.now()) : reloj.seguir(rel, Date.now()); };
  document.addEventListener('visibilitychange', S.visibilidad);
  const body = $('#jugar-body');
  body.innerHTML = '';
  panelReglas(id);
  mod.montar(body, {
    p, jugadas: undefined, T, fmt, el, SFX, vibrate,
    textoFin: ensayo ? T.trialEnd : undefined,
    guardar() { /* no se guarda: no cuenta */ },
    tiempo: () => Math.round(reloj.leer(rel, Date.now())),
    pararReloj() {
      if (!detenido) { rel = reloj.pausar(rel, Date.now()); detenido = true; }
      clearInterval(S.reloj); cron.textContent = fmt(T.timer, { t: mmss(reloj.leer(rel, Date.now())) });
    },
    terminar(estado) {
      clearInterval(S.reloj);
      document.removeEventListener('visibilitychange', S.visibilidad);
      const r = mod.resultado(estado);
      alTerminar({ ...r, ms: r.ms ?? Math.round(reloj.leer(rel, Date.now())), det: desglose(id, estado, { T, fmt, mmss }) });
    },
  });
}

/** La sesión de prueba de un día: otro contenido, la misma mecánica, y de vuelta a Empezar. */
function ensayo(d) {
  const id = juegoDelDia(L().meta, d);
  mostrar('jugar');
  S.juego = { d, id, ensayo: true };
  jugarSinPuntaje(id, JUEGOS[id].ensayo(S.code, d), r => resultadoEnsayo(id, r, () => antesDeJugar(d)), { ensayo: true });
}

/** La sesión de prueba desde la práctica del laboratorio: la misma que antes de un día (D-109). */
function ensayoPractica(id, semilla) {
  mostrar('jugar');
  S.juego = { d: 1, id, practica: true, ensayo: true, semilla };
  jugarSinPuntaje(id, JUEGOS[id].ensayo(semilla, 1), r => resultadoEnsayo(id, r, () => practica(id)), { ensayo: true });
}

/** Fin de la sesión de prueba: cómo le fue, cómo se calcula, y de vuelta a la antesala. */
function resultadoEnsayo(id, r, volver) {
  mostrar('resultado');
  SFX.reveal();
  const body = $('#resultado-body');
  body.innerHTML = '';
  poner(body,
    el('div', { class: 'result-hero' }, el('span', { class: 'trophy pop' }, '🧪'),
      el('h2', { class: 'display display--md' }, T.trialDoneTitle)),
    el('div', { class: 'aviso' }, fmt(T.trialDone, { resumen: r.resumen || r.s })),
    explicacion(MINIJUEGOS[id], { s: r.s, ms: r.ms, det: r.det, copa: false }),
    el('button', { class: 'btn btn--yellow', id: 'btn-volver-ensayo', onClick: () => { SFX.tap(); volver(); } }, T.trialBack));
}

function resultadoPractica(id, semilla, r) {
  const J = MINIJUEGOS[id];
  mostrar('resultado');
  SFX.win();
  const otra = `${location.pathname}?practica=${id}${PRUEBA ? '&prueba' : ''}${LABS ? '&labs' : ''}`;
  const body = $('#resultado-body');
  body.innerHTML = '';
  poner(body,
    el('div', { class: 'result-hero' },
      el('span', { class: 'trophy pop' }, J.emoji),
      el('h2', { class: 'display display--md' }, J.nombre),
      el('p', { class: 'muted', style: 'margin:0' }, T.yourScore),
      el('div', { class: 'score-big' }, r.resumen || String(r.s)),
      ...bajoElPuntaje(r.t, r.ms)),
    explicacion(J, { s: r.s, ms: r.ms, det: r.det, copa: false }),
    LABS ? el('p', { class: 'muted center' }, fmt(T.practiceSeed, { semilla })) : null,
    el('a', { class: 'btn btn--yellow', id: 'btn-otra', href: otra }, T.practiceAgain),
    LABS ? el('a', { class: 'btn btn--cyan btn--sm', id: 'btn-repetir', href: `${otra}&semilla=${semilla}` }, T.practiceSame) : null,
    botonReporte({ juego: id, semilla, puntaje: r.s, resumen: r.resumen }),
    volverDePractica());
}

/* ------------------------------------------------------------------ */
/* Reportar un problema o dejar un comentario (LIG-42)                 */
/* ------------------------------------------------------------------ */

/**
 * El nombre de quien reporta queda en este dispositivo (no en la cuenta: en el laboratorio no la
 * hay), para no escribirlo en cada reporte. Si el almacenamiento está bloqueado, no pasa nada.
 */
const NOMBRE_REPORTE = 'juegos-de-salon:copa:reporte-nombre';
const nombreReporte = {
  leer() { try { return localStorage.getItem(NOMBRE_REPORTE) || ''; } catch (_) { return ''; } },
  guardar(n) { try { if (n) localStorage.setItem(NOMBRE_REPORTE, n); else localStorage.removeItem(NOMBRE_REPORTE); } catch (_) { /* nada */ } },
};

/** El botón que lleva al formulario, con lo que se sabe de dónde se apretó. */
function botonReporte(extra = {}) {
  return el('button', { class: 'link-btn reporte-btn', id: 'btn-reporte', onClick: () => { SFX.tap(); reportar(extra); } }, T.reportButton);
}

/**
 * El formulario va en su propia pantalla y vuelve a la que se estaba mirando. Además del
 * texto se manda el contexto, a la vista de quien reporta: copa, día, pantalla, versión y
 * navegador. Nunca el PIN ni lo que se está jugando.
 */
function reportar(extra = {}) {
  const volverA = S.pantalla;
  const contexto = {
    copa: S.code || null, jugador: S.yo ? nombreDe(S.yo) : null, pantalla: volverA,
    dia: S.verDia || S.juego?.d || null, ...extra,
    url: location.pathname + location.search, navegador: navigator.userAgent.slice(0, 160),
  };
  const volver = () => {
    if (volverA === 'tablero') tablero();
    else if (volverA === 'resultado' && S.verDia) resultado(S.verDia);
    else mostrar(volverA || 'intro');
  };
  mostrar('reporte');
  const body = $('#reporte-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const texto = el('textarea', { class: 'reporte-texto', maxlength: '1000', rows: '6', placeholder: T.reportPlaceholder, 'aria-label': T.reportTitle });
  const nombre = el('input', { class: 'mini', id: 'reporte-nombre', maxlength: '40', autocomplete: 'name', placeholder: T.reportNamePh, value: nombreReporte.leer() || contexto.jugador || cuenta.nombre.get() || '', 'aria-label': T.reportNamePh });
  const enviarBtn = el('button', { class: 'btn btn--yellow', id: 'btn-enviar-reporte' }, T.reportSend);
  enviarBtn.addEventListener('click', async () => {
    const t = texto.value.trim();
    if (!t) { avisoError(err, T.reportEmpty); return; }
    nombreReporte.guardar(nombre.value.trim().slice(0, 40));
    enviarBtn.disabled = true; enviarBtn.textContent = T.sending2;
    try {
      // Sin cuenta (D-104): en la práctica no se abre el almacén ni su sesión anónima
      const reportar = PRUEBA ? (await abrirStore()).reportar : (await import('./reportes.js')).enviarReporte;
      await reportar({
        texto: t.slice(0, 1000), nombre: nombre.value.trim().slice(0, 40),
        contexto: JSON.stringify(contexto).slice(0, 500),
        v: versionOf(document.getElementById('importmap')?.textContent || '') || 'dev',
      });
      body.innerHTML = '';
      SFX.reveal();
      poner(body, el('div', { class: 'aviso bien' }, T.reportThanks),
        el('button', { class: 'btn btn--yellow', id: 'btn-reporte-volver', onClick: () => { SFX.tap(); volver(); } }, T.reportBack));
    } catch (e) {
      // No se pudo enviar, pero quedó en el dispositivo y se reenvía solo (D-109)
      if (e?.guardado) {
        body.innerHTML = '';
        poner(body, el('div', { class: 'aviso' }, T.reportQueued),
          el('button', { class: 'btn btn--yellow', id: 'btn-reporte-volver', onClick: () => { SFX.tap(); volver(); } }, T.reportBack));
        return;
      }
      avisoError(err, errorDe(e));
      enviarBtn.disabled = false; enviarBtn.textContent = T.reportSend;
    }
  });
  poner(body,
    el('h2', { class: 'display display--md center' }, T.reportTitle),
    el('p', { class: 'muted' }, T.reportLead),
    el('div', { class: 'panel stack' }, texto,
      el('label', { class: 'lead', for: 'reporte-nombre', style: 'margin:0' }, T.reportNameLabel), nombre,
      el('p', { class: 'muted', style: 'margin:0' }, T.reportNameKeep),
      el('details', {}, el('summary', { class: 'muted' }, T.reportContext), el('pre', { class: 'reporte-contexto' }, JSON.stringify(contexto, null, 1)))),
    err, enviarBtn,
    el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { SFX.tap(); volver(); } }, T.reportCancel));
  texto.focus();
}

/* ------------------------------------------------------------------ */
/* Inicio                                                              */
/* ------------------------------------------------------------------ */

sparkles();
initSound();
applyStatic(T);
document.documentElement.lang = 'es';
document.title = `${T.title} 🏆 · Juegos de Salón`;
$('#sound-slot').append(soundToggle());
// Mientras La Copa esté en el laboratorio, "volver" es volver ahí y no al menú (D-101)
// Salvo el minijuego suelto que se abrió desde la portada (D-142), que vuelve a ella.
if (LABS || !PRACTICA) {
  $('#btn-menu').setAttribute('href', '../labs/');
  $('#btn-menu').textContent = T.backToLabsShort;
}
// Los reportes que no alcanzaron a enviarse se reintentan al abrir (D-109). En el modo de prueba
// no hay barra para adelantar el reloj (D-112): las demos y los guiones lo hacen por su cuenta.
if (!PRUEBA) import('./reportes.js').then(m => m.reenviarPendientes()).catch(() => { /* la próxima vez */ });

// Gancho de solo lectura para las pruebas (C-14)
window.__copa = {
  get estado() { return { pantalla: S.pantalla, code: S.code, yo: S.yo, copa: S.L ? JSON.parse(JSON.stringify(S.L)) : null, juego: S.juego }; },
  get store() { return store; },
  prueba: PRUEBA,
};

/** Abrir una copa por su link propio (?pirata, D-121). La URL se queda como está. */
async function abrirPorAlias(a) {
  espera('…');
  try {
    const st = await abrirStore(); await st.listo();
    const x = await st.alias(a);
    if (!x?.code) { espera(fmt(T.errNoAlias, { a }), { error: true }); return; }
    await abrirCopa(x.code);
  } catch (e) { espera(errorDe(e), { error: true, reintentar: () => location.reload() }); }
}

/** Una demo del laboratorio: siembra la escena, deja la sesión de quien mira y la abre. */
async function demo(nombre) {
  const st = await abrirStore();
  await st.listo();
  st.reiniciarReloj();
  const { sembrar } = await import('./demo.js');
  const e = sembrar(nombre, { now: st.now(), uid: st.uid });
  if (!e) { portada(); return; }
  if (e.pid) cuenta.recordar(e.code, e.pid, { nombre: e.nombre, copa: e.meta.name, fin: e.meta.end });
  history.replaceState(null, '', `${location.pathname}?prueba&${e.code}`);
  await abrirCopa(e.code, { recienCreada: e.recien, pantalla: e.pantalla });
}

if (PRACTICA) practica(PRACTICA);
else if (DEMO) demo(DEMO);
else if (codigoUrl && esCodigo(codigoUrl)) abrirCopa(codigoUrl);
else if (aliasUrl) abrirPorAlias(aliasUrl);
else portada();
