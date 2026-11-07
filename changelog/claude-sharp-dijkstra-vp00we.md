level: patch

- **Rule registry** (D-541, #1249 step 2): `docs/rules.json` lists every rule with its form (🤖 check, 📈 ratchet, 👁 judged): the design system, English and the 33 usability rules; `tools/agents/rules.mjs index` generates the index in `docs/RULES.md`, and `rules.test.mjs` fails on a rule without its form, a check naming a file that does not exist, a judged rule without its reviewer, or a usability mark that disagrees with `docs/USABILIDAD.md`.
