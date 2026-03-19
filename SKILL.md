---
name: moonshort-minigame-skill
description: >
  Build complete, production-ready Moonshort H5 mini-games from a single requirement.
  Use this skill whenever the user asks to create, prototype, revise, audit, tune, document,
  verify, or describe a Moonshort mini-game, Phaser H5 game, settlement flow, attribute modifier,
  host bridge payload, or mini-game UI. Also use it when the user mentions a gameplay mechanic,
  one-minute mini-game, story check, QTE, puzzle, rhythm, memory game, sensor-based game,
  settlement panel, or WebView compatibility question in the Moonshort mini-game ecosystem.
---

# Moonshort MiniGame Skill

`SKILL.md` is the primary operating document for this repository.
The former `agent.md` rules are merged here. Keep `agent.md` only as a compatibility pointer.

## Non-Negotiable Operating Rules

### 1. `roadmap.md` is a live execution log
- Before doing any substantive task, add a new task section or extend the current section in `roadmap.md`.
- The pre-task roadmap entry must include:
  - `Target`
  - a checklist of concrete deliverables
  - an initial progress note that the task has started
- During execution, keep the checklist and progress notes current.
- After finishing, mark the task complete and record:
  - what changed
  - what was verified
  - any special-case handling
- Do not treat roadmap updates as an afterthought or end-only summary.

### 2. `list.md` is the inventory source of truth
- Whenever a game is added, renamed, removed, or materially re-scoped, update `list.md`.
- Every shipped game entry must include:
  - game name
  - one-line gameplay description
  - directory path
- If the task touches only docs or host integration, leave the game inventory untouched unless it becomes inaccurate.

### 3. Prefer stable manual delivery over blind batch generation
- Reusable scaffolds are allowed.
- Blind bulk generation is not a substitute for per-game implementation and verification.
- For multi-game requests, implement one game at a time and validate each file before moving on.

## Step 0 — Requirements Intake
Before writing code, extract the following from the user's request.
Ask only if the information is genuinely missing and affects implementation.

| Signal | What to extract | Default |
|--------|----------------|---------|
| Core mechanic | tap / tilt / voice / camera / memory / match / runner / choice / novel | tap-sprint |
| Theme / mood | genre, narrative context, color vibe | neutral |
| Attribute | character stat being tested | echoed from URL param |
| Device features | camera / microphone / gyroscope / none | none |
| Narrative layer | pre-game dialogue, in-game story beats, flavor text | none |
| Difficulty target | how hard should S-rank be to reach | moderate |

Map the mechanic to the closest **archetype** or design a novel one:
`tap-sprint` · `match-memory` · `merge-puzzle` · `tilt-dodge` · `voice-rhythm` · `camera-face` · `platform-runner` · `choice-chain`

Archetypes are starting points, not limits. Combine or invent freely.

## Hard Constraints
These never change. Any violation is a release blocker.

- Single self-contained HTML file per game. No build step. No local file references.
- Phaser 3.60.0 via `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js`.
- Canvas: `393 × 736`, `Phaser.Scale.FIT` + `CENTER_BOTH`.
- Output path: `games/<game_id>/index.html` with lowercase kebab-case id.
- Read `attribute` and `primaryColor` from URL query params at boot.
- Settlement payload required fields: `rating`, `score`, `attribute`, `modifier`.
- Rating enum: exactly `S / A / B / C`.
- Modifier mapping: `S→+3, A→+1, B→0, C→-1`.
- Always derive modifier from a lookup, never from ad hoc math.
- Settlement fires only when the user taps the final confirmation CTA.
- Bridge order: iOS WebKit → Android jsBridge → iframe postMessage → console fallback.
- Visual baseline: Kenney flat 2D. No glassmorphism, no blur, no sharp corners.
- One primary CTA per screen.
- Final CTA stays in the lower thumb zone.
- Keep `RATING_THRESHOLDS` in one named constant near the top of the script.
- Palette comes from Huemint using `primaryColor`. See `standards/design-guide.md`.
- Extra payload fields are allowed, but the four core settlement fields are immutable.

## Required Reading Order
Use progressive disclosure. Read only what the task needs, but follow this order.

1. `standards/design-guide.md`
2. `standards/framework-constraints.md`
3. `contracts/settlement.contract.md`
4. `templates/phaser-h5-template.html`
5. `contracts/settlement.schema.json` during validation
6. `qa/compatibility-checklist.md` before closeout

Read these only when needed:

- `references/device-apis.md` for camera / microphone / gyroscope
- `references/narrative-layer.md` for dialogue, typewriter text, story scenes
- `references/sprite-assets.md` for textures, sprite sourcing, font pairing
- `host/cocos-settlement-handler.ts` and `host/cocos-webview-integration.md` for host-side debugging
- `examples/platform-runner/index.html` and `examples/merge-2048/index.html` for implementation-quality reference

## Delivery Workflow

1. Log the task in `roadmap.md` before implementation.
2. Read the required docs and template.
3. Start from `templates/phaser-h5-template.html`.
4. Implement scenes in this order when applicable:
   - `BootScene`
   - `NarrativeScene`
   - `GameScene`
   - `ResultScene`
5. If the task spans multiple games, finish one game end-to-end before starting the next.
6. Update `list.md` if game inventory changed.
7. Validate syntax, runtime, settlement, and UI before closing.
8. Mark the roadmap task complete with a verification summary.

## Stability Rules Learned From Recent Delivery Work

### Layout stability
- Reserve vertical bands deliberately:
  - header and score band: roughly `y 24-126`
  - play card: roughly `y 188-548`
  - status and combo band: below the play card, never overlapping it
  - primary CTA: low thumb zone with comfortable bottom margin
- Dense choice layouts should prefer 2×2 cards or a dedicated answer area over stacked buttons.
- If status or hint text wraps into gameplay space, shorten the copy first, then move the band lower if needed.
- Keep gameplay copy mobile-short. Long instructions are a recurring source of overlap.

### Implementation stability
- Do not assume every game uses `ResultScene`; existing games may use `RatingScene`.
- Do not assume CTA buttons are immediately interactive; some scenes fade or delay them in.
- Use a deterministic modifier lookup and verify it against the rating enum every time.
- Preserve the bridge order exactly.

### Verification stability
- Run a syntax compile pass on every generated HTML script block.
- Run browser verification, not just static inspection.
- Settlement verification should cover:
  - page loads and canvas exists
  - settlement scene is reachable
  - final CTA emits payload
  - payload contains `rating / score / attribute / modifier`
  - modifier matches the fixed `S / A / B / C` lookup
- For large packs, use a generic CTA verification flow for standard `ResultScene` games and a special-case flow for any game with a different result scene structure.
- After UI moves, re-check the exact pages that were touched with a real browser view.

## Device APIs
Camera, microphone, and gyroscope integration rules live in:
`references/device-apis.md`

All sensor calls must be triggered by a user gesture.

## Narrative & Text
Dialogue scenes, typewriter copy, and attribute-aware result text live in:
`references/narrative-layer.md`

## Sprite & Asset Layer
Texture sourcing, Kenney-style asset strategy, and font guidance live in:
`references/sprite-assets.md`

## Reference Map

| File | Read when |
|------|-----------|
| `standards/design-guide.md` | Every game |
| `standards/framework-constraints.md` | Every game |
| `contracts/settlement.contract.md` | Every game |
| `contracts/settlement.schema.json` | Validation step |
| `references/device-apis.md` | Sensor-based mechanics |
| `references/sprite-assets.md` | Sprite or texture work |
| `references/narrative-layer.md` | Dialogue or text animation |
| `templates/phaser-h5-template.html` | Starting point for every game |
| `host/cocos-settlement-handler.ts` | Host-side parsing reference |
| `host/cocos-webview-integration.md` | Cocos WebView integration guide |
| `qa/compatibility-checklist.md` | Pre-release gate |
| `examples/platform-runner/index.html` | Runner mechanic reference |
| `examples/merge-2048/index.html` | Merge and special result scene reference |

## Done Checklist
- [ ] Task logged in `roadmap.md` before implementation.
- [ ] Game lives under `games/<game_id>/index.html` when a game is created.
- [ ] Runs standalone in browser with no build step.
- [ ] Reads `attribute` and `primaryColor` from URL.
- [ ] Sends settlement payload with required four fields and four-tier rating compatibility.
- [ ] Settlement is sent only from the final confirmation CTA.
- [ ] `list.md` inventory updated when game inventory changed.
- [ ] `qa/compatibility-checklist.md` reviewed.
- [ ] Browser settlement verification completed.
- [ ] Roadmap task marked complete with validation notes.
