level: patch

- **The 🧱 Stack teaser now looks like the game**: it is drawn with the game's own isometric scene
  (now `public/labs/stack/scene.js`, shared by both) instead of a flat side view, and a teaser in the
  splash is centered on a computer, where it sat to the left. Still off, waiting for the owner.
- **The 🥷 Stick Ninja teaser now looks like the game too**: drawn with the game's own scene (now
  `public/labs/stick/scene.js`) instead of its own pixel art with a full moon and black pillars. A new
  test (`marketing/splash/teaser.test.mjs`) fails if a teaser draws nothing with its game's code.
