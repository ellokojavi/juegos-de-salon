// Generated from game.json by node tools/generators/manifests.mjs: do not edit by hand.
export default {
  "id": "batalla-naval",
  "path": "battleship/",
  "emoji": "⚓",
  "name": {
    "es": "Batalla Naval",
    "en": "Battleship",
    "pt": "Batalha Naval"
  },
  "tagline": {
    "es": "Hunde la flota del rival antes de que hunda la tuya.",
    "en": "Sink your rival's fleet before they sink yours.",
    "pt": "Afunde a frota do rival antes que ele afunde a sua."
  },
  "keywords": {
    "es": [
      "barcos",
      "flota",
      "hundir",
      "mar",
      "guerra",
      "duelo",
      "estrategia"
    ],
    "en": [
      "battleship",
      "ships",
      "fleet",
      "sink",
      "sea",
      "war",
      "duel",
      "strategy"
    ],
    "pt": [
      "navios",
      "barcos",
      "frota",
      "afundar",
      "mar",
      "guerra",
      "duelo",
      "estratégia"
    ]
  },
  "players": {
    "min": 1,
    "max": 2
  },
  "duration": "10–20",
  "tipos": [
    "logic"
  ],
  "jugadas": [
    "shot"
  ],
  "unoAlDia": {
    "orden": 8,
    "desde": "2026-10-07",
    "grupo": true
  },
  "available": true,
  "modes": [
    "local",
    "online",
    "cpu",
    "uno-al-dia"
  ],
  "ai": true,
  "memory": "juegos-de-salon:batalla-naval:session",
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
