/**
 * Offensive names in the rankings (D-513): a short list checked when a player is created, behind
 * the flag `name-guard`. It stops the obvious (insults, slurs, sexual words in the four languages,
 * with accents, capitals, spaces and 0→o-style swaps undone); what slips past, the owner renames
 * with `tools/firebase/rename-player.mjs`. It is a courtesy, not a wall: the list ships to every
 * phone and the rules do not repeat it.
 */

/** Words offensive anywhere inside a word of the name (MrFuck, xXputitaXx). */
const DENTRO = [
  // Spanish, Chilean included
  'hijodeputa', 'hijueputa', 'conchetumadre', 'conchatumadre', 'conchetumare', 'conchesumadre', 'ctm',
  'maricon', 'culiao', 'culiado', 'pichula', 'chupalo', 'chupala', 'mierda', 'putita', 'putito', 'putamadre',
  'pendejo', 'cabron', 'gilipollas', 'malparido', 'coño', 'violador', 'pedofilo', 'hitler',
  // English
  'fuck', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'whore', 'slut', 'rapist', 'pussy', 'asshole',
  // Portuguese
  'caralho', 'buceta', 'viado', 'arrombado', 'filhodaputa', 'merda', 'cuzao',
  // German
  'fotze', 'hurensohn', 'wichser', 'schlampe', 'arschloch', 'schwuchtel',
];

/**
 * Words offensive only as a whole word: inside others they are innocent or a real name (culo in
 * película, puta in computadora, verga in Vergara, porra in Porras, nazi in Nazir, cock in Hancock, shit in Toshitaka).
 */
const SOLAS = ['culo', 'puta', 'verga', 'porra', 'nazi', 'dick', 'cock', 'pico', 'pene', 'tetas', 'sexo', 'sex', 'shit', 'porno', 'porn', 'ass', 'piroca', 'zorra',
  'putas', 'penes', 'culos', 'picos', 'vergas'];

/**
 * A whole word also counts glued to a prefix (Hiperpene, Elculo, Superpico) or with a diminutive
 * or augmentative ending (Penecito, Culito, Picote). Never a plain -s or -on: Porras and Picón are names.
 */
const PREFIJOS = ['hiper', 'super', 'mega', 'ultra', 'archi', 'requete', 'mini', 'maxi', 'big', 'mr', 'the', 'my', 'el', 'la', 'tu', 'mi', 'su', 'don'];
const SUFIJOS = ['cito', 'cita', 'sito', 'sita', 'ito', 'ita', 'itos', 'itas', 'ote', 'ota', 'azo', 'aza', 'ote'];

const CAMBIOS = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i', '€': 'e' };

/** Lowercase, without accents and with the 0→o swaps undone; ñ stays (coño is not cono). */
function plano(s) {
  // HiperPene → Hiper Pene: a capital inside a word starts another one
  return String(s || '').replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2').toLocaleLowerCase('es')
    .replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ')
    .replace(/[0134578@$!€]/g, c => CAMBIOS[c]);
}

/**
 * The words of a name, with runs of single letters joined ("p u t a" is one word), so a word is
 * never matched across two real ones ("Mer Dávila" is not merda).
 */
function palabras(s) {
  const out = [];
  for (const w of plano(s).split(/[^a-zñ]+/).filter(Boolean)) {
    if (w.length === 1 && out.length && out.suelta) out[out.length - 1] += w;
    else out.push(w);
    out.suelta = w.length === 1;
  }
  return out;
}

const sinRepetidas = w => w.replace(/(.)\1+/g, '$1');

/** The forms of a word to look up in SOLAS: itself, without one prefix, without one ending (root + o, a, e). */
function formas(w) {
  const out = new Set([w]);
  for (const p of PREFIJOS) if (w.startsWith(p) && w.length > p.length + 2) out.add(w.slice(p.length));
  for (const x of [...out]) for (const f of SUFIJOS) {
    if (x.endsWith(f) && x.length > f.length + 1) { const r = x.slice(0, -f.length); out.add(r); for (const v of 'oae') out.add(r + v); }
  }
  return out;
}

/** Whether a name has an offensive word. Pure, for node. */
export function nombreOfensivo(s) {
  return palabras(s).some(w => {
    const r = sinRepetidas(w);
    if (DENTRO.some(d => w.includes(d) || r.includes(sinRepetidas(d)))) return true;
    return [w, r].some(x => [...formas(x)].some(f => SOLAS.includes(f)));
  });
}
