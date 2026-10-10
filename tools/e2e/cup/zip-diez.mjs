// Zip con los diez niveles resueltos (D-250): la partida termina antes del reloj, con 100 puntos,
// sin cuenta regresiva ni solución a la vista, y el reloj de arriba queda quieto.
//
// Uso: python3 -m http.server 8765 -d public (en otra terminal) y node tools/e2e/cup/zip-diez.mjs <carpeta-salida>
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] || '/tmp/zip-diez';
mkdirSync(OUT, { recursive: true });
const b = await launch({ port: Number(process.env.PUERTO_CDP) || 9391, dir: `${OUT}/perfil`, out: OUT });
const SITIO = process.env.SITIO || 'http://localhost:8765';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const SEMILLA = 'KQRST';

try {
  await b.go(`${SITIO}/cup/?practice=zip&test&labs&seed=${SEMILLA}`, 1200);
  for (let w = 0; w < 30 && !await ev(`!!document.getElementById('btn-empezar')`); w++) await sleep(200);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  for (let w = 0; w < 80 && !await ev(`!!document.querySelector('.zip-grid .zc')`); w++) await sleep(100);
  for (let w = 0; w < 80 && !await ev(`!document.getElementById('cuenta') || document.getElementById('cuenta').classList.contains('ya')`); w++) await sleep(100);
  ok(/de 10/.test(await ev(`document.querySelector('.zip-nivel')?.textContent || ''`)), 'Zip: el encabezado dice cuántos niveles son ("Nivel 1 de 10")');

  // Los diez niveles, cada uno con su solución, paso a paso como lo hace el teclado
  for (let k = 0; k < 10; k++) {
    const hecho = await ev(`(async()=>{const m=await import('/cup/games/zip/engine.js');const p=m.nivel('${SEMILLA}',1,${k});
      const g=document.querySelector('.zip-grid');if(g.children.length-1!==p.n*p.n)return false;
      for(const i of p.sol)g.querySelector('.zc[data-i="'+i+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));return true})()`);
    if (!hecho) { ok(false, `Zip: el nivel ${k + 1} aparece en la grilla`); break; }
    if (k === 8) await b.shot('zip-nivel-9');
    await sleep(k < 9 ? 650 : 300);
  }
  const fin = await ev(`JSON.stringify({aviso:document.querySelector('.zip-aviso')?.textContent||'',boton:!!document.getElementById('btn-fin'),
    reloj:!!document.querySelector('.zip-reloj'),solucion:document.querySelector('.zip-grid').classList.contains('solucion'),cron:document.querySelector('#jugar-head .cron')?.textContent})`).then(JSON.parse);
  ok(/10 niveles/.test(fin.aviso) && fin.boton, `Zip: con los diez resueltos termina antes del reloj y lo dice (${fin.aviso})`);
  ok(!/null|undefined/.test(fin.aviso), 'Zip: el aviso del final no arrastra texto de más');
  ok(!fin.reloj && !fin.solucion, 'Zip: al terminar no queda cuenta regresiva ni "así se resolvía"');
  await sleep(1500);
  ok(await ev(`document.querySelector('#jugar-head .cron')?.textContent`) === fin.cron, `Zip: el reloj de arriba queda quieto en ${fin.cron}`);
  await b.shot('zip-diez');

  await ev(`document.getElementById('btn-fin').click(); 1`); await sleep(800);
  const res = await ev(`document.querySelector('.screen.active')?.textContent || ''`);
  ok(/100/.test(res), 'Zip: el resultado da 100 puntos por los diez niveles');
  await b.shot('zip-diez-resultado');
} finally {
  await b.close();
}
