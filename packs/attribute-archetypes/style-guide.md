# Attribute Archetypes — Unified Style Guide

> Derived from the **Battle UI Concept** reference artwork.
> Applies to all 12 games in `packs/attribute-archetypes/games/`.

---

## 1. Core Palette

| Token | Hex | Role |
|---|---|---|
| `--bg-base` | `#FAF0E6` | Full-screen background — warm linen cream |
| `--bg-dark` | `#1A1221` | Dark-mode fallback / overlay backdrop |
| `--primary` | `#FF6B9D` | Main action color (buttons, progress bars, highlights) |
| `--primary-light` | `#FFB5C5` | Notification cards, soft badges, selection glow |
| `--primary-dark` | `#D44E7A` | Pressed state, active border, strong emphasis |
| `--secondary` | `#9B7DB8` | Opponent / contrast element (second health bar, alt buttons) |
| `--secondary-light` | `#C4AFDA` | Secondary badge, inactive tab fill |
| `--secondary-dark` | `#6E4F8A` | Secondary pressed state |
| `--accent-gold` | `#F5C842` | Decorative corners, star ratings, bonus sparkle |
| `--accent-red` | `#E53E3E` | VS flash, danger, critical warnings |
| `--text-dark` | `#1A1A2E` | Primary text on light backgrounds |
| `--text-light` | `#FFFFFF` | Text on dark / colored surfaces |
| `--text-muted` | `#7A7A8E` | Hints, secondary labels, disabled text |
| `--surface-card` | `#FFFFFF` | Floating card / panel background |
| `--surface-overlay` | `rgba(26,18,33,0.55)` | Modal overlay, dimmed backdrop |
| `--success` | `#38C97A` | Correct, perfect timing, positive feedback |
| `--warning` | `#FFB347` | Close call, almost-miss, caution |
| `--danger` | `#FF4D6A` | Fail, damage taken, time critical |
| `--info` | `#4DA6FF` | Neutral tips, tutorial prompts |

### Gradient Presets

```
--grad-primary:  linear-gradient(180deg, #FF6B9D 0%, #D4507D 100%)
--grad-button:   linear-gradient(180deg, #FF8AB5 0%, #FF5A8A 40%, #D44A75 100%)
--grad-gold:     linear-gradient(180deg, #FFD76E 0%, #F5C842 50%, #D4A520 100%)
--grad-bg:       linear-gradient(180deg, #FAF0E6 0%, #F0DCC8 100%)
--grad-dark:     linear-gradient(180deg, #2A1F3D 0%, #1A1221 100%)
```

---

## 2. Attribute-Specific Color Themes

Each attribute has its own complete sub-theme. All 4 themes share the same warm layout foundation
(`bgBase`, `trackBg`, `surfaceCard`) but differ in accent colors, mood, and decoration style.

### 2.1 Theme Overview

| Attribute | Code | Primary | Secondary | Accent | bgBase | Mood |
|---|---|---|---|---|---|---|
| 身手 ATK | `ATK` | `#FF6B9D` hot pink | `#FF9B5E` warm orange | `#FFD76E` gold | `#FAF0E6` linen | Intense, fiery, action |
| 意志 WIL | `WIL` | `#8B5CF6` violet | `#6D28D9` deep purple | `#C084FC` lavender | `#F5F0FA` lavender mist | Stoic, pressure, endurance |
| 智慧 INT | `INT` | `#3B82F6` bright blue | `#0EA5E9` sky blue | `#67E8F9` cyan | `#EFF6FF` ice blue | Cool, analytical, precise |
| 魅力 CHA | `CHA` | `#F472B6` rose pink | `#EC4899` magenta | `#FBCFE8` blush | `#FDF2F8` rose cream | Warm, magnetic, rhythmic |

### 2.2 Full Theme Definitions (JavaScript)

```javascript
const ATTR_THEMES = {
  ATK: {
    bgBase: '#FAF0E6', primary: '#FF6B9D', secondary: '#FF9B5E',
    accentGold: '#FFD76E', accentRed: '#E53E3E',
    trackBg: '#E8D5C4', trackBorder: '#D4C0AB',
    success: '#38C97A', warning: '#FFB347', danger: '#FF4D6A',
    textDark: '#1A1A2E', textMuted: '#7A7A8E',
    bgmStyle: 'action',
    dotAlpha: 0.05, cornerDeco: 'gold',
    cardBorder: 0.4,  // primary border alpha
  },
  WIL: {
    bgBase: '#F5F0FA', primary: '#8B5CF6', secondary: '#6D28D9',
    accentGold: '#C084FC', accentRed: '#DC2626',
    trackBg: '#E4D9F0', trackBorder: '#C9B8DE',
    success: '#38C97A', warning: '#FFB347', danger: '#FF4D6A',
    textDark: '#1A1028', textMuted: '#6E6A80',
    bgmStyle: 'tense',
    dotAlpha: 0.04, cornerDeco: 'lavender',
    cardBorder: 0.35,
  },
  INT: {
    bgBase: '#EFF6FF', primary: '#3B82F6', secondary: '#0EA5E9',
    accentGold: '#67E8F9', accentRed: '#EF4444',
    trackBg: '#DBEAFE', trackBorder: '#BFDBFE',
    success: '#38C97A', warning: '#FFB347', danger: '#FF4D6A',
    textDark: '#0F172A', textMuted: '#64748B',
    bgmStyle: 'mystery',
    dotAlpha: 0.04, cornerDeco: 'cyan',
    cardBorder: 0.3,
  },
  CHA: {
    bgBase: '#FDF2F8', primary: '#F472B6', secondary: '#EC4899',
    accentGold: '#FBCFE8', accentRed: '#E11D48',
    trackBg: '#FCE7F3', trackBorder: '#F9A8D4',
    success: '#38C97A', warning: '#FFB347', danger: '#FF4D6A',
    textDark: '#1A1A2E', textMuted: '#7A6B80',
    bgmStyle: 'romantic',
    dotAlpha: 0.05, cornerDeco: 'blush',
    cardBorder: 0.35,
  },
};
```

### 2.3 Theme Resolution (runtime)

Games detect their attribute from `CTX.attribute` or URL param and select the matching theme:

```javascript
function resolveTheme() {
  const attr = (ATTRIBUTE || '').toLowerCase();
  if (attr.includes('身手') || attr.includes('atk') || attr.includes('attack'))
    return ATTR_THEMES.ATK;
  if (attr.includes('意志') || attr.includes('wil'))
    return ATTR_THEMES.WIL;
  if (attr.includes('智慧') || attr.includes('int') || attr.includes('wisdom'))
    return ATTR_THEMES.INT;
  if (attr.includes('魅力') || attr.includes('cha') || attr.includes('charm'))
    return ATTR_THEMES.CHA;
  // fallback: derive from PRIMARY_COLOR proximity
  return ATTR_THEMES.ATK;
}
```

The theme overrides `PALETTE` at init time, keeping the same structure.

---

## 3. Typography

### Font Stack

| Usage | Family | Weight | Fallback |
|---|---|---|---|
| Display / Title | `'Nunito'` | 900 (Black) | `'Arial Black', sans-serif` |
| Body / Labels | `'Nunito'` | 700 (Bold) | `'Arial', sans-serif` |
| Handwritten accent | `'Patrick Hand'` | 400 | `cursive` |

Google Fonts link (already in templates):
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&family=Patrick+Hand&display=swap" rel="stylesheet">
```

### Type Scale (px, 393px canvas width)

| Token | Size | Use |
|---|---|---|
| `--text-hero` | 48–56 | VS splash, final rating letter |
| `--text-title` | 32–36 | Game title, round header |
| `--text-subtitle` | 22–26 | Attribute name, score display |
| `--text-body` | 16–18 | Action prompts, hint text |
| `--text-caption` | 12–14 | Timer labels, secondary stats |

### Text Effects

- **Title stroke**: 2–3px darker shade outline for readability on busy backgrounds
- **Score pop**: Scale tween 1.0 → 1.3 → 1.0 over 200ms on score change
- **VS flash**: White → accent-red → white color cycle, 600ms total

---

## 4. UI Components

### 4.1 Health / Progress Bar

```
┌─────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────┘
```

- **Track**: `#E8D5C4` (warm beige) with 1px `#D4C0AB` border, rounded 12px
- **Fill**: `--grad-primary` gradient, rounded 12px
- **Height**: 20–24px
- **Label**: Character name above bar, Nunito 700 14px `--text-dark`
- **Percentage**: Nunito 900 14px, right-aligned inside track

### 4.2 Puffy Candy Button (Signature Element)

The buttons are the most recognizable element. They must look like **physical candy objects** with visible thickness.

**Structure (4 layers, bottom to top):**
1. **Slab** (底座): 7px thick slab in `CANDY.btnSlab` (primary darkened 35%). This creates the 3D "thickness"
2. **Body** (主体): Full-height rounded rect in `CANDY.btnBottom` (primary darkened 10%)
3. **Top band** (顶部): Covers top 55% in `CANDY.btnTop` (primary lightened 35%), creating gradient effect
4. **Gloss** (光泽): Semi-transparent white (0.28 alpha) across top 30%, inset 4px — the candy shine

**Specs:**
- **Shape**: `border-radius: 22px`, height 64px (chunky)
- **Candy colors** (derived from primary at runtime):
  ```javascript
  CANDY = {
    btnTop:    blendHex(PRIMARY_COLOR, '#ffffff', 0.35),
    btnBottom: blendHex(PRIMARY_COLOR, '#000000', 0.10),
    btnSlab:   blendHex(PRIMARY_COLOR, '#000000', 0.35),
  }
  ```
- **Text**: Nunito 900, white, uppercase, letter-spacing 2px
- **Press**: Container moves Y +5px, slab becomes invisible
- **Release**: Spring back, slab visible again

### 4.3 Candy Card (Floating Panel)

Cards use **soft multi-layer shadows** instead of stroke borders.

**`drawCandyCard(scene, cx, cy, w, h, bgColor, depth)`**
- **Shadow**: 2 layers: `rgba(0,0,0,0.06)` offset +3/+5, then `rgba(0,0,0,0.04)` offset +1/+3
- **Body**: Solid fill, `border-radius: 24px`
- **NO stroke border** — the shadow alone creates the floating effect
- **Background**: White for info cards, `#FFB5C5` for action prompts

### 4.4 Gold Corner Decorations (Signature Element)

Every card has 4 prominent gold circles at corners — the ornamental signature.

**`drawGoldCorners(scene, cx, cy, w, h, radius, depth)`**
- **Size**: 7px radius (14px diameter) — prominent, not subtle
- **Inset**: `radius + 4` from card edge
- **Color**: `accentGold` fill
- **Highlight**: Inner white dot (40% of radius) at (-1, -1) offset, 0.5 alpha — candy shine
- **Quantity**: Always 4, one per corner

### 4.5 VS Header

- **Layout**: Circle avatars with "VS" text between them
- **Avatars**: 24px radius, thick 4px colored border ring
- **Candy highlight**: Small white dot (4px) at top-left of each avatar for shine
- **"VS" text**: `accentRed`, Nunito 900, 36px, white stroke 3px, rotation -5°
- **Health bars**: Below avatars, each colored by its side's primary/secondary

### 4.6 Health / Progress Bar

- **Track**: `trackBg` (#E8D5C4), rounded 10px, 18-20px height
- **Fill**: Primary color with glossy shine effect:
  - Main fill in primary color
  - Thin white highlight line across top 30% of fill (0.25 alpha)
- **Labels**: Character name ABOVE the bar, Nunito 700 13px

### 4.7 Feedback Toast

- **Font**: Nunito 900, 28px, with white stroke (4px thickness)
- **Animation**: Float up 30px + fade in (Back.easeOut), hold 600ms, float up + fade out
- **Colors**: Success = `success` hex, Perfect = `accentGold`, Miss = `danger`

### 4.8 Timer Bar

- **Position**: Top of game area, full width
- **Track**: 6px height, `trackBg`
- **Fill**: `success` → `warning` (at 33%) → `danger` (at 15%)
- **Shine**: Thin white highlight across top of fill

### 4.9 Rating Screen (S / A / B / C)

| Rating | Color | Effect |
|---|---|---|
| S | `accentGold` | Double glow ring + particle burst + bouncy scale-in |
| A | `primary` | Single glow ring + bouncy scale-in |
| B | `secondary` | Scale-in only |
| C | `textMuted` | Fade-in, subdued |

- **Letter**: Nunito 900, 96px, dark stroke 3px
- **Stars**: 4-star row, staggered bouncy animation (Back.easeOut), filled = `accentGold`, empty = `#D4C0AB`
- **Stat cards**: Candy card style with gold corners

---

## 5. Effects & Motion

### 5.1 Shadows (Candy Style)

Cards use **layered soft shadows** instead of CSS box-shadow:
```
Layer 1: fillStyle(0x000000, 0.06) → offset (+3, +5)
Layer 2: fillStyle(0x000000, 0.04) → offset (+1, +3)
```
This creates a soft, diffused shadow that makes cards feel "floating".

Buttons use a **solid slab** (7px dark bar) instead of a blurred shadow.

### 5.2 Transitions & Easing

| Motion | Duration | Easing |
|---|---|---|
| Button press | instant | Translate Y +5px |
| Card enter | 300ms | `Back.easeOut` (bouncy) |
| Score pop | 120ms | `Quad.easeOut` (scale 1.2x yoyo) |
| Toast enter | 200ms | `Back.easeOut` |
| Star stagger | 200ms each | `Back.easeOut`, 100ms delay per star |
| Rating letter | 400ms | `Back.easeOut` (scale 0→1) |

### 5.3 Particles & Effects

- **Hit spark**: 8-12 circles, `accentGold`, radial burst, 400ms life
- **Damage flash**: Full-screen red (#FF4D6A) overlay, 0→0.3→0, 80ms
- **Screen shake**: Camera shake 150ms, intensity 0.006-0.012
- **Gold corner highlights**: Inner white dots create candy-like reflections

---

## 6. Layout Constants (393 x 736 canvas)

| Token | Value | Notes |
|---|---|---|
| `--canvas-w` | 393 | iPhone 14 logical width |
| `--canvas-h` | 736 | Visible play area |
| `--safe-top` | 48 | Reserve for status/header |
| `--safe-bottom` | 80 | Reserve for action buttons |
| `--gutter` | 16 | Horizontal margin |
| `--card-radius` | 20 | Default card corner radius |
| `--btn-radius` | 16 | Button corner radius |
| `--avatar-size` | 48 | VS header avatar diameter |

---

## 7. Iconography

- Style: **Rounded outline**, 2px stroke, matching text color
- Size: 24px default, 32px for primary actions
- Source: Inline SVG or Phaser Graphics (no external icon font dependency)
- Key icons needed:
  - Shield (block/parry)
  - Lightning (quick action)
  - Eye (seek/find)
  - Brain (puzzle/think)
  - Heart (charm/flirt)
  - Flame (attack/power)
  - Timer (countdown)
  - Star (rating)

---

## 8. Audio Cues (style reference)

Not visual, but contributes to consistent "feel":

| Event | Style | Duration |
|---|---|---|
| Button tap | Soft pop / bubble | 80ms |
| Perfect hit | Bright chime + sparkle | 200ms |
| Miss / fail | Dull thud | 150ms |
| Round start | Rising whoosh | 400ms |
| Timer warning | Heartbeat tick | 500ms loop |
| Rating reveal | Fanfare (S), gentle bell (A/B), muted tone (C) | 600–1000ms |

---

## 9. Implementation Checklist

When applying this style guide to a game template:

- [ ] Background uses `--bg-base` (#FAF0E6) or `--grad-bg`
- [ ] Primary actions use `--primary` / `--grad-primary`
- [ ] Buttons follow the 3D glossy pattern (gradient + bottom shadow)
- [ ] Text uses Nunito 700/900, with Patrick Hand for decorative/handwritten accents
- [ ] Progress/health bars use warm track + primaryColor fill
- [ ] Feedback toasts follow the float-up animation pattern
- [ ] Rating screen uses the S/A/B/C color mapping
- [ ] Timer bar transitions green → yellow → red
- [ ] Card elements have `--card-radius` corners and `--shadow-card`
- [ ] Attribute-specific `primaryColor` flows through all UI elements via `PRIMARY_COLOR`
- [ ] Entry/exit animations use back-out easing for playful feel
- [ ] Gold accents (`--accent-gold`) used sparingly for decoration and rewards

---

## 10. Quick Reference — CSS Custom Properties Block

For games that need a CSS variable block (non-Phaser elements):

```css
:root {
  --bg-base: #FAF0E6;
  --bg-dark: #1A1221;
  --primary: #FF6B9D;
  --primary-light: #FFB5C5;
  --primary-dark: #D4E7A;
  --secondary: #9B7DB8;
  --secondary-light: #C4AFDA;
  --secondary-dark: #6E4F8A;
  --accent-gold: #F5C842;
  --accent-red: #E53E3E;
  --text-dark: #1A1A2E;
  --text-light: #FFFFFF;
  --text-muted: #7A7A8E;
  --surface-card: #FFFFFF;
  --success: #38C97A;
  --warning: #FFB347;
  --danger: #FF4D6A;
  --info: #4DA6FF;
  --shadow-card: 0 4px 16px rgba(26,18,33,0.12);
  --shadow-button: 0 4px 0 #D4E7A;
  --card-radius: 20px;
  --btn-radius: 16px;
}
```

---

*Last updated: 2026-03-23 — derived from Battle UI Concept reference.*
