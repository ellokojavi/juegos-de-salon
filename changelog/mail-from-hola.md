level: patch

- **Every email leaves from hola@juegosdesalon.cl, and each one proves it** (D-443): `send-mail.py` refuses any other sender (no fallback to the owner's personal Gmail), reads each email's copy in Gmail's Sent folder to confirm it left from hola@, and before writing to a player sends the owner a weekly test email first. If the check fails, nothing goes out and the report stays pending until the alias is fixed (`send-mail.py --check`).
