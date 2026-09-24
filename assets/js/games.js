/**
 * Registro central de juegos.
 * Para agregar un juego nuevo: crear carpeta /<id>/ con su index.html
 * y agregar una entrada aquí. Los textos van por idioma ({ es, en, pt }).
 * El menú principal se genera desde esta lista.
 */
export const GAMES = [
  {
    id: 'copa',
    emoji: '🏆',
    name: { es: 'La Copa', en: 'The Cup', pt: 'A Copa' },
    tagline: { es: 'Un torneo de una semana entre amigos: un minijuego distinto cada día y una tabla. Quien acumula más puntos se lleva la gloria.', en: 'A week-long tournament among friends: a different minigame every day and a leaderboard. Whoever piles up the most points takes the glory. In Spanish for now.', pt: 'Um torneio de uma semana entre amigos: um minijogo diferente por dia e uma tabela. Quem somar mais pontos fica com a glória. Por enquanto só em espanhol.' },
    players: '2–10',
    duration: '7',
    // No dura minutos sino días, y por ahora solo existe en español (D-98): el contenido de los
    // minijuegos es chileno y no se traduce. Las pruebas de idiomas lo saben por `idiomas`.
    durationUnit: { es: 'días', en: 'days', pt: 'dias' },
    idiomas: ['es'],
    // Cómo se juega, para la tabla del README: una copa no tiene modos de un celular o de sala.
    formato: { es: 'Cada uno en su celular, un juego por día', en: 'Each on their own phone, one game a day', pt: 'Cada um no seu celular, um jogo por dia' },
    // Un torneo no es una partida: cada día manda su señal con `players: 1` y no pesa en MAX_PLAYERS.
    torneo: true,
    path: 'copa/',
    // En el laboratorio (D-101): la tarjeta se ve en el menú, apagada y con "Próximamente", y se
    // juega desde /labs/ y desde los links de cada copa, que siguen trayendo su tarjeta social.
    available: false,
    labs: true,
  },
  {
    id: 'linea-de-tiempo',
    emoji: '⏳',
    name: { es: 'Línea de Tiempo', en: 'Timeline', pt: 'Linha do Tempo' },
    tagline: { es: 'Ubica los hitos en el orden correcto. Seis temáticas, de la historia al fútbol.', en: 'Put the milestones in the right order. Six themes, from history to soccer.', pt: 'Coloque os marcos na ordem certa. Seis temas, da história ao futebol.' },
    players: '1–6',
    duration: '10–20',
    path: 'linea-de-tiempo/',
    available: true,
  },
  {
    id: 'toque-y-fama',
    emoji: '🔢',
    name: { es: 'Toque y Fama', en: 'Bulls and Cows', pt: 'Toque e Fama' },
    tagline: { es: 'Adivina el número secreto. En un celular, en dos o contra el celular.', en: 'Crack the secret number. One phone, two phones or versus the phone.', pt: 'Descubra o número secreto. Em um celular, em dois ou contra o celular.' },
    players: '1–2',
    duration: '5–12',
    path: 'toque-y-fama/',
    available: true,
  },
  {
    id: 'ahorcado',
    emoji: '🪢',
    name: { es: 'El Ahorcado', en: 'Hangman', pt: 'Forca' },
    tagline: { es: 'Adivina tu palabra antes de que se acaben los errores. Acá nadie se queda mirando.', en: 'Crack your word before the mistakes run out. Nobody sits this one out.', pt: 'Descubra sua palavra antes de gastar todos os erros. Aqui ninguém fica só olhando.' },
    players: '1–6',
    duration: '5–12',
    path: 'ahorcado/',
    available: true,
  },
  {
    id: 'dudo',
    emoji: '🎲',
    name: { es: 'Dudo', en: 'Liar\'s Dice', pt: 'Dado Mentiroso' },
    tagline: { es: 'Apuesta cuántos dados hay en la mesa y aguanta la cara. En un celular, en varios o contra el celular.', en: 'Bid how many dice are on the table and keep a straight face. One phone, several or versus the phone.', pt: 'Aposte quantos dados tem na mesa sem entregar o jogo. Em um celular, em vários ou contra o celular.' },
    players: '1–6',
    duration: '10–20',
    path: 'dudo/',
    available: true,
  },
  {
    id: 'batalla-naval',
    emoji: '⚓',
    name: { es: 'Batalla Naval', en: 'Battleship', pt: 'Batalha Naval' },
    tagline: { es: 'Hunde la flota del rival antes de que hunda la tuya. En un celular, en dos o contra el celular.', en: 'Sink your rival\'s fleet before they sink yours. One phone, two phones or versus the phone.', pt: 'Afunde a frota do rival antes que ele afunde a sua. Em um celular, em dois ou contra o celular.' },
    players: '1–2',
    duration: '10–20',
    path: 'batalla-naval/',
    available: true,
  },
  {
    id: 'julepe',
    emoji: '🍹',
    name: { es: 'Julepe', en: 'Julep', pt: 'Paga o Bolo' },
    tagline: { es: 'Dices si vas o te pasas. Si vas y no haces dos bazas, te tomas todo el plato. En un celular, en varios o contra el celular.', en: 'Say if you are in or out. Go in, miss two tricks, and you drink the whole pot. One phone, several, or versus the phone.', pt: 'Você diz se entra ou passa. Se entrar e não fizer duas vazas, bebe o bolo inteiro. Em um celular, em vários ou contra o celular.' },
    players: '1–6',
    duration: '15–30',
    path: 'julepe/',
    // Fuera del menú por ahora: las reglas no quedaron claras y se están reescribiendo (D-88).
    // El juego sigue entero en /julepe/, solo no se ofrece desde acá.
    available: false,
  },
  {
    id: 'cuarto-rey',
    emoji: '👑',
    name: { es: 'Cuarto Rey', en: 'Fourth King', pt: 'Quarto Rei' },
    tagline: { es: 'Naipes, sorbos y el temido cuarto rey.', en: 'Cards, sips and the dreaded fourth king.', pt: 'Cartas, goles e o temido quarto rei.' },
    players: '4–6',
    duration: '20–40',
    path: 'cuarto-rey/',
    available: true,
  },
];

/* ------------------------------------------------------------------ */
/* Lo derivado: de acá lo lee cualquiera que necesite hablar de juegos  */
/* o de modos sin copiarse la lista (canon C-16).                      */
/* ------------------------------------------------------------------ */

/** Los ids, en el orden del menú. */
export const GAME_IDS = GAMES.map(g => g.id);

const BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

/** El juego con ese id, o `null` si no está registrado. */
export const gameById = id => BY_ID[id] || null;

/**
 * Cómo se nombra un juego fuera del menú (el panel, por ejemplo).
 * Un id que no está en la lista se devuelve tal cual: puede ser un juego recién publicado,
 * uno que se fue, o una versión vieja de la app que todavía manda señales. En los tres casos
 * hay que poder verlo, no perderlo en silencio (C-16).
 */
export function gameLabel(id, lang = 'es') {
  const g = BY_ID[id];
  return g ? `${g.emoji} ${g.name[lang] || g.name.es}` : String(id || '?');
}

/**
 * Los modos que existen, en el orden en que se ofrecen (C-5). `online` es el de la sala y
 * se cuenta por sala; los demás son sin red y suben un contador (`local/<juego>/<modo>/<n>`).
 *
 * Agregar un modo es agregar una línea acá: el registro de señales lo manda, las reglas de
 * la base lo aceptan por forma y el panel lo dibuja con su ícono y su color, sin tocar nada
 * más. El nombre va en español porque solo lo lee el dueño en el panel; lo que ve el jugador
 * sale de `LOCALES` de cada juego (C-3).
 */
export const MODES = {
  online: { icon: '📡', label: 'dos celulares', room: true },
  local: { icon: '📱', label: 'un celular' },
  cpu: { icon: '🤖', label: 'contra el celular' },
  solo: { icon: '🧍', label: 'solo' },
  copa: { icon: '🏆', label: 'día de La Copa' },
};

/** Todos los modos conocidos, en orden. */
export const MODE_IDS = Object.keys(MODES);

/** El modo de la sala: el que se cuenta por sala y no por contador. */
export const ROOM_MODE = MODE_IDS.find(m => MODES[m].room);

/** Los que suben un contador de partida sin red: todos menos el de la sala. */
export const LOCAL_MODES = MODE_IDS.filter(m => !MODES[m].room);

/**
 * Forma de una clave de modo. Se valida la forma y no la lista: un modo que el código empezó
 * a mandar antes de que el panel supiera de él tiene que llegar igual (C-16).
 */
export const MODE_KEY = /^[a-z][a-z-]{0,15}$/;

/** ¿Esta clave es un modo sin red, que sube contador? Vale para uno que todavía no existe. */
export const isLocalMode = mode => MODE_KEY.test(String(mode || '')) && !MODES[mode]?.room;

/** El ícono del modo; uno desconocido se muestra con su clave, que es mejor que nada. */
export const modeIcon = mode => MODES[mode]?.icon || '·';

/**
 * Cuántas personas caben en el juego más numeroso ("1–6" → 6). De acá sale el tope con que
 * se guardan y se agrupan los jugadores por partida: si algún día entra un juego de ocho,
 * el tope sube solo. Ojo: los roles de sala (`A`–`F`) y las reglas de la base también tienen
 * que crecer para que un juego así funcione en dos celulares.
 */
export const MAX_PLAYERS = Math.max(...GAMES.filter(g => !g.torneo).map(g => Number(String(g.players).split(/[^\d]+/).filter(Boolean).pop()) || 1));
