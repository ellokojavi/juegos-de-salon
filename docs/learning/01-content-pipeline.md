# Piece 1 · Endless content with quality control

Part of the [learning programme](../LEARNING.md) (D-532). Read that file first.

## Goal

A pipeline that **generates** game content with a model at build time, **judges** it against a
rubric the owner wrote, and **commits** only what passes, as static data the player loads as
today. First on 🕵️ Agentes (`docs/games/agents.md`: 100 hand-written clues per language, D-288),
then reusable for a Bachillerato answer bank, for puzzles verified as "deducible without
guessing", and for the Portuguese translations.

The player never touches the model. The game stays fast, offline and free.

## Why

- **For the app**: a game that does not run out of boards, and one pipeline that every later
  content need reuses.
- **For the owner**: the skill of writing an **eval**. A test says whether code does what it
  should; an eval says whether what a model produced meets a standard the owner defined. It is
  the most asked-for skill of a product manager working with AI, and most know it only by name.
  Every other piece of the programme needs it to choose a model.

## The number

Of 100 generated clues, how many the judge accepts, and of a sample of the accepted ones, how
many the owner agrees with (and of the rejected ones, how many the owner would have kept). The
pipeline works when the owner agrees with the judge at least 9 times in 10, both ways.

## Concept (for the owner, before any code)

A clue in Agentes is a word and a number: «MAR · 3» means three of the fifteen codenames on the
board go with MAR. The player taps them; neutrals cost 15, the assassin 40 and ends the clue.
The 100 clues per language were written by hand, and each was good for a reason nobody wrote
down. The first job of this piece is to write that reason down.

**An eval has three parts.**

1. **A set of cases**: here, boards with their clue. Some good, some deliberately bad, some
   borderline. The 100 existing clues are the first good cases; the bad ones are made on purpose
   (a clue that is one of the words on the board, a clue that fits the assassin better than the
   agents, a clue nobody in Chile would get).
2. **A rubric**: the criteria a clue must meet, each one checkable. Not "the clue is good", but
   "every agent word has an obvious link to the clue that a 12-year-old would see", "the assassin
   does not fit the clue better than the weakest agent", "the clue is not a word on the board nor
   contains one", "the clue is one word in the language of the deck". Some criteria a script can
   check (the last two); some need judgment (the first two), and those are what a judge model
   reads.
3. **A judge**: a script that applies the mechanical criteria, then a model that scores each
   judgment criterion for each case, with the rubric as its instruction, and returns a verdict
   with its reason. The judge is itself checked: it must agree with the owner on the cases the
   owner labelled by hand. If it does not, the rubric is unclear, not the model.

**What makes this product work, not engineering**: the rubric is a definition of quality, and
only the owner can write it. A rubric that is vague ("fun", "clever") cannot be applied by a
machine or by a new teammate; one that is precise can. The exercise of making "a good clue"
precise is the same exercise as writing acceptance criteria for a feature, done for a
non-deterministic producer.

**What the owner will see at the end of the build**: a table per language with the generated
clues, the judge's verdict and reason on each, and a sample for the owner to agree or disagree
with. The agreement rate is the number.

**Traps the piece will meet, so they are not surprises**:

- A judge that agrees with everything (the rubric is too soft) or nothing (too strict).
- A generator that learns the rubric's letter: clues that pass every criterion and are dull.
  A criterion for surprise ("the link is not the first word a dictionary gives") is hard to write
  and worth trying.
- Spanish is not one language: a clue obvious in Chile may be opaque in Mexico. The deck is
  Spanish by default (C-3); the rubric decides whose Spanish.
- The three languages are three decks, not one translated (D-170): the pipeline runs per
  language, with a rubric per language if needed.

### ⚖️ The owner's decision (taken 2026-11-04: option C)

The owner chose to label 20 existing clues and let the session draft the criteria from the
labels, then edit them. The labels and the draft follow; the criteria are the owner's to edit
before step 1.2 starts.

### The 20 labelled clues (Spanish deck, 2026-11-04)

A clue here is the deck entry: the clue word, its `si` words (agents come from them) and its
three `casi` temptations (neutrals and the assassin come from them). The owner's words, condensed.

| # | Clue | Label | The owner's reason |
|---|---|---|---|
| 1 | MAR | so-so | RÍO and LAGO are bodies of water like MAR; PISCINA is artificial and breaks the trio |
| 2 | HOSPITAL | good | clear agents; temptations close and well chosen |
| 3 | NOCHE | good | LINTERNA slightly outside; TARDE, NEGRO, SOMBRA tempt well; DÍA would have been a problem |
| 4 | CINE | good | agents are the cinema as a place; TEATRO and TELEVISIÓN tempt as art forms; TELEVISIÓN and LIBRO being objects is a minor doubt |
| 5 | OFICINA | so-so | agents right; ESCUELA, BANCO, TIENDA are too far from an office to tempt |
| 6 | ROJO | good | the `si` words *can* be red without always being red; temptations are other colours and work one at a time |
| 7 | AUTO | good | parts, actions and places of a car; other means of transport distract well |
| 8 | BODA | good | things that happen at a wedding; other life events distract well; BRINDIS somewhat general but qualifies |
| 9 | SELVA | good | elements, traits and regions; BOSQUE is borderline but works one at a time |
| 10 | BOMBERO | good | VOLUNTARIO is a trait more than an element, could go; the distractors work one at a time |
| 11 | RESTAURANTE | good | almost all parts of a restaurant; PICNIC is eating, CAFETERÍA and HOTEL are the service world: right decoys |
| 12 | VAMPIRO | good | associations of a vampire; FANTASMA, ZOMBI, LOBO are other fictional creatures, out as a group |
| 13 | ABUELA | good | attributes of a grandmother; MAMÁ, TÍA, BEBÉ work if one appears; two or more could read as a second group with no way to deduce |
| 14 | DENTISTA | good | all elements of the dentist; the temptations are other professions |
| 15 | ACUARIO | good | all make sense; PISCINA, PESCA, ZOOLÓGICO are related but not directly |
| 16 | FERIA (cl) | good | the vegetable market; SUPERMERCADO, CIRCO, MALL are other kinds of commerce |
| 17 | MIEDO | good | SORPRESA, NERVIOS, VERGÜENZA are emotions not tied to fear |
| 18 | AMOR | good | agents right; AMISTAD, CELOS, DIVORCIO right |
| 19 | ALTURA | so-so | JIRAFA is a tall animal while ESCALERA, AVIÓN, GLOBO, CÓNDOR, NUBE reach high: two different links, to be checked; POZO, SUBMARINO, CUEVA have nothing to do with it |
| 20 | PAZ | so-so | ABRAZO may not be peace and could go; NOBEL is the peace prize, outside peace as an idea; GUERRA, SILENCIO, SUEÑO have nothing to do with it |

Totals: 16 good, 4 so-so, 0 bad. **What the labels say:**

- In the classic clues, quality varies in the **temptations** (1, 5), never in the agents. In the
  idea clues (17 to 20) it varies in the **agents** (19, 20). A judge must read both halves.
- The owner applies a **count rule** on their own (6, 9, 10, 13): a temptation works when one of
  its clue's temptations is on the board; two or more of the same clue can read as a second group.
  Measured on 300 generated Spanish boards: 192 have two or more temptations of one clue, and
  **51 have a clue with as many of its temptations on the board as agents**, the case where the
  number cannot pick the group. The engine prefers neutrals from other clues than the assassin's
  but does not enforce this (`engine.js`, `generar`). Whether to enforce it is the owner's call,
  behind a flag, measured with the panel's numbers; nothing changes yet.
- The owner is **lenient on temptations of idea clues** (SILENCIO for PAZ, SOMBRA for NOCHE are
  fine for them) and **strict on agents of idea clues** (ABRAZO, NOBEL). A judge calibrated on
  the classic clues alone would be wrong on the ideas.
- A hand-written deck has no *bad* entries: the eval needs deliberately bad cases, made on purpose.

### Draft rubric (for the owner to edit)

The owner replaced the session's first formulation ("a temptation is a sibling of the clue,
never a child") with a more general one: what matters is **consistency**, not a fixed level.

**Mechanical, a script checks (M):**

- M1. Deck shape: one word per card in capitals, at most 15 letters, 9 or 10 `si` and 3 `casi`
  per clue; no month or Easter in a season (already in `engine.test.mjs`).
- M2. The clue word is not among its own `si` or `casi`, and no `si` word contains it.
- M3. On a board, no clue has as many of its temptations as it has agents (new; 51 of 300
  boards fail it today).

**Judgment, a model scores with the rubric as instruction (J):**

- J1. **Seen without explaining.** Each `si` word goes with the clue for a 12-year-old in
  Chile without a sentence of explanation. "Can be" is enough (TOMATE for ROJO); exclusivity is
  not required. The weakest `si` word sets the grade.
- J2. **One relation among the `si`.** All `si` words relate to the clue the same way (part of,
  instance of, happens at, cause of, symbol of). A mix of relations (ALTURA: things that are tall
  and things that go high) lowers the grade.
- J3. **Each temptation has another relation.** A temptation relates to the clue differently
  from the `si` words and cannot be defended as one of them by any table (the typical form: the
  same kind as the clue word, another colour, another profession, another life event). "Arguable"
  is a defect.
- J4. **Each temptation tempts.** It is close enough to make a player hesitate (ESCUELA for
  OFICINA is not).
- J5. **The trio is coherent.** The three temptations are of one kind (PISCINA among RÍO and
  LAGO is not). Softer than J3 and J4: it cost MAR a grade, not CINE.
- J6, candidate. **Variety among the `si`.** Parts, actions, places and traits mixed read richer
  than nine objects. The owner has not said whether it is a criterion.

**Grades:** good = passes all; so-so = fails J2, J4 or J5, or one weak `si` word; bad = fails
J1 on two or more words, or J3 on any temptation, or M2.

**Open for the owner:** whether J6 enters; whether M3 should be enforced by the generator (a
flag, measured) or only reported; whether the hidden rule the deck follows (one relation inside,
another outside) should be told to the player somewhere.

## Plan

| Step | Kind | What | Done when |
|---|---|---|---|
| 1.1 | concept | This page; the owner answers the decision | The rubric's criteria are in this file, edited by the owner |
| 1.2 | build | `tools/generators/clues/` with the mechanical checks as a script and its test; the eval cases file (`cases.json`: the 100 clues plus deliberately bad ones, each labelled) | The script runs on the existing clues and flags nothing wrong, or what it flags is a real defect |
| 1.3 | build ⚖️ | The judge: the rubric as a prompt, the model called from a session (not a job) on the cases; the agreement with the labels printed | Agreement ≥ 9 in 10 on the labelled cases, or the rubric is revised and the step repeats |
| 1.4 | build | The generator: a session produces 100 new clues per language against the current board rules (D-288), the judge filters, the result lands as a lab deck behind the flag `clues-generated` with its `/labs/` card | The card shows the counts; the owner plays a generated board with a lab key |
| 1.5 | learnings | The owner reviews a sample, the number is recorded, the *Learnings* section is written; `lab-ready` (D-528) says when the deck may be published | Learnings written, the flag's card says ✅ or why not |

The model is called by hand from a session in 1.3 and 1.4, never from a scheduled job: generation
is occasional, and a job that calls a model spends the plan while nobody watches.

**How this mechanism is removed**: if a generated deck never reaches "✅ Listo para 🚀", the
generator and judge are deleted and the eval cases stay as documentation of why.

## Status

- 2026-11-04 · 1.1 concept written in the planning session; the owner chose C.
- 2026-11-04 · 20 clues labelled by the owner in conversation, criteria drafted from the labels; waiting for the owner's edits (J6, M3, the hidden rule).

## Learnings

*(written with the owner when a step ends)*
