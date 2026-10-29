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
const SOLAS = ['culo', 'puta', 'verga', 'porra', 'nazi', 'dick', 'cock', 'pico', 'pene', 'tetas', 'sexo', 'sex', 'shit', 'porno', 'porn', 'ass', 'piroca', 'zorra'];

const CAMBIOS = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i', '€': 'e' };

/** Lowercase, without accents and with the 0→o swaps undone; ñ stays (coño is not cono). */
function plano(s) {
  return String(s || '').toLocaleLowerCase('es')
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

/** Whether a name has an offensive word. Pure, for node. */
export function nombreOfensivo(s) {
  return palabras(s).some(w => {
    const r = sinRepetidas(w);
    return SOLAS.includes(w) || SOLAS.includes(r) || DENTRO.some(d => w.includes(d) || r.includes(sinRepetidas(d)));
  });
}
