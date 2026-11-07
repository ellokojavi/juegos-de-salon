// Generated from game.json by node tools/generators/manifests.mjs: do not edit by hand.
export default {
  "id": "ahorcado",
  "path": "hangman/",
  "emoji": "🪢",
  "name": {
    "es": "El Ahorcado",
    "en": "Hangman",
    "pt": "Forca"
  },
  "tagline": {
    "es": "Adivina tu palabra antes de quedarte sin vidas. Acá nadie se queda mirando.",
    "en": "Crack your word before you run out of lives. Nobody sits this one out.",
    "pt": "Descubra sua palavra antes de ficar sem vidas. Aqui ninguém fica só olhando."
  },
  "keywords": {
    "es": [
      "palabras",
      "letras",
      "adivinar",
      "vocabulario",
      "vidas"
    ],
    "en": [
      "hangman",
      "words",
      "letters",
      "guess",
      "vocabulary",
      "lives"
    ],
    "pt": [
      "forca",
      "palavras",
      "letras",
      "adivinhar",
      "vocabulário",
      "vidas"
    ]
  },
  "players": {
    "min": 1,
    "max": 6
  },
  "duration": "5–12",
  "tipos": [
    "words"
  ],
  "jugadas": [
    "word",
    "guess",
    "buy"
  ],
  "unoAlDia": {
    "orden": 7,
    "desde": "2026-10-07",
    "grupo": true
  },
  "available": true,
  "modes": [
    "local",
    "online",
    "solo",
    "uno-al-dia"
  ],
  "ai": false,
  "memory": "juegos-de-salon:ahorcado:session",
  "languages": [
    "es",
    "en",
    "pt"
  ],
  "firebasePaths": [
    "rooms/{code}"
  ],
  "canonExceptions": [
    {
      "canon": "C-8b",
      "why": "A wrong letter does not block the screen (D-56): a miss is the game's normal move, so its signal is unmistakable but only the round's verdict waits for a tap."
    },
    {
      "canon": "C-10",
      "why": "No hash when no secret is dealt: with a deck the word comes from the seed, with a chain on one phone there is nobody to fool; the hash runs for a chain on several phones (D-65)."
    }
  ]
};
