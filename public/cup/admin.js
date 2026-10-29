/**
 * La Copa — the admin screen, loaded only when its admin opens it (#860).
 * Everything else it needs from game.js comes in `c`, the screen's context.
 */
import { $, el, con } from '../assets/js/ui.js';
import { SFX } from '../assets/js/sound.js';
import { tiene } from '../assets/js/parametros.js';
import {
  calendario, MAX_JUGADORES, COPA_MAX, limpiarNombre, claveNombre, esPin, hashPin, fechaEn, sumarDias, diaActual, terminada,
  inscripcionAbierta, moverInicio, sinEmpezar, pasarDia, MAX_DIAS_INICIO, faltaGente, medianoche, tabla, faltan, fuera, activos, puedeCerrar,
} from './engine.js';
import { planilla } from './planilla.js';
import { jugador, leerYo } from '../assets/js/jugador.js';

let c;
let L, LABS, PRUEBA, S, T, ahora, avisoError, campo, campoFecha, compartir, compartirTabla, conBoton, cuenta, descargarPlanilla, entrar, errorDe, esAdmin, espera, fechaLarga, fmt, invitar, jugar, mensajeFinal, mensajeHoy, mensajeInvitacion, mensajeTabla, mostrar, podio, poner, portada, tablero, toast, zonaTexto;

/** Draws the admin screen; `ctx` is game.js's context (its `store` is read live, it changes on load). */
export function admin(ctx, opciones) {
  c = ctx;
  ({ L, LABS, PRUEBA, S, T, ahora, avisoError, campo, campoFecha, compartir, compartirTabla, conBoton, cuenta, descargarPlanilla, entrar, errorDe, esAdmin, espera, fechaLarga, fmt, invitar, jugar, mensajeFinal, mensajeHoy, mensajeInvitacion, mensajeTabla, mostrar, podio, poner, portada, tablero, toast, zonaTexto } = ctx);
  pantallaAdmin(opciones);
}

function pantallaAdmin({ forzar = false } = {}) {
  if (!esAdmin()) { tablero(); return; }
  const Lc = L(), { meta } = Lc;
  const body = $('#admin-body');
  // Si alguien escribe (un nombre, un PIN) no se le borra el campo por una actualización; el calendario no cuenta
  if (!forzar && S.pantalla === 'admin' && body.contains(document.activeElement) && document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'date') return;
  mostrar('admin');
  body.innerHTML = '';
  const now = ahora();
  const d = diaActual(meta, now);
  // La tabla y el resumen van con su imagen, como desde el tablero y el podio (D-165)
  const msg = (rotulo, fn, id) => el('button', { class: 'btn btn--cyan btn--sm', id, onClick: ev => conBoton(ev, () => (fn === mensajeTabla || fn === mensajeFinal ? compartirTabla() : compartir(fn()))) }, `📤 ${rotulo}`);
  const jug = activos(Lc);
  const err = el('div', { class: 'form-error', role: 'alert' });
  // La primera vez (recién creada, o mientras el admin siga solo): qué hacer ahora (D-110)
  if ((S.bienvenida || jug.length <= 1) && d === 0) {
    poner(body, el('div', { class: 'panel stack bienvenida', id: 'admin-bienvenida' },
      el('p', { class: 'lead', style: 'margin:0' }, `🎉 ${T.adminWelcomeTitle}`),
      el('ol', { class: 'como' },
        el('li', {}, T.adminWelcome1),
        el('li', {}, T.adminWelcome2),
        // Con link propio, cerrar la inscripción deja de ser opcional, y el paso dice por qué (#102)
        el('li', {}, meta.alias ? T.adminWelcomeAlias : T.adminWelcome3))));
  }
  const accion = (rotulo, id, fn, clase = 'btn btn--ghost btn--sm', caja = err) => el('button', { class: clase, id, onClick: async ev => {
    SFX.tap(); ev.currentTarget.disabled = true;
    const b = ev.currentTarget;
    try { await fn(); caja.textContent = ''; } catch (e) { if (e?.code !== 'cancelado') avisoError(caja, errorDe(e)); }
    // Lo que cambia la copa redibuja Administrar; exportar no, y el botón tiene que seguir sirviendo
    b.disabled = false;
  } }, rotulo);
  poner(body, el('div', { class: 'panel stack' },
    el('p', { class: 'lead', style: 'margin:0' }, T.adminMsgs),
    // Cada mensaje, solo cuando tiene sentido (D-116): la invitación mientras alguien nuevo pueda
    // entrar, también ya partida (D-176); la tabla parcial mientras se juega; el resumen, al terminar
    inscripcionAbierta(meta, now, Lc.closed) && jug.length < MAX_JUGADORES ? msg(T.msgInvite, mensajeInvitacion, 'msg-invitar') : null,
    !terminada(meta, now) ? msg(T.msgToday, mensajeHoy, 'msg-hoy') : null,
    d >= 1 && !terminada(meta, now) ? msg(T.msgTable, mensajeTabla, 'msg-tabla') : null,
    terminada(meta, now) ? msg(T.msgFinal, mensajeFinal, 'msg-final') : null));

  // Terminada (sola o por el admin), la tabla final se exporta: imagen y planilla (D-161)
  if (terminada(meta, now)) {
    const errExportar = el('div', { class: 'form-error', role: 'alert' });
    poner(body, el('div', { class: 'panel stack', id: 'admin-exportar' },
      el('p', { class: 'lead', style: 'margin:0' }, T.exportTitle),
      el('p', { class: 'muted', style: 'margin:0' }, T.exportLead),
      accion(`📤 ${T.exportImage}`, 'btn-exportar-imagen', () => compartirTabla(), 'btn btn--cyan btn--sm', errExportar),
      accion(`⬇️ ${T.exportSheet}`, 'btn-exportar-planilla', async () => { descargarPlanilla(); }, 'btn btn--cyan btn--sm', errExportar),
      errExportar));
  }


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
        if (n !== meta.name) await c.store.renombrarCopa(S.code, n);
        pantallaAdmin({ forzar: true });
        if (n !== meta.name) { SFX.reveal(); toast(fmt(T.nameDone, { copa: n })); }
      }, 'btn btn--yellow btn--sm'),
      el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-nombre-no', onClick: () => { SFX.tap(); pantallaAdmin({ forzar: true }); } }, T.nameCancel)),
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
      await c.store.reprogramar(S.code, moverInicio(meta, fecha));
      // El calendario tiene el foco (y en Chrome no lo suelta con blur), y con un campo enfocado
      // Administrar no se redibuja: aquí se fuerza
      pantallaAdmin({ forzar: true });
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
        if (!confirm(siguiente > meta.days ? T.labEndConfirm : fmt(T.labNextConfirm, { d: siguiente }))) throw { code: 'cancelado' };
        await c.store.reprogramar(S.code, pasarDia(meta));
        SFX.reveal(); toast(siguiente > meta.days ? T.labEndDone : fmt(T.labNextDone, { d: siguiente }));
      }, 'btn btn--ghost')));
  }

  // Cerrar o reabrir la inscripción, mientras todavía se pueda entrar (hasta la final)
  if (inscripcionAbierta(meta, now)) {
    poner(body, el('div', { class: 'panel stack', id: 'admin-inscripcion' },
      el('p', { class: 'lead', style: 'margin:0' }, T.joinTitle),
      el('p', { class: 'muted', style: 'margin:0' }, Lc.closed ? T.joinIsClosed : fmt(T.joinIsOpen, { n: jug.length, max: MAX_JUGADORES })),
      Lc.closed
        ? accion(`🔓 ${T.joinReopen}`, 'btn-reabrir', () => c.store.cerrarInscripcion(S.code, false))
        : accion(`🔒 ${T.joinClose}`, 'btn-cerrar-inscripcion', async () => {
          if (!confirm(T.joinCloseConfirm)) throw { code: 'cancelado' };
          await c.store.cerrarInscripcion(S.code, true);
        })));
  }

  // Terminar la copa antes (D-161): por ejemplo, si el último no va a jugar la final
  if (puedeCerrar(meta, now)) {
    const hoy = Math.min(d, meta.days);
    const quienes = [hoy - 1, hoy].filter(k => k >= 1).map(k => ({ k, falta: faltan(Lc, k, now) })).filter(x => x.falta.length);
    const quedan = hoy < meta.days;
    const errTerminar = el('div', { class: 'form-error', role: 'alert' });
    poner(body, el('div', { class: 'panel stack', id: 'admin-terminar' },
      el('p', { class: 'lead', style: 'margin:0' }, T.endTitle),
      el('p', { class: 'muted', style: 'margin:0' }, T.endLead),
      quienes.map(x => el('div', { class: 'aviso' }, fmt(x.falta.length === 1 ? T.endMissingOne : T.endMissing, { d: x.k, names: x.falta.map(j => j.name).join(', ') }))),
      quedan ? el('p', { class: 'muted', style: 'margin:0' }, T.endCancelled) : null,
      accion(`🏁 ${T.endGo}`, 'btn-terminar', async () => {
        if (!confirm(fmt(T.endConfirm, { copa: meta.name }))) throw { code: 'cancelado' };
        await c.store.terminarCopa(S.code);
        SFX.reveal(); toast(T.endDone);
      }, 'btn btn--ghost', errTerminar),
      errTerminar));
  }

  const lista = el('div', { class: 'admin-jugadores' });
  const fila = (pid, p) => {
    const fueraPor = fuera(Lc, pid, now);
    const acciones = el('div', { class: 'acciones' });
    // `attrs2`: a second field (the admin's own PIN, to give a new PIN, D-464)
    const editar = (rotulo, attrs, guardar, attrs2 = null) => {
      acciones.innerHTML = '';
      // With two fields, each takes its own line and ✓ ✕ stay together below: at 320 px ✕ wrapped alone (U-11)
      const ancho = attrs2 ? { style: 'flex-basis:100%' } : {};
      const input = el('input', { class: 'mini', ...ancho, ...attrs });
      const input2 = attrs2 ? el('input', { class: 'mini', ...ancho, ...attrs2 }) : null;
      // The error goes under the field, not after the whole player list, where it can be off screen (U-12)
      const aviso = el('div', { class: 'form-error', role: 'alert', style: 'flex-basis:100%;margin:0' });
      poner(acciones, input, input2, el('button', {
        class: 'btn btn--yellow btn--sm', onClick: async ev => {
          // Disabled while it saves: checking a PIN can take a few seconds (D-464)
          const b = ev.currentTarget; b.disabled = true;
          try { await guardar(input.value, input2?.value); err.textContent = ''; pantallaAdmin(); }
          catch (e) { if (!aviso.isConnected) acciones.append(aviso); avisoError(aviso, typeof e === 'string' ? e : errorDe(e)); }
          finally { b.disabled = false; }
        },
      }, '✓'), el('button', { class: 'btn btn--ghost btn--sm', onClick: () => pantallaAdmin() }, '✕'));
      input.focus();
    };
    const esElAdmin = pid === meta.admin;
    // Renombrar va a la derecha del nombre, en la misma línea (no gasta alto); el resto, debajo
    const renombrar = el('button', { class: 'mini-btn', onClick: () => editar(T.rename, { value: p.name, maxlength: '20', 'aria-label': fmt(T.renamePrompt, { name: p.name }) }, async v => {
        const n = limpiarNombre(v);
        if (!n) throw T.errNombre;
        if (Object.entries(Lc.players).some(([q, x]) => q !== pid && claveNombre(x.name) === claveNombre(n))) throw T.errRepetido;
        await c.store.renombrar(S.code, pid, n);
      }) }, T.rename);
    poner(acciones,
      esElAdmin ? null : el('button', { class: 'mini-btn', onClick: () => editar(T.newPin, { inputmode: 'numeric', maxlength: '4', placeholder: T.newPin, 'aria-label': fmt(T.pinPrompt, { name: p.name }) }, async (v, mio) => {
        if (!esPin(v) || !esPin(mio)) throw T.errPin;
        // The admin confirms with their own PIN (D-464): the cup one, or their player's if linked (D-359)
        const a = meta.admin, j = Lc.players[a]?.j;
        if (j && leerYo()?.jid === j) { try { await (await jugador()).probarPin(mio); } catch (e) { if (e?.code !== 'espera') throw e; } }
        await c.store.cambiarPin(S.code, pid, await hashPin(S.code, pid, v), { admin: a, adminHash: await hashPin(S.code, a, mio) });
        toast(fmt(T.pinDone, { name: p.name, pin: v }));
      }, { type: 'password', inputmode: 'numeric', maxlength: '4', autocomplete: 'off', placeholder: T.adminPin, 'aria-label': T.adminPinPrompt }) }, T.newPin),
      // Terminada la copa, sacar a alguien cambiaría el podio: ya no se ofrece
      esElAdmin || terminada(meta, now) ? null : el('button', { class: 'mini-btn', onClick: async () => {
        if (!p.out && !confirm(fmt(T.kickConfirm, { name: p.name }))) return;
        try { await c.store.sacar(S.code, pid, !p.out); } catch (e) { avisoError(err, errorDe(e)); }
      } }, p.out ? T.unkick : T.kick),
      // Out for missing two days in a row (D-347): the admin can bring them back
      fueraPor && !terminada(meta, now) ? el('button', { class: 'mini-btn', onClick: async () => {
        if (!confirm(fmt(T.bringBackConfirm, { name: p.name }))) return;
        try { await c.store.devolver(S.code, pid); } catch (e) { avisoError(err, errorDe(e)); }
      } }, T.bringBack) : null);
    const nombre = el('div', { class: 'admin-nombre' },
      el('b', {}, p.name, esElAdmin ? el('small', { class: 'muted' }, ` (${T.youAdmin})`) : null, p.out ? el('small', { class: 'muted' }, ` (${T.kicked})`) : null,
        fueraPor ? el('small', { class: 'muted' }, ` (${fmt(T.outAdmin, { a: fueraPor.desde, b: fueraPor.hasta })})`) : null), renombrar);
    return el('div', { class: 'admin-fila' + (p.out || fueraPor ? ' fuera' : '') }, nombre, acciones);
  };
  Object.entries(Lc.players || {}).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).forEach(([pid, p]) => poner(lista, fila(pid, p)));
  poner(body, el('div', { class: 'panel' }, el('p', { class: 'lead' }, T.adminPlayers), lista, err),
    el('button', { class: 'btn btn--ghost', onClick: () => { SFX.tap(); S.bienvenida = false; tablero(); } }, T.toBoard));

  // Eliminar la copa (D-117): al final, en rojo, con dos confirmaciones (la segunda, escribir el nombre)
  const errBorrar = el('div', { class: 'form-error', role: 'alert' });
  poner(body, el('div', { class: 'panel stack peligro', id: 'admin-eliminar' },
    el('p', { class: 'lead', style: 'margin:0' }, T.deleteTitle),
    el('p', { class: 'muted', style: 'margin:0' }, T.deleteLead),
    el('button', { class: 'btn btn--red', id: 'btn-eliminar', onClick: async ev => {
      SFX.tap();
      if (!confirm(fmt(T.deleteConfirm1, { copa: meta.name }))) return;
      const escrito = prompt(fmt(T.deleteConfirm2, { copa: meta.name }));
      if (escrito === null) return;
      if (claveNombre(escrito, COPA_MAX) !== claveNombre(meta.name, COPA_MAX)) { avisoError(errBorrar, T.deleteMismatch); return; }
      const b = ev.currentTarget; b.disabled = true;
      S.eliminando = true;
      try {
        await c.store.eliminar(S.code);
        const nombre = meta.name;
        cuenta.olvidar(S.code);
        if (S.off) { S.off(); S.off = null; }
        S.code = null; S.yo = null; S.L = null;
        history.replaceState(null, '', `${location.pathname}${PRUEBA ? '?test' : LABS ? '?labs' : ''}`);
        SFX.splash();
        eliminada(nombre);
      } catch (e) { S.eliminando = false; b.disabled = false; avisoError(errBorrar, errorDe(e)); }
    } }, `🗑️ ${T.deleteGo}`),
    errBorrar));
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
