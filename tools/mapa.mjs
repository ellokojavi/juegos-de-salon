#!/usr/bin/env node
/**
 * El mapa de ¿Dónde queda? (La Copa).
 *
 *   node tools/mapa.mjs generar    # reescribe copa/juegos/mapa.js (necesita internet)
 *   node tools/mapa.mjs revisar    # ¿cada ciudad cae dentro de su país? ¿falta algún país?
 *
 * Los bordes son los de Natural Earth 1:50m (dominio público), en el TopoJSON de `world-atlas`,
 * bajados de jsDelivr. El mapa sale sin nombres, simplificado y en décimas de grado enteras
 * (x = longitud, y = latitud), con la forma de una ruta SVG: el globo (`copa/juegos/globo.js`)
 * lo pasa a la esfera y lo gira.
 * Se rehace a mano; solo cambia si cambian los bordes o la proyección.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { UNIDADES_POR_GRADO as U, distancia } from '../copa/juegos/donde.js';
import { CIUDADES } from '../copa/juegos/ciudades.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const FUENTE = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const SALIDA = `${RAIZ}copa/juegos/mapa.js`;
/** Tolerancia de la simplificación y área mínima de una isla, en décimas de grado. */
const TOLERANCIA = 0.6;
const AREA_MIN = 3;

async function bajar() {
  const r = await fetch(FUENTE);
  if (!r.ok) throw new Error(`No pude bajar ${FUENTE}: ${r.status}`);
  return r.json();
}

/** Los arcos del TopoJSON, ya en grados: [[lon, lat], ...]. */
function arcos(topo) {
  const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
  return topo.arcs.map(arco => {
    let x = 0, y = 0;
    return arco.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
  });
}

/** Los anillos de cada país: { id, nombre, poligonos: [[anillo, ...huecos], ...] } con anillos de índices de arco. */
function paises(topo) {
  // Algunos países vienen en varias piezas con el mismo código (Australia y sus islotes): se juntan
  const porId = new Map();
  for (const g of topo.objects.countries.geometries) {
    const clave = g.id ?? g.properties?.name;
    const p = porId.get(clave) || { id: g.id, nombre: g.properties?.name, poligonos: [] };
    p.poligonos.push(...(g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : []));
    porId.set(clave, p);
  }
  return [...porId.values()];
}

/**
 * Arma un anillo con sus arcos (un índice negativo es el arco al revés, `~i`). Con `vuelta` (el
 * ancho del mundo en esas unidades), cada arco se corre una vuelta entera si hace falta para
 * seguir donde terminó el anterior: Rusia y Fiyi cruzan la línea de cambio de fecha.
 */
function anillo(indices, A, vuelta = 0) {
  const out = [];
  for (const i of indices) {
    let a = i < 0 ? A[~i].slice().reverse() : A[i];
    if (vuelta && out.length) {
      const k = Math.round((out[out.length - 1][0] - a[0][0]) / vuelta);
      if (k) a = a.map(([x, y]) => [x + k * vuelta, y]);
    }
    out.push(...(out.length ? a.slice(1) : a));
  }
  return out;
}

/** Un arco sin saltos de longitud: al pasar de 180 a −180 sigue en 181. */
function sinSaltos(arco) {
  const out = [arco[0]];
  for (let i = 1; i < arco.length; i++) {
    const prev = out[i - 1][0];
    let lon = arco[i][0];
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    out.push([lon, arco[i][1]]);
  }
  return out;
}

/** Douglas–Peucker. */
function simplificar(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const pila = [[0, pts.length - 1]];
  while (pila.length) {
    const [a, b] = pila.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    let max = -1, k = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L;
      if (d > max) { max = d; k = i; }
    }
    if (max > tol) { keep[k] = 1; pila.push([a, k], [k, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const area = pts => Math.abs(pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0)) / 2;

async function generar() {
  const topo = await bajar();
  // Se simplifica cada arco una sola vez: así un borde compartido queda igual para los dos países.
  // Sin saltos en la línea de cambio de fecha (Rusia, Fiyi): en la esfera 181° es −179°
  const A = arcos(topo).map(a => simplificar(sinSaltos(a).map(([lon, lat]) => [lon * U, lat * U]), TOLERANCIA));
  let d = '', puntos = 0, anillos = 0;
  const rombo = (x, y) => { d += `M${x} ${y + 1}l1-1-1-1-1 1z`; anillos++; puntos += 4; };
  for (const p of paises(topo)) {
    const todos = p.poligonos.flat().map(ix => anillo(ix, A, 360 * U).map(([x, y]) => [Math.round(x), Math.round(y)]));
    const mayor = Math.max(...todos.map(area));
    for (const r of todos) {
      // Las islas mínimas se van, salvo que sean lo más grande que tiene el país (Nauru, Tuvalu)
      if (area(r) < AREA_MIN && area(r) < mayor) continue;
      const pts = r.filter((q, i) => i === 0 || q[0] !== r[i - 1][0] || q[1] !== r[i - 1][1]);
      // Un país que cabe en una décima de grado: un rombo chico, para que se vea que ahí hay algo
      if (pts.length < 3) { rombo(...pts[0]); continue; }
      d += `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) d += `l${pts[i][0] - pts[i - 1][0]} ${pts[i][1] - pts[i - 1][1]}`.replace(/ -/g, '-');
      d += 'z';
      anillos++; puntos += pts.length;
    }
  }
  // Los países que Natural Earth 1:50m no trae (Tuvalu): un rombo chico en su capital
  const ids = new Set(paises(topo).map(p => p.id));
  for (const c of CIUDADES.filter(c => c.capital && !ids.has(c.iso))) rombo(Math.round(c.lon * U), Math.round(c.lat * U));
  const js = `/**
 * El mapa de ¿Dónde queda?: los países sin nombres, en décimas de grado (x = longitud, y = latitud).
 * Generado por \`node tools/mapa.mjs generar\` desde Natural Earth 1:50m (dominio público). No se edita a mano.
 */
export const MAPA = { d: '${d}' };
`;
  writeFileSync(SALIDA, js);
  console.log(`copa/juegos/mapa.js: ${anillos} anillos, ${puntos} puntos, ${(js.length / 1024).toFixed(0)} KB`);
}

/** ¿El punto está dentro del anillo? (rayo, en grados). */
function dentro([lon, lat], r) {
  let si = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) si = !si;
  }
  return si;
}

async function revisar() {
  const topo = await bajar();
  const A = arcos(topo);
  const P = paises(topo);
  const porId = new Map(P.map(p => [p.id, p]));
  let malas = 0;
  // Cada país de la lista está en el mapa, y cada ciudad cae en su país o a menos de 15 km de la costa
  for (const c of CIUDADES) {
    const p = porId.get(c.iso);
    // Sin bordes en el mapa (Tuvalu): se dibuja un rombo en su capital, que así cae en su lugar
    if (!p) { console.log(`· ${c.ciudad}: ${c.pais} (${c.iso}) no trae bordes; va un rombo${c.capital ? '' : ' ✗ y no es capital'}`); if (!c.capital) malas++; continue; }
    const polis = p.poligonos.map(pol => pol.map(ix => anillo(ix, A)));
    const adentro = polis.some(([ext, ...huecos]) => dentro([c.lon, c.lat], ext) && !huecos.some(h => dentro([c.lon, c.lat], h)));
    if (adentro) continue;
    const cerca = Math.min(...polis.flat().flat().map(([lon, lat]) => distancia([c.lat, c.lon], [lat, lon])));
    const otro = P.find(q => q !== p && q.poligonos.some(pol => dentro([c.lon, c.lat], anillo(pol[0], A))));
    // En la frontera misma (Nicosia, Jerusalén, el Vaticano) el borde simplificado puede dejarla al otro lado
    if (cerca > 15) { console.log(`✗ ${c.ciudad}, ${c.pais}: a ${Math.round(cerca)} km de su país${otro ? `, dentro de ${otro.nombre}` : ''}`); malas++; }
  }
  const capitales = CIUDADES.filter(c => c.capital);
  console.log(`${CIUDADES.length} ciudades, ${capitales.length} capitales de ${new Set(capitales.map(c => c.pais)).size} países.`);
  console.log(malas ? `${malas} por revisar.` : 'Todas las ciudades caen en su país.');
  process.exitCode = malas ? 1 : 0;
}

const orden = process.argv[2];
if (orden === 'generar') await generar();
else if (orden === 'revisar') await revisar();
else { console.log('Uso: node tools/mapa.mjs generar | revisar'); process.exitCode = 2; }
