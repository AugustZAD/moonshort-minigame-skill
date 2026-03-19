# Mini-Game UI/UX Design Guide

> Canonical design guide for this standalone mini-game framework. Use this file as the primary visual and interaction reference for all generated games.

> **适用场景**：为移动端恋爱叙事类小游戏（对标 Chapters / Episode 用户群体）进行 vibe coding 时的 UI/UX 设计规范。目标风格为 **Kenney 2D Asset Style**——扁平、圆润、活泼、色块干净，像一套精心设计的桌游卡牌或儿童插画书。

---

## 一、资源调用规范 / Asset Resource References

> 所有素材必须通过线上 CDN 或 API 调用，禁止硬编码本地路径。

---

### 1.1 配色方案 — Huemint API

**调用地址**：`https://api.huemint.com/color`（POST，JSON）

每次生成游戏场景 UI 时，根据当前场景的主题色（`palette` 中锁定第一个色值），调用 Huemint API 自动补全剩余配色。

**标准调用模板**：

```javascript
async function fetchScenePalette(primaryColor) {
  const payload = {
    mode: "transformer",
    num_colors: 4,
    temperature: "1.2",
    num_results: 20,
    adjacency: [
      "0",  "65", "45", "35",
      "65", "0",  "35", "65",
      "45", "35", "0",  "35",
      "35", "65", "35", "0"
    ],
    palette: [primaryColor, "-", "-", "-"]
  };

  const response = await fetch("https://api.huemint.com/color", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  const best = data.results.sort((a, b) => a.score - b.score)[0];

  return {
    primary:  best.palette[0],
    light:    best.palette[1],
    accent:   best.palette[2],
    neutral:  best.palette[3],
  };
}
```

**色彩角色定义**：

| 变量 | 用途 |
|------|------|
| `primary` | 主题色，按钮填充、图标、进度条 |
| `light` | 浅底色，卡片背景、面板底色 |
| `accent` | 深强调色，描边、hover 状态、评级徽章 |
| `neutral` | 中性色，正文、次要标签 |

---

### 1.2 游戏贴图素材 — Kenney 2D Assets

**资源站**：`https://kenney.nl/assets`，全部 **CC0 授权**，无需署名。

**核心风格要求**：Kenney 资源的视觉语言是整套设计系统的基准。所有自绘 UI 组件（按钮、卡片、进度条、弹窗等）都必须在视觉上与 Kenney 资源保持一致——扁平色块、清晰描边、无渐变、无毛玻璃效果。

**素材选取原则**：

LLM 在为每个游戏选取贴图时，应从 Kenney 网站 **2D 类目下的全部资源包**中自主判断并选取最契合当前游戏主题和玩法的素材，不限定具体包名。选取时需满足：

1. 所选资源包确实存在于 `kenney.nl/assets` 且属于 2D 类目
2. 素材风格与当前游戏的主题、玩法、情绪基调相符
3. 优先选取能直接复用的 UI 组件类素材（按钮、面板、图标、进度条等），减少从零绘制的工作量
4. 同一个游戏内引用的素材包不宜超过 3 个，保持视觉风格统一

**使用原则**：
- 所有装饰元素优先使用 Kenney 贴图，禁止用 emoji 替代
- 贴图颜色可通过 CSS `filter: hue-rotate()` 配合主题色调整
- 评级结算动效中的粒子特效优先使用含粒子/特效类贴图的资源包

---

### 1.3 字体素材 — Google Fonts

**选字原则**：

LLM 在为每个游戏选择字体时，应从 Google Fonts 中自主选取，选择范围限定在以下两类风格内：

- **Cute / Rounded**：字形圆润饱满，适合标题和数值显示，传达活泼友好感
- **Handwritten**：手写感字体，适合点缀、引言、小标签，传达温暖手工质感

选字时需满足：
1. 字体在 Google Fonts 上确实存在且可免费调用
2. 英文可读性良好，不过度装饰到影响信息传达
3. 标题字体与正文字体有明显视觉层次区分
4. 字体风格与当前游戏主题和情绪基调相符

**正文字体固定使用系统字体，无需从 Google Fonts 引入**：

```css
font-family: system-ui, -apple-system, sans-serif;
```

**CDN 引入格式**（根据实际选用字体替换参数）：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family={TITLE_FONT}&family={ACCENT_FONT}&display=swap" rel="stylesheet">
```

**字号与字重规范**：

| 层级 | 字号 | 字重 |
|------|------|------|
| 游戏标题 | `≥ 28px` | `900` |
| 评级字母 | `≥ 64px` | `900` |
| 区块小标题 | `18px ~ 22px` | `700` |
| 数值 / 标签 | `13px ~ 16px` | `700` |
| 正文说明 | `14px ~ 15px` | `400` |
| 最小文字 | `≥ 11px` | `400` |

---

### 1.4 图标素材 — Phosphor Icons (Fill Style)

**CDN 引入**：

```html
<script src="https://unpkg.com/@phosphor-icons/web"></script>
```

**使用规范**：
- 统一使用 `fill` 样式（class 前缀 `ph-fill`）
- 图标颜色跟随当前场景 `primary` 主题色
- 每个图标必须配合圆角 pill 标签，不允许裸图标单独出现

```html
<div class="icon-pill">
  <i class="ph-fill ph-star"></i>
  <span>Score</span>
</div>
```

```css
.icon-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--color-light);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
  border: 2px solid var(--color-primary);
}
```

---

## 二、视觉设计规范 / Visual Design Spec

---

### 2.1 基础设计原则 / Foundational Design Principles

这些原则是游戏 UI/UX 设计的底层逻辑，优先级高于所有具体的视觉规范。当视觉规范与这些原则产生冲突时，以原则为准。

---

#### 奥卡姆剃刀 / Occam's Razor

> **如无必要，勿增实体。能用更少元素解决的问题，不引入更多元素。**

- 每一个出现在屏幕上的元素都必须有明确存在理由，装饰性元素不得干扰信息传达
- 同一信息只出现一次，不在 UI 的多个位置重复展示同一内容
- 当一个组件可以被移除、而用户体验不受影响时，移除它
- 动效和音效必须服务于反馈目的，不为"好看"而添加无意义动画

---

#### 亲密性原则 / Proximity

> **相关的元素在视觉上靠近，不相关的元素拉开距离。距离即关系。**

- 图标与其标签之间的间距不超过 `8px`
- 同一功能组（如分数栏、计时器、生命值）内部间距统一且紧凑（`8px ~ 12px`）
- 不同功能组之间必须有明显的间隔（`≥ 24px`）或用分隔线 / 背景色块区分
- 规则弹窗内，每个段落之间间距 `≥ 16px`，段落内行间距 `1.5 ~ 1.6`
- 按钮的文字与按钮边缘之间必须留有足够内边距（`padding: 12px 24px` 以上），不允许文字紧贴边框

---

#### 视觉层级 / Visual Hierarchy

> **用户的视线是有成本的。最重要的信息必须最先被看到，次要信息退到背景中。**

层级从高到低分为三级：

| 层级 | 内容类型 | 视觉处理 |
|------|---------|---------|
| **L1 首要层** | 核心 CTA、评级结果、当前目标 | 最大字号、最高饱和度、最强对比、居中或视觉重心位置 |
| **L2 次要层** | 分数、进度、计时器、状态显示 | 中等字号、主题色或中性色、顶部信息栏区域 |
| **L3 辅助层** | 规则入口、次要按钮、装饰元素 | 最小字号、低饱和或描边样式、边角位置 |

---

#### CTA 摆放规范 / Call-to-Action Placement

CTA（核心操作按钮）是用户与游戏交互的主要入口，其位置直接影响操作效率和体验流畅度。

**拇指热区原则**：移动端用户单手持机时，拇指自然触达区域集中在屏幕**下半部 60%** 区域，CTA 必须落在此范围内。

```
┌─────────────────────┐ ← 顶部（64px padding）
│  L2 状态信息栏       │   分数 / 进度 / 计时器
│                     │
│                     │
│   游戏主体内容区     │   核心玩法交互区域
│                     │
│                     │
│  ─────────────────  │ ← 屏幕中线（368px）
│                     │
│   ▼ 拇指热区开始    │
│                     │
│  [ 核心 CTA 按钮 ]  │ ← 主操作按钮落点（距底部 100px ~ 180px）
│                     │
└─────────────────────┘ ← 底部（64px padding）
```

**CTA 具体规范**：
- 主 CTA（如"开始游戏"、"确认"、"再来一次"）：宽度占内容区 **60% ~ 80%**，高度 `≥ 52px`，使用 `primary` 色填充，配扁平阴影
- 次要 CTA（如"查看规则"、"退出"）：描边样式而非填充，或缩小至 L3 层级视觉权重
- 同一屏幕内主 CTA **不超过 1 个**，避免用户决策瘫痪
- 危险操作（如退出游戏、放弃本局）必须使用与主 CTA 明显区分的视觉样式，且不得占据拇指热区核心位置
- 评级结算界面的"继续"按钮必须是全局视觉权重最高的元素，位于屏幕下方热区中央

**按钮状态必须完整定义**：

```css
/* 每个 CTA 按钮必须明确定义以下四个状态 */
.btn-primary {
  /* default */
  background: var(--color-primary);
  box-shadow: var(--shadow-flat);
}
.btn-primary:hover {
  /* hover — 桌面端调试用 */
  filter: brightness(1.08);
}
.btn-primary:active {
  /* pressed — 模拟物理按压 */
  box-shadow: var(--shadow-flat-sm);
  transform: translate(2px, 2px);
}
.btn-primary:disabled {
  /* disabled */
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}
```

---

#### 一致性原则 / Consistency

> **相同的操作必须有相同的视觉表现，用户不应该在同一个游戏内学习两套交互语言。**

- 同类按钮在整个游戏内使用统一的尺寸、颜色、圆角、阴影规范
- 同类反馈（加分、扣分、错误提示）在整个游戏内使用统一的动效和音效
- 图标风格统一（全程 Phosphor fill），不混用不同来源或不同样式的图标
- 字体使用严格按照层级规范，不在同一层级内随意切换字体或字重

---

### 2.2 整体风格定义

**核心视觉语言**：以 Kenney 2D Assets 为基准的扁平插画风格。

- ✅ 纯色色块，干净无渐变
- ✅ 清晰的 2~3px 描边（描边色为主色加深版本）
- ✅ 圆润形状，友好活泼
- ✅ 高饱和度配色，对比清晰
- ✅ 轻量投影（只用纯色偏移阴影，如 `box-shadow: 3px 3px 0px var(--color-accent)`）
- ❌ 禁止毛玻璃 / backdrop-filter
- ❌ 禁止渐变（linear-gradient / radial-gradient）
- ❌ 禁止复杂多层阴影
- ❌ 禁止尖锐直角

---

### 2.3 容器与间距规范

```
画布固定尺寸：393px × 736.5px
（固定尺寸适配各机型，不做响应式拉伸）

上下 padding：64px
左右 padding：20px
内容安全区宽度：353px
内容安全区高度：608.5px
```

---

### 2.4 形状语言 / Shape Language

```css
/* 胶囊形按钮 */
border-radius: 999px;

/* 卡片 / 面板 */
border-radius: 16px ~ 24px;

/* 头像 / 圆形徽章 */
border-radius: 50%;

/* 规则：UI 内任何地方不允许出现直角 */
/* 最小 border-radius 不低于 8px */
```

---

### 2.5 描边与阴影规范

```css
/* 标准描边 */
border: 2.5px solid var(--color-accent);

/* 扁平投影（Kenney 风格标志性效果） */
box-shadow: 3px 3px 0px var(--color-accent);

/* 按钮按下状态 */
box-shadow: 1px 1px 0px var(--color-accent);
transform: translate(2px, 2px);

/* 禁止使用模糊阴影（blur 值不得大于 0）*/
```

---

### 2.6 装饰元素规范

- 使用 `✦` `·` `★` `♡` 作为 Unicode 装饰字符分隔符
- 背景可使用简单的纯色几何图形（圆点、短线、小星形）作为底纹，通过 CSS 实现
- 粒子特效使用 Kenney 素材包内的贴图资源，不使用 CSS 动画模拟
---

### 3.2 数值变动反馈规范

游戏内任何数值变化必须同时触发视觉和音效反馈：

**视觉反馈**：
- 数值跳动：`transform: scale(1.3)` → `scale(1.0)`，时长 `200ms`，`ease-out`
- 加分：绿色 `+N` 浮动文字向上飘出消失
- 扣分：红色 `-N` 浮动文字向下飘出消失
- 进度条：`transition: width 300ms ease-in-out`

**音效反馈**（Web Audio API 实现，无需外部音频文件）：
- 加分：高音短促（`C5`，约 80ms）
- 扣分：低音短促（`A3`，约 80ms）
- 评级揭晓：上升音阶

```javascript
// 标准音效生成函数
function playSound(frequency, duration = 80) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration / 1000);
}

// 调用示例
playSound(523);  // C5，加分
playSound(220);  // A3，扣分
```

---

### 3.3 评级结算界面规范

游戏完整结束时依次执行以下动画序列：

```
1. 背景遮罩淡入（300ms）
2. 结算卡片从底部弹出（400ms，ease-out）
3. 评级字母揭晓动画（scale 0 → 1.4 → 1.0，600ms）
4. 粒子特效爆发（S/A 级触发，持续 1500ms）
5. 属性加成说明文字淡入（delay 200ms）
6. 确认按钮淡入（delay 400ms）
```

**评级视觉规范**：

| 等级 | 颜色 | 效果 | 属性文案 |
|------|------|------|---------|
| **S** | `#FFD700` 金色 | 金色粒子爆炸 + 描边脉冲 | `+3 Bonus · Lasts 1 Round` |
|| **A** | `primary` 主题色 | 星星粒子飘散 | `+1 Bonus · Lasts 1 Round` |
|| **B** | `#9CA3AF` 中性灰 | 温和光圈 | `No Change · Lasts 1 Round` |
|| **C** | `#FB7185` 玫红 | 卡片轻微抖动 | `-1 Penalty · Lasts 1 Round` |

---

### 3.4 游戏文案规范（UX Copy）

**核心原则**：客观引导，清晰简洁，不晦涩，不过度煽情。

```
✅ 正确示例：
"Tap the glowing tiles before time runs out."
"Match 3 or more to score points."
"Your result affects the next check — play carefully!"

❌ 错误示例：
"Utilize your cognitive pattern recognition..."  — 过于复杂
"You MUST get S rank or everything is ruined!!!" — 过度煽情
"Click stuff to win."                            — 过于模糊
```

**规则弹窗文案模板**：

```
[Game Title]

Goal
[一句话说明目标]

How to Play
· [操作说明 1]
· [操作说明 2]
· [操作说明 3，可选]

Scoring
★ S Rank — [达成条件]
★ A Rank — [达成条件]
★ B Rank — [达成条件]
★ C Rank — [达成条件]

Tip · [一条友好提示，可选]
```

---

## 四、评级系统与属性联动规范 / Rating & Attribute System

| 等级 | 属性效果 | 持续时长 |
|------|---------|---------|
| **S** | `[指定属性检定值 + 3]` | 持续 1 回合 |
|| **A** | `[指定属性检定值 + 1]` | 持续 1 回合 |
|| **B** | `[指定属性检定值 + 0]` | 持续 1 回合 |
|| **C** | `[指定属性检定值 - 1]` | 持续 1 回合 |

**开发规范**：
- 属性名称由外部剧情节点传入，小游戏本身不硬编码
- 游戏结束时通过回调将评级结果传递给外部系统

```javascript
// 评级结果回调接口
notifyGameComplete({
  rating: "A",        // "S" | "A" | "B" | "C"
  score: 8500,
  attribute: "Charm", // 由外部传入
  modifier: +1        // S:+3 / A:+1 / B:0 / C:-1
});
```

---

## 五、CSS 变量系统 / CSS Custom Properties

在每个游戏文件顶部定义以下 CSS 变量，由 Huemint API 返回值动态写入：

```css
:root {
  /* 由 Huemint API 动态生成，根据场景主题色填入 */
  --color-primary: ;
  --color-primary-rgb: ;     /* 拆分为 r, g, b 用于 rgba() 调用 */
  --color-light: ;
  --color-accent: ;
  --color-neutral: ;

  /* 固定通用色 */
  --color-white: #FFFFFF;
  --color-text-primary: #1F2937;
  --color-text-secondary: #6B7280;
  --color-success: #34D399;
  --color-danger: #F87171;
  --color-gold: #FFD700;

  /* 画布尺寸与间距 */
  --canvas-width: 393px;
  --canvas-height: 736.5px;
  --padding-vertical: 64px;
  --padding-horizontal: 20px;

  /* 字体（标题与点缀字体由 LLM 根据游戏主题从 Google Fonts cute/handwritten 类目中选取） */
  --font-title: /* LLM 选取 */;
  --font-accent: /* LLM 选取 */;
  --font-body: system-ui, -apple-system, sans-serif;

  /* 圆角 */
  --radius-pill: 999px;
  --radius-card: 20px;
  --radius-circle: 50%;

  /* Kenney 风格扁平阴影 */
  --shadow-flat: 3px 3px 0px var(--color-accent);
  --shadow-flat-sm: 2px 2px 0px var(--color-accent);
}
```
