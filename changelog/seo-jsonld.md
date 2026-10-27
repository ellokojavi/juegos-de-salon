level: patch

- **Search engines**: every game page on the home page and the four language doors now carry structured data (JSON-LD: the game's name in four languages, free, no account, number of players), and the site has a `sitemap.xml` with the doors' language alternates and a `robots.txt` that names it. All of it is generated from `games.js` by `node tools/release/og.mjs cards` and checked by `og.mjs check`, so it cannot fall behind; lab pages stay out (#887).
