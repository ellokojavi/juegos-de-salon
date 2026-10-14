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
assert 'owner@gmail.com' in mod.message({**cfg, 'from': None}, {'to': 'a@b.cl', 'subject': 's', 'text': 't'})['From']
print('send-mail: ok')
