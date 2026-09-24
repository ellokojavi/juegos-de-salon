// Tests del almacén de prueba de La Copa (las reglas que imita): node copa/store.test.mjs
import assert from 'node:assert/strict';

const memoria = () => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear() };
};
globalThis.localStorage = memoria();
globalThis.sessionStorage = memoria();
globalThis.addEventListener ||= () => {};

const { createLocalStore } = await import('./store-local.js');
const { nuevaMeta, hashPin, DIA_MS, fechaEn, moverInicio, sumarDias, inscripcionAbierta } = await import('./engine.js');
const { createCuenta } = await import('./cuenta.js');

let n = 0;
const test = async (name, fn) => { try { await fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };
const rechaza = async (p, code) => { await assert.rejects(p, e => e.code === code); };

const admin = createLocalStore({ uid: 'u-admin' });
const otro = createLocalStore({ uid: 'u-otro' });
const intruso = createLocalStore({ uid: 'u-intruso' });
const CODE = 'KQRST';
const hoy = fechaEn(admin.now());
const meta = nuevaMeta({ nombre: 'Copa de prueba', dias: 3, inicio: hoy, admin: 'aaaaaa', creada: admin.now() });

await test('crear y leer', async () => {
  await admin.crear(CODE, meta, { pid: 'aaaaaa', name: 'Cata', at: 1, pinHash: await hashPin(CODE, 'aaaaaa', '1111') });
  const L = await admin.leer(CODE);
  assert.equal(L.meta.name, 'Copa de prueba');
  assert.equal(L.players.aaaaaa.name, 'Cata');
  assert.equal(L._keys, undefined); // el hash no se lee
  await rechaza(admin.crear(CODE, meta, { pid: 'x', name: 'x', at: 1, pinHash: 'x' }), 'ocupado');
});

await test('cerrar la inscripción y mover el inicio: solo el admin, y solo sin empezar (D-110)', async () => {
  const C2 = 'MNPQR';
  const m2 = nuevaMeta({ nombre: 'Copa dos', dias: 3, inicio: hoy, admin: 'aaaaaa', creada: admin.now() });
  await admin.crear(C2, m2, { pid: 'aaaaaa', name: 'Cata', at: 1, pinHash: 'h' });
  await rechaza(otro.cerrarInscripcion(C2, true), 'permiso');
  await admin.cerrarInscripcion(C2, true);
  assert.equal((await admin.leer(C2)).closed, true);
  await rechaza(otro.inscribir(C2, { pid: 'bbbbbb', name: 'Javi', at: 2, pinHash: 'h' }), 'cerrada');
  await admin.cerrarInscripcion(C2, false);
  await otro.inscribir(C2, { pid: 'bbbbbb', name: 'Javi', at: 2, pinHash: 'h' });
  // Mover el inicio a mañana: las ventanas se corren un día
  const manana = moverInicio(m2, sumarDias(hoy, 1));
  await rechaza(otro.reprogramar(C2, manana), 'permiso');
  await admin.reprogramar(C2, manana);
  const L2 = await admin.leer(C2);
  assert.equal(L2.meta.start, sumarDias(hoy, 1));
  assert.ok(Math.abs(L2.meta.win[1].a - m2.win[1].a - DIA_MS) <= 3600000); // un día (± el cambio de hora)
  assert.equal(L2.meta.createdAt, m2.createdAt);
  // Con alguien que ya empezó, no se mueve
  await admin.reprogramar(C2, moverInicio(m2, hoy));
  await admin.empezar(C2, 1, 'aaaaaa');
  await rechaza(admin.reprogramar(C2, moverInicio(m2, sumarDias(hoy, 1))), 'empezada');
  assert.equal(inscripcionAbierta(m2, admin.now(), true), false);
});

await test('inscribirse: nombre repetido y cupo', async () => {
  await otro.inscribir(CODE, { pid: 'bbbbbb', name: 'Javi', at: 2, pinHash: await hashPin(CODE, 'bbbbbb', '2222') });
  await rechaza(intruso.inscribir(CODE, { pid: 'cccccc', name: ' javi ', at: 3, pinHash: 'h' }), 'nombre-repetido');
  for (let i = 0; i < 8; i++) await intruso.inscribir(CODE, { pid: `p${i}aaaa`, name: `J${i}`, at: 3, pinHash: 'h' });
  await rechaza(intruso.inscribir(CODE, { pid: 'zzzzzz', name: 'Once', at: 3, pinHash: 'h' }), 'llena');
});

await test('sentarse con el PIN', async () => {
  await rechaza(intruso.sentarse(CODE, 'bbbbbb', await hashPin(CODE, 'bbbbbb', '0000')), 'pin');
  await rechaza(intruso.resultado(CODE, 1, 'bbbbbb', { s: 1, ms: 1 }), 'permiso');
  await intruso.sentarse(CODE, 'bbbbbb', await hashPin(CODE, 'bbbbbb', '2222'));
});

await test('comodín antes de empezar; resultado una vez y en su ventana', async () => {
  await otro.comodin(CODE, 1, 'bbbbbb');
  await rechaza(otro.comodin(CODE, 2, 'bbbbbb'), 'comodin');
  await admin.empezar(CODE, 1, 'aaaaaa');
  await rechaza(admin.comodin(CODE, 1, 'aaaaaa'), 'comodin');
  await rechaza(admin.empezar(CODE, 2, 'aaaaaa'), 'ventana');
  await admin.resultado(CODE, 1, 'aaaaaa', { s: 5, ms: 1000, t: '🟩' });
  await rechaza(admin.resultado(CODE, 1, 'aaaaaa', { s: 7, ms: 1 }), 'ya-jugado');
  const L = await admin.leer(CODE);
  assert.equal(L.results[1].aaaaaa.s, 5);
  assert.equal(L.wild.bbbbbb, '1');
});

await test('el reloj adelantado abre y cierra días', async () => {
  admin.adelantar(DIA_MS * 2);
  await rechaza(otro.resultado(CODE, 1, 'bbbbbb', { s: 1, ms: 1 }), 'ventana');
  await otro.empezar(CODE, 3, 'bbbbbb');
  await otro.resultado(CODE, 3, 'bbbbbb', { s: 300, ms: 1 });
  admin.reiniciarReloj();
});

await test('admin: sacar, renombrar y cambiar PIN; nadie más', async () => {
  await rechaza(otro.sacar(CODE, 'aaaaaa', true), 'permiso');
  await rechaza(otro.sacar(CODE, 'p0aaaa', true), 'permiso');
  await admin.sacar(CODE, 'p0aaaa', true);
  assert.equal((await admin.leer(CODE)).players.p0aaaa.out, true);
  await admin.sacar(CODE, 'p0aaaa', false);
  assert.equal((await admin.leer(CODE)).players.p0aaaa.out, undefined);
  await rechaza(admin.renombrar(CODE, 'p0aaaa', 'CATA'), 'nombre-repetido');
  await admin.renombrar(CODE, 'p0aaaa', 'Coni');
  await admin.cambiarPin(CODE, 'bbbbbb', await hashPin(CODE, 'bbbbbb', '9999'));
  await rechaza(otro.comodin(CODE, 2, 'bbbbbb'), 'permiso'); // su asiento se cayó
  await otro.sentarse(CODE, 'bbbbbb', await hashPin(CODE, 'bbbbbb', '9999'));
});

await test('escuchar avisa los cambios', async () => {
  const vistas = [];
  const off = admin.escuchar(CODE, L => vistas.push(Object.keys(L.players).length));
  await intruso.sacar(CODE, 'p1aaaa', true).catch(() => {});
  await admin.renombrar(CODE, 'p1aaaa', 'Nico');
  off();
  assert.ok(vistas.length >= 2);
});

await test('cuenta: sesión por copa y copas de prueba aparte', async () => {
  const c = createCuenta(), cp = createCuenta({ prueba: true });
  c.recordar('ABCDE', 'aaaaaa', { nombre: 'Cata', copa: 'Copa 1', fin: Date.now() });
  assert.equal(c.quien('ABCDE'), 'aaaaaa');
  assert.equal(cp.quien('ABCDE'), null);
  assert.equal(c.mias().length, 1);
  assert.equal(c.mias(Date.now() + 8 * DIA_MS).length, 0);
  c.intento.guardar('ABCDE', 1, 'aaaaaa', { jugadas: [1] });
  assert.deepEqual(c.intento.leer('ABCDE', 1, 'aaaaaa'), { jugadas: [1] });
  c.olvidar('ABCDE');
  assert.equal(c.quien('ABCDE'), null);
});

console.log(`copa/store: ${n} tests OK`);
process.exit(0);
