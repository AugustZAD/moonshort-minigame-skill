# Maze Escape 2.0: Braided Maze + Progressive Chase

**Date**: 2026-04-06
**Target file**: `packs/attribute-archetypes/games/maze-escape/index-v3.html`

---

## Problem
Current maze-escape has:
1. **Perfect maze** (single path between any two points) — no routing strategy
2. **Key at random dead end** — luck determines if it's near exit
3. **No real-time tension** — solving a layout is deterministic
4. S rating feels arbitrary, not skill-based

## Goals
1. Maze has **multiple paths** (loops) for genuine navigation strategy
2. Remove luck: key placement deterministic, scoring based on **escape count** not random layout
3. Add **progressive chase** tension: forgiving for newbies, challenging for experts
4. S rating requires repeatable skill, not random luck

---

## Design

### 1. Braided Maze Generation

After DFS perfect-maze generation, **braid** by removing walls:

```
function braidMaze(grid, braidRatio) {
  // Find all inner walls that separate two paths
  // Randomly remove braidRatio% of them
  // Only remove if both sides are paths AND wall is not on maze border
}
```

- `braidRatio = 0.30` (remove 30% of inner walls)
- Result: maze with loops, multiple paths between any two points
- Still has some dead-ends and choke-points for tactical play

### 2. Fixed Key/Exit Positions

- Start: (0, 0) top-left corner
- Exit: (cols-1, rows-1) bottom-right corner
- **Key: center of maze ± 1 random cell**
  - Coordinates: `(floor(cols/2) + randOffset, floor(rows/2) + randOffset)` where randOffset ∈ {-1, 0, 1}
  - Ensures key is roughly equidistant from start and exit
  - Small variance keeps replay interesting without luck gap

### 3. Maze Sizing

| Escape # | Maze Size | Cells |
|----------|-----------|-------|
| 1 (start) | 6×6 | 13×13 grid |
| 2 | 7×7 | 15×15 |
| 3 | 8×8 | 17×17 |
| 4+ | 9×9 (cap) | 19×19 |

Cell pixel size: `Math.floor(min(maxW/gridW, maxH/gridH))` — auto-fit canvas.

### 4. Progressive Chase Ghost

**Ghost states:**
```
State: Dormant (0-8s of current maze)
  → Invisible, no movement
  → Safety window for player to grab key

State: Spawning (8s mark)
  → Fade in at corner opposite to player (over 0.5s)
  → Start pathfinding

State: Hunting
  → Speed: 700ms per cell (slow start)
  → Every 500ms: recalculate BFS path to player
  → Move one step along path each 'moveInterval' ms

State: Boost (after player picks up key)
  → Speed drops 5% per speed tier
  → Min: 400ms per cell
```

**On escape (reach exit with key):**
- New maze loads
- Ghost returns to Dormant for next 8s
- Ghost speed tier resets to starting

**On capture (ghost touches player):**
- Player teleports to (0,0) start
- Key dropped (returns to center)
- Timer -5s
- Combo resets to 0
- Ghost moves to opposite corner, returns to slow speed
- Game does NOT end (player continues)

**Visual:**
- Ghost drawn as purple/violet circle with pulsing ring
- Depth 11 (below player emoji at 12)
- Alpha 0.9 when hunting, 0 when dormant
- Subtle trail effect behind

### 5. Scoring System

**Base rewards (deterministic, skill-based):**
- Pick up key: +10
- Complete escape: +30
- Per-maze speed bonus: escape in <10s → +20, <15s → +10
- No-bump bonus at game end: +50 if no wall bumps entire game

**Skill bonuses:**
- Near-miss: ghost within 2 cells during escape → +5 (rewards bold routes)
- Capture recovery: +5 for each escape after being caught once (resilience)

**Penalties:**
- Wall bump: -1s (reduced from -1.5s, maze is bigger)
- Ghost capture: -5s, reset position, drop key

### 6. Rating Thresholds

Rating based on `escapes` completed, not score:

| Rating | Requirement |
|--------|-------------|
| **S** | 3 complete escapes (with no captures) OR 4+ escapes with ≤1 capture |
| **A** | 2 complete escapes OR 3 escapes with captures |
| **B** | 1 complete escape |
| **C** | 0 escapes (at least picked up key) |

40 seconds total. Realistic per-escape time: 10-13s for skilled player.

### 7. Game Time

- ROUND_SECONDS: 35 → **40**
- Rationale: bigger mazes + chase pressure = need more time buffer

---

## Implementation Notes

### Files touched
Only `packs/attribute-archetypes/games/maze-escape/index-v3.html`.

### Code structure
- `generateMaze()` → add braid pass after DFS
- `placeKey()` → use center-offset instead of dead-end random
- GameScene.init() → add ghost state vars
- GameScene.update() → ghost state machine + pathfinding + capture check
- GameScene.drawMaze() → render ghost if visible
- ResultScene rating → use escapes count, not score

### Testing
- Verify braid doesn't disconnect maze (rare but possible if wall removal creates islands)
- Tune ghost speed via difficulty values
- Test that capture doesn't soft-lock player
- Verify S rating requires 3 escapes = ~13s each in 40s

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Ghost BFS computation too slow | Cap BFS at 200 iterations; use grid coordinates not pixel |
| Player gets stuck in unreachable loop | Post-braid connectivity check |
| 40s too short for 3 escapes | Tune ghost speed tier or reduce maze growth |
| Chase feels unfair | Dormant state + reset-on-escape gives breathing room |
| Small maze (6×6) too cramped for chase | Force min braid loops (min 3 removed walls) |
