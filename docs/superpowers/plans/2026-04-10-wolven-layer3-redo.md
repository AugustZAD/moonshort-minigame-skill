# Wolven Layer 3 Redo — 21 Episodes Asset-Based STORY_THEME

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current CSS-filter-based STORY_THEME for 21 wolven episodes with asset-based Layer 3 deep customization — AI-generated PNGs that visually replace each game's core UI shell, following SKILL.md spec (L142-168, L888/#21).

**Architecture:**
1. Per-template: identify ONE core visual UI element to shell-replace (e.g., qte-hold-release rhythm gauge → heart monitor screen)
2. Per-episode: generate 1-3 themed PNG assets via ZenMux Gemini (green screen → chroma key → transparent PNG)
3. Per-episode: write `cssOverride` (hide original UI + mount replacement) + `jsOverride` (monkey-patch state functions)
4. Output as `variant-themed.html` — never overwrite original `index.html`
5. Principle: 换皮不换芯 — never modify game logic, only visual shell

**Tech Stack:**
- Asset gen: ZenMux Vertex AI (`google/gemini-2.5-flash-image`) + `sharp` for chroma key
- Injection: existing `batch-generate-wolven.js` Step 15 pipeline + `--variant` flag
- Verification: `preview_*` tools (preview_start, preview_screenshot, preview_console_logs)

---

## Template → Core Shell Mapping

Before per-episode work, lock in what each template's "shell" is. This is the thing that gets visually replaced (analogous to ep2's traffic-light → wolf-eye).

| Template | Episodes | Core Shell Element | DOM Hook | State Function |
|---|---|---|---|---|
| qte-hold-release | ep1, ep10 | `.gauge-area` (rhythm gauge ring) | `#gauge-area` | `updateGaugeProgress()` / charge state |
| red-light-green-light | ep2✓, ep12_minor | `.traffic-light` (3-light signal) | `#traffic-light` | `setTrafficLight(color)` |
| conveyor-sort | ep3, ep13_minor | `.sort-legend` icons (category bins) | `.sort-legend .item` | static (visual only) |
| spotlight-seek | ep4, ep17 | `.spotlight-circle` (light beam) | `.spotlight` | spotlight move function |
| will-surge | ep5, ep9 | `.surge-bar` (tug/will bar) | `#surge-container` | `updateSurge()` |
| qte-boss-parry | ep6, ep19 | `.boss-portrait` + `.circle-frame` | `#boss-panel` | `showAttack(type)` |
| cannon-aim | ep7, ep18 | `.cannon` sprite + angle bar | `#cannon` | `updateAngle()` |
| stardew-fishing | ep8, ep15 | `.tension-bar` + `.fish-icon` | `#fish-area` | `updateTension()` |
| parking-rush | ep11 | `.car` + `.slot-frame` | `#car` | `updateCar()` |
| lane-dash | ep12, ep14 | `.runner` + lane bg | `#runner` | `updateRunner()` |
| maze-escape | ep13, ep20 | maze walls canvas | maze canvas | static (canvas render) |
| color-match | ep16 | `.swatch` color tiles | `.swatch-grid` | `showSwatches()` |

## File Structure

**New files:**
- `scripts/generate-layer3-assets.js` — asset generation script (ZenMux + sharp chroma key)
- `scripts/layer3-prompts.js` — per-episode AI image prompts
- `data/狼人/ep{N}/game/theme-*.png` — generated assets (3-6 per episode × 21 eps ≈ 60-90 files)
- `docs/superpowers/plans/2026-04-10-wolven-layer3-redo.md` — this plan

**Modified files:**
- `scripts/batch-generate-wolven.js` — replace `makeTheme()` stub entries with real `{cssOverride, jsOverride}` objects that reference generated PNGs
- `data/狼人/index-themed.html` — update description/atmosphere tags to reflect new shell replacements

---

## Phase 0: Prep & Template Inspection

### Task 0.1: Inspect each template's DOM structure

**Files:**
- Read: `packs/attribute-archetypes/games/{template}/index-v3.html` × 12 templates

- [ ] **Step 0.1.1:** Read each of the 12 templates and record:
  - Exact selector of the "shell" element to hide
  - Exact selector/id where replacement DOM is inserted
  - Name + signature of state function to monkey-patch (if dynamic)
  - Any CSS variables used for coloring the shell

- [ ] **Step 0.1.2:** Write `docs/superpowers/plans/layer3-template-inventory.md` with findings

- [ ] **Step 0.1.3:** Commit

```bash
git add docs/superpowers/plans/layer3-template-inventory.md
git commit -m "docs(wolven): layer3 template inventory"
```

---

## Phase 1: Asset Generation Infrastructure

### Task 1.1: Create prompt registry

**Files:**
- Create: `scripts/layer3-prompts.js`

- [ ] **Step 1.1.1: Write prompt registry**

```javascript
// scripts/layer3-prompts.js
// Per-episode AI image prompts for Layer 3 shell replacement.
// Each entry maps ep → { assets: [{ name, prompt, states? }] }
// Prompts must request #00FF00 chroma key background.

module.exports = {
  // ── ep1 qte-hold-release: heart monitor (心电图) ──
  ep1: {
    assets: [
      {
        name: 'theme-gauge',
        prompt: 'A vintage medical heart rate monitor screen, dark CRT display with bright red ECG waveform pulsing across the center, circular frame with metal bezel, photorealistic, dramatic lighting, solid #00FF00 chroma key background, 1024x1024',
        states: ['idle', 'charge', 'release'],
      },
    ],
  },
  // ── ep3 conveyor-sort: dimly lit evidence box ──
  ep3: {
    assets: [
      { name: 'theme-bin-truth', prompt: 'Old leather journal page with elegant handwriting, aged paper, warm candlelight, solid #00FF00 background, 512x512' },
      { name: 'theme-bin-lie',   prompt: 'Crumpled torn paper with smudged ink, dark stain, photorealistic, solid #00FF00 background, 512x512' },
    ],
  },
  // ... (all 21 episodes defined here — see Task 1.2 for full list)
};
```

- [ ] **Step 1.1.2:** Commit skeleton

```bash
git add scripts/layer3-prompts.js
git commit -m "feat(wolven): layer3 prompt registry skeleton"
```

### Task 1.2: Define all 21 episode prompts

**Files:**
- Modify: `scripts/layer3-prompts.js`

- [ ] **Step 1.2.1:** Fill in prompt entries for all 21 episodes based on narrative themes from `STORY_GAME` in batch-generate-wolven.js. Each entry must:
  - Match the template's core shell element (see Template Mapping table)
  - Request `#00FF00` chroma key background
  - Include multi-state variants where applicable (charge/release, open/closed, etc)
  - Match the episode's narrative tone

Full prompt list (21 eps × 1-3 assets each):

```javascript
// ep1 qte-hold-release — 压住心跳: heart monitor
ep1: { assets: [{
  name: 'theme-gauge',
  prompt: 'Vintage hospital heart rate monitor, dark CRT screen showing red ECG waveform, circular metal bezel, dramatic side lighting, photorealistic, solid #00FF00 background, 1024x1024'
}]},
// ep3 conveyor-sort — 碎片拼图: paper evidence bins
ep3: { assets: [
  { name: 'theme-bin-0', prompt: 'Aged parchment letter with elegant ink handwriting, warm amber tones, photorealistic, solid #00FF00 background, 512x512' },
  { name: 'theme-bin-1', prompt: 'Crumpled torn newspaper with smeared ink, cold gray tones, photorealistic, solid #00FF00 background, 512x512' },
]},
// ep4 spotlight-seek — 权力棋盘: chess piece spotlight
ep4: { assets: [{
  name: 'theme-spotlight',
  prompt: 'Golden spotlight beam illuminating a chess king piece on dark marble board, dramatic theatrical lighting, photorealistic, solid #00FF00 background, 1024x1024'
}]},
// ep5 will-surge — 撑住: heartbeat pulse
ep5: { assets: [{
  name: 'theme-surge',
  prompt: 'Glowing purple magical pulse bar with electric arcs, runic symbols along the edge, fantasy style, photorealistic, solid #00FF00 background, 1024x512'
}]},
// ep6 qte-boss-parry — 最后摊牌: Luna boss silhouette
ep6: { assets: [{
  name: 'theme-boss',
  prompt: 'Silhouette of a fierce female wolf-woman with glowing red eyes, dramatic backlight, fur-trimmed coat, photorealistic portrait, solid #00FF00 background, 1024x1024'
}]},
// ep7 cannon-aim — 锻造武器: forge hammer
ep7: { assets: [{
  name: 'theme-cannon',
  prompt: 'Blacksmith forge hammer striking glowing red-hot metal, sparks flying, dark smithy, dramatic orange lighting, photorealistic, solid #00FF00 background, 1024x1024'
}]},
// ep8 stardew-fishing — 拉扯真相: rope in tension
ep8: { assets: [{
  name: 'theme-rope',
  prompt: 'Thick braided rope under tension between two hands, dramatic shadows, dusty atmosphere, photorealistic, solid #00FF00 background, 1024x512'
}]},
// ep9 will-surge — 握紧声音: microphone gripped
ep9: { assets: [{
  name: 'theme-surge',
  prompt: 'Hand tightly gripping a vintage microphone, knuckles white with tension, cold blue lighting, photorealistic, solid #00FF00 background, 1024x1024'
}]},
// ep10 qte-hold-release — 最后一口气: oxygen meter
ep10: { assets: [{
  name: 'theme-gauge',
  prompt: 'Vintage diving oxygen pressure gauge, blue-white dial with red danger zone, worn brass bezel, dramatic lighting, photorealistic, solid #00FF00 background, 1024x1024'
}]},
// ep11 parking-rush — 规则战争: council chamber
ep11: { assets: [{
  name: 'theme-car',
  prompt: 'Wooden council podium with gold emblem, dark oak panels, theatrical warm lighting, top-down view, photorealistic, solid #00FF00 background, 512x512'
}]},
// ep12 lane-dash — 翻窗逃离: dark corridor runner
ep12: { assets: [{
  name: 'theme-runner',
  prompt: 'Silhouette of a woman running through a dark moonlit corridor, motion blur, dramatic lighting, photorealistic, solid #00FF00 background, 512x512'
}]},
// ep12_minor red-light-green-light — 坐到最后: chair pressure
ep12_minor: { assets: [
  { name: 'theme-eye-open', prompt: 'Interrogator with intense staring eyes, harsh white spotlight, cold sweat, photorealistic portrait, solid #00FF00 background, 1024x1024' },
  { name: 'theme-eye-half', prompt: 'Same interrogator looking down at papers, relaxed expression, warm side light, photorealistic portrait, solid #00FF00 background, 1024x1024' },
  { name: 'theme-eye-closed', prompt: 'Empty interrogation chair, dim warm light, calm atmosphere, photorealistic, solid #00FF00 background, 1024x1024' },
]},
// ep13 maze-escape — 踏过边界: forest border
ep13: { assets: [{
  name: 'theme-maze-tile',
  prompt: 'Dark forest path with moonlit tree trunks, moss-covered ground, mysterious atmosphere, photorealistic, top-down perspective, solid #00FF00 background, 512x512'
}]},
// ep13_minor conveyor-sort — 独自前行: memory sorting
ep13_minor: { assets: [
  { name: 'theme-bin-0', prompt: 'Old family photograph in silver frame, warm sepia, photorealistic, solid #00FF00 background, 512x512' },
  { name: 'theme-bin-1', prompt: 'Torn photograph half-burned, edges charred, dark tones, photorealistic, solid #00FF00 background, 512x512' },
]},
// ep14 lane-dash — 黑暗奔逃: moonlit forest
ep14: { assets: [{
  name: 'theme-runner',
  prompt: 'Woman running through moonlit pine forest, motion blur, silver moonlight, photorealistic, solid #00FF00 background, 512x512'
}]},
// ep15 stardew-fishing — 重新呼吸: breathing meditation
ep15: { assets: [{
  name: 'theme-rope',
  prompt: 'Soft glowing meditation orb with swirling green energy, calm atmosphere, photorealistic, solid #00FF00 background, 1024x512'
}]},
// ep16 color-match — 月光辨认: moonlit faces
ep16: { assets: [
  { name: 'theme-face-0', prompt: 'Woman face in pale moonlight, warm expression, photorealistic portrait, solid #00FF00 background, 512x512' },
  { name: 'theme-face-1', prompt: 'Man face in pale moonlight, neutral expression, photorealistic portrait, solid #00FF00 background, 512x512' },
  { name: 'theme-face-2', prompt: 'Elderly face in pale moonlight, wise expression, photorealistic portrait, solid #00FF00 background, 512x512' },
]},
// ep17 spotlight-seek — 道别的勇气: farewell spotlight
ep17: { assets: [{
  name: 'theme-spotlight',
  prompt: 'Warm sunset spotlight on a single figure silhouette, dust particles in light beam, dramatic farewell mood, photorealistic, solid #00FF00 background, 1024x1024'
}]},
// ep18 cannon-aim — 迈出第一步: coffee cup aim
ep18: { assets: [{
  name: 'theme-cannon',
  prompt: 'Steaming coffee cup on wooden cafe table, warm morning light, photorealistic, top-down, solid #00FF00 background, 512x512'
}]},
// ep19 qte-boss-parry — 满月之约: full moon boss
ep19: { assets: [{
  name: 'theme-boss',
  prompt: 'Full moon rising over mountain silhouette, silver-blue glow, wolves howling, photorealistic landscape, solid #00FF00 background, 1024x1024'
}]},
// ep20 maze-escape — 找到方向: sunrise maze
ep20: { assets: [{
  name: 'theme-maze-tile',
  prompt: 'Morning mist over stone pathway with soft sunrise glow, peaceful atmosphere, photorealistic, top-down, solid #00FF00 background, 512x512'
}]},
```

- [ ] **Step 1.2.2:** Commit

```bash
git add scripts/layer3-prompts.js
git commit -m "feat(wolven): complete layer3 prompt registry for 21 episodes"
```

### Task 1.3: Asset generation script

**Files:**
- Create: `scripts/generate-layer3-assets.js`

- [ ] **Step 1.3.1:** Write script

```javascript
// scripts/generate-layer3-assets.js
// Usage: node scripts/generate-layer3-assets.js [epFilter]
// Calls ZenMux Gemini for each prompt, applies sharp chroma key, writes PNG.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const PROMPTS = require('./layer3-prompts');

const ZENMUX_URL = 'https://zenmux.ai/api/vertex-ai/v1beta/models/google/gemini-2.5-flash-image:generateContent';
const OUT_ROOT = path.join(__dirname, '..', 'data', '狼人');

async function genImage(prompt) {
  const res = await fetch(ZENMUX_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ZENMUX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
  if (!res.ok) throw new Error(`ZenMux ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const part = json.candidates[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error('No image in response');
  return Buffer.from(part.inlineData.data, 'base64');
}

async function chromaKey(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i+1], b = data[i+2];
    // Remove green: g is dominant AND >150 AND r,b low
    if (g > 150 && g > r * 1.3 && g > b * 1.3) data[i+3] = 0;
    else if (g > 120 && g > r + 30 && g > b + 30) data[i+3] = Math.max(0, 255 - (g - Math.max(r,b)) * 2);
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function run(filter) {
  const eps = Object.keys(PROMPTS).filter(e => !filter || e === filter);
  for (const ep of eps) {
    const epDir = path.join(OUT_ROOT, ep, 'game');
    if (!fs.existsSync(epDir)) { console.log(`SKIP ${ep}: no dir`); continue; }
    for (const asset of PROMPTS[ep].assets) {
      const outPath = path.join(epDir, `${asset.name}.png`);
      if (fs.existsSync(outPath)) { console.log(`SKIP ${ep}/${asset.name}: exists`); continue; }
      console.log(`GEN ${ep}/${asset.name}`);
      try {
        const raw = await genImage(asset.prompt);
        const keyed = await chromaKey(raw);
        fs.writeFileSync(outPath, keyed);
        console.log(`  ✓ ${outPath}`);
      } catch (e) {
        console.error(`  ✗ ${ep}/${asset.name}: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 500)); // throttle
    }
  }
}

run(process.argv[2]).catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 1.3.2:** Test with single ep

```bash
ZENMUX_API_KEY=$ZENMUX_API_KEY node scripts/generate-layer3-assets.js ep1
```

Expected: `data/狼人/ep1/game/theme-gauge.png` created, ~400KB, transparent background

- [ ] **Step 1.3.3:** Verify transparent PNG

```bash
node -e "require('sharp')('data/狼人/ep1/game/theme-gauge.png').metadata().then(m => console.log(m))"
```

Expected: `hasAlpha: true, channels: 4`

- [ ] **Step 1.3.4:** Commit

```bash
git add scripts/generate-layer3-assets.js
git commit -m "feat(wolven): layer3 asset generation script with chroma key"
```

---

## Phase 2: Parallel Asset Generation (subagent-friendly)

### Task 2.x: Generate assets for each episode in parallel

For each of the 21 episodes, dispatch a subagent to:
1. Run `node scripts/generate-layer3-assets.js ep{N}`
2. Verify PNG files created and have alpha channel
3. Report file paths + sizes

**Parallelizable:** All 21 episodes independent. Run in batches of 5 to avoid rate limiting.

- [ ] **Step 2.1:** Batch A — ep1, ep3, ep4, ep5, ep6 (parallel subagents)
- [ ] **Step 2.2:** Batch B — ep7, ep8, ep9, ep10, ep11 (parallel subagents)
- [ ] **Step 2.3:** Batch C — ep12, ep12_minor, ep13, ep13_minor, ep14 (parallel subagents)
- [ ] **Step 2.4:** Batch D — ep15, ep16, ep17, ep18, ep19 (parallel subagents)
- [ ] **Step 2.5:** Batch E — ep20 (last one)
- [ ] **Step 2.6:** Visually spot-check 5 random assets (open in viewer, confirm transparent bg + subject visible)
- [ ] **Step 2.7:** Commit all generated assets

```bash
git add data/狼人/ep*/game/theme-*.png
git commit -m "feat(wolven): generate layer3 assets for 21 episodes"
```

---

## Phase 3: STORY_THEME Override Code (per template family)

Group by template — same template = same cssOverride/jsOverride structure, only asset paths differ.

### Task 3.1: qte-hold-release family (ep1, ep10)

**Files:**
- Modify: `scripts/batch-generate-wolven.js` (STORY_THEME.ep1, STORY_THEME.ep10)

- [ ] **Step 3.1.1:** Read `packs/attribute-archetypes/games/qte-hold-release/index-v3.html` to find exact gauge DOM + state function

- [ ] **Step 3.1.2:** Write helper for qte-hold-release

```javascript
function qteHoldReleaseTheme(assetName, narrativeName) {
  return {
    cssOverride: `
  /* Layer 3: ${narrativeName} — shell replace gauge */
  .gauge-area .gauge-ring { display: none !important; }
  .theme-gauge-shell { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 260px; height: 260px; z-index: 5; pointer-events: none; }
  .theme-gauge-shell img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 20px rgba(255,80,80,0.4)); -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 85%); mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 85%); transition: filter 0.2s ease; }
  .theme-gauge-shell.charging img { filter: drop-shadow(0 0 35px rgba(255,50,50,0.8)) brightness(1.2); animation: themeGaugePulse 0.6s ease-in-out infinite; }
  @keyframes themeGaugePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  body, #game-shell { background: linear-gradient(180deg, #0a0408 0%, #1a0a10 50%, #0d0408 100%) !important; }`,
    jsOverride: `
(function(){
  var shell = document.getElementById('game-shell');
  var wrap = document.createElement('div');
  wrap.className = 'theme-gauge-shell';
  wrap.innerHTML = '<img src="${assetName}.png" alt="">';
  var gauge = document.querySelector('.gauge-area');
  if (gauge) gauge.appendChild(wrap);
  var origUpdate = window.updateGaugeProgress;
  if (origUpdate) {
    window.updateGaugeProgress = function(p) {
      origUpdate(p);
      if (p > 0.1) wrap.classList.add('charging');
      else wrap.classList.remove('charging');
    };
  }
})();`,
  };
}
```

- [ ] **Step 3.1.3:** Replace `ep1: makeTheme(...)` and `ep10: makeTheme(...)` with `qteHoldReleaseTheme('theme-gauge', '暗红脉搏')` / `('theme-gauge', '窒息冰蓝')`

- [ ] **Step 3.1.4:** Regenerate ep1 + ep10 variant

```bash
node scripts/batch-generate-wolven.js --variant --eps=ep1,ep10
```

- [ ] **Step 3.1.5:** Verify in browser preview — start server, navigate to ep1 variant, check console for errors, screenshot gauge area

- [ ] **Step 3.1.6:** Commit

```bash
git add scripts/batch-generate-wolven.js data/狼人/ep1/game/variant-themed.html data/狼人/ep10/game/variant-themed.html
git commit -m "feat(wolven): layer3 shell replace for qte-hold-release family"
```

### Task 3.2: red-light-green-light — ep12_minor

**Files:**
- Modify: `scripts/batch-generate-wolven.js` (STORY_THEME.ep12_minor)

- [ ] **Step 3.2.1:** Copy ep2's existing wolf-eye pattern, adapt asset names to `theme-eye-open/half/closed.png` (already in prompts)
- [ ] **Step 3.2.2:** Regenerate variant
- [ ] **Step 3.2.3:** Verify + commit

### Task 3.3: conveyor-sort family (ep3, ep13_minor)

**Files:**
- Read: `packs/attribute-archetypes/games/conveyor-sort/index-v3.html`
- Modify: `scripts/batch-generate-wolven.js`

- [ ] **Step 3.3.1:** Find `.sort-legend .item` icon structure
- [ ] **Step 3.3.2:** Write `conveyorSortTheme(bin0, bin1)` helper — cssOverride hides default icons, jsOverride sets `style.backgroundImage` on `.sort-legend .item:nth-child(N)`
- [ ] **Step 3.3.3:** Apply to ep3 + ep13_minor, regenerate variants, verify, commit

### Task 3.4: spotlight-seek family (ep4, ep17)

Same pattern: `spotlightSeekTheme(asset, name)` replacing `.spotlight-circle` with themed PNG overlay.

### Task 3.5: will-surge family (ep5, ep9)

`willSurgeTheme(asset, name)` replacing `.surge-bar` with themed progress visual.

### Task 3.6: qte-boss-parry family (ep6, ep19)

`qteBossParryTheme(asset, name)` replacing `.boss-portrait` with themed PNG.

### Task 3.7: cannon-aim family (ep7, ep18)

`cannonAimTheme(asset, name)` replacing `.cannon` sprite.

### Task 3.8: stardew-fishing family (ep8, ep15)

`stardewFishingTheme(asset, name)` replacing `.tension-bar` or `.fish-icon`.

### Task 3.9: parking-rush — ep11

`parkingRushTheme(asset)` replacing `.car` sprite.

### Task 3.10: lane-dash family (ep12, ep14)

`laneDashTheme(asset, name)` replacing `.runner` sprite.

### Task 3.11: maze-escape family (ep13, ep20)

`mazeEscapeTheme(asset, name)` — this one uses canvas, so jsOverride monkey-patches the wall draw function to use `ctx.drawImage(themeTile)` instead of fillRect.

### Task 3.12: color-match — ep16

`colorMatchTheme(face0, face1, face2)` — replaces `.swatch` color tiles with themed face PNGs.

**Each of Tasks 3.1-3.12 follows the same 6-step pattern:**
1. Read template DOM
2. Write family helper function
3. Replace STORY_THEME entries
4. Regenerate variants
5. Verify in preview
6. Commit

---

## Phase 4: Final Verification

### Task 4.1: All 22 variants smoke test

- [ ] **Step 4.1.1:** Run `node scripts/batch-generate-wolven.js --variant` to regen all 22 variants

- [ ] **Step 4.1.2:** Start preview server, iterate through all 22 episodes' variant-themed.html, check console for errors

- [ ] **Step 4.1.3:** Screenshot each episode's variant — save to `docs/superpowers/plans/layer3-screenshots/ep{N}.png`

- [ ] **Step 4.1.4:** Compare against baseline (current CSS-only variant) — confirm visible Layer 3 shell replacement

- [ ] **Step 4.1.5:** Fix any broken episodes (missing assets, JS errors, CSS conflicts)

### Task 4.2: Update docs

- [ ] **Step 4.2.1:** Update `data/狼人/index-themed.html` hub page — change atmosphere tags from CSS-filter names (pulse/moon/warm) to narrative shell names (心电图/月相/咖啡...)

- [ ] **Step 4.2.2:** Commit all fixes + docs

```bash
git add -A
git commit -m "feat(wolven): layer3 full verification + hub page update"
```

### Task 4.3: Push to GitHub

- [ ] **Step 4.3.1:**

```bash
git push
```

---

## Success Criteria

- [ ] All 21 episodes (ep1, ep3-ep20, ep12_minor, ep13_minor) have asset-based Layer 3
- [ ] Each episode has at least 1 AI-generated themed PNG with transparent background
- [ ] Each episode's variant-themed.html visually differs from original in a HUD element (not just background color)
- [ ] No console errors when loading any variant
- [ ] No modifications to game logic (verified by grep — game state functions should only be hooked, not rewritten)
- [ ] Hub page reflects new shell replacements
- [ ] All changes pushed to GitHub

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| ZenMux API rate limit / quota exhausted | Batch in groups of 5, add throttle, have manual fallback to gemini-3-pro-image-preview |
| Generated images don't match prompt intent | Spot check after each batch, regenerate bad ones with refined prompts |
| Chroma key bleeds / leaves green edges | Use existing tuned chromaKey() logic from Dramatizer pipeline |
| Some templates have no clean "shell" element | Fall back to background PNG overlay via `#game-shell::before` |
| DOM selectors differ between V3 template versions | Phase 0 template inventory catches this before Phase 3 |
| Regenerating batch-generate-wolven.js breaks existing variants | Keep git history clean per task, easy rollback |
