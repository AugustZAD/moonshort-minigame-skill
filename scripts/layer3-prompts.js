// scripts/layer3-prompts.js
// Per-episode AI image prompts for Layer 3 deep customization.
// Only the 5 episodes that pass the SKILL.md 4-gate decision threshold
// (强烈视觉冲突 + 单一核心外壳 + 不挡交互 + 有匹配素材).
// ep2/ep11/ep20 already validated as demos. ep16 dropped (color-match core
// logic cannot be themed without rewriting nextRound/answer — fails gates 2+3).
// Each episode is fully custom — NO asset reuse between episodes even when
// template is identical (ep1 vs ep10 same template, different scene).

module.exports = {
  // ── ep2 red-light-green-light · 不跪的理由 ──────────────────────
  // Scene: Alpha 注视下坚持不跪. Replaces the traffic light (red/yellow/green)
  // with three painted wolf-eye states matching Layer 2's painted-2D style.
  // Style must match bg-scene.jpg (painted anime-cinematic interior) + sprite-signal.png
  // (flat-shaded pixel eye with amber iris). STRICT anti-photoreal negation because
  // the previous photoreal 3D wolf-fur render was rejected (SKILL.md line 195 pitfall).
  // Model: google/gemini-3-pro-image-preview (quality over speed, user-specified).
  ep2: {
    assets: [
      {
        name: 'theme-eye-stare',
        model: 'google/gemini-3-pro-image-preview',
        vignette: { inner: 0.55, outer: 1.00, gamma: 1.6 },
        prompt: 'Hand-painted 2D digital illustration, anime-cinematic concept art style, cel-shaded with soft gradients, hard clean silhouettes, cool desaturated moody palette of deep blue-grey shadows and stone tones with a single warm amber-crimson accent, dramatic rim lighting from the side, painterly brushwork, flat shading with minimal detail, noir atmosphere. Close-up of a single alpha werewolf eye filling the frame, the eye is WIDE OPEN with a piercing vertical-slit pupil, glowing crimson blood-red iris with subtle inner fire, intense predatory stare locked directly onto the viewer, tense and threatening mood, dark wolf muzzle fur around the eye suggested only with broad painterly strokes and simple shapes, no individual hair strands, centered square composition suitable as a warning-panel icon. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT realistic fur, NOT studio render, NOT hyperrealistic, NOT photograph, no micro-texture, no individual hair strands, no glossy reflections. Subject (wolf eye) is centered and fills the frame. The painted wolf face extends naturally to the edges of the square canvas with the surrounding fur and darkness painted in naturally — do not add a vignette or black frame in the image itself; that will be added in post-processing. 1024x1024.',
      },
      {
        name: 'theme-eye-watch',
        model: 'google/gemini-3-pro-image-preview',
        vignette: { inner: 0.55, outer: 1.00, gamma: 1.6 },
        prompt: 'Hand-painted 2D digital illustration, anime-cinematic concept art style, cel-shaded with soft gradients, hard clean silhouettes, cool desaturated moody palette of deep blue-grey shadows and stone tones with muted amber accent, dramatic rim lighting from the side, painterly brushwork, flat shading with minimal detail, noir atmosphere. Close-up of a single alpha werewolf eye filling the frame, the eye is HALF-OPEN with a heavy upper eyelid lowered halfway covering the top of the iris, muted dark amber-red iris glow, watchful and menacing but restrained gaze cast slightly downward, dark wolf muzzle fur around the eye suggested only with broad painterly strokes and simple shapes, no individual hair strands, centered square composition suitable as a caution-panel icon. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT realistic fur, NOT studio render, NOT hyperrealistic, NOT photograph, no micro-texture, no individual hair strands, no glossy reflections. Subject (wolf eye) is centered and fills the frame. The painted wolf face extends naturally to the edges of the square canvas with the surrounding fur and darkness painted in naturally — do not add a vignette or black frame in the image itself; that will be added in post-processing. 1024x1024.',
      },
      {
        name: 'theme-eye-closed',
        model: 'google/gemini-3-pro-image-preview',
        vignette: { inner: 0.55, outer: 1.00, gamma: 1.6 },
        prompt: 'Hand-painted 2D digital illustration, anime-cinematic concept art style, cel-shaded with soft gradients, hard clean silhouettes, cool desaturated moody palette of deep blue-grey shadows and stone tones, soft rim lighting from the side, painterly brushwork, flat shading with minimal detail, calm noir atmosphere. Close-up of a single alpha werewolf eye filling the frame, the eye is FULLY CLOSED with a clear gentle curving eyelid line visible, no iris showing at all, soft dark lashes suggested by a few brushstrokes, calm resting expression with threat withdrawn, dark wolf muzzle fur around the eye suggested only with broad painterly strokes and simple shapes, no individual hair strands, centered square composition suitable as a safe-panel icon. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT realistic fur, NOT studio render, NOT hyperrealistic, NOT photograph, no micro-texture, no individual hair strands, no glossy reflections. Subject (wolf eye) is centered and fills the frame. The painted wolf face extends naturally to the edges of the square canvas with the surrounding fur and darkness painted in naturally — do not add a vignette or black frame in the image itself; that will be added in post-processing. 1024x1024.',
      },
    ],
  },

  // ── ep1 qte-hold-release · 压住心跳 ─────────────────────────────
  // Circular canvas gauge at (gCx, gCy, gR) gets a themed faceplate
  // behind it. Scene: 酒馆对话中压住怦动的心跳，不能露出情绪。
  // Style must match bg-scene.jpg (painted 2D anime-cinematic graveyard with
  // cool desaturated blue-grey stone palette, painterly brushwork, hard
  // silhouettes) + sprite-charge.png (stylized dark fist with flame halo).
  // STRICT anti-photoreal negation — previous prompt was photorealistic
  // product shot and broke style family (SKILL.md line 195 / 1782 pitfall).
  // Model: google/gemini-3-pro-image-preview (quality over speed).
  ep1: {
    assets: [
      {
        name: 'theme-gauge',
        model: 'google/gemini-3-pro-image-preview',
        prompt: 'Hand-painted 2D digital illustration, anime-cinematic concept art style, cel-shaded with soft gradients, hard clean silhouettes, painterly brushwork, flat shading with minimal detail, cool desaturated moody palette of deep blue-grey shadows and weathered stone tones with a single warm crimson accent, dramatic rim lighting from the side, noir gothic atmosphere matching a painted graveyard at dusk. A perfectly round circular antique heart-rate dial, carved weathered grey-blue stone bezel with simple engraved gothic motifs and a few painted rivets, dark obsidian-blue glass face showing a single glowing crimson ECG waveform pulsing across the center with two visible peaks, the waveform painted as clean flat brushstrokes rather than glowing tube, the bezel reads as hand-painted sculpted stone not polished metal, centered composition, perfectly round circular shape, the gauge bezel must NOT touch any edge of the frame and must be surrounded on all four sides by a wide band of pure chroma green, suitable as a faceplate behind a game gauge. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT realistic texture, NOT studio render, NOT hyperrealistic, NOT photograph, no micro-texture, no glossy reflections, no lens blur. CRITICAL BACKGROUND REQUIREMENT: the entire area outside the circular bezel MUST be a solid flat uniform pure #00FF00 chroma green (R=0 G=255 B=0) with absolutely NO shading, NO gradient, NO vignette, NO dark border, NO black corners, NO shadows, NO atmospheric haze — pure saturated #00FF00 only, filling every pixel outside the circle all the way to the image edges and corners. Do NOT paint any scene, sky, floor, or vignette behind the bezel. 1024x1024.',
      },
    ],
  },

  // ── ep4 spotlight-seek · 权力棋盘 ────────────────────────────────
  // 3x3 grid field gets a chess board backdrop underneath. Scene:
  // 在 Luna 的权力游戏中找到真正的棋子位置。
  // Style must match bg-scene.jpg (painted 2D anime-cinematic corporate hallway,
  // cool blue-grey palette, dark wood wainscoting, flat-shaded architecture) +
  // sprite-target.png (flat-shaded 2D vector-like chess king, black + gold).
  // STRICT anti-photoreal negation — previous photoreal marble board was rejected
  // (SKILL.md line 195 / 1782 pitfall).
  // Model: google/gemini-3-pro-image-preview (quality over speed).
  ep4: {
    assets: [
      {
        name: 'theme-board',
        model: 'google/gemini-3-pro-image-preview',
        prompt: 'Hand-painted 2D digital illustration, anime-cinematic concept art style, cel-shaded with soft gradients, hard clean silhouettes, painterly brushwork, flat shading with minimal detail, cool corporate noir palette of dark navy-grey and deep slate-black with muted dark-wood accents and a single warm gold spotlight highlight. Top-down orthographic view (straight from above, NO 3D perspective, NO isometric tilt, NO vanishing point) of a square 8x8 chess board backdrop, alternating dark-slate and faded muted-ivory squares painted with gentle brushstrokes and subtle tonal variation, clean simple square grid lines, one stylized silhouetted chess king piece resting near the center rendered as a flat 2D shape with a thin gold crown accent matching the flat cel-shaded look of existing chess sprites, a soft diffuse circular golden spotlight glow washing across the central squares and fading into cool shadow at the edges, centered square composition suitable as a game-field backdrop. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT hyperrealistic, NOT photograph, NOT marble texture, NOT realistic stone, no micro-texture, no cracks, no glossy reflections, no realistic shadows, no perspective distortion. Solid pure #00FF00 chroma green background at the outermost edges only, 1024x1024.',
      },
    ],
  },

  // ── ep10 qte-hold-release · 最后一口气 ──────────────────────────
  // Same template as ep1 but distinct — 窒息前的最后一口气。
  // 不同视觉：冰冷的氧气表 vs ep1 的温暖心电图。
  // Style must match bg-scene.jpg (painted 2D anime-cinematic bedroom interior,
  // cool desaturated teal-grey palette, dramatic low-key noir lighting, flat
  // shading with soft brushwork) + sprite-charge/release (cel-shaded flat
  // colors with hard dark outlines). STRICT anti-photoreal negation — previous
  // photoreal brass product-shot was rejected (SKILL.md line 195 pitfall).
  // Model: google/gemini-3-pro-image-preview.
  ep10: {
    assets: [
      {
        name: 'theme-gauge',
        model: 'google/gemini-3-pro-image-preview',
        prompt: 'Hand-painted 2D digital illustration, anime-cinematic concept art style, cel-shaded with soft gradients, hard clean silhouettes, cool desaturated moody palette of deep teal-grey shadows and icy steel-blue tones with a single pale crimson accent on the needle, dramatic low-key rim lighting from above, painterly brushwork, flat shading with minimal detail, noir atmosphere. A perfectly round circular oxygen pressure gauge filling the frame, weathered dark brass bezel rendered as broad flat painted shapes with simple cel-shaded highlights, a pale icy blue-grey enamel dial face with simple painted tick marks and stylized numerals, a sharp thin crimson needle pointing near empty in the danger zone, soft painterly frost creeping up from the bottom of the glass suggested by loose pale brushstrokes only, subtle cold glow behind the dial, centered composition, perfectly round circular shape, the gauge bezel must NOT touch any edge of the frame and must be surrounded on all four sides by a wide band of pure chroma green, the bezel must be perfectly circular. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT product photography, NOT realistic metal reflections, NOT studio render, NOT hyperrealistic, NOT photograph, no micro-texture, no chromatic aberration, no lens flare, no glossy specular highlights, no engraved detail, no rivet micro-detail. CRITICAL BACKGROUND REQUIREMENT: the entire area outside the circular bezel MUST be a solid flat uniform pure #00FF00 chroma green (R=0 G=255 B=0) with absolutely NO shading, NO gradient, NO vignette, NO dark border, NO black corners, NO shadows, NO atmospheric haze, NO teal tint, NO cool wash — pure saturated #00FF00 only, filling every pixel outside the circle all the way to the image edges and corners. Do NOT paint any scene, sky, floor, fog, or vignette behind the bezel. 1024x1024.',
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
        model: 'google/gemini-3-pro-image-preview',
        vignette: { inner: 0.42, outer: 1.00, cy: 0.52, gamma: 1.8 },
        prompt: 'Hand-painted 2D digital illustration, anime-cinematic concept art style, cel-shaded with soft gradients, hard clean silhouettes, cool desaturated blue-grey palette of pale stone and dusk shadow with a single warm amber-crimson accent, painterly brushwork, flat shading with minimal detail, formal hall atmosphere matching a classical cathedral interior. A massive ancient weathered dark bronze temple bell with blue-grey oxidation and subtle teal patina highlights hanging from a thick dark iron chain, at the exact moment of being struck — the heavy bronze clapper pressed hard against the inner wall, bold concentric shockwave rings of glowing amber-crimson energy rippling outward from the bell mouth in stylized painterly arcs, the entire bell body radiating a tense warning glow, dramatic side rim lighting, ominous and heavy mood, perfectly centered composition suitable as a warning-panel icon. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT hyperrealistic, NOT photograph, no micro-texture, no glossy metal reflections. The bell is centered in the frame with the dark cathedral interior painted naturally around it. Do not add any vignette, black frame, or dark border in the image itself — that will be added in post-processing. 1024x1024.',
      },
      {
        name: 'theme-bell-tremor',
        model: 'google/gemini-3-pro-image-preview',
        vignette: { inner: 0.42, outer: 1.00, cy: 0.52, gamma: 1.8 },
        prompt: 'Hand-painted 2D digital illustration, anime-cinematic concept art style, cel-shaded with soft gradients, hard clean silhouettes, cool desaturated blue-grey palette of pale stone and dusk shadow with a muted warm amber accent, painterly brushwork, flat shading with minimal detail, formal hall atmosphere matching a classical cathedral interior. The same massive ancient weathered dark bronze temple bell with blue-grey oxidation and subtle teal patina highlights hanging from the same dark iron chain, the moment just after the strike — the bronze clapper pulled slightly back from the inner wall, the bell visibly trembling with a soft ghosted painterly outline suggesting residual vibration, a single faint warm amber halo glow around the bell rim, the chain showing a gentle sway, dramatic side rim lighting, tense anticipation mood, perfectly centered composition suitable as a caution-panel icon. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT hyperrealistic, NOT photograph, no micro-texture, no glossy metal reflections. The bell is centered in the frame with the dark cathedral interior painted naturally around it. Do not add any vignette, black frame, or dark border in the image itself — that will be added in post-processing. 1024x1024.',
      },
      {
        name: 'theme-bell-still',
        model: 'google/gemini-3-pro-image-preview',
        vignette: { inner: 0.42, outer: 1.00, cy: 0.52, gamma: 1.8 },
        prompt: 'Hand-painted 2D digital illustration, anime-cinematic concept art style, cel-shaded with soft gradients, hard clean silhouettes, cool desaturated blue-grey palette of pale stone and dusk shadow, soft rim lighting from above, painterly brushwork, flat shading with minimal detail, calm formal hall atmosphere matching a classical cathedral interior. The same massive ancient weathered dark bronze temple bell with blue-grey oxidation and subtle teal patina highlights hanging motionless and silent from the same dark iron chain, completely at rest, the bronze clapper hanging straight down in the center touching nothing, a thin veil of pale dust particles drifting around the bell body in soft painterly dots, dim cool moonlight wash from above, faint ancient inscriptions barely visible on the patina, no glow no sound waves, calm contemplative stillness mood, perfectly centered composition suitable as a safe-panel icon. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT hyperrealistic, NOT photograph, no micro-texture, no glossy metal reflections. The bell is centered in the frame with the dark cathedral interior painted naturally around it. Do not add any vignette, black frame, or dark border in the image itself — that will be added in post-processing. 1024x1024.',
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

  // ── ep20 maze-escape · 找到方向 ─────────────────────────────────
  // Peaceful moonlit mossy stone maze wall, distinct from ep13's
  // threatening thorny thicket. Scene: 在新领地的迷宫中探索，找到
  // 钥匙推开那扇门 —— 平和、新生、自由、释然。
  // Style must match bg-scene.jpg (painted anime moonlit grass field
  // with cool silver-blue palette) + sprite-key.png (icy cyan compass
  // star — WALL MUST AVOID CYAN so the key stays readable).
  // Model: google/gemini-3-pro-image-preview (quality over speed).
  ep20: {
    assets: [
      {
        name: 'theme-wall',
        model: 'google/gemini-3-pro-image-preview',
        prompt: 'ONE single weathered ancient mossy stone block that fills the entire square frame edge to edge (NOT multiple stones, NOT a cobble pattern, NOT a brick wall, NOT scattered rocks — just one solid stone tile), top-down orthographic view (straight from above, NO 3D perspective, NO isometric angle, NO vanishing point), hand-painted digital illustration in the style of a cozy 2D top-down adventure game, anime-inspired soft brushwork, flat shading with gentle gradients, soft painterly outlines. The stone surface is weathered pale blue-grey granite with subtle tonal variation and a few soft painted cracks, patches of soft muted moss green creeping in from the edges and corners, a faint lavender-grey shadow in the recesses, the overall feeling is peaceful, ancient, calm, moonlit, restful — like a serene forgotten garden wall under the full moon. MEDIUM-BRIGHTNESS (light enough to clearly read against dark backgrounds, NOT pitch black, NOT fully dark, NOT blindingly bright). COOL MOONLIT PALETTE ONLY: pale blue-grey stone + soft muted moss green + subtle lavender shadow. NO cyan, NO bright blue, NO ice blue, NO warm colors, NO orange, NO yellow, NO gold, NO brown wood, NO red. NOT photorealistic, NOT 3D render, NOT CGI, NOT cinematic photo, NOT realistic stone texture, NOT hyperrealistic, NOT photograph, NOT a rendered game asset, no micro-texture, no glossy reflections, no specular highlights, no lens blur. Square edges connect seamlessly when tiled, centered composition, solid stone tile fills the entire 512x512 frame edge to edge with no green screen background, 512x512.',
        noChromaKey: true,
      },
    ],
  },
};
