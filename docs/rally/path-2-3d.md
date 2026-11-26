# Path 2 · Simple 3D

The same game drawn from behind the car in a low-poly world. **Nothing in the engine, the input, the
stages, the HUD or the rules changes**: this path adds one scene file behind a flag and keeps path
1's scene as the fallback. Start it only after path 1's verdict (phase 1.6) and the owner's yes.

## What the player gets, and what they do not

They get: a chase camera, a low-poly car that leans in corners, a road that rises and falls, trees,
fences and walls, fog to a soft horizon, a big sun, long shadows, dust and tyre tracks. One setting
first.

They do not get, in this path: replay cameras, real-time shadows, a second car, more than one
setting at first, hills that change the physics. Those are [path 3](path-3-full.md).

## The renderer decision (phase 2.0, a D-n)

There is no 3D library on the site and no build step. Two ways, and the choice is made on
measurements, not taste.

| | A · A small renderer of our own (WebGL) | B · Three.js, vendored |
|---|---|---|
| What it is | A few hundred lines: 4×4 matrices, a mesh builder, one shader (flat colour per vertex, one sun light, fog), static chunks drawn in one call each | The library's ES module committed under `public/assets/js/vendor/` with its licence (MIT), imported by the scene |
| Fits what path 2 needs | Yes: untextured flat-shaded triangles, one light, fog, no model files, no real-time shadows | Yes, with much to spare |
| Weight | A few kilobytes | Of the order of a megabyte minified: measure the release you would vendor. A quarter of the offline precache's remaining room once launched |
| Precedent here | The dice and Dónde's globe are hand-written WebGL | The QR library is the only vendored code, 57 KB |
| Risk | We own every bug: precision, context loss, a phone's driver quirks | An upgrade is a file swap that can break us; a large dependency in a repo that has none |
| Path 3 later | Real shadows, post effects and model loading would each be written by hand | All there already |

**Recommendation: A for path 2**, because what path 2 draws is narrow and the site's habits (no
build, small files, offline budget) all point that way. B becomes the sensible choice the day path
3's real shadows or imported models are approved; the scene interface means that switch touches one
file. Phase 2.0 tests the recommendation instead of trusting it.

Either way: WebGL 1 features only unless a measurement says otherwise (the dice ask for `'webgl'`),
one context for the page, and the choice written as a decision (`node tools/agents/decision.mjs
reserve`) so nobody undoes it by accident.

## How the 3D world is built from the flat game

- **The road** is a ribbon: for each centreline point, a left and a right vertex at half the width,
  lifted by the stage's elevation profile at that distance. Shoulders are a second, wider ribbon
  below it. Centre dashes on asphalt are thin quads just above the surface.
- **The ground** exists only where it can be seen: a corridor about 80 m either side of the road
  (*starting value*), as a grid whose height is the road's height near the road, blending into
  seeded noise hills further out. Fog hides where it ends.
- **Chunks**: the stage is cut every 100 m or so into static meshes (road, ground, props merged),
  built once when the stage loads. Draw the chunks near the car: a handful of draw calls a frame.
  *Budget, starting values*: under 40 draw calls and under 120 000 triangles in view.
- **Props** come from the same seeded scatter path 1 uses (same positions, so both scenes show the
  same stage): a tree is a few stacked cones or a faceted blob on a trunk; a fence is posts and two
  rails following the road edge; a wall is a row of irregular blocks. Each is generated in code. No
  model files.
- **Flat shading without textures**: each triangle carries its own normal and colour (vertices are
  not shared between faces), lit by one sun direction plus an ambient term. That is the whole look.
- **Shadows, baked**: at load, for each tree and fence, add a dark see-through shape on the ground
  stretched away from the sun. With a low sun this gives the clip's long stripes across the road for
  the cost of a few triangles each. The car gets a soft dark quad under it. No shadow maps.
- **Sky**: a gradient behind everything and a sun disc drawn as a quad facing the camera. Fog colour
  equals the horizon colour.
- **The car**: boxes. A body, a cabin, four wheels, lights. The front wheels turn with `steer`; the
  body rolls with sideways acceleration and pitches with braking, a few degrees, eased. Its height
  and tilt come from the road under it. All of this is drawn from `g`; none of it feeds back.
- **The camera**: behind and above the car (*starting values*: 7 m back, 3 m up, looking 6 m ahead of
  it), following the car's **direction of travel** with a damped spring so a slide shows the car's
  side, never rolling, fixed field of view, no shake. With reduced motion the damping is stronger
  and the cover demo is a still frame.
- **Tyre tracks**: a ring buffer of thin quads on the road. **Dust**: a pool of camera-facing quads.
  Both reuse path 1's logic for when to spawn.
- **The co-driver's map and the whole HUD** are path 1's DOM, untouched.

## What only bites in WebGL

- **Losing the context.** A phone can take the WebGL context away at any time (another tab, memory
  pressure). Listen for `webglcontextlost` and `webglcontextrestored`, pause the run, rebuild the
  buffers, resume. Test it with the `WEBGL_lose_context` extension.
- **No WebGL at all**, or a context that fails to start: the game plays in path 1's scene. The
  engine does not notice.
- **A slow phone**: measure the frame time over the first seconds of a run; if it is over budget,
  lower the canvas resolution, then the view distance, and if that is not enough offer path 1's
  scene. Never drop the physics rate: the clock runs on steps.
- **Precision**: keep world coordinates small by drawing relative to the car's chunk, or z-fighting
  and jitter appear a kilometre from the origin.
- **Battery and heat**: cap the canvas at 2× CSS size, stop the loop when the page is hidden or the
  cover is covered by a dialog.
- **CI's Chrome draws WebGL in software.** It works and it is slow. e2e scripts assert on
  `window.__drift.g` and on the HUD, and take screenshots; they never assert a frame rate.
- **Visual references**: a moving canvas is never pixel-identical. Before adding one, read how
  `tools/e2e/visual.mjs` treats Flap's and Babel's covers and do the same.

## Phases

### 2.0 · The spike and the decision

Outside the game: a throwaway lab page that draws one stage's road, ground and 200 trees with a
moving camera, built both ways (A and B). Measure each on the owner's phone and a modest Android:
frame time, bytes sent, lines we would own, time to first frame.

**Exit**: a decision file with the numbers and the choice; the owner agreed. The spike page is
deleted or folded into 2.1, not left in the lab.

### 2.1 · The second scene, grey

- `scene3d.js` with path 1's interface; the flag `drift-3d` (its card in `/labs/`, its switch in the
  tester tab, listed in `flag-list.js`). Off, nothing changes for anyone.
- Road ribbon, flat ground, a box for the car, gates, the chase camera. No props, no fog.
- Context loss handled; no-WebGL falls back to the 2D scene.
- The e2e script runs the test stage with the flag on and with it off.

**Exit**: the owner drives a grey stage in 3D on the preview and the controls feel the same as in
path 1 (they are the same). If the chase camera changes how the car should be tuned, that is found
here: a second `TUNING` set per scene is allowed, a second engine is not.

### 2.2 · The camera round

The 3D equivalent of phase 1.2, and as decisive. The owner plays; distance, height, look-ahead,
damping and field of view are tuned live from the tuning panel.

**Exit**: the owner says it is comfortable for a whole stage, and that judging a corner's distance
is no harder than from above. If judging corners is harder, strengthen the co-driver's map and the
corner signs before anything else.

### 2.3 · The world

Elevation, the ground corridor, props, flat shading, sky, sun, fog, baked shadows, one setting. The
car model with its lean.

**Exit**: budget met on the modest phone, numbers in the PR; a look at the stage sent to the owner
as a link; reduced motion checked.

### 2.4 · Effects and the safety net

Tyre tracks, dust, the automatic quality steps and the fallback to 2D, the cover demo in 3D (with a
still frame under reduced motion and when WebGL is missing).

**Exit**: a forced context loss mid-run recovers; a throttled phone steps quality down by itself and
stays playable; e2e green both ways.

### 2.5 · The verdict

In the lab with the flag for testers. **The number**: the same second-run share as phase 1.6, with
the flag on against off. 3D earns its place by being replayed at least as much and by not losing
players on slow phones (runs finished over runs started, on against off).

**Exit**, the owner's choice: 3D becomes the default with 2D as the fallback and a switch; or 3D
stays an option; or it is parked. Then, and only if wanted, the other two settings as palettes and
prop sets (each a small PR), and [path 3](path-3-full.md) increments one at a time.

## Risks

| Risk | Sign | Answer |
|---|---|---|
| Too slow on modest phones | Frame time over budget in 2.0 or 2.3 | Shorter view with more fog, fewer props per chunk, lower resolution; 2D stays the default there |
| Corners are harder to read from behind | The owner brakes late everywhere in 2.2 | Bigger map, signs, a higher camera; a faint racing line is a last resort |
| The camera makes the owner dizzy | Said within a stage | More damping, less look-ahead swing, wider field of view; never sway |
| Renderer A grows past what it was chosen for | The scene file passes about 1 000 lines, or a path 3 increment needs shadow maps | Re-open the decision for B; the interface makes it one file |
| Two scenes drift apart | A feature lands in one only | A feature that is information (gates, ghost, signs) is required in both in the same PR; decoration may differ |
| The lab game's weight | The folder passes a megabyte | Something was committed that should be generated |
