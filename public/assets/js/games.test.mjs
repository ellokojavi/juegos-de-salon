// El guardián de los cánones (D-213): ningún juego de GAMES se salta en silencio la estructura de
// C-2 (motor y sus tests, C-12), el gancho de pruebas de C-14 ni su especificación con la plantilla
// común de C-13. Mira los archivos de verdad, no lo que dice el registro.
// Los juegos de La Copa (SUELTOS) no pasan por aquí: los cubren cup.md y cup/games/juegos.test.mjs.
// La paridad de LOCALES (es, en, pt, de) tampoco: la revisa i18n.test.mjs.
// Uso: node public/assets/js/games.test.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { GAMES } from './games.js';

const RAIZ = new URL('../../../', import.meta.url);
const ruta = rel => new URL(rel, RAIZ);
const existe = rel => existsSync(ruta(rel));
const leer = rel => readFileSync(ruta(rel), 'utf8');

// Lo que un juego todavía no cumple, por id y por comprobación. Cada motivo cita la decisión que lo
// deja pendiente. Cuando el juego se pone al día, la excepción sobra y el test lo dice: se borra.
const EXCEPCIONES = {
  'cuarto-rey': {
    motor: 'pendiente: se lleva al canon en el PR de Cuarto Rey (D-213)',
    'pruebas-del-motor': 'pendiente: se lleva al canon en el PR de Cuarto Rey (D-213)',
    gancho: 'pendiente: se lleva al canon en el PR de Cuarto Rey (D-213)',
  },
};

// La plantilla común de las especificaciones (C-13, D-213), en este orden; puede haber otras entre medio
const SECCIONES = ['Resumen', 'Reglas', 'Modos', 'Flujo', 'Protocolo de mensajes', 'Archivos', 'Excepciones a los cánones'];

// El gancho de C-14: `window.__algo = …` en el game.js del juego
function gancho(carpeta) {
  const archivo = `public/${carpeta}/game.js`;
  if (!existe(archivo)) return null;
  const m = leer(archivo).match(/^\s*window\.(__[A-Za-z_$][\w$]*)\s*=/m);
  return m ? m[1] : null;
}

// Cada comprobación devuelve null si pasa, o el motivo por el que falla
const COMPROBACIONES = {
  motor: c => existe(`public/${c}/engine.js`) ? null : `falta public/${c}/engine.js (C-2)`,
  'pruebas-del-motor': c => existe(`public/${c}/engine.test.mjs`) ? null : `falta public/${c}/engine.test.mjs (C-2, C-12)`,
  gancho: c => gancho(c) ? null : `public/${c}/game.js no expone un gancho window.__… para las pruebas (C-14)`,
  especificacion: c => {
    const doc = `docs/games/${c}.md`;
    if (!existe(doc)) return `falta la especificación ${doc} (C-13)`;
    const texto = leer(doc);
    let desde = -1;
    for (const s of SECCIONES) {
      const re = new RegExp(`^## ${s}\\s*$`, 'gm');
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
const ids = new Set(GAMES.map(g => g.id));
for (const [id, exc] of Object.entries(EXCEPCIONES)) {
  assert.ok(ids.has(id), `EXCEPCIONES: '${id}' no es un juego de GAMES; se borra la excepción`);
  for (const [nombre, motivo] of Object.entries(exc)) {
    assert.ok(COMPROBACIONES[nombre], `EXCEPCIONES['${id}']: '${nombre}' no es una comprobación (${Object.keys(COMPROBACIONES).join(', ')})`);
    assert.match(motivo, /D-\d+/, `EXCEPCIONES['${id}'].${nombre}: el motivo tiene que citar una decisión (D-n)`);
  }
}

const fallas = [], malos = [];
for (const g of GAMES) {
  const carpeta = g.path.replace(/\/$/, '');
  const exc = EXCEPCIONES[g.id] || {};
  const suyas = [], pendientes = [];
  for (const [nombre, comprobar] of Object.entries(COMPROBACIONES)) {
    const falla = comprobar(carpeta);
    if (exc[nombre]) {
      if (falla) pendientes.push(nombre);
      else suyas.push(`la excepción '${nombre}' ya no hace falta (la comprobación pasa): bórrala de EXCEPCIONES en games.test.mjs`);
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
console.log(`games: los ${GAMES.length} juegos tienen motor, tests, gancho y especificación (o una excepción con su decisión)`);
