---
name: mini-game-design
description: >
  UI/UX design system for mobile romance-narrative mini-games (Chapters/Episode style).
  Kenney 2D flat art style: rounded shapes, solid color blocks, clean outlines, no gradients, no glassmorphism.
  Use this skill whenever building, designing, or reviewing H5 mini-games for the moonshort project,
  including: generating game UI, selecting color palettes, choosing fonts/icons, implementing rating screens,
  score feedback animations, or any visual/interaction design decisions for embedded mini-games.
---

# Mini-Game Design System

Complete design spec for mobile H5 mini-games embedded in the moonshort Cocos Creator project.

## When to Apply
- Creating any new H5 mini-game HTML file under `game/`
- Reviewing or iterating on mini-game UI/UX
- Making visual design decisions (colors, typography, layout, animation)

## Quick Reference

Read `references/design-system.md` for the full specification. Key sections:

- **§0 Tech Stack**: Phaser 3 engine (CDN), single HTML file per game, WebView Bridge communication with Cocos host
- **§1 Asset Resources**: Huemint API for palettes, Kenney 2D assets for textures, Google Fonts (cute/rounded + handwritten), Phosphor Icons (fill style)
- **§2 Visual Design**: Flat color blocks, 2-3px outlines, `border-radius ≥ 8px`, Kenney-style flat shadows (`box-shadow: 3px 3px 0px`), no gradients/blur/glassmorphism
- **§3 Interaction & Feedback**: Score animations, Web Audio API sound effects, rating reveal sequence
- **§4 Rating System**: S/A/B/C grades with attribute modifiers, `notifyGameComplete()` via JS Bridge
- **§5 CSS Variables**: Standard `:root` variable system for theming

## Core Constraints (always enforce)
- **Engine**: Phaser 3 via CDN, each game is a self-contained single HTML file
- **Textures**: prefer `scene.textures.createCanvas()` code-generated over external images
- **Canvas**: fixed 393×736.5px, `Phaser.Scale.FIT` + `CENTER_BOTH`
- **Communication**: host passes `attribute` + `primaryColor` via URL query; game sends rating result via `notifyGameComplete()` through JS Bridge on 「继续」 button tap
- No gradients, no backdrop-filter, no blur shadows, no sharp corners
- All icons: Phosphor fill style in pill containers
- CTA buttons: thumb-zone placement (bottom 60% of screen)
- Max 1 primary CTA per screen
