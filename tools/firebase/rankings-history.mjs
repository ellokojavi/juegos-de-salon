#!/usr/bin/env node
/**
 * Fills the rankings with The Cup's history (D-212): the podium of each finished cup (for the
 * medal table), each person's best day in each game (the "Cup" tab) and the cups each player is
 * in, for their "Your cups" list (D-220).
 *
 * Whoever played before the rankings has no player nor PIN: they stay as a **legacy player**
 * (`jugadores/<jid>.legado = true`), one per name (no capitals, accents or extra spaces: "Pancho"
 * and "pancho" are the same). The first time someone signs in with that name, the app asks whether
 * those scores are theirs and, if they say yes, they keep them with their PIN.
 *
 *   node tools/firebase/rankings-history.mjs              # shows what it would write, touching nothing
 *   node tools/firebase/rankings-history.mjs --write      # writes it (as administrator)
 *   … --with-labs                                         # adds the cups created from /labs/
 *   … --podiums                                           # only the podiums of finished cups nobody saved (D-450)
 *
 * It can be run again: each name's jid comes from the name, nothing is duplicated, a saved podium
 * is not touched and a record is only written if it beats the one there. The lab's cups do not
 * count, except with `--with-labs`: before The Cup reached the menu (D-175) the real cups among
 * friends were created from there. Needs the key at ~/.config/juegos-de-salon/firebase-admin.json.
 *
 * Firebase paths and fields (`torneos`, `jugadores`, `legado`, `jugadorCopas`…) are persisted data:
 * they keep their Spanish names (D-316).
 */
import { createHash } from 'node:crypto';
import { conCierre, terminada, juegoDelDia, tabla, activos } from '../../public/cup/engine.js';
import { SUELTOS } from '../../public/assets/js/games.js';
import { claveNombre, limpiarNombre, normalizar, esMejor, tablaId, VARIANTE_COPA, SIEMPRE, podioDe, esJid, esPais, PARTIDAS, claveOrden } from '../../public/assets/js/records.js';

const A = 'abcdefghijklmnopqrstuvwxyz0123456789';
/** A legacy player's jid: it comes from their name, so running the script twice does not duplicate. */
export function legacyJid(key) {
  // The `legado:` salt is part of every legacy jid already written: it never changes
  const h = createHash('sha256').update(`legado:${key}`).digest();
  return Array.from(h.subarray(0, 8), b => A[b % A.length]).join('');
}

/**
 * What has to be written, as a multi-path PATCH. `base` is what is already in the database:
 * `{ jugadores, records, torneoPodios }` (it may come empty). Pure: tested without network.
 */
export function history(cups, base = {}, now = Date.now(), { withLabs = false } = {}) {
  const standalone = new Set(SUELTOS.map(g => g.id));
  const people = new Map();  // key → { jid, n, at }
  const best = new Map();    // `${game}|${jid}` → { s, ms, at }
  const podiums = {};
  const podiumFlags = {};
  const person = (name, at, co) => {
    const key = claveNombre(name);
    const jid = legacyJid(key);
    const p = people.get(key) || { jid, key, n: limpiarNombre(name) || '?', at: at || now, latest: 0, co: null };
    if ((at || 0) >= p.latest) { p.n = limpiarNombre(name) || p.n; p.latest = at || 0; }
    // The country (D-219): the one of the most recent cup that has it
    if (esPais(co) && (!p.co || (at || 0) >= (p.latestCo || 0))) { p.co = co; p.latestCo = at || 0; }
    p.at = Math.min(p.at, at || now);
    people.set(key, p);
    return p;
  };

  for (const [code, L0] of Object.entries(cups || {})) {
    const L = conCierre(L0);
    if (!L?.meta || (L.meta.lab && !withLabs)) continue;
    const jidOf = pid => {
      const x = L.players?.[pid];
      if (!x) return null;
      return esJid(x.j) ? x.j : person(x.name, x.at, x.co).jid;
    };
    for (const [d, rs] of Object.entries(L.results || {})) {
      const game = juegoDelDia(L.meta, Number(d));
      if (!standalone.has(game)) continue;
      for (const [pid, r] of Object.entries(rs || {})) {
        const jid = jidOf(pid);
        const v = normalizar({ s: r?.s, ms: r?.ms });
        if (!jid || !v) continue;
        const k = `${game}|${jid}`;
        if (esMejor(v, best.get(k))) best.set(k, { ...v, at: r.at || L.meta.end });
      }
    }
    // A podium already saved without flags gets them now (D-219): the cup's
    const saved = base.torneoPodios?.[code];
    if (saved) for (const [pid, x] of Object.entries(saved.p || {})) {
      const co = L.players?.[pid]?.co;
      if (!esPais(x.co) && esPais(co)) podiumFlags[`torneoPodios/${code}/p/${pid}/co`] = co;
    }
    if (terminada(L.meta, now) && activos(L).length >= 2 && !saved) {
      const end = L.meta.end;
      const players = Object.fromEntries(Object.keys(L.players || {}).map(pid => [pid, { j: jidOf(pid), co: L.players[pid]?.co }]));
      const p = podioDe(tabla(L, null, end), players);
      const by = Object.keys(L.players || {})[0];
      // `de`, `dias` and `por` are the stored field names (D-316 section 6)
      if (Object.keys(p).length) podiums[code] = { name: L.meta.name, end: Math.min(end, now), de: activos(L).length, dias: L.meta.days, por: by, p, at: Math.min(end, now) };
    }
  }

  const changes = { ...podiumFlags };
  const nameOf = new Map();
  const countryOf = new Map();
  for (const p of people.values()) {
    const existing = base.jugadores?.[p.jid];
    // One someone already took (without `legado`) is respected as is: their records add up under their name
    if (existing && !existing.legado) { nameOf.set(p.jid, existing.n); countryOf.set(p.jid, esPais(existing.co) ? existing.co : null); continue; }
    nameOf.set(p.jid, p.n);
    countryOf.set(p.jid, p.co);
    if (!existing) {
      changes[`jugadores/${p.jid}`] = { n: p.n, at: p.at, legado: true, ...(p.co ? { co: p.co } : {}) };
      changes[`jugadorNombres/${p.key}/${p.jid}`] = true;
    } else if (!esPais(existing.co) && p.co) changes[`jugadores/${p.jid}/co`] = p.co;
  }
  for (const [k, v] of best) {
    const [game, jid] = k.split('|');
    const t = tablaId(game, VARIANTE_COPA);
    const n = nameOf.get(jid) || base.jugadores?.[jid]?.n;
    if (!n) continue;
    const co = countryOf.get(jid);
    const before = base.records?.[t]?.[SIEMPRE]?.[jid];
    if (!esMejor(v, before)) {
      // It was already there: if it lacks the flag, it gets it (D-219)
      if (before && !esPais(before.co) && co) changes[`records/${t}/${SIEMPRE}/${jid}/co`] = co;
      continue;
    }
    changes[`records/${t}/${SIEMPRE}/${jid}`] = { s: v.s, ms: v.ms, k: v.k, at: v.at, n, ...(co ? { co } : {}) };
  }
  // The games-played table (D-219) with what each player had already played: the sum of their games
  for (const [jid, j] of Object.entries(base.jugadores || {})) {
    const total = Object.values(j?.juegos || {}).reduce((a, x) => a + (Number(x?.n) || 0), 0);
    const before = base.records?.[PARTIDAS]?.[SIEMPRE]?.[jid];
    if (!total || !j?.n || (before?.s || 0) >= total) continue;
    changes[`records/${PARTIDAS}/${SIEMPRE}/${jid}`] = { s: total, ms: 0, k: claveOrden(total, 0), at: now, n: j.n, ...(esPais(j.co) ? { co: j.co } : {}) };
  }
  for (const [code, p] of Object.entries(podiums)) changes[`torneoPodios/${code}`] = p;
  // Each player's cups (D-220), the lab's too: the linked one and, if there is none, the legacy
  // one from their name if it exists. One already recorded is not touched.
  const exists = jid => !!base.jugadores?.[jid] || [...people.values()].some(p => p.jid === jid);
  for (const [code, L] of Object.entries(cups || {})) {
    if (!L?.meta) continue;
    for (const [pid, x] of Object.entries(L.players || {})) {
      if (!x?.name) continue;
      const jid = esJid(x.j) ? x.j : legacyJid(claveNombre(x.name));
      if (!exists(jid) || base.jugadorCopas?.[jid]?.[code]) continue;
      changes[`jugadorCopas/${jid}/${code}`] = { p: pid, at: Number(x.at) || L.meta.createdAt || now };
    }
  }
  return { changes, people: [...people.values()], podiums, best };
}

/**
 * The podiums of the finished cups that have none, as the app saves them on opening a finished cup
 * (`cup/game.js`): the app only saves one when someone opens the cup after it ends, so a cup nobody
 * reopened never reached the medal table (D-450). Only players who linked their own player carry
 * a jid; the rest add up by name, as in the app. Lab cups do not count. Pure: tested without network.
 */
export function missingPodiums(cups, saved = {}, now = Date.now()) {
  const out = {};
  for (const [code, L0] of Object.entries(cups || {})) {
    const L = conCierre(L0);
    if (!L?.meta || L.meta.lab || saved?.[code] || !terminada(L.meta, now) || activos(L).length < 2) continue;
    const p = podioDe(tabla(L, null, L.meta.end), L.players);
    const end = Math.min(L.meta.end, now);
    // `de`, `dias` and `por` are the stored field names (D-316 section 6)
    if (Object.keys(p).length) out[`torneoPodios/${code}`] = { name: L.meta.name, end, de: activos(L).length, dias: L.meta.days, por: Object.keys(L.players || {})[0], p, at: end };
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* From the console                                                    */
/* ------------------------------------------------------------------ */

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const { token, read } = await import('./firebase-admin.mjs');
  const { firebaseConfig } = await import('../../public/assets/js/firebase-config.js');
  // --escribir and --con-laboratorio: the names from before D-316
  const write = process.argv.includes('--write') || process.argv.includes('--escribir');
  const withLabs = process.argv.includes('--with-labs') || process.argv.includes('--con-laboratorio');
  const t = await token();
  if (process.argv.includes('--podiums')) {
    const [cups, saved] = await Promise.all(['torneos', 'torneoPodios'].map(r => read(r, t)));
    const changes = missingPodiums(cups, saved || {});
    for (const p of Object.values(changes)) {
      const place = l => Object.values(p.p).filter(x => x.l === l).map(x => x.n).join(' · ') || '—';
      console.log(`🏆 ${p.name}: 🥇 ${place(1)} · 🥈 ${place(2)} · 🥉 ${place(3)}`);
    }
    if (!Object.keys(changes).length) console.log('Every finished cup already has its podium.');
    else if (!write) console.log('\nNothing was written. To write it: node tools/firebase/rankings-history.mjs --podiums --write');
    else {
      const res = await fetch(`${firebaseConfig.databaseURL}/.json?access_token=${encodeURIComponent(t)}`, { method: 'PATCH', body: JSON.stringify(changes) });
      if (!res.ok) { console.error(`✗ Could not write (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`); process.exit(1); }
      console.log(`\n✓ Written: ${Object.keys(changes).length} podiums.`);
    }
    process.exit(0);
  }
  const [torneos, jugadores, records, torneoPodios, jugadorCopas] = await Promise.all(['torneos', 'jugadores', 'records', 'torneoPodios', 'jugadorCopas'].map(r => read(r, t)));
  const { changes, people, podiums } = history(torneos, { jugadores: jugadores || {}, records: records || {}, torneoPodios: torneoPodios || {}, jugadorCopas: jugadorCopas || {} }, Date.now(), { withLabs });

  const recs = Object.keys(changes).filter(r => /^records\/[^/]+\/[^/]+\/[^/]+$/.test(r));
  const flags = Object.keys(changes).filter(r => r.endsWith('/co')).length;
  const byTable = {};
  for (const r of recs) { const tt = r.split('/')[1]; (byTable[tt] ||= []).push(changes[r]); }
  console.log(`People in the history: ${people.length} (${people.map(p => p.n).join(', ')})`);
  console.log(`New legacy players: ${Object.keys(changes).filter(r => /^jugadores\//.test(r)).length}`);
  console.log(`New podiums: ${Object.keys(podiums).length}`);
  for (const [code, p] of Object.entries(podiums)) {
    const place = l => Object.values(p.p).filter(x => x.l === l).map(x => x.n).join(' · ') || '—';
    console.log(`  🏆 ${p.name} (${code}): 🥇 ${place(1)} · 🥈 ${place(2)} · 🥉 ${place(3)}`);
  }
  console.log(`Missing flags (D-219): ${flags}`);
  console.log(`Cups recorded to their players (D-220): ${Object.keys(changes).filter(r => r.startsWith('jugadorCopas/')).length}`);
  console.log(`Record rows to write: ${recs.length}`);
  for (const [tt, rows] of Object.entries(byTable).sort()) {
    const top = rows.sort((a, b) => a.k - b.k).slice(0, 3).map(f => `${f.n} ${f.s}`).join(' · ');
    console.log(`  ${tt}: ${rows.length} · ${top}`);
  }
  if (!write) {
    console.log('\nNothing was written. To write it: node tools/firebase/rankings-history.mjs --write');
  } else if (!Object.keys(changes).length) {
    console.log('\nNothing to write: the history is already there.');
  } else {
    const res = await fetch(`${firebaseConfig.databaseURL}/.json?access_token=${encodeURIComponent(t)}`, { method: 'PATCH', body: JSON.stringify(changes) });
    if (!res.ok) { console.error(`✗ Could not write (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`); process.exit(1); }
    console.log(`\n✓ Written: ${Object.keys(changes).length} paths.`);
  }
}
