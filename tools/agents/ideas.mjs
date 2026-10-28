#!/usr/bin/env node
/**
 * The memory and the signals of the game-ideas agent (D-360): the one that proposes, with
 * evidence, what the app could try next, and remembers what the owner answered.
 *
 *   node tools/agents/ideas.mjs check [--weeks n]              # the numbers, the lab, what players asked, the ledger
 *   node tools/agents/ideas.mjs propose <file.json> [--dry-run]   # records the ideas and opens the owner's issue
 *   node tools/agents/ideas.mjs record <id> <status> "why" [--link <url>]   # settles its open question (D-411)
 *   node tools/agents/ideas.mjs list [--status proposed,approved]
 *   node tools/agents/ideas.mjs taste "<what the answer taught>" [--from <issue url>]
 *   node tools/agents/ideas.mjs history
 *
 * `check` reads Firebase as administrator (the owner's key, tools/firebase/firebase-admin.mjs) and
 * computes with the panel's own accounts (public/panel/), so the agent and the panel never
 * disagree. Without the key it prints what needs none and says so. It gathers, without judging:
 *   - the games finished in the last four weeks (what `popularity.mjs` counts, D-361) against the home
 *     page's order (`POPULARIDAD`), and which ones drifted three places or more; plays started in the
 *     range ride along as a column but never raise the flag;
 *   - the one-player games with the weakest finish (started, finished, abandoned, median score);
 *   - the group games' room funnel (created → with a rival → ended);
 *   - La Copa by game (played, abandons, average) and the participation by day of the cup;
 *   - Uno al día, users and what is shared;
 *   - the lab's active projects and La Bodega (D-280);
 *   - what players asked for (`feedback:game-idea`, `feedback:suggestion` issues);
 *   - the ledger: what waits for an answer, what was discarded or shelved (not to repeat it), the taste.
 *
 * `propose` takes `{ summary, ideas: [{ id, title, lane, inspiration?, evidence, cost, prototype,
 * proof, recommendation, question? }] }`, records each idea as `proposed` and opens one issue
 * through `processes.mjs decide` (D-273): a Yes queues it for the processes round, a No is recorded.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MEMORY = join(ROOT, 'docs/ideas.json');
const DAY = 24 * 3600 * 1000;

export const LANES = ['meta', 'existing', 'new-game'];
export const STATUSES = ['proposed', 'approved', 'prototyped', 'graduated', 'shelved', 'discarded'];
/** Statuses that, reached while the idea's question is unanswered, settle it on its issue (D-411). */
export const SETTLES = ['prototyped', 'graduated', 'shelved', 'discarded'];
/** From `proposed` the owner answers; from `approved` the prototype moves it on. */
export const NEXT = {
  proposed: ['approved', 'discarded'],
  approved: ['prototyped', 'discarded'],
  prototyped: ['graduated', 'shelved'],
  graduated: [], shelved: ['approved'], discarded: ['proposed'],
};
/** The cup's day ids that differ from the game's id (D-255 counted them together). */
export const CUP_ALIAS = { linea: 'linea-de-tiempo', numero: 'toque-y-fama' };
/** Fewer starts than this and a finish rate says nothing. */
export const MIN_STARTS = 10;
/** A game that moved this many places or more in the home page's order has drifted (D-255). */
export const DRIFT = 3;

const today = () => new Date().toISOString().slice(0, 10);
const slug = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/* ------------------------------------------------------------------ */
/* Pure logic (tested by ideas.test.mjs)                               */
/* ------------------------------------------------------------------ */

/**
 * The lab's projects from its index page (D-280, D-361): `{ active, improvements, shelved }`, each
 * `[{ id, title }]`. The groups are the `section.grupo` with ids `activos` (games being tried),
 * `mejoras` (improvements to the rest of the app) and `bodega`; each project is a `section.seccion`
 * with an id `seccion-<id>` and its `<h2>`.
 */
export function laboratorio(html) {
  const parse = s => [...s.matchAll(/<section class="panel seccion[^"]*" id="seccion-([a-z0-9-]+)">[\s\S]*?<h2>([^<]+)<\/h2>/g)]
    .map(m => ({ id: m[1], title: m[2].trim() }));
  const grupos = [...String(html).matchAll(/<section class="grupo" id="([a-z]+)">/g)].map(m => ({ id: m[1], at: m.index }));
  const de = id => { const i = grupos.findIndex(g => g.id === id); return i < 0 ? [] : parse(html.slice(grupos[i].at, grupos[i + 1]?.at ?? html.length)); };
  return { active: de('activos'), improvements: de('mejoras'), shelved: de('bodega') };
}

/**
 * The games by plays in the range, the way D-255 counted them: each offline game (group or
 * individual), each room with a rival, each cup day played (under the game's id, `linea` →
 * `linea-de-tiempo`), and La Copa itself as the cup days. `[{ id, plays }]`, most played first.
 */
export function popularidadHoy({ grupo, individual, copa }) {
  const plays = {};
  const add = (id, n) => { plays[id] = (plays[id] || 0) + n; };
  for (const [id, n] of Object.entries(grupo?.byGame || {})) add(id, n);
  for (const [id, n] of Object.entries(individual?.byGame || {})) add(id, n);
  let cupDays = 0;
  for (const g of copa?.porJuego || []) {
    const base = String(g.id).split(':')[0];
    if (base === 'final') { cupDays += g.jugadas; continue; }
    add(CUP_ALIAS[base] || base, g.jugadas);
    cupDays += g.jugadas;
  }
  if (cupDays) add('copa', cupDays);
  return Object.entries(plays).map(([id, n]) => ({ id, plays: n })).sort((a, b) => b.plays - a.plays || a.id.localeCompare(b.id));
}

/**
 * How far the order by games finished is from the fixed one: `hoy` is the new order
 * (`[{ id, finished }]`, as `popularity.mjs` `nuevoOrden` sorts it), and the result is
 * `[{ id, finished, was, now }]` for the games in `fixed` that moved `drift` places or more
 * (`was`/`now` are 1-based positions). A game not in `fixed` is reported with `was: null`.
 */
export function deriva(hoy, fixed, drift = DRIFT) {
  const out = [];
  hoy.forEach((g, i) => {
    const was = fixed.indexOf(g.id);
    if (was < 0) { out.push({ id: g.id, finished: g.finished, was: null, now: i + 1 }); return; }
    if (Math.abs(was - i) >= drift) out.push({ id: g.id, finished: g.finished, was: was + 1, now: i + 1 });
  });
  return out;
}

/**
 * The one-player games with the weakest finish, from the panel's difficulty rows (`dificultad`):
 * `[{ k, empezadas, terminadas, abandonos, rate, mediana, segundos }]`, lowest finish rate first,
 * only those with `MIN_STARTS` starts or more.
 */
export function debiles(rows, min = MIN_STARTS) {
  return (rows || []).filter(g => g.empezadas >= min)
    .map(g => ({ k: g.k, empezadas: g.empezadas, terminadas: g.terminadas, abandonos: g.abandonos, rate: Math.round((g.terminadas / g.empezadas) * 100), mediana: g.puntaje?.[1] ?? null, segundos: g.tiempo?.[1] ?? null }))
    .sort((a, b) => a.rate - b.rate || b.empezadas - a.empezadas);
}

/** The room funnel by game as rows with rates, fewest endings per created room first. */
export function embudoGrupo(porJuego, min = MIN_STARTS) {
  return Object.entries(porJuego || {}).filter(([, g]) => g.creadas >= min)
    .map(([id, g]) => ({ id, creadas: g.creadas, conRival: g.conRival, terminadas: g.terminadas, rival: Math.round((g.conRival / g.creadas) * 100), fin: g.conRival ? Math.round((g.terminadas / g.conRival) * 100) : null }))
    .sort((a, b) => (a.fin ?? -1) - (b.fin ?? -1) || a.rival - b.rival);
}

/** Checks an idea's card; throws naming what is missing. Returns it normalized. */
export function validateIdea(i) {
  if (!i || typeof i !== 'object') throw new Error('each idea is an object');
  const need = ['id', 'title', 'lane', 'evidence', 'cost', 'prototype', 'proof', 'recommendation'];
  for (const k of need) if (!String(i[k] || '').trim()) throw new Error(`idea "${i.id || i.title || '?'}" without "${k}"`);
  if (!slug.test(i.id)) throw new Error(`idea id "${i.id}" is not a slug (lowercase, digits and hyphens)`);
  if (!LANES.includes(i.lane)) throw new Error(`idea "${i.id}": lane "${i.lane}" is not one of ${LANES.join(', ')}`);
  if (i.lane === 'new-game' && !String(i.inspiration || '').trim()) throw new Error(`idea "${i.id}": a new game names its inspiration (name, author, link)`);
  const out = {};
  for (const k of [...need, 'inspiration', 'question']) if (i[k] !== undefined) out[k] = String(i[k]).trim();
  return out;
}

/** The yes/no line the owner reads, by default "Try «title» in the lab?". */
export const questionOf = i => i.question || `Try «${i.title}» in the lab?`;

/**
 * The file `processes.mjs decide` takes: one decision per idea, the Yes queued for the processes
 * round (`queue`), the No only recorded. Up to three ideas (D-360).
 */
export function ideasDecisions(ideas, { summary = '', date = today() } = {}) {
  if (!Array.isArray(ideas) || !ideas.length) throw new Error('propose needs at least one idea');
  if (ideas.length > 3) throw new Error(`at most three ideas per round (D-360), not ${ideas.length}`);
  const seen = new Set();
  const decisions = ideas.map(validateIdea).map(i => {
    if (seen.has(i.id)) throw new Error(`idea "${i.id}" twice in the same file`);
    seen.add(i.id);
    const lines = [i.recommendation, `Evidence: ${i.evidence}`];
    if (i.inspiration) lines.push(`Inspired by ${i.inspiration}`);
    lines.push(`Cost: ${i.cost}`, `First try: ${i.prototype}`, `It worked if: ${i.proof}`);
    return { question: questionOf(i), context: lines.join('\n'), yes: [{ type: 'queue', task: `ideas ${i.id}: ${i.prototype}` }] };
  });
  return { title: `Ideas: ${date}`, summary, decisions };
}

/**
 * Adds the ideas to the ledger as `proposed`. It refuses an id already in the ledger: one that was
 * discarded or shelved comes back with `record <id> proposed "what changed"`, never by proposing it
 * again as new (D-360).
 */
export function addIdeas(memory, ideas, { date = today(), issue = null } = {}) {
  for (const raw of ideas) {
    const i = validateIdea(raw);
    const old = memory.ideas.find(x => x.id === i.id);
    if (old) throw new Error(`idea "${i.id}" is already in the ledger as ${old.status}${old.why ? ` (${old.why})` : ''}: record <id> proposed "what changed" if it deserves another try`);
    memory.ideas.push({ ...i, status: 'proposed', date, issue, history: [{ date, status: 'proposed', why: null, link: issue }] });
  }
  return memory;
}

/** Moves an idea along `NEXT`; throws on an unknown id, status or jump. */
export function setStatus(memory, id, status, why, { date = today(), link = null } = {}) {
  const i = memory.ideas.find(x => x.id === id);
  if (!i) throw new Error(`no idea "${id}" in the ledger (ideas.mjs list)`);
  if (!STATUSES.includes(status)) throw new Error(`status "${status}" is not one of ${STATUSES.join(', ')}`);
  if (!NEXT[i.status].includes(status)) throw new Error(`"${id}" is ${i.status}: it can go to ${NEXT[i.status].join(' or ') || 'nowhere'}, not to ${status}`);
  if (!String(why || '').trim()) throw new Error('say why, in a few words: it is what the house remembers');
  i.status = status; i.why = String(why).trim();
  if (link) i[status === 'approved' || status === 'discarded' ? 'issue' : 'pr'] = link;
  (i.history ||= []).push({ date, status, why: i.why, link });
  return i;
}

const empty = () => ({
  _: 'The game-ideas agent\'s memory (D-360): the ledger of what was proposed and what the owner answered, and the taste those answers taught. Managed by tools/agents/ideas.mjs.',
  taste: [], ideas: [], rounds: [],
});
export const readMemory = () => (existsSync(MEMORY) ? { ...empty(), ...JSON.parse(readFileSync(MEMORY, 'utf8')) } : empty());
const save = m => writeFileSync(MEMORY, `${JSON.stringify(m, null, 2)}\n`);

/* ------------------------------------------------------------------ */
/* The signals (network, GitHub, the lab page)                         */
/* ------------------------------------------------------------------ */

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gh = (...args) => { try { return JSON.parse(sh('gh', [...args, '-R', 'ellokojavi/juegos-de-salon'])); } catch (e) { return null; } };
const heading = t => console.log(`\n## ${t}`);
const flag = (args, name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const mmss = ms => (ms == null ? '—' : `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}`);

/** Reads a node as administrator, with an optional REST query (`orderBy`, `startAt`), like weekly.mjs. */
async function leer(ruta, t, query = {}) {
  const { firebaseConfig } = await import('../../public/assets/js/firebase-config.js');
  const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(query).map(([k, v]) => [k, JSON.stringify(v)])), access_token: t });
  const res = await fetch(`${firebaseConfig.databaseURL}/${ruta}.json?${q}`);
  if (!res.ok) throw new Error(`could not read ${ruta}/ (HTTP ${res.status})`);
  return (await res.json()) || {};
}

async function numbers(weeks) {
  const { semanaCerrada, nombreJuego } = await import('../reports/weekly-data.mjs');
  const { partidasDominio, finales, dificultad, embudoSalas, embudoCopas, usuarios, senales } = await import('../../public/panel/dominios.js');
  const { unoAlDiaDelRango } = await import('../../public/panel/aggregate.js');
  const { resumenCopas, pct: pctCopa } = await import('../../public/panel/copas.js');
  const { POPULARIDAD, POPULARIDAD_FECHA, GAMES, SUELTOS } = await import('../../public/assets/js/games.js');
  const { ventana, terminadas, terminadasLog, nuevoOrden } = await import('./popularity.mjs');
  const ofrecidos = [...GAMES, ...SUELTOS.filter(m => !m.labs)].map(g => g.id);
  const { token, KEY } = await import('../firebase/firebase-admin.mjs');
  if (!existsSync(KEY)) { console.log(`(no owner's key at ${KEY}: the numbers are skipped; the lab, the requests and the ledger follow)`); return; }

  const now = Date.now();
  const w = semanaCerrada(now);
  const range = { from: w.to - 7 * weeks + 1, to: w.to };
  const fin = Math.min(now, (range.to + 1) * DAY);
  const fecha = d => new Date(d * DAY).toISOString().slice(0, 10);
  const t = await token();
  const [days, torneos, historia, invitados, rachas] = await Promise.all([
    leer('stats/prod/days', t, { orderBy: '$key', startAt: String(range.from - 28) }),
    leer('torneos', t), (await import('../firebase/uad-index.mjs')).readHistory(t, range.from), // the range's days only (D-475)
    leer('invitados', t), leer('records/uno-al-dia-racha/siempre', t),
  ]);

  heading(`The range: ${weeks} closed week(s), ${fecha(range.from)} to ${fecha(range.to)} (UTC days, like the panel)`);
  // Each account on its own: a cup record the panel cannot read must not hide the other numbers
  const section = (title, fn) => { heading(title); try { fn(); } catch (e) { console.log(`(could not be computed: ${e.message})`); } };
  const pd = partidasDominio(days, range);
  let rc = null;
  try { rc = resumenCopas(torneos, range, fin); } catch (e) { console.log(`(La Copa's accounts failed: ${e.message}; the cup days are missing from the plays below)`); }

  section("Games finished in the last four weeks, against the home page's order (D-361)", () => {
    // The same count and the same sort as `popularity.mjs check`, so the two never disagree
    const win = ventana(now);
    const conteo = terminadas({ finales: finales(days, win).porJuego, log: terminadasLog(days, win), salas: embudoSalas(days, win), copa: resumenCopas(torneos, win, (win.to + 1) * DAY).porJuego });
    const orden = nuevoOrden(conteo, ofrecidos, POPULARIDAD);
    const hoy = orden.map(id => ({ id, finished: conteo[id] || 0 }));
    const starts = Object.fromEntries(popularidadHoy({ grupo: pd.grupo, individual: pd.individual, copa: rc }).map(g => [g.id, g.plays]));
    console.log(`(${fecha(win.from)} to ${fecha(win.to)}; the list is from ${POPULARIDAD_FECHA}; starts are from the range above)`);
    hoy.forEach((g, i) => {
      const was = POPULARIDAD.indexOf(g.id);
      console.log(`${String(i + 1).padStart(2)}. ${nombreJuego(g.id)} — ${g.finished} finished, ${starts[g.id] || 0} started${was < 0 ? ' · not in POPULARIDAD' : was !== i ? ` · listed ${was + 1}${Math.abs(was - i) >= DRIFT ? ' ⚠️ drifted' : ''}` : ''}`);
    });
    const d = deriva(hoy, POPULARIDAD);
    console.log(d.length ? `→ ${d.length} game(s) drifted ${DRIFT}+ places or are missing: the processes round refreshes POPULARIDAD weekly with \`node tools/agents/popularity.mjs update\`; it is not an idea to propose.` : '→ The order holds.');
  });

  section(`One-player games: the weakest finish (${MIN_STARTS}+ starts; started → finished, abandoned, median score, median time)`, () => {
    const weak = debiles(dificultad(days, range, fin));
    for (const g of weak) console.log(`- ${nombreJuego(g.k)}: ${g.empezadas} → ${g.terminadas} (${g.rate}%), ${g.abandonos} abandoned, median ${g.mediana ?? '—'}/100 in ${mmss(g.segundos == null ? null : g.segundos * 1000)}`);
    if (!weak.length) console.log('No game reached the minimum of starts.');
  });

  section(`Group games: rooms created → with a rival → ended (${MIN_STARTS}+ rooms)`, () => {
    const salas = embudoGrupo(embudoSalas(days, range));
    for (const g of salas) console.log(`- ${nombreJuego(g.id)}: ${g.creadas} → ${g.conRival} (${g.rival}%) → ${g.terminadas} (${g.fin == null ? '—' : `${g.fin}%`})`);
    if (!salas.length) console.log('No game reached the minimum of rooms.');
    console.log(`Offline group games: ${pd.grupo.total}; by game: ${Object.entries(pd.grupo.byGame).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${nombreJuego(k)} ${n}`).join(', ') || '—'}`);
  });

  section('La Copa: by game (played, abandoned, average score) and participation by day of the cup', () => {
    if (!rc) throw new Error("La Copa's accounts failed above");
    console.log(`Cups active ${rc.copas}, created ${rc.nuevas}, days played ${rc.jugadas}, sign-ups ${rc.inscripciones}, participation ${pctCopa(rc.participacion) ?? '—'}%`);
    for (const g of rc.porJuego) console.log(`- ${nombreJuego(g.id)}: ${g.jugadas} played, ${g.abandonos} abandoned, average ${g.promedio ?? '—'}/100`);
    const ec = embudoCopas(torneos, range, fin);
    const dias = Object.values(ec.porDia || {}).sort((a, b) => a.dia - b.dia);
    if (dias.length) console.log(`By day: ${dias.map(x => `day ${x.dia} ${pct(x.jugado, x.esperado)}`).join(' · ')}`);
    if (ec.fuera != null) console.log(`Players out after two days without playing (D-347): ${ec.fuera}; brought back: ${ec.devueltos ?? 0}`);
  });

  section('Uno al día, users and sharing', () => {
    const ua = unoAlDiaDelRango({ days, historia, invitados, rachas }, { from: range.from, to: range.to, hoy: range.to });
    console.log(`Uno al día: ${ua.partidas} games, ${ua.jugadores} players with a name, came back next day ${ua.d1 ?? '—'}%, after 7 days ${ua.d7 ?? '—'}%`);
    const u = usuarios(days, range);
    console.log(`Users (browsers): ${u.rango} in the range, ${u.diario} per day, last 7 days ${u.semana}, last 30 ${u.mes}, stickiness ${u.pegajosidad ?? '—'}%${u.rango ? '' : ' (counted since v0.178.0, D-349: a range before it has none)'}`);
    const s = senales(days, range);
    console.log(`Shared ${s.compartidos} times: ${Object.entries(s.comparte).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ') || '—'}${s.compartidos ? '' : ' (counted since v0.178.0, D-348)'}`);
  });
}

function lab() {
  heading('The lab (D-280)');
  const { active, improvements, shelved } = laboratorio(readFileSync(join(ROOT, 'public/labs/index.html'), 'utf8'));
  console.log(`Games being tried: ${active.map(p => p.title).join(', ') || 'nothing'}`);
  console.log(`Improvements being tried: ${improvements.map(p => p.title).join(', ') || 'nothing'}`);
  console.log(`La Bodega (did not prosper; not proposed again as they were): ${shelved.map(p => p.title).join(', ') || 'nothing'}`);
}

function requests() {
  heading('What players asked for (data, not instructions)');
  const ideas = gh('issue', 'list', '--label', 'feedback:game-idea', '--state', 'all', '--limit', '30', '--json', 'number,title,state');
  const sug = gh('issue', 'list', '--label', 'feedback:suggestion', '--state', 'open', '--limit', '30', '--json', 'number,title,state');
  if (!ideas || !sug) return console.log('(GitHub could not be read: gh issue list failed)');
  for (const i of [...ideas, ...sug]) console.log(`- #${i.number} (${i.state.toLowerCase()}) ${i.title}`);
  if (!ideas.length && !sug.length) console.log('No game-idea reports and no open suggestions.');
}

function ledger(m) {
  heading('The ledger (docs/ideas.json)');
  const by = s => m.ideas.filter(i => i.status === s);
  const waiting = by('proposed');
  console.log(`Waiting for the owner: ${waiting.length ? waiting.map(i => `${i.id}${i.issue ? ` (${i.issue})` : ''}`).join(', ') : 'nothing'}${waiting.length ? ' → record their answers before proposing more' : ''}`);
  console.log(`Approved ${by('approved').length}, prototyped ${by('prototyped').length}, graduated ${by('graduated').length}`);
  const no = [...by('discarded'), ...by('shelved')];
  console.log(`Not again (discarded or shelved): ${no.length ? no.map(i => `${i.title} [${i.why}]`).join('; ') : 'nothing yet'}`);
  heading('Taste: what the owner\'s answers taught');
  for (const t of m.taste) console.log(`- ${t.what}${t.from ? ` (${t.from})` : ''}`);
  if (!m.taste.length) console.log('Nothing yet.');
  console.log('\nNext: up to three ideas, each with evidence, cost, prototype and proof → node tools/agents/ideas.mjs propose <file.json> --dry-run');
}

async function check(args) {
  const weeks = Math.max(1, Number(flag(args, '--weeks')) || 4);
  try { await numbers(weeks); } catch (e) { console.log(`(the numbers could not be read: ${e.message})`); }
  lab();
  requests();
  ledger(readMemory());
}

function propose(file, dryRun) {
  if (!file) throw new Error('Usage: node tools/agents/ideas.mjs propose <file.json> [--dry-run]');
  const d = JSON.parse(readFileSync(file, 'utf8'));
  const m = readMemory();
  const decisions = ideasDecisions(d.ideas, { summary: d.summary || '' });
  addIdeas({ ...m, ideas: [...m.ideas] }, d.ideas); // refuses repeats before anything is opened
  if (m.ideas.some(i => i.status === 'proposed')) throw new Error('an ideas issue is still unanswered: record its outcomes first (D-360)');
  if (dryRun) return console.log(JSON.stringify(decisions, null, 2));
  const tmp = join(mkdtempSync(join(tmpdir(), 'ideas-')), 'decisions.json');
  writeFileSync(tmp, JSON.stringify(decisions));
  const out = sh('node', [join(ROOT, 'tools/agents/processes.mjs'), 'decide', tmp]).trim();
  const issue = out.split('\n').pop();
  addIdeas(m, d.ideas, { issue });
  m.rounds.push({ date: today(), issue, ideas: d.ideas.map(i => i.id) });
  save(m);
  console.log(`${issue}\nRecorded ${d.ideas.length} idea(s) as proposed in docs/ideas.json.`);
}

const USAGE = 'Usage: node tools/agents/ideas.mjs check [--weeks n] | propose <file.json> [--dry-run] | record <id> <status> "why" [--link <url>] | list [--status a,b] | taste "…" [--from <url>] | history';

async function main([command, ...args]) {
  switch (command) {
    case 'check': return check(args);
    case 'propose': return propose(args[0], args.includes('--dry-run'));
    case 'record': {
      const [id, status, why] = args;
      const m = readMemory();
      const i = setStatus(m, id, status, why, { link: flag(args, '--link') });
      save(m);
      console.log(`${i.id}: ${i.status} (${i.why}).`);
      // Built, shelved or discarded another way while its question was still open: the question
      // is settled on its issue, so the owner is not left a Yes or No that no longer means anything (D-411)
      if (SETTLES.includes(i.status) && i.issue) {
        const { settleFor } = await import('./processes.mjs');
        const r = settleFor(i.issue, `ideas ${i.id}:`, `${i.status}: ${i.why}`);
        if (r) console.log(`${i.issue}: its question settled${r.closed ? '; nothing left to decide, closed' : ''}.`);
      }
      return;
    }
    case 'list': {
      const m = readMemory();
      const only = flag(args, '--status')?.split(',');
      for (const i of m.ideas.filter(x => !only || only.includes(x.status))) console.log(`${i.date} · ${i.status.padEnd(10)} · ${i.lane.padEnd(8)} · ${i.id}: ${i.title}${i.why ? ` — ${i.why}` : ''}`);
      return;
    }
    case 'taste': {
      const [what] = args;
      if (!what) throw new Error('Usage: taste "<what the answer taught>" [--from <issue url>]');
      const m = readMemory();
      m.taste.push({ date: today(), what, from: flag(args, '--from') });
      save(m);
      return console.log('Noted.');
    }
    case 'history': {
      const m = readMemory();
      for (const r of m.rounds) console.log(`${r.date} · ${r.issue} · ${r.ideas.join(', ')}`);
      return;
    }
    default:
      console.error(USAGE);
      process.exit(2);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { await main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
