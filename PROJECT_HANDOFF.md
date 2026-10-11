# Room Designer — Project Handoff

This document is for a new coding agent. It describes the repository as of `main` commit `1987c8a` (`Merge pull request #1 from champaigncoda/wip/phase-5b`). Local path: `~/workspace/projects/room-designer`. Remote: `https://github.com/champaigncoda/code-ada-team10.git`.

Product name: **Room Designer — Try Before You Buy**.

---

## 1. Project Overview

Room Designer is a browser app that lets someone see furniture inside a dimensionally accurate model of their own room before buying it.

Intended flow:

1. Upload a 2D floor-plan image (PNG or JPG).
2. Trace the room outline as a polygon, including concave shapes such as an L.
3. Calibrate one wall to a real length in meters. The same scale applies to every wall.
4. Generate an interactive 3D room.
5. Create sofa, bed, and table models from real width, depth, height, and color.
6. Place several items in the room, then move and rotate them.

There is no account system, database, shopping API, or save/export. Furniture and the room exist only for the current browser session.

Phases 1 through 5B are implemented. Collision detection, footprint-in-room checks, snapping, undo, and persistence are **not** implemented. Those were discussed as later work (often called Phase 6) and must not be assumed to exist.

---

## 2. Tech Stack and Architecture

### Stack

- React 19, TypeScript (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), Vite 8
- 2D editor: React Konva
- 3D: Three.js, React Three Fiber, Drei (`RoundedBox`, `OrbitControls`, `ContactShadows`)
- Tests: Vitest, Testing Library, jsdom
- Lint: ESLint 9 with `typescript-eslint` and `eslint-plugin-react-hooks`
- No router, no Redux/Zustand, no backend

### How state is stored

One `useReducer` in `src/features/editor/useFloorPlanEditor.ts` runs `editorReducer`. The 3D room mesh is **not** stored. It is derived from the closed polygon, confirmed calibration, and room-height input (`selectRoomModelSource` / `buildRoomGeometry`).

Furniture lives on that same reducer as `furnitureSession`, so it survives leaving the 3D view and coming back, as long as the outline and scale do not change. See section 4.

UI mode for furniture is a single union, not several booleans:

- `default` — nothing selected
- `create` — draft form, no instance yet
- `placement` — ghost follows the cursor; OrbitControls off
- `edit` — one `selectedId`, plus dimension/color draft and transform draft

### Important directories

| Path | Role |
|---|---|
| `src/features/editor/` | Floor-plan upload, polygon drawing, reducer, selectors |
| `src/features/calibration/` | Reference wall, meters-per-pixel, dimension labels |
| `src/features/room/` | Room height input and “Generate 3D Room” |
| `src/features/viewer/` | 3D room, camera, furniture-in-room interaction |
| `src/features/furniture/` | Parametric models, colors, placement math, session reducer |
| `src/features/furniture/layout/` | Pure part layouts for sofa, bed, table |
| `src/features/furniture/session/furnitureSession.ts` | Furniture instances and mode transitions |
| `src/features/furniture/interaction/transformMath.ts` | Drag threshold, grab offset, rotation wrap, degree parsing |
| `src/features/furniture/placement/floorPlacement.ts` | Ray vs Y = 0, point-in-polygon |
| `src/geometry/` | Polygon validation, snap, segments (image pixels) |
| `src/types/` | Shared room, furniture, and calibration types |
| `src/features/app/workspace.ts` | Dev-only entry to the Phase 4 studio |

### Coordinate system

Image pixels convert to floor meters with one scale:

```
x = (px − centerX) * metersPerPixel
z = (py − centerY) * metersPerPixel
```

`center` is the outline’s bounding-box center, so the room is centered on the origin. `+X` is image-right. `+Z` is image-down. The floor is `Y = 0`. Up is `+Y`.

Furniture local space: X = width, Y = height, Z = depth. The model origin is the bottom center. A 2 m wide sofa runs about from X = −1 to X = +1. `rotationY` is radians around Y.

Placement checks the furniture **origin** only, against the real floor polygon (concave shapes included), not the bounding rectangle. Boundary points within `1e-4` m count as inside.

---

## 3. Current Implementation

### Phase 1 — Floor plan and polygon

`FloorPlanEditor` shows an upload drop zone until an image is loaded. The user clicks to add vertices. Clicking near the first vertex closes the outline if it has enough points and `validatePolygon` accepts it. Undo removes the last vertex. Clear resets the polygon and calibration. Zoom and pan are on the Konva stage; stored vertices stay in image pixels.

### Phase 2 — Calibration

After the polygon is closed, the user picks one wall and types its length in meters. Confirm stores a scale. Other wall lengths are derived. Re-calibrate returns to editing and leaves the 3D view. Invalid input (empty, zero, negative, non-numeric, non-finite) cannot be confirmed.

### Phase 3 — 3D room

“Generate 3D Room” requires a confirmed scale and a positive room height (default input `2.8` m). The viewer builds a floor mesh from the polygon and vertical walls. Toolbar: Hide/Show Walls, Top View, Reset Camera, Back to 2D editor. Orbit: drag empty space. Pan: right-drag. Zoom: wheel.

### Phase 4 — Parametric furniture

Three categories, each a different part layout, not a scaled box:

- **Sofa:** left/right arms, backrest at −Z, seat base, 2 or 3 cushions (more on very wide seats, capped).
- **Bed:** headboard at −Z, side rails, foot rail, inset platform, mattress, optional pillows.
- **Table:** tabletop whose top is at the requested height, four inset legs to Y = 0.

Width, depth, and height are the **outer** bounding box in meters. Parts use clamped proportions so arms, legs, and cushions do not scale without limit, and they shrink on very small sizes so dimensions stay positive. There is **no category maximum**. Sizes that cannot survive WebGL float32 (extreme underflows, or sizes so large that small parts collapse) are rejected with a message; the last valid preview stays.

Colors: presets Beige, Gray, Navy, Olive, Terracotta, White, plus a custom `#rrggbb` picker. Color does not change geometry. Secondary parts are a darker mix; cushions/mattress are lighter.

The standalone studio is **not** in the main nav. Open it with `http://localhost:5173/?studio=furniture` or `#furniture-studio`. “Back to room” hides it. The room editor stays mounted underneath (`hidden`), so room state is kept. The studio itself remounts and returns to sofa defaults.

### Phase 5A — Create, place, and manage instances

The 3D viewer is three columns: Furniture List | 3D room | Details.

- **Add New Furniture** enters create mode with category defaults.
- **Place in Room** (enabled only when the draft builds a valid layout) shows a semi-transparent ghost. OrbitControls are disabled. The ghost follows a ray hit on the plane Y = 0 and is hidden outside the floor polygon. Click inside the polygon creates **one** instance at that point, `rotationY = 0`, and selects it. Esc or Cancel placement returns to the form and creates nothing.
- List names are `Sofa 1`, `Table 1`, and so on, by insertion order within a category.
- Edit mode changes dimensions and color. Invalid or incomplete typed input keeps the last valid model. Position and rotation are kept when size or color changes.
- Duplicate copies type, size, color, and rotation, and offsets X by `+0.5` m. It may overlap or leave the room.
- Delete removes only that instance and returns to default mode.

### Phase 5B — Drag, rotate, numbers, top view

- Primary press on a furniture body selects it and owns the gesture. Movement under `5` CSS pixels is a click (no move). Past that, the item follows the ground-plane hit plus the original grab offset. It is **not** clamped to the room.
- Primary press on the blue floor arc (about Y = 0.05 m, ~120°) rotates that item. The turn is the shortest signed angle, so crossing ±180° does not spin the long way.
- Right button and middle button stay with the camera, even if the press starts on furniture.
- Empty-space drag orbits and does **not** clear selection. An empty click with little movement clears selection.
- Details → Transform: Position X (m), Position Z (m), Rotation (degrees, stored as radians). Shortcuts: 0°, 90°, 180°, 270°. Incomplete numeric drafts do not overwrite the instance.
- **Top View** places the perspective camera above the floor-polygon center. Height is the larger of the width and depth distances needed so about 15% of the viewport is empty on each side (`TOP_VIEW_SIDE_MARGIN`). Camera up is −Z so the plan matches the floor. **Reset Camera** restores the elevated three-quarter view and Y-up.

During initial placement, existing furniture is visible but not hittable, the rotation handle is hidden, and OrbitControls stay off. A new item may be placed on top of an existing one.

---

## 4. Important Design Decisions

- **Meters everywhere.** No hidden unit conversion. Image scale is one `metersPerPixel` for X and Z.
- **Derive the room; store the outline.** Do not cache a second copy of the polygon for the mesh. `outline` on the room source is the editor’s vertex array.
- **One reducer.** Furniture actions are `FurnitureSessionAction` values handled by `reduceFurnitureSession`, then stored on editor state. Do not add a second store.
- **One interaction mode.** Do not add parallel flags such as `isEditing && isPlacing`.
- **Draft strings vs last valid numbers.** Dimension and transform fields keep what the user typed. Geometry and transforms update only when the whole relevant value parses. This is why clearing a width box does not collapse the model to zero.
- **Geometry is pure.** `sofaParts`, `bedParts`, `tableParts`, and `buildFurnitureLayout` do not read React state. The same functions feed the studio preview and the room. Do not fork a second generator.
- **Do not rebuild meshes for a transform.** `PlacedFurniture` memoizes layout on id, category, dimensions, and color. Position and `rotationY` are group transforms only.
- **Furniture session invalidation** (implemented in `editorReducer`):
  - Replacing the image, editing or clearing the outline, or starting/confirming calibration clears all furniture and resets the mode.
  - Changing only room height keeps instances.
  - Back to 2D and generating the **same** confirmed room keeps instances.
  - Leaving the viewer during placement drops the ghost and returns to create mode so orbit works on the next visit. No instance is created.
- **No collision in this phase.** Overlap and out-of-room positions are allowed on purpose.
- **Camera resets only for a new framing or Reset Camera.** Furniture updates must not pass a fresh “room size” object into a `useMemo` that the framing effect depends on. `RoomCameraRig` depends on numeric width, depth, height, and aspect, plus `resetToken` / `topToken`.
- **Pointer ownership is capture-phase.** `FurnitureGestureController` listens on the canvas in the capture phase and calls `stopImmediatePropagation` when a primary press hits furniture or the rotation handle. OrbitControls listens on the same element in the bubble phase, so stopping the event is required. Disabling OrbitControls later in the same event is not reliable. Secondary and middle buttons are not stopped.
- **Do not dispose Three.js geometries in a `useEffect` cleanup** that still feeds a `useMemo`. React Strict Mode will dispose them and the next frame renders blank. This bit the Phase 3 room meshes.

---

## 5. Bug Fixes

These were real defects. The fixes are in `main`.

### Bed flicker (Phase 4 refinement, `d7d6f63`)

The bed platform spanned the full width and depth, so its side and foot faces occupied the same planes as the rails. Side rails also ran through the foot rail. Those coplanar faces z-fight, which looks like flicker along the bottom. The mattress bottom was also flush with the platform top. A hard shadow map with no bias made it worse.

Fix: the frame is a non-overlapping shell. The platform is inset and buried slightly into the rails, with its own bottom just above the floor. Rails and headboard still rest at Y = 0, so the outer box is unchanged. Mattress and pillows are sunk a few millimetres into the surface under them. The preview uses a soft `ContactShadows` blob instead of a sharp directional shadow map. The preview floor sits a few millimetres below Y = 0.

### Camera reset on every furniture edit (`a3790ae`, kept in `RoomCameraRig.tsx`)

`RoomScene` passed a new `extent` object on every render. The camera rig memoized the initial view with that object as a dependency, so every selection or color change re-ran `applyCameraView` and snapped the camera back.

Fix: memoize on numeric width, depth, and height (and aspect), not object identity. The orbit target array is memoized too, so a new array is not applied on every render. Reset still happens when `resetToken` changes or the room measurements change.

### Selection flash and “only the newest item can be dragged” (`d201c71`)

Two causes:

1. **Raycast never restored.** During placement, existing meshes get `raycast` set to a no-op so they cannot steal the placement click. After placement, the code passed `raycast={undefined}`. React Three Fiber skips `undefined` props, so the no-op stayed. Only the instance **created after** that placement still had the default mesh raycast. Older items showed no hit at all, so list selection worked (it does not raycast) but dragging their models did not. Deleting the newest item did not repair the others.

   Fix: when a model is interactive, set `raycast` to `Mesh.prototype.raycast` explicitly (`activeRaycast` in `FurnitureModel.tsx`). Do not pass `undefined` to mean “default” after a no-op was installed.

2. **Click release cleared the selection.** Capture-phase `pointerdown` selected the furniture and stopped the event, so React Three Fiber never recorded that object as the click target. The later `click` still hit the floor. The floor `onClick` and the canvas `onPointerMissed` both dispatched `furnitureDeselected`. The newest item (the only one that raycast) therefore flashed selected and then lost Edit mode and the rotation handle. Holding the button still dragged, because drag runs on `pointermove` before that click.

   Fix: removed the floor click handler and the canvas `onPointerMissed` deselect. `FurnitureGestureController` clears selection only when the **press** missed every furniture part and the release moved less than the drag threshold. A furniture-owned `pointerup` stops propagation and does not deselect. `selectionAfterPrimaryRelease` in `transformMath.ts` encodes that rule.

Shared gesture refs were checked and were not the bug. One ref is still correct if it stores the id captured at pointer down and is not overwritten by render.

### Other fixes worth not regressing

- Phase 3 blank canvas: do not dispose `BufferGeometry` that a live mesh still uses.
- Duplicate furniture used to overlap the original completely; duplicate now offsets X by 0.5 m (`FURNITURE_DUPLICATE_OFFSET_X`).
- Category dimension maximums were removed. Do not reintroduce “typical furniture” caps. Keep rejection of non-positive and non-finite input, and of sizes that collapse in float32.

---

## 6. Current Status

### Done

Phases 1, 2, 3, 4, 5A, and 5B, including the bug fixes above. Working tree on `main` was clean when this document was written.

Browser checks that were actually run (not inferred from unit tests):

- Floor-plan upload, polygon close, calibration, and 3D generation.
- Sofa, bed, and table previews; color and invalid dimension handling in the studio and in the room.
- Placement ghost, Esc cancel, multi-item list, duplicate, delete, Hide Walls.
- Camera staying still across select, dimension edit, duplicate, delete, and placement cancel; Reset Camera returning to the framed view.
- After `d201c71`: with three separated items and walls hidden, clicking each model left it selected after release, and dragging each changed its position. The same three names were hit in Top View.

Unit tests do **not** prove WebGL pixel output or real browser hit-testing. `furnitureRaycast.test.ts` only checks that putting `Mesh.prototype.raycast` back on a mesh produces intersections again.

### Not done

- Furniture-to-furniture collision
- Full footprint inside the room
- Wall collision warnings
- Snapping, auto layout, undo/redo
- Saving or exporting a layout
- Product URL import, shopping APIs, accounts, database
- Dragging or rotating **during** the initial placement ghost (that mode is place-only)
- A true orthographic top view (Top View is still a perspective camera, so wall sides stay slightly visible)

### Known limitations

- Reload loses the room and all furniture.
- Items may overlap and may extend through walls. That is allowed.
- Selection highlight adds a blue emissive glow. The stored hex color does not change, but the item looks cooler while selected.
- The Phase 4 studio draft resets each time it is opened. The room session does not.
- Very small or enormous dimensions that collapse in float32 are rejected even though they are finite and positive.
- Production builds warn that the JS chunk is over 500 kB. That warning is pre-existing; do not treat it as a failure unless the build command exits non-zero.

---

## 7. Next Steps

Do not start the next feature until the user asks. The work discussed after 5B, in the order it was specified, is:

1. **Collision and containment (planned Phase 6, not started).** Detect furniture-to-furniture overlap, require the footprint to stay inside the polygon, and warn on wall intersections. Do not silently move items. Placement and drag today only test the origin, on purpose.
2. Keep camera and raycast behavior intact while adding those checks. Read sections 4 and 5 before touching pointer code or `RoomCameraRig`.
3. Persistence, shopping import, and auth were explicitly out of scope. Do not add them unless the user requests them.

Recommended order if Phase 6 is requested: pure geometry tests for footprint-vs-polygon and pairwise overlap first, then warnings in the viewer, without changing drag math or selection.

---

## 8. Development Instructions

```bash
cd ~/workspace/projects/room-designer
npm install
npm run dev          # http://localhost:5173/
npm run typecheck    # tsc -b
npm run lint         # eslint .
npm test             # vitest run
npm run build        # tsc -b && vite build
```

There is no test watcher requirement. `npm run test:watch` exists if you want it.

### Manual smoke path

1. Upload a PNG or JPG. Click corners, then click the first vertex to close.
2. Select Wall 1, enter a length such as `4`, confirm, generate the 3D room.
3. Add a sofa, place it, add a table and a bed somewhere else.
4. Click each model. Selection, the blue arc, and Details must remain after release.
5. Drag each model. The camera must not orbit during that drag.
6. Drag empty floor. The camera should orbit and the selection should stay.
7. Click empty space with almost no movement. Selection should clear.
8. Use 90° and Top View, then Reset Camera.
9. Start another placement and press Esc. Orbit should work again. No extra item should appear.

### Rules that are easy to break

- Do not pass `raycast={undefined}` to mean “turn raycasting back on.”
- Do not deselect from `onPointerMissed` or from a floor `onClick` that also runs on furniture clicks.
- Do not put object identity (`extent`, a new bounds object, a new target array) in a camera effect dependency.
- Do not dispose geometries that rendered meshes still reference.
- Do not clamp drag positions to the room unless a later phase explicitly asks for it.
- Do not add a second furniture geometry generator or a second global store.
- Keep `verbatimModuleSyntax`: use `import type` for types.
- The app has no router. Do not add one unless asked. The studio entry is a query/hash check in `App.tsx`.

### Git

Recent history on `main`, oldest at the bottom:

- `b8754eb` Initialize Room Designer project scaffold
- `6ac5d05` Phase 1: floor plan upload and interactive polygon editor
- `a9c9023` Phase 2: real-world dimension calibration
- `77c5091` Phase 3: generate an interactive 3D room from the calibrated outline
- `a8c64fe` Phase 4: parametric furniture models and live 3D preview
- `d7d6f63` Fix furniture dimensions and rendering issues
- `0797c04` Phase 5A: place and edit multiple furniture items in the room
- `a3790ae` fix: resolve furniture duplication overlap and camera reset
- `e9ecb24` feat: implement phase 5B furniture movement and rotation
- `d201c71` fix the bugs for phase 5b
- `1987c8a` Merge pull request #1 from champaigncoda/wip/phase-5b

Do not commit or push unless the user asks. Do not start Phase 6 unless the user asks.
