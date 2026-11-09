// El guardián de los cánones (D-213): ningún juego (ALL_GAMES, C-21) se salta en silencio la estructura de
// C-2 (motor y sus tests, C-12), el gancho de pruebas de C-14 ni su especificación con la plantilla
// común de C-13. Mira los archivos de verdad, no lo que dice el registro.
// Every game walks it (C-21, D-542): a game built in cup/games/ (SUELTOS) has its engine, its tests and
// its hook in its folder there (tools/agents/game-folders.mjs: engine.js, engine.test.mjs, window.__… in
// ui.js) and its spec in docs/games/<that folder>.md. What one of them cannot meet yet is debt in
// docs/games-debt.json, a ratchet (docs/RULES.md): frozen, it only shrinks, and a stale entry fails.
// La paridad de LOCALES (es, en, pt) tampoco: la revisa i18n.test.mjs.
// Uso: node public/assets/js/games.test.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { ALL_GAMES } from './games.js';
import { allGames } from '../../../tools/agents/game-folders.mjs';

const RAIZ = new URL('../../../', import.meta.url);
const ruta = rel => new URL(rel, RAIZ);
const existe = rel => existsSync(ruta(rel));
const leer = rel => readFileSync(ruta(rel), 'utf8');

// Lo que un juego todavía no cumple, por id y por comprobación. Cada motivo cita la decisión que lo
// deja pendiente. Cuando el juego se pone al día, la excepción sobra y el test lo dice: se borra.
// Hoy no hay ninguna: Cuarto Rey, el último, se llevó al canon (D-213).
const EXCEPCIONES = {};

// La plantilla común de las especificaciones (C-13, D-213), en este orden; puede haber otras entre medio
// Each heading in Spanish or in English (D-316: a new spec is written in English)
const SECCIONES = ['Resumen', 'Reglas', 'Modos', 'Flujo', 'Protocolo de mensajes', 'Archivos', 'Excepciones a los cánones'];
const EN_INGLES = { Resumen: 'Summary', Reglas: 'Rules', Modos: 'Modes', Flujo: 'Flow', 'Protocolo de mensajes': 'Message protocol', Archivos: 'Files', 'Excepciones a los cánones': 'Exceptions to the canons' };

// El gancho de C-14: `window.__algo = …` en el game.js del juego (en el ui.js de uno hecho en cup/games/)
const CUP = 'cup/games/';
function gancho(carpeta) {
  const archivo = `public/${carpeta}/${carpeta.startsWith(CUP) ? 'ui' : 'game'}.js`;
  if (!existe(archivo)) return null;
  const m = leer(archivo).match(/^\s*window\.(__[A-Za-z_$][\w$]*)\s*=/m);
  return m ? m[1] : null;
}

// Cada comprobación devuelve null si pasa, o el motivo por el que falla
const COMPROBACIONES = {
  motor: c => existe(`public/${c}/engine.js`) ? null : `falta public/${c}/engine.js (C-2)`,
  'pruebas-del-motor': c => existe(`public/${c}/engine.test.mjs`) ? null : `falta public/${c}/engine.test.mjs (C-2, C-12)`,
  gancho: c => gancho(c) ? null : `public/${c}/${c.startsWith(CUP) ? 'ui' : 'game'}.js no expone un gancho window.__… para las pruebas (C-14)`,
  // A game in La Bodega lives in public/labs/<slug>/, but its spec is docs/games/<slug>.md (D-420)
  especificacion: (c, juego) => {
    const doc = `docs/games/${c.startsWith(CUP) ? c.slice(CUP.length) : juego.slug || c}.md`;
    if (!existe(doc)) return `falta la especificación ${doc} (C-13)`;
    const texto = leer(doc);
    let desde = -1;
    for (const s of SECCIONES) {
      const re = new RegExp(`^## (?:${s}|${EN_INGLES[s]})\\s*$`, 'gm');
      let m, en = -1;
      while ((m = re.exec(texto))) if (m.index > desde) { en = m.index; break; }
      if (en < 0) return `${doc}: falta "## ${s}" o no va en el orden de la plantilla (${SECCIONES.join(', ')}) (C-13, D-213)`;
      desde = en;
    }
    const g = gancho(c);
    if (g && !texto.includes(g)) return `${doc} no nombra el gancho ${g} (C-14, D-213)`;
    return null;
  },
};

// Las excepciones también se revisan: id que existe, comprobación que existe y una decisión citada
const ids = new Set(ALL_GAMES.map(g => g.id));
for (const [id, exc] of Object.entries(EXCEPCIONES)) {
  assert.ok(ids.has(id), `EXCEPCIONES: '${id}' no es un juego; se borra la excepción`);
  for (const [nombre, motivo] of Object.entries(exc)) {
    assert.ok(COMPROBACIONES[nombre], `EXCEPCIONES['${id}']: '${nombre}' no es una comprobación (${Object.keys(COMPROBACIONES).join(', ')})`);
    assert.match(motivo, /D-\d+/, `EXCEPCIONES['${id}'].${nombre}: el motivo tiene que citar una decisión (D-n)`);
  }
}

// The debt (a ratchet): what a game built in cup/games/ still lacks, { id, check, reason }. Frozen when
// the check reached every game (D-542); a new entry fails, so a new game is born meeting the canon.
const DEBT = JSON.parse(leer('docs/games-debt.json')).entries;
const FROZEN = new Set(['conexiones', 'letras', 'anio', 'reinas', 'tango', 'zip', 'desenredo', 'donde', 'caso', 'rutas', 'loteo', 'pintaminas', 'agentes', 'puentes', 'stick', 'stack']);
const deuda = {};
for (const d of DEBT) {
  assert.ok(FROZEN.has(d.id), `docs/games-debt.json: '${d.id}' is new debt; the list only shrinks, a new game meets the canon`);
  assert.ok(COMPROBACIONES[d.check], `docs/games-debt.json: '${d.check}' is not a check (${Object.keys(COMPROBACIONES).join(', ')})`);
  assert.ok(d.reason?.trim(), `docs/games-debt.json: ${d.id}/${d.check} needs its reason`);
  (deuda[d.id] ||= {})[d.check] = d.reason;
}

const fallas = [], malos = [];
for (const { game: g, folder } of await allGames()) {
  const carpeta = folder.replace(/^public\//, '');
  const exc = { ...EXCEPCIONES[g.id], ...deuda[g.id] };
  const suyas = [], pendientes = [];
  for (const [nombre, comprobar] of Object.entries(COMPROBACIONES)) {
    const falla = comprobar(carpeta, g);
    if (exc[nombre]) {
      if (falla) pendientes.push(nombre);
      else suyas.push(`la excepción '${nombre}' ya no hace falta (la comprobación pasa): bórrala de EXCEPCIONES en games.test.mjs o de docs/games-debt.json`);
    } else if (falla) suyas.push(falla);
  }
  const extra = pendientes.length ? ` (con excepción: ${pendientes.join(', ')})` : '';
  const g_ = gancho(carpeta);
  if (suyas.length) {
    console.log(`✗ ${g.id} (${carpeta}/)`);
    for (const f of suyas) console.log(`    ${f}`);
    fallas.push(...suyas.map(f => `${g.id}: ${f}`));
    malos.push(g.id);
  } else console.log(`✓ ${g.id} (${carpeta}/)${g_ ? ` · ${g_}` : ''}${extra}`);
}

assert.deepEqual(fallas, [], `${malos.length} juego(s) se saltan el canon: ${malos.join(', ')}`);
console.log(`games: los ${ALL_GAMES.length} juegos tienen motor, tests, gancho y especificación (o una excepción con su decisión)`);

// The "New" label (D-333): every game on the home page that was not there before D-333 brings the day it arrived
{
  const { PORTADA, esNuevo, DIAS_NUEVO, ordenPortada } = await import('./games.js');
  const YA_ESTABAN = ['copa', 'ahorcado', 'batalla-naval', 'toque-y-fama', 'linea-de-tiempo', 'dudo', 'julepe', 'cuarto-rey', 'generala',
    'conexiones', 'letras', 'anio', 'reinas', 'tango', 'zip', 'desenredo', 'donde', 'caso'];
  const sinFecha = PORTADA.filter(g => g.available && !YA_ESTABAN.includes(g.id) && !/^\d{4}-\d{2}-\d{2}$/.test(g.nuevoDesde || ''));
  assert.deepEqual(sinFecha.map(g => g.id), [], 'a new game on the home page brings `nuevoDesde: \'YYYY-MM-DD\'` (D-333)');
  const g = { nuevoDesde: '2026-10-15' };
  assert.ok(esNuevo(g, new Date('2026-10-15T09:00:00')), 'new from its day');
  assert.ok(esNuevo(g, new Date('2026-10-21T23:00:00')), `and for ${DIAS_NUEVO} days`);
  assert.ok(!esNuevo(g, new Date('2026-10-22T01:00:00')), 'and not after');
  assert.ok(!esNuevo(g, new Date('2026-10-14T23:00:00')), 'nor before');
  assert.ok(!esNuevo({}, new Date()), 'without a date it is not new');
  // D-335: while new, a game goes right after La Copa; afterwards, back to its place by popularity
  const juego = { id: 'zzz-nuevo', available: true, nuevoDesde: '2030-01-01' };
  const { ALL_GAMES: G } = await import('./games.js');
  G.push(juego);
  try {
    const dentro = ordenPortada(new Date('2030-01-02T12:00:00')).map(x => x.id);
    assert.deepEqual(dentro.slice(0, 2), ['copa', 'zzz-nuevo'], 'a new game goes right after La Copa');
    const despues = ordenPortada(new Date('2030-02-01T12:00:00')).map(x => x.id);
    assert.ok(despues.indexOf('zzz-nuevo') > 1, 'when the label goes, it goes back to its place by popularity');
  } finally { G.pop(); }
  console.log('games: the new ones carry their date for the "New" label (D-333)');
}

// Shinobi and Babel keep their "New" label 10 days from 2026-11-02 (the owner's request)
{
  const { esNuevo, PORTADA } = await import('./games.js');
  const assert = (await import('node:assert/strict')).default;
  for (const id of ['stick', 'stack']) {
    const g = PORTADA.find(x => x.id === id) || (await import('./games.js')).gameById?.(id);
    assert.ok(esNuevo(g, new Date('2026-11-11T23:00:00')), `${id}: New on its 10th day`);
    assert.ok(!esNuevo(g, new Date('2026-11-12T00:00:00')), `${id}: not on the 11th`);
  }
}

// A game can be "New" and 🔥 Popular at once (D-548): the popular ones rank by POPULARIDAD, new ones included
{
  const { populares, POPULARIDAD, POPULARES, ALL_GAMES, esNuevo } = await import('./games.js');
  const assert = (await import('node:assert/strict')).default;
  const dia = new Date('2026-11-09T12:00:00');
  const esperados = POPULARIDAD.filter(id => { const g = ALL_GAMES.find(x => x.id === id); return g?.available && !g.torneo && !g.labs && !g.bodega && !g.oculto; }).slice(0, POPULARES);
  assert.deepEqual([...populares(dia)], esperados, 'the first three of POPULARIDAD, La Copa left out');
  assert.ok(populares(dia).has('stick') && esNuevo(ALL_GAMES.find(g => g.id === 'stick'), dia), 'Shinobi is New and Popular at once');
}
