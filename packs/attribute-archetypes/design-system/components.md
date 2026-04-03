# 组件规范 — Attribute Archetypes 设计系统

所有组件通过 Phaser 3 Graphics 或 Text 对象绘制。不使用 DOM/CSS。
颜色规则见 `color-strategy.md`，字体规则见 `typography.md`。

---

## Shell 组件

### 剧集标题栏
**层级：** Shell | **类型：** 纯色填充 + 扇形底边
**区域：** x=0, y=0, w=393, h=76（品红色矩形）+ 12px 扇形底边
**颜色：** `SHELL.primary` 填充，白色文字

扇形底边由重复的径向圆弧组成：每个圆弧半径 12px，圆心间距 24px。
底边总高 12px，从 y=76 延伸到 y=88。

```javascript
function drawEpisodeTitleBar(scene) {
  const g = scene.add.graphics().setDepth(30);

  // 纯色品红矩形 76px 高
  g.fillStyle(SHELL.primary, 1);
  g.fillRect(0, 0, W, 76);

  // 扇形底边 — 12px 半径圆弧，24px 间距
  const circleR = 12;
  const spacing = 24;
  g.beginPath();
  g.moveTo(0, 76);
  for (let cx = spacing / 2; cx < W; cx += spacing) {
    g.arc(cx, 76, circleR, Math.PI, 0, false);
  }
  g.lineTo(W, 0);
  g.lineTo(0, 0);
  g.closePath();
  g.fillPath();

  // 剧集标签 — 小字，左上
  scene.add.text(16, 15, (EPISODE_LABEL || 'EPISODE 1').toUpperCase(), {
    fontFamily: 'Montserrat', fontSize: '13px', fontStyle: '700',
    color: 'rgba(255,255,255,0.75)', letterSpacing: 1
  }).setDepth(31);

  // 剧集标题 — 居中
  scene.add.text(W / 2, 44, EPISODE_TITLE || 'The Challenge', {
    fontFamily: 'Montserrat', fontSize: '20px', fontStyle: '800',
    color: '#ffffff', stroke: 'rgba(0,0,0,0.2)', strokeThickness: 2
  }).setOrigin(0.5).setDepth(31);
}
```

---

### VS 头部
**层级：** Shell | **类型：** 深色背景 + 白色头像圆 + 渐变 HP 条
**关键 Figma CSS 尺寸：**

| 元素 | Figma 值 | Phaser Y |
|------|----------|----------|
| 头像圆圈 | 72×72 px，白色填充，无彩色环，border-radius:100px | 82 |
| VS 文字 | Montserrat 800, 40px, `#EC4F99` | 98 |
| 角色名称 | Montserrat 700, 14px, 白色，居中在头像下方 | 134 |
| 玩家 HP 条 | 163×24 px, 绿色渐变, 2px 白边, border-radius:100px | 162 |
| 对手 HP 条 | 163×24 px, 品红渐变, 2px 白边, border-radius:100px | 162 |
| HP 百分比文字 | Montserrat Bold 12px, 白色, 居中在 HP 条内 | — |

```javascript
function drawVSHeader(scene) {
  const g = scene.add.graphics().setDepth(29);

  // VS 文字 — Montserrat 800, 40px, 品红色
  scene.add.text(W / 2, 98, 'VS', {
    fontFamily: 'Montserrat', fontSize: '40px', fontStyle: '800',
    color: '#EC4F99'
  }).setOrigin(0.5).setDepth(31);

  // ── 玩家（左侧）──
  // 白色头像圆圈 72×72，无彩色环
  g.fillStyle(SHELL.white, 1);
  g.fillCircle(60, 82, 36);

  // 头像图片（如有）
  if (scene.textures.exists('playerPortrait')) {
    const maskG = scene.add.graphics().setDepth(30);
    maskG.fillCircle(60, 82, 34);
    scene.add.image(60, 82, 'playerPortrait')
      .setDisplaySize(68, 68).setDepth(30)
      .setMask(maskG.createGeometryMask());
  } else {
    scene.add.text(60, 82, (PLAYER_NAME || 'P')[0].toUpperCase(), {
      fontFamily: 'Montserrat', fontSize: '24px', fontStyle: '800',
      color: '#EC4F99'
    }).setOrigin(0.5).setDepth(31);
  }

  // 玩家名称 — 居中在头像下方
  scene.add.text(60, 134, PLAYER_NAME || 'You', {
    fontFamily: 'Montserrat', fontSize: '14px', fontStyle: '700',
    color: '#FFFFFF'
  }).setOrigin(0.5).setDepth(31);

  // 玩家 HP 条（163×24, 绿色渐变, 白色边框, radius 100px）
  const hpY = 162;
  g.lineStyle(2, SHELL.white, 1);
  g.strokeRoundedRect(24, hpY, 163, 24, 12);
  g.fillStyle(SHELL.green, 1);
  g.fillRoundedRect(25, hpY + 1, 161, 22, 11);
  // HP 百分比文字
  scene.add.text(24 + 163 / 2, hpY + 12, '100%', {
    fontFamily: 'Montserrat', fontSize: '12px', fontStyle: '700',
    color: '#FFFFFF'
  }).setOrigin(0.5).setDepth(31);

  // ── 对手（右侧）──
  g.fillStyle(SHELL.white, 1);
  g.fillCircle(333, 82, 36);

  if (scene.textures.exists('opponentPortrait')) {
    const maskG2 = scene.add.graphics().setDepth(30);
    maskG2.fillCircle(333, 82, 34);
    scene.add.image(333, 82, 'opponentPortrait')
      .setDisplaySize(68, 68).setDepth(30)
      .setMask(maskG2.createGeometryMask());
  } else {
    scene.add.text(333, 82, (OPPONENT_NAME || 'B')[0].toUpperCase(), {
      fontFamily: 'Montserrat', fontSize: '24px', fontStyle: '800',
      color: '#EC4F99'
    }).setOrigin(0.5).setDepth(31);
  }

  // 对手名称 — 居中在头像下方
  scene.add.text(333, 134, OPPONENT_NAME || 'Boss', {
    fontFamily: 'Montserrat', fontSize: '14px', fontStyle: '700',
    color: '#FFFFFF'
  }).setOrigin(0.5).setDepth(31);

  // 对手 HP 条（163×24, 品红渐变, 白色边框, radius 100px）
  g.lineStyle(2, SHELL.white, 1);
  g.strokeRoundedRect(206, hpY, 163, 24, 12);
  g.fillStyle(SHELL.primary, 1);
  g.fillRoundedRect(207, hpY + 1, 161, 22, 11);
  // HP 百分比文字
  scene.add.text(206 + 163 / 2, hpY + 12, '100%', {
    fontFamily: 'Montserrat', fontSize: '12px', fontStyle: '700',
    color: '#FFFFFF'
  }).setOrigin(0.5).setDepth(31);
}
```

---

### 对话气泡
**层级：** Shell | **类型：** 白色底 + 投影
**区域：** 228×64 px, border-radius:12px, Phaser Y:202
**字体：** Montserrat Bold 14px（非 Patrick Hand）
**投影：** `drop-shadow(0px 2px 4px rgba(0,0,0,0.15))`

```javascript
function drawDialogueBubble(scene, text) {
  const bubbleW = 228;
  const bubbleH = 64;
  const bx = W - 24 - bubbleW;
  const by = 202; // Phaser Y

  const g = scene.add.graphics().setDepth(29);
  // 投影效果（用偏移半透明矩形模拟）
  g.fillStyle(0x000000, 0.08);
  g.fillRoundedRect(bx, by + 2, bubbleW, bubbleH, 12);
  // 白色气泡
  g.fillStyle(SHELL.white, 1);
  g.fillRoundedRect(bx, by, bubbleW, bubbleH, 12);

  const t = scene.add.text(bx + bubbleW / 2, by + bubbleH / 2, text || '', {
    fontFamily: 'Montserrat', fontSize: '14px', fontStyle: '700',
    color: '#1A1A2E', align: 'center',
    wordWrap: { width: bubbleW - 48 }
  }).setOrigin(0.5).setDepth(30);

  return t; // 调用 t.setText(newText) 可在游戏中更新
}
```

---

### 主按钮 — 糖果/光泽风格（START / CONTINUE / UNLOCK）
**层级：** Shell | **类型：** 4 层材质 + 投影
**边框：** 2px `#EC4F99`, border-radius:24px
**投影：** `0 4px 0 rgba(0,0,0,0.15)`
**文字：** Montserrat Black 18px

START 和 UNLOCK 按钮使用完全相同的糖果材质。无幽灵按钮变体。

```
图层（从底到顶）：
  1. 基色层 (SHELL.primary #EC4F99)  — 纯色填充
  2. 玻璃层 (rgba(255,255,255,0.3)) — 半透明白色叠加
  3. 高光带 (白色条纹)              — 顶部 30% 横向亮带
  4. 内发光 (微弱白色边缘光)        — 柔和内边缘
```

```javascript
function makeButton(scene, { x, y, w, h, label, onTap }) {
  const bh = h || 54;
  const r  = 24;
  const container = scene.add.container(x, y).setDepth(20);

  const bg = scene.add.graphics();

  // 投影
  bg.fillStyle(0x000000, 0.15);
  bg.fillRoundedRect(-w / 2, -bh / 2 + 4, w, bh, r);

  // 1. 基色层
  bg.fillStyle(SHELL.primary, 1);
  bg.fillRoundedRect(-w / 2, -bh / 2, w, bh, r);

  // 2. 玻璃层
  bg.fillStyle(0xFFFFFF, 0.3);
  bg.fillRoundedRect(-w / 2, -bh / 2, w, bh, r);

  // 3. 高光带（顶部 30%）
  bg.fillStyle(0xFFFFFF, 0.25);
  bg.fillRoundedRect(-w / 2, -bh / 2, w, bh * 0.3, { tl: r, tr: r, bl: 0, br: 0 });

  // 边框
  bg.lineStyle(2, SHELL.primary, 1);
  bg.strokeRoundedRect(-w / 2, -bh / 2, w, bh, r);

  container.add(bg);

  // 按钮文字 — Montserrat Black 18px
  const lbl = scene.add.text(0, 0, label, {
    fontFamily: 'Montserrat', fontSize: '18px', fontStyle: '900',
    color: '#FFFFFF', letterSpacing: 1
  }).setOrigin(0.5);
  container.add(lbl);

  const hit = scene.add.rectangle(0, 0, w, bh).setOrigin(0.5)
    .setInteractive({ useHandCursor: true }).setAlpha(0.001);
  container.add(hit);

  hit.on('pointerdown', () => { container.setScale(0.96); audio.tap(); });
  hit.on('pointerup',   () => { container.setScale(1.0); if (onTap) onTap(); });
  hit.on('pointerout',  () => { container.setScale(1.0); });

  return container;
}
```

---

## 游戏内容组件

### 主圆圈 / 提示圈（动作指示器）
**层级：** 游戏 | **类型：** 圆锥渐变外环 + 径向渐变内部
**尺寸：** 280×280 px, 居中, Phaser 圆心 Y:390（Phaser 顶部 Y:250）

**外环渐变：** `conic-gradient(from 90deg, #EC4F99, #F17BB3, #F6A7CC, #FAD3E6, #FFF)`
**内部渐变：** `radial-gradient(white, #FFE0F8)`

```javascript
// 主圆圈中心：
const CUE_X = W / 2;
const CUE_Y = 390;     // Phaser Y（圆心）
const CUE_R = 140;     // 半径 = 280/2

// 外环（模拟圆锥渐变 — conic-gradient from 90deg）
// #EC4F99 → #F17BB3 → #F6A7CC → #FAD3E6 → #FFF
scene.add.circle(CUE_X, CUE_Y, CUE_R, 0xFFE0F8).setDepth(14);

// 内部渐变（radial-gradient white → #FFE0F8）
scene.add.circle(CUE_X, CUE_Y, CUE_R - 8, 0xFFFFFF).setDepth(15);

// 圈标题文字 — Montserrat Black 20px
scene.add.text(CUE_X, CUE_Y - 22, 'NEXT ACTION', {
  fontFamily: 'Montserrat', fontSize: '20px', fontStyle: '900',
  color: PALETTE.textMuted
}).setOrigin(0.5).setDepth(17);

// 圈描述文字 — Montserrat Bold 16px（每回合更新）
this.cueText = scene.add.text(CUE_X, CUE_Y + 20, '???', {
  fontFamily: 'Montserrat', fontSize: '16px', fontStyle: '700',
  color: PALETTE.textDark
}).setOrigin(0.5).setDepth(17);
```

---

### 血量条 — 渐变填充
**层级：** 游戏 | **类型：** 三遍绘制（底色 + 顶部亮色带 + 白色高光线）

VS 头部绘制静态 100% HP 条。包含动态 HP 的游戏在 **内容区域（y >= CONTENT_TOP）**
内维护自己的 `createHealthBar()` 调用。

```
轨道：  纯色 PALETTE.trackBg, 1.5 px PALETTE.trackBorder 边框
填充：  PALETTE.primary 全高
       + white @ 0.35 顶部 45% 带
       + white @ 0.40 2 px 高光线 y=+2
高度：  16–24 px, 圆角 = height/2
```

---

### 计时器条 — 三色
**层级：** 游戏 | **类型：** 纯色填充，每帧计算颜色
**位置：** 全宽条，位于 y = CONTENT_TOP

```javascript
// 颜色逻辑（在 update 中）：
const ratio = this.timeLeft / ROUND_SECONDS;
const barColor = ratio > 0.33 ? 0x38C97A : ratio > 0.10 ? 0xFFB347 : 0xFF4D6A;
```

---

### 分数变化浮动提示
**层级：** 游戏 | **类型：** 纯文字，无背景
**颜色：** `#4FECA2` 正值, `#FF4D6A` 负值

```javascript
function showScoreDelta(scene, x, y, delta) {
  const color = delta >= 0 ? '#4FECA2' : '#FF4D6A';
  const label = delta >= 0 ? `+${delta}` : `${delta}`;
  const t = scene.add.text(x, y, label, {
    fontFamily: 'Nunito', fontSize: '22px', fontStyle: '900',
    color, stroke: '#ffffff', strokeThickness: 2
  }).setOrigin(0.5).setDepth(25);
  scene.tweens.add({
    targets: t, y: y - 40, alpha: { from: 1, to: 0 },
    duration: 800, ease: 'Quad.easeOut',
    onComplete: () => t.destroy()
  });
}
```

---

### 分数显示（提示圈下方）
**层级：** 游戏 | **类型：** 纯文字 — "SCORE  N"

```javascript
this.scorePrefixText = scene.add.text(W / 2, CUE_Y + CUE_R + 22, 'SCORE', {
  fontFamily: 'Nunito', fontSize: '14px', fontStyle: '700', color: PALETTE.textMuted
}).setOrigin(0.5).setDepth(16);

this.scoreValueText = scene.add.text(W / 2, CUE_Y + CUE_R + 46, '0', {
  fontFamily: 'Nunito', fontSize: '28px', fontStyle: '900', color: PALETTE.textDark
}).setOrigin(0.5).setDepth(16);
```

---

### 星星行（仅 ResultScene）
**层级：** 游戏 | **类型：** 纯色填充圆（简化星星）

```javascript
function drawStarRow(scene, cx, y, filledCount, depth) {
  const g = scene.add.graphics().setDepth(depth || 20);
  for (let i = 0; i < 5; i++) {
    const x    = cx + (i - 2) * 30;
    const fill = i < filledCount;
    g.fillStyle(fill ? 0xF5C842 : 0xDDD5CC, 1);
    g.fillCircle(x, y, 11);
    if (fill) {
      g.lineStyle(2, 0xD4A520, 1);
      g.strokeCircle(x, y, 11);
    }
  }
}

// 各评级填充数：
const STAR_COUNT = { S: 5, A: 4, B: 3, C: 2 };
```
