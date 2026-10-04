/**
 * Idioma compartido por toda la app.
 * El idioma se elige con un toggle en el menú (y en la intro de cada juego)
 * y se guarda en localStorage. Por defecto: español. Idiomas: es, en, pt (D-47) y de (D-197).
 */
import { el } from './ui.js';

const KEY = 'juegos-de-salon:lang';

/** Todos los idiomas que tienen diccionario. Las pruebas de paridad los recorren todos (C-3). */
export const IDIOMAS = ['es', 'en', 'pt', 'de'];

/**
 * Los idiomas que están en el laboratorio (D-191): tienen sus textos, pero solo se ofrecen en el
 * dispositivo que entró por `/labs/<idioma>/` o por un link con `?lang=<idioma>`. Ahí quedan
 * marcados en `LABS_KEY`; en todos los demás la app sigue con los idiomas publicados.
 *
 * Hoy no hay ninguno: el alemán salió del laboratorio (D-197). El mecanismo queda para el
 * próximo idioma, que entra por aquí igual que entró el alemán.
 */
export const EN_LABS = [];
export const LABS_KEY = 'juegos-de-salon:labs-idioma';

function idiomaDeLabs() {
  try {
    const pedido = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
    if (EN_LABS.includes(pedido)) localStorage.setItem(LABS_KEY, pedido);
    const v = localStorage.getItem(LABS_KEY);
    return EN_LABS.includes(v) ? v : '';
  } catch (_) { return ''; }
}
/** El idioma del laboratorio activo en este dispositivo, o '' si no hay. */
export const LABS_IDIOMA = idiomaDeLabs();

/** Los idiomas que se ofrecen aquí: los de siempre y, en el laboratorio, el suyo. */
export const LANGS = IDIOMAS.filter(l => !EN_LABS.includes(l) || l === LABS_IDIOMA);

export function getLang() {
  try { const v = localStorage.getItem(KEY); if (LANGS.includes(v)) return v; } catch (_) { /* nada */ }
  return 'es';
}

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  try { localStorage.setItem(KEY, lang); } catch (_) { /* nada */ }
  document.documentElement.lang = lang;
}

/**
 * El idioma también puede venir en el link: `juegosdesalon.cl/?lang=pt`, o pegado a la
 * invitación de una sala, `/liars-dice/?sala=WFBN&lang=pt`. Quien comparte elige el idioma con el que
 * va a llegar el que recibe, que es lo mismo que hace el toggle pero para otra persona: sigue
 * sin detectarse nada del navegador (D-47, D-74).
 *
 * Se aplica al cargar cualquier página, se guarda como cualquier elección, y el parámetro se
 * saca de la barra de direcciones: lo que circula es la URL de siempre y el `?sala=` queda
 * intacto.
 */
/**
 * La búsqueda sin el `lang=`, tal como venía. No se rearma con URLSearchParams: eso le pega un
 * "=" a cada parámetro suelto y `/cup/?pirata&lang=pt` quedaba en `?pirata=`, que La Copa ya no
 * reconoce como el link de la copa (D-170).
 */
export const sinLang = search => {
  const resto = String(search || '').replace(/^\?/, '').split('&').filter(p => p && !/^lang=/i.test(p));
  return resto.length ? `?${resto.join('&')}` : '';
};

function idiomaDeLaUrl() {
  try {
    const pedido = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
    if (!LANGS.includes(pedido)) return;
    setLang(pedido);
    history.replaceState(null, '', location.pathname + sinLang(location.search) + location.hash);
  } catch (_) { /* una URL rara no puede dejar la app sin idioma */ }
}
idiomaDeLaUrl();

// En el laboratorio, cada página suma sus pestañas 🧪 y 🐞 y no deja que la navegación se salga
if (LABS_IDIOMA && typeof document !== 'undefined') {
  import('./labs-idioma.js').then(m => m.iniciarLabs(LABS_IDIOMA)).catch(() => {});
}

/** La app en la web. Las puertas por idioma son /pt/, /en/ y /de/ (D-74, D-197). */
export const SITIO = 'https://juegosdesalon.cl/';

/**
 * La portada para compartir, en el idioma de quien comparte: la de siempre, `/pt/`, `/en/` o `/de/`.
 * Es la misma idea que `withLang` —quien manda el link elige con qué idioma llega— pero con
 * las puertas, que son las que traen su propia tarjeta social en ese idioma (D-74).
 */
export const homeUrl = (lang = getLang()) => SITIO + (lang === 'es' ? '' : EN_LABS.includes(lang) ? `labs/${lang}/` : `${lang}/`);

/**
 * Un link para compartir, con el idioma pegado si no es el de siempre. Así el que recibe la
 * invitación abre la app en el mismo idioma en que se la mandaron, sin tocar el toggle.
 */
export function withLang(url, lang = getLang()) {
  if (lang === 'es' || !LANGS.includes(lang)) return url;
  return url + (url.includes('?') ? '&' : '?') + `lang=${lang}`;
}

/** Textos comunes (menú y elementos compartidos). */
export const COMMON = {
  es: {
    appTitle: 'Juegos de Salón',
    appSub: 'Juegos tradicionales llevados a tu celular para pasar el tiempo solo o con amigos.',
    players: 'jugadores', minutes: 'min',
    footer: 'Toma con responsabilidad y con agua a mano. Si manejas, no tomas. 🚕',
    player: 'jugador',
    // Los filtros de la portada (D-142)
    filters: 'Filtrar juegos',
    shown: 'Se ven {n} de {total} juegos.', clearFilters: 'Ver todos',
    onlySpanish: 'En español',
    code: 'código en GitHub', menu: 'Menú', soon: 'Próximamente', or: 'o',
    share: 'Compartir Juegos de Salón',
    shareText: 'Juegos tradicionales para jugar con amigos desde el celular. Gratis, sin instalar y sin cuenta.',
    // La invitación a una sala: quién invita, a qué y adónde. Es el texto que más se lee de
    // toda la app, porque llega por WhatsApp a gente que todavía no la conoce.
    // Con la cabecera de todo lo que se comparte (D-165): "🃏 *Julepe* · Sala WFBN"
    invite: '{emoji} *{game}* · Sala {code}\n\n👋 {name} te invita a jugar en juegosdesalon.cl.',
    // El resultado de jugar solo un juego (D-165): el texto y la imagen dicen lo mismo
    shareResult: '📤 Compartir mi resultado',
    shareSoloContext: 'Jugando solo',
    shareSoloCta: '🤔 ¿Me ganas? Se juega gratis desde el celular:',
    shareSoloImage: '🤔 ¿Me ganas?',
    shareCopied: '¡Copiado! Pégalo en el chat.',
    shareDownloaded: 'La imagen se descargó y el texto quedó copiado.',
    // Los rankings y el jugador (D-211): nombre y PIN, como en La Copa, pero para todos los juegos
    rk: {
      title: 'Ranking', titleOf: 'Ranking de {game}',
      week: 'Semana', always: 'Siempre', friends: 'Amigos', cup: 'En copa',
      loading: 'Cargando el ranking…',
      error: 'No se pudo cargar el ranking. Revisa tu conexión.',
      empty: 'Todavía nadie. ¡Sé el primero!',
      emptyFriends: 'Aquí salen tus amigos de La Copa que entraron con su nombre y PIN.',
      you: 'tú',
      joinTitle: '🏅 Entra para aparecer en el ranking',
      joinHint: 'Tu nombre y un PIN de 4 números guardan tus récords. Sirven en cualquier celular y no hace falta cuenta.',
      join: 'Entrar', joining: 'Entrando…',
      nameLabel: 'Tu nombre', namePh: 'Como te conocen tus amigos', pinLabel: 'Tu PIN de 4 números',
      pinWarn: 'No uses el PIN de tu banco.',
      playingAs: 'Juegas como {name}', logout: 'Salir',
      sameName: 'Ya hay {n} con ese nombre y otro PIN. Si eres tú, revisa el PIN. Si no, crea tu jugador.',
      create: 'Crear mi jugador', retry: 'Probar otro PIN',
      created: '¡Listo, {name}! Desde ahora tus puntajes cuentan.',
      welcome: '¡Hola de nuevo, {name}!',
      errName: 'Escribe tu nombre.', errPin: 'El PIN son 4 números.',
      errNet: 'No se pudo conectar. Revisa tu señal e inténtalo de nuevo.',
      loggedOut: 'Tu PIN cambió en otro celular. Vuelve a entrar para seguir sumando.',
      newRecord: '🏆 ¡Récord nuevo!', newWeek: '🏆 ¡Tu mejor puntaje de la semana!',
      best: 'Tu mejor puntaje: {s} en {t}.',
      notSaved: 'Esta vez no se pudo guardar en el ranking.',
      joinAfter: 'Entra con tu nombre y PIN para que tus puntajes cuenten en el ranking.',
      allRounder: 'Todoterreno', allRounderHint: 'Suma tu mejor puntaje en cada juego: gana quien juega bien a todo.',
      champions: 'Campeones de La Copa', championsHint: 'Medallas de las copas terminadas: oro, plata y bronce.',
      noChampions: 'Todavía no termina ninguna copa.',
      lastCups: 'Últimas copas', cupChampion: '{copa}: ganó {names}',
      seeAll: '🏆 Ver todos los rankings',
      pageTitle: 'Rankings', pageSub: 'Los mejores puntajes de cada juego, de la semana y de siempre.',
      gamePick: 'Elige un juego',
      myPlayer: 'Tu jugador', plays: '{n} partidas', playsOne: '1 partida',
      changePin: 'Cambiar el PIN', newPin: 'PIN nuevo', savePin: 'Guardar el PIN',
      pinChanged: 'Listo: el PIN nuevo vale desde ahora y los otros celulares tienen que volver a entrar.',
      rankings: 'Rankings',
    },
  },
  en: {
    appTitle: 'Party Games',
    appSub: 'Traditional games brought to your phone, to pass the time alone or with friends.',
    players: 'players', minutes: 'min',
    footer: 'Drink responsibly and keep water nearby. If you drive, you don\'t drink. 🚕',
    player: 'player',
    filters: 'Filter games',
    shown: 'Showing {n} of {total} games.', clearFilters: 'Show all',
    onlySpanish: 'In Spanish',
    code: 'code on GitHub', menu: 'Menu', soon: 'Coming soon', or: 'or',
    share: 'Share Party Games',
    shareText: 'Traditional games to play with friends from your phone. Free, no install, no account.',
    invite: '{emoji} *{game}* · Room {code}\n\n👋 {name} invites you to play at juegosdesalon.cl.',
    shareResult: '📤 Share my result',
    shareSoloContext: 'Playing solo',
    shareSoloCta: '🤔 Can you beat me? It\'s free to play on your phone:',
    shareSoloImage: '🤔 Can you beat me?',
    shareCopied: 'Copied! Paste it in the chat.',
    shareDownloaded: 'The image was downloaded and the text was copied.',
    rk: {
      title: 'Leaderboard', titleOf: '{game} leaderboard',
      week: 'Week', always: 'All time', friends: 'Friends', cup: 'In a Cup',
      loading: 'Loading the leaderboard…',
      error: 'Couldn\'t load the leaderboard. Check your connection.',
      empty: 'Nobody yet. Be the first!',
      emptyFriends: 'Your friends from The Cup show up here once they sign in with their name and PIN.',
      you: 'you',
      joinTitle: '🏅 Sign in to get on the leaderboard',
      joinHint: 'Your name and a 4-digit PIN keep your records. They work on any phone, no account needed.',
      join: 'Sign in', joining: 'Signing in…',
      nameLabel: 'Your name', namePh: 'What your friends call you', pinLabel: 'Your 4-digit PIN',
      pinWarn: 'Don\'t use your bank PIN.',
      playingAs: 'Playing as {name}', logout: 'Sign out',
      sameName: 'There are already {n} with that name and another PIN. If it\'s you, check your PIN. If not, create your player.',
      create: 'Create my player', retry: 'Try another PIN',
      created: 'All set, {name}! Your scores count from now on.',
      welcome: 'Welcome back, {name}!',
      errName: 'Type your name.', errPin: 'The PIN is 4 digits.',
      errNet: 'Couldn\'t connect. Check your signal and try again.',
      loggedOut: 'Your PIN changed on another phone. Sign in again to keep scoring.',
      newRecord: '🏆 New record!', newWeek: '🏆 Your best score this week!',
      best: 'Your best score: {s} in {t}.',
      notSaved: 'This time it couldn\'t be saved to the leaderboard.',
      joinAfter: 'Sign in with your name and PIN so your scores count on the leaderboard.',
      allRounder: 'All-Rounder', allRounderHint: 'Adds up your best score in each game: whoever is good at everything wins.',
      champions: 'Cup Champions', championsHint: 'Medals from finished cups: gold, silver and bronze.',
      noChampions: 'No cup has finished yet.',
      lastCups: 'Latest cups', cupChampion: '{copa}: won by {names}',
      seeAll: '🏆 See all leaderboards',
      pageTitle: 'Leaderboards', pageSub: 'The best scores in every game, this week and of all time.',
      gamePick: 'Pick a game',
      myPlayer: 'Your player', plays: '{n} games played', playsOne: '1 game played',
      changePin: 'Change PIN', newPin: 'New PIN', savePin: 'Save PIN',
      pinChanged: 'Done: the new PIN works from now on, and other phones have to sign in again.',
      rankings: 'Leaderboards',
    },
  },
  pt: {
    appTitle: 'Jogos de Salão',
    appSub: 'Jogos tradicionais trazidos pro seu celular, pra passar o tempo sozinho ou com amigos.',
    players: 'jogadores', minutes: 'min',
    footer: 'Beba com responsabilidade e com água por perto. Se for dirigir, não beba. 🚕',
    player: 'jogador',
    filters: 'Filtrar jogos',
    shown: 'Mostrando {n} de {total} jogos.', clearFilters: 'Ver todos',
    onlySpanish: 'Em espanhol',
    code: 'código no GitHub', menu: 'Menu', soon: 'Em breve', or: 'ou',
    share: 'Compartilhar Jogos de Salão',
    shareText: 'Jogos tradicionais para jogar com amigos pelo celular. De graça, sem instalar e sem conta.',
    invite: '{emoji} *{game}* · Sala {code}\n\n👋 {name} te convida pra jogar em juegosdesalon.cl.',
    shareResult: '📤 Compartilhar resultado',
    shareSoloContext: 'Jogando sozinho',
    shareSoloCta: '🤔 Consegue me vencer? É grátis e se joga pelo celular:',
    shareSoloImage: '🤔 Consegue me vencer?',
    shareCopied: 'Copiado! Cole no chat.',
    shareDownloaded: 'A imagem foi baixada e o texto foi copiado.',
    rk: {
      title: 'Ranking', titleOf: 'Ranking de {game}',
      week: 'Semana', always: 'Sempre', friends: 'Amigos', cup: 'Na Copa',
      loading: 'Carregando o ranking…',
      error: 'Não deu para carregar o ranking. Confira sua conexão.',
      empty: 'Ninguém ainda. Seja o primeiro!',
      emptyFriends: 'Aqui aparecem seus amigos da Copa que entraram com nome e PIN.',
      you: 'você',
      joinTitle: '🏅 Entre para aparecer no ranking',
      joinHint: 'Seu nome e um PIN de 4 números guardam seus recordes. Valem em qualquer celular e não precisa de conta.',
      join: 'Entrar', joining: 'Entrando…',
      nameLabel: 'Seu nome', namePh: 'Como seus amigos te chamam', pinLabel: 'Seu PIN de 4 números',
      pinWarn: 'Não use a senha do seu banco.',
      playingAs: 'Jogando como {name}', logout: 'Sair',
      sameName: 'Já tem {n} com esse nome e outro PIN. Se for você, confira o PIN. Se não, crie seu jogador.',
      create: 'Criar meu jogador', retry: 'Tentar outro PIN',
      created: 'Pronto, {name}! A partir de agora seus pontos contam.',
      welcome: 'Que bom te ver de novo, {name}!',
      errName: 'Escreva seu nome.', errPin: 'O PIN tem 4 números.',
      errNet: 'Não deu para conectar. Confira o sinal e tente de novo.',
      loggedOut: 'Seu PIN mudou em outro celular. Entre de novo para continuar somando.',
      newRecord: '🏆 Novo recorde!', newWeek: '🏆 Sua melhor pontuação da semana!',
      best: 'Sua melhor pontuação: {s} em {t}.',
      notSaved: 'Desta vez não deu para salvar no ranking.',
      joinAfter: 'Entre com seu nome e PIN para seus pontos contarem no ranking.',
      allRounder: 'Faz-Tudo', allRounderHint: 'Soma sua melhor pontuação em cada jogo: ganha quem joga bem tudo.',
      champions: 'Campeões da Copa', championsHint: 'Medalhas das copas terminadas: ouro, prata e bronze.',
      noChampions: 'Nenhuma copa terminou ainda.',
      lastCups: 'Últimas copas', cupChampion: '{copa}: ganhou {names}',
      seeAll: '🏆 Ver todos os rankings',
      pageTitle: 'Rankings', pageSub: 'As melhores pontuações de cada jogo, da semana e de sempre.',
      gamePick: 'Escolha um jogo',
      myPlayer: 'Seu jogador', plays: '{n} partidas', playsOne: '1 partida',
      changePin: 'Trocar o PIN', newPin: 'PIN novo', savePin: 'Salvar o PIN',
      pinChanged: 'Pronto: o PIN novo vale a partir de agora e os outros celulares precisam entrar de novo.',
      rankings: 'Rankings',
    },
  },
  de: {
    appTitle: 'Salonspiele',
    appSub: 'Klassische Spiele auf deinem Handy, für allein oder mit Freunden.',
    players: 'Spieler', minutes: 'Min.',
    footer: 'Trink verantwortungsvoll und hab Wasser dabei. Wer fährt, trinkt nicht. 🚕',
    player: 'Spieler',
    filters: 'Spiele filtern',
    shown: 'Du siehst {n} von {total} Spielen.', clearFilters: 'Alle zeigen',
    onlySpanish: 'Auf Spanisch',
    code: 'Code auf GitHub', menu: 'Menü', soon: 'Demnächst', or: 'oder',
    share: 'Salonspiele teilen',
    shareText: 'Klassische Spiele mit Freunden, direkt auf dem Handy. Gratis, ohne Installation und ohne Konto.',
    invite: '{emoji} *{game}* · Raum {code}\n\n👋 {name} lädt dich zum Spielen auf juegosdesalon.cl ein.',
    shareResult: '📤 Ergebnis teilen',
    shareSoloContext: 'Allein gespielt',
    shareSoloCta: '🤔 Schlägst du mich? Gratis auf dem Handy spielen:',
    shareSoloImage: '🤔 Schlägst du mich?',
    shareCopied: 'Kopiert! Füg es im Chat ein.',
    shareDownloaded: 'Das Bild wurde gespeichert und der Text kopiert.',
    rk: {
      title: 'Rangliste', titleOf: 'Rangliste: {game}',
      week: 'Woche', always: 'Allzeit', friends: 'Freunde', cup: 'Im Pokal',
      loading: 'Rangliste wird geladen…',
      error: 'Die Rangliste konnte nicht geladen werden. Prüf deine Verbindung.',
      empty: 'Noch niemand. Sei der Erste!',
      emptyFriends: 'Hier erscheinen deine Freunde aus dem Pokal, sobald sie sich mit Name und PIN anmelden.',
      you: 'du',
      joinTitle: '🏅 Melde dich an, um in die Rangliste zu kommen',
      joinHint: 'Dein Name und eine 4-stellige PIN speichern deine Rekorde. Sie funktionieren auf jedem Handy, ganz ohne Konto.',
      join: 'Anmelden', joining: 'Anmelden…',
      nameLabel: 'Dein Name', namePh: 'Wie deine Freunde dich nennen', pinLabel: 'Deine 4-stellige PIN',
      pinWarn: 'Nimm nicht die PIN deiner Bank.',
      playingAs: 'Du spielst als {name}', logout: 'Abmelden',
      sameName: 'Es gibt schon {n} mit diesem Namen und einer anderen PIN. Wenn du das bist, prüf die PIN. Wenn nicht, leg deinen Spieler an.',
      create: 'Meinen Spieler anlegen', retry: 'Andere PIN probieren',
      created: 'Fertig, {name}! Ab jetzt zählen deine Punkte.',
      welcome: 'Schön, dich wiederzusehen, {name}!',
      errName: 'Schreib deinen Namen.', errPin: 'Die PIN hat 4 Ziffern.',
      errNet: 'Keine Verbindung. Prüf dein Netz und versuch es nochmal.',
      loggedOut: 'Deine PIN wurde auf einem anderen Handy geändert. Melde dich neu an, um weiter Punkte zu sammeln.',
      newRecord: '🏆 Neuer Rekord!', newWeek: '🏆 Deine beste Punktzahl der Woche!',
      best: 'Deine beste Punktzahl: {s} in {t}.',
      notSaved: 'Diesmal konnte es nicht in der Rangliste gespeichert werden.',
      joinAfter: 'Melde dich mit Name und PIN an, damit deine Punkte in der Rangliste zählen.',
      allRounder: 'Allrounder', allRounderHint: 'Zählt deine beste Punktzahl in jedem Spiel zusammen: Es gewinnt, wer alles gut kann.',
      champions: 'Pokalsieger', championsHint: 'Medaillen aus beendeten Pokalen: Gold, Silber und Bronze.',
      noChampions: 'Noch kein Pokal ist zu Ende.',
      lastCups: 'Letzte Pokale', cupChampion: '{copa}: gewonnen von {names}',
      seeAll: '🏆 Alle Ranglisten ansehen',
      pageTitle: 'Ranglisten', pageSub: 'Die besten Punktzahlen in jedem Spiel, der Woche und aller Zeiten.',
      gamePick: 'Wähl ein Spiel',
      myPlayer: 'Dein Spieler', plays: '{n} Spiele', playsOne: '1 Spiel',
      changePin: 'PIN ändern', newPin: 'Neue PIN', savePin: 'PIN speichern',
      pinChanged: 'Fertig: Die neue PIN gilt ab jetzt, und andere Handys müssen sich neu anmelden.',
      rankings: 'Ranglisten',
    },
  },
};

/** Devuelve `obj[lang]` si es un objeto por idioma; si no, el valor tal cual. */
export function pickLang(obj, lang = getLang()) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj) && (lang in obj)) return obj[lang];
  return obj;
}

/**
 * Toggle ES / EN / PT. `onChange(lang)` se llama tras guardar el idioma nuevo.
 * Por defecto recarga la página para que todo se re-renderice con el idioma elegido.
 */
export function langToggle(onChange = () => location.reload()) {
  const current = getLang();
  const wrap = el('div', { class: 'lang-toggle', role: 'group', 'aria-label': 'Idioma / Language / Idioma / Sprache' });
  // La bandera va aparte: con cuatro idiomas en un celular angosto se esconde (base.css)
  const flags = { es: '🇨🇱', en: '🇬🇧', pt: '🇧🇷', de: '🇩🇪' };
  for (const lang of LANGS) {
    wrap.append(el('button', {
      type: 'button', class: lang === current ? 'on' : '', 'aria-pressed': lang === current ? 'true' : 'false',
      onClick: () => { if (lang === getLang()) return; setLang(lang); onChange(lang); },
    }, el('span', { class: 'flag' }, flags[lang] + ' '), lang.toUpperCase()));
  }
  return wrap;
}

/** Aplica traducciones a elementos con data-i18n (texto) o data-i18n-html (HTML). */
export function applyStatic(dict) {
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const v = dict[node.dataset.i18n]; if (v !== undefined) node.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(node => {
    const v = dict[node.dataset.i18nHtml]; if (v !== undefined) node.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
    const v = dict[node.dataset.i18nPlaceholder]; if (v !== undefined) node.placeholder = v;
  });
}
