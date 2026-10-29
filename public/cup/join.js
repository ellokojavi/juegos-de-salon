/**
 * La Copa — the join screen (sign up or sit back down), loaded the first time it opens (#860).
 * Everything else it needs from game.js comes in `c`, the screen's context.
 */
import { $, $$, con, el } from '../assets/js/ui.js';
import { MAX_JUGADORES, activos, calendario, claveNombre, diaActual, esPin, fuera, hashPin, inscripcionAbierta, limpiarNombre, pidAlAzar, terminada, tieneFinal } from './engine.js';
import { SFX } from '../assets/js/sound.js';
import { jugador, leerYo, rankingsVisibles } from '../assets/js/jugador.js';
import { langToggle } from '../assets/js/i18n.js';
import { nombres, tiene } from '../assets/js/parametros.js';

let c;
let JUEGOS_COPA, L, S, T, admin, ahora, appPid, avisoAudiencia, avisoError, avisoPalabras, campo, campoPin, camposPin, consejoJugador, cuenta, entrarComoJugador, errorDe, fechaLarga, fmt, miPais, mostrar, pinAlAzar, poner, sentarseConPinJugador, sinPinDeCopa, tablero, toast, vincularJugador;

/** Draws it; `ctx` is game.js's context (its `let`s are read live). */
export function entrar(ctx, ...args) {
  c = ctx;
  ({ JUEGOS_COPA, L, S, T, admin, ahora, appPid, avisoAudiencia, avisoError, avisoPalabras, campo, campoPin, camposPin, consejoJugador, cuenta, entrarComoJugador, errorDe, fechaLarga, fmt, miPais, mostrar, pinAlAzar, poner, sentarseConPinJugador, sinPinDeCopa, tablero, toast, vincularJugador } = ctx);
  return pantallaEntrar(...args);
}

let entrarModo = null;

function pantallaEntrar({ mantener = false, modo } = {}) {
  if (modo) entrarModo = modo;
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
  // El jugador de este celular, si la copa ya lo tiene enlazado (D-220)
  const yoJ = leerYo();
  const deVuelta = S.reentrar && players[S.reentrar] && !players[S.reentrar].out ? S.reentrar : null;
  const mio = deVuelta || (appPid && players[appPid] && !players[appPid].out ? appPid : null)
    || (yoJ && Object.keys(players).find(pid => !players[pid].out && players[pid].j === yoJ.jid));

  const caja = el('div', { class: 'stack' });
  const nuevo = () => {
    entrarModo = 'nuevo';
    caja.innerHTML = '';
    const yo = campo(T.fYou, { placeholder: T.fYouPh, maxlength: '20', value: cuenta.nombre.get() || leerYo()?.n || '' }, { contador: true });
    const p1 = campoPin(T.fPin), p2 = campoPin(T.fPin2);
    const b = el('button', { class: 'btn btn--yellow', id: 'btn-inscribir' }, T.joinGo);
    b.addEventListener('click', async () => {
      SFX.tap();
      const n = limpiarNombre(yo.input.value);
      if (!n) return avisoError(err, T.errNombre);
      const sinPin = sinPinDeCopa();
      if (!sinPin) {
        if (!esPin(p1.input.value)) return avisoError(err, T.errPin);
        if (p1.input.value !== p2.input.value) return avisoError(err, T.errPin2);
      }
      // Un nombre que ya está: si el PIN es el suyo, cuenta como entrar, sin volver a escribirlo (D-120)
      const existente = Object.entries(L().players || {}).find(([, x]) => !x.out && claveNombre(x.name) === claveNombre(n));
      if (existente) {
        const [pid, x] = existente;
        // With a player and no cup PIN, only the cup player linked to them is theirs (D-359)
        if (sinPin && x.j !== leerYo().jid) return avisoError(err, T.errRepetido);
        b.disabled = true; b.textContent = T.joining;
        try {
          if (sinPin) await c.store.sentarseComoJugador(S.code, pid, leerYo().jid);
          else await c.store.sentarse(S.code, pid, await hashPin(S.code, pid, p1.input.value));
          cuenta.recordar(S.code, pid, { nombre: x.name, copa: meta.name, fin: meta.end });
          S.yo = pid;
          if (!sinPin) entrarComoJugador(x.name, p1.input.value);
          vincularJugador(L());
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
        const pin = sinPin ? pinAlAzar() : p1.input.value;
        await c.store.inscribir(S.code, { pid, name: n, at: ahora(), pinHash: await hashPin(S.code, pid, pin), co: miPais() });
        cuenta.nombre.set(n);
        cuenta.recordar(S.code, pid, { nombre: n, copa: meta.name, fin: meta.end });
        S.yo = pid;
        if (!sinPin) entrarComoJugador(n, pin);
        vincularJugador(L());
        SFX.reveal();
        tablero();
      } catch (e) { avisoError(err, errorDe(e)); b.disabled = false; b.textContent = T.joinGo; }
    });
    poner(caja, el('div', { class: 'panel' }, yo.nodo, ...camposPin(p1, p2)),
      d > 2 ? el('p', { class: 'muted center' }, T.lateJoin) : null, err, b);
  };
  const inscrito = () => {
    entrarModo = 'inscrito';
    caja.innerHTML = '';
    let elegido = null;
    const p = campoPin(T.fPin);
    const b = el('button', { class: 'btn btn--yellow', id: 'btn-sentarse', disabled: true }, T.pickName);
    // The cup player linked to this phone's player sits with no PIN (D-359)
    const esMio = pid => !!(yoJ && rankingsVisibles() && players[pid]?.j === yoJ.jid);
    const pistaCopa = el('small', { class: 'muted', id: 'pista-pin-copa' }, T.pinCopaHint);
    // The linked player's seat can be lost too (same anonymous session): then their PIN is asked
    // for here, the player's, or a new cup PIN from the admin (D-416)
    let conPinJugador = false;
    const pistaJugador = el('small', { class: 'muted', id: 'pista-pin-jugador' });
    const verPin = () => {
      const mia = esMio(elegido);
      p.nodo.hidden = mia && !conPinJugador;
      pistaCopa.hidden = mia;
      pistaJugador.hidden = !(mia && conPinJugador);
      if (yoJ) pistaJugador.textContent = fmt(T.playerPinHint, { name: yoJ.n });
    };
    const nombres = el('div', { class: 'nombres' }, Object.entries(players).filter(([, x]) => !x.out)
      .sort((a, b2) => a[1].name.localeCompare(b2[1].name, 'es'))
      .map(([pid, x]) => el('button', {
        type: 'button', class: 'chip-btn', 'data-pid': pid,
        onClick: ev => {
          SFX.tap(); elegido = pid;
          $$('.chip-btn', nombres).forEach(c => c.classList.toggle('on', c === ev.currentTarget));
          b.disabled = false; b.textContent = fmt(T.loginGo, { name: x.name });
          verPin();
          if (!p.nodo.hidden) p.input.focus();
        },
      }, x.name)));
    const pedirPinJugador = () => {
      conPinJugador = true;
      err.textContent = '';
      lead.id = 'sesion-jugador-perdida';
      lead.textContent = fmt(T.playerSeatLost, { name: yoJ.n });
      verPin();
      p.input.focus();
    };
    // Quien llega desde las copas de su jugador (D-220) ya tiene su nombre elegido: falta el PIN
    if (mio) {
      elegido = mio;
      $$('.chip-btn', nombres).forEach(c => c.classList.toggle('on', c.dataset.pid === mio));
      b.disabled = false; b.textContent = fmt(T.loginGo, { name: players[mio].name });
      verPin();
    }
    b.addEventListener('click', async () => {
      SFX.tap();
      if (!elegido) return;
      const mia = esMio(elegido);
      const conPin = !mia || conPinJugador;
      if (conPin && !esPin(p.input.value)) return avisoError(err, T.errPin);
      b.disabled = true;
      try {
        if (mia && conPinJugador) await sentarseConPinJugador(elegido, p.input.value);
        else if (mia) await c.store.sentarseComoJugador(S.code, elegido, yoJ.jid);
        else await c.store.sentarse(S.code, elegido, await hashPin(S.code, elegido, p.input.value));
        cuenta.recordar(S.code, elegido, { nombre: players[elegido].name, copa: meta.name, fin: meta.end });
        S.yo = elegido;
        S.reentrar = null;
        if (!mia) entrarComoJugador(players[elegido].name, p.input.value);
        vincularJugador(L());
        SFX.reveal();
        tablero();
      } catch (e) {
        b.disabled = false;
        // Linked, but the rules no longer see this phone as the player: not a wrong PIN (D-416)
        if (mia && !conPinJugador && e?.code === 'pin') return pedirPinJugador();
        avisoError(err, e?.code !== 'pin' ? errorDe(e)
          : mia ? fmt(T.errPlayerPin, { name: yoJ.n }) : fmt(T.errPinWrong, { name: players[elegido].name }));
      }
    });
    // Con un jugador en este celular hay dos PIN: aquí va el de la copa (D-96, D-220)
    // Desde la app instalada en iPhone (D-223): ya se sabe quién es, falta solo el PIN
    const desdeApp = appPid && elegido === appPid;
    // Este celular dejó de estar sentado como su jugador: se le dice por qué le piden el PIN
    const lead = deVuelta && elegido === deVuelta ? el('p', { class: 'lead', id: 'sentarse-de-nuevo' }, fmt(T.seatLost, { name: players[deVuelta].name }))
      : el('p', { class: 'lead', id: desdeApp ? 'bienvenida-app' : null }, desdeApp ? fmt(T.avAppWelcome, { name: players[appPid].name }) : T.pickName);
    poner(caja, el('div', { class: 'panel' }, lead, nombres, p.nodo,
      yoJ ? pistaCopa : consejoJugador(), pistaJugador), err, b);
    verPin();
    // Back from a lost seat as the linked player: both seats hung from the same session (D-416)
    if (deVuelta && elegido === deVuelta && esMio(deVuelta)) pedirPinJugador();
  };

  const tabs = el('div', { class: 'seg' },
    puedeEntrar ? el('button', { type: 'button', id: 'tab-nuevo', onClick: ev => { SFX.tap(); marcar(ev); nuevo(); } }, T.imNew) : null,
    el('button', { type: 'button', id: 'tab-inscrito', onClick: ev => { SFX.tap(); marcar(ev); inscrito(); } }, T.imIn));
  const marcar = ev => $$('button', tabs).forEach(x => x.classList.toggle('on', x === ev.currentTarget));

  poner(body, 
    el('div', { class: 'intro-hero' }, el('span', { class: 'icon' }, '🏆'),
      el('p', { class: 'muted', style: 'margin:0' }, T.inviteTitle),
      el('h1', { class: 'display display--lg rainbow' }, meta.name),
      el('p', { class: 'lead' }, info),
      avisoPalabras(meta),
      avisoAudiencia(meta),
      el('div', { style: 'margin-top:6px' }, langToggle())),
    el('div', { class: 'cal-mini' }, calendario(meta).map(j => el('span', { title: JUEGOS_COPA[j].nombre, class: con('', JUEGOS_COPA[j].emoji) }, JUEGOS_COPA[j].emoji))),
    // Por qué no puede inscribirse: terminó, la cerró el administrador, está llena o ya va en la final
    puedeEntrar ? null : el('p', { class: 'muted center' }, terminada(meta, now) ? T.closedEnded
      : !inscripcionAbierta(meta, now) ? (tieneFinal(meta) ? T.errCerrada : T.errCerradaLast) : L().closed ? T.closedByAdmin : T.errLlena),
    tabs, caja,
  );
  if (!puedeEntrar || entrarModo === 'inscrito' || (mio && entrarModo !== 'nuevo')) $('#tab-inscrito').click();
  else $('#tab-nuevo').click();
  // Quien perdió su asiento llega desde Empezar: el porqué y su PIN quedan a la vista, no bajo
  // "Te invitaron a una copa", que en un celular chico los deja fuera de la pantalla
  if (deVuelta && !mantener) caja.scrollIntoView({ block: 'center' });
}
