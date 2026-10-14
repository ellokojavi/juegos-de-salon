#!/usr/bin/env node
/**
 * El feedback 🐞 como issues de GitHub (D-275): cada reporte que la gente manda desde La Copa o
 * el laboratorio (`feedback/` en Firebase, D-104, D-191, D-265) se vuelve un issue con la etiqueta
 * `feedback`, y el agente de procesos lo atiende en su ronda. Lo corre cada 15 minutos
 * `.github/workflows/feedback.yml`: así cada reporte le llega por correo al dueño y queda enlazado
 * con su respuesta y su arreglo.
 *
 *   node tools/agents/feedback.mjs sincronizar [--simular]   # crea los issues que faltan
 *   node tools/agents/feedback.mjs pending                                   # who is waiting, grouped by player (D-317)
 *   node tools/agents/feedback.mjs reply <n>[,<n>…] <answer.txt> --lang <es|en|pt|de> [--dry-run | --test-to <address>]
 *                                                                         # one email for all of a player's comments
 *   node tools/agents/feedback.mjs forget <issue> "<reason>"                 # deletes the address, no email
 *
 * Optional email (D-317): a player who wants to hear back leaves an address. The issue only shows
 * its mask (`j********@********m`); the address lives in `feedbackContacto/<id>`, readable only
 * with the owner's key, so `reply` and `forget` run on the owner's Mac mini (the processes round),
 * never in a workflow (its logs are public). `reply` sends the message through Gmail's SMTP
 * (`send-mail.py`), wrapped in one of the friendly templates of `feedback-plantillas.mjs`, in the
 * language the feedback was written in, deletes the address and notes it on the issue; `forget` (destructive feedback,
 * no email) only deletes it. Either way the address is gone after the issue is resolved.
 *
 * El repo es público: el issue lleva el texto tal cual, el juego, la versión y la pantalla, pero
 * el nombre que puso el jugador, para que el dueño le haga seguimiento (D-279), pero no su
 * navegador. Cada issue lleva
 * `<!-- feedback:<id> -->`, así un reporte nunca se sube dos veces, aunque su issue esté cerrado.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';
import { correoValido } from '../../public/cup/reportes.js';

export const ETIQUETA = 'feedback';
const REPO = process.env.GITHUB_REPOSITORY || 'ellokojavi/juegos-de-salon';
const SITIO = 'https://juegosdesalon.cl';

/* ------------------------------------------------------------------ */
/* Lo puro (lo prueba tools/agents/feedback.test.mjs)                 */
/* ------------------------------------------------------------------ */

export const marca = id => `<!-- feedback:${id} -->`;
/** Notes on the issue that the address was used and deleted, or deleted without an email (D-317). */
export const RESPONDIDO = '<!-- feedback-emailed -->', OLVIDADO = '<!-- feedback-address-deleted -->';

/** The report id of an issue, from its marker. */
export const idDe = body => /<!-- feedback:([^\s>]+) -->/.exec(body || '')?.[1] || null;
/** Does the issue's player want an email reply? (the issue shows the mask) */
export const quiereCorreo = body => /^- \*\*Email:\*\* /m.test(body || '');
/** Already emailed or forgotten? */
export const atendido = comentarios => (comentarios || []).some(c => (c.body || '').includes(RESPONDIDO) || (c.body || '').includes(OLVIDADO));

/**
 * The agent's answers, one per issue. With one issue, the file is just the answer; with several,
 * each answer goes under a line `#<n>`. Plain text, and no dashes as punctuation (owner's request,
 * D-317). Returns `{ <n>: answer }`.
 */
export function leerRespuestas(t, numeros) {
  const texto = String(t || '').trim();
  if (!texto) throw new Error('The answer file is empty.');
  if (/[—–]/.test(texto)) throw new Error('No em or en dashes in the reply: use a comma, a colon or a period.');
  const partes = texto.split(/^#(\d+)[ \t]*$/m);
  if (partes.length === 1) {
    if (numeros.length > 1) throw new Error(`Several issues: put each answer under a line "#<n>" (${numeros.map(n => `#${n}`).join(', ')}).`);
    return { [numeros[0]]: texto };
  }
  if (partes[0].trim()) throw new Error('Text before the first "#<n>" line.');
  const r = {};
  for (let i = 1; i < partes.length; i += 2) r[partes[i]] = partes[i + 1].trim();
  const faltan = numeros.filter(n => !r[n]), sobran = Object.keys(r).filter(n => !numeros.includes(n));
  if (faltan.length || sobran.length) throw new Error(`Answers don't match the issues: missing ${faltan.map(n => `#${n}`).join(', ') || 'none'}, extra ${sobran.map(n => `#${n}`).join(', ') || 'none'}.`);
  return r;
}

/** What the player wrote, from the issue's quote (without the zero-width spaces of `inerte`). */
export const textoDe = body => (body || '').split('\n').filter(l => l.startsWith('> ')).map(l => l.slice(2)).join('\n').replace(/\u200b/g, '').trim();

/** The name the player gave, from the issue (`Who`, or `Quién` in the issues from before D-316; without the zero-width spaces of `inerte`). */
export const nombreDe = body => (/^- \*\*(?:Who|Quién):\*\* (.+)$/m.exec(body || '')?.[1] || '').replace(/\u200b/g, '').trim();

/** Los ids de reporte que ya tienen issue, leídos de los cuerpos. */
export const subidos = issues => new Set(issues.flatMap(i => [...(i.body || '').matchAll(/<!-- feedback:([^\s>]+) -->/g)].map(m => m[1])));

/** Los reportes sin issue, del más viejo al más nuevo (así los números de issue siguen el orden). */
export const pendientes = (reportes, ya) => reportes.filter(r => r.id && !ya.has(r.id) && String(r.texto || '').trim()).sort((a, b) => (a.at || 0) - (b.at || 0));

const contexto = r => { try { return JSON.parse(r.contexto || '{}') || {}; } catch { return {}; } };

/** Dónde se escribió, en pocas palabras: el juego o la página. */
export function donde(r) {
  const c = contexto(r);
  return c.juego || (c.labs && `lab ${c.labs}`) || (c.copa && `cup ${c.copa}`) || c.pantalla || c.url || 'the app';
}

/** Un @ o un # del jugador no menciona a nadie ni enlaza nada. */
const inerte = t => String(t).replace(/@/g, '@​').replace(/#(\d)/g, '#​$1');

export function titulo(r) {
  const t = inerte(String(r.texto).replace(/\s+/g, ' ').trim());
  return `🐞 ${donde(r)}: ${t.length > 70 ? `${t.slice(0, 69)}…` : t}`;
}

/** The mask as the rules let it in (D-317), inside a code span: it can't mention or link anything. */
const mascara = m => (/^.\*{8}@\*{8}.$/u.test(String(m || '')) ? String(m).replace(/`/g, "'") : null);

/** El cuerpo: el texto tal cual, quién lo mandó y el contexto, sin el navegador. */
export function cuerpo(r) {
  const c = contexto(r);
  const fecha = r.at ? new Date(r.at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'no date';
  const datos = [
    ['Who', r.nombre && String(r.nombre).trim()], ['Lab key', r.tester && String(r.tester).trim()], ['Game', c.juego], ['Lab', c.labs], ['Cup', c.copa], ['Day', c.dia], ['Seed', c.semilla],
    ['Result', c.resumen ?? c.puntaje], ['Mistakes', c.errores], ['Hints', c.ayudas], ['Time', c.tiempo],
    ['Page', c.url && (String(c.url).startsWith('/') ? `${SITIO}${c.url}` : c.url)], ['Screen', c.pantalla], ['Window size', c.pantallaTam], ['Version', r.v && `v${r.v}`], ['Date', fecha],
    ['Email', mascara(r.correoMascara) && `\`${mascara(r.correoMascara)}\` (wants a reply by email: the processes agent sends it when resolving, D-317)`],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '');
  return [
    inerte(String(r.texto).trim()).split('\n').map(l => `> ${l}`).join('\n'),
    '',
    datos.map(([k, v]) => `- **${k}:** ${k === 'Email' ? v : inerte(v)}`).join('\n'),
    '',
    'Sent with the app\'s 🐞 button (D-275). The processes agent handles it in its round.',
    marca(r.id),
  ].join('\n');
}

/* ------------------------------------------------------------------ */

const gh = (...args) => execFileSync('gh', [...args, '-R', REPO], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

async function sincronizar(simular) {
  const res = await fetch(`${firebaseConfig.databaseURL}/feedback.json`);
  if (!res.ok) throw new Error(`No se pudo leer feedback/ (HTTP ${res.status}).`);
  const reportes = Object.entries((await res.json()) || {}).map(([id, r]) => ({ id, ...r }));
  const issues = JSON.parse(gh('issue', 'list', '--label', ETIQUETA, '--state', 'all', '--limit', '1000', '--json', 'body'));
  const nuevos = pendientes(reportes, subidos(issues));
  if (!nuevos.length) return console.log(`Nada nuevo (${reportes.length} reporte(s), todos con issue).`);
  if (simular) { for (const r of nuevos) console.log(`${titulo(r)}\n${cuerpo(r)}\n`); return; }
  const hay = JSON.parse(gh('label', 'list', '--limit', '200', '--json', 'name')).some(l => l.name === ETIQUETA);
  if (!hay) gh('label', 'create', ETIQUETA, '--color', 'd93f0b', '--description', 'Reporte 🐞 de un jugador (D-275)');
  for (const r of nuevos) console.log(gh('issue', 'create', '--title', titulo(r), '--label', ETIQUETA, '--body', cuerpo(r)).trim());
}

/* ------------------------------------------------------------------ */
/* The email reply (D-317): only on the owner's machine                */
/* ------------------------------------------------------------------ */

async function contactoDe(numero, t, prueba = false) {
  const issue = JSON.parse(gh('issue', 'view', String(numero), '--json', 'body,comments,labels,state'));
  if (!issue.labels.some(l => l.name === ETIQUETA)) throw new Error(`#${numero} is not a feedback issue.`);
  const id = idDe(issue.body);
  if (!id) throw new Error(`#${numero} has no feedback marker.`);
  // A test only needs the comment: it goes to the test address, not to the player
  if (!prueba && !quiereCorreo(issue.body)) throw new Error(`#${numero}: the player left no email.`);
  if (!prueba && atendido(issue.comments)) throw new Error(`#${numero}: already emailed or the address was already deleted.`);
  const c = t ? await (await import('../firebase/firebase-admin.mjs')).leer(`feedbackContacto/${id}`, t) : null;
  return { numero: String(numero), id, correo: c?.correo || null, nombre: nombreDe(issue.body), texto: textoDe(issue.body), estado: issue.state, mascara: /\*\*Email:\*\* `([^`]+)`/.exec(issue.body)?.[1] || '' };
}

const llave = async () => (await import('../firebase/firebase-admin.mjs')).token();

async function borrar(id, t) {
  const { firebaseConfig: f } = await import('../../public/assets/js/firebase-config.js');
  const res = await fetch(`${f.databaseURL}/feedbackContacto/${encodeURIComponent(id)}.json?access_token=${encodeURIComponent(t)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Could not delete feedbackContacto/${id} (HTTP ${res.status}).`);
}

/**
 * One email for one or more comments of the same player (owner's request: a long session leaves
 * several, and N emails for N comments is too many). Every issue must carry the same address.
 * `prueba`: send it to that address instead, without reading or deleting any address or touching
 * the issues (to see how a real reply looks).
 */
async function responder(lista, archivo, idioma, { simular, prueba }) {
  const { readFileSync } = await import('node:fs');
  const { armarCorreo } = await import('./feedback-plantillas.mjs');
  const numeros = String(lista).split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean);
  if (!numeros.length || numeros.some(n => !/^\d+$/.test(n))) throw new Error(`Issues as numbers separated by commas, not "${lista}".`);
  const respuestas = leerRespuestas(readFileSync(archivo, 'utf8'), numeros);
  if (prueba && !correoValido(prueba)) throw new Error(`--test-to needs an address, not "${prueba}".`);
  const t = prueba ? null : await llave();
  const todos = [];
  for (const n of numeros) todos.push(await contactoDe(n, t, !!prueba));
  if (!prueba) {
    const sin = todos.filter(x => !x.correo);
    if (sin.length) throw new Error(`No address in feedbackContacto/ for ${sin.map(x => `#${x.numero}`).join(', ')} (already deleted?).`);
    if (new Set(todos.map(x => x.correo.toLowerCase())).size > 1) throw new Error(`Not the same player: ${todos.map(x => `#${x.numero} ${x.mascara}`).join(', ')}. One email per address.`);
  }
  const nombre = todos.map(x => x.nombre).find(Boolean) || '';
  const { asunto, texto, html } = armarCorreo({ idioma, nombre, n: Number(numeros[0]), items: todos.map(x => ({ cita: x.texto, respuesta: respuestas[x.numero] })) });
  const para = prueba || todos[0].correo;
  if (simular) { console.log(`To: ${prueba || todos[0].mascara}\nSubject: ${asunto}\n\n${texto}`); return; }
  // Through stdin: the address never shows in a command line or a log
  execFileSync('python3', [fileURLToPath(new URL('./send-mail.py', import.meta.url))], { input: JSON.stringify({ to: para, subject: prueba ? `[Test] ${asunto}` : asunto, text: texto, html, issues: numeros.map(Number), test: !!prueba }), stdio: ['pipe', 'inherit', 'inherit'] });
  if (prueba) { console.log(`Test email with ${numeros.map(n => `#${n}`).join(', ')} sent to the test address; nothing else touched.`); return; }
  for (const x of todos) {
    await borrar(x.id, t);
    const junto = todos.length > 1 ? ` in one email together with ${todos.filter(y => y !== x).map(y => `#${y.numero}`).join(', ')}` : '';
    gh('issue', 'comment', x.numero, '--body', `📧 Reply emailed to \`${x.mascara}\`${junto}; the address was then deleted (D-317).\n${RESPONDIDO}`);
  }
  console.log(`${numeros.map(n => `#${n}`).join(', ')}: one email to ${todos[0].mascara}, addresses deleted.`);
}

/** Feedback issues waiting for an email reply, grouped by player (by the address, read with the key). */
async function pendientesCorreo() {
  const issues = JSON.parse(gh('issue', 'list', '--label', ETIQUETA, '--state', 'all', '--limit', '200', '--json', 'number,title,body,comments,state'))
    .filter(i => quiereCorreo(i.body) && !atendido(i.comments));
  if (!issues.length) return console.log('Nobody waiting for an email reply.');
  const t = await llave();
  const grupos = new Map();
  for (const i of issues.reverse()) {
    const c = await (await import('../firebase/firebase-admin.mjs')).leer(`feedbackContacto/${idDe(i.body)}`, t);
    const clave = c?.correo?.toLowerCase() || `(no address) #${i.number}`;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(i);
  }
  for (const [clave, lista] of grupos) {
    const mascara = /\*\*Email:\*\* `([^`]+)`/.exec(lista[0].body)?.[1] || '?';
    const abiertos = lista.filter(i => i.state === 'OPEN').length;
    console.log(`- ${clave.startsWith('(') ? clave : mascara}${nombreDe(lista[0].body) ? ` (${nombreDe(lista[0].body)})` : ''}: ${lista.map(i => `#${i.number}${i.state === 'OPEN' ? ' (open)' : ''}`).join(', ')}`);
    console.log(`  ${abiertos ? `${abiertos} still open: resolve them first, then` : 'all resolved:'} feedback.mjs reply ${lista.map(i => i.number).join(',')} <answer.txt> --lang <xx>`);
  }
}

async function olvidar(numero, motivo) {
  if (!motivo) throw new Error('Say why there is no email (e.g. "destructive feedback").');
  const t = await llave();
  const { id, mascara } = await contactoDe(numero, t);
  await borrar(id, t);
  gh('issue', 'comment', String(numero), '--body', `No email reply (${inerte(motivo)}); the address \`${mascara}\` was deleted (D-317).\n${OLVIDADO}`);
  console.log(`#${numero}: address deleted, no email.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [orden, a, b] = process.argv.slice(2);
  const opcion = n => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
  const fallar = e => { console.error(e.message); process.exit(1); };
  if (orden === 'sincronizar') sincronizar(process.argv.includes('--simular')).catch(fallar);
  else if (orden === 'pending') pendientesCorreo().catch(fallar);
  else if (orden === 'reply' && a && b && opcion('--lang')) responder(a, b, opcion('--lang'), { simular: process.argv.includes('--dry-run'), prueba: opcion('--test-to') }).catch(fallar);
  else if (orden === 'forget' && a) olvidar(a, b).catch(fallar);
  else { console.error('Usage: node tools/agents/feedback.mjs sincronizar [--simular] | pending | reply <n>[,<n>…] <answer.txt> --lang <es|en|pt|de> [--dry-run | --test-to <address>] | forget <issue> "<reason>"'); process.exit(2); }
}
