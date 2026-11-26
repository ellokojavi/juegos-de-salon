# Path 3 · Everything the clip shows

**Not a project: a backlog.** Building "the clip" as one piece of work is the wrong unit for this
site: most of what separates it from path 2 is content and polish, which has no natural end, and
none of it changes whether the game is fun. So path 3 is a list of **independent increments on top
of a finished path 2**, each small enough to be one PR behind its own flag, each with its own reason
to exist, taken one at a time and only when the owner asks for that one.

Start nothing here until path 2's verdict (phase 2.5) is in and the owner picks an item.

## The increments

Ordered by what a player gains for what it costs. "Needs" names what must exist first.

| # | Increment | What the player gains | Cost | Needs | Watch out for |
|---|---|---|---|---|---|
| 3.1 | **Three settings in 3D**: meadow by day, burnt forest at sunset, plain at dusk on asphalt | Variety from week to week | Small each: a palette, a sun direction, a prop set. The burnt forest needs one new prop (a bare trunk), the plain needs houses and guard rails | Path 2 | Each setting re-measured on the modest phone: bare trunks are many and cheap, houses are few and bigger |
| 3.2 | **Replay after the finish**: the run played back from fixed cameras beside the road and one high view, as the clip cuts between | The reward shot; something to share | Medium. The run is already recorded for the ghost (positions every 100 ms); add interpolation fine enough for a close camera, three camera kinds and a cut list made from the stage (a camera at each gate, a high one on the longest bend) | Path 2, the ghost | The owner's sensitivity to camera movement: fixed cameras that pan to follow, cuts instead of swoops, slow and far for the high one, nothing at all under reduced motion. It plays **after** the result is shown, never in front of it (C-19) |
| 3.3 | **A share clip or picture of the run** | Players show their time | Medium to large. A picture (the result card with the stage's outline and the time) goes through `compartir.js` like every result. A video means recording the canvas, which browsers support unevenly | 3.2 for video | Start with the picture. Read [SHARING.md](../SHARING.md) first |
| 3.4 | **A second car** | A reason to replay a stage | Small to draw (a different set of boxes). Large if it drives differently: a second `TUNING` set splits every ranking in two | Path 2 | Decide with the owner whether it is a skin (one ranking) or a class (a table per car, `drift_<car>`). Skin first |
| 3.5 | **Real-time shadows** | The car's shadow moves over the bumps; trees shade the car | Large on renderer A (a depth pass, an extension, tuning for acne and edges); modest on Three.js | Path 2; re-opens the renderer decision | Costs a second pass over the scene every frame: only for phones that have the headroom, with baked shadows as the fallback. The clip's long shadows are already there, baked |
| 3.6 | **Suspension you can see**: each wheel follows the ground, a wheel lifts in a hard corner | The clip's most charming detail | Medium, all in the scene: four heights sampled under the wheels, the body rests on them with a spring | Path 2 | Still drawn from the flat state. Nothing feeds back into grip |
| 3.7 | **Hills that matter and crests that unsettle the car** | Depth for expert players | Large, and the only item that changes the engine: slope added to acceleration, grip reduced over a crest, perhaps airtime | Path 2, a stable game with a ranking people care about | It invalidates every par and every existing time: a new season of the ranking, said to players. Re-run the autopilot over the pool. Path 1's scene must still be playable on the same stages, so the effect has to be legible from above or small |
| 3.8 | **Sun glare and glow** | The clip's low sun in the eyes | Small on renderer A as a drawn halo; a true bloom is a post-processing pass | Path 2 | A sun dead ahead hides the road. Pretty in a clip, unfair in a time trial: keep the halo, keep the road readable |
| 3.9 | **A friend's ghost or the leader's** | Racing someone | Medium in code, heavy in consequence: runs are uploaded and kept | The ghost, the ranking | New stored data about players: Firebase rules and the `/privacy/` page change, a 🔴 PR the owner approves. Size and retention decided first |
| 3.10 | **Weather and time of day** (rain, dusk into night with headlights) | Mood | Medium; rain that changes grip is an engine change like 3.7 | 3.1 | Darkness and rain cut how far the player sees: the same fairness question as 3.8 |
| 3.11 | **The game elsewhere on the site**: Uno al día, La Copa's pool, Duels | Reach | Each is that feature's own playbook, not a rally task | A launched game | [UNO-AL-DIA.md](../UNO-AL-DIA.md), `docs/games/cup.md`, the `launch-game` skill. A La Copa game scores 0 to 100, which the par-based score already gives |

## Rules for taking one

- **One at a time, the owner's pick.** Record it in [PROGRESS.md](PROGRESS.md) with the reason.
- **Its own flag** until the owner turns it on, even when the game itself is launched (D-395).
- **Its own number**, named before building: what would show it was worth it. For most of these the
  honest number is the same second-run share with the flag on against off; for 3.3 it is shares sent.
- **It states how it is removed** if it does not earn its place: a flag off and a file deleted.
- **Budget re-measured** on the modest phone in the PR. An increment that takes the game under 60
  frames a second there ships with an automatic off switch or does not ship.
- **Both scenes stay playable.** Path 1's scene is the fallback for phones without WebGL: an
  increment may not make a stage undrivable or unfair there.

## What would make the whole of path 3 a mistake

- Doing it before the game has players who return. Polish does not create a reason to come back;
  the weekly stage, the ghost and the ranking do, and they are in path 1.
- Treating the clip as the target. It is a recording of a game for a big screen and a keyboard or a
  gamepad, made by people whose whole product it is. Ours is one game among dozens on a phone held
  in one hand. What is worth taking is already in paths 1 and 2.
- Letting model files, textures or a physics library in through this door. Each is a standing cost
  on a site with no build step and an offline budget; each would be a decision of its own (a D-n),
  not a detail of an increment.
