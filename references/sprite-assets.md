# Sprite & Texture Asset Reference

How to specify, load, and swap visual assets in Moonshort H5 mini-games.
Read this file whenever the user describes specific sprites, textures, character art,
background images, or a visual theme that goes beyond the default procedural style.

---

## Table of Contents
1. [Texture Manifest — How to Specify Assets](#1-texture-manifest--how-to-specify-assets)
2. [Loading Strategy Decision Tree](#2-loading-strategy-decision-tree)
3. [Option A — Procedural Drawing](#3-option-a--procedural-drawing)
4. [Option B — Base64 Inline Images](#4-option-b--base64-inline-images)
5. [Option C — SVG Data URIs](#5-option-c--svg-data-uris)
6. [Option D — CDN / Relative Paths](#6-option-d--cdn--relative-paths)
7. [Common Phaser Sprite Patterns](#7-common-phaser-sprite-patterns)
8. [Kenney Pack Selection Guide](#8-kenney-pack-selection-guide)
9. [Font Selection](#9-font-selection)

---

## 1. Texture Manifest — How to Specify Assets

When a user provides asset descriptions (e.g. "use a cat sprite", "pink starry background",
"pixel sword icon"), translate them into a **TEXTURE_MANIFEST** block at the top of the game
script. This makes all asset intentions explicit and easy to swap.

```javascript
// ── TEXTURE MANIFEST ─────────────────────────────────────────────────
// Declare every visual asset used in this game.
// Method: 'procedural' | 'base64' | 'svg' | 'cdn'
// For 'base64' and 'cdn', fill in the data/url field.
// For 'procedural', describe the shape in the note field.
const TEXTURE_MANIFEST = {
  background: {
    method: 'procedural',
    note: 'soft gradient-free light pink field with small floating circles'
  },
  player: {
    method: 'procedural',
    note: 'round blob character, primary color fill, white dot eyes'
  },
  platform: {
    method: 'procedural',
    note: 'rounded rectangle, accent color, 2.5px outline'
  },
  coin: {
    method: 'svg',
    data: null // generated inline — see §5
  },
  portrait_mira: {
    method: 'base64',
    data: null, // paste data URI here when available
    fallback: 'procedural' // use colored circle if no data
  }
};
// ─────────────────────────────────────────────────────────────────────
```

### How to interpret user asset requests

| User says | Manifest entry |
|-----------|---------------|
| "use a cat sprite" | `player: { method: 'base64', note: 'cat character PNG' }` |
| "starry night background" | `background: { method: 'procedural', note: 'dark bg, white dot stars' }` |
| "pixel heart icons" | `heart: { method: 'svg', note: 'pixel-style heart path' }` |
| "use the kenney animal pack" | `player: { method: 'procedural', note: 'reference Animal Pack Deluxe style' }` |
| provides a URL | `hero: { method: 'cdn', url: 'https://...' }` |
| provides a base64 string | `portrait: { method: 'base64', data: 'data:image/png;base64,...' }` |

When the user describes an asset but doesn't provide the actual file:
- Default to `method: 'procedural'` and capture the visual description in `note`.
- If the game calls for a specific sprite (e.g. a character portrait), add a comment
  `// TODO: replace with actual asset when provided`.

---

## 2. Loading Strategy Decision Tree

```
Does the asset need to look like a specific real image (photo, portrait, detailed sprite)?
  Yes → Can the user provide a URL or base64?
          Yes → Use Option D (cdn) or Option B (base64)
          No  → Use Option B placeholder + TODO comment
  No  → Is it a simple shape, icon, or UI element?
          Yes → Is it better as a scalable vector?
                  Yes → Option C (SVG data URI)
                  No  → Option A (procedural Graphics API)
          No  → Use Option A with detailed procedural drawing
```

**Default**: always start with Option A (procedural). Only upgrade to B/C/D
when procedural output clearly cannot achieve the desired visual.

---

## 3. Option A — Procedural Drawing

Use Phaser's `Graphics` API for all Kenney-style flat shapes. Zero external dependencies.
Best for: platforms, obstacles, HUD, buttons, particles, backgrounds, simple characters.

```javascript
// ── Reusable procedural sprite helpers ───────────────────────────────

// Rounded platform / tile
function gfxPlatform(scene, x, y, w = 120, h = 24, fillColor, strokeColor) {
  fillColor   = fillColor   ?? COLORS.primary;
  strokeColor = strokeColor ?? Phaser.Display.Color.HexStringToColor(COLORS.accent).color;
  const g = scene.add.graphics();
  g.fillStyle(fillColor, 1);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
  g.lineStyle(2.5, strokeColor, 1);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
  return g;
}

// Blob character (round body + eyes)
function gfxBlob(scene, x, y, radius = 22, fillColor, strokeColor) {
  fillColor   = fillColor   ?? COLORS.primary;
  strokeColor = strokeColor ?? Phaser.Display.Color.HexStringToColor(COLORS.accent).color;
  const g = scene.add.graphics();
  g.fillStyle(fillColor, 1);
  g.fillCircle(0, 0, radius);
  g.lineStyle(2.5, strokeColor, 1);
  g.strokeCircle(0, 0, radius);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-radius * 0.28, -radius * 0.15, radius * 0.22);
  g.fillCircle( radius * 0.28, -radius * 0.15, radius * 0.22);
  g.fillStyle(0x1f2937, 1);
  g.fillCircle(-radius * 0.22, -radius * 0.15, radius * 0.11);
  g.fillCircle( radius * 0.33, -radius * 0.15, radius * 0.11);
  g.setPosition(x, y);
  return g;
}

// Star shape (for collectibles, score indicators)
function gfxStar(scene, x, y, outerR = 18, innerR = 8, fillColor) {
  fillColor = fillColor ?? COLORS.gold;
  const g   = scene.add.graphics();
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r     = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  g.fillStyle(fillColor, 1);
  g.fillPoints(pts, true);
  g.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.accent).color, 1);
  g.strokePoints(pts, true);
  g.setPosition(x, y);
  return g;
}

// Decorative background pattern (polka dots)
function gfxDotBackground(scene, dotColor = 0xfce7f3, spacing = 32, radius = 3) {
  const g = scene.add.graphics().setDepth(-1);
  g.fillStyle(dotColor, 0.5);
  for (let x = spacing / 2; x < W; x += spacing) {
    for (let y = spacing / 2; y < H; y += spacing) {
      g.fillCircle(x, y, radius);
    }
  }
  return g;
}
```

### Converting a procedural graphic to a reusable Phaser texture

When you need to place multiple copies of the same shape (e.g. 20 coins),
generate the texture once in `preload()` or early `create()`:

```javascript
// Generate texture from Graphics once, reuse as sprites
preload() {
  const g = this.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(COLORS.primary, 1);
  g.fillCircle(16, 16, 14);
  g.lineStyle(2.5, Phaser.Display.Color.HexStringToColor(COLORS.accent).color, 1);
  g.strokeCircle(16, 16, 14);
  g.generateTexture('coin', 32, 32);
  g.destroy();
}

// Use as sprite:
const coin = this.add.image(x, y, 'coin');
// Or as group:
this.coins = this.physics.add.staticGroup();
this.coins.create(x, y, 'coin');
```

---

## 4. Option B — Base64 Inline Images

For character portraits, hand-drawn art, or pixel sprites where procedural cannot match.
Embed the full data URI directly in the HTML file.

**Size budget**: sprites ≤ 64×64 px, backgrounds ≤ 512×512 px, total base64 ≤ 200 KB.

```javascript
// In BootScene.preload() or GameScene.preload():
this.load.image('hero',     'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...');
this.load.image('backdrop', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...');

// Use:
this.add.image(W / 2, H / 2, 'backdrop').setDisplaySize(W, H).setDepth(-1);
const hero = this.add.image(x, y, 'hero').setDisplaySize(56, 56);
```

**Converting a file to base64** (run in browser DevTools or Node):
```javascript
// Browser DevTools console:
const input = document.createElement('input');
input.type = 'file';
input.onchange = e => {
  const reader = new FileReader();
  reader.onload = r => console.log(r.target.result); // copy this string
  reader.readAsDataURL(e.target.files[0]);
};
input.click();
```

**Sprite sheet** (multiple frames):
```javascript
// preload():
this.load.spritesheet('player', 'data:image/png;base64,...', {
  frameWidth: 32, frameHeight: 32
});

// create():
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
  frameRate: 8,
  repeat: -1
});
const player = this.add.sprite(x, y, 'player').play('walk');
```

---

## 5. Option C — SVG Data URIs

For icons, simple illustrations, and UI decorations. Scalable, tiny, and color-customizable.

```javascript
function svgUri(svgContent) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));
}

// Heart icon (fill style)
const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="${COLORS.primaryHex}" stroke="${COLORS.accent}" stroke-width="1.5"
    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
       2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3
       19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>`;

// Star icon
const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="${COLORS.gold}" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77
    l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>`;

// Lightning bolt (energy/speed)
const boltSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="${COLORS.primaryHex}" d="M13 2L4.09 12.97H11L10 22l8.91-10.97H13L13 2z"/>
</svg>`;

// In preload():
this.load.image('heart', svgUri(heartSvg));
this.load.image('star',  svgUri(starSvg));
this.load.image('bolt',  svgUri(boltSvg));
```

---

## 6. Option D — CDN / Relative Paths

Use when the host app bundles assets alongside the HTML, or a CDN URL is provided.

```javascript
// preload():
this.load.image('bg',      './assets/background.png');
this.load.image('hero',    './assets/hero.png');
this.load.atlas('sprites', './assets/sheet.png', './assets/sheet.json');
this.load.image('mira',    'https://cdn.example.com/characters/mira.png');
```

Rules:
- Never use bare relative paths (`./assets/...`) for standalone browser games without a server.
- For cross-origin CDN images, ensure the CDN sends `Access-Control-Allow-Origin: *`.
- Always provide a `fallback` procedural version in case the CDN load fails:

```javascript
this.load.on('loaderror', (file) => {
  console.warn('[Asset] Failed to load:', file.key);
  // mark as failed; draw procedural fallback in create()
  this._failedAssets = this._failedAssets || new Set();
  this._failedAssets.add(file.key);
});

// In create():
if (this._failedAssets?.has('hero')) {
  // draw procedural blob instead
  gfxBlob(this, x, y);
} else {
  this.add.image(x, y, 'hero').setDisplaySize(48, 48);
}
```

---

## 7. Common Phaser Sprite Patterns

### Tinted image (recolor any asset with primary color)
```javascript
const img = this.add.image(x, y, 'hero');
img.setTint(COLORS.primary); // apply primary color tint
// Or use CSS filter approach on DOM elements
```

### Animated sprite sheet (walk cycle, idle, attack)
```javascript
// preload():
this.load.spritesheet('char', dataUri, { frameWidth: 48, frameHeight: 48 });

// create():
this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('char', { frames: [0,1,2,1] }), frameRate: 4, repeat: -1 });
this.anims.create({ key: 'run',  frames: this.anims.generateFrameNumbers('char', { start: 3, end: 7 }), frameRate: 10, repeat: -1 });
this.player = this.physics.add.sprite(x, y, 'char').play('idle');

// Switching animations:
this.player.play('run', true); // true = ignore if already playing
```

### Particle emitter (bursts on score events)
```javascript
// Create texture for particle first
const pg = this.make.graphics({ add: false });
pg.fillStyle(COLORS.primary, 1);
pg.fillCircle(4, 4, 4);
pg.generateTexture('particle', 8, 8);
pg.destroy();

// Emit burst at position:
const emitter = this.add.particles(0, 0, 'particle', {
  speed: { min: 80, max: 200 },
  angle: { min: 0, max: 360 },
  scale: { start: 1, end: 0 },
  lifespan: 600,
  quantity: 12,
  emitting: false
});

function burstAt(x, y) {
  emitter.setPosition(x, y);
  emitter.explode(12);
}
```

### Nine-slice / scalable panel background
```javascript
// For panels that need clean borders at any size, use NineSlice if Phaser version supports it,
// otherwise build from 9 Graphics rectangles or use add.rectangle with rounded corners.
const panel = this.add.rectangle(x, y, w, h, 0xffffff)
  .setStrokeStyle(2.5, Phaser.Display.Color.HexStringToColor(COLORS.accent).color);
```

---

## 8. Kenney Pack Selection Guide

Use Kenney's visual language as the reference for procedural drawing style.
Browse at `kenney.nl/assets` (CC0 license — free, no attribution required).

When the user specifies a theme, select ≤ 3 packs. Use them to:
- Inform the color palette, shape language, and level of detail for procedural drawing.
- As base64-encoded key sprites (encode only the specific images needed).
- As a CDN source if the host app bundles them.

| Game Theme | Pack(s) |
|-----------|---------|
| Space / sci-fi | Space Shooter Redux · Planets Pack |
| Fantasy / RPG | Dungeon Tileset · RPG Urban Pack |
| Cute / romance / cozy | Animal Pack Deluxe · Holiday Kit |
| Sports / competition | Sports Pack · Racing Pack |
| Puzzle / casual | UI Pack (Pixel) · Puzzle Pack |
| Nature / adventure | Nature Kit · Topdown Shooter Pack |
| Cyberpunk / neon | UI Pack Space Extension |
| Horror / mystery | Dungeon Tileset (dark palette variant) |
| Music / rhythm | Music Pack |
| Food / cooking | Food Kit |
| City / urban | City Kit · Isometric City |

**Non-negotiable style rules** (apply even when drawing procedurally):
- Flat fills, no gradients.
- 2–3 px solid outlines (outline color = accent or darkened primary).
- Rounded corners (`border-radius ≥ 8px` equivalent).
- High saturation, clean color separation between elements.
- No drop shadows with blur — only flat offset shadows (`3px 3px 0px accentColor`).

---

## 9. Font Selection

Choose one title font and one accent/body-2 font from Google Fonts.
Both must come from the **Cute / Rounded** or **Handwritten** categories.

### HTML head block
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=TITLE_FONT:wght@700;900&family=ACCENT_FONT:wght@400;700&display=swap" rel="stylesheet">
```

### Script constants (top of `<script>`, before any scene)
```javascript
const FONT_TITLE  = 'Nunito';     // → titles, ratings, CTA buttons   (cute/rounded)
const FONT_ACCENT = 'Caveat';     // → dialogue, flavor text, labels  (handwritten)
const FONT_BODY   = 'system-ui, -apple-system, sans-serif'; // → HUD numbers, hints
```

### Curated pairing suggestions

| Theme | Title font | Accent font |
|-------|-----------|-------------|
| Cute / romantic | Nunito | Caveat |
| Playful / energetic | Fredoka One | Patrick Hand |
| Fantasy / storybook | Cinzel Decorative | Crimson Pro |
| Cozy / warm | Baloo 2 | Klee One |
| Sporty / bold | Righteous | Rajdhani |
| Dreamy / soft | Quicksand | Pacifico |

### Font size hierarchy
| Layer | Size | Weight | Font constant |
|-------|------|--------|--------------|
| Game title | ≥ 28px | 900 | `FONT_TITLE` |
| Rating letter (S/A/B…) | ≥ 64px | 900 | `FONT_TITLE` |
| Section heading | 18–22px | 700 | `FONT_TITLE` |
| HUD values / labels | 13–16px | 700 | `FONT_BODY` |
| Story / dialogue text | 15–17px | 400 | `FONT_ACCENT` |
| Hint copy | ≥ 11px | 400 | `FONT_BODY` |

### Font flash prevention
```javascript
// Wrap Phaser init to wait for font load
document.fonts.ready.then(() => new Phaser.Game(config));
```
