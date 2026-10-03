// Tests de los reportes sin cuenta (D-104, D-109): node copa/reportes.test.mjs
import assert from 'node:assert/strict';
import { enviarReporte, reenviarPendientes } from './reportes.js';

const almacen = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; };
const falla = async () => ({ ok: false, status: 401 });
const anda = enviados => async (_, o) => { enviados.push(JSON.parse(o.body)); return { ok: true }; };

const a = almacen();
await enviarReporte({ texto: 'hola' }, anda([]), a);
assert.equal(a.getItem('juegos-de-salon:copa:reportes-pendientes'), null);

// Si las reglas lo rechazan, queda guardado y se avisa
await assert.rejects(enviarReporte({ texto: 'uno' }, falla, a), e => e.code === 'reporte' && e.guardado === true);
await assert.rejects(enviarReporte({ texto: 'dos' }, falla, a), e => e.guardado);
assert.equal(await reenviarPendientes(falla, a), 0);
assert.equal(JSON.parse(a.getItem('juegos-de-salon:copa:reportes-pendientes')).length, 2);

// Cuando vuelve a andar, se envían y el dispositivo queda limpio
const enviados = [];
assert.equal(await reenviarPendientes(anda(enviados), a), 2);
assert.deepEqual(enviados.map(r => r.texto), ['uno', 'dos']);
assert.ok(enviados.every(r => r.at['.sv'] === 'timestamp'));
assert.equal(a.getItem('juegos-de-salon:copa:reportes-pendientes'), null);

console.log('copa/reportes: OK');
