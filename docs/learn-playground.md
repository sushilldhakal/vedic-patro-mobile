# The Learn playground on iOS and Android

The web app grew a single configurable 3D scene for the Learn section — the
planet, its orbit, the three day-arcs, the राशि / नक्षत्र / महिना belts, the
Moon with its inclined plane and the two nodes — and pointed every article at it
with a per-topic config rather than building a diagram each. This is that same
scene, running on `expo-gl`.

## What was ported

| Web | Mobile | How faithful |
| --- | --- | --- |
| `src/lib/sky3d/day-mechanics.ts` | `lib/sky3d/day-mechanics.ts` | byte-identical — pure maths, no imports |
| `src/components/learn/EclipticWheel.tsx` | `components/learn/playground/EclipticWheel.tsx` | identical geometry, new file header |
| `src/components/learn/DaySimScene.tsx` | `components/learn/playground/DaySimScene.tsx` | same frame loop and constants; three marked deviations |
| `src/components/learn/EotGraph.tsx` | `components/learn/playground/EotGraph.tsx` | same maths and layout, `react-native-svg` marks |
| `src/lib/learn/playground-config.ts` | `lib/learn/playground-config.ts` | same modes and speed ladder; slug map is this app's own |
| `src/components/learn/DayPlaygroundStudy.tsx` | `components/learn/playground/DayPlayground.tsx` | rewritten — it was all DOM |

Keeping the first four aligned is deliberate. The geometry is the part that is
expensive to get right and cheap to keep in step, so a belt radius or an
anomaly-solver fix on either platform should be a diff the other can apply
without thinking.

## Where the platform forced a change

Marked `── native ──` in the scene, and each one is a real constraint rather
than a preference:

1. **Textures.** The web loads them from a URL under `import.meta.env.BASE_URL`.
   Here they are bundler modules — handed straight to `THREE.TextureLoader` on
   native, which `@react-three/fiber/native` patches to accept them, and
   resolved through `expo-asset` on web, which has no such patch. Same split as
   `learn-textures.ts` and `sky-textures.ts` already use.

2. **Labels.** Devanagari inside a WebGL scene means a font atlas, so both
   platforms project anchors out to real text instead. The web then writes
   `transform` on the DOM nodes from inside the frame loop and never re-renders
   React at all. React Native has no equivalent that beats a re-render, so the
   labels are **sampled** — one collecting pass in ten frames, thrown away
   wholesale if nothing moved a pixel (`playground-labels.ts`). A name therefore
   lags its body slightly while the sim runs at speed. That is the honest cost.

   Two related economies: off-screen labels are dropped rather than nudged back
   inside the canvas the way the shared `diagram-labels.ts` does — with sixty of
   them, clamping stacks most of a belt along the edges — and the राशि /
   नक्षत्र glyph is drawn only for the division the body is actually standing
   in, since twenty-seven SVGs inside a six-times-a-second render is the
   difference between a smooth transport row and a stuttering one.

3. **राहु and केतु.** The web billboards the app's own graha SVG by drawing it
   into a canvas element. There is no canvas element here, so the nodes are
   geometry — and the geometry says what they are: a ring where the Moon climbs
   north through the ecliptic, a filled disc where it drops back south, both
   lying flat in the Moon's own plane so they turn edge-on as the camera comes
   down to it. They are crossings, not bodies, and this draws them as crossings.

## What the shell does differently

The scene is the same; the instrument panel around it is not, because a 290px
drawer floating beside a phone canvas covers the thing it is adjusting.

- **Touch, not pointers.** One finger orbits, two pinch the camera distance —
  there is no wheel to zoom with. The `PanResponder` sits on the canvas alone:
  panels are siblings of it, not children, or a `Slider` inside would lose its
  drag to the camera.
- **Panels are sheets.** Controls and focus open along the bottom of the card,
  so the scene above stays visible while a layer is switched.
- **Fullscreen is a `Modal`**, which takes the status bar and tab bar with it.
  No portal, no Fullscreen API.
- **`<select>` became chips.** Six planet presets fit one scrolling row; a
  picker wheel for a one-press choice is worse.

## One fix that did not come from the web

The web anchors the three lunar labels with `getWorldPosition`, then adds the
frame shift to the result — but a world matrix is only recomputed at render, so
it still holds the *previous* frame's shift and the shift is counted twice. It
is invisible at the default focus, where the shift is zero, and throws चन्द्र /
राहु / केतु ten units off at any other. Here they are composed from the model
the same way the Moon's own sightline is. Worth porting back.

## Cost

The Hermes bundle grew from **9.15 MB to 9.38 MB** — about 230 kB, since
`three` was already in the graph for the existing diagrams and the Aakash Gochar
sky. Verified by building: `tsc --noEmit` reports nothing new, and
`expo export` succeeds for ios, android and web.

Frame rate on real hardware has **not** been measured. The scene is heavier than
the diagrams beside it — sixty label projections and a belt of a few hundred
line segments — and the two economies above were chosen with a mid-range Android
in mind, but "chosen with in mind" is not "measured". That is the next thing to
do with a device in hand.
