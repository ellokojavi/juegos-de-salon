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

**Every email goes out from hola@juegosdesalon.cl** (`SENDER`, the owner's rule, D-443). `from` must
be that address, or nothing is sent: there is no fallback to `user`, the owner's personal Gmail.
Gmail sends as it because it is added under Settings → Accounts → "Send mail as"; if that alias
ever stops working, Gmail does not fail, it silently rewrites From to `user`. So each email is
checked after sending: its copy in Gmail's Sent folder, read by IMAP with the same app password,
must say From hola@. And before writing to anybody else, the last check must be fine and less
than a week old; if not, a test email to the owner (`owner`, or `user`) goes first, and only if it
leaves from hola@ does the real one follow. When the check fails, the real email is not sent and
the command exits with an error: the caller (`feedback.mjs reply`) leaves the report pending, so
nothing is lost, and it goes out once the alias is fixed. `--check` runs the check by hand.

Every email sent is logged in ~/.config/juegos-de-salon/mail-log.jsonl (or $JUEGOS_MAIL_LOG), on
the owner's machine and never in the repo: date, the masked address, a hash of the address, the
subject and the issues. Never the address itself (the form promises to delete it). And, owner's
rule for prudence, plus whether its sender was checked (`from`: ok, other or unchecked); **at most one email to the same address every 24 hours**; a second one is
refused before connecting, except to the addresses in `noLimit` (D-327). `python3 tools/agents/send-mail.py --log` prints the log.
"""
import email
import hashlib
import imaplib
import json
import mimetypes
import os
import smtplib
import sys
import time
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from email.utils import formataddr, make_msgid, parseaddr

CONFIG = os.environ.get('JUEGOS_MAIL') or os.path.expanduser('~/.config/juegos-de-salon/mail.json')
LOG = os.environ.get('JUEGOS_MAIL_LOG') or os.path.expanduser('~/.config/juegos-de-salon/mail-log.jsonl')
WINDOW = timedelta(hours=24)
SENDER = 'hola@juegosdesalon.cl'
CHECKED = timedelta(days=7)


BROKEN = (f'Not sent: the check email to the owner did not leave from {SENDER}; Gmail rewrote the sender. '
          'Fix Settings → Accounts → "Send mail as" in Gmail, then run send-mail.py --check. The report stays pending (D-443).')
UNREAD = (f'Not sent: could not confirm, by reading Gmail\'s Sent folder over IMAP, that the check email left from {SENDER}. '
          'Is IMAP on in Gmail? Run send-mail.py --check once it is. The report stays pending (D-443).')


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


def log_sent(m, now=None, path=None, sender='unchecked'):
    path = path or LOG
    os.makedirs(os.path.dirname(path), exist_ok=True)
    e = {'at': (now or datetime.now(timezone.utc)).isoformat(timespec='seconds'), 'to': mask(m['to']), 'hash': fingerprint(m['to']),
         'subject': m['subject'], 'issues': m.get('issues') or [], 'test': bool(m.get('test')), 'from': sender}
    with open(path, 'a', encoding='utf-8') as f:
        f.write(json.dumps(e, ensure_ascii=False) + '\n')
    os.chmod(path, 0o600)
    return e


def refusal(cfg):
    """Why this config cannot send, or None: only from hola@ (D-443)."""
    got = (cfg.get('from') or '').strip().lower()
    if got != SENDER:
        return f'Not sent: every email goes out from {SENDER} (D-443), and the config says "from": {json.dumps(cfg.get("from"))}. Set it in {CONFIG}.'
    return None


def needs_check(now=None, path=None):
    """Is a fresh check due? When the last checked email is over a week old, or did not leave from hola@."""
    now = now or datetime.now(timezone.utc)
    for e in reversed(read_log(path)):
        if e.get('from') == 'ok':
            return now - datetime.fromisoformat(e['at']) >= CHECKED
        if e.get('from') == 'other':
            return True
    return True


def sent_from(cfg, msgid, tries=6, wait=5):
    """The address Gmail's Sent copy of this email says it left from, or None if it cannot be read."""
    try:
        imap = imaplib.IMAP4_SSL('imap.gmail.com', 993, timeout=30)
    except OSError:
        return None
    try:
        imap.login(cfg['user'], cfg['appPassword'])
        boxes = [b.decode() for b in imap.list()[1] if b'\\Sent' in b]
        if not boxes:
            return None
        imap.select(boxes[0].split(' "/" ')[-1], readonly=True)
        for _ in range(tries):
            ids = imap.search(None, 'HEADER', 'Message-ID', msgid.strip('<>'))[1][0].split()
            if ids:
                head = imap.fetch(ids[-1], '(BODY.PEEK[HEADER.FIELDS (FROM)])')[1][0][1]
                return parseaddr(email.message_from_bytes(head)['From'])[1].lower()
            time.sleep(wait)
        return None
    except (OSError, imaplib.IMAP4.error):
        return None
    finally:
        try:
            imap.logout()
        except (OSError, imaplib.IMAP4.error):
            pass


def send(cfg, m):
    """Sends and checks where it left from: 'ok', 'other' or 'unchecked'."""
    msg = message(cfg, m)
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30) as smtp:
        smtp.login(cfg['user'], cfg['appPassword'])
        smtp.send_message(msg)
    got = sent_from(cfg, msg['Message-ID'])
    return 'unchecked' if got is None else 'ok' if got == SENDER else 'other'


def check(cfg):
    """A test email to the owner, and whether it left from hola@ (D-443)."""
    owner = cfg.get('owner') or cfg['user']
    m = {'to': owner, 'subject': f'[Check] Juegos de Salón sends from {SENDER}', 'test': True,
         'text': f'A check of the sender (D-443): this email should come from {SENDER}. Nothing to do.\n'}
    result = send(cfg, m)
    log_sent(m, sender=result)
    return result


def message(cfg, m):
    msg = EmailMessage()
    sender = SENDER
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
            print(f"{e['at']}  {e['to']}  {'[test] ' if e.get('test') else ''}{e['subject']}  {' '.join('#' + str(n) for n in e.get('issues') or [])}  from: {e.get('from', '?')}")
        return
    if not os.path.exists(CONFIG):
        sys.exit(f'No mail account at {CONFIG}: see the setup in tools/agents/send-mail.py (D-317).')
    if os.stat(CONFIG).st_mode & 0o077:
        print(f'Warning: other users can read {CONFIG}. Suggestion: chmod 600 "{CONFIG}"', file=sys.stderr)
    cfg = json.load(open(CONFIG, encoding='utf-8'))
    if refusal(cfg):
        sys.exit(refusal(cfg))
    if '--check' in sys.argv:
        result = check(cfg)
        if result == 'ok':
            print(f'Check sent to the owner: it left from {SENDER}.', file=sys.stderr)
        sys.exit(0 if result == 'ok' else BROKEN if result == 'other' else UNREAD)
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
    owner = cfg.get('owner') or cfg['user']
    if m['to'].strip().lower() != owner.strip().lower() and needs_check():
        # Before writing to anybody else: a test to the owner proves hola@ still works
        result = check(cfg)
        if result != 'ok':
            sys.exit(BROKEN if result == 'other' else UNREAD)
    result = send(cfg, m)
    e = log_sent(m, sender=result)
    if result == 'other':
        sys.exit(f"Sent to {e['to']}, but NOT from {SENDER}: Gmail rewrote the sender. Check Settings → Accounts → \"Send mail as\" (D-443).")
    note = '' if result == 'ok' else f' (could not read Gmail\'s Sent folder to confirm it left from {SENDER})'
    print(f"Sent to {e['to']} from {SENDER}{note}, logged in {LOG}.", file=sys.stderr)


if __name__ == '__main__':
    main()
