# Design System Foundation + 12 Game Template Update

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First establish a locked design system (fonts, colors, components, SVG decorations, interactions), then apply it to all 12 Phaser 3 game templates to match the Figma Part 1 & Part 2 design.

**Architecture:** Phase A creates 5 design-system docs in `packs/attribute-archetypes/design-system/`. Phase B updates all 12 games using those docs as the single source of truth. The new Figma shell (episode title bar + VS header + dialogue bubble) is added to BootScene, GameScene, ResultScene of every game.

**Tech Stack:** Phaser 3.60, Nunito + Patrick Hand (Google Fonts), Web Audio API, inline SVG path strings in Phaser Graphics

---

## Figma Reference Summary

From screenshots captured 2026-04-03:

**Part 1 — Minigame Flow (3 screens):**
- **BootScene**: Pink wavy title bar → VS header (portraits + names + HP bars) → dialogue bubble → large circle "NEXT ACTION ???" → `[START]` + `[UNLOCK S TIER 🌙 50]`
- **GameScene**: Same header → dialogue bubble → large circle "NEXT ACTION DODGE" → "SCORE 2+1" → `[PARRY] [DODGE] [BLOCK]`
- **ResultScene**: Same header → large circle "YOUR GRADE S" → `[CONTINUE]` + `[REPLAY 🌙 20]`

**Part 2 — Unlock S Tier:** UNLOCK S TIER button fires `notifyGameComplete({ intent: 'unlockSTier', cost: UNLOCK_S_COST })`.

Canvas: W=393, H=736.

---

## Phase A — Design System Docs

*Create these 5 files first. They define the rules all template changes must follow.*

---

### Task A1: Typography Doc

**Files:**
- Create: `packs/attribute-archetypes/design-system/typography.md`

- [ ] **Step 1: Create the typography doc**

```markdown
# Typography — Attribute Archetypes Design System

## Available Fonts

Only these two families are loaded. Never add new families without updating the
`<link>` tag in all 12 game templates.

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&family=Patrick+Hand&display=swap" rel="stylesheet">
```

| Family | Weights | Role |
|--------|---------|------|
| `Nunito` | 900 (Black) | Display text: VS flash, grade letter, score numbers, button labels, game title |
| `Nunito` | 700 (Bold) | Labels: character names, timer, stat pills, combo count |
| `Patrick Hand` | 400 (Regular) | Dialogue bubble text, hint text, instruction text, toast messages |

## When to Use Each

**Nunito 900** — anything the player needs to read under pressure or in < 0.5s glance.
Use for: action labels (DODGE, PARRY), score delta (+1 / -1), grade letter (S/A/B/C),
button text, VS text.

**Nunito 700** — secondary structural labels.
Use for: character names, HP percentage, episode label, score prefix ("SCORE"),
stat card numbers on result screen.

**Patrick Hand 400** — conversational, narrative, instructional.
Use for: dialogue bubble content, hint text inside cue circle, flavor text on result screen.
*Never use Patrick Hand for interactive elements (buttons, action labels).*

## Type Scale (canvas width = 393px)

| Token | Size | Line-height | Family | Weight | Use |
|-------|------|-------------|--------|--------|-----|
| hero | 72px | 1.0 | Nunito | 900 | Grade letter (S/A/B/C) |
| display | 48px | 1.1 | Nunito | 900 | VS text |
| title | 28px | 1.2 | Nunito | 900 | Game title, section header |
| subtitle | 20px | 1.3 | Nunito | 700 | Episode title, score label |
| action | 18px | 1.2 | Nunito | 900 | Button labels, action prompts in circle |
| body | 16px | 1.4 | Nunito | 700 | HP%, timer, stat labels |
| dialogue | 15px | 1.5 | Patrick Hand | 400 | Dialogue bubble text |
| caption | 13px | 1.4 | Nunito | 700 | Episode label ("Before EP 4"), small hints |
| hint | 14px | 1.5 | Patrick Hand | 400 | "Counter with the right action!", hints |

## Text Rendering Rules

- **Button labels**: always `toUpperCase()`, letter-spacing: 1–2px
- **Title stroke**: 2–3px stroke in `primaryDark` for text on light bg; white stroke on dark bg
- **Score delta**: render "+N" in `--success` (#38C97A) and "−N" in `--danger` (#FF4D6A)
- **Grade letter**: render with 3px white stroke, color by rating:
  - S → `#F5C842` (gold)
  - A → `--primary` (#FF6B9D)
  - B → `--secondary` (#9B7DB8)
  - C → `--text-muted` (#7A7A8E)
- **Dialogue text**: word-wrap width = bubble width − 48px (24px padding each side)
- **Do not scale down** text below `caption` (13px) — use shorter strings instead
```

- [ ] **Step 2: Commit**

```bash
git add packs/attribute-archetypes/design-system/typography.md
git commit -m "docs: add typography design system for attribute-archetypes"
```

---

### Task A2: Color Strategy Doc

**Files:**
- Create: `packs/attribute-archetypes/design-system/color-strategy.md`

- [ ] **Step 1: Create the color strategy doc**

```markdown
# Color Strategy — Attribute Archetypes Design System

## Two-Layer Color Model

The UI has two distinct color layers with different rules:

### Layer 1 — Shell (always pink, never changes)
The shell wraps every game and matches the MobAI app's brand identity.
Shell elements: episode title bar, VS header background, primary action buttons,
dialogue bubble border, UNLOCK S TIER button.

Shell primary color: `#FF6B9D` (hot pink). Hard-coded. Not overridden by attribute theme.

| Shell Token | Hex | Use |
|-------------|-----|-----|
| `SHELL_PRIMARY` | `#FF6B9D` | Title bar fill, primary button body |
| `SHELL_PRIMARY_DARK` | `#D44E7A` | Title bar bottom edge, button slab, pressed state |
| `SHELL_PRIMARY_LIGHT` | `#FFB5C5` | Title bar highlight, button top band |
| `SHELL_WHITE` | `#FFFFFF` | Dialogue bubble bg, VS header card bg, button text |
| `SHELL_TEXT_DARK` | `#1A1A2E` | Character names, "NEXT ACTION" label, score label |
| `SHELL_GOLD` | `#F5C842` | S-grade letter, gold corner accents |

### Layer 2 — Game Content (attribute-themed)
Everything inside the game content zone (y=268–580) uses the attribute theme colors.
This includes: cue circle ring, health bar fills, timer bar, combo display, particles,
score feedback colors.

Attribute themes: ATK (#FF6B9D), WIL (#8B5CF6), INT (#3B82F6), CHA (#F472B6).
Theme resolution uses `CTX.attribute` or URL param `attribute`.

## Shell vs Game Color Decision Table

| Element | Layer | Color Source |
|---------|-------|--------------|
| Episode title bar | Shell | `SHELL_PRIMARY` |
| VS header card | Shell | `SHELL_WHITE` |
| Character HP bars | Shell (100% always) | `SHELL_PRIMARY` (player) / `#9B7DB8` (opponent) |
| Dialogue bubble | Shell | `SHELL_WHITE` bg + `SHELL_PRIMARY` border |
| Primary button (START, CONTINUE) | Shell | `SHELL_PRIMARY` family |
| Secondary button (UNLOCK, REPLAY) | Shell | `SHELL_WHITE` bg + `SHELL_PRIMARY` border |
| Cue circle ring | Game | `THEME.primary` |
| Timer bar | Game | green→yellow→red (not theme color) |
| Health bar fills | Game | `THEME.primary` / `THEME.secondary` |
| Score delta "+N" | Game | `#38C97A` (always) |
| Score delta "−N" | Game | `#FF4D6A` (always) |
| Particles | Game | `THEME.primary` / `THEME.accentGold` |
| Canvas background | Game | `THEME.bgBase` |
| Dot pattern | Game | `THEME.primary` @0.05 alpha |

## Gradient Usage Rules

Use gradients ONLY for:
1. Button bodies (top-to-bottom: light → base → dark)
2. Health/progress bar fills (top highlight band)
3. Grade letter area background glow (radial, optional)

Use solid fills for:
1. Episode title bar (solid `SHELL_PRIMARY`)
2. Dialogue bubble (solid `SHELL_WHITE`)
3. VS header card (solid `SHELL_WHITE`)
4. Canvas background (solid `THEME.bgBase`)
5. Action labels (text only, no background)

**Rule:** If an element is interactive (button), use gradient. If it is structural/informational, use solid.

## Opacity Usage

- Dot pattern: `THEME.primary` @0.05 alpha — never higher than 0.08
- Dialogue bubble border: `SHELL_PRIMARY` @0.4 alpha (thin, subtle)
- VS header card bg: white @0.95 (slight transparency lets bg show through)
- Modal overlay: `#1A1221` @0.55
- Score +/- feedback text: always 1.0 (never alpha < 1 on feedback)

## Forbidden Color Practices

- ❌ Do not use `PRIMARY_COLOR` from CTX for shell elements
- ❌ Do not fetch colors from Huemint API (removed in style-guide v2)
- ❌ Do not use `bgBase` for any shell element backgrounds
- ❌ Do not mix attribute-theme colors into shell buttons
- ❌ Do not use more than 2 gradient stops on progress bars
```

- [ ] **Step 2: Commit**

```bash
git add packs/attribute-archetypes/design-system/color-strategy.md
git commit -m "docs: add color strategy (shell vs game layer) design system"
```

---

### Task A3: Components Doc (Gradient + Solid)

**Files:**
- Create: `packs/attribute-archetypes/design-system/components.md`

- [ ] **Step 1: Create the components doc**

```markdown
# Components — Attribute Archetypes Design System

All components are drawn via Phaser 3 Graphics or Text objects. No DOM/CSS.

## Shell Components (always pink)

### Episode Title Bar
**Type:** Solid fill + wavy bottom path (SVG-style path in Phaser Graphics)
**Dimensions:** x=0, y=0, w=393, h=88 (solid bar 72px + wavy edge 16px)
**Implementation:**
```javascript
function drawEpisodeTitleBar(scene) {
  const g = scene.add.graphics().setDepth(30);
  // Solid pink bar
  g.fillStyle(0xFF6B9D, 1);
  g.fillRect(0, 0, 393, 72);
  // Wavy bottom edge — 4 bumps, amplitude 12px
  g.beginPath();
  g.moveTo(0, 72);
  const bumps = 6;
  const bumpW = 393 / bumps;
  for (let i = 0; i < bumps; i++) {
    const cx = i * bumpW + bumpW / 2;
    g.arc(cx, 72, bumpW / 2, Math.PI, 0, false); // downward semicircles
  }
  g.lineTo(393, 0);
  g.lineTo(0, 0);
  g.closePath();
  g.fillPath();
  // Episode label (small, top-left)
  scene.add.text(16, 16, (EPISODE_LABEL || 'BEFORE EP 1').toUpperCase(), {
    fontFamily: 'Nunito', fontSize: '13px', fontStyle: '700',
    color: 'rgba(255,255,255,0.75)', letterSpacing: 1
  }).setDepth(31);
  // Episode title (centered, larger)
  scene.add.text(196, 42, EPISODE_TITLE || 'The Challenge', {
    fontFamily: 'Nunito', fontSize: '20px', fontStyle: '900',
    color: '#ffffff', stroke: 'rgba(0,0,0,0.2)', strokeThickness: 2
  }).setOrigin(0.5, 0.5).setDepth(31);
}
```

### VS Header
**Type:** Solid white card + portrait circles + HP bar solids + gradient HP fill
**Dimensions:** x=0, y=88, w=393, h=108
**Implementation:**
```javascript
function drawVSHeader(scene) {
  const g = scene.add.graphics().setDepth(29);
  // White card bg
  g.fillStyle(0xFFFFFF, 0.95);
  g.fillRect(0, 88, 393, 108);
  // Thin bottom border
  g.lineStyle(1, 0xFF6B9D, 0.2);
  g.beginPath(); g.moveTo(0, 196); g.lineTo(393, 196); g.strokePath();

  // VS text
  scene.add.text(196, 142, 'VS', {
    fontFamily: 'Nunito', fontSize: '28px', fontStyle: '900',
    color: '#E53E3E', stroke: '#ffffff', strokeThickness: 3
  }).setOrigin(0.5).setDepth(31).setAngle(-5);

  // Player side (left) — portrait circle
  const playerColor = 0xFF6B9D;
  const g2 = scene.add.graphics().setDepth(30);
  g2.fillStyle(playerColor, 1);
  g2.fillCircle(64, 130, 34);
  g2.lineStyle(3, 0xD44E7A, 1);
  g2.strokeCircle(64, 130, 34);
  // Try to use portrait image if loaded
  if (scene.textures.exists('playerPortrait')) {
    const mask = scene.add.graphics().setDepth(30);
    mask.fillCircle(64, 130, 32);
    const img = scene.add.image(64, 130, 'playerPortrait')
      .setDisplaySize(64, 64).setDepth(30);
    img.setMask(mask.createGeometryMask());
  } else {
    scene.add.text(64, 130, (PLAYER_NAME || 'P')[0].toUpperCase(), {
      fontFamily: 'Nunito', fontSize: '22px', fontStyle: '900', color: '#ffffff'
    }).setOrigin(0.5).setDepth(31);
  }
  scene.add.text(64, 168, PLAYER_NAME || 'You', {
    fontFamily: 'Nunito', fontSize: '13px', fontStyle: '700', color: '#1A1A2E'
  }).setOrigin(0.5).setDepth(31);

  // Opponent side (right)
  const oppColor = 0x9B7DB8;
  g2.fillStyle(oppColor, 1);
  g2.fillCircle(329, 130, 34);
  g2.lineStyle(3, 0x6E4F8A, 1);
  g2.strokeCircle(329, 130, 34);
  if (scene.textures.exists('opponentPortrait')) {
    const mask2 = scene.add.graphics().setDepth(30);
    mask2.fillCircle(329, 130, 32);
    const img2 = scene.add.image(329, 130, 'opponentPortrait')
      .setDisplaySize(64, 64).setDepth(30);
    img2.setMask(mask2.createGeometryMask());
  } else {
    scene.add.text(329, 130, (OPPONENT_NAME || 'B')[0].toUpperCase(), {
      fontFamily: 'Nunito', fontSize: '22px', fontStyle: '900', color: '#ffffff'
    }).setOrigin(0.5).setDepth(31);
  }
  scene.add.text(329, 168, OPPONENT_NAME || 'Boss', {
    fontFamily: 'Nunito', fontSize: '13px', fontStyle: '700', color: '#1A1A2E'
  }).setOrigin(0.5).setDepth(31);

  // HP bars — placeholder solid bars (always 100% on entry)
  // Player HP bar: x=104 to x=178, y=182
  g.fillStyle(0xE8D5C4, 1);
  g.fillRoundedRect(104, 182, 86, 10, 5);
  g.fillStyle(0xFF6B9D, 1);
  g.fillRoundedRect(104, 182, 86, 10, 5);

  // Opp HP bar: x=215 to x=289, y=182
  g.fillStyle(0xE8D5C4, 1);
  g.fillRoundedRect(215, 182, 86, 10, 5);
  g.fillStyle(0x9B7DB8, 1);
  g.fillRoundedRect(215, 182, 86, 10, 5);

  return g; // caller can update HP bars by replacing or redrawing
}
```

### Dialogue Bubble
**Type:** Solid white fill + soft primary border
**Dimensions:** x=12, y=200, w=369, h=64, r=12
**Implementation:**
```javascript
function drawDialogueBubble(scene, text) {
  const g = scene.add.graphics().setDepth(29);
  g.fillStyle(0xFFFFFF, 1);
  g.fillRoundedRect(12, 200, 369, 64, 12);
  g.lineStyle(1.5, 0xFF6B9D, 0.35);
  g.strokeRoundedRect(12, 200, 369, 64, 12);

  const t = scene.add.text(196, 232, text || '', {
    fontFamily: 'Patrick Hand', fontSize: '15px', color: '#1A1A2E',
    align: 'center', wordWrap: { width: 330 }
  }).setOrigin(0.5).setDepth(30);

  return t; // caller can call t.setText(newText) to update
}
```

### Primary Button (START, CONTINUE)
Use existing `makeButton()` — no changes needed. Shell color (#FF6B9D) matches THEME.ATK primary.
For non-ATK attributes, force `PRIMARY_COLOR = '#FF6B9D'` in button calls (shell always pink).

### Secondary Button (UNLOCK S TIER, REPLAY)
**Type:** Solid white fill + primary border + primary text (ghost style)
**Implementation:**
```javascript
function makeGhostButton(scene, { x, y, w, h, label, icon, onTap }) {
  const r = (h || 56) / 2;
  const container = scene.add.container(x, y).setDepth(20);

  const bg = scene.add.graphics();
  bg.fillStyle(0xFFFFFF, 1);
  bg.fillRoundedRect(-w/2, -h/2, w, h, r);
  bg.lineStyle(2, 0xFF6B9D, 1);
  bg.strokeRoundedRect(-w/2, -h/2, w, h, r);
  container.add(bg);

  const lbl = scene.add.text(0, 0, label.toUpperCase(), {
    fontFamily: 'Nunito', fontSize: '18px', fontStyle: '900',
    color: '#FF6B9D', letterSpacing: 1
  }).setOrigin(0.5);
  container.add(lbl);

  const hit = scene.add.rectangle(0, 0, w, h).setOrigin(0.5)
    .setInteractive({ useHandCursor: true }).setAlpha(0.001);
  container.add(hit);

  hit.on('pointerdown', () => { container.setScale(0.96); audio.tap(); });
  hit.on('pointerup',   () => { container.setScale(1.0); if (onTap) onTap(); });
  hit.on('pointerout',  () => { container.setScale(1.0); });

  return container;
}
```

---

## Game Content Components

### Cue Circle (Action Indicator) — Gradient ring
**Type:** Solid fill circle (track color) + gradient-look ring via two strokes
```
Outer stroke: THEME.primary, width 5
Inner highlight: white @0.15 (small circle top-left)
Inner shine dot: white @0.4 (top-left)
```
Center text: "NEXT ACTION" (Nunito 700 14px textMuted) above action word (Nunito 900 36px textDark)

### Health Bar — Gradient fill
Fill uses two-pass draw: base color + lighter 45% top band + white shine line.
See `createHealthBar()` in current templates.

### Timer Bar — Tri-color gradient
Color transitions: `#38C97A` (>33%) → `#FFB347` (10-33%) → `#FF4D6A` (<10%).
Drawn as solid fill, color chosen each frame based on remaining ratio.

### Score Delta Toast — Solid
"+N" solid `#38C97A`, "−N" solid `#FF4D6A`. No background. Float-up 40px, fade out 800ms.

### Particles — Solid radial burst
4–8 circles, radius 4–6px, THEME.primary or accentGold, alpha fade 0→1→0 over 500ms.
```

- [ ] **Step 2: Commit**

```bash
git add packs/attribute-archetypes/design-system/components.md
git commit -m "docs: add components spec (shell + game content) with implementation snippets"
```

---

### Task A4: SVG Decorations Doc

**Files:**
- Create: `packs/attribute-archetypes/design-system/svg-decorations.md`

- [ ] **Step 1: Create the SVG decorations doc**

```markdown
# SVG Decorations — Attribute Archetypes Design System

All decorative SVG shapes are drawn via Phaser 3 Graphics using arc/bezier paths.
No external SVG files. No `<img>` tags for decoration.

## Rules for Generating Decorative Shapes

1. **Use only Phaser Graphics API**: `fillCircle`, `fillRect`, `fillRoundedRect`,
   `arc`, `moveTo/lineTo/bezierCurveTo` + `fillPath/strokePath`.
2. **No external assets for decoration** — portraits are the only image loads.
3. **Depth ordering**: decorative elements must use depth ≤ 10. Shell chrome uses 28–31. Game content uses 12–25.
4. **Performance**: max 3 decorative Graphics objects per scene. Batch into one Graphics object where possible.
5. **Decoration color**: always from the current palette (PALETTE or SHELL constants). Never hardcode decoration colors outside of SHELL_* constants.

## Catalogue of Approved Decorations

### Wavy Title Bar Bottom Edge
Used by: Episode title bar (Task A3 `drawEpisodeTitleBar`)
Shape: Row of downward-facing semicircles across full width.
```javascript
// 6 bumps across W=393 → bumpW=65.5, arc radius=32.75
const bumps = 6, bumpW = W / bumps;
g.beginPath();
g.moveTo(0, 72);
for (let i = 0; i < bumps; i++) {
  const cx = i * bumpW + bumpW / 2;
  g.arc(cx, 72, bumpW / 2, Math.PI, 0, false);
}
g.lineTo(W, 0); g.lineTo(0, 0); g.closePath();
g.fillPath();
```
Adjust `bumps` to change density. Keep bump amplitude = bumpW/2 for smooth look.

### Dot Pattern Background
Used by: GameScene canvas background overlay.
```javascript
function drawDotPattern(scene, alpha) {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(hexToInt(PALETTE.primary), alpha || 0.05);
  const spacing = { x: 28, y: 30 };
  for (let row = 0; row * spacing.y < H + 30; row++) {
    for (let col = 0; col * spacing.x < W + 28; col++) {
      const offset = (row % 2) * (spacing.x / 2);
      g.fillCircle(col * spacing.x + offset, row * spacing.y, 2);
    }
  }
}
```
Alpha range: 0.04–0.06. Never above 0.08 (overwhelms content).

### Gold Corner Dots
Used by: action cards, notification cards.
```javascript
function drawGoldCorners(scene, cx, cy, w, h, r, depth) {
  const g = scene.add.graphics().setDepth(depth || 17);
  g.fillStyle(0xF5C842, 1);
  const hw = w / 2, hh = h / 2;
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx, sy]) => {
    g.fillCircle(cx + sx * (hw - r), cy + sy * (hh - r), r);
  });
}
```
Dot radius: 5–8px. Used only on card surfaces (not on buttons or shell elements).

### Ring Glow (Cue Circle Pulse)
Used by: cue circle when a new action spawns — scale pulse animation.
```javascript
// In scene.create(), after drawing cue circle ring:
scene.tweens.add({
  targets: cueCircleRing,
  scaleX: { from: 0.7, to: 1.0 },
  scaleY: { from: 0.7, to: 1.0 },
  alpha:  { from: 0.0, to: 1.0 },
  duration: 200, ease: 'Back.easeOut'
});
```

### Star Rating Row (ResultScene)
5 stars drawn as filled circles (simplified — no star polygon needed).
```javascript
function drawStarRow(scene, x, y, count, depth) {
  // count: 1–5 filled stars
  const g = scene.add.graphics().setDepth(depth || 20);
  for (let i = 0; i < 5; i++) {
    const filled = i < count;
    g.fillStyle(filled ? 0xF5C842 : 0xDDD5CC, 1);
    g.fillCircle(x + (i - 2) * 28, y, 10);
    if (filled) {
      g.lineStyle(2, 0xD4A520, 1);
      g.strokeCircle(x + (i - 2) * 28, y, 10);
    }
  }
}
// Star count by rating: S=5, A=4, B=3, C=2
const STAR_COUNT = { S: 5, A: 4, B: 3, C: 2 };
```

## Forbidden Decoration Patterns

- ❌ Do not draw polygon stars (performance cost, visual inconsistency)
- ❌ Do not use `scene.add.image()` for decorations (portrait textures only)
- ❌ Do not animate background dot patterns (too expensive)
- ❌ Do not use canvas gradients directly — use two-pass Phaser fills
- ❌ Do not create more than one Graphics object per decoration type per scene
```

- [ ] **Step 2: Commit**

```bash
git add packs/attribute-archetypes/design-system/svg-decorations.md
git commit -m "docs: add SVG decorations catalogue and generation rules"
```

---

### Task A5: Interaction Design Doc

**Files:**
- Create: `packs/attribute-archetypes/design-system/interaction.md`

- [ ] **Step 1: Create the interaction design doc**

```markdown
# Interaction Design — Attribute Archetypes Design System

## Touch Input Rules

- **All interactive elements** must have `setInteractive({ useHandCursor: true })`.
- **Hit areas** must be minimum 44×44px (iOS HIG guideline). Use invisible `scene.add.rectangle().setAlpha(0.001)` over small graphics.
- **Chrome zone (y=0–196) is display-only**. Episode title bar and VS header never receive input. Do not `setInteractive()` on any chrome Graphics object.
- **Dialogue bubble (y=196–268) is display-only**. No tap interaction.
- **Game content and buttons (y=268–736)** handle all input.

## Button States

### Primary Button (makeButton)
| State | Visual Change | Duration |
|-------|--------------|----------|
| Idle | Full height + slab visible | — |
| Pressed | Move down +4px + hide slab | instant |
| Released | Return to idle | instant |

Audio: `audio.tap()` on `pointerdown`.

### Secondary Button (makeGhostButton)
| State | Visual Change | Duration |
|-------|--------------|----------|
| Idle | Scale 1.0 | — |
| Pressed | Scale 0.96 | instant |
| Released | Scale 1.0 | instant |

Audio: `audio.tap()` on `pointerdown`.

## Animation Timing Standards

| Animation | Duration | Easing |
|-----------|----------|--------|
| Scene fade in/out | 300ms | linear |
| Cue circle spawn | 200ms | Back.easeOut |
| Score delta float-up | 800ms | Quad.easeOut |
| Toast float-up + fade | 600ms hold → 300ms fade | Quad.easeOut |
| Damage flash overlay | 180ms | linear |
| Screen shake | 150ms, 3px amplitude | Sine.easeInOut |
| Grade letter reveal | 400ms scale 0.5→1.0 | Back.easeOut |
| Star row reveal | 80ms stagger per star | Quad.easeOut |
| HP bar drain | 400ms | Sine.easeInOut |

## Feedback System

### Correct Action
1. Score delta toast: "+N" green, floats up from cue circle center
2. `audio.success()`
3. Cue circle ring: brief white flash (alpha 1→0 over 120ms)
4. Combo counter increments (if game has combo)

### Wrong Action
1. Score delta toast: "−N" red
2. `audio.fail()`
3. `damageFlash(scene)` — red overlay, alpha 0→0.35→0, 180ms
4. `screenShake(scene, 3)` — 150ms shake
5. Combo resets to 0

### Timer Warning
- At ≤ 10s: `audio.tick()` once per integer second
- At ≤ 5s: `audio.heartbeat()` once per integer second (replaces tick)
- Timer bar color: green → `#FFB347` at 33% → `#FF4D6A` at 10%

## BGM Rules

| Trigger | Action |
|---------|--------|
| First `pointerdown` anywhere | `audio.unlock(); audio.bgm(THEME.bgmStyle)` |
| `finishGame()` called | `audio.stopBgm(600)` — 600ms fade |
| ResultScene → BootScene | No BGM restart (audio already stopped) |
| REPLAY tapped | No BGM restart — host handles replay flow |

BGM styles by attribute: ATK→`action`, WIL→`tense`, INT→`mystery`, CHA→`romantic`.

## Gesture Rules

- **Single tap**: primary interaction for all QTE and button games.
- **Hold/release**: only for games that explicitly require it (qte-hold-release, stardew-fishing).
- **Swipe**: only for lane-dash (swipe direction detection).
- **Long press threshold**: 200ms minimum before `hold` state activates.
- **Double-tap prevention**: add 150ms cooldown after any scoring action.

## Scroll / Pan

- Games do NOT scroll. Canvas is fixed at 393×736. Disable all browser scroll behavior:
  ```javascript
  document.body.style.overflow = 'hidden';
  document.body.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  ```
  This is already in all templates via `overflow: hidden` on body.

## notifyGameComplete Payloads

```javascript
// Normal game completion (CONTINUE button):
notifyGameComplete({
  rating:    'S',          // required: S/A/B/C
  score:     450,          // required: integer
  attribute: ATTRIBUTE,    // required: string
  modifier:  3,            // required: -1/0/1/3
  // optional extras:
  combo:     12,
  hits:      24,
  miss:      3,
  durationMs: 38000
});

// UNLOCK S TIER button:
notifyGameComplete({
  intent:    'unlockSTier',
  cost:      UNLOCK_S_COST,  // default 50
  attribute: ATTRIBUTE
});

// REPLAY button:
notifyGameComplete({
  intent:    'replay',
  cost:      REPLAY_COST,    // default 20
  attribute: ATTRIBUTE
});
```
```

- [ ] **Step 2: Commit**

```bash
git add packs/attribute-archetypes/design-system/interaction.md
git commit -m "docs: add interaction design standards (touch, animation, audio, payloads)"
```

---

## Phase B — Template Updates

*Apply Phase A design system to all 12 game templates. Do Phase A completely before starting Phase B.*

### New Layout Constants (add to every game)

```javascript
// ── Shell Layout Constants ────────────────────────────────────────────────────
const SHELL_TOP       = 196;   // y where shell chrome ends (title bar + VS header)
const DIALOG_TOP      = 200;   // y where dialogue bubble starts
const DIALOG_BOTTOM   = 268;   // y where dialogue bubble ends / game content starts
const CONTENT_TOP     = 268;   // y=0 of game content area
const CONTENT_BOTTOM  = 590;   // y below which buttons live
const BTN_ZONE_TOP    = 600;   // primary button zone start
```

### New CTX Fields (add to every game's CTX block)

```javascript
const EPISODE_LABEL     = CTX.episodeLabel      || params.get('episodeLabel')     || 'EPISODE 1';
const EPISODE_TITLE     = CTX.episodeTitle      || params.get('episodeTitle')     || 'The Challenge';
const PLAYER_NAME       = CTX.playerName        || params.get('playerName')
                          || (CTX.character?.name) || 'You';
const PLAYER_PORTRAIT   = CTX.playerPortrait    || params.get('playerPortrait')   || null;
const OPPONENT_NAME     = CTX.opponentName      || params.get('opponentName')     || 'Boss';
const OPPONENT_PORTRAIT = CTX.opponentPortrait  || params.get('opponentPortrait') || null;
const DIALOGUE_TEXT     = CTX.dialogueText      || params.get('dialogueText')     || '';
const UNLOCK_S_COST     = parseInt(CTX.unlockSTierCost || params.get('unlockSTierCost') || '50', 10);
const REPLAY_COST       = parseInt(CTX.replayCost      || params.get('replayCost')      || '20', 10);
```

### New Helper Functions Block (add to every game after drawDotPattern)

Paste the following functions verbatim from the design-system docs:
- `drawEpisodeTitleBar(scene)` from `components.md`
- `drawVSHeader(scene)` from `components.md`
- `drawDialogueBubble(scene, text)` from `components.md`
- `makeGhostButton(scene, cfg)` from `components.md`
- `drawStarRow(scene, x, y, count, depth)` from `svg-decorations.md`

### BootScene Template (same for all 12 games)

```javascript
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    if (PLAYER_PORTRAIT)   this.load.image('playerPortrait',   PLAYER_PORTRAIT);
    if (OPPONENT_PORTRAIT) this.load.image('opponentPortrait', OPPONENT_PORTRAIT);
  }

  create() {
    this.cameras.main.setBackgroundColor(PALETTE.bgBase);
    drawDotPattern(this, 0.05);

    // Shell chrome
    drawEpisodeTitleBar(this);
    drawVSHeader(this);
    drawDialogueBubble(this, DIALOGUE_TEXT);

    // Center circle "NEXT ACTION ???"
    const circleY = 424;
    const circleR = 100;
    this.add.circle(W/2, circleY, circleR, hexToInt(PALETTE.trackBg)).setDepth(14);
    this.add.circle(W/2, circleY, circleR).setDepth(14)
      .setStrokeStyle(6, hexToInt(PALETTE.primary));
    this.add.text(W/2, circleY - 20, 'NEXT ACTION', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: '700', color: PALETTE.textMuted
    }).setOrigin(0.5).setDepth(15);
    this.add.text(W/2, circleY + 18, '???', {
      fontFamily: 'Nunito', fontSize: '36px', fontStyle: '900', color: PALETTE.textMuted
    }).setOrigin(0.5).setDepth(15);

    // START button
    makeButton(this, {
      x: W/2, y: 630, w: 200, h: 60, label: 'START', fontSize: 24,
      onTap: () => { audio.unlock(); audio.bgm(THEME.bgmStyle); this.scene.start('GameScene'); }
    });

    // UNLOCK S TIER ghost button
    makeGhostButton(this, {
      x: W/2, y: 700, w: 280, h: 52,
      label: `UNLOCK S TIER  ${String.fromCodePoint(0x1F319)} ${UNLOCK_S_COST}`,
      onTap: () => notifyGameComplete({ intent: 'unlockSTier', cost: UNLOCK_S_COST, attribute: ATTRIBUTE })
    });
  }
}
```

### ResultScene Template (same for all 12 games)

```javascript
class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  init(data) {
    this.finalScore      = data.score      || 0;
    this.finalRating     = data.rating     || getRating(this.finalScore);
    this.finalModifier   = data.modifier   ?? getModifier(this.finalRating);
    this.finalCombo      = data.combo      || 0;
    this.finalHits       = data.hits       || 0;
    this.finalMiss       = data.miss       || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(PALETTE.bgBase);
    drawDotPattern(this, 0.04);

    // Shell chrome (HP bars = placeholder 100% — can pass ratios from GameScene if needed)
    drawEpisodeTitleBar(this);
    drawVSHeader(this);
    // No dialogue bubble on result screen

    // Grade circle
    const circleY = 400;
    const circleR = 100;
    this.add.circle(W/2, circleY, circleR, hexToInt(PALETTE.trackBg)).setDepth(14);
    this.add.circle(W/2, circleY, circleR).setDepth(14)
      .setStrokeStyle(6, hexToInt(PALETTE.primary));

    this.add.text(W/2, circleY - 24, 'YOUR GRADE', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: '700', color: PALETTE.textMuted
    }).setOrigin(0.5).setDepth(15);

    const gradeColors = { S: '#F5C842', A: PALETTE.primary, B: PALETTE.secondary, C: PALETTE.textMuted };
    const gradeLetter = this.add.text(W/2, circleY + 22, this.finalRating, {
      fontFamily: 'Nunito', fontSize: '72px', fontStyle: '900',
      color: gradeColors[this.finalRating] || PALETTE.primary,
      stroke: '#ffffff', strokeThickness: 3
    }).setOrigin(0.5).setDepth(15).setScale(0.5);

    this.tweens.add({ targets: gradeLetter, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut',
      onComplete: () => { if (this.finalRating === 'S') { audio.success(); audio.success(); } }
    });

    // Stars
    const starCount = { S: 5, A: 4, B: 3, C: 2 };
    drawStarRow(this, W/2, 510, starCount[this.finalRating] || 2, 16);

    // Score
    this.add.text(W/2, 540, `SCORE  ${this.finalScore}`, {
      fontFamily: 'Nunito', fontSize: '20px', fontStyle: '900', color: PALETTE.textDark
    }).setOrigin(0.5).setDepth(15);

    // CONTINUE button
    makeButton(this, {
      x: W/2, y: 628, w: 200, h: 60, label: 'CONTINUE', fontSize: 22,
      onTap: () => {
        audio.stopBgm(400);
        notifyGameComplete({
          rating: this.finalRating, score: this.finalScore,
          attribute: ATTRIBUTE, modifier: this.finalModifier,
          combo: this.finalCombo, hits: this.finalHits, miss: this.finalMiss
        });
      }
    });

    // REPLAY ghost button
    makeGhostButton(this, {
      x: W/2, y: 700, w: 260, h: 52,
      label: `REPLAY  ${String.fromCodePoint(0x1F319)} ${REPLAY_COST}`,
      onTap: () => notifyGameComplete({ intent: 'replay', cost: REPLAY_COST, attribute: ATTRIBUTE })
    });
  }
}
```

---

### Task B1: Update qte-boss-parry (Pilot — Do First)

**Files:**
- Modify: `packs/attribute-archetypes/games/qte-boss-parry/index.html`

This is the reference implementation. Complete and verify it before touching other games.

- [ ] **Step 1: Add new CTX fields after line 24 (after `DISPLAY_ATTRIBUTE`)**

Add the "New CTX Fields" block from above.

- [ ] **Step 2: Add layout constants after `const H = 736;`**

Add the "New Layout Constants" block from above.

- [ ] **Step 3: Add 5 new helper functions after `drawDotPattern` function (~line 360)**

Paste `drawEpisodeTitleBar`, `drawVSHeader`, `drawDialogueBubble`, `makeGhostButton`, `drawStarRow` verbatim from design-system docs.

- [ ] **Step 4: Replace BootScene.create() entirely**

Use the unified BootScene template above. Add `preload()` before `create()`.

- [ ] **Step 5: Replace GameScene.create() header section (lines 662–733)**

Replace lines from `this.cameras.main.setBackgroundColor` through the title/subtitle block (the existing VS header + HP bars + score pill + timer pill + title + subtitle) with:

```javascript
create() {
  this.cameras.main.setBackgroundColor(PALETTE.bgBase);
  drawDotPattern(this, 0.05);

  // Shell chrome
  drawEpisodeTitleBar(this);
  this.vsHeader = drawVSHeader(this);
  this.dialogueBubble = drawDialogueBubble(this, DIALOGUE_TEXT || 'Defend yourself!');

  // Timer bar — moved below shell, thin strip at y=268
  this.timerBar = createTimerBar(this, CONTENT_TOP, W);
```

Then shift all existing game content Y positions by +100px:
- `cardY`: 320 → 420
- Cue circle: `cardY - 30` → 390
- Attack label: `cardY + 40` → 460
- Timing window bar: `cardY + 74` → 494
- Hint text: `cardY + 106` → 526
- Combo text: 480 → 560
- Buttons: `H - 130 = 606` → 620

- [ ] **Step 6: Replace ResultScene.create() entirely**

Use the unified ResultScene template above.

- [ ] **Step 7: Open game in browser and verify**

Open `packs/attribute-archetypes/games/qte-boss-parry/index.html` directly.
Check:
- [ ] Episode title bar renders at top with wavy edge
- [ ] VS header shows "P" vs "B" circles (no portrait URLs in standalone mode)
- [ ] Dialogue bubble shows fallback text
- [ ] NEXT ACTION ??? circle visible in center
- [ ] START + UNLOCK S TIER buttons both visible and tappable
- [ ] Game starts, action label shows DODGE/PARRY/BLOCK correctly
- [ ] Score delta toasts appear above circle (not behind chrome)
- [ ] ResultScene shows grade circle + stars + CONTINUE + REPLAY

- [ ] **Step 8: Commit**

```bash
git add packs/attribute-archetypes/games/qte-boss-parry/index.html
git commit -m "feat: apply Figma shell design to qte-boss-parry (pilot)"
```

---

### Tasks B2–B12: Remaining 11 Games

Apply in parallel batches. Each task follows the same 6-step pattern as B1 but with game-specific Y shift values.

#### Batch 1 (parallel): qte-hold-release, will-surge, red-light-green-light

**Task B2: qte-hold-release**
Y shifts: cue circle 255→355, card 350→450, meter 380→480, HOLD button stays at H-100.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene (unified template)
- [ ] Shift GameScene content +100px
- [ ] Replace ResultScene (unified template)
- [ ] Verify standalone + commit

**Task B3: will-surge**
Y shifts: card 300→400, threat bar +100, core circle +100, resist button H-120→630.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Shift GameScene content +100px
- [ ] Replace ResultScene
- [ ] Verify + commit

**Task B4: red-light-green-light**
Y shifts: card 295→395, cue circle 255→355.
Special: update tap-zone check from `pointer.y > H * 0.6` to `pointer.y > CONTENT_TOP && pointer.y > H * 0.6`.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Shift GameScene content +100px + fix tap zone
- [ ] Replace ResultScene
- [ ] Verify + commit

#### Batch 2 (parallel): lane-dash, cannon-aim, parking-rush

**Task B5: lane-dash**
Hazard spawn Y: change from ~214 to CONTENT_TOP (268). Player remains at y=466.
Score card: shift from y=82 to y=CONTENT_TOP+10.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Shift hazard spawn Y + score card Y
- [ ] Replace ResultScene
- [ ] Verify + commit

**Task B6: cannon-aim**
Target positions: any target with y < CONTENT_TOP → shift to CONTENT_TOP+20.
Aim hint text: move from y=140 to dialogue bubble via `drawDialogueBubble(this, 'Aim carefully!')`.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Fix target spawn + hint text
- [ ] Replace ResultScene
- [ ] Verify + commit

**Task B7: parking-rush**
Lane/car area: verify lanes don't start above CONTENT_TOP. If they do, shift down.
Park card: shift from y≈360 if it collides with chrome.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Audit and shift any Y values in chrome zone
- [ ] Replace ResultScene
- [ ] Verify + commit

#### Batch 3 (parallel): maze-escape, conveyor-sort, color-match

**Task B8: maze-escape**
`boardY`: change from 208 to CONTENT_TOP (268). `maxBoardH` recalculates automatically.
D-pad buttons at H-120 and H-68 — verify still within 736px.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Change boardY to CONTENT_TOP
- [ ] Replace ResultScene
- [ ] Verify 5×5 and 7×7 maze cell sizes are legible (min 40px)
- [ ] Commit

**Task B9: conveyor-sort**
`playTop`: change from 110 to CONTENT_TOP (268). `playBottom` stays at 540.
Item spawn at `playTop + 16 = 284` — correct.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Change playTop to CONTENT_TOP
- [ ] Replace ResultScene
- [ ] Verify + commit

**Task B10: color-match**
Find all Y positions in dynamic button placement. Add `CONTENT_TOP` offset to each.
Score/timer pills: find and shift from y=66–82 to y=CONTENT_BOTTOM area.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Audit all hardcoded Y values in GameScene.create() and button placement helpers
- [ ] Add CONTENT_TOP offset where needed
- [ ] Replace ResultScene
- [ ] Verify + commit

#### Batch 4 (sequential): spotlight-seek, stardew-fishing

**Task B11: spotlight-seek**
Grid at sy=335 — within game area, no shift needed.
Card at cardCY=385 — shift to cardCY=420 (minor).
Timer pill at y=76 — remove (replaced by title bar chrome).
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Remove timer pill, shift card slightly
- [ ] Replace ResultScene
- [ ] Verify + commit

**Task B12: stardew-fishing**
Custom button code (not makeButton) — locate the hold/tap button graphics and update position.
Card at cardCY≈413 — verify within content zone (268–590). If yes, no shift needed.
Fish track and hook: verify y positions within content zone.
- [ ] Add CTX fields + layout constants + helper functions
- [ ] Replace BootScene
- [ ] Locate custom button code and ensure y > CONTENT_TOP
- [ ] Replace ResultScene
- [ ] Verify fishing mechanics still work
- [ ] Commit

---

## Self-Review

**Spec coverage:**
- [x] Font families documented (typography.md)
- [x] Color strategy documented (color-strategy.md, two-layer model)
- [x] Gradient vs solid components documented (components.md)
- [x] SVG decoration rules documented (svg-decorations.md)
- [x] Interaction design documented (interaction.md)
- [x] Part 1 Minigame Flow: BootScene + GameScene + ResultScene templates ✓
- [x] Part 2 Unlock S Tier: ghost button → notifyGameComplete intent ✓
- [x] All 12 games have tasks (B1–B12) ✓
- [x] notifyGameComplete payloads for all 3 intents (normal/unlockSTier/replay) ✓
- [x] Portrait loading (preload) + fallback to letter circles ✓
- [x] Layout constants (CONTENT_TOP etc.) consistent across all tasks ✓
- [x] Audio wiring unchanged (existing MoonAudio) ✓
- [x] Standalone fallbacks (no CTX) ✓

**Potential gaps:**
- HP bar wiring in GameScene: the VS header draws static 100% HP bars. Games with dynamic HP (qte-boss-parry) need to redraw or overlay updated HP bars during gameplay. This is acceptable for v1 — the VS header HP bars serve as a "starting state" indicator, while per-game HP bars can remain game-specific within the content zone.
- `drawVSHeader` returns a Graphics object — callers that need to update HP bars should maintain their own `createHealthBar` calls within the content zone (CONTENT_TOP onward) as they currently do.
