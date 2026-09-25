#!/usr/bin/env node
/**
 * Los dilemas de usabilidad (D-132): issues de GitHub con la etiqueta `usabilidad`, manejados
 * desde la conversación con Claude, no desde GitHub.
 *
 *   node tools/dilemas.mjs listar [--todos]           # abiertos (o todos) con su estado
 *   node tools/dilemas.mjs ver <n>                     # el dilema y sus comentarios
 *   node tools/dilemas.mjs crear <archivo.md>          # la 1.ª línea "# Título", el resto es el cuerpo
 *   node tools/dilemas.mjs resolver <n> "decisión"     # anota la decisión y lo cierra como resuelto
 *   node tools/dilemas.mjs archivar <n> "motivo"       # lo cierra como descartado
 *   node tools/dilemas.mjs reabrir <n>
 *
 * Estados: `usabilidad` + `pendiente` (espera al dueño) → `resuelto` (cerrado con la decisión) o
 * `archivado` (cerrado sin hacerse). Usa el CLI `gh` ya autenticado.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REPO = 'ellokojavi/juegos-de-salon';
const ETIQUETAS = {
  usabilidad: ['1d76db', 'Dilema de usabilidad (D-132)'],
  pendiente: ['fbca04', 'Espera la decisión del dueño'],
  resuelto: ['0e8a16', 'Decidido y anotado en docs/USABILIDAD.md'],
  archivado: ['cfd3d7', 'Descartado'],
};

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const salir = (msg, code = 1) => { console.error(msg); process.exit(code); };

function asegurarEtiquetas() {
  const hay = new Set(JSON.parse(gh('label', 'list', '-R', REPO, '--json', 'name', '--limit', '200')).map(l => l.name));
  for (const [nombre, [color, desc]] of Object.entries(ETIQUETAS)) {
    if (!hay.has(nombre)) gh('label', 'create', nombre, '-R', REPO, '--color', color, '--description', desc);
  }
}

const numero = x => (/^\d+$/.test(x || '') ? x : salir('Falta el número del dilema.', 2));
const [accion, a1, a2] = process.argv.slice(2);

switch (accion) {
  case 'listar': {
    const estado = process.argv.includes('--todos') ? 'all' : 'open';
    const lista = JSON.parse(gh('issue', 'list', '-R', REPO, '--label', 'usabilidad', '--state', estado, '--limit', '100', '--json', 'number,title,state,labels,createdAt,comments'));
    if (!lista.length) { console.log(estado === 'open' ? 'No hay dilemas abiertos.' : 'No hay dilemas.'); break; }
    for (const i of lista) {
      const et = i.labels.map(l => l.name).filter(n => n !== 'usabilidad').join(', ');
      console.log(`#${i.number} · ${i.state === 'OPEN' ? 'abierto' : 'cerrado'}${et ? ` (${et})` : ''} · ${i.createdAt.slice(0, 10)} · ${i.comments.length} coment. · ${i.title}`);
    }
    break;
  }
  case 'ver': {
    const i = JSON.parse(gh('issue', 'view', numero(a1), '-R', REPO, '--json', 'number,title,state,labels,body,comments,url'));
    console.log(`#${i.number} · ${i.title} · ${i.state} · ${i.labels.map(l => l.name).join(', ')}\n${i.url}\n\n${i.body}`);
    for (const c of i.comments) console.log(`\n── ${c.author.login} · ${c.createdAt.slice(0, 16)}\n${c.body}`);
    break;
  }
  case 'crear': {
    if (!a1) salir('Uso: node tools/dilemas.mjs crear <archivo.md>', 2);
    const texto = readFileSync(a1, 'utf8');
    const [primera, ...resto] = texto.split('\n');
    const titulo = primera.replace(/^#\s*/, '').trim();
    if (!titulo) salir('La primera línea del archivo tiene que ser el título ("# …").', 2);
    asegurarEtiquetas();
    const cuerpo = `${resto.join('\n').trim()}\n\n---\n_Dilema del agente de usabilidad (D-132). Se decide en la conversación con Claude._`;
    console.log(gh('issue', 'create', '-R', REPO, '--title', `Usabilidad: ${titulo}`, '--body', cuerpo, '--label', 'usabilidad', '--label', 'pendiente').trim());
    break;
  }
  case 'resolver': {
    const n = numero(a1);
    if (!a2) salir('Uso: node tools/dilemas.mjs resolver <n> "decisión"', 2);
    asegurarEtiquetas();
    gh('issue', 'comment', n, '-R', REPO, '--body', `✅ **Decisión del dueño:** ${a2}\n\n_Queda anotada en docs/USABILIDAD.md._`);
    gh('issue', 'edit', n, '-R', REPO, '--add-label', 'resuelto', '--remove-label', 'pendiente');
    gh('issue', 'close', n, '-R', REPO, '--reason', 'completed');
    console.log(`#${n} resuelto. Falta anotar la decisión en docs/USABILIDAD.md (sección "Resuelto con el dueño").`);
    break;
  }
  case 'archivar': {
    const n = numero(a1);
    asegurarEtiquetas();
    gh('issue', 'comment', n, '-R', REPO, '--body', `🗄️ **Archivado:** ${a2 || 'se descarta.'}`);
    gh('issue', 'edit', n, '-R', REPO, '--add-label', 'archivado', '--remove-label', 'pendiente');
    gh('issue', 'close', n, '-R', REPO, '--reason', 'not planned');
    console.log(`#${n} archivado.`);
    break;
  }
  case 'reabrir': {
    const n = numero(a1);
    asegurarEtiquetas();
    gh('issue', 'reopen', n, '-R', REPO);
    gh('issue', 'edit', n, '-R', REPO, '--add-label', 'pendiente', '--remove-label', 'resuelto', '--remove-label', 'archivado');
    console.log(`#${n} reabierto.`);
    break;
  }
  default:
    salir('Uso: node tools/dilemas.mjs listar [--todos] | ver <n> | crear <archivo.md> | resolver <n> "decisión" | archivar <n> "motivo" | reabrir <n>', 2);
}
