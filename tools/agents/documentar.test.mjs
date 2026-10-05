// Las comprobaciones y la memoria del agente de documentación (D-172).
// Uso: node tools/agents/documentar.test.mjs
import assert from 'node:assert/strict';
import {
  decisionesEscritas, decisionesCitadas, sinMencionar, changelogTiene, versionDe, memoriaNueva, anotarRonda, separar, rango,
  requerimientosRepetidos, usabilidadRepetidas, entradas, leerEstado, corregidas, problemasDeEstado, rutasCitadas,
} from './documentar.mjs';

let n = 0;
const caso = (nombre, fn) => { fn(); n++; };

caso('las decisiones escritas y las repetidas', () => {
  const { escritas, repetidos } = decisionesEscritas('## D-1 · a\ntexto D-9\n## D-2 · b\n## D-2 · c\n### D-3 no es título');
  assert.deepEqual([...escritas], [1, 2]);
  assert.deepEqual(repetidos, [2]);
});

caso('las decisiones que faltan entre D-1 y la más alta, y las que llegan fuera de orden', () => {
  const r = decisionesEscritas('## D-01 · a\n## D-02 · b\n## D-05 · c\n## D-04 · d\n## D-06 · e');
  assert.deepEqual(r.huecos, [3]);
  assert.deepEqual(r.desordenados, [[4, 5]]);
  assert.deepEqual(decisionesEscritas('## D-1 · a\n## D-2 · (número sin usar)\n## D-3 · c').huecos, [], 'un número sin usar no es un hueco');
  assert.deepEqual(decisionesEscritas('## D-1 · a\n## D-2 · b\n## D-2 · c').desordenados, [], 'una repetida se cuenta como repetida, no como desorden');
});

caso('los IDs repetidos de REQUERIMIENTOS y de USABILIDAD', () => {
  const req = '| ID | Requerimiento |\n|---|---|\n| RP-01 | a |\n| RP-02 | b, como RP-01 |\n| RP-01 | c |\n| CR-01 | d |';
  assert.deepEqual(requerimientosRepetidos(req), ['RP-01'], 'citar un ID en otra columna no lo repite');
  const usa = '- **U-1 · Frases.** ver U-2 · nada\n- **U-2 · Emojis**\n- **U-1 · Otra vez**';
  assert.deepEqual(usabilidadRepetidas(usa), ['U-1']);
});

const DECISIONES = [
  '## D-01 · Uno', '**Fecha:** x · **Estado:** corregida por D-03, D-04', '**Decisión:** a',
  '## D-02 · Dos', '**Fecha:** x · **Estado:** reemplazada por D-04', '**Relación:** la cambió D-04',
  '## D-03 · Tres', '**Fecha:** x · **Estado:** vigente · **Relación:** corrige D-01 (el alto) y ajusta D-02',
  '## D-04 · Cuatro', '**Fecha:** x · **Estado:** vigente', '**Relación:** reemplaza el mapa de D-02; D-09 cambia lo demás; cambia D-01',
  '## D-05 · (número sin usar)', 'Este número no se usó.',
].join('\n');

caso('cada decisión con su Estado y su Relación, en la misma línea o aparte', () => {
  const e = entradas(DECISIONES);
  assert.deepEqual(e.map(x => x.n), [1, 2, 3, 4, 5]);
  assert.equal(e[0].estado, 'corregida por D-03, D-04');
  assert.equal(e[0].relacion, null);
  assert.equal(e[2].estado, 'vigente');
  assert.equal(e[2].relacion, 'corrige D-01 (el alto) y ajusta D-02');
  assert.equal(e[1].relacion, 'la cambió D-04');
  assert.ok(e[4].sinUsar);
});

caso('el Estado es uno de los cuatro', () => {
  assert.deepEqual(leerEstado('vigente'), { tipo: 'vigente', por: [] });
  assert.deepEqual(leerEstado('derogada'), { tipo: 'derogada', por: [] });
  assert.deepEqual(leerEstado('corregida por D-66, D-77'), { tipo: 'corregida', por: [66, 77] });
  assert.deepEqual(leerEstado('reemplazada por D-213'), { tipo: 'reemplazada', por: [213] });
  for (const malo of ['vigente (en parte)', 'corregida', 'corregida por D-66 y D-77', 'superada por D-5', 'Vigente', null]) assert.equal(leerEstado(malo), null, String(malo));
});

caso('lo que una Relación cambia, corrige o reemplaza', () => {
  assert.deepEqual(corregidas('corrige D-53 y D-59'), [53, 59]);
  assert.deepEqual(corregidas('corrige D-75 (el alto) y ajusta D-76'), [75], 'lo que ajusta no cuenta');
  assert.deepEqual(corregidas('corrige D-47, D-48 y D-74'), [47, 48, 74]);
  assert.deepEqual(corregidas('reemplaza el solitario de D-27 y D-129; D-149 quita el filtro'), [27, 129], 'D-149 es quien quita');
  assert.deepEqual(corregidas('D-176 cambia la invitación'), [], 'ahí la cambia otra');
  assert.deepEqual(corregidas('cierra el paso de D-191; corrige D-47; completa D-189'), [47]);
  assert.deepEqual(corregidas('amplía D-72; desde D-205 frena el check'), []);
  assert.deepEqual(corregidas(null), []);
});

caso('un Estado fuera de los cuatro, uno que cita lo que no existe y una corrección sin marcar', () => {
  assert.deepEqual(problemasDeEstado(DECISIONES), [], 'el ejemplo está en orden');
  const mal = DECISIONES
    .replace('**Estado:** reemplazada por D-04', '**Estado:** superada')
    .replace('corregida por D-03, D-04', 'corregida por D-03, D-08')
    .replace('**Fecha:** x · **Estado:** vigente\n', '**Fecha:** x\n');
  assert.deepEqual(problemasDeEstado(mal), [
    'D-1 está corregida por D-8, que no existe',
    'D-2 tiene un Estado que no es de los cuatro: "superada"',
    'D-4 no tiene **Estado:** en docs/DECISIONES.md',
    'D-4 cambia, corrige o reemplaza D-2, y el Estado de D-2 no la nombra ("superada")',
    'D-4 cambia, corrige o reemplaza D-1, y el Estado de D-1 no la nombra ("corregida por D-03, D-08")',
  ]);
  const sinMarcar = DECISIONES.replace('reemplazada por D-04', 'vigente');
  assert.deepEqual(problemasDeEstado(sinMarcar), ['D-4 cambia, corrige o reemplaza D-2, y el Estado de D-2 no la nombra ("vigente")']);
  assert.deepEqual(problemasDeEstado(DECISIONES.replace('corregida por D-03, D-04', 'corregida por D-05')), [
    'D-1 está corregida por D-5, que no existe',
    'D-3 cambia, corrige o reemplaza D-1, y el Estado de D-1 no la nombra ("corregida por D-05")',
    'D-4 cambia, corrige o reemplaza D-1, y el Estado de D-1 no la nombra ("corregida por D-05")',
  ], 'un número sin usar no corrige nada');
});

caso('las rutas citadas, sin moldes, frases ni bloques de código', () => {
  const texto = [
    'Ver `public/hangman/engine.js:120`, `docs/CANONES.md#c-8` y `tools/e2e/`.',
    'Moldes: `docs/games/<carpeta>.md`, `public/minijuegos/…`, `tools/e2e/*.mjs`, `public/{a,b}/`.',
    'No son rutas: `public/ es el sitio`, `assets/js/i18n.js`, `node tools/e2e/ci.mjs`, `/cup/?x=1`.',
    'Con consulta: `public/cup/?practica=zip`.',
    '```bash', 'node `tools/no/existe.mjs`', '```',
  ].join('\n');
  assert.deepEqual(rutasCitadas(texto), ['public/hangman/engine.js', 'docs/CANONES.md', 'tools/e2e/', 'public/cup/']);
});

caso('las decisiones citadas, sin confundir otras siglas', () => {
  assert.deepEqual([...decisionesCitadas('ver D-12 y (D-170), no LIG-32 ni C-3 ni ID-5x')].sort(), [12, 170]);
});

caso('los guiones que su README no menciona, con o sin la carpeta', () => {
  assert.deepEqual(sinMencionar(['tools/e2e/cup/torneo.mjs', 'tools/e2e/hangman/nuevo.mjs'], 'cup/torneo.mjs'), ['tools/e2e/hangman/nuevo.mjs']);
  // tools/e2e/README.md nombra los guiones sin la carpeta
  assert.deepEqual(sinMencionar(['tools/e2e/cup/torneo.mjs'], '`node tools/e2e/cup/torneo.mjs <salida>`'), []);
  assert.deepEqual(sinMencionar(['tools/e2e/cup/torneo.mjs'], 'el guion cup/torneo.mjs'), []);
});

caso('la versión estampada y su entrada en el CHANGELOG', () => {
  assert.equal(versionDe('<script src="a.js?v=0.81.0">'), '0.81.0');
  assert.equal(versionDe('<p>sin versión</p>'), null);
  assert.ok(changelogTiene('# Changelog\n\n## 0.81.0 — 2026-10-01\n', '0.81.0'));
  assert.ok(!changelogTiene('## 0.81.10 — x', '0.81.1'), 'una versión no calza con otra que empieza igual');
  assert.ok(!changelogTiene('## 0x81y0', '0.81.0'), 'los puntos son puntos');
});

caso('anotar una ronda avanza la memoria y reemplaza lo pendiente', () => {
  let m = memoriaNueva();
  m = anotarRonda(m, { fecha: '2026-10-02', desde: null, hasta: 'aaa', pr: 'https://x/1', pendientes: ['capturas en línea'] });
  assert.equal(m.revisadoHasta, 'aaa');
  assert.deepEqual(m.pendientes, ['capturas en línea']);
  m = anotarRonda(m, { fecha: '2026-10-03', desde: 'aaa', hasta: 'bbb', pr: null });
  assert.equal(m.revisadoHasta, 'bbb');
  assert.deepEqual(m.pendientes, [], 'lo que no se vuelve a anotar ya no está pendiente');
  assert.deepEqual(m.rondas.map(r => r.hasta), ['aaa', 'bbb']);
  assert.deepEqual(m.conocidos, [], 'anotar no toca los conocidos');
});

caso('lo ya conocido no se cuenta como nuevo', () => {
  const r = separar(['D-73 está dos veces', 'falta la versión 1.0.0'], ['D-73 está dos veces']);
  assert.deepEqual(r.nuevos, ['falta la versión 1.0.0']);
  assert.deepEqual(r.viejos, ['D-73 está dos veces']);
});

caso('la memoria guarda las últimas 60 rondas', () => {
  let m = memoriaNueva();
  for (let i = 0; i < 70; i++) m = anotarRonda(m, { fecha: String(i), desde: null, hasta: String(i) });
  assert.equal(m.rondas.length, 60);
  assert.equal(m.rondas[0].hasta, '10');
});

caso('anotar dos veces la misma ronda la completa, no la duplica', () => {
  let m = anotarRonda(memoriaNueva(), { fecha: '2026-10-02', desde: null, hasta: 'aaa', pendientes: ['capturas en línea'] });
  m = anotarRonda(m, { fecha: '2026-10-02', desde: 'aaa', hasta: 'aaa', pr: 'https://x/7' });
  assert.equal(m.rondas.length, 1);
  assert.equal(m.rondas[0].pr, 'https://x/7');
  assert.equal(m.rondas[0].desde, null, 'la ronda conserva desde dónde partió');
  assert.deepEqual(m.pendientes, ['capturas en línea'], 'agregar el link no borra lo pendiente');
  assert.deepEqual(m.rondas[0].pendientes, ['capturas en línea']);
});

caso('una ronda mira main desde la memoria; un PR, su rama desde la base', () => {
  const memoria = { revisadoHasta: 'r0' };
  assert.deepEqual(rango({ desde: null, memoria, main: 'm1', head: 'h1' }), { inicio: 'r0', punta: 'm1', donde: 'main' });
  assert.deepEqual(rango({ desde: 'origin/main', memoria, main: 'm1', head: 'h1' }), { inicio: 'origin/main', punta: 'h1', donde: 'esta rama' });
});

console.log(`documentar: ${n} casos en verde`);
