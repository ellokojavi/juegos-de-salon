// Without reaching Firebase: the player has to find out, in their language (every one offered:
// D-199), and with a way out (C-14, D-40).
// The network is cut to the database (not to the site), which is how losing signal or hitting
// the free plan's connection cap looks.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { LANGS } from '../../public/assets/js/i18n.js';
import { gameById } from '../../public/assets/js/games.js';
import { LOCALES as BC } from '../../public/bulls-and-cows/rules.js';
import { LOCALES as TL } from '../../public/timeline/rules.js';
import { LOCALES as BS } from '../../public/battleship/rules.js';
import { LOCALES as HM } from '../../public/hangman/rules.js';
import { LOCALES as LD } from '../../public/liars-dice/rules.js';
// With several sessions at once, each serves its worktree on its own port (D-135)
const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';

const OUT = output();
const b = await launch({ port: 9442, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });

await b.send('Network.enable');

// Blocking by URL doesn't work: the RTDB channel is a WebSocket and gets through anyway. The
// network is emulated as down, but only **after** preloading the transport module; otherwise
// what fails is downloading the SDK from gstatic and the connection wait is never tested.
const network = on => b.send('Network.emulateNetworkConditions', {
  offline: !on, latency: 0, downloadThroughput: on ? -1 : 0, uploadThroughput: on ? -1 : 0,
});

const error = () => b.evaluate(`document.querySelector('#setup-error')?.textContent || ''`);
const buttonAlive = () => b.evaluate(`(()=>{const b=document.querySelector('#setup-actions .btn');return !!b && !b.disabled})()`);

async function attempt(lang, game, label) {
  await network(true);
  const route = gameById(game).path;
  await b.go(`${SITE}/${route}`);
  await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang','${lang}'); 1`);
  await b.go(`${SITE}/${route}`);
  const preload = await b.evaluate(`import('../assets/js/transport/firebase.js').then(()=>'ok',e=>'failed: '+e)`);
  console.log(`${label} · SDK preloaded:`, preload);
  await network(false);
  await b.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(400);
  await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
  await b.evaluate(`document.querySelectorAll('#setup-actions .btn')[0].click(); 1`);

  // At 3 s it hasn't given up yet: the connection wait is 8 s.
  await sleep(3000);
  console.log(`${label} · still waiting at 3 s:`, JSON.stringify(await error()) === '""');

  for (let i = 0; i < 20 && !(await error()); i++) await sleep(1000);
  const text = await error();
  console.log(`${label} · message:`, JSON.stringify(text));
  console.log(`${label} · the button is usable again:`, await buttonAlive());
  console.log(`${label} · screen:`, await b.active());
  await b.shot(`room-error-${label}`);
  return text;
}

/**
 * Toque y Fama in each language; the other games, one each, spread across the languages: the
 * text comes from `errText` (transport/errors.js), which is one for every game. What is expected
 * is its dictionary's `errOffline`, not the generic `errNet` ("¿Hay internet?").
 */
const cases = [
  ...LANGS.map(lang => ['toque-y-fama', BC, lang]),
  ['linea-de-tiempo', TL], ['batalla-naval', BS], ['ahorcado', HM],
  ['dudo', Object.fromEntries(Object.entries(LD).map(([l, d]) => [l, d.ui]))],   // Dudo keeps them in `ui`
].map(([game, L, lang], i) => [game, L, lang || LANGS[(i + 1) % LANGS.length]]);

const results = [];
for (const [game, L, lang] of cases) results.push([game, L, lang, await attempt(lang, game, `${game}-${lang}`)]);

console.log('\n--- summary ---');
for (const [game, L, lang, text] of results) {
  const good = text === L[lang].errOffline;
  console.log(`${good ? '✓' : '✗'} ${game} (${lang}): ${good ? 'the message of a room that does not open, translated' : `expected ${JSON.stringify(L[lang].errOffline.slice(0, 50))}…`}`);
  if (!good) process.exitCode = 1;
}
console.log('errors:', JSON.stringify(b.errors));
console.log('logs:', JSON.stringify(b.logs.filter(l => !/firebaseio|net::ERR_BLOCKED/.test(l))));
b.close();
