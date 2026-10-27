/**
 * The privacy page's texts, in the four languages (D-463, C-3). What it says has to match what the
 * code keeps: when a change stores something new, or keeps it for a different time, it edits this
 * page in the same PR. `texts.test.mjs` checks that the four languages have the same shape and
 * that the 90 days are the ones the feedback job applies.
 *
 * Each section is a heading, paragraphs (`p`) and an optional list (`items`). The contact address
 * becomes a link when drawn.
 */
export const CONTACT = 'hola@juegosdesalon.cl';
export const UPDATED = '2026-10-27';

export const TEXTS = {
  es: {
    title: 'Privacidad',
    lead: 'Juegos de Salón (juegosdesalon.cl) se juega sin cuenta, sin publicidad y sin cookies de seguimiento. Aquí está lo poco que guardamos, para qué, dónde y por cuánto tiempo.',
    sections: [
      { h: '📱 En tu celular', p: ['Tu navegador guarda en el celular el idioma, el sonido, tus favoritos, la partida en curso, tus puntajes y los nombres que escribiste, para que no tengas que repetirlos. No son cookies y se borran al borrar los datos de este sitio en el navegador.'] },
      {
        h: '☁️ En nuestra base de datos',
        p: ['Usamos Firebase, de Google, en Estados Unidos. Guardamos solo esto:'],
        items: [
          'Salas para jugar con otros: el nombre o apodo que escribes y las jugadas. Se borran cuando todos salen o, si no, en los días siguientes a que la sala se cierra.',
          'La Copa: tu nombre o apodo, tus resultados y tu PIN de 4 cifras, guardado como una huella (hash) que nadie puede leer. Queda guardada hasta que quien la creó la borra.',
          'Rankings y Uno al día, si entras con nombre y PIN: tu nombre, tu país, tus puntajes y los días que jugaste. El nombre, el país y los puntajes se ven en los rankings. Se guardan mientras exista el juego o hasta que nos pidas borrarlos.',
          'Estadísticas de uso, para saber qué se juega y qué falla: conteos por día (juego, idioma, hora, tipo de aparato, el sitio desde donde llegaste y el país, que sale del huso horario), un número al azar de tu navegador para contar quién vuelve, los nombres escritos en cada partida y los errores, con el navegador y su versión. Todavía no tienen fecha de borrado.',
          'Avisos al celular, si los activas: la dirección de avisos que da tu navegador, el idioma, el huso horario y los avisos que pediste. Se borran al desactivarlos o cuando el navegador los da por vencidos.',
          'Sugerencias y comentarios: lo que escribes, tu nombre o apodo si lo pones, la página y la versión. Los copiamos a la lista de tareas del proyecto en GitHub, que es pública, con tu nombre tapado salvo la primera letra de cada palabra y sin tu correo, así que no escribas ahí datos personales. Todavía no tienen fecha de borrado.',
          'Tu correo, si lo dejas en una sugerencia: solo para responderte, y nunca se publica. Lo borramos al responderte o, si no hubo respuesta, a los 90 días.',
        ],
      },
      {
        h: '🤝 Quién más los ve',
        p: [
          'No tenemos servidores propios. Estos servicios ven tu dirección IP para entregarte el sitio, con sus propias reglas de privacidad: GitHub Pages (el sitio), Google Firebase (la base de datos) y Google Fonts (las letras). Solo si los usas: YouTube (el video al compartir la app), Stripe (si nos invitas un café), y Cloudflare y Gmail (los correos a hola@juegosdesalon.cl).',
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
    updated: 'Actualizada el 27 de octubre de 2026.',
  },
  en: {
    title: 'Privacy',
    lead: 'Juegos de Salón (juegosdesalon.cl) is played with no account, no ads and no tracking cookies. Here is the little we keep, what for, where and for how long.',
    sections: [
      { h: '📱 On your phone', p: ['Your browser keeps the language, the sound, your favorites, the game in progress, your scores and the names you typed on your phone, so you don\'t have to repeat them. They are not cookies, and they go away when you clear this site\'s data in the browser.'] },
      {
        h: '☁️ In our database',
        p: ['We use Google\'s Firebase, in the United States. We keep only this:'],
        items: [
          'Rooms to play with others: the name or nickname you type and the moves. They are deleted when everyone leaves or, if not, in the days after the room closes.',
          'The Cup: your name or nickname, your results and your 4-digit PIN, stored as a fingerprint (hash) nobody can read. It stays until whoever created the Cup deletes it.',
          'Leaderboards and One a Day, if you sign in with a name and PIN: your name, your country, your scores and the days you played. The name, the country and the scores show on the leaderboards. They are kept while the game exists or until you ask us to delete them.',
          'Usage statistics, to know what gets played and what breaks: daily counts (game, language, hour, kind of device, the site you came from and the country, taken from the time zone), a random number from your browser to count who comes back, the names typed in each game, and errors with the browser and its version. They have no deletion date yet.',
          'Phone notifications, if you turn them on: the notification address your browser gives, the language, the time zone and the notifications you asked for. They are deleted when you turn them off or when the browser expires them.',
          'Suggestions and comments: what you write, your name or nickname if you give one, the page and the version. We copy them to the project\'s task list on GitHub, which is public, with your name hidden except the first letter of each word and without your email, so don\'t write personal details there. They have no deletion date yet.',
          'Your email, if you leave it with a suggestion: only to reply to you, and it is never published. We delete it once we reply or, if there was no reply, after 90 days.',
        ],
      },
      {
        h: '🤝 Who else sees them',
        p: [
          'We have no servers of our own. These services see your IP address in order to deliver the site, under their own privacy rules: GitHub Pages (the site), Google Firebase (the database) and Google Fonts (the lettering). Only if you use them: YouTube (the video when sharing the app), Stripe (if you buy us a coffee), and Cloudflare and Gmail (emails to hola@juegosdesalon.cl).',
          'We don\'t keep your IP address, we don\'t sell data and we don\'t use other companies\' analytics.',
        ],
      },
      { h: '🧒 Children', p: ['The games are for everyone and ask for no data to play. If you are under age, use a nickname and ask an adult before leaving your email. If you are a parent or guardian and want us to delete something, write to us.'] },
      {
        h: '✋ Your rights',
        p: [
          'You can ask us to see, correct or delete your data, or object to our using it. Write to hola@juegosdesalon.cl with your leaderboard name or your Cup\'s code; we will never ask for your PIN. We answer within 30 days.',
          'We wrote this page following Chile\'s Law 21.719 and Europe\'s General Data Protection Regulation (GDPR). If you are not satisfied, you can complain to the data protection authority of your country.',
        ],
      },
    ],
    who: 'Controller: Juegos de Salón (juegosdesalon.cl), hola@juegosdesalon.cl.',
    updated: 'Updated on October 27, 2026.',
  },
  pt: {
    title: 'Privacidade',
    lead: 'O Juegos de Salón (juegosdesalon.cl) se joga sem conta, sem anúncios e sem cookies de rastreamento. Aqui está o pouco que guardamos, para quê, onde e por quanto tempo.',
    sections: [
      { h: '📱 No seu celular', p: ['Seu navegador guarda no celular o idioma, o som, seus favoritos, a partida em andamento, suas pontuações e os nomes que você digitou, para você não ter que repetir. Não são cookies, e somem quando você apaga os dados deste site no navegador.'] },
      {
        h: '☁️ No nosso banco de dados',
        p: ['Usamos o Firebase, do Google, nos Estados Unidos. Guardamos só isto:'],
        items: [
          'Salas para jogar com outras pessoas: o nome ou apelido que você digita e as jogadas. São apagadas quando todos saem ou, se não, nos dias seguintes ao fechamento da sala.',
          'A Copa: seu nome ou apelido, seus resultados e seu PIN de 4 dígitos, guardado como uma impressão (hash) que ninguém consegue ler. Fica guardada até quem a criou apagá-la.',
          'Rankings e Um por dia, se você entra com nome e PIN: seu nome, seu país, suas pontuações e os dias que jogou. O nome, o país e as pontuações aparecem nos rankings. São guardados enquanto o jogo existir ou até você pedir para apagá-los.',
          'Estatísticas de uso, para saber o que se joga e o que falha: contagens por dia (jogo, idioma, hora, tipo de aparelho, o site de onde você veio e o país, que sai do fuso horário), um número aleatório do seu navegador para contar quem volta, os nomes digitados em cada partida e os erros, com o navegador e a versão dele. Ainda não têm data para serem apagadas.',
          'Avisos no celular, se você ativar: o endereço de avisos que seu navegador dá, o idioma, o fuso horário e os avisos que você pediu. São apagados quando você os desativa ou quando o navegador os dá por vencidos.',
          'Sugestões e comentários: o que você escreve, seu nome ou apelido se você puser, a página e a versão. Copiamos para a lista de tarefas do projeto no GitHub, que é pública, com seu nome coberto menos a primeira letra de cada palavra e sem seu e-mail, então não escreva ali dados pessoais. Ainda não têm data para serem apagados.',
          'Seu e-mail, se você deixar numa sugestão: só para te responder, e nunca é publicado. Apagamos ao responder ou, se não houver resposta, depois de 90 dias.',
        ],
      },
      {
        h: '🤝 Quem mais vê',
        p: [
          'Não temos servidores próprios. Estes serviços veem seu endereço IP para entregar o site, com as próprias regras de privacidade: GitHub Pages (o site), Google Firebase (o banco de dados) e Google Fonts (as letras). Só se você usar: YouTube (o vídeo ao compartilhar o app), Stripe (se você nos pagar um café), e Cloudflare e Gmail (os e-mails para hola@juegosdesalon.cl).',
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
    updated: 'Atualizada em 27 de outubro de 2026.',
  },
  de: {
    title: 'Datenschutz',
    lead: 'Juegos de Salón (juegosdesalon.cl) spielst du ohne Konto, ohne Werbung und ohne Tracking-Cookies. Hier steht das Wenige, das wir speichern, wozu, wo und wie lange.',
    sections: [
      { h: '📱 Auf deinem Handy', p: ['Dein Browser speichert auf dem Handy die Sprache, den Ton, deine Favoriten, das laufende Spiel, deine Punkte und die Namen, die du eingegeben hast, damit du sie nicht wiederholen musst. Das sind keine Cookies, und sie verschwinden, wenn du die Daten dieser Seite im Browser löschst.'] },
      {
        h: '☁️ In unserer Datenbank',
        p: ['Wir nutzen Firebase von Google, in den USA. Wir speichern nur das:'],
        items: [
          'Räume, um mit anderen zu spielen: den Namen oder Spitznamen, den du eingibst, und die Züge. Sie werden gelöscht, wenn alle gehen, sonst in den Tagen, nachdem der Raum schließt.',
          'Der Pokal: deinen Namen oder Spitznamen, deine Ergebnisse und deine 4-stellige PIN, gespeichert als Fingerabdruck (Hash), den niemand lesen kann. Er bleibt, bis die Person, die ihn erstellt hat, ihn löscht.',
          'Ranglisten und Spiel des Tages, wenn du dich mit Namen und PIN anmeldest: deinen Namen, dein Land, deine Punkte und die Tage, an denen du gespielt hast. Name, Land und Punkte stehen in den Ranglisten. Sie bleiben, solange es das Spiel gibt oder bis du uns bittest, sie zu löschen.',
          'Nutzungsstatistik, um zu wissen, was gespielt wird und was nicht klappt: Zählungen pro Tag (Spiel, Sprache, Uhrzeit, Art des Geräts, die Seite, von der du kamst, und das Land, das aus der Zeitzone kommt), eine Zufallszahl deines Browsers, um zu zählen, wer wiederkommt, die Namen in jedem Spiel und Fehler mit dem Browser und seiner Version. Für sie gibt es noch kein Löschdatum.',
          'Benachrichtigungen aufs Handy, wenn du sie einschaltest: die Benachrichtigungsadresse deines Browsers, die Sprache, die Zeitzone und die Benachrichtigungen, die du wolltest. Sie werden gelöscht, wenn du sie ausschaltest oder der Browser sie verfallen lässt.',
          'Vorschläge und Kommentare: was du schreibst, deinen Namen oder Spitznamen, wenn du einen angibst, die Seite und die Version. Wir kopieren sie in die Aufgabenliste des Projekts auf GitHub, die öffentlich ist, mit deinem Namen verdeckt bis auf den ersten Buchstaben jedes Worts und ohne deine E-Mail, also schreib dort nichts Persönliches. Für sie gibt es noch kein Löschdatum.',
          'Deine E-Mail, wenn du sie bei einem Vorschlag angibst: nur, um dir zu antworten, und sie wird nie veröffentlicht. Wir löschen sie nach der Antwort oder, falls keine kommt, nach 90 Tagen.',
        ],
      },
      {
        h: '🤝 Wer sie noch sieht',
        p: [
          'Wir haben keine eigenen Server. Diese Dienste sehen deine IP-Adresse, um dir die Seite auszuliefern, nach ihren eigenen Datenschutzregeln: GitHub Pages (die Seite), Google Firebase (die Datenbank) und Google Fonts (die Schriften). Nur wenn du sie nutzt: YouTube (das Video beim Teilen der App), Stripe (wenn du uns einen Kaffee spendierst), sowie Cloudflare und Gmail (E-Mails an hola@juegosdesalon.cl).',
          'Wir speichern deine IP-Adresse nicht, verkaufen keine Daten und nutzen keine Analyse anderer Firmen.',
        ],
      },
      { h: '🧒 Kinder', p: ['Die Spiele sind für alle und fragen zum Spielen nach keinen Daten. Wenn du minderjährig bist, nimm einen Spitznamen und frag einen Erwachsenen, bevor du deine E-Mail angibst. Wenn du Elternteil oder Vormund bist und willst, dass wir etwas löschen, schreib uns.'] },
      {
        h: '✋ Deine Rechte',
        p: [
          'Du kannst verlangen, deine Daten zu sehen, zu berichtigen oder zu löschen, oder ihrer Nutzung widersprechen. Schreib an hola@juegosdesalon.cl mit deinem Namen in der Rangliste oder dem Code deines Pokals; nach deiner PIN fragen wir nie. Wir antworten innerhalb von 30 Tagen.',
          'Wir haben diese Seite nach dem chilenischen Gesetz 21.719 und der europäischen Datenschutz-Grundverordnung (DSGVO) geschrieben. Wenn du nicht zufrieden bist, kannst du dich bei der Datenschutzbehörde deines Landes beschweren.',
        ],
      },
    ],
    who: 'Verantwortlich: Juegos de Salón (juegosdesalon.cl), hola@juegosdesalon.cl.',
    updated: 'Aktualisiert am 27. Oktober 2026.',
  },
};
