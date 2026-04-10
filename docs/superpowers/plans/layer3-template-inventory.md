# Layer 3 Template Inventory

## DOM-based templates (6) — direct shell replacement via cssOverride + jsOverride
Same pattern as ep2 wolf-eye. Can hide existing element with CSS, inject new themed PNG via JS.

| Template | Shell | Anchor | State Fn | Episodes |
|---|---|---|---|---|
| qte-hold-release | `.gauge-area` (260×260 @ top:310) | `#gauge-area` | Phaser canvas inside, but DOM children `.gauge-center`/`.gauge-pct` updated via DOM | ep1, ep10 |
| red-light-green-light | `.traffic-light` (80×180 @ top:128) | `#traffic-light` | `setTrafficLight(color)` | ep2✓, ep12_minor |
| will-surge | `.tug-bar-area` (50px tall, top:206) | `#tug-bar-area` | `updateTugBar(position)` | ep5, ep9 |
| qte-boss-parry | `.circle-frame` (280×280 @ top:304) | `#circle-content` | `setCircleContent(html)` | ep6, ep19 |
| parking-rush | `.lane-btns` (3 bottom buttons) | `#lane-btns` | class toggles | ep11 |
| color-match | `.color-card` + `.answer-grid` | `#color-card` / `#answer-grid` | inline `style.backgroundColor` | ep16 |

## Canvas-based templates (6) — use absolute DOM overlay (like ep2's approach)
Core visual rendered inside Phaser canvas. Cannot inject into game state cleanly; instead add a DOM overlay layer ABOVE `#phaser-container` using absolute positioning + z-index. Same technique as ep2's `.wolf-eye` which sits on top of the rendered game.

| Template | Overlay Strategy | Episodes |
|---|---|---|
| conveyor-sort | Large decorative PNG above conveyor (e.g. evidence wall) | ep3, ep13_minor |
| spotlight-seek | Themed spotlight frame overlay above game area | ep4, ep17 |
| cannon-aim | Themed instrument/target frame overlay | ep7, ep18 |
| stardew-fishing | Themed water surface / ripple overlay | ep8, ep15 |
| lane-dash | Themed tunnel / corridor side decoration | ep12, ep14 |
| maze-escape | Themed map frame / vignette overlay | ep13, ep20 |

## Strategy consolidation

**All 21 episodes** use the same cssOverride/jsOverride pattern:
1. `cssOverride` — defines `.theme-overlay-{ep}` class with positioning + mask-image for soft edges
2. `jsOverride` — creates DOM element, sets `innerHTML = '<img src="theme-*.png">'`, appends to `#game-shell`, optionally monkey-patches state function for interactive updates
3. For DOM templates: also hide original shell via `display: none !important`
4. For canvas templates: overlay sits on top with `pointer-events: none` and doesn't touch canvas

**Asset generation targets**:
- Shell replacement assets (DOM templates) — 1-3 states per shell
- Decorative overlay assets (canvas templates) — 1 themed image per episode
- Both use `#00FF00` chroma key for transparent PNG output

## CSS var landscape
All templates use `--primary`, `--primary-light`, `--stroke-dark`, `--player-hp`. Layer 3 cssOverride should NOT touch these — they're controlled by Layer 2. Layer 3 only adds new overlay elements with their own z-index and styling.
