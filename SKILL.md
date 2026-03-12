---
name: moonshort-minigame-skill
description: >
  Build complete, production-ready Moonshort H5 mini-games from a single requirement.
  Use this skill whenever the user asks to create, prototype, revise, audit, or describe a mini-game —
  whether they name a gameplay mechanic, a story moment, a character attribute check, a visual theme,
  or a device interaction (camera, microphone, gyroscope/tilt/shake). Also apply it for settlement
  screen changes, rating threshold tuning, narrative dialogue writing, Kenney-style visual work,
  texture or sprite selection, WebView bridge debugging, host payload questions, or any design
  decision in the Moonshort mini-game ecosystem. When the user mentions a mini-game, H5 game,
  Phaser game, settlement, attribute modifier, or story check — use this skill.
---

# Moonshort MiniGame Skill

## Step 0 — Requirements Intake
Before writing any code, extract the following from the user's request.
Ask only if the information is genuinely missing and affects implementation.

| Signal | What to extract | Default |
|--------|----------------|---------|
| Core mechanic | tap / tilt / voice / camera / memory / match / runner / choice / novel | tap-sprint |
| Theme / mood | genre, narrative context, color vibe | neutral |
| Attribute | character stat being tested | echoed from URL param |
| Device features | camera / microphone / gyroscope / none | none |
| Narrative layer | pre-game dialogue, in-game story beats, flavor text | none |
| Difficulty target | how hard should S-rank be to reach | moderate |

Map the mechanic to the closest **archetype** (or design a novel one):
`tap-sprint` · `match-memory` · `merge-puzzle` · `tilt-dodge` · `voice-rhythm` · `camera-face` · `platform-runner` · `choice-chain`

Archetypes are starting points, not limits. Combine or invent freely.

## Hard Constraints
These never change. Any violation is a release blocker.

- Single self-contained HTML file per game. No build step. No local file references.
- Phaser 3.60.0 via `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js`.
- Canvas: `393 × 736`, `Phaser.Scale.FIT` + `CENTER_BOTH`.
- Output path: `games/<game_id>/index.html` (lowercase kebab-case id).
- Read `attribute` (default `"Charm"`) and `primaryColor` from URL query params at boot.
- Settlement payload required fields: `rating`, `score`, `attribute`, `modifier` — immutable names.
- Rating enum: exactly `S / A / B / C / D`. No custom labels (SS, F, Perfect, Fail are invalid).
- Modifier: `S→+2, A→+1, B→0, C→-1, D→-2`. Always derive from rating via lookup, never compute.
- Settlement fires **only** when the user taps the final confirmation CTA. Never auto-send.
- Bridge order: iOS WebKit → Android jsBridge → iframe postMessage → console fallback.
- Visual: Kenney flat 2D. No glassmorphism, no CSS gradients, no blur, no sharp corners (min `border-radius: 8px`).
- One primary CTA per screen. CTA in bottom thumb zone (≥ 100 px from bottom edge).
- Rating thresholds in one named constant `RATING_THRESHOLDS` near top of script.
- Palette from Huemint API using `primaryColor`. See `standards/design-guide.md §1.1`.
- Phosphor Icons (fill style) for all icons. Every icon inside an `icon-pill` wrapper.

## Generation Workflow

1. Read `standards/design-guide.md` — visual + interaction source of truth.
2. Read `standards/framework-constraints.md` — compact compatibility layer.
3. Read `contracts/settlement.contract.md` — bridge payload contract.
4. **If camera / microphone / gyroscope needed** → read `references/device-apis.md` before coding.
5. **If narrative dialogue / sprite textures needed** → read `references/narrative-layer.md` before coding.
6. Start from `templates/phaser-h5-template.html`.
7. Build scenes in this order (skip optional scenes when not needed):
   - `BootScene` *(optional)* — async Huemint palette fetch + asset preload.
   - `NarrativeScene` *(optional)* — pre-game typewriter dialogue.
   - `GameScene` — core gameplay loop.
   - `ResultScene` — settlement reveal → single confirmation CTA → `notifyGameComplete()`.
8. Validate payload shape against `contracts/settlement.schema.json`.
9. Run through every item in `qa/compatibility-checklist.md`.
10. Append to `roadmap.md`: date, game_id, mechanic archetype, device features used, notes.

## Device APIs
Camera, microphone, and gyroscope/tilt/shake integration — permissions, Phaser wiring,
iOS/Android WebView requirements, graceful degradation — live in:
→ **`references/device-apis.md`**

Read it before implementing any sensor-based mechanic. All sensor calls must be
triggered by a user gesture (button tap), never on scene create.

## Narrative & Text
Pre-game dialogue, typewriter effects, TextCardScene, mid-game story triggers, and
attribute-aware result copy live in:
→ **`references/narrative-layer.md`**

Read it when the user requests story text, dialogue scenes, or animated text presentation.

## Sprite & Asset Layer
Texture Manifest pattern, sprite loading strategies (procedural / base64 / SVG / CDN),
Kenney pack selection, and font pairing live in:
→ **`references/sprite-assets.md`**

Read it when the user specifies visual assets, sprite styles, character art, textures,
backgrounds, or a named visual theme.

## Reference Map

| File | Read when |
|------|-----------|
| `standards/design-guide.md` | Every game — visual + interaction source of truth |
| `standards/framework-constraints.md` | Every game — compact compatibility layer |
| `contracts/settlement.contract.md` | Every game — bridge contract |
| `contracts/settlement.schema.json` | Validation step |
| `references/device-apis.md` | Camera / microphone / gyroscope games |
| `references/sprite-assets.md` | Sprite / texture / font specification |
| `references/narrative-layer.md` | Story dialogue / text animation |
| `templates/phaser-h5-template.html` | Starting point for every game |
| `host/cocos-settlement-handler.ts` | Host-side parsing reference |
| `host/cocos-webview-integration.md` | Cocos WebView integration guide |
| `qa/compatibility-checklist.md` | Pre-release gate |
| `examples/platform-runner/index.html` | Runner mechanic reference |
| `examples/merge-2048/index.html` | Merge / puzzle mechanic reference |
