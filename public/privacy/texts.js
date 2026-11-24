/**
 * The privacy page's texts, in the four languages (D-463, C-3). What it says has to match what the
 * code keeps: when a change stores something new, or keeps it for a different time, it edits this
 * page in the same PR. `texts.test.mjs` checks that the four languages have the same shape and
 * that the 90 days are the ones the feedback job applies and the 24 months the stats job applies (D-472).
 *
 * Each section is a heading, paragraphs (`p`) and an optional list (`items`). The contact address
 * becomes a link when drawn.
 */
export const CONTACT = 'hola@juegosdesalon.cl';
export const UPDATED = '2026-11-22';

export const TEXTS = {
  es: {
    title: 'Privacidad',
    lead: 'Juegos de Salón (juegosdesalon.cl) se juega sin cuenta, sin publicidad y sin cookies de seguimiento. Aquí está lo poco que guardamos, para qué, dónde y por cuánto tiempo.',
    sections: [
      { h: '📱 En tu celular', p: ['Tu navegador guarda en el celular el idioma, el sonido, tus favoritos, la partida en curso, tus puntajes, los juegos que ya jugaste y los nombres que escribiste, para que no tengas que repetirlos. No son cookies y se borran al borrar los datos de este sitio en el navegador. Si juegas sin señal, guarda también una copia de los juegos para jugarlos sin señal, y los puntajes de las partidas que faltan por subir (hasta 200, por 30 días); se borran al subirse.', 'De cada copa que abriste con señal guarda una copia (la tabla y los resultados de ese momento) para jugar sin señal un día pendiente; ese resultado espera en el celular hasta subirse o hasta que cierra su día, y la copia se borra al salir de la copa.', 'Para tus logros guarda también cuántos juegos terminaste de madrugada o de noche, cada día de los últimos 60, cuántas veces seguidas jugaste un mismo juego, qué días jugaste, el primer día que terminaste cada juego, qué fines de semana jugaste sábado y domingo, qué lunes jugaste antes de las 8 y si jugaste en algunas fechas especiales. No sale del celular.'] },
      {
        h: '☁️ En nuestra base de datos',
        p: ['Usamos Firebase, de Google, en Estados Unidos. Guardamos solo esto:'],
        items: [
          'Salas para jugar con otros: el nombre o apodo que escribes y las jugadas. Se borran cuando todos salen o, si no, en los días siguientes a que la sala se cierra.',
          'La Copa: tu nombre o apodo, tus resultados y tu PIN de 4 cifras, guardado como una huella (hash) que nadie puede leer. Para que nadie adivine tu PIN, guardamos el último intento de cada jugador. Quien la creó puede borrarla; si no, dos años después de terminar pasa a un archivo cerrado que solo nosotros podemos leer. Las reacciones y comentarios que dejas en una copa los ven sus jugadores y se borran cuando la copa termina.',
          'Rankings y Uno al día, si entras con nombre y PIN: tu nombre, tu país, tus puntajes, los días que jugaste y cuántas partidas terminaste de cada juego. El nombre, el país y los puntajes se ven en los rankings. Se guardan mientras exista el juego o hasta que nos pidas borrarlos.',
          'Duelos, si retas a alguien o te retan: los nombres de los dos, el juego, el formato, cuándo empezaste cada ronda y tus resultados. Los puede ver cualquiera con el enlace del duelo y aparecen en la lista de duelos recientes de la página Duelos, y se guardan mientras exista el juego o hasta que nos pidas borrarlos.',
          'Quien toca tu nombre en un ranking ve tus logros, tu racha, tus partidas, desde cuándo juegas y tu lugar en los juegos que más juegas.',
          'Si entraste con tu nombre, guardamos los días que abres tu perfil, qué usas en él y si entraste o creaste tu cuenta desde ahí, para ver cómo se usa. Solo nosotros lo vemos.',
          'Para no pedirte el PIN cada vez, guardamos un número anónimo de cada aparato donde entras, y el último intento de PIN para frenar a quien quiera adivinarlo. Si invitas a alguien a Uno al día, anotamos que llegó por tu invitación. Si un nombre es ofensivo, podemos cambiarlo; los puntajes y el PIN se mantienen.',
          'Estadísticas de uso, para saber qué se juega y qué falla: conteos por día (juego, idioma, hora, aparato y tamaño aproximado de pantalla, el sitio y enlace por donde llegaste y el país, según el huso horario), un número al azar del navegador para contar quién vuelve y a qué juegos, los nombres escritos en cada partida, qué anuncios del sitio viste con ese nombre y los errores con navegador y versión. Los nombres se borran a los 24 meses; los conteos quedan.',
          'Avisos al celular, si los activas: la dirección de avisos que da tu navegador, el idioma, el huso horario, los avisos que pediste y la última temporada de Uno al día cuyo resumen ya viste, para no avisarte lo que ya sabes. Se borran al desactivarlos o cuando el navegador los da por vencidos.',
          'Sugerencias y comentarios: lo que escribes, tu nombre o apodo si lo pones, la página y la versión. Los copiamos a la lista de tareas del proyecto en GitHub, que es pública, con tu nombre tapado salvo la primera letra de cada palabra y sin tu correo, así que no escribas ahí datos personales. Todavía no tienen fecha de borrado.',
          'Si propones una pista en Críptico, el nombre que elijas para firmarla sale completo en GitHub y, si la publicamos, junto a la pista en el juego, con el código de tu jugador si entraste (para que ese día no te toque tu propia pista).',
          'Tu correo, si lo dejas en una sugerencia o nos escribes a hola@juegosdesalon.cl: solo para responderte, y nunca se publica. Lo borramos al responderte o, si no hubo respuesta, a los 90 días.',
        ],
      },
      {
        h: '🤝 Quién más los ve',
        p: [
          'No tenemos servidores propios. Estos servicios ven tu dirección IP para entregarte el sitio, con sus propias reglas de privacidad: GitHub Pages (el sitio) y Google Firebase (la base de datos). Solo si los usas: YouTube (el video al compartir la app), Stripe (si nos invitas un café), y Cloudflare y Gmail (los correos a hola@juegosdesalon.cl).',
          'Nosotros no guardamos tu dirección IP, no vendemos datos y no usamos analítica de otras empresas.',
        ],
      },
      { h: '🧒 Niñas y niños', p: ['Los juegos son para todo público y no piden datos para jugar. Si eres menor de edad, usa un apodo y pídele permiso a un adulto antes de dejar tu correo. Si eres madre, padre o tutor y quieres que borremos algo, escríbenos.'] },
      {
        h: '✋ Tus derechos',
        p: [
          'Puedes pedirnos ver, corregir o borrar tus datos, u oponerte a que los usemos. Escribe a hola@juegosdesalon.cl con tu nombre en el ranking o el código de tu copa; nunca te pediremos tu PIN. Te respondemos en un plazo de 30 días.',
          'Escribimos esta página siguiendo la Ley 21.719 de Chile y el Reglamento General de Protección de Datos (RGPD) de Europa. Si no quedas conforme, puedes reclamar ante la autoridad de protección de datos de tu país.',
        ],
      },
    ],
    who: 'Responsable: Juegos de Salón (juegosdesalon.cl), hola@juegosdesalon.cl.',
    updated: 'Actualizada el 22 de noviembre de 2026.',
  },
  en: {
    title: 'Privacy',
    lead: 'Parlor Games (juegosdesalon.cl) is played with no account, no ads and no tracking cookies. Here is the little we keep, what for, where and for how long.',
    sections: [
      { h: '📱 On your phone', p: ['Your browser keeps the language, the sound, your favorites, the game in progress, your scores, the games you played and the names you typed on your phone, so you don\'t have to repeat them. They are not cookies, and they go away when you clear this site\'s data in the browser. If you play without signal, it also keeps a copy of the games so you can play them offline, and the scores still to upload (up to 200, for 30 days), deleted once uploaded.', 'For each cup you opened with signal it keeps a copy (the table and the results at that moment) so you can play a pending day offline; that result waits on your phone until it uploads or its day closes, and the copy is deleted when you leave the cup.', 'For your badges it also keeps how many games you finished early in the morning or at night, each day of the last 60, how many times in a row you played the same game, which days you played, the first day you finished each game, which weekends you played on Saturday and Sunday, which Mondays you played before 8, and whether you played on some special dates. It never leaves your phone.'] },
      {
        h: '☁️ In our database',
        p: ['We use Google\'s Firebase, in the United States. We keep only this:'],
        items: [
          'Rooms to play with others: the name or nickname you type and the moves. They are deleted when everyone leaves or, if not, in the days after the room closes.',
          'The Cup: your name or nickname, your results and your 4-digit PIN, stored as a fingerprint (hash) nobody can read. So nobody can guess your PIN, we keep each player\'s last attempt. Whoever created the Cup can delete it; otherwise, two years after it ends it moves to a closed archive only we can read. The reactions and comments you leave in a Cup are seen by its players and deleted when the Cup ends.',
          'Leaderboards and One a Day, if you sign in with a name and PIN: your name, your country, your scores, the days you played and how many games you finished of each one. The name, the country and the scores show on the leaderboards. They are kept while the game exists or until you ask us to delete them.',
          'Duels, if you challenge someone or are challenged: both names, the game, the format, when you began each round and your results. Anyone with the duel’s link can see them, and they show in the list of recent duels on the Duels page, and they are kept while the game exists or until you ask us to delete them.',
          'Whoever taps your name on a leaderboard sees your badges, your streak, your games, since when you play and your place in your most played games.',
          'If you signed in with your name, we keep the days you open your profile, what you use there and whether you signed in or created your account from it, to see how it is used. Only we see it.',
          'So you don\'t type your PIN every time, we keep an anonymous number for each device you sign in on, and the last PIN attempt, to stop anyone trying to guess it. If you invite someone to One a Day, we note that they came through your invitation. If a name is offensive, we may change it; the scores and the PIN stay.',
          'Usage statistics, to know what gets played and what breaks: daily counts (game, language, hour, device and rough screen size, the site and the link you came from and the country, from the time zone), a random number from your browser to count who comes back and to which games, the names typed in each game, which of the site\'s announcements you saw with that name, and errors with browser and version. The names are deleted after 24 months; the counts stay.',
          'Phone notifications, if you turn them on: the notification address your browser gives, the language, the time zone, the notifications you asked for and the last One a Day season whose recap you already saw, so we do not tell you what you already know. They are deleted when you turn them off or when the browser expires them.',
          'Suggestions and comments: what you write, your name or nickname if you give one, the page and the version. We copy them to the project\'s task list on GitHub, which is public, with your name hidden except the first letter of each word and without your email, so don\'t write personal details there. They have no deletion date yet.',
          'If you propose a clue in Cryptic, the name you choose to sign it with shows in full on GitHub and, if we publish it, next to the clue in the game, with your player code if you signed in (so you do not get your own clue that day).',
          'Your email, if you leave it with a suggestion or write to us at hola@juegosdesalon.cl: only to reply to you, and it is never published. We delete it once we reply or, if there was no reply, after 90 days.',
        ],
      },
      {
        h: '🤝 Who else sees them',
        p: [
          'We have no servers of our own. These services see your IP address in order to deliver the site, under their own privacy rules: GitHub Pages (the site) and Google Firebase (the database). Only if you use them: YouTube (the video when sharing the app), Stripe (if you buy us a coffee), and Cloudflare and Gmail (emails to hola@juegosdesalon.cl).',
          'We don\'t keep your IP address, we don\'t sell data and we don\'t use other companies\' analytics.',
        ],
      },
      { h: '🧒 Children', p: ['The games are for everyone and ask for no data to play. If you are a minor, use a nickname and ask an adult before leaving your email. If you are a parent or guardian and want us to delete something, write to us.'] },
      {
        h: '✋ Your rights',
        p: [
          'You can ask us to see, correct or delete your data, or object to our using it. Write to hola@juegosdesalon.cl with your leaderboard name or your Cup\'s code; we will never ask for your PIN. We answer within 30 days.',
          'We wrote this page following Chile\'s Law 21.719 and Europe\'s General Data Protection Regulation (GDPR). If you are not satisfied, you can complain to the data protection authority of your country.',
        ],
      },
    ],
    who: 'Controller: Juegos de Salón (juegosdesalon.cl), hola@juegosdesalon.cl.',
    updated: 'Updated on November 22, 2026.',
  },
  pt: {
    title: 'Privacidade',
    lead: 'O Jogos de Salão (juegosdesalon.cl) se joga sem conta, sem anúncios e sem cookies de rastreamento. Aqui está o pouco que guardamos, para quê, onde e por quanto tempo.',
    sections: [
      { h: '📱 No seu celular', p: ['Seu navegador guarda no celular o idioma, o som, seus favoritos, a partida em andamento, suas pontuações, os jogos que você já jogou e os nomes que você digitou, para você não ter que repetir. Não são cookies, e somem quando você apaga os dados deste site no navegador. Se você joga sem sinal, guarda também uma cópia dos jogos para jogá-los sem sinal, e as pontuações das partidas que faltam enviar (até 200, por 30 dias); somem ao serem enviadas.', 'De cada copa que você abriu com sinal guarda uma cópia (a tabela e os resultados daquele momento) para jogar sem sinal um dia pendente; esse resultado espera no celular até ser enviado ou até o dia fechar, e a cópia some ao sair da copa.', 'Para suas conquistas guarda também quantos jogos você terminou de madrugada ou à noite, cada dia dos últimos 60, quantas vezes seguidas você jogou o mesmo jogo, em quais dias jogou, o primeiro dia em que terminou cada jogo, em quais fins de semana jogou sábado e domingo, em quais segundas jogou antes das 8 e se jogou em algumas datas especiais. Isso não sai do celular.'] },
      {
        h: '☁️ No nosso banco de dados',
        p: ['Usamos o Firebase, do Google, nos Estados Unidos. Guardamos só isto:'],
        items: [
          'Salas para jogar com outras pessoas: o nome ou apelido que você digita e as jogadas. São apagadas quando todos saem ou, se não, nos dias seguintes ao fechamento da sala.',
          'A Copa: seu nome ou apelido, seus resultados e seu PIN de 4 dígitos, guardado como uma impressão digital (hash) que ninguém consegue ler. Para que ninguém adivinhe seu PIN, guardamos a última tentativa de cada jogador. Quem a criou pode apagá-la; senão, dois anos depois de terminar ela passa para um arquivo fechado que só nós podemos ler. As reações e comentários que você deixa numa copa são vistos pelos jogadores dela e somem quando a copa termina.',
          'Rankings e Um por dia, se você entra com nome e PIN: seu nome, seu país, suas pontuações, os dias que jogou e quantas partidas terminou de cada jogo. O nome, o país e as pontuações aparecem nos rankings. São guardados enquanto o jogo existir ou até você pedir para apagá-los.',
          'Duelos, se você desafia alguém ou é desafiado: os nomes dos dois, o jogo, o formato, quando você começou cada rodada e seus resultados. Qualquer pessoa com o link do duelo pode vê-los, e eles aparecem na lista de duelos recentes da página Duelos, e eles ficam guardados enquanto o jogo existir ou até você pedir para apagá-los.',
          'Quem toca no seu nome em um ranking vê suas conquistas, sua sequência, suas partidas, desde quando você joga e seu lugar nos jogos que mais joga.',
          'Se você entrou com seu nome, guardamos os dias em que abre seu perfil, o que usa nele e se entrou ou criou sua conta por ali, para ver como ele é usado. Só nós vemos isso.',
          'Para não pedir seu PIN toda vez, guardamos um número anônimo de cada aparelho onde você entra, e a última tentativa de PIN, para frear quem tente adivinhá-lo. Se você convida alguém para o Um por dia, anotamos que a pessoa chegou pelo seu convite. Se um nome for ofensivo, podemos trocá-lo; as pontuações e o PIN continuam.',
          'Estatísticas de uso, para saber o que se joga e o que falha: contagens por dia (jogo, idioma, hora, aparelho e tamanho aproximado da tela, o site e o link de onde você veio e o país, pelo fuso horário), um número aleatório do seu navegador para contar quem volta e para quais jogos, os nomes digitados em cada partida, quais anúncios do site você viu com esse nome e os erros, com navegador e versão. Os nomes são apagados após 24 meses; as contagens ficam.',
          'Avisos no celular, se você ativar: o endereço de avisos que seu navegador dá, o idioma, o fuso horário, os avisos que você pediu e a última temporada do Um por dia cujo resumo você já viu, para não avisar o que você já sabe. São apagados quando você os desativa ou quando expiram no navegador.',
          'Sugestões e comentários: o que você escreve, seu nome ou apelido se você puser, a página e a versão. Copiamos para a lista de tarefas do projeto no GitHub, que é pública, com seu nome oculto, menos a primeira letra de cada palavra e sem seu e-mail, então não escreva ali dados pessoais. Ainda não têm data para serem apagados.',
          'Se você propuser uma pista no Críptico, o nome que você escolher para assiná-la aparece completo no GitHub e, se a publicarmos, junto da pista no jogo, com o código do seu jogador se você entrou (para que nesse dia não caia a sua própria pista).',
          'Seu e-mail, se você deixar numa sugestão ou nos escrever em hola@juegosdesalon.cl: só para te responder, e nunca é publicado. Apagamos ao responder ou, se não houver resposta, depois de 90 dias.',
        ],
      },
      {
        h: '🤝 Quem mais vê',
        p: [
          'Não temos servidores próprios. Estes serviços veem seu endereço IP para entregar o site, com as próprias regras de privacidade: GitHub Pages (o site) e Google Firebase (o banco de dados). Só se você usar: YouTube (o vídeo ao compartilhar o app), Stripe (se você nos pagar um café), e Cloudflare e Gmail (os e-mails para hola@juegosdesalon.cl).',
          'Nós não guardamos seu endereço IP, não vendemos dados e não usamos análises de outras empresas.',
        ],
      },
      { h: '🧒 Crianças', p: ['Os jogos são para todas as idades e não pedem dados para jogar. Se você é menor de idade, use um apelido e peça permissão a um adulto antes de deixar seu e-mail. Se você é mãe, pai ou responsável e quer que a gente apague algo, escreva para nós.'] },
      {
        h: '✋ Seus direitos',
        p: [
          'Você pode nos pedir para ver, corrigir ou apagar seus dados, ou se opor a que os usemos. Escreva para hola@juegosdesalon.cl com seu nome no ranking ou o código da sua copa; nunca vamos pedir seu PIN. Respondemos em até 30 dias.',
          'Escrevemos esta página seguindo a Lei 21.719 do Chile e o Regulamento Geral de Proteção de Dados (RGPD) da Europa. Se não ficar satisfeito, você pode reclamar à autoridade de proteção de dados do seu país.',
        ],
      },
    ],
    who: 'Responsável: Juegos de Salón (juegosdesalon.cl), hola@juegosdesalon.cl.',
    updated: 'Atualizada em 22 de novembro de 2026.',
  },
};
