# Figma-Precise Design System Update & qte-boss-parry Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update design-system docs to match the Figma-accurate mockup (`_gemini-mockup.html`), then rewrite qte-boss-parry's shell UI to be pixel-perfect against those specs.

**Architecture:** The mockup HTML at `packs/attribute-archetypes/games/qte-boss-parry/_gemini-mockup.html` is the single source of truth. Design system docs get updated to reflect its exact CSS values. Then qte-boss-parry's Phaser 3 shell functions get rewritten to reproduce those values using Phaser Graphics API.

**Tech Stack:** Phaser 3.60, Montserrat/Patrick Hand fonts, single-file HTML templates.

---

## Reference: Figma Exact Specifications (from `_gemini-mockup.html`)

These values are authoritative. All design docs and game code must match them.

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| SHELL_PRIMARY | `#EC4F99` | Title bar, buttons, VS text, circle border |
| SHELL_BG | `#1A1221` | Canvas/page background |
| SHELL_WHITE | `#FFFFFF` | Portraits, dialogue bubble, HP bar borders |
| SHELL_GREEN | `#4FECA2` | Player HP bar gradient endpoint |
| SHELL_GREEN_FADE | `rgba(79,236,162,0.1)` | Player HP bar gradient start |
| SHELL_PINK_FADE | `rgba(236,79,153,0.1)` | Opponent HP bar gradient start |

### Button Material (CRITICAL — both START and UNLOCK are identical)
```
Container: border:2px solid #EC4F99, border-radius:24px, shadow:0 4px 0 rgba(0,0,0,0.15)
Layer 1 (base):     absolute inset-0 bg #EC4F99 rounded-[22px]
Layer 2 (glass):    absolute inset-0 bg rgba(255,255,255,0.3) rounded-[22px]
Layer 3 (highlight): absolute left:0 right:0 top:2px h:20px bg rgba(255,255,255,0.3) rounded-t-[20px]
Layer 4 (glow):     absolute inset-0 box-shadow inset 0 0 4px 4px rgba(255,255,255,0.5) rounded-[22px]
Text: Montserrat Black 18px white, centered
```

### Circle
```
Outer: 280x280, border:4px solid #EC4F99, border-radius:1000px
Background: conic-gradient(from 90deg, #EC4F99, #F17BB3, #F6A7CC, #FAD3E6, #FFF)
Inner: 256x256, background: radial-gradient(circle, white, #FFE0F8)
Text: "GAME RULE" Montserrat Black 20px #EC4F99, description Montserrat Bold 16px gray-800
```

### Scallop Title Bar
```
Pink rect: 0,0,393,76 bg #EC4F99
Scallop edge: radial-gradient circles 12px radius, 24px spacing
Title text: Montserrat Black 18px white, y:70 centered
```

### Dialogue Bubble
```
Position: x:141 y:256, w:228 h:64
White bg, border-radius:12px, shadow:0 4px 12px rgba(0,0,0,0.15)
Triangle pointer: top-right area, 8px CSS triangle pointing up
Text: Montserrat Bold 14px #1A1221 (NOT Patrick Hand — Figma uses Montserrat Bold here)
```

### Figma Absolute Positions (frame 393x852)
| Element | x | y | w | h |
|---------|---|---|---|---|
| Title bar pink rect | 0 | 0 | 393 | 76(+12 scallop) |
| Left portrait | 24 | 136 | 72 | 72 |
| Right portrait | 297 | 136 | 72 | 72 |
| VS text | 162 | 152 | 70 | 40 |
| "Jason" name | 96 | 188 | - | 20 |
| "Aiden" name | 253 | 188 | - | 20 |
| Left HP bar | 24 | 216 | 163 | 24 |
| Right HP bar | 206 | 216 | 163 | 24 |
| Dialogue bubble | 141 | 256 | 228 | 64 |
| Main circle | 57 | 304 | 280 | 280 |
| START button | 12 | 632 | 369 | 72 |
| UNLOCK button | 12 | 718 | 369 | 72 |

**Figma frame is 393x852 (includes 54px status bar + 36px home indicator). Phaser canvas is 393x736. Offset: Phaser Y ≈ Figma Y - 54.**

| Element | Figma Y | Phaser Y |
|---------|---------|----------|
| Title bar | 0 | 0 (same — bar overlaps status bar) |
| Portraits | 136 | 82 |
| VS text | 152 | 98 |
| Names | 188 | 134 |
| HP bars | 216 | 162 |
| Dialogue | 256 | 202 |
| Circle | 304 | 250 |
| START btn | 632 | 578 |
| UNLOCK btn | 718 | 664 |

---

## Task 1: Update `color-strategy.md`

**Files:**
- Modify: `packs/attribute-archetypes/design-system/color-strategy.md`

- [ ] **Step 1: Update Shell color tokens table**

Replace the Shell 色彩令牌 table. Key changes:
- Remove `SHELL_PRIMARY_DARK`, `SHELL_PRIMARY_LIGHT` (not used in Figma mockup)
- Remove `SHELL_ACCENT_RED` (not in Figma shell)
- Add button material spec as a new subsection
- UNLOCK S TIER is NOT a ghost button — it's identical to START

Replace the SHELL constant code block:
```javascript
const SHELL = {
  primary:     0xEC4F99, primaryHex: '#EC4F99',
  white:       0xFFFFFF,
  green:       0x4FECA2, greenHex:   '#4FECA2',
  gold:        0xF5C842,
};
```

- [ ] **Step 2: Update Shell vs Game Layer decision table**

Key corrections from Figma:
- Portrait circles: white fill (not pink/purple)
- HP bar player: green gradient `rgba(79,236,162,0.1)` → `#4FECA2`
- HP bar opponent: pink gradient `rgba(236,79,153,0.1)` → `#EC4F99`
- HP bar borders: 2px white solid, radius 100px
- UNLOCK button: SAME as START (full candy pink), NOT ghost
- Dialogue bubble: white bg, radius 12px, shadow `0 4px 12px rgba(0,0,0,0.15)`, Montserrat Bold 14px

- [ ] **Step 3: Update gradient rules**

Replace gradients section with Figma-accurate values:
- Button: NOT a 3-stop gradient. It's flat `#EC4F99` base + `rgba(255,255,255,0.3)` glass overlay + highlight band + inset glow
- HP bars: `linear-gradient(to right, rgba(79,236,162,0.1), #4FECA2)` for green, gradient direction reversed for pink
- Circle: `conic-gradient(from 90deg, #EC4F99, #F17BB3, #F6A7CC, #FAD3E6, #FFF)` outer, `radial-gradient(circle, white, #FFE0F8)` inner

- [ ] **Step 4: Update Figma coordinates table**

Replace the "关键尺寸" table with the complete position table from this plan's reference section above.

- [ ] **Step 5: Commit**
```bash
git add packs/attribute-archetypes/design-system/color-strategy.md
git commit -m "docs: update color-strategy with Figma-precise values"
```

---

## Task 2: Update `components.md`

**Files:**
- Modify: `packs/attribute-archetypes/design-system/components.md`

- [ ] **Step 1: Rewrite 标题栏 spec**

Update to match Figma: height is 76px pink rect + 12px scallop (not 72+16). Scallop uses radial-gradient circles 12px radius, 24px apart (not 6 semicircles). Title text at y:70, Montserrat Black 18px.

- [ ] **Step 2: Rewrite VS 头部 spec**

Key changes:
- Portrait circles: 72x72, white fill, NO colored ring stroke
- Portraits overlap into title bar (Figma y:136, top of circle at y:100 which is inside scallop)
- Names: centered below own portrait, Montserrat Bold 14px white
- HP bars: 163x24, radius 100px, 2px white border, gradient fills, "100%" text inside bar
- VS: Montserrat 800 40px `#EC4F99`, no stroke, no rotation

- [ ] **Step 3: Rewrite 对话气泡 spec**

Key changes:
- Position: x:141 y:256 (Figma), NOT full-width centered
- Size: 228x64 (not 369x52)
- Border radius: 12px (not 14px)
- Shadow: `0 4px 12px rgba(0,0,0,0.15)`
- Triangle: CSS triangle at top-right pointing up
- Font: Montserrat Bold 14px #1A1221 (NOT Patrick Hand)

- [ ] **Step 4: Rewrite button specs**

CRITICAL: Remove the ghost button section entirely. Both START and UNLOCK S TIER use the same candy button material:
```
border:2px solid #EC4F99, radius:24px
shadow: 0 4px 0 rgba(0,0,0,0.15)
Layers: base(#EC4F99) → glass(white@0.3) → highlight(white@0.3 top 20px) → glow(inset white@0.5 4px)
```

The old `makeGhostButton` function is deleted. Replace with `makeButton` for both.

- [ ] **Step 5: Rewrite circle spec**

Key changes:
- Size: 280x280, border: 4px solid #EC4F99
- Background: conic-gradient outer + radial-gradient inner (not plain white or attribute color)
- Inner circle: 256x256 with radial-gradient(white, #FFE0F8)
- Text: Montserrat Black 20px for title, Montserrat Bold 16px for description (not Nunito)

- [ ] **Step 6: Commit**
```bash
git add packs/attribute-archetypes/design-system/components.md
git commit -m "docs: update components with Figma-precise button, circle, dialogue specs"
```

---

## Task 3: Update `typography.md`

**Files:**
- Modify: `packs/attribute-archetypes/design-system/typography.md`

- [ ] **Step 1: Update font usage table**

Key corrections from Figma:
- Dialogue bubble uses Montserrat Bold 14px, NOT Patrick Hand
- Button text: Montserrat Black 18px (not 20px)
- VS text: Montserrat 800 40px (confirmed)
- Circle title: Montserrat Black 20px
- Circle description: Montserrat Bold 16px
- HP bar "100%": Montserrat Bold 12px

- [ ] **Step 2: Update type scale table**

Replace entries that don't match Figma mockup. Remove Patrick Hand from dialogue entry.

- [ ] **Step 3: Commit**
```bash
git add packs/attribute-archetypes/design-system/typography.md
git commit -m "docs: update typography with Figma-precise font specs"
```

---

## Task 4: Update `svg-decorations.md`

**Files:**
- Modify: `packs/attribute-archetypes/design-system/svg-decorations.md`

- [ ] **Step 1: Update scallop specification**

Replace the 6-semicircle approach with the Figma-accurate radial-gradient approach:
- Scallop height: 12px (not 16px)
- Circle radius: 12px
- Spacing: 24px repeat
- Implementation in Phaser: draw a row of circles at y=76 that subtract from the pink rect

- [ ] **Step 2: Commit**
```bash
git add packs/attribute-archetypes/design-system/svg-decorations.md
git commit -m "docs: update scallop edge spec to match Figma"
```

---

## Task 5: Rewrite qte-boss-parry SHELL constant and helpers

**Files:**
- Modify: `packs/attribute-archetypes/games/qte-boss-parry/index.html`

- [ ] **Step 1: Update SHELL constant**

```javascript
const SHELL = {
  primary:     0xEC4F99, primaryHex: '#EC4F99',
  white:       0xFFFFFF,
  green:       0x4FECA2, greenHex:   '#4FECA2',
  gold:        0xF5C842,
};
```

Remove `primaryDark`, `primaryLight`, `accentRed` — not used in Figma design.

- [ ] **Step 2: Rewrite `drawEpisodeTitleBar`**

Match Figma: 76px pink rect + 12px scallop (radial circles). Title text at Phaser y≈16 (centered in 76px bar), Montserrat Black 18px white.

```javascript
function drawEpisodeTitleBar(scene) {
  const g = scene.add.graphics().setDepth(30);
  // 76px pink rect
  g.fillStyle(SHELL.primary, 1);
  g.fillRect(0, 0, W, 76);
  // Scallop: row of 12px-radius pink semicircles at bottom
  const scR = 12, scS = 24;
  for (let x = scR; x < W; x += scS) {
    g.fillCircle(x, 76, scR);
  }
  // Title text at y:16 (Figma y:70 → center of 76px bar → Phaser ~16)
  scene.add.text(W / 2, 16, (EPISODE_LABEL + ': ' + EPISODE_TITLE), {
    fontFamily: 'Montserrat', fontSize: '18px', fontStyle: '900',
    color: '#ffffff'
  }).setOrigin(0.5).setDepth(31);
}
```

- [ ] **Step 3: Rewrite `drawVSHeader`**

Match Figma positions (converted to Phaser Y = Figma Y - 54):

```javascript
function drawVSHeader(scene, playerHpRatio, opponentHpRatio) {
  const pHp = playerHpRatio ?? 1, oHp = opponentHpRatio ?? 1;
  const g = scene.add.graphics().setDepth(28);

  // VS text — Montserrat 800, 40px, #EC4F99 (Phaser y=98)
  scene.add.text(W / 2, 98, 'VS', {
    fontFamily: 'Montserrat', fontSize: '40px', fontStyle: '800',
    color: SHELL.primaryHex
  }).setOrigin(0.5).setDepth(30);

  // Player portrait — 72x72 white circle (Phaser center: 60, 82)
  const pr = 36;
  g.fillStyle(SHELL.white, 1);
  g.fillCircle(60, 82, pr);
  // Fallback letter
  scene.add.text(60, 82, (PLAYER_NAME)[0].toUpperCase(), {
    fontFamily: 'Montserrat', fontSize: '28px', fontStyle: '900',
    color: SHELL.primaryHex
  }).setOrigin(0.5).setDepth(30);
  // Player name (Phaser y=134)
  scene.add.text(60, 134, PLAYER_NAME, {
    fontFamily: 'Montserrat', fontSize: '14px', fontStyle: '700',
    color: '#FFFFFF'
  }).setOrigin(0.5).setDepth(30);

  // Opponent portrait — 72x72 white circle (Phaser center: 333, 82)
  g.fillStyle(SHELL.white, 1);
  g.fillCircle(333, 82, pr);
  scene.add.text(333, 82, (OPPONENT_NAME)[0].toUpperCase(), {
    fontFamily: 'Montserrat', fontSize: '28px', fontStyle: '900',
    color: SHELL.primaryHex
  }).setOrigin(0.5).setDepth(30);
  scene.add.text(333, 134, OPPONENT_NAME, {
    fontFamily: 'Montserrat', fontSize: '14px', fontStyle: '700',
    color: '#FFFFFF'
  }).setOrigin(0.5).setDepth(30);

  // HP bars at Phaser y=162, 163x24, radius 12, 2px white border
  const hpY = 162, hpW = 163, hpH = 24, hpR = 12;
  // Left (green)
  g.lineStyle(2, SHELL.white, 1);
  g.strokeRoundedRect(24, hpY, hpW, hpH, hpR);
  if (pHp > 0) {
    g.fillStyle(SHELL.green, 1);
    g.fillRoundedRect(25, hpY + 1, (hpW - 2) * pHp, hpH - 2, hpR - 1);
  }
  scene.add.text(24 + hpW - 8, hpY + hpH / 2, '100%', {
    fontFamily: 'Montserrat', fontSize: '12px', fontStyle: '700', color: '#fff'
  }).setOrigin(1, 0.5).setDepth(30);
  // Right (pink)
  g.lineStyle(2, SHELL.white, 1);
  g.strokeRoundedRect(206, hpY, hpW, hpH, hpR);
  if (oHp > 0) {
    g.fillStyle(SHELL.primary, 1);
    g.fillRoundedRect(207, hpY + 1, (hpW - 2) * oHp, hpH - 2, hpR - 1);
  }
  scene.add.text(206 + 8, hpY + hpH / 2, '100%', {
    fontFamily: 'Montserrat', fontSize: '12px', fontStyle: '700', color: '#fff'
  }).setOrigin(0, 0.5).setDepth(30);
}
```

- [ ] **Step 4: Rewrite `drawDialogueBubble`**

Match Figma: 228x64, at Phaser (141, 202), white bg, radius 12, shadow, Montserrat Bold 14px.

```javascript
function drawDialogueBubble(scene, text) {
  if (!text) return null;
  const bx = 141, by = 202, bw = 228, bh = 64;
  const g = scene.add.graphics().setDepth(28);
  // Shadow
  g.fillStyle(0x000000, 0.08);
  g.fillRoundedRect(bx, by + 3, bw, bh, 12);
  // White body
  g.fillStyle(SHELL.white, 1);
  g.fillRoundedRect(bx, by, bw, bh, 12);
  // Triangle pointer (top-right, pointing up)
  g.fillTriangle(bx + bw - 48, by, bx + bw - 40, by - 8, bx + bw - 32, by);
  // Text
  return scene.add.text(bx + bw / 2, by + bh / 2, text, {
    fontFamily: 'Montserrat', fontSize: '14px', fontStyle: '700',
    color: '#1A1221', align: 'center', wordWrap: { width: bw - 40 }
  }).setOrigin(0.5).setDepth(29);
}
```

- [ ] **Step 5: Rewrite `makeButton` with Figma candy material**

Replace the old 3-layer gradient approach. New 4-layer approach from Figma:

```javascript
function makeButton(scene, cfg) {
  const { x, y, w, label, fontSize, onTap } = cfg;
  const h = cfg.h || 72;
  const r = 24;
  const container = scene.add.container(x, y).setDepth(20);

  // Shadow slab (3D depth)
  const shadowGfx = scene.add.graphics();
  shadowGfx.fillStyle(0x000000, 0.15);
  drawRRect(shadowGfx, -w/2, -h/2 + 4, w, h, r);
  shadowGfx.fillPath();
  container.add(shadowGfx);

  // Layer 1: Base pink
  const baseGfx = scene.add.graphics();
  baseGfx.fillStyle(SHELL.primary, 1);
  drawRRect(baseGfx, -w/2, -h/2, w, h, r);
  baseGfx.fillPath();
  baseGfx.lineStyle(2, SHELL.primary, 1);
  drawRRect(baseGfx, -w/2, -h/2, w, h, r);
  baseGfx.strokePath();
  container.add(baseGfx);

  // Layer 2: Glass overlay
  const glassGfx = scene.add.graphics();
  glassGfx.fillStyle(0xffffff, 0.3);
  drawRRect(glassGfx, -w/2+1, -h/2+1, w-2, h-2, r-1);
  glassGfx.fillPath();
  container.add(glassGfx);

  // Layer 3: Top highlight band
  const hiGfx = scene.add.graphics();
  hiGfx.fillStyle(0xffffff, 0.3);
  drawRRect(hiGfx, -w/2+2, -h/2+2, w-4, 20, r-2);
  hiGfx.fillPath();
  container.add(hiGfx);

  // Layer 4: Inner glow (inset shadow simulation)
  const glowGfx = scene.add.graphics();
  glowGfx.lineStyle(4, 0xffffff, 0.5);
  drawRRect(glowGfx, -w/2+4, -h/2+4, w-8, h-8, r-4);
  glowGfx.strokePath();
  container.add(glowGfx);

  // Label text
  const labelText = scene.add.text(0, 0, label, {
    fontFamily: 'Montserrat', fontSize: (fontSize || 18) + 'px',
    fontStyle: '900', color: '#ffffff', letterSpacing: 1
  }).setOrigin(0.5);
  container.add(labelText);

  // Hit area
  const hit = scene.add.rectangle(0, 0, w, h+8).setOrigin(0.5)
    .setInteractive({ useHandCursor: true }).setAlpha(0.001);
  container.add(hit);
  hit.on('pointerdown', () => { container.setY(y + 3); shadowGfx.setVisible(false); audio.tap(); });
  hit.on('pointerup', () => { container.setY(y); shadowGfx.setVisible(true); if (onTap) onTap(); });
  hit.on('pointerout', () => { container.setY(y); shadowGfx.setVisible(true); });

  return container;
}
```

- [ ] **Step 6: Delete `makeGhostButton` function**

Remove the entire `makeGhostButton` function. All callers (BootScene UNLOCK, ResultScene REPLAY) now use `makeButton`.

- [ ] **Step 7: Commit**
```bash
git add packs/attribute-archetypes/games/qte-boss-parry/index.html
git commit -m "refactor: rewrite shell helpers to match Figma candy button material"
```

---

## Task 6: Rewrite qte-boss-parry BootScene

**Files:**
- Modify: `packs/attribute-archetypes/games/qte-boss-parry/index.html` — BootScene class

- [ ] **Step 1: Rewrite BootScene.create()**

Replace the entire `create()` method. Use Figma-precise Phaser Y coordinates:

```javascript
create() {
  this.cameras.main.setBackgroundColor('#1A1221');
  drawDotPattern(this, 0.03);

  // Shell chrome
  drawEpisodeTitleBar(this);
  drawVSHeader(this, 1, 1);
  drawDialogueBubble(this, DIALOGUE_TEXT);

  // Main circle at Phaser y=250, r=140 (280/2)
  // Outer ring with conic gradient effect (simplified in Phaser)
  const circleY = 390, circleR = 140;
  // Pink-tinted background circle
  this.add.circle(W/2, circleY, circleR, 0xFAD3E6).setDepth(10);
  // White inner circle (simulates radial gradient)
  this.add.circle(W/2, circleY, circleR - 12, 0xFFFFFF).setDepth(10);
  // Subtle pink tint in center
  this.add.circle(W/2, circleY, circleR - 30, hexToInt('#FFE0F8'), 0.3).setDepth(10);
  // Pink ring stroke
  this.add.circle(W/2, circleY, circleR).setDepth(11)
    .setStrokeStyle(4, SHELL.primary).setFillStyle(0, 0);

  // Circle text
  this.add.text(W/2, circleY - 14, 'GAME RULE', {
    fontFamily: 'Montserrat', fontSize: '20px', fontStyle: '900',
    color: SHELL.primaryHex
  }).setOrigin(0.5).setDepth(12);
  this.add.text(W/2, circleY + 14, 'this is description', {
    fontFamily: 'Montserrat', fontSize: '16px', fontStyle: '700',
    color: '#4A4A5A'
  }).setOrigin(0.5).setDepth(12);

  // START button at Phaser y=578
  makeButton(this, {
    x: W/2, y: 578, w: 369, h: 64, label: 'START', fontSize: 18,
    onTap: () => { audio.unlock(); this.scene.start('GameScene'); }
  });

  // UNLOCK S TIER button at Phaser y=664 — SAME candy style
  makeButton(this, {
    x: W/2, y: 664, w: 369, h: 64, label: 'UNLOCK S TIER  \uD83C\uDF19 ' + UNLOCK_S_COST, fontSize: 18,
    onTap: () => notifyGameComplete({ intent: 'unlockSTier', cost: UNLOCK_S_COST, attribute: ATTRIBUTE })
  });
}
```

- [ ] **Step 2: Verify BootScene renders without errors**

Open `http://localhost:3333/packs/attribute-archetypes/games/qte-boss-parry/index.html` and check for console errors.

- [ ] **Step 3: Commit**
```bash
git add packs/attribute-archetypes/games/qte-boss-parry/index.html
git commit -m "feat: rewrite BootScene with Figma-precise layout"
```

---

## Task 7: Rewrite qte-boss-parry GameScene shell chrome

**Files:**
- Modify: `packs/attribute-archetypes/games/qte-boss-parry/index.html` — GameScene class

- [ ] **Step 1: Update GameScene.create() shell chrome calls**

Replace shell chrome section. Keep all game mechanics (attacks, timing, scoring) untouched. Only change the visual layout to use Figma coordinates.

Key changes:
- Use `drawEpisodeTitleBar`, `drawVSHeader`, `drawDialogueBubble`
- Main circle at Phaser y=390, r=140
- Three action buttons at bottom using `makeButton` with w:108 (keep existing)
- Score/timer text repositioned relative to new circle
- Timer bar at y=CONTENT_TOP area

- [ ] **Step 2: Update all `makeGhostButton` calls to `makeButton`**

If any ghost button calls exist in GameScene, convert to `makeButton`.

- [ ] **Step 3: Verify GameScene plays without errors**

Start the game and verify: attacks spawn, counters work, score updates, timer runs.

- [ ] **Step 4: Commit**
```bash
git add packs/attribute-archetypes/games/qte-boss-parry/index.html
git commit -m "feat: rewrite GameScene shell chrome to match Figma"
```

---

## Task 8: Rewrite qte-boss-parry ResultScene

**Files:**
- Modify: `packs/attribute-archetypes/games/qte-boss-parry/index.html` — ResultScene class

- [ ] **Step 1: Update ResultScene.create()**

Key changes:
- Use `drawEpisodeTitleBar`, `drawVSHeader`
- Grade circle: same 280x280 Figma style with conic gradient
- Grade letter: Montserrat Black 72px (not Nunito)
- CONTINUE button: `makeButton` (candy style)
- REPLAY button: `makeButton` (candy style, NOT ghost)
- Star row position adjusted for larger circle

- [ ] **Step 2: Verify ResultScene renders correctly**

Play through a game and verify the result screen shows grade, score, stars, and both buttons work.

- [ ] **Step 3: Commit**
```bash
git add packs/attribute-archetypes/games/qte-boss-parry/index.html
git commit -m "feat: rewrite ResultScene with Figma-precise candy buttons"
```

---

## Task 9: Final visual comparison and cleanup

- [ ] **Step 1: Side-by-side comparison**

Open both files in browser tabs and compare every element:
- `_gemini-mockup.html` (reference)
- `index.html` (Phaser implementation)

Check: title bar scallop shape, portrait positions, VS text, HP bar sizes, dialogue position, circle gradient, button material.

- [ ] **Step 2: Remove temporary files**

```bash
rm packs/attribute-archetypes/games/qte-boss-parry/_gemini-mockup.html
rm packs/attribute-archetypes/games/qte-boss-parry/_figma-mockup.html
rm _gemini_resp.json _req.json _screenshot.png
```

- [ ] **Step 3: Final commit**
```bash
git add -A
git commit -m "chore: cleanup temp files after design update"
```
