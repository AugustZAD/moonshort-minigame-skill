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
  // 青铜古钟 — 剧情是"在座位上承受压力波，压力来袭时一动不动"。
  // 3 状态 = 钟被击打的瞬间序列，声波 = 压力波的可视化：
  //   - red (别动！)  → 钟被敲响，钟锤贴壁，声波从钟口向外扩散
  //   - yellow (警告) → 钟锤刚从钟壁弹开，钟微微颤抖，余震
  //   - green (可以了)→ 古钟完全静止，松弛挂在梁上，蒙着薄尘
  ep12_minor: {
    assets: [
      {
        name: 'theme-bell',
        prompt: 'A massive ancient bronze temple bell hanging from a thick dark iron chain, at the exact moment of being struck — the heavy bronze clapper pressed hard against the inner wall, dramatic concentric sound waves rippling outward from the bell mouth as glowing golden-red shockwave rings, intense bass reverberation visible as heat-shimmer distortion around the bell body, weathered verdigris-green patina on ancient bronze surface, dramatic amber rim lighting from below, photorealistic cinematic shot, ominous and heavy atmosphere, perfectly centered composition, solid pure #00FF00 chroma green background filling all edges, 1024x1024',
      },
      {
        name: 'theme-bell-tremor',
        prompt: 'The same massive ancient bronze temple bell hanging from the same iron chain, moment just after the strike — clapper pulled back slightly from the inner wall, the bell barely trembling, faint lingering vibration shown as very subtle soft golden halo, warm amber rim lighting from below, weathered verdigris-green bronze surface, photorealistic cinematic shot, tense anticipation atmosphere, perfectly centered, solid pure #00FF00 chroma green background filling all edges, 1024x1024',
      },
      {
        name: 'theme-bell-still',
        prompt: 'The same massive ancient bronze temple bell hanging motionless and silent from the same iron chain, completely at rest, clapper hanging straight down in the center touching nothing, a thin veil of dust particles drifting around the bell body, very dim cool moonlight from above creating soft shadows, weathered verdigris-green bronze with ancient inscriptions barely visible, photorealistic cinematic shot, calm contemplative stillness atmosphere, perfectly centered, solid pure #00FF00 chroma green background filling all edges, 1024x1024',
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
