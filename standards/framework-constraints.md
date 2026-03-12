# MiniGame Framework Constraints

## Purpose
This is the compact compatibility layer. Use it together with `standards/design-guide.md`.

## Platform and Runtime
- H5 only.
- Phaser 3 (`3.60.0`) via CDN.
- Single HTML file with inline CSS/JS.
- Canvas fixed at `393 x 736` with `Phaser.Scale.FIT` + `CENTER_BOTH`.

## Visual Style
- Flat 2D style.
- Rounded corners (`>= 8px`), clear outlines, simple shadows.
- Avoid blur-heavy effects and glassmorphism.
- Keep text high-contrast and readable on mobile.

## Layout
- Top zone: game status (score/time/progress).
- Middle zone: gameplay interaction.
- Bottom zone: primary actions for thumb reach.
- One primary CTA per screen.

## Feedback
- Score changes must have immediate visual feedback.
- Keep audio feedback short and optional.
- End-of-run settlement should reveal result clearly (grade + score + modifier context).

## Settlement UX
- Always show a final confirmation CTA (for example `Continue`).
- Send settlement only after that CTA is pressed.
- Include the required fields from `contracts/settlement.contract.md`.
- Settlement grades are fixed to `S / A / B / C / D`.
- Modifier mapping is fixed to `+2 / +1 / 0 / -1 / -2`.

## Content Generation Safety
- No external runtime dependency except Phaser CDN and optional font CDN.
- Do not hardcode host-specific native assumptions beyond bridge function.
- Keep copy concise and neutral.
