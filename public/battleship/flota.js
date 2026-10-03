/**
 * La flota y el agua, en pixel art (D-91).
 *
 * **Generado por `tools/flota.py`.** Para cambiar un barco se edita ese script y se vuelve a
 * correr; lo que se escriba a mano acá se pierde en la próxima pasada.
 *
 * Cada casilla del tablero dibuja un trozo de 16×16 píxeles, visto desde arriba y con la proa
 * a la derecha; un barco vertical es el mismo dibujo rotado 90° por CSS. Los trozos calzan
 * entre sí: popa, tramos del medio y proa. Un barco empieza y termina en punta.
 *
 * Los colores no van escritos en el dibujo sino en variables CSS, así el barco elegido es el
 * mismo trazado con otra paleta (`.cell.sel` en `style.css`) y no hay que dibujarlo dos veces.
 *
 * El agua es una sola baldosa repetida en todas las casillas, como en un tileset: va de fondo
 * (`--agua`, una imagen), no de contenido, para no meter cien SVG al DOM solo para pintar mar.
 */

/** Píxel → color. Todo sale de variables CSS menos el rojo de la bandera. */
const PALETA = {
  o: 'var(--casco-borde)', '+': 'var(--casco-luz)', '#': 'var(--casco)', s: 'var(--casco-sombra)',
  m: 'var(--casco-medio)', d: 'var(--cubierta)', y: 'var(--marca)', c: 'var(--antena)',
  r: '#e0243c', w: 'var(--espuma)',
};

/** Los cuatro tonos del mar. Van literales: el fondo es una imagen, y ahí no llegan las variables. */
const AGUA_TONOS = { 1: '#132a45', 2: '#1a3757', 3: '#24476a', 4: '#3f6f9e' };

export const LADO = 16;

/** El agua: una sola baldosa, repetida. */
export const AGUA = [
  '1111112221111221',
  '1331111111111122',
  '2222211111111111',
  '1111111113311111',
  '2221111111144111',
  '1122222122221111',
  '1111122211114441',
  '1111111333311111',
  '1222222111111111',
  '1111133333222111',
  '1133331111111111',
  '1111122221221111',
  '1111114442233221',
  '1111111111333311',
  '1111111221222221',
  '1111111221111111',
];

/** Cuántas casillas ocupa cada barco (lo mismo que dice el motor). */
export const TAMANOS = { carrier: 5, battleship: 4, cruiser: 3, destroyer: 2, submarine: 3 };

/** Los trozos de cada barco, de popa a proa. */
export const PIEZAS = {
  // Portaaviones (5)
  carrier: [
    ['................', '.......ooooooooo', '......o+++++++++', '.....ommmmmmmmmd', '....mddmddmddddd', 'w..omddmddmddddd', '..odmddmddmddddd', '.wyymmymymmyyymd', '.ommmmmmmmmmmmmd', 'w.odmddmddmddddd', '...omddmddmddddd', '....mddmddmddddd', '.....ommmmmmmmmd', '......osssssssss', '.......ooooooooo', '................'],
    ['................', 'oooooooooooooooo', '++++++++++++++++', 'dmmmmmmmmmmmmmmd', 'dddddddddddddddd', 'dddddcdddddddddd', 'ddddddccccccoddd', 'dyyyccccccccc+md', 'dmmmccccccccc+md', 'ddddddccccccoddd', 'dddddcdddddddddd', 'dddddddddddddddd', 'dmmmmmmmmmmmmmmd', 'ssssssssssssssss', 'oooooooooooooooo', '................'],
    ['......occcoy....', 'oooooommcm+m+ooo', '++++++m+++mmr+++', 'dmmmmmmo+ommmmmd', 'ddddddmmmmmodddd', 'ddddddoooooodddd', 'dddddddddddddddd', 'dyyymmyyymmyyymd', 'dmmmmmmmmmmmmmmd', 'dddddddddddddddd', 'dddddddddddddddd', 'dddddddddddddddd', 'dmmmmmmmmmmmmmmd', 'ssssssssssssssss', 'oooooooooooooooo', '................'],
    ['................', 'oooooooooooooooo', '++++++++++++++++', 'dmmmmmmmmmmmmmmd', 'dddddddddddddddd', 'ddddssssssdddddd', 'ddd++++++++ddddd', 'dyy++++++++yyymd', 'dmmmssssssmmmmmd', 'dddddddddddddddd', 'dddddddddddddddd', 'dddddddddddooooo', 'dmmmmmmmmmmommmo', 'sssssssssssommmo', 'oooooooooooooooo', '................'],
    ['................', 'oooo............', '+++++o..........', 'dmmmmmmo........', 'dddddddddo......', 'ddddddddddo.....', 'ddmmmmmmmmmmow..', 'dyyymmyyymmyyyow', 'dmmmmmmmmmmmmmow', 'ddmmmmmmmmmmo...', 'ddddddddddo.....', 'dddddddddo......', 'dmmmmmmo........', 'ssssso..........', 'oooo............', '................'],
  ],
  // Acorazado (4)
  battleship: [
    ['................', '................', '......oooooooooo', '.....o++++++++++', '....o###m###+m##', 'w..o###ooooooo##', '..o#yooommmm####', '.wmmyooo+++mmmm#', '.ommmmmo+o+mmmm#', 'w.o#yooo+++m####', '...oyooommmm####', '....o##ooooo#m##', '.....ossssssssss', '......oooooooooo', '................', '................'],
    ['................', '................', 'oooooooooooooooo', '++++++++++++++++', '#wwm####m##ooww#', '###ooooo########', '###ommmmooooy###', '#mmo+++mooooymm#', '#mmo+o+mmmmmmmm#', '###o+++mooooy###', '###ommmmooooy###', '#wwooooom####ww#', 'ssssssssssssssss', 'oooooooooooooooo', '................', '................'],
    ['.......ccc......', '........c.......', 'ooowoooo+ooooooo', '++w+++++++++y+++', '###m#oooooo+mww#', '#oooommmmmo#m###', '#mmmom+++mo#m###', '#mooom++++ommmm#', '#mooomooomommmm#', '#mooom+++mo#####', '#mmmom+++mo#####', '#oooommmmmo##ww#', 'sssssoooooosssss', 'oooooooooooooooo', '................', '................'],
    ['................', '................', 'oooooo..........', '+++++++o........', '###m###m#om.....', '#ooooo###oo.....', '#ommmmooy###ow..', '#o+++mooymmmmmow', '#o+o+mmmmmmmmmow', '#o+++mooy###o...', '#ommmmooy#o.....', '#ooooo#m#o......', 'ssssssso........', 'oooooo..........', '................', '................'],
  ],
  // Crucero (3)
  cruiser: [
    ['................', '................', '................', '.....ooooooooooo', '....o+++++++++++', 'w..o###ooooooo##', '..o####ommmmmo##', '.wmmmmmom+m+mom#', '.ommmmmom+++mom#', 'w.o####om+m+mo##', '...o###ommmmmo##', '....ossoooooooss', '.....ooooooooooo', '................', '................', '................'],
    ['.......ccc......', '........c.......', '........+....w..', 'oooooooo+ooowooo', '++++++++++++++++', '#wwmoooooo#oooo#', '####mmmmmo#mmmo#', '#mmmm++++ommooo#', '#mmmmooomommooo#', '####m+++mo#mooo#', '#wwmmmmmmo#mmmo#', 'ssssoooooosoooos', 'oooooooooooooooo', '................', '................', '................'],
    ['................', '................', '................', 'oooooooo........', '++oo+++++o......', '#ooooo#m#om.....', '#ooomm###o##ow..', '#o+++moooymmmmow', '#o+o+moooymmmmow', '#o+++m######o...', '#ommmm#m##o.....', 'sooooossso......', 'oooooooo........', '................', '................', '................'],
  ],
  // Submarino (3)
  submarine: [
    ['................', '................', '................', '....sssss.......', '....mmmmm.......', '..oooooooooooooo', 'oo++++++++++++++', 'wommm###########', 'wommmmmmmmmmmmmm', 'oossssssssssssss', '..oooooooooooooo', '....mmmmm.......', '....sssss.......', '................', '................', '................'],
    ['................', '........y.......', '........ycc.....', '........yc......', '........y.......', 'ooooooooyooooooo', '++++++m+++m+++++', '##oo##m+++m#oo##', 'mmmmmmm+++mmmmmm', 'ssssssm+++msssss', 'oooooooooooooooo', '................', '................', '................', '................', '................'],
    ['................', '................', '................', '................', '...mmmm.........', 'oooooooooooooo..', '+++++++++++++++o', '############oo#w', 'mmmmmmmmmmmmoomw', 'ssssssssssssssso', 'oooooooooooooo..', '...mmmm.........', '................', '................', '................', '................'],
  ],
  // Destructor (2)
  destroyer: [
    ['............ccc.', '.............c..', '.........w...+..', '.....ooowoooo+oo', '....o+++++++++++', 'w..o###ooooooooo', '..ooo##mmmommmmo', '.wmmmmmmooom+++o', '.omoommmooomoomo', 'w.o####mooom++mo', '...o###mmmommmmo', '....ossooooooooo', '.....ooooooooooo', '................', '................', '................'],
    ['................', '................', '................', 'oooooooo........', '+++++++++o......', '#ooooo#m#om.....', '#ommmm###o##ow..', '#o+++moooymmmmow', '#o+o+moooymmmmow', '#o+++m######o...', '#ommmm#m##o.....', 'sooooossso......', 'oooooooo........', '................', '................', '................'],
  ],
};

/** Un mapa a <svg>: cada corrida de píxeles iguales es un <rect>, que son muchos menos. */
function svgDe(mapa, paleta, fondo = false) {
  let r = '';
  mapa.forEach((fila, y) => {
    let x = 0;
    while (x < LADO) {
      const ch = fila[x];
      let n = 1; while (fila[x + n] === ch) n++;
      if (fondo || ch !== '.') r += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${paleta[ch]}"/>`;
      x += n;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" shape-rendering="crispEdges" class="barco">${r}</svg>`;
}

/** El agua, lista para `background-image`. Se calcula una vez y se repite en cada casilla. */
export const FONDO_AGUA = `url("data:image/svg+xml,${encodeURIComponent(svgDe(AGUA, AGUA_TONOS, true))}")`;

// Cada trozo se arma una sola vez y después se clona: son 17 dibujos para todo el tablero.
const hechos = new Map();

/**
 * El trozo `i` del barco `id`, como elemento listo para colgar de una casilla.
 * Devuelve null si el barco o el trozo no existen, para no romper una partida vieja.
 */
export function trozoDe(id, i) {
  const piezas = PIEZAS[id];
  if (!piezas || !piezas[i]) return null;
  const clave = `${id}${i}`;
  if (!hechos.has(clave)) {
    const caja = document.createElement('div');
    caja.innerHTML = svgDe(piezas[i], PALETA);
    hechos.set(clave, caja.firstElementChild);
  }
  return hechos.get(clave).cloneNode(true);
}

/**
 * El dibujo que le toca a la casilla (r, c) según un reparto de flota, ya rotado si el barco
 * va vertical. Devuelve null si ahí no hay barco.
 */
export function barcoEn(layout, r, c) {
  for (const [id, p] of Object.entries(layout || {})) {
    const tam = TAMANOS[id] || 0;
    const dentro = p.dir === 'h' ? (r === p.r && c >= p.c && c < p.c + tam) : (c === p.c && r >= p.r && r < p.r + tam);
    if (!dentro) continue;
    const svg = trozoDe(id, p.dir === 'h' ? c - p.c : r - p.r);
    if (svg && p.dir === 'v') svg.classList.add('v');
    return svg;
  }
  return null;
}

/** La flota entera en chico, para la ficha de la lista: los trozos en fila. */
export function barcoEntero(id) {
  const tira = document.createElement('span');
  tira.className = 'barco-tira';
  (PIEZAS[id] || []).forEach((_, i) => tira.append(trozoDe(id, i)));
  return tira;
}
