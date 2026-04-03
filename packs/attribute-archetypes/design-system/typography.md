# 字体排版 — Attribute Archetypes 设计系统

## 可用字体

仅加载以下两个字体族。修改字体前须同步更新 **全部 12 个** 游戏模板文件中的 `<link>` 标签。

```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Nunito:wght@700;900&display=swap" rel="stylesheet">
```

| 字体族 | 字重 | 用途 |
|--------|------|------|
| `Montserrat` | 700 (Bold) | Shell 层：角色名称、HP 百分比 (12px)、对话气泡 (14px)、圈描述 (16px) |
| `Montserrat` | 800 (ExtraBold) | Shell 层：VS 文字 (40px)、剧集标题 (20px) |
| `Montserrat` | 900 (Black) | Shell 层：评级字母、按钮文本 (18px)、圈标题 (20px) |
| `Nunito` | 900 (Black) | 游戏内容层：动作标签、分数变化 |
| `Nunito` | 700 (Bold) | 游戏内容层：计时器、连击、统计标签 |

## 使用场景

**Montserrat 900 (Black)** — Shell 层中最醒目的粗体文字。
用于：评级字母（S/A/B/C）、按钮文本（START / UNLOCK 等 18px）、圈标题（NEXT ACTION 20px）。

**Montserrat 800 (ExtraBold)** — Shell 层标题级文字。
用于：VS 文字 (40px)、剧集标题 (20px)。

**Montserrat 700 (Bold)** — Shell 层次级标签与正文。
用于：角色名称 (14px)、HP 百分比 (12px)、对话气泡内容 (14px)、圈描述文字 (16px)、剧集标签 (13px)。

**Nunito 900** — 游戏内容区中需要 < 0.5 秒读取的文字。
用于：动作标签（DODGE、PARRY、BLOCK）、分数变化（+1 / -1）。

**Nunito 700** — 游戏内容区次级标签。
用于：计时器倒计时、分数前缀（"SCORE"）、统计卡片数字。

## 字号梯度（画布宽度 = 393 px）

| 令牌 | 字号 | 字体族 | 字重 | 用途 |
|------|------|--------|------|------|
| `hero` | 72 px | Montserrat | 900 | 评级字母（S / A / B / C） |
| `display` | 40 px | Montserrat | 800 | VS 文字 |
| `title` | 28 px | Montserrat | 800 | 游戏标题、回合标题 |
| `subtitle` | 20 px | Montserrat | 800 | 标题栏中的剧集标题 |
| `circle-title` | 20 px | Montserrat | 900 | 圈内标题（NEXT ACTION） |
| `button` | 18 px | Montserrat | 900 | 按钮文本（START / UNLOCK） |
| `circle-desc` | 16 px | Montserrat | 700 | 圈内描述文字 |
| `dialogue` | 14 px | Montserrat | 700 | 对话气泡文字 |
| `name` | 14 px | Montserrat | 700 | 角色名称 |
| `action` | 18 px | Nunito | 900 | 游戏区内动作标签 |
| `cue-label` | 14 px | Nunito | 700 | "NEXT ACTION" / "YOUR GRADE" |
| `body` | 16 px | Nunito | 700 | 计时器、统计标签 |
| `hp-pct` | 12 px | Montserrat | 700 | HP 条内百分比文字 |
| `caption` | 13 px | Montserrat | 700 | 剧集标签、小提示 |

## 文字渲染规则

- **按钮标签**：始终 `.toUpperCase()`，`letterSpacing: 1–2`，Montserrat Black 18px
- **标题描边**：浅色背景用 2–3 px `primaryDark` 描边；深色背景用白色描边
- **分数变化**：`"+N"` 用 `#4FECA2`（成功绿），`"-N"` 用 `#FF4D6A`（危险红）
- **评级字母颜色**：
  - S -> `#F5C842`（金色）
  - A -> `PALETTE.primary`
  - B -> `PALETTE.secondary`
  - C -> `PALETTE.textMuted`
- **评级字母**：3 px 白色描边保证可读性
- **对话文字**：Montserrat Bold 14px，`wordWrap: { width: bubbleWidth - 48 }`（左右各 24 px 内边距）
- **HP 百分比**：Montserrat Bold 12px，白色，居中在 HP 条内
- **最小字号**：不要渲染小于 `hp-pct`（12 px）的文字——缩短字符串替代

## Phaser 文本对象模式

```javascript
// Montserrat 800 — VS 文字
scene.add.text(x, y, 'VS', {
  fontFamily: 'Montserrat', fontSize: '40px', fontStyle: '800',
  color: '#EC4F99', stroke: '#ffffff', strokeThickness: 3
}).setOrigin(0.5);

// Montserrat 700 — 角色名
scene.add.text(x, y, 'Jason', {
  fontFamily: 'Montserrat', fontSize: '14px', fontStyle: '700',
  color: '#FFFFFF'
}).setOrigin(0.5);

// Montserrat 700 — 对话气泡
scene.add.text(x, y, text, {
  fontFamily: 'Montserrat', fontSize: '14px', fontStyle: '700',
  color: '#1A1A2E', align: 'center',
  wordWrap: { width: 180 }
}).setOrigin(0.5);

// Montserrat 900 — 按钮文本
scene.add.text(x, y, 'START', {
  fontFamily: 'Montserrat', fontSize: '18px', fontStyle: '900',
  color: '#FFFFFF', letterSpacing: 1
}).setOrigin(0.5);

// Montserrat 700 — HP 百分比
scene.add.text(x, y, '100%', {
  fontFamily: 'Montserrat', fontSize: '12px', fontStyle: '700',
  color: '#FFFFFF'
}).setOrigin(0.5);

// Montserrat 900 — 圈标题
scene.add.text(x, y, 'NEXT ACTION', {
  fontFamily: 'Montserrat', fontSize: '20px', fontStyle: '900',
  color: PALETTE.textMuted
}).setOrigin(0.5);

// Montserrat 700 — 圈描述
scene.add.text(x, y, '???', {
  fontFamily: 'Montserrat', fontSize: '16px', fontStyle: '700',
  color: PALETTE.textDark
}).setOrigin(0.5);

// Nunito 900 — 游戏内动作
scene.add.text(x, y, 'PARRY', {
  fontFamily: 'Nunito', fontSize: '18px', fontStyle: '900',
  color: PALETTE.textDark
}).setOrigin(0.5);
```
