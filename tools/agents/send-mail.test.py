"""send-mail.py builds the reply (D-317) without sending anything: From is the public address, To the player."""
import importlib.util
import pathlib

spec = importlib.util.spec_from_file_location('send_mail', pathlib.Path(__file__).with_name('send-mail.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

cfg = {'user': 'owner@gmail.com', 'appPassword': 'x', 'from': 'hola@juegosdesalon.cl', 'name': 'Juegos de Salón'}
msg = mod.message(cfg, {'to': 'ana@correo.cl', 'subject': '¡Gracias!', 'text': 'Hola Ana: ya está.\n'})
assert 'hola@juegosdesalon.cl' in msg['From'] and 'owner@' not in msg['From']
assert msg['To'] == 'ana@correo.cl' and msg['Reply-To'] == 'hola@juegosdesalon.cl'
assert msg['Subject'] == '¡Gracias!' and 'Ana' in msg.get_content()
assert '@juegosdesalon.cl>' in msg['Message-ID']
# Only from hola@ (D-443): no fallback to the owner's personal account
assert mod.refusal(cfg) is None and mod.refusal({**cfg, 'from': ' Hola@JuegosDeSalon.cl '}) is None
assert mod.refusal({**cfg, 'from': None}) and mod.refusal({**cfg, 'from': 'owner@gmail.com'}), 'any other sender is refused'
assert 'owner@' not in mod.message({**cfg, 'from': None}, {'to': 'a@b.cl', 'subject': 's', 'text': 't'})['From']
rich = mod.message(cfg, {'to': 'a@b.cl', 'subject': 's', 'text': 'plano', 'html': '<p style="color:#6b6b6b;font-style:italic">«cita»</p>'})
assert rich.is_multipart() and [p.get_content_type() for p in rich.iter_parts()] == ['text/plain', 'text/html']
assert 'plano' in rich.get_body(('plain',)).get_content() and 'italic' in rich.get_body(('html',)).get_content()
# The log and the 24-hour rule: one email per address, logged without the address
import os, tempfile
from datetime import datetime, timedelta, timezone
path = os.path.join(tempfile.mkdtemp(), 'log.jsonl')
t0 = datetime(2026, 10, 14, 12, 0, tzinfo=timezone.utc)
assert mod.recent('Ana@Correo.cl', t0, path) is None
e = mod.log_sent({'to': 'ana@correo.cl', 'subject': 'Hola', 'issues': [383]}, t0, path)
assert e['to'] == 'a********@********l' and 'ana@' not in open(path).read(), 'the address itself is never logged'
assert mod.recent(' ANA@correo.cl', t0 + timedelta(hours=23, minutes=59), path), 'same address, less than 24 hours: refused'
assert mod.recent('ana@correo.cl', t0 + timedelta(hours=24), path) is None, 'after 24 hours it can go'
assert mod.recent('otra@correo.cl', t0 + timedelta(minutes=1), path) is None, 'another address is not blocked'
assert oct(os.stat(path).st_mode & 0o777) == '0o600'
# The sender check (D-443): fresh only if the last checked email left from hola@ less than a week ago
p2 = os.path.join(tempfile.mkdtemp(), 'log.jsonl')
assert mod.needs_check(t0, p2), 'never checked: check first'
mod.log_sent({'to': 'o@b.cl', 'subject': 'c'}, t0, p2, sender='ok')
assert not mod.needs_check(t0 + timedelta(days=6), p2)
mod.log_sent({'to': 'a@b.cl', 'subject': 's'}, t0 + timedelta(days=1), p2, sender='unchecked')
assert not mod.needs_check(t0 + timedelta(days=6), p2), 'an unchecked one does not undo the last good check'
assert mod.needs_check(t0 + timedelta(days=7), p2), 'a week old: check again'
mod.log_sent({'to': 'a@b.cl', 'subject': 's'}, t0 + timedelta(days=2), p2, sender='other')
assert mod.needs_check(t0 + timedelta(days=2), p2), 'Gmail rewrote the sender: check before anything else'
assert mod.read_log(p2)[0]['from'] == 'ok' and mod.log_sent({'to': 'a@b.cl', 'subject': 's'}, t0, p2)['from'] == 'unchecked'
assert mod.unlimited({'noLimit': ['Owner@Gmail.com']}, ' owner@gmail.com'), 'noLimit skips the 24-hour rule (D-327)'
assert not mod.unlimited({'noLimit': ['owner@gmail.com']}, 'ana@correo.cl') and not mod.unlimited({}, 'ana@correo.cl')
# An attachment (the weekly report's PDF, D-352): read from disk and named after the file
import tempfile
with tempfile.TemporaryDirectory() as d:
    pdf = os.path.join(d, 'weekly.pdf')
    open(pdf, 'wb').write(b'%PDF-1.4 test')
    att = mod.message(cfg, {'to': 'a@b.cl', 'subject': 's', 'text': 't', 'attachments': [pdf]})
    parts = [p for p in att.iter_attachments()]
    assert len(parts) == 1 and parts[0].get_filename() == 'weekly.pdf' and parts[0].get_content_type() == 'application/pdf'
    assert parts[0].get_content() == b'%PDF-1.4 test'
threaded = mod.message(cfg, {'to': 'a@b.cl', 'subject': 'Re: Hola', 'text': 't', 'inReplyTo': '<abc@mail.gmail.com>'})
assert threaded['In-Reply-To'] == '<abc@mail.gmail.com>' and threaded['References'] == '<abc@mail.gmail.com>'
assert msg['In-Reply-To'] is None
print('send-mail: ok')
