/**
 * The email reply to a player's feedback (D-317, owner's request): written in the language the
 * feedback was written in, friendly and grateful, built from one of ten openings per language, every one of
 * them a thank-you for the player's time (owner's request: an opening without one read dry),
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
      'Gracias por tu tiempo y por escribirnos.',
      'Gracias por darte el tiempo de escribirnos.',
      'Gracias por tu comentario y por tu tiempo.',
      'Gracias por contarnos, de verdad.',
      'Leímos tu comentario: gracias por tu tiempo.',
      'Gracias por jugar y por escribirnos.',
      'Gracias por tomarte el tiempo de escribir.',
      'Mil gracias por tu mensaje.',
      'Gracias por ayudarnos a mejorar.',
      'Gracias: tu comentario nos sirvió mucho.',
    ],
    openingsMany: [
      'Gracias por tu tiempo y por escribirnos.',
      'Gracias por darte el tiempo de escribirnos.',
      'Gracias por tus comentarios y por tu tiempo.',
      'Gracias por contarnos tanto, de verdad.',
      'Leímos todo: gracias por tu tiempo.',
      'Gracias por jugar y por escribirnos.',
      'Gracias por tomarte el tiempo de escribir.',
      'Mil gracias por tus mensajes.',
      'Gracias por ayudarnos a mejorar.',
      'Gracias: tus comentarios nos sirvieron mucho.',
    ],
    closing: "¿Otra idea? Responde a este correo.",
    signature: 'El equipo de Juegos de Salón',
  },
  en: {
    subject: 'About your comment on Juegos de Salón',
    subjectMany: 'About your comments on Juegos de Salón',
    quoted: t => `"${t}"`,
    greeting: n => (n ? `Hi ${n},` : 'Hi,'),
    openings: [
      'Thanks for your time and for writing to us.',
      'Thanks for taking the time to write.',
      'Thanks for your comment and your time.',
      'Thanks for telling us, really.',
      'We read your comment: thanks for your time.',
      'Thanks for playing and for writing.',
      'Thanks for taking a moment to write to us.',
      'Thanks so much for your message.',
      'Thanks for helping us improve.',
      'Thank you: your comment helped a lot.',
    ],
    openingsMany: [
      'Thanks for your time and for writing to us.',
      'Thanks for taking the time to write.',
      'Thanks for your comments and your time.',
      'Thanks for telling us so much, really.',
      'We read your comments: thanks for your time.',
      'Thanks for playing and for writing.',
      'Thanks for taking a moment to write to us.',
      'Thanks so much for your messages.',
      'Thanks for helping us improve.',
      'Thank you: your comments helped a lot.',
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
      'Obrigado pelo seu tempo e por escrever.',
      'Obrigado por tirar um tempo para escrever.',
      'Obrigado pelo comentário e pelo seu tempo.',
      'Obrigado por nos contar, de verdade.',
      'Lemos tudo: obrigado pelo seu tempo.',
      'Obrigado por jogar e por escrever.',
      'Obrigado por dedicar seu tempo a nós.',
      'Muito obrigado pela mensagem.',
      'Obrigado por nos ajudar a melhorar.',
      'Obrigado: seu comentário ajudou muito.',
    ],
    openingsMany: [
      'Obrigado pelo seu tempo e por escrever.',
      'Obrigado por tirar um tempo para escrever.',
      'Obrigado pelos comentários e pelo seu tempo.',
      'Obrigado por nos contar tanto, de verdade.',
      'Lemos tudo: muito obrigado pelo seu tempo.',
      'Obrigado por jogar e por escrever.',
      'Obrigado por dedicar seu tempo a nós.',
      'Muito obrigado pelas mensagens.',
      'Obrigado por nos ajudar a melhorar.',
      'Obrigado: seus comentários ajudaram muito.',
    ],
    closing: "Outra ideia? É só responder a este e-mail.",
    signature: 'A equipe do Juegos de Salón',
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
