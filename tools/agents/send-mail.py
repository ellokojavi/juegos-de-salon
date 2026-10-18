#!/usr/bin/env python3
"""Sends one plain-text email through Gmail's SMTP (D-317). Used by `feedback.mjs reply`.

The message comes as JSON on stdin ({"to", "subject", "text", and optionally "html", sent as
the alternative that mail apps show; the text stays for the ones that don't; and "attachments", a list
of file paths, e.g. the weekly report's PDF, D-352}), so the address never shows in a
command line. The account comes from ~/.config/juegos-de-salon/mail.json (or $JUEGOS_MAIL), never
from the repo:

    {"user": "the Gmail account", "appPassword": "a Gmail app password",
     "from": "hola@juegosdesalon.cl", "name": "Juegos de Salón",
     "noLimit": ["addresses the 24-hour rule does not apply to, e.g. the owner's own, for tests"]}

`from` is the address players see; Gmail sends as it once it is added under
Settings → Accounts → "Send mail as". Without it, the mail goes from `user`.

Every email sent is logged in ~/.config/juegos-de-salon/mail-log.jsonl (or $JUEGOS_MAIL_LOG), on
the owner's machine and never in the repo: date, the masked address, a hash of the address, the
subject and the issues. Never the address itself (the form promises to delete it). And, owner's
rule for prudence: **at most one email to the same address every 24 hours**; a second one is
refused before connecting, except to the addresses in `noLimit` (D-327). `python3 tools/agents/send-mail.py --log` prints the log.
"""
import hashlib
import json
import mimetypes
import os
import smtplib
import sys
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from email.utils import formataddr, make_msgid

CONFIG = os.environ.get('JUEGOS_MAIL') or os.path.expanduser('~/.config/juegos-de-salon/mail.json')
LOG = os.environ.get('JUEGOS_MAIL_LOG') or os.path.expanduser('~/.config/juegos-de-salon/mail-log.jsonl')
WINDOW = timedelta(hours=24)


def fingerprint(to):
    return hashlib.sha256(to.strip().lower().encode('utf-8')).hexdigest()


def mask(to):
    u, d = to.strip().split('@', 1)
    return f'{u[0]}********@********{d[-1]}'


def read_log(path=None):
    path = path or LOG
    if not os.path.exists(path):
        return []
    with open(path, encoding='utf-8') as f:
        return [json.loads(l) for l in f if l.strip()]


def recent(to, now=None, path=None):
    """The last email to this address within 24 hours, or None."""
    now = now or datetime.now(timezone.utc)
    h = fingerprint(to)
    for e in reversed(read_log(path)):
        if e.get('hash') == h and now - datetime.fromisoformat(e['at']) < WINDOW:
            return e
    return None


def unlimited(cfg, to):
    """An address in the config's `noLimit` list skips the 24-hour rule (D-327)."""
    return to.strip().lower() in {a.strip().lower() for a in cfg.get('noLimit') or []}


def log_sent(m, now=None, path=None):
    path = path or LOG
    os.makedirs(os.path.dirname(path), exist_ok=True)
    e = {'at': (now or datetime.now(timezone.utc)).isoformat(timespec='seconds'), 'to': mask(m['to']), 'hash': fingerprint(m['to']),
         'subject': m['subject'], 'issues': m.get('issues') or [], 'test': bool(m.get('test'))}
    with open(path, 'a', encoding='utf-8') as f:
        f.write(json.dumps(e, ensure_ascii=False) + '\n')
    os.chmod(path, 0o600)
    return e


def message(cfg, m):
    msg = EmailMessage()
    sender = cfg.get('from') or cfg['user']
    msg['From'] = formataddr((cfg.get('name') or 'Juegos de Salón', sender))
    msg['To'] = m['to']
    msg['Subject'] = m['subject']
    msg['Reply-To'] = sender
    msg['Message-ID'] = make_msgid(domain=sender.split('@')[-1])
    if m.get('inReplyTo'):
        # In the sender's own thread (D-327)
        msg['In-Reply-To'] = m['inReplyTo']
        msg['References'] = m['inReplyTo']
    msg.set_content(m['text'])
    if m.get('html'):
        msg.add_alternative(m['html'], subtype='html')
    for path in m.get('attachments') or []:
        # A file the owner's tools wrote (the weekly report, D-352): read from disk, never from the message
        kind = (mimetypes.guess_type(path)[0] or 'application/octet-stream').split('/', 1)
        with open(path, 'rb') as f:
            msg.add_attachment(f.read(), maintype=kind[0], subtype=kind[1], filename=os.path.basename(path))
    return msg


def main():
    if '--log' in sys.argv:
        for e in read_log():
            print(f"{e['at']}  {e['to']}  {'[test] ' if e.get('test') else ''}{e['subject']}  {' '.join('#' + str(n) for n in e.get('issues') or [])}")
        return
    if not os.path.exists(CONFIG):
        sys.exit(f'No mail account at {CONFIG}: see the setup in tools/agents/send-mail.py (D-317).')
    if os.stat(CONFIG).st_mode & 0o077:
        print(f'Warning: other users can read {CONFIG}. Suggestion: chmod 600 "{CONFIG}"', file=sys.stderr)
    cfg = json.load(open(CONFIG, encoding='utf-8'))
    m = json.load(sys.stdin)
    if m.get('toOwner'):
        # A doubt for the owner (D-328): to their own account, never limited
        m['to'] = cfg.get('owner') or cfg['user']
        cfg = {**cfg, 'noLimit': [*(cfg.get('noLimit') or []), m['to']]}
    if not all(m.get(k) for k in ('to', 'subject', 'text')):
        sys.exit('The message needs "to", "subject" and "text".')
    prev = None if unlimited(cfg, m['to']) else recent(m['to'])
    if prev:
        sys.exit(f"Not sent: {prev['to']} already got an email at {prev['at']} (\"{prev['subject']}\"). One email per address every 24 hours.")
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30) as smtp:
        smtp.login(cfg['user'], cfg['appPassword'])
        smtp.send_message(message(cfg, m))
    e = log_sent(m)
    print(f"Sent to {e['to']}, logged in {LOG}.", file=sys.stderr)


if __name__ == '__main__':
    main()
