// The owner's panel, every view with seeded data (D-484): the quality floor of /panel/. Each view of
// `PATHS.panel` (the same ones `look.mjs panel <shot>` draws) must open with no uncaught error, show no
// broken value ("undefined", "NaN", "Infinity", "[object …]"), fit the width with no sideways scroll,
// and keep each domain's lists to its own domain (D-348): the Group log never lists a solo or One a
// Day game, and the Individual log lists nothing else. Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { PATHS } from '../paths.mjs';
import { isIndividualMode } from '../../../public/assets/js/games.js';
const OUT = output('/tmp/panel-views');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

const BROKEN = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object \w+\]/;
for (const width of [900, 390]) {
  const b = await launch({ dir: `${OUT}/p${width}`, out: OUT, width, height: 900 });
  const ev = e => b.evaluate(e);
  // One load per width: each view seeds and draws itself by its route, with no reload
  await b.go(`${SITE}/panel/`, 1200);
  for (const [shot, steps] of Object.entries(PATHS.panel)) {
    const before = b.errors.length;
    for (const step of steps) { await ev(`(()=>{ ${step} ; return 1})()`); await sleep(300); }
    await sleep(300);
    const v = JSON.parse(await ev(`JSON.stringify((() => {
      const root = document.querySelector('#screen-panel');
      // Error messages in 🩺 Health are what the players' browsers said: data, not the panel's text
      const clone = root?.cloneNode(true);
      clone?.querySelectorAll('.err-msg').forEach(e => e.remove());
      document.body.append(clone || ''); const text = clone?.innerText || ''; clone?.remove();
      return {
        shown: !!root && root.offsetParent !== null && root.innerText.trim().length > 50,
        text,
        overflow: document.documentElement.scrollWidth - innerWidth,
        modes: [...document.querySelectorAll('.log-row[data-mode]')].map(r => r.dataset.mode),
      };
    })())`));
    const errors = b.errors.slice(before);
    const bad = v.text.split('\n').find(l => BROKEN.test(l));
    const where = `${shot} at ${width} px`;
    ok(v.shown && !errors.length, `${where}: opens with something on screen and no error${errors.length ? ` (${errors[0].slice(0, 140)})` : ''}`);
    ok(!bad, `${where}: no broken value${bad ? ` ("${bad.trim().slice(0, 100)}")` : ''}`);
    ok(v.overflow <= 1, `${where}: fits the width${v.overflow > 1 ? ` (${v.overflow} px too wide)` : ''}`);
    if (width === 900 && (shot === 'group' || shot === 'individual')) {
      const own = shot === 'individual';
      ok(v.modes.length > 0 && v.modes.every(m => isIndividualMode(m) === own), `${shot}: its offline log lists only ${own ? 'solo and One a Day' : 'group'} games (D-348): ${[...new Set(v.modes)].join(', ') || 'none'}`);
    }
    if (failures) await b.shot(`${shot}-${width}`);
  }
  await b.close();
}
console.log(failures ? `✗ panel: ${failures} check(s) failed` : '✓ panel: every view is clean');
process.exit(failures ? 1 : 0);
