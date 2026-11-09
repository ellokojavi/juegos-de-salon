level: patch

- **The footer buttons now look like the rest of the app**: "Sugerencias y comentarios" and "Invítame a un café" are pills tinted with their own color (cyan and orange), with the icon on the left, like the tags on the game cards, instead of two frosted squares.
- **No empty frame on the coffee card offline**: the thank-you clip comes from GIPHY and cannot work without signal; offline, or when GIPHY does not answer, the card now opens without it.
- **No coffee button offline**: without signal the "Invítame a un café" button (footer and end of game) steps aside, since paying needs Stripe; it comes back with the signal.
- **Messages sent without signal always arrive**: a 💬 message written offline waited on the phone but only went up when La Copa or the lab was opened; now it goes up from any page, and as soon as the signal is back.
