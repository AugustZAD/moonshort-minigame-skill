# Moonshort MiniGame Skill

Standalone framework and skill repository for building Moonshort-compatible H5 mini-games.

## What this project contains
- A canonical mobile mini-game design guide
- A hard compatibility contract for host settlement payloads
- A host-side Cocos parsing reference and integration guide
- A local settlement validation script
- A reusable Phaser single-file H5 template
- Example games and a shipped game pack under `games/`
- A single primary operating guide in `SKILL.md`

## Core guarantees
- H5 only
- Phaser 3 single-file output
- Stable host payload fields: `rating`, `score`, `attribute`, `modifier`
- Five-tier settlement: `S / A / B / C / D`
- Final settlement is sent only from the confirmation CTA

## Repository workflow
1. Use `SKILL.md` as the primary execution guide.
2. Log every substantive task in `roadmap.md` before starting and mark it complete after verification.
3. Keep `list.md` current when the game inventory changes.
4. Put generated games in `games/<game_id>/index.html`.

## Start here
1. Read `SKILL.md`
2. Read `standards/design-guide.md`
3. Read `standards/framework-constraints.md`
4. Read `contracts/settlement.contract.md`
5. Read `host/cocos-webview-integration.md`
6. Copy `templates/phaser-h5-template.html`
