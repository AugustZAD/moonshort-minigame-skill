# 交互设计 — Attribute Archetypes 设计系统

---

## 触摸输入规则

- **所有交互元素** 必须设置 `.setInteractive({ useHandCursor: true })`。
- **最小点击区域**：44 × 44 px（iOS HIG）。对小图形使用不可见的 `.setAlpha(0.001)` 矩形覆盖。
- **Shell 镀层（y = 0–196）仅作展示。** 标题栏 + VS 头部不接收输入。
  不要对任何 Shell Graphics 对象调用 `.setInteractive()`。
- **对话气泡仅作展示。** 无点击交互。
- **所有游戏输入在 y ≥ CONTENT_TOP 及以下。**
- **防双击**：在任何计分动作后添加 150 ms 冷却。

---

## 按钮状态

### 主按钮（`makeButton`）

| 状态 | 视觉效果 | 触发方式 |
|------|----------|----------|
| 空闲 | 完整高度，底座可见 | — |
| 按下 | 下移 +4 px，底座隐藏 | `pointerdown` |
| 释放 | 恢复空闲 | `pointerup` / `pointerout` |

音效：`pointerdown` 时播放 `audio.tap()`。

### 幽灵按钮（`makeGhostButton`）

| 状态 | 视觉效果 | 触发方式 |
|------|----------|----------|
| 空闲 | 缩放 1.0 | — |
| 按下 | 缩放 0.96 | `pointerdown` |
| 释放 | 缩放 1.0 | `pointerup` / `pointerout` |

音效：`pointerdown` 时播放 `audio.tap()`。

---

## 动画时间

| 动画 | 时长 | 缓动 |
|------|------|------|
| 场景淡入/淡出 | 300 ms | linear |
| 提示圈出场（缩放 + 透明度） | 200 ms | Back.easeOut |
| 分数变化上浮 + 消失 | 800 ms | Quad.easeOut |
| 浮动提示：保持 + 淡出 | 600 ms 保持 → 300 ms 淡出 | Quad.easeOut |
| 伤害闪烁叠加 | 180 ms | linear |
| 屏幕震动 | 150 ms, 3 px 振幅 | Sine.easeInOut |
| 评级字母揭示（缩放） | 400 ms | Back.easeOut |
| 星星行揭示（交错） | 每颗 80 ms | Quad.easeOut |
| HP 条流失（如有动画） | 400 ms | Sine.easeInOut |
| 幽灵按钮按下 | 即时（缩放 0.96） | — |
| 幽灵按钮释放 | 即时（缩放 1.0） | — |

---

## 动作反馈系统

### 正确动作
1. 分数变化浮动：`"+N"` 绿色 (`#4FECA2`)，从提示圈上浮 40 px
2. `audio.success()`
3. 提示圈环：短暂白色闪烁（alpha 1 → 0, 120 ms）
4. 连击计数器递增（有连击系统的游戏）
5. 可选：在提示圈中心 `spawnParticles()`

### 错误动作
1. 分数变化浮动：`"−N"` 红色 (`#FF4D6A`)
2. `audio.fail()`
3. `damageFlash(scene)` — 全屏红色叠加，alpha 0 → 0.35 → 0, 180 ms
4. `screenShake(scene, 3)` — 150 ms
5. 连击重置为 0

```javascript
function damageFlash(scene) {
  const flash = scene.add.rectangle(W/2, H/2, W, H, 0xFF0000).setAlpha(0).setDepth(50);
  scene.tweens.add({
    targets: flash, alpha: { from: 0, to: 0.35 },
    duration: 90, yoyo: true,
    onComplete: () => flash.destroy()
  });
}

function screenShake(scene, intensity) {
  scene.cameras.main.shake(150, intensity / 393);
}
```

### 计时器警告
- 剩余 ≤ 10 秒：每整数秒 `audio.tick()` 一次
- 剩余 ≤ 5 秒：每整数秒 `audio.heartbeat()` 一次（替代 tick）
- 计时器条颜色：`#38C97A` → `#FFB347`（≤ 33%） → `#FF4D6A`（≤ 10%）

---

## 音效规则

| 触发条件 | 动作 |
|----------|------|
| 游戏内首次 `pointerdown` | `audio.unlock(); audio.bgm(THEME.bgmStyle)` |
| 调用 `finishGame()` | `audio.stopBgm(600)` |
| ResultScene → BootScene | 不重启 BGM |
| 点击 REPLAY | 无 BGM — 由宿主控制重玩流程 |
| 按钮点击 | `audio.tap()` |
| 正确动作 | `audio.success()` |
| 错误动作 | `audio.fail()` |
| 新危险/提示出现 | `audio.alert()` |
| 计时器 ≤ 10 秒 | `audio.tick()`（每秒一次） |
| 计时器 ≤ 5 秒 | `audio.heartbeat()`（替代 tick） |
| S 评级揭示 | `audio.success()` 连续两次，间隔 120 ms |

BGM 风格按属性：ATK → `'action'`, WIL → `'tense'`, INT → `'mystery'`, CHA → `'romantic'`。

---

## 手势规则

| 手势 | 适用游戏 |
|------|----------|
| 单次点击 | 所有游戏 |
| 按住/释放 | qte-hold-release, stardew-fishing |
| 方向滑动 | lane-dash |
| 长按（≥ 200 ms 后进入按住状态） | qte-hold-release |

- **无多点触控** — 游戏仅支持单指操作。
- **无捏合缩放** — 通过 viewport meta 中的 `user-scalable=no` 禁用（已设置）。

---

## `notifyGameComplete` 载荷格式

```javascript
// ① 正常完成（CONTINUE 按钮）：
notifyGameComplete({
  rating:     'S',           // 必填：'S' | 'A' | 'B' | 'C'
  score:      450,           // 必填：整数
  attribute:  ATTRIBUTE,     // 必填：字符串（来自 CTX）
  modifier:   3,             // 必填：-1 | 0 | 1 | 3
  // 可选：
  combo:      12,
  hits:       24,
  miss:       3,
  durationMs: 38000,
});

// ② UNLOCK S TIER 按钮：
notifyGameComplete({
  intent:     'unlockSTier',
  cost:       UNLOCK_S_COST,   // 默认 50
  attribute:  ATTRIBUTE,
});

// ③ REPLAY 按钮：
notifyGameComplete({
  intent:     'replay',
  cost:       REPLAY_COST,     // 默认 20
  attribute:  ATTRIBUTE,
});
```

**规则：**
- `intent` 仅在 ② 和 ③ 中出现。正常完成不包含 `intent`。
- `modifier` 映射：S → 3, A → 1, B → 0, C → −1。
- 用户关闭或导航离开时不发送完成载荷——仅在主动点击按钮时发送。

---

## 滚动/平移防止

```javascript
// 已通过 CSS 设置在模板中。确认以下两项都存在：
// HTML: <meta name="viewport" content="...,user-scalable=no,...">
// CSS:  html, body { overflow: hidden; }
// JS（在 BootScene.create 或顶层）：
document.body.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
```

---

## 无障碍 / 可用性最低要求

- 每个按钮标签不依赖颜色即可识别（形状 + 文字即够）。
- 分数反馈同时使用颜色和 ± 符号——不仅靠颜色区分。
- 评级字母同时使用颜色和字母——不仅靠颜色区分。
- 点击区域不重叠（相邻按钮最小间距 8 px）。
