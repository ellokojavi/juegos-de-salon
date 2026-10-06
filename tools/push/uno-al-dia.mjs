/**
 * Qué aviso de Uno al día toca mandar ahora, y a quién (D-230). Función pura, como calendario.mjs:
 * recibe quién pidió avisos (`pushDia`), las suscripciones (`push`) y lo ya mandado
 * (`pushEnviadosDia`), y devuelve la lista. avisar.mjs la corre cada 15 minutos.
 *
 * `pushDia/<subId>` lo escribe el celular al activar los avisos y después de cada Uno al día:
 *   { h: hora del aviso diario (0–23), d, r, w: si quiere el diario, el de la racha y el de la semana,
 *     u: el último día jugado (número desde 1970, en su fecha), c: su racha ese día, k: sus comodines,
 *     m: su mejor racha, sp/sn: la semana de su último día y cuántos días jugó en ella, at }
 *
 * Los avisos (docs/UNO-AL-DIA.md):
 *   dia:<n>      el de hoy ya está        desde su hora (h), si no ha jugado hoy
 *   racha:<n>    se corta la racha        desde las 21:00, si no ha jugado y la racha es de 2 o más
 *   semana:<s>   su semana                los lunes desde su hora, si jugó algún día la semana anterior
 *   adios        se calman solos          a los 30 días sin jugar, uno último; después se borra
 * Nunca de noche (antes de las 8:00 ni desde las 22:00) y a lo más 2 al día por celular. El aviso
 * no dice qué juego toca (decisión del dueño): la sorpresa es del dado. Con 14 días sin jugar, el
 * diario sale día por medio.
 */
import { COMMON } from '../../public/assets/js/i18n.js';
import { numeroDel, fechaDeNum, numDia, semanaDe, sumarDias } from '../../public/assets/js/uno-al-dia.js';
import { fechaLocal, horaLocal, DESDE, HASTA, SITIO } from './calendario.mjs';

export const RACHA_HORA = 21;
export const TOPE_DIA = 2;
export const CALMA_DIAS = 14;
export const ADIOS_DIAS = 30;
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));

/** La racha que sigue viva hoy: la del último día jugado si fue ayer (o anteayer, con un comodín). */
export function rachaViva(q, hoyN) {
  if (!Number.isInteger(q?.u) || !q.c) return 0;
  const faltan = hoyN - q.u - 1;              // días sin jugar entre el último y hoy
  return faltan <= 0 ? q.c : faltan <= (q.k || 0) ? q.c : 0;
}

/**
 * @param {object} quiere    pushDia: { <subId>: { h, d, r, w, u, c, k, m, sp, sn, at } }
 * @param {object} subs      push: { <subId>: { endpoint, keys, lang, tz, uid, at } }
 * @param {object} enviados  pushEnviadosDia: { <subId>: { <clave>: at } }
 * @returns {{ subId, tipo, clave, borrar?, aviso: { title, body, url, tag } }[]}
 */
export function avisosUnoAlDia({ quiere = {}, subs = {}, enviados = {}, now }) {
  const out = [];
  for (const [subId, q] of Object.entries(quiere || {})) {
    const sub = subs[subId];
    if (!sub || !q) continue;
    const tz = sub.tz, hora = horaLocal(now, tz);
    if (hora < DESDE || hora >= HASTA) continue;
    const hoy = fechaLocal(now, tz), hoyN = numDia(hoy);
    const env = enviados[subId] || {};
    // A lo más 2 al día por celular, en su fecha
    if (Object.values(env).filter(t => typeof t === 'number' && fechaLocal(t, tz) === hoy).length >= TOPE_DIA) continue;
    const lang = COMMON[sub.lang] ? sub.lang : 'es';
    const T = COMMON[lang].uad;
    // `uad<tipo>`: el panel cuenta los tocados aparte de los de La Copa, que también tienen `dia` (D-233);
    // sin guion, porque las reglas de `aviso/` y `mandados/` piden solo letras
    const url = tipo => `${SITIO}today/?aviso=uad${tipo}${lang === 'es' ? '' : `&lang=${lang}`}`;
    const jugoHoy = q.u === hoyN;
    const sinJugar = Number.isInteger(q.u) ? hoyN - q.u : 0;
    const uno = (tipo, clave, body, extra = {}) => { if (!env[clave]) out.push({ subId, tipo, clave, aviso: { title: T.avTitulo, body, url: url(tipo), tag: `uad-${tipo}` }, ...extra }); return !env[clave]; };

    // Se calman solos: a los 30 días sin jugar, uno último, y se borran
    if (sinJugar >= ADIOS_DIAS) {
      const m = Math.max(q.m || 0, q.c || 0);   // con una mejor racha de 1, "fue de 1 días" no se dice (U-6)
      uno('adios', 'adios', m >= 2 ? fmt(T.avAdios, { m }) : T.avAdiosSin, { borrar: true }); continue;
    }
    const c = rachaViva(q, hoyN);
    // El de la racha, en la noche: es el que más importa, va primero
    if (q.r !== false && !jugoHoy && c >= 2 && hora >= RACHA_HORA) {
      const quedan = 24 - hora;   // a las 21:xx, "te quedan 3 horas", redondeado hacia arriba como los de La Copa
      // Los comodines que le quedan: si ayer no jugó, uno ya se gastó para llegar a hoy
      const quedanComodines = (q.k || 0) - Math.max(0, hoyN - q.u - 1);
      if (uno('racha', `racha:${hoyN}`, fmt(quedanComodines > 0 ? T.avRachaCom : T.avRacha, { c, h: quedan }))) continue;
    }
    // La semana, los lunes: solo si jugó algún día la semana anterior
    const lunes = new Date(`${hoy}T12:00:00Z`).getUTCDay() === 1;
    const semAnterior = semanaDe(sumarDias(hoy, -7));
    if (q.w !== false && lunes && hora >= (q.h ?? 9) && q.sp === semAnterior && q.sn > 0) {
      if (uno('semana', `semana:${semAnterior}`, fmt(T.avSemana, { n: q.sn }))) continue;
    }
    // El de hoy: desde su hora, si no ha jugado; con 14 días sin jugar, día por medio
    if (q.d !== false && !jugoHoy && hora >= (q.h ?? 9) && !(sinJugar >= CALMA_DIAS && hoyN % 2)) {
      // La racha, solo de 2 o más, como el aviso de la racha: "Racha: 1 días" no se dice (U-6)
      uno('dia', `dia:${hoyN}`, c >= 2 ? fmt(T.avDia, { n: numeroDel(hoy), c }) : fmt(T.avDiaSin, { n: numeroDel(hoy) }));
    }
  }
  return out;
}

/** Lo ya mandado que tiene más de una semana: se limpia. */
export function viejos(enviados = {}, now) {
  const out = [];
  for (const [subId, porClave] of Object.entries(enviados || {})) {
    for (const [clave, t] of Object.entries(porClave || {})) if (typeof t !== 'number' || now - t > 8 * 864e5) out.push(`pushEnviadosDia/${subId}/${clave}`);
  }
  return out;
}

export { fechaDeNum };
