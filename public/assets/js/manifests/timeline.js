// Generated from game.json by node tools/generators/manifests.mjs: do not edit by hand.
export default {
  "id": "linea-de-tiempo",
  "path": "timeline/",
  "emoji": "⏳",
  "name": {
    "es": "Línea de Tiempo",
    "en": "Timeline",
    "pt": "Linha do Tempo"
  },
  "tagline": {
    "es": "Ubica los hitos en el orden correcto. Seis temáticas, de la historia a la música.",
    "en": "Put the milestones in the right order. Six themes, from history to music.",
    "pt": "Coloque os marcos na ordem certa. Seis temas, da história à música."
  },
  "keywords": {
    "es": [
      "historia",
      "orden",
      "ordenar",
      "fechas",
      "hitos",
      "futbol",
      "cultura",
      "preguntas"
    ],
    "en": [
      "timeline",
      "history",
      "order",
      "sort",
      "dates",
      "events",
      "soccer",
      "football",
      "trivia",
      "quiz"
    ],
    "pt": [
      "história",
      "ordem",
      "ordenar",
      "datas",
      "marcos",
      "futebol",
      "cultura",
      "perguntas",
      "quiz"
    ]
  },
  "players": {
    "min": 1,
    "max": 6
  },
  "duration": "10–20",
  "tipos": [
    "trivia"
  ],
  "jugadas": [
    "place"
  ],
  "reuses": [
    "cup/games/timeline/",
    "cup/games/year/engine.js",
    "cup/games/mazos.js"
  ],
  "available": true,
  "modes": [
    "local",
    "online",
    "solo"
  ],
  "ai": false,
  "memory": "juegos-de-salon:linea-de-tiempo:session",
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
      "canon": "C-10",
      "why": "No hidden information: the hands show no years and every phone works out a move from the code, so there is nothing to commit with a hash; on one phone the turn is only announced (C-9 without showCover)."
    }
  ]
};
