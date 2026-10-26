/**
 * 🚅 Tren en Vilo — the visitors in the house style, up close (lab, owner's request 2026-10-25): each one
 * drawn big by neon-visitors.js's renderer, in its moments, with buttons that play a game where it comes
 * in stage 1 (`?style=neon&ovni=pesca`…; those parameters work only with a lab key, INTERNO in game.js).
 */
import { el } from '../../../assets/js/ui.js';
import { pincel } from '../../../cup/games/bridges/neon-visitors.js';
import { PAJARO, PLATILLO, PREGUNTA, BALLENA, PEZ, TOPO, TOPO_MIEDO, EXCLAMACION, LANCHA, SURFISTA } from '../../../cup/games/bridges/pixel.js';

const hoja = document.getElementById('hoja');

/** A night scene `alto` px high with a water line at `agua` (0 to 1 of the height, or null), drawn by `fn(r, W, H)` in art units of `k` px. */
function escena(alto, k, agua, fn) {
  const c = el('canvas', {});
  const pintar = () => {
    const dpr = devicePixelRatio || 1, w = c.clientWidth || 340;
    c.width = Math.round(w * dpr); c.height = Math.round(alto * dpr); c.style.height = `${alto}px`;
    const ctx = c.getContext('2d'), W = w / k, H = alto / k;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, alto);
    g.addColorStop(0, '#12052a'); g.addColorStop(0.6, '#2a0c4e'); g.addColorStop(1, '#4a1a6e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, alto);
    ctx.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    if (agua !== null) {
      const y = H * agua, a = ctx.createLinearGradient(0, y, 0, H);
      a.addColorStop(0, '#173f7a'); a.addColorStop(1, '#0a1a3a');
      ctx.fillStyle = a; ctx.fillRect(0, y, W, H - y);
      ctx.save(); ctx.shadowColor = '#7af0ff'; ctx.shadowBlur = 4; ctx.strokeStyle = 'rgba(122,240,255,0.85)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); for (let x = 0; x <= W; x += 1) ctx.lineTo(x, y + Math.sin(x * 0.3) * 0.4); ctx.stroke(); ctx.restore();
    }
    fn(pincel(ctx, W, H), W, H, ctx);
  };
  requestAnimationFrame(pintar);
  addEventListener('resize', pintar);
  return c;
}
const botones = pares => el('div', { class: 'stack', style: 'gap:8px' }, ...pares.map(([texto, q]) =>
  el('a', { class: 'btn btn--yellow', href: `../?style=neon&${q}` }, texto)));
const seccion = (titulo, texto, lienzo, pares) => hoja.append(el('section', { class: 'panel tren-op' },
  el('h2', {}, titulo), el('p', { class: 'muted', style: 'margin:0' }, texto), lienzo, botones(pares)));

seccion('Pájaros', 'Pasan de vez en cuando, altos y discretos. Aletean arriba, abiertos y abajo.',
  escena(110, 5, null, (r, W) => PAJARO.forEach((s, k) => r.sprite(s, {}, W * (0.2 + k * 0.3), 13))), []);

seccion('Platillo volador', 'Llega, mira el puente con su haz de luz y se va. O pesca un pez del agua y se lo lleva.',
  escena(230, 5, 0.86, (r, W, H) => {
    r.sprite(PLATILLO[0], {}, W * 0.26, 22); r.sprite(PREGUNTA, {}, W * 0.26, 12);
    r.haz(W * 0.72, 16, H * 0.86 - 16, 16, 0.2); r.sprite(PLATILLO[1], {}, W * 0.72, 13);
    r.sprite(PEZ, {}, W * 0.72, H * 0.6);
  }), [['🛸 Que mire el puente', 'ovni=mira'], ['🐟 Que pesque', 'ovni=pesca']]);

seccion('Ballena', 'Salta fuera del agua en un arco, o sale a flote y echa su chorro.',
  escena(150, 4.2, 0.72, (r, W, H) => {
    const y = H * 0.72;
    r.sprite(BALLENA.sube, {}, W * 0.2, y + 3, { cortarY: y + 0.3 });
    r.sprite(BALLENA.arriba, {}, W * 0.5, y - 9);
    r.sprite(BALLENA.baja, {}, W * 0.8, y + 4, { cortarY: y + 0.3 });
  }), [['🐋 Que salte', 'ballena=salto'], ['💦 Que eche el chorro', 'ballena=chorro']]);

seccion('Lancha y wakeboarder', 'Una lancha cruza con su ola y el wakeboarder la surfea: se agacha, salta o se cae, y la lancha vuelve a buscarlo con la bandera arriba.',
  escena(170, 5, 0.75, (r, W, H) => {
    const y = H * 0.75, x = W * 0.36, popa = x - 8;
    r.ola(Array.from({ length: 23 }, (_, k) => [popa - (k + 2), y - (k < 4 ? k * 0.8 : Math.max(0, 3.2 - (k - 4) * 0.22))]), y);
    r.sprite(LANCHA, {}, x, y + 2, { cortarY: y + 1 });
    r.linea(x - 6, y - 6, popa - 9 + 2, y - 3.2 + 1 - 6, '#0a0a0a');
    r.sprite(SURFISTA.arriba, {}, popa - 9, y - 3.2 + 1);
    r.sprite(SURFISTA.agachado, {}, W * 0.7, y + 0.4);
    r.sprite(SURFISTA.cae, {}, W * 0.86, y - 3);
    r.nadador(W * 0.92, y, { asoma: 1, vaiven: 0, tabla: W * 0.6 - 6 });
  }), [['🏄 Que surfee', 'wake=carve'], ['🤸 Que salte', 'wake=jump'], ['💥 Que se caiga', 'wake=fall'], ['🫧 Que se hunda', 'wake=sink']]);

seccion('Topo', 'Cava un túnel por el acantilado, sale al vacío sin darse cuenta, se asusta y cae al agua.',
  escena(150, 5, 0.85, (r, W, H, ctx) => {
    ctx.fillStyle = '#170838'; ctx.fillRect(0, 6, W * 0.42, H);
    ctx.save(); ctx.shadowColor = '#2ee6d6'; ctx.shadowBlur = 5; ctx.fillStyle = '#2ee6d6'; ctx.fillRect(0, 5.5, W * 0.42, 1); ctx.restore();
    for (let x = 0; x < W * 0.32; x += 1) r.rect(x - 1, 14 + Math.sin(x * 0.4) * 1.2 - 6, 3, 7, 'rgba(26,11,46,0.92)');
    r.sprite(TOPO[0], {}, W * 0.32, 15);
    r.sprite(TOPO[1], {}, W * 0.55, 15); r.sprite(EXCLAMACION, {}, W * 0.55, 7);
    r.sprite(TOPO_MIEDO[0], {}, W * 0.82, 20);
  }), [['🕳️ Que cave', 'topo']]);
