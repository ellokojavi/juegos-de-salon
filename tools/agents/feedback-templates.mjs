/**
 * The email reply to a player's feedback (D-317, owner's request): written in the language the
 * feedback was written in, friendly and grateful, built from one of ten openings per language,
 * all short (the owner's rule: people read less and less, so the whole email stays brief). The
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
      'Gracias por escribirnos.',
      'Gracias por tu comentario.',
      'Qué bueno que nos escribiste.',
      'Gracias por contarnos.',
      'Leímos tu comentario, gracias.',
      'Gracias por jugar y escribirnos.',
      'Nos alegra tu mensaje.',
      'Te debíamos una respuesta.',
      'Gracias por ayudarnos a mejorar.',
      'Tu comentario nos sirvió mucho.',
    ],
    openingsMany: [
      'Gracias por escribirnos.',
      'Gracias por tus comentarios.',
      'Qué bueno que nos escribiste.',
      'Gracias por contarnos tanto.',
      'Leímos tus comentarios, gracias.',
      'Gracias por jugar y escribirnos.',
      'Nos alegran tus mensajes.',
      'Te debíamos unas respuestas.',
      'Gracias por ayudarnos a mejorar.',
      'Tus comentarios nos sirvieron mucho.',
    ],
    closing: "¿Otra idea? Responde este correo.",
    signature: 'El equipo de Juegos de Salón',
  },
  en: {
    subject: 'About your comment on Juegos de Salón',
    subjectMany: 'About your comments on Juegos de Salón',
    quoted: t => `"${t}"`,
    greeting: n => (n ? `Hi ${n},` : 'Hi,'),
    openings: [
      'Thanks for writing to us.',
      'Thanks for your comment.',
      'So glad you wrote.',
      'Thanks for telling us.',
      'We read your comment, thank you.',
      'Thanks for playing and writing.',
      'Your message made our day.',
      'We owed you a reply.',
      'Thanks for helping us improve.',
      'Your comment helped a lot.',
    ],
    openingsMany: [
      'Thanks for writing to us.',
      'Thanks for your comments.',
      'So glad you wrote.',
      'Thanks for telling us so much.',
      'We read your comments, thank you.',
      'Thanks for playing and writing.',
      'Your messages made our day.',
      'We owed you some replies.',
      'Thanks for helping us improve.',
      'Your comments helped a lot.',
    ],
    closing: "Another idea? Just reply to this email.",
    signature: 'The Juegos de Salón team',
  },
  pt: {
    subject: 'Sobre o seu comentário no Juegos de Salón',
    subjectMany: 'Sobre os seus comentários no Juegos de Salón',
    quoted: t => `"${t}"`,
    greeting: n => (n ? `Olá, ${n}!` : 'Olá!'),
    openings: [
      'Obrigado por escrever.',
      'Obrigado pelo comentário.',
      'Que bom que você escreveu.',
      'Obrigado por contar.',
      'Lemos seu comentário, obrigado.',
      'Obrigado por jogar e escrever.',
      'Sua mensagem nos alegrou.',
      'Te devíamos uma resposta.',
      'Obrigado por nos ajudar a melhorar.',
      'Seu comentário ajudou muito.',
    ],
    openingsMany: [
      'Obrigado por escrever.',
      'Obrigado pelos comentários.',
      'Que bom que você escreveu.',
      'Obrigado por contar tanto.',
      'Lemos seus comentários, obrigado.',
      'Obrigado por jogar e escrever.',
      'Suas mensagens nos alegraram.',
      'Te devíamos umas respostas.',
      'Obrigado por nos ajudar a melhorar.',
      'Seus comentários ajudaram muito.',
    ],
    closing: "Outra ideia? Responda este e-mail.",
    signature: 'A equipe do Juegos de Salón',
  },
  de: {
    subject: 'Zu deinem Kommentar bei Juegos de Salón',
    subjectMany: 'Zu deinen Kommentaren bei Juegos de Salón',
    quoted: t => `„${t}“`,
    greeting: n => (n ? `Hallo ${n},` : 'Hallo,'),
    openings: [
      'Danke, dass du uns schreibst.',
      'Danke für deinen Kommentar.',
      'Schön, dass du geschrieben hast.',
      'Danke, dass du es uns sagst.',
      'Wir haben deinen Kommentar gelesen, danke.',
      'Danke fürs Spielen und Schreiben.',
      'Deine Nachricht hat uns gefreut.',
      'Wir schulden dir eine Antwort.',
      'Danke, dass du uns hilfst.',
      'Dein Kommentar hat uns sehr geholfen.',
    ],
    openingsMany: [
      'Danke, dass du uns schreibst.',
      'Danke für deine Kommentare.',
      'Schön, dass du geschrieben hast.',
      'Danke, dass du uns so viel sagst.',
      'Wir haben deine Kommentare gelesen, danke.',
      'Danke fürs Spielen und Schreiben.',
      'Deine Nachrichten haben uns gefreut.',
      'Wir schulden dir ein paar Antworten.',
      'Danke, dass du uns hilfst.',
      'Deine Kommentare haben uns sehr geholfen.',
    ],
    closing: "Noch eine Idee? Antworte einfach auf diese E-Mail.",
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
