/**
 * The email reply to a player's feedback (D-317, owner's request): written in the language the
 * feedback was written in, friendly and grateful, built from one of ten openings per language. The
 * processes agent only writes the specific answer (what was done, or why not); the greeting, the
 * opening, the closing and the subject come from here. Neutral language (no local slang) and no
 * dashes as punctuation. Tested by feedback-templates.test.mjs.
 */

export const TEMPLATES = {
  es: {
    subject: 'Sobre tu comentario en Juegos de Salón',
    subjectMany: 'Sobre tus comentarios en Juegos de Salón',
    quoted: t => `«${t}»`,
    greeting: n => (n ? `Hola, ${n}:` : 'Hola:'),
    openings: [
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
    openingsMany: [
      'Te diste el tiempo de dejarnos varios comentarios sobre Juegos de Salón, así que te debíamos una respuesta.',
      'Gracias por escribirnos más de una vez. Cada comentario nos ayuda a que los juegos queden mejor, y los tuyos no fueron la excepción.',
      'Leímos tus comentarios con mucha atención y queríamos contarte qué hicimos con cada uno.',
      'Qué bueno que nos escribiste. Los comentarios de quienes juegan son lo que más nos sirve, y nos dejaste varios.',
      'Tus comentarios llegaron y los revisamos uno por uno. Muchas gracias por ayudarnos a mejorar.',
      'Gracias por jugar y, sobre todo, por contarnos tanto sobre lo que te pareció.',
      'Nos alegra mucho recibir mensajes como los tuyos. Aquí van nuestras respuestas, todas juntas.',
      'Te prometimos responderte, y aquí van todas las respuestas en un solo correo.',
      'Muchas gracias por tus comentarios. Nos encanta saber cómo se viven los juegos del otro lado de la pantalla.',
      'Detrás de cada cambio en Juegos de Salón hay alguien que se tomó un minuto para escribir, y tú te tomaste varios. Gracias.',
    ],
    closing: 'Si se te ocurre algo más, el botón 🐞 sigue ahí. ¡Que sigas disfrutando los juegos!',
    signature: 'El equipo de Juegos de Salón',
  },
  en: {
    subject: 'About your comment on Juegos de Salón',
    subjectMany: 'About your comments on Juegos de Salón',
    quoted: t => `"${t}"`,
    greeting: n => (n ? `Hi ${n},` : 'Hi,'),
    openings: [
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
    openingsMany: [
      'You took the time to send us several comments about Juegos de Salón, so we owed you a reply.',
      'Thanks for writing to us more than once. Every comment helps us make the games better, and yours were no exception.',
      'We read your comments carefully and wanted to tell you what we did with each one.',
      "We're really glad you wrote. Comments from the people who play are what helps us most, and you left us several.",
      'Your comments arrived and we went through them one by one. Thank you so much for helping us improve.',
      'Thanks for playing and, above all, for telling us so much about what you thought.',
      "It makes our day to get messages like yours. Here are our replies, all together.",
      'We promised to get back to you, and here are all our replies in a single email.',
      'Thank you so much for your comments. We love hearing how the games feel on the other side of the screen.',
      'Behind every change in Juegos de Salón there is someone who took a minute to write, and you took several. Thank you.',
    ],
    closing: "If anything else comes to mind, the 🐞 button is still there. Enjoy the games!",
    signature: 'The Juegos de Salón team',
  },
  pt: {
    subject: 'Sobre o seu comentário no Juegos de Salón',
    subjectMany: 'Sobre os seus comentários no Juegos de Salón',
    quoted: t => `"${t}"`,
    greeting: n => (n ? `Olá, ${n}!` : 'Olá!'),
    openings: [
      'Você tirou um tempo para comentar algo sobre o Juegos de Salón, então te devíamos uma resposta.',
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
    openingsMany: [
      'Você tirou um tempo para nos deixar vários comentários sobre o Juegos de Salón, então te devíamos uma resposta.',
      'Obrigado por nos escrever mais de uma vez. Cada comentário nos ajuda a melhorar os jogos, e os seus não foram exceção.',
      'Lemos os seus comentários com muita atenção e queríamos contar o que fizemos com cada um.',
      'Que bom que você nos escreveu. Os comentários de quem joga são o que mais nos ajuda, e você nos deixou vários.',
      'Os seus comentários chegaram e nós os analisamos um por um. Muito obrigado por nos ajudar a melhorar.',
      'Obrigado por jogar e, principalmente, por nos contar tanta coisa sobre o que achou.',
      'Ficamos muito felizes ao receber mensagens como as suas. Aqui vão as nossas respostas, todas juntas.',
      'Prometemos te responder, e aqui estão todas as respostas em um só e-mail.',
      'Muito obrigado pelos seus comentários. Adoramos saber como os jogos são vividos do outro lado da tela.',
      'Por trás de cada mudança no Juegos de Salón há alguém que tirou um minuto para escrever, e você tirou vários. Obrigado.',
    ],
    closing: 'Se pensar em mais alguma coisa, o botão 🐞 continua lá. Continue aproveitando os jogos!',
    signature: 'A equipe do Juegos de Salón',
  },
  de: {
    subject: 'Zu deinem Kommentar bei Juegos de Salón',
    subjectMany: 'Zu deinen Kommentaren bei Juegos de Salón',
    quoted: t => `„${t}“`,
    greeting: n => (n ? `Hallo ${n},` : 'Hallo,'),
    openings: [
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
    openingsMany: [
      'Du hast dir die Zeit genommen, uns mehrere Kommentare zu Juegos de Salón zu schreiben, also schulden wir dir eine Antwort.',
      'Danke, dass du uns mehr als einmal geschrieben hast. Jeder Kommentar hilft uns, die Spiele besser zu machen, und deine ganz besonders.',
      'Wir haben deine Kommentare aufmerksam gelesen und möchten dir erzählen, was wir mit jedem davon gemacht haben.',
      'Schön, dass du uns geschrieben hast. Die Rückmeldungen der Leute, die spielen, helfen uns am meisten, und du hast uns gleich mehrere geschickt.',
      'Deine Kommentare sind angekommen und wir haben sie uns einzeln angeschaut. Vielen Dank, dass du uns hilfst, besser zu werden.',
      'Danke fürs Spielen und vor allem dafür, dass du uns so viel darüber erzählt hast, wie es dir gefallen hat.',
      'Über Nachrichten wie deine freuen wir uns sehr. Hier sind unsere Antworten, alle zusammen.',
      'Wir haben dir versprochen zu antworten, und hier sind alle Antworten in einer einzigen E-Mail.',
      'Vielen Dank für deine Kommentare. Wir finden es toll zu erfahren, wie sich die Spiele auf der anderen Seite des Bildschirms anfühlen.',
      'Hinter jeder Änderung bei Juegos de Salón steckt jemand, der sich eine Minute zum Schreiben genommen hat, und du hast dir gleich mehrere genommen. Danke.',
    ],
    closing: 'Wenn dir noch etwas einfällt, der 🐞-Knopf ist weiterhin da. Viel Spaß weiterhin beim Spielen!',
    signature: 'Das Team von Juegos de Salón',
  },
};

export const LANGUAGES = Object.keys(TEMPLATES);

/** What the player wrote, whole (owner's request: quotes are not cut), with their line breaks. */
export const quote = text => String(text || '').replace(/\u200b/g, '').split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');

const SITE = 'https://juegosdesalon.cl/';
/** The header: the menu card's icons and title, the same in every language (`og.mjs header`). */
export const HEADER = `${SITE}assets/email/header.jpg`;

const html = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const P_ = 'margin:0 0 16px';
const paragraphs = (t, style = P_) => String(t).split(/\n{2,}/).map(p => `<p style="${style}">${html(p).replace(/\n/g, '<br>')}</p>`).join('');
/** The quote in grey italics (owner's request), right above its answer. */
const QUOTE = 'margin:0 0 6px;color:#6b6b6b;font-style:italic';

/**
 * The email: `lang` is the feedback's language, `items` one `{ quote, answer }` per comment (what
 * the player wrote, and the agent's specific answer to it), `name` the name the player gave (if
 * any), and `n` picks the opening (the issue number, so two replies in a row don't open the same
 * way). One comment or several (a player who sent many in one sitting gets a single email,
 * owner's request): with several, the subject and the opening are plural. Each answer goes under
 * the whole quote of its comment. Returns the plain text and the HTML version: the site's card on
 * top, the quotes in grey italics. The email carries both.
 */
export function buildEmail({ lang, items, name = '', n = 0 }) {
  const T = TEMPLATES[lang];
  if (!T) throw new Error(`No templates for "${lang}": ${LANGUAGES.join(', ')}.`);
  const list = (items || []).map(x => ({ quote: quote(x.quote), answer: String(x.answer || '').trim() }));
  if (!list.length || list.some(x => !x.answer)) throw new Error('Each comment needs its specific answer.');
  const many = list.length > 1;
  const openings = many ? T.openingsMany : T.openings;
  const opening = openings[((n % openings.length) + openings.length) % openings.length];
  const greeting = T.greeting(String(name || '').trim());
  const subject = many ? T.subjectMany : T.subject;
  const body = list.map(x => (x.quote ? `${T.quoted(x.quote)}\n${x.answer}` : x.answer)).join('\n\n');
  const bodyHtml = list.map(x => `${x.quote ? `<p style="${QUOTE}">${html(T.quoted(x.quote)).replace(/\n/g, '<br>')}</p>` : ''}${paragraphs(x.answer, 'margin:0 0 22px')}`).join('');
  return {
    subject,
    text: `${greeting}\n\n${opening}\n\n${body}\n\n${T.closing}\n\n${T.signature}\n${SITE}\n`,
    // Tables and inline styles: what mail apps understand
    html: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(subject)}</title></head>
<body style="margin:0;padding:0;background:#efe9f7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe9f7"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td><a href="${SITE}"><img src="${HEADER}" width="560" alt="Juegos de Salón" style="display:block;width:100%;height:auto;border:0"></a></td></tr>
<tr><td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#222222">
${paragraphs(greeting)}${paragraphs(opening, 'margin:0 0 24px')}${bodyHtml}${paragraphs(T.closing)}
<p style="margin:0 0 24px">${html(T.signature)}<br><a href="${SITE}" style="color:#8a4dff;font-weight:bold;text-decoration:none">juegosdesalon.cl</a></p>
</td></tr></table>
</td></tr></table>
</body></html>`,
  };
}
