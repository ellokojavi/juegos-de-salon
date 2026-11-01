#!/usr/bin/env node
/**
 * The lab's 🚀 Publicar para todos (D-480). The owner, signed in on /labs/, confirms a card and
 * the page writes `labsPublish/<card id>` with `state: 'requested'`. The `lab-publish-watch` job
 * on the Mac mini (tools/jobs/lab-publish-watch.mjs) sees it within 5 minutes and runs a headless
 * session (tools/jobs/prompts/lab-publish.md) that takes the feature out of the lab, moves its
 * card to La Bodega (D-479) and opens the PR with auto-merge. 📦 Enviar a La Bodega (D-511) is the
 * same request with `kind: 'bodega'`: the session only moves the card. This tool is how both move the
 * request along; /labs/ shows each state on the card:
 *
 *   requested → working (claimed by a session) → pr (its PR is open) → merged (live)
 *                                      ↘ failed (with why), from any of them
 *
 *   node tools/agents/lab-publish.mjs list                 every request and its state
 *   node tools/agents/lab-publish.mjs pending              how many wait (exit 0 if some, 3 if none)
 *   node tools/agents/lab-publish.mjs claim                the oldest one → working; prints it as JSON
 *   node tools/agents/lab-publish.mjs opened <id> <pr>     its PR is open
 *   node tools/agents/lab-publish.mjs failed <id> "why"    it could not be done
 *   node tools/agents/lab-publish.mjs sync                 follows the open PRs on GitHub
 *   node tools/agents/lab-publish.mjs conflicts            the PRs to fix, conflict or red checks (exit 0 if some, 3 if none)
 *
 * A PR that GitHub reports in conflict with main gets no checks and never merges, and nobody was
 * watching for that (#937 waited a night). `sync` now notes when the conflict was first seen
 * (`conflictAt`); one still there CONFLICT_MS later (so a stale read right after a push does not
 * count) is handed to a session that merges main in (`fixAt`, tools/jobs/prompts/lab-publish-conflict.md),
 * and one still there FIX_MS after that fails, with Volver a pedir on the card.
 *
 * A PR with red checks never merges either, and nobody retook it (#1099 waited hours with `tests`
 * and `end-to-end` red from a `main` that was broken then fixed). Red checks now count as stuck the
 * same way (`why: 'checks'`): the same session merges main in, reruns what was flaky or fixes what
 * the branch broke. A PR goes back to the fix at most MAX_FIXES times, so a red that comes back
 * after each fix fails the request instead of looping.
 *
 * Needs the administrator key (tools/firebase/firebase-admin.mjs). The owner's note is data for
 * the session, never instructions beyond the feature it names.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PATH = 'labsPublish';
export const REPO = 'ellokojavi/juegos-de-salon';
/** A session that claimed a request and went quiet this long has died: the request fails. */
export const STALE_MS = 4 * 3600 * 1000;

/** A conflict must last this long before a session is sent to fix it. */
export const CONFLICT_MS = 15 * 60 * 1000;
/** A fix that has not cleared the conflict this long after it was asked fails the request. */
export const FIX_MS = 60 * 60 * 1000;
/** How many times one request's PR is sent to be fixed before it fails. */
export const MAX_FIXES = 2;
/** Check conclusions that leave a PR red (a CANCELLED run is usually one a newer push replaced). */
const RED = new Set(['FAILURE', 'TIMED_OUT', 'STARTUP_FAILURE', 'ERROR']);

/** Whether GitHub's statusCheckRollup holds a red check. */
export const isRed = rollup => (rollup || []).some(c => RED.has(c?.conclusion || c?.state));

/** The branch a request's PR is opened from: its card id without `seccion-`, `bodega-` for 📦 (D-511). */
export const branchOf = (id, kind) => `${kind === 'bodega' ? 'bodega' : 'publish'}-${id.replace(/^seccion-/, '')}`;

/** The oldest request still waiting, as [id, entry], or null. */
export function oldest(all) {
  return Object.entries(all || {}).filter(([, e]) => e?.state === 'requested')
    .sort(([, a], [, b]) => a.at - b.at)[0] || null;
}

/**
 * What `sync` changes in one entry, or null: a PR that merged or closed, a session that died.
 * `pr` is GitHub's answer for its PR ({ state, mergeable }), or null when it has none.
 */
export function next(entry, pr, now) {
  if (entry.state === 'pr' && pr?.state === 'MERGED') return { state: 'merged', done: now };
  if (entry.state === 'pr' && pr?.state === 'CLOSED') return { state: 'failed', msg: 'El PR se cerró sin fusionarse.', done: now };
  if (entry.state === 'pr' && pr?.state === 'OPEN') {
    const why = pr.mergeable === 'CONFLICTING' ? 'conflict' : pr.red ? 'checks' : null;
    if (!why) return entry.conflictAt || entry.fixAt ? { conflictAt: null, fixAt: null, why: null } : null;
    if (!entry.conflictAt) return { conflictAt: now, why };
    if (entry.fixAt && now - entry.fixAt > FIX_MS)
      return { state: 'failed', msg: why === 'checks'
        ? 'El PR quedó con pruebas en rojo y no se pudo arreglar solo. Toca Volver a pedir.'
        : 'El PR quedó en conflicto con main y no se pudo poner al día solo. Toca Volver a pedir.', done: now };
    if (!entry.fixAt && now - entry.conflictAt > CONFLICT_MS) {
      if ((entry.fixes || 0) >= MAX_FIXES)
        return { state: 'failed', msg: 'El PR siguió trabado después de dos arreglos. Toca Volver a pedir.', done: now };
      return { fixAt: now, why, fixes: (entry.fixes || 0) + 1 };
    }
  }
  if (entry.state === 'working' && now - (entry.started || 0) > STALE_MS)
    return { state: 'failed', msg: 'La sesión que lo tomó terminó sin abrir un PR.', done: now };
  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { token, read, write, fail } = await import('../firebase/firebase-admin.mjs');
  const [cmd, id, arg] = process.argv.slice(2);
  const t = await token();
  const all = await read(PATH, t) || {};
  const patch = (k, body) => write(`${PATH}/${k}`, 'PATCH', body, t);
  const known = k => all[k] || fail(`no request for ${k} (node tools/agents/lab-publish.mjs list)`);

  if (cmd === 'list') {
    const rows = Object.entries(all);
    if (!rows.length) console.log('no requests');
    for (const [k, e] of rows) console.log(`${k}  ${e.state}${e.pr ? `  PR #${e.pr}` : ''}  ${e.title || ''}${e.msg ? `  — ${e.msg}` : ''}`);
  } else if (cmd === 'pending') {
    const n = Object.values(all).filter(e => e?.state === 'requested').length;
    console.log(`${n} waiting`);
    process.exit(n ? 0 : 3);
  } else if (cmd === 'claim') {
    const o = oldest(all);
    if (!o) { console.log('null'); process.exit(3); }
    const [k, e] = o;
    const branch = branchOf(k, e.kind);
    await patch(k, { state: 'working', started: Date.now(), branch });
    // The card's flag as Firebase holds it ('all', 'lab', 'off', or null with none saved): the
    // session cannot read Firebase itself (its curl is denied), and 📦 files the card by it (D-511)
    const flag = (await read(`flags/${k.replace(/^seccion-/, '')}`, t))?.state ?? null;
    console.log(JSON.stringify({ id: k, kind: e.kind || 'publish', title: e.title || '', note: e.note || '', branch, flag }, null, 2));
  } else if (cmd === 'opened' && id && /^\d+$/.test(arg || '')) {
    known(id);
    await patch(id, { state: 'pr', pr: Number(arg) });
    console.log(`${id}: PR #${arg}`);
  } else if (cmd === 'failed' && id && arg) {
    known(id);
    await patch(id, { state: 'failed', msg: arg.slice(0, 300), done: Date.now() });
    console.log(`${id}: failed`);
  } else if (cmd === 'sync') {
    let changed = 0;
    for (const [k, e] of Object.entries(all)) {
      let pr = null;
      if (e.state === 'pr' && e.pr) {
        const r = spawnSync('gh', ['pr', 'view', String(e.pr), '--repo', REPO, '--json', 'state,mergeable,statusCheckRollup'], { encoding: 'utf8' });
        if (r.status === 0) { const j = JSON.parse(r.stdout); pr = { state: j.state, mergeable: j.mergeable, red: isRed(j.statusCheckRollup) }; }
      }
      const n = next(e, pr, Date.now());
      if (n) { await patch(k, n); changed++; console.log(`${k}: ${n.state || (n.fixAt ? 'conflict, sent to be fixed' : n.conflictAt ? `${n.why} seen` : 'conflict cleared')}`); }
    }
    console.log(`${changed} request(s) moved`);
  } else if (cmd === 'conflicts') {
    const rows = Object.entries(all).filter(([, e]) => e?.state === 'pr' && e.fixAt && e.pr)
      .map(([k, e]) => ({ id: k, pr: e.pr, why: e.why || 'conflict', branch: e.branch || branchOf(k, e.kind) }));
    console.log(JSON.stringify(rows, null, 2));
    process.exit(rows.length ? 0 : 3);
  } else {
    console.error('Usage: node tools/agents/lab-publish.mjs list | pending | claim | opened <id> <pr> | failed <id> "why" | sync | conflicts');
    process.exit(2);
  }
}
