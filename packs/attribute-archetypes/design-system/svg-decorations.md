# SVG 装饰 — Attribute Archetypes 设计系统

所有装饰形状通过 Phaser 3 Graphics 的 arc/bezier 路径绘制。
不使用外部 SVG 文件。不用 `<img>` 做装饰——只有角色头像用图片加载。

---

## 生成规则

1. **仅使用 Phaser Graphics API**：`fillCircle`、`fillRect`、`fillRoundedRect`、
   `arc`、`moveTo/lineTo/bezierCurveTo` + `fillPath/strokePath`。
2. **装饰不加载外部资源**——头像 URL 是唯一的图片加载。
3. **深度排序**：
   - 画布背景 / 点阵：depth 1–2
   - 游戏内容（卡片、圆圈、条）：depth 10–27
   - Shell 镀层（标题栏、VS 头部、对话）：depth 28–31
4. **性能**：每个场景最多 3 个装饰 Graphics 对象。
   尽可能将多个装饰合并到一个 Graphics 对象中。
5. **颜色**：始终来自 `PALETTE`（游戏层）或 `SHELL` 常量（Shell 层）。
   不要在这两个来源之外硬编码任意 hex 值。

---

## 已批准的装饰目录

### 1. 扇形标题栏底边
使用者：`drawEpisodeTitleBar()` — 品红标题栏的扇形底边。

**规格：** 12px 高度，由重复的 12px 半径圆弧组成，圆心间距 24px。

```javascript
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
```

**调整参数：**
- 圆弧半径：12px（固定）。
- 间距：24px（圆心到圆心）。
- 标题栏矩形高度：76px，扇形底部到达 y = 76 + 12 = 88。
- W=393 时约产生 16–17 个圆弧。

---

### 2. 点阵背景
使用者：所有 GameScene 和 BootScene 背景，作为微妙纹理。

```javascript
function drawDotPattern(scene, alpha) {
  const g = scene.add.graphics().setDepth(2);
  g.fillStyle(CC.primary, alpha || 0.05);
  const sx = 28, sy = 30; // 网格间距
  for (let row = 0; row * sy < H + sy; row++) {
    for (let col = 0; col * sx < W + sx; col++) {
      const offset = (row % 2) * (sx / 2); // 隔行错位
      g.fillCircle(col * sx + offset, row * sy, 2);
    }
  }
}
```

**规则：**
- Alpha 范围：0.04–0.06，不超过 0.08。
- 不要做动画。仅静态。
- 点半径：2 px，不要增大。

---

### 3. 金色角落点
使用者：游戏内容区的浮动动作卡片、通知卡片。
**不用于** Shell 元素（标题栏、VS 头部、对话气泡）。

```javascript
function drawGoldCorners(scene, cx, cy, w, h, dotR, depth) {
  const g = scene.add.graphics().setDepth(depth || 17);
  g.fillStyle(0xF5C842, 1);
  const hw = w / 2 - dotR, hh = h / 2 - dotR;
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx, sy]) => {
    g.fillCircle(cx + sx * hw, cy + sy * hh, dotR);
  });
}
// 典型调用：drawGoldCorners(this, cardX, cardY, cardW, cardH, 6, 17)
// dotR: 5–8 px
```

---

### 4. 糖果卡片（浮动游戏卡片）
使用者：游戏内容区的动作提示区域。
柔粉色背景，圆角，可选金色角落。

```javascript
function drawCandyCard(scene, cx, cy, w, h, fillColor, depth) {
  const g = scene.add.graphics().setDepth(depth || 14);
  g.fillStyle(fillColor, 1);
  g.fillRoundedRect(cx - w/2, cy - h/2, w, h, 20);
  // 主色边框（微弱）
  g.lineStyle(2, CC.primary, 0.4);
  g.strokeRoundedRect(cx - w/2, cy - h/2, w, h, 20);
}
```

---

### 5. 提示圈出场动画
使用者：每次 GameScene 中出现新动作/提示时。

```javascript
function pulseCueIn(scene, cueRingObj, cueBgObj) {
  scene.tweens.add({
    targets: [cueRingObj, cueBgObj],
    scaleX: { from: 0.6, to: 1.0 },
    scaleY: { from: 0.6, to: 1.0 },
    alpha:  { from: 0.0, to: 1.0 },
    duration: 200, ease: 'Back.easeOut'
  });
}
```

---

### 6. 星星行（ResultScene）
5 个简化星星（填充圆）— S=5、A=4、B=3、C=2 个填充。

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

const STAR_COUNT = { S: 5, A: 4, B: 3, C: 2 };
```

---

### 7. 粒子爆发（正确动作反馈）
使用者：`spawnParticles()` 在正确答案或 S 评级揭示时触发。

```javascript
function spawnParticles(scene, x, y, color, count, life) {
  const n   = count || 6;
  const dur = life  || 500;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const dist  = 40 + Math.random() * 20;
    const tx    = x + Math.cos(angle) * dist;
    const ty    = y + Math.sin(angle) * dist;
    const r     = 4 + Math.random() * 3;
    const dot   = scene.add.circle(x, y, r, color).setDepth(24);
    scene.tweens.add({
      targets: dot, x: tx, y: ty,
      alpha: { from: 1, to: 0 },
      scaleX: { from: 1, to: 0.3 }, scaleY: { from: 1, to: 0.3 },
      duration: dur, ease: 'Quad.easeOut',
      onComplete: () => dot.destroy()
    });
  }
}
```

---

## 禁止模式

- ❌ 多边形星星——性能开销大、视觉不一致。用填充圆替代。
- ❌ 用 `scene.add.image()` 做装饰——仅用于头像。
- ❌ 给背景点阵加动画——仅静态。
- ❌ 直接使用 CSS/canvas 渐变——用两遍 Phaser Graphics 填充。
- ❌ 同类装饰每场景超过一个 Graphics 对象。
- ❌ 装饰元素 depth > 27（28–31 保留给 Shell 镀层）。
- ❌ 在 Shell 区域（y = 0–196）放装饰——只有 Shell 函数在那里绘制。
