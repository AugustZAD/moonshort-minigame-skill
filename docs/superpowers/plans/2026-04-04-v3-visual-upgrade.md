# V3 视觉升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 12 个 V2 游戏升级为 V3——7 套氛围主题 + 视觉增强（渐变/阴影/动效/描边/光晕）+ 动态取色集成。

**Architecture:** V3 基于 V2 改造。每个 index-v3.html 是独立自包含文件。共享代码（THEMES、applyTheme、extractPalette、动效 token）直接内联在每个文件中（无外部依赖）。Phase 1 做 2 个标��，Phase 2 用并发子代理批量复制。

**Tech Stack:** Phaser 3.60.0, Montserrat 700;900, CSS Variables, vanilla JS

**Spec:** `docs/superpowers/specs/2026-04-04-v3-visual-upgrade-design.md`

---

## File Map

### 新建文件（14 个）
| 文件 | 职责 |
|------|------|
| `games/qte-boss-parry/index-v3.html` | Layout A（VS 对战）标杆 |
| `games/cannon-aim/index-v3.html` | Layout B（独立挑战）标杆 |
| `games/qte-hold-release/index-v3.html` | 批量：Layout A, combat |
| `games/will-surge/index-v3.html` | 批量：Layout A, dark |
| `games/lane-dash/index-v3.html` | 批量：Layout B, energy |
| `games/stardew-fishing/index-v3.html` | 批量：Layout B, ocean |
| `games/red-light-green-light/index-v3.html` | 批量：Layout B, sweet |
| `games/color-match/index-v3.html` | 批量：Layout B, sweet |
| `games/conveyor-sort/index-v3.html` | 批量：Layout B, nature |
| `games/parking-rush/index-v3.html` | 批量：Layout B, nature |
| `games/maze-escape/index-v3.html` | 批量：Layout B, mystery |
| `games/spotlight-seek/index-v3.html` | 批量：Layout B, mystery |
| `scripts/verify-v3.sh` | V3 质检脚本（grep 硬编码 hex、检查必需 CSS 变量） |
| `scripts/v3-shared-blocks.js` | 共享代码块参考（不在运行时使用，仅供复制） |

### 修改文件（2 个）
| 文件 | 修改内容 |
|------|---------|
| `SKILL.md` | 更新 THEMES 定义（5→7 套），更新游戏主题分配表 |
| `design-system/color-strategy.md` | 新增 ocean / energy 主题文档 |

所有新建文件路径前缀：`packs/attribute-archetypes/`

---

## Phase 1: 共享代码块 + 标杆实现

### Task 1: 创建 V3 共享代码块参考文件

**Files:**
- Create: `packs/attribute-archetypes/scripts/v3-shared-blocks.js`

这个文件不在运行时使用，是给后续每个 V3 文件复制粘贴的参考源。

- [ ] **Step 1: 写入 THEMES 定义（7 套完整配色）**

```javascript
// ══ V3 THEMES ══════════════════════════════════════════════════════════════
const THEMES = {
  combat: {
    bg:'#1A1221', primary:'#EC4F99', primaryLight:'#F9A8D4',
    circleTail:'#FFE0F8', playerHp:'#4FECA2', opponentHp:'#EC4F99',
    gold:'#F5C842', strokeDark:'#B03A75'
  },
  mystery: {
    bg:'#0F1729', primary:'#3B82F6', primaryLight:'#93C5FD',
    circleTail:'#DBEAFE', playerHp:'#4FECA2', opponentHp:'#3B82F6',
    gold:'#F5C842', strokeDark:'#2563EB'
  },
  nature: {
    bg:'#0F1F16', primary:'#10B981', primaryLight:'#6EE7B7',
    circleTail:'#D1FAE5', playerHp:'#FBBF24', opponentHp:'#10B981',
    gold:'#F5C842', strokeDark:'#059669'
  },
  dark: {
    bg:'#110E1A', primary:'#8B5CF6', primaryLight:'#C4B5FD',
    circleTail:'#EDE9FE', playerHp:'#4FECA2', opponentHp:'#8B5CF6',
    gold:'#F5C842', strokeDark:'#6D28D9'
  },
  sweet: {
    bg:'#1A1218', primary:'#FB7185', primaryLight:'#FECDD3',
    circleTail:'#FFF1F2', playerHp:'#A78BFA', opponentHp:'#FB7185',
    gold:'#F5C842', strokeDark:'#E11D48'
  },
  ocean: {
    bg:'#0B1620', primary:'#06B6D4', primaryLight:'#67E8F9',
    circleTail:'#CFFAFE', playerHp:'#4FECA2', opponentHp:'#06B6D4',
    gold:'#F5C842', strokeDark:'#0891B2'
  },
  energy: {
    bg:'#1A140E', primary:'#F97316', primaryLight:'#FDBA74',
    circleTail:'#FFF7ED', playerHp:'#4FECA2', opponentHp:'#F97316',
    gold:'#F5C842', strokeDark:'#C2410C'
  }
};
```

- [ ] **Step 2: 写入 applyTheme + hexToRgba + 动态取色**

```javascript
// ══ Theme Application ═══════════════════════════════════════════════════════
function hexToRgba(hex, a) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function hexToInt(hex) {
  return parseInt(hex.slice(1), 16);
}

function applyTheme(T) {
  const s = document.documentElement.style;
  Object.entries(T).forEach(([k,v]) => s.setProperty('--'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()), v));
  [10,20,30,50].forEach(a => s.setProperty('--primary-'+a, hexToRgba(T.primary, a/100)));
  s.setProperty('--white-20','rgba(255,255,255,.20)');
  s.setProperty('--white-30','rgba(255,255,255,.30)');
  s.setProperty('--white-50','rgba(255,255,255,.50)');
  s.setProperty('--black-15','rgba(0,0,0,.15)');
  s.setProperty('--black-25','rgba(0,0,0,.25)');
  document.body.style.background = T.bg;
  document.querySelector('#game-shell').style.background = T.bg;
}

// ══ Dynamic Palette Extraction (Episode scenes) ═════════════════════════════
// 完整的 extractPalette 函数从 design-system/ui-visual-language.md §3.6 复制
// 包含: rgbToHsl, hslToRgb, toHex, colorDist, kmeans, bell, hueBonus, extractPalette

function darken(hex, amount) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  const f = 1 - amount;
  return '#' + [r,g,b].map(c => Math.round(c*f).toString(16).padStart(2,'0')).join('');
}

function paletteToTheme(p) {
  return {
    bg: p.bgDark, primary: p.primary, primaryLight: p.surface,
    circleTail: p.surface, playerHp: p.accent, opponentHp: p.primary,
    gold: '#F5C842', strokeDark: darken(p.primary, 0.25)
  };
}

async function extractFromCover(url) {
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = c.height = 80;
  c.getContext('2d').drawImage(img, 0, 0, 80, 80);
  return extractPalette(c.getContext('2d').getImageData(0,0,80,80));
}

async function resolveTheme(defaultThemeId) {
  if (CTX.coverImage) {
    try {
      const palette = await extractFromCover(CTX.coverImage);
      if (palette) {
        // 质检
        const [,ps,pl] = rgbToHsl(...palette.primary.slice(1).match(/../g).map(h=>parseInt(h,16)));
        if (pl > 0.40 && pl < 0.75 && ps > 0.60) return paletteToTheme(palette);
      }
    } catch(e) { console.warn('Dynamic palette failed:', e); }
  }
  return THEMES[CTX.theme || new URLSearchParams(location.search).get('theme') || defaultThemeId];
}
```

- [ ] **Step 3: 写入 CSS 动效 token 和共享 keyframes**

```css
/* ══ Animation Tokens ═══════════════════════════════════════════════════════ */
:root {
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
  --ease-out: cubic-bezier(.25, 1, .5, 1);
  --ease-in: cubic-bezier(.5, 0, 1, .75);
  --duration-fast: 150ms;
  --duration-normal: 280ms;
  --duration-slow: 450ms;
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes float-up {
  0%   { opacity: 0; transform: translateY(0); }
  30%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-40px); }
}
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 12px 2px var(--primary-20); }
  50%      { box-shadow: 0 0 28px 6px var(--primary-30); }
}
@keyframes deltaPop {
  0%   { opacity: 1; transform: translateY(0); }
  60%  { opacity: 1; transform: translateY(-6px); }
  100% { opacity: 0; transform: translateY(-14px); }
}
```

- [ ] **Step 4: 写入 V3 CSS 升级模板片段（标题栏/按钮/HP/阴影/描边）**

```css
/* ══ V3 Title Bar (gradient + scallop + text-shadow stroke) ══════════════ */
.title-bar {
  background: linear-gradient(180deg, var(--primary-10) 0%, var(--primary) 100%);
}
.title-bar::after {
  background-image: radial-gradient(circle at 12px 0px, var(--primary) 12px, transparent 12px);
}
.title-text {
  font-weight: 900; font-size: 18px; color: #fff;
  text-shadow:
    -3px -3px 0 var(--stroke-dark), 3px -3px 0 var(--stroke-dark),
    -3px  3px 0 var(--stroke-dark), 3px  3px 0 var(--stroke-dark),
     0   -3px 0 var(--stroke-dark), 0    3px 0 var(--stroke-dark),
    -3px    0 0 var(--stroke-dark), 3px    0 0 var(--stroke-dark);
}

/* ══ V3 Candy Button (gradient + white border + glass + hard shadow) ═════ */
.btn-candy {
  border: 2px solid #fff;
  box-shadow: 0 4px 0 0 var(--black-15), inset 0 0 4px 4px var(--white-50);
}
.btn-candy .base {
  background: linear-gradient(180deg, var(--primary-10), var(--primary));
}
.btn-candy:active {
  transform: translateY(4px);
  box-shadow: 0 1px 0 0 var(--black-15), inset 0 0 4px 4px var(--white-50);
}

/* ══ V3 HP Bar (gradient fill + spring transition) ═══════════════════════ */
.hp-fill {
  transition: width var(--duration-normal) var(--ease-spring);
}
.hp-bar.left .hp-fill {
  background: linear-gradient(to right, rgba(var(--player-hp-rgb),0.2), var(--player-hp));
}
.hp-bar.right .hp-fill {
  background: linear-gradient(to left, rgba(var(--opponent-hp-rgb),0.2), var(--opponent-hp));
}

/* ══ V3 Circle Frame (conic gradient + glow pulse) ═══════════════════════ */
.circle-frame {
  background: conic-gradient(from 270deg, var(--primary), var(--primary-light), var(--circle-tail), #fff);
  border: none;
  animation: glow-pulse 3s ease-in-out infinite;
}
.circle-inner {
  background: radial-gradient(circle, #fff, var(--circle-tail));
  box-shadow: inset 0 4px 16px rgba(0,0,0,.12);
}

/* ══ V3 Dialogue (glass panel + drop-shadow) ═════════════════════════════ */
.dialogue {
  background: linear-gradient(180deg, rgba(255,255,255,.06), var(--primary-10));
  border: 1.5px solid var(--white-20);
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.15));
}

/* ══ V3 Score delta colors ═══════════════════════════════════════════════ */
.score-display .delta.plus { color: var(--player-hp); }
.score-display .delta.minus { color: var(--primary); }

/* ══ V3 Stars ═════════════════════════════════════════════════════════════ */
.stars-row .star.filled { color: var(--gold); }

/* ══ V3 Cover Layer (Episode only) ═══════════════════════════════════════ */
#cover-layer {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover; object-position: center;
  opacity: 0.20; z-index: 0; pointer-events: none;
  display: none; /* shown via JS when CTX.coverImage exists */
}
```

- [ ] **Step 5: 提交共享代码块文件**

```bash
git add packs/attribute-archetypes/scripts/v3-shared-blocks.js
git commit -m "feat: add V3 shared code blocks reference (7 themes, applyTheme, extractPalette, CSS tokens)"
```

---

### Task 2: 构建 Layout A 标杆 — qte-boss-parry/index-v3.html

**Files:**
- Source: `packs/attribute-archetypes/games/qte-boss-parry/index-v2.html`
- Create: `packs/attribute-archetypes/games/qte-boss-parry/index-v3.html`
- Reference: `packs/attribute-archetypes/scripts/v3-shared-blocks.js`

这是最重要的任务。V3 标杆将作为所有后续游戏的参考。

- [ ] **Step 1: 复制 V2 为 V3 基础**

```bash
cp packs/attribute-archetypes/games/qte-boss-parry/index-v2.html packs/attribute-archetypes/games/qte-boss-parry/index-v3.html
```

- [ ] **Step 2: 替换 CSS — 移除所有硬编码 hex，改为 CSS 变量**

在 `<style>` 顶部加入动效 token（从 v3-shared-blocks.js 的 CSS 部分复制）。然后对全文件执行以下替换：

| 查找 | 替换为 |
|------|--------|
| `background: #1A1221` | `background: var(--bg)` |
| `background: #EC4F99` (title-bar) | `background: linear-gradient(180deg, var(--primary-10) 0%, var(--primary) 100%)` |
| `color: #EC4F99` | `color: var(--primary)` |
| `border: 2px solid #EC4F99` (btn) | `border: 2px solid #fff` |
| `border: 4px solid #EC4F99` (circle) | 移除，改为 `background: conic-gradient(...)` |
| `background: #EC4F99` (btn .base) | `background: linear-gradient(180deg, var(--primary-10), var(--primary))` |
| `background: linear-gradient(to right, rgba(79,236,162,0.3), #4FECA2)` | `background: linear-gradient(to right, var(--primary-20), var(--player-hp))` |
| `background: linear-gradient(to left, rgba(236,79,153,0.3), #EC4F99)` | `background: linear-gradient(to left, var(--primary-20), var(--opponent-hp))` |
| `color: #4FECA2` (delta plus) | `color: var(--player-hp)` |
| `color: #F5C842` (star) | `color: var(--gold)` |
| `conic-gradient(from 90deg, #EC4F99, #F17BB3, #F6A7CC, #FAD3E6, #FFF)` | `conic-gradient(from 270deg, var(--primary), var(--primary-light), var(--circle-tail), #fff)` |
| `radial-gradient(circle, white, #FFE0F8)` | `radial-gradient(circle, #fff, var(--circle-tail))` |
| `box-shadow: 0 4px 0 rgba(0,0,0,0.15)` (btn) | `box-shadow: 0 4px 0 0 var(--black-15), inset 0 0 4px 4px var(--white-50)` |
| `transition: width 0.3s ease` (hp) | `transition: width var(--duration-normal) var(--ease-spring)` |

加入 `.title-text` 的 text-shadow 8 方向描边。
加入 `.circle-frame` 的 `animation: glow-pulse 3s ease-in-out infinite`。
加入 `.btn-candy:active` 的 `transform: translateY(4px)` + 收缩阴影。
加入 `#cover-layer` 样式（display:none 默认隐藏）。

- [ ] **Step 3: 替换 JS — 加入 THEMES + applyTheme + resolveTheme**

在 `<script>` 开头（CTX 定义之后）插入：
1. 完整 THEMES 对象（7 套）
2. `hexToRgba()` + `hexToInt()` + `applyTheme()`
3. `darken()` + `paletteToTheme()` + `extractFromCover()` + `resolveTheme()`
4. 完整 `extractPalette()` 函数（从 `ui-visual-language.md` §3.6 复制，包含 `rgbToHsl`, `hslToRgb`, `toHex`, `colorDist`, `kmeans`, `bell`, `hueBonus`）

在 Phaser config 初始化之前加入：
```javascript
(async () => {
  const theme = await resolveTheme('combat');
  applyTheme(theme);
  // 封面图层
  if (CTX.coverImage) {
    const cover = document.createElement('img');
    cover.id = 'cover-layer';
    cover.src = CTX.coverImage;
    cover.style.display = 'block';
    document.getElementById('game-shell').prepend(cover);
  }
  // 启动 Phaser
  const game = new Phaser.Game(config);
})();
```

移除旧的硬编码 Phaser 初始化（`new Phaser.Game(config)` 不在 async 外部）。

- [ ] **Step 4: 升级 Phaser 绘制 — 双层光晕 + 高光**

在 GameScene 中找到所有 `graphics.fillCircle()` / `graphics.fillRect()` 绘制游戏对象的地方。对于目标/提示对象，包裹为双层光晕模式：

```javascript
// V2: graphics.fillStyle(0xEC4F99, 1); graphics.fillCircle(x, y, r);
// V3:
const pInt = hexToInt(theme.primary);
graphics.fillStyle(pInt, 0.10); graphics.fillCircle(x, y, r + 14);
graphics.fillStyle(pInt, 0.28); graphics.fillCircle(x, y, r + 6);
graphics.fillStyle(pInt, 1.0);  graphics.fillCircle(x, y, r);
graphics.fillStyle(0xffffff, 0.65); graphics.fillCircle(x - r*0.3, y - r*0.3, r*0.35);
```

- [ ] **Step 5: 在 DOM 中加入 cover-layer img 标签**

在 `<div id="game-shell">` 的第一个子元素前加入：
```html
<img id="cover-layer" src="" alt="">
```

- [ ] **Step 6: 浏览器验证**

在浏览器中打开 `index-v3.html`，验证：
- 默认 combat 主题正确渲染
- 加 `?theme=mystery` 后全部颜色变为蓝色系
- 加 `?theme=energy` 后全部颜色变为橙色系
- 标题栏有渐变 + 描边
- 按钮有 glass 层 + 白边 + 硬边阴影
- HP 条有渐变填充
- 圆圈有呼吸光晕
- START → 游戏 → 评级 → CONTINUE 流程完整

- [ ] **Step 7: 提交标杆 A**

```bash
git add packs/attribute-archetypes/games/qte-boss-parry/index-v3.html
git commit -m "feat: V3 benchmark Layout A — qte-boss-parry with 7 themes, visual upgrade, dynamic extraction"
```

---

### Task 3: 构建 Layout B 标杆 — cannon-aim/index-v3.html

**Files:**
- Source: `packs/attribute-archetypes/games/cannon-aim/index-v2.html`
- Create: `packs/attribute-archetypes/games/cannon-aim/index-v3.html`
- Reference: `packs/attribute-archetypes/games/qte-boss-parry/index-v3.html` (共享代码块)

- [ ] **Step 1: 复制 V2 为 V3 基础**

```bash
cp packs/attribute-archetypes/games/cannon-aim/index-v2.html packs/attribute-archetypes/games/cannon-aim/index-v3.html
```

- [ ] **Step 2: 从标杆 A 复制共享 JS 代码块**

从 `qte-boss-parry/index-v3.html` 复制以下代码到 cannon-aim V3 的 `<script>` 中：
- THEMES 对象（7 套完整）
- `hexToRgba()`, `hexToInt()`, `applyTheme()`
- `darken()`, `paletteToTheme()`, `extractFromCover()`, `resolveTheme()`
- 完整 `extractPalette()` 函数链

修改默认主题为 `'energy'`：
```javascript
const theme = await resolveTheme('energy');
```

- [ ] **Step 3: 替换 CSS — 与 Task 2 Step 2 相同的模式**

cannon-aim V2 已部分使用 CSS 变量（`var(--primary)` 等），但仍有硬编码。执行：
- 加入动效 token（:root 变量 + keyframes）
- 标题栏改为渐变 + 描边
- 按钮改为渐变 + 白边 + glass + 硬边阴影
- 圆形/进度条改为 CSS 变量
- 所有残留硬编码 hex 替换为变量
- 加入 `#cover-layer` 样式
- 加入 `glow-pulse` 动画到相关元素

- [ ] **Step 4: 升级 Phaser 绘制 — 目标球双层光晕 + 弹道线双层**

cannon-aim 有：目标球、弹道线、炮管。
- 目标球：双层光晕 + 高光（同 Task 2 Step 4）
- 弹道线：双层叠加（底层 14px 深色，顶层 5px primary alpha 0.8）
- 炮管：同弹道线模式

- [ ] **Step 5: 在 DOM 中加入 cover-layer img 标签**

与 Task 2 Step 5 相同。

- [ ] **Step 6: 浏览器验证**

- 默认 energy 主题（橙色系）正确渲染
- `?theme=combat` 切换为品红
- `?theme=ocean` 切换为青色
- 所有 V3 视觉效果生效
- 游戏完整流程正常

- [ ] **Step 7: 提交标杆 B**

```bash
git add packs/attribute-archetypes/games/cannon-aim/index-v3.html
git commit -m "feat: V3 benchmark Layout B — cannon-aim with energy theme, visual upgrade, dynamic extraction"
```

---

### Task 4: 创建 V3 质检脚本

**Files:**
- Create: `packs/attribute-archetypes/scripts/verify-v3.sh`

- [ ] **Step 1: 写入质检脚本**

```bash
#!/bin/bash
# V3 Quality Check Script
# Usage: bash scripts/verify-v3.sh games/*/index-v3.html

PASS=0
FAIL=0

for f in "$@"; do
  echo "━━━ Checking: $f ━━━"
  errors=0

  # 1. 检查 THEMES 对象存在
  if ! grep -q "const THEMES" "$f"; then
    echo "  ✗ Missing THEMES object"
    errors=$((errors+1))
  fi

  # 2. 检查 7 套主题
  for theme in combat mystery nature dark sweet ocean energy; do
    if ! grep -q "$theme:" "$f"; then
      echo "  ✗ Missing theme: $theme"
      errors=$((errors+1))
    fi
  done

  # 3. 检查 applyTheme 函数
  if ! grep -q "function applyTheme" "$f"; then
    echo "  ✗ Missing applyTheme function"
    errors=$((errors+1))
  fi

  # 4. 检查动效 token
  if ! grep -q "\-\-ease-spring" "$f"; then
    echo "  ✗ Missing --ease-spring token"
    errors=$((errors+1))
  fi

  # 5. 检查 text-shadow 描边
  if ! grep -q "text-shadow" "$f"; then
    echo "  ✗ Missing text-shadow stroke"
    errors=$((errors+1))
  fi

  # 6. 检查硬编码旧主题色（不应出现在 CSS/style 中）
  # 允许在 THEMES 对象定义中出现
  OLD_COLORS="#EC4F99 #F472B6 #4FECA2 #1A1221"
  for color in $OLD_COLORS; do
    # 统计出现次数，减去 THEMES 定义中的合法出现
    count=$(grep -o "$color" "$f" | wc -l)
    themes_count=$(sed -n '/const THEMES/,/^};/p' "$f" | grep -o "$color" | wc -l)
    outside=$((count - themes_count))
    if [ "$outside" -gt 0 ]; then
      echo "  ⚠ Hardcoded $color found $outside times outside THEMES"
    fi
  done

  # 7. 检查 cover-layer
  if ! grep -q "cover-layer" "$f"; then
    echo "  ✗ Missing cover-layer support"
    errors=$((errors+1))
  fi

  # 8. 检查 resolveTheme
  if ! grep -q "resolveTheme" "$f"; then
    echo "  ✗ Missing resolveTheme (dynamic extraction)"
    errors=$((errors+1))
  fi

  if [ "$errors" -eq 0 ]; then
    echo "  ✓ ALL CHECKS PASSED"
    PASS=$((PASS+1))
  else
    echo "  ✗ $errors issues found"
    FAIL=$((FAIL+1))
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASS: $PASS  FAIL: $FAIL  TOTAL: $(($PASS+$FAIL))"
```

- [ ] **Step 2: 在两个标杆上运行质检**

```bash
bash packs/attribute-archetypes/scripts/verify-v3.sh \
  packs/attribute-archetypes/games/qte-boss-parry/index-v3.html \
  packs/attribute-archetypes/games/cannon-aim/index-v3.html
```

预期输出：两个文件都 PASS。

- [ ] **Step 3: 提交质检脚本**

```bash
git add packs/attribute-archetypes/scripts/verify-v3.sh
git commit -m "feat: add V3 quality check script"
```

---

## Phase 2: 批量转换（10 个游戏）

### Task 5: 批量转换 Agent-A — qte-hold-release + will-surge

**Files:**
- Source: `games/qte-hold-release/index-v2.html`, `games/will-surge/index-v2.html`
- Create: `games/qte-hold-release/index-v3.html`, `games/will-surge/index-v3.html`
- Reference: `games/qte-boss-parry/index-v3.html` (Layout A 标杆)

两个都是 Layout A（VS 对战），参考 qte-boss-parry V3 标杆。

- [ ] **Step 1: 对每个游戏执行 V2→V3 转换**

对每个游戏重复以下步骤（与 Task 2 相同模式）：
1. 复制 V2 为 V3 基础
2. 从标杆复制共享 JS 代码块（THEMES + applyTheme + extractPalette 全链）
3. 替换 CSS 中所有硬编码 hex → 变量
4. 加入动效 token + keyframes
5. 标题栏渐变 + 描边
6. 按钮渐变 + 白边 + glass + 硬边阴影
7. HP 条渐变 + spring 过渡
8. 圆形 conic gradient + glow-pulse
9. 加入 cover-layer
10. Phaser 游戏对象双层光晕（如适用）

默认主题：
- qte-hold-release: `resolveTheme('combat')`
- will-surge: `resolveTheme('dark')`

- [ ] **Step 2: 浏览器验证两个游戏**
- [ ] **Step 3: 运行 verify-v3.sh**
- [ ] **Step 4: 提交**

```bash
git add packs/attribute-archetypes/games/qte-hold-release/index-v3.html \
        packs/attribute-archetypes/games/will-surge/index-v3.html
git commit -m "feat: V3 batch A — qte-hold-release (combat), will-surge (dark)"
```

---

### Task 6: 批量转换 Agent-B — lane-dash + stardew-fishing + red-light-green-light

**Files:**
- Source: 3 个 V2 文件
- Create: 3 个 V3 文件
- Reference: `games/cannon-aim/index-v3.html` (Layout B 标杆)

全部 Layout B，参考 cannon-aim V3 标杆。

默认主题：
- lane-dash: `resolveTheme('energy')`
- stardew-fishing: `resolveTheme('ocean')`
- red-light-green-light: `resolveTheme('sweet')`

- [ ] **Step 1: 对每个游戏执行 V2→V3 转换**（同 Task 5 Step 1 模式，但参考 Layout B 标杆）
- [ ] **Step 2: 浏览器验证三个游戏**
- [ ] **Step 3: 运行 verify-v3.sh**
- [ ] **Step 4: 提交**

```bash
git add packs/attribute-archetypes/games/lane-dash/index-v3.html \
        packs/attribute-archetypes/games/stardew-fishing/index-v3.html \
        packs/attribute-archetypes/games/red-light-green-light/index-v3.html
git commit -m "feat: V3 batch B — lane-dash (energy), stardew-fishing (ocean), red-light-green-light (sweet)"
```

---

### Task 7: 批量转换 Agent-C — color-match + conveyor-sort + parking-rush

**Files:**
- Source: 3 个 V2 文件
- Create: 3 个 V3 文件
- Reference: `games/cannon-aim/index-v3.html` (Layout B 标杆)

默认主题：
- color-match: `resolveTheme('sweet')`
- conveyor-sort: `resolveTheme('nature')`
- parking-rush: `resolveTheme('nature')`

- [ ] **Step 1: 对每个游戏执行 V2→V3 转换**
- [ ] **Step 2: 浏览器验证三个游戏**
- [ ] **Step 3: 运行 verify-v3.sh**
- [ ] **Step 4: 提交**

```bash
git add packs/attribute-archetypes/games/color-match/index-v3.html \
        packs/attribute-archetypes/games/conveyor-sort/index-v3.html \
        packs/attribute-archetypes/games/parking-rush/index-v3.html
git commit -m "feat: V3 batch C — color-match (sweet), conveyor-sort (nature), parking-rush (nature)"
```

---

### Task 8: 批量转换 Agent-D — maze-escape + spotlight-seek

**Files:**
- Source: 2 个 V2 文件
- Create: 2 个 V3 文件
- Reference: `games/cannon-aim/index-v3.html` (Layout B 标杆)

默认主题：
- maze-escape: `resolveTheme('mystery')`
- spotlight-seek: `resolveTheme('mystery')`

- [ ] **Step 1: 对每个游戏执行 V2→V3 转换**
- [ ] **Step 2: 浏览器验证两个游戏**
- [ ] **Step 3: 运行 verify-v3.sh**
- [ ] **Step 4: 提交**

```bash
git add packs/attribute-archetypes/games/maze-escape/index-v3.html \
        packs/attribute-archetypes/games/spotlight-seek/index-v3.html
git commit -m "feat: V3 batch D — maze-escape (mystery), spotlight-seek (mystery)"
```

---

## Phase 3: 文档更新 + 全量验证

### Task 9: 更新 SKILL.md — 主题定义 5→7 套

**Files:**
- Modify: `packs/attribute-archetypes/SKILL.md`

- [ ] **Step 1: 更新 THEMES 表格和定义**

在 SKILL.md 的「配色系统」章节：
- 将 5 套 THEMES 表格更新为 7 套（加入 ocean + energy）
- 将 THEMES JS 对象定义更新为 7 套完整版
- 将游戏主题分配表更新（5 个游戏换主题）
- 更新 sweet 主色从 #F472B6 → #FB7185

- [ ] **Step 2: 提交**

```bash
git add packs/attribute-archetypes/SKILL.md
git commit -m "docs: update SKILL.md with 7 themes and V3 game reassignments"
```

---

### Task 10: 全量验证

**Files:**
- All 12 `index-v3.html` files

- [ ] **Step 1: 运行质检脚本覆盖全部 12 个文件**

```bash
bash packs/attribute-archetypes/scripts/verify-v3.sh packs/attribute-archetypes/games/*/index-v3.html
```

预期：PASS: 12  FAIL: 0

- [ ] **Step 2: 手动浏览器抽检 3-4 个游戏**

分别用不同主题参数打开：
```
games/qte-boss-parry/index-v3.html?theme=mystery
games/cannon-aim/index-v3.html?theme=combat
games/stardew-fishing/index-v3.html  (默认 ocean)
games/will-surge/index-v3.html  (默认 dark)
```

验证每个都能正确切换颜��，完整流程可玩。

- [ ] **Step 3: 最终提交（如有修复）**

```bash
git add -A
git commit -m "fix: V3 final verification fixes"
```
