// «Otra copa con este grupo» (#1165): under a finished cup's podium the admin, and only the admin, gets a
// button that opens the create screen filled from that cup (its name, days and final, language, audience,
// the admin's name, tomorrow as the start, a new week of games) with a note on top to check it; nothing is
// created until Crear la copa, which lands on Administrar with the invite. The screen of before (the test
// store without &lab) comes filled too. Runs with the lab flag `cup-again` on: localhost holds the lab key.
// Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { LOCALES } from '../../../public/cup/rules.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const T = LOCALES.es;
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };
const NAME = 'Copa de la oficina';   // the demo cup's name (demo.js)
const screen = () => ev(`JSON.stringify({
  note: document.getElementById('crear-desde')?.textContent || '',
  name: document.querySelector('#crear-body input')?.value || '',
  me: document.querySelector('#crear-body input[placeholder=${JSON.stringify(T.fYouPh)}]')?.value || '',
  on: [...document.querySelectorAll('#crear-body .opciones .opcion.on')].map(x => x.textContent),
  days: document.getElementById('dur-n')?.textContent || '',
  final: document.getElementById('dur-final')?.getAttribute('aria-checked') || '',
  week: document.querySelectorAll('#semana-dias .semana-dia').length,
  dates: document.getElementById('crear-fechas')?.textContent || '',
  more: document.getElementById('crear-resumen')?.textContent || '',
  oldWeek: document.querySelectorAll('#cal-elegir .event[data-dia]').length,
  oldHidden: document.getElementById('crear-juegos')?.hidden ?? null,
})`).then(JSON.parse);

// A player on the podium sees no button
await b.go(`${SITE}/cup/?test&lab&demo=podium&lang=es`, 2500);
ok(await waitFor(`!!document.querySelector('#tablero-body .podio')`), 'the finished cup opens on its podium');
await sleep(1500);
ok(!await ev(`!!document.getElementById('btn-otra-copa')`), 'a player sees no «Otra copa con este grupo»');

// The admin: the button under Compartir el resumen, before the way out
await b.go(`${SITE}/cup/?test&lab&demo=podium-admin&lang=es`, 2500);
ok(await waitFor(`!!document.getElementById('btn-otra-copa')`), `the admin sees «${T.againBtn}» under the podium`);
const order = await ev(`[...document.querySelectorAll('#btn-resumen, #btn-otra-copa, #fin-salidas')].map(x => x.id).join(' ')`);
ok(order === 'btn-resumen btn-otra-copa fin-salidas', `after Compartir el resumen and before the way out (${order})`);
ok(await ev(`document.getElementById('btn-otra-copa').textContent`) === T.againBtn, 'with the text of rules.js');
await ev(`document.getElementById('btn-otra-copa').scrollIntoView({ block: 'center' })`);
await b.shot('01-podium-admin');

// The create screen (the new one, &lab) comes filled from the finished cup
await ev(`document.getElementById('btn-otra-copa').click()`);
ok(await waitFor(`!!document.getElementById('crear-semana') && !!document.getElementById('crear-fechas')?.textContent`), 'it opens the create screen with the week in view');
await sleep(400);
let s = await screen();
ok(s.note.includes(`«${NAME}»`) && s.note.includes(T.createGo), `a note on top says it comes from «${NAME}» and asks to check it and tap ${T.createGo}`);
ok(s.name === NAME, `the name is the finished cup's (${s.name})`);
ok(s.me === 'Cata', `the admin's name is theirs (${s.me})`);
ok(s.days === '7 días' && s.final === 'true', `7 days with the final, as the cup had (${s.days}, final ${s.final})`);
ok(s.week === 6, `a new week of six games is drawn (${s.week})`);
ok(s.on.some(x => x.startsWith(T.startTomorrow)), `it starts tomorrow, chosen (${s.on.join(' | ')})`);
ok(s.on.includes('Español') && s.on.includes(T.audCl), `the language and audience are the cup's (${s.on.join(' | ')})`);
ok(s.dates.length > 0, `under the button, when it starts and ends (${s.dates})`);
ok(s.more.startsWith('Español'), `More options says what is chosen (${s.more})`);
ok(!await ev(`document.documentElement.scrollWidth > innerWidth`), 'no sideways scroll');
await b.shot('02-create-filled');

// Confirming creates it: Administrar, with the invite guide
await ev(`(()=>{const p=document.querySelector('#crear-body input.pin'); if (p) { p.value='1234'; p.dispatchEvent(new Event('input')); } return 1})()`);
await ev(`document.getElementById('btn-crear-go').click()`);
ok(await waitFor(`document.querySelector('.screen.active')?.id === 'screen-admin' && !!document.getElementById('admin-bienvenida')`), 'Crear la copa lands on Administrar with the invite guide');
ok(/\/cup\/\?[A-Z0-9]{5}&test/.test(await ev('location.href')), `a new cup, with its own code (${await ev('location.href')})`);
await b.shot('03-created');

// The screen of before (no &lab in the test store) comes filled too: name, 7 days, the week drawn, the note
await b.go(`${SITE}/cup/?test&demo=podium-admin&lang=es`, 2500);
ok(await waitFor(`!!document.getElementById('btn-otra-copa')`), 'on the screen of before, the admin sees the button too');
await ev(`document.getElementById('btn-otra-copa').click()`);
ok(await waitFor(`!!document.getElementById('crear-juegos')`), 'it opens the create screen of before');
await sleep(300);
s = await screen();
ok(s.note.includes(`«${NAME}»`) && s.name === NAME, 'with the note and the name');
ok(s.on.some(x => x.startsWith(T.mode7)) && s.oldHidden === false && s.oldWeek === 6, `the 7-day cup chosen and its week drawn (${s.oldWeek} days)`);
ok(s.on.some(x => x.startsWith(T.startTomorrow)), 'starting tomorrow');
await b.shot('04-create-before-filled');

// In English and Portuguese, at 320 px: the button and the note in each language, nothing sideways (C-3, C-8)
await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
for (const lang of ['en', 'pt']) {
  const L = LOCALES[lang];
  await b.go(`${SITE}/cup/?test&lab&demo=podium-admin&lang=${lang}`, 2500);
  ok(await waitFor(`document.getElementById('btn-otra-copa')?.textContent === ${JSON.stringify(L.againBtn)}`), `${lang}: «${L.againBtn}» under the podium`);
  await ev(`document.getElementById('btn-otra-copa').click()`);
  ok(await waitFor(`!!document.getElementById('crear-desde') && !!document.getElementById('crear-fechas')?.textContent`), `${lang}: the create screen comes filled`);
  await sleep(300);
  const note = await ev(`document.getElementById('crear-desde').textContent`);
  ok(note === L.againNote.replace('{copa}', NAME), `${lang}: the note in its language (${note.slice(0, 60)}…)`);
  ok(!await ev(`document.documentElement.scrollWidth > innerWidth`), `${lang}: no sideways scroll at 320 px`);
  await b.shot(`05-create-filled-${lang}`);
}

await b.close();
