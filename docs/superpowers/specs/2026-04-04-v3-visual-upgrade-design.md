# V3 视觉升级设计文档

> 日期: 2026-04-04
> 范围: 12 个游戏 V2→V3 视觉升级 + 配色系统重构 + 动态取色集成

---

## 1. 目标

将 12 个 V2 游戏升级为 V3，实现三大改进：

1. **配色系统重构** — 5→7 套氛围主题，修复色相冲突，填补暖色/青色空白
2. **视觉品质增强** — 渐变/阴影/动效/描边/光晕全面 token 化
3. **动态取色集成** — Episode 剧情嵌入场景从封面图自动提色

---

## 2. 配色系统：7 套氛围主题

### 2.1 完整 THEMES 定义

```javascript
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

### 2.2 新增字段说明

| 字段 | 用途 |
|------|------|
| `strokeDark` | text-shadow 8 方向描边色（主色的暗变体） |

启动时从 THEMES 对象自动生成的派生变量：
- `--primary-10` / `--primary-20` / `--primary-30` / `--primary-50` — 透明度变体
- `--white-20` / `--white-30` / `--white-50` — 固定白色变体
- `--black-15` / `--black-25` — 固定黑色变体

### 2.3 游戏主题重新分配

| 游戏 | V2 主题 | V3 主题 | 变化 |
|------|---------|---------|------|
| qte-boss-parry | combat | combat | — |
| qte-hold-release | combat | combat | — |
| will-surge | dark | dark | — |
| maze-escape | mystery | mystery | — |
| spotlight-seek | mystery | mystery | — |
| conveyor-sort | nature | nature | — |
| parking-rush | nature | nature | — |
| color-match | sweet | **sweet (重构)** | 主色 #F472B6→#FB7185，辅色→薰衣紫 |
| red-light-green-light | sweet | **sweet (重构)** | 同上 |
| stardew-fishing | nature | **ocean (新)** | 钓鱼归水系 |
| cannon-aim | combat | **energy (新)** | 动作射击≠VS对战 |
| lane-dash | combat | **energy (新)** | 高速闪避≠VS对战 |

5 个游戏需要换主题，7 个不变。

### 2.4 配色设计原则

- **背景必须带色相温度** — 禁止纯黑 #000/#111，每套 bg 都带主色色相的极深色
- **playerHp 避免同色系** — nature 主色是绿，playerHp 改为琥珀 #FBBF24；sweet 主色是玫瑰红，playerHp 改为薰衣紫 #A78BFA
- **gold 统一 #F5C842** — 所有主题共享，星星评级和金币用
- **色相间距** — 7 个主色覆盖色轮 325° 弧度，最小间距 17°（sweet 350° vs combat 333°），平均 46°

---

## 3. V3 视觉增强规范

以下改动应用于全部 12 个游戏的 V3 版本。

### 3.1 CSS 变量 Token 化

V2 现状：硬编码 hex 出现 30+ 次/文件。
V3 要求：**零硬编码 hex**，全部使用 CSS 变量。

启动时 JS 写入：
```javascript
function hexToRgba(hex, a) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function applyTheme(T) {
  const s = document.documentElement.style;
  // camelCase → kebab: primaryLight → --primary-light, strokeDark → --stroke-dark
  Object.entries(T).forEach(([k,v]) => s.setProperty('--'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()), v));
  // 透明度变体
  [10,20,30,50].forEach(a => s.setProperty(`--primary-${a}`, hexToRgba(T.primary, a/100)));
  // 固定色
  s.setProperty('--white-20','rgba(255,255,255,.20)');
  s.setProperty('--white-30','rgba(255,255,255,.30)');
  s.setProperty('--white-50','rgba(255,255,255,.50)');
  s.setProperty('--black-15','rgba(0,0,0,.15)');
  s.setProperty('--black-25','rgba(0,0,0,.25)');
}
```

### 3.2 渐变配方

所有组件从纯色改为渐变：

| 组件 | V2 | V3 |
|------|-----|-----|
| 标题栏 | `background: var(--primary)` | `background: linear-gradient(180deg, var(--primary-10) 0%, var(--primary) 100%)` |
| HP 条 | 纯色 `#4FECA2` | `linear-gradient(90deg, rgba(playerHp,0.2), var(--player-hp))` |
| 按钮 base | 纯色 `var(--primary)` | `linear-gradient(180deg, var(--primary-10), var(--primary))` |
| 按钮边框 | `border: 2px solid var(--primary)` | `border: 2px solid #fff`（渐变背景配白边） |
| 圆形外环 | `border: 4px solid var(--primary)` | `background: conic-gradient(from 270deg, var(--primary), var(--primary-light), var(--circle-tail), #fff)` |
| 圆形内区 | `background: radial-gradient(circle, white, var(--circle-tail))` | 保持不变（已正确） |
| 玻璃面板 | 不存在 | `linear-gradient(180deg, rgba(255,255,255,.06), var(--primary-10)); border: 1.5px solid var(--white-20)` |

### 3.3 阴影系统

```css
/* S-01 按钮标准 */
box-shadow: 0 4px 0 0 var(--black-15), inset 0 0 4px 4px var(--white-50);

/* S-02 按钮按下 */
box-shadow: 0 1px 0 0 var(--black-15), inset 0 0 4px 4px var(--white-50);
transform: translateY(4px);

/* S-03 圆圈呼吸光晕 */
box-shadow: 0 0 20px 2px var(--primary-30);

/* S-04 圆形内深度 */
box-shadow: inset 0 4px 16px rgba(0,0,0,.12);

/* S-05 对话气泡 */
filter: drop-shadow(0 2px 4px rgba(0,0,0,.15));
```

关键规则：**游戏按钮外阴影 blur 必须为 0（硬边 = 游戏感）**。

### 3.4 动效 Token

```css
:root {
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
  --ease-out: cubic-bezier(.25, 1, .5, 1);
  --ease-in: cubic-bezier(.5, 0, 1, .75);
  --duration-fast: 150ms;
  --duration-normal: 280ms;
  --duration-slow: 450ms;
}
```

必选动效：
- 按钮 active: `translateY(4px)` + shadow 收缩，`--duration-fast`
- HP 条变化: `transition: width var(--duration-normal) var(--ease-spring)`
- 元素出现: `@keyframes pop-in { from { opacity:0; transform:scale(.85) } to { opacity:1; transform:scale(1) } }`
- 分数上浮: `@keyframes float-up`（0→30%: opacity 0→1, 100%: opacity 0, translateY -40px）
- 圆圈呼吸: `@keyframes glow-pulse` 3s 周期
- 星星展开: 依次 delay 80ms/颗

### 3.5 文字描边

标题栏文字使用 text-shadow 8 方向描边：
```css
.title-text {
  font-weight: 900; font-size: 18px; color: #fff;
  text-shadow:
    -3px -3px 0 var(--stroke-dark), 3px -3px 0 var(--stroke-dark),
    -3px  3px 0 var(--stroke-dark), 3px  3px 0 var(--stroke-dark),
     0   -3px 0 var(--stroke-dark), 0    3px 0 var(--stroke-dark),
    -3px    0 0 var(--stroke-dark), 3px    0 0 var(--stroke-dark);
}
```

禁止使用 `-webkit-text-stroke`。

### 3.6 Phaser Canvas 绘制增强

游戏对象升级为双层光晕 + 高光：
```javascript
// 外圈光晕
graphics.fillStyle(primaryInt, 0.10);
graphics.fillCircle(x, y, radius + 14);
// 内圈光晕
graphics.fillStyle(primaryInt, 0.28);
graphics.fillCircle(x, y, radius + 6);
// 实体
graphics.fillStyle(primaryInt, 1.0);
graphics.fillCircle(x, y, radius);
// 高光（左上角 35%）
graphics.fillStyle(0xffffff, 0.65);
graphics.fillCircle(x - radius*0.3, y - radius*0.3, radius * 0.35);
```

粒子效果标准参数：count 8-16, speed 80-200px, size 3-7→0.2, duration 400-600ms。

### 3.7 间距与字体

- 间距: 4px 网格（4/8/12/16/20/24/32/48）
- 字号: 12-64px，只用 4px 倍数（12/14/16/18/20/24/28/32/40/48/64）
- 字重: 只用 700/900（标题 900，正文/按钮 700）
- 字体: Montserrat 700;900

---

## 4. 动态取色集成

### 4.1 运行时逻辑

```javascript
async function resolveTheme() {
  // 优先级 1: 封面图动态提色（Episode 场景）
  if (CTX.coverImage) {
    try {
      const palette = await extractFromCover(CTX.coverImage);
      if (palette) return paletteToTheme(palette);
    } catch(e) { console.warn('Dynamic palette failed:', e); }
  }
  // 优先级 2: 静态预设
  return THEMES[CTX.theme || new URLSearchParams(location.search).get('theme') || 'combat'];
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

function paletteToTheme(p) {
  return {
    bg: p.bgDark, primary: p.primary, primaryLight: p.surface,
    circleTail: p.surface, playerHp: p.accent, opponentHp: p.primary,
    gold: '#F5C842', strokeDark: darken(p.primary, 0.25)
  };
}
```

### 4.2 质检与 Fallback

提取的调色板必须通过质检，否则回退静态预设：

| 检查项 | 阈值 | 失败处理 |
|--------|------|---------|
| primary 亮度 | 40% < L < 75% | fallback 到静态 |
| primary 饱和度 | S > 60% | fallback 到静态 |
| surface 亮度 | L > 80% | fallback 到静态 |
| text 亮度 | L < 30% | fallback 到静态 |

### 4.3 参考实现

完整 `extractPalette()` 算法（K-Means + 年轻感评分 + Fallback 瀑布）位于：
`packs/attribute-archetypes/design-system/ui-visual-language.md` §3.6

---

## 5. 执行计划

### Phase 1: 标杆实现（2 个文件）

1. **qte-boss-parry/index-v3.html** — Layout A（VS 对战）标杆
   - 应用全部 V3 视觉规范
   - 集成 7 套 THEMES + 动态取色
   - 作为所有 Layout A 游戏的参考

2. **cannon-aim/index-v3.html** — Layout B（独立挑战）标杆
   - 使用 energy 主题
   - 应用全部 V3 视觉规范
   - 作为所有 Layout B 游戏的参考

### Phase 2: 批量转换（10 个文件）

用并发子代理，每个处理 2-3 个游戏：

| 批次 | 游戏 | 主题 | 参考标杆 |
|------|------|------|---------|
| Agent-A | qte-hold-release, will-surge | combat, dark | qte-boss-parry V3 |
| Agent-B | lane-dash, stardew-fishing, red-light-green-light | energy, ocean, sweet | cannon-aim V3 |
| Agent-C | color-match, conveyor-sort, parking-rush | sweet, nature, nature | cannon-aim V3 |
| Agent-D | maze-escape, spotlight-seek | mystery, mystery | cannon-aim V3 |

### Phase 3: 验证

每个 V3 文件必须通过：
- [ ] `?theme=X` 切换后全部颜色跟随变化（X = 该游戏的默认主题）
- [ ] START → 游戏 → 评级 → CONTINUE 完整流程
- [ ] 零硬编码 hex（grep 扫描）
- [ ] 按钮有 glass 层 + 硬边阴影
- [ ] HP 条有渐变 + spring 弹性
- [ ] 标题有 text-shadow 描边
- [ ] 游戏对象有双层光晕（如适用）
- [ ] UI 质检 Checklist 全部通过

---

## 6. 文件约定

```
games/<game-id>/
  index.html        # V1 原版（纯 Phaser）
  index-v2.html     # V2 混合架构版本
  index-v3.html     # V3 视觉升级版本（本次产出）
```

V3 基于 V2 改造，不动 V1 和 V2。

---

## 7. 不做的事情

- 不改游戏玩法逻辑
- 不改 UX 布局结构（按钮位置、交互区域不变）
- 不改结算 payload 格式
- 不改音效系统
- 不新增游戏
