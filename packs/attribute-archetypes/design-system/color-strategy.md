# 取色策略 — Attribute Archetypes 设计系统

## 双层颜色模型

UI 分为两个独立的颜色层，规则各不相同。

---

## 第一层 — Shell 层（始终品红色，不可覆盖）

Shell 层包裹每个游戏，与 MobAI App 品牌一致。
Shell 元素：剧集标题栏、VS 头部、对话气泡边框、主按钮（START / CONTINUE）、
UNLOCK 按钮（与主按钮相同糖果风格）。

**Shell 主色：`#EC4F99` — 硬编码，不被 CTX.primaryColor 或属性主题替换。**

| Shell 色彩令牌 | Hex 值 | 用途 |
|----------------|--------|------|
| `SHELL_PRIMARY` | `#EC4F99` | 标题栏填充、主按钮主体、VS 文字 |
| `SHELL_WHITE` | `#FFFFFF` | 对话气泡背景、头像圆圈背景 |
| `SHELL_GREEN` | `#4FECA2` | 玩家 HP 条填充渐变 |
| `SHELL_GOLD` | `#F5C842` | S 评级字母、金色角落装饰 |

```javascript
// 在每个游戏文件顶部添加（PALETTE 块之后）
const SHELL = {
  primary:       0xEC4F99,  primaryHex:     '#EC4F99',
  white:         0xFFFFFF,
  green:         0x4FECA2,  greenHex:       '#4FECA2',
  gold:          0xF5C842,
};
```

---

## 第二层 — 游戏内容层（属性主题色）

游戏内容区域（y = CONTENT_TOP 及以下）使用属性主题色。
包括：提示圈环、游戏内血量条填充、计时器条、连击显示、粒子、分数反馈、背景点阵。

| 属性 | 代码 | 主色 | 辅色 | 背景底色 |
|------|------|------|------|----------|
| 身手 ATK | `ATK` | `#FF6B9D` | `#FF9B5E` | `#FAF0E6` |
| 意志 WIL | `WIL` | `#8B5CF6` | `#6D28D9` | `#F5F0FA` |
| 智慧 INT | `INT` | `#3B82F6` | `#0EA5E9` | `#EFF6FF` |
| 魅力 CHA | `CHA` | `#F472B6` | `#EC4899` | `#FDF2F8` |

主题通过 `CTX.attribute` 或 URL 参数 `attribute` 解析。

---

## Shell vs 游戏层判定表

| 元素 | 所属层 | 颜色来源 |
|------|--------|----------|
| 剧集标题栏 | Shell | `SHELL.primary` |
| VS 头部卡片背景 | Shell | 深色背景 `#1A1221` |
| 头像圆圈 — 玩家/对手 | Shell | `SHELL.white` 白色填充，无彩色环 |
| HP 条 — 玩家 | Shell | `linear-gradient #4FECA2`（绿色渐变） |
| HP 条 — 对手 | Shell | `linear-gradient #EC4F99`（品红渐变） |
| HP 条边框 | Shell | 2px `#FFFFFF` 白色边框 |
| HP 条尺寸 | Shell | 163×24 px, border-radius:100px |
| 对话气泡背景 | Shell | `SHELL.white` |
| 对话气泡尺寸 | Shell | 228×64 px, border-radius:12px |
| 对话气泡阴影 | Shell | `drop-shadow(0px 2px 4px rgba(0,0,0,0.15))` |
| 对话气泡字体 | Shell | Montserrat Bold 14px（非 Patrick Hand） |
| 主按钮（START / CONTINUE） | Shell | `SHELL.primary` 系列（糖果材质） |
| UNLOCK 按钮 | Shell | 与主按钮相同糖果材质（非幽灵按钮） |
| 提示圈轨道 | 游戏 | `PALETTE.trackBg` |
| 提示圈环 | 游戏 | `PALETTE.primary`（属性色） |
| 计时器条 | 游戏 | 绿 → `#FFB347` → `#FF4D6A`（非属性色） |
| 游戏内 HP 条 | 游戏 | `PALETTE.primary` / `PALETTE.secondary` |
| 分数增量 "+N" | 游戏 | `#4FECA2`（始终） |
| 分数减量 "−N" | 游戏 | `#FF4D6A`（始终） |
| 粒子 | 游戏 | `PALETTE.primary` / `PALETTE.accentGold` |
| 画布背景 | 游戏 | `#1A1221`（深色暗紫） |
| 点阵 | 游戏 | `PALETTE.primary` @ 0.05 alpha |
| 连击文字 | 游戏 | `PALETTE.primary` |

---

## 按钮材质（糖果 / 光泽风格）

START 和 UNLOCK 按钮使用相同的 4 层糖果材质，不是 3-stop 渐变：

```
图层（从底到顶）：
  1. 基色层 — SHELL.primary (#EC4F99) 纯色填充
  2. 玻璃层 — rgba(255,255,255,0.3) 叠加
  3. 高光带 — 白色条纹，顶部 30%
  4. 内发光 — 微弱白色边缘光
```

按钮边框：2px #EC4F99, border-radius:24px
按钮投影：`0 4px 0 rgba(0,0,0,0.15)`

---

## 渐变规则

**使用渐变的场景：**
1. HP 条填充 — 玩家：`linear-gradient(180deg, rgba(79,236,162,0.1) 0%, #4FECA2 100%)`
2. HP 条填充 — 对手：`linear-gradient(180deg, rgba(236,79,153,0.1) 0%, #EC4F99 100%)`
3. 主圆圈外环 — `conic-gradient(from 90deg, #EC4F99, #F17BB3, #F6A7CC, #FAD3E6, #FFF)`
4. 主圆圈内部 — `radial-gradient(white, #FFE0F8)`
5. （可选）评级字母区域 — 非常微弱的径向发光

**使用纯色的场景：**
1. 画布背景 — 纯色 `#1A1221`
2. 对话气泡 — 纯色 `SHELL.white`
3. 点阵圆点 — 纯色 `PALETTE.primary` @ 低透明度

**经验法则：** 交互元素 → 渐变；结构性/信息性元素 → 纯色。

---

## 关键尺寸（来自 Figma CSS）

| 元素 | 尺寸 | Phaser Y 坐标（Figma Y − 54） |
|------|------|-------------------------------|
| 头像圆圈 | 72×72 px, 白色填充, border-radius:100px | 82 |
| VS 文字 | Montserrat 800, 40px | 98 |
| 角色名称 | Montserrat 700, 14px | 134 |
| HP 条 | 163×24 px, 2px 白边, border-radius:100px | 162 |
| 对话气泡 | 228×64 px, border-radius:12px | 202 |
| 主圆圈 | 280×280 px, 居中 | 250（圆心 390） |
| START 按钮 | 糖果材质 | 578 |
| UNLOCK 按钮 | 糖果材质（同 START） | 664 |

**Figma → Phaser 坐标转换：** Phaser Y = Figma Y − 54

---

## 透明度表

| 用途 | Alpha 值 |
|------|----------|
| 背景点阵 | 0.05（不超过 0.08） |
| 对话气泡阴影 | `rgba(0,0,0,0.15)` |
| 模态遮罩 | 0.55 |
| 分数反馈文字 | 1.0（始终不透明） |
| 按钮玻璃层 | 0.30 |
| HP 条高光 | 0.40 |

---

## 禁止做法

- ❌ 不要将 `CTX.primaryColor` 用于 Shell 元素
- ❌ 不要从 Huemint 或任何外部 API 获取颜色
- ❌ 不要将 `PALETTE.bgBase` 用于 Shell 元素背景
- ❌ 不要将属性主题色混入 Shell 按钮
- ❌ 不要在 `ATTR_THEMES` 块之外硬编码属性颜色
- ❌ Shell 主色只能是 `#EC4F99`，不是旧版 `#FF6B9D`
- ❌ UNLOCK 按钮不是幽灵按钮——使用与 START 相同的糖果材质
- ❌ 按钮主体不是 3-stop 渐变——是 base + glass + highlight + glow 4 层
