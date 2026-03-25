# MiniGame Roadmap

## Goal
Extract a reusable H5 mini-game framework from existing examples, then support AI-driven batch generation while keeping host compatibility stable across a standalone repository.

## Milestones

- [x] M1: Initialize standalone framework root
- [x] M2: Define stable settlement contract (`rating/score/attribute/modifier`)
- [x] M3: Provide reusable Phaser H5 template with bridge integration
- [x] M4: Publish agent generation rules and directory conventions
- [x] M5: Add current two games as example implementations
- [x] M6: Expand settlement tiers (initially five, later reduced to four `S/A/B/C`)
- [x] M7: Add first generated game under `games/`
- [x] M8: Add host-side integration reference for Cocos WebView
- [x] M9: Add automated payload validation check
- [ ] M10: Run host-side integration test in Cocos WebView

## Development Log

### 2026-03-12
- Re-started from scratch as requested.
- Created a dedicated framework space, separate from existing `game/` examples.
- Standardized settlement contract around current live fields:
  - `rating`, `score`, `attribute`, `modifier`
- Added schema validation file to reduce drift during batch generation.
- Added reusable H5 Phaser template with:
  - URL param parsing (`attribute`, `primaryColor`)
  - unified `notifyGameComplete` bridge logic
  - final CTA-triggered settlement send

### 2026-03-12 (Standalone Upgrade)
- Promoted the provided UI/UX prompt into the canonical design guide:
  - `standards/design-guide.md`
- Added a compact compatibility layer:
  - `standards/framework-constraints.md`
- Added two example games from the original moonshort repo:
  - `examples/platform-runner/index.html`
  - `examples/merge-2048/index.html`
- Switched framework contract from four tiers to five tiers:
  - `S / A / B / C / D` (later reduced to four tiers in 2026-03-19)
- Locked modifier mapping to:
  - `+2 / +1 / 0 / -1 / -2` (later changed to `+3 / +1 / 0 / -1` in 2026-03-19)
- Promoted the former `minigame/` workspace to repository root.
- Switched `origin` to:
  - `https://github.com/cdotlock/moonshort-minigame-skill`
- Added host integration assets:
  - `host/cocos-settlement-handler.ts`
  - `host/cocos-webview-integration.md`
- Added local payload validator:
  - `scripts/validate-settlement.js`

## Next Work Items

1. Build one production mini-game in `games/<game_id>/index.html` using template.
2. Run a real host-side integration test in Cocos WebView.
3. Add CI check for required settlement fields on generated HTML games.

## Current Sprint (2026-03-12)

### Target
- Deliver full requested game pack under `games/` with unified settlement panel and stable bridge payload contract.
- Finish end-to-end run checks for every generated game (load -> playable -> settlement -> Continue payload).

### Progress Checklist
- [x] Upgrade `qte-challenge` with explicit non-clickable blank windows between cues
- [x] Deliver extra QTE variants:
  - [x] `qte-direction-switch`
  - [x] `qte-hold-release`
  - [x] `qte-sequence-recall`
  - [x] `qte-boss-parry`
- [x] Deliver requested non-QTE games:
  - [x] `falling-rhythm`
  - [x] `whack-a-mole`
  - [x] `stardew-fishing`
  - [x] `flappy-bird`
  - [x] `survive-30-seconds`
  - [x] `parking-rush`
  - [x] `slot-machine`
  - [x] `red-light-green-light`
  - [x] `quiz-gauntlet`
  - [x] `merge-2048`
  - [x] `memory-flip`
  - [x] `rapid-memory`
  - [x] `arithmetic-rush`
- [x] End-to-end verification for all generated games completed

### 2026-03-12 (QTE Expansion + Full Game Pack Delivery)
- Upgraded `qte-challenge` with explicit non-clickable blank windows between cue windows.
- Delivered four additional QTE variants:
  - `qte-direction-switch`
  - `qte-hold-release`
  - `qte-sequence-recall`
  - `qte-boss-parry`
- Delivered requested non-QTE games:
  - `falling-rhythm`
  - `whack-a-mole`
  - `stardew-fishing`
  - `flappy-bird`
  - `survive-30-seconds`
  - `parking-rush`
  - `slot-machine`
  - `red-light-green-light`
  - `quiz-gauntlet`
  - `merge-2048`
  - `memory-flip`
  - `rapid-memory`
  - `arithmetic-rush`
- Completed full end-to-end validation pass for all generated games:
  - load success
  - settlement scene reachability
  - final Continue trigger
  - payload core fields (`rating`, `score`, `attribute`, `modifier`)
  - fixed modifier mapping (`S/A/B/C/D -> +2/+1/0/-1/-2`, later updated to `S/A/B/C -> +3/+1/0/-1`)

## Next Expansion (2026-03-12)

### Target
- Add 20 more simple one-minute mini-games under `games/`.
- Re-optimize UI across all generated games to avoid visible overlap and keep layouts readable on the fixed mobile canvas.
- Re-run end-to-end verification across the full pack after UI polish.

### Expansion Checklist
- [ ] Deliver new games:
  - [x] `color-match`
  - [x] `target-tap`
  - [x] `lane-dash`
  - [x] `stack-drop`
  - [x] `shell-shuffle`
  - [x] `spotlight-seek`
  - [x] `dial-safe`
  - [x] `jump-hurdle`
  - [x] `balloon-pop`
  - [x] `odd-one-out`
  - [x] `code-breaker`
  - [x] `basket-catch`
  - [x] `gate-picker`
  - [x] `power-swing`
  - [x] `tile-trace`
  - [x] `shape-match`
  - [x] `meteor-dodge`
  - [x] `pulse-keeper`
  - [x] `path-picker`
  - [x] `reactor-cooler`
- [x] UI polish pass across all generated games completed
- [x] Full end-to-end verification re-run across all generated games completed

### 2026-03-12 (Expansion Progress)
- Completed all 20 new games with real gameplay loops:
  - `color-match`
  - `target-tap`
  - `lane-dash`
  - `stack-drop`
  - `shell-shuffle`
  - `spotlight-seek`
  - `dial-safe`
  - `jump-hurdle`
  - `balloon-pop`
  - `odd-one-out`
  - `code-breaker`
  - `basket-catch`
  - `gate-picker`
  - `power-swing`
  - `tile-trace`
  - `shape-match`
  - `meteor-dodge`
  - `pulse-keeper`
  - `path-picker`
  - `reactor-cooler`
- Switched the new choice / tap layouts to a safer non-overlapping panel structure:
  - header + stats
  - larger centered play card
  - dedicated status/combo band below the action area
- Reworked older high-risk layouts that previously overlapped:
  - `arithmetic-rush`
  - `quiz-gauntlet`
  - `rapid-memory`
  - `whack-a-mole`
  - other legacy HUDs with status/combo text crossing into play areas
- Re-ran runtime settlement checks across the full 38-game pack:
  - 37 games validated through a generic `ResultScene` CTA flow
  - `merge-2048` validated through its `RatingScene` CTA flow
  - all payloads matched `rating / score / attribute / modifier`

## 50-Game Expansion (2026-03-12)

### Target
- Expand the pack from 38 to 50 distinct mini-games.
- Keep every game understandable within a few seconds and completable within one minute.
- Preserve the current unified UI quality bar and settlement compatibility.
- Re-run full parse and settlement verification across all 50 games after delivery.

### Expansion Checklist
- [x] Deliver new games:
  - [x] `snake-sprint`
  - [x] `breakout-blitz`
  - [x] `mini-golf-putt`
  - [x] `word-scramble`
  - [x] `maze-escape`
  - [x] `conveyor-sort`
  - [x] `cannon-aim`
  - [x] `orbit-avoid`
  - [x] `bomb-defuse`
  - [x] `goalie-guard`
  - [x] `traffic-control`
  - [x] `balance-beam`
- [x] UI pass across the full 50-game pack completed
- [x] Full parse and end-to-end settlement verification completed

### 2026-03-12 (50-Game Expansion Progress)
- Started the final expansion from 38 to 50 games.
- Locked the new game list to twelve distinct mechanics:
  - `snake-sprint`
  - `breakout-blitz`
  - `mini-golf-putt`
  - `word-scramble`
  - `maze-escape`
  - `conveyor-sort`
  - `cannon-aim`
  - `orbit-avoid`
  - `bomb-defuse`
  - `goalie-guard`
  - `traffic-control`
  - `balance-beam`
- Delivered and syntax-checked:
  - `snake-sprint`
  - `breakout-blitz`
  - `word-scramble`
  - `maze-escape`
  - `cannon-aim`
  - `orbit-avoid`
  - `conveyor-sort`
  - `bomb-defuse`
  - `goalie-guard`
  - `balance-beam`
  - `mini-golf-putt`
  - `traffic-control`
- Reached 50 total games under `games/`.
- Completed a focused UI pass on the new high-risk layouts and nudged overlapping status/combo bands below the play cards where needed:
  - `bomb-defuse`
  - `conveyor-sort`
  - `goalie-guard`
  - `mini-golf-putt`
  - `traffic-control`
- Re-ran parse validation across all 50 games:
  - 50 / 50 script blocks compiled successfully
- Re-ran browser settlement validation across the full pack:
  - 49 games validated through the generic `ResultScene` CTA flow
  - `merge-2048` validated separately through its `RatingScene` CTA flow
  - all payloads matched `rating / score / attribute / modifier`
  - all modifier values matched `S / A / B / C / D -> +2 / +1 / 0 / -1 / -2` (later updated to 4-tier `S/A/B/C -> +3/+1/0/-1`)
- Delivery and validation are tracked live in this section.

## Skill Stability Pass (2026-03-13)

### Target
- Merge the repository agent rules into `SKILL.md` without changing the core skill contract.
- Make roadmap logging mandatory before and after every task.
- Fill `list.md` with the current game inventory: name, mechanic, directory.
- Fold in recent implementation and verification lessons to improve stability.
- Sync the documentation update to GitHub after verification.

### Checklist
- [x] Add mandatory roadmap logging rules to `SKILL.md`
- [x] Merge `agent.md` guidance into `SKILL.md`
- [x] Expand `list.md` with full game inventory
- [x] Verify updated docs for consistency
- [x] Sync changes to GitHub

### 2026-03-13 (Progress)
- Started the skill stability pass requested by the user.
- Merged the former agent constraints into `SKILL.md` and kept `agent.md` as a backward-compatible pointer.
- Added explicit mandatory rules for:
  - roadmap logging before and after every substantive task
  - list maintenance whenever game inventory changes
  - per-game manual delivery over blind bulk generation
- Expanded `list.md` into a full 50-game inventory with name, gameplay summary, and directory path.
- Updated `README.md` so the repository now points to `SKILL.md` as the single primary operating guide.
- Verified document consistency:
  - non-empty document check passed
  - `list.md` inventory count matches the 50 shipped game directories exactly
- Synced the repository to GitHub:
  - pushed `main` to `origin`
  - current sync commit: `a598d5a`

## Rating System Migration (2026-03-19)

### Target
- Change settlement rating from five tiers (`S/A/B/C/D`) to four tiers (`S/A/B/C`).
- Update modifier mapping from `+2/+1/0/-1/-2` to `+3/+1/0/-1`.
- Apply changes across the entire codebase: all 50 games, 2 examples, template, contracts, host code, validation script, and all documentation.

### Checklist
- [x] Update all 50 games under `games/`: `MODIFIER_BY_RATING`, `getRating`, `getModifier`, `ratingColor`
- [x] Update 2 examples under `examples/`: same + remove D-rank shake effects
- [x] Update template `templates/phaser-h5-template.html`
- [x] Update contracts: `settlement.contract.md`, `settlement.schema.json`
- [x] Update host code: `cocos-settlement-handler.ts`, `cocos-webview-integration.md`
- [x] Update validation script: `scripts/validate-settlement.js`
- [x] Update standards and docs: `SKILL.md`, `design-guide.md`, `framework-constraints.md`, `compatibility-checklist.md`, `README.md`, `narrative-layer.md`
- [x] Update `roadmap.md` historical references
- [x] Full grep verification passed — no stale D-tier or old modifier references remain in active code/specs

### 2026-03-19 (Progress)
- Completed full migration from 5-tier to 4-tier rating system.
- Removed D rating entirely; lowest tier is now C.
- S modifier changed from +2 to +3; A/B/C unchanged (+1/0/-1).
- Updated 60+ files across games, examples, template, contracts, host integration, validation, and documentation.
- Verified via grep: zero remaining references to old 5-tier mapping in active code or specs.

## Episode Content Pipeline (2026-03-19)

### Target
Build a pre-production content pipeline that lets editors define per-episode mini-game context in a JSON config, then a build script selects the right game via LLM (Claude API) and injects episode-specific assets and narrative into the HTML output. All 50 games are patched to read from `window.__EPISODE_CTX__` with fallback to URL params.

### Checklist
- [x] Update `roadmap.md` before starting (this entry)
- [x] Create `episodes/episode.schema.json` — JSON schema for episode configs
- [x] Create `episodes/game-selector.json` — static fallback mapping (sceneType → gameId[])
- [x] Create `episodes/game-selector.md` — editor-facing mapping documentation
- [x] Create `episodes/example-ep01-scene02.json` — example episode config
- [x] Create `templates/episode-ctx-snippet.js` — canonical CTX reader snippet
- [x] Create `scripts/patch-games-episode-ctx.js` — one-time migration script
- [x] Run patch script — patch all 50 games + template + 2 examples (53 files)
- [x] Create `scripts/build-episode-game.js` — build script with LLM game selection
- [x] Update `SKILL.md` — episode pipeline section
- [x] Update `list.md` — new files + capability note
- [x] Finalize `roadmap.md` with completion notes

### 2026-03-19 (Completion)
- Created all 7 new episode pipeline files:
  - `episodes/episode.schema.json` — JSON Schema draft-07; required: episodeId, sceneId, attribute, primaryColor; conditional: sceneContext required when gameId absent
  - `episodes/game-selector.json` — 7 sceneTypes × 3 difficulties (easy/moderate/hard); 3–5 gameIds per cell
  - `episodes/game-selector.md` — editor guide covering selection priority, sceneType→game mapping table, difficulty guidance
  - `episodes/example-ep01-scene02.json` — annotated example: ep01/scene02, Courage attribute, #E05C5C, action/hard, character "Aria", 3 narrative lines
  - `templates/episode-ctx-snippet.js` — canonical 4-line CTX reader with priority chain comment
  - `scripts/patch-games-episode-ctx.js` — idempotent migration script; CRLF-aware (`\r?\n` regex + `detectEol()`); preserves per-file ATTRIBUTE default values
  - `scripts/build-episode-game.js` — main build pipeline; selection priority: config `gameId` → DeepSeek API (`deepseek-chat`, `api.deepseek.com`) → static fallback; CTX injected before Phaser CDN `<script src>` tag
- Applied patch script to all 53 files: 53/53 patched, 0 warnings, 0 errors.
  - All games now use 4-line CTX-aware param block: `const CTX = window.__EPISODE_CTX__ || {};`
  - Original ATTRIBUTE defaults preserved per file (Charm / Wisdom / Focus / Agility / etc.)
  - CRLF line endings preserved throughout
- Updated `SKILL.md` with full "Episode Content Pipeline" section: architecture diagram, config fields, CLI usage, CTX contract, relevant files table.
- Updated `list.md` with 8 new file entries for the episode pipeline.
- Dry-run verified: `example-ep01-scene02.json` → static fallback selected `qte-boss-parry` (action/hard pool); output path `games/ep01_scene02/index.html`; CTX block correctly formed.
- LLM game selection routes through ZenMux gateway (`zenmux.ai/api/v1`, model `deepseek/deepseek-chat`, env `ZENMUX_API_KEY`); falls back gracefully if API key absent or request times out (20 s).

## Context Injection Layer (2026-03-19)

### Target
Fill the three gaps identified in the post-delivery audit:
- P0: Games actually render `CTX.narrative[]` — inject narrative overlay via build pipeline (no game file changes)
- P1: Support `portraitUrl` / `bgUrl` in the same overlay; create Cocos-side `EpisodeContextBuilder`
- P3: `DISPLAY_ATTRIBUTE` patch — settlement copy uses character name ("Mira的勇气" vs "勇气")

### Checklist
- [x] Update `build-episode-game.js` — `buildOverlayBlock()` + `injectOverlay()` for narrative/portrait/bg
- [x] Create `host/episode-context-builder.ts` — Cocos-side CTX assembly + WebView injection helpers
- [x] Create `scripts/patch-games-dynamic-attr.js` — add `DISPLAY_ATTRIBUTE`, patch ResultScene text
- [x] Run `patch-games-dynamic-attr.js --apply` on all 53 files
- [x] Update `list.md` — new files
- [x] Finalize roadmap

### 2026-03-19 (Completion)

**P0 — Narrative overlay (build-episode-game.js)**
- Added `buildOverlayBlock(cfg)`: returns a self-contained HTML+JS block when `cfg.narrative[]` is non-empty. Handles tap-to-advance dialogue, progress dots, portrait image, background image, and fade-out after the last line. Returns `null` when no narrative — zero overhead for games that don't use it.
- Added `injectOverlay(html, overlayBlock)`: inserts the block immediately after `<body>`, above the Phaser canvas. Phaser loads underneath and is immediately interactive once the overlay fades out.
- Added `Overlay:` line to the `[DONE]` log so build output clearly shows whether a narrative was injected.
- No changes required to any of the 50 game files — the overlay layer lives entirely in the build pipeline.

**P1 — Cocos Context Builder (host/episode-context-builder.ts)**
- Created `host/episode-context-builder.ts` with five exported members:
  - `buildEpisodeCtx(input)` — validates and assembles a frozen `EpisodeCtx` object; throws on missing/malformed required fields; preserves optional `character`, `background`, `narrative`, `difficulty`.
  - `injectCtxScript(ctx)` — serializes CTX to `window.__EPISODE_CTX__ = {...};` for `evaluateJS()`.
  - `appendCtxToUrl(baseUrl, ctx)` — lightweight URL-param fallback for Android WebViews that don't support pre-load JS injection (attribute + primaryColor only).
  - `readCtxSnippet(defaultAttribute, defaultPrimaryColor)` — returns the canonical 4-line CTX reader; useful for code generation or documentation.
  - `isEpisodeCtx(value)` — type guard for validating objects from external sources.
- Follows the same strict TypeScript style as `cocos-settlement-handler.ts`.

**P3 — DISPLAY_ATTRIBUTE patch (scripts/patch-games-dynamic-attr.js)**
- Created idempotent patch script; CRLF-aware; `--apply` flag required to write files.
- Dry-run confirmed 53 targets, 0 errors.
- Applied: 53/53 patched, 0 skipped, 0 errors.
- Idempotency verified: re-running after apply shows 0 patched, 53 skipped, 0 errors.
- Spot-check `games/balloon-pop/index.html`: line 23 → `DISPLAY_ATTRIBUTE` declaration; line 469 → `DISPLAY_ATTRIBUTE + ' ' + modText` in ResultScene settlement text. ✓

**Verification**
- Grep confirms `DISPLAY_ATTRIBUTE` is present in all 53 patched files (no stale `ATTRIBUTE + ' ' + modText` patterns remain in game/example/template files).
- `list.md` updated with 2 new entries: `host/episode-context-builder.ts`, `scripts/patch-games-dynamic-attr.js`.

## Dramatizer Format Adapter (2026-03-19)

### Target
Allow the episode pipeline to accept the richer Dramatizer authoring format (the structured JSON produced by the story-writing tool) as an alternative to hand-authoring `episodes/*.json` configs. The adapter normalizes Dramatizer fields into the existing `EpisodeCtxInput` shape; caller provides portrait/background URLs as enrichment. Narrative overlay also upgraded to support per-line character/portrait switching.

### Checklist
- [x] Add `NarrativeLine` type + `characters` map to `host/episode-context-builder.ts`
- [x] Update overlay script in `build-episode-game.js` — per-line character/portrait switching via `charMap` + `setChar()`
- [x] Update `buildCtxScript` in `build-episode-game.js` — pass-through `characters` field to `window.__EPISODE_CTX__`
- [x] Create `host/dramatizer-adapter.ts` — full Dramatizer → EpisodeCtxInput adapter
- [x] Update `episodes/episode.schema.json` — `narrative` items accept `string | NarrativeLine`; `maxItems` 8→12; add `characters` map property
- [x] Create `episodes/example-ep05-scene01.json` — EP5「派对上的咸猪手」adapted example
- [x] Update `list.md` + `roadmap.md`

### 2026-03-19 (Completion)

**Type system (`host/episode-context-builder.ts`)**
- Added `NarrativeLine` interface: `{ speaker: string; text: string; portraitUrl?: string }`.
- `EpisodeCtx.narrative` changed from `string[]` to `Array<string | NarrativeLine>` — backward-compatible; plain string items still work unchanged.
- Added `EpisodeCtx.characters?: Record<string, string>` — multi-character portrait map for overlay; keys = display names, values = portrait URLs.
- `buildEpisodeCtx` deep-copies both new fields; `isEpisodeCtx` type guard unchanged (optional fields).

**Narrative overlay upgrade (`build-episode-game.js`)**
- `buildOverlayBlock` now builds a `charMap` from both `CTX.characters` (multi-char map) and `CTX.character` (single protagonist default).
- Added `setChar(speaker, portraitUrl)` helper inside overlay: resolves portrait URL by per-line override → `charMap[speaker]` → hidden.
- `show(i)` detects string vs NarrativeLine per item; calls `setChar()` on each advance — portrait and speaker name update live as player taps.
- Fully backward-compatible: string-array narratives (no speaker field) display text only, portrait hidden.

**Dramatizer adapter (`host/dramatizer-adapter.ts`)**
- `normalizeEpisodeId("EP 5")` → `"ep-5"` via lowercase + space→hyphen + strip non-alphanumeric.
- `parseCheck("WIL（意志）12")` → `{ code: "WIL", attribute: "意志", threshold: 12, sceneType: "tension", difficulty: "hard" }`. Also handles English format `"WIL 12"`. Returns `null` for `"无需检定"`.
- `STAT_TO_SCENE_TYPE`: WIL→tension, STR/DEX/AGI→action, CHA/EMP→romantic, INT/PER→mystery, END/LCK→competitive.
- `extractNarrativeLines(script, portraitMap, maxLines)`: regex-parses `Name（...）：text` and `Name：text` lines from `pre_choice_script`; takes last N lines (the tension peak leading into the game); attaches `portraitUrl` from `portraitMap` when available.
- `buildSceneContext(ep, protagonist, checkInfo)`: assembles a concise natural-language context string for LLM game selection (episode title + protagonist + attribute check + choice type + option descriptions).
- `adaptDramatizerEpisode(ep, enrichment)` assembles full `DramatizerAdaptedConfig`; validates `sceneId` and `primaryColor`; exposes `_dramatizer` metadata block (choiceOptions + outcomes) for Dramatizer engine use.
- `toEpisodeConfigJson(cfg)`: strips `_dramatizer` metadata → plain JSON safe to write as `episodes/*.json`.

**Schema update (`episodes/episode.schema.json`)**
- `narrative` items: `oneOf [string (plain text), object {speaker, text, portraitUrl?}]`; `maxItems` raised 8→12.
- Added `characters` property: `additionalProperties: { type: "string", format: "uri" }`.
- `additionalProperties: false` preserved at root — no schema drift.

**EP5 example (`episodes/example-ep05-scene01.json`)**
- EP5「派对上的咸猪手」— WIL检定 threshold 12 → difficulty hard, sceneType tension, primaryColor #8B2FC9.
- `characters` map: Avery / Jason / Aiden with per-character portrait URLs.
- `narrative`: 4 lines — Jason sneer, Avery cry for help, 旁白 narration, Aiden intervention; per-line `portraitUrl` on Jason and Aiden lines.

**Flow alignment confirmed**
- `pre_choice_script` full content plays out in the Cocos native layer.
- WebView opens at the attribute check node; overlay shows the last N extracted lines as a tension recap.
- Player taps through overlay → fade out → Phaser mini-game starts.
- Settlement result returns to Cocos → `post_choice_outcomes` branch continues.

## Stitch Parking Chase Integration (2026-03-20)

### Target
- Continue the interrupted Claude workflow for Stitch project `6253924427105903968`.
- Download the generated Stitch HTML for the Parking Chase design package and map it onto the local Phaser implementation.
- Determine whether `games/parking-chase/` is the intended integration target and align repo files accordingly.

### Checklist
- [x] Inspect existing local target files related to Parking Chase
- [x] Download key Stitch screen HTML/assets for the project
- [x] Compare Stitch layout against current Phaser game structure
- [x] Implement the required integration changes in the target game
- [ ] Verify browser runtime and settlement flow

### 2026-03-20 (Started)
- Resumed from the local Claude session after it successfully enumerated the Stitch project screens but stopped before integrating the HTML.
- Confirmed the relevant Stitch project ID is `6253924427105903968` (`Parking Chase - 暗中藏匿 Mini Game UI`).
- Began inspecting the local repository target and pulling the generated HTML into the current workspace.

### 2026-03-20 (Progress)
- Recovered the interrupted Claude context from `~/.claude/projects/D--nick-MobAI-minigame-remix/16409d82-de47-43ed-b0d5-0d7205b4c6aa.jsonl`.
- Pulled and compared the key Stitch screens:
  - gameplay shell `378448e4f74247789bd494ab3807a0f8`
  - main gameplay `b2f0a482fcae410d806cf8ea3575b34e`
  - settlement `6a20fa644e10499cb54f8a199fb5b45c`
- Confirmed `data/ep5` contains the background and character art used for this episode and aligned the Phaser game with that material.
- Reworked `games/parking-chase/index.html` to match the Stitch noir UI direction while preserving the existing Phaser gameplay loop and settlement contract:
  - top app bar, progress/risk HUD, bottom nav shell
  - state-driven action button (`快跑` / `屏住`)
  - atmospheric parking-lot scene with Aiden/Avery art from `data/ep5`
  - Stitch-style settlement screen layout
- Updated `list.md` to register `parking-chase` as a shipped game entry.
- Static verification completed:
  - inline game script parses successfully via `new Function(...)`
  - local HTTP preview returns `200` at `http://localhost:4174/games/parking-chase/index.html`
- Remaining verification gap:
  - no automated browser interaction was available in this session, so final click-through settlement verification is still pending manual/browser inspection.

### 2026-03-22 (Asset Pipeline & Skill Update)

**Asset Generation Pipeline — Green Screen Approach**
- Discovered Gemini image generation models cannot output true alpha channels (always `hasAlpha: false`)
- Established two-step pipeline: Gemini generates green screen (#00FF00) character poses → sharp chroma key removal
- Generated tense/scared Avery and alert/protective Aiden poses from original character references
- Chroma key removal achieves 76-80% transparent pixels with clean edges and de-spill

**Key Learnings Documented**
- White background removal unreliable for characters wearing white clothing
- Must always request "SOLID BRIGHT GREEN (#00FF00) chroma key background" in Gemini prompts
- Never let Gemini generate scene backgrounds — they pollute the character image
- Always verify `hasAlpha: true` via sharp metadata after processing
- Preserve original aspect ratio (768:1344 / 768:1376) — never hardcode display sizes

**Game Code Fixes**
- Fixed character stretching: calculate display size from actual image aspect ratio
- Lowered car silhouette obstruction for better character visibility
- Switched to green-screen generated character assets (`avery_clean.png`, `aiden_clean.png`)

**Stitch MCP Integration**
- Installed and configured Google Stitch MCP with API key + HTTPS proxy (port 7890 for China)
- Created Stitch project with noir design theme (cinematic dark UI)
- Generated 6 UI screens: gameplay, game screen, romantic overlay, main game, result screen
- Extracted design tokens (surface hierarchy, primary/secondary/tertiary colors, typography)

**SKILL.md Updates**
- Added "Asset Generation & Processing Pipeline" section: ZenMux Vertex AI protocol, green screen workflow, chroma key removal, anti-patterns table
- Added "UI Design with Google Stitch" section: setup, workflow, design theme integration
- Added "Environment & API Keys" and "Local Development" sections
- Fixed stale DeepSeek references → updated to Gemini (google/gemini-3.1-pro-preview)
- Updated build pipeline description and relevant files table

**Scripts**
- `scripts/zenmux-image.js` — working image generation via ZenMux Vertex AI protocol
- Inline sharp chroma key script (to be extracted to `scripts/chroma-key.js` if needed)

### 2026-03-23 — EP6「以伤为盾」Brave Guard

**Target**: 定制化小游戏 — Kai 找 Mia 麻烦, Jake 受伤保护 Mia. 基于 QTE Boss Parry 模板.

**Deliverables**:
- [ ] 素材准备: 3角色绿幕姿势 + 抠图透明 PNG
- [ ] 音频: Freesound BGM + SFX
- [ ] 游戏实现: `games/brave-guard/index.html` (Freesound 版)
- [ ] 离线版: `games/brave-guard/index-standalone.html`
- [ ] 验证: Preview MCP 截图 + 结算流程
- [ ] 更新 list.md

**Progress**:
- Started: 需求分析完成, 机制选型 = QTE Boss Parry
- 等待用户保存参考图到 `data/ep6/character/` 和 `data/ep6/background/`

## Attribute Archetype Pack (2026-03-23)

### Target
- Curate 12 reusable mini-game templates for four recurring attribute checks:
  - `ATK` 身手
  - `WIL` 意志
  - `INT` 智慧
  - `CHA` 魅力
- Create a dedicated maintenance folder that groups the selected templates together.
- Add richer gameplay-fit descriptions so a later LLM can match scene context to the most suitable template.

### Checklist
- [x] Review existing game metadata across the shipped pack
- [x] Select 3 templates per attribute archetype
- [x] Create a dedicated curated folder with the 12 selected templates
- [x] Add machine-readable and editor-readable maintenance tables
- [x] Update repository inventory docs

### 2026-03-23 (Completion)
- Created curated pack folder:
  - `packs/attribute-archetypes/`
- Locked the 12-template selection:
  - `ATK`: `qte-boss-parry`, `lane-dash`, `cannon-aim`
  - `WIL`: `will-surge`, `pulse-keeper`, `qte-hold-release`
  - `INT`: `code-breaker`, `parking-rush`, `maze-escape`
  - `CHA`: `falling-rhythm`, `spotlight-seek`, `stardew-fishing`
- Added two maintenance assets inside the pack:
  - `selection-matrix.md` — editor-facing table with gameplay descriptions, scene fit, and matching cues
  - `selection-manifest.json` — machine-readable manifest for future LLM routing / tooling
- Planned the pack as a curated snapshot copied from `games/` so future scene-specific customization can happen in one place without searching the full 50+ game library.
- Verification completed:
  - `packs/attribute-archetypes/games/` contains all 12 expected template folders
  - `selection-manifest.json` parses successfully as JSON
  - curated folder names match the locked selection list exactly

## Attribute Archetype Style System (2026-03-23)

### Target
- Derive a unified visual language from the provided battle UI concept image.
- Produce a reusable style document for the curated 12-game pack.
- Cover core brand tokens, scene palettes, component rules, and implementation tokens so the games can be polished consistently later.

### Checklist
- [x] Analyze the reference image's dominant color relationships and shape language
- [x] Create a style guide document inside `packs/attribute-archetypes/`
- [x] Include primary/secondary colors plus scene/state palettes for casual mini-game use cases
- [x] Update repository inventory docs

### 2026-03-23 (Completion)
- Added `packs/attribute-archetypes/style-guide.md`.
- Locked the visual direction to:
  - warm cream backgrounds
  - candy pink primary emphasis
  - muted lavender secondary support
  - plum outlines and soft raised pink cards
- Included:
  - core brand tokens
  - multi-scene palette table
  - gameplay state color mapping
  - component rules for buttons, panels, bars, portraits
  - CSS token block for implementation

## Curated Pack Visual Prototype (2026-03-23)

### Target
- Apply the new curated pack style system to one selected game as a visual prototype.
- Use the prototype to validate the palette, HUD structure, action buttons, and result screen before scaling to all 12 games.
- Start with the most reference-aligned template: `qte-boss-parry`.

### Checklist
- [x] Restyle `packs/attribute-archetypes/games/qte-boss-parry/index.html`
- [x] Add step3-compliant music and sound effects to the sample
- [x] Apply step5 difficulty tuning: stage risk-reward, escalating punishment, stricter S-rank gate
- [x] Keep gameplay and settlement contract unchanged
- [x] Run a syntax sanity check on the updated inline script after audio/difficulty changes

### 2026-03-23 (Completion)
- Applied the new curated pack style system to `packs/attribute-archetypes/games/qte-boss-parry/index.html`.
- Shifted the game from dark generic QTE styling to the new cream + candy pink + lavender battle-UI direction:
  - versus-style top HUD
  - warm background with dotted pattern
  - raised pink prompt card
  - chunkier bottom action buttons
  - matching settlement screen
- Added repo-SKILL step3 audio integration:
  - inline `MoonAudio` synth engine
  - first-gesture audio unlock
  - looping action BGM
  - SFX for tap / alert / success / fail / countdown tick / showdown heartbeat
- Applied repo-SKILL step5 difficulty tuning:
  - 3 gameplay phases (`OPENING` / `PRESSURE` / `SHOWDOWN`)
  - phase-based trigger and windup windows
  - escalating miss penalties via `missStreak`
  - stricter score thresholds with `S` gated behind zero misses
- Kept the settlement payload fields unchanged.
- Verification completed:
  - inline script syntax parses successfully via `new Function(...)`

### 2026-03-24 — EP6 Campus Showdown (Episode Skin)

**Target**: Build EP6 story-driven mini-game — Aiden harasses Avery at school, Jason (injured) steps in to protect her.

### Checklist
- [x] Identify template: ATK → `qte-boss-parry` (打架、保护别人、近身对抗)
- [x] Verify assets: `data/ep6/` — campus.jpg bg, 3 character processed PNGs (aiden_threat, avery_worried, jason_guard)
- [x] Create `games/ep-6_scene01/index.html` based on qte-boss-parry template
- [x] Add NarrativeScene with 6-line dialogue (Aiden→Avery→Aiden→Jason→Aiden→Jason)
- [x] Customize GameScene: Jason vs Aiden, character avatars in VS header
- [x] Add narrative result text based on outcome
- [x] Update `list.md` with new game entry
- [x] Browser verification — Boot/Narrative/Game/Result all render; no JS errors; settlement payload valid

### 2026-03-25 — EP8 Sweet Romance (Deep Customization)

**Target**: Build EP8 深度定制版 mini-game — 甜蜜浪漫主题，使用 EP6 图片素材，stardew-fishing 模板

### Checklist
- [x] 模板选取: CHA → `stardew-fishing` (调情/心动/拉扯)
- [x] 素材复用: EP6 campus.jpg + avery/jason processed PNGs
- [x] 创建 `games/ep-8_scene01-sweet/index.html`
- [x] 添加 NarrativeScene 甜蜜对白 (Avery + Jason 放学后漫步，4句对白)
- [x] 深度定制: drawSceneBg + 暖粉色调(#FFF5F7) + candy 卡片色(#FFE0EB)
- [x] 游戏内文案剧情化 (心跳同步隐喻: 好感度/心动/心跳同步)
- [x] BGM 风格: romantic
- [x] 难度调校 (内置递增: difficulty 1→12, 鱼速/增益递减)
- [x] Playwright 浏览器验证 — Boot/Narrative/Game 三屏截图通过，无 JS 错误
- [x] 更新 list.md
- [x] 结算剧情文案: S/A/B/C 四档不同甜蜜程度描述
