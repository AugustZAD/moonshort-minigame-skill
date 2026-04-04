# minigame-ui-skill.md
**Vibe Minigame · UI Design Skill**
> 每次 Claude Code 接到 vibe minigame UI 需求时，先完整阅读本文件，再动手。
> 本文件只管 UI 语言：取色、用色、间距、动效、UI Plan 流程。
> 不包含：canvas 渲染清晰度、DPR、游戏逻辑、UX 结构。

---

## 0. 阅读方式

本文件分三类规则：

- **MUST**：强制执行，违反会破坏视觉一致性
- **SHOULD**：强烈建议，有充分理由时可偏离
- **MAY**：建议做法，灵活使用

每次接到需求，按此顺序执行：
1. 读完本文件
2. 分析现有 UX 结构
3. 写 UI Plan（§1）
4. 执行

---

## 1. 如何制定 UI Plan（每次必做）

**在写任何代码前，先输出 Plan。** Plan 包含：

### 1.1 现状扫描
列出现有 UI 的问题，对照本文件每条原则：
```
- 背景：[浅色/深色/问题描述]
- 字体：[字体族/字重/问题]
- 颜色：[来源/饱和度/问题]
- 间距：[是否 4px 倍数/问题]
- Canvas 元素：[glow/渐变/问题]
```

### 1.2 不动的内容
**明确列出什么不改**：
- 所有游戏逻辑
- UX 布局和交互位置
- 音频系统
- 数据结构

### 1.3 改动清单（按优先级）
```
P0 — [最核心，不做其他都没意义]
P1 — [第二优先]
P2 — [视觉增强]
P3 — [细节]
```

### 1.4 执行
Plan 写完，等用户确认或直接执行（视任务要求）。

---

## 2. 世界观

> **"黑色宇宙里的糖果霓虹"**

所有 minigame 共享一套美学语言：
- **背景永远是深暗的**，封面图以 20% 透明度渗透出故事氛围
- **色彩元素像糖果在夜市发光**——高饱和、高亮度、强对比
- 视觉张力来自：**极暗底色 × 极鲜艳前景**

目标用户感受：Chupa Chups 广告 × Y2K × 手机 gacha 游戏开屏

---

## 3. 取色算法（Color Extraction）

### 3.1 算法概述

从封面图提取 5 色调色板，全部来自图片本身，不做数学推导。

```
输入：封面图片
输出：{ primary, accent, secondary, surface, text }

步骤：
1. 将图片缩小到 80×80 采样
2. K-Means k=12，迭代 32 次，得到 12 个颜色簇
3. 将 12 簇分为三区：
   - lights：L > 0.84（近白候选）
   - darks：L < 0.22（近黑候选）
   - mids：其余中调色
4. 对 mids 按"年轻感评分"排序
5. 贪心多样性选出最多 3 个中调色（含 Fallback 瀑布，见 §3.3）
6. 从 lights 取近白；从 darks 取近黑（若不存在则从主色 H 生成）
7. 对中调色做饱和度提升处理
8. 若 secondary == accent（只提取出 2 色），从 accent 派生 secondary（L ± 15%）
```

### 3.2 年轻感评分公式

```javascript
// 对每个颜色簇 [h, s, l]：
vibeScore = Math.pow(s + 0.05, 0.55)   // 饱和度贡献
           * bell(l, 0.57, 0.21)         // 亮度贡献（峰值在 L=57%）
           * hueBonus(h);                 // 色相加权

// bell 函数：高斯分布，中心 0.57，宽度 0.21
function bell(x, center, width) {
  const d = (x - center) / width;
  return Math.exp(-d * d / 2);
}

// 色相加权：粉/紫最高分，土黄最低分
function hueBonus(h) {
  if (h >= 300 || h <= 15)  return 1.28;  // 粉红/品红
  if (h >= 260 && h < 300)  return 1.22;  // 紫色
  if (h >= 140 && h < 190)  return 1.20;  // 薄荷/青
  if (h >= 190 && h < 260)  return 1.15;  // 蓝色
  if (h >= 15  && h < 80)   return 0.65;  // 黄/黄绿（减分）
  return 1.0;
}
```

### 3.3 贪心多样性选色（含边缘情况 Fallback）

```javascript
// ── Step 1: 标准贪心（mids 区域）────────────────────────────────────────────
const selected = [];
for (const c of mids_sorted_by_score) {
  if (selected.length >= 3) break;
  let tooClose = false;
  for (const v of selected) {
    const hueDiff = Math.min(Math.abs(c.h - v.h), 360 - Math.abs(c.h - v.h));
    if (hueDiff < 50 && Math.abs(c.l - v.l) < 0.25) { tooClose = true; break; }
  }
  if (!tooClose) selected.push(c);
}

// ── Step 2: Fallback 瀑布（当 accent 未能从 mids 选出时）────────────────────
// 触发条件：selected.length < 2（即图片极度单色，所有 mid 色相都相近）
if (selected.length < 2) {
  // Fallback A：从 DARK 区找高饱和色（S > 0.30），提亮到 mid-tone 用
  const darkCandidates = darks
    .filter(c => c.s > 0.30)
    .sort((a, b) => b.s - a.s);

  for (const c of darkCandidates) {
    const primary = selected[0];
    const hueDiff = Math.min(Math.abs(c.h - primary.h), 360 - Math.abs(c.h - primary.h));
    if (hueDiff > 20) {  // 放宽到 20°（暗区没有更多选择）
      // 亮度提升到可用范围
      const boostedL = Math.min(Math.max(c.l + 0.30, 0.45), 0.58);
      const boostedS = Math.min(Math.max(c.s, 0.74), 0.92);
      const boostedRgb = hslToRgb(c.h, boostedS, boostedL);
      selected.push({ ...c, rgb: boostedRgb, s: boostedS, l: boostedL, fromDark: true });
      break;
    }
  }
}

// ── Step 3: Fallback B（DARK 区也没有时，数学生成互补色）────────────────────
if (selected.length < 2) {
  const primary = selected[0];
  // 使用色相旋转 150°（不用 180° 互补，避免太"设计感"）
  const accentH = (primary.h + 150) % 360;
  const accentRgb = hslToRgb(accentH, Math.min(primary.s, 0.85), 0.55);
  selected.push({
    h: accentH, s: 0.85, l: 0.55, rgb: accentRgb,
    generated: true  // 标记为算法生成，非图片提取
  });
}

// selected[0] = primary，selected[1] = accent，selected[2] = secondary（若有）
```

**Fallback 触发场景：**
- 黑色电影、水墨画、极简摄影等单色系封面
- 全图同一色温（全暖/全冷）
- Fallback A 优先（暗区提亮），因为颜色仍来自图片本身
- Fallback B 最后兜底（数学生成），需在输出中标注 `generated: true`

### 3.4 饱和度 & 亮度修正

```javascript
// 标准：只对中调色提饱和度
const newS = Math.min(Math.max(c.s, 0.74), 0.92);

// 额外：从 DARK 区提升来的 accent，需同步调整亮度到 mid-tone 可用范围
if (c.fromDark) {
  const newL = Math.min(Math.max(c.l + 0.30, 0.45), 0.58);
  // 确保提亮后不失去颜色感（L 太高 S 要适当下调）
  const finalS = newL > 0.55 ? Math.min(newS, 0.88) : newS;
  return { ...c, s: finalS, l: newL, rgb: hslToRgb(c.h, finalS, newL) };
}
```

**亮度修正规则：**
- 标准 mid-tone：只修正 S，L 不变
- 来自 DARK 区的颜色：L 提升 +0.30，最终 clamp 到 [0.45, 0.58]
- 来自 LIGHT 区（近白降用）：L 降到 0.62-0.68，S 保持

### 3.5 近白/近黑生成规则

```javascript
// 近白（surface）：
// 1. 优先从图片 lights（L > 0.84）取亮度最高的
// 2. 若图片无 light 区，从主色色相生成：
surface = hslToRgb(primary.h, 0.18, 0.94);  // 带色相温度的近白

// 近黑（text/bg）：
// 1. 优先从图片 darks（L < 0.22）取亮度最低的
// 2. 若图片无 dark 区，从主色色相生成：
bgDark = hslToRgb(primary.h, 0.10, 0.10);   // 带色相温度的极深色
textColor = hslToRgb(primary.h, 0.07, 0.12); // 略浅一点的近黑
```

### 3.6 完整 JavaScript 实现

```javascript
// ── 工具函数 ──────────────────────────────────────────────────────────────────
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h, s, l = (mx + mn) / 2;
  if (mx === mn) { h = s = 0; } else {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h /= 360;
  function hf(p, q, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [Math.round(hf(p, q, h + 1/3) * 255),
          Math.round(hf(p, q, h)       * 255),
          Math.round(hf(p, q, h - 1/3) * 255)];
}

function toHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v))
    .toString(16).padStart(2, '0').toUpperCase()).join('');
}

function colorDist(a, b) {
  return (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;
}

// ── K-Means ───────────────────────────────────────────────────────────────────
function kmeans(pixels, k, iterations) {
  let centers = [];
  const seen = new Set();
  while (centers.length < k) {
    const i = Math.floor(Math.random() * pixels.length);
    if (!seen.has(i)) { seen.add(i); centers.push(pixels[i].slice()); }
  }
  for (let t = 0; t < iterations; t++) {
    const clusters = Array.from({ length: k }, () => []);
    for (const p of pixels) {
      let md = Infinity, bi = 0;
      for (let j = 0; j < k; j++) {
        const d = colorDist(p, centers[j]);
        if (d < md) { md = d; bi = j; }
      }
      clusters[bi].push(p);
    }
    for (let j = 0; j < k; j++) {
      if (!clusters[j].length) continue;
      const n = clusters[j].length;
      centers[j] = [
        Math.round(clusters[j].reduce((s, p) => s + p[0], 0) / n),
        Math.round(clusters[j].reduce((s, p) => s + p[1], 0) / n),
        Math.round(clusters[j].reduce((s, p) => s + p[2], 0) / n),
      ];
    }
  }
  return centers;
}

// ── 主函数：从 ImageData 提取 5 色调色板 ─────────────────────────────────────
function extractPalette(imageData) {
  // 1. 采样像素，过滤极端明度
  const pixels = [];
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] < 128) continue;
    const [, s, l] = rgbToHsl(imageData.data[i], imageData.data[i+1], imageData.data[i+2]);
    if (l < 0.03 || l > 0.98) continue;
    pixels.push([imageData.data[i], imageData.data[i+1], imageData.data[i+2]]);
  }
  if (pixels.length < 5) return null;

  // 2. K-Means
  const k = Math.min(12, Math.max(5, Math.floor(pixels.length / 4)));
  const clusters = kmeans(pixels, k, 32);

  // 3. 标注每个簇的 HSL 和评分
  const ann = clusters.map(rgb => {
    const [h, s, l] = rgbToHsl(...rgb);
    const score = Math.pow(s + .05, .55) * bell(l, .57, .21) * hueBonus(h);
    return { rgb, h, s, l, score };
  });

  // 4. 分区
  const lights = ann.filter(c => c.l > 0.84).sort((a, b) => b.l - a.l);
  const darks  = ann.filter(c => c.l < 0.22).sort((a, b) => a.l - b.l);
  const mids   = ann.filter(c => c.l >= 0.22 && c.l <= 0.84)
                    .sort((a, b) => b.score - a.score);

  // 5. 贪心选 3 个多样中调色（含 Fallback，见 §3.3）
  const sel = [];
  for (const c of mids) {
    if (sel.length >= 3) break;
    let close = false;
    for (const v of sel) {
      const hd = Math.min(Math.abs(c.h - v.h), 360 - Math.abs(c.h - v.h));
      if (hd < 50 && Math.abs(c.l - v.l) < 0.25) { close = true; break; }
    }
    if (!close) sel.push(c);
  }

  // 6. 饱和度提升
  const boosted = sel.map(c => {
    const ns = Math.min(Math.max(c.s, 0.74), 0.92);
    return { ...c, rgb: hslToRgb(c.h, ns, c.l), s: ns };
  });

  const primary = boosted[0] || { h: 327, s: .83, l: .61, rgb: [236, 79, 153] };

  // 7. 近白 / 近黑
  const nw = lights.length ? lights[0]
           : { rgb: hslToRgb(primary.h, .18, .94), h: primary.h, s: .18, l: .94 };
  const nb = darks.length  ? darks[0]
           : { rgb: hslToRgb(primary.h, .07, .11), h: primary.h, s: .07, l: .11 };

  // ── Fallback：当贪心选出的色数 < 2 时 ────────────────────────────────────
  // 完整逻辑见 §3.3，此处为简化版
  // 若 sel.length < 2，从 darks（S>0.30）提亮，或 Fallback B 生成互补色

  // ── secondary 不能等于 accent ──────────────────────────────────────────────
  // 若只有 2 个颜色，secondary 从 accent 派生（亮度 +15% 或 -15%）
  const getSecondary = (acc) => {
    if (!boosted[2]) {
      const newL = acc.l > 0.55 ? Math.max(acc.l - 0.15, 0.35) : Math.min(acc.l + 0.15, 0.70);
      const rgb = hslToRgb(acc.h, acc.s * 0.9, newL);
      return toHex(...rgb);
    }
    return toHex(...boosted[2].rgb);
  };

  return {
    primary:   toHex(...primary.rgb),
    accent:    toHex(...(boosted[1]?.rgb || primary.rgb)),
    secondary: getSecondary(boosted[1] || primary),
    surface:   toHex(...nw.rgb),
    text:      toHex(...nb.rgb),
    bgDark:    toHex(...hslToRgb(primary.h, .10, .10)),
  };
}

// 使用方式：
// const canvas = document.createElement('canvas');
// canvas.width = canvas.height = 80;
// canvas.getContext('2d').drawImage(img, 0, 0, 80, 80);
// const palette = extractPalette(canvas.getContext('2d').getImageData(0,0,80,80));
```

### 3.7 调色板质量检验标准

分为两类：**硬错误**（必须修复）和**软警告**（记录但允许通过）。

```
硬错误 — 必须修复，否则 UI 无法使用：
  ✗ primary.L  < 40% 或 > 75%（颜色看不见或太刺眼）
  ✗ primary.S  < 60%（颜色太灰，失去霓虹感）
  ✗ surface.L  < 80%（近白不够亮，失去透气感）
  ✗ text.L     > 30%（近黑太浅，对比度不足）
  ✗ L span     < 55%（整体对比度崩塌）

软警告 — 记录，允许通过（单色图片的正常现象）：
  ⚠ primary.L  在 40-52% 或 68-75%（略偏，接受）
  ⚠ primary.S  在 60-74%（略低饱和，接受）
  ⚠ hue diff   < 60°（单色图片常见，需在注释里说明设计意图）
  ⚠ accent.fromDark = true（来自暗区提亮，颜色真实但需注意对比度）
  ⚠ accent.generated = true（数学生成，不来自图片）

单色图片判定标准：
  若所有 mid-tone 颜色的最大色相差 < 40°，标记为"单色图片"
  → 自动降低 hue diff 要求到 20°
  → 优先使用 Fallback A（暗区提亮）
  → 在输出中注明："monochromatic image — accent from dark zone"
```

**注意**：hue diff < 60° 不代表配色失败。
- 琥珀橙 + 血红 = 犯罪noir ✓
- 薰衣紫 + 深紫 = 神秘奇幻 ✓
- 翠蓝 + 深海蓝 = 海洋清凉 ✓
单色美学有其设计合理性，关键是两色之间有**明度差（L diff > 20%）**或**饱和度差（S diff > 20%）**。
### 3.9 调色板应用顺序规范（MUST 严格遵守）

**反复出现的 bug 根因：** 如果先替换单个 hex（如 `#EC4F99`），再去找含有该 hex 的渐变字符串，就永远找不到了，渐变里的中间派生色会作为残留污染 UI。

**正确执行顺序（7步，不可乱序）：**

```
Step 1  插入 CSS 结构        先写 #cover-layer、#game-shell 等 CSS 块
        ↓                    必须在颜色替换之前，否则找不到原始 background 值
Step 2  替换完整渐变字符串    替换 conic-gradient(...)、linear-gradient(...) 整段
        ↓                    必须在 Step 3 之前，否则渐变中的 hex 被替换后 match 失败
Step 3  替换单个 hex 颜色     #EC4F99 → primary，#4FECA2 → accent，etc.
        ↓
Step 4  替换 rgba() 颜色      rgba(236,79,153,...) → hex_rgba(primary, alpha)
        ↓
Step 5  嵌入封面图 base64     img src="data:image/...;base64,..."
        ↓
Step 6  替换 JS 颜色引用       showToast 里的 '#4FECA2' 等
        ↓
Step 7  验证                   扫描残留旧 hex，cover-layer CSS 存在，opacity=0.20
```

**验证脚本（每次应用后必跑）：**
```python
old_colors = ['#EC4F99', '#4FECA2', '#FFE0F8', '#1A1221',
              '#F17BB3', '#F6A7CC', '#FAD3E6']  # ← 不要忘记渐变中间色！
bad = [c for c in old_colors if c in output_html]
assert not bad, f"残留旧颜色: {bad}"
assert '#cover-layer {' in output_html, "cover-layer CSS 未插入"
assert 'opacity: 0.20' in output_html, "封面图透明度未设置"
```


### 3.8 边缘情况速查表

| 情况 | 判定方式 | 处理策略 |
|------|---------|---------|
| **单色图片**（极简、水墨、黑色电影） | 所有 mid hue diff < 40° | 降低 hue 要求到 20°，优先 Fallback A |
| **只有暗色没有中调**（夜景、剪影） | mids 为空 | 从 darks S>30% 里提亮，L +0.30 |
| **只有亮色没有中调**（素白、纯光） | mids 为空，有 lights | 从 lights 降亮：L -0.25，S +0.30 |
| **图片太小/像素不足**（< 5 有效像素） | pixels < 5 | 返回 null，用主题默认色 |
| **全灰图片**（S 全 < 0.15） | max S in all clusters < 0.15 | 保留图片色相 H，激进提饱和：S → 0.80，L → 0.55；不替换为默认色 |
| **Primary L 不达标**（< 52%） | L check fail | 用 hsl_to_rgb(h, s, 0.55) 重映射亮度 |
| **Accent 被算法生成**（Fallback B） | generated = true | 在 UI 中记录，换图时优先替换 |



---

## 4. CSS 颜色 Token 体系

### 4.1 命名规范

```css
:root {
  /* 核心五色 */
  --color-primary:    /* 主色：按钮、header、强调 */
  --color-accent:     /* 意外色：正面反馈、次要高亮 */
  --color-secondary:  /* 辅色：第三层级 */
  --color-surface:    /* 近白：内区、卡片底 */
  --color-text:       /* 近黑：深色背景上的正文 */

  /* 透明度变体（只调 alpha，不造新色） */
  --color-primary-10:  /* rgba primary 10% */
  --color-primary-20:  /* rgba primary 20% */
  --color-primary-30:  /* rgba primary 30% */
  --color-primary-50:  /* rgba primary 50% */
  --color-accent-20:   /* rgba accent 20% */
  --color-accent-40:   /* rgba accent 40% */

  /* 固定色（不随封面变化） */
  --color-white:    #FFFFFF;
  --color-white-20: rgba(255,255,255,.20);
  --color-white-30: rgba(255,255,255,.30);
  --color-white-50: rgba(255,255,255,.50);
  --color-black-15: rgba(0,0,0,.15);
  --color-black-25: rgba(0,0,0,.25);
}
```

**MUST: 组件里不允许硬编码 hex 值，只用 token。**

### 4.2 用色决策树

```
这个元素是什么背景？
  → 核心按钮/高亮组件  → --color-primary（实色）
  → 内容面板/圆圈内区  → --color-surface（近白）
  → 半透明浮层         → glass-panel 渐变（见 §5）

这段文字在什么背景上？
  → 深色背景            → #FFFFFF
  → surface 背景        → --color-text
  → 强调/标签文字       → --color-primary

需要边框吗？
  → 配渐变/透明背景     → border: 2px solid #FFFFFF（白边，透气感）
  → 配实色背景          → border: 2px solid var(--color-primary)（主色边）
  → 半透明面板          → border: 1.5px solid rgba(255,255,255,.20)
  → 头像/特殊圈需渐变边  → ::before 伪元素 + gradient（CSS border 无法做渐变）
```

---

## 5. Frame 层次结构

**MUST：严格的四层，顺序不可更改。**

```
Layer 0  Frame 背景     background: --color-bg-dark（带色相温度的极深色，非 #000）
Layer 1  封面图层       见下方 CSS，opacity 0.20，高度撑满 frame
Layer 2  渐变幕布       可选。顶透明 → 底 rgba(bgDark, .85)，保证按钮区可读
Layer 3  UI 元素        所有组件
```

**Layer 1 封面图 — 必须完整写这几行，缺一不可：**
```css
#cover-layer {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;   /* ← height: 100% 不能省，否则图片不撑满 */
  object-fit: cover;           /* ← 等比裁切填满，不变形 */
  object-position: center center;
  opacity: 0.20;               /* ← 固定 0.20，不随封面亮暗调整 */
  z-index: 0;
  pointer-events: none;
}
```

**背景色 MUST 带色相温度**，禁止用 `#000000` / `#111111`（纯黑）。
示例：`#1E1116`（粉调深红）、`#12101B`（紫调深色）、`#0E1318`（蓝调深色）。

---

## 6. 间距系统

**MUST：所有间距以 4px 为倍数。**

```
4px   xs   图标与文字间距，组件内紧凑间距
8px   sm   组件内标准间距
12px  md   卡片内边距（padding）
16px  —    内容区边距
20px  lg   页面水平边距
24px  xl   组件组之间
32px  2xl  卡片内大间距
48px  3xl  区块间距
```

**字号范围：12px–64px**，低于 12px 不可读，高于 64px 失控。
常用规格：12 / 14 / 16 / 18 / 20 / 24 / 28 / 32 / 40 / 48 / 64（全为 4px 倍数）。

---

## 7. 渐变食谱

**SHOULD：有实色填充的地方优先考虑渐变，增加层次感。**

渐变方向规则：
- 按钮、HP 条、竖向元素：**180deg**（顶淡底浓，模拟顶部光源）
- 圆形内区：**radial**（中心亮→边缘带色，模拟发光透镜）
- 圆形外环：**conic**（角度渐变，旋转色感）

```css
/* G-01  主色渐变填充（CTA 按钮、卡片 hero 区） */
linear-gradient(180deg, var(--color-primary-10) 0%, var(--color-primary) 100%)

/* G-02  HP / Progress Bar（垂直，上淡下浓） */
linear-gradient(180deg, rgba(accent, .10) 0%, var(--color-accent) 100%)

/* G-03  圆形内区（Portal、选择圈） */
radial-gradient(circle at 50% 50%, #FFFFFF 46.58%, var(--color-surface) 100%)

/* G-04  圆形外环 */
conic-gradient(from 270deg, var(--color-primary), #FFFFFF 360deg)

/* G-05  玻璃面板（半透明卡片） */
linear-gradient(180deg, rgba(255,255,255,.06) 0%, var(--color-primary-10) 100%)

/* G-06  渐变描边（头像环、特殊圈） */
linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)
```

**边框搭配规则：**
- 配 G-01（渐变背景）→ `border: 2px solid #FFF`（白边）
- 配实色背景 → `border: 2px solid var(--color-primary)`（主色边）
- 配 G-05（玻璃）→ `border: 1.5px solid rgba(255,255,255,.20)`

---

## 8. 阴影系统

**MUST：游戏按钮的外阴影 radius 必须为 0（硬边），不用模糊阴影。**
硬边阴影 = 游戏感，模糊阴影 = Web 感。

```css
/* S-01  3D 可点击按钮（标准） */
box-shadow:
  0 4px 0 0 var(--color-black-15),       /* 底部硬边：立体感 */
  inset 0 0 4px 4px var(--color-white-50); /* 内白光：光泽感 */

/* S-02  按下态（active） */
box-shadow:
  0 1px 0 0 var(--color-black-15),
  inset 0 0 4px 4px var(--color-white-50);
/* + transform: translateY(4px) 模拟下压 */

/* S-03  外发光（激活/选中/Portal 呼吸） */
box-shadow: 0 0 20px 2px var(--color-primary-30);

/* S-04  圆形内深度 */
box-shadow: inset 0 4px 16px rgba(0,0,0,.12);

/* S-05  对话气泡 */
filter: drop-shadow(0 2px 4px rgba(0,0,0,.15));
/* 注意：用 filter 而非 box-shadow，气泡箭头也会投影 */
```

---

## 9. 字体系统

```
主字体：Montserrat（游戏 UI 全局）
特效字：Varela Round（VS 徽章、轻量标签专用，不超过 1 个元素/场景）

字重：只用 400 / 700 / 900，禁止 500 / 600 / 800
大小：12–64px，只用 4px 倍数规格
```

**Header / 按钮文字描边做法：**
MUST 用 `text-shadow` 8方向模拟外描边，不用 `-webkit-text-stroke`。
原因：`-webkit-text-stroke` 向内外各扩展，粗细不均；`text-shadow` 精度可控。

```css
/* 白字 + primary 色描边（Header 标题标准做法） */
text-shadow:
  -3px -3px 0 var(--color-primary), 3px -3px 0 var(--color-primary),
  -3px  3px 0 var(--color-primary), 3px  3px 0 var(--color-primary),
   0   -3px 0 var(--color-primary), 0    3px 0 var(--color-primary),
  -3px    0 0 var(--color-primary), 3px    0 0 var(--color-primary);
```

---

## 10. 动效 Token

```css
:root {
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);  /* 弹性：元素出现、按钮弹回 */
  --ease-out:    cubic-bezier(.25, 1, .5, 1);        /* 标准缓出：面板滑入 */
  --ease-in:     cubic-bezier(.5, 0, 1, .75);        /* 缓入：元素消失 */

  --duration-fast:   150ms;  /* 微交互（按钮按下反馈） */
  --duration-normal: 280ms;  /* 标准（HP 条变化） */
  --duration-slow:   450ms;  /* 页面级（面板进出） */
}
```

**必选动效（MUST）：**
- 按钮 active：`transform: translateY(4px)` + shadow 收缩，时长 `--duration-fast`
- HP 条变化：`transition: width --duration-normal --ease-spring`（弹性有生命感）
- 元素出现：`@keyframes pop-in`（scale .85→1，opacity 0→1）

**推荐动效（SHOULD）：**
- Portal / 圆形游戏区：呼吸光晕 `@keyframes glow-pulse`，周期 3s
- 评分文字出现：`Back.easeOut` scale 0→1，delay 100ms
- 星星展开：依次 delay 80ms/颗

```css
/* 弹入 */
@keyframes pop-in {
  from { opacity: 0; transform: scale(.85); }
  to   { opacity: 1; transform: scale(1); }
}

/* 上浮反馈（toast / combo） */
@keyframes float-up {
  0%   { opacity: 0; transform: translateY(0); }
  30%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-40px); }
}

/* 光晕呼吸 */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 12px 2px var(--color-primary-20); }
  50%       { box-shadow: 0 0 28px 6px var(--color-primary-40); }
}
```

---

## 11. Canvas / SVG 绘制原则

对于 Phaser canvas 或 SVG 直接绘制的元素，遵循：

**目标球 / 游戏对象：**
```
双层光晕（soft outer + bright inner）
  外圈：target.color, opacity 0.10, radius + 14
  内圈：target.color, opacity 0.28, radius + 6
实体：target.color, opacity 1.0
高光：white, opacity 0.65, 左上角 ≈ 35% radius
```

**炮管 / 射线类元素：**
```
底层：较深颜色，线宽 14px
顶层：primary 色，线宽 5px，opacity 0.8
（两层叠加模拟高光效果）
```

**背景点阵：**
```
primary 色，opacity 0.10，间距 28×30px，错位排列
白色小点（占 1/3），opacity 0.04，尺寸 1.5px
（双色混合，更有层次感）
```

**粒子效果：**
```
count：8–16 颗
速度：80–200px，随机方向
尺寸：3–7px 渐变到 0.2
时长：400–600ms, ease: Quad.easeOut
```

---

## 12. 执行 Checklist

在任何 UI 输出前，对照确认：

```
颜色
□ Frame 背景是带色相的极深色（非纯黑）？
□ 所有颜色来自 token，没有硬编码 hex？
□ 封面图透明度精确 0.20，object-fit: cover，height: 100%？
□ 调色板应用顺序正确（§3.9）？渐变字符串先于单色 hex 替换？
□ 渐变中间色（如 #F17BB3 等派生色）已被一并替换？
□ primary S 在 74–92%？
□ primary L 在 40–75%（硬错误边界）？
□ accent 与 primary 色相差 >20°（单色图允许 <60°）？
□ surface L > 80%，text L < 30%？
□ 若 accent.fromDark=true，检查对比度是否仍清晰可读？
□ 若 accent.generated=true，标注在代码注释中？

间距
□ 所有间距是 4px 倍数？
□ 字号在 12–64px 之间？

视觉
□ 按钮外阴影 blur=0（硬边）？
□ 渐变背景配白边，实色背景配主色边？
□ 对话气泡用 filter:drop-shadow？
□ 文字描边用 text-shadow 8方向？

动效
□ 按钮 active 有 translateY(4px) + shadow 收缩？
□ HP 条变化有 ease-spring 过渡？
□ 引用了 duration token，没有硬编码 ms 值？

Canvas
□ 游戏对象有双层光晕？
□ 高光点在左上角 ~35% 位置？
□ 背景点阵双色混合？
```

---

*minigame-ui-skill.md v1.1*
*2025 · 专注 UI 语言，不含 Canvas DPR / 游戏逻辑 / 组件具体规格*
*v1.1 更新：§3.3 Fallback 瀑布、§3.6 secondary 派生、§3.8 全灰修正、§3.9 应用顺序规范、§5 cover CSS*
