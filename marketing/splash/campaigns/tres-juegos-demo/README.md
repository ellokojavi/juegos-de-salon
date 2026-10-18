# 🎉 ¡Tres juegos nuevos! (`tres-juegos-demo`)

The first splash campaign (D-351): the three logic games that left the lab (D-332).

| | |
|---|---|
| Items | 🚇 Rutas rotas (`rutas`), 📐 Loteo (`loteo`), 🖌️ Pintaminas (`pintaminas`), each with its clip |
| On | 2026-10-18, through 2026-10-23 inclusive (`until`, the player's local time) |
| Turned on by | [#524](https://github.com/ellokojavi/juegos-de-salon/pull/524), published by [#525](https://github.com/ellokojavi/juegos-de-salon/pull/525) |
| Usability | went live unreviewed (before D-355); reviewed with the PR that set its Spanish title to "¡Upa, papá! Tres juegos nuevos" (the owner's request) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash tres-juegos-demo --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg) · [de](de-390.jpg).

## History

- **2026-10-18:** live with the title "¡Tres juegos nuevos!" in every language.
- **2026-10-18:** the Spanish title becomes "¡Upa, papá! Tres juegos nuevos" (only Spanish, the owner's
  request), and "Ahora no" loses the focus frame. Phones that already closed it do not see it again:
  the id is the same.
