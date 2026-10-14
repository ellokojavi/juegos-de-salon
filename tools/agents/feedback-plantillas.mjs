/**
 * The email reply to a player's feedback (D-317, owner's request): written in the language the
 * feedback was written in, friendly and grateful, built from one of ten openings per language. The
 * processes agent only writes the specific answer (what was done, or why not); the greeting, the
 * opening, the closing and the subject come from here. Neutral language (no local slang) and no
 * dashes as punctuation. Tested by feedback-plantillas.test.mjs.
 */

export const PLANTILLAS = {
  es: {
    asunto: 'Sobre tu comentario en Juegos de Salón',
    saludo: n => (n ? `Hola, ${n}:` : 'Hola:'),
    aperturas: [
      'Te diste el tiempo de comentar algo sobre Juegos de Salón, así que te debíamos una respuesta.',
      'Gracias por escribirnos. Cada comentario nos ayuda a que los juegos queden mejor, y el tuyo no fue la excepción.',
      'Leímos tu comentario con mucha atención y queríamos contarte qué hicimos con él.',
      'Qué bueno que nos escribiste. Los comentarios de quienes juegan son lo que más nos sirve.',
      'Tu comentario llegó y lo revisamos. Muchas gracias por ayudarnos a mejorar.',
      'Gracias por jugar y, sobre todo, por contarnos qué te pareció.',
      'Nos alegra mucho recibir mensajes como el tuyo. Aquí va nuestra respuesta.',
      'Te prometimos una respuesta, y aquí está.',
      'Muchas gracias por tu comentario. Nos encanta saber cómo se viven los juegos del otro lado de la pantalla.',
      'Detrás de cada cambio en Juegos de Salón hay alguien que se tomó un minuto para escribir, como tú. Gracias.',
    ],
    cierre: 'Si se te ocurre algo más, el botón 🐞 sigue ahí. ¡Que sigas disfrutando los juegos!',
    firma: 'El equipo de Juegos de Salón',
  },
  en: {
    asunto: 'About your comment on Juegos de Salón',
    saludo: n => (n ? `Hi ${n},` : 'Hi,'),
    aperturas: [
      'You took the time to tell us something about Juegos de Salón, so we owed you a reply.',
      'Thanks for writing to us. Every comment helps us make the games better, and yours was no exception.',
      'We read your comment carefully and wanted to tell you what we did with it.',
      "We're really glad you wrote. Comments from the people who play are what helps us most.",
      'Your comment arrived and we looked into it. Thank you so much for helping us improve.',
      'Thanks for playing and, above all, for telling us what you thought.',
      "It makes our day to get messages like yours. Here's our reply.",
      'We promised you a reply, and here it is.',
      'Thank you so much for your comment. We love hearing how the games feel on the other side of the screen.',
      'Behind every change in Juegos de Salón there is someone who took a minute to write, just like you. Thank you.',
    ],
    cierre: "If anything else comes to mind, the 🐞 button is still there. Enjoy the games!",
    firma: 'The Juegos de Salón team',
  },
  pt: {
    asunto: 'Sobre o seu comentário no Juegos de Salón',
    saludo: n => (n ? `Olá, ${n}!` : 'Olá!'),
    aperturas: [
      'Você tirou um tempo para comentar algo sobre o Juegos de Salón, então lhe devíamos uma resposta.',
      'Obrigado por nos escrever. Cada comentário nos ajuda a melhorar os jogos, e o seu não foi exceção.',
      'Lemos o seu comentário com muita atenção e queríamos contar o que fizemos com ele.',
      'Que bom que você nos escreveu. Os comentários de quem joga são o que mais nos ajuda.',
      'O seu comentário chegou e nós o analisamos. Muito obrigado por nos ajudar a melhorar.',
      'Obrigado por jogar e, principalmente, por nos contar o que achou.',
      'Ficamos muito felizes ao receber mensagens como a sua. Aqui vai a nossa resposta.',
      'Prometemos uma resposta, e aqui está ela.',
      'Muito obrigado pelo seu comentário. Adoramos saber como os jogos são vividos do outro lado da tela.',
      'Por trás de cada mudança no Juegos de Salón há alguém que tirou um minuto para escrever, como você. Obrigado.',
    ],
    cierre: 'Se pensar em mais alguma coisa, o botão 🐞 continua lá. Continue aproveitando os jogos!',
    firma: 'A equipe do Juegos de Salón',
  },
  de: {
    asunto: 'Zu deinem Kommentar bei Juegos de Salón',
    saludo: n => (n ? `Hallo ${n},` : 'Hallo,'),
    aperturas: [
      'Du hast dir die Zeit genommen, uns etwas zu Juegos de Salón zu schreiben, also schulden wir dir eine Antwort.',
      'Danke, dass du uns geschrieben hast. Jeder Kommentar hilft uns, die Spiele besser zu machen, und deiner ganz besonders.',
      'Wir haben deinen Kommentar aufmerksam gelesen und möchten dir erzählen, was wir damit gemacht haben.',
      'Schön, dass du uns geschrieben hast. Die Rückmeldungen der Leute, die spielen, helfen uns am meisten.',
      'Dein Kommentar ist angekommen und wir haben ihn uns angeschaut. Vielen Dank, dass du uns hilfst, besser zu werden.',
      'Danke fürs Spielen und vor allem dafür, dass du uns erzählt hast, wie es dir gefallen hat.',
      'Über Nachrichten wie deine freuen wir uns sehr. Hier ist unsere Antwort.',
      'Wir haben dir eine Antwort versprochen, und hier ist sie.',
      'Vielen Dank für deinen Kommentar. Wir finden es toll zu erfahren, wie sich die Spiele auf der anderen Seite des Bildschirms anfühlen.',
      'Hinter jeder Änderung bei Juegos de Salón steckt jemand, der sich wie du eine Minute zum Schreiben genommen hat. Danke.',
    ],
    cierre: 'Wenn dir noch etwas einfällt, der 🐞-Knopf ist weiterhin da. Viel Spaß weiterhin beim Spielen!',
    firma: 'Das Team von Juegos de Salón',
  },
};

export const IDIOMAS = Object.keys(PLANTILLAS);

/**
 * The email: `idioma` is the feedback's language, `respuesta` the agent's specific answer, `nombre`
 * the name the player gave (if any), and `n` picks the opening (the issue number, so two replies in
 * a row don't open the same way).
 */
export function armarCorreo({ idioma, respuesta, nombre = '', n = 0 }) {
  const P = PLANTILLAS[idioma];
  if (!P) throw new Error(`No templates for "${idioma}": ${IDIOMAS.join(', ')}.`);
  const texto = String(respuesta || '').trim();
  if (!texto) throw new Error('The reply needs the specific answer.');
  const apertura = P.aperturas[((n % P.aperturas.length) + P.aperturas.length) % P.aperturas.length];
  return {
    asunto: P.asunto,
    texto: `${P.saludo(String(nombre || '').trim())}\n\n${apertura}\n\n${texto}\n\n${P.cierre}\n\n${P.firma}\nhttps://juegosdesalon.cl/\n`,
  };
}
