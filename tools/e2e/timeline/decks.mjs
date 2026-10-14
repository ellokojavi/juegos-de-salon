// Timeline themes: easy to choose, and cards don't repeat (D-34)
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output();
const BASE = process.argv[3] || process.env.SITE || 'http://localhost:8765';
const b = await launch({ port: Number(process.env.CDP_PORT) || 9498, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });

await b.go(`${BASE}/timeline/`, 1500); await b.evaluate(`localStorage.clear(); 1`);
await b.go(`${BASE}/timeline/`, 1500);

// --- Well-formed decks ---
const decks = await b.evaluate(`import('${BASE}/timeline/decks/index.js').then(m => JSON.stringify(m.DECKS.map(d => {
  const ids = d.cards.map(c => c.id);
  return { id: d.id, emoji: d.emoji, name: d.name.es, hint: d.hint.es, cards: d.cards.length,
    duplicates: ids.length - new Set(ids).size,
    incomplete: d.cards.filter(c => !c.id || !c.year || !c.emoji || !c.es || !c.en).length,
    range: [Math.min(...d.cards.map(c => c.year)), Math.max(...d.cards.map(c => c.year))] };
})))`).then(JSON.parse);
for (const m of decks) console.log(`${m.emoji} ${m.name}: ${m.cards} cards · ${m.hint} · ${m.range[0]} to ${m.range[1]} · duplicate ids: ${m.duplicates} · incomplete cards: ${m.incomplete}`);

// --- The theme picker screen ---
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
const picker = await b.evaluate(`JSON.stringify({
  options: [...document.querySelectorAll('.theme-card')].map(c => c.innerText.replace(/\\n/g, ' · ')),
  fitOnScreen: (() => { const cs = [...document.querySelectorAll('.theme-card')]; if (!cs.length) return null;
    const last = cs[cs.length - 1].getBoundingClientRect(); return Math.round(last.bottom) <= window.innerHeight; })(),
  tappable: [...document.querySelectorAll('.theme-card')].every(c => c.getBoundingClientRect().height >= 44),
})`).then(JSON.parse);
console.log('themes to choose:', JSON.stringify(picker, null, 0));
await b.shot('decks-01-themes');

// --- Ten games in a row: do cards repeat? ---
const ROUNDS = 10;
const games = [];
for (let i = 0; i < ROUNDS; i++) {
  await b.go(`${BASE}/timeline/`, 1200);
  // Play solo (the ⏳ Lightning Line, D-142): ten milestones per game
  await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
  await b.evaluate(`(()=>{const t=[...document.querySelectorAll('.theme-card')].find(c=>/Chile/.test(c.innerText));t.click();return 1})()`); await sleep(150);
  await b.evaluate(`document.getElementById('btn-solo-empezar').click(); 1`); await sleep(900);
  const cards = await b.evaluate(`(async()=>{const L=await import('${BASE}/cup/games/timeline/engine.js');const s=window.__ldt.solo();const p=L.generar(s.codigo,1,{tema:s.tema,excluir:s.skip});return JSON.stringify([p.base.id,...p.mano.map(c=>c.id)])})()`).then(JSON.parse);
  const excluded = await b.evaluate(`window.__ldt.solo().skip.length`);
  games.push({ cards, excluded });
}
const repeatedWithPrevious = games.slice(1).map((g, i) => g.cards.filter(c => games[i].cards.includes(c)).length);
const all = games.flatMap(g => g.cards);
console.log('cards per game:', games[0].cards.length, '| excluded at the start of each:', games.map(g => g.excluded).join(', '));
console.log('repeated from the previous game:', repeatedWithPrevious.join(', '), '(must all be 0)');
console.log('distinct cards in 10 games:', new Set(all).size, 'of', all.length, 'dealt');
const mostSeen = Object.entries(all.reduce((a, c) => ({ ...a, [c]: (a[c] || 0) + 1 }), {})).sort((x, y) => y[1] - x[1]).slice(0, 3);
console.log('most repeated across the 10:', mostSeen.map(([c, n]) => `${c}×${n}`).join(', '));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
