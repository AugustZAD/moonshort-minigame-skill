# Moonshort MiniGame Skill

Standalone framework and skill repository for building Moonshort-compatible H5 mini-games.

## What this project contains
- A canonical UI/UX design guide for mobile mini-games
- A hard compatibility contract for host bridge settlement payloads
- A host-side Cocos parsing reference and integration guide
- A local settlement validation script
- A reusable Phaser single-file H5 template
- Two migrated example games from the original moonshort repository
- Contributor and agent guidance for batch generation

## Core guarantees
- H5 only
- Phaser 3 single-file output
- Stable host payload fields: `rating`, `score`, `attribute`, `modifier`
- Five-tier settlement: `S / A / B / C / D`
- Final settlement is sent only from the confirmation CTA

## Start here
1. Read `standards/design-guide.md`
2. Read `standards/framework-constraints.md`
3. Read `contracts/settlement.contract.md`
4. Read `host/cocos-webview-integration.md`
5. Copy `templates/phaser-h5-template.html`
6. Put generated games into `games/<game_id>/index.html`
