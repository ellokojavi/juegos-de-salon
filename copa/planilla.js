/**
 * La Copa — la tabla final como planilla (D-161). Sin DOM: testeable con node.
 *
 * Tres bloques en un solo CSV, uno bajo el otro: la tabla final con los puntos de cada día, el
 * lugar de cada jugador después de cada día (lo mismo que dibuja el gráfico) y el detalle de cada
 * día (resultado, puntaje, tiempo, posición y puntos). Separado por punto y coma y con BOM: así
 * Excel en español lo abre en columnas y Google Sheets lo detecta solo.
 */
import { tabla, evolucion, activos, posicionesDelDia, multiplicador, esFinal, comodinDe, juegoDelDia, mmss, cerradaAntes } from './engine.js';

const SEP = ';';
const celda = v => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Las filas de la planilla (listas de celdas). `T` son los textos de rules.js, `juegos` el
 * registro MINIJUEGOS y `fecha` convierte un instante en texto legible.
 */
export function filasPlanilla(L, { T, juegos, fmt, fecha }) {
  const { meta } = L;
  const now = meta.end;
  const filas = tabla(L, null, now);
  const ev = evolucion(L, null, now);
  const dias = ev.dias;
  const nombreDia = d => {
    const J = juegos[juegoDelDia(meta, d)];
    return fmt(T.csvDay, { d, juego: J ? J.nombre : juegoDelDia(meta, d) });
  };
  const out = [];
  out.push([`🏆 ${meta.name}`]);
  out.push([fmt(cerradaAntes(meta) ? T.csvEndedEarly : T.csvEnded, { fecha: fecha(meta.end) })]);
  out.push([]);

  out.push([T.csvTable]);
  out.push([T.csvPlace, T.csvPlayer, T.csvTotal, T.csvWins, ...dias.map(nombreDia)]);
  for (const f of filas) {
    out.push([f.lugar, f.name, f.total, f.ganados, ...dias.map(d => (f.dias[d]?.jugo ? f.dias[d].pts : T.csvNotPlayed))]);
  }
  out.push([]);

  out.push([T.csvProgress]);
  out.push([T.csvPlayer, ...dias.map(nombreDia)]);
  const orden = Object.fromEntries(filas.map((f, i) => [f.pid, i]));
  for (const f of ev.filas.slice().sort((a, b) => (orden[a.pid] ?? 99) - (orden[b.pid] ?? 99))) out.push([f.name, ...f.lugares]);
  out.push([]);

  out.push([T.csvDetail]);
  out.push([T.csvDayNum, T.csvGame, T.csvPlayer, T.csvResult, T.csvScore, T.csvTime, T.csvPos, T.csvPts, T.csvDouble]);
  const pids = activos(L).map(j => j.pid);
  const nombre = Object.fromEntries(activos(L).map(j => [j.pid, j.name]));
  for (const d of dias) {
    const J = juegos[juegoDelDia(meta, d)];
    const pos = posicionesDelDia(L.results?.[d], pids);
    const jugaron = pids.filter(pid => pos[pid]).sort((a, b) => pos[a].pos - pos[b].pos || nombre[a].localeCompare(nombre[b], 'es'));
    const noJugaron = pids.filter(pid => !pos[pid]);
    for (const pid of jugaron) {
      const r = L.results[d][pid];
      const x = multiplicador(L, d, pid);
      const doble = x === 2 ? (esFinal(meta, d) ? T.csvFinal : comodinDe(L, pid) === d ? T.csvWild : '') : '';
      out.push([d, J?.nombre || juegoDelDia(meta, d), nombre[pid], r.r || r.s, r.s, mmss(Number(r.ms) || 0), pos[pid].pos, pos[pid].pts * x, doble]);
    }
    for (const pid of noJugaron) out.push([d, J?.nombre || juegoDelDia(meta, d), nombre[pid], T.csvNotPlayed, '', '', '', 0, '']);
  }
  return out;
}

/** El CSV listo para descargar. */
export function planilla(L, opciones) {
  return '﻿' + filasPlanilla(L, opciones).map(f => f.map(celda).join(SEP)).join('\r\n') + '\r\n';
}
