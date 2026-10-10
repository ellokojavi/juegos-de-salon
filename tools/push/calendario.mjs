/**
 * Qué aviso de La Copa toca mandar ahora, y a quién (D-224). Función pura: recibe la copa, quién
 * quiere avisos, las suscripciones y lo ya mandado, y devuelve la lista. avisar.mjs la corre cada
 * 15 minutos; las pruebas, con relojes inventados. Usa la lógica de la copa (cup/engine.js): los
 * días, sus ventanas y la tabla son los mismos que ve el jugador.
 *
 * Los avisos (docs/PWA-NOTIFICACIONES.md):
 *   dia:<d>     se abrió el día d (no la final)            si pidió "Cuando se abre un día"
 *   plazo:<d>   se va a cerrar el día d y no lo ha jugado   si pidió "Antes del cierre"
 *   final       hoy es La Gran Final                        siempre, con su lugar en la tabla
 *   fin         terminó la copa                             siempre, con quién ganó
 *   insc:<pid>  alguien se inscribió (solo al admin)        siempre
 *
 * Cuándo: en la hora de quien lo recibe (su zona va con la suscripción), nunca de noche
 * (antes de las 8:00 ni desde las 22:00). El del día, desde las 9:00; el del plazo, cuando
 * faltan 4 horas o menos, o desde las 20:00 si el cierre cae de noche para él. Cada vuelta manda
 * a lo más uno por copa y celular: el siguiente sale en la vuelta que viene.
 *
 * D-229: a lo más TOPE avisos por copa y celular en un mismo día de quien recibe; si se vencen dos
 * plazos a la vez, van en un solo aviso. Un empate en el primer lugar nombra a todos los que ganaron.
 * El del día, el plazo y la final abren ese día de la copa (`&day=<d>`), y en Android traen los
 * botones Jugar y Silenciar esta copa (`acciones`). Los días nuevos de varias copas a la vez se
 * juntan en un aviso (`juntar`, lo usa avisar.mjs).
 */
import { conCierre, diaActual, esFinal, anulado, tabla, juegoDelDia, terminada } from '../../public/cup/engine.js';
import { LOCALES, juegosCopa } from '../../public/cup/rules.js';
import { VALORES } from '../../public/assets/js/parametros.js';

/** El aviso en la URL, en inglés (`notif=deadline`, D-266); el panel lo cuenta con su tipo de siempre. */
const notif = tipo => `notif=${VALORES.notif[tipo] || tipo}`;

export const SITIO = 'https://juegosdesalon.cl/';
export const DESDE = 8, HASTA = 22, MANANA = 9, NOCHE = 20;
const HORA = 60 * 60 * 1000;
export const PLAZO_MS = 4 * HORA;
export const PLAZO_NOCHE_MS = 10 * HORA;
export const VIGENCIA_FIN = 24 * HORA;
/** A lo más estos avisos por copa y celular en un mismo día de quien recibe (D-229). */
export const TOPE = 2;
/** El orden en que se prefieren, si en una vuelta toca más de uno. */
const PRIORIDAD = ['fin', 'plazo', 'final', 'dia', 'insc'];

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));

/** "Ana y Beto", "Ana, Beto y Caro": la lista en el idioma de quien recibe. */
export const lista = (nombres, lang) => {
  try { return new Intl.ListFormat(lang, { type: 'conjunction' }).format(nombres); } catch (_) { return nombres.join(', '); }
};

/** La fecha (aaaa-mm-dd) en la zona de quien recibe; una zona inválida cuenta como UTC. */
export function fechaLocal(t, tz) {
  const f = z => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: z }).format(t);
  try { return f(tz || 'UTC'); } catch (_) { return f('UTC'); }
}

/** Cuántos avisos de esta copa le llegaron hoy (en su zona) a este celular: una entrega, un aviso. */
export function mandadosHoy(enviadosSub = {}, now, tz) {
  const hoy = fechaLocal(now, tz);
  return new Set(Object.values(enviadosSub || {}).filter(t => typeof t === 'number' && fechaLocal(t, tz) === hoy)).size;
}

/** La hora (0–23) en la zona de quien recibe el aviso; una zona inválida cuenta como UTC. */
export function horaLocal(now, tz) {
  const f = z => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: z }).format(now));
  try { return f(tz || 'UTC'); } catch (_) { return f('UTC'); }
}

/**
 * @param {string} code  el código de la copa
 * @param {object} copa  torneos/<código> tal como está en la base
 * @param {object} quiere  pushCopa/<código>: { <pid>: { <subId>: { dia, plazo, at } } }
 * @param {object} subs  push: { <subId>: { endpoint, keys, lang, tz, uid, at } }
 * @param {object} enviados  pushEnviados/<código>: { <subId>: { <clave>: at } }
 * @param {number} now
 * @returns {{ subId, pid, code, tipo, claves: string[], aviso: { title, body, url, tag, acciones? } }[]}
 */
export function avisosDeCopa({ code, copa, quiere = {}, subs = {}, enviados = {}, now }) {
  if (!copa?.meta) return [];
  const L = conCierre(copa);
  const { meta } = L;
  const url = `${SITIO}cup/?${meta.alias || code}`;
  const out = [];
  for (const [pid, porSub] of Object.entries(quiere || {})) {
    const jugador = L.players?.[pid];
    if (!jugador || jugador.out) continue;
    for (const [subId, pref] of Object.entries(porSub || {})) {
      const sub = subs[subId];
      if (!sub) continue;
      const h = horaLocal(now, sub.tz);
      if (h < DESDE || h >= HASTA) continue;
      if (mandadosHoy(enviados?.[subId], now, sub.tz) >= TOPE) continue;
      const ya = clave => !!enviados?.[subId]?.[clave];
      const lang = LOCALES[sub.lang] ? sub.lang : 'es';
      const T = LOCALES[lang];
      const titulo = `🏆 ${fmt(T.shareHead, { copa: meta.name })}`;
      const candidatos = [];
      const ord = n => fmt(T.ord, { n });

      if (terminada(meta, now)) {
        // Terminó: quién ganó y en qué lugar quedó, una vez y durante el día siguiente
        if (now - meta.end <= VIGENCIA_FIN && !ya('fin')) {
          const filas = tabla(L, pid, now);
          const mia = filas.find(f => f.pid === pid);
          if (filas.length && mia) {
            // Empate en el primer lugar (mismos puntos, días ganados y final): ganaron todos (D-229)
            const ganadores = filas.filter(f => f.lugar === 1);
            const otros = ganadores.filter(f => f.pid !== pid).map(f => f.name);
            const body = mia.lugar === 1
              ? (otros.length ? fmt(T.avMsgWinTie, { names: lista(otros, lang) }) : T.avMsgWin)
              : ganadores.length > 1 ? fmt(T.avMsgEndMany, { names: lista(ganadores.map(f => f.name), lang), pos: ord(mia.lugar) })
              : fmt(T.avMsgEnd, { name: filas[0].name, pos: ord(mia.lugar) });
            candidatos.push({ tipo: 'fin', claves: ['fin'], body, tag: `copa-${code}-fin` });
          }
        }
      } else {
        const d = diaActual(meta, now);
        const jugo = k => !!L.results?.[k]?.[pid];
        if (d >= 1 && d <= meta.days && !anulado(meta, d) && h >= MANANA && !jugo(d) && !L.started?.[d]?.[pid]) {
          if (esFinal(meta, d)) {
            if (!ya('final')) {
              const filas = tabla(L, pid, now);
              const mia = filas.find(f => f.pid === pid);
              if (mia) {
                const lider = filas[0];
                const pts = lider.total - mia.total;
                // Con desempate, el 2.º puede tener los mismos puntos que el 1.º (U-6: "1 punto")
                const msg = pts === 0 ? T.avMsgFinalTie : pts === 1 ? T.avMsgFinalOne : T.avMsgFinal;
                const body = mia.lugar === 1 ? fmt(T.avMsgFinalLead, { pos: ord(1) })
                  : fmt(msg, { pos: ord(mia.lugar), pts, lider: lider.name });
                candidatos.push({ tipo: 'final', claves: ['final'], body, tag: `copa-${code}-d${d}`, dia: d });
              }
            }
          } else if (pref.dia !== false && !ya(`dia:${d}`)) {
            const J = juegosCopa(lang)[juegoDelDia(meta, d)] || {};
            candidatos.push({ tipo: 'dia', claves: [`dia:${d}`], body: fmt(T.avMsgDay, { emoji: J.emoji || '🏆', d, juego: J.nombre || '' }), tag: `copa-${code}-d${d}`, dia: d });
          }
        }
        // El plazo: el día de hoy y el de ayer (que sigue en su día de gracia). Si se vencen los
        // dos a la vez (la final y el día anterior), van juntos en un aviso (D-229)
        if (pref.plazo !== false) {
          const vencen = [];
          for (const k of [d - 1, d]) {
            const w = meta.win[k];
            if (!w || anulado(meta, k) || jugo(k) || now < w.a || now >= w.b || ya(`plazo:${k}`)) continue;
            const quedan = w.b - now;
            if (quedan <= PLAZO_MS || (h >= NOCHE && quedan <= PLAZO_NOCHE_MS)) vencen.push({ k, horas: Math.ceil(quedan / HORA) });
          }
          if (vencen.length) {
            const horas = Math.min(...vencen.map(v => v.horas)), k = vencen[0].k;
            const body = vencen.length > 1
              ? fmt(horas <= 1 ? T.avMsgDueManyOne : T.avMsgDueMany, { h: horas, dias: lista(vencen.map(v => String(v.k)), lang) })
              : fmt(horas <= 1 ? T.avMsgDueOne : T.avMsgDue, { h: horas, d: k });
            candidatos.push({ tipo: 'plazo', claves: vencen.map(v => `plazo:${v.k}`), body, tag: `copa-${code}-d${vencen[vencen.length - 1].k}`, dia: k });
          }
        }
        // Al admin: quién se inscribió desde que pidió avisos (en el último día)
        if (pid === meta.admin) {
          const nuevos = Object.entries(L.players || {})
            .filter(([p, x]) => p !== pid && x && !x.out && (x.at || 0) > (pref.at || 0) && now - (x.at || 0) <= VIGENCIA_FIN && !ya(`insc:${p}`))
            .sort((a, b) => (a[1].at || 0) - (b[1].at || 0));
          if (nuevos.length) {
            const n = Object.values(L.players).filter(x => x && !x.out).length;
            const nombres = nuevos.map(([, x]) => x.name);
            const body = nombres.length === 1 ? fmt(T.avMsgJoin, { name: nombres[0], n }) : fmt(T.avMsgJoinMany, { names: lista(nombres, lang), n });
            candidatos.push({ tipo: 'insc', claves: nuevos.map(([p]) => `insc:${p}`), body, tag: `copa-${code}-insc` });
          }
        }
      }
      if (!candidatos.length) continue;
      candidatos.sort((a, b) => PRIORIDAD.indexOf(a.tipo) - PRIORIDAD.indexOf(b.tipo));
      const c = candidatos[0];
      // `&notif=<tipo>`: la página lo cuenta al abrirse, y el panel ve cuántos se tocan (D-233)
      const aviso = { title: titulo, body: c.body, url: `${url}&${notif(c.tipo)}`, tag: c.tag };
      if (c.dia) {
        // Abre ese día de la copa, y en Android trae los botones (D-229)
        aviso.url = `${url}&day=${c.dia}&${notif(c.tipo)}`;
        aviso.acciones = [
          { action: 'jugar', title: T.play, url: aviso.url },
          { action: 'silenciar', title: T.avMute, url: `${url}&mute` },
        ];
      }
      out.push({ subId, pid, code, tipo: c.tipo, claves: c.claves, aviso });
    }
  }
  return out;
}

/**
 * Los días nuevos de varias copas que le tocan a un mismo celular en la misma vuelta van en un
 * solo aviso (D-229): "Tienes un día nuevo en 2 copas: Los Primos y La Oficina." Abre la portada de
 * La Copa, con "Tus copas". Lo demás pasa igual. Cada uno lleva `porCopa`: qué anotar en cada copa.
 */
export function juntar(pendientes, subs = {}, nombres = {}) {
  const out = [], dias = new Map();
  for (const p of pendientes) {
    if (p.tipo === 'dia') { if (!dias.has(p.subId)) dias.set(p.subId, []); dias.get(p.subId).push(p); }
    else out.push({ ...p, porCopa: [{ code: p.code, claves: p.claves }] });
  }
  for (const [subId, ps] of dias) {
    if (ps.length === 1) { out.push({ ...ps[0], porCopa: [{ code: ps[0].code, claves: ps[0].claves }] }); continue; }
    const lang = LOCALES[subs[subId]?.lang] ? subs[subId].lang : 'es';
    const T = LOCALES[lang];
    const copas = lista(ps.map(p => nombres[p.code] || p.code), lang);
    out.push({
      subId, pid: ps.map(p => p.pid).join(','), code: ps.map(p => p.code).join(','), tipo: 'dia',
      claves: ps.flatMap(p => p.claves),
      porCopa: ps.map(p => ({ code: p.code, claves: p.claves })),
      aviso: { title: T.chip, body: fmt(T.avMsgDayMany, { n: ps.length, copas }), url: `${SITIO}cup/?${notif('copas')}`, tag: 'copas-dia' },
    });
  }
  return out;
}

/**
 * El aviso de prueba que manda el servidor (`avisar.mjs --prueba <código>`): uno a cada celular con
 * avisos de esa copa, a cualquier hora y sin anotarlo. Sirve para ver que el envío de verdad llega.
 */
export function avisosDePrueba({ code, copa, quiere = {}, subs = {} }) {
  if (!copa?.meta) return [];
  const out = [];
  for (const [pid, porSub] of Object.entries(quiere || {})) {
    for (const subId of Object.keys(porSub || {})) {
      const sub = subs[subId];
      if (!sub) continue;
      const T = LOCALES[sub.lang] || LOCALES.es;
      out.push({ subId, pid, code, tipo: 'prueba', claves: [], aviso: { title: `🏆 ${fmt(T.shareHead, { copa: copa.meta.name })}`, body: T.avTestBody, url: `${SITIO}cup/?${copa.meta.alias || code}&${notif('prueba')}`, tag: `copa-${code}-prueba` } });
    }
  }
  return out;
}
