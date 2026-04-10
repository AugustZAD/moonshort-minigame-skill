// scripts/layer3-prompts.js
// Per-episode AI image prompts for Layer 3 deep customization.
// Each entry: ep → { assets: [{ name, prompt, size? }] }
// Prompts request #00FF00 chroma key background for clean removal.
// ep2 is excluded (already has hand-tuned wolf-eye assets).

module.exports = {
  // ── ep1 qte-hold-release · 压住心跳 — heart monitor ─────────
  ep1: {
    assets: [
      {
        name: 'theme-gauge',
        prompt: 'A vintage medical heart rate monitor display, circular metal bezel, dark CRT screen showing a bright red ECG waveform pulsing across the center, photorealistic, dramatic side lighting, centered composition, solid pure #00FF00 chroma green background, product shot, 1024x1024',
      },
    ],
  },

  // ── ep3 conveyor-sort · 碎片拼图 — paper evidence bins ─────
  ep3: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'Dark interrogation room desk viewed from above with scattered old photographs, torn letters, pinned notes connected by red string, dramatic warm lamp light, noir detective aesthetic, photorealistic, solid pure #00FF00 chroma green background around the edges, 1024x512',
      },
    ],
  },

  // ── ep4 spotlight-seek · 权力棋盘 — chess king spotlight ───
  ep4: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'A golden theatrical spotlight beam illuminating a black chess king piece on a dark marble chess board, dramatic theatrical lighting with visible dust particles in the light cone, dark surroundings, photorealistic, solid pure #00FF00 chroma green background outside the beam, 1024x1024',
      },
    ],
  },

  // ── ep5 will-surge · 撑住 — glowing will core ──────────────
  ep5: {
    assets: [
      {
        name: 'theme-surge',
        prompt: 'A horizontal glowing magical energy conduit with purple and violet plasma flowing between two ornate runic end caps, electric arcs dancing along its length, fantasy art style, photorealistic texture, solid pure #00FF00 chroma green background, 1024x256',
      },
    ],
  },

  // ── ep6 qte-boss-parry · 最后摊牌 — Luna silhouette ────────
  ep6: {
    assets: [
      {
        name: 'theme-boss',
        prompt: 'Circular portrait of a fierce female warrior with glowing red eyes and wolf-fur collar, dramatic chiaroscuro backlight, her face partially in shadow with silver hair, framed within an ornate dark metal circular frame, photorealistic character portrait, solid pure #00FF00 chroma green background, 1024x1024',
      },
    ],
  },

  // ── ep7 cannon-aim · 锻造武器 — forge hammer ───────────────
  ep7: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'A blacksmith forge scene with a heavy iron hammer striking glowing red-hot metal on a dark anvil, bright sparks flying outward, dramatic orange-red firelight from below, dark smithy background, photorealistic, solid pure #00FF00 chroma green background at the edges, 1024x512',
      },
    ],
  },

  // ── ep8 stardew-fishing · 拉扯真相 — rope tension ──────────
  ep8: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'A thick braided rope stretched horizontally under intense tension, frayed fibers visible, dusty dim light from above, dark dramatic shadows below, photorealistic, solid pure #00FF00 chroma green background, 1024x384',
      },
    ],
  },

  // ── ep9 will-surge · 握紧声音 — clenched microphone ────────
  ep9: {
    assets: [
      {
        name: 'theme-surge',
        prompt: 'A horizontal composition of a tense hand gripping a vintage silver stage microphone, knuckles white with pressure, cold blue stage lighting, photorealistic, dramatic shadows, solid pure #00FF00 chroma green background, 1024x256',
      },
    ],
  },

  // ── ep10 qte-hold-release · 最后一口气 — oxygen gauge ──────
  ep10: {
    assets: [
      {
        name: 'theme-gauge',
        prompt: 'A vintage brass oxygen pressure gauge, circular dial with icy blue-white face, red needle pointing at a crimson danger zone, worn brass bezel with rivets, frost condensation on glass, dramatic cool lighting, photorealistic product shot, solid pure #00FF00 chroma green background, 1024x1024',
      },
    ],
  },

  // ── ep11 parking-rush · 规则战争 — council gavel ───────────
  ep11: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'An elegant wooden council chamber podium with a brass nameplate and a judges gavel resting on a polished oak surface, warm amber chamber lighting, dark wood paneling behind, photorealistic, solid pure #00FF00 chroma green background at top and sides, 1024x384',
      },
    ],
  },

  // ── ep12 lane-dash · 翻窗逃离 — moonlit corridor ───────────
  ep12: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'Vertical corridor interior with moonlight streaming through tall windows on both sides, long shadows, dark walls with peeling wallpaper, dramatic silver moonlight beams, photorealistic atmospheric architecture, solid pure #00FF00 chroma green background at the center vertical strip, 512x1024',
      },
    ],
  },

  // ── ep12_minor red-light-green-light · 坐到最后 — interrogator eye ──
  ep12_minor: {
    assets: [
      {
        name: 'theme-eye',
        prompt: 'Extreme close-up of a single human interrogator eye wide open with intense piercing stare, cold overhead fluorescent light reflecting in the iris, photorealistic sharp detail, solid pure #00FF00 chroma green background, 1024x1024',
      },
      {
        name: 'theme-eye-half',
        prompt: 'Extreme close-up of a single human eye half-closed, relaxed expression, warm dim side lighting, photorealistic detail, solid pure #00FF00 chroma green background, 1024x1024',
      },
      {
        name: 'theme-eye-closed',
        prompt: 'Extreme close-up of a single human eye fully closed with relaxed eyelid, warm ambient light, photorealistic skin and eyelash detail, solid pure #00FF00 chroma green background, 1024x1024',
      },
    ],
  },

  // ── ep13 maze-escape · 踏过边界 — forest path frame ────────
  ep13: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'A dark forest clearing viewed from above with twisting moonlit paths between tall pine tree silhouettes, mysterious atmospheric fog, top-down perspective, photorealistic, solid pure #00FF00 chroma green background at the corners, 1024x1024',
      },
    ],
  },

  // ── ep13_minor conveyor-sort · 独自前行 — photo fragments ──
  ep13_minor: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'Scattered old family photographs on a dusty wooden surface, some torn in half, sepia and warm tones, one lit by a single candle flame, nostalgic melancholic mood, photorealistic, solid pure #00FF00 chroma green background at the edges, 1024x512',
      },
    ],
  },

  // ── ep14 lane-dash · 黑暗奔逃 — moonlit forest ─────────────
  ep14: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'Tall pine tree silhouettes lit by silver moonlight, gentle ground mist, peaceful nighttime forest scene, photorealistic landscape, solid pure #00FF00 chroma green background, 1024x1024',
      },
    ],
  },

  // ── ep15 stardew-fishing · 重新呼吸 — calm water ───────────
  ep15: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'A serene forest pond surface with gentle concentric ripples spreading outward, morning mist hovering above, soft green and teal reflections, peaceful healing atmosphere, photorealistic, solid pure #00FF00 chroma green background at the edges, 1024x384',
      },
    ],
  },

  // ── ep16 color-match · 月光辨认 — moonlit face swatches ────
  ep16: {
    assets: [
      {
        name: 'theme-face-0',
        prompt: 'Portrait of a woman bathed in pale silver moonlight, warm gentle expression, square composition, photorealistic, solid pure #00FF00 chroma green background, 512x512',
      },
      {
        name: 'theme-face-1',
        prompt: 'Portrait of a man bathed in pale silver moonlight, neutral serious expression, square composition, photorealistic, solid pure #00FF00 chroma green background, 512x512',
      },
      {
        name: 'theme-face-2',
        prompt: 'Portrait of an elderly wise woman bathed in pale silver moonlight, kind knowing expression, square composition, photorealistic, solid pure #00FF00 chroma green background, 512x512',
      },
    ],
  },

  // ── ep17 spotlight-seek · 道别的勇气 — sunset spotlight ────
  ep17: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'Warm sunset golden spotlight beam illuminating a single silhouetted figure from behind on a deserted plaza, long dramatic shadow stretching forward, dust particles floating in the warm amber light, photorealistic, solid pure #00FF00 chroma green background at the edges, 1024x1024',
      },
    ],
  },

  // ── ep18 cannon-aim · 迈出第一步 — coffee table ────────────
  ep18: {
    assets: [
      {
        name: 'theme-overlay',
        prompt: 'Top-down view of a rustic cafe table with two steaming coffee cups, a croissant, and an open notebook with a fountain pen, warm morning sunlight, photorealistic, solid pure #00FF00 chroma green background at the edges, 1024x512',
      },
    ],
  },

  // ── ep19 qte-boss-parry · 满月之约 — full moon portrait ────
  ep19: {
    assets: [
      {
        name: 'theme-boss',
        prompt: 'A large bright full moon rising over dark mountain silhouettes, silver and pale blue glow illuminating thin clouds, dramatic nightscape, framed within an ornate dark metal circular frame, photorealistic, solid pure #00FF00 chroma green background, 1024x1024',
      },
    ],
  },

  // ── ep20 maze-escape · 找到方向 — wall tile replacement ────
  // 替换迷宫墙体（核心视觉外壳），背景保持原样不动。
  // SKILL.md L145: 替换游戏核心视觉"外壳"（信号灯→狼眼、背景、特效）
  ep20: {
    assets: [
      {
        name: 'theme-wall',
        prompt: 'A seamless tileable square texture of a moss-covered dark stone block, top-down view, weathered grey rock with vibrant green moss patches, small ferns at corners, photorealistic, the four edges must connect smoothly when tiled with copies of itself, square 512x512, solid pure #00FF00 chroma green background outside the stone area',
      },
    ],
  },
};
