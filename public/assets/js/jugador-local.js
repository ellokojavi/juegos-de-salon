/**
 * El almacén de prueba de los jugadores y sus récords (D-212): la base de datos vive en el
 * `localStorage` y hace cumplir lo mismo que las reglas de Firebase para estas ramas. Lo usan
 * las pruebas con node, los guiones de punta a punta y el sitio servido en localhost, para que
 * nada de eso escriba en los rankings de verdad.
 */
import { claveOrden, S_MAX, MS_MAX, esVictorias } from './records.js';

const DB = 'juegos-de-salon:prueba:records-db';
const UID = 'juegos-de-salon:prueba:records-uid';
const falla = code => Object.assign(new Error(code), { code });

const partes = ruta => ruta.split('/').filter(Boolean);
function leerEn(obj, ruta) {
  let o = obj;
  for (const p of partes(ruta)) { if (o == null || typeof o !== 'object') return null; o = o[p]; }
  return o ?? null;
}
function ponerEn(obj, ruta, v) {
  const ps = partes(ruta);
  let o = obj;
  for (const p of ps.slice(0, -1)) o = (o[p] && typeof o[p] === 'object') ? o[p] : (o[p] = {});
  if (v === null) delete o[ps.at(-1)]; else o[ps.at(-1)] = v;
}
const copia = x => (x == null ? null : JSON.parse(JSON.stringify(x)));

/** Resuelve `{'.sv': 'timestamp'}` y `{'.sv': {increment}}`, como el servidor. */
function resolver(v, previo, now) {
  if (v && typeof v === 'object') {
    if (v['.sv'] === 'timestamp') return now;
    if (v['.sv']?.increment) return (Number(previo) || 0) + v['.sv'].increment;
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = resolver(x, previo?.[k], now);
    return out;
  }
  return v;
}

export function crearAlmacenLocal({ storage = globalThis.localStorage, uid = null, now = () => Date.now() } = {}) {
  const db = () => { try { return JSON.parse(storage.getItem(DB)) || {}; } catch (_) { return {}; } };
  const guardar = d => { try { storage.setItem(DB, JSON.stringify(d)); } catch (_) { /* sin memoria */ } };
  const miUid = () => {
    if (uid) return uid;
    try {
      let u = storage.getItem(UID);
      if (!u) { u = `u${Math.random().toString(36).slice(2, 12)}`; storage.setItem(UID, u); }
      return u;
    } catch (_) { return 'u-sin-memoria'; }
  };

  /** Lo que las reglas revisan en cada ruta de estas ramas. `viejo` es `root`, `nuevo` es `newData`. */
  function permitido(ruta, viejo, nuevo, u) {
    const p = partes(ruta);
    const sentado = (base, jid) => leerEn(base, `jugadorSeats/${jid}/${u}`) != null;
    const [rama, a, b, c] = p;
    if (rama === 'jugadorSeats') {
      if (p.length === 2) return sentado(viejo, a) && Object.entries(leerEn(nuevo, ruta) || {}).every(([k, h]) => k === u && h === leerEn(nuevo, `jugadorKeys/${a}`));
      const h = leerEn(nuevo, ruta);
      return b === u && (h === null || h === leerEn(nuevo, `jugadorKeys/${a}`));
    }
    if (rama === 'jugadorKeys') {
      const antes = leerEn(viejo, ruta);
      const libre = !leerEn(viejo, `jugadores/${a}`) || leerEn(viejo, `jugadores/${a}/legado`) === true;
      return antes == null ? libre && sentado(nuevo, a) : sentado(viejo, a);
    }
    if (rama === 'jugadorNombres') return leerEn(viejo, ruta) == null && leerEn(nuevo, ruta) === true && sentado(nuevo, b);
    if (rama === 'jugadores') {
      if (p.length === 2) return leerEn(viejo, ruta) == null && sentado(nuevo, a);
      if (b === 'legado') return leerEn(nuevo, ruta) == null && sentado(nuevo, a);
      if (b === 'juegos') {
        if (!sentado(viejo, a)) return false;
        if (p[4] === 'n') { const antes = leerEn(viejo, ruta) || 0; return leerEn(nuevo, ruta) === antes + 1; }
        return true;
      }
      return false;
    }
    if (rama === 'records') {
      const jid = p[3];
      const r = leerEn(nuevo, ruta), antes = leerEn(viejo, ruta);
      if (!sentado(viejo, jid) || !r) return false;
      if (!(r.s >= 0 && r.s <= S_MAX && r.ms >= 0 && r.ms <= MS_MAX && r.k === claveOrden(r.s, r.ms))) return false;
      if (r.n !== leerEn(viejo, `jugadores/${jid}/n`)) return false;
      if (esVictorias(p[1]) && !(r.s === (antes?.s || 0) + 1 && r.ms === 0)) return false;
      return !antes || r.k < antes.k;
    }
    if (rama === 'torneoPodios') return leerEn(viejo, ruta) == null;
    return false;
  }

  return {
    tipo: 'local',
    listo: async () => miUid(),
    now,
    async get(ruta) { return copia(leerEn(db(), ruta)); },
    async update(cambios) {
      const viejo = db(), nuevo = copia(viejo) || {}, u = miUid(), t = now();
      for (const [ruta, v] of Object.entries(cambios)) ponerEn(nuevo, ruta, resolver(copia(v), leerEn(viejo, ruta), t));
      for (const ruta of Object.keys(cambios)) if (!permitido(ruta, viejo, nuevo, u)) throw falla('permiso');
      guardar(nuevo);
    },
    async top(t, periodo, n) {
      return Object.entries(leerEn(db(), `records/${t}/${periodo}`) || {})
        .map(([jid, r]) => ({ jid, ...r })).sort((a, b) => a.k - b.k).slice(0, n);
    },
    async vecinos(t, periodo, k, n) {
      const todas = await this.top(t, periodo, Infinity);
      return { arriba: todas.filter(f => f.k < k).slice(-n), abajo: todas.filter(f => f.k > k).slice(0, n) };
    },
    async podios(n) {
      return Object.fromEntries(Object.entries(leerEn(db(), 'torneoPodios') || {})
        .sort((a, b) => (b[1].end || 0) - (a[1].end || 0)).slice(0, n));
    },
  };
}
