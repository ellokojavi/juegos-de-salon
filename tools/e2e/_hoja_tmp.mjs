import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
for (const [w,h] of [[320,640],[375,667],[390,844],[1280,800]]) {
  const b = await launch({ dir: `${OUT}/perfil${w}`, out: OUT, width: w, height: h });
  for (const lang of (w===390||w===320) ? ['es','en','pt','de'] : ['es','de']) {
    await b.go('http://localhost:8823/', 800);
    await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang','${lang}'); ${lang==='de'?"localStorage.setItem('juegos-de-salon:labs','de');":''} 1`);
    await b.go(`http://localhost:8823/?lang=${lang}`, 1500);
    await b.evaluate(`document.getElementById('btn-compartir-portada').click(); 1`); await sleep(900);
    const r = await b.evaluate(`(()=>{const p=document.getElementById('hoja-compartir');const R=x=>x.getBoundingClientRect();
      return JSON.stringify({foco:document.activeElement?.className, scrollH: document.documentElement.scrollWidth>innerWidth,
      panel:[Math.round(R(p).top),Math.round(R(p).bottom),Math.round(R(p).height), p.scrollHeight>p.clientHeight],
      botones:[...p.querySelectorAll('button')].map(x=>[x.textContent.trim().slice(0,22),Math.round(R(x).height),Math.round(R(x).width), R(x).bottom>innerHeight]),
      titulo:p.querySelector('h2').textContent, ovf:[...p.querySelectorAll('b,small,h2,.hoja-video-icono')].filter(x=>x.scrollWidth>x.clientWidth+1).map(x=>x.textContent)})})()`);
    console.log(w, lang, r);
    await b.shot(`hoja-${lang}-${w}`);
  }
  b.close();
}
