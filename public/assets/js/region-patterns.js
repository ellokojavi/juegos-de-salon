/**
 * A subtle texture per color region, for players who do not tell the colors apart well
 * (protanopia, deuteranopia: #896, D-481). Boards whose regions differ only by color (Queens) give
 * each region `--trama: <pattern(z)>` and paint it with `background: var(--trama), var(--zona)` (`--zona` its color) once the
 * board's container carries the `tramas` class. Always on (no option), but for now only with a lab
 * key (D-395): `withPatterns(node)` adds the class when labAccess() says yes.
 *
 * The patterns are thin dark lines and dots at low alpha, so a black crown and an ✕ still read on
 * top of them. Region 0 stays plain; the order is chosen so neighbouring indices look different.
 * Paint Mines already stripes its second color (#349) and Plots outlines each plot, so they need none.
 */
import { labAccess } from './lab-access.js';

const INK = 'rgba(26, 26, 26, 0.22)';
const DOT = 'rgba(26, 26, 26, 0.30)';

export const PATTERNS = [
  'none',
  `repeating-linear-gradient(45deg, ${INK} 0 1.5px, transparent 1.5px 7px)`,
  `radial-gradient(${DOT} 1.4px, transparent 1.8px) 0 0 / 7px 7px`,
  `repeating-linear-gradient(0deg, ${INK} 0 1.5px, transparent 1.5px 7px)`,
  `repeating-linear-gradient(45deg, ${INK} 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, ${INK} 0 1px, transparent 1px 5px)`,
  `linear-gradient(${INK} 1.5px, transparent 1.5px) 0 0 / 8px 8px, linear-gradient(90deg, ${INK} 1.5px, transparent 1.5px) 0 0 / 8px 8px`,
  `repeating-linear-gradient(90deg, ${INK} 0 1.5px, transparent 1.5px 7px)`,
  `radial-gradient(transparent 2px, ${INK} 2.5px, transparent 3.2px) 0 0 / 10px 10px`,
  `repeating-linear-gradient(-45deg, ${INK} 0 1.5px, transparent 1.5px 7px)`,
  `radial-gradient(${DOT} 2.4px, transparent 2.8px) 0 0 / 12px 12px`,
];

/** The CSS `background` layers for region `z` (it wraps around past the last one). */
export const pattern = z => PATTERNS[((z % PATTERNS.length) + PATTERNS.length) % PATTERNS.length];

/** Turns the patterns on in `node` for a lab key holder (lab: #seccion-tramas). Returns the node. */
export function withPatterns(node, access = labAccess) {
  Promise.resolve(access()).then(ok => { if (ok) node.classList.add('tramas'); }, () => {});
  return node;
}
