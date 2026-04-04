# 4 Games Gameplay Polish Design

**Date**: 2026-04-05
**Scope**: red-light-green-light, will-surge, cannon-aim, maze-escape

---

## 1. Red-Light-Green-Light — Unpredictable Rhythm

### Problem
Green light 2.4s→1.2s, red light 1.6s→0.8s. Predictable rhythm makes the game too easy.

### Changes

#### A. Random duration (replace fixed formula)
```
// OLD: predictable shrink
greenTime = max(1200, 2400 - ds*60) + random*800

// NEW: fully random range, widening with difficulty
greenTime = random(800, 3000 - ds*100)   // range narrows with difficulty
redTime   = random(600, 2000 - ds*80)
```

#### B. Yellow-light fake-out (bluff switch)
- During green light, 15%→40% chance (scaling with difficulty) to flash yellow for 300ms then return to green
- Visual: yellow light activates, "WARNING" text flashes
- Players who release during yellow lose momentum but no penalty
- Implementation: in update(), when green timer hits a random midpoint, trigger `fakeSwitch()` that sets light to yellow for 300ms then back to green

#### C. Double-red (difficulty >= 6)
- 20% chance: after switching to green, wait only 400-600ms then immediately switch to red again
- Creates "trap green" that punishes players who react too quickly

#### D. Rating thresholds
```
OLD: { S: 380, A: 290, B: 200, C: 120 }
NEW: { S: 1800, A: 1200, B: 700, C: 350 }
```

---

## 2. Will-Surge — Tug-of-War Redesign

### Problem
Monotonous tapping with no sense of opposition. Two separate bars lack confrontation feel.

### Core Mechanic Change: Single Tug-of-War Bar

#### A. Bar redesign
- Replace dual meters with ONE horizontal bar (full width)
- Left side = Will (green, player), Right side = Pressure (red, opponent)
- `position` value 0.0-1.0: 0.5 = center (balanced), >0.5 = player winning, <0.5 = losing
- Bar fill: left portion green, right portion red, divider line at `position`

#### B. Physics
```javascript
// Each frame:
position -= pushSpeed * dt;        // opponent constantly pushes left
position += tapBoost;               // each tap pushes right

// pushSpeed increases over time:
pushSpeed = 0.04 + elapsed/28 * 0.06 + difficulty * 0.003;

// tapBoost per tap:
tapBoost = 0.035 - difficulty * 0.001;  // min 0.02
```

#### C. Wave system (replaces surge)
- Opponent sends "waves" every 4-7 seconds (random interval)
- **Small wave**: pushSpeed temporarily doubles for 1.5s, red ripple from right
- **Big wave (SURGE)**: pushSpeed triples for 2.5s, screen shake, red flash, "SURGE!" label
- Wave frequency increases with difficulty
- Surviving a wave = bonus points (20 + waveCount * 5)

#### D. Visual
- Keep center core circle: shows tug position as fill ratio
- Waves: Phaser particles streaming from right side toward center
- Surge: intense red particles + screen border flash + core circle pulses
- Position bar below core: clear left-green / right-red split

#### E. Scoring
```javascript
// Continuous: score when position > 0.5 (winning)
if (position > 0.5) addScore((position - 0.5) * 8 * dt * 60);
// Penalty when losing
if (position < 0.4) addScore((position - 0.4) * 4 * dt * 60);
// Wave survive bonus
onWaveSurvived: addScore(20 + wavesDefeated * 5);
// Game over if position <= 0.05 for 1+ second
```

#### F. Rating thresholds
```
NEW: { S: 180, A: 120, B: 70, C: 30 }
```

---

## 3. Cannon-Aim — Background Differentiation

### Problem
Background dot grid looks similar to target balloons. Background dots are unhittable, confusing players.

### Changes

#### A. Remove background dot grid
- Delete the `fillCircle(bx, by, 1.5)` loop in GameScene
- Replace with faint horizontal lines every 60px at 0.02 opacity (subtle depth cues without confusion)

#### B. Target balloon rope
- Draw a thin curved line (2px, 0.3 opacity) hanging below each target, 20-25px long
- Makes targets look like balloons, clearly different from any background element
```javascript
// After drawing target circle:
g.lineStyle(2, t.color, 0.3);
g.beginPath();
g.moveTo(t.x, t.y + t.r);
g.lineTo(t.x + Math.sin(time * 2) * 3, t.y + t.r + 22);
g.strokePath();
```

#### C. Target float animation
- Each target bobs up/down with `Math.sin(time * 2 + i) * 3` offset on y-axis
- Static background vs animated targets = clear visual distinction

#### D. BootScene preview cleanup
- Remove the target preview circles from BootScene background (the 0.12/0.35 opacity circles)
- These are what the user sees as "background balloons that can't be hit"

---

## 4. Maze-Escape — Easier + Better Visuals

### Problem
Too hard (5x5 start, max 9x9), key looks like a ball, exit doesn't look like an exit.

### Changes

#### A. Difficulty reduction
```
// OLD
startCols = 5, startRows = 5, maxExtra = 4  (→ 9x9)

// NEW
startCols = 4, startRows = 4, maxExtra = 3  (→ 7x7)
```

#### B. Time increase
```
OLD: ROUND_SECONDS = 30
NEW: ROUND_SECONDS = 35
```

#### C. Bump penalty reduction
```
OLD: timePenaltyPerBump = 1.5 (max 3.0)
NEW: timePenaltyPerBump = 1.0 (max 2.0)
```

#### D. Key visual: emoji 🔑
```javascript
// OLD: yellow circle
this.graphics.fillCircle(kx, ky, r);

// NEW: emoji text
this.add.text(kx, ky, '🔑', { fontSize: cellPx + 'px' })
  .setOrigin(0.5).setDepth(12);
```

#### E. Exit visual: emoji 🚪
```javascript
// OLD: colored rounded rect
this.graphics.fillRoundedRect(ex, ey, w, h, 4);

// NEW: emoji + glow when key collected
this.exitText = this.add.text(ex, ey, '🚪', { fontSize: cellPx + 'px' })
  .setOrigin(0.5).setDepth(12);

// When key collected: add glow pulse tween
if (this.hasKey) {
  this.exitText.setTint(0x4FECA2);
  // pulse scale animation
}
```

#### F. Trail visibility boost
```
OLD: this.trailGfx.fillStyle(priI, 0.15)
NEW: this.trailGfx.fillStyle(hexToInt(T.playerHp), 0.25)
```

---

## Implementation Notes

- All changes are within existing index-v3.html files
- No new files needed
- Will-surge is the largest change (tug-of-war redesign), others are parameter/visual tweaks
- All games keep the same V3 shell (THEMES, candy buttons, REPLAY, etc.)
