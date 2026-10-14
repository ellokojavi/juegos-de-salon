// Los guiones de punta a punta, en grupos parejos (D-307): GitHub corre cada grupo en un job, uno
// tras otro dentro del job, y todos los grupos a la vez. Antes era un job por guion (58): más que
// los 20 runners que GitHub da a la vez, así que los últimos esperaban en la cola, y cada job
// pagaba ~17 s de preparación (checkout, node, Chrome).
//
// Los grupos se arman con lo que tardó cada guion de verdad (`durations.json`, en segundos): el
// más largo primero, siempre al grupo que va más liviano. Cuántos grupos: los que hagan falta
// para que ninguno pase de OBJETIVO_S (o del guion más largo, si es más), hasta MAXIMO.
//
//   node tools/e2e/groups.mjs ver                 # los grupos de hoy, con su tiempo estimado
//   node tools/e2e/groups.mjs medir [--corridas 5] # actualiza durations.json con las últimas corridas de GitHub
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const DURACIONES = join(AQUI, 'durations.json');
export const OBJETIVO_S = 270;     // ~4,5 min por grupo: con ~1 min de preparación, el check en ~6
export const MAXIMO = 18;          // y 2 runners libres de los 20, para lista y punta-a-punta
export const SIN_MEDIDA_S = 90;    // un guion nuevo, hasta que se mida
const REPO = process.env.REPO || 'ellokojavi/juegos-de-salon';

export const leerDuraciones = () => existsSync(DURACIONES) ? JSON.parse(readFileSync(DURACIONES, 'utf8')) : {};

/** Lo que tarda un trabajo (`guion` o `guion:parte`), según lo medido. */
export const duracion = (t, dur) => dur[t] ?? SIN_MEDIDA_S;

/**
 * Reparte los trabajos en grupos parejos: `[{ nombre, guiones: [...], s }]`, el más cargado primero.
 * Determinista: con las mismas duraciones salen los mismos grupos.
 */
export function agrupar(trabajos, dur, { objetivo = OBJETIVO_S, maximo = MAXIMO } = {}) {
  if (!trabajos.length) return [];
  const t = trabajos.map(g => ({ g, s: duracion(g, dur) })).sort((a, b) => b.s - a.s || a.g.localeCompare(b.g));
  const total = t.reduce((x, y) => x + y.s, 0);
  const k = Math.max(1, Math.min(maximo, t.length, Math.ceil(total / Math.max(objetivo, t[0].s))));
  const grupos = Array.from({ length: k }, () => ({ guiones: [], s: 0 }));
  for (const x of t) {
    const g = grupos.reduce((m, y) => y.s < m.s ? y : m);
    g.guiones.push(x.g); g.s += x.s;
  }
  return grupos.sort((a, b) => b.s - a.s).map((g, i) => ({
    nombre: `g${String(i + 1).padStart(2, '0')} · ${g.guiones[0]}${g.guiones.length > 1 ? ` +${g.guiones.length - 1}` : ''}`,
    guiones: g.guiones, s: Math.round(g.s),
  }));
}

/** La línea que ci.mjs deja en la corrida con lo que tardó cada guion: `::notice title=Duraciones::{json}`. */
export const AVISO = 'Duraciones';
export const leerAviso = mensaje => { try { return JSON.parse(mensaje); } catch (_) { return null; } };

const mediana = xs => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'ver') {
    // ci.mjs importa este archivo: se le pregunta aparte, para no importarlo de vuelta
    const dur = leerDuraciones();
    const grupos = JSON.parse(execFileSync(process.execPath, [join(AQUI, 'ci.mjs'), '--grupos'], { encoding: 'utf8' }))
      .map(g => ({ ...g, guiones: g.guiones.split(' ') })).map(g => ({ ...g, s: g.guiones.reduce((x, t) => x + duracion(t, dur), 0) }));
    for (const g of grupos) console.log(`${g.nombre.padEnd(48)} ${String(g.s).padStart(4)} s  ${g.guiones.join(', ')}`);
    console.log(`${grupos.length} grupos; el más largo, ${grupos[0]?.s} s`);
  } else if (cmd === 'medir') {
    const n = Number(args.includes('--corridas') ? args[args.indexOf('--corridas') + 1] : 5);
    const gh = (...a) => JSON.parse(execFileSync('gh', ['api', ...a], { encoding: 'utf8', maxBuffer: 1e8 }));
    const runs = gh(`repos/${REPO}/actions/workflows/e2e.yml/runs?status=success&per_page=30`).workflow_runs;
    const medidas = {};
    let usadas = 0;
    for (const r of runs) {
      if (usadas >= n) break;
      let alguna = false;
      for (const j of gh(`repos/${REPO}/actions/runs/${r.id}/jobs?per_page=100`).jobs) {
        for (const a of gh(`repos/${REPO}/check-runs/${j.id}/annotations`)) {
          if (a.title !== AVISO) continue;
          for (const [g, s] of Object.entries(leerAviso(a.message) || {})) (medidas[g] ||= []).push(s);
          alguna = true;
        }
      }
      if (alguna) usadas++;
    }
    if (!usadas) { console.error('ninguna corrida con duraciones todavía'); process.exit(1); }
    const dur = { ...leerDuraciones() };
    for (const [g, xs] of Object.entries(medidas)) dur[g] = Math.round(mediana(xs));
    writeFileSync(DURACIONES, JSON.stringify(Object.fromEntries(Object.entries(dur).sort()), null, 1) + '\n');
    console.log(`durations.json: ${Object.keys(medidas).length} guiones medidos en ${usadas} corrida(s)`);
  } else {
    console.error('Uso: node tools/e2e/groups.mjs ver | medir [--corridas n]');
    process.exit(1);
  }
}
