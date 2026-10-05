#!/usr/bin/env node
/**
 * Puebla los rankings con la historia de La Copa (D-212): el podio de cada copa terminada (para
 * el medallero) y el mejor día de cada persona en cada juego (la pestaña "Copa").
 *
 * Quien jugó antes de los rankings no tiene jugador ni PIN: queda como **jugador heredado**
 * (`jugadores/<jid>.legado = true`), uno por nombre (sin mayúsculas, tildes ni espacios de más:
 * "Pancho" y "pancho" son el mismo). La primera vez que alguien entra con ese nombre, la app le
 * pregunta si esos puntajes son suyos y, si dice que sí, se los queda con su PIN.
 *
 *   node tools/firebase/rankings-historia.mjs              # muestra lo que escribiría, sin tocar nada
 *   node tools/firebase/rankings-historia.mjs --escribir   # lo escribe (como administrador)
 *   … --con-laboratorio                                     # suma las copas creadas desde /labs/
 *
 * Se puede correr de nuevo: el jid de cada nombre sale del nombre, no se duplica nada, un podio
 * guardado no se toca y un récord solo se escribe si mejora el que hay. Las copas del
 * laboratorio no cuentan, salvo con `--con-laboratorio`: antes de que La Copa saliera al menú
 * (D-175) las copas de verdad entre amigos se creaban desde ahí. Necesita la llave de ~/.config/juegos-de-salon/firebase-admin.json.
 */
import { createHash } from 'node:crypto';
import { conCierre, terminada, juegoDelDia, tabla, activos } from '../../public/cup/engine.js';
import { SUELTOS } from '../../public/assets/js/games.js';
import { claveNombre, limpiarNombre, normalizar, esMejor, tablaId, VARIANTE_COPA, SIEMPRE, podioDe, esJid, esPais, PARTIDAS, claveOrden } from '../../public/assets/js/records.js';

const A = 'abcdefghijklmnopqrstuvwxyz0123456789';
/** El jid de un jugador heredado: sale de su nombre, así correr el guion dos veces no duplica. */
export function jidHeredado(clave) {
  const h = createHash('sha256').update(`legado:${clave}`).digest();
  return Array.from(h.subarray(0, 8), b => A[b % A.length]).join('');
}

/**
 * Lo que hay que escribir, como un PATCH de varias rutas. `base` es lo que ya está en la base:
 * `{ jugadores, records, torneoPodios }` (puede venir vacío). Puro: se prueba sin red.
 */
export function historia(torneos, base = {}, now = Date.now(), { conLab = false } = {}) {
  const sueltos = new Set(SUELTOS.map(g => g.id));
  const gente = new Map();   // clave → { jid, n, at }
  const mejores = new Map(); // `${juego}|${jid}` → { s, ms, at }
  const podios = {};
  const podiosCo = {};
  const persona = (name, at, co) => {
    const clave = claveNombre(name);
    const jid = jidHeredado(clave);
    const p = gente.get(clave) || { jid, clave, n: limpiarNombre(name) || '?', at: at || now, ultima: 0, co: null };
    if ((at || 0) >= p.ultima) { p.n = limpiarNombre(name) || p.n; p.ultima = at || 0; }
    // El país (D-219): el de la copa más reciente que lo tenga
    if (esPais(co) && (!p.co || (at || 0) >= (p.ultimaCo || 0))) { p.co = co; p.ultimaCo = at || 0; }
    p.at = Math.min(p.at, at || now);
    gente.set(clave, p);
    return p;
  };

  for (const [code, L0] of Object.entries(torneos || {})) {
    const L = conCierre(L0);
    if (!L?.meta || (L.meta.lab && !conLab)) continue;
    const jidDe = pid => {
      const x = L.players?.[pid];
      if (!x) return null;
      return esJid(x.j) ? x.j : persona(x.name, x.at, x.co).jid;
    };
    for (const [d, rs] of Object.entries(L.results || {})) {
      const juego = juegoDelDia(L.meta, Number(d));
      if (!sueltos.has(juego)) continue;
      for (const [pid, r] of Object.entries(rs || {})) {
        const jid = jidDe(pid);
        const v = normalizar({ s: r?.s, ms: r?.ms });
        if (!jid || !v) continue;
        const k = `${juego}|${jid}`;
        if (esMejor(v, mejores.get(k))) mejores.set(k, { ...v, at: r.at || L.meta.end });
      }
    }
    // Un podio ya guardado sin banderas las recibe ahora (D-219): las de la copa
    const ya = base.torneoPodios?.[code];
    if (ya) for (const [pid, x] of Object.entries(ya.p || {})) {
      const co = L.players?.[pid]?.co;
      if (!esPais(x.co) && esPais(co)) podiosCo[`torneoPodios/${code}/p/${pid}/co`] = co;
    }
    if (terminada(L.meta, now) && activos(L).length >= 2 && !ya) {
      const fin = L.meta.end;
      const jugadores = Object.fromEntries(Object.keys(L.players || {}).map(pid => [pid, { j: jidDe(pid), co: L.players[pid]?.co }]));
      const p = podioDe(tabla(L, null, fin), jugadores);
      const por = Object.keys(L.players || {})[0];
      if (Object.keys(p).length) podios[code] = { name: L.meta.name, end: Math.min(fin, now), de: activos(L).length, dias: L.meta.days, por, p, at: Math.min(fin, now) };
    }
  }

  const cambios = { ...podiosCo };
  const nombreDe = new Map();
  const paisDe = new Map();
  for (const p of gente.values()) {
    const ya = base.jugadores?.[p.jid];
    // Uno que ya alguien tomó (sin `legado`) se respeta tal cual: sus récords se suman con su nombre
    if (ya && !ya.legado) { nombreDe.set(p.jid, ya.n); paisDe.set(p.jid, esPais(ya.co) ? ya.co : null); continue; }
    nombreDe.set(p.jid, p.n);
    paisDe.set(p.jid, p.co);
    if (!ya) {
      cambios[`jugadores/${p.jid}`] = { n: p.n, at: p.at, legado: true, ...(p.co ? { co: p.co } : {}) };
      cambios[`jugadorNombres/${p.clave}/${p.jid}`] = true;
    } else if (!esPais(ya.co) && p.co) cambios[`jugadores/${p.jid}/co`] = p.co;
  }
  for (const [k, v] of mejores) {
    const [juego, jid] = k.split('|');
    const t = tablaId(juego, VARIANTE_COPA);
    const n = nombreDe.get(jid) || base.jugadores?.[jid]?.n;
    if (!n) continue;
    const co = paisDe.get(jid);
    const antes = base.records?.[t]?.[SIEMPRE]?.[jid];
    if (!esMejor(v, antes)) {
      // Ya estaba: si le falta la bandera, se le pone (D-219)
      if (antes && !esPais(antes.co) && co) cambios[`records/${t}/${SIEMPRE}/${jid}/co`] = co;
      continue;
    }
    cambios[`records/${t}/${SIEMPRE}/${jid}`] = { s: v.s, ms: v.ms, k: v.k, at: v.at, n, ...(co ? { co } : {}) };
  }
  // La tabla de partidas (D-219) con lo que cada jugador ya había jugado: la suma de sus juegos
  for (const [jid, j] of Object.entries(base.jugadores || {})) {
    const total = Object.values(j?.juegos || {}).reduce((a, x) => a + (Number(x?.n) || 0), 0);
    const antes = base.records?.[PARTIDAS]?.[SIEMPRE]?.[jid];
    if (!total || !j?.n || (antes?.s || 0) >= total) continue;
    cambios[`records/${PARTIDAS}/${SIEMPRE}/${jid}`] = { s: total, ms: 0, k: claveOrden(total, 0), at: now, n: j.n, ...(esPais(j.co) ? { co: j.co } : {}) };
  }
  for (const [code, p] of Object.entries(podios)) cambios[`torneoPodios/${code}`] = p;
  return { cambios, gente: [...gente.values()], podios, mejores };
}

/* ------------------------------------------------------------------ */
/* Desde la consola                                                    */
/* ------------------------------------------------------------------ */

const esPrincipal = import.meta.url === `file://${process.argv[1]}`;
if (esPrincipal) {
  const { token, leer } = await import('./firebase-admin.mjs');
  const { firebaseConfig } = await import('../../public/assets/js/firebase-config.js');
  const escribir = process.argv.includes('--escribir');
  const conLab = process.argv.includes('--con-laboratorio');
  const t = await token();
  const [torneos, jugadores, records, torneoPodios] = await Promise.all(['torneos', 'jugadores', 'records', 'torneoPodios'].map(r => leer(r, t)));
  const { cambios, gente, podios } = historia(torneos, { jugadores: jugadores || {}, records: records || {}, torneoPodios: torneoPodios || {} }, Date.now(), { conLab });

  const recs = Object.keys(cambios).filter(r => r.startsWith('records/'));
  const porTabla = {};
  for (const r of recs) { const tt = r.split('/')[1]; (porTabla[tt] ||= []).push(cambios[r]); }
  console.log(`Personas en la historia: ${gente.length} (${gente.map(p => p.n).join(', ')})`);
  console.log(`Jugadores heredados nuevos: ${Object.keys(cambios).filter(r => /^jugadores\//.test(r)).length}`);
  console.log(`Podios nuevos: ${Object.keys(podios).length}`);
  for (const [code, p] of Object.entries(podios)) {
    const lugar = l => Object.values(p.p).filter(x => x.l === l).map(x => x.n).join(' · ') || '—';
    console.log(`  🏆 ${p.name} (${code}): 🥇 ${lugar(1)} · 🥈 ${lugar(2)} · 🥉 ${lugar(3)}`);
  }
  console.log(`Récords de la pestaña "Copa" a escribir: ${recs.length}`);
  for (const [tt, filas] of Object.entries(porTabla).sort()) {
    const top = filas.sort((a, b) => a.k - b.k).slice(0, 3).map(f => `${f.n} ${f.s}`).join(' · ');
    console.log(`  ${tt}: ${filas.length} · ${top}`);
  }
  if (!escribir) {
    console.log('\nNo se escribió nada. Para escribirlo: node tools/firebase/rankings-historia.mjs --escribir');
  } else if (!Object.keys(cambios).length) {
    console.log('\nNada que escribir: la historia ya está.');
  } else {
    const res = await fetch(`${firebaseConfig.databaseURL}/.json?access_token=${encodeURIComponent(t)}`, { method: 'PATCH', body: JSON.stringify(cambios) });
    if (!res.ok) { console.error(`✗ No se pudo escribir (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`); process.exit(1); }
    console.log(`\n✓ Escrito: ${Object.keys(cambios).length} rutas.`);
  }
}
