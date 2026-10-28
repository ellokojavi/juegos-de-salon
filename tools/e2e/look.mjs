/**
 * Look at one specific screen, fast, without playing a whole game.
 *
 *   node tools/e2e/look.mjs <game> <screen> [--width 390] [--height 844] [--lang es] [--out /tmp/look]
 *
 * Examples:
 *   node tools/e2e/look.mjs ahorcado game --width 320
 *   node tools/e2e/look.mjs dudo bid --notches      (phone with a notch: 47 on top, 34 at the bottom)
 *   node tools/e2e/look.mjs ahorcado result
 *   node tools/e2e/look.mjs linea-de-tiempo intro --lang pt
 *
 *   node tools/e2e/look.mjs dudo bid --chat        (a room's 💬 bubble on top: it must cover no button)
 *
 * It takes the screenshot and also checks what the canon asks to look at on every screen (C-8):
 * no horizontal scroll and no button under 44 px; and that the board has space before its
 * buttons (D-309, U-11).
 *
 * It was born from writing eight throwaway scripts in /tmp to review a button bar. To test that
 * the game works there are the game scripts; this is for looking.
 */
import { launch, sleep } from './cdp.mjs';
import { EN_LABS, LABS_KEY } from '../../public/assets/js/i18n.js';
import { gameById } from '../../public/assets/js/games.js';
import { PATHS } from './paths.mjs';
import { measureSpacing, lacksSpacing, MIN_SPACING } from './spacing-common.mjs';

const args = process.argv.slice(2);
const pos = args.filter(a => !a.startsWith('--'));
const flag = (n, def) => { const i = args.indexOf('--' + n); return i < 0 ? def : args[i + 1]; };
const [game, screen = 'intro'] = pos;
const width = Number(flag('width', 390));
const height = Number(flag('height', 844));
const lang = flag('lang', 'es');
const out = flag('out', '/tmp/look');
/**
 * `--notches` simulates a phone with a notch (47 px on top, 34 at the bottom). It matters
 * because in headless Chrome those margins are 0, so a height bug that only shows with notches
 * goes past every test without anyone seeing it (D-75).
 */
const notches = args.includes('--notches');
/** `--chat` mounts the shared room chat (chat.js) on the screen, as a room does, and names any button its bubble covers. */
const withChat = args.includes('--chat');
const base = flag('base', process.env.SITE || process.env.SITIO || 'http://localhost:8765');

if (!game) {
  console.error('Missing the game. E.g.: node tools/e2e/look.mjs ahorcado game --width 320');
  process.exit(1);
}

const path = PATHS[game]?.[screen];
// It is asked for by id ('ahorcado') and opens its folder ('/hangman/'): they are not the same (D-192).
// What is not a game (the panel) is its own folder.
const route = gameById(game)?.path || `${game}/`;
if (!path) {
  const known = Object.keys(PATHS[game] || {});
  console.error(known.length ? `Unknown screen "${screen}". There are: ${known.join(', ')}` : `Unknown game "${game}". There are: ${Object.keys(PATHS).join(', ')}`);
  process.exit(1);
}

// The Chrome port is chosen by the system (D-213); `--cdp` or CDP_PORT fix it, if someone wants it fixed
if (flag('cdp', '')) process.env.CDP_PORT = flag('cdp', '');
const b = await launch({ port: 9451, dir: `${out}/profile`, out, width, height });
await b.go(`${base}/${route}`, 1500);
// The language is stored as bare text: getLang() compares against ['es','en','pt'] and a
// JSON.stringify left the quotes inside, so --lang did nothing.
// A lab language (D-191) is offered only with its mark set, as when entering through its lab door
const labs = EN_LABS.includes(lang) ? `localStorage.setItem('${LABS_KEY}', '${lang}');` : '';
await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); ${labs} 1`);
await b.go(`${base}/${route}`, 1500);
// Real notches: Chrome sets the system insets and the page reads them with
// env(safe-area-inset-*), just like on a phone. Overriding the CSS variables —as was done
// before— is not the same: it paints the margins but doesn't change the viewport (D-77).
if (notches) await b.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 47, bottom: 34, left: 0, right: 0 } });
for (const step of path) { await b.evaluate(`(()=>{ ${step} ; return 1})()`); await sleep(700); }
if (withChat) {
  await b.evaluate(`import('/assets/js/chat.js').then(m=>{let el=document.getElementById('chat');if(!el){el=document.createElement('div');el.id='chat';document.body.append(el);}
    m.createChat({mount:el,T:{chatOpen:'chat',chatTitle:'chat',chatEmpty:'',chatPlaceholder:'',chatSend:'send',chatClose:'x'},nameOf:r=>r,isMine:()=>false,onSend(){}}).show();return 1})`);
  await sleep(900);
  // A page taller than the phone scrolls under the bubble: what must clear it is where the page ends
  await b.evaluate(`scrollTo(0, document.documentElement.scrollHeight); 1`);
  await sleep(300);
}
await sleep(400);

const review = await b.evaluate(`(()=>{
  // The lab games and La Copa's standalone games have no .screen: there the whole page is checked
  const scr = document.querySelector('.screen') ? '.screen.active' : 'body';
  const small = [...document.querySelectorAll(scr + ' button, .confirm button')]
    .filter(x => x.offsetParent !== null && x.getBoundingClientRect().height < 44)
    .map(x => (x.textContent || x.className).trim().slice(0, 18));
  return JSON.stringify({
    screen: document.querySelector('.screen.active')?.id,
    horizontalScroll: document.documentElement.scrollWidth > innerWidth,
    smallButtons: [...new Set(small)],
    height: document.documentElement.scrollHeight,
    // What stays off screen with nothing announcing it: the page taller than the phone, and
    // the buttons that fall below the bottom edge (D-75)
    excess: document.documentElement.scrollHeight - innerHeight,
    // The height the app is built with can't be the instant one (dvh): it has to be the small
    // one (svh), the one left with the whole browser interface in view. On a phone the two
    // values drift apart —dvh 1016, svh 960— and what rests at the bottom falls off (D-77).
    // In headless Chrome they are the same, so here the rule is checked, not the measure.
    usesSmallHeight: [...document.styleSheets].some(sheet => {
      try { return [...sheet.cssRules].some(r => (r.selectorText || '').includes('.app') && (r.style?.minHeight || '').includes('svh')); }
      catch { return false; }
    }),
    belowBottom: [...new Set([...document.querySelectorAll(scr + ' .btn:not([aria-hidden="true"]), .confirm .btn')]
      .filter(x => x.offsetParent !== null && x.getBoundingClientRect().bottom > innerHeight)
      .map(x => (x.textContent || x.className).trim().slice(0, 18)))],
    underChat: (() => {
      const f = document.querySelector('.chat-fab'); if (!f || f.offsetParent === null) return null;
      const c = f.getBoundingClientRect();
      return [...new Set([...document.querySelectorAll(scr + ' button, ' + scr + ' a.btn, ' + scr + ' input')]
        .filter(x => x.offsetParent !== null).filter(x => { const r = x.getBoundingClientRect();
          return r.width && r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top; })
        .map(x => (x.textContent || x.className).trim().slice(0, 18)))];
    })(),
  });
})()`).then(JSON.parse);

const spacing = JSON.parse(await b.evaluate(measureSpacing));

// In case an entry ever carries a slash: the screenshot stays flat
const name = `${game.replace(/\//g, "-")}-${screen}-${width}`;
await b.shot(name);
console.log(`${out}/${name}.png · ${width}×${height} · ${lang}`);
console.log(`  screen: ${review.screen}`);
console.log(`  horizontal scroll (C-8): ${review.horizontalScroll ? '⚠️  YES' : 'no'}`);
console.log(`  buttons under 44 px (C-8): ${review.smallButtons.length ? '⚠️  ' + review.smallButtons.join(', ') : 'none'}`);
console.log(`  board → buttons spacing (U-11, ${MIN_SPACING} px or more): ${!spacing.length ? 'no marked board' : lacksSpacing(spacing).length ? '⚠️  ' + lacksSpacing(spacing).join(', ') : spacing.map(f => `${f.spacing} px`).join(', ')}`);
console.log(`  the page is taller than the screen: ${review.excess > 0 ? `⚠️  ${review.excess} px` : 'no'}${notches ? ' (with notches)' : ''}`);
console.log(`  buttons off screen: ${review.belowBottom.length ? '⚠️  ' + review.belowBottom.join(', ') : 'none'}`);
if (review.underChat) console.log(`  buttons under the chat bubble: ${review.underChat.length ? '⚠️  ' + review.underChat.join(', ') : 'none'}`);
console.log(`  built with the small height (svh): ${review.usesSmallHeight ? 'yes' : '⚠️  NO (uses dvh: what rests at the bottom falls off on a phone)'}`);
if (b.errors.length) console.log('  console errors:', JSON.stringify(b.errors.slice(0, 2)));
b.close();
