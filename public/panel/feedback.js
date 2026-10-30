/**
 * The panel's 💬 Feedback section: every player message in full, who sent it, and where it stands.
 * The message is `feedback/<id>`; its issue and PRs are `feedbackEstado/<id>`, which
 * `tools/agents/feedback.mjs sync` writes from GitHub every 5 minutes (the `feedback-watch` job).
 * Pure and without DOM, to test it with node (`node public/panel/feedback.test.mjs`).
 */

/**
 * Where a message stands, in the order it moves:
 * - `new`: no issue yet (the next sync pass uploads it);
 * - `open`: an issue, no PR yet;
 * - `in-pr`: a PR is open for it;
 * - `merged`: a PR was merged, the issue is still open (the reply is pending);
 * - `closed`: the issue is closed (`replied` says if the player got an email).
 */
export const STAGES = ['new', 'open', 'in-pr', 'merged', 'closed'];

export function stageOf(st) {
  if (!st?.issue) return 'new';
  if (st.state === 'closed') return 'closed';
  const prs = st.prs || [];
  if (prs.some(p => p.state === 'open')) return 'in-pr';
  if (prs.some(p => p.state === 'merged')) return 'merged';
  return 'open';
}

/** The filter's buckets: what still needs something, what is done, everything. */
export const FILTERS = { open: s => s !== 'closed', closed: s => s === 'closed', all: () => true };

/** The report's context: an object, or the JSON text the app and the inbox write (`contexto`). */
export function contextOf(f) {
  const c = f?.contexto;
  if (c && typeof c === 'object') return c;
  try { return JSON.parse(c) || {}; } catch (_) { return {}; }
}

/** Where the message came from: an email to hola@ (the support agent's `inbox.mjs ingest`) or the app. */
export const channelOf = f => (f?.v === 'email' || contextOf(f).canal === 'email' ? 'email' : 'app');

/** One row per message, newest first, with its stage. */
export function feedbackRows(feedback = {}, estado = {}, filter = 'all', channel = 'all') {
  const keep = FILTERS[filter] || FILTERS.all;
  return Object.entries(feedback || {})
    .filter(([, f]) => f && String(f.texto || '').trim())
    .map(([id, f]) => {
      const st = estado?.[id] || null;
      const ctx = contextOf(f);
      return {
        channel: channelOf(f),
        id, at: Number(f.at) || 0, name: String(f.nombre || ''), text: String(f.texto || ''), tipo: f.tipo || '',
        game: ctx.juego || '', email: f.correoMascara || '', tester: !!f.tester,
        issue: st?.issue || null, replied: !!st?.replied, prs: st?.prs || [], stage: stageOf(st),
      };
    })
    .filter(r => keep(r.stage) && (channel === 'all' || r.channel === channel))
    .sort((a, b) => b.at - a.at);
}

/** How many messages are in each stage. */
export const countStages = rows => Object.fromEntries(STAGES.map(s => [s, rows.filter(r => r.stage === s).length]));
