// El botón de compartir de la portada (D-226, D-242): abre una hoja con el video y dos opciones. En cada idioma,
// "Invitar a jugar" manda, con un celular que comparte archivos, la tarjeta social de ese idioma junto al texto, y
// "Compartir el video" manda el texto del video con su link de YouTube; en un computador, solo el texto copiado y
// nada descargado. El video no se baja hasta que lo tocan.
// Uso: node tools/e2e/compartir-portada.mjs /tmp/compartir-portada
import { launch, sleep } from './cdp.mjs';
const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2] || '/tmp/compartir-portada';
const b = await launch({ dir: `${OUT}/p`, out: OUT });
let mal = 0;
const ver = (ok, que) => { console.log(`${ok ? '✓' : '✗'} ${que}`); if (!ok) mal++; };
const ESPERADO = {
  es: { foto: 'menu.jpg', cab: '🎲 *Juegos de Salón* · ', archivo: 'juegos-de-salon.jpg' },
  en: { foto: 'menu-en.jpg', cab: '🎲 *Party Games* · ', archivo: 'party-games.jpg' },
  pt: { foto: 'menu-pt.jpg', cab: '🎲 *Jogos de Salão* · ', archivo: 'jogos-de-salao.jpg' },
  de: { foto: 'menu-de.jpg', cab: '🎲 *Salonspiele* · ', archivo: 'salonspiele.jpg' },
};
// Un celular que comparte archivos: guarda lo que llegó al menú y cuántas tarjetas se pidieron
const CELULAR = `(() => {
  window.__fotos = performance.getEntriesByType('resource').filter(e => /assets\\/og\\//.test(e.name)).map(e => e.name);
  navigator.canShare = d => true;
  navigator.share = async d => { window.__menu = { text: d.text, files: (d.files || []).map(f => ({ name: f.name, type: f.type, size: f.size })) }; };
  return 1;
})()`;
for (const [lang, e] of Object.entries(ESPERADO)) {
  await b.go(`${SITIO}/?lang=${lang}`, 1500);
  await b.evaluate(CELULAR);
  // La foto se baja al tocar, si no se bajó antes; el toque espera a tenerla
  await b.evaluate(`document.querySelector('#share-slot button').click(); 1`); await sleep(500);
  ver(await b.evaluate(`!!document.querySelector('#hoja-compartir .hoja-video-play img') && !document.querySelector('#hoja-compartir iframe')`), `${lang}: el botón abre la hoja, con la miniatura del video y sin cargarlo`);
  await b.evaluate(`document.getElementById('btn-compartir-video').click(); 1`); await sleep(600);
  const v = await b.evaluate(`JSON.stringify(window.__menu || null)`).then(JSON.parse);
  ver(v && v.text.startsWith('🎬 ') && /^🔗 https:\/\/youtu\.be\/[\w-]+$/.test(v.text.trim().split('\n').pop()) && !v.files.length, `${lang}: "Compartir el video" manda su texto con el link de YouTube al final (${v?.text?.split('\n').pop()})`);
  await b.evaluate(`window.__menu = null; document.getElementById('btn-invitar-portada').click(); 1`); await sleep(1200);
  const m = await b.evaluate(`JSON.stringify(window.__menu || null)`).then(JSON.parse);
  ver(m, `${lang}: "Invitar a jugar" abre el menú del sistema`);
  if (!m) continue;
  ver(m.files.length === 1 && m.files[0].name === e.archivo && m.files[0].type === 'image/jpeg' && m.files[0].size > 50000, `${lang}: va la tarjeta como imagen (${JSON.stringify(m.files[0])})`);
  const fotos = await b.evaluate(`JSON.stringify(performance.getEntriesByType('resource').filter(e => /assets\\/og\\//.test(e.name)).map(e => e.name.split('/').pop()))`).then(JSON.parse);
  ver(fotos.length === 1 && fotos[0] === e.foto, `${lang}: la tarjeta es la de su idioma (${fotos.join(', ')})`);
  ver(m.text.startsWith(e.cab) && /\d+/.test(m.text.split('\n')[0]), `${lang}: el texto abre con la cabecera y cuántos juegos hay`);
  const link = m.text.trim().split('\n').pop();
  ver(link === `🔗 https://juegosdesalon.cl/${lang === 'es' ? '' : `${lang}/`}?de=link`, `${lang}: el link a la portada del idioma, solo en la última línea (${link})`);
  console.log(m.text.replace(/^/gm, '    '));
}
// Un computador: sin menú, el texto queda copiado, el botón dice ✅ y no se baja ninguna imagen
await b.go(`${SITIO}/?lang=en`, 1500);
await b.evaluate(`(() => { navigator.canShare = undefined; navigator.share = undefined; window.__copiado = null;
  navigator.clipboard.writeText = async t => { window.__copiado = t; };
  window.__descargas = 0; const c = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) window.__descargas++; else c.call(this); };
  return 1; })()`);
await b.evaluate(`(() => { const x = document.querySelector('#share-slot button'); x.focus(); x.click(); return 1; })()`); await sleep(400);
await b.evaluate(`document.getElementById('btn-invitar-portada').click(); 1`); await sleep(600);
const pc = await b.evaluate(`JSON.stringify({ copiado: window.__copiado, descargas: window.__descargas, boton: document.querySelector('#btn-invitar-portada b').textContent, fotos: performance.getEntriesByType('resource').filter(e => /assets\\/og\\//.test(e.name)).length })`).then(JSON.parse);
ver(pc.copiado?.startsWith('🎲 *Party Games*') && pc.boton === '✅ Copied', `computador: el texto queda copiado y la opción dice ✅ Copied (${pc.boton})`);
await b.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); 1`); await sleep(200);
ver(await b.evaluate(`!document.getElementById('hoja-compartir') && document.activeElement?.id === 'btn-compartir-portada'`), 'Escape cierra la hoja y el foco vuelve al botón');
ver(pc.descargas === 0 && pc.fotos === 0, 'computador: no se baja ni se descarga ninguna imagen');
ver(!b.errors.length, `sin errores en la consola ${JSON.stringify(b.errors)}`);
b.close();
if (mal) process.exit(1);
