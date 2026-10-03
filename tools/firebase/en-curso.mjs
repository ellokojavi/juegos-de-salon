#!/usr/bin/env node
/**
 * ¿Hay alguien jugando ahora? Salas en vivo y copas en curso, leídas de Firebase como
 * administrador (solo lectura). Sirve para decidir cuándo fusionar a main sin cortarle una
 * partida a nadie.
 *
 *   node tools/en-curso.mjs            el resumen
 *   node tools/en-curso.mjs --todo     también las salas abandonadas y las copas terminadas
 *   node tools/en-curso.mjs --json     tal cual, para procesarlo
 *
 * Sale con 0 si no hay nada en juego y con 3 si lo hay (1 y 2 quedan para los errores).
 * Necesita la llave de la cuenta de servicio (ver tools/firebase-admin.mjs).
 */
import { token, leer } from './firebase-admin.mjs';
import { GAMES } from '../assets/js/games.js';
import { IDLE_TTL, ROOM_TTL } from '../assets/js/transport/cleanup.js';
import { diaActual, juegoDelDia, terminada, inscripcionAbierta } from '../copa/engine.js';
import { MINIJUEGOS } from '../copa/rules.js';

/** Una sala sin jugadas hace menos de esto cuenta como partida viva; más, como pausa. */
const JUGANDO_MS = 5 * 60 * 1000;

const args = process.argv.slice(2);
const todo = args.includes('--todo');
const t = await token();
const [rooms, torneos] = await Promise.all([leer('rooms', t), leer('torneos', t)]);
const ahora = Date.now();

const hace = ms => {
  const m = Math.round((ahora - ms) / 60000);
  if (m < 1) return 'recién';
  if (m < 90) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
};
// El último día de la copa en su propia zona: `end` es la medianoche en que ya terminó.
const ultimoDia = (end, tz) => new Intl.DateTimeFormat('es-CL', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(end - 1));
const nombreJuego = id => GAMES.find(g => g.id === id)?.name.es || id || '(sin juego)';

// Salas: viva mientras la limpieza no pueda borrarla (misma cuenta que cleanup.js y las reglas).
const salas = Object.entries(rooms || {}).map(([codigo, r]) => {
  const ultima = r.lastAt || r.createdAt || 0;
  const presentes = Object.values(r.players || {}).filter(p => !p.left);
  const muerta = !presentes.length || ahora - (r.createdAt || 0) > ROOM_TTL || ahora - ultima > IDLE_TTL;
  const estado = muerta ? 'abandonada' : ahora - ultima < JUGANDO_MS ? 'jugando' : 'en pausa';
  return { codigo, juego: r.game, estado, ultima, jugadores: presentes.length, conectados: presentes.filter(p => p.online).length };
}).sort((a, b) => b.ultima - a.ultima);

// Copas: en curso hasta que termina el último día, aunque nadie haya jugado todavía hoy.
const copas = Object.entries(torneos || {}).filter(([, x]) => x.meta?.win).map(([codigo, x]) => {
  const m = x.meta;
  const dia = diaActual(m, ahora);
  const hoy = dia >= 1 && dia <= m.days ? juegoDelDia(m, dia) : null;
  const jugadores = Object.values(x.players || {}).filter(p => !p.out);
  const hechos = Object.keys(x.results?.[dia] || {}).length;
  const marcas = Object.values(x.results || {}).flatMap(d => Object.values(d || {}).map(r => r?.at || 0));
  return {
    codigo, nombre: m.name, alias: m.alias || null, prueba: !!m.lab, dias: m.days, dia,
    estado: terminada(m, ahora) ? 'terminada' : dia === 0 ? 'por empezar' : 'en curso',
    hoy, hoyNombre: hoy ? MINIJUEGOS[hoy]?.nombre || hoy : null,
    jugadores: jugadores.length, jugaronHoy: hechos, inscripcion: inscripcionAbierta(m, ahora),
    termina: m.end, tz: m.tz, ultimo: Math.max(0, ...marcas) || null,
  };
}).sort((a, b) => a.termina - b.termina);

const salasEnJuego = salas.filter(s => s.estado !== 'abandonada');
const copasEnJuego = copas.filter(c => c.estado !== 'terminada');
const hayAlgo = salasEnJuego.length + copasEnJuego.length > 0;

if (args.includes('--json')) {
  console.log(JSON.stringify({ ahora, salas: todo ? salas : salasEnJuego, copas: todo ? copas : copasEnJuego }, null, 2));
  process.exit(hayAlgo ? 3 : 0);
}

const verSalas = todo ? salas : salasEnJuego;
const dormidas = salas.length - salasEnJuego.length;
console.log(`Salas en vivo: ${salasEnJuego.length}${dormidas && !todo ? ` (y ${dormidas} abandonada(s) que la limpieza va a borrar)` : ''}`);
for (const s of verSalas) {
  console.log(`  ${s.codigo}  ${nombreJuego(s.juego).padEnd(16)} ${s.estado.padEnd(10)} última jugada ${hace(s.ultima)} · ${s.jugadores} jugador(es), ${s.conectados} conectado(s)`);
}

const verCopas = todo ? copas : copasEnJuego;
const pasadas = copas.length - copasEnJuego.length;
console.log(`\nCopas en curso: ${copasEnJuego.length}${pasadas && !todo ? ` (y ${pasadas} terminada(s))` : ''}`);
for (const c of verCopas) {
  const cuando = c.estado === 'en curso' ? `día ${c.dia} de ${c.dias}: ${c.hoyNombre}, jugaron ${c.jugaronHoy} de ${c.jugadores}` : c.estado;
  console.log(`  ${c.codigo}  ${c.nombre}${c.prueba ? ' · laboratorio' : ''}${c.alias ? ` · /${c.alias}` : ''}`);
  console.log(`         ${cuando} · último día ${ultimoDia(c.termina, c.tz)} (${c.tz}) · último resultado ${c.ultimo ? hace(c.ultimo) : 'ninguno'}${c.inscripcion && c.estado !== 'terminada' ? ' · inscripción abierta' : ''}`);
}

console.log(`\n${hayAlgo ? '⚠ Hay gente jugando: fusionar a main les cambia la app a mitad de partida.' : '✓ No hay nada en juego.'}`);
process.exit(hayAlgo ? 3 : 0);
