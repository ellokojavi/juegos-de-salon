#!/usr/bin/env node
/**
 * The lab's 🚀 Publicar para todos (D-480). The owner, signed in on /labs/, confirms a card and
 * the page writes `labsPublish/<card id>` with `state: 'requested'`. The `lab-publish-watch` job
 * on the Mac mini (tools/jobs/lab-publish-watch.mjs) sees it within 5 minutes and runs a headless
 * session (tools/jobs/prompts/lab-publish.md) that takes the feature out of the lab, moves its
 * card to La Bodega (D-479) and opens the PR with auto-merge. This tool is how both move the
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

/** The branch a request's PR is opened from: its card id without `seccion-`. */
export const branchOf = id => `publish-${id.replace(/^seccion-/, '')}`;

/** The oldest request still waiting, as [id, entry], or null. */
export function oldest(all) {
  return Object.entries(all || {}).filter(([, e]) => e?.state === 'requested')
    .sort(([, a], [, b]) => a.at - b.at)[0] || null;
}

/**
 * What `sync` changes in one entry, or null: a PR that merged or closed, a session that died.
 * `pr` is GitHub's answer for its PR ({ state, mergedAt }), or null when it has none.
 */
export function next(entry, pr, now) {
  if (entry.state === 'pr' && pr?.state === 'MERGED') return { state: 'merged', done: now };
  if (entry.state === 'pr' && pr?.state === 'CLOSED') return { state: 'failed', msg: 'El PR se cerró sin fusionarse.', done: now };
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
    const branch = branchOf(k);
    await patch(k, { state: 'working', started: Date.now(), branch });
    console.log(JSON.stringify({ id: k, title: e.title || '', note: e.note || '', branch }, null, 2));
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
        const r = spawnSync('gh', ['pr', 'view', String(e.pr), '--repo', REPO, '--json', 'state,mergedAt'], { encoding: 'utf8' });
        if (r.status === 0) pr = JSON.parse(r.stdout);
      }
      const n = next(e, pr, Date.now());
      if (n) { await patch(k, n); changed++; console.log(`${k}: ${n.state}`); }
    }
    console.log(`${changed} request(s) moved`);
  } else {
    console.error('Usage: node tools/agents/lab-publish.mjs list | pending | claim | opened <id> <pr> | failed <id> "why" | sync');
    process.exit(2);
  }
}
