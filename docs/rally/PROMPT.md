# The prompt that starts a session on Rally

Paste the block below into a new Claude Code session opened on this repo. It is the same prompt for
every session of the project: it sends the session to [PROGRESS.md](PROGRESS.md) to find the phase
to work on, so it does not go stale as phases close. To steer one session, add a line at the end
("Only phase 1.1", "The owner answered decisions 1 to 3: …").

```text
You are picking up a game project for Juegos de Salón (this repo): a rally time-trial driving game
that so far exists only as a design. Nobody has written code for it yet, or an earlier session has
and left its state for you. Either way, everything you need is in docs/rally/.

Background, so you know why the design is shaped the way it is. The owner saw a short clip of a
low-poly 3D rally game and asked how hard it would be to build something like it here. The honest
answer was: the clip itself is far beyond what this site has ever done, but the fun in it comes from
how the car feels and from racing a clock through gates, and that can be built and tested cheaply
from above in 2D first. So the work is laid out as three paths that are really one game with one
engine and a growing renderer: 1) top-down 2D, 2) simple 3D behind the same engine, 3) a backlog of
extras from the clip. Path 1 is the recommended start and is a complete game by itself. The paths
are stopping points, not a promise to reach the last one: after each, the owner decides by playing
and by one agreed number whether to go on.

Start by reading, in this order:
1. CLAUDE.md, the rules every session follows.
2. docs/rally/README.md, the index and how to work on this.
3. docs/rally/PROGRESS.md, where the project stands: the next phase, the owner's open decisions,
   the log. This file tells you what to do in this session.
4. docs/rally/constraints.md and docs/rally/core.md, the site's rules as they apply to this game and
   the design all paths share.
5. The file of the path in progress (docs/rally/path-1-top-down.md to begin with), and within it
   the phase PROGRESS.md names.
Read reference.md when you need to know what the clip showed; you do not have the clip and do not
need it. Read the other paths only when you reach them.

Then do the next phase, and only that phase:
- If the phase needs decisions from the owner that PROGRESS.md shows unanswered, ask those first,
  as short one-tap choices with the recommended option first. Ask only what this phase needs. The
  owner writes in Spanish; answer in Spanish. Everything that goes into the repo is English, except
  what the player reads, which is Spanish, English and Portuguese.
- Build the phase to its exit list. The exit list is what done means; quote it in the PR and say
  what you measured.
- Update docs/rally/PROGRESS.md in the same PR: the phase's status, any decision answered, a line
  in the log. If building showed the design was wrong somewhere, change that section of the design
  in the same PR and say so in the log. These docs are a starting design, not a contract, and the
  numbers marked "starting value" exist to be tuned.
- Follow the repo's own process for everything else (worktree and topic branch, the game-change,
  css-change and player-text skills before code, CSS and player text, tests, changelog entry, the
  lane, the PR driven to merge). CLAUDE.md and docs/rally/constraints.md point to each rule; when
  they disagree with docs/rally/, the repo's rules win and you fix docs/rally/.

What matters most, where judgement is needed:
- The engine knows nothing about how the game is drawn, and its physics is flat in every path. That
  boundary is what makes three paths one game. If you find yourself wanting the scene to change the
  car, or a second engine for 3D, stop and fix the boundary instead.
- Whether this game is good is decided by how the car feels under a thumb on a phone held upright,
  and tests cannot tell you that. The owner can. Get a drivable build onto a PR preview early and
  tune with the owner in rounds, using the lab tuning panel so a round takes minutes. Give the
  owner a link only when the preview check says it is ready.
- The owner is sensitive to camera movement. Keep every camera calm: damped, no shake, no zoom on
  speed, and still under reduced motion.
- Everything stays in the lab and invisible to players until the owner launches it. Launching is a
  separate piece of work with its own playbook; never fold it into a build phase.
- Resist the clip. When a phase tempts you toward a feature from a later path, write it in
  PROGRESS.md's "Later" list and leave it out of the PR. If path 1's feel round fails after a real
  attempt, the right move is to stop and say so, not to hope 3D fixes it.
- Facts about the repo in docs/rally/ were true on 2026-11-25. The repo changes daily: check a file,
  function or command still exists before you rely on it.

When the phase's PR is open and on its way to merge, tell the owner in a few lines: what they can
now do or see (with the live link if there is one), what you measured, what you need from them
next, and which phase comes after.
```

## Why the prompt is written this way

- **It carries the why.** A session that knows the paths are stopping points, and that feel decides
  everything, makes better calls in the gaps than one handed a list of steps.
- **It points at files instead of repeating them.** The design changes as it is built; the prompt
  should not.
- **It names the few places a capable session still goes wrong here**: breaking the engine
  boundary, trusting tests over the owner's thumb, an eager camera, drifting toward the clip.
- **It ends with what to report**, because the owner reads on a phone and wants the link, the
  numbers and the next question, in that order.
