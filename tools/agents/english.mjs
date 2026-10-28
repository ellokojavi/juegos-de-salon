/**
 * The move to English (D-316, D-354): which names in the repo are still Spanish and what each one becomes.
 *
 *   node tools/agents/english.mjs scan        every tracked path with a Spanish word, with its proposal
 *   node tools/agents/english.mjs status      how many are left, by phase (the processes agent's round)
 *   node tools/agents/english.mjs touched [base]  the pending names among the files this branch changes
 *   node tools/agents/english.mjs decisions [n]   the decisions whose text is still Spanish (counted, not translated)
 *
 * Since D-497 there are no rename batches: a pending name is renamed only when a PR touches its
 * file anyway (`touched` says which), and historical text (decisions, CHANGELOG, old documents) is
 * history, not translated. The D-354 ratchet still stops every new Spanish name.
 *
 * The list lives in `docs/english-renames.json`: each Spanish path, the English one it becomes, its
 * D-316 phase (3 workshop, 4 app code, 5 documents) and its state (`pending`, `done`, or `keep` with
 * the reason: a persisted id, a bridge page, a proper name). `english.test.mjs` fails when a new
 * Spanish path appears that the list does not name, so the list only shrinks.
 *
 * The decisions' text is not a name: since D-394 each one is a file in docs/decisions/, and one still
 * written in Spanish (its **Decisión:** / **Por qué:** labels) is counted here and left as it is (D-497).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { readAll, kind } from './decision.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REGISTRY = join(ROOT, 'docs', 'english-renames.json');

/** Spanish words found in the repo's names, with the English word each becomes. */
export const WORDS = {
  agregar: 'add', juego: 'game', juegos: 'games', aleman: 'german', canones: 'canons', decisiones: 'decisions',
  notificaciones: 'notifications', requerimientos: 'requirements', usabilidad: 'usability', uno: 'one', al: 'a', dia: 'day',
  adapta: 'adapt', agentes: 'agents', animada: 'animated', animales: 'animals', anio: 'year', arrastre: 'drag',
  audiencia: 'audience', avisos: 'notices', azar: 'random', batalla: 'battle', naval: 'ship', buzon: 'inbox',
  capturar: 'capture', capturas: 'screenshots', catalogo: 'catalog', madera: 'wood', prueba: 'test', cancion: 'song',
  ciudades: 'cities', comida: 'food', compartir: 'share', portada: 'home', construir: 'build', conexiones: 'connections',
  copa: 'cup', copas: 'cups', cuarto: 'fourth', rey: 'king', cuenta: 'account', regresiva: '', dado: 'die', dado3d: 'die3d',
  dato: 'fact', deportes: 'sports', desenredo: 'untangle', desglose: 'breakdown', deshacer: 'undo', dibujos: 'drawings',
  dominios: 'domains', donde: 'where', dudo: 'liars-dice', factibilidad: 'feasibility', favoritos: 'favorites',
  flota: 'fleet', frases: 'phrases', futbol: 'football', globo: 'globe', grillas: 'grids', historia: 'history', hoja: 'sheet',
  huellas: 'fingerprints', idioma: 'language', puerta: 'door', instalable: 'installable', instalar: 'install',
  jugador: 'player', jugadores: 'players', jugar: 'play', julepe: 'julep', letras: 'word', linea: 'line', tiempo: 'time',
  llegada: 'arrival', loteo: 'plots', mapa: 'map', mazos: 'decks', miniatura: 'thumbnail', musica: 'music',
  navegador: 'browser', nombres: 'names', palabra: 'word', palabras: 'words', parametros: 'params', pintaminas: 'paint-mines',
  pistas: 'clues', planilla: 'scorecard', preparar: 'prepare', red: 'network', registro: 'log', reinas: 'queens',
  reportes: 'reports', rutas: 'routes', semilla: 'seed', soluciones: 'solutions', tarjeta: 'card', teclado: 'keyboard',
  tematica: 'theme', todas: 'all', vista: 'view', toque: 'bulls', fama: 'cows', tres: 'three', nuevos: 'new',
  vigia: 'watch', invitacion: 'invite', tablero: 'board', configuracion: 'setup', mesa: 'table', numero: 'number',
  secreto: 'secret', escribir: 'write', apuesta: 'bid', cambio: 'swap', pasale: 'hand-over', pase: 'handoff',
  veredicto: 'verdict', baza: 'trick', carta: 'card', destape: 'reveal', resultado: 'result', minijuego: 'minigame',
  sala: 'room', dos: 'two', celulares: 'phones', grafico: 'chart', reparto: 'deal', salud: 'health', servida: 'served',
  varios: 'several', podio: 'podium', verificado: 'verified', solitario: 'solo', pozo: 'pot', comun: 'shared',
  semana: 'week', historial: 'history', ahorcado: 'hangman', caso: 'case', cine: 'movies', sobre: 'about',
  se: '', vienen: 'coming', cositas: 'soon', proximamente: 'coming-soon', el: '', de: '', la: '', a: '', y: 'and', con: 'with', sin: 'without',
};
/** Short or shared words: they don't make a name Spanish on their own, but are translated inside one that is. */
const AMBIGUOUS = new Set(['de', 'a', 'el', 'la', 'se', 'y', 'con', 'sin', 'al', 'uno', 'dos', 'tres', 'red', 'sobre', 'cine', 'naval']);

/** The tokens of a path segment: `uno-al-dia-ui.js` → uno, al, dia, ui; `jugadorFirebase` → jugador, firebase. */
export const tokens = seg => seg.replace(/\.[a-z0-9.]+$/i, '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/** Whether a path segment has a Spanish word (one that is not also English). */
export const isSpanish = seg => tokens(seg).some(t => t in WORDS && !AMBIGUOUS.has(t));

/** The English name proposed for a segment, word by word (the human reviews it before renaming). */
export function propose(seg) {
  const ext = (seg.match(/\.[a-z0-9.]+$/i) || [''])[0];
  const base = seg.slice(0, seg.length - ext.length);
  const out = base.split(/([-_./])/).map(p => {
    const low = p.toLowerCase();
    return low in WORDS ? WORDS[low] : p;
  }).join('').replace(/--+/g, '-').replace(/^-|-$/g, '').replace(/-([-_.])/g, '$1');
  return (/^[A-Z0-9-]+$/.test(base) ? out.toUpperCase() : out) + ext;
}

/** The phase of D-316 a path belongs to: 3 the workshop, 4 the app code, 5 the documents. */
export const phaseOf = path => (path.startsWith('public/') ? 4 : /^docs\/|\.md$/.test(path) ? 5 : 3);

/** Every tracked path, with the generated bridge pages left out (they follow their game, D-192). */
export function trackedPaths(git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' })) {
  return git('ls-files').split('\n').filter(Boolean).filter(p => !/^public\/(ahorcado|copa|minijuegos|minigames)\//.test(p));
}

/** Each Spanish path (a file, or a folder once) with its proposal, phase and state from the registry. */
export function scan(paths, registry = {}) {
  const found = new Map();
  for (const p of paths) {
    const segs = p.split('/');
    segs.forEach((seg, i) => {
      if (!isSpanish(seg)) return;
      const path = segs.slice(0, i + 1).join('/') + (i < segs.length - 1 ? '/' : '');
      if (found.has(path)) return;
      const r = registry[path] || {};
      found.set(path, { path, to: r.to || segs.slice(0, i).join('/') + (i ? '/' : '') + propose(seg) + (i < segs.length - 1 ? '/' : ''), phase: r.phase || phaseOf(path), state: r.state || 'unlisted', why: r.why });
    });
  }
  return [...found.values()];
}

export const readRegistry = () => JSON.parse(readFileSync(REGISTRY, 'utf8')).paths;

/** The decisions whose text is still Spanish (D-394): in force first, then by number. */
export const spanishDecisions = (root = ROOT) => readAll(root)
  .filter(d => /\*\*(Decisión|Por qué|Consecuencias|Contexto):\*\*/.test(d.body || ''))
  .sort((a, b) => (['current', 'amended'].includes(kind(b)) - ['current', 'amended'].includes(kind(a))) || a.n - b.n);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2] || 'status';
  const rows = scan(trackedPaths(), readRegistry());
  const left = rows.filter(r => r.state !== 'done' && r.state !== 'keep');
  if (cmd === 'scan') {
    for (const r of rows) console.log(`${r.state.padEnd(8)} phase ${r.phase}  ${r.path}  →  ${r.state === 'keep' ? `(keeps: ${r.why})` : r.to}`);
  } else if (cmd === 'status') {
    const by = n => left.filter(r => r.phase === n).length;
    console.log(`English (D-316): ${left.length} Spanish names left — phase 3 (workshop) ${by(3)}, phase 4 (app code) ${by(4)}, phase 5 (documents) ${by(5)}; ${rows.filter(r => r.state === 'keep').length} kept on purpose`);
    const unlisted = rows.filter(r => r.state === 'unlisted');
    if (unlisted.length) console.log(`✗ ${unlisted.length} not in docs/english-renames.json: ${unlisted.map(r => r.path).join(', ')}`);
    console.log(`Decisions still written in Spanish: ${spanishDecisions().length}, kept as history (D-497). Renames happen only when a PR touches the file: english.mjs touched`);
  } else if (cmd === 'touched') {
    const base = process.argv[3] || 'origin/main';
    const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
    const hits = left.filter(r => changed.some(f => r.path.endsWith('/') ? f.startsWith(r.path) : f === r.path));
    console.log(hits.length ? `This branch touches ${hits.length} pending Spanish name(s); rename them in this PR if it is cheap (git mv, every reference, its bridge page if it is a URL; D-497):\n${hits.map(r => `  ${r.path}  →  ${r.to}`).join('\n')}` : 'No pending Spanish name among the files this branch touches.');
  } else if (cmd === 'decisions') {
    const batch = spanishDecisions().slice(0, Number(process.argv[3]) || 20);
    console.log(batch.length ? `Decisions still in Spanish (history, not translated since D-497):\n${batch.map(d => `  docs/decisions/${d.file}  ${d.title}`).join('\n')}` : 'Every decision is in English.');
  } else { console.error('usage: english.mjs scan | status | touched [base] | decisions [n]'); process.exit(2); }
}
