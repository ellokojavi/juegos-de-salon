/**
 * Transfer: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the rules are in engine.js. See docs/games/transfer.md.
 *
 * Nine real metro networks (CITIES), each drawn as a schematic with five levels; a run plays five of them.
 */

export const GAME_ID = 'transfer';
export const HEARTS = 3;

const ride = n => ({ t: 'ride', n });
const END = { t: 'end' };
const TURN = { t: 'turn' };
const change = (line, toward) => ({ t: 'change', line, toward });
/** A line's stretch from `from` to `to`, in its real order (a level shows only that). */
const cut = (line, from, to) => ({ ...line, base: line.stops, stops: line.stops.slice(line.stops.indexOf(from), line.stops.indexOf(to) + 1) });
/** A city's map: every line its levels use, each on the widest stretch any of them shows. */
function mapOf(levels) {
  const lines = new Map();
  for (const l of levels.flatMap(v => v.lines || [])) {
    const base = l.base || l.stops, have = lines.get(l.id);
    const from = Math.min(base.indexOf(l.stops[0]), have ? base.indexOf(have.stops[0]) : Infinity);
    const to = Math.max(base.indexOf(l.stops[l.stops.length - 1]), have ? base.indexOf(have.stops[have.stops.length - 1]) : -1);
    lines.set(l.id, { ...l, stops: base.slice(from, to + 1) });
  }
  return [...lines.values()];
}

/*
 * Each city: real stations of its centre on a schematic like the maps in its stations (straight runs at
 * 0°, 45° and 90°, even spacing, the real order and the real shape simplified; x grows east and y south,
 * one unit per stretch between neighbours). `label` is the side a name goes (l, r, t, b, or a corner:
 * tl, tr, bl, br), chosen by hand so no name touches another (tools/e2e/transfer/labels.js checks it).
 *
 * A line: `n` (shown as "Línea {n}") or `name` (its own name, the same in every language), its colour
 * (the class tr-line--<id> in style.css), its stretch in real order, `ends`, the real terminals its
 * platforms are named after (the first towards stops[0]), and `bends`, corners between two stations
 * ({ after: station, at: [x, y] }), drawn rounded. A transfer station is one id shared by its lines; where
 * the real station has a name per line (Buenos Aires), the shared one carries both.
 * `untagged` lists the ends (0, 1) whose direction is not drawn: a loop that comes back on itself, or a line
 * that goes on along another one already drawn (Seattle's 2 Line north of the International District).
 *
 * Each city's five levels follow the same steps, one rule more each time: count stations, the other
 * platform, a transfer, a closed station, a station to pass through. `solution` holds hand indices
 * (engine.test.mjs proves every one).
 */

/* ---------------- Santiago ---------------- */
const SCL_ST = {
  heroes: { name: 'Los Héroes', x: 0, y: 6, label: 'l' }, moneda: { name: 'La Moneda', x: 1, y: 6, label: 't' },
  uchile: { name: 'Universidad de Chile', x: 2, y: 6, label: 'br' }, lucia: { name: 'Santa Lucía', x: 4, y: 6, label: 'tl' },
  catolica: { name: 'Universidad Católica', x: 5, y: 5, label: 'br' }, baquedano: { name: 'Baquedano', x: 6, y: 4, label: 'br' },
  salvador: { name: 'Salvador', x: 7, y: 3, label: 'r' }, montt: { name: 'Manuel Montt', x: 8, y: 2, label: 'l' },
  patronato: { name: 'Patronato', x: 2, y: 1, label: 'r' }, calycanto: { name: 'Puente Cal y Canto', x: 1, y: 2, label: 'r' },
  ana: { name: 'Santa Ana', x: 0, y: 4, label: 'tr' }, toesca: { name: 'Toesca', x: 0, y: 7.5, label: 'l' },
  ohiggins: { name: "Parque O'Higgins", x: 0, y: 9, label: 'r' }, hospitales: { name: 'Hospitales', x: 1, y: 0.5, label: 'r' },
  armas: { name: 'Plaza de Armas', x: 2, y: 4, label: 'tr' }, almagro: { name: 'Parque Almagro', x: 2, y: 7.5, label: 'r' },
  matta: { name: 'Matta', x: 3, y: 9, label: 'b' }, irarrazaval: { name: 'Irarrázaval', x: 6, y: 9, label: 'r' },
  quinta: { name: 'Quinta Normal', x: -2, y: 4, label: 't' }, cumming: { name: 'Cumming', x: -1, y: 4, label: 'b' },
  bellas: { name: 'Bellas Artes', x: 4.25, y: 4, label: 'tr' }, bustamante: { name: 'Parque Bustamante', x: 6, y: 5.5, label: 'r' },
  isabel: { name: 'Santa Isabel', x: 6, y: 7, label: 'r' },
};
const SCL = {
  l1: { id: 'l1', n: 1, ends: ['San Pablo', 'Los Dominicos'], stops: ['heroes', 'moneda', 'uchile', 'lucia', 'catolica', 'baquedano', 'salvador', 'montt'], bends: [] },
  l2: { id: 'l2', n: 2, ends: ['Vespucio Norte', 'Hospital El Pino'], stops: ['patronato', 'calycanto', 'ana', 'heroes', 'toesca', 'ohiggins'], bends: [{ after: 'calycanto', at: [0, 3] }] },
  l3: { id: 'l3', n: 3, ends: ['Plaza Quilicura', 'Fernando Castillo Velasco'], stops: ['hospitales', 'calycanto', 'armas', 'uchile', 'almagro', 'matta', 'irarrazaval'], bends: [{ after: 'calycanto', at: [2, 3] }, { after: 'almagro', at: [2, 8] }] },
  l5: { id: 'l5', n: 5, ends: ['Plaza de Maipú', 'Vicente Valdés'], stops: ['quinta', 'cumming', 'ana', 'armas', 'bellas', 'baquedano', 'bustamante', 'isabel', 'irarrazaval'], bends: [] },
};
const SCL_LEVELS = [
  { // 1 · counting stations, along the Alameda
    // A single-line trip still shows the lines that cross it (the owner, 2026-11-12: Baquedano is not only Line 1)
    lines: [cut(SCL.l1, 'heroes', 'baquedano'), cut(SCL.l2, 'patronato', 'ohiggins'), cut(SCL.l3, 'calycanto', 'matta'), cut(SCL.l5, 'cumming', 'baquedano')], start: { station: 'heroes', line: 'l1', toward: 'baquedano' }, goal: 'lucia',
    hand: [ride(2), ride(3), ride(4)], slots: 1, solution: [1],
  },
  { // 2 · the other platform
    lines: [cut(SCL.l1, 'heroes', 'montt')], start: { station: 'catolica', line: 'l1', toward: 'montt' }, goal: 'moneda',
    hand: [ride(1), END, TURN, ride(3), ride(2)], slots: 2, solution: [2, 3],
  },
  { // 3 · a transfer at Baquedano
    lines: [cut(SCL.l1, 'heroes', 'montt'), cut(SCL.l5, 'armas', 'isabel')], start: { station: 'heroes', line: 'l1', toward: 'montt' }, goal: 'bellas',
    hand: [change('l5', 'isabel'), ride(5), ride(4), change('l5', 'armas'), ride(1), END], slots: 3, solution: [1, 3, 4],
  },
  { // 4 · Universidad de Chile closed: around it
    lines: [cut(SCL.l1, 'heroes', 'baquedano'), cut(SCL.l2, 'patronato', 'ohiggins'), cut(SCL.l3, 'calycanto', 'matta'), cut(SCL.l5, 'cumming', 'baquedano')],
    closed: ['uchile'], start: { station: 'heroes', line: 'l1', toward: 'baquedano' }, goal: 'armas',
    hand: [ride(3), change('l2', 'patronato'), change('l5', 'baquedano'), change('l2', 'ohiggins'), ride(1), ride(2), change('l5', 'cumming'), ride(1)],
    slots: 4, solution: [1, 4, 2, 7],
  },
  { // 5 · passing through Bellas Artes
    lines: [cut(SCL.l1, 'heroes', 'baquedano'), cut(SCL.l2, 'calycanto', 'ohiggins'), cut(SCL.l3, 'calycanto', 'irarrazaval'), cut(SCL.l5, 'ana', 'irarrazaval')],
    via: 'bellas', start: { station: 'toesca', line: 'l2', toward: 'calycanto' }, goal: 'matta',
    hand: [ride(2), change('l5', 'irarrazaval'), END, change('l3', 'calycanto'), ride(1), change('l1', 'baquedano'), change('l3', 'irarrazaval'), ride(6)],
    slots: 5, solution: [0, 1, 2, 3, 4],
  },
];

/* ---------------- Buenos Aires ---------------- */
const BUE_ST = {
  retiro: { name: 'Retiro', x: 5, y: 0, label: 'r' }, sanmartin: { name: 'General San Martín', x: 5, y: 1, label: 'r' },
  lavalle: { name: 'Lavalle', x: 5, y: 2, label: 'r' }, pellegrini: { name: 'C. Pellegrini / Diagonal Norte', x: 5, y: 3, label: 'tl' },
  avmayo: { name: 'Lima / Av. de Mayo', x: 5, y: 4.5, label: 'bl' }, moreno: { name: 'Moreno', x: 5, y: 5.5, label: 'r' },
  independencia: { name: 'Independencia', x: 5, y: 6.5, label: 'br' }, sanjuan: { name: 'San Juan', x: 5, y: 7.5, label: 'r' },
  constitucion: { name: 'Constitución', x: 5, y: 8.5, label: 'r' },
  callao: { name: 'Callao', x: 0.5, y: 3, label: 't' }, uruguay: { name: 'Uruguay', x: 2.5, y: 3, label: 't' },
  florida: { name: 'Florida', x: 6.5, y: 3, label: 'b' }, alem: { name: 'Leandro N. Alem', x: 8.75, y: 3, label: 't' },
  congreso: { name: 'Congreso', x: 1, y: 4.5, label: 'b' }, saenz: { name: 'Sáenz Peña', x: 3, y: 4.5, label: 'b' },
  piedras: { name: 'Piedras', x: 6.5, y: 4.5, label: 't' }, peru: { name: 'Perú / Bolívar', x: 8, y: 4.5, label: 't' },
  plazamayo: { name: 'Plaza de Mayo', x: 9.5, y: 4.5, label: 'b' },
  belgrano: { name: 'Belgrano', x: 7.25, y: 5.75, label: 'r' }, sanjose: { name: 'San José', x: 3.5, y: 6.5, label: 'b' },
  entrerios: { name: 'Entre Ríos', x: 2, y: 6.5, label: 'b' },
};
const BUE = {
  a: { id: 'a', n: 'A', ends: ['San Pedrito', 'Plaza de Mayo'], stops: ['congreso', 'saenz', 'avmayo', 'piedras', 'peru', 'plazamayo'], bends: [] },
  b: { id: 'b', n: 'B', ends: ['Juan Manuel de Rosas', 'Leandro N. Alem'], stops: ['callao', 'uruguay', 'pellegrini', 'florida', 'alem'], bends: [] },
  c: { id: 'c', n: 'C', ends: ['Retiro', 'Constitución'], stops: ['retiro', 'sanmartin', 'lavalle', 'pellegrini', 'avmayo', 'moreno', 'independencia', 'sanjuan', 'constitucion'], bends: [] },
  e: { id: 'e', n: 'E', ends: ['Retiro', 'Plaza de los Virreyes'], stops: ['peru', 'belgrano', 'independencia', 'sanjose', 'entrerios'], bends: [{ after: 'peru', at: [8, 5] }, { after: 'belgrano', at: [6.5, 6.5] }] },
};
const BUE_LEVELS = [
  { // 1 · counting stations, down Line C
    lines: [cut(BUE.c, 'retiro', 'constitucion')], start: { station: 'retiro', line: 'c', toward: 'constitucion' }, goal: 'pellegrini',
    hand: [ride(2), ride(3), ride(4)], slots: 1, solution: [1],
  },
  { // 2 · the other platform, under Avenida de Mayo
    lines: [cut(BUE.a, 'congreso', 'plazamayo'), cut(BUE.c, 'pellegrini', 'constitucion'), cut(BUE.e, 'peru', 'entrerios')], start: { station: 'piedras', line: 'a', toward: 'plazamayo' }, goal: 'saenz',
    hand: [ride(1), END, TURN, ride(2), ride(3)], slots: 2, solution: [2, 3],
  },
  { // 3 · a transfer at Carlos Pellegrini
    lines: [cut(BUE.b, 'callao', 'alem'), cut(BUE.c, 'retiro', 'constitucion')], start: { station: 'callao', line: 'b', toward: 'alem' }, goal: 'moreno',
    hand: [change('c', 'retiro'), ride(2), ride(3), change('c', 'constitucion'), ride(1), ride(2)], slots: 3, solution: [1, 3, 5],
  },
  { // 4 · Moreno closed: around it by Lines A and E
    lines: [cut(BUE.a, 'congreso', 'plazamayo'), cut(BUE.c, 'pellegrini', 'constitucion'), cut(BUE.e, 'peru', 'entrerios')],
    closed: ['moreno'], start: { station: 'avmayo', line: 'c', toward: 'constitucion' }, goal: 'sanjose',
    hand: [ride(2), change('a', 'plazamayo'), change('e', 'entrerios'), change('a', 'congreso'), ride(2), ride(3), change('e', 'peru'), ride(1)],
    slots: 4, solution: [1, 0, 2, 5],
  },
  { // 5 · passing through Belgrano
    lines: [cut(BUE.a, 'congreso', 'plazamayo'), cut(BUE.b, 'callao', 'alem'), cut(BUE.c, 'retiro', 'constitucion'), cut(BUE.e, 'peru', 'entrerios')],
    via: 'belgrano', start: { station: 'piedras', line: 'a', toward: 'plazamayo' }, goal: 'sanjuan',
    hand: [ride(1), change('e', 'entrerios'), ride(2), change('c', 'constitucion'), ride(1), TURN, ride(3), change('c', 'retiro')],
    slots: 5, solution: [0, 1, 2, 3, 4],
  },
];

/* ---------------- London ---------------- */
const LON_ST = {
  marble: { name: 'Marble Arch', x: -1, y: 3, label: 't' }, bond: { name: 'Bond Street', x: 1, y: 3, label: 'tr' },
  oxford: { name: 'Oxford Circus', x: 3, y: 3, label: 'tr' }, tcr: { name: 'Tottenham Court Road', x: 5, y: 3, label: 'b' },
  holborn: { name: 'Holborn', x: 6.5, y: 3, label: 't' }, chancery: { name: 'Chancery Lane', x: 7.5, y: 3, label: 'b' },
  greenpark: { name: 'Green Park', x: 1.5, y: 4.5, label: 'tl' },
  baker: { name: 'Baker Street', x: 1.5, y: 1.5, label: 'tl' }, regents: { name: "Regent's Park", x: 2.25, y: 2.25, label: 'l' },
  westminster: { name: 'Westminster', x: 2, y: 7, label: 'l' }, waterloo: { name: 'Waterloo', x: 3, y: 8, label: 'r' },
  hydepark: { name: 'Hyde Park Corner', x: 0.5, y: 4.5, label: 'tl' }, piccadilly: { name: 'Piccadilly Circus', x: 3, y: 4.5, label: 'bl' },
  leicester: { name: 'Leicester Square', x: 4.5, y: 4.5, label: 'r' }, covent: { name: 'Covent Garden', x: 5.25, y: 3.75, label: 'r' },
  charing: { name: 'Charing Cross', x: 3, y: 6, label: 'r' }, embankment: { name: 'Embankment', x: 3, y: 7, label: 'r' },
};
const LON = {
  central: { id: 'central', name: 'Central', ends: ['Ealing Broadway', 'Epping'], stops: ['marble', 'bond', 'oxford', 'tcr', 'holborn', 'chancery'], bends: [] },
  jubilee: { id: 'jubilee', name: 'Jubilee', ends: ['Stanmore', 'Stratford'], stops: ['baker', 'bond', 'greenpark', 'westminster', 'waterloo'], bends: [{ after: 'baker', at: [1, 2] }, { after: 'bond', at: [1, 4] }, { after: 'greenpark', at: [1.5, 6.5] }] },
  piccadilly: { id: 'piccadilly', name: 'Piccadilly', ends: ['Heathrow', 'Cockfosters'], stops: ['hydepark', 'greenpark', 'piccadilly', 'leicester', 'covent', 'holborn'], bends: [] },
  bakerloo: { id: 'bakerloo', name: 'Bakerloo', ends: ['Harrow & Wealdstone', 'Elephant & Castle'], stops: ['baker', 'regents', 'oxford', 'piccadilly', 'charing', 'embankment', 'waterloo'], bends: [] },
};
const LON_LEVELS = [
  { // 1 · counting stations along the Central line
    lines: [cut(LON.central, 'marble', 'holborn')], start: { station: 'marble', line: 'central', toward: 'holborn' }, goal: 'tcr',
    hand: [ride(2), ride(3), ride(4)], slots: 1, solution: [1],
  },
  { // 2 · the other platform
    lines: [cut(LON.central, 'marble', 'holborn')], start: { station: 'tcr', line: 'central', toward: 'holborn' }, goal: 'marble',
    hand: [ride(1), END, TURN, ride(3), ride(2)], slots: 2, solution: [2, 3],
  },
  { // 3 · a change at Oxford Circus, to the Bakerloo
    start: { station: 'marble', line: 'central', toward: 'holborn' }, goal: 'charing',
    hand: [change('bakerloo', 'baker'), ride(2), ride(3), change('bakerloo', 'waterloo'), ride(1), END, ride(2)], slots: 3, solution: [1, 3, 6],
  },
  { // 4 · Oxford Circus closed: around it by Jubilee and Piccadilly
    lines: [cut(LON.central, 'marble', 'holborn'), cut(LON.jubilee, 'baker', 'waterloo'), cut(LON.piccadilly, 'hydepark', 'leicester'), cut(LON.bakerloo, 'baker', 'waterloo')],
    closed: ['oxford'], start: { station: 'bond', line: 'central', toward: 'holborn' }, goal: 'piccadilly',
    hand: [ride(1), change('jubilee', 'waterloo'), change('piccadilly', 'leicester'), change('bakerloo', 'waterloo'), ride(1), ride(2), change('piccadilly', 'hydepark'), ride(1)],
    slots: 4, solution: [1, 4, 2, 7],
  },
  { // 5 · passing through Green Park
    lines: [cut(LON.jubilee, 'baker', 'waterloo'), cut(LON.piccadilly, 'hydepark', 'leicester'), cut(LON.bakerloo, 'baker', 'waterloo')],
    via: 'greenpark', start: { station: 'baker', line: 'jubilee', toward: 'waterloo' }, goal: 'embankment',
    hand: [ride(2), change('piccadilly', 'leicester'), ride(1), change('bakerloo', 'waterloo'), ride(2), change('bakerloo', 'baker'), ride(5), END],
    slots: 5, solution: [0, 1, 2, 3, 4],
  },
];

/* ---------------- São Paulo ---------------- */
const SAO_ST = {
  luz: { name: 'Luz', x: 4, y: 0, label: 'r' }, saobento: { name: 'São Bento', x: 4, y: 1.5, label: 'r' },
  se: { name: 'Sé', x: 4, y: 3, label: 'tr' }, liberdade: { name: 'Liberdade', x: 4, y: 4, label: 'r' },
  saojoaquim: { name: 'São Joaquim', x: 4, y: 5, label: 'r' }, vergueiro: { name: 'Vergueiro', x: 4, y: 6, label: 'r' },
  paraiso: { name: 'Paraíso', x: 4, y: 7, label: 'r' }, anarosa: { name: 'Ana Rosa', x: 4, y: 8, label: 'l' },
  marechal: { name: 'Marechal Deodoro', x: -0.5, y: 3, label: 't' }, cecilia: { name: 'Santa Cecília', x: 1, y: 3, label: 'b' },
  republica: { name: 'República', x: 2, y: 3, label: 'tr' }, anhangabau: { name: 'Anhangabaú', x: 3, y: 3, label: 'b' },
  pedro: { name: 'Pedro II', x: 5, y: 3, label: 'b' }, bras: { name: 'Brás', x: 6, y: 3, label: 't' },
  higienopolis: { name: 'Higienópolis-Mackenzie', x: 1, y: 4, label: 'r' }, paulista: { name: 'Paulista / Consolação', x: 0, y: 5, label: 'l' },
  trianon: { name: 'Trianon-Masp', x: 0.75, y: 5.75, label: 'bl' },
  brigadeiro: { name: 'Brigadeiro', x: 2, y: 5.75, label: 't' },
};
const SAO = {
  sp1: { id: 'sp1', name: 'Linha 1-Azul', ends: ['Tucuruvi', 'Jabaquara'], stops: ['luz', 'saobento', 'se', 'liberdade', 'saojoaquim', 'vergueiro', 'paraiso', 'anarosa'], bends: [] },
  sp2: { id: 'sp2', name: 'Linha 2-Verde', ends: ['Vila Madalena', 'Vila Prudente'], stops: ['paulista', 'trianon', 'brigadeiro', 'paraiso'], bends: [{ after: 'brigadeiro', at: [2.75, 5.75] }] },
  sp3: { id: 'sp3', name: 'Linha 3-Vermelha', ends: ['Palmeiras-Barra Funda', 'Corinthians-Itaquera'], stops: ['marechal', 'cecilia', 'republica', 'anhangabau', 'se', 'pedro', 'bras'], bends: [] },
  sp4: { id: 'sp4', name: 'Linha 4-Amarela', ends: ['Luz', 'Vila Sônia'], stops: ['luz', 'republica', 'higienopolis', 'paulista'], bends: [{ after: 'luz', at: [2, 2] }] },
};
const SAO_LEVELS = [
  { // 1 · counting stations down Line 1
    lines: [cut(SAO.sp1, 'luz', 'anarosa')], start: { station: 'luz', line: 'sp1', toward: 'anarosa' }, goal: 'liberdade',
    hand: [ride(2), ride(3), ride(4)], slots: 1, solution: [1],
  },
  { // 2 · the other platform
    lines: [cut(SAO.sp3, 'marechal', 'bras')], start: { station: 'pedro', line: 'sp3', toward: 'bras' }, goal: 'republica',
    hand: [ride(1), END, TURN, ride(3), ride(2)], slots: 2, solution: [2, 3],
  },
  { // 3 · a transfer at Sé
    lines: [cut(SAO.sp1, 'luz', 'anarosa'), cut(SAO.sp3, 'marechal', 'bras')], start: { station: 'marechal', line: 'sp3', toward: 'bras' }, goal: 'liberdade',
    hand: [change('sp1', 'luz'), ride(4), ride(3), change('sp1', 'anarosa'), ride(1), END], slots: 3, solution: [1, 3, 4],
  },
  { // 4 · Sé closed: around it by Lines 4 and 3
    lines: [cut(SAO.sp1, 'luz', 'anarosa'), cut(SAO.sp3, 'marechal', 'bras'), cut(SAO.sp4, 'luz', 'paulista')],
    closed: ['se'], start: { station: 'luz', line: 'sp1', toward: 'anarosa' }, goal: 'anhangabau',
    hand: [ride(2), change('sp4', 'paulista'), change('sp3', 'bras'), change('sp3', 'marechal'), ride(1), END, change('sp4', 'luz'), ride(1)],
    slots: 4, solution: [1, 4, 2, 7],
  },
  { // 5 · passing through Luz
    lines: [cut(SAO.sp1, 'luz', 'anarosa'), cut(SAO.sp2, 'paulista', 'paraiso'), cut(SAO.sp3, 'marechal', 'bras'), cut(SAO.sp4, 'luz', 'paulista')],
    via: 'luz', start: { station: 'marechal', line: 'sp3', toward: 'bras' }, goal: 'paraiso',
    hand: [ride(2), change('sp4', 'luz'), END, change('sp1', 'anarosa'), ride(6), ride(4), change('sp1', 'luz'), ride(4)],
    slots: 5, solution: [0, 1, 2, 3, 4],
  },
];

/* ---------------- Madrid ---------------- */
const MAD_ST = {
  tribunal: { name: 'Tribunal', x: 3, y: 0, label: 'r' }, granvia: { name: 'Gran Vía', x: 3, y: 1.5, label: 'tr' },
  sol: { name: 'Sol', x: 3, y: 3, label: 'tr' }, tirso: { name: 'Tirso de Molina', x: 3, y: 4.5, label: 'r' },
  anton: { name: 'Antón Martín', x: 4, y: 5.5, label: 'r' },
  callao: { name: 'Callao', x: 1.5, y: 1.5, label: 'tl' }, opera: { name: 'Ópera', x: 1.5, y: 3, label: 'bl' },
  latina: { name: 'La Latina', x: 0.5, y: 4, label: 'l' }, chueca: { name: 'Chueca', x: 4.5, y: 1.5, label: 't' },
  domingo: { name: 'Santo Domingo', x: 0.5, y: 2, label: 'l' }, sevilla: { name: 'Sevilla', x: 4.25, y: 3, label: 'b' },
  bancoespana: { name: 'Banco de España', x: 5.5, y: 3, label: 't' },
  plazaespana: { name: 'Plaza de España', x: 0.5, y: 0.5, label: 'l' }, lavapies: { name: 'Lavapiés', x: 2, y: 5.25, label: 'l' },
};
const MAD = {
  m1: { id: 'm1', n: 1, ends: ['Pinar de Chamartín', 'Valdecarros'], stops: ['tribunal', 'granvia', 'sol', 'tirso', 'anton'], bends: [] },
  m2: { id: 'm2', n: 2, ends: ['Cuatro Caminos', 'Las Rosas'], stops: ['domingo', 'opera', 'sol', 'sevilla', 'bancoespana'], bends: [] },
  m3: { id: 'm3', n: 3, ends: ['Moncloa', 'Villaverde Alto'], stops: ['plazaespana', 'callao', 'sol', 'lavapies'], bends: [{ after: 'sol', at: [2, 4] }] },
  m5: { id: 'm5', n: 5, ends: ['Casa de Campo', 'Alameda de Osuna'], stops: ['latina', 'opera', 'callao', 'granvia', 'chueca'], bends: [] },
};
const MAD_LEVELS = [
  { // 1 · counting stations down Line 1
    start: { station: 'tribunal', line: 'm1', toward: 'anton' }, goal: 'sol',
    hand: [ride(1), ride(2), ride(3)], slots: 1, solution: [1],
  },
  { // 2 · the other platform, under Sol
    start: { station: 'sevilla', line: 'm2', toward: 'bancoespana' }, goal: 'opera',
    hand: [ride(1), END, TURN, ride(3), ride(2)], slots: 2, solution: [2, 4],
  },
  { // 3 · a transfer at Callao
    start: { station: 'plazaespana', line: 'm3', toward: 'lavapies' }, goal: 'granvia',
    hand: [change('m5', 'latina'), ride(1), ride(2), change('m5', 'chueca'), ride(1), END], slots: 3, solution: [1, 3, 4],
  },
  { // 4 · Sol closed: round it by Line 5
    closed: ['sol'], start: { station: 'tribunal', line: 'm1', toward: 'anton' }, goal: 'opera',
    hand: [ride(2), ride(1), change('m5', 'latina'), change('m2', 'domingo'), ride(2), change('m5', 'chueca'), ride(3)],
    slots: 4, solution: [1, 2, 4],
  },
  { // 5 · passing through Callao, round the Puerta del Sol
    via: 'callao', start: { station: 'tribunal', line: 'm1', toward: 'anton' }, goal: 'lavapies',
    hand: [ride(1), change('m5', 'latina'), ride(1), change('m3', 'lavapies'), ride(2), ride(2), change('m3', 'plazaespana'), change('m5', 'chueca')],
    slots: 5, solution: [0, 1, 2, 3, 4],
  },
];


/* ---------------- Chicago ---------------- */
// The Loop: a square of elevated track (Lake, Wabash, Van Buren, Wells) that the Brown Line rides round,
// the Red Line under State Street, and the Green Line along Lake Street and down Wabash
const CHI_ST = {
  merch: { name: 'Merchandise Mart', x: 2, y: 0.5, label: 'l' }, clinton: { name: 'Clinton', x: 0, y: 2, label: 'b' },
  clarklake: { name: 'Clark/Lake', x: 3.5, y: 2, label: 't' }, statelake: { name: 'State/Lake / Lake', x: 5, y: 2, label: 'tr' },
  washwells: { name: 'Washington/Wells', x: 2, y: 3.5, label: 'l' }, quincy: { name: 'Quincy', x: 2, y: 5, label: 'l' },
  lasallevb: { name: 'LaSalle/Van Buren', x: 3.5, y: 6, label: 't' }, library: { name: 'Harold Washington Library / Jackson', x: 5, y: 6, label: 'bl' },
  adamswabash: { name: 'Adams/Wabash', x: 6.5, y: 4.5, label: 'r' }, washwabash: { name: 'Washington/Wabash', x: 6.5, y: 3, label: 'r' },
  chicagor: { name: 'Chicago', x: 5, y: 0, label: 'r' }, grand: { name: 'Grand', x: 5, y: 1, label: 'r' },
  monroe: { name: 'Monroe', x: 5, y: 4, label: 'l' }, harrison: { name: 'Harrison', x: 5, y: 7, label: 'l' },
  roosevelt: { name: 'Roosevelt', x: 6.5, y: 8.5, label: 'r' }, cermak: { name: 'Cermak-McCormick Place', x: 6.5, y: 10, label: 'r' },
};
const CHI = {
  red: { id: 'red', name: 'Red Line', ends: ['Howard', '95th/Dan Ryan'], stops: ['chicagor', 'grand', 'statelake', 'monroe', 'library', 'harrison', 'roosevelt'], bends: [] },
  green: { id: 'green', name: 'Green Line', ends: ['Harlem/Lake', 'Ashland/63rd'], stops: ['clinton', 'clarklake', 'statelake', 'washwabash', 'adamswabash', 'roosevelt', 'cermak'], bends: [{ after: 'statelake', at: [6.5, 2] }] },
  brown: { id: 'brown', name: 'Brown Line', ends: ['Kimball', 'Loop'], untagged: [1], stops: ['merch', 'washwells', 'quincy', 'lasallevb', 'library', 'adamswabash', 'washwabash', 'statelake', 'clarklake'], bends: [{ after: 'merch', at: [2, 2] }, { after: 'quincy', at: [2, 6] }, { after: 'library', at: [6.5, 6] }, { after: 'washwabash', at: [6.5, 2] }] },
};
const CHI_LEVELS = [
  { // 1 · counting stations down State Street
    start: { station: 'chicagor', line: 'red', toward: 'roosevelt' }, goal: 'monroe',
    hand: [ride(2), ride(3), ride(4)], slots: 1, solution: [1],
  },
  { // 2 · the other platform
    start: { station: 'library', line: 'red', toward: 'roosevelt' }, goal: 'grand',
    hand: [ride(1), END, TURN, ride(3), ride(2)], slots: 2, solution: [2, 3],
  },
  { // 3 · a transfer to the Brown Line round the Loop
    start: { station: 'chicagor', line: 'red', toward: 'roosevelt' }, goal: 'quincy',
    hand: [change('brown', 'clarklake'), ride(4), ride(3), change('brown', 'merch'), ride(2), END], slots: 3, solution: [1, 3, 4],
  },
  { // 4 · Monroe closed: round the Loop instead
    closed: ['monroe'], start: { station: 'chicagor', line: 'red', toward: 'roosevelt' }, goal: 'library',
    hand: [ride(4), ride(2), change('brown', 'merch'), change('brown', 'clarklake'), ride(3), change('green', 'cermak'), ride(1)],
    slots: 4, solution: [1, 2, 4],
  },
  { // 5 · passing through Adams/Wabash
    via: 'adamswabash', start: { station: 'clinton', line: 'green', toward: 'cermak' }, goal: 'monroe',
    hand: [ride(4), change('brown', 'merch'), ride(1), change('red', 'chicagor'), ride(1), ride(2), change('red', 'roosevelt'), END],
    slots: 5, solution: [0, 1, 2, 3, 4],
  },
];

/* ---------------- Rome ---------------- */
// Line A from Spagna down to San Giovanni, Line B from the Colosseum up to Bologna, crossing at Termini,
// and Line C from the Colosseum to San Giovanni (open since 2025)
const ROM_ST = {
  lepanto: { name: 'Lepanto', x: -0.25, y: 0, label: 't' }, flaminio: { name: 'Flaminio', x: 1.25, y: 0, label: 't' },
  spagna: { name: 'Spagna', x: 2.5, y: 0, label: 't' }, barberini: { name: 'Barberini', x: 3.25, y: 0.75, label: 'l' },
  repubblica: { name: 'Repubblica', x: 4, y: 1.5, label: 'l' }, termini: { name: 'Termini', x: 4.75, y: 2.25, label: 'r' },
  vittorio: { name: 'Vittorio Emanuele', x: 5.5, y: 3, label: 'r' }, manzoni: { name: 'Manzoni', x: 6.25, y: 3.75, label: 'r' },
  sangiovanni: { name: 'San Giovanni', x: 6.25, y: 5.25, label: 'r' },
  piramide: { name: 'Piramide', x: 1.75, y: 5.25, label: 'l' }, circo: { name: 'Circo Massimo', x: 2.5, y: 4.5, label: 'l' },
  colosseo: { name: 'Colosseo', x: 3.25, y: 3.75, label: 'tl' }, cavour: { name: 'Cavour', x: 4, y: 3, label: 'l' },
  castro: { name: 'Castro Pretorio', x: 5.5, y: 1.5, label: 'r' }, policlinico: { name: 'Policlinico', x: 6.25, y: 0.75, label: 'r' },
  bologna: { name: 'Bologna', x: 7, y: 0, label: 't' },
  metronia: { name: 'Porta Metronia', x: 4.75, y: 5.25, label: 'b' },
};
const ROM = {
  ra: { id: 'ra', n: 'A', ends: ['Battistini', 'Anagnina'], stops: ['lepanto', 'flaminio', 'spagna', 'barberini', 'repubblica', 'termini', 'vittorio', 'manzoni', 'sangiovanni'], bends: [] },
  rb: { id: 'rb', n: 'B', ends: ['Laurentina', 'Rebibbia'], stops: ['piramide', 'circo', 'colosseo', 'cavour', 'termini', 'castro', 'policlinico', 'bologna'], bends: [] },
  rc: { id: 'rc', n: 'C', ends: ['Colosseo-Fori Imperiali', 'Monte Compatri-Pantano'], stops: ['colosseo', 'metronia', 'sangiovanni'], bends: [{ after: 'colosseo', at: [3.25, 5.25] }] },
};
const ROM_LEVELS = [
  { // 1 · counting stations to Termini
    start: { station: 'spagna', line: 'ra', toward: 'sangiovanni' }, goal: 'termini',
    hand: [ride(2), ride(3), ride(4)], slots: 1, solution: [1],
  },
  { // 2 · the other platform
    start: { station: 'colosseo', line: 'rb', toward: 'piramide' }, goal: 'termini',
    hand: [ride(1), END, TURN, ride(3), ride(2)], slots: 2, solution: [2, 4],
  },
  { // 3 · a transfer at Termini
    start: { station: 'flaminio', line: 'ra', toward: 'sangiovanni' }, goal: 'policlinico',
    hand: [change('rb', 'piramide'), ride(4), ride(3), change('rb', 'bologna'), ride(2), END], slots: 3, solution: [1, 3, 4],
  },
  { // 4 · Cavour closed: round by San Giovanni and Line C
    closed: ['cavour'], start: { station: 'flaminio', line: 'ra', toward: 'sangiovanni' }, goal: 'colosseo',
    hand: [ride(4), change('rb', 'piramide'), ride(2), END, change('rc', 'colosseo'), change('rc', 'sangiovanni'), ride(3)],
    slots: 4, solution: [3, 4, 2],
  },
  { // 5 · passing through San Giovanni
    via: 'sangiovanni', start: { station: 'vittorio', line: 'ra', toward: 'lepanto' }, goal: 'colosseo',
    hand: [ride(1), change('rb', 'piramide'), ride(2), TURN, change('rc', 'colosseo'), ride(2), END, change('rb', 'bologna')],
    slots: 5, solution: [3, 2, 4, 5],
  },
];

/* ---------------- New York ---------------- */
// Midtown and below: the 1 down Seventh Avenue, the 6 down Lexington, the 7 and the shuttle across 42nd
// Street, and the L along 14th Street
const NYC_ST = {
  columbus: { name: '59 St-Columbus Circle', x: 1, y: 0, label: 'r' }, w50: { name: '50 St', x: 1, y: 1, label: 'r' },
  times: { name: 'Times Sq-42 St', x: 1, y: 2, label: 'l' }, penn: { name: '34 St-Penn Station', x: 1, y: 3, label: 'r' },
  w28: { name: '28 St', x: 1, y: 4, label: 'r' }, w23: { name: '23 St', x: 1, y: 5, label: 'r' },
  w18: { name: '18 St', x: 1, y: 6, label: 'r' }, w14: { name: '14 St / 6 Av', x: 1, y: 7, label: 'b' },
  lex59: { name: 'Lexington Av/59 St', x: 6, y: 0, label: 'l' }, e51: { name: '51 St', x: 6, y: 1, label: 'l' },
  grandcentral: { name: 'Grand Central-42 St', x: 6, y: 2, label: 'tr' }, e33: { name: '33 St', x: 6, y: 3, label: 'l' },
  e28: { name: '28 St', x: 6, y: 4, label: 'l' }, e23: { name: '23 St', x: 6, y: 5, label: 'l' },
  union: { name: '14 St-Union Sq', x: 6, y: 7, label: 'b' },
  fifth: { name: '5 Av', x: 3.5, y: 2.75, label: 'b' }, vernon: { name: 'Vernon Blvd-Jackson Av', x: 8, y: 2, label: 'b' },
  eighth: { name: '8 Av', x: -0.5, y: 7, label: 'b' }, third: { name: '3 Av', x: 7.25, y: 7, label: 'b' }, first: { name: '1 Av', x: 8.5, y: 7, label: 'b' },
};
const NYC = {
  n1: { id: 'n1', n: 1, ends: ['Van Cortlandt Park-242 St', 'South Ferry'], stops: ['columbus', 'w50', 'times', 'penn', 'w28', 'w23', 'w18', 'w14'], bends: [] },
  n6: { id: 'n6', n: 6, ends: ['Pelham Bay Park', 'Brooklyn Bridge-City Hall'], stops: ['lex59', 'e51', 'grandcentral', 'e33', 'e28', 'e23', 'union'], bends: [] },
  n7: { id: 'n7', n: 7, ends: ['34 St-Hudson Yards', 'Flushing-Main St'], stops: ['times', 'fifth', 'grandcentral', 'vernon'], bends: [{ after: 'times', at: [1.75, 2.75] }, { after: 'fifth', at: [5.25, 2.75] }] },
  ns: { id: 'ns', n: 'S', ends: ['Times Sq-42 St', 'Grand Central-42 St'], stops: ['times', 'grandcentral'], bends: [] },
  nl: { id: 'nl', n: 'L', ends: ['8 Av', 'Canarsie-Rockaway Pkwy'], stops: ['eighth', 'w14', 'union', 'third', 'first'], bends: [] },
};
const NYC_LEVELS = [
  { // 1 · counting stations down Seventh Avenue
    start: { station: 'columbus', line: 'n1', toward: 'w14' }, goal: 'times',
    hand: [ride(1), ride(2), ride(3)], slots: 1, solution: [1],
  },
  { // 2 · the other platform, uptown
    start: { station: 'e33', line: 'n6', toward: 'union' }, goal: 'lex59',
    hand: [ride(1), END, TURN, ride(3), ride(2)], slots: 2, solution: [2, 3],
  },
  { // 3 · a transfer at Times Square
    start: { station: 'columbus', line: 'n1', toward: 'w14' }, goal: 'fifth',
    hand: [change('n7', 'vernon'), ride(2), ride(3), change('nl', 'first'), ride(1), END], slots: 3, solution: [1, 0, 4],
  },
  { // 4 · 5 Av closed: the shuttle instead
    closed: ['fifth'], start: { station: 'penn', line: 'n1', toward: 'columbus' }, goal: 'grandcentral',
    hand: [ride(1), change('n7', 'vernon'), ride(2), change('ns', 'grandcentral'), ride(3), change('n6', 'union'), ride(1)],
    slots: 4, solution: [0, 3, 6],
  },
  { // 5 · passing through Union Square
    via: 'union', start: { station: 'penn', line: 'n1', toward: 'w14' }, goal: 'e28',
    hand: [END, change('nl', 'first'), ride(1), change('n6', 'lex59'), ride(2), change('nl', 'eighth'), TURN, change('n6', 'union')],
    slots: 5, solution: [0, 1, 2, 3, 4],
  },
];

/* ---------------- Seattle ---------------- */
// Link light rail: the 1 Line through downtown, the 2 Line from the International District across Lake
// Washington, and the Monorail from Westlake to Seattle Center
const SEA_ST = {
  uw: { name: 'University of Washington', x: 3, y: 0, label: 'r' }, capitolhill: { name: 'Capitol Hill', x: 3, y: 1, label: 'r' },
  westlake: { name: 'Westlake', x: 2, y: 2, label: 'r' }, symphony: { name: 'Symphony', x: 2, y: 3, label: 'r' },
  pioneer: { name: 'Pioneer Square', x: 2, y: 4, label: 'l' }, idc: { name: 'International District/Chinatown', x: 2, y: 5, label: 'bl' },
  stadium: { name: 'Stadium', x: 2, y: 6, label: 'l' }, sodo: { name: 'SODO', x: 2, y: 7, label: 'l' },
  beacon: { name: 'Beacon Hill', x: 3, y: 8, label: 'r' }, mountbaker: { name: 'Mount Baker', x: 3, y: 9, label: 'r' },
  seattlecenter: { name: 'Seattle Center', x: 0, y: 2, label: 't' },
  judkins: { name: 'Judkins Park', x: 3.5, y: 5, label: 'b' }, mercer: { name: 'Mercer Island', x: 5, y: 5, label: 'b' },
  southbellevue: { name: 'South Bellevue', x: 6.5, y: 5, label: 'r' }, eastmain: { name: 'East Main', x: 6.5, y: 4, label: 'r' },
  bellevue: { name: 'Bellevue Downtown', x: 6.5, y: 3, label: 'r' },
};
const SEA = {
  one: { id: 'one', name: '1 Line', ends: ['Lynnwood City Center', 'Federal Way Downtown'], stops: ['uw', 'capitolhill', 'westlake', 'symphony', 'pioneer', 'idc', 'stadium', 'sodo', 'beacon', 'mountbaker'], bends: [] },
  two: { id: 'two', name: '2 Line', ends: ['Lynnwood City Center', 'Downtown Redmond'], untagged: [0], stops: ['idc', 'judkins', 'mercer', 'southbellevue', 'eastmain', 'bellevue'], bends: [] },
  mono: { id: 'mono', name: 'Monorail', ends: ['Seattle Center', 'Westlake'], stops: ['seattlecenter', 'westlake'], bends: [] },
};
const SEA_LEVELS = [
  { // 1 · counting stations through downtown
    start: { station: 'westlake', line: 'one', toward: 'mountbaker' }, goal: 'idc',
    hand: [ride(2), ride(3), ride(4)], slots: 1, solution: [1],
  },
  { // 2 · the other platform
    start: { station: 'sodo', line: 'one', toward: 'mountbaker' }, goal: 'pioneer',
    hand: [ride(1), END, TURN, ride(3), ride(2)], slots: 2, solution: [2, 3],
  },
  { // 3 · a transfer at the International District
    start: { station: 'capitolhill', line: 'one', toward: 'mountbaker' }, goal: 'mercer',
    hand: [change('mono', 'seattlecenter'), ride(4), ride(3), change('two', 'bellevue'), ride(2), END], slots: 3, solution: [1, 3, 4],
  },
  { // 4 · Stadium closed: the 2 Line, not the end of the 1
    closed: ['stadium'], start: { station: 'uw', line: 'one', toward: 'mountbaker' }, goal: 'eastmain',
    hand: [END, ride(5), change('two', 'bellevue'), ride(4), change('mono', 'seattlecenter'), ride(3), ride(6)],
    slots: 4, solution: [1, 2, 3],
  },
  { // 5 · passing through East Main first
    via: 'eastmain', start: { station: 'mercer', line: 'two', toward: 'bellevue' }, goal: 'westlake',
    hand: [ride(2), TURN, END, change('one', 'uw'), ride(3), ride(1), change('mono', 'seattlecenter'), ride(4)],
    slots: 5, solution: [0, 1, 2, 3, 4],
  },
];

/** The cities, each with five levels, one per trip (see pickCities). */
export const CITIES = {
  santiago: { emoji: '🇨🇱', name: { es: 'Metro de Santiago', en: 'Santiago Metro', pt: 'Metrô de Santiago' }, stations: SCL_ST, levels: SCL_LEVELS },
  'buenos-aires': { emoji: '🇦🇷', name: { es: 'Subte de Buenos Aires', en: 'Buenos Aires Subte', pt: 'Subte de Buenos Aires' }, stations: BUE_ST, levels: BUE_LEVELS },
  london: { emoji: '🇬🇧', name: { es: 'Metro de Londres', en: 'London Underground', pt: 'Metrô de Londres' }, stations: LON_ST, levels: LON_LEVELS },
  'sao-paulo': { emoji: '🇧🇷', name: { es: 'Metro de São Paulo', en: 'São Paulo Metro', pt: 'Metrô de São Paulo' }, stations: SAO_ST, levels: SAO_LEVELS },
  madrid: { emoji: '🇪🇸', name: { es: 'Metro de Madrid', en: 'Madrid Metro', pt: 'Metrô de Madri' }, stations: MAD_ST, levels: MAD_LEVELS, map: [MAD.m1, MAD.m2, MAD.m3, MAD.m5] },
  chicago: { emoji: '🇺🇸', name: { es: 'L de Chicago', en: 'Chicago L', pt: 'L de Chicago' }, stations: CHI_ST, levels: CHI_LEVELS, map: [CHI.red, CHI.green, CHI.brown] },
  rome: { emoji: '🇮🇹', name: { es: 'Metro de Roma', en: 'Rome Metro', pt: 'Metrô de Roma' }, stations: ROM_ST, levels: ROM_LEVELS, map: [ROM.ra, ROM.rb, ROM.rc] },
  'new-york': { emoji: '🇺🇸', name: { es: 'Metro de Nueva York', en: 'New York City Subway', pt: 'Metrô de Nova York' }, stations: NYC_ST, levels: NYC_LEVELS, map: [NYC.n1, NYC.n6, NYC.n7, NYC.ns, NYC.nl] },
  seattle: { emoji: '🇺🇸', name: { es: 'Link de Seattle', en: 'Seattle Link', pt: 'Link de Seattle' }, stations: SEA_ST, levels: SEA_LEVELS, map: [SEA.one, SEA.two, SEA.mono] },
};
// Every level knows its city, and draws the city's whole map (the owner, 2026-11-12: a single-line trip
// still shows the lines that cross it), unless it brings its own
for (const [id, c] of Object.entries(CITIES)) { c.map ||= mapOf(c.levels); c.levels.forEach(l => { l.city = id; l.lines = c.map; }); }

/**
 * The game: five trips, each harder and each on a different metro (the owner, 2026-11-12: the player does
 * not pick a city). Each run draws five cities; trip k is level k of its city.
 */
export const TRIPS = 5;
export function pickCities(rand = Math.random) {
  const ids = Object.keys(CITIES);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids.slice(0, TRIPS);
}
export const tripsOf = cities => cities.map((c, k) => CITIES[c].levels[k]);

const ES = {
    comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendió, si fue fácil o difícil y qué le cambiarías.', ph: 'Por ejemplo: no me di cuenta de que se podía voltear una carta.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
  ui: {
    comentarAbrir: '💬 Sugerencias y comentarios',
    docTitle: 'Transbordo 🚉 · Juegos de Salón', gameChip: '🚉 Transbordo', menu: '‹ Laboratorio',
    title: 'Transbordo', lead: 'Arma la ruta con tus cartas y viaja en metro por nueve ciudades del mundo.',
    howTitle: '🧠 Cómo se juega',
    
    resumeTitle: '⏯ Hay un viaje a medias', resume: 'Continuar', delete: 'Borrar',
    levelOf: 'Viaje {n} de {total}', from: 'Sales de', to: 'Llegas a', via: 'Pasando por', closedLabel: 'Cerrada',
    heading: 'dirección {station}', plan: 'Tu ruta', hand: 'Tus cartas', go: '🚇 ¡Vamos!', clear: 'Vaciar', hintBtn: '💡 Pista (−❤️)',
    rideN: 'Avanza {n}', rideOne: 'Avanza 1', end: 'Hasta el final', turn: 'Otro andén', changeTo: 'Combina a {line}',
    lineN: 'Línea {n}', modeSolo: 'Cinco viajes, cinco metros', modeHint: 'cada uno más difícil', shareContext: 'Cinco metros', mapCredit: 'Estaciones reales, plano simplificado.',
    okLevel: '¡Llegaste! {stars}', next: 'Siguiente viaje ›', retry: 'Probar otra ruta', lostLevel: 'Sin corazones: seguimos con el próximo viaje.',
    pastEnd: 'La línea se acabó antes.', closed: '{station} está cerrada: el tren no pasa.', noChange: '{line} no pasa por {station}.',
    atTerminal: 'Ya estabas al final de la línea.', notGoal: 'Terminaste en {station}, no en {goal}.', missedVia: 'Faltó pasar por {station}.',
    emptyPlan: 'Pon al menos una carta en tu ruta.',
    resultTitle: '{stars} de {max} ⭐', resultLead: 'Cinco viajes por cinco metros del mundo.', again: '¡Otra vez!', shareRotulo: '📤 Compartir',
  },
  como: ['🎯 Llega a la estación de destino: toca tus cartas en orden y aprieta ¡Vamos!', '🃏 Avanza cuenta estaciones, Otro andén da la vuelta, Combina cambia de línea: la dirección es la estación final escrita al extremo de cada línea.', '❤️ Cada ruta que falla y cada pista cuestan un corazón.'],
};

const EN = {
    comentario: { titulo: 'What did you think?', lead: 'Tell us if it made sense, if it was easy or hard, and what you’d change.', ph: 'For example: I didn’t realize I could flip a card.', nombre: 'Name or nickname (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'No internet right now: your comment is saved on your phone and will be sent later.', error: 'Couldn’t send it. Try again in a bit.', cancelar: 'Cancel', cerrar: 'Close' },
  ui: {
    comentarAbrir: '💬 Suggestions and comments',
    docTitle: 'Transfer 🚉 · Parlor Games', gameChip: '🚉 Transfer', menu: '‹ Lab',
    title: 'Transfer', lead: 'Build the route with your cards and ride the metro in nine cities around the world.',
    howTitle: '🧠 How to play',
    
    resumeTitle: '⏯ There is a trip in progress', resume: 'Continue', delete: 'Delete',
    levelOf: 'Trip {n} of {total}', from: 'From', to: 'To', via: 'Via', closedLabel: 'Closed',
    heading: 'towards {station}', plan: 'Your route', hand: 'Your cards', go: '🚇 Go!', clear: 'Clear', hintBtn: '💡 Hint (−❤️)',
    rideN: 'Ride {n}', rideOne: 'Ride 1', end: 'To the end', turn: 'Other platform', changeTo: 'Change to {line}',
    lineN: 'Line {n}', modeSolo: 'Five trips, five metros', modeHint: 'each one harder', shareContext: 'Five metros', mapCredit: 'Real stations, simplified map.',
    okLevel: 'You made it! {stars}', next: 'Next trip ›', retry: 'Try another route', lostLevel: 'No hearts left: on to the next trip.',
    pastEnd: 'The line ended first.', closed: '{station} is closed: the train cannot pass.', noChange: '{line} does not stop at {station}.',
    atTerminal: 'You were already at the end of the line.', notGoal: 'You ended at {station}, not at {goal}.', missedVia: 'You did not pass {station}.',
    emptyPlan: 'Put at least one card in your route.',
    resultTitle: '{stars} of {max} ⭐', resultLead: 'Five trips on five of the world’s metros.', again: 'Again!', shareRotulo: '📤 Share',
  },
  como: ['🎯 Reach the destination: tap your cards in order and press Go!', '🃏 Ride counts stations, Other platform turns back, Change switches line: the direction is the last station written at each end of the line.', '❤️ Each failed route and each hint costs a heart.'],
};

const PT = {
    comentario: { titulo: 'O que você achou?', lead: 'Conte se deu para entender, se foi fácil ou difícil e o que você mudaria.', ph: 'Por exemplo: não percebi que dava para virar uma carta.', nombre: 'Nome ou apelido (opcional)', enviar: 'Enviar comentário', enviando: 'Enviando…', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Seu comentário chegou.', guardado: 'Sem internet agora: seu comentário ficou no celular e será enviado depois.', error: 'Não deu para enviar. Tente de novo daqui a pouco.', cancelar: 'Cancelar', cerrar: 'Fechar' },
  ui: {
    comentarAbrir: '💬 Sugestões e comentários',
    docTitle: 'Baldeação 🚉 · Jogos de Salão', gameChip: '🚉 Baldeação', menu: '‹ Laboratório',
    title: 'Baldeação', lead: 'Monte a rota com suas cartas e viaje de metrô por nove cidades do mundo.',
    howTitle: '🧠 Como se joga',
    
    resumeTitle: '⏯ Há uma viagem pela metade', resume: 'Continuar', delete: 'Apagar',
    levelOf: 'Viagem {n} de {total}', from: 'Saída', to: 'Chegada', via: 'Passando por', closedLabel: 'Fechada',
    heading: 'sentido {station}', plan: 'Sua rota', hand: 'Suas cartas', go: '🚇 Vamos!', clear: 'Esvaziar', hintBtn: '💡 Dica (−❤️)',
    rideN: 'Avance {n}', rideOne: 'Avance 1', end: 'Até o fim', turn: 'Outra plataforma', changeTo: 'Baldeie para {line}',
    lineN: 'Linha {n}', modeSolo: 'Cinco viagens, cinco metrôs', modeHint: 'cada uma mais difícil', shareContext: 'Cinco metrôs', mapCredit: 'Estações reais, mapa simplificado.',
    okLevel: 'Você chegou! {stars}', next: 'Próxima viagem ›', retry: 'Tentar outra rota', lostLevel: 'Sem corações: vamos para a próxima viagem.',
    pastEnd: 'A linha acabou antes.', closed: '{station} está fechada: o trem não passa.', noChange: '{line} não passa por {station}.',
    atTerminal: 'Você já estava no fim da linha.', notGoal: 'Você parou em {station}, não em {goal}.', missedVia: 'Faltou passar por {station}.',
    emptyPlan: 'Coloque pelo menos uma carta na sua rota.',
    resultTitle: '{stars} de {max} ⭐', resultLead: 'Cinco viagens por cinco metrôs do mundo.', again: 'De novo!', shareRotulo: '📤 Compartilhar',
  },
  como: ['🎯 Chegue ao destino: toque suas cartas em ordem e aperte Vamos!', '🃏 Avance conta estações, Outra plataforma volta, Baldeie troca de linha: a direção é a estação final escrita na ponta de cada linha.', '❤️ Cada rota que falha e cada dica custam um coração.'],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
