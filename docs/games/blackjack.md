# ♠️ Blackjack (lab, in Juegos en prueba)

Vegas-style Blackjack table against the house (croupier), playable solo or with 2 to 6 players each on their own phone using simulated coins.

## Resumen

- **Where:** `/labs/blackjack/`, behind the lab's door (D-281, D-395), `noindex`, its card in `/labs/`'s
  🎲 Juegos en prueba. Not in `games.js` while it is in the lab. Id `blackjack` in the usage signal and in
  `localStorage` (`juegos-de-salon:blackjack:session`, `…:names`). Its facts are in `game.json`.
- **For whom:** 1 player solo, or 2 to 6 players each on their own phone. In es, en and pt.

## Reglas

- **Shoe & Red Cut Card:** Standard 52-card decks (1, 2, 4, 6, or 8; default **2 decks** for fast play). A red cut card is placed at 75% of the shoe; once reached, the current hand finishes and the session ends. If a shoe is ever exhausted mid-hand, the discards not on the table are reshuffled deterministically and the red cut card is triggered.
- **Betting:** Players start with configurable simulated coins (100, 250, 500, or 1000; default **250**) and bet before each round in even chip increments (10, 20, 50, 100; minimum 10).
- **Player Actions:** Hit, Stand, Double Down (2-card hand with sufficient coins), Split (matching rank pair with sufficient coins), and Surrender (on the initial 2 cards, forfeiting the hand to recover 50% of the bet, `Math.floor(bet / 2)`).
- **Dealer (Croupier):** Draws 2 cards (1 face down), reveals hole card after players act, and hits on 16 or less / stands on all 17s (S17).
- **Payouts:** Natural Blackjack pays 3:2 (unless dealer also has Blackjack → push); standard wins pay 1:1; ties push.
- **End Conditions:** Round limit reached (default **3 rounds**, or 5 / 10 / Red card only), red card reached in shoe, everyone runs out of coins, or everyone leaves the table.
- **Winner:** In multiplayer, the player with the most coins wins (ties break by hands won, then Blackjacks); in solo mode, final coins and net gain/loss against the house are shown.

## Modos

- **Solo vs. the house (`cpu`):** 1 player against the croupier.
- **Each on their phone (`online`):** 2 to 6 players in a Firebase room (`rooms/{code}`), with a deterministic seeded shoe (`mulberry32`) so all phones stay in sync.

## Flujo

Intro (resume panel, mode picker, folded how to play) → setup (player names, decks, rounds, starting coins; or create/join room in online mode) → play (betting → dealing & player turns → dealer & round payout, with folded how to play below controls) → result (standings, end reason, Play again / Rematch, Share through `compartir.js`, and exits from `fin.js`, C-19).

## Protocolo de mensajes

Solo mode runs locally on one phone and persists full state after every move via `createSessionStore` (C-6). Online mode runs over `rooms/{code}` using the shared room state machine (`roomMessage` for `hello`, `start`, and `rematch`) plus game moves:

| Mensaje | Campos | Cuándo |
|---|---|---|
| `hello` | `from`, `name` | Upon joining or reconnecting to `rooms/{code}` |
| `start` | `from: 'A'`, `order`, `seed` | Host `'A'` opens the table from the lobby; all phones initialize `mulberry32(seed)` |
| `rematch` | `from`, `code` | On result screen, first offer creates/shares the next room code |
| `bj` | `from`, `act` (`bet`, `hit`, `stand`, `double`, `split`, `surrender`, `next`, `leave`), optional `amount` / `playerIndex` | During play; `canApplyOnlineAction(state, M.players, msg)` rejects out-of-turn senders, non-host `next`, and leaving another seat |

## Archivos

- `public/labs/blackjack/game.json`: the manifest (#1249), `rules.js`: data and `LOCALES`, `engine.js`: pure state machine, `engine.test.mjs`: unit tests, `game.js`: screens and DOM, `style.css`: tokens-only table & card styles.
- `tools/e2e/blackjack/game.mjs`: plays it to the result; `node tools/e2e/conformance.mjs labs/blackjack` checks the canons.

## On trial in the lab

- **The felt table** (flag `blackjack-felt`, described inside the game's own `/labs/` card as `#seccion-blackjack-felt`, switched in the «T» tab: one card for the game, D-498's 🚀 stays with the game): `html.bj-felt` turns the
  dealer and the seats into one felt table (`.bj-table`, with the table's two lines in `#felt-arc`), the cards bigger
  and fanned with a corner index (`.c`), the bet a chip on its spot (`.bet-spot`), the shoe a bar with the red card
  marked, and each hand's result a stamp (`.stamp`). On the cover, the same flag draws a hand dealt to a Blackjack over and over (`#bj-demo`, through `onScreen`)
  in place of the icon. Off, the page is as before. A lab game is behind the lab's door
  already, so this is the first flag asked inside one: `public/labs/listed.test.mjs` now reads `labs/<game>/` for flags.

## Excepciones a los cánones

None.
