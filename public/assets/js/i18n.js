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
    // Compartir la app (D-226): va con la tarjeta de la portada, que ya dice el nombre, la bajada,
    // "gratis, sin instalar" y el link. El texto cuenta lo demás, una idea por línea (U-30)
    shareApp: {
      context: '{n} juegos para el celular',
      lines: [
        '🏆 La Copa: un torneo de una semana entre amigos, con un juego distinto cada día.',
        '👥 Para jugar en grupo: en un celular o cada uno en el suyo.',
        '🧩 Para jugar solo: minijuegos de palabras, lógica y cultura.',
        '🔓 Sin cuenta: tocas el link y juegas.',
      ],
    },
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
    // Los rankings y el jugador (D-212): nombre y PIN, como en La Copa, pero para todos los juegos
    // El globo de la portada para agregar la app a inicio (D-232)
    ins: {
      title: "Juegos de Salón como app",
      sub: "Agrégala a tu pantalla de inicio y ábrela en un toque.",
      add: "Agregar",
      dismiss: "No mostrar más",
      sheetTitle: "Agrega la app a tu inicio",
      iosShare: "Toca **Compartir** en la barra de Safari.",
      iosShareNote: "En iOS 26 está dentro del botón ⋯ de la barra.",
      chromeIosShare: "Toca **Compartir** en la barra de direcciones, arriba a la derecha.",
      iosAdd: "Elige **Agregar a inicio**. Si no lo ves, baja en la lista.",
      iosConfirm: "Toca **Agregar**, arriba a la derecha.",
      androidMenu: "Toca el menú **⋮**, arriba a la derecha.",
      androidAdd: "Elige **Agregar a la pantalla principal** o **Instalar app**.",
      androidConfirm: "Confirma con **Instalar**.",
      samsungMenu: "Toca el menú **☰**, abajo a la derecha.",
      samsungAdd: "Elige **Agregar página a** y después **Pantalla de inicio**.",
      samsungConfirm: "Confirma con **Agregar**.",
      done: "Ya la agregué",
      doneNext: "Listo. Desde ahora ábrela con el ícono de tu pantalla de inicio.",
      close: "Cerrar",
      otherTitleIos: "Abre el link en Safari",
      otherTitleAndroid: "Abre el link en Chrome",
      otherLeadIos: "Estás dentro de otra app, y ahí no se puede agregar Juegos de Salón a la pantalla de inicio. Copia el link, ábrelo en **Safari** y toca **Agregar** otra vez.",
      otherLeadAndroid: "Estás dentro de otra app, y ahí no se puede agregar Juegos de Salón a la pantalla de inicio. Copia el link, ábrelo en **Chrome** y toca **Agregar** otra vez.",
      copy: "Copiar link",
      copied: "Link copiado.",
    },
    rk: {
      title: 'Ranking', titleOf: 'Ranking de {game}',
      week: 'Semana', always: 'Siempre', friends: 'Amigos', cup: 'Copa',
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
      pageTitle: 'Rankings', pageSub: 'Los mejores puntajes y las victorias de cada juego, de la semana y de siempre.',
      gamePick: 'Elige un juego',
      myPlayer: 'Tu jugador', plays: '{n} partidas', playsOne: '1 partida',
      changePin: 'Cambiar el PIN', newPin: 'PIN nuevo', savePin: 'Guardar el PIN',
      pinChanged: 'Listo: el PIN nuevo vale desde ahora y los otros celulares tienen que volver a entrar.',
      legacyFound: 'Hay puntajes de La Copa a nombre de {name}, de antes de los rankings. Si son tuyos, quédatelos con este PIN.',
      legacyMine: 'Son míos', legacyNotMe: 'No soy yo',
      legacyClaimed: '¡Listo, {name}! Tus puntajes de La Copa ya son tuyos.',
      winsOf: 'Más victorias en {game}', wins: 'Victorias', soloRecords: 'Jugar solo',
      winsHint: 'Cada partida que ganas con tu nombre y PIN suma una. En un solo celular, juega con ese nombre para que cuente.',
      general: 'Ranking general', playsTitle: 'Más partidas jugadas',
      playsHint: 'Cuenta cada partida que terminas con tu nombre y PIN, en cualquier juego.',
      tabGames: '🎮 Juegos', tabCups: '🏆 Copas', groupOne: 'De a uno', groupMany: 'En grupo',
      cupBestDay: 'Mejor día de copa', cupBestDayHint: 'El mejor puntaje de cada uno en un día de copa, juego por juego.',
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
    shareApp: {
      context: '{n} games for your phone',
      lines: [
        '🏆 The Cup: a week-long tournament among friends, with a different game every day.',
        '👥 To play in a group: on one phone or each on their own phone.',
        '🧩 To play solo: word, logic and trivia minigames.',
        '🔓 No account: tap the link and play.',
      ],
    },
    invite: '{emoji} *{game}* · Room {code}\n\n👋 {name} invites you to play at juegosdesalon.cl.',
    shareResult: '📤 Share my result',
    shareSoloContext: 'Playing solo',
    shareSoloCta: '🤔 Can you beat me? It\'s free to play on your phone:',
    shareSoloImage: '🤔 Can you beat me?',
    shareCopied: 'Copied! Paste it in the chat.',
    shareDownloaded: 'The image was downloaded and the text was copied.',
    // El globo de la portada para agregar la app a inicio (D-232)
    ins: {
      title: "Party Games as an app",
      sub: "Add it to your home screen and open it with one tap.",
      add: "Add",
      dismiss: "Don't show again",
      sheetTitle: "Add the app to your home screen",
      iosShare: "Tap **Share** in the Safari bar.",
      iosShareNote: "On iOS 26 it's inside the ⋯ button in the bar.",
      chromeIosShare: "Tap **Share** in the address bar, at the top right.",
      iosAdd: "Choose **Add to Home Screen**. If you don't see it, scroll down the list.",
      iosConfirm: "Tap **Add** at the top right.",
      androidMenu: "Tap the **⋮** menu at the top right.",
      androidAdd: "Choose **Add to Home screen** or **Install app**.",
      androidConfirm: "Confirm with **Install**.",
      samsungMenu: "Tap the **☰** menu at the bottom right.",
      samsungAdd: "Choose **Add page to**, then **Home screen**.",
      samsungConfirm: "Confirm with **Add**.",
      done: "I added it",
      doneNext: "Done. From now on, open it with the icon on your home screen.",
      close: "Close",
      otherTitleIos: "Open the link in Safari",
      otherTitleAndroid: "Open the link in Chrome",
      otherLeadIos: "You're inside another app, and from there Party Games can't be added to the home screen. Copy the link, open it in **Safari** and tap **Add** again.",
      otherLeadAndroid: "You're inside another app, and from there Party Games can't be added to the home screen. Copy the link, open it in **Chrome** and tap **Add** again.",
      copy: "Copy link",
      copied: "Link copied.",
    },
    rk: {
      title: 'Leaderboard', titleOf: '{game} leaderboard',
      week: 'Week', always: 'All time', friends: 'Friends', cup: 'Cup',
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
      sameName: 'Players with that name and another PIN: {n}. If it\'s you, check your PIN. If not, create your player.',
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
      pageTitle: 'Leaderboards', pageSub: 'The best scores and the most wins in every game, this week and of all time.',
      gamePick: 'Pick a game',
      myPlayer: 'Your player', plays: '{n} games played', playsOne: '1 game played',
      changePin: 'Change PIN', newPin: 'New PIN', savePin: 'Save PIN',
      pinChanged: 'Done: the new PIN works from now on, and other phones have to sign in again.',
      legacyFound: 'There are Cup scores under the name {name}, from before the leaderboards. If they are yours, claim them with this PIN.',
      legacyMine: 'They\'re mine', legacyNotMe: 'Not me',
      legacyClaimed: 'All set, {name}! Your Cup scores are yours now.',
      winsOf: 'Most wins: {game}', wins: 'Wins', soloRecords: 'Play alone',
      winsHint: 'Every game you win with your name and PIN adds one. On a single phone, play under that name for it to count.',
      general: 'Overall ranking', playsTitle: 'Most games played',
      playsHint: 'Counts every game you finish signed in with your name and PIN, in any game.',
      tabGames: '🎮 Games', tabCups: '🏆 Cups', groupOne: 'Solo', groupMany: 'Group games',
      cupBestDay: 'Best Cup day', cupBestDayHint: 'Each player\'s best score on a Cup day, game by game.',
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
    shareApp: {
      context: '{n} jogos para o celular',
      lines: [
        '🏆 A Copa: um torneio de uma semana entre amigos, com um jogo diferente por dia.',
        '👥 Para jogar em grupo: num celular só ou cada um no seu.',
        '🧩 Para jogar sozinho: minijogos de palavras, lógica e cultura.',
        '🔓 Sem conta: é só tocar no link e jogar.',
      ],
    },
    invite: '{emoji} *{game}* · Sala {code}\n\n👋 {name} te convida pra jogar em juegosdesalon.cl.',
    shareResult: '📤 Compartilhar resultado',
    shareSoloContext: 'Jogando sozinho',
    shareSoloCta: '🤔 Consegue me vencer? É grátis e se joga pelo celular:',
    shareSoloImage: '🤔 Consegue me vencer?',
    shareCopied: 'Copiado! Cole no chat.',
    shareDownloaded: 'A imagem foi baixada e o texto foi copiado.',
    // El globo de la portada para agregar la app a inicio (D-232)
    ins: {
      title: "Jogos de Salão como app",
      sub: "Adicione à sua tela de início e abra com um toque.",
      add: "Adicionar",
      dismiss: "Não mostrar mais",
      sheetTitle: "Adicione o app à sua tela de início",
      iosShare: "Toque em **Compartilhar** na barra do Safari.",
      iosShareNote: "No iOS 26 fica dentro do botão ⋯ da barra.",
      chromeIosShare: "Toque em **Compartilhar** na barra de endereço, no canto superior direito.",
      iosAdd: "Escolha **Adicionar à Tela de Início**. Se não aparecer, desça na lista.",
      iosConfirm: "Toque em **Adicionar**, no canto superior direito.",
      androidMenu: "Toque no menu **⋮**, no canto superior direito.",
      androidAdd: "Escolha **Adicionar à tela inicial** ou **Instalar app**.",
      androidConfirm: "Confirme em **Instalar**.",
      samsungMenu: "Toque no menu **☰**, no canto inferior direito.",
      samsungAdd: "Escolha **Adicionar página a** e depois **Tela inicial**.",
      samsungConfirm: "Confirme em **Adicionar**.",
      done: "Já adicionei",
      doneNext: "Pronto. Agora abra pelo ícone da sua tela de início.",
      close: "Fechar",
      otherTitleIos: "Abra o link no Safari",
      otherTitleAndroid: "Abra o link no Chrome",
      otherLeadIos: "Você está dentro de outro app, e ali não dá para adicionar Jogos de Salão à tela de início. Copie o link, abra no **Safari** e toque em **Adicionar** de novo.",
      otherLeadAndroid: "Você está dentro de outro app, e ali não dá para adicionar Jogos de Salão à tela de início. Copie o link, abra no **Chrome** e toque em **Adicionar** de novo.",
      copy: "Copiar link",
      copied: "Link copiado.",
    },
    rk: {
      title: 'Ranking', titleOf: 'Ranking de {game}',
      week: 'Semana', always: 'Sempre', friends: 'Amigos', cup: 'Copa',
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
      pageTitle: 'Rankings', pageSub: 'As melhores pontuações e as vitórias de cada jogo, da semana e de sempre.',
      gamePick: 'Escolha um jogo',
      myPlayer: 'Seu jogador', plays: '{n} partidas', playsOne: '1 partida',
      changePin: 'Trocar o PIN', newPin: 'PIN novo', savePin: 'Salvar o PIN',
      pinChanged: 'Pronto: o PIN novo vale a partir de agora e os outros celulares precisam entrar de novo.',
      legacyFound: 'Tem pontuações da Copa no nome de {name}, de antes dos rankings. Se forem suas, fique com elas com este PIN.',
      legacyMine: 'São minhas', legacyNotMe: 'Não sou eu',
      legacyClaimed: 'Pronto, {name}! Suas pontuações da Copa agora são suas.',
      winsOf: 'Mais vitórias: {game}', wins: 'Vitórias', soloRecords: 'Jogar sozinho',
      winsHint: 'Cada partida que você ganha com seu nome e PIN soma uma. Num celular só, jogue com esse nome para que conte.',
      general: 'Ranking geral', playsTitle: 'Mais partidas jogadas',
      playsHint: 'Conta cada partida que você termina com seu nome e PIN, em qualquer jogo.',
      tabGames: '🎮 Jogos', tabCups: '🏆 Copas', groupOne: 'Sozinho', groupMany: 'Em grupo',
      cupBestDay: 'Melhor dia de Copa', cupBestDayHint: 'A melhor pontuação de cada um num dia de Copa, jogo por jogo.',
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
    shareApp: {
      context: '{n} Spiele fürs Handy',
      lines: [
        '🏆 Der Pokal: ein Turnier unter Freunden, eine Woche lang, mit einem anderen Spiel pro Tag.',
        '👥 In der Gruppe: auf einem Handy oder jeder auf seinem.',
        '🧩 Allein: Minispiele mit Wörtern, Logik und Wissen.',
        '🔓 Ohne Konto: Link antippen und losspielen.',
      ],
    },
    invite: '{emoji} *{game}* · Raum {code}\n\n👋 {name} lädt dich zum Spielen auf juegosdesalon.cl ein.',
    shareResult: '📤 Ergebnis teilen',
    shareSoloContext: 'Allein gespielt',
    shareSoloCta: '🤔 Schlägst du mich? Gratis auf dem Handy spielen:',
    shareSoloImage: '🤔 Schlägst du mich?',
    shareCopied: 'Kopiert! Füg es im Chat ein.',
    shareDownloaded: 'Das Bild wurde gespeichert und der Text kopiert.',
    // El globo de la portada para agregar la app a inicio (D-232)
    ins: {
      title: "Salonspiele als App",
      sub: "Leg sie auf deinen Home-Bildschirm und öffne sie mit einem Tipp.",
      add: "Hinzufügen",
      dismiss: "Nicht mehr anzeigen",
      sheetTitle: "Füge die App zu deinem Home-Bildschirm hinzu",
      iosShare: "Tippe in der Safari-Leiste auf **Teilen**.",
      iosShareNote: "Unter iOS 26 steckt es im ⋯-Knopf der Leiste.",
      chromeIosShare: "Tippe in der Adressleiste oben rechts auf **Teilen**.",
      iosAdd: "Wähle **Zum Home-Bildschirm**. Wenn du es nicht siehst, scrolle in der Liste nach unten.",
      iosConfirm: "Tippe oben rechts auf **Hinzufügen**.",
      androidMenu: "Tippe oben rechts auf das Menü **⋮**.",
      androidAdd: "Wähle **Zum Startbildschirm hinzufügen** oder **App installieren**.",
      androidConfirm: "Bestätige mit **Installieren**.",
      samsungMenu: "Tippe unten rechts auf das Menü **☰**.",
      samsungAdd: "Wähle **Seite hinzufügen zu** und dann **Startbildschirm**.",
      samsungConfirm: "Bestätige mit **Hinzufügen**.",
      done: "Hab ich gemacht",
      doneNext: "Fertig. Öffne sie ab jetzt über das Symbol auf deinem Home-Bildschirm.",
      close: "Schließen",
      otherTitleIos: "Öffne den Link in Safari",
      otherTitleAndroid: "Öffne den Link in Chrome",
      otherLeadIos: "Du bist in einer anderen App, und dort lässt sich Salonspiele nicht zum Home-Bildschirm hinzufügen. Kopier den Link, öffne ihn in **Safari** und tippe noch mal auf **Hinzufügen**.",
      otherLeadAndroid: "Du bist in einer anderen App, und dort lässt sich Salonspiele nicht zum Startbildschirm hinzufügen. Kopier den Link, öffne ihn in **Chrome** und tippe noch mal auf **Hinzufügen**.",
      copy: "Link kopieren",
      copied: "Link kopiert.",
    },
    rk: {
      title: 'Rangliste', titleOf: 'Rangliste: {game}',
      week: 'Woche', always: 'Allzeit', friends: 'Freunde', cup: 'Pokal',
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
      pageTitle: 'Ranglisten', pageSub: 'Die besten Punktzahlen und die meisten Siege in jedem Spiel, der Woche und aller Zeiten.',
      gamePick: 'Wähl ein Spiel',
      myPlayer: 'Dein Spieler', plays: '{n} Spiele', playsOne: '1 Spiel',
      changePin: 'PIN ändern', newPin: 'Neue PIN', savePin: 'PIN speichern',
      pinChanged: 'Fertig: Die neue PIN gilt ab jetzt, und andere Handys müssen sich neu anmelden.',
      legacyFound: 'Es gibt Pokal-Punkte unter dem Namen {name}, aus der Zeit vor den Ranglisten. Wenn es deine sind, übernimm sie mit dieser PIN.',
      legacyMine: 'Das bin ich', legacyNotMe: 'Bin ich nicht',
      legacyClaimed: 'Fertig, {name}! Deine Pokal-Punkte gehören jetzt dir.',
      winsOf: 'Meiste Siege: {game}', wins: 'Siege', soloRecords: 'Allein spielen',
      winsHint: 'Jeder Sieg mit deinem Namen und deiner PIN zählt. Auf einem einzigen Handy: Spiel unter diesem Namen, damit er zählt.',
      general: 'Gesamtrangliste', playsTitle: 'Meiste gespielte Partien',
      playsHint: 'Zählt jede Partie, die du mit Name und PIN beendest, in jedem Spiel.',
      tabGames: '🎮 Spiele', tabCups: '🏆 Pokale', groupOne: 'Allein', groupMany: 'In der Gruppe',
      cupBestDay: 'Bester Pokaltag', cupBestDayHint: 'Die beste Punktzahl jedes Spielers an einem Pokaltag, Spiel für Spiel.',
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
