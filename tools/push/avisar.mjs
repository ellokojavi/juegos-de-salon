#!/usr/bin/env node
/**
 * Manda los avisos de La Copa que tocan ahora (D-224). Lo corre `.github/workflows/avisos.yml`
 * cada 15 minutos; también se puede correr a mano:
 *
 *   node tools/push/avisar.mjs             # manda lo que toca
 *   node tools/push/avisar.mjs --simular   # dice qué mandaría, sin mandar ni anotar nada
 *   node tools/push/avisar.mjs --prueba KQRST   # un aviso de prueba a cada celular de esa copa
 *
 * Entra a la base como administrador (la llave de la cuenta de servicio, D-122) y lee quién quiere
 * avisos (`pushCopa`), las suscripciones (`push`) y lo ya mandado (`pushEnviados`). Qué toca lo
 * decide calendario.mjs; cómo se manda, webpush.mjs. Después:
 * - junta en un aviso los días nuevos de varias copas para un mismo celular (D-229);
 * - anota cada aviso entregado en `pushEnviados/<código>/<subId>/<clave>`, para no repetirlo;
 * - borra las suscripciones que el servicio dio por muertas (404 o 410) y sus copas;
 * - limpia lo de las copas que terminaron hace más de una semana o que ya no existen;
 * - manda también los de Uno al día (`pushDia`, uno-al-dia.mjs, D-230) y los anota en
 *   `pushEnviadosDia/<subId>/<clave>`;
 * - suma lo entregado por día y tipo en `stats/prod/days/<día>/mandados/<tipo>` y deja en
 *   `stats/prod/push` la hora de la vuelta y cuántas suscripciones siguen vivas (D-233): el panel
 *   los muestra, y si la hora se atrasa, GitHub dejó de correr el workflow.
 *
 * La clave privada VAPID viene de $VAPID_PRIVADA (el secreto de GitHub); la pública, de vapid.js.
 * Sin alguna de las dos no hay nada que mandar, y sale sin error.
 */
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';
import { VAPID_PUBLICA } from '../../public/assets/js/vapid.js';
import { avisosDeCopa, avisosDePrueba, juntar } from './calendario.mjs';
import { avisosUnoAlDia, viejos } from './uno-al-dia.mjs';
import { mandar } from './webpush.mjs';

const SEMANA = 7 * 24 * 3600e3;
const DIA = 24 * 3600e3;
/** Las señales de los avisos van con las del sitio publicado (D-44): `stats/prod`. */
export const ENV_STATS = 'prod';

/**
 * Una vuelta completa, con la base y el envío inyectables (las pruebas no tocan la red).
 * `db.leer(ruta)` y `db.cambiar({ ruta: valor|null })`; `envio(sub, aviso)` → { estado, muerta }.
 */
export async function vuelta({ db, envio, now = Date.now(), simular = false, prueba = '', log = console.log }) {
  const [quiereTodo, subs, enviadosTodo] = await Promise.all([db.leer('pushCopa'), db.leer('push'), db.leer('pushEnviados')]);
  const resumen = { copas: 0, avisos: 0, entregados: 0, muertas: 0, fallas: 0, limpiadas: 0 };
  const cambios = {};
  const muertas = new Set();
  const todos = [], nombres = {}, porTipo = {};
  for (const [code, quiere] of Object.entries(quiereTodo || {})) {
    if (prueba && code !== prueba) continue;
    const copa = await db.leer(`torneos/${code}`);
    // Una copa borrada, o que terminó hace más de una semana: sus avisos ya no sirven
    if (!prueba && (!copa?.meta || now - (copa.fin || copa.meta.end) > SEMANA)) {
      cambios[`pushCopa/${code}`] = null;
      cambios[`pushEnviados/${code}`] = null;
      resumen.limpiadas++;
      continue;
    }
    resumen.copas++;
    nombres[code] = copa.meta.name;
    todos.push(...(prueba ? avisosDePrueba({ code, copa, quiere, subs: subs || {} }) : avisosDeCopa({ code, copa, quiere, subs: subs || {}, enviados: enviadosTodo?.[code] || {}, now })));
  }
  for (const p of juntar(todos, subs || {}, nombres)) {
    resumen.avisos++;
    log(`${simular ? '· mandaría' : '→'} ${p.code} ${p.pid} ${p.subId.slice(0, 8)} [${p.claves.join(',')}] ${p.aviso.body}`);
    if (simular) continue;
    let r;
    try { r = await envio(subs[p.subId], p.aviso); } catch (e) { r = { estado: 0, texto: String(e?.message || e) }; }
    if (r.estado >= 200 && r.estado < 300) {
      resumen.entregados++;
      porTipo[p.tipo] = (porTipo[p.tipo] || 0) + 1;
      for (const { code, claves } of p.porCopa) for (const c of claves) cambios[`pushEnviados/${code}/${p.subId}/${c}`] = now;
    } else if (r.muerta) {
      resumen.muertas++;
      muertas.add(p.subId);
    } else {
      resumen.fallas++;
      log(`  ✗ ${r.estado} ${r.texto || ''}`);
    }
  }
  // Uno al día (D-230): no van con la prueba de una copa
  if (!prueba) {
    const [quiereDia, enviadosDia] = await Promise.all([db.leer('pushDia'), db.leer('pushEnviadosDia')]);
    for (const p of avisosUnoAlDia({ quiere: quiereDia || {}, subs: subs || {}, enviados: enviadosDia || {}, now })) {
      resumen.avisos++;
      log(`${simular ? '· mandaría' : '→'} uno-al-día ${p.subId.slice(0, 8)} [${p.clave}] ${p.aviso.body}`);
      if (simular) continue;
      let r;
      try { r = await envio(subs[p.subId], p.aviso); } catch (e) { r = { estado: 0, texto: String(e?.message || e) }; }
      if (r.estado >= 200 && r.estado < 300) {
        resumen.entregados++;
        porTipo[`uad${p.tipo}`] = (porTipo[`uad${p.tipo}`] || 0) + 1;
        cambios[`pushEnviadosDia/${p.subId}/${p.clave}`] = now;
        if (p.borrar) { cambios[`pushDia/${p.subId}`] = null; cambios[`pushEnviadosDia/${p.subId}`] = null; }
      } else if (r.muerta) { resumen.muertas++; muertas.add(p.subId); } else { resumen.fallas++; log(`  ✗ ${r.estado} ${r.texto || ''}`); }
    }
    for (const ruta of viejos(enviadosDia || {}, now)) if (!(ruta in cambios)) cambios[ruta] = null;
    // Lo de Uno al día de una suscripción que ya no existe
    for (const subId of Object.keys(quiereDia || {})) if (!subs?.[subId]) cambios[`pushDia/${subId}`] = null;
  }
  // Una suscripción muerta se borra, con todas las copas que la usaban
  for (const subId of muertas) {
    cambios[`push/${subId}`] = null;
    cambios[`pushDia/${subId}`] = null;
    for (const [code, quiere] of Object.entries(quiereTodo || {})) {
      for (const [pid, porSub] of Object.entries(quiere || {})) if (porSub?.[subId]) cambios[`pushCopa/${code}/${pid}/${subId}`] = null;
    }
  }
  // Lo que mira el panel (D-233): lo entregado hoy por tipo, la hora de esta vuelta y las suscripciones vivas
  const dia = Math.floor(now / DIA);
  for (const [tipo, k] of Object.entries(porTipo)) cambios[`stats/${ENV_STATS}/days/${dia}/mandados/${tipo}`] = { '.sv': { increment: k } };
  cambios[`stats/${ENV_STATS}/push/vuelta`] = now;
  cambios[`stats/${ENV_STATS}/push/vivas`] = Object.keys(subs || {}).filter(s => !muertas.has(s)).length;
  cambios[`stats/${ENV_STATS}/push/torneos`] = resumen.copas;
  if (!simular) await db.cambiar(cambios);
  return resumen;
}

/** La base por REST, como administrador (los demás tools/firebase hacen lo mismo). */
async function baseReal() {
  const { token, leer } = await import('../firebase/firebase-admin.mjs');
  const t = await token();
  return {
    leer: ruta => leer(ruta, t),
    async cambiar(cambios) {
      const res = await fetch(`${firebaseConfig.databaseURL}/.json?access_token=${encodeURIComponent(t)}`, { method: 'PATCH', body: JSON.stringify(cambios) });
      if (!res.ok) throw new Error(`No se pudo anotar en la base (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const simular = process.argv.includes('--simular');
  const i = process.argv.indexOf('--prueba');
  const prueba = i > 0 ? String(process.argv[i + 1] || '').trim().toUpperCase() : '';
  if (i > 0 && !/^[A-HJ-NP-Z]{5}$/.test(prueba)) { console.error('Uso: node tools/push/avisar.mjs --prueba <código de la copa, 5 letras>'); process.exit(2); }
  const privada = process.env.VAPID_PRIVADA || '';
  if (!VAPID_PUBLICA || (!privada && !simular)) {
    console.log(`Sin clave VAPID ${VAPID_PUBLICA ? 'privada ($VAPID_PRIVADA)' : 'pública (vapid.js)'}: no hay avisos que mandar. Ver tools/push/vapid.mjs.`);
    process.exit(0);
  }
  const db = await baseReal();
  const envio = (sub, aviso) => mandar(sub, aviso, { publica: VAPID_PUBLICA, privada });
  const r = await vuelta({ db, envio, simular, prueba });
  if (prueba && !r.avisos) console.log(`La copa ${prueba} no tiene celulares con avisos activos.`);
  console.log(`${simular ? 'Simulación: ' : ''}${r.copas} copas con avisos · ${r.avisos} ${simular ? 'por mandar' : `mandados (${r.entregados} entregados, ${r.muertas} suscripciones muertas, ${r.fallas} fallas)`} · ${r.limpiadas} copas limpiadas`);
  if (r.fallas && r.fallas === r.avisos) process.exit(1);
}
