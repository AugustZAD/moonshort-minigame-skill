# Style Polish Skill — Attribute Archetypes Pack

> Repeatable workflow for applying the unified style guide (`style-guide.md`) to each of the 12 game templates.
> Derived from the `qte-boss-parry` pilot polish.

---

## Inputs

| Input | Source | Required |
|-------|--------|----------|
| Game template HTML | `packs/attribute-archetypes/games/<id>/index.html` | Yes |
| Style guide | `packs/attribute-archetypes/style-guide.md` | Yes |
| Audio engine snippet | `templates/audio-engine-snippet.js` | Yes |

## Phase 1: Style Replacement (~60%)

### 1a. Remove Huemint / External Palette Fetch

- Delete `fetchScenePalette()`, `fallbackPalette()` with Huemint API call
- Delete `colorSet()` wrapper that depended on Huemint response
- Delete `BootScene` palette loading logic ("Loading palette…")

### 1b. Inject Static Palette from Style Guide

Replace with a deterministic palette block derived from `PRIMARY_COLOR`:

```javascript
const PALETTE = {
  bgBase:       '#FAF0E6',
  bgDark:       '#1A1221',
  primary:      PRIMARY_COLOR,
  primaryLight: blendHex(PRIMARY_COLOR, '#ffffff', 0.55),
  primaryDark:  blendHex(PRIMARY_COLOR, '#000000', 0.3),
  secondary:    '#9B7DB8',
  accentGold:   '#F5C842',
  accentRed:    '#E53E3E',
  textDark:     '#1A1A2E',
  textLight:    '#FFFFFF',
  textMuted:    '#7A7A8E',
  surfaceCard:  '#FFFFFF',
  success:      '#38C97A',
  warning:      '#FFB347',
  danger:       '#FF4D6A',
  trackBg:      '#E8D5C4',
  trackBorder:  '#D4C0AB',
};

const C = {};
function initColors() {
  Object.entries(PALETTE).forEach(([k, v]) => {
    C[k] = hexToInt(v);
    C[k + 'Hex'] = v;
  });
  C.white = 0xffffff;
}
initColors();
```

Requires helpers: `hexToRgb`, `rgbToHex`, `blendHex`, `hexToInt` (keep existing).

### 1c. Background & Dot Pattern

- `cameras.main.setBackgroundColor(PALETTE.bgBase)` — warm linen cream
- HTML body bg: `background: #FAF0E6`
- Dot pattern: `fillStyle(C.primary, 0.05)`, 2px circles, 28×30 grid offset

### 1d. UI Components — Apply Style Guide Specs

| Component | Key Changes |
|-----------|-------------|
| **Buttons** | 3D glossy: gradient body + dark shadow + rounded 16px + press-down animation |
| **Cards** | White bg, rounded 20px, 2px primary border @0.4 alpha, gold corner dots (5px circles) |
| **Health/Progress bars** | Track `#E8D5C4`, fill uses primary/secondary color, rounded ends |
| **Timer bar** | Full-width 6px at top, green→yellow→red color transition |
| **Score/Timer pills** | White bg rounded 12px, Nunito 900, `textDark` color |
| **Feedback toasts** | Float-up 30px + fade in, hold 600ms, float-up + fade out. Colors: success/primary/danger |
| **Cue/indicator** | Circle with colored ring, scale-in animation on attack spawn |

### 1e. Rounded Rectangle Helper

Games use `drawRRect(gfx, x, y, w, h, r)` for all rounded shapes drawn via Graphics.
Phaser's built-in `fillRoundedRect` works for simple cases; use `drawRRect` when combining fill+stroke on same path.

### 1f. Particles & Effects

Add these effect functions (copy from pilot):

```javascript
spawnParticles(scene, x, y, color, count, life)  // radial burst
showToast(scene, text, colorHex, x, y)            // float-up text
damageFlash(scene)                                 // red overlay flash
screenShake(scene, intensity)                      // camera shake
```

## Phase 2: Audio Integration (~20%)

### 2a. Embed MoonAudio Class

Copy the inline `MoonAudio` class (from pilot or `templates/audio-engine-snippet.js`).
Create singleton: `const audio = new MoonAudio();`

### 2b. Wire Audio to Game Events

| Event | Audio Call | Trigger |
|-------|-----------|---------|
| First user interaction | `audio.unlock(); audio.bgm('action')` | `input.once('pointerdown')` |
| Button press | `audio.tap()` | Button pointerdown handler |
| Correct action | `audio.success()` | Score positive |
| Wrong action | `audio.fail()` | Score negative |
| Attack/danger appears | `audio.alert()` | New challenge spawned |
| Timer ≤10s (per second) | `audio.tick()` | Update loop |
| Timer ≤5s (per second) | `audio.heartbeat()` | Update loop |
| Game end | `audio.stopBgm(600)` | finishGame() |
| S-rating reveal | `audio.success()` ×2 | ResultScene create |

### 2c. BGM Style Selection

| Game Type | BGM Style |
|-----------|-----------|
| ATK (combat/action) | `'action'` |
| WIL (endurance/tension) | `'tense'` |
| INT (puzzle/logic) | `'mystery'` |
| CHA (rhythm/charm) | `'romantic'` |

## Phase 3: Difficulty Tuning (~20%)

### 3a. Checklist (from SKILL.md Step 5)

| Check | Fail Criteria | Fix |
|-------|---------------|-----|
| No-brain phase | No timing judgment needed | Add rhythm pulse / stamina system |
| Idle phase | Threats don't affect player | Auto-increase tension when idle |
| No penalty for mistakes | Wrong action has no consequence | Escalating penalty (score + shake + flash) |
| Infinite resources | Stamina/time never runs out | Faster drain, slower recovery |
| S too easy | Casual play gets S | Raise thresholds, heavier miss penalties |

### 3b. Difficulty Ramp

- Track a `difficulty` counter that increases with successful actions
- Use it to shrink timing windows and speed up spawn rates
- Cap at a reasonable maximum (e.g., 12 levels)

### 3c. Penalty Escalation

- Wrong action: `-10` score + damage flash + screen shake + combo reset
- Missed window: `-8` score + HP loss + damage flash
- Early/premature action: `-5` score + shake
- Correct action: `+16 base + 4 per combo (max +20 bonus)`

### 3d. Rating Thresholds Review

Default thresholds (38s game): `S: 430, A: 330, B: 225, C: 135`

Verify by simulation:
- Perfect play (100% correct, max combo) should yield ~500-600 → S reachable but requires skill
- Average play (70% correct, broken combos) should yield ~250-350 → A/B range
- Poor play (50% correct) should yield ~150-250 → B/C range
- Each game may need per-game threshold adjustment based on its mechanics

## Phase 4: Verification

### 4a. Automated Checks

```javascript
// Via preview_eval
const g = window.__game;
const gs = g.scene.getScene('GameScene');
// Verify: scene loads, timer counts, score changes, HP works
```

### 4b. Visual Checklist

- [ ] Warm cream background (#FAF0E6)
- [ ] 3D glossy buttons with press animation
- [ ] Gold corner decorations on cards
- [ ] Timer bar green→yellow→red
- [ ] Feedback toasts float up
- [ ] Rating screen S=gold, A=primary, B=secondary, C=muted
- [ ] Star rating row on result screen
- [ ] Particles on perfect/S-rating

### 4c. Audio Checklist

- [ ] BGM starts on first interaction
- [ ] SFX on button tap
- [ ] Success/fail sounds distinct
- [ ] Timer warning (tick/heartbeat) at ≤10s
- [ ] BGM fades on game end

## Phaser Config Note

Add `fps: { forceSetTimeOut: true }` to Phaser config for background-tab compatibility:

```javascript
const config = {
  type: Phaser.AUTO,
  width: W, height: H,
  fps: { forceSetTimeOut: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, GameScene, ResultScene]
};
```

## File Reference

| File | Purpose |
|------|---------|
| `packs/attribute-archetypes/style-guide.md` | Color tokens, typography, component specs |
| `packs/attribute-archetypes/games/qte-boss-parry/index.html` | **Pilot reference** — fully polished |
| `templates/audio-engine-snippet.js` | MoonAudio source (copy inline) |
| `packs/attribute-archetypes/selection-manifest.json` | Attribute→game mapping + BGM style hint |

---

*Created: 2026-03-24 — from qte-boss-parry pilot polish.*
