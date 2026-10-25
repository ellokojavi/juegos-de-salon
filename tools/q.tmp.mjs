import { token, read } from './firebase/firebase-admin.mjs';
const t = await token();
const L = await read('torneos/ZTCEN', t);
console.log(JSON.stringify({ players: Object.values(L.players||{}).map(p=>p.name), started: L.started, results: L.results && Object.fromEntries(Object.entries(L.results).map(([d,r])=>[d,Object.keys(r||{}).length])), wild: L.wild }));
