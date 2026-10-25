import { token, read, write } from './firebase/firebase-admin.mjs';
const APPLY = process.argv.includes('--apply');
const t = await token();
const L = await read('torneos/ZTCEN', t), m = L.meta;
const g = m.win[1];
const meta = { ...m, days: 6, final: '6', cal: 'loteo,reinas,desenredo,letras,puentes,final',
  win: { 1: g, 2: g, 3: g, 4: g, 5: { a: g.a, b: m.end, h: g.a }, 6: { a: g.a, b: m.end, h: m.end } } };
// The final was day 5: whatever was played of it moves to day 6
const patch = { 'torneos/ZTCEN/meta': meta };
for (const k of ['started', 'results']) if (L[k]?.[5]) { patch[`torneos/ZTCEN/${k}/6`] = L[k][5]; patch[`torneos/ZTCEN/${k}/5`] = null; }
for (const [pid, d] of Object.entries(L.wild || {})) if (String(d) === '5') console.log('wild on 5 for', pid);
console.log(JSON.stringify(Object.keys(patch)), meta.cal);
if (APPLY) { await write('', 'PATCH', patch, t); console.log('applied', (await read('torneos/ZTCEN/meta/cal', t))); }
