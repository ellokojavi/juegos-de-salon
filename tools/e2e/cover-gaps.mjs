// The space between a cover's blocks (DESIGN.md §3 rule 6): every block on a game's first screen
// (its panels, its stage, its ranking) sits the same 12 px from the next, the gap of a .stack. Returned
// as an expression to evaluate in the page: the list of gaps that are not 12, with the blocks around them.
export const COVER_GAP = 12;
export const coverGapsOff = `(() => {
  const app = document.querySelector('.app') || document.body, W = app.getBoundingClientRect().width;
  const shown = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 36 && r.width > W * 0.6; };
  let blocks = [...app.querySelectorAll('.panel, .demo')].filter(e => shown(e) && !e.closest('.pie-sitio, .topbar'));
  blocks = blocks.filter(e => !blocks.some(o => o !== e && o.contains(e)))
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  const name = e => e.id || String(e.className).split(' ').slice(0, 2).join('.');
  const off = [];
  for (let i = 1; i < blocks.length; i++) {
    const g = Math.round(blocks[i].getBoundingClientRect().top - blocks[i - 1].getBoundingClientRect().bottom);
    if (g >= 0 && g !== ${COVER_GAP}) off.push(g + ' px ' + name(blocks[i - 1]) + ' → ' + name(blocks[i]));
  }
  return JSON.stringify(off);
})()`;
