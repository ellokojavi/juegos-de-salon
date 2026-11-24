/**
 * The slot-machine roll (D-425), shared by La Copa's week and the Duels' rounds: each card runs through
 * random games of `pool` and stops on its own, top to bottom (300 ms + 90 ms per card, a step every
 * 70 ms). The real draw is already painted underneath, so a tap meanwhile acts on the real game.
 *
 * `cards`: the card elements, top to bottom. `paint(card, id)` draws game `id` of the pool on a card's
 * spinning parts (marked `.slot-reel`) and, called with `null`, puts the real game back. While a card
 * spins it carries `.slot-spin` and keeps its height (a longer name does not push the rows below,
 * C-8); it lands with `.slot-land`. The styles are in base.css. With reduced motion nothing moves.
 * Returns a function that stops the roll at once, with every card on its real game.
 */
export function slotRoll(cards, pool, paint) {
  if (!cards.length || !pool.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const cs = cards.map(f => ({ f, quieta: false }));
  cs.forEach(c => { c.f.style.height = `${c.f.offsetHeight}px`; });
  const parar = c => {
    paint(c.f, null);
    c.f.classList.remove('slot-spin'); c.f.style.height = ''; c.f.classList.add('slot-land'); c.quieta = true;
  };
  const t0 = performance.now();
  let rueda = null;
  const paso = () => {
    const t = performance.now() - t0;
    let giran = 0;
    cs.forEach((c, i) => {
      if (c.quieta) return;
      if (t >= 300 + i * 90) { parar(c); return; }
      giran++;
      paint(c.f, pool[Math.floor(Math.random() * pool.length)]);
      c.f.classList.add('slot-spin');
    });
    if (!giran) clearInterval(rueda);
  };
  paso();
  rueda = setInterval(paso, 70);
  return () => { clearInterval(rueda); cs.forEach(c => { if (!c.quieta) parar(c); }); };
}
