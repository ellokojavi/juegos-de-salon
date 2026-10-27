#!/usr/bin/env node
/**
 * The map of Where is it? (La Copa).
 *
 *   node tools/generators/map.mjs generate    # rewrites public/cup/games/where/mapa.js (needs internet)
 *   node tools/generators/map.mjs check       # does each city fall inside its country? is any country missing?
 *   node tools/generators/map.mjs satellite [<nasa.jpg>]   # remakes the globe's satellite images in WebP (internet and PIL)
 *
 * The borders are Natural Earth 1:50m's (public domain), in `world-atlas`'s TopoJSON, downloaded
 * from jsDelivr. The map comes out without names, simplified and in whole tenths of a degree
 * (x = longitude, y = latitude), shaped as an SVG path: the globe (`public/cup/games/where/globo.js`)
 * puts it on the sphere and rotates it.
 * It is remade by hand; it only changes if the borders or the projection change.
 */
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { UNIDADES_POR_GRADO as U, distancia } from '../../public/cup/games/where/engine.js';
import { CIUDADES } from '../../public/cup/games/where/ciudades.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SOURCE = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const OUT = `${ROOT}public/cup/games/where/mapa.js`;
/** Simplification tolerance and minimum island area, in tenths of a degree. */
const TOLERANCE = 0.6;
const MIN_AREA = 3;

async function download() {
  const r = await fetch(SOURCE);
  if (!r.ok) throw new Error(`Could not download ${SOURCE}: ${r.status}`);
  return r.json();
}

/** The TopoJSON's arcs, already in degrees: [[lon, lat], ...]. */
function arcs(topo) {
  const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
  return topo.arcs.map(arc => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
  });
}

/** Each country's rings: { id, name, polygons: [[ring, ...holes], ...] } with rings of arc indices. */
function countries(topo) {
  // Some countries come in several pieces with the same code (Australia and its islets): they are joined
  const byId = new Map();
  for (const g of topo.objects.countries.geometries) {
    const key = g.id ?? g.properties?.name;
    const p = byId.get(key) || { id: g.id, name: g.properties?.name, polygons: [] };
    p.polygons.push(...(g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : []));
    byId.set(key, p);
  }
  return [...byId.values()];
}

/**
 * Builds a ring from its arcs (a negative index is the arc reversed, `~i`). With `wrap` (the
 * world's width in those units), each arc is shifted a whole turn if needed to continue where the
 * previous one ended: Russia and Fiji cross the date line.
 */
function ring(indices, A, wrap = 0) {
  const out = [];
  for (const i of indices) {
    let a = i < 0 ? A[~i].slice().reverse() : A[i];
    if (wrap && out.length) {
      const k = Math.round((out[out.length - 1][0] - a[0][0]) / wrap);
      if (k) a = a.map(([x, y]) => [x + k * wrap, y]);
    }
    out.push(...(out.length ? a.slice(1) : a));
  }
  return out;
}

/** An arc without longitude jumps: going from 180 to −180 it continues at 181. */
function withoutJumps(arc) {
  const out = [arc[0]];
  for (let i = 1; i < arc.length; i++) {
    const prev = out[i - 1][0];
    let lon = arc[i][0];
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    out.push([lon, arc[i][1]]);
  }
  return out;
}

/** Douglas–Peucker. */
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    let max = -1, k = -1;
    for (let i = a + 1; i < b; i++) {
      // A closed arc (a whole island) starts and ends at the same point: there is no line to
      // measure against there, and measuring against a zero-length one erased the island (New Zealand, Japan)
      const d = L ? Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L : Math.hypot(pts[i][0] - ax, pts[i][1] - ay);
      if (d > max) { max = d; k = i; }
    }
    if (max > tol) { keep[k] = 1; stack.push([a, k], [k, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const area = pts => Math.abs(pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0)) / 2;

async function generate() {
  const topo = await download();
  // Each arc is simplified only once: that way a shared border stays the same for both countries.
  // Without jumps at the date line (Russia, Fiji): on the sphere 181° is −179°
  const A = arcs(topo).map(a => simplify(withoutJumps(a).map(([lon, lat]) => [lon * U, lat * U]), TOLERANCE));
  let d = '', points = 0, rings = 0;
  const withCity = r => {
    const xs = r.map(q => q[0]), ys = r.map(q => q[1]), m = 0.3 * U;
    return CIUDADES.some(c => c.lon * U > Math.min(...xs) - m && c.lon * U < Math.max(...xs) + m && c.lat * U > Math.min(...ys) - m && c.lat * U < Math.max(...ys) + m);
  };
  const diamond = (x, y) => { d += `M${x} ${y + 1}l1-1-1-1-1 1z`; rings++; points += 4; };
  for (const p of countries(topo)) {
    const all = p.polygons.flat().map(ix => ring(ix, A, 360 * U).map(([x, y]) => [Math.round(x), Math.round(y)]));
    const largest = Math.max(...all.map(area));
    for (const r of all) {
      // The tiniest islands go, unless they are the largest thing the country has (Nauru, Tuvalu)
      // or a game city is on them (Hanga Roa on Rapa Nui, Tarawa in Kiribati)
      if (area(r) < MIN_AREA && area(r) < largest && !withCity(r)) continue;
      const pts = r.filter((q, i) => i === 0 || q[0] !== r[i - 1][0] || q[1] !== r[i - 1][1]);
      // A country that fits in a tenth of a degree: a small diamond, so it shows something is there
      if (pts.length < 3) { diamond(...pts[0]); continue; }
      d += `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) d += `l${pts[i][0] - pts[i - 1][0]} ${pts[i][1] - pts[i - 1][1]}`.replace(/ -/g, '-');
      d += 'z';
      rings++; points += pts.length;
    }
  }
  // The countries Natural Earth 1:50m does not bring (Tuvalu): a small diamond at their capital
  const ids = new Set(countries(topo).map(p => p.id));
  for (const c of CIUDADES.filter(c => c.capital && !ids.has(c.iso))) diamond(Math.round(c.lon * U), Math.round(c.lat * U));
  const js = `/**
 * The map of Where is it?: the countries without names, in tenths of a degree (x = longitude, y = latitude).
 * Generated by \`node tools/generators/map.mjs generate\` from Natural Earth 1:50m (public domain). Not edited by hand.
 */
export const MAPA = { d: '${d}' };
`;
  writeFileSync(OUT, js);
  console.log(`public/cup/games/where/mapa.js: ${rings} rings, ${points} points, ${(js.length / 1024).toFixed(0)} KB`);
}

/** Is the point inside the ring? (ray casting, in degrees). */
function inside([lon, lat], r) {
  let yes = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) yes = !yes;
  }
  return yes;
}

async function check() {
  const topo = await download();
  const A = arcs(topo);
  const P = countries(topo);
  const byId = new Map(P.map(p => [p.id, p]));
  let bad = 0;
  // Each country on the list is on the map, and each city falls in its country or within 15 km of the coast
  for (const c of CIUDADES) {
    const p = byId.get(c.iso);
    // No borders on the map (Tuvalu): a diamond is drawn at its capital, which thus falls in place
    if (!p) { console.log(`· ${c.ciudad}: ${c.pais} (${c.iso}) has no borders; a diamond goes there${c.capital ? '' : ' ✗ and it is not a capital'}`); if (!c.capital) bad++; continue; }
    const polys = p.polygons.map(pol => pol.map(ix => ring(ix, A)));
    const within = polys.some(([ext, ...holes]) => inside([c.lon, c.lat], ext) && !holes.some(h => inside([c.lon, c.lat], h)));
    if (within) continue;
    const nearest = Math.min(...polys.flat().flat().map(([lon, lat]) => distancia([c.lat, c.lon], [lat, lon])));
    const other = P.find(q => q !== p && q.polygons.some(pol => inside([c.lon, c.lat], ring(pol[0], A))));
    // On the border itself (Nicosia, Jerusalem, the Vatican) the simplified border may leave it on the other side
    if (nearest > 15) { console.log(`✗ ${c.ciudad}, ${c.pais}: ${Math.round(nearest)} km from its country${other ? `, inside ${other.name}` : ''}`); bad++; }
  }
  const capitals = CIUDADES.filter(c => c.capital);
  console.log(`${CIUDADES.length} cities, ${capitals.length} capitals of ${new Set(capitals.map(c => c.pais)).size} countries.`);
  console.log(bad ? `${bad} to review.` : 'Every city falls in its country.');
  process.exitCode = bad ? 1 : 0;
}

/**
 * The globe's images (D-159): NASA's Blue Marble Next Generation (public domain), the one from
 * September 2004, with relief and sea floor: little snow in both hemispheres, so deserts, jungles
 * and ice look like themselves. A small one that arrives fast and a sharper one. The name carries
 * the image's month: if the image changes, the name changes and no phone keeps the old one cached
 * (set-version.py does not stamp images). In WebP (D-460): 60 % lighter than the JPEG they were,
 * and every browser with WebGL reads it.
 */
const SATELLITE = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73801/world.topo.bathy.200409.3x21600x10800.jpg';
export const IMAGES = { 2048: 'public/cup/games/where/earth-2004-09/2048.webp', 4096: 'public/cup/games/where/earth-2004-09/4096.webp' };
/**
 * And the whole image (21600 × 10800) in 1350 px tiles, 16 columns by 8 rows, 22.5° per side
 * (D-160): the globe downloads only the ones seen when zooming in. `row-column.webp`, from the top
 * left (90° N, 180° W).
 */
export const TILES = { dir: 'public/cup/games/where/earth-2004-09', columns: 16, rows: 8, size: 1350 };

/** `satellite [<nasa.jpg>]`: with the original already downloaded, it is not fetched again. */
async function satellite(source) {
  const tmp = source || `${tmpdir()}/earth-${process.pid}.jpg`;
  // 30 MB: NASA's server often cuts halfway, so curl resumes (-C -) until the whole file is here
  for (let i = 0; !source; i++) {
    try { execFileSync('curl', ['-sSfL', '-C', '-', '-o', tmp, SATELLITE], { stdio: 'inherit' }); break; } catch (e) { if (i >= 40) throw e; }
  }
  // All with PIL (tiles.py): sips cuts from the center when the cut starts at the corner (D-201),
  // and it does not write WebP
  const { dir, columns, rows, size } = TILES;
  rmSync(`${ROOT}${dir}`, { recursive: true, force: true });
  mkdirSync(`${ROOT}${dir}`, { recursive: true });
  const whole = Object.entries(IMAGES).map(([w, path]) => `${w}=${ROOT}${path}`);
  execFileSync('python3', [`${ROOT}tools/generators/tiles.py`, tmp, `${ROOT}${dir}`, String(columns), String(rows), String(size), ...whole], { stdio: 'inherit' });
  console.log(`${dir}/: ${columns * rows} tiles of ${size} px`);
  if (!source) rmSync(tmp);
}

const command = process.argv[2];
if (command === 'generate') await generate();
else if (command === 'check') await check();
else if (command === 'satellite') await satellite(process.argv[3]);
else { console.log('Usage: node tools/generators/map.mjs generate | check | satellite [<nasa.jpg>]'); process.exitCode = 2; }
