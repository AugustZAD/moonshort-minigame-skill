# MiniGame Agent Guide

## Purpose
This guide defines how future agents must build H5 mini-games for this standalone repo so that:
- games can be generated in batches with stable structure;
- every game is compatible with the current host bridge contract;
- settlement payloads always keep the same core fields.

## Output Rules (mandatory)
1. All new games must be created under `games/<game_id>/index.html`.
2. Use H5 only. Each game is a self-contained single HTML file (inline CSS/JS).
3. Use Phaser 3 from CDN:
   - `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js`
4. Keep viewport and canvas mobile-first:
   - URL viewport meta present.
   - Canvas logical size `393 x 736`.
   - Phaser scale mode `FIT` + `CENTER_BOTH`.
5. Parse host query params at boot:
   - `attribute` (default any safe string like `"Charm"`).
   - `primaryColor` (default safe hex color).
6. Settlement payload core fields are required and fixed:
   - `rating`: `"S" | "A" | "B" | "C" | "D"`
   - `score`: number
   - `attribute`: string
   - `modifier`: `2 | 1 | 0 | -1 | -2`
7. Always send settlement through `notifyGameComplete(payload)` using bridge order:
   - iOS `window.webkit.messageHandlers.jsBridge.postMessage`
   - Android `window.jsBridge.postMessage`
   - web iframe `window.parent.postMessage`
   - console fallback for debug
8. Settlement must be sent only when user confirms on final CTA (for example, `Continue` button).
9. Extra fields are allowed but cannot replace or rename the 4 core fields.

## Rating Rules (mandatory)
- `S => +2`
- `A => +1`
- `B => 0`
- `C => -1`
- `D => -2`

Use deterministic rating thresholds per game and keep them in one place (`RATING_THRESHOLDS`).

## Visual/Interaction Rules (baseline)
- Follow Kenney-like flat visual language: rounded shapes, clean outlines, no glassmorphism.
- One primary CTA per screen.
- Final settlement CTA in lower thumb zone.
- Short, readable copy for mobile.
- Provide immediate visual feedback for score changes.

Source of truth:
- `standards/design-guide.md`
- `standards/framework-constraints.md`
- `contracts/settlement.contract.md`

## Build Workflow
1. Copy `templates/phaser-h5-template.html` into `games/<game_id>/index.html`.
2. Implement gameplay loop in `GameScene`.
3. Keep settlement scene contract intact.
4. Validate payload against `contracts/settlement.schema.json`.
5. Check `qa/compatibility-checklist.md` before shipping.
6. Update `roadmap.md` with date, game id, and result.
7. If host integration changes are needed, update `host/cocos-settlement-handler.ts` and `host/cocos-webview-integration.md`.

## Done Checklist
- [ ] Game lives under `games/<game_id>/index.html`.
- [ ] Runs standalone in browser (no build step).
- [ ] Reads `attribute` and `primaryColor` from URL.
- [ ] Sends settlement payload with required 4 fields plus 5-tier rating compatibility.
- [ ] Settlement sent only from final confirmation CTA.
- [ ] Visual style and CTA placement follow design rules.
- [ ] `qa/compatibility-checklist.md` reviewed.
- [ ] Roadmap updated with implementation log.
