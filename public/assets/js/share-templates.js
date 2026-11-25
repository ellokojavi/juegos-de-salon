/**
 * Every message the app shares is built here (docs/SHARING.md, the owner 2026-11-24): one template per
 * kind, so the format of U-30 comes from one place and a test can check it.
 *
 *   {emoji} *{title}* · {context}     ← the header, the same as the image's when there is one
 *                                     ← a blank line
 *   🎮 {tagline}                      ← what the game is about (lab flag share-tagline), games only
 *   one idea per line, each with its emoji; paragraphs apart by a blank line
 *
 * The link is not part of the text: `compartir()` adds it as the last line (🔗 …, D-124).
 *
 * The kinds (a new share picks one; a new kind needs a D-n):
 *   room    T1 an invite to a game's room          (no image: the link's card)
 *   invite  T2 an invite to a cup, a duel, Uno al día (no image)
 *   app     T3 the app itself                       (the home page's card as image)
 *   game    T4 one game's link                      (no image)
 *   result  T5 a result                             (the result's image)
 *   table   T6 a table or a ranking                 (the table's image)
 *   video   the promo video                         (YouTube's preview)
 *
 * Pure: no DOM, no network; `compartir.js` and the pages call these and pass the text to `compartir()`.
 */

export const KINDS = ['room', 'invite', 'app', 'game', 'result', 'table', 'video'];

/** `🏆 *La Copa: Valdenenas* · Día 3 de 7` */
export const header = ({ emoji, title, context }) => `${emoji} *${title}*${context ? ` · ${context}` : ''}`;

/** The game's own line: `🎮 {tagline}` in the language ('' with no tagline). */
export function taglineOf(tagline, lang = 'es') {
  if (!tagline) return '';
  const t = typeof tagline === 'string' ? tagline : (tagline[lang] || tagline.es || '');
  return t ? `🎮 ${t}` : '';
}

/**
 * The one builder: the header, a blank line, and the body. `lines` are one paragraph (an idea a line);
 * `paragraphs` are several, a blank line apart. Empty lines and paragraphs are dropped.
 */
export function message({ kind, head, tagline = '', lines = [], paragraphs = [] }) {
  if (!KINDS.includes(kind)) throw new Error(`share kind '${kind}' is not one of ${KINDS.join(', ')}`);
  const para = ls => ls.flat().filter(Boolean).map(String).join('\n');
  const body = [para([tagline, ...lines]), ...paragraphs.map(p => (Array.isArray(p) ? para(p) : String(p || '').trim()))].filter(Boolean);
  return [header(head), ...body].join('\n\n').replace(/\n{3,}/g, '\n\n');
}

/* ------------------------------------------------------------------ */
/* One function per use                                                */
/* ------------------------------------------------------------------ */

/** T1: `🪢 *El Ahorcado* · Sala WFBN`, who invites and the game's line. `C` = COMMON[lang]. */
export const roomInvite = ({ C, emoji, game, code, name, tagline = '' }) => message({
  kind: 'room', head: { emoji, title: game, context: C.roomContext.replace('{code}', code) }, tagline,
  lines: [String(name || '').trim() ? C.roomLine.replace('{name}', String(name).trim()) : C.roomLineNoName],
});

/** T3: the app, from the home page (D-226): `🎲 *Juegos de Salón* · {n} juegos…` and LO_PRINCIPAL. */
export const appInvite = ({ C, games }) => message({
  kind: 'app', head: { emoji: '🎲', title: C.appTitle, context: C.shareApp.context.replace('{n}', games) }, lines: C.shareApp.lines,
});

/** The video (D-253): its header and lines; the YouTube link goes after. */
export const videoShare = ({ C }) => message({
  kind: 'video', head: { emoji: '🎬', title: C.appTitle, context: C.shareSheet.videoContext }, lines: C.shareSheet.videoLines,
});

/** T4: one game's link: its name, what it is about and the call to play. */
export const gameLink = ({ C, emoji, name, tagline = '' }) => message({ kind: 'game', head: { emoji, title: name }, tagline, lines: [C.shareGameCta] });

/** T5 played alone (D-165, D-171): the header and the challenge; the image says the rest. */
export const soloResult = ({ C, emoji, game, tagline = '' }) => message({
  kind: 'result', head: { emoji, title: game, context: C.shareSoloContext }, tagline, lines: [C.shareSoloCta],
});

/** T2/T5/T6 of anything else: the header and its paragraphs. */
export const invite = ({ head, tagline, lines, paragraphs }) => message({ kind: 'invite', head, tagline, lines, paragraphs });
export const result = ({ head, tagline, lines, paragraphs }) => message({ kind: 'result', head, tagline, lines, paragraphs });
export const table = ({ head, lines, paragraphs }) => message({ kind: 'table', head, lines, paragraphs });

/* ------------------------------------------------------------------ */
/* The check (U-30), for the tests                                     */
/* ------------------------------------------------------------------ */

/**
 * What is wrong with a message's text (before the link): [] when it follows U-30. The header first,
 * a blank line after it, no line that is only spaces, no doubled blank line, no `🔗` inside (the link
 * is added last), no double space (a name that did not arrive).
 */
export function formatProblems(text) {
  const p = [];
  const ls = String(text).split('\n');
  if (!/^\S+ \*[^*\n]+\*( · \S.*)?$/u.test(ls[0] || '')) p.push(`the first line is not a header "{emoji} *{title}* · {context}": ${ls[0]}`);
  if (ls.length > 1 && ls[1] !== '') p.push('no blank line after the header');
  if (/\n\n\n/.test(text)) p.push('a doubled blank line');
  if (ls.some(l => l !== '' && !l.trim())) p.push('a line of only spaces');
  if (ls.some(l => / {2,}/.test(l.trim()))) p.push(`a double space (an empty name?): ${ls.find(l => / {2,}/.test(l.trim()))}`);
  if (text.includes('🔗')) p.push('a link inside the text: compartir() adds it last');
  if (/\{[a-z]+\}/i.test(text)) p.push(`a placeholder left unfilled: ${text.match(/\{[a-z]+\}/i)[0]}`);
  return p;
}
