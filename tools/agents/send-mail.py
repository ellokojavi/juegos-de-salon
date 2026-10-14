#!/usr/bin/env python3
"""Sends one plain-text email through Gmail's SMTP (D-317). Used by `feedback.mjs reply`.

The message comes as JSON on stdin ({"to", "subject", "text", and optionally "html", sent as
the alternative that mail apps show; the text stays for the ones that don't}), so the address never shows in a
command line. The account comes from ~/.config/juegos-de-salon/mail.json (or $JUEGOS_MAIL), never
from the repo:

    {"user": "the Gmail account", "appPassword": "a Gmail app password",
     "from": "hola@juegosdesalon.cl", "name": "Juegos de Salón"}

`from` is the address players see; Gmail sends as it once it is added under
Settings → Accounts → "Send mail as". Without it, the mail goes from `user`.

Every email sent is logged in ~/.config/juegos-de-salon/mail-log.jsonl (or $JUEGOS_MAIL_LOG), on
the owner's machine and never in the repo: date, the masked address, a hash of the address, the
subject and the issues. Never the address itself (the form promises to delete it). And, owner's
rule for prudence: **at most one email to the same address every 24 hours**; a second one is
refused before connecting. `python3 tools/agents/send-mail.py --log` prints the log.
"""
import hashlib
import json
import os
import smtplib
import sys
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from email.utils import formataddr, make_msgid

CONFIG = os.environ.get('JUEGOS_MAIL') or os.path.expanduser('~/.config/juegos-de-salon/mail.json')
LOG = os.environ.get('JUEGOS_MAIL_LOG') or os.path.expanduser('~/.config/juegos-de-salon/mail-log.jsonl')
VENTANA = timedelta(hours=24)


def huella(to):
    return hashlib.sha256(to.strip().lower().encode('utf-8')).hexdigest()


def mascara(to):
    u, d = to.strip().split('@', 1)
    return f'{u[0]}********@********{d[-1]}'


def leer_log(ruta=None):
    ruta = ruta or LOG
    if not os.path.exists(ruta):
        return []
    with open(ruta, encoding='utf-8') as f:
        return [json.loads(l) for l in f if l.strip()]


def reciente(to, ahora=None, ruta=None):
    """The last email to this address within 24 hours, or None."""
    ahora = ahora or datetime.now(timezone.utc)
    h = huella(to)
    for e in reversed(leer_log(ruta)):
        if e.get('hash') == h and ahora - datetime.fromisoformat(e['at']) < VENTANA:
            return e
    return None


def anotar(m, ahora=None, ruta=None):
    ruta = ruta or LOG
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    e = {'at': (ahora or datetime.now(timezone.utc)).isoformat(timespec='seconds'), 'to': mascara(m['to']), 'hash': huella(m['to']),
         'subject': m['subject'], 'issues': m.get('issues') or [], 'test': bool(m.get('test'))}
    with open(ruta, 'a', encoding='utf-8') as f:
        f.write(json.dumps(e, ensure_ascii=False) + '\n')
    os.chmod(ruta, 0o600)
    return e


def message(cfg, m):
    msg = EmailMessage()
    sender = cfg.get('from') or cfg['user']
    msg['From'] = formataddr((cfg.get('name') or 'Juegos de Salón', sender))
    msg['To'] = m['to']
    msg['Subject'] = m['subject']
    msg['Reply-To'] = sender
    msg['Message-ID'] = make_msgid(domain=sender.split('@')[-1])
    msg.set_content(m['text'])
    if m.get('html'):
        msg.add_alternative(m['html'], subtype='html')
    return msg


def main():
    if '--log' in sys.argv:
        for e in leer_log():
            print(f"{e['at']}  {e['to']}  {'[test] ' if e.get('test') else ''}{e['subject']}  {' '.join('#' + str(n) for n in e.get('issues') or [])}")
        return
    if not os.path.exists(CONFIG):
        sys.exit(f'No mail account at {CONFIG}: see the setup in tools/agents/send-mail.py (D-317).')
    if os.stat(CONFIG).st_mode & 0o077:
        print(f'Warning: other users can read {CONFIG}. Suggestion: chmod 600 "{CONFIG}"', file=sys.stderr)
    cfg = json.load(open(CONFIG, encoding='utf-8'))
    m = json.load(sys.stdin)
    if not all(m.get(k) for k in ('to', 'subject', 'text')):
        sys.exit('The message needs "to", "subject" and "text".')
    antes = reciente(m['to'])
    if antes:
        sys.exit(f"Not sent: {antes['to']} already got an email at {antes['at']} (\"{antes['subject']}\"). One email per address every 24 hours.")
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30) as smtp:
        smtp.login(cfg['user'], cfg['appPassword'])
        smtp.send_message(message(cfg, m))
    e = anotar(m)
    print(f"Sent to {e['to']}, logged in {LOG}.", file=sys.stderr)


if __name__ == '__main__':
    main()
