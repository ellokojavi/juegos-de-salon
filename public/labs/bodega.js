// ✨ Mejoras lanzadas grows with every launch (D-479), so its cards fold by when they launched: one fold
// per week in the current month, one per month before that, newest first and only the newest open.
// Each card says its day in data-launched; the search box opens every fold with a match.

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const day = iso => new Date(`${iso}T12:00:00`);
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// The fold a launch day goes in: { key, title }, keys sort newest first as strings
export function periodOf(iso, today = new Date()) {
  const d = day(iso);
  if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) {
    const monday = new Date(d); monday.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return { key: ymd(monday), title: `Semana del ${monday.getDate()} de ${MONTHS[monday.getMonth()]}` };
  }
  const name = MONTHS[d.getMonth()];
  return { key: iso.slice(0, 7), title: `${name[0].toUpperCase()}${name.slice(1)} ${d.getFullYear()}` };
}

// Cards grouped into folds, newest fold first and newest card first inside it
export function group(cards, today = new Date()) {
  const folds = new Map();
  for (const c of [...cards].sort((a, b) => b.launched.localeCompare(a.launched))) {
    const p = periodOf(c.launched, today);
    if (!folds.has(p.key)) folds.set(p.key, { ...p, cards: [] });
    folds.get(p.key).cards.push(c);
  }
  return [...folds.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export function start(root = document) {
  const box = root.getElementById('bodega-mejoras');
  if (!box) return;
  const cards = [...box.querySelectorAll(':scope > .seccion[data-launched]')].map(node => ({ node, launched: node.dataset.launched }));
  const folds = group(cards).map((f, i) => {
    const d = document.createElement('details');
    d.className = 'bodega-periodo';
    d.open = i === 0;
    d.dataset.period = f.key;
    const s = document.createElement('summary');
    const t = document.createElement('span');
    const arrow = document.createElement('span');
    arrow.className = 'flecha'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '›';
    s.append(t, arrow);
    d.append(s, ...f.cards.map(c => c.node));
    box.append(d);
    return { d, t, title: f.title, total: f.cards.length, wasOpen: d.open };
  });
  const count = (f, n) => { f.t.textContent = `${f.title} · ${n}`; };
  folds.forEach(f => count(f, f.total));

  const input = root.getElementById('bodega-buscar');
  const none = root.getElementById('bodega-nada');
  const plain = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  input?.addEventListener('input', () => {
    const q = plain(input.value.trim());
    let shown = 0;
    for (const f of folds) {
      let n = 0;
      for (const card of f.d.querySelectorAll(':scope > .seccion')) {
        const hit = !q || plain(card.querySelector('summary')?.textContent + ' ' + card.querySelector('.detalle')?.textContent).includes(q);
        card.hidden = !hit;
        if (hit) n++;
      }
      f.d.hidden = n === 0;
      f.d.open = q ? n > 0 : f.wasOpen;
      count(f, q ? n : f.total);
      shown += n;
    }
    if (none) none.hidden = shown > 0;
  });
}
