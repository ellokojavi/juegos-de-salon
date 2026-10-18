/**
 * The weekly report as one printable HTML page (D-352): what `weekly.mjs` turns into a PDF. Pure:
 * it takes what `semana()` returns and gives back the page.
 */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = v => (v === null || v === undefined ? '—' : typeof v === 'number' ? v.toLocaleString('en-US') : esc(v));
const pctTxt = p => (p === null || p === undefined ? '—' : `${p}%`);
const mmss = s => (s === null || s === undefined ? '—' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);

/** "▲ 12%" in green, "▼ 8%" in pink, "new" when there was nothing the week before. */
export function cambio(c, menosEsMejor = false) {
  if (c === null) return '<span class="c">new</span>';
  if (c === 0) return '<span class="c">=</span>';
  const bien = menosEsMejor ? c < 0 : c > 0;
  return `<span class="c ${bien ? 'up' : 'down'}">${c > 0 ? '▲' : '▼'} ${Math.abs(c)}%</span>`;
}

const tablaFilas = filas => `<table class="kpi"><thead><tr><th></th><th>This week</th><th>Week before</th><th>Change</th></tr></thead><tbody>${
  filas.map(f => `<tr><td>${esc(f.nombre)}</td><td>${num(f.ahora)}</td><td>${num(f.antes)}</td><td>${cambio(f.cambio)}</td></tr>`).join('')}</tbody></table>`;
const tabla = (cols, filas) => (filas.length ? `<table><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${
  filas.map(f => `<tr>${f.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p class="muted">Nothing this week.</p>');
const lista = pares => (pares.length ? `<ul>${pares.map(([k, v]) => `<li>${esc(k)} <b>${num(v)}</b></li>`).join('')}</ul>` : '<p class="muted">Nothing this week.</p>');

const VUELTA = { nueva: 'First visit', d1: 'Next day', 'd2-7': '2–7 days', 'd8-30': '8–30 days', d31: 'Over 30 days' };
const FREC = { f1: '1 of 28 days', 'f2-3': '2–3 days', 'f4-7': '4–7 days', 'f8-14': '8–14 days', f15: '15 days or more' };

/** Three or four lines a person reads first: what moved the most and what to look at. */
export function destacados(r) {
  const out = [];
  const [norte] = r.titular;
  if (norte.cambio !== null && norte.cambio !== 0) out.push(`Games finished ${norte.cambio > 0 ? 'rose' : 'fell'} ${Math.abs(norte.cambio)}% (${num(norte.ahora)} vs. ${num(norte.antes)}).`);
  const juego = r.grupo.top[0] || r.individual.top[0];
  if (juego) out.push(`Most played: ${esc(juego.juego)} (${num(juego.n)} games).`);
  if (r.copa.filas[2].ahora) out.push(`La Copa: ${num(r.copa.filas[2].ahora)} games played, participation ${pctTxt(r.copa.participacion)}${r.copa.embudo.fuera ? `, ${num(r.copa.embudo.fuera)} left out for missing 2 days` : ''}.`);
  if (r.salud.noArranco) out.push(`⚠️ ${num(r.salud.noArranco)} page loads did not start: see Health.`);
  if (r.eventos.versiones.length) out.push(`${r.eventos.versiones.length} version${r.eventos.versiones.length === 1 ? '' : 's'} released (${r.eventos.versiones.filter(v => /\.0$/.test(v.v)).length} with something new).`);
  if (r.eventos.reportes) out.push(`${num(r.eventos.reportes)} player report${r.eventos.reportes === 1 ? '' : 's'} (🐞 and suggestions).`);
  return out;
}

/**
 * The versions of the week: the ones that brought something new (x.y.0) with what they changed,
 * and the patches only counted. A busy week has a hundred of them.
 */
function eventosVersiones(vs) {
  if (!vs.length) return '<p class="muted">No versions released this week.</p>';
  const nuevas = vs.filter(v => /\.0$/.test(v.v)), parches = vs.length - nuevas.length;
  return `<p>${vs.length} version${vs.length === 1 ? '' : 's'} released: ${nuevas.length} with something new, ${parches} patch${parches === 1 ? '' : 'es'}.</p>${
    nuevas.length ? `<ul>${nuevas.map(v => `<li><b>${esc(v.v)}</b> (${esc(v.fecha)})${v.cambios.length ? `: ${v.cambios.map(esc).join('; ')}` : ''}</li>`).join('')}</ul>` : ''}`;
}

export function htmlDelInforme(r, { generado = new Date() } = {}) {
  const maxDia = Math.max(1, ...r.porDia.map(d => d.grupo + d.individual + d.copa));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Juegos de Salón · Weekly report · ${esc(r.desde)} – ${esc(r.hasta)}</title><style>
  @page { size: A4; margin: 16mm 14mm; }
  body { font: 10.5pt/1.45 -apple-system, "Helvetica Neue", Arial, sans-serif; color: #1d1530; }
  h1 { font-size: 20pt; margin: 0; color: #4b1d8f; } h2 { font-size: 13pt; margin: 18px 0 6px; color: #4b1d8f; border-bottom: 2px solid #e6dcf7; padding-bottom: 3px; break-after: avoid; }
  .sub { color: #6b6280; margin: 2px 0 12px; } .muted { color: #6b6280; } section { break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 8px; font-variant-numeric: tabular-nums; }
  th, td { padding: 4px 6px; border-bottom: 1px solid #eee8f6; text-align: right; } th:first-child, td:first-child { text-align: left; }
  th { color: #6b6280; font-weight: 600; font-size: 9pt; } .kpi td:first-child { font-weight: 600; }
  .c { font-weight: 700; color: #6b6280; } .up { color: #1f8a3b; } .down { color: #c0245c; }
  .box { background: #f6f1fd; border-radius: 8px; padding: 8px 12px; margin: 8px 0; } .box li { margin: 2px 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; } ul { margin: 4px 0; padding-left: 18px; }
  .bar { display: inline-block; height: 8px; border-radius: 4px; vertical-align: middle; }
  footer { margin-top: 18px; color: #6b6280; font-size: 8.5pt; }
</style></head><body>
<h1>🎲 Juegos de Salón · Weekly report</h1>
<p class="sub">Week of ${esc(r.desde)} to ${esc(r.hasta)} (Sunday to Saturday, UTC days), against the week before. Live site only.</p>
<div class="box"><b>Highlights</b><ul>${destacados(r).map(x => `<li>${x}</li>`).join('') || '<li>A quiet week: no changes to report.</li>'}</ul></div>

<section><h2>Headline</h2>${tablaFilas(r.titular)}</section>

<section><h2>Day by day</h2>${tabla(['Day', 'Group', 'Individual', 'La Copa', 'Active browsers', 'Visits', ''], r.porDia.map(d => [
  esc(d.dia), num(d.grupo), num(d.individual), num(d.copa), num(d.activos), num(d.visitas),
  `<span class="bar" style="width:${Math.round(((d.grupo + d.individual + d.copa) / maxDia) * 90)}px;background:linear-gradient(90deg,#2ec4b6,#f2b134,#e0457b)"></span>`]))}</section>

<section><h2>👥 Group games</h2>${tablaFilas(r.grupo.filas)}
<p>Rooms where a rival came in: <b>${pctTxt(r.grupo.rival)}</b> · rooms that reached the end: <b>${pctTxt(r.grupo.final)}</b> · replays: <b>${num(r.grupo.otras)}</b></p>
${tabla(['Most played', 'Games'], r.grupo.top.map(g => [esc(g.juego), num(g.n)]))}</section>

<section><h2>🧍 Individual games</h2>${tablaFilas(r.individual.filas)}
${tabla(['Difficulty (finished games)', 'Started', 'Finished', 'Left halfway', 'Median score', 'Median time'], r.individual.dificultad.map(g => [esc(g.juego), num(g.empezadas), num(g.terminadas), num(g.abandonos), g.mediana === null ? '—' : `${g.mediana}/100`, mmss(g.segundos)]))}</section>

<section><h2>🏆 La Copa</h2>${tablaFilas(r.copa.filas)}
<p>Participation: <b>${pctTxt(r.copa.participacion)}</b> · cups created that started: <b>${num(r.copa.embudo.partieron)}</b> of ${num(r.copa.embudo.creadas)} · left out for missing 2 days in a row: <b>${num(r.copa.embudo.fuera)}</b>, brought back: <b>${num(r.copa.embudo.devueltos)}</b></p>
${tabla(['Cup game', 'Played', 'Unfinished', 'Average score'], r.copa.juegos.map(g => [esc(g.juego), num(g.jugadas), num(g.abandonos), g.promedio === null ? '—' : `${g.promedio}/100`]))}</section>

<section><h2>📅 One a Day</h2>${tablaFilas(r.unoAlDia.filas)}<p>Came back the next day: <b>${pctTxt(r.unoAlDia.d1)}</b> · after 7 days: <b>${pctTxt(r.unoAlDia.d7)}</b></p></section>

<section><h2>🌎 Users</h2>${tablaFilas(r.usuarios.filas)}
<p>New browsers this week: <b>${num(r.usuarios.nuevos)}</b> · stickiness: <b>${pctTxt(r.usuarios.pegajosidad)}</b>${r.usuarios.desde === null ? ' · <span class="muted">browsers are counted since D-349</span>' : ''}</p>
<div class="grid"><div><b>When they had come before</b>${lista(r.usuarios.vuelta.map(([k, v]) => [VUELTA[k] || k, v]))}</div><div><b>How often (last 28 days)</b>${lista(r.usuarios.frec.map(([k, v]) => [FREC[k] || k, v]))}</div></div></section>

<section><h2>📈 Traffic</h2>${tablaFilas(r.trafico.filas)}<p>Visits that reached a game: <b>${pctTxt(r.trafico.juegan)}</b> · visits per share (viral factor): <b>${num(r.trafico.viral)}</b></p>
<div class="grid"><div><b>Where they come from</b>${lista(r.trafico.origenes)}</div><div><b>What is shared</b>${lista(r.trafico.compartidos)}</div></div>
${tabla(['Entry page', 'Visits that started here', 'Played', 'Views'], r.trafico.paginas.map(p => [esc(p.pagina), num(p.entradas), num(p.juegan), num(p.vistas)]))}</section>

<section><h2>🩺 Health</h2><p>Loads with a failure: <b>${pctTxt(r.salud.fallas)}</b> ${r.salud.fallas !== null && r.salud.fallasAntes !== null ? cambio(r.salud.fallas - r.salud.fallasAntes, true) : ''} · loads that did not start: <b>${num(r.salud.noArranco)}</b></p>
${tabla(['Top errors', 'Pages', 'Loads'], r.salud.errores.map(e => [esc(e.mensaje).slice(0, 110), esc(e.pagina), num(e.veces)]))}</section>

<section><h2>🗓️ Events of the week</h2>
${eventosVersiones(r.eventos.versiones)}
<p>Cups created: ${r.eventos.copasNuevas.length ? r.eventos.copasNuevas.map(c => `${esc(c.nombre)} (${c.dias} days${c.lab ? ', lab' : ''})`).join(', ') : 'none'} · player reports: <b>${num(r.eventos.reportes)}</b></p></section>

<footer>Generated ${esc(generado.toISOString().slice(0, 16).replace('T', ' '))} UTC by tools/reports/weekly.mjs (D-352), with the same accounts as the panel (D-348). Days are UTC.</footer>
</body></html>`;
}
