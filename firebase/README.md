# Firebase

Project: `juegos-de-salon` (Spark plan, free). Created on 2026-09-08.

> **Watch the account.** The project belongs to **`la cuenta de la máquina`**, the machine's
> account, which is **not** the identity used to commit (`la cuenta de administrador`, GitHub
> `ellokojavi`). Signing in to the console with the wrong account makes the project not show up
> in the list, which looks exactly like an account with no projects. For any change
> in the console —rules, Authentication, deleting data— you have to sign in with `la cuenta de la máquina`.

- **Realtime Database:** `https://juegos-de-salon-default-rtdb.firebaseio.com` (us-central1).
- **Security rules:** [database.rules.json](database.rules.json). They are the copy of what is published in the console; if they change, they have to be published again in *Realtime Database → Rules*.
- **Web app:** `juegos-de-salon-web`. Its public config is in `public/assets/js/firebase-config.js`.
- Google Analytics and Gemini were left off (not needed).

## Publishing the rules

The rules in [`database.rules.json`](database.rules.json) **are not published on their own**: there is no
deploy that uploads them. They are pasted by hand and *Publish* is pressed, with the account that owns the project
(`la cuenta de la máquina`):

<https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules>

While a change in the file isn't published, new writes are rejected and nobody
notices: the transport and the usage signals are best-effort and fail silently.

## What the rules allow

- There are three nodes: `rooms/<CODIGO>` (the rooms), `cleanup` (the trash bin that deletes them) and
  `stats` (the usage signals the owner's panel reads, D-44).
- The room code is 4 uppercase letters.
- Anyone with the code can read the room.
- `createdAt`, `game` and `config` are written only once (when creating the room).
- **A room is alive while it beats** (D-89): `lastAt` is the server time of the last
  move, anyone inside refreshes it and it lasts half an hour. After that half hour —or the
  six hours since `createdAt`, which is the hard cap— the room accepts nothing more. A room without
  `lastAt` predates the heartbeat: the six-hour cap applies.
- `players/A` to `players/F` can be updated while the room is alive (up to six players).
  `left` (boolean) also goes there: the goodbye of whoever left on purpose (D-50).
- `messages/<id>` are append-only (not edited or deleted) and must carry `t`, `from` (A to F) and `at`.
- An expired room (half an hour without a heartbeat, or more than 6 hours) can be deleted by anyone (cleanup).
- A **live** room can only be deleted when all the players inside have
  `left: true`: it is the cancelled room, closed on the spot instead of waiting for it to expire.
  A room with no player signed up can't be deleted.
- Any other field is rejected.
- **Only the owner** (their UID in the rules) can list all of `rooms/` and read `stats/`.
  Nobody else: not even with a room's code can you reach `stats/`.

## La Copa (the Cup) (`torneos`, `torneoKeys`, `torneoSeats`)

Multi-day tournaments (D-94, [docs/games/cup.md](../docs/games/cup.md)) live in their
own tree because they last a week and rooms die after half an hour (D-89).

- **They need Firebase Auth anonymous sign-in** (D-96): *Authentication → Sign-in method →
  Anonymous → Enable*. Each browser signs in anonymously, and the rules use its `auth.uid`.
- `torneos/<código>` (5 letters without I or O) is readable by whoever has the code; all of `torneos/`, only by the owner.
- `meta` is written once and carries each day's windows already computed (`win/<d>/{a,b,h}`),
  `joinUntil` and `final` (the final's day as text, or `'0'` in a cup without a final, D-438): the rules compare `now` against numbers, they know nothing about time zones.
- `players/<pid>` is created by the player themselves before the final; afterwards only the admin changes it.
- `started`, `results` and `wild` are written only once, by the seated player and within the
  window of their day. The wildcard, also, only before `started` and never on the final's day (any day in a cup without a final). An unused one that lands on its own before the final (D-444) is computed when read and writes nothing, so the rules do not change for it.
- `started` is also refused to a player out of the cup (D-347): two days in a row closed without a
  result, counting only days that closed after their `at` and after their `back` (the admin's
  «Devolver a la copa», server time). The rule repeats the condition for each pair of days up to
  day 6, because rules cannot loop.
- `torneoKeys/<código>/<pid>` stores the PIN hash and `torneoSeats/<código>/<pid>/<uid>` the
  phones seated as that player. **Neither can be read**: sitting down requires sending
  the same hash, or (D-359) the cup player's linked jid (`players/<pid>/j`) from a phone seated as
  that player (`jugadorSeats/<jid>/<uid>`), so a signed-in player needs no cup PIN. The admin can change the hash and delete the seats (new PIN).
- Cups aren't deleted yet (LIG-31).

## Publishing the rules (D-122, D-218)

They are published on their own on every merge to `main`: the `reglas` job in `.github/workflows/publish.yml`
runs `rules.mjs publish` with the GitHub secret `FIREBASE_ADMIN_JSON`, before publishing the
site. By hand, to check or if the secret is missing:

```bash
node tools/firebase/rules.mjs publish    # uploads database.rules.json and verifies it took
node tools/firebase/rules.mjs check      # is what's published what's in the repo?
```

It uses a service account key stored outside the repo at
`~/.config/juegos-de-salon/firebase-admin.json` (or `FIREBASE_KEY=/path`). It is created once in
[Service accounts](https://console.firebase.google.com/u/0/project/juegos-de-salon/settings/serviceaccounts/adminsdk)
→ Generate new private key. It gives admin access to the whole project: it isn't shared, and if
it leaks it is revoked right there. Without the key, you can still paste by hand in the console.

## La Copa: closed sign-up and movable start (D-110)

- `torneos/<code>/closed` (`true` or nothing): only the phone seated as admin writes it. With the
  cup closed, the rules don't allow creating new players.
- `torneos/<code>/meta` is written on creation and, afterwards, **only the admin can rewrite it** to
  move the start: with no `started`, with the same name, days, schedule, admin and
  `createdAt`, and with day 1's window still open and starting within 32 days.
- A lab cup (`meta/lab = true`, D-115) can be rewritten even if it has already been
  played: that's how its admin moves it to the next day. The `lab` mark can't be removed or added afterwards.
- `torneos/<code>/meta/name` can be changed only by the admin, at any time before the
  cup ends (`now < meta/end`), with the same length of 1 to 40 (D-148).

- `torneos/<code>/fin` (D-161): the server time when the admin ended the cup early. Only the
  phone seated as admin writes it, **once**, with the cup already started and not finished. From then on
  the rules don't allow writing `started`, `results` or `wild`, signing up, renaming the cup or
  rewriting `meta`.

- **Deleting the cup** (D-117): the phone seated as admin can delete at once
  `torneos/<code>`, `torneoKeys/<code>` and `torneoSeats/<code>` (only the whole node, never partially).

## La Copa: its own link (`torneoAlias`, D-121)

`torneoAlias/<alias>` = `{ code, hasta }`. It is read without an account (it only says which code it points to). It is
written if it doesn't exist, if it expired (`hasta < now`) or if it points to the same cup, and always by the
admin of that cup and with `meta/alias` equal to the alias; it is deleted only by that admin. `hasta` is the end
of the cup plus 7 days.

## Players and rankings (`jugadores`, `jugadorKeys`, `jugadorSeats`, `jugadorNombres`, `jugadorCopas`, `records`, `torneoPodios`, D-212)

The same mechanism as La Copa, for the whole app:

- `jugadores/<jid>` = `{ n, at, juegos: { <juego>: { n, at } } }`. Read without an account by jid (not
  listed). Created once, with the seat in the same write; `juegos/<juego>/n` only goes up by one.
- `jugadorKeys/<jid>`: sha256 of the PIN. Nobody reads it. Created with the player; changed by whoever is seated.
- `jugadorSeats/<jid>/<uid>`: the `uid` phone writes as `jid` if it brings the hash from `jugadorKeys`.
  Whoever is seated can replace all the seats (changing the PIN kicks out the others).
- `jugadorNombres/<clave>/<jid>` = `true`: who uses that name. Read by key, to sign in.
- `records/<tabla>/<período>/<jid>` = `{ s, ms, k, at, n }`, with `.indexOn: k`. Read without an account.
  Only the seated player writes, with `k` recomputed, `n` equal to their name and `k` lower than the
  stored one. The table and period are validated by shape, without naming games (C-16). A table that
  ends in `_victorias` (D-215), and the `partidas` one (D-219), also requires `ms` = 0 and that `s` go up
  by exactly one. Each row can carry `co`, the player's country (two letters, D-219).
- `jugadores/<jid>/co`: the player's country, once, by whoever is seated (D-219).
- `torneoPodios/<código>`: the podium of a finished cup, with `.indexOn: end`. Read without an account.
- `uadTemporada/s<yyyy-mm>`: Uno al día's season places by week (D-424), `{ c, t, j: { <jid>: { n, co?, s, l } } }`. Read without an account; written only by the administrator, by the nightly points rebuild (`uad-points-backfill.mjs --rebuild`). The home page's season recap reads it.
  Written once by someone seated in that cup (`por`), with the cup finished, without `lab`, and with
  the names and `j` the cup has.
  `torneoPodios/<código>/p/<pid>/j` can be written later, once and only while empty, by a phone seated
  as that cup player, with the jid that cup player is linked to: signing a podium saved without the player (D-358).
- `torneos/<código>/players/<pid>/j`: the rankings player behind the cup's one. Written by
  whoever is seated as both.
- `jugadorCopas/<jid>/<código>` = `{ p, at }`: the player's cups, for "Tus copas" on any
  phone (D-220). Only their phones read it. Written by whoever is seated as the player and as
  `p` in the cup, with `players/<p>/j` equal to the player; deleted by whoever is seated as the player.

A **legacy player** (`jugadores/<jid>.legado = true`, from La Copa's history) has no
PIN: `jugadorKeys/<jid>` can be created for them, once, and whoever claims it deletes `legado` in the
same write, seated with that PIN. They are loaded by `node tools/firebase/rankings-history.mjs --write`.

The owner (their UID) can write and delete in all these branches, to moderate.

## Uno al día (`unoAlDia`, `unoAlDiaInicio`, `invitados`, D-230)

- `unoAlDia/<jid>/<n>` = `{ j, s, ms, at, w?, p? }`: the first Uno al día attempt of day `n` (days
  since 1970). Written once by whoever is seated as that player; `w` (the mark that it was already
  added to the week) and `p` (already added to the month's points, D-412) are each added once. Anyone can read it.
  A day a 🧊 saved is only a marker, `{ c: true, at }` (D-415): written once by the phone that saved
  it, never over a day played, and it never gets `w` or `p`. The rules check its shape, not whether
  the phone held a 🧊 (they can't count wildcards); the nightly rebuild bounds what an unbacked marker
  buys (see D-415).
- `unoAlDiaInicio/<jid>/<n>` = a number, the server time when day `n`'s first attempt started (D-433,
  for everyone since 2026-10-23). Written once by whoever is seated as that player
  (`jugadorSeats`), and only as `now` (within the last minute); never rewritten. Anyone can read a
  player's; the whole branch only the owner. Another phone of the same player that finds a start here
  and no `unoAlDia/<jid>/<n>` counts that attempt 0. Nothing sweeps it yet: a number per player and day.
- `invitados/<jid>/<uid>` = `{ d, at, j?, p? }`: the `uid` phone finished its first Uno al día with an
  invitation from `jid`. Written by that phone, once, and not if it is seated as `jid`. Only the
  player `jid` reads it. `p` (D-414) is added once, by whoever is seated as `jid`, in the same write
  that adds the friend's +10 to `uno-al-dia-pts`: that write carries `i` = the friend's `uid`, keeps
  `u` and `r`, and adds exactly 10.
- In `records`, the period can also be a day (`d20731`). For the `uno-al-dia` table, the
  day's score has to be the one in its history, and the week adds a day from the history (`u`) that
  didn't have `w` yet. The `uno-al-dia-pts` table (D-412, D-414) takes only a
  month (`s<yyyy>-<mm>`): each write adds a day `u` that didn't have `p` yet, its score plus the
  streak bonus (5 × `r`, up to 50), and the streak `r` (1–10) grows at most one per write. October 2026 was filled in from the history by `tools/firebase/uad-points-backfill.mjs` as administrator (D-414), and its `--rebuild` rewrites every month's totals each night from the history and the markers (the `uad-rebuild` workflow, D-415). Details and limits in [docs/UNO-AL-DIA.md](../docs/UNO-AL-DIA.md).
- The owner reads all of `unoAlDia/`, `unoAlDiaInicio/` and `invitados/`, for the panel's Uno al día block, and
  can write and delete in both, to moderate.

## Phone notifications (`push`, `pushCopa`, `pushEnviados`, `pushDia`, `pushEnviadosDia`, D-223, D-224, D-230)

- `push/<subId>` = `{ endpoint, keys: { p256dh, auth }, lang, tz, uid, at }`: a phone's Web
  Push subscription. `subId` is 32 hex characters (the first ones of the endpoint's
  sha256). **Nobody reads it**: only the service account that sends the notifications (`tools/push/notify.mjs`, D-224), which doesn't go through
  the rules. Only the phone of that `uid` writes and deletes it, with the shape validated (`endpoint`
  https, `lang` among the four languages, `at` not later than the server time).
- `pushCopa/<código>/<pid>/<subId>` = `{ dia, plazo, at }`: which notifications that player wants in that
  cup. Nobody reads it. Written by whoever is seated as the player, and only with a subscription
  of their own (`push/<subId>/uid`, which can go in the same write); deleted by whoever is seated as
  the player ("Silenciar esta copa"). Whoever is seated as the admin deletes `pushCopa/<código>`
  whole, and only whole, when deleting the cup.
- `pushEnviados/<código>/<subId>/<clave>` = the time that notification was delivered (`dia:3`,
  `plazo:3`, `final`, `fin`, `insc:<pid>`), so it isn't repeated. Nobody reads or writes it: only
  `tools/push/notify.mjs`, with the service account (D-224), which also cleans it up.
- `pushDia/<subId>` = `{ h, d, r, w, u, c, k, m, sp, sn, at }`: what that phone asked for from the Uno al día
  notifications (the hour `h`, 0 to 23, and whether it wants the daily one, the streak one and the week one) and,
  for the text, its last day played `u`, its streak, wildcards (0 to 2) and best streak, and the week of
  that day with how many days it played (D-230). Nobody reads it; it is written by the phone whose identity
  (`auth.uid`) is the one in `push/<subId>/uid`, which can go in the same write. Any other field
  is rejected.
- `pushEnviadosDia/<subId>/<clave>` = delivery time (`dia:<n>`, `racha:<n>`, `semana:<s>`, `adios`):
  written and cleaned only by `tools/push/notify.mjs`, with the service account.
- Here the owner has no exception: their UID neither reads nor writes these branches.

## Reports (`feedback`)

La Copa's 🐞 button (D-101, D-104), the one in a language's lab (D-191), the "¿Qué te
pareció?" at the end of the lab's El caso (D-265) and the "💬 Sugerencias y comentarios" inbox at the
end of every game and in the home footer (D-341, `buzon.js`) write to `feedback/<id>` **over REST and without an account**:
`texto` (up to 1000 characters), optional `nombre`, `tester` (the label of the lab key
used to enter, up to 24; never the key, D-306), `contexto` (JSON, up to 500), optional `tipo` (the kind picked in the inbox: `sugerencia`,
`problema`, `idea` or `otro`, D-341), `v` and server `at`.
It is written only once and **read without an account**: `node tools/firebase/reports.mjs` shows them
(`--days 3` for recent ones). They carry no PIN or account data.
Every 5 minutes, the Mac mini's `feedback-watch` job (`tools/agents/feedback.mjs sync`, D-382) uploads the new ones as
GitHub issues with the `feedback` label (plus `feedback:suggestion`, `feedback:problem`,
`feedback:game-idea` or `feedback:other` when it carries a `tipo`, D-341), with the name masked (`C******* A*******`, D-279, D-366) and the key (D-306) and without the
browser, and the processes agent handles them (D-275).

**The optional email (D-317):** `feedback/<id>` may carry `correoMascara` (`j********n@g********m`, D-366; the older `j********@********m` still validates),
never the address. The address goes to `feedbackContacto/<id>` (`correo`, up to 120, and server
`at`): written once, only when `feedback/<id>` exists, and **never readable without the owner's
key**. `tools/agents/feedback.mjs reply` reads it with the key, emails the reply and deletes it;
`forget` deletes it without emailing.

**The hola@ inbox (D-318):** `buzon/<id>` keeps each email sent to hola@juegosdesalon.cl (`de`,
`nombre`, `asunto`, `texto` up to 10000, `idMensaje`, `automatico`, server `at`), written by the
Cloudflare Worker (`tools/cloudflare/inbox-worker.js`). **Only the inbox user** (Firebase Auth
`buzon@juegosdesalon.cl`, its UID in the rules) reads it or writes in it; not even anonymous
players. The support agent turns each email into a `feedback/` report with
`tools/agents/inbox.mjs` and deletes it.

## The trash bin (`cleanup`)

Nobody deletes their room when they finish playing, so the same phones that play do the cleanup
(D-39, canon C-7). The free plan has no Cloud Functions: there's nowhere to run a cron.

```
cleanup/
  sweptDay: 20341            day already swept (public watermark)
  days/20342/
    lastAt: 1757500000000    mark of the last entry, with the server clock
    rooms/ABCD: true         codes created that day
```

- On creating a room its code is written into its day's bucket **in the same multi-path update that
  creates the room** (D-321), with `lastAt` the same server stamp as the room's `createdAt`; entering
  a room overwrites `lastAt` with the server time. Codes are only added: a note can be written
  again (a code reused the same day) but never removed or changed.
- A room that no bucket names is never swept. `node tools/firebase/unnoted-rooms.mjs` lists them
  (admin key) and `--fix` deletes the expired ones and notes the live ones (D-321).
- **A bucket can only be read and deleted 6 hours after its last entry.** That is the
  condition that keeps the trash bin from ever revealing a live room: when it opens, all the
  rooms it names have already expired, because none lasts over six hours (D-89). That's why `rooms/` still can't be listed.
- Sweeping is reading the buckets of the days before today, deleting those rooms and deleting the bucket.
  A phone does it each time it creates or enters a room, at most once every 6 hours.
- `sweptDay` avoids repeating work, but anyone can move it forward (only forward and
  never past today), so the sweep always goes over the last 8 days anyway.

Logic and tests: [`public/assets/js/transport/cleanup.js`](../public/assets/js/transport/cleanup.js) ·
`node public/assets/js/transport/cleanup.test.mjs`.

## The goodbye (`left`)

The trash bin is the back door: it can only touch a room once it expired. The front one
is the goodbye (D-50, canon C-7): whoever leaves **on purpose** —cancels the room in the lobby,
exits, changes mode, moves to the rematch room— writes `left: true` in their role and,
if on rereading nobody is left without saying goodbye, deletes the room on the spot.

- `online: false` isn't enough: that's losing signal or closing the tab, and that game can
  be resumed while the room lives (C-6). On reconnecting, `left` goes back to `false`.
- They are two writes and in that order, because the rules look at the room **before** the deletion.
- The rule lists the six roles: Firebase rules can't iterate over children.

Logic and tests: [`public/assets/js/transport/dispose.js`](../public/assets/js/transport/dispose.js) ·
`node public/assets/js/transport/dispose.test.mjs`.

> **Only once, when publishing this:** rooms created before the trash bin aren't recorded
> in any bucket and nobody will sweep them. They are deleted by hand from *Realtime Database → Data*,
> removing the whole `rooms` node (there are no games in progress worth more than 6 hours).

## Usage signals (`stats`)

What the games record for the owner's panel ([docs/PANEL.md](../docs/PANEL.md)),
by environment (`prod`, `lab`, `dev`) and by day:

```
stats/prod/days/20342/
  rooms/ABCD: { game, at, v, players: { A: "Javi", B: "Cata" } }   two phones
  local/toque-y-fama/cpu/1: 7          offline games: game / mode / players → how many
  origin/America__Santiago: 12         phones that started or joined a game
  lang/es-CL: 12                      browser language
  applang/en: 4                       language chosen in the game (D-46)
  hour/21: 5                           phone's local hour
  aviso/dia: 3                         La Copa notifications tapped, by type (D-233)
  uad/dado: 9                          what is done in Uno al día, by event (D-230)
  pwa/android: 2                       opens from the installed app (?pwa), by system
  mandados/plazo: 4                    notifications delivered, by type: only notify.mjs writes them
  falla/js/cup: 3                      loads with failures, by type and page: recorded by vigia.js (D-251)
  err/a1b2c3/n: 2                      how many loads saw that error; err/<firma>/d, its detail
  listo/cup/s3: 6                      how long the page took to start, by bucket
  fin/toque-y-fama/cpu: 5              offline games finished, by game and mode (D-348)
  otra/toque-y-fama: 2                 replays ("otra vez"), by game
  comparte/app: 3                      things shared, by what
  vuelta/d2-7: 4                       days since the browser's last visit, by band
  frec/f3-7: 6                         how many of the last 28 days the browser came, by band
  activos/k3j9x0q2ab: 2                a browser's random id: 1 visited, 2 started something (D-349)
  support/open: 1                      ☕ Buy me a coffee, by step: shown, open, pay, thanks (D-448, in the lab)
stats/prod/push: { vuelta, vivas, torneos }   notify.mjs's last run and how many subscriptions are still alive
```

- `rooms/<CÓDIGO>` is created only once; each `players/<rol>` too. Nothing is edited or deleted.
- Counters only accept **going up by exactly one**: phones send
  `{".sv": {"increment": 1}}` over REST and the rules reject any other value.
- The time zone goes with `__` instead of `/` (`America__Sao_Paulo`), because the slash can't
  go in a key and names already use the underscore.
- `stats/` doesn't go in the trash bin: it's a few hundred bytes per game.
- **Keys are validated by shape, not by list** (canon C-16, D-73): the game
  (`^[a-z-]{1,40}$`), the mode (`^[a-z][a-z-]{0,15}$`, the same shape as `MODE_KEY` in
  `public/assets/js/games.js`), the number of players (`^[1-9][0-9]?$`) and the environment
  (`^[a-z]{2,10}$`). That way a new game or mode starts being counted the day it is
  published, without having to remember to come back and republish the rules. A list here rejects
  the signal on the server, the game doesn't even notice and the data never exists.
- What **does** force touching the rules: a new signal category (anything that isn't
  `rooms`, `local`, `origin`, `lang`, `applang`, `hour` or the ones below), because `$other` rejects them.
- Notifications (D-233): `aviso/<tipo>` and `pwa/<sistema>` are uploaded by phones, by one; the key
  is validated by shape (`^[a-z]{1,12}$`), and the list of types lives in `stats.js` (`TIPOS_AVISO`).
  `mandados/<tipo>` and `stats/<env>/push` aren't written by any phone: only `notify.mjs`, with the
  service account, which doesn't go through the rules.
- Uno al día (D-230): `uad/<evento>` is uploaded by phones (`trackUnoAlDia` in `stats.js`): the
  event is validated by shape (`^[a-z]{1,16}$`) and the value can only start at 1 or go up by exactly
  one. The list of events lives in `stats.js` (`EVENTOS_UAD`); it doesn't say who.
- Domains (D-348, D-349): `fin`, `otra`, `comparte`, `vuelta` and `frec` are counters like the
  others (start at 1, go up by one; keys by shape). `activos/<id>` is the only key that names a
  browser: a random 10-character id (`^[a-z0-9]{10}$`) kept in `localStorage`, whose value can only
  be 1 or 2 and never go down. Nothing else goes with it.
- Support (D-448): `support/<event>` is a counter like the others, uploaded by `support.js`; unlike
  the categories above, the event is validated **by list** (`shown`, `open`, `pay`, `thanks`), so a
  new step does force touching the rules. Only counts: nothing says who supported or how much.

- Health (D-251): `falla/<tipo>/<página>`, `listo/<página>/<tramo>` and `err/<firma>/n` are uploaded by
  `public/assets/js/vigia.js`, by one; type, page, bucket and signature are validated by shape. The detail,
  `err/<firma>/d` (`{ k, p, m, f, b, v, at }`), is written **only once** (`!data.exists()`), with the
  message capped at 160 characters and the time within a minute of the server's; that's why the count
  and the detail go in two requests: in an atomic PATCH, rejecting the detail would take the count with it.

Module and tests: [`public/assets/js/transport/stats.js`](../public/assets/js/transport/stats.js) ·
`node public/assets/js/transport/stats.test.mjs` · `node public/panel/adapta.test.mjs` (compares the shape of
the rules with the code's).

## The panel: Authentication and the owner's UID (only once)

**Two accounts cross here and the order matters.** Console work is done with the account that owns
the project (`la cuenta de la máquina`); the UID that goes in the rules is the one of the account
you want to *view* the panel with (`la cuenta de administrador`). They are different on purpose: the rule
compares the Firebase Authentication UID, not the Google Cloud permission, so passing the
rule doesn't require being the project's owner.

This account's Firebase console is **in English**, so the names below are written
as they appear on screen. Translating them to Spanish sends you looking for menus that don't exist.

1. With `la cuenta de la máquina`: **Authentication → Sign-in method → Google → Enable.**
   It asks for a *Support email for project*: the same owner account works.
2. With `la cuenta de la máquina`: **Authentication → Settings → Authorized domains → Add
   domain:** add `juegosdesalon.cl`, which is where the site lives. Authorizing
   `ellokojavi.github.io` doesn't work: it redirects with a 301 and Google sign-in happens on the
   final domain.
3. Go to `/panel/` **with `la cuenta de administrador`**: since the rules don't know that
   UID yet, the page shows it on screen instead of letting you in.
4. Put that UID in the two `.read` lines of [database.rules.json](database.rules.json)
   (`rooms` and `stats`) and publish the rules with `la cuenta de la máquina` in
   *Realtime Database → Rules → Publish*.

**Steps 1 to 4 are already done**, with the UID of `la cuenta de administrador`. They stay written in case
the account ever has to change. The UID isn't a secret: it doesn't get you into
anything, it only says which already-authenticated user can read.

While the UID isn't there, the rules fail closed: nobody reads `stats/` or lists `rooms/`.
Players never authenticate; turning on Google changes nothing for them.

If two accounts are ever needed, the rule stops being a comparison and becomes a
list: `auth != null && (auth.uid === 'UNO' || auth.uid === 'OTRO')`, in both places.

> **Two owners, on purpose.** The project was created by `la cuenta de la máquina`, a machine
> account, and for a while it was the only owner: losing its access would have meant
> losing the published app's database. Since 2026-09-11 `la cuenta de administrador`
> is also *Owner* in
> [IAM](https://console.cloud.google.com/iam-admin/iam?project=juegos-de-salon). If there is ever
> only one again, it's worth adding the second one back.
>
> Being owner in IAM and being able to enter the panel are different things: the panel compares the
> Authentication UID, not the IAM permission. Adding an owner does **not** give them access to the panel,
> and removing one doesn't take it away.

## Testing the rules over REST

```bash
DB=https://juegos-de-salon-default-rtdb.firebaseio.com
NOW=$(($(date +%s)*1000))
# the room and the player go in two steps: the `players/` rules look at the `createdAt` already
# in the database, so in a single write it doesn't exist yet and is rejected
curl -X PATCH "$DB/rooms/ABCD.json" -d "{\"createdAt\":$NOW,\"game\":\"toque-y-fama\",\"config\":{\"digits\":4}}"
curl -X PUT "$DB/rooms/ABCD/players/A.json" -d '{"name":"Javi","online":true}'

# record the room in the trash bin (should pass) and try to open the bucket (should fail: just recorded).
# The app writes this note in the same root update that creates the room (D-321)
DAY=$((NOW/86400000))
curl -X PATCH "$DB/cleanup/days/$DAY.json" -d "{\"lastAt\":$NOW,\"rooms/ABCD\":true}"
curl -X PUT "$DB/cleanup/days/$DAY/rooms/ABCD.json" -d 'true'    # noting it again: should pass (D-321)
curl -X PUT "$DB/cleanup/days/$DAY/rooms/ABCD.json" -d 'false'   # -> Permission denied
curl "$DB/cleanup/days/$DAY.json"   # -> Permission denied

# delete the live room without saying goodbye (should fail), say goodbye and delete again (should pass)
curl -X DELETE "$DB/rooms/ABCD.json"                                           # -> Permission denied
curl -X PATCH "$DB/rooms/ABCD/players/A.json" -d '{"online":false,"left":true}'
curl -X DELETE "$DB/rooms/ABCD.json"                                           # -> null

# usage signals: bump a counter by one (should pass), overwrite it with another value (should fail), read (should fail)
curl -X PATCH "$DB/stats/dev/days/$DAY.json" -d '{"local/toque-y-fama/cpu/1":{".sv":{"increment":1}},"origin/America__Santiago":{".sv":{"increment":1}}}'
curl -X PUT "$DB/stats/dev/days/$DAY/local/toque-y-fama/cpu/1.json" -d '50'   # -> Permission denied
curl "$DB/stats/dev/days/$DAY.json"                                            # -> Permission denied
```

## Spark plan quotas and limits

The app is static: there is no server of its own, so all of multiplayer depends on this
database. The ceiling doesn't come from the static design but from the free plan:

| Resource | Usual cap | What it means when playing |
|---|---|---|
| Simultaneous connections | ~100 | ≈50 two-phone games, ≈16 six-phone ones |
| Download | ~10 GB/month | |
| Storage | 1 GB | Barely relevant since D-39: the trash bin deletes what expired |

**There is no billing alert to set: the Spark plan has no billing.** Past the
cap, Firebase rejects new connections and the player can't enter the room; it doesn't
degrade gracefully, it goes down. Since v0.18 at least the player is told (D-40).

Confirm the numbers in the console before setting thresholds: Google has changed them.

### Watching it (RP-22)

1. **Firebase Console → Realtime Database → Usage**: baseline of connections, storage
   and download with real traffic.
2. **Connections alert, in Google Cloud Monitoring** (created on 2026-10-12): the policy
   [Firebase: 80 de 100 conexiones](https://console.cloud.google.com/monitoring/alerting/policies/2345084699692281801?project=juegos-de-salon)
   watches `firebasedatabase.googleapis.com/network/active_connections` and alerts by email
   (channel "JBot Mac Mini GCloud Notification") when it goes over 80. It was created by hand in the console: the
   service account key is for the database, not for configuring Google Cloud.
3. **Monthly download: no alert yet.**

### If usage really grows

The cap on rooms per phone (D-41) stops accidental abuse, not the determined kind: whoever wants to
abuse hits the REST API with `curl`. The only thing that closes that door is **anonymous
authentication** (`signInAnonymously`) with rules that require `auth != null`, which would also allow
per-user rules instead of "anyone with the code". It's another security model and
deserves its own decision; moving to Blaze solves the ceiling but opens the door to a
bill from abuse, so it calls for a spending cap.
