// Las comprobaciones y la memoria del agente de documentación (D-172).
// Uso: node tools/documentar.test.mjs
import assert from 'node:assert/strict';
import { decisionesEscritas, decisionesCitadas, sinMencionar, changelogTiene, versionDe, memoriaNueva, anotarRonda, separar, rango } from './documentar.mjs';

let n = 0;
const caso = (nombre, fn) => { fn(); n++; };

caso('las decisiones escritas y las repetidas', () => {
  const { escritas, repetidos } = decisionesEscritas('## D-1 · a\ntexto D-9\n## D-2 · b\n## D-2 · c\n### D-3 no es título');
  assert.deepEqual([...escritas], [1, 2]);
  assert.deepEqual(repetidos, [2]);
});

caso('las decisiones citadas, sin confundir otras siglas', () => {
  assert.deepEqual([...decisionesCitadas('ver D-12 y (D-170), no LIG-32 ni C-3 ni ID-5x')].sort(), [12, 170]);
});

caso('lo que un texto no menciona, por ruta o por nombre', () => {
  const claude = 'node copa/engine.test.mjs\nnode panel/adapta.test.mjs';
  assert.deepEqual(sinMencionar(['copa/engine.test.mjs', 'tools/nuevo.test.mjs'], claude), ['tools/nuevo.test.mjs']);
  // tools/e2e/README.md nombra los guiones sin la carpeta
  assert.deepEqual(sinMencionar(['tools/e2e/copa.mjs'], '`node tools/e2e/copa.mjs <salida>`'), []);
  assert.deepEqual(sinMencionar(['tools/e2e/copa.mjs'], 'el guion copa.mjs'), []);
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
