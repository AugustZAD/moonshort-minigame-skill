# Lane Dash V4 — Full Redesign Spec

**Date**: 2026-04-13
**Output**: `packs/attribute-archetypes/games/lane-dash/index-v4.html` (new file, original untouched)
**Framework**: 3 lanes × 30s × 3 lives (unchanged)
**Approach**: Combo-driven positive feedback loop + obstacle diversity + collectible

---

## 1. Obstacle System (3 types)

### 1.1 Normal Obstacle
- Visual: Theme `danger` color rounded rect (current style)
- Speed: `baseSpeed` (240 + difficulty × 12 px/s)
- Width: 1 lane (38px)
- Available: All game

### 1.2 Fast Obstacle (difficulty ≥ 3, ~6s in)
- Visual: Bright red + pulsing white border + "⚡" icon centered
- Speed: `baseSpeed × 1.6`
- Width: 1 lane (38px)
- Warning: 0.3s before spawn, a red flash line appears across the target lane at y=220
- Purpose: Rewards players who watch the top of screen and pre-plan

### 1.3 Wide Obstacle (difficulty ≥ 5, ~12s in)
- Visual: Dark wide block spanning 2 lanes + "⚠" marking
- Speed: `baseSpeed × 0.85` (slightly slower as compensation)
- Width: 2 adjacent lanes (occupies 2 of 3 lanes, only 1 safe lane)
- Constraint: Max 1 wide obstacle on screen at a time
- Purpose: Forces immediate reaction, compresses safe space

### 1.4 Spawn Probability Table

| Difficulty | Normal | Fast | Wide |
|-----------|--------|------|------|
| 0-2       | 100%   | 0%   | 0%   |
| 3-4       | 70%    | 30%  | 0%   |
| 5-7       | 50%    | 30%  | 20%  |
| 8+        | 40%    | 35%  | 25%  |

---

## 2. Collectible: Energy Orb

- Visual: Gold circle (r=14) + breathing glow animation (scale 1.0↔1.15, 600ms loop) + slow rotation
- Score: +15 points
- Combo effect: Does NOT increment combo, does NOT break combo (neutral)
- Spawn: Every 2.5–4s random interval (~8-12 per game)
- Lane: Random, but biased away from player's current lane (70% chance different lane)
- Constraint: Never spawns on the same row as an obstacle (checked before placement)
- Miss penalty: None (pure positive incentive)
- Collect feedback: Gold particle burst (8 particles) + coin-like chime sound + "+15" toast
- Deep customization: Can be replaced via `CTX.sprites.orb` with story-themed item

---

## 3. Combo Visual Escalation System

### 3.1 Tier Thresholds

| Tier | Combo | Name | Key Visual |
|------|-------|------|-----------|
| 0 | 0-2 | Calm | Default state, no effects |
| 1 | 3-5 | Warming | Speed lines ×1.5, subtle screen pulse |
| 2 | 6-9 | Blazing | Speed lines ×2, player trail particles, edge glow |
| 3 | 10+ | Unstoppable | All above + bg color warm shift, player glow border, toast |

### 3.2 Speed Lines Enhancement
- Base: 4 lines, alpha 0.06, white (current)
- Tier 1: 6 lines, alpha 0.10
- Tier 2: 10 lines, alpha 0.14, slightly warm-tinted
- Tier 3: 14 lines, alpha 0.18, gold-tinted

Implementation: Speed lines are thin vertical rectangles that scroll down at `200 + combo*10` px/s. Each frame, move down; when past bottom, respawn at top with random x.

### 3.3 Screen Pulse (Tier 1+)
- On each successful dodge at combo ≥ 3: camera zoom 1.0 → 1.015 → 1.0, duration 150ms, ease Quad.easeOut
- Subtle enough to feel "alive" without causing motion sickness

### 3.4 Player Trail Particles (Tier 2+)
- Every 80ms: spawn 1 circle (r=3) at player position, player's primary color, alpha 0.35
- Tween: drift down 20px + fade to 0, duration 250ms, then destroy
- Max 8 active trail particles (skip spawn if at max)

### 3.5 Edge Glow (Tier 2+)
- Left and right screen edges get a soft gradient overlay
- Color: theme primary, alpha 0.08 at edge → 0 at 40px inward
- Implemented as two Phaser Graphics rectangles with fillGradientStyle or simple alpha rects

### 3.6 Background Warm Shift (Tier 3)
- Background color lerps from `PALETTE.bgBase` toward a warmer variant (blend 15% toward `#FFE0C0`)
- Reverts on combo break

### 3.7 Player Glow Border (Tier 3)
- Player rect gets an outer glow: same shape but 6px larger, primary color, alpha 0.3
- Pulses alpha 0.2↔0.4 at 1Hz

### 3.8 "UNSTOPPABLE" Toast (Tier 3, once per tier entry)
- Large gold text "UNSTOPPABLE!" floats up from center
- Only triggers once when combo first reaches 10 (not every dodge after)

### 3.9 Combo Break Feedback
- If combo was ≥ 3 when hit:
  - Screen shake intensity ×1.5 (0.018 vs normal 0.012)
  - Brief desaturation flash (100ms grey overlay at alpha 0.15)
  - All combo visual effects immediately reset
- Creates "fall from grace" contrast that motivates rebuilding combo

---

## 4. Scoring Rebalance

| Source | Current | V4 | Reasoning |
|--------|---------|-----|-----------|
| Passive (per sec) | 3 | 2 | Reduce passive, reward active play |
| Dodge base | 16 | 18 | Slightly higher to offset passive reduction |
| Combo bonus cap | 5 (×4=20) | 10 (×4=40) | Reward sustained combos more heavily |
| Max dodge score | 36 | 58 | High combo is very rewarding |
| Orb collect | N/A | 15 | New positive incentive |
| Hit penalty | -10 | -12 | Slightly harsher to raise stakes |
| Fast obstacle dodge | N/A | ×1.3 (23 base) | Reward riskier dodges |
| Wide obstacle dodge | N/A | ×1.5 (27 base) | Reward forced-move dodges |

### Rating Thresholds (adjusted for new scoring)

| Rating | Current | V4 |
|--------|---------|-----|
| S | 320 | 360 |
| A | 240 | 270 |
| B | 170 | 180 |
| C | 105 | 100 |

---

## 5. Difficulty Curve Redesign

### Current Problem
Linear 0.35/sec ramp. No breathing room. Late game is pure chaos.

### V4: Three-Phase Curve

| Phase | Time | Difficulty | Character |
|-------|------|-----------|-----------|
| Warmup | 0-10s | 1→4 | Gentle intro, mostly normal obstacles, orbs teach collection |
| Challenge | 10-20s | 4→8 | Fast obstacles appear, orbs in riskier positions |
| Frenzy | 20-30s | 8→12 | All types, tight spacing, high speed — survive and score big |

Formula: `difficulty = min(12, 1 + elapsed * 0.37)` (similar curve but with spawn rate adjustments per phase)

### Spawn Rate by Phase
- Warmup: 520-400ms intervals, mostly singles
- Challenge: 400-280ms, fast obstacles mixed in
- Frenzy: 280-200ms, wide obstacles, tight patterns

---

## 6. Audio Additions

### New Sounds (MoonAudio synthesis)

| Sound | Trigger | Spec |
|-------|---------|------|
| `coin()` | Orb collected | Bright sine 880→1320Hz sweep up, 100ms, gain 0.2 |
| `warning()` | Fast obstacle spawn | Quick double-beep, square wave 660Hz, 60ms × 2 with 40ms gap |
| `comboUp()` | Entering new combo tier | Rising arpeggio: base freq + combo×30Hz, 3 notes 80ms each |
| `comboBreak()` | Combo ≥3 broken | Descending slide: 400→120Hz sawtooth, 200ms |

---

## 7. Visual Polish

### 7.1 Lane Warning Flash (Fast Obstacle)
- 300ms before fast obstacle spawns, the target lane gets a red tint strip (alpha 0.15) that fades in and out
- Gives players a split-second to read and react

### 7.2 Improved Hazard Rendering
- Normal: Current style (danger color + highlight)
- Fast: Brighter red (#FF2D55) + white pulsing border (lineWidth oscillates 1-3px) + small ⚡ text
- Wide: Dark (#2D1B42) + ⚠ icon + spans from lane edge to lane edge of 2 lanes

### 7.3 Orb Rendering
- Gold circle with radial gradient (bright center → warm edge)
- Inner white highlight dot (candy feel)
- Gentle scale pulse (1.0↔1.15 sinusoidal, 600ms period)
- Soft gold outer glow (circle behind, r+6, alpha 0.2)

### 7.4 Score Delta Pop Enhancement
- Current: Simple toast
- V4: Positive scores fly up in green, negative in red, orb scores in gold
- Font size scales with value: +15 gets 24px, +58 (max combo dodge) gets 34px

---

## 8. Deep Customization Compatibility

All new elements designed for CTX injection:
- `CTX.sprites.orb` → replaces gold orb with story item sprite
- `CTX.sprites.player` → replaces player rect (existing pattern)
- `CTX.sprites.obstacle` → replaces normal obstacle (existing pattern)
- `CTX.sprites.fastObstacle` → replaces fast obstacle
- Combo tier names localizable via CTX.copy
- All English text has Chinese-ready replacements in COPY object

---

## 9. Files

| File | Action |
|------|--------|
| `packs/attribute-archetypes/games/lane-dash/index.html` | **DO NOT MODIFY** |
| `packs/attribute-archetypes/games/lane-dash/index-v4.html` | **CREATE** — complete standalone game |

---

## 10. Non-Goals

- No lane count changes (stays at 3)
- No game duration changes (stays at 30s)
- No lives system changes (stays at 3)
- No new input methods (stays at left/right tap + keyboard)
- No power-ups with duration timers (keep it simple)
- No physics engine changes
