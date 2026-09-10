// Temáticas de Línea de Tiempo: que se elijan fácil y que no se repitan las cartas (D-34)
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:8765';
const b = await launch({ port: 9498, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });

await b.go(`${BASE}/linea-de-tiempo/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/linea-de-tiempo/`, 1500);

// --- Mazos bien formados ---
const mazos = await b.evaluate(`import('${BASE}/linea-de-tiempo/decks/index.js').then(m => JSON.stringify(m.DECKS.map(d => {
  const ids = d.cards.map(c => c.id);
  return { id: d.id, emoji: d.emoji, nombre: d.name.es, pista: d.hint.es, cartas: d.cards.length,
    repetidos: ids.length - new Set(ids).size,
    incompletas: d.cards.filter(c => !c.id || !c.year || !c.emoji || !c.es || !c.en).length,
    rango: [Math.min(...d.cards.map(c => c.year)), Math.max(...d.cards.map(c => c.year))] };
})))`).then(JSON.parse);
for (const m of mazos) console.log(`${m.emoji} ${m.nombre}: ${m.cartas} cartas · ${m.pista} · ${m.rango[0]} a ${m.rango[1]} · ids repetidos: ${m.repetidos} · cartas incompletas: ${m.incompletas}`);

// --- La pantalla para elegir temática ---
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
const picker = await b.evaluate(`JSON.stringify({
  opciones: [...document.querySelectorAll('.theme-card')].map(c => c.innerText.replace(/\\n/g, ' · ')),
  alcanzanEnPantalla: (() => { const cs = [...document.querySelectorAll('.theme-card')]; if (!cs.length) return null;
    const ultimo = cs[cs.length - 1].getBoundingClientRect(); return Math.round(ultimo.bottom) <= window.innerHeight; })(),
  tocables: [...document.querySelectorAll('.theme-card')].every(c => c.getBoundingClientRect().height >= 44),
})`).then(JSON.parse);
console.log('temáticas a elegir:', JSON.stringify(picker, null, 0));
await b.shot('mazos-01-tematicas');

// --- Diez partidas seguidas: ¿se repiten las cartas? ---
const VUELTAS = 10;
const juegos = [];
for (let i = 0; i < VUELTAS; i++) {
  await b.go(`${BASE}/linea-de-tiempo/`, 1200);
  await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
  await b.evaluate(`(()=>{const t=[...document.querySelectorAll('.theme-card')].find(c=>/Chile/.test(c.innerText));t.click();return 1})()`); await sleep(150);
  await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
  await b.evaluate(`(()=>{const x=[...document.querySelectorAll('.seg button')].find(e=>/7$/.test(e.textContent.trim()));if(x)x.click();return 1})()`);
  await b.evaluate(`[...document.querySelectorAll('#setup-actions .btn')][0].click(); 1`); await sleep(900);
  const cartas = await b.evaluate(`(()=>{const v=window.__ldt.view();return JSON.stringify([...v.line, ...v.hands.A])})()`).then(JSON.parse);
  const excluidas = await b.evaluate(`(window.__ldt.match().config.skip || []).length`);
  juegos.push({ cartas, excluidas });
}
const repetidasConLaAnterior = juegos.slice(1).map((g, i) => g.cartas.filter(c => juegos[i].cartas.includes(c)).length);
const todas = juegos.flatMap(g => g.cartas);
console.log('cartas por partida:', juegos[0].cartas.length, '| excluidas al empezar cada una:', juegos.map(g => g.excluidas).join(', '));
console.log('repetidas respecto de la partida anterior:', repetidasConLaAnterior.join(', '), '(deben ser todas 0)');
console.log('cartas distintas en 10 partidas:', new Set(todas).size, 'de', todas.length, 'repartidas');
const masVistas = Object.entries(todas.reduce((a, c) => ({ ...a, [c]: (a[c] || 0) + 1 }), {})).sort((x, y) => y[1] - x[1]).slice(0, 3);
console.log('las que más se repitieron en las 10:', masVistas.map(([c, n]) => `${c}×${n}`).join(', '));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
