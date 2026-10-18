level: patch

- **All promotional material has its home in `marketing/`** (D-356): the share cards' drawing moves to `marketing/share-cards/` (the same drawing: the cards do not change), and every promotional file the site serves (share cards, splash clips, the email header, the video's thumbnail) names its asset in `marketing/registro.json`, checked by `marketing/served.test.mjs`. Nothing changes for players.
