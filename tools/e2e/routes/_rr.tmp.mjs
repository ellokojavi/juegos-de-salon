import { launch, sleep } from '../cdp.mjs';
import { ETAPAS } from '../../../public/labs/routes/engine.js';
const OUT = process.argv[2];
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 320, height: 640 });
const ev = e => b.evaluate(e);
const esperar = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
await b.go(`http://localhost:8871/labs/routes/?seed=e2e1&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
await sleep(300); await b.shot('cuenta');
await esperar(`document.querySelectorAll('#tablero .pieza').length === 9 && !document.getElementById('cuenta')`);
await b.shot('juego');
for (let k = 0; k < ETAPAS.length; k++) {
  if (k) await esperar(`document.getElementById('etapa')?.textContent.includes('Etapa ${k + 1} de 5')`, 5000);
  await sleep(200);
  const te = await ev(`JSON.stringify(window.__rutas.P.t)`).then(JSON.parse);
  if (k === 4) { for (const r of [...te.revuelta].reverse()) { await ev(`document.getElementById('tablero').dispatchEvent(new CustomEvent('girar', { detail: ${JSON.stringify(r)} })); 1`); await sleep(60); } await sleep(300); await b.shot('etapa5-resuelta'); continue; }
  for (const r of [...te.revuelta].reverse()) { await ev(`document.getElementById('tablero').dispatchEvent(new CustomEvent('girar', { detail: ${JSON.stringify(r)} })); 1`); await sleep(60); }
}
await esperar(`!!document.getElementById('puntaje')`, 8000); await sleep(800);
await b.shot('final');
console.log('h1/fin:', await ev(`[...document.querySelectorAll('h1,h2,.resultado h1,.resultado h2')].map(x=>x.textContent).join(' | ')`));
await ev(`navigator.canShare = () => true; navigator.share = async d => { window.__sh = { text: d.text, title: d.title, url: d.url }; const f = d.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => window.__img = r.result; r.readAsDataURL(f); } }; document.getElementById('btn-compartir-resultado').click(); 1`);
await esperar(`!!window.__img`, 8000);
console.log('SHARE', JSON.stringify(await ev(`JSON.stringify(window.__sh)`)));
const img = await ev(`window.__img || ''`);
if (img) { const fs = await import('node:fs'); fs.writeFileSync(`${OUT}/compartir.png`, Buffer.from(img.split(',')[1], 'base64')); }
await b.close?.();
process.exit(0);
