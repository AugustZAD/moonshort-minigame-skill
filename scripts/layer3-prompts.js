// scripts/layer3-prompts.js
// Per-episode AI image prompts for Layer 3 deep customization.
// Only the 5 episodes that pass the SKILL.md 4-gate decision threshold
// (强烈视觉冲突 + 单一核心外壳 + 不挡交互 + 有匹配素材).
// ep2/ep11/ep20 already validated as demos. ep16 dropped (color-match core
// logic cannot be themed without rewriting nextRound/answer — fails gates 2+3).
// Each episode is fully custom — NO asset reuse between episodes even when
// template is identical (ep1 vs ep10 same template, different scene).

module.exports = {
  // ── ep1 qte-hold-release · 压住心跳 ─────────────────────────────
  // Circular canvas gauge at (gCx, gCy, gR) gets a themed faceplate
  // behind it. Scene: 酒馆对话中压住怦动的心跳，不能露出情绪。
  ep1: {
    assets: [
      {
        name: 'theme-gauge',
        prompt: 'A vintage Victorian medical heart rate monitor display, dark circular bronze bezel with engraved floral pattern and small rivets, dark obsidian glass face showing a glowing blood-red ECG waveform pulsing across the center with two visible peaks, dramatic low side lighting, photorealistic product shot, centered composition, perfectly round circular shape, solid pure #00FF00 chroma green background surrounding the circular bezel, 1024x1024',
      },
    ],
  },

  // ── ep4 spotlight-seek · 权力棋盘 ────────────────────────────────
  // 3x3 grid field gets a chess board backdrop underneath. Scene:
  // 在 Luna 的权力游戏中找到真正的棋子位置。
  ep4: {
    assets: [
      {
        name: 'theme-board',
        prompt: 'Top-down orthographic view of a dark marble chess board, 8x8 checker pattern visible with alternating deep-obsidian-black and aged-ivory-cream squares, subtle cracks in the marble surface, one obsidian carved chess king piece standing at the center casting a long shadow, dramatic single golden theatrical spotlight beam from directly above illuminating the king, surrounding squares fading into deep shadow, photorealistic, no perspective distortion, perfectly square composition, solid pure #00FF00 chroma green background at the very edges only, 1024x1024',
      },
    ],
  },

  // ── ep10 qte-hold-release · 最后一口气 ──────────────────────────
  // Same template as ep1 but distinct — 窒息前的最后一口气。
  // 不同视觉：冰冷的氧气表 vs ep1 的温暖心电图。
  ep10: {
    assets: [
      {
        name: 'theme-gauge',
        prompt: 'A vintage industrial brass oxygen pressure gauge, circular dial with pale icy-blue enamel face showing tick marks from 0 to 200 PSI, a sharp red needle pointing at the crimson danger zone near zero, worn battered brass bezel with six visible rivets, thick frost condensation covering the lower half of the glass, dramatic cold blue-white lighting from above, photorealistic technical product shot, perfectly round circular shape, centered composition, solid pure #00FF00 chroma green background surrounding the circular bezel, 1024x1024',
      },
    ],
  },

  // ── ep12_minor red-light-green-light · 坐到最后 ─────────────────
  // 审讯者的眼睛 — HUMAN eye, NOT wolf (distinct from ep2 which uses
  // wolf-alpha eyes). Scene: 审讯室里坚持沉默，在审讯者的注视下不崩溃。
  // 3 states matching setTrafficLight('red'/'yellow'/'green'):
  //   - red    → eye wide open, intense cold stare
  //   - yellow → eye half-lidded, momentarily distracted
  //   - green  → eye fully closed, interrogator glanced away
  ep12_minor: {
    assets: [
      {
        name: 'theme-eye',
        prompt: 'Extreme close-up of a single human male interrogator eye wide open with intense piercing cold stare, cold harsh overhead fluorescent lighting casting sharp shadow, clinical blue-white color temperature, bloodshot veins visible in the white of the eye, pale grey-blue iris dilated, sharp eyebrow furrowed above, pale skin with visible stubble, photorealistic ultra-sharp detail, perfectly centered, solid pure #00FF00 chroma green background, 1024x1024',
      },
      {
        name: 'theme-eye-half',
        prompt: 'Extreme close-up of the same single human male interrogator eye half-lidded and looking slightly to the side, momentarily distracted, still cold harsh overhead fluorescent lighting, clinical blue-white color temperature, relaxed brow, pale grey-blue iris visible through the lowered eyelashes, pale skin with visible stubble, photorealistic detail, perfectly centered, solid pure #00FF00 chroma green background, 1024x1024',
      },
      {
        name: 'theme-eye-closed',
        prompt: 'Extreme close-up of the same single human male interrogator eye completely closed, relaxed eyelid with long eyelashes resting softly, the interrogator glanced away or blinked, same cold harsh overhead fluorescent lighting, clinical blue-white color temperature, pale skin with visible stubble and slight crow-feet wrinkles, photorealistic detail, perfectly centered, solid pure #00FF00 chroma green background, 1024x1024',
      },
    ],
  },

  // ── ep13 maze-escape · 踏过边界 ─────────────────────────────────
  // 24x24 per-tile wall replacement, distinct from ep20's peaceful
  // mossy stone. Scene: 背着行囊穿越人狼边界的荆棘丛林，紧张、刺痛、
  // 有被追击的危险感。
  ep13: {
    assets: [
      {
        name: 'theme-wall',
        prompt: 'A single dense thorny thicket wall block that fills the entire square frame edge to edge, ONE thicket only (not multiple plants, not a scattered pattern), top-down orthographic view (straight from above, NO 3D perspective, NO isometric angle), hand-painted digital illustration in the style of a cozy 2D top-down adventure game, anime-inspired soft brushwork, flat shading with gentle gradients, soft outlines, dark pine-green foliage with tangled black thorny branches crossing over it, occasional small dried twigs, MEDIUM-BRIGHTNESS (light enough to clearly read against dark backgrounds, NOT pitch black, NOT fully dark), COOL PALETTE ONLY (deep forest green + near-black thorns + subtle hint of dark grey shadow), NO yellow, NO warm colors, NO flowers, NO berries, NO orange, minimal decoration, the thicket silhouette should be clearly readable as one single block, square edges connect seamlessly when tiled, 512x512, no green screen background',
        noChromaKey: true,
      },
    ],
  },
};
