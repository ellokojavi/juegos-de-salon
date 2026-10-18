#!/usr/bin/env node
/**
 * The weekly report (D-352): every Sunday, the week that ended on Saturday against the one before,
 * as a PDF saved on the owner's disk and emailed to the owner.
 *
 *   node tools/reports/weekly.mjs                  the last closed week: PDF on disk, no email
 *   node tools/reports/weekly.mjs --send           …and emailed to the owner (send-mail.py, `toOwner`)
 *   node tools/reports/weekly.mjs --date 2026-10-18 --send   the week closed before that day
 *   node tools/reports/weekly.mjs --out <folder>   where the PDF goes (default below)
 *
 * It reads as administrator (the owner's key, D-122) what the panel reads, and computes it with
 * the panel's own accounts (`weekly-data.mjs`). The PDF is printed by the same headless Chrome the
 * end-to-end tests use. The scheduled task "weekly-report" (the app, on the owner's Mac mini) runs
 * it with --send every Sunday.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { token, fail } from '../firebase/firebase-admin.mjs';
import { firebaseConfig } from '../../public/assets/js/firebase-config.js';
import { launch, sleep } from '../e2e/cdp.mjs';
import { semana, semanaCerrada } from './weekly-data.mjs';
import { htmlDelInforme, destacados } from './weekly-html.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const flag = (n, def = null) => { const i = args.indexOf(`--${n}`); return i < 0 ? def : args[i + 1]; };
export const CARPETA = join(homedir(), 'Documents', 'Juegos de Salón', 'Weekly reports');
const out = flag('out', CARPETA);
const now = flag('date') ? Date.parse(`${flag('date')}T12:00:00Z`) : Date.now();
if (!Number.isFinite(now)) fail('--date goes as YYYY-MM-DD.');

/** Reads a node as administrator, with an optional REST query (`orderBy`, `startAt`). */
async function leer(ruta, t, query = {}) {
  const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(query).map(([k, v]) => [k, JSON.stringify(v)])), access_token: t });
  const res = await fetch(`${firebaseConfig.databaseURL}/${ruta}.json?${q}`);
  if (!res.ok) fail(`Could not read ${ruta}/ (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) || {};
}

const w = semanaCerrada(now);
const t = await token();
// Two weeks for the comparison, and 28 days more so returns and the users' first sight have history
const [days, torneos, historia, invitados, rachas, feedback] = await Promise.all([
  leer('stats/prod/days', t, { orderBy: '$key', startAt: String(w.from - 7 - 28) }),
  leer('torneos', t), leer('unoAlDia', t), leer('invitados', t), leer('records/uno-al-dia-racha/siempre', t), leer('feedback', t),
]);
const changelog = existsSync(join(ROOT, 'CHANGELOG.md')) ? readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8') : '';
const r = semana({ days, torneos, uad: { historia, invitados, rachas }, feedback, changelog }, now);

// The PDF, printed by headless Chrome from the page written to a temporary file
mkdirSync(out, { recursive: true });
const nombre = `juegos-de-salon-weekly-${new Date((w.to) * 864e5).toISOString().slice(0, 10)}`;
const tmp = mkdtempSync(join(tmpdir(), 'weekly-report-'));
const html = join(tmp, `${nombre}.html`);
writeFileSync(html, htmlDelInforme(r));
const b = await launch({ dir: join(tmp, 'chrome'), out: tmp, width: 900, height: 1200 });
await b.go(`file://${html}`, 1500);
await sleep(300);
const pdf = await b.send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
b.close();
// Chrome may still be closing its profile: a few tries, and a leftover in the temp folder is no failure
try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch (_) { /* the system clears it */ }
const data = pdf?.result?.data ?? pdf?.data;
if (!data) fail('Chrome did not print the PDF.');
const archivo = join(out, `${nombre}.pdf`);
writeFileSync(archivo, Buffer.from(data, 'base64'));
console.log(`✓ ${archivo}`);

if (args.includes('--send')) {
  const texto = [`Juegos de Salón · weekly report, ${r.desde} – ${r.hasta}`, '', ...destacados(r).map(x => `• ${x.replace(/<[^>]+>/g, '')}`), '',
    ...r.titular.map(f => `${f.nombre}: ${f.ahora ?? '—'} (week before: ${f.antes ?? '—'})`), '', 'The full report is attached as a PDF.'].join('\n');
  const msg = { toOwner: true, subject: `📊 Juegos de Salón · week of ${r.desde} – ${r.hasta}`, text: texto, attachments: [archivo] };
  const res = spawnSync('python3', [join(ROOT, 'tools/agents/send-mail.py')], { input: JSON.stringify(msg), encoding: 'utf8' });
  if (res.status !== 0) fail(`✗ The email was not sent: ${(res.stderr || res.stdout || '').trim()}`);
  console.log(`✓ emailed to the owner (${(res.stderr || '').trim()})`);
}
