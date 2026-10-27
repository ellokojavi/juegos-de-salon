level: patch

- **Hardening**: the room's QR code is drawn with a copy of its library served by the site itself (`assets/js/vendor/qrcode.js`, qrcode-generator 1.4.4, MIT), loaded by one shared module (`assets/js/qr.js`) instead of seven copies of the same code; a notification only opens pages of this site (anything else opens the home page); and the owner's panel does not show inside another site's frame.
