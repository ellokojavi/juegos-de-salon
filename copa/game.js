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
  CALENDARIOS, MAX_JUGADORES, CODIGO, esCodigo, codigoAlAzar, pidAlAzar, limpiarNombre, claveNombre, esPin, hashPin,
  fechaEn, sumarDias, nuevaMeta, diaActual, abierto, cerrado, terminada, inscripcionAbierta, estadoDia, comodinDe,
  puedeComodin, multiplicador, posicionesDelDia, tabla, faltan, medallas, evolucion, visibleDia, reloj, mmss, juegoDelDia, esFinal, activos, ZONA,
} from './engine.js';
import { GAME_ID, LOCALES, MINIJUEGOS } from './rules.js';
import { createCuenta } from './cuenta.js';
import { JUEGOS } from './juegos/index.js';

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
const codigoUrl = (busqueda.find(x => CODIGO.test(x.toUpperCase()) && x.length === 5) || new URLSearchParams(location.search).get('c') || '').toUpperCase();

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

const urlCopa = code => `${location.origin}${location.pathname}?${code}${PRUEBA ? '&prueba' : ''}${LABS ? '&labs' : ''}`;
const urlPublica = code => (PRUEBA ? urlCopa(code) : `https://juegosdesalon.cl/copa/?${code}`);

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

function campo(label, attrs = {}) {
  const input = el('input', { autocomplete: 'off', ...attrs });
  return { input, nodo: el('div', { class: 'field' }, el('label', {}, label), input) };
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

function crearCopa() {
  mostrar('crear');
  const body = $('#crear-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const nombre = campo(T.fCopa, { placeholder: T.fCopaPh, maxlength: '30' });
  // La Copa de 3 días es solo para probar con amigos (D-100): se ofrece con ?tres en la URL
  // o en el modo de prueba, nunca en la portada.
  const modo = opciones([
    TRES ? { valor: 3, titulo: T.mode3, sub: `${T.mode3Sub} ${CALENDARIOS[3].map(j => MINIJUEGOS[j].emoji).join(' ')}` } : null,
    { valor: 7, titulo: T.mode7, sub: `${T.mode7Sub} ${CALENDARIOS[7].map(j => MINIJUEGOS[j].emoji).join(' ')}` },
  ].filter(Boolean));
  const inicio = opciones([{ valor: 0, titulo: T.startToday }, { valor: 1, titulo: T.startTomorrow }]);
  inicio.nodo.classList.add('dos');
  const yo = campo(T.fYou, { placeholder: T.fYouPh, maxlength: '20', value: cuenta.nombre.get() });
  const pin1 = campoPin(T.fPin), pin2 = campoPin(T.fPin2);
  const boton = el('button', { class: 'btn btn--yellow', id: 'btn-crear-go' }, T.createGo);

  boton.addEventListener('click', async () => {
    SFX.tap();
    const n = limpiarNombre(nombre.input.value), quien = limpiarNombre(yo.input.value);
    if (!n) return avisoError(err, T.errCopa);
    if (!modo.valor) return avisoError(err, TRES ? T.errMode : T.errMode7);
    if (inicio.valor === null) return avisoError(err, T.errStart);
    if (!quien) return avisoError(err, T.errNombre);
    if (!esPin(pin1.input.value)) return avisoError(err, T.errPin);
    if (pin1.input.value !== pin2.input.value) return avisoError(err, T.errPin2);
    boton.disabled = true; boton.textContent = T.creating; err.textContent = '';
    try {
      const st = await abrirStore();
      await st.listo();
      let code = null;
      for (let i = 0; i < 8 && !code; i++) { const c = codigoAlAzar(); if (!(await st.existe(c))) code = c; }
      if (!code) throw Object.assign(new Error('busy'), { code: 'busy' });
      const pid = pidAlAzar();
      const now = st.now();
      const meta = nuevaMeta({ nombre: n, dias: modo.valor, inicio: sumarDias(fechaEn(now, ZONA), inicio.valor), tz: ZONA, admin: pid, creada: now });
      await st.crear(code, meta, { pid, name: quien, at: now, pinHash: await hashPin(code, pid, pin1.input.value) });
      cuenta.nombre.set(quien);
      cuenta.recordar(code, pid, { nombre: quien, copa: n, fin: meta.end });
      history.replaceState(null, '', urlCopa(code));
      await abrirCopa(code, { recienCreada: true });
    } catch (e) {
      avisoError(err, errorDe(e));
      boton.disabled = false; boton.textContent = T.createGo;
    }
  });

  poner(body, 
    el('div', { class: 'panel' }, nombre.nodo,
      el('div', { class: 'field' }, el('label', {}, T.fMode), modo.nodo),
      el('div', { class: 'field' }, el('label', {}, T.fStart), inicio.nodo, el('small', { class: 'muted' }, T.startHint))),
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

async function abrirCopa(code, { recienCreada = false } = {}) {
  S.code = code;
  espera('…');
  let st;
  try { st = await abrirStore(); await st.listo(); } catch (e) { espera(errorDe(e), { error: true, reintentar: () => location.reload() }); return; }
  if (S.off) S.off();
  let primera = true;
  S.off = st.escuchar(code, L => {
    S.L = L;
    if (!L || !L.meta) { espera(T.errNoExiste, { error: true }); return; }
    if (primera) {
      primera = false;
      const pid = cuenta.quien(code);
      if (pid && L.players?.[pid]) {
        S.yo = pid;
        cuenta.recordar(code, pid, { nombre: L.players[pid].name, copa: L.meta.name, fin: L.meta.end });
        tablero();
        if (recienCreada) setTimeout(() => invitar(), 300);
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
const modoTexto = meta => (meta.days === 3 ? T.mode3 : T.mode7);

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
  const info = d === 0
    ? fmt(T.inviteInfo, { modo: modoTexto(meta), fecha: fechaLarga(meta.win[1].a, meta.tz), n: jug.length, max: MAX_JUGADORES })
    : fmt(T.inviteStarted, { modo: modoTexto(meta), d: Math.min(d, meta.days), n: meta.days, k: jug.length, max: MAX_JUGADORES });
  const err = el('div', { class: 'form-error', role: 'alert' });
  const puedeEntrar = inscripcionAbierta(meta, now) && jug.length < MAX_JUGADORES;

  const caja = el('div', { class: 'stack' });
  const nuevo = () => {
    entrarModo = 'nuevo';
    caja.innerHTML = '';
    const yo = campo(T.fYou, { placeholder: T.fYouPh, maxlength: '20', value: cuenta.nombre.get() });
    const p1 = campoPin(T.fPin), p2 = campoPin(T.fPin2);
    const b = el('button', { class: 'btn btn--yellow', id: 'btn-inscribir' }, T.joinGo);
    b.addEventListener('click', async () => {
      SFX.tap();
      const n = limpiarNombre(yo.input.value);
      if (!n) return avisoError(err, T.errNombre);
      if (!esPin(p1.input.value)) return avisoError(err, T.errPin);
      if (p1.input.value !== p2.input.value) return avisoError(err, T.errPin2);
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
    puedeEntrar ? null : el('p', { class: 'muted center' }, T.closedJoin),
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
  else if (est === 'hoy' || est === 'gracia') accion = el('button', { class: 'btn btn--yellow', 'data-dia': d, onClick: () => { SFX.tap(); antesDeJugar(d); } }, `${J.emoji} ${T.play}`);
  else if (est === 'en-curso') accion = el('button', { class: 'btn btn--yellow', 'data-dia': d, onClick: () => { SFX.tap(); jugar(d); } }, `${J.emoji} ${T.resume}`);
  return el('div', { class: `panel dia-card ${est}` },
    el('div', { class: 'dia-top' },
      el('span', { class: 'chip' + (rotulo === T.today ? ' chip--hot' : '') }, rotulo),
      el('span', { class: 'muted' }, fmt(T.dayOf, { d, n: meta.days })),
      x2 ? el('span', { class: 'chip chip--gold' }, esFinal(meta, d) ? T.x2 : `${T.x2} ${T.wildUsed}`) : null),
    el('div', { class: 'dia-juego' }, el('span', { class: 'dia-emoji' }, J.emoji), el('div', {}, el('b', {}, J.nombre), el('small', { class: 'muted' }, hastaCuando(d, est, now)))),
    est === 'jugado' ? el('p', { class: 'ok' }, `✅ ${T.played}`) : null,
    accion,
    el('p', { class: 'muted quienes' }, jugaron.length ? fmt(T.whoPlayed, { names: jugaron.map(j => j.name).join(', ') }) : T.nobodyPlayed),
    falta.length && jugaron.length ? el('p', { class: 'muted quienes' }, fmt(T.missing, { names: falta.map(j => j.name).join(', ') })) : null,
  );
}

function vistaTabla(filas, { dias }) {
  return el('div', { class: 'tabla' }, filas.map(f => el('div', { class: 'fila' + (f.pid === S.yo ? ' yo' : '') },
    el('span', { class: 'lugar' }, String(f.lugar)),
    el('span', { class: 'flecha ' + (f.flecha > 0 ? 'sube' : f.flecha < 0 ? 'baja' : '') }, f.flecha > 0 ? '▲' : f.flecha < 0 ? '▼' : ''),
    el('div', { class: 'quien' },
      el('b', {}, f.name, f.pid === S.yo ? el('small', { class: 'muted' }, ` (${T.you})`) : null),
      el('div', { class: 'puntitos' }, dias.map(d => {
        const x = f.dias[d];
        if (!x) return el('span', { class: 'pd futuro' }, '·');
        if (x.oculto) return el('span', { class: 'pd oculto', title: x.jugo ? '✓' : '' }, x.jugo ? '✓' : '·');
        return el('span', { class: 'pd' + (x.x === 2 ? ' doble' : '') + (x.pos === 1 ? ' oro' : '') }, x.jugo ? String(x.pts) : '–');
      }))),
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
      accion = el('button', { class: 'btn btn--yellow btn--sm', 'data-dia': k, onClick: () => { SFX.tap(); antesDeJugar(k); } }, `${J.emoji} ${T.play}`);
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
function grafico(now) {
  const Lc = L(), { meta } = Lc;
  const ev = evolucion(Lc, S.yo, now);
  if (!ev.dias.length) return null;
  const n = ev.filas.length;
  const W = 320, fila = 24, arriba = 14, abajo = 26, izq = 26, der = 70;
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
  // El resto primero, para que tu línea quede encima
  const orden = [...ev.filas.filter(f => f.pid !== S.yo), ...ev.filas.filter(f => f.pid === S.yo)];
  for (const f of orden) {
    const mia = f.pid === S.yo;
    const pts = f.lugares.map((l, i) => [x(ev.dias[i]), y(l)]);
    if (pts.length > 1) svg.append(svgEl('polyline', { points: pts.map(p => p.join(',')).join(' '), class: mia ? 'g-linea mia' : 'g-linea' }));
    pts.forEach(([px, py], i) => {
      const texto = fmt(T.progressPoint, { d: ev.dias[i], name: f.name, pos: f.lugares[i] });
      svg.append(svgEl('circle', { cx: px, cy: py, r: mia ? 5 : 3, class: mia ? 'g-punto mia' : 'g-punto' }));
      const blanco = svgEl('circle', { cx: px, cy: py, r: 11, class: 'g-toque' }, svgEl('title', {}, texto));
      blanco.addEventListener('click', () => { leyenda.textContent = texto; });
      svg.append(blanco);
    });
    if (mia && pts.length) {
      const [px, py] = pts[pts.length - 1];
      svg.append(svgEl('text', { x: px + 10, y: py + 4, class: 'g-rotulo' }, `${f.name} · ${f.lugares[f.lugares.length - 1]}º`));
    }
  }
  return el('div', { class: 'panel' }, el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.progressTitle), svg, leyenda);
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
  else estadoTxt = fmt(T.dayOf, { d, n: meta.days });

  poner(body, el('div', { class: 'copa-head' },
    el('h1', { class: 'display display--md rainbow' }, `🏆 ${meta.name}`),
    el('p', { class: 'lead', style: 'margin:0' }, estadoTxt),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-invitar', onClick: () => { SFX.tap(); invitar(); } }, T.shareInvite),
      esAdmin() ? el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-admin', onClick: () => { SFX.tap(); admin(); } }, T.adminTab) : null)));

  if (terminada(meta, now)) poner(body, podio());
  if (d === 0) poner(body, el('div', { class: 'panel center' }, el('p', { class: 'lead' }, T.beforeSub)));

  // Tus días: el historial, el de hoy habilitado y los que vienen deshabilitados
  poner(body, misDias(d, now));

  if (d >= 1) {
    const filas = tabla(Lc, S.yo, now);
    const hayOcultos = filas.some(f => Object.values(f.dias).some(x => x.oculto));
    poner(body, el('div', { class: 'panel' },
      el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.tableTitle),
      vistaTabla(filas, { dias: dias.filter(x => x <= Math.min(d, meta.days)) }),
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
  const r = await shareLink({ title: L().meta.name, text: texto, url });
  if (r === 'copied') toast(T.copied);
}

function toast(texto) {
  const t = el('div', { class: 'toast', role: 'status' }, texto);
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}

function invitar() {
  const { meta } = L();
  return compartir(fmt(T.shareInviteText, { copa: meta.name, dias: meta.days, fecha: fechaLarga(meta.win[1].a, meta.tz) }));
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
    return fmt(T.shareBeforeText, { copa: meta.name, fecha: fechaLarga(meta.win[1].a, meta.tz), juego: `${J1.emoji} ${J1.nombre}` });
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
  return partes.join(' ');
}

function mensajeTabla() {
  const Lc = L(), { meta } = Lc;
  const now = ahora();
  const d = Math.min(diaActual(meta, now), meta.days);
  // La tabla que se comparte es la que ve el admin: no delata días que él no ha jugado
  const filas = tabla(Lc, S.yo, now);
  const lista = filas.map(f => `${f.lugar}. ${f.name} ${f.total}`).join(' · ');
  const falta = faltan(Lc, d, now);
  let txt = fmt(T.shareTableText, { copa: meta.name, d, tabla: lista });
  if (falta.length) txt += `\n${fmt(T.shareTableMissing, { d, names: falta.map(j => j.name).join(', ') })}`;
  return txt;
}

function mensajeFinal() {
  const Lc = L();
  const m = medallas(Lc);
  const filas = tabla(Lc, S.yo, Lc.meta.end);
  const campeon = m.campeon?.length === 1 ? fmt(T.shareFinalChamp, { name: m.campeon[0].name, pts: m.campeon[0].total }) : T.podiumTie;
  const podioTxt = filas.slice(0, 3).map((f, i) => `${['🥇', '🥈', '🥉'][i]} ${f.name} ${f.total}`).join(' · ');
  const extras = [
    m.ganador && `${T.medalWins}: ${m.ganador.filas.map(f => f.name).join(', ')} (${m.ganador.n})`,
    m.remontada && `${T.medalComeback}: ${m.remontada.filas.map(f => f.name).join(', ')}`,
    m.farolito && `${T.medalLast}: ${m.farolito.map(f => f.name).join(', ')}`,
  ].filter(Boolean).join('\n');
  return fmt(T.shareFinalText, { copa: Lc.meta.name, campeon, podio: podioTxt }) + (extras ? `\n${extras}` : '');
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

function admin() {
  if (!esAdmin()) { tablero(); return; }
  const Lc = L(), { meta } = Lc;
  const body = $('#admin-body');
  if (S.pantalla === 'admin' && body.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  mostrar('admin');
  body.innerHTML = '';
  const now = ahora();
  const d = diaActual(meta, now);
  const msg = (rotulo, fn, id) => el('button', { class: 'btn btn--cyan btn--sm', id, onClick: () => { SFX.tap(); compartir(fn()); } }, `📤 ${rotulo}`);
  poner(body, el('div', { class: 'panel stack' },
    el('p', { class: 'lead', style: 'margin:0' }, T.adminMsgs),
    msg(T.msgInvite, () => fmt(T.shareInviteText, { copa: meta.name, dias: meta.days, fecha: fechaLarga(meta.win[1].a, meta.tz) }), 'msg-invitar'),
    !terminada(meta, now) ? msg(T.msgToday, mensajeHoy, 'msg-hoy') : null,
    d >= 1 ? msg(T.msgTable, mensajeTabla, 'msg-tabla') : null,
    terminada(meta, now) ? msg(T.msgFinal, mensajeFinal, 'msg-final') : null));

  const err = el('div', { class: 'form-error', role: 'alert' });
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
    poner(acciones, 
      el('button', { class: 'mini-btn', onClick: () => editar(T.rename, { value: p.name, maxlength: '20', 'aria-label': fmt(T.renamePrompt, { name: p.name }) }, async v => {
        const n = limpiarNombre(v);
        if (!n) throw T.errNombre;
        if (Object.entries(Lc.players).some(([q, x]) => q !== pid && claveNombre(x.name) === claveNombre(n))) throw T.errRepetido;
        await store.renombrar(S.code, pid, n);
      }) }, T.rename),
      esElAdmin ? null : el('button', { class: 'mini-btn', onClick: () => editar(T.newPin, { inputmode: 'numeric', maxlength: '4', 'aria-label': fmt(T.pinPrompt, { name: p.name }) }, async v => {
        if (!esPin(v)) throw T.errPin;
        await store.cambiarPin(S.code, pid, await hashPin(S.code, pid, v));
        toast(fmt(T.pinDone, { name: p.name, pin: v }));
      }) }, T.newPin),
      esElAdmin ? null : el('button', { class: 'mini-btn', onClick: async () => {
        if (!p.out && !confirm(fmt(T.kickConfirm, { name: p.name }))) return;
        try { await store.sacar(S.code, pid, !p.out); } catch (e) { avisoError(err, errorDe(e)); }
      } }, p.out ? T.unkick : T.kick));
    return el('div', { class: 'admin-fila' + (p.out ? ' fuera' : '') }, el('b', {}, p.name, p.out ? el('small', { class: 'muted' }, ` (${T.kicked})`) : null), acciones);
  };
  Object.entries(Lc.players || {}).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).forEach(([pid, p]) => poner(lista, fila(pid, p)));
  poner(body, el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.adminPlayers), lista, err),
    el('button', { class: 'btn btn--ghost', onClick: () => { SFX.tap(); tablero(); } }, T.toBoard));
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
  const empezar = el('button', { class: 'btn btn--yellow', id: 'btn-empezar' }, `${J.emoji} ${T.start}`);
  empezar.addEventListener('click', async () => {
    SFX.tap();
    empezar.disabled = true;
    try {
      await store.empezar(S.code, d, S.yo);
      trackStart({ game: GAME_ID, mode: GAME_ID, players: 1 });
      jugar(d);
    } catch (e) { avisoError(err, errorDe(e)); empezar.disabled = false; }
  });
  poner(body, el('div', { class: 'stack' },
    el('div', { class: 'intro-hero' }, el('span', { class: 'icon' }, J.emoji),
      el('p', { class: 'muted', style: 'margin:0' }, fmt(T.dayOf, { d, n: meta.days })),
      el('h2', { class: 'display display--lg' }, J.nombre)),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.howToPlay), el('ol', { class: 'como' }, J.como.map(x => el('li', {}, x))),
      el('p', { class: 'lead', style: 'margin:10px 0 4px' }, T.scoring), el('p', { class: 'muted' }, J.puntaje)),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.wildTitle), comodin),
    el('p', { class: 'muted center' }, T.startWarn), err, empezar,
    el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { SFX.tap(); tablero(); } }, T.toBoard)));
}

/* ------------------------------------------------------------------ */
/* Jugar                                                               */
/* ------------------------------------------------------------------ */

function jugar(d) {
  const Lc = L(), { meta } = Lc;
  const id = juegoDelDia(meta, d), J = MINIJUEGOS[id], mod = JUEGOS[id];
  const guardado = cuenta.intento.leer(S.code, d, S.yo) || {};
  // Si ya había terminado pero no se alcanzó a guardar el resultado, se reintenta de una
  if (guardado.fin) { enviar(d, guardado.fin); return; }
  mostrar('jugar');
  keepAwake();
  const p = mod.generar(S.code, d);
  const now = ahora();
  let rel = guardado.reloj ? reloj.seguir(guardado.reloj, now) : reloj.nuevo(now);
  let jugadas = guardado.jugadas;
  const persistir = () => cuenta.intento.guardar(S.code, d, S.yo, { jugadas, reloj: reloj.pausar(rel, ahora()) });
  persistir();

  const head = $('#jugar-head');
  head.innerHTML = '';
  const cron = el('span', { class: 'cron' }, fmt(T.timer, { t: mmss(reloj.leer(rel, now)) }));
  head.append(el('span', { class: 'jugar-titulo' }, `${J.emoji} ${J.nombre}`), cron);
  clearInterval(S.reloj);
  S.reloj = setInterval(() => { if (S.pantalla === 'jugar') cron.textContent = fmt(T.timer, { t: mmss(reloj.leer(rel, ahora())) }); }, 1000);
  S.visibilidad && document.removeEventListener('visibilitychange', S.visibilidad);
  S.visibilidad = () => {
    rel = document.hidden ? reloj.pausar(rel, ahora()) : reloj.seguir(rel, ahora());
    persistir();
  };
  document.addEventListener('visibilitychange', S.visibilidad);

  const body = $('#jugar-body');
  body.innerHTML = '';
  S.juego = { d, id };
  mod.montar(body, {
    p, jugadas, T, fmt, el, SFX, vibrate,
    guardar(j) { jugadas = j; persistir(); },
    terminar(estado) {
      const ms = Math.round(reloj.leer(rel, ahora()));
      clearInterval(S.reloj);
      document.removeEventListener('visibilitychange', S.visibilidad);
      const r = mod.resultado(estado);
      const fin = { s: r.s, ms, t: r.t, resumen: r.resumen };
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
  resultado(d, { recien: true });
}

/* ------------------------------------------------------------------ */
/* Resultado del día                                                   */
/* ------------------------------------------------------------------ */

function resultado(d, { recien = false } = {}) {
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
  const tarjeta = `${fmt(T.shareCardText, { copa: meta.name, d, emoji: J.emoji, resumen: mio.r || '' })}\n${mio.t || ''}`;
  poner(body, 
    el('div', { class: 'result-hero' },
      el('span', { class: 'trophy' + (recien ? ' pop' : '') }, J.emoji),
      el('h2', { class: 'display display--md' }, fmt(T.resultTitle, { d, juego: J.nombre })),
      el('p', { class: 'muted', style: 'margin:0' }, T.yourScore),
      el('div', { class: 'score-big' }, mio.r || String(mio.s)),
      el('p', { class: 'muted' }, `⏱ ${mmss(mio.ms)}`)),
    el('p', { class: 'lead center' }, cerrado(meta, d, now) || terminada(meta, now)
      ? fmt(T.finalPos, { pos: `${yo.pos}º`, n, pts: yo.pts * x })
      : fmt(T.provisional, { pos: `${yo.pos}º`, n })),
    el('pre', { class: 'tarjeta' }, mio.t || ''),
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

/* ------------------------------------------------------------------ */
/* Práctica: un minijuego suelto, sin copa ni Firebase (LIG-41)        */
/* ------------------------------------------------------------------ */

/**
 * `/copa/?practica=<id>` juega un minijuego suelto con contenido al azar, para probar su
 * mecánica antes de armar una copa. La semilla se muestra al final y va en la URL
 * (`&semilla=K7Q2X`): con ella se repite exactamente la misma partida para reportar un error.
 */
function practica(id) {
  const J = MINIJUEGOS[id], mod = JUEGOS[id];
  if (!J || !mod) { portada(); return; }
  const semilla = esCodigo(SEMILLA) ? SEMILLA : codigoAlAzar();
  history.replaceState(null, '', `${location.pathname}?practica=${id}&semilla=${semilla}${PRUEBA ? '&prueba' : ''}`);
  S.juego = { d: 1, id, practica: true, semilla };
  mostrar('jugar');
  $('#jugar-head').innerHTML = '';
  const body = $('#jugar-body');
  body.innerHTML = '';
  poner(body, el('div', { class: 'stack' },
    el('div', { class: 'intro-hero' }, el('span', { class: 'icon' }, J.emoji),
      el('p', { class: 'muted', style: 'margin:0' }, T.practiceTitle),
      el('h2', { class: 'display display--lg' }, J.nombre)),
    el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.howToPlay), el('ol', { class: 'como' }, J.como.map(x => el('li', {}, x))),
      el('p', { class: 'lead', style: 'margin:10px 0 4px' }, T.scoring), el('p', { class: 'muted' }, J.puntaje)),
    el('p', { class: 'muted center' }, T.practiceHint),
    el('button', { class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); jugarPractica(id, semilla); } }, `${J.emoji} ${T.start}`),
    el('a', { class: 'btn btn--ghost btn--sm', href: '../labs/' }, T.backToLabs)));
}

function jugarPractica(id, semilla) {
  const J = MINIJUEGOS[id], mod = JUEGOS[id];
  const p = mod.generar(semilla, 1);
  let rel = reloj.nuevo(Date.now());
  const head = $('#jugar-head');
  head.innerHTML = '';
  const cron = el('span', { class: 'cron' }, fmt(T.timer, { t: '0:00' }));
  poner(head, el('span', { class: 'jugar-titulo' }, `${J.emoji} ${J.nombre}`), cron);
  clearInterval(S.reloj);
  S.reloj = setInterval(() => { if (S.pantalla === 'jugar') cron.textContent = fmt(T.timer, { t: mmss(reloj.leer(rel, Date.now())) }); }, 1000);
  S.visibilidad && document.removeEventListener('visibilitychange', S.visibilidad);
  S.visibilidad = () => { rel = document.hidden ? reloj.pausar(rel, Date.now()) : reloj.seguir(rel, Date.now()); };
  document.addEventListener('visibilitychange', S.visibilidad);
  const body = $('#jugar-body');
  body.innerHTML = '';
  mod.montar(body, {
    p, jugadas: undefined, T, fmt, el, SFX, vibrate,
    guardar() { /* la práctica no se guarda */ },
    terminar(estado) {
      clearInterval(S.reloj);
      document.removeEventListener('visibilitychange', S.visibilidad);
      const r = mod.resultado(estado);
      resultadoPractica(id, semilla, { ...r, ms: Math.round(reloj.leer(rel, Date.now())) });
    },
  });
}

function resultadoPractica(id, semilla, r) {
  const J = MINIJUEGOS[id];
  mostrar('resultado');
  SFX.win();
  const otra = `${location.pathname}?practica=${id}${PRUEBA ? '&prueba' : ''}`;
  const body = $('#resultado-body');
  body.innerHTML = '';
  poner(body,
    el('div', { class: 'result-hero' },
      el('span', { class: 'trophy pop' }, J.emoji),
      el('h2', { class: 'display display--md' }, J.nombre),
      el('p', { class: 'muted', style: 'margin:0' }, T.yourScore),
      el('div', { class: 'score-big' }, r.resumen || String(r.s)),
      el('p', { class: 'muted' }, `⏱ ${mmss(r.ms)}`)),
    el('pre', { class: 'tarjeta' }, r.t || ''),
    el('p', { class: 'muted center' }, fmt(T.practiceSeed, { semilla })),
    el('a', { class: 'btn btn--yellow', id: 'btn-otra', href: otra }, T.practiceAgain),
    el('a', { class: 'btn btn--cyan btn--sm', id: 'btn-repetir', href: `${otra}&semilla=${semilla}` }, T.practiceSame),
    botonReporte({ juego: id, semilla, puntaje: r.s, resumen: r.resumen }),
    el('a', { class: 'btn btn--ghost btn--sm', href: '../labs/' }, T.backToLabs));
}

/* ------------------------------------------------------------------ */
/* Reportar un problema o dejar un comentario (LIG-42)                 */
/* ------------------------------------------------------------------ */

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
  const nombre = el('input', { class: 'mini', maxlength: '40', placeholder: T.reportNamePh, value: contexto.jugador || cuenta.nombre.get() || '', 'aria-label': T.reportNamePh });
  const enviarBtn = el('button', { class: 'btn btn--yellow', id: 'btn-enviar-reporte' }, T.reportSend);
  enviarBtn.addEventListener('click', async () => {
    const t = texto.value.trim();
    if (!t) { avisoError(err, T.reportEmpty); return; }
    enviarBtn.disabled = true; enviarBtn.textContent = T.sending2;
    try {
      const st = await abrirStore();
      await st.reportar({
        texto: t.slice(0, 1000), nombre: nombre.value.trim().slice(0, 40),
        contexto: JSON.stringify(contexto).slice(0, 500),
        v: versionOf(document.getElementById('importmap')?.textContent || '') || 'dev',
      });
      body.innerHTML = '';
      SFX.reveal();
      poner(body, el('div', { class: 'aviso bien' }, T.reportThanks),
        el('button', { class: 'btn btn--yellow', id: 'btn-reporte-volver', onClick: () => { SFX.tap(); volver(); } }, T.reportBack));
    } catch (e) {
      avisoError(err, errorDe(e));
      enviarBtn.disabled = false; enviarBtn.textContent = T.reportSend;
    }
  });
  poner(body,
    el('h2', { class: 'display display--md center' }, T.reportTitle),
    el('p', { class: 'muted' }, T.reportLead),
    el('div', { class: 'panel stack' }, texto, nombre,
      el('details', {}, el('summary', { class: 'muted' }, T.reportContext), el('pre', { class: 'reporte-contexto' }, JSON.stringify(contexto, null, 1)))),
    err, enviarBtn,
    el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { SFX.tap(); volver(); } }, T.reportCancel));
  texto.focus();
}

/* ------------------------------------------------------------------ */
/* Modo de prueba: el reloj                                            */
/* ------------------------------------------------------------------ */

function barraDePrueba() {
  const barra = el('div', { class: 'prueba-barra' },
    el('span', {}, T.testBar),
    el('button', { onClick: () => store?.adelantar(60 * 60 * 1000) }, T.testHour),
    el('button', { onClick: () => store?.adelantar(24 * 60 * 60 * 1000) }, T.testDay),
    el('button', { onClick: () => store?.reiniciarReloj() }, T.testNow));
  document.body.append(barra);
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
$('#btn-menu').setAttribute('href', '../labs/');
$('#btn-menu').textContent = T.backToLabsShort;
if (PRUEBA) barraDePrueba();

// Gancho de solo lectura para las pruebas (C-14)
window.__copa = {
  get estado() { return { pantalla: S.pantalla, code: S.code, yo: S.yo, copa: S.L ? JSON.parse(JSON.stringify(S.L)) : null, juego: S.juego }; },
  get store() { return store; },
  prueba: PRUEBA,
};

if (PRACTICA) practica(PRACTICA);
else if (codigoUrl && esCodigo(codigoUrl)) abrirCopa(codigoUrl);
else portada();
