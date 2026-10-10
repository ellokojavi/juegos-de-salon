// Los parámetros de la URL en inglés, y los de antes como alias (C-18, D-266).
// Uso: node public/assets/js/parametros.test.mjs
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { param, tiene, nombres, enIngles, normalizarUrl, ALIAS, BANDERAS, VALORES, AVISO_CLAVE } from './parametros.js';
import { slugDe, idDeSlug, SLUGS_SIN_PAGINA, GAMES, SUELTOS } from './games.js';

// Se lee el nombre en inglés…
assert.equal(param('room', '?room=ABCD'), 'ABCD');
assert.equal(param('seed', '?labs&seed=K7Q2X'), 'K7Q2X');
assert.equal(param('day', '?K7Q2X&day=3'), '3');
assert.equal(param('room', '?K7Q2X'), null, 'sin el parámetro, null');
assert.equal(tiene('test', '?K7Q2X&test'), true);
assert.equal(tiene('mute', '?K7Q2X'), false);

// …y el de antes, de los links que ya circulan
assert.equal(param('room', '?sala=ABCD'), 'ABCD', 'una invitación vieja a una sala');
assert.equal(param('seed', '?labs&semilla=LBWDC'), 'LBWDC', 'el link del dueño: /case/?labs&semilla=LBWDC');
assert.equal(param('practice', '?practica=reinas'), 'reinas');
assert.equal(param('day', '?K7Q2X&dia=3'), '3', 'un aviso viejo de La Copa');
assert.equal(param('timer', '?zipSeg=8'), '8');
assert.equal(tiene('test', '?prueba'), true);
assert.equal(tiene('three', '?tres'), true);
assert.equal(tiene('today', '?hoy'), true);
assert.equal(tiene('mute', '?K7Q2X&silenciar'), true);
assert.equal(param('room', '?room=NUEV&sala=VIEJ'), 'NUEV', 'si vienen los dos, manda el nuevo');

// Los valores en palabras salen en inglés, vengan como vengan
assert.equal(param('daily', '?uad=boton'), 'button');
assert.equal(param('daily', '?uad=no'), 'off');
assert.equal(param('daily', '?daily=card'), 'card');
assert.equal(param('demo', '?prueba&demo=podio'), 'podium');
assert.equal(param('demo', '?test&demo=final-admin'), 'final-admin', 'el que ya estaba en inglés queda igual');
assert.equal(param('notif', '?aviso=plazo'), 'deadline');
assert.equal(param('notif', '?aviso=uaddia'), 'dailyday');
assert.equal(param('from', '?de=link'), 'link');

// El panel sigue contando los avisos con su clave de siempre
assert.equal(AVISO_CLAVE.deadline, 'plazo');
assert.equal(AVISO_CLAVE.final, 'final');
assert.equal(AVISO_CLAVE.dailybye, 'uadadios');

// Ningún nombre ni valor nuevo lleva algo que no sea ASCII, y ninguno se repite
const nuevos = [...Object.keys(ALIAS), ...Object.keys(BANDERAS)];
assert.equal(new Set(nuevos).size, nuevos.length);
for (const v of [...nuevos, ...Object.values(VALORES).flatMap(Object.values)]) assert.match(v, /^[a-z][a-z-]*$/, v);
// Los de los avisos van solo con letras: las reglas de `aviso/` lo piden
for (const v of Object.values(VALORES.notif)) assert.match(v, /^[a-z]+$/, v);
assert.deepEqual(nombres('room'), ['room', 'sala']);
assert.deepEqual(nombres('demo'), ['demo']);

// Una dirección vieja se reescribe en inglés sin tocar lo demás
assert.equal(enIngles('?labs&semilla=LBWDC'), '?labs&seed=LBWDC');
assert.equal(enIngles('?sala=WFBN&lang=pt'), '?room=WFBN&lang=pt');
assert.equal(enIngles('?K7Q2X&prueba'), '?K7Q2X&test', 'el código de una copa va sin `=` y queda igual');
assert.equal(enIngles('?pirata&dia=3&aviso=dia'), '?pirata&day=3&notif=day');
assert.equal(enIngles('?K7Q2X&silenciar'), '?K7Q2X&mute');
assert.equal(enIngles('?prueba&demo=llena'), '?test&demo=full');
assert.equal(enIngles('?uad=boton'), '?daily=button');
assert.equal(enIngles('?prueba='), '?test', 'una bandera con `=` vacío vuelve a ir sola');
assert.equal(enIngles('?de=link'), '?from=link');
assert.equal(enIngles('?hoy&tres'), '?today&three');
assert.equal(enIngles('?room=ABCD'), '?room=ABCD', 'lo nuevo queda igual');
assert.equal(enIngles(''), '');
assert.equal(enIngles('?dia'), '?dia', 'una palabra suelta que no es bandera (un link propio) no se toca');
assert.equal(enIngles('?sala'), '?sala');
assert.equal(enIngles('?q=hola%20mundo&utm_source=x'), '?q=hola%20mundo&utm_source=x', 'lo ajeno queda tal cual');

// Y la barra queda en inglés al abrir la página
{
  const hist = { state: { a: 1 }, url: null, replaceState(s, _t, u) { this.url = u; this.s = s; } };
  assert.equal(normalizarUrl({ loc: { pathname: '/hangman/', search: '?sala=WFBN', hash: '#x' }, hist }), true);
  assert.equal(hist.url, '/hangman/?room=WFBN#x');
  assert.deepEqual(hist.s, { a: 1 }, 'conserva el estado');
  hist.url = null;
  assert.equal(normalizarUrl({ loc: { pathname: '/cup/', search: '?K7Q2X', hash: '' }, hist }), false);
  assert.equal(hist.url, null, 'si ya está en inglés, no la toca');
  assert.equal(normalizarUrl({ loc: undefined, hist }), false);
}

// Los juegos también van en inglés en la URL (`queens`), y el id de antes se entiende igual
assert.equal(slugDe('reinas'), 'queens');
assert.equal(slugDe('ahorcado'), 'hangman');
assert.equal(slugDe('linea'), 'timeline-flash');
assert.equal(slugDe('final'), 'final');
assert.equal(idDeSlug('queens'), 'reinas');
assert.equal(idDeSlug('reinas'), 'reinas', 'un link viejo con el id');
assert.equal(idDeSlug('timeline-flash'), 'linea');
assert.equal(idDeSlug('number'), 'numero');
assert.equal(idDeSlug('battleship'), 'batalla-naval');
assert.equal(idDeSlug('cualquiera'), 'cualquiera');
for (const g of [...GAMES, ...SUELTOS]) assert.equal(idDeSlug(slugDe(g.id)), g.id, `ida y vuelta: ${g.id}`);
for (const s of [...Object.values(SLUGS_SIN_PAGINA), ...[...GAMES, ...SUELTOS].map(g => slugDe(g.id))]) assert.match(s, /^[a-z][a-z-]*$/, s);

// Lo que la app escribe en una dirección no usa los nombres de antes (C-18): se buscan en el código
// del sitio y de los avisos, fuera de los comentarios, de las pruebas y de las páginas puente
{
  const VIEJOS = /[?&](sala|semilla|practica|prueba|tres|hoy|dia|silenciar|aviso|zipSeg|uad|de)(?=[=&'"`]|\$\{)/;
  const RAIZ = new URL('../../../', import.meta.url).pathname;
  const malos = [];
  const recorrer = dir => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) { recorrer(p); continue; }
      if (!/\.(js|mjs|html)$/.test(f) || /\.test\.mjs$/.test(f)) continue;
      const texto = readFileSync(p, 'utf8');
      if (texto.includes('Página puente (D-192)')) continue;
      texto.split('\n').forEach((linea, i) => {
        const codigo = linea.replace(/^\s*(\/\/|\*|\/\*).*$/, '').replace(/\s\/\/\s.*$/, '');
        if (VIEJOS.test(codigo)) malos.push(`${p.slice(RAIZ.length)}:${i + 1}`);
      });
    }
  };
  recorrer(join(RAIZ, 'public'));
  recorrer(join(RAIZ, 'tools/push'));
  assert.deepEqual(malos, [], 'una URL con un parámetro en español: va en inglés (C-18, D-266)');
}

console.log('parametros.test.mjs: todo en verde');
