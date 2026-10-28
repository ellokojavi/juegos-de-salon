level: patch

- **Search engines read the home page in its own language.** The English, Portuguese and German home pages now give search engines their own name (Party Games, Jogos de Salão, Salonspiele) instead of the Spanish one. A new check (`tools/e2e/structured-data.mjs`) opens every indexed page in a browser and fails when its structured data says something the page does not show, such as a «Cómo se juega» answer that differs from the rules on the cover (#883).
