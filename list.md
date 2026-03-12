# MiniGame Project List

## Root Structure

```text
.
├── README.md
├── SKILL.md
├── agent.md
├── list.md
├── roadmap.md
├── contracts/
├── host/
├── standards/
├── templates/
├── examples/
├── games/
├── scripts/
└── qa/
```

## File Responsibilities

| Path | Type | Responsibility |
| --- | --- | --- |
| `README.md` | overview | Standalone project overview and usage |
| `SKILL.md` | skill | Codex skill entry for this repository |
| `agent.md` | guide | Development constraints for future agents generating games |
| `list.md` | index | This directory map and ownership summary |
| `roadmap.md` | log | Ongoing framework development log and milestones |
| `contracts/settlement.contract.md` | contract doc | Host-bridge settlement contract (required payload + behavior) |
| `contracts/settlement.schema.json` | schema | Machine-readable payload validation schema |
| `host/cocos-settlement-handler.ts` | host adapter | Host-side payload parser and rating/modifier guard |
| `host/cocos-webview-integration.md` | guide | Cocos WebView integration reference |
| `standards/design-guide.md` | guide | Full visual and interaction design guide |
| `standards/framework-constraints.md` | standard | Compact compatibility constraints |
| `templates/phaser-h5-template.html` | template | Starter template with bridge + settlement flow |
| `examples/` | examples | Current reference games adapted to framework rules |
| `games/` | output dir | Generated game instances (`<game_id>/index.html`) |
| `scripts/validate-settlement.js` | script | Local CLI validator for settlement payloads |
| `qa/compatibility-checklist.md` | qa | Pre-release compatibility checklist |

## Conventions

- One game per folder under `games/`.
- Folder naming: lowercase kebab-case (`memory-flip`, `tap-rhythm`, `merge-puzzle`).
- Minimum file for each generated game:
  - `games/<game_id>/index.html`
- Optional additional docs for each game:
  - `games/<game_id>/README.md`

## Current Status

- Framework status: standalone project initialized (`v0.3`).
- Current examples:
  - `examples/platform-runner/index.html`
  - `examples/merge-2048/index.html`
