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

### ⚖️ The owner's decision

Before the build, the owner writes the rubric's judgment criteria in their own words, five at
most, answering: *what makes a clue in Agentes good, and what makes one bad even when it is
correct?* The session turns them into checkable criteria and shows them back. Options to speed
it up:

- **A.** Start from the four criteria above and edit them.
- **B.** Label 20 of the existing clues as good/so-so/bad with one line each, and let the
  session draft the criteria from the labels (the owner then edits).
- **C.** Both: A for the mechanical ones, B for the judgment ones.

## Plan

| Step | Kind | What | Done when |
|---|---|---|---|
| 1.1 | concept | This page; the owner answers the decision | The rubric's criteria are in this file |
| 1.2 | build | `tools/generators/clues/` with the mechanical checks as a script and its test; the eval cases file (`cases.json`: the 100 clues plus deliberately bad ones, each labelled) | The script runs on the existing clues and flags nothing wrong, or what it flags is a real defect |
| 1.3 | build ⚖️ | The judge: the rubric as a prompt, the model called from a session (not a job) on the cases; the agreement with the labels printed | Agreement ≥ 9 in 10 on the labelled cases, or the rubric is revised and the step repeats |
| 1.4 | build | The generator: a session produces 100 new clues per language against the current board rules (D-288), the judge filters, the result lands as a lab deck behind the flag `clues-generated` with its `/labs/` card | The card shows the counts; the owner plays a generated board with a lab key |
| 1.5 | learnings | The owner reviews a sample, the number is recorded, the *Learnings* section is written; `lab-ready` (D-528) says when the deck may be published | Learnings written, the flag's card says ✅ or why not |

The model is called by hand from a session in 1.3 and 1.4, never from a scheduled job: generation
is occasional, and a job that calls a model spends the plan while nobody watches.

**How this mechanism is removed**: if a generated deck never reaches "✅ Listo para 🚀", the
generator and judge are deleted and the eval cases stay as documentation of why.

## Status

- 2026-11-04 · 1.1 concept written in the planning session; waiting for the owner's rubric (A, B or C).

## Learnings

*(written with the owner when a step ends)*
