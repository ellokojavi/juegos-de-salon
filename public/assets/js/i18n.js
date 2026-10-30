/**
 * Idioma compartido por toda la app.
 * El idioma se elige con un toggle en el menú (y en la intro de cada juego)
 * y se guarda en localStorage. Por defecto: español. Idiomas: es, en y pt (D-47); el alemán salió (D-514).
 */
import { el } from './ui.js';

const KEY = 'juegos-de-salon:lang';

/** Todos los idiomas que tienen diccionario. Las pruebas de paridad los recorren todos (C-3). */
export const IDIOMAS = ['es', 'en', 'pt'];

/**
 * Idiomas que ya no se ofrecen, con el que los reemplaza (D-514): quien tenía el alemán guardado o
 * abre un link con `?lang=de` sigue en inglés, sin quedar en el español por defecto.
 */
export const RETIRADOS = { de: 'en' };

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
  try {
    const v = localStorage.getItem(KEY);
    if (LANGS.includes(v)) return v;
    if (RETIRADOS[v]) { localStorage.setItem(KEY, RETIRADOS[v]); return RETIRADOS[v]; }
  } catch (_) { /* nada */ }
  return 'es';
}

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  try { localStorage.setItem(KEY, lang); } catch (_) { /* nada */ }
  document.documentElement.lang = lang;
}

/**
 * El idioma también puede venir en el link: `juegosdesalon.cl/?lang=pt`, o pegado a la
 * invitación de una sala, `/liars-dice/?room=WFBN&lang=pt`. Quien comparte elige el idioma con el que
 * va a llegar el que recibe, que es lo mismo que hace el toggle pero para otra persona: sigue
 * sin detectarse nada del navegador (D-47, D-74).
 *
 * Se aplica al cargar cualquier página, se guarda como cualquier elección, y el parámetro se
 * saca de la barra de direcciones: lo que circula es la URL de siempre y el `?room=` queda
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
    const crudo = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
    const pedido = RETIRADOS[crudo] || crudo;
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

/** La app en la web. Las puertas por idioma son /pt/ y /en/ (D-74); /de/ manda a la de inglés (D-514). */
export const SITIO = 'https://juegosdesalon.cl/';

/**
 * La portada para compartir, en el idioma de quien comparte: la de siempre, `/pt/` o `/en/`.
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
    appSub: 'Juegos cortos de mesa, de lógica y de destreza para jugar solo o con amigos.',
    appFree: 'Gratis, sin instalar y sin cuenta.',
    players: 'jugadores', minutes: 'min',
    footer: 'Toma con responsabilidad y con agua a mano. Si manejas, no tomas. 🚕',
    player: 'jugador',
    // Los filtros de la portada (D-142)
    filters: 'Filtrar juegos',
    shown: 'Se ven {n} de {total} juegos.', clearFilters: 'Ver todos',
    favorites: 'Favoritos', favorite: 'Marcar {juego} como favorito', filterNew: 'Nuevos', filterPopular: 'Populares',
    onlySpanish: 'En español',
    code: 'código en GitHub', privacy: 'Privacidad', volverMenu: '🏠 Volver al menú', menu: 'Menú', soon: 'Próximamente', newGame: 'Nuevo', popularGame: 'Popular', or: 'o',
    // Creating or joining a room (U-37): the button while it waits, and the way out when it can't
    opening: 'Abriendo sala…', joining: 'Entrando…', playOnePhone: '📱 Jugar en un celular',
    // A back swipe mid-game (D-432): the sheet that asks before leaving
    backGuard: { title: '¿Salir de la partida?', body: 'Si sales ahora, la partida queda a medias.', stay: '▶ Seguir jugando', leave: 'Salir' },
    share: 'Compartir Juegos de Salón',
    // Compartir la app (D-226): va con la tarjeta de la portada, que ya dice el nombre, la bajada,
    // "gratis, sin instalar" y el link. El texto cuenta lo demás, una idea por línea (U-30), y nombra
    // todo lo principal de la app (LO_PRINCIPAL en compartir.js, D-271): una línea por cada cosa
    shareApp: {
      context: '{n} juegos para el celular',
      lines: [
        '🏆 La Copa: un torneo de una semana entre amigos, con un juego distinto cada día.',
        '📅 Uno al día: un desafío nuevo cada día, el mismo para todos, con su ranking del mes.',
        '👥 Para jugar en grupo: en un celular o cada uno en el suyo.',
        '🧩 Para jugar solo: juegos de palabras, lógica y cultura.',
        '🏅 Rankings: tus mejores puntajes contra los de tus amigos y los de todos.',
        '🔓 Sin cuenta: tocas el link y juegas.',
        '📲 Como app: la agregas a tu pantalla de inicio y, si quieres, te avisa cuando te toca jugar.',
        '🌎 En español, inglés y portugués.',
      ],
    },
    // La hoja del botón de compartir de la portada: el video y las dos maneras de compartir. Sale en
    // los cuatro idiomas, con el Short en español o en inglés (D-410)
    shareSheet: {
      title: 'Compartir Juegos de Salón',
      videoTitle: 'Video de Juegos de Salón',
      invite: '💬 Invitar a jugar',
      inviteNote: 'Un mensaje con el link para entrar a jugar.',
      video: '🎬 Compartir el video',
      videoNote: 'El video de 40 segundos que muestra los juegos.',
      copied: '✅ Copiado',
      close: 'Cerrar',
      videoContext: 'Mira el video',
      videoLines: ['🎲 Los juegos de toda la vida, en tu celular, gratis y sin cuenta.', '🏆 En grupo, solo, en un torneo de una semana o con un desafío nuevo cada día.'],
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
    // Uno al día (D-230): el botón de la portada, el dado, la tarjeta del resultado y /today/
    // La Copa's card on the home page: a day left to play today (lab flag copa-hoy)
    cupToday: { play: 'Jugar hoy', aria: 'Jugar hoy tu día de La Copa', opens: 'Día {day} · {time}', finalDone: 'Final · cierra en {time}' },
    uad: {
      nombre: 'Uno al día',
      jugar: 'Jugar hoy',
      tusPuntos: '✅ Tus puntos',
      ariaJugarHoy: 'Jugar hoy el Uno al día',
      ariaTusPuntos: 'Uno al día: tus puntos del mes',
      listo: 'Listo',
      aria: 'Uno al día: tus puntos y el juego de hoy',
      ariaListo: 'Uno al día: ver cómo te ha ido',
      tocó: 'Uno al día n.° {n} · Hoy te toca',
      intro: '📅 Uno al día: hoy todos juegan el mismo desafío.',
      introRepite: '📅 Ya jugaste el de hoy: esta vez es práctica y tu resultado del día queda igual.',
      // The first attempt counts from its start (D-433, lab): the rule goes after the intro, and what happens on coming back
      lockRule: 'Vale tu primer intento: si no lo terminas, queda en 0.',
      lockResume: '📅 Dejaste el de hoy a medias: sigue donde ibas.',
      lockLost: '📅 Tu intento de hoy quedó sin terminar: cuenta 0. Esta vez es práctica.',
      racha1: '🔥 Racha: 1 día',
      racha: '🔥 Racha: {n} días',
      vuelve: 'Vuelve mañana para el día {n}.',
      practica: 'Esta vez fue práctica: cuenta el primer intento del día, con {s} puntos.',
      puntos: '{s} puntos',
      jugarOtro: '🎲 Jugar otro',
      repetir: 'Repetir el de hoy',
      verTodo: '📅 Volver a Uno al día',
      compartirTitulo: 'Uno al día n.° {n}',
      sub: 'Cada día un juego sorpresa, el mismo desafío para todos.',
      hoyTitulo: 'Hoy',
      hoyFalta: 'El juego de hoy te espera. El dado dice cuál es.',
      hoyListo: 'Hoy jugaste {juego}: {s} puntos.',
      proximo: 'Próximo juego en {t}.',
      horas: '{h}\u00a0h {m}\u00a0min',
      minutos: '{m}\u00a0min',
      rachaLabel: 'racha',
      mejorLabel: 'mejor racha',
      jugadosLabel: 'días jugados',
      rachaCortada: 'Tu mejor racha: {n} días. ¿La superas?',
      calendario: 'Calendario',
      mesAnterior: 'Mes anterior',
      mesSiguiente: 'Mes siguiente',
      vacio: 'Todavía no juegas ningún Uno al día. El primero te espera.',
      // Con jugador e invitaciones (PR 3)
      pct: 'Mejor que el {p} % de los que jugaron hoy.',
      comodinUsado: '🧊 Usaste un comodín ayer y tu racha sigue: {n} días.',
      comodinGanado: '🧊 Ganaste un comodín por 7 días seguidos: si un día no juegas, salva tu racha. También ganas uno cuando un amigo que invitaste termina su primer Uno al día.',
      sinComodines: '🧊 No tienes comodines. Invita a un amigo y gana uno.',
      comodinesTitulo: '🧊 Comodines: {n} de 2',
      comodinesLogica: 'Un comodín salva tu racha el día que no juegas. Ganas uno cada 7 días seguidos, y otro cada vez que un amigo que invitas termina su primer Uno al día.',
      comodinesEntrar: 'Entra con tu nombre para ganar también los de tus amigos.',
      comodinesLabel: 'comodines',
      guardaRacha: 'Guarda tu racha en cualquier celular.',
      invTitulo: '👋 Invita a un amigo',
      rkCompartir: '📤 Compartir el ranking',
      rkCompCab: 'Ranking de {mes}', rkPalabra: 'Ranking',
      rkCompVoy: 'Voy #{p} en el ranking de Uno al día. ¿Me alcanzas? Juega el de hoy:',
      rkCompSin: 'Mira el ranking de Uno al día. ¿Te atreves a entrar? Juega el de hoy:',
      rkCompImagen: 'Un juego nuevo cada día. Gratis y sin descargar nada.',
      invComodin: '🧊 Si tu amigo termina su primer Uno al día, ganas un comodín, que salva tu racha el día que no juegues.',
      invEntrar: '🧊 Si entras, ganas un comodín cuando un amigo que invitaste termina su primer Uno al día.',
      invitar: 'Invitar',
      invCab: 'Te desafío',
      atreves: '¿Te atreves?',
      desafia: '🔥 {n} te desafía',
      invGeneral: '📅 Te invitaron a Uno al día.',
      invGeneralSub: 'Cada día un juego sorpresa, el mismo desafío para todos. ¿Te atreves?',
      duelo: 'Tú {a} · {n} {b}. Mañana hay otro.',
      dueloPend: '{n} todavía no juega el de hoy.',
      aceptado: '🧊 {n} aceptó tu desafío: ganaste un comodín.',
      aceptadoSin: '👋 {n} aceptó tu desafío.',
      unAmigo: 'Un amigo',
      rankingTitulo: '🏅 Ranking de Uno al día',
      // The month's points (D-412): the season, a day's details and the rules, on /today/
      pts: {"temporada": "Temporada de {mes}", "quedan": "quedan {n} días", "ultimo": "último día", "pts": "pts", "hoySumaste": "✅ Hoy sumaste {p} pts: {s} del juego + {b} de racha.", "puesto": "#{p} del mes", "faltan": "#{p} del mes · te faltan {f} pts para pasar a {n}", "juegaHoy": "Juega hoy para entrar al ranking del mes.", "enUnMomento": "Tus puntos entran al ranking en un momento.", "campeon": "👑 Campeón de {mes}", "bonoHoy": "bono de hoy", "como": "¿Cómo se ganan los puntos?", "entendido": "Entendido", "jugar": "Jugar", "titulo": "🏅 Ranking del mes", "leyenda": "Puntos de cada día: juego + racha. Toca un día para ver el detalle.", "numero": "n.° {n}", "juego": "Juego", "puntaje": "Puntaje del juego", "racha": "Racha", "dia1": "{n} día", "dias": "{n} días", "bono": "Bono de la racha", "sumo": "Sumó", "ptsN": "{n} pts", "noJugaste": "No jugaste", "salvo": "🧊 lo salvó un comodín", "siguio": "🔥 {n} días, no se cortó", "noExistia": "todavía no existía", "hoy": "Hoy", "todaviaNo": "todavía no juegas", "cortada": "la racha se cortó", "tarde": "Subido tarde: suma a la racha, no a los puntos.", "cerrar": "Cerrar", "comodinAria": "{d}: comodín", "diaAria": "{d}: {p} pts", "chipPuesto": "#{p}", "delMes": "del mes", "reglas": [["🎮", "El juego:", "cada Uno al día suma su puntaje, de 0 a 100."], ["🔥", "La racha:", "+5 por cada día seguido, hasta +50."], ["🧊", "Comodín:", "salva un día que no jugaste; la racha y su bono siguen."], ["🏆", "Temporada:", "el mes. El 1.° todos parten de 0, y el primero del mes lleva el 🏆 junto a su nombre el mes siguiente."]], "invitarPts": "👋 Y cada amigo que invitas suma +10 pts a tu mes.", "reglaInvitar": ["👋", "Invitar:", "cada amigo que invitas y termina su primer Uno al día suma +10 pts a tu mes."]},
      y: 'y',
      yo: { racha: 'llevo una racha de {n} días', puesto: 'estoy en el {p} % mejor {tabla}', hoy: 'hoy saqué {s}, mejor que el {p} %', mejora: 'voy mejorando en {juego}', constancia: 'ya jugué {n} días de Uno al día', constancia1: 'ya jugué mi primer Uno al día' },
      el: { racha: 'lleva una racha de {n} días', puesto: 'está en el {p} % mejor {tabla}', hoy: 'hoy sacó {s}, mejor que el {p} %', mejora: 'va mejorando en {juego}', constancia: 'ya jugó {n} días de Uno al día', constancia1: 'ya jugó su primer Uno al día' },
      tablas: { semana: 'de la semana', rachas: 'de las rachas' },
      // Los avisos (PR 4)
      avTitulo: '📅 Uno al día',
      avDia: '📅 Uno al día n.° {n} ya está. 🔥 Racha: {c} días.',
      avDiaSin: '📅 Uno al día n.° {n} ya está.',
      avRacha: '🔥 Tu racha de {c} días se corta a medianoche. Te quedan {h} horas.',
      avRachaCom: '🧊 Si no juegas hoy, gastas un comodín para salvar tu racha de {c} días. Te quedan {h} horas.',
      avSemana: '📊 Tu semana: jugaste {n} de 7 días.',
      avAdios: '🔥 Tu mejor racha fue de {m} días. Uno al día te espera cuando quieras.',
      avAdiosSin: '📅 Uno al día te espera cuando quieras.',
      avPregunta: '🔔 ¿Te avisamos cada día para jugar? Elige la hora.',
      avManana: 'Mañana · 9:00',
      avAlmuerzo: 'Almuerzo · 13:00',
      avTarde: 'Tarde · 19:00',
      avAhoraNo: 'Ahora no',
      avActivar: '🔔 Activar avisos',
      avActivos: '🔔 Avisos activos',
      avBloqueados: '🔕 Avisos bloqueados',
      avHoja: '🔔 Avisos de Uno al día',
      avDiario: 'Recordatorio diario',
      avDiarioSub: 'A la hora que elijas, si todavía no juegas.',
      avRachaSw: 'Se corta la racha',
      avRachaSub: 'A las 21:00, si no has jugado.',
      avSemanaSw: 'Tu semana',
      avSemanaSub: 'Los lunes.',
      avHora: 'La hora del aviso',
      avProbar: 'Probar los avisos',
      avSilenciar: 'Silenciar',
      avSilenciado: 'Listo: no te llegan más avisos de Uno al día.',
      avListo: '✅ Listo. Te avisaremos cada día a las {h}:00.',
      avPrueba: 'Así se verán los avisos de Uno al día.',
      avPaso3: 'Abre **Juegos de Salón** desde el ícono nuevo, toca **Uno al día** y elige la hora otra vez.',
      avOtraApp: 'Estás dentro de otra app, y ahí no se puede agregar Juegos de Salón a la pantalla de inicio. Copia el link, ábrelo en Safari y elige la hora otra vez.',
      avError: 'No se pudieron activar los avisos. Prueba de nuevo.',
      // Lo común en los juegos donde el rival responde a lo que haces (Dudo, Batalla Naval)
      mismosDados: 'Todos parten con los mismos dados.',
      mismaFlota: 'Todos se enfrentan a la misma flota del celular.',
    },
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
    // The inbox at the end of the experience and in the home footer (D-345)
    buzon: { abrir: '💬 Sugerencias y comentarios', titulo: 'Sugerencias y comentarios', lead: 'Escríbenos lo que quieras: una sugerencia, un comentario, una idea, algo que falló o un juego que te gustaría.', ph: 'Por ejemplo: me gustaría jugar al dominó.', tipo: '¿De qué se trata? (opcional)', tipos: { sugerencia: '💡 Sugerencia', problema: '🐞 Problema', idea: '🎲 Idea de juego', otro: '💬 Otro' }, nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar', enviando: 'Enviando…', cancelar: 'Cancelar', cerrar: 'Cerrar', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu mensaje llegó.', guardado: 'Ahora no hay internet: tu mensaje quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.' },
    rk: {
      title: 'Ranking', titleOf: 'Ranking de {game}',
      week: 'Semana', always: 'Siempre', friends: 'Amigos', cup: 'Copa', today: 'Hoy', streaks: 'Rachas',
      month: 'Mes', champion: 'Campeón del mes pasado', dailyPoints: 'Puntos de Uno al día', dailyPointsHint: 'La temporada es el mes: cada día suma el puntaje del juego más el bono de la racha. 🔥 es la racha.',
      loading: 'Cargando el ranking…',
      error: 'No se pudo cargar el ranking. Revisa tu conexión.',
      empty: 'Todavía nadie. ¡Sé el primero!',
      emptyFriends: 'Aquí salen tus amigos de La Copa que entraron con su nombre y PIN.',
      emptyFriendsToday: 'Aquí salen tus amigos de La Copa y los que invitaste a Uno al día o que te invitaron, si entraron con su nombre y PIN.',
      you: 'tú',
      joinTitle: '🏅 Entra para aparecer en el ranking',
      joinCard: '🏅 Aparece en el ranking',
      joinHint: 'Tu nombre y un PIN de 4 números guardan tus récords. Sirven en cualquier celular y no hace falta cuenta.',
      join: 'Entrar', joining: 'Entrando…',
      nameLabel: 'Tu nombre', namePh: 'Como te conocen tus amigos', pinLabel: 'Tu PIN de 4 números',
      pinWarn: 'No uses el PIN de tu banco.',
      playingAs: 'Juegas como {name}', logout: 'Salir',
      sameName: 'Ya hay {n} con ese nombre y otro PIN. Si eres tú, revisa el PIN. Si no, crea tu jugador.',
      create: 'Crear mi jugador', retry: 'Probar otro PIN',
      created: '¡Listo, {name}! Desde ahora tus puntajes cuentan.',
      welcome: '¡Hola de nuevo, {name}!',
      errName: 'Escribe tu nombre.', errNameBad: 'Ese nombre no va en los rankings: elige otro.', errPin: 'El PIN son 4 números.',
      errNet: 'No se pudo conectar. Revisa tu señal e inténtalo de nuevo.',
      loggedOut: 'Tu PIN cambió en otro celular. Vuelve a entrar para seguir sumando.',
      currentPin: 'PIN actual', errCurrentPin: 'Ese no es tu PIN actual. Revísalo y vuelve a probar.',
      errWait: 'Hubo varios intentos seguidos con este jugador. Espera unos segundos y vuelve a probar.',
      newRecord: '🏆 ¡Récord nuevo!', newWeek: '🏆 ¡Tu mejor puntaje de la semana!',
      best: 'Tu mejor puntaje: {s} en {t}.',
      notSaved: 'Esta vez no se pudo guardar en el ranking.',
      savedLater: 'Sin señal: tu puntaje se sube al ranking apenas vuelva la conexión.',
      allRounder: 'Todoterreno', allRounderHint: 'Suma tu mejor puntaje en cada juego: gana quien juega bien a todo.',
      champions: 'Campeones de La Copa', championsHint: 'Medallas de las copas terminadas: oro, plata y bronce.',
      noChampions: 'Todavía no termina ninguna copa.',
      lastCups: 'Últimas copas', cupChampion: '{copa}: ganó {names}',
      seeAll: '🏅 Ver todos los rankings',
      pageTitle: 'Rankings', pageSub: 'Los mejores puntajes y las victorias de cada juego, de la semana y de siempre.',
      gamePick: 'Elige un juego',
      myPlays: 'Tus partidas', plays: '{n} partidas', playsOne: '1 partida',
      changePin: 'Cambiar el PIN', newPin: 'PIN nuevo',
      pinHint: 'Con tu PIN entras como {name} desde otro celular. Si lo cambias, los otros celulares tienen que volver a entrar.',
      pinChanged: 'Listo: el PIN nuevo vale desde ahora y los otros celulares tienen que volver a entrar.',
      legacyFound: 'Hay puntajes de La Copa a nombre de {name}, de antes de los rankings. Si son tuyos, quédatelos con este PIN.',
      legacyMine: 'Son míos', legacyNotMe: 'No soy yo',
      legacyClaimed: '¡Listo, {name}! Tus puntajes de La Copa ya son tuyos.',
      winsOf: 'Más victorias en {game}', wins: 'Victorias', soloRecords: 'Jugar solo',
      winsHint: 'Cada partida que ganas con tu nombre y PIN suma una. En un solo celular, juega con ese nombre para que cuente.',
      soloOf: "Mejores puntajes jugando solo", countThis: "¿Quieres que esta partida cuente en el ranking?", countedGame: "✅ Listo: esta partida quedó anotada.", countedWin: "🏆 Listo: tu victoria quedó anotada.", notInGame: "Ese nombre no está en esta partida: cuenta desde la próxima.",
      general: 'Ranking general', playsTitle: 'Más partidas jugadas',
      playsHint: 'Cuenta cada partida que terminas con tu nombre y PIN, en cualquier juego.',
      tabGames: '🎮 Juegos', tabCups: '🏆 Copas', groupOne: 'De a uno', groupMany: 'En grupo',
      cupBestDay: 'Mejor día de copa', cupBestDayHint: 'El mejor puntaje de cada uno en un día de copa, juego por juego.',
      rankings: 'Rankings',
    },
  },
  en: {
    appTitle: 'Party Games',
    appSub: 'Short tabletop, logic and skill games to play alone or with friends.',
    appFree: 'Free, no install, no account.',
    players: 'players', minutes: 'min',
    footer: 'Drink responsibly and keep water nearby. If you drive, you don\'t drink. 🚕',
    player: 'player',
    filters: 'Filter games',
    shown: 'Showing {n} of {total} games.', clearFilters: 'Show all',
    favorites: 'Favorites', filterNew: 'New', filterPopular: 'Popular', favorite: 'Mark {juego} as a favorite',
    onlySpanish: 'In Spanish',
    code: 'code on GitHub', privacy: 'Privacy', volverMenu: '🏠 Back to the menu', menu: 'Menu', soon: 'Coming soon', newGame: 'New', popularGame: 'Popular', or: 'or',
    opening: 'Opening room…', joining: 'Joining…', playOnePhone: '📱 Play on one phone',
    backGuard: { title: 'Leave the game?', body: 'If you leave now, the game stays unfinished.', stay: '▶ Keep playing', leave: 'Leave' },
    share: 'Share Party Games',
    shareApp: {
      context: '{n} games for your phone',
      lines: [
        '🏆 The Cup: a week-long tournament among friends, with a different game every day.',
        '📅 One a Day: a new challenge every day, the same for everyone, with its own monthly leaderboard.',
        '👥 To play in a group: on one phone or each on their own phone.',
        '🧩 To play solo: word, logic and trivia games.',
        '🏅 Leaderboards: your best scores against your friends\' and everyone else\'s.',
        '🔓 No account: tap the link and play.',
        '📲 Like an app: add it to your home screen and, if you want, it tells you when it\'s your turn to play.',
        '🌎 In Spanish, English and Portuguese.',
      ],
    },
    // La hoja del botón de compartir de la portada: el video y las dos maneras de compartir
    shareSheet: {
      title: 'Share Party Games',
      videoTitle: 'Party Games video',
      invite: '💬 Invite to play',
      inviteNote: 'A message with the link to start playing.',
      video: '🎬 Share the video',
      videoNote: 'The 40-second video that shows the games.',
      copied: '✅ Copied',
      close: 'Close',
      videoContext: 'Watch the video',
      videoLines: ['🎲 Classic party games on your phone, free and with no account.', '🏆 In a group, solo, in a week-long tournament or with a new challenge every day.'],
    },
    invite: '{emoji} *{game}* · Room {code}\n\n👋 {name} invites you to play at juegosdesalon.cl.',
    shareResult: '📤 Share my result',
    shareSoloContext: 'Playing solo',
    shareSoloCta: '🤔 Can you beat me? It\'s free to play on your phone:',
    shareSoloImage: '🤔 Can you beat me?',
    shareCopied: 'Copied! Paste it in the chat.',
    shareDownloaded: 'The image was downloaded and the text was copied.',
    // El globo de la portada para agregar la app a inicio (D-232)
    // One a Day (D-230): the home button, the die, the result card and /today/
    // La Copa's card on the home page: a day left to play today (lab flag copa-hoy)
    cupToday: { play: 'Play today', aria: 'Play your day of The Cup today', opens: 'Day {day} · {time}', finalDone: 'Final · closes in {time}' },
    uad: {
      nombre: 'One a Day',
      jugar: 'Play today',
      tusPuntos: '✅ Your points',
      ariaJugarHoy: "Play today's One a Day",
      ariaTusPuntos: 'One a Day: your points this month',
      listo: 'Done',
      aria: "One a Day: your points and today's game",
      ariaListo: "One a Day: see how you're doing",
      tocó: 'One a Day #{n} · Today you got',
      intro: '📅 One a Day: everyone plays the same challenge today.',
      introRepite: "📅 You already played today's: this time is practice and your result for the day stays the same.",
      lockRule: "Your first attempt counts: if you don't finish it, it scores 0.",
      lockResume: "📅 You left today's unfinished: pick up where you left off.",
      lockLost: "📅 Today's attempt was left unfinished: it counts as 0. This time is practice.",
      racha1: '🔥 Streak: 1 day',
      racha: '🔥 Streak: {n} days',
      vuelve: 'Come back tomorrow for day {n}.',
      practica: "This time was practice: the day's first try counts, with {s} points.",
      puntos: '{s} points',
      jugarOtro: '🎲 Play another',
      repetir: "Replay today's",
      verTodo: '📅 Back to One a Day',
      compartirTitulo: 'One a Day #{n}',
      sub: 'A surprise game every day, the same challenge for everyone.',
      hoyTitulo: 'Today',
      hoyFalta: "Today's game is waiting. The die tells you which one.",
      hoyListo: 'Today you played {juego}: {s} points.',
      proximo: 'Next game in {t}.',
      horas: '{h}\u00a0h {m}\u00a0min',
      minutos: '{m}\u00a0min',
      rachaLabel: 'streak',
      mejorLabel: 'best streak',
      jugadosLabel: 'days played',
      rachaCortada: 'Your best streak: {n} days. Can you beat it?',
      calendario: 'Calendar',
      mesAnterior: 'Previous month',
      mesSiguiente: 'Next month',
      vacio: "You haven't played any One a Day yet. The first one is waiting.",
      // With a player and invitations (PR 3)
      pct: 'Better than {p}% of those who played today.',
      comodinUsado: '🧊 You used a freeze yesterday and your streak goes on: {n} days.',
      comodinGanado: "🧊 You earned a freeze for 7 days in a row: if you skip a day, it saves your streak. You also earn one when a friend you invited finishes their first One a Day.",
      sinComodines: '🧊 You have no freezes. Invite a friend and earn one.',
      comodinesTitulo: '🧊 Freezes: {n} of 2',
      comodinesLogica: "A freeze saves your streak on a day you don't play. You earn one every 7 days in a row, and another each time a friend you invite finishes their first One a Day.",
      comodinesEntrar: 'Sign in to also earn the ones from your friends.',
      comodinesLabel: 'freezes',
      guardaRacha: 'Keep your streak on any phone.',
      invTitulo: '👋 Invite a friend',
      rkCompartir: '📤 Share the ranking',
      rkCompCab: '{mes} leaderboard', rkPalabra: 'Leaderboard',
      rkCompVoy: "I'm #{p} on the One a Day leaderboard. Can you catch me? Play today's:",
      rkCompSin: "Check out the One a Day leaderboard. Dare to get in? Play today's:",
      rkCompImagen: 'A new game every day. Free, nothing to download.',
      invComodin: "🧊 If your friend finishes their first One a Day, you earn a freeze, which saves your streak on a day you don't play.",
      invEntrar: '🧊 If you sign in, you earn a freeze when a friend you invited finishes their first One a Day.',
      invitar: 'Invite',
      invCab: 'I challenge you',
      atreves: 'Are you up for it?',
      desafia: '🔥 {n} challenges you',
      invGeneral: '📅 You were invited to One a Day.',
      invGeneralSub: 'A surprise game every day, the same challenge for everyone. Are you up for it?',
      duelo: 'You {a} · {n} {b}. Another one tomorrow.',
      dueloPend: "{n} hasn't played today's yet.",
      aceptado: '🧊 {n} took your challenge: you earned a freeze.',
      aceptadoSin: '👋 {n} took your challenge.',
      unAmigo: 'A friend',
      rankingTitulo: '🏅 One a Day leaderboard',
      // The month's points (D-412): the season, a day's details and the rules, on /today/
      pts: {"temporada": "{mes} season", "quedan": "{n} days left", "ultimo": "last day", "pts": "pts", "hoySumaste": "✅ Today you scored {p} pts: {s} from the game + {b} from your streak.", "puesto": "#{p} this month", "faltan": "#{p} this month · {f} pts to pass {n}", "juegaHoy": "Play today to enter this month's leaderboard.", "enUnMomento": "Your points reach the leaderboard in a moment.", "campeon": "👑 {mes} champion", "bonoHoy": "today's bonus", "como": "How do you earn points?", "entendido": "Got it", "jugar": "Play", "titulo": "🏅 This month's leaderboard", "leyenda": "Each day's points: game + streak. Tap a day to see the details.", "numero": "#{n}", "juego": "Game", "puntaje": "Game score", "racha": "Streak", "dia1": "{n} day", "dias": "{n} days", "bono": "Streak bonus", "sumo": "Added", "ptsN": "{n} pts", "noJugaste": "You didn't play", "salvo": "🧊 a freeze saved it", "siguio": "🔥 {n} days, still going", "noExistia": "didn't exist yet", "hoy": "Today", "todaviaNo": "you haven't played yet", "cortada": "the streak broke", "tarde": "Uploaded late: counts for the streak, not for points.", "cerrar": "Close", "comodinAria": "{d}: freeze", "diaAria": "{d}: {p} pts", "chipPuesto": "#{p}", "delMes": "this month", "reglas": [["🎮", "The game:", "each One a Day adds its score, from 0 to 100."], ["🔥", "The streak:", "+5 for each day in a row, up to +50."], ["🧊", "Freeze:", "saves a day you didn't play; the streak and its bonus go on."], ["🏆", "Season:", "the month. On the 1st everyone starts from 0, and the month's winner wears the 🏆 next to their name the following month."]], "invitarPts": "👋 And each friend you invite adds +10 pts to your month.", "reglaInvitar": ["👋", "Inviting:", "each friend you invite who finishes their first One a Day adds +10 pts to your month."]},
      y: 'and',
      yo: { racha: "I'm on a {n}-day streak", puesto: "I'm in the top {p}% {tabla}", hoy: 'I scored {s} today, better than {p}%', mejora: "I'm getting better at {juego}", constancia: "I've played {n} days of One a Day", constancia1: "I've played my first One a Day" },
      el: { racha: 'is on a {n}-day streak', puesto: 'is in the top {p}% {tabla}', hoy: 'scored {s} today, better than {p}%', mejora: 'is getting better at {juego}', constancia: 'has played {n} days of One a Day', constancia1: 'has played their first One a Day' },
      tablas: { semana: 'of the week', rachas: 'for streaks' },
      // Notifications (PR 4)
      avTitulo: '📅 One a Day',
      avDia: '📅 One a Day #{n} is out. 🔥 Streak: {c} days.',
      avDiaSin: '📅 One a Day #{n} is out.',
      avRacha: '🔥 Your {c}-day streak ends at midnight. You have {h} hours left.',
      avRachaCom: "🧊 If you don't play today, you use a freeze to save your {c}-day streak. You have {h} hours left.",
      avSemana: '📊 Your week: you played {n} of 7 days.',
      avAdios: '🔥 Your best streak was {m} days. One a Day is waiting whenever you like.',
      avAdiosSin: '📅 One a Day is waiting whenever you like.',
      avPregunta: '🔔 Shall we remind you every day? Pick the time.',
      avManana: 'Morning · 9:00',
      avAlmuerzo: 'Lunch · 13:00',
      avTarde: 'Evening · 19:00',
      avAhoraNo: 'Not now',
      avActivar: '🔔 Turn on notifications',
      avActivos: '🔔 Notifications on',
      avBloqueados: '🔕 Notifications blocked',
      avHoja: '🔔 One a Day notifications',
      avDiario: 'Daily reminder',
      avDiarioSub: "At the time you pick, if you haven't played yet.",
      avRachaSw: 'Streak about to end',
      avRachaSub: "At 21:00, if you haven't played.",
      avSemanaSw: 'Your week',
      avSemanaSub: 'On Mondays.',
      avHora: 'Notification time',
      avProbar: 'Test notifications',
      avSilenciar: 'Mute',
      avSilenciado: "Done: you won't get any more One a Day notifications.",
      avListo: "✅ Done. We'll remind you every day at {h}:00.",
      avPrueba: 'This is how One a Day notifications will look.',
      avPaso3: 'Open **Party Games** from the new icon, tap **One a Day** and pick the time again.',
      avOtraApp: "You're inside another app, and from there Party Games can't be added to the home screen. Copy the link, open it in Safari and pick the time again.",
      avError: "Notifications couldn't be turned on. Try again.",
      mismosDados: 'Everyone starts with the same dice.',
      mismaFlota: 'Everyone faces the same phone fleet.',
    },
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
    // The inbox at the end of the experience and in the home footer (D-345)
    buzon: { abrir: '💬 Suggestions and comments', titulo: 'Suggestions and comments', lead: "Tell us anything: a suggestion, a comment, an idea, something that broke or a game you'd like.", ph: "For example: I'd like to play dominoes.", tipo: 'What is it about? (optional)', tipos: { sugerencia: '💡 Suggestion', problema: '🐞 Problem', idea: '🎲 Game idea', otro: '💬 Other' }, nombre: 'Name or nickname (optional)', enviar: 'Send', enviando: 'Sending…', cancelar: 'Cancel', cerrar: 'Close', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your message arrived.', guardado: 'No internet right now: your message is saved on your phone and will be sent later.', error: "Couldn't send it. Try again in a bit." },
    rk: {
      title: 'Leaderboard', titleOf: '{game} leaderboard',
      week: 'Week', always: 'All time', friends: 'Friends', cup: 'Cup', today: 'Today', streaks: 'Streaks',
      month: 'Month', champion: 'Last month’s champion', dailyPoints: 'One a Day points', dailyPointsHint: 'The season is the month: each day adds the game’s score plus the streak bonus. 🔥 is the streak.',
      loading: 'Loading the leaderboard…',
      error: 'Couldn\'t load the leaderboard. Check your connection.',
      empty: 'Nobody yet. Be the first!',
      emptyFriends: 'Your friends from The Cup show up here once they sign in with their name and PIN.',
      emptyFriendsToday: 'Your friends from The Cup and the ones you invited to One a Day, or who invited you, show up here once they sign in with their name and PIN.',
      you: 'you',
      joinTitle: '🏅 Sign in to get on the leaderboard',
      joinCard: '🏅 Get on the leaderboard',
      joinHint: 'Your name and a 4-digit PIN keep your records. They work on any phone, no account needed.',
      join: 'Sign in', joining: 'Signing in…',
      nameLabel: 'Your name', namePh: 'What your friends call you', pinLabel: 'Your 4-digit PIN',
      pinWarn: 'Don\'t use your bank PIN.',
      playingAs: 'Playing as {name}', logout: 'Sign out',
      sameName: 'Players with that name and another PIN: {n}. If it\'s you, check your PIN. If not, create your player.',
      create: 'Create my player', retry: 'Try another PIN',
      created: 'All set, {name}! Your scores count from now on.',
      welcome: 'Welcome back, {name}!',
      errName: 'Type your name.', errNameBad: 'That name can’t go on the rankings: pick another.', errPin: 'The PIN is 4 digits.',
      errNet: 'Couldn\'t connect. Check your signal and try again.',
      loggedOut: 'Your PIN changed on another phone. Sign in again to keep scoring.',
      currentPin: 'Current PIN', errCurrentPin: 'That\'s not your current PIN. Check it and try again.',
      errWait: 'There were several tries in a row for this player. Wait a few seconds and try again.',
      newRecord: '🏆 New record!', newWeek: '🏆 Your best score this week!',
      best: 'Your best score: {s} in {t}.',
      notSaved: 'This time it couldn\'t be saved to the leaderboard.',
      savedLater: 'No signal: your score goes up to the leaderboard as soon as you\'re back online.',
      allRounder: 'All-Rounder', allRounderHint: 'Adds up your best score in each game: whoever is good at everything wins.',
      champions: 'Cup Champions', championsHint: 'Medals from finished cups: gold, silver and bronze.',
      noChampions: 'No cup has finished yet.',
      lastCups: 'Latest cups', cupChampion: '{copa}: won by {names}',
      seeAll: '🏅 See all leaderboards',
      pageTitle: 'Leaderboards', pageSub: 'The best scores and the most wins in every game, this week and of all time.',
      gamePick: 'Pick a game',
      myPlays: 'Your games', plays: '{n} games played', playsOne: '1 game played',
      changePin: 'Change PIN', newPin: 'New PIN',
      pinHint: 'Your PIN signs you in as {name} on another phone. If you change it, other phones have to sign in again.',
      pinChanged: 'Done: the new PIN works from now on, and other phones have to sign in again.',
      legacyFound: 'There are Cup scores under the name {name}, from before the leaderboards. If they are yours, claim them with this PIN.',
      legacyMine: 'They\'re mine', legacyNotMe: 'Not me',
      legacyClaimed: 'All set, {name}! Your Cup scores are yours now.',
      winsOf: 'Most wins: {game}', wins: 'Wins', soloRecords: 'Play alone',
      winsHint: 'Every game you win with your name and PIN adds one. On a single phone, play under that name for it to count.',
      soloOf: "Best scores playing alone", countThis: "Want this game to count on the leaderboard?", countedGame: "✅ Done: this game was saved.", countedWin: "🏆 Done: your win was saved.", notInGame: "That name isn't in this game: it counts from the next one.",
      general: 'Overall ranking', playsTitle: 'Most games played',
      playsHint: 'Counts every game you finish signed in with your name and PIN, in any game.',
      tabGames: '🎮 Games', tabCups: '🏆 Cups', groupOne: 'Solo', groupMany: 'Group games',
      cupBestDay: 'Best Cup day', cupBestDayHint: 'Each player\'s best score on a Cup day, game by game.',
      rankings: 'Leaderboards',
    },
  },
  pt: {
    appTitle: 'Jogos de Salão',
    appSub: 'Jogos curtos de mesa, de lógica e de destreza pra jogar sozinho ou com amigos.',
    appFree: 'De graça, sem instalar e sem conta.',
    players: 'jogadores', minutes: 'min',
    footer: 'Beba com responsabilidade e com água por perto. Se for dirigir, não beba. 🚕',
    player: 'jogador',
    filters: 'Filtrar jogos',
    shown: 'Mostrando {n} de {total} jogos.', clearFilters: 'Ver todos',
    favorites: 'Favoritos', favorite: 'Marcar {juego} como favorito', filterNew: 'Novos', filterPopular: 'Populares',
    onlySpanish: 'Em espanhol',
    code: 'código no GitHub', privacy: 'Privacidade', volverMenu: '🏠 Voltar ao menu', menu: 'Menu', soon: 'Em breve', newGame: 'Novo', popularGame: 'Popular', or: 'ou',
    opening: 'Abrindo sala…', joining: 'Entrando…', playOnePhone: '📱 Jogar em um celular',
    backGuard: { title: 'Sair da partida?', body: 'Se você sair agora, a partida fica pela metade.', stay: '▶ Continuar jogando', leave: 'Sair' },
    share: 'Compartilhar Jogos de Salão',
    shareApp: {
      context: '{n} jogos para o celular',
      lines: [
        '🏆 A Copa: um torneio de uma semana entre amigos, com um jogo diferente por dia.',
        '📅 Um por dia: um desafio novo todo dia, o mesmo para todos, com seu ranking do mês.',
        '👥 Para jogar em grupo: num celular só ou cada um no seu.',
        '🧩 Para jogar sozinho: jogos de palavras, lógica e cultura.',
        '🏅 Rankings: as suas melhores pontuações contra as dos amigos e as de todo mundo.',
        '🔓 Sem conta: é só tocar no link e jogar.',
        '📲 Como um app: você adiciona à tela inicial e, se quiser, ele avisa quando é a sua vez de jogar.',
        '🌎 Em espanhol, inglês, português e alemão.',
      ],
    },
    // La hoja del botón de compartir de la portada: el video y las dos maneras de compartir
    shareSheet: {
      title: 'Compartilhar Jogos de Salão',
      videoTitle: 'Vídeo de Jogos de Salão',
      invite: '💬 Convidar a jogar',
      inviteNote: 'Uma mensagem com o link para entrar e jogar.',
      video: '🎬 Compartilhar o vídeo',
      videoNote: 'O vídeo de 40 segundos que mostra os jogos.',
      copied: '✅ Copiado',
      close: 'Fechar',
      videoContext: 'Veja o vídeo',
      videoLines: ['🎲 Os jogos de sempre, no celular, grátis e sem conta.', '🏆 Em grupo, sozinho, num torneio de uma semana ou com um desafio novo todo dia.'],
    },
    invite: '{emoji} *{game}* · Sala {code}\n\n👋 {name} te convida pra jogar em juegosdesalon.cl.',
    shareResult: '📤 Compartilhar resultado',
    shareSoloContext: 'Jogando sozinho',
    shareSoloCta: '🤔 Consegue me vencer? É grátis e se joga pelo celular:',
    shareSoloImage: '🤔 Consegue me vencer?',
    shareCopied: 'Copiado! Cole no chat.',
    shareDownloaded: 'A imagem foi baixada e o texto foi copiado.',
    // El globo de la portada para agregar la app a inicio (D-232)
    // Um por dia (D-230): o botão da página inicial, o dado, o cartão do resultado e /today/
    // La Copa's card on the home page: a day left to play today (lab flag copa-hoy)
    cupToday: { play: 'Jogar hoje', aria: 'Jogar hoje o seu dia da Copa', opens: 'Dia {day} · {time}', finalDone: 'Final · fecha em {time}' },
    uad: {
      nombre: 'Um por dia',
      jugar: 'Jogar hoje',
      tusPuntos: '✅ Seus pontos',
      ariaJugarHoy: 'Jogar hoje o Um por dia',
      ariaTusPuntos: 'Um por dia: seus pontos do mês',
      listo: 'Feito',
      aria: 'Um por dia: seus pontos e o jogo de hoje',
      ariaListo: 'Um por dia: ver como você está indo',
      tocó: 'Um por dia n.º {n} · Hoje é',
      intro: '📅 Um por dia: hoje todos jogam o mesmo desafio.',
      introRepite: '📅 Você já jogou o de hoje: desta vez é treino e seu resultado do dia continua o mesmo.',
      lockRule: 'Vale a sua primeira tentativa: se você não terminar, fica em 0.',
      lockResume: '📅 Você deixou o de hoje pela metade: continue de onde parou.',
      lockLost: '📅 Sua tentativa de hoje ficou sem terminar: conta 0. Desta vez é treino.',
      racha1: '🔥 Sequência: 1 dia',
      racha: '🔥 Sequência: {n} dias',
      vuelve: 'Volte amanhã para o dia {n}.',
      practica: 'Desta vez foi treino: vale a primeira tentativa do dia, com {s} pontos.',
      puntos: '{s} pontos',
      jugarOtro: '🎲 Jogar outro',
      repetir: 'Repetir o de hoje',
      verTodo: '📅 Voltar ao Um por dia',
      compartirTitulo: 'Um por dia n.º {n}',
      sub: 'Todo dia um jogo surpresa, o mesmo desafio para todos.',
      hoyTitulo: 'Hoje',
      hoyFalta: 'O jogo de hoje está esperando. O dado diz qual é.',
      hoyListo: 'Hoje você jogou {juego}: {s} pontos.',
      proximo: 'Próximo jogo em {t}.',
      horas: '{h}\u00a0h {m}\u00a0min',
      minutos: '{m}\u00a0min',
      rachaLabel: 'sequência',
      mejorLabel: 'melhor sequência',
      jugadosLabel: 'dias jogados',
      rachaCortada: 'Sua melhor sequência: {n} dias. Consegue superar?',
      calendario: 'Calendário',
      mesAnterior: 'Mês anterior',
      mesSiguiente: 'Próximo mês',
      vacio: 'Você ainda não jogou nenhum Um por dia. O primeiro está esperando.',
      // Com jogador e convites (PR 3)
      pct: 'Melhor que {p} % de quem jogou hoje.',
      comodinUsado: '🧊 Você usou um coringa ontem e sua sequência continua: {n} dias.',
      comodinGanado: '🧊 Você ganhou um coringa por 7 dias seguidos: se um dia você não jogar, ele salva sua sequência. Também ganha um quando um amigo que você convidou termina o primeiro Um por dia.',
      sinComodines: '🧊 Você não tem coringas. Convide um amigo e ganhe um.',
      comodinesTitulo: '🧊 Coringas: {n} de 2',
      comodinesLogica: 'Um coringa salva sua sequência no dia em que você não joga. Você ganha um a cada 7 dias seguidos, e outro cada vez que um amigo que você convida termina o primeiro Um por dia.',
      comodinesEntrar: 'Entre com seu nome para ganhar também os dos seus amigos.',
      comodinesLabel: 'coringas',
      guardaRacha: 'Guarde sua sequência em qualquer celular.',
      invTitulo: '👋 Convide um amigo',
      rkCompartir: '📤 Compartilhar o ranking',
      rkCompCab: 'Ranking de {mes}', rkPalabra: 'Ranking',
      rkCompVoy: 'Estou em #{p} no ranking do Um por dia. Consegue me alcançar? Jogue o de hoje:',
      rkCompSin: 'Veja o ranking do Um por dia. Tem coragem de entrar? Jogue o de hoje:',
      rkCompImagen: 'Um jogo novo por dia. Grátis e sem baixar nada.',
      invComodin: '🧊 Se seu amigo terminar o primeiro Um por dia, você ganha um coringa, que salva sua sequência no dia em que você não jogar.',
      invEntrar: '🧊 Se você entrar, ganha um coringa quando um amigo que você convidou terminar o primeiro Um por dia.',
      invitar: 'Convidar',
      invCab: 'Te desafio',
      atreves: 'Topa?',
      desafia: '🔥 {n} te desafia',
      invGeneral: '📅 Você foi convidado para o Um por dia.',
      invGeneralSub: 'Todo dia um jogo surpresa, o mesmo desafio para todos. Topa?',
      duelo: 'Você {a} · {n} {b}. Amanhã tem outro.',
      dueloPend: '{n} ainda não jogou o de hoje.',
      aceptado: '🧊 {n} aceitou seu desafio: você ganhou um coringa.',
      aceptadoSin: '👋 {n} aceitou seu desafio.',
      unAmigo: 'Um amigo',
      rankingTitulo: '🏅 Ranking do Um por dia',
      // The month's points (D-412): the season, a day's details and the rules, on /today/
      pts: {"temporada": "Temporada de {mes}", "quedan": "faltam {n} dias", "ultimo": "último dia", "pts": "pts", "hoySumaste": "✅ Hoje você somou {p} pts: {s} do jogo + {b} da sequência.", "puesto": "#{p} do mês", "faltan": "#{p} do mês · faltam {f} pts para passar {n}", "juegaHoy": "Jogue hoje para entrar no ranking do mês.", "enUnMomento": "Seus pontos entram no ranking em um instante.", "campeon": "👑 Campeão de {mes}", "bonoHoy": "bônus de hoje", "como": "Como se ganham os pontos?", "entendido": "Entendi", "jugar": "Jogar", "titulo": "🏅 Ranking do mês", "leyenda": "Pontos de cada dia: jogo + sequência. Toque um dia para ver o detalhe.", "numero": "n.º {n}", "juego": "Jogo", "puntaje": "Pontuação do jogo", "racha": "Sequência", "dia1": "{n} dia", "dias": "{n} dias", "bono": "Bônus da sequência", "sumo": "Somou", "ptsN": "{n} pts", "noJugaste": "Você não jogou", "salvo": "🧊 um coringa salvou", "siguio": "🔥 {n} dias, não quebrou", "noExistia": "ainda não existia", "hoy": "Hoje", "todaviaNo": "você ainda não jogou", "cortada": "a sequência quebrou", "tarde": "Enviado com atraso: conta para a sequência, não para os pontos.", "cerrar": "Fechar", "comodinAria": "{d}: coringa", "diaAria": "{d}: {p} pts", "chipPuesto": "#{p}", "delMes": "do mês", "reglas": [["🎮", "O jogo:", "cada Um por dia soma a pontuação, de 0 a 100."], ["🔥", "A sequência:", "+5 por dia seguido, até +50."], ["🧊", "Coringa:", "salva um dia em que você não jogou; a sequência e o bônus continuam."], ["🏆", "Temporada:", "o mês. No dia 1.º todos começam do 0, e o primeiro do mês leva o 🏆 junto ao nome no mês seguinte."]], "invitarPts": "👋 E cada amigo que você convida soma +10 pts ao seu mês.", "reglaInvitar": ["👋", "Convidar:", "cada amigo que você convida e termina o primeiro Um por dia soma +10 pts ao seu mês."]},
      y: 'e',
      yo: { racha: 'estou com uma sequência de {n} dias', puesto: 'estou entre os {p} % melhores {tabla}', hoy: 'hoje fiz {s}, melhor que {p} %', mejora: 'estou melhorando em {juego}', constancia: 'já joguei {n} dias de Um por dia', constancia1: 'já joguei meu primeiro Um por dia' },
      el: { racha: 'está com uma sequência de {n} dias', puesto: 'está entre os {p} % melhores {tabla}', hoy: 'hoje fez {s}, melhor que {p} %', mejora: 'está melhorando em {juego}', constancia: 'já jogou {n} dias de Um por dia', constancia1: 'já jogou o primeiro Um por dia' },
      tablas: { semana: 'da semana', rachas: 'em sequências' },
      // Os avisos (PR 4)
      avTitulo: '📅 Um por dia',
      avDia: '📅 O Um por dia n.º {n} já saiu. 🔥 Sequência: {c} dias.',
      avDiaSin: '📅 O Um por dia n.º {n} já saiu.',
      avRacha: '🔥 Sua sequência de {c} dias acaba à meia-noite. Faltam {h} horas.',
      avRachaCom: '🧊 Se você não jogar hoje, gasta um coringa para salvar sua sequência de {c} dias. Faltam {h} horas.',
      avSemana: '📊 Sua semana: você jogou {n} de 7 dias.',
      avAdios: '🔥 Sua melhor sequência foi de {m} dias. O Um por dia te espera quando quiser.',
      avAdiosSin: '📅 O Um por dia te espera quando quiser.',
      avPregunta: '🔔 Quer um aviso todo dia para jogar? Escolha a hora.',
      avManana: 'Manhã · 9:00',
      avAlmuerzo: 'Almoço · 13:00',
      avTarde: 'Noite · 19:00',
      avAhoraNo: 'Agora não',
      avActivar: '🔔 Ativar avisos',
      avActivos: '🔔 Avisos ativos',
      avBloqueados: '🔕 Avisos bloqueados',
      avHoja: '🔔 Avisos do Um por dia',
      avDiario: 'Lembrete diário',
      avDiarioSub: 'Na hora que você escolher, se ainda não jogou.',
      avRachaSw: 'A sequência vai acabar',
      avRachaSub: 'Às 21:00, se você não jogou.',
      avSemanaSw: 'Sua semana',
      avSemanaSub: 'Às segundas.',
      avHora: 'A hora do aviso',
      avProbar: 'Testar os avisos',
      avSilenciar: 'Silenciar',
      avSilenciado: 'Pronto: você não recebe mais avisos do Um por dia.',
      avListo: '✅ Pronto. Vamos te avisar todo dia às {h}:00.',
      avPrueba: 'Assim vão ficar os avisos do Um por dia.',
      avPaso3: 'Abra **Jogos de Salão** pelo ícone novo, toque em **Um por dia** e escolha a hora de novo.',
      avOtraApp: 'Você está dentro de outro app, e ali não dá para adicionar Jogos de Salão à tela de início. Copie o link, abra no Safari e escolha a hora de novo.',
      avError: 'Não deu para ativar os avisos. Tente de novo.',
      mismosDados: 'Todos começam com os mesmos dados.',
      mismaFlota: 'Todos enfrentam a mesma frota do celular.',
    },
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
    // The inbox at the end of the experience and in the home footer (D-345)
    buzon: { abrir: '💬 Sugestões e comentários', titulo: 'Sugestões e comentários', lead: 'Escreva o que quiser: uma sugestão, um comentário, uma ideia, algo que falhou ou um jogo que você gostaria.', ph: 'Por exemplo: eu gostaria de jogar dominó.', tipo: 'Sobre o que é? (opcional)', tipos: { sugerencia: '💡 Sugestão', problema: '🐞 Problema', idea: '🎲 Ideia de jogo', otro: '💬 Outro' }, nombre: 'Nome ou apelido (opcional)', enviar: 'Enviar', enviando: 'Enviando…', cancelar: 'Cancelar', cerrar: 'Fechar', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Sua mensagem chegou.', guardado: 'Sem internet agora: sua mensagem ficou no celular e será enviada depois.', error: 'Não deu para enviar. Tente de novo daqui a pouco.' },
    rk: {
      title: 'Ranking', titleOf: 'Ranking de {game}',
      week: 'Semana', always: 'Sempre', friends: 'Amigos', cup: 'Copa', today: 'Hoje', streaks: 'Sequências',
      month: 'Mês', champion: 'Campeão do mês passado', dailyPoints: 'Pontos do Um por dia', dailyPointsHint: 'A temporada é o mês: cada dia soma a pontuação do jogo mais o bônus da sequência. 🔥 é a sequência.',
      loading: 'Carregando o ranking…',
      error: 'Não deu para carregar o ranking. Confira sua conexão.',
      empty: 'Ninguém ainda. Seja o primeiro!',
      emptyFriends: 'Aqui aparecem seus amigos da Copa que entraram com nome e PIN.',
      emptyFriendsToday: 'Aqui aparecem seus amigos da Copa e os que você convidou para o Um por dia ou que te convidaram, se entraram com nome e PIN.',
      you: 'você',
      joinTitle: '🏅 Entre para aparecer no ranking',
      joinCard: '🏅 Apareça no ranking',
      joinHint: 'Seu nome e um PIN de 4 números guardam seus recordes. Valem em qualquer celular e não precisa de conta.',
      join: 'Entrar', joining: 'Entrando…',
      nameLabel: 'Seu nome', namePh: 'Como seus amigos te chamam', pinLabel: 'Seu PIN de 4 números',
      pinWarn: 'Não use a senha do seu banco.',
      playingAs: 'Jogando como {name}', logout: 'Sair',
      sameName: 'Já tem {n} com esse nome e outro PIN. Se for você, confira o PIN. Se não, crie seu jogador.',
      create: 'Criar meu jogador', retry: 'Tentar outro PIN',
      created: 'Pronto, {name}! A partir de agora seus pontos contam.',
      welcome: 'Que bom te ver de novo, {name}!',
      errName: 'Escreva seu nome.', errNameBad: 'Esse nome não pode ir para os rankings: escolha outro.', errPin: 'O PIN tem 4 números.',
      errNet: 'Não deu para conectar. Confira o sinal e tente de novo.',
      loggedOut: 'Seu PIN mudou em outro celular. Entre de novo para continuar somando.',
      currentPin: 'PIN atual', errCurrentPin: 'Esse não é o seu PIN atual. Confira e tente de novo.',
      errWait: 'Houve várias tentativas seguidas com este jogador. Espere alguns segundos e tente de novo.',
      newRecord: '🏆 Novo recorde!', newWeek: '🏆 Sua melhor pontuação da semana!',
      best: 'Sua melhor pontuação: {s} em {t}.',
      notSaved: 'Desta vez não deu para salvar no ranking.',
      savedLater: 'Sem sinal: sua pontuação vai para o ranking assim que a conexão voltar.',
      allRounder: 'Faz-Tudo', allRounderHint: 'Soma sua melhor pontuação em cada jogo: ganha quem joga bem tudo.',
      champions: 'Campeões da Copa', championsHint: 'Medalhas das copas terminadas: ouro, prata e bronze.',
      noChampions: 'Nenhuma copa terminou ainda.',
      lastCups: 'Últimas copas', cupChampion: '{copa}: ganhou {names}',
      seeAll: '🏅 Ver todos os rankings',
      pageTitle: 'Rankings', pageSub: 'As melhores pontuações e as vitórias de cada jogo, da semana e de sempre.',
      gamePick: 'Escolha um jogo',
      myPlays: 'Suas partidas', plays: '{n} partidas', playsOne: '1 partida',
      changePin: 'Trocar o PIN', newPin: 'PIN novo',
      pinHint: 'Com seu PIN você entra como {name} em outro celular. Se trocar, os outros celulares precisam entrar de novo.',
      pinChanged: 'Pronto: o PIN novo vale a partir de agora e os outros celulares precisam entrar de novo.',
      legacyFound: 'Tem pontuações da Copa no nome de {name}, de antes dos rankings. Se forem suas, fique com elas com este PIN.',
      legacyMine: 'São minhas', legacyNotMe: 'Não sou eu',
      legacyClaimed: 'Pronto, {name}! Suas pontuações da Copa agora são suas.',
      winsOf: 'Mais vitórias: {game}', wins: 'Vitórias', soloRecords: 'Jogar sozinho',
      winsHint: 'Cada partida que você ganha com seu nome e PIN soma uma. Num celular só, jogue com esse nome para que conte.',
      soloOf: "Melhores pontuações jogando sozinho", countThis: "Quer que esta partida conte no ranking?", countedGame: "✅ Pronto: esta partida foi anotada.", countedWin: "🏆 Pronto: sua vitória foi anotada.", notInGame: "Esse nome não está nesta partida: conta a partir da próxima.",
      general: 'Ranking geral', playsTitle: 'Mais partidas jogadas',
      playsHint: 'Conta cada partida que você termina com seu nome e PIN, em qualquer jogo.',
      tabGames: '🎮 Jogos', tabCups: '🏆 Copas', groupOne: 'Sozinho', groupMany: 'Em grupo',
      cupBestDay: 'Melhor dia de Copa', cupBestDayHint: 'A melhor pontuação de cada um num dia de Copa, jogo por jogo.',
      rankings: 'Rankings',
    },
  },
};

/** Devuelve `obj[lang]` si es un objeto por idioma; si no, el valor tal cual. */
export function pickLang(obj, lang = getLang()) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj) && (lang in obj)) return obj[lang];
  return obj;
}

/**
 * La bandera y el nombre propio de cada idioma, para el toggle (D-231). Un idioma nuevo trae
 * los dos: la prueba de paridad lo exige. La bandera identifica el idioma, no el país de quien
 * juega: el español va con 🇪🇸 (D-244); el portugués, con 🇧🇷, porque es el de Brasil (D-191, D-194).
 */
export const BANDERAS = { es: '🇪🇸', en: '🇬🇧', pt: '🇧🇷' };
export const NOMBRES_IDIOMA = { es: 'Español', en: 'English', pt: 'Português' };

/**
 * El selector de idioma, el único de la app (D-231): cada botón lleva su bandera y su código,
 * siempre, también en un celular angosto (base.css). `onChange(lang)` se llama tras guardar el
 * idioma nuevo; por defecto recarga la página para que todo se re-renderice con el elegido.
 */
export function langToggle(onChange = () => location.reload()) {
  const current = getLang();
  const wrap = el('div', { class: 'lang-toggle', role: 'group', 'aria-label': 'Idioma / Language / Idioma' });
  for (const lang of LANGS) {
    wrap.append(el('button', {
      type: 'button', class: lang === current ? 'on' : '', 'aria-pressed': lang === current ? 'true' : 'false',
      lang, title: NOMBRES_IDIOMA[lang], 'aria-label': NOMBRES_IDIOMA[lang],
      onClick: () => { if (lang === getLang()) return; setLang(lang); onChange(lang); },
    }, el('span', { class: 'flag', 'aria-hidden': 'true' }, BANDERAS[lang]), el('span', { class: 'code' }, lang.toUpperCase())));
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
