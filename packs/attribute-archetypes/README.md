# Attribute Archetype Pack

Curated 12-template pack for the four recurring attribute checks used by the narrative pipeline:

- `ATK` 身手
- `WIL` 意志
- `INT` 智慧
- `CHA` 魅力

## Purpose

- Narrow the routing space from the full game library to a stable working set.
- Give editors and LLMs richer mechanic descriptions than `sceneType` alone.
- Keep a single folder that holds both the selected templates and their maintenance tables.

## Structure

```text
packs/attribute-archetypes/
├── README.md
├── style-guide.md
├── selection-matrix.md
├── selection-manifest.json
└── games/
    ├── cannon-aim/
    ├── code-breaker/
    ├── falling-rhythm/
    ├── lane-dash/
    ├── maze-escape/
    ├── parking-rush/
    ├── pulse-keeper/
    ├── qte-boss-parry/
    ├── qte-hold-release/
    ├── spotlight-seek/
    ├── stardew-fishing/
    └── will-surge/
```

## Maintenance Notes

- `games/` stores curated copies of the selected templates as of `2026-03-23`.
- `selection-matrix.md` is the human-maintained overview for editors.
- `style-guide.md` is the unified color and UI language reference for visual polish across the 12 games.
- `selection-manifest.json` is the machine-readable source for routing logic, prompt assembly, or scoring scripts.
- If a source template under `games/` is upgraded later, sync the corresponding copy here if the pack should inherit that change.
