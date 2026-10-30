// An archived cup's link (D-476): the nightly archive moved it out of `torneos/`, but its podium is
// still in `torneoPodios/`. For everyone (D-492) the link shows the memorial:
// its name, when it ended, the podium, and the buttons to create a new cup (with the same name) and
// to see the medal table, in four languages at 320 px. Without a podium, the error of before. Only the test store (`?test`, localStorage): nothing is written to Firebase.
// Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const OUT = output('/tmp/cup-archived');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const CODE = 'ARCHV', NAME = 'Los primos de Valparaíso, edición invierno';
const END = Date.UTC(2024, 6, 14, 4);
const SEED = `localStorage.setItem('juegos-de-salon:prueba:records-db', JSON.stringify({ torneoPodios: { ${CODE}: {
  name: ${JSON.stringify(NAME)}, end: ${END}, de: 'jiri01', dias: 7, por: 'jiri01', at: ${END},
  p: { jiri01: { n: 'Jiri', l: 1 }, cata02: { n: 'Cata', l: 2 }, leo003: { n: 'Leo', l: 3 }, ana004: { n: 'Ana', l: 3 } } } } })); 1`;
const NEW = { es: 'Crear una copa nueva', en: 'Create a new cup', pt: 'Criar uma copa nova' };
const ERROR = { es: 'No encontramos una copa', en: 'We couldn\'t find a cup', pt: 'Não encontramos uma copa' };
const YEAR = /2024/;

const b = await launch({ dir: `${OUT}/profile`, out: OUT, width: 320, height: 640 });
const ev = e => b.evaluate(e);
const waitFor = async expr => { for (let t = 0; t < 60; t++) { if (await ev(expr)) return true; await sleep(100); } return false; };
try {
  await b.go(`${SITE}/cup/?test`, 1200);
  await ev(`localStorage.clear(); sessionStorage.clear(); ${SEED}`);

  for (const lang of ['es', 'en', 'pt']) {
    await b.go(`${SITE}/cup/?${CODE}&test&lang=${lang}`, 1500);
    const shown = await waitFor(`!!document.getElementById('copa-archivada')`);
    const m = await ev(`(() => {
      const c = document.getElementById('copa-archivada'); if (!c) return null;
      const wide = [...document.querySelectorAll('#espera-body *')].some(x => x.getBoundingClientRect().right > innerWidth + 0.5);
      return { title: c.querySelector('h2').textContent, text: c.textContent, rows: [...c.querySelectorAll('.podio-archivado li')].map(li => li.textContent),
        create: document.getElementById('btn-archivada-crear')?.textContent, medals: document.getElementById('btn-archivada-medallero')?.getAttribute('href'),
        wide, scroll: document.documentElement.scrollWidth > innerWidth };
    })()`);
    ok(shown && m.title === `🏆 ${NAME}`, `${lang}: the memorial names the cup (${m?.title})`);
    ok(m && YEAR.test(m.text), `${lang}: it says when it ended, with the year`);
    ok(m && m.rows.length === 4 && m.rows[0].startsWith('🥇') && m.rows[1].startsWith('🥈') && m.rows[2].startsWith('🥉') && m.rows[3].startsWith('🥉'), `${lang}: the podium in order, ties included (${JSON.stringify(m?.rows)})`);
    ok(m && m.create?.includes(NEW[lang]) && /records\/#copas$/.test(m.medals || ''), `${lang}: "${NEW[lang]}" and the medal table's link`);
    ok(m && !m.wide && !m.scroll, `${lang}: nothing past 320 px`);
    await b.shot(`archived-${lang}`);
  }

  // "Create a new cup" opens the creator with the same name
  await ev(`document.getElementById('btn-archivada-crear').click(); 1`);
  await waitFor(`!!document.querySelector('#crear-body input')`);
  const name = await ev(`document.querySelector('#crear-body input')?.value`);
  ok(name === NAME.slice(0, (await import('../../../public/cup/engine.js')).COPA_MAX), `the creator starts with the cup's name (${name})`);


  // No podium: the error too
  await b.go(`${SITE}/cup/?ZZZZZ&test&lang=es`, 1500);
  await waitFor(`!!document.querySelector('#espera-body .form-error')`);
  const none = await ev(`({ err: document.querySelector('#espera-body .form-error')?.textContent || '', memo: !!document.getElementById('copa-archivada') })`);
  ok(!none.memo && none.err.startsWith(ERROR.es), 'a code with no podium: the error of before');
} finally {
  b.close();
}
if (failures) process.exit(1);
