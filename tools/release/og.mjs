/**
 * The social cards (Open Graph): what is seen when someone pastes a link to the app in WhatsApp,
 * in a chat or on a network. They matter more to this app than to others: room links are shared
 * over WhatsApp, so the invitation to play **is** one of these cards.
 *
 *   node tools/release/og.mjs cards    rewrites the <!-- generated: og --> block of each page,
 *                                generates the page of each of The Cup's games (public/<slug>/)
 *                                and the bridge pages of the old routes (D-192, D-198)
 *   node tools/release/og.mjs header   the header of the feedback reply email (D-317), 1200×340,
 *                                in public/assets/email/header.jpg
 *   node tools/release/og.mjs images   retakes with Chrome the 1200×630 images that fell behind
 *                                (needs internet: the fonts come from Google Fonts).
 *                                With --all, retakes them all
 *   node tools/release/og.mjs check    is any page left without a block, or any image not made or
 *                                made with another drawing or other texts? (D-181)
 *
 * `cards` also writes what search engines read (#887): each indexed page's block ends with its
 * JSON-LD (the games as `VideoGame` + `WebApplication`, the doors as `WebSite`; a game's
 * "Cómo se juega" also as a `FAQPage`), and
 * public/sitemap.xml and public/robots.txt list the indexed pages. `check` blocks them stale too.
 *
 * The texts come from public/assets/js/games.js, which is also where the menu comes from: a single
 * place to change a game's name or tagline. `check`, in the `tests` check of each PR, blocks cards
 * that fell behind games.js; the images are retaken by hand, because they need a browser (and they
 * only change if a name, an emoji or the card's design changes).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { GAMES, SUELTOS } from '../../public/assets/js/games.js';
import { COMMON, LANGS } from '../../public/assets/js/i18n.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'https://juegosdesalon.cl';
// With several sessions at once, each one its own (D-135): PORT=87xx CDP_PORT=94xx
const PORT = Number(process.env.PORT || process.env.PUERTO) || 8791;
const CDP_PORT = Number(process.env.CDP_PORT || process.env.PUERTO_CDP) || 9490;
const WIDTH = 1200, HEIGHT = 630;

const available = GAMES.filter(g => g.available);
// A lab game does not go on the home page, but its links are shared: it gets its card (D-101).
// The same for a switched-off game that keeps its page (Julep): whoever has the link keeps sharing
// it, and without this its card stayed with the drawing and texts from when it was switched off.
const withCard = GAMES.filter(g => g.available || g.labs || existsSync(join(ROOT, 'public', g.path, 'index.html')));

/**
 * The entrance doors: the home page in Spanish and the ones that leave the language chosen (/pt/,
 * /en/ and /de/). Each one is shared in its language, so its card is too (D-74, D-197).
 */
const DOORS = [
  { lang: 'es', file: 'public/index.html', route: '/', image: 'menu' },
  { lang: 'pt', file: 'public/pt/index.html', route: '/pt/', image: 'menu-pt' },
  { lang: 'en', file: 'public/en/index.html', route: '/en/', image: 'menu-en' },
  { lang: 'de', file: 'public/de/index.html', route: '/de/', image: 'menu-de' },
];
/** The tagline's closing. It is the only phrase that does not come from the app: it is said to the robots. */
const FREE = { es: 'Gratis, sin instalar y sin cuenta.', en: 'Free, no install, no account.', pt: 'De graça, sem instalar e sem conta.', de: 'Kostenlos, ohne Installation und ohne Konto.' };
/**
 * What the list of games does not say: One a Day and the games to play solo (D-271). Without
 * this, the home page's card only told the group games. One a Day's name comes from the app.
 */
const ALSO = {
  es: n => `Además, ${n} y juegos para jugar solo.`,
  en: n => `Plus ${n} and games to play solo.`,
  pt: n => `E ainda ${n} e jogos para jogar sozinho.`,
  de: n => `Dazu das ${n} und Spiele zum Alleinspielen.`,
};
/** "A, B and C" in each language. */
const list = lang => available.map(g => g.name[lang]).join(', ')
  .replace(/, ([^,]*)$/, ` ${{ es: 'y', en: 'and', pt: 'e', de: 'und' }[lang]} $1`);

const door = p => ({
  ...p,
  // Without saying how many: the number changes every time a game gets in, and a phrase that
  // ages on its own is worse than one that counts nothing. The list is built from games.js.
  title: `${COMMON[p.lang].appTitle} 🎲`,
  description: `${COMMON[p.lang].appSub.replace(/\.$/, '')}: ${list(p.lang)}. ${ALSO[p.lang](COMMON[p.lang].uad.nombre)} ${FREE[p.lang]}`,
  alt: `${COMMON[p.lang].appTitle}: ` + available.map(g => g.emoji).join(' '),
  door: true,
});

const pages = () => [...DOORS.map(door), ...withCard.map(g => ({
  lang: 'es',
  file: `public/${g.path}index.html`,
  route: `/${g.path}`,
  image: g.id,
  game: g.id,
  title: `${g.name.es} ${g.emoji} · Juegos de Salón`,
  description: `${g.tagline.es} ${g.players} jugadores, ${g.duration} ${g.durationUnit?.es || 'min'}. Gratis, sin instalar y sin cuenta.`,
  alt: `${g.name.es}: ${g.tagline.es}`,
})), ...SUELTOS.map(m => ({
  lang: 'es',
  file: `public/${m.path}index.html`,
  route: `/${m.path}`,
  image: m.id,
  game: m.id,
  standalone: true,
  slug: m.slug,
  title: `${m.name.es} ${m.emoji} · Juegos de Salón`,
  description: `${m.tagline.es} Un jugador, ${m.duration} min. Gratis, sin instalar y sin cuenta.`,
  alt: `${m.name.es}: ${m.tagline.es}`,
}))];

/**
 * An image's fingerprint (D-181): what draws it (marketing/share-cards/card.html) and what it says (the
 * game in games.js, or the home page's texts). Each image saves its own in
 * public/assets/og/huellas.json when it is made, and `check` compares it with today's: that way an
 * image made with the old drawing, or before a tagline changed, does not pass as up to date. It
 * used to check only that it existed, and the misaligned pills came back every time someone made
 * an image from an old branch.
 */
const FINGERPRINTS = join(ROOT, 'public/assets/og/huellas.json');
const readFingerprints = () => { try { return JSON.parse(readFileSync(FINGERPRINTS, 'utf8')); } catch (_) { return {}; } };
/**
 * Only the languages that have a card (`LANGS`, without the lab's ones, D-191): adding German
 * to games.js changes no image, so it cannot leave them stale either.
 */
const inCards = o => (o && typeof o === 'object' ? Object.fromEntries(LANGS.filter(l => l in o).map(l => [l, o[l]])) : o);
/**
 * From `COMMON`, only what the home page's card draws (`marketing/share-cards/card.html`): a new app text (the one
 * for sharing it, D-226) does not leave it stale.
 */
const cardTexts = lang => Object.fromEntries(['appTitle', 'appSub'].map(k => [k, COMMON[lang][k]]));
function fingerprint(p) {
  const game = p.game && [...GAMES, ...SUELTOS].find(g => g.id === p.game);
  const data = game
    ? { emoji: game.emoji, name: inCards(game.name), tagline: inCards(game.tagline), players: game.players, duration: game.duration, durationUnit: inCards(game.durationUnit) }
    : { lang: p.lang, texts: cardTexts(p.lang), games: available.map(g => [g.id, g.emoji]) };
  return createHash('sha256').update(readFileSync(join(ROOT, 'marketing/share-cards/card.html'), 'utf8')).update(JSON.stringify(data)).digest('hex').slice(0, 16);
}
/** Is the image missing, or was it made with another drawing or other texts? */
const stale = (p, prints = readFingerprints()) => !existsSync(join(ROOT, `public/assets/og/${p.image}.jpg`)) || prints[p.image] !== fingerprint(p);

/* ------------------------------------------------------------------ */
/* The page of each of The Cup's games                                 */
/* ------------------------------------------------------------------ */
/**
 * A WhatsApp robot does not run JavaScript: it reads the HTML tags as they arrive. With a single
 * page for all (/cup/suelto/?reinas) every link brought the same card, so each game has its own
 * (D-162), at the root like the others (D-198). It is a copy of public/cup/suelto/index.html one
 * level up, with its title, its card and `data-suelto="<id>"`: it is regenerated, not edited. Like
 * the original, it carries no version: set-version.py puts the import map in at publish time (D-205).
 */
const COPY_NOTICE = () => `  <!-- Generated by node tools/release/og.mjs cards from public/cup/suelto/index.html: not edited by hand (D-162). -->`;
const LABS_DOOR = route => `  <script src="${'../'.repeat(route.split('/').filter(Boolean).length)}assets/js/labs-puerta.js"></script>\n  <meta name="robots" content="noindex, nofollow">`;
function standalonePage(p, ogBlock) {
  let html = readFileSync(join(ROOT, 'public/cup/suelto/index.html'), 'utf8');
  // Its generic tags and the comment that explains the page for all (the one that names og.mjs)
  html = html.replace(/^ {2}<!--(?:(?!-->)[\s\S])*?og\.mjs[\s\S]*?-->\n/m, '');
  html = html.replace(/^ {2}<meta (name="description"|property="og:[^"]*"|name="twitter:[^"]*").*\n/gm, '');
  // One level up: the relative paths (href, src, the import map and the import) go up one less.
  // The lab's ones (/labs/case/, D-267) are at the same height as the template and stay the same
  if (p.route.split('/').filter(Boolean).length === 1) html = html.replace(/(["'])\.\.\/\.\.\//g, '$1../');
  html = html.replace(/<title>.*<\/title>/, `<title>${escape(p.title)}</title>\n${COPY_NOTICE()}`);
  // A lab game is not indexed and does not open without the key (D-281)
  if (p.route.startsWith('/labs/')) html = html.replace(COPY_NOTICE(), `${COPY_NOTICE()}\n${LABS_DOOR(p.route)}`);
  html = html.replace('<body data-suelto>', `<body data-suelto="${p.game}">`);
  return html.replace(/^( *<link rel="manifest".*\n)/m, `${ogBlock}\n$1`);
}

/* ------------------------------------------------------------------ */
/* The bridge pages of the old routes                                  */
/* ------------------------------------------------------------------ */
/**
 * The folders moved to English (D-192): /ahorcado/ is /hangman/. But the old links keep
 * circulating —room invitations over WhatsApp, a cup's own link (/copa/?pirata), bookmarks—, so
 * each old route stays as a bridge page that sends to the new one with the same behind it
 * (?room=…, ?pirata, &lang=…, #…). It carries the new page's card: a chat robot does not run
 * JavaScript and reads what it finds in the old one.
 *
 * The old route comes from the id, which was the folder (/<id>/ and /minijuegos/<id>/): a new game
 * with its folder equal to its id has no bridge. The Cup's games also lived in /minigames/<slug>/
 * until they stopped being "minigames" (D-198).
 */
const bridges = () => [
  ...pages().filter(p => p.game && !p.standalone && `/${p.game}/` !== p.route)
    .map(p => ({ ...p, old: `public/${p.game}/index.html`, to: `..${p.route}` })),
  ...pages().filter(p => p.standalone).flatMap(p => [
    { ...p, old: `public/minijuegos/${p.game}/index.html`, to: `../..${p.route}` },
    { ...p, old: `public/minigames/${p.slug}/index.html`, to: `../..${p.route}` },
  ]),
  // A lab game lives in /labs/<slug>/ (D-267): /<slug>/ leads there until it graduates
  ...pages().filter(p => p.standalone && p.route !== `/${p.slug}/`)
    .map(p => ({ ...p, old: `public/${p.slug}/index.html`, to: `..${p.route}` })),
  // A game sent to La Bodega (D-420) lives in /labs/<folder>/: its old /<folder>/ leads there
  ...pages().filter(p => p.game && !p.standalone && p.route.startsWith('/labs/'))
    .map(p => ({ ...p, old: `public/${p.route.slice('/labs/'.length)}index.html`, to: `..${p.route}` })),
  // A game that left the lab (`deLabs`, D-332): its old /labs/<slug>/ leads to /<slug>/
  ...pages().filter(p => p.standalone && SUELTOS.find(m => m.id === p.game)?.deLabs)
    .map(p => ({ ...p, old: `public/labs/${p.slug}/index.html`, to: `../..${p.route}` })),
  // The generic pages (/minijuegos/?reinas, /minigames/?reinas): the template sends each link to its place
  { old: 'public/minijuegos/index.html', to: '../cup/suelto/', title: 'Juegos de Salón 🎲' },
  { old: 'public/minigames/index.html', to: '../cup/suelto/', title: 'Juegos de Salón 🎲' },
];

// A lab game's bridge is not indexed either (D-281): it carries its card, but it is not announced
function bridgePage(p) {
  const og = p.route ? `\n${block(p, { ld: false })}` : '';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(p.title)}</title>
  <!-- Bridge page (D-192): this route moved to ${p.to.replace(/^(\.\.\/)+/, '/')}. Generated by node tools/release/og.mjs cards: not edited by hand. -->${p.route?.startsWith('/labs/') ? '\n  <meta name="robots" content="noindex, nofollow">' : ''}${og}
  <script>try { if (sessionStorage.getItem('juegos-de-salon:ref') === null) sessionStorage.setItem('juegos-de-salon:ref', document.referrer); } catch (e) {} location.replace('${p.to}' + location.search + location.hash);</script>
  <noscript><meta http-equiv="refresh" content="0; url=${p.to}"></noscript>
</head>
<body>
  <p><a href="${p.to}">${escape(p.title)}</a></p>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* The tags                                                            */
/* ------------------------------------------------------------------ */
const OPEN = '  <!-- generated: og · rewritten by node tools/release/og.mjs cards -->';
const CLOSE = '  <!-- /generated -->';
/** The Spanish markers from before D-316: `cards` replaces them, `check` flags them. */
const OLD_OPEN = '  <!-- generado: og · lo reescribe node tools/release/og.mjs tarjetas -->';
const OLD_CLOSE = '  <!-- /generado -->';
const escape = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const reEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const LOCALE = { es: 'es_CL', en: 'en_US', pt: 'pt_BR', de: 'de_DE' };

/* ------------------------------------------------------------------ */
/* What search engines read (#887)                                     */
/* ------------------------------------------------------------------ */
const gameOf = p => p.game && [...GAMES, ...SUELTOS].find(g => g.id === p.game);
/**
 * Announced to search engines: the doors and the games on the home page. Not the lab (noindex,
 * D-281), La Bodega or a switched-off game: their pages open for whoever has the link, nothing more.
 */
const indexed = p => {
  const g = gameOf(p);
  return !p.route.startsWith('/labs/') && (!g || (g.available && !g.bodega));
};
/**
 * A game's "Cómo se juega", as its cover shows it in Spanish: `howText`, or the list of `rules`
 * (Dudo, Generala). It is the page's only question and answer: the owner kept the cover to that
 * one block, so search engines read the same text the player does.
 */
const HOW = {};
for (const g of GAMES) {
  const file = join(ROOT, 'public', g.path, 'rules.js');
  if (!existsSync(file)) continue;
  const { LOCALES } = await import(file);
  const T = LOCALES?.es?.ui || LOCALES?.es;
  const text = T?.howText || (Array.isArray(T?.rules) && T.rules.join(' '));
  if (text) HOW[g.id] = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
/** '1–6' → { min: 1, max: 6 } */
const range = s => { const [a, b = a] = String(s).split(/[–-]/).map(Number); return { minValue: a, maxValue: b }; };
/**
 * Every game plays in the four languages, chosen inside (D-74): one URL, all of them. Free and with
 * no account; no rating, because we have none and an invented one is penalised.
 */
function jsonLd(p) {
  const url = SITE + p.route;
  const g = gameOf(p);
  const data = g ? {
    '@context': 'https://schema.org',
    '@type': ['VideoGame', 'WebApplication'],
    name: g.name.es,
    alternateName: [...new Set(Object.values(g.name))].filter(n => n !== g.name.es),
    description: g.tagline.es,
    url,
    image: `${SITE}/assets/og/${p.image}.jpg`,
    inLanguage: Object.keys(LOCALE),
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    numberOfPlayers: { '@type': 'QuantitativeValue', ...range(g.players) },
    isPartOf: { '@type': 'WebSite', name: 'Juegos de Salón', url: `${SITE}/` },
  } : {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Juegos de Salón',
    description: p.description,
    url,
    inLanguage: p.lang,
  };
  const how = g && HOW[g.id] && {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: `¿Cómo se juega ${g.name.es}?`, acceptedAnswer: { '@type': 'Answer', text: HOW[g.id] } }],
  };
  // `<` escaped, so no text can close the script
  const script = d => `  <script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`;
  return [data, how].filter(Boolean).map(script).join('\n');
}

/** The indexed pages; the doors name each other as one page in four languages (D-74). */
function sitemap() {
  const alt = DOORS.map(d => `    <xhtml:link rel="alternate" hreflang="${d.lang}" href="${SITE}${d.route}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`).join('\n');
  const urls = pages().filter(indexed).map(p => `  <url>\n    <loc>${SITE}${p.route}</loc>${p.door ? `\n${alt}` : ''}\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by node tools/release/og.mjs cards from games.js: not edited by hand (#887). -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}
// The lab is not disallowed: a robot that cannot read a page cannot see its noindex
const ROBOTS = `# Generated by node tools/release/og.mjs cards: not edited by hand (#887).
User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
const SEARCH_FILES = () => [['public/sitemap.xml', sitemap()], ['public/robots.txt', ROBOTS]];

function block(p, { ld = true } = {}) {
  // No ?v=: set-version.py puts it in at publish time, so a change of drawing does not get stuck
  // in WhatsApp's cache (D-72) without dirtying every PR with the version (D-205)
  const img = `${SITE}/assets/og/${p.image}.jpg`;
  const url = SITE + p.route;
  const others = Object.keys(LOCALE).filter(l => l !== p.lang);
  const meta = [
    ['name', 'description', p.description],
    ['canonical', null, url],
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Juegos de Salón'],
    ['property', 'og:url', url],
    ['property', 'og:title', p.title],
    ['property', 'og:description', p.description],
    ['property', 'og:image', img],
    ['property', 'og:image:type', 'image/jpeg'],
    ['property', 'og:image:width', String(WIDTH)],
    ['property', 'og:image:height', String(HEIGHT)],
    ['property', 'og:image:alt', p.alt],
    ['property', 'og:locale', LOCALE[p.lang]],
    ...others.map(l => ['property', 'og:locale:alternate', LOCALE[l]]),
    // Only the entrance doors have one URL per language; inside, the language is chosen and
    // saved, so there are no three addresses to offer the search engine (D-74).
    ...(p.door ? DOORS.map(q => ['alternate', q.lang, SITE + q.route]) : []),
    ...(p.door ? [['alternate', 'x-default', SITE + '/']] : []),
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', p.title],
    ['name', 'twitter:description', p.description],
    ['name', 'twitter:image', img],
    ['name', 'twitter:image:alt', p.alt],
  ];
  const lines = meta.map(([kind, key, value]) => {
    if (kind === 'canonical') return `  <link rel="canonical" href="${escape(value)}">`;
    if (kind === 'alternate') return `  <link rel="alternate" hreflang="${key}" href="${escape(value)}">`;
    return `  <meta ${kind}="${key}" content="${escape(value)}">`;
  });
  // A bridge only redirects: what describes the game is on the page it leads to
  if (ld && indexed(p)) lines.push(jsonLd(p));
  return [OPEN, ...lines, CLOSE].join('\n');
}

function cmdCards() {
  let touched = 0;
  for (const p of pages()) {
    const path = join(ROOT, p.file);
    const fresh = block(p);
    if (p.standalone) {
      const before = existsSync(path) ? readFileSync(path, 'utf8') : '';
      const html = standalonePage(p, fresh);
      mkdirSync(dirname(path), { recursive: true });
      if (before !== html) { writeFileSync(path, html); touched++; }
      console.log(`  ${p.file}${before !== html ? '  ↻' : '  ='}`);
      continue;
    }
    let html = readFileSync(path, 'utf8');
    const [open, close] = html.includes(OPEN) ? [OPEN, CLOSE] : html.includes(OLD_OPEN) ? [OLD_OPEN, OLD_CLOSE] : [];
    if (open) {
      html = html.replace(new RegExp(`${reEscape(open)}[\\s\\S]*?${reEscape(close)}`), fresh);
    } else {
      // It goes after the <title> and before the manifest: first who the page is, then how it is
      // installed. The entrance doors have no manifest —they are not the app, they only send to
      // it—, so there the block goes before the first stylesheet.
      const desc = html.match(/^ {2}<meta name="description".*\n/m);
      if (desc) html = html.replace(desc[0], '');
      const anchor = /^( *<link rel="manifest".*\n)/m.test(html)
        ? /^( *<link rel="manifest".*\n)/m
        : /^( *<link rel="stylesheet".*\n)/m;
      html = html.replace(anchor, `${fresh}\n$1`);
    }
    const before = readFileSync(path, 'utf8');
    if (before !== html) { writeFileSync(path, html); touched++; }
    console.log(`  ${p.file}${before !== html ? '  ↻' : '  ='}`);
  }
  for (const p of bridges()) {
    const path = join(ROOT, p.old);
    const before = existsSync(path) ? readFileSync(path, 'utf8') : '';
    const html = bridgePage(p);
    mkdirSync(dirname(path), { recursive: true });
    if (before !== html) { writeFileSync(path, html); touched++; }
    console.log(`  ${p.old}${before !== html ? '  ↻' : '  ='}`);
  }
  for (const [file, text] of SEARCH_FILES()) {
    const path = join(ROOT, file);
    const before = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (before !== text) { writeFileSync(path, text); touched++; }
    console.log(`  ${file}${before !== text ? '  ↻' : '  ='}`);
  }
  console.log(touched ? `${touched} page(s) with a new card` : 'the cards were already up to date');
}

/* ------------------------------------------------------------------ */
/* The images                                                          */
/* ------------------------------------------------------------------ */
/**
 * Each chat crops the image to the height of its own little window and what gets eaten are the
 * sides: from 1.91:1 to 1.5:1, 127 px go on each side. Everything that is read must stay inside
 * the central 88%. This measures the real ink (the text ranges), not the blocks' box.
 */
const SAFE = 10;  // % of each side that may disappear
const MARGIN = `(()=>{
  let min = 1e9, max = -1e9, who = '';
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!n.textContent.trim()) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const c = r.getBoundingClientRect();
    if (!c.width) continue;
    if (c.left < min) { min = c.left; who = n.textContent.trim().slice(0, 20); }
    if (c.right > max) { max = c.right; if (innerWidth - c.right < min) who = n.textContent.trim().slice(0, 20); }
  }
  const left = min / innerWidth * 100, right = (innerWidth - max) / innerWidth * 100;
  return Math.min(left, right) < ${SAFE} ? \`"\${who}" (at \${Math.min(left, right).toFixed(1)}% from the edge)\` : '';
})()`;

/** PNG → JPEG with the tool that comes with macOS, the same readme.py uses for the screenshots. */
const jpeg = (source, target) => new Promise((ok, fail) => {
  // Off the Mac (a cloud session) there is no sips: ImageMagick does the same
  const mac = process.platform === 'darwin';
  const s = mac
    ? spawn('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', source, '--out', target], { stdio: 'ignore' })
    : spawn('convert', [source, '-quality', '82', target], { stdio: 'ignore' });
  s.on('close', c => (c === 0 ? ok() : fail(new Error(`${mac ? 'sips' : 'convert'} exited with ${c}`))));
});

async function cmdImages() {
  const { launch, sleep } = await import('../e2e/cdp.mjs');
  const out = join(ROOT, 'public/assets/og');
  mkdirSync(out, { recursive: true });
  // Outside the repo: only the intermediate PNGs and the Chrome profile stay here
  const tmp = join(tmpdir(), 'juegos-de-salon-og');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  // From the repo root, not from public/: the card lives in tools/ and imports from /public/assets/
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await sleep(800);
  // If someone else already had the port, python left and the photos would come from another session's copy
  if (server.exitCode !== null) throw new Error(`port ${PORT} is taken: PORT=87xx node tools/release/og.mjs images`);
  let todo = [];
  try {
    // The canvas is 600×315 and cdp photographs at double: exactly 1200×630
    const b = await launch({ port: CDP_PORT, dir: `${tmp}/profile`, out: tmp, width: WIDTH / 2, height: HEIGHT / 2 });
    const prints = readFingerprints();
    // Only the ones that fell behind: retaking the rest only changes bytes and dirties the diff
    todo = process.argv.includes('--all') ? pages() : pages().filter(p => stale(p, prints));
    for (const p of todo) {
      // The `t` is so Chrome does not reuse the card from the last round: without it, a change
      // in the drawing or in base.css is photographed old and there is no way to notice.
      const q = `?t=${Date.now()}${p.game ? `&game=${p.game}` : ''}&lang=${p.lang}`;
      await b.go(`http://localhost:${PORT}/marketing/share-cards/card.html${q}`, 1200);
      // Without waiting for the fonts, the title comes out in the fallback typeface
      for (let i = 0; i < 20 && !(await b.evaluate(`document.body.dataset.ready === '1'`)); i++) await sleep(200);
      await sleep(300);
      const outside = await b.evaluate(MARGIN);
      if (outside) console.log(`  ⚠️  ${p.image}: ${outside} goes out of the safe band and the chat may crop it`);
      await b.shot(p.image);
      // As JPEG they weigh four times less and at this size it does not show: they are big letters
      // on a gradient. 3 MB of PNG in the repo for seven images only robots look at.
      await jpeg(join(tmp, `${p.image}.png`), join(out, `${p.image}.jpg`));
      console.log(`  public/assets/og/${p.image}.jpg  ↻`);
      prints[p.image] = fingerprint(p);
    }
    const sorted = Object.fromEntries(Object.keys(prints).sort().map(k => [k, prints[k]]));
    writeFileSync(FINGERPRINTS, JSON.stringify(sorted, null, 2) + '\n');
    if (!todo.length) console.log('  none fell behind (with --all they are retaken anyway)');
    if (b.errors.length) console.log('  errors:', JSON.stringify(b.errors.slice(0, 2)));
    b.close();
  } finally {
    server.kill();
    // Chrome is just leaving and sometimes still has its profile open: if it cannot be
    // deleted, it does not matter, it is in the system's temp folder.
    try { rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* nothing */ }
  }
  console.log(`${todo.length} image(s) of ${WIDTH}×${HEIGHT}`);
  console.log('Look at them before publishing (C-12): git diff --stat public/assets/og');
}

/* ------------------------------------------------------------------ */
/* Check                                                               */
/* ------------------------------------------------------------------ */
function checkImage(p, problems) {
  if (!existsSync(join(ROOT, `public/assets/og/${p.image}.jpg`))) problems.push(`public/assets/og/${p.image}.jpg is missing  →  node tools/release/og.mjs images`);
  else if (stale(p)) problems.push(`public/assets/og/${p.image}.jpg was made with another drawing or other texts  →  node tools/release/og.mjs images`);
}

function cmdCheck() {
  const problems = [];
  for (const p of pages()) {
    const path = join(ROOT, p.file);
    if (p.standalone) {
      if (!existsSync(path) || readFileSync(path, 'utf8') !== standalonePage(p, block(p))) {
        problems.push(`${p.file} fell behind public/cup/suelto/index.html or games.js  →  node tools/release/og.mjs cards`);
      }
      checkImage(p, problems);
      continue;
    }
    const html = readFileSync(path, 'utf8');
    if (!html.includes(OPEN)) problems.push(`${p.file} has no social card${html.includes(OLD_OPEN) ? ' (only the old Spanish marker)' : ''}  →  node tools/release/og.mjs cards`);
    else if (html.split(OPEN)[1].split(CLOSE)[0] !== block(p).split(OPEN)[1].split(CLOSE)[0]) {
      problems.push(`${p.file} fell behind games.js  →  node tools/release/og.mjs cards`);
    }
    checkImage(p, problems);
  }
  for (const p of bridges()) {
    const path = join(ROOT, p.old);
    if (!existsSync(path) || readFileSync(path, 'utf8') !== bridgePage(p)) {
      problems.push(`${p.old}: the bridge page is missing or fell behind  →  node tools/release/og.mjs cards`);
    }
  }
  for (const [file, text] of SEARCH_FILES()) {
    const path = join(ROOT, file);
    if (!existsSync(path) || readFileSync(path, 'utf8') !== text) problems.push(`${file} is missing or fell behind games.js  →  node tools/release/og.mjs cards`);
  }
  problems.forEach(x => console.log('  ERROR ·', x));
  if (!problems.length) console.log(`social cards up to date · ${pages().length} pages`);
  return problems.length ? 1 : 0;
}

/** The email header (D-317): the menu card's icons and title only, the same in every language. */
async function cmdHeader() {
  const { launch, sleep } = await import('../e2e/cdp.mjs');
  const out = join(ROOT, 'public/assets/email');
  mkdirSync(out, { recursive: true });
  const tmp = join(tmpdir(), 'juegos-de-salon-header');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await sleep(800);
  if (server.exitCode !== null) throw new Error(`port ${PORT} is taken: PORT=87xx node tools/release/og.mjs header`);
  try {
    const b = await launch({ port: CDP_PORT, dir: `${tmp}/profile`, out: tmp, width: 600, height: 170 });
    await b.go(`http://localhost:${PORT}/marketing/share-cards/card.html?t=${Date.now()}&email&lang=es`, 1200);
    for (let i = 0; i < 20 && !(await b.evaluate(`document.body.dataset.ready === '1'`)); i++) await sleep(200);
    await sleep(300);
    await b.shot('header');
    await jpeg(join(tmp, 'header.png'), join(out, 'header.jpg'));
    b.close();
  } finally {
    server.kill();
    try { rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* nothing */ }
  }
  console.log('public/assets/email/header.jpg ↻ (1200×340): look at it before publishing');
}

const cmd = process.argv[2];
if (cmd === 'cards') cmdCards();
else if (cmd === 'images') await cmdImages();
else if (cmd === 'header') await cmdHeader();
else if (cmd === 'check') process.exit(cmdCheck());
else {
  console.error('Usage: node tools/release/og.mjs cards | images [--all] | header | check');
  process.exit(1);
}
