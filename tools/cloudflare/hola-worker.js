/**
 * hola@juegosdesalon.cl's inbox, without a mailbox (D-318). Cloudflare Email Routing hands every
 * email sent to hola@ to this Worker, which:
 *
 *   1. forwards a copy to the owner's Gmail (FORWARD_TO), so they still see everything;
 *   2. keeps the sender, the subject and the text in Firebase `buzon/<id>`, a node only the inbox
 *      user can read or write (a Firebase Auth user that the rules limit to `buzon/`; not the
 *      owner's admin key, which bypasses every rule), for the support agent
 *      (`.claude/agents/atencion.md`), which triages it with `tools/agents/inbox.mjs` and deletes it.
 *
 * No npm, no build: it is pasted as is in the Cloudflare dashboard (Workers → Edit code). Secrets
 * and variables, set in the Worker's settings, never in the repo:
 *   BUZON_PASSWORD (secret)    the inbox user's password (buzon@juegosdesalon.cl, Firebase Auth)
 *   FORWARD_TO     (variable)  the owner's address, verified in Email Routing → Destination addresses
 *
 * The parsing is plain and defensive: the plain-text part if there is one, else the HTML one
 * without tags; quoted-printable and base64; UTF-8 and Latin-1. Attachments are ignored. Tested by
 * tools/cloudflare/hola-worker.test.mjs.
 */

const DB = 'https://juegos-de-salon-default-rtdb.firebaseio.com';
// The web API key is public (it's in the app); what limits the inbox user is the rules
const API_KEY = 'AIzaSyAVt6jreZpdTFHGDsCVCtD_bHu9-MiITV0';
export const USUARIO = 'buzon@juegosdesalon.cl';
export const MAX_TEXTO = 10000;

/* ------------------------------------------------------------------ */
/* Parsing (pure)                                                      */
/* ------------------------------------------------------------------ */

const bytesDe = bin => Uint8Array.from(bin, c => c.charCodeAt(0) & 0xff);
const decodificar = (bytes, charset = 'utf-8') => {
  try { return new TextDecoder(String(charset).toLowerCase().replace(/^(us-ascii|ascii)$/, 'utf-8')).decode(bytes); } catch { return new TextDecoder('utf-8').decode(bytes); }
};

/** Quoted-printable or base64 → the part's bytes, from a binary string. */
export function transferencia(cuerpo, cte = '') {
  const c = String(cte).toLowerCase().trim();
  if (c === 'base64') {
    try { return bytesDe(atob(cuerpo.replace(/[^A-Za-z0-9+/=]/g, ''))); } catch { return bytesDe(cuerpo); }
  }
  if (c === 'quoted-printable') {
    return bytesDe(cuerpo.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
  }
  return bytesDe(cuerpo);
}

/** RFC 2047 words in a header (=?utf-8?B?…?= and =?utf-8?Q?…?=). */
export function palabras(v) {
  return String(v || '').replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=(\s+(?==\?))?/g, (_, cs, enc, txt) => {
    const bin = enc.toUpperCase() === 'B'
      ? (() => { try { return atob(txt); } catch { return txt; } })()
      : txt.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (__, h) => String.fromCharCode(parseInt(h, 16)));
    return decodificar(bytesDe(bin), cs);
  });
}

/** Headers (unfolded, lower-case names) and body of a part, from a binary string. */
export function partir(bin) {
  const i = bin.search(/\r?\n\r?\n/);
  const cabeza = i < 0 ? bin : bin.slice(0, i), cuerpo = i < 0 ? '' : bin.slice(i).replace(/^\r?\n\r?\n/, '');
  const h = {};
  for (const linea of cabeza.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/)) {
    const m = /^([^:]+):\s*(.*)$/.exec(linea);
    // Raw 8-bit headers (no RFC 2047) are UTF-8 in practice; Latin-1 if they aren't valid UTF-8
    if (m) h[m[1].toLowerCase()] = /[\x80-\xff]/.test(m[2]) ? (() => { try { return new TextDecoder('utf-8', { fatal: true }).decode(bytesDe(m[2])); } catch { return m[2]; } })() : m[2];
  }
  return { h, cuerpo };
}

const parametro = (v, nombre) => (new RegExp(`${nombre}="?([^";]+)"?`, 'i').exec(v || '') || [])[1] || '';
const sinEtiquetas = html => html.replace(/<(style|script)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr)>/gi, '\n')
  .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

/** The text of a part: plain text first, else HTML without tags; '' for attachments. */
export function texto(bin) {
  const { h, cuerpo } = partir(bin);
  const tipo = (h['content-type'] || 'text/plain').toLowerCase();
  if (/attachment/i.test(h['content-disposition'] || '')) return '';
  if (tipo.startsWith('multipart/')) {
    const limite = parametro(h['content-type'], 'boundary');
    if (!limite) return '';
    const partes = cuerpo.split(`--${limite}`).slice(1).filter(p => !p.startsWith('--'));
    const sub = partes.map(p => ({ p, t: (partir(p.replace(/^\r?\n/, '')).h['content-type'] || 'text/plain').toLowerCase() }));
    const elegida = sub.find(x => x.t.startsWith('text/plain')) || sub.find(x => x.t.startsWith('multipart/')) || sub.find(x => x.t.startsWith('text/html'));
    return elegida ? texto(elegida.p.replace(/^\r?\n/, '')) : '';
  }
  if (!tipo.startsWith('text/')) return '';
  const t = decodificar(transferencia(cuerpo, h['content-transfer-encoding']), parametro(h['content-type'], 'charset') || 'utf-8');
  return tipo.startsWith('text/html') ? sinEtiquetas(t) : t;
}

/** `Name <a@b.c>` → { nombre, correo }. */
export function remitente(v) {
  const s = palabras(v).trim();
  const m = /^(.*?)\s*<([^>]+)>\s*$/.exec(s);
  const correo = (m ? m[2] : s).trim().toLowerCase();
  const nombre = (m ? m[1] : '').replace(/^"|"$/g, '').trim();
  return { nombre, correo };
}

/** What goes to `buzon/`: sender, name, subject, text (trimmed), the message id. */
export function registro(bin, sobre = '') {
  const { h } = partir(bin);
  const { nombre, correo } = remitente(h.from || sobre);
  const t = texto(bin).replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return {
    de: correo || String(sobre).toLowerCase(),
    nombre: nombre.slice(0, 80),
    asunto: palabras(h.subject || '').trim().slice(0, 200),
    texto: t.length > MAX_TEXTO ? `${t.slice(0, MAX_TEXTO)}…` : t,
    idMensaje: (h['message-id'] || '').slice(0, 200),
    automatico: /^(auto-|bulk|list|junk)/i.test(h['auto-submitted'] || h.precedence || '') || /^(mailer-daemon|no-?reply|postmaster)@/i.test(correo),
  };
}

/* ------------------------------------------------------------------ */
/* Firebase, as the inbox user                                         */
/* ------------------------------------------------------------------ */

let ficha = null;

/** The inbox user's ID token (an hour long), from its password. */
export async function token(password) {
  if (ficha && ficha.hasta > Date.now() + 60000) return ficha.valor;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: USUARIO, password, returnSecureToken: true }),
  });
  const j = await res.json();
  if (!res.ok || !j.idToken) throw new Error(`sign-in: HTTP ${res.status}`);
  ficha = { valor: j.idToken, hasta: Date.now() + (Number(j.expiresIn) || 3600) * 1000 };
  return ficha.valor;
}

export default {
  async email(message, env) {
    // The copy to the owner first: if anything below fails, the email is still in their Gmail
    if (env.FORWARD_TO) await message.forward(env.FORWARD_TO);
    const bin = await new Response(message.raw).arrayBuffer().then(b => {
      const u = new Uint8Array(b); let s = '';
      for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192));
      return s;
    });
    const r = registro(bin, message.from);
    const t = await token(env.BUZON_PASSWORD);
    const res = await fetch(`${DB}/buzon.json?auth=${encodeURIComponent(t)}`, {
      method: 'POST', body: JSON.stringify({ ...r, at: { '.sv': 'timestamp' } }),
    });
    if (!res.ok) throw new Error(`buzon: HTTP ${res.status}`);
  },
};
