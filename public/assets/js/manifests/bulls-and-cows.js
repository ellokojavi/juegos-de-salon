// Generated from game.json by node tools/generators/manifests.mjs: do not edit by hand.
export default {
  "id": "toque-y-fama",
  "path": "bulls-and-cows/",
  "emoji": "🔢",
  "name": {
    "es": "Toque y Fama",
    "en": "Bulls and Cows",
    "pt": "Toque e Fama"
  },
  "tagline": {
    "es": "Adivina el número o la palabra secreta con toques y famas.",
    "en": "Crack the secret number or word with bulls and cows.",
    "pt": "Descubra o número ou a palavra secreta com toques e famas."
  },
  "keywords": {
    "es": [
      "numeros",
      "adivinar",
      "codigo",
      "secreto",
      "mastermind",
      "duelo",
      "logica"
    ],
    "en": [
      "numbers",
      "guess",
      "code",
      "secret",
      "mastermind",
      "bulls",
      "cows",
      "duel",
      "logic"
    ],
    "pt": [
      "números",
      "adivinhar",
      "código",
      "secreto",
      "mastermind",
      "duelo",
      "lógica"
    ]
  },
  "players": {
    "min": 1,
    "max": 2
  },
  "duration": "5–12",
  "tipos": [
    "logic"
  ],
  "jugadas": [
    "guess"
  ],
  "reuses": [
    "cup/games/number/"
  ],
  "available": true,
  "modes": [
    "local",
    "online",
    "solo"
  ],
  "ai": false,
  "memory": "juegos-de-salon:toque-y-fama:session",
  "languages": [
    "es",
    "en",
    "pt"
  ],
  "firebasePaths": [
    "rooms/{code}"
  ],
  "canonExceptions": []
};
