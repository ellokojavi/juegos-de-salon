// Whoever is out of the cup (D-347, D-376), in the app and in the image it shares: the row faded with 🚪, the
// days they will not play in one "Eliminado" pill over those columns (in four languages at 320 px, never past
// the row), no "-2J" for them, their line faded in the chart, and in the image their line and row faded, 🚪
// and the pill. Uses the `out` demo (Javi missed days 1 and 2). Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/cup-out');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const BADGE = { es: 'Eliminado', en: 'Eliminated', pt: 'Eliminado', de: 'Ausgeschieden' };

for (const lang of ['es', 'en', 'pt', 'de']) {
  const b = await launch({ dir: `${OUT}/p-${lang}`, out: OUT, width: 320, height: 640 });
  const ev = e => b.evaluate(e);
  await b.go(`${SITE}/cup/?test&demo=out&lang=${lang}`, 2500);
  for (let t = 0; t < 60 && !(await ev(`!!document.querySelector('.fila.fuera')`)); t++) await sleep(100);
  const row = await ev(`(() => {
    const f = document.querySelector('.fila.fuera'), p = f?.querySelector('.pd.eliminado');
    if (!p) return null;
    const blocks = [...f.querySelectorAll('.puntitos .pd:not(.eliminado)')];
    const other = document.querySelector('.fila:not(.fuera) .puntitos .pd');
    return { text: p.textContent, blocks: blocks.length, open: f.querySelectorAll('.pd.abierto, .pd.pendiente').length,
      wide: p.getBoundingClientRect().width >= 4 * other.getBoundingClientRect().width,
      inside: p.getBoundingClientRect().right <= f.getBoundingClientRect().right + 0.5,
      faded: parseFloat(getComputedStyle(f).opacity) < 0.5, door: f.querySelector('.lugar').textContent };
  })()`);
  ok(row && row.text === BADGE[lang] && row.blocks === 3 && row.open === 0, `${lang}: the days 4 to 7 are one "${BADGE[lang]}" pill after the three it has (${JSON.stringify(row)})`);
  ok(row && row.wide && row.inside, `${lang}: the pill covers those four columns and stays inside the row at 320 px`);
  ok(row && row.faded && row.door === '🚪', `${lang}: the row is faded, with 🚪 for a place`);
  if (lang === 'es') {
    await ev(`document.querySelector('.fila.fuera').scrollIntoView({ block: 'center' }); 1`); await sleep(300);
    await b.shot('out-table');
    const chart = await ev(`(() => {
      const g = document.querySelector('svg.grafico .g-jugador.fuera'), chip = document.querySelector('.g-chip.fuera');
      return { faded: g && parseFloat(getComputedStyle(g).opacity) < 0.5, label: g?.querySelector('.g-rotulo')?.textContent, chip: chip?.textContent };
    })()`);
    ok(chart.faded && /🚪/.test(chart.label) && !/J\)/.test(chart.label), `the chart fades their line, with 🚪 and no "-2J" (${chart.label})`);
    ok(/🚪/.test(chart.chip || '') && !/J\)/.test(chart.chip || ''), `their chip carries 🚪, without "-2J" (${chart.chip})`);
    // The image: what the canvas writes, and the alpha the faded row is written with
    await ev(`window.__texts = []; const ft = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (t, ...r) { window.__texts.push([String(t), this.globalAlpha]); return ft.call(this, t, ...r); };
      window.__shared = []; navigator.share = async d => { window.__shared.push(d); }; navigator.canShare = () => true;
      document.getElementById('btn-imagen').click(); 1`);
    for (let t = 0; t < 50 && !(await ev(`window.__shared.length`)); t++) await sleep(100);
    const texts = await ev(`window.__texts`);
    const at = t => texts.find(([s]) => s === t);
    ok(!!at('ELIMINADO') && !!at('🚪'), 'the image writes 🚪 and ELIMINADO for them');
    ok(at('Javi') && at('Javi')[1] < 0.6, `the image writes their name faded (alpha ${at('Javi')?.[1]})`);
    ok(!texts.some(([s]) => /^-\d+J$/.test(s)), 'and no "-2J" pill for anyone');
    const f = await ev(`(async () => { const f = window.__shared.at(-1)?.files?.[0]; if (!f) return null; const r = new FileReader(); return await new Promise(ok => { r.onload = () => ok(r.result); r.readAsDataURL(f); }); })()`);
    if (f) (await import('node:fs')).writeFileSync(`${OUT}/out-image.png`, Buffer.from(f.split(',')[1], 'base64'));
  }
  b.close();
}
if (failures) process.exit(1);
