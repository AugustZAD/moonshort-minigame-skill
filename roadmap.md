# MiniGame Roadmap

## Goal
Extract a reusable H5 mini-game framework from existing examples, then support AI-driven batch generation while keeping host compatibility stable across a standalone repository.

## Milestones

- [x] M1: Initialize standalone framework root
- [x] M2: Define stable settlement contract (`rating/score/attribute/modifier`)
- [x] M3: Provide reusable Phaser H5 template with bridge integration
- [x] M4: Publish agent generation rules and directory conventions
- [x] M5: Add current two games as example implementations
- [x] M6: Expand settlement to five tiers (`S/A/B/C/D`)
- [ ] M7: Add first generated game under `games/`
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
  - `S / A / B / C / D`
- Locked modifier mapping to:
  - `+2 / +1 / 0 / -1 / -2`
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
