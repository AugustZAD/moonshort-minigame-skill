# Episode Game Selector — Editor Guide

## Overview

The build script (`scripts/build-episode-game.js`) selects the most appropriate mini-game for each episode scene using a two-step approach:

1. **LLM selection (primary)** — Calls the Claude API at build time with the `sceneContext` field. The model reasons about game feel, pacing, and thematic fit, then returns a single `gameId`.
2. **Static fallback (secondary)** — If the LLM is unavailable or `gameId` is provided directly in the episode config, the build script either uses the override or picks randomly from `game-selector.json` based on `sceneType` + `difficulty`.

---

## Selection Priority

```
gameId in episode config   →  use directly (no LLM call)
        ↓ absent
sceneContext present        →  call LLM → returns gameId
        ↓ LLM fails / unavailable
sceneType + difficulty      →  random pick from game-selector.json pool
        ↓ sceneType absent
difficulty only             →  random pick from combined moderate pool
```

---

## sceneType → Game Pool Reference

| sceneType | Best-fit games (representative) |
|---|---|
| `action` | qte-challenge, qte-boss-parry, falling-rhythm, jump-hurdle, lane-dash |
| `tension` | bomb-defuse, reactor-cooler, balance-beam, stardew-fishing, pulse-keeper |
| `romantic` | memory-flip, shell-shuffle, rapid-memory, gate-picker, spotlight-seek |
| `comedic` | whack-a-mole, balloon-pop, basket-catch, shell-shuffle, slot-machine |
| `mystery` | code-breaker, maze-escape, odd-one-out, rapid-memory, bomb-defuse |
| `competitive` | merge-2048, snake-sprint, arithmetic-rush, breakout-blitz, orbit-avoid |
| `reflective` | stardew-fishing, pulse-keeper, mini-golf-putt, tile-trace, dial-safe |

Full pools per difficulty level are in `game-selector.json`.

---

## Adding a New Game to the Selector

1. Add the game to `list.md` as usual.
2. Open `game-selector.json` and add the `gameId` to every relevant `sceneType` / `difficulty` pool.
3. Optionally update the LLM system prompt in `scripts/build-episode-game.js` to mention the new game's mechanic.

---

## Difficulty Guide for Editors

| Difficulty | Intended player experience |
|---|---|
| `easy` | Casual, low stakes; player should succeed almost always |
| `moderate` | Normal challenge; requires attention; can fail with careless play |
| `hard` | Tense, punishing; reserved for climax or high-drama scenes |

---

## Example Episode Config

See `episodes/example-ep01-scene02.json` for a fully annotated example.
