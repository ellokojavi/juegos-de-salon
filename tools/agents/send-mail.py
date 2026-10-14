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
"""
import json
import os
import smtplib
import sys
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

CONFIG = os.environ.get('JUEGOS_MAIL') or os.path.expanduser('~/.config/juegos-de-salon/mail.json')


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
    if not os.path.exists(CONFIG):
        sys.exit(f'No mail account at {CONFIG}: see the setup in tools/agents/send-mail.py (D-317).')
    if os.stat(CONFIG).st_mode & 0o077:
        print(f'Warning: other users can read {CONFIG}. Suggestion: chmod 600 "{CONFIG}"', file=sys.stderr)
    cfg = json.load(open(CONFIG, encoding='utf-8'))
    m = json.load(sys.stdin)
    if not all(m.get(k) for k in ('to', 'subject', 'text')):
        sys.exit('The message needs "to", "subject" and "text".')
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30) as smtp:
        smtp.login(cfg['user'], cfg['appPassword'])
        smtp.send_message(message(cfg, m))


if __name__ == '__main__':
    main()
