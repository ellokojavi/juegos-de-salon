// The home page search's order (D-397): the game's name first, then its keywords, its type, its tagline.
import assert from 'node:assert/strict';
import { ranked, relevance } from './search.js';
import { PORTADA } from '../../assets/js/games.js';

const first = (q, lang = 'es') => ranked(q, PORTADA, lang).map(g => g.id);
assert.equal(first('toque')[0], 'toque-y-fama', 'the name wins over a tagline that says «toquen», and the shorter name over the longer');
assert.ok(first('toque').indexOf('reinas') > first('toque').indexOf('letras'), 'a tagline match goes last');
assert.equal(first('fama')[0], 'toque-y-fama');
assert.deepEqual(first('cartas').slice(0, 2).sort(), ['cuarto-rey', 'julepe'], 'a keyword beats the coarse type Cartas/Dados');
assert.equal(first('dados')[0], 'dudo');
assert.equal(first('queens', 'en')[0], 'reinas', 'the name in the player\'s language');
const g = PORTADA.find(x => x.id === 'reinas');
assert.ok(relevance('reinas', g) > relevance('colores', g), 'its name scores above its keywords');
assert.equal(relevance('xyz', g), 0);
assert.deepEqual(ranked('', PORTADA), []);
console.log('search: the name first, green');
