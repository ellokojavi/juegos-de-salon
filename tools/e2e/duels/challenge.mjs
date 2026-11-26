// Duels' «you've been challenged» screen (lab flag rivals, assets/js/duel-challenge.js): a duel someone else
// started, not played yet, opens it once on /duels/ (split screen, the «VS» cut in two, ⚔️ Accept to round 1);
// «Later» closes it and it does not come back; the profile's «Duel alerts» under Vibration turns it off.
// At 390×844 and 320×568: no sideways scroll and the rival ends above the duel's line. Prints ✗ if anything fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = output('/tmp/duels-challenge');
mkdirSync(OUT, { recursive: true });
const SITE = process.env.SITE || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };

for (const [width, height] of [[390, 844], [320, 568]]) {
  const b = await launch({ dir: `${OUT}/profile-${width}`, out: OUT, width, height });
  b.flags({ profile: 'all', rivals: 'all', 'vibration-setting': 'all' });
  const ev = expr => b.evaluate(expr);
  try {
    await b.go(`${SITE}/duels/`, 1500);
    await ev(`localStorage.clear(); sessionStorage.clear(); 1`);
    // Cata challenges Javi (Cata plays nothing yet), then Javi signs in on this phone
    await ev(`import('/assets/js/jugador.js').then(async ({ jugador }) => { const J = await jugador(); await J.crear('Javi', '1234'); const javi = J.yo(); J.salir(); await J.crear('Cata', '1111'); await J.anotar({ juego: 'reinas', s: 90, ms: 50000 }); const D = await J.duelos(); await D.retar({ b: javi.jid, bn: javi.n, g: 'reinas', f: 'bo3' }); J.salir(); await J.entrar('Javi', '1234'); return 1; }).catch(e => String(e))`);
    await b.go(`${SITE}/duels/`, 1500);
    const shown = await b.until(`!!document.querySelector('.dc-capa')`, 6000);
    ok(shown, `${width}: a new duel from Cata opens the challenge screen`);
    if (!shown) continue;
    // Measured at its last frame, in the same step it was found: the animations finished at once
    const m = JSON.parse(await ev(`JSON.stringify((() => { document.querySelector('.dc-capa').getAnimations({ subtree: true }).filter(a => a.effect.getComputedTiming().endTime !== Infinity).forEach(a => a.finish()); const r = s => document.querySelector(s).getBoundingClientRect(); return { scroll: document.documentElement.scrollWidth > innerWidth, rival: r('.dc-rival').bottom, info: r('.dc-info').top, names: [...document.querySelectorAll('.dc-nombre')].map(x => x.textContent), href: document.querySelector('.dc-aceptar').getAttribute('href'), btn: r('.dc-despues').height }; })())`));
    await b.shot(`challenge-${width}`);
    ok(!m.scroll, `${width}: no sideways scroll`);
    ok(m.rival <= m.info, `${width}: the rival ends above the duel's line (${Math.round(m.rival)} ≤ ${Math.round(m.info)})`);
    ok(m.names.join() === 'Javi,Cata', `${width}: me on top, the rival below (${m.names})`);
    ok(m.href && m.href !== '#', `${width}: ⚔️ Accept goes to the first round`);
    ok(m.btn >= 44, `${width}: «Later» is 44 px tall`);
    await ev(`document.querySelector('.dc-despues').click(); 1`);
    ok(!(await ev(`!!document.querySelector('.dc-capa')`)), `${width}: «Later» closes it`);
    await b.go(`${SITE}/duels/`, 2500);
    ok(!(await ev(`!!document.querySelector('.dc-capa')`)), `${width}: and it does not come back for the same duel`);
    if (width === 390) {
      await b.go(`${SITE}/profile/`, 2500);
      await ev(`document.querySelector('.pf-intro-ok')?.click(); [...document.querySelectorAll('[role=tab],button')].find(t => /Ajustes/.test(t.textContent))?.click(); 1`);
      await b.until(`!!document.querySelector('.duel-alerts-toggle')`, 6000).catch(() => {});
      const rows = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('.pf-settings .toggle-row b')].map(x => x.textContent))`));
      const i = rows.indexOf('Avisos de duelos');
      ok(i > 0 && (rows[i - 1] === 'Vibración' || rows[i - 1] === 'Sonido'), `the profile's «Avisos de duelos» sits under Vibración (${rows.join(' | ')})`);
      await ev(`document.querySelector('.duel-alerts-toggle').click(); 1`);
      ok(await ev(`localStorage.getItem('juegos-de-salon:duel-alerts') === 'off' && document.querySelector('.duel-alerts-toggle').textContent === '🔕'`), '🔕 turns the alerts off');
      // The duel button left the ranking rows for the player's sheet: Cata's opens the new duel on Queens, mine has none
      await ev(`import('/assets/js/jugador.js').then(async ({ jugador }) => { const J = await jugador(); await J.anotar({ juego: 'reinas', s: 70, ms: 60000 }); return 1; })`);
      await b.go(`${SITE}/queens/`, 2500);
      await b.until(`document.querySelectorAll('.rk-fila[data-jid]').length >= 2`, 8000).catch(() => {});
      await sleep(2500); // the cover settles (it redraws once as the ranking and the player load)
      ok(!(await ev(`!!document.querySelector('.dl-retar')`)), 'no ⚔️ on the ranking rows');
      // Open Cata's sheet and tap its ⚔️ in one step: the cover may redraw once as the ranking loads, closing a sheet opened before it
      let duel = false, opened = false;
      for (let i = 0; i < 3 && !opened; i++) {
        await ev(`document.getElementById('pf-peek') || [...document.querySelectorAll('.rk-fila[data-jid]')].find(r => /Cata/.test(r.textContent))?.click(); 1`);
        opened = await b.until(`(() => { const x = document.querySelector('.pf-peek-duel'); if (!x) return false; x.click(); return true; })()`, 5000);
        duel ||= opened;
      }
      ok(duel, 'Cata\'s sheet has «⚔️ Retar a duelo» next to Cerrar');
      if (duel) {
        const sheet = await b.until(`!!document.getElementById('dl-hoja')`, 6000);
        ok(sheet && await ev(`!document.getElementById('pf-peek') && /Cata/.test(document.getElementById('dl-hoja').textContent)`), 'it closes and opens the new duel against Cata');
      }
    }
  } finally { await b.close(); }
}
