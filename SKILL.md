---
name: moonshort-minigame-skill
description: >
  Build complete, production-ready Moonshort H5 mini-games from a single requirement.
  Use this skill whenever the user asks to create, prototype, revise, audit, tune, document,
  verify, or describe a Moonshort mini-game, Phaser H5 game, settlement flow, attribute modifier,
  host bridge payload, or mini-game UI. Also use it when the user mentions a gameplay mechanic,
  one-minute mini-game, story check, QTE, puzzle, rhythm, memory game, sensor-based game,
  settlement panel, or WebView compatibility question in the Moonshort mini-game ecosystem.
  Also use when converting games to hybrid DOM+Phaser V2 architecture, applying atmosphere
  color themes, redesigning game-specific UI layouts, or batch-converting templates.
---

# Moonshort MiniGame Skill

`SKILL.md` is the primary operating document for this repository.
The former `agent.md` rules are merged here. Keep `agent.md` only as a compatibility pointer.

## Non-Negotiable Operating Rules

### 1. `roadmap.md` is a live execution log
- Before doing any substantive task, add a new task section or extend the current section in `roadmap.md`.
- The pre-task roadmap entry must include:
  - `Target`
  - a checklist of concrete deliverables
  - an initial progress note that the task has started
- During execution, keep the checklist and progress notes current.
- After finishing, mark the task complete and record:
  - what changed
  - what was verified
  - any special-case handling
- Do not treat roadmap updates as an afterthought or end-only summary.

### 2. `list.md` is the inventory source of truth
- Whenever a game is added, renamed, removed, or materially re-scoped, update `list.md`.
- Every shipped game entry must include:
  - game name
  - one-line gameplay description
  - directory path
- If the task touches only docs or host integration, leave the game inventory untouched unless it becomes inaccurate.

### 3. Prefer stable manual delivery over blind batch generation
- Reusable scaffolds are allowed.
- Blind bulk generation is not a substitute for per-game implementation and verification.
- For multi-game requests, implement one game at a time and validate each file before moving on.

## Step 0 — Requirements Intake
Before writing code, extract the following from the user's request.
Ask only if the information is genuinely missing and affects implementation.

| Signal | What to extract | Default |
|--------|----------------|---------|
| Core mechanic | tap / tilt / voice / camera / memory / match / runner / choice / novel | tap-sprint |
| Theme / mood | genre, narrative context, color vibe | neutral |
| Attribute | character stat being tested | echoed from URL param |
| Device features | camera / microphone / gyroscope / none | none |
| Narrative layer | pre-game dialogue, in-game story beats, flavor text | none |
| Episode continuity | **本集 + 下一集**剧情衔接（从 `data/<story>/ep{N}/script.json` 读取 current + next） | 只有本集 |
| Difficulty target | how hard should S-rank be to reach | moderate |

Map the mechanic to the closest **archetype** or design a novel one:
`tap-sprint` · `match-memory` · `merge-puzzle` · `tilt-dodge` · `voice-rhythm` · `camera-face` · `platform-runner` · `choice-chain`

Archetypes are starting points, not limits. Combine or invent freely.

## Hard Constraints
These never change. Any violation is a release blocker.

- Single self-contained HTML file per game. No build step. No local file references.
- Phaser 3.60.0 via `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js`.
- Canvas: `393 × 736`, `Phaser.Scale.FIT` + `CENTER_BOTH`.
- Output path: `games/<game_id>/index.html` with lowercase kebab-case id.
- Read `attribute` and `primaryColor` from URL query params at boot.
- Settlement payload required fields: `rating`, `score`, `attribute`, `modifier`.
- Rating enum: exactly `S / A / B / C`.
- Modifier mapping: `S→+3, A→+1, B→0, C→-1`.
- Always derive modifier from a lookup, never from ad hoc math.
- Settlement fires only when the user taps the final confirmation CTA.
- Bridge order: iOS WebKit → Android jsBridge → iframe postMessage → console fallback.
- Visual baseline: Kenney flat 2D. No glassmorphism, no blur, no sharp corners.
- One primary CTA per screen.
- Final CTA stays in the lower thumb zone.
- Keep `RATING_THRESHOLDS` in one named constant near the top of the script.
- Palette comes from Huemint using `primaryColor`. See `standards/design-guide.md`.
- Extra payload fields are allowed, but the four core settlement fields are immutable.

## Required Reading Order
Use progressive disclosure. Read only what the task needs, but follow this order.

1. `standards/design-guide.md`
2. `standards/framework-constraints.md`
3. `contracts/settlement.contract.md`
4. `templates/phaser-h5-template.html`
5. `contracts/settlement.schema.json` during validation
6. `qa/compatibility-checklist.md` before closeout

Read these only when needed:

- `references/device-apis.md` for camera / microphone / gyroscope
- `references/narrative-layer.md` for dialogue, typewriter text, story scenes
- `references/sprite-assets.md` for textures, sprite sourcing, font pairing
- `host/cocos-settlement-handler.ts` and `host/cocos-webview-integration.md` for host-side debugging
- `examples/platform-runner/index.html` and `examples/merge-2048/index.html` for implementation-quality reference

## Delivery Workflow

End-to-end workflow for producing a **story-driven customized mini-game** from episode content (narrative + character images + background). Also applies to generic games — skip asset/audio phases if not needed.

### Step 0b: 定制化等级选择

每个 episode 游戏可选择两种定制化等级。**必须询问用户选择哪种等级**，不要自行决定。

| | 普通定制化 (Standard) | 深度定制化 (Deep) |
|---|---|---|
| **NarrativeScene** | ✅ 角色图 + 对白 | ✅ 角色图 + 对白 |
| **角色素材** | ✅ EP.assets 注入 | ✅ EP.assets 注入 |
| **背景图** | ❌ 不使用 | ✅ EP.backgrounds 注入所有 Scene |
| **色调覆写** | ❌ 模板默认色 | ✅ ATTR_THEMES 覆写匹配剧情氛围 |
| **candy 卡片色** | ❌ 粉色默认 | ✅ 覆写为暗色/暖色等 |
| **游戏内文案** | 中文化 | 中文化 + 剧情化（"在黑暗中寻找线索"） |
| **游戏内素材** | ❌ 程序化色块 | ✅ 按模板分级：高价值模板生成精灵/图标替换色块（见 Step 2c） |
| **BGM 风格** | 属性默认 | 按场景氛围覆写 |
| **增量工作** | 基准 (~16 min) | +~15 min (+50% token，含素材生成) |
| **模板改动** | ~100 行 | +~50 行增量（含 Phaser 素材加载） |

**询问用户时可提供的参考信息**:
- 普通定制化适合：剧情氛围与模板默认风格一致的场景
- 深度定制化适合：剧情氛围与模板默认风格冲突、或需要更强沉浸感的场景
- 有背景图素材可用时，深度定制化效果更好

**深度定制化命名规范**:
- 文件夹名 `ep-N_scene01-<style>` 中的 `<style>` 后缀必须反映实际风格
- **不要一律用 `-dark`**。按场景氛围选择：`-sweet`(甜蜜)、`-warm`(温暖)、`-noir`(暗黑)、`-neon`(赛博)、`-tense`(紧张) 等
- 示例：甜蜜约会 → `ep-8_scene01-sweet`，校园对峙 → `ep-6_scene01-noir`

**深度定制化核心原则**:
- **不改原模板 UI/UX 布局**。标题栏、头像、VS、HP 条、仪表盘、按钮位置全部保持原样
- 只通过 `window.__EPISODE_CTX__` 注入数据（角色名、标题、背景图、主题色、精灵图）
- **配色用 kmeans 动态取色 + 增强（不 fallback）**：设 `CTX.coverImage` 后模板自动从背景图 kmeans 聚类提取主色。**弱色自动增强**（饱和度拉到 ≥0.55，亮度夹到 0.30-0.80）而不是 fallback 到 preset。7 个 preset theme（combat/mystery/nature/dark/sweet/ocean/energy）仅作为无 coverImage 时的默认值
- **kmeans 必须确定性初始化**：用均匀间距采样替代 `Math.random()` 初始化聚类中心，确保每次刷新配色一致
- `CTX.coverImage` 同时控制背景淡显（cover-layer opacity 0.20）和动态取色，一举两得
- **三层定制体系**（逐层递进，后层依赖前层）：
  - 第一层：标签/文案替换 — 游戏名、规则、按钮、状态提示全部剧情化
  - 第二层：精灵图替换 — 用 ZenMux/Gemini 生成 128×128 绿幕精灵 → chroma key → 透明 PNG，替换程序化色块/图标
  - 第三层：游戏环境替换（STORY_THEME）— 替换游戏核心视觉"外壳"（信号灯→狼眼、背景、特效），**不改游戏逻辑**，通过 `cssOverride` + `jsOverride` 注入
- **素材生成原则**：所有视觉素材优先用 AI 图像生成（ZenMux/Gemini），禁止手工 CSS 绘图或程序化作图。即使是简单图形（如交通灯→狼眼），也应生成真实质感的 AI 图片而非用 CSS shapes/SVG 拼凑

**深度定制化额外步骤**:
1. 注入 `window.__EPISODE_CTX__`（见下方 CTX 注入结构）
2. 从 7 个 V3 theme 中选匹配剧情氛围的主题色（可被 coverImage 动态取色覆盖）
3. 设置 `CTX.portraits` 使用 Step 2b 生成的 tight headshot 头像
4. 设置 `CTX.names` 替换默认 Player/Boss 为角色名
5. 根据剧情氛围覆写 `bgmStyle`（如紧张场景强制 `tense`）
6. **游戏名剧情化**：替换模板默认游戏名（如 `Conveyor Sort` → `碎片拼图`）。同时替换 HTML `<title>`、boot card `<h2>`、Phaser 文字、ResultScene 副标题中的所有出现。**⚠️ 模板还在 `boot-card` div 里硬编码了中文游戏名**（如 parking-rush 的 "急速泊车"、maze-escape 的 "迷宫探险"），必须在 `STORY_RESKIN[ep].labels` 里显式加一条中文→中文映射，否则开屏卡片会露馅。审核 Layer 1 时用 `grep -oP '[\p{Han}]+' packs/attribute-archetypes/games/<tpl>/index-v3.html | sort -u` 把模板里所有硬编码中文列出来逐条核对
7. **游戏规则剧情化**：BootScene 的规则描述替换为剧情化中文（如"将走廊里听到的碎片分类，真相和谎言混在一起"）
8. **考验宣告卡（Bridge Card）**：NarrativeScene 对白结束后、进入 BootScene 之前，自动插入一张全屏考验宣告卡：`—— {角色名}的{属性}考验 ——` + `{剧情化引导语}` + `点击开始考验`。这是剧情→游戏的核心衔接点
9. **游戏机制隐喻重新包装（第一层）**：
   - 所有模板的标签/文案替换为剧情化中文（分类名、攻击类型、状态提示、计数器等）
   - 参考实现：`scripts/batch-generate-wolven.js` 中的 `STORY_RESKIN.labels` 映射表
10. **游戏内精灵图替换（第二层）**：用 ZenMux/Gemini 生成 128×128 绿幕精灵 → sharp chroma key 移除 → 透明 PNG → 通过 `CTX.sprites` 注入 + monkey-patch GameScene 渲染代码（见 Step 2c）。**所有视觉素材必须用 AI 生成，禁止 CSS 手绘**
11. **游戏环境替换（第三层，STORY_THEME）**：当模板默认视觉与剧情强烈冲突时，替换游戏核心视觉外壳。实现方式：
   - `STORY_THEME[ep].cssOverride` — 注入到 `</style>` 前（隐藏原 UI + 定义新视觉样式）
   - `STORY_THEME[ep].jsOverride` — 注入到 `fitShell()` 后（创建 DOM / Phaser 对象 + monkey-patch 渲染函数）
   - 注入时机：构建脚本 Step 15，在精灵图注入（Step 14）之后
   - **核心原则**：换皮不换芯 — 只 hook 渲染/视觉函数（`setTrafficLight()`/`drawLanes()`/`loadMaze()`），**绝不改动游戏逻辑**（pickLane、scoring、hit detection、物理、计时器全部原样）

   **Layer 3 决策门槛**（满足 *全部* 才做）：
   1. 模板视觉与剧情存在 *强烈* 冲突（一眼就觉得格格不入），不是细节瑕疵
   2. 可以找到一个"核心视觉外壳"元素做针对性替换（红绿灯、迷宫墙、车道 …），而不是整屏覆盖
   3. 替换不会遮挡可交互区域，不会影响任何点击/拖拽/碰撞
   4. 有匹配风格的素材可用 —— 要么 Layer 2 已生成的 sprite（优先复用），要么能 AI 生成一致风格的新图
   - 不满足以上任何一条就 **不做 Layer 3**。`大多数集不需要第三层`。

   **实现模式** — 根据游戏渲染机制选一种：

   **模式 A：DOM 层替换**（适用于用 HTML div/img 渲染的 UI 元素，如红绿灯）
   - 在 `game-shell` 里 append 新的 DOM 节点，CSS 隐藏原节点
   - Monkey-patch 原状态切换函数（`window.setTrafficLight`）同步新节点的 class/opacity
   - 素材：AI 生成多状态图片 + opacity 交叉淡入 + `mask-image: radial-gradient()` 柔化
   - 已验证 demo：**ep2** 红绿灯 → 狼眼（三张 1024×1024 open/half/closed）

   **模式 B：Phaser 画布层替换**（适用于游戏核心视觉在 canvas 里，如迷宫墙、车道）
   - `setInterval` 80ms 轮询等待 `window.__game` 和 `GameScene` 就绪（最多 80 次），用 `gs.__XXXHooked` 标志防重入
   - 在 GameScene 原渲染方法（或每关 regen 的入口）之上包一层 hook
   - 用 Phaser `add.image` / `add.graphics` 在 depth 比原绘制稍高（如原 depth 5 → 主题 5.5-6.5）处叠加，绝不移除或重写原对象
   - **必须 hook 重绘入口**让主题视觉跟游戏状态刷新：
     - `GameScene.loadMaze()` — maze 每次新关卡换地图（ep20）
     - `GameScene.drawLanes()` — 车道每回合随 freeIndex 变化（ep11）
     - 若没 hook 重绘入口，主题视觉会"卡在第一帧"
   - 每次重绘前 destroy 掉上一批主题对象（`_themeObjs` 列表），避免泄漏
   - 已验证 demo：**ep20** 迷宫墙（24×24 灰矩形 → 苔藓石块 Phaser image），**ep11** 停车道（3 条彩色车道 → 议政席 graphics + sprite 叠加）

   **素材决策顺序**（按顺序问自己）：
   1. **Layer 2 现有 sprite 能直接用吗？** 如果 sprite-*.png 里本来就有风格对的资源（ep11 的 sprite-car/sprite-slot 正好是卷轴+议政台），**直接复用，零 API 调用**
   2. **如果必须新生成 AI 图**：先 `Read` 一遍 `bg-scene.jpg` 和所有 `sprite-*.png`，总结现有风格关键词（"painted digital illustration"/"anime-inspired"/"flat shading"/"cool palette"），prompt 里强制匹配。不要看都不看就生成 —— ep20 第一版就栽在这里，photorealistic 3D 石块和 painted 2D 精灵风格完全对不上

   **背景禁动**：Layer 3 只换核心视觉外壳，**绝不换 Layer 2 已经定好的 bg-scene.jpg**。背景的视觉基调已经通过 Layer 2 对齐剧情（如 ep11 的议事厅、ep20 的月下森林），动它只会破坏整体一致性

   **Layer 3 与普通定制版严格隔离**（关键）：Layer 3 只注入到 `variant-themed.html`（深度定制版），**绝不注入到 `index.html`（普通定制版）**。构建脚本 Step 15 的入口必须写成 `const theme = isVariant ? STORY_THEME[ep] : null;`。原因：普通定制版是第一、二层标签+精灵的稳定基线，所有集都要走；Layer 3 是少数几集的"换皮"实验，混进普通版会让基线不稳定、风险扩散到所有集

   **换壳范围的边界**（只动"核心视觉外壳"，不动别的 HTML UI）：Layer 3 的靶点 **只是** 游戏核心视觉那几个元素（红绿灯、迷宫墙、车道）。**不要** 顺手改 `#lane-btns .btn-lane` 按钮配色、`.combo-text` 连击文字颜色、HP 条、score label 这些已经由 Layer 2 kmeans 从 bg-scene 派生好的 HTML UI。它们已经和背景和谐了，动它们只会引入第二套配色和 kmeans 配色打架。如果 `cssOverride` 不需要任何样式（canvas 内已经全部搞定），直接写 `cssOverride: ''` 即可

   **配色守则：从 `window.__V3_THEME__` 派生，绝不硬编码色值**（这是核心）

   Layer 2 已经通过 kmeans 从 `bg-scene.jpg` 提取了完整调色板，存在全局 `window.__V3_THEME__`：

   ```js
   {
     bg:           '#17191C',  // 深背景色（kmeans darks 组里最深的）
     primary:      '#5AA0E6',  // 主色（kmeans mids 组 top score，饱和度已拉到 ≥0.74）
     primaryLight: '#E0EDF3',  // 最浅色（kmeans lights 组里最亮的）
     strokeDark:   '#4478ad',  // primary 暗化 25%（适合做 muted 边框 / sealed tint）
     playerHp:     '#165A97',  // accent 色（与 primary 不同色相，保证 HP 条可区分）
     opponentHp:   '#5AA0E6',  // = primary
     gold:         '#F5C842',  // 固定金色（HP 条 pulse 等）
   }
   ```

   Layer 2 的按钮、HP 条、连击文字全部由这些字段驱动。**Layer 3 必须读这同一个对象**，让新增的 graphics/text 色值从字段派生：

   ```js
   function hexInt(h) { return parseInt(String(h||'#888').replace('#',''), 16); }
   var T = window.__V3_THEME__ || {};
   var PRIMARY     = hexInt(T.primary);      // graphics.lineStyle / setTint
   var STROKE_DARK = hexInt(T.strokeDark);   // sealed/muted 边框 + sealed sprite tint
   var BG_DARK     = hexInt(T.bg);           // graphics.fillStyle 底色
   var LIGHT_STR   = T.primaryLight;         // Phaser.add.text color (字符串)
   var DARK_STR    = T.bg;                   // text stroke 底色
   ```

   **映射套路**（从 Layer 2 ep11 推出的模板）：

   | Layer 3 元素 | 用的字段 | 为什么 |
   |-------------|---------|--------|
   | 活跃态底色 | `bg` | 深底让 sprite 跳出来 |
   | 活跃态边框 | `primary` | 和按钮/HP 条同色相 |
   | 活跃态高亮条 | `primary` @ 0.18 | 同色低透 |
   | 活跃态 glow tint | `primary` @ 0.35 | 光晕跟主色 |
   | 活跃态 label 字色 | `primaryLight` | 最亮，读得清 |
   | 活跃态 label stroke | `bg` | 最深，对比最强 |
   | sealed 态底色 | `bg` @ 0.92 | 退到背景里 |
   | sealed 态边框 | `strokeDark` @ 0.55 | 同色相但暗 55% |
   | sealed 态 sprite tint | `strokeDark` + `alpha 0.68` | 去饱和 + 半透明让它真正"淡出" |
   | sealed 态 label 字色 | `strokeDark` | 同色相暗版 |

   **为什么不能硬编码**（第一次 ep11 踩的坑）：
   1. bg-scene 的视觉印象和 kmeans 结果常常不一致 —— 议政厅肉眼是暖棕，kmeans 提取出来是蓝色（因为木纹反光和阴影里有大量冷色像素）。硬编码暖棕 → 和蓝色按钮打架
   2. 换一张新 bg-scene 时，kmeans 自动更新 → 硬编码的色值瞬间过时 → 又要手动调
   3. Layer 2 的 HP 条/按钮/label 都跟 kmeans 走，Layer 3 不跟就会引入第二套配色，永远存在"哪个才对"的问题

   **硬编码红线**：只有 `BG_DARK` 派生不出来的中性值（如完全的黑 `0x000` 阴影）可以硬写，任何带色相的值必须来自 `__V3_THEME__`

   **sealed/blocked 态退后技巧**：不光用暗色，还要 `.setAlpha(0.68)` + `.setTint(STROKE_DARK)` 双管齐下，让它真正 "淡出视觉前景" 不和 free 态抢戏

   - **大多数集不需要第三层**，仅在视觉冲突严重时使用
12. **ResultScene 增加剧情结语**：按 S/A/B/C 四档编写不同剧情描述文案。**结语用 narrative overlay 展示**（点"继续"后弹出全屏叠层，点击淡出），不要内联在结算 UI 里。**不要加下集预告**。**用 monkey-patch 注入**而非修改模板 create() 内部代码
13. **按钮/色系可自由调整**：色系不必严格按四大属性分配，让色调完全服务于剧情氛围

**monkey-patch 注入模式**（已验证最可靠的注入方式）:

> V3 模板代码风格不统一（有的用 `class`，有的用 `Phaser.Class`，有的是 minified），直接 regex 替换内部代码容易出错。**推荐用 monkey-patch 模式**：在 `fitShell()` 后、`</script>` 前注入 `(function(){ var proto = XXScene.prototype || XXScene; var orig = proto.create; proto.create = function() { /* 自定义逻辑 */ orig.call(this); }; })();`

已验证的 monkey-patch:
- BootScene preload（注入 coverImage 纹理加载）
- BootScene create（注入背景图渲染）
- ResultScene create（注入结语 overlay）
- GameScene preload（注入精灵图加载）
- GameScene spawnItem（注入精灵图渲染，如 conveyor-sort 的分类图标）

**⚠️ V3 模板必须注入的三大组件**（V3 模板本身不内置这些功能，必须每集手动注入）:

> **原则：V3 模板是纯游戏引擎，不含叙事层。深度定制时必须补齐以下三个组件，否则就是半成品。不要跳过任何一个。不要等用户提醒。**

**组件 A — NarrativeScene（叙事开场 + 结束对话）**:
- V3 模板只有 `BootScene → GameScene → ResultScene`，**不含 NarrativeScene**
- 必须注入: ① narrative-overlay CSS（`</style>` 前）② NarrativeScene 类（`class BootScene` 前）③ Phaser config scene 数组加 `NarrativeScene`
- Scene 顺序改为: `[NarrativeScene, BootScene, GameScene, ResultScene]`
- NarrativeScene 用于**开场叙事**：自动读取 `CTX.narrative[]`，逐句点击推进
- 对白结束后自动展示**考验宣告卡（Bridge Card）**：`—— {角色名}的{属性}考验 ——` + `CTX.copy.bootSubtitle`（剧情化引导语） + `点击开始考验`。这是剧情→游戏的核心衔接，不可跳过
- 宣告卡点击后淡出（0.5s opacity transition），进入 BootScene
- 若 `CTX.narrative` 为空，直接跳到 BootScene（兼容无叙事场景）
- NarrativeScene 也在 `preload()` 中加载 coverImage 作为叙事背景（低透明度叠加在 Phaser canvas 上）
- **结束语不用 NarrativeScene**，而是在 ResultScene create() 开头以 overlay 形式展示 `CTX.resultTexts[rating]`（按评级区分内容更有意义）。**ResultScene overlay 用 monkey-patch 注入**
- **完整游戏流程**: NarrativeScene(开场对白 → 考验宣告卡) → BootScene → GameScene → ResultScene(评级结语overlay → 结算UI)
- CSS:
  ```css
  .narrative-overlay { position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:50;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 32px;cursor:pointer; }
  .narrative-overlay .narrator { font-weight:800;font-size:14px;color:var(--primary-light,#C4B5FD);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px; }
  .narrative-overlay .line { font-weight:700;font-size:16px;color:#fff;text-align:center;line-height:1.6;max-width:320px; }
  .narrative-overlay .tap-hint { position:absolute;bottom:60px;font-weight:700;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:2px; }
  ```

**组件 B — initShellDOM 升级（头像图片加载 + 名字）**:
- V3 模板的 `initShellDOM()` 默认只设置首字母（如 "S"、"⚡"），**不加载头像图片**
- 必须替换/升级 `initShellDOM()` 为以下版本，使其从 `CTX.portraits` 读取图片 URL:
  ```javascript
  function initShellDOM() {
    $('title-text').textContent = EPISODE_LABEL + ': ' + EPISODE_TITLE;
    if (CTX.portraits) {
      ['left','right'].forEach(function(side) {
        var el = $('portrait-' + side);
        if (el && CTX.portraits[side]) {
          el.textContent = '';
          el.style.backgroundImage = 'url(' + CTX.portraits[side] + ')';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center top';
        }
      });
    }
    if (CTX.names) {
      var nl = $('name-left'), nr = $('name-right');
      if (nl && CTX.names.left) nl.textContent = CTX.names.left;
      if (nr && CTX.names.right) nr.textContent = CTX.names.right;
    }
  }
  ```
- **注意**: 仅 `will-surge`、`qte-hold-release`、`qte-boss-parry` 三个模板有 portrait DOM 元素，其他 9 个模板无 portrait 区域

**组件 C — ResultScene 结语 overlay（结算 UI 之前展示）**:
- V3 模板的 ResultScene 只有评级+分数，**不含剧情结语展示**
- **结语必须在结算画面之前展示**，不要放在"继续"按钮之后
- 在 ResultScene `create()` 开头注入：先显示 resultTexts overlay，点击后再调用 `showSettlement()` 展示结算 UI
- 将结算 UI 的渲染逻辑提取为 `showSettlement(T, rating, modifier)` 方法
  ```javascript
  create() {
    // ... 计算 rating, modifier
    if (CTX.resultTexts && CTX.resultTexts[rating]) {
      // 先隐藏所有 UI，显示结语 overlay
      var overlay = document.createElement('div');
      overlay.className = 'narrative-overlay';
      overlay.innerHTML = '...' + CTX.resultTexts[rating] + '...<tap-hint>点击查看结算</tap-hint>';
      overlay.addEventListener('pointerup', function() {
        overlay.remove();
        self.showSettlement(T, rating, modifier);
      });
    } else {
      this.showSettlement(T, rating, modifier);
    }
  }
  showSettlement(T, rating, modifier) {
    // 原来 create() 中的结算 UI 渲染逻辑
    // "继续"按钮直接 notifyGameComplete，不再弹 overlay
  }
  ```
- ResultScene 全屏矩形 alpha 设为 `0.85`（半透明），让背景图透出来
- **完整体验流程**: 游戏结束 → 结束语(narrativeOutro) → 评级结语(resultTexts) → 结算UI(评级/星/分数) → 继续

**关键文案替换清单**（按钮和标题需要中文化，游戏内统计标签保留英文）:

| 位置 | 英文默认 | 替换 |
|------|---------|---------|
| BootScene 按钮 | START | 开始考验 |
| BootScene 解锁按钮 | UNLOCK S TIER 🌙 50 | 解锁 S 级 🌙 50 |
| BootScene 副标题 | Challenge | 考验 |
| BootScene 说明文案 | Tap to push back... | 剧情化中文描述 |
| GameScene COPY 对象 | 全英文 | 通过 `CTX.copy` 覆写为剧情化中文 |
| ResultScene 按钮 | CONTINUE / REPLAY | 继续 / 再来一次 |
| ResultScene stats | Combo: / Hits: / Miss: 等 | **保留英文**（不需要翻译）|
| NarrativeScene 提示 | TAP TO CONTINUE | 点击继续 |
| ResultScene 结语提示 | — | 点击结束 |

**CTX.copy 字段**（覆写模板 COPY 对象的英文默认值）:
```javascript
"copy": {
  "gameTitle": "意志涌动",           // 或剧情化隐喻名
  "hint": "连续点击抵抗真相的冲击",    // BootScene dialogue
  "buttonLabel": "抵抗 ✊",          // GameScene 主按钮
  "statusHolding": "撑住了",         // 进度良好状态
  "statusNeutral": "坚守防线",       // 中性状态
  "statusLosing": "快撑不住了...",   // 进度不佳
  "surgeWarning": "⚡ 真相冲击 ⚡",  // 冲击波来临（will-surge）
  "surgeDefeated": "冲击抵御成功"    // 冲击波击退
}
```
每个模板的 COPY 字段不同，需按模板查看默认英文值后逐个覆写。

**素材生成不可省略清单**:

| 素材 | 要求 | 不可用替代 |
|------|------|-----------|
| 头像 `avatar-*.png` | 每集必须用 ZenMux Gemini 生成 tight headshot → 绿幕抠图 → 200×200 | ❌ 不可用全身参考图代替（72px圆框里只能看到胸口） |
| 背景图 `bg-scene.jpg` | 必须用 `sharp.resize(800).jpeg({quality:55})` 真正转为 JPEG | ❌ 不可 PNG 改扩展名（canvas drawImage 会失败导致 kmeans 取色无效） |
| 背景图格式验证 | 处理后用 `file` 命令或 `sharp.metadata()` 确认 format='jpeg' | ❌ 不可跳过验证 |

**kmeans 动态取色注意事项**:
- `file://` 协议下 canvas 跨域限制会导致 `drawImage` 失败 → kmeans 取色失效 → 回退到 preset theme
- **必须通过 `http://localhost` 访问**才能正常取色
- 验证方式: `preview_inspect` 检查 `--primary` CSS 变量值是否与 preset 默认值不同
- **resolveTheme 不再 fallback**：原来弱色直接 fallback 到 preset theme，现在改为**增强弱色**（饱和度拉到 ≥0.55，亮度夹到合理范围），永远使用从背景图提取的颜色。只有 `CTX.coverImage` 不存在时才用 `CTX.theme` preset
- **kmeans 必须确定性初始化**：`Math.random()` 导致每次刷新配色不同。替换为均匀间距采样：`var step = Math.max(1, Math.floor(pixels.length / k)); for (var ci = 0; ci < k; ci++) { centers.push(pixels[Math.min(ci * step, pixels.length - 1)].slice()); }`
- **paletteToTheme 配色映射**（已优化，避免同色相血条不可区分）：
  - `playerHp` → `p.primary`（主色，最醒目）
  - `opponentHp` → `p.secondary`（不同色相，与玩家血条形成对比）
  - `strokeDark` → `darken(p.accent, 0.25)`
  - 当背景图色相单一时（如全蓝），extractPalette 的 hueBonus 和 diversity 筛选能选出不同色相的 secondary
- **CTX 叙事文案**：`narrative`（开场白）+ `resultTexts`（按 S/A/B/C 评级的结语，在结算UI之前展示）。不要搞两层结语，一层按评级区分即可

### Step 1: 需求分析 & 模板选取

1. Log the task in `roadmap.md` (Target + deliverables checklist + start note).
2. Extract inputs — see **Step 0 Requirements Intake** above.
3. Read required docs (see **Required Reading Order**).

| Input | Format | Example |
|-------|--------|---------|
| 剧情/场景描述 | 自然语言 | "纹身坏男孩找女主麻烦，运动男挺身保护她" |
| **剧本包（current + next）** | `data/<story>/ep{N}/script.json` | `data/狼人/ep5/script.json`（含 EP5 + EP6 完整剧情与所有变体） |
| 人物参考图 | PNG/JPG (1-3张) | `data/狼人/ep5/character/Sylvia.png` |
| 背景图 | JPG / PNG | `data/狼人/ep5/background/银月领地 治疗师小屋.png` |
| 叙事对白 (可选) | JSON array | `[{speaker, text, portraitUrl?}]` |
| 游戏机制偏好 (可选) | 关键词 | QTE, 对抗, 闪避 |

> **剧本包结构**：每个 `ep{N}/` 目录含 `script.json` = `{ ep_num, variant, current, next }`。`current` 是本集完整剧本（pre_choice_script / choice_node / post_choice_outcomes），`next` 是下一集所有变体（mainline + minor_mainline）。带 minor_mainline 的集会有独立的 `ep{N}_minor/` 平行目录。

#### Step 1.5: 上下集衔接考量（**新**）

定制化时必须同时参考 `current` 和 `next` 两集剧情，而不仅是本集：

| 考量点 | 如何用 `current` | 如何用 `next` |
|--------|-----------------|--------------|
| NarrativeScene 开场基调 | 本集场景/人物情绪定主调 | 无 |
| GameScene 机制隐喻 | 本集冲突类型选模板 | 无 |
| ResultScene 结语 tone | 本集 choice_node 的对照结果 | **关键**：S/A/B/C 档结语要为 next 的剧情走向埋钩子；避免和下集开头情绪断裂 |
| 情绪承接 | 本集收尾情绪 | next 开场情绪——若差距大，ResultScene 要做过渡铺垫 |
| 角色关系弧线 | 本集新增/变化的关系 | next 是否延续/反转，决定本集结语留白还是收口 |
| BGM/色调 | 本集氛围定主色 | 若 next 氛围急剧反转，本集结语色可微调向 next 靠拢 |

**checklist**（开始写代码前过一遍）:
- [ ] 已读 `current.pre_choice_script` + `current.choice_node` + `current.post_choice_outcomes`
- [ ] 已读 `next.mainline.pre_choice_script`（至少前半段）
- [ ] ResultScene 的 S/A/B/C 四档结语**至少有一档**显式呼应 next 的开场
- [ ] 若本集有 minor_mainline 变体，确认当前做的是哪一条分支（看 `script.json.variant`）

4. **模板选取**（从 `packs/attribute-archetypes/` 12 模板中选取）:

   **Step 1a: 判断属性**
   - 正面对抗 / 追逐 / 精准出手 → **ATK 身手**
   - 忍耐 / 抵抗 / 克制 / 稳住情绪 → **WIL 意志**
   - 解谜 / 推理 / 规划路线 → **INT 智慧**
   - 表演 / 吸引 / 拉扯 / 社交节奏 → **CHA 魅力**

   **Step 1b: 匹配具体模板**
   - 读 `packs/attribute-archetypes/selection-manifest.json`
   - 将剧情关键词与每个候选的 `keywordsZh` / `bestFor` 对比
   - 选匹配度最高的模板作为基础

   **Step 1c: 防误选检查**（参考 `selection-matrix.md` Avoid Misrouting）
   - 不要因为涉及恋人就把战斗场景送 CHA
   - 不要因为紧张就把逃跑场景送 WIL（走位技巧应选 ATK）
   - 不要因为有密码就把战斗场景送 INT

   **示例**: "坏男孩找女主麻烦，男二保护她" → 关键词: 打架、保护别人、近身对抗 → ATK → `qte-boss-parry`

   **Step 1d: 防连续重复检查**
   - **相邻两集不得使用同一个模板**。批量定制时先列出全部集的模板分配表，逐对检查
   - 12 个模板覆盖 21 集必然有复用，但要**交错排列**：如 EP1=hold-release, EP2=will-surge, EP3=red-light, EP4=color-match...
   - 若某属性（如 WIL）出现频率高，在该属性 3 个模板间轮换，不要连续用同一个
   - 最终分配表应尽可能多地覆盖 12 个模板（目标 ≥10/12）

5. 读取选中模板的源码：`packs/attribute-archetypes/games/<game-id>/index.html`

### Step 2: 素材准备 (~10 min)

```
参考图 → ZenMux Gemini (green screen) → sharp chroma key → transparent PNG
```

1. **角色素材生成**: 用 `scripts/zenmux-image.js` 生成绿幕姿势
   - 每个角色 1-3 个姿势 (tense/action/calm)
   - Prompt: 绿幕 #00FF00, 全身, 无道具, 动漫风格
   - 人物表情必须匹配剧情 (躲藏→紧张, 战斗→愤怒, 浪漫→温柔)
   - **即使有其他 EP 的素材可复用，表情/姿势不匹配时必须重新生成**。紧张表情的角色图放在甜蜜场景里会破坏沉浸感，省不了这个步骤
   - 甜蜜/浪漫场景建议 prompt 关键词: gentle smile, blushing cheeks, hands clasped shyly, warm caring expression, soft romantic pose

   **1b. 头像素材生成（portrait 圆框用）**:
   - 模板中 72px 圆形 portrait 框**必须用 tight headshot（大头照）**，全身/半身图在小圆框里只能看到胸口，完全无法辨认
   - **统一 prompt 模板**（所有角色用同一个，保证构图一致）:
     ```
     "Based on this character, generate a tight headshot portrait
     (face and neck only, very close crop, face fills 80% of the image).
     Same character face, same hair color and style.
     Expression: <匹配剧情的表情描述>.
     Solid bright green #00FF00 chroma key background.
     No other objects, no body."
     ```
   - 用 `--input` 传入全身参考图保证角色一致性
   - **每集所有角色必须用同一 prompt 模板生成**，只替换表情描述部分，确保构图/裁剪统一

2. **绿幕抠图**: sharp chroma key removal → 验证 `hasAlpha: true`
   - chroma key 阈值: `g > 120 && g > r * 1.3 && g > b * 1.3` (纯绿→透明)
   - 边缘羽化: 近绿区域按 greenness 比例设置 alpha + 去绿溢 (`g = g*0.7 + max(r,b)*0.3`)
   - **验证**: 合成到白底 (`sharp composite`) 检查边缘干净度，确认 `hasAlpha: true`

   **2b. 头像后处理 pipeline（portrait 圆框用）**:
   ```
   绿幕 headshot → chroma key → sharp.trim(threshold:10) → 等比缩放到 200x200 → 居中填充
   ```
   - `trim()` 去掉透明边缘，消除不同角色构图差异
   - 缩放时留 10% 边距 (`scale * 0.90`)，避免贴边
   - 垂直方向偏上放置 (`topOffset = (size - h) * 0.25`)，保证圆框裁切时脸在中心
   - 输出文件命名: `avatar-<name>.png`（**ASCII 短名**，避免中文路径问题）

3. **背景图**: 直接使用提供的背景图
   - **压缩为 JPEG**（`sharp.resize(800).jpeg({quality:55})`），控制在 30-60KB
   - **文件名用 ASCII 短名**（如 `bg-cemetery.jpg`），避免中文+空格路径在 `file://` 或部分 WebView 中加载失败

   **2c. 游戏内素材生成（GameScene Phaser 画布用）**:

   不同模板的 Phaser 游戏区可用 AI 生成素材替换默认的程序化色块，提升沉浸感。按融合价值分三档：

   **🔴 高价值（必须生成）— 素材直接构成游戏核心体验**:

   | 模板 | 替换目标 | 需生成素材 | 尺寸 |
   |------|---------|-----------|------|
   | **lane-dash** | 玩家色块矩形 → 角色奔跑精灵 | `sprite-player-run.png` | 64×64 |
   | | 红色障碍矩形 → 追兵/狼影/路障 | `sprite-obstacle.png` | 64×64 |
   | **maze-escape** | 白色圆形玩家 → 角色俯视Q版头 | `sprite-player.png` | 40×40 |
   | | 程序化幽灵 → 狼形/暗影追踪者 | `sprite-ghost.png` | 40×40 |
   | | 程序化钥匙 → 故事道具（信物/月光钥匙） | `sprite-key.png` | 30×30 |
   | | 程序化出口 → 光门/逃生出口 | `sprite-exit.png` | 40×40 |
   | **spotlight-seek** | 暗色格子 → 目标角色正面头像 | `target-<name>.png` | 72×72 |
   | | 空格子 → 干扰剪影（其他角色模糊影子） | `decoy-1~3.png` | 72×72 |
   | **qte-boss-parry** | 色块 Boss 圆形 → 攻击姿势剪影 | `sprite-boss-attack.png` | 80×80 |
   | | 纯文字按钮 → 动作图标 | `icon-parry/dodge/block.png` | 32×32 |

   **🟡 中价值（推荐生成）— 增加剧情代入感**:

   | 模板 | 替换目标 | 需生成素材 | 尺寸 |
   |------|---------|-----------|------|
   | **stardew-fishing** | 鱼 emoji 🐟 → 剧情隐喻物件 | `sprite-catch.png`（如真相碎片/内狼/信件） | 30×30 |
   | **will-surge** | 程序化发光核心 → 狼族徽记/月亮符号 | `sprite-core.png` | 70×70 |
   | **conveyor-sort** | 包裹 emoji → 故事相关分类物件 + 精灵轮廓光晕 | `sprite-cat1/2/3.png` + `sprite-decoy.png`（分类图标） | 44×44（掉落物）/ 32×32（底栏） |

   **🟢 低价值（保持程序化渲染）— 加图片反而降低可读性**:

   | 模板 | 不加素材的理由 |
   |------|---------------|
   | **color-match** | 玩法核心是颜色辨识，图片干扰判断 |
   | **red-light-green-light** | 核心是节奏感知，视觉越简洁越好 |
   | **qte-hold-release** | 已有 portrait + gauge 提供叙事感，蓄力条是交互焦点 |
   | **parking-rush** | 空间谜题，抽象方块更清晰 |

   **游戏内素材 Prompt 模板**:

   ```
   # 角色精灵 (Sprite) — lane-dash / maze-escape 用
   [--input 传入角色参考图]
   "Based on this character, generate a small chibi/SD game sprite.
   [Side view / Top-down view] pose: [running / standing / attacking].
   Expression: [desperate / determined / gentle].
   Simple clean anime style, minimal detail, suitable for 64x64 display.
   Solid bright green #00FF00 chroma key background.
   Single character only, no other objects, no text."

   # 物件图标 (Icon) — stardew-fishing / conveyor-sort / maze-escape 用
   "Simple flat icon of a [wolf paw print / crescent moon / sealed letter /
   glass potion bottle], clean vector style, single object centered,
   solid bright green #00FF00 background, no shadow, no text.
   Suitable for 40x40 pixel display."

   # 游戏内头像 (Game Portrait) — spotlight-seek 用
   [--input 传入角色参考图]
   "Based on this character, generate a front-facing portrait
   (face only, centered, face fills 90% of frame).
   Expression: [menacing / worried / warm smile].
   Solid bright green #00FF00 chroma key background.
   No body, no accessories, no text."

   # 剪影 (Silhouette) — spotlight-seek 干扰项 / lane-dash 障碍用
   "Dark shadowy silhouette of an anime [wolf / running figure /
   hooded person], pure black with slight purple edge glow,
   transparent background PNG style on green #00FF00 background.
   Mysterious, ominous feel. 64x64 scale."
   ```

   **游戏内素材后处理 pipeline**:
   ```
   绿幕素材 → chroma key 抠图（同 Step 2 标准流程）
     → sharp.trim(threshold:10)        # 去透明边缘
     → sharp.resize(targetW, targetH, { fit:'contain', background: transparent })
     → 输出到 game/ 目录: sprite-xxx.png / icon-xxx.png / target-xxx.png
   ```

   **Phaser 集成方式**:
   ```javascript
   // BootScene preload — 加载游戏内素材
   this.load.image('player', 'sprite-player-run.png');
   this.load.image('obstacle', 'sprite-obstacle.png');

   // GameScene create — 替换程序化图形
   // 原: this.add.rectangle(x, y, 40, 64, 0xffffff)
   // 改: this.add.image(x, y, 'player').setDisplaySize(40, 64)
   ```

   **精灵轮廓光晕（Silhouette Edge Glow）**:

   **三处统一原则**：凡是同一类别的精灵图标，在游戏画面中出现的所有位置必须使用同一张精灵图 + 同样的光晕风格，包括：
   - **顶部图例（DOM）**：`buildLegend()` 用 `<img class="legend-sprite">` + CSS `drop-shadow` 轮廓光晕
   - **掉落物（Phaser）**：`spawnItem` patch 用 tinted scaled copies 轮廓光晕（44px 主体）
   - **底栏接收区（Phaser）**：`updateBins` patch 用同样的 tinted scaled copies 轮廓光晕（32px 主体）

   三处必须统一使用精灵图，不能出现"图例用 emoji + 色点、掉落物用精灵、底栏用色块矩形"这种不一致。

   用 tinted scaled copies 实现精灵图本身形状的边缘发光效果（比 Graphics 圆形光晕更高级，光晕贴合实际轮廓）：
   ```javascript
   // 原理：同一精灵图多层叠放，外层放大+染色+半透明，模拟边缘发光
   var col = hexToInt(categoryColor);
   // Layer 1: 最外层 — 放大到 1.3x，染色，低透明度
   var g3 = this.add.image(0, 0, spriteKey).setDisplaySize(58, 58).setOrigin(0.5);
   g3.setTint(col); g3.setAlpha(0.15);
   // Layer 2: 中间层
   var g2 = this.add.image(0, 0, spriteKey).setDisplaySize(52, 52).setOrigin(0.5);
   g2.setTint(col); g2.setAlpha(0.3);
   // Layer 3: 内层 — 接近原尺寸
   var g1 = this.add.image(0, 0, spriteKey).setDisplaySize(48, 48).setOrigin(0.5);
   g1.setTint(col); g1.setAlpha(0.45);
   // Layer 4: 主体精灵 — 原色原尺寸
   var img = this.add.image(0, 0, spriteKey).setDisplaySize(44, 44).setOrigin(0.5);
   ```
   适用场景：conveyor-sort 掉落物/底栏、所有需要类别色区分的精灵图标。
   注意：Canvas 模式下无法用 WebGL postFX，此方案是 Canvas 兼容的最佳替代。

   **DOM 元素精灵光晕（CSS drop-shadow）**:
   ```css
   /* 用于 sort-legend 等 DOM 元素的精灵图标，三层 drop-shadow 叠加出轮廓发光 */
   .legend-sprite {
     width: 22px; height: 22px; object-fit: contain;
     filter: drop-shadow(0 0 3px var(--glow-color))
             drop-shadow(0 0 6px var(--glow-color))
             drop-shadow(0 0 10px var(--glow-color));
   }
   ```

> 详细 pipeline 见下方 **Asset Generation & Processing Pipeline** 章节。

   **2d. 素材校验 checklist（生成后强制执行）**:

   > **每个 ep 的素材必须全部通过以下校验才能进入 Step 3。批量生成时对所有 ep 逐一检查。不通过 = 不合格，必须返回 Step 2 重新处理。**

   **自动校验脚本**（在项目根目录运行）：
   ```bash
   for ep in data/<story>/ep*/game; do
     echo "=== $(basename $(dirname $ep)) ==="
     # 1. 头像校验
     for avatar in "$ep"/avatar-*.png; do
       [ -f "$avatar" ] || continue
       node -e "
         const s=require('sharp');
         s('$avatar').metadata().then(m=>{
           const ok = m.width===200 && m.height===200 && m.hasAlpha;
           console.log('  '+'$(basename $avatar)'+': '+m.width+'x'+m.height+' alpha='+m.hasAlpha+' '+(ok?'✓ PASS':'✗ FAIL'));
         })
       "
     done
     # 2. 背景图校验
     for bg in "$ep"/bg-scene.jpg "$ep"/bg-*.jpg; do
       [ -f "$bg" ] || continue
       node -e "
         const s=require('sharp');
         s('$bg').metadata().then(m=>{
           const sizeKB = require('fs').statSync('$bg').size/1024;
           const ok = m.format==='jpeg' && m.width<=800 && sizeKB<80;
           console.log('  '+'$(basename $bg)'+': '+m.width+'x'+m.height+' '+m.format+' '+Math.round(sizeKB)+'KB '+(ok?'✓ PASS':'✗ FAIL'));
         })
       "
     done
   done
   ```

   **校验清单**：

   | # | 素材 | 合格标准 | 不合格常见原因 |
   |---|------|---------|-------------|
   | 1 | `avatar-*.png` 尺寸 | **200×200** | 用了全身参考图（768×1376），没跑 headshot pipeline |
   | 2 | `avatar-*.png` alpha | **hasAlpha = true** | 没走绿幕 chroma key 抠图 |
   | 3 | `avatar-*.png` 文件大小 | **< 100KB** | 全身图原图 ~1MB，说明没做 trim+缩放 |
   | 4 | `avatar-*.png` 是 headshot | **人脸占画面 80%+** | 全身/半身图在 72px 圆框里只能看到胸口 |
   | 5 | `bg-scene.jpg` 格式 | **format = jpeg**（真正的 JPEG） | PNG 改扩展名为 .jpg，canvas drawImage 会失败 |
   | 6 | `bg-scene.jpg` 尺寸 | **width ≤ 800, < 80KB** | 没跑 `sharp.resize(800).jpeg({quality:55})` |
   | 7 | `bg-main.png` 不存在于 game/ | game/ 里应只有处理后的 bg-scene.jpg | bg-main.png 是原图（~1.4MB），不应出现在 game/ |
   | 8 | 游戏内精灵（高价值模板） | `sprite-*.png` / `icon-*.png` 存在 | 高价值模板（lane-dash/maze-escape/spotlight-seek/qte-boss-parry）必须有精灵文件 |
   | 9 | 游戏内精灵 alpha | **hasAlpha = true** | 没走绿幕抠图 pipeline |
   | 10 | 表情匹配剧情 | 目视检查：表情与场景氛围一致 | 跨 ep 复用素材时紧张表情出现在甜蜜场景 |

   **批量素材处理要点**：
   - **不可直接把参考图复制为 avatar**。每个角色每集必须经过完整 pipeline：ZenMux headshot 生成 → 绿幕抠图 → trim → 200×200 居中
   - **跨 ep 复用头像时**：如果同一角色在不同 ep 的情绪相近（都是紧张），可以复用同一个处理后的 200×200 headshot。但如果情绪不同（紧张 vs 温柔），必须用不同的表情重新生成
   - **bg-main.png 是原图，bg-scene.jpg 是处理后的**：game/ 目录下只应存在 bg-scene.jpg（已压缩转码），bg-main.png 应留在 ep 根目录不进 game/
   - **素材处理应脚本化**：写一个 `scripts/process-ep-assets.js` 统一处理，避免手动操作遗漏。脚本应接受 ep 目录作为参数，自动完成 headshot 裁剪 + 抠图 + 背景图转码

### Step 3: 音频集成 (~10 min)

```
Freesound API 搜索 → 下载预览 → FreesoundAudio 类集成
```

1. **BGM**: 匹配场景氛围的循环音乐 (1首, 全程不中断)
2. **SFX**: 关键交互音效 (alert/success/fail/heartbeat 等)
3. **集成**:
   - FreesoundAudio 类从 CDN 加载, MoonAudio 合成器兜底
   - 部署时资源上传 OSS, 替换为永久 URL (见 Step 6)
4. **Freesound API**:
   - Key: `nPCAO7TRTMOZZER1ZePFP6R80bHMeYGW4xXJEPlz`
   - 预览 URL: `https://cdn.freesound.org/previews/{id1}/{id2}_{uid}-hq.mp3`
   - 代理: `ALL_PROXY=http://127.0.0.1:7890`

### Step 4: 游戏实现 (~30 min)

1. **基于 Step 1 选中的模板起步**: 复制 `packs/attribute-archetypes/games/<game-id>/index-v3.html` 到 `data/<story>/ep{N}/game/index.html`，在此基础上注入
2. **注入组件（全部用 monkey-patch 模式）**:
   - 组件 A: NarrativeScene 类 + CSS + 考验宣告卡 (Bridge Card)
   - 组件 B: initShellDOM 升级（头像 + 名字）
   - 组件 C: ResultScene 结语 overlay（monkey-patch ResultScene.create）
   - BootScene 背景图 patch（monkey-patch preload + create 加载并渲染 coverImage）
   - 精灵图加载 patch（monkey-patch GameScene preload + 渲染函数）
3. **Scene 顺序**: `NarrativeScene` → `BootScene` → `GameScene` → `ResultScene`
4. **叙事开场 + 衔接**: NarrativeScene 读取 `CTX.narrative` 对白 → 考验宣告卡 → BootScene
5. **三层定制体系**: 第一层（标签/文案剧情化）→ 第二层（AI 精灵图替换色块）→ 第三层（STORY_THEME 游戏环境替换，仅需时启用）
6. **素材生成**: 所有视觉素材用 AI 图像生成（ZenMux/Gemini），禁止 CSS 手绘。通过 `CTX.sprites` 注入精灵 + monkey-patch 渲染
4. **核心机制**:
   - 每个阶段必须有 **有意义的决策** (不是无脑点击)
   - 操作错误必须有 **明确惩罚** (tension 增加, 扣分, 屏幕震动)
   - 关键资源 (耐力/时间) 必须是 **有限的**
5. **音频**: BGM 首次交互后播放全程循环; SFX 绑定游戏事件; 处理 AudioContext suspended
6. **角色素材**: `this.load.image()` 在线加载; 保持原始宽高比

### Step 4b: 批量生成工作流（多集定制化）

> **此步骤适用于一次性定制多集（≥3 集）游戏的场景。单集定制跳过此步。**

**已验证的批量生成方案**: `scripts/batch-generate-wolven.js`（狼人22集）是完整参考实现，包含：
- CTX 注入 + 三大组件 monkey-patch + 考验宣告卡 + 三层定制（标签→精灵→环境替换）+ STORY_THEME 注入 + kmeans 确定性修复 + 弱色增强
- 配套精灵生成脚本：`scripts/generate-wolven-sprites.js`（ZenMux/Gemini → 绿幕 → chroma key → 透明 PNG）

**⚠️ 批量生成的核心陷阱：脚本只替换数据，不替换代码。** 必须用 monkey-patch 模式注入所有组件代码，而不是 regex 替换模板内部代码。

**强制工作顺序**（不可调换）：

1. **先完成 1 个标杆 ep 的完整深度定制**（含所有组件注入 + 浏览器验证通过）
2. **验证标杆 ep** — 在浏览器中确认：开场叙事 → 考验宣告卡 → 游戏正常（精灵图加载） → 结语 overlay → 结算 UI → 中文按钮
3. **以验证通过的标杆 ep 作为母版**运行批量脚本
4. **批量脚本必须保留母版的所有代码结构**，只替换 CTX 数据块和少量文本；不可用 regex 意外破坏 NarrativeScene 类或 CSS
5. **脚本运行后立即执行 Step 7b 校验**，不通过则报错中断

**批量脚本 generateGame() 末尾必须包含校验**：
```javascript
// 生成后强制校验 — 缺一不可
const REQUIRED_CHECKS = [
  ['class NarrativeScene',        '组件A: NarrativeScene 类'],
  ['narrative-overlay',           '组件A: narrative-overlay CSS'],
  ['NarrativeScene, BootScene',   'Scene 数组含 NarrativeScene'],
  ['resultTexts[rating]',         '组件C: resultTexts overlay'],
  ['backgroundImage',             '组件B: initShellDOM 头像加载'],
  ['p.secondary',                 'paletteToTheme 用 secondary 做 opponentHp'],
  ['bg.setScale',                 '背景图 cover 缩放（非 setDisplaySize 拉伸）'],
];
for (const [needle, label] of REQUIRED_CHECKS) {
  if (!html.includes(needle)) throw new Error(`EP${ep} 缺少 ${label}`);
}
```

**模板多样性强制规则**：
- 全集覆盖 ≥10/12 种模板，单模板使用 ≤3 次
- 相邻集（epN 与 epN+1）**禁止**使用同一模板
- 脚本生成前打印模板分配表，人工确认后再运行

### Step 5: 难度调校 (~15 min)

**核心原则**: 每个游戏阶段都要有风险/回报权衡

| 检查项 | 不合格标准 | 修复方向 |
|--------|-----------|---------|
| 某阶段无脑点 | 没有时机判断 | 加节奏脉冲/体力系统 |
| 某阶段放手等 | 环境威胁不影响玩家 | 让威胁自动增加 tension |
| 误操作无惩罚 | 错了也没后果 | 递增惩罚 (tension + 扣分 + 震动) |
| 关键资源无限 | 耐力/时间用不完 | 消耗加快, 恢复减慢 |
| S 级太容易 | 随便玩都能 S | 提高门槛, 加重惩罚 |

**数值参考** (25s 游戏): 20-30 次有效操作填满进度; 巡逻 3 次 3.5-5.5s 递增; 耐力 ~3.5s; 3 次误触 = 暴露; B 级大多数可达, S 级需完美。

### Step 6: 资源上传 & 在线部署 (~5 min)

```
图片/音频 → scripts/oss-upload.js → 阿里云 OSS → CDN URL 替换进 HTML
```

1. **上传资源**: `node scripts/oss-upload.js <game-id>`
   - 音频: `games/<game-id>/audio/*` → `audio/<game-id>/*`
   - 图片: `data/<ep>/character/*`, `data/<ep>/background/*` → `images/<game-id>/*`
2. **HTML 中引用 OSS URL**: 将 Freesound CDN / 本地路径替换为 `OSS_CDN_BASE` 下的永久链接
3. **OSS 配置**: `.env` 中的 `OSS_KEY_ID` / `OSS_KEY_SECRET` / `OSS_CDN_BASE`
4. **验证**: 资源 URL 可访问, 无跨域问题, 游戏正常加载

### Step 7: 验证 (~10 min)

使用 Claude Preview MCP 自动化验证:

1. `preview_start` → localhost:3333
2. `preview_screenshot` → 检查叙事开场 UI
3. `preview_click` → 推进对话
4. `preview_screenshot` → 验证游戏画面
5. `preview_eval` → 程序化验证机制 (热区/冷区/惩罚/评分门槛)
6. `preview_console_logs` → 无 JS 错误

#### Step 7a: 结算画面完整性检查（必检）

> **此检查直接验证游戏最终输出画面，必须对每个模板类型至少执行一次。**
> 这个检查之所以关键，是因为结算画面的 DOM 元素经过多层显示/隐藏控制：
> `resetAllDOM()` 隐藏所有 → `ResultScene.create()` 恢复父容器 → 子元素可能仍被隐藏。
> 仅靠 grep 代码结构无法发现此类运行时 DOM 可见性 bug。

**完整流转路径测试**（叙事→游戏→结算）：
```
开场叙事 → 点击推进 → 考验宣告卡 → BootScene →
开始/跳过游戏 → [有 resultTexts 时] 结语 overlay → 点击 →
结算画面（必须完整显示 6 项内容）
```

**结算画面 6 项必检内容**：

| # | 元素 | DOM ID | 合格标准 |
|---|------|--------|---------|
| 1 | 评级字母 | `grade-letter` | S/A/B/C 大号字母可见，颜色与评级匹配 |
| 2 | 得分文本 | `grade-score` | "得分 XXX" 可见 |
| 3 | 星级评定 | `stars-row` | 1-4 颗星可见，填充数与评级一致 |
| 4 | 属性加成 | `attr-mod` | "角色名的属性 +N" 可见 |
| 5 | 统计数据 | `stat-combo` + `stat-hits` | 连击数 + 命中/失误数据可见 |
| 6 | 操作按钮 | `btn-area` | "继续" + "再来一次" 按钮可见可点击 |

**程序化验证**（用 `preview_eval` 在结算画面执行）：
```javascript
// 结算画面 DOM 完整性检查 — 所有 display 不为 none 且有文本内容
var ids = ['grade-letter','grade-score','stars-row','attr-mod','stat-combo','stat-hits'];
var results = ids.map(function(id) {
  var el = document.getElementById(id);
  if (!el) return id + ': NOT_FOUND';
  var cs = getComputedStyle(el);
  var hidden = cs.display === 'none' || el.classList.contains('hidden');
  var text = (el.textContent || '').trim();
  return id + ': ' + (hidden ? 'HIDDEN ✗' : 'visible ✓') + ' text="' + text.substring(0,30) + '"';
});
results.join('\n');
// 期望: 所有 6 项均为 "visible ✓" 且 text 非空
```

**快速跳过游戏的方法**：大部分模板的 BootScene 有 "解锁 S 级" 按钮（`.btn-candy.secondary`），可直接跳到 ResultScene 测试结算画面，无需实际玩游戏。

**有 resultTexts 时的关键路径**：
`resultTexts` 存在时，ResultScene 会先弹出叙事结语 overlay（`.narrative-overlay`），
必须**点击 overlay 关闭后再验证**结算 UI。这一步是 bug 高发区——
`resetAllDOM()` 可能将子元素标记为 hidden，而 `origCreate()` 只恢复父容器。

### Step 7b: 批量生成后强制校验（多集定制化必须）

> **每次批量生成后必须执行此校验。不通过则不允许提交或标记完成。**

**自动校验脚本**（对所有生成的 ep 逐一检查）：
```bash
# 在项目根目录运行
for f in data/<story>/ep*/game/index.html; do
  echo "=== $f ==="
  grep -c "class NarrativeScene"   "$f" | xargs -I{} echo "  NarrativeScene class: {}"
  grep -c "narrative-overlay"      "$f" | xargs -I{} echo "  narrative-overlay CSS: {}"
  grep -c "NarrativeScene, Boot"   "$f" | xargs -I{} echo "  Scene array OK: {}"
  grep -c "resultTexts\[rating\]"  "$f" | xargs -I{} echo "  resultTexts overlay: {}"
  grep -c "backgroundImage"        "$f" | xargs -I{} echo "  Portrait loading: {}"
  grep -c "开始考验\|继续\|再来一次" "$f" | xargs -I{} echo "  Chinese copy: {}"
done
```

**校验清单**（每项必须 >0，否则该 ep 不合格）：

| # | 检查项 | grep 关键词 | 不通过说明 |
|---|--------|------------|-----------|
| 1 | NarrativeScene 类存在 | `class NarrativeScene` | 开场叙事不会显示 |
| 2 | narrative-overlay CSS | `.narrative-overlay` | overlay 无样式，显示为裸文本 |
| 3 | Scene 数组含 NarrativeScene | `NarrativeScene, BootScene` | 游戏跳过叙事直接开始 |
| 4 | resultTexts overlay 代码 | `resultTexts[rating]` | 结算前无剧情结语 |
| 5 | initShellDOM 加载头像 | `backgroundImage` | 头像框只显示首字母 |
| 6 | 中文按钮文案 | `开始考验` 或 `继续` | 按钮还是英文 START/CONTINUE |
| 7 | drawSceneBg（如有背景图） | `drawSceneBg` | 背景图不会渲染到各 Scene |
| 8 | ResultScene 子元素可见性修复 | `setVisible('grade-letter'` | 结算画面评级/分数/统计全部不显示（见 Step 7a） |

**素材校验**（与代码校验同等重要，同时执行）：

```bash
# 素材校验脚本 — 在代码校验之后立即运行
for ep in data/<story>/ep*/game; do
  echo "=== $(basename $(dirname $ep)) ==="
  # 头像: 必须 200x200 + hasAlpha
  for a in "$ep"/avatar-*.png; do
    [ -f "$a" ] || continue
    node -e "require('sharp')('$a').metadata().then(m=>{
      const ok=m.width===200&&m.height===200&&m.hasAlpha;
      const kb=Math.round(require('fs').statSync('$a').size/1024);
      console.log('  avatar: '+m.width+'x'+m.height+' alpha='+m.hasAlpha+' '+kb+'KB '+(ok?'✓':'✗ FAIL'))
    })"
  done
  # 背景图: 必须真 JPEG + ≤800px + <80KB
  [ -f "$ep/bg-scene.jpg" ] && node -e "require('sharp')('$ep/bg-scene.jpg').metadata().then(m=>{
    const kb=Math.round(require('fs').statSync('$ep/bg-scene.jpg').size/1024);
    const ok=m.format==='jpeg'&&m.width<=800&&kb<80;
    console.log('  bg: '+m.width+'x'+m.height+' '+m.format+' '+kb+'KB '+(ok?'✓':'✗ FAIL'))
  })"
  # bg-main.png 不应在 game/ 里
  [ -f "$ep/bg-main.png" ] && echo "  ✗ FAIL: bg-main.png 原图不应在 game/ 目录"
done
```

| # | 素材检查项 | 合格标准 | 不合格 = 没跑素材 pipeline |
|---|-----------|---------|--------------------------|
| 8 | 头像尺寸 | 200×200 | 768×1376 = 全身原图，没做 headshot |
| 9 | 头像 alpha | hasAlpha = true | false = 没走绿幕抠图 |
| 10 | 头像文件大小 | < 100KB | ~1MB = 原图未处理 |
| 11 | bg-scene.jpg 格式 | format=jpeg, width≤800, <80KB | PNG 改扩展名 / 未压缩 |
| 12 | bg-main.png 不在 game/ | game/ 只有处理后素材 | 原图泄漏到 game/ 目录 |
| 13 | 高价值模板有游戏精灵 | sprite-*.png 存在 | lane-dash/maze-escape 等没有精灵文件 |

**抽样浏览器验证**（至少 3 个 ep，覆盖首/中/尾）：
1. 打开 ep → 看到开场叙事 overlay → 点击推进 2-3 句 → 淡出进游戏
2. 完成游戏 → 看到评级结语 overlay → 点击后看到结算 UI
3. **结算画面 6 项完整性**（见 Step 7a）：评级字母 + 得分 + 星级 + 属性加成 + 统计 + 按钮全部可见
4. 按钮全部为中文
5. 头像圆框显示**图片**（非首字母），图片是大头照不是胸口截断
6. 背景图可见（淡显 opacity 0.20），不是纯色
7. 背景图**比例正常**（无拉伸变形），必须用 `setScale(Math.max(...))` cover 模式，禁止 `setDisplaySize(W,H)`
8. VS 对战类游戏中，**我方/对方 HP 条颜色有明显区分**（不同色相），非同色系深浅

**模板多样性验证**：
```bash
# 检查模板分配：统计各模板使用次数，确认 ≥10 种且无相邻重复
grep -l "cannon-aim\|color-match\|conveyor-sort\|lane-dash\|maze-escape\|..." data/<story>/ep*/game/index.html
```

### Step 8: 收尾 & 更新

1. Update `list.md` if game inventory changed.
2. If task spans multiple games, finish one end-to-end before starting the next.
3. Mark roadmap task complete with verification summary.

### File Structure Convention

```
games/<game-id>/
  index.html              # 唯一主版本 (Freesound 音频为主, MoonAudio 合成器兜底)
  audio/                  # 音频素材 (.mp3)
  images/                 # 游戏专属图片 (角色/背景)
  meta.json               # 游戏元数据 (用于 LLM 选择)
```

### Common Pitfalls

| # | 阶段 | 坑 | 解法 |
|---|------|-----|------|
| 1 | 素材-绿幕 | 白底图穿帮（白衣被删、白边残留、深色背景冲突） | **永远用绿幕流程**。仅当白底 JPG + 大卡片 + 浅色背景时可直接用；深色背景/小圆框/游戏内精灵全部走绿幕→抠图 pipeline |
| 2 | 素材-头像 | 全身图塞圆框只看到胸口；各角色构图不统一；复用旧头像表情不匹配 | 每集用 ZenMux 生成 **tight headshot**（同一 prompt 模板只换表情），走绿幕→抠图→trim→200×200 居中。情绪相近可复用，否则必须重新生成 |
| 3 | 素材-背景 | PNG 假转 JPG 导致 kmeans 失败；原图直接放 game/；竖屏拉伸变形；opacity 过高 UI 不可读 | 原图留 ep 根目录；game/ 只放 `sharp.resize(800).jpeg({quality:55})` 真正转码的文件。显示用 cover 模式 `setScale(Math.max(...))`，禁止 `setDisplaySize`。overlay alpha ≤0.25 |
| 4 | 素材-通用 | 路径含中文/空格加载失败；文件名不匹配；素材处理全靠手动 | ASCII 短名放 `game/` 同目录。batch-generate Step 0 有模糊匹配。写脚本统一处理 + Step 2d 校验（avatar 200×200 + alpha + <100KB） |
| 5 | 素材-表情 | 人物表情不匹配场景（紧张表情放甜蜜场景） | Prompt 明确写表情+姿势，必须匹配当前剧情氛围，不匹配必须重新生成 |
| 6 | 素材-精灵 | 精灵尺寸不对碰撞异常；全是色块没加精灵 | 精灵用 `setDisplaySize()` 匹配原色块尺寸，不改碰撞体。**所有 12 个模板都做精灵替换**，高价值模板优先 |
| 7 | 音频 | BGM 消失/中断；BGM 风格跟属性走与场景氛围冲突 | AudioContext resume 异步，全程一首循环不 stopBgm。BGM 以场景氛围为准（如紧张场景即使 CHA 属性也用 `tense`） |
| 8 | 选取 | 凭感觉选属性/模板；批量全用同一模板 | 看核心冲突选属性（打架→ATK，忍耐→WIL）。必须读 selection-manifest.json 匹配。覆盖 ≥10/12 模板，单模板 ≤3 次，相邻集不重复 |
| 9 | 部署 | OSS 资源 404；跨域问题 | 先 `oss-upload.js` 上传再替换 URL。Bucket 设 public-read ACL |
| 10 | 机制 | 某阶段无决策/无惩罚；死机制（如体力永远耗不空） | 每阶段风险/回报 + 递增惩罚。审查模板机制是否有实际影响，无意义的用有决策价值的替换（如体力→冲刺加速） |
| 11 | kmeans | 配色不稳定/弱色 fallback/file:// 不生效/暗色图取色失败 | 优先 `CTX.coverImage` 触发 kmeans。确定性均匀采样禁止 `Math.random()`。弱色用增强不 fallback。门卫已放宽至 `L>0.18 S>0.30`。**必须 localhost 验证** |
| 12 | 叙事-对白 | 对白太多点击疲劳；结尾加下集预告剧透 | NarrativeScene 对白 ≤4 句，精简到核心冲突。结语只聚焦本集，**不剧透下集** |
| 13 | 叙事-结语 | 结算只有数字/评级缺失/结语按钮重叠/两层结语体验差 | **只用一层 `resultTexts`**（S/A/B/C 四档），在结算 UI **之前**展示。`resetAllDOM()` 后必须恢复子元素可见性（`grade-letter` 等）。不要加 narrativeOutro |
| 14 | 叙事-人物图 | 强塞头像效果差；透明 PNG 背景黑色 | 不合适就不放。透明 PNG 后面加 `fillRoundedRect(0xffffff)` 白色垫层 |
| 15 | 叙事-bug | NarrativeScene 结束后 isOver 导致 win 回调跳过 | 加 `_winning` 标记位，win 路径绕过 `finishGame` |
| 16 | 定制-色彩 | candy 改色不生效；血条颜色太接近；色系死板跟属性走 | 同时覆写 `CANDY.cardPink` 和 `cardPinkLt`。playerHp→accent, opponentHp→secondary。色系服务于剧情氛围，不必按属性分配 |
| 17 | 定制-UI | 改布局导致混乱；drawSceneBg 未生效；命名都叫 -dark；ResultScene 背景消失 | **不改原模板 UI/UX 布局**，只通过 CTX 注入。检查 BootScene 资源加载。命名按风格（-sweet/-noir/-tense）。ResultScene 全屏矩形 alpha: 0.85 |
| 18 | 定制-文案 | 机制文案/游戏名/按钮留英文默认值 | 游戏名和规则剧情化（如"碎片拼图"）。按钮全部中文化。**统计标签（Score/Combo）保留英文** |
| 19 | V3组件 | V3 模板缺 NarrativeScene/头像/结语/考验宣告卡 | **必须注入三大组件**：NarrativeScene + initShellDOM 升级（`CTX.portraits`）+ ResultScene 结语 overlay。必须加考验宣告卡衔接剧情→游戏 |
| 20 | 批量生成 | 脚本不注入组件；先批量再修标杆；生成后不校验 | 以验证通过的标杆 ep 作母版，脚本只替换 CTX 块和文本。强制顺序：标杆→批量→Step 7b 校验全部 ep 通过 |
| 21 | STORY_THEME | CSS 手绘；图片边缘生硬；无切换动画；改了游戏逻辑 | **禁止手工作图**，全用 AI 生成。边缘用 `mask-image: radial-gradient(...)` 柔化。多状态用多图 + opacity 交叉淡入。只 hook 视觉函数，不改 update/计分/碰撞逻辑 |

## Episode Skin Pattern (叙事包装)

### 核心思路

模板是已经调优的游戏引擎，**不要大改**。Episode 只添加叙事外壳：

```
NarrativeScene(开场白) → BootScene → GameScene → ResultScene(评级结语overlay → 结算UI)
```

- **NarrativeScene** 是唯一新增 Scene（视觉小说对话过场）
- **普通定制化**: 模板改动仅两行 (BootScene START 目标 + Phaser config scene 数组)
- **深度定制化（V3 模板）**: 只需注入 `window.__EPISODE_CTX__`，**不改模板 UI/UX 布局**
- V3 模板内置 `coverImage` 背景 + 动态 palette 提取 + 7 preset theme，不需要自建 `drawSceneBg`
- 资产通过 `CTX` / `EP` 常量注入，不影响模板逻辑

### V3 CTX 注入结构（深度定制化首选）

V3 模板（`index-v3.html`）通过 `window.__EPISODE_CTX__` 注入定制数据，模板代码零改动：

```javascript
window.__EPISODE_CTX__ = {
  character: { name: 'Sylvia' },        // 主角名（显示在属性文案中）
  attribute: '意志',                     // 属性中文名
  episodeLabel: 'EP 1',                 // 标题栏前缀
  episodeTitle: '沉默的力量',            // 标题栏标题
  coverImage: 'bg-scene.jpg',          // 背景图（必须真正 JPEG，不可 PNG 改扩展名）
  theme: 'dark',                        // 7 选 1 fallback: combat/mystery/nature/dark/sweet/ocean/energy
  portraits: {                          // 72px 圆框头像（必须用 Step 2b tight headshot，不可用全身图）
    left: 'avatar-sylvia.png',          // 200×200 透明 PNG，ZenMux 生成 → 绿幕抠图 → trim → 居中
    right: 'avatar-james.png'
  },
  names: { left: 'Sylvia', right: 'James' },  // 替换默认 Player/Boss
  narrative: [                              // 开场对白（2-3句，点击推进，最后淡出进 BootScene）
    { speaker: 'Sylvia', text: '他跪在新坟旁，双臂揽着另一个女人。\n而我挺着七个月的肚子，站在三米外。' },
    { speaker: '', text: '风把Kennedy的哭声送过来。\nJames的手一直没有松开。' },
    { speaker: 'Sylvia', text: '压住情绪。在正确的时机开口。' }
  ],
  resultTexts: {                            // S/A/B/C 四档剧情结语（ResultScene 开头 overlay 展示，在结算UI之前）
    S: '你的沉默比任何质问都响。James终于无法忽视你的存在——\n你不需要他的答案了。',
    A: '你站在那里，记住了一切。\n下一次对峙，你不会再沉默。',
    B: '风还在吹。你站在原地没有离开，\n但心里已经开始记录每一个细节。',
    C: '你的声音被风压住了。\n但至少——你没有转身离开。'
  },
  copy: {                                   // 覆写模板 COPY 对象（全中文化 + 剧情化隐喻）
    gameTitle: '压住心跳',                    // 剧情化游戏名（替换模板默认名）
    bootSubtitle: '压住情绪，蓄力反击',        // 考验宣告卡引导语（Bridge Card 核心文案）
    hint: '长按蓄力，压住内心的波澜',          // BootScene dialogue
    buttonLabel: '蓄力 ✊',                  // GameScene 主按钮
    statusHolding: '撑住了',
    statusNeutral: '坚守防线',
    statusLosing: '快撑不住了...'
  },
  sprites: {                                 // 精灵图映射（第二层定制，CTX.sprites）
    charge: 'sprite-charge.png',             // 蓄力图标（128×128 透明 PNG）
    release: 'sprite-release.png'            // 释放图标
  }
  // 精灵图由 scripts/generate-wolven-sprites.js 生成（ZenMux/Gemini → 绿幕 → chroma key → PNG）
  // monkey-patch GameScene preload 加载精灵，patch 渲染函数替换 emoji/色块为 this.add.image()
};
```

**配色机制**: `coverImage` 设置后，模板自动 kmeans 聚类提取背景图 primary/accent/secondary 三组色。**弱色自动增强**（饱和度 ≥0.55，亮度夹到合理范围）而不是 fallback。kmeans 必须用确定性均匀采样初始化（禁止 `Math.random()`），确保每次刷新配色一致。不想动态取色时，不设 `coverImage`，仅用 `theme`。

**结语展示**: `resultTexts` 的内容通过 narrative overlay 展示（点"继续"后弹出全屏叠层，点击淡出），不要内联在结算 UI 里。**不要加下集预告**。

**资源文件全部放在 `game/` 同目录下**，使用 ASCII 短名：
```
data/<story>/ep{N}/game/
  index.html           # 模板副本 + CTX 注入 + monkey-patch
  bg-scene.jpg         # 背景图（800px JPEG, 30-60KB）
  avatar-sylvia.png    # 大头照头像（200x200 PNG, 40-60KB）
  avatar-james.png
  sprite-charge.png    # 游戏内精灵（128x128 透明 PNG, 10-20KB）
  sprite-release.png   # 由 scripts/generate-wolven-sprites.js 生成
  sprite-cat1.png      # conveyor-sort 分类图标等（模板不同精灵不同）
```

### EP 常量结构（旧版 V1/V2 模板）

**普通定制化** — 基础字段:

```javascript
const EP = {
  title: 'Episode 5',
  subtitle: 'Heartbeat Control',   // ResultScene 副标题
  gameId: 'ep5-heartbeat-control',
  assets: {                         // preload 加载
    avery: '../../data/ep5/character/avery.jpg',
    aiden: '../../data/ep5/character/aiden.jpg',
  },
  narrative: [                      // NarrativeScene 对白（不超过 4 句）
    { speaker: 'Avery', key: 'avery', text: "..." },
    { speaker: 'Aiden', key: 'aiden', text: "..." },
  ],
  characters: {                     // 角色元数据
    avery: { name: 'Avery', color: '#F9A8D4' },
    aiden: { name: 'Aiden', color: '#C084FC' },
  },
};
```

**深度定制化** — 增加 `backgrounds` 字段:

```javascript
const EP = {
  // ... 基础字段同上 ...
  backgrounds: {
    boot:      '../../data/ep7/background/campus.jpg',  // 各 Scene 背景图（全部可选）
    narrative: '../../data/ep7/background/campus.jpg',
    game:      '../../data/ep7/background/campus.jpg',
    result:    '../../data/ep7/background/campus.jpg',
    opacity: 0.2,              // 背景图透明度 (0.1-0.5)
    overlay: '#0D0A14',        // 深色叠层保证 UI 可读性
    overlayAlpha: 0.55,        // 叠层透明度
  },
};
```

**深度定制化需要同时覆写的模板色值**:

色系不必按四大属性 (ATK/WIL/INT/CHA) 的默认色走，完全服务于剧情氛围。可参考 `packs/attribute-archetypes/STYLE-POLISH-SKILL.md` 中的 PALETTE/CANDY/按钮体系自定义。以下为两种典型风格参考：

**暗色系（紧张/悬疑/对峙场景）**:
```javascript
// PALETTE 覆写
bgBase:'#1A1520', textDark:'#F0E8F8', textMuted:'#A89BB8',
trackBg:'#3A2C50', trackBorder:'#4D3E66'

// Candy 卡片色 — 暗紫
cardPink: '#2D1F3D', cardPinkLt: '#3D2E52'

// HTML body
html, body { background: #1A1520; }

// EP.backgrounds overlay
overlay: '#1A1520', overlayAlpha: 0.55
```

**暖色系（甜蜜/浪漫/温馨场景）**:
```javascript
// PALETTE 覆写
bgBase:'#FFF5F7', textDark:'#3D1F2E', textMuted:'#9B7B8E',
trackBg:'#FCE7F3', trackBorder:'#F9A8D4'

// Candy 卡片色 — 暖玫瑰粉
cardPink: '#FFE0EB', cardPinkLt: '#FFEDF3'

// HTML body
html, body { background: #FFF5F7; }

// EP.backgrounds overlay — 浅粉叠层保持柔和
overlay: '#FFF0F3', overlayAlpha: 0.45
```

### drawSceneBg 函数（深度定制化专用）

深度定制化通过 `drawSceneBg` 替换所有 `setBackgroundColor + drawDotPattern` 调用：

```javascript
function drawSceneBg(scene, sceneKey, dotOpacity) {
  scene.cameras.main.setBackgroundColor(PALETTE.bgBase);
  const bgAssetKey = 'ep_bg_' + sceneKey;
  if (EP && EP.backgrounds && scene.textures.exists(bgAssetKey)) {
    const tex = scene.textures.get(bgAssetKey).getSourceImage();
    const scale = Math.max(W / tex.width, H / tex.height);
    scene.add.image(W / 2, H / 2, bgAssetKey)
      .setScale(scale).setDepth(0).setAlpha(EP.backgrounds.opacity || 0.25);
    if (EP.backgrounds.overlay) {
      scene.add.rectangle(W / 2, H / 2, W, H,
        hexToInt(EP.backgrounds.overlay), EP.backgrounds.overlayAlpha || 0.4)
        .setDepth(0.5);
    }
  }
  drawDotPattern(scene, dotOpacity);
}
```

**使用方式**: 在每个 Scene 的 `create()` 中替换原来的两行:
```javascript
// 原来:
this.cameras.main.setBackgroundColor(PALETTE.bgBase);
drawDotPattern(this, 0.05);

// 替换为:
drawSceneBg(this, 'game', 0.03);  // sceneKey = boot/narrative/game/result
```

**BootScene preload 中加载背景图**:
```javascript
if (EP.backgrounds) {
  Object.entries(EP.backgrounds).forEach(([key, path]) => {
    if (typeof path === 'string' && path.match(/\.(jpg|png|webp)$/i)) {
      this.load.image('ep_bg_' + key, path);
    }
  });
}
```

**向后兼容**: 当 `EP.backgrounds` 不存在时，自动退化为纯色 + 点阵，与普通定制化行为一致。

### NarrativeScene 设计要点

1. **大尺寸 portrait 卡片 (240×320)**：candy card 边框 + gold corners; 白底 JPG 自然融入奶油底色; **透明 PNG 必须在 image 后面垫一层白色 `fillRoundedRect`**，否则透明区域在 canvas 上渲染为黑色
2. **`setOrigin(0.5, 0)` 顶部锚点**：从头部开始显示，裁掉脚部，而不是裁掉头
3. **几何遮罩裁切**：`fillRoundedRect` → `createGeometryMask`，保持圆角
4. **宽度缩放**: `scale = cardW / imgNativeW`，只做等比缩放
5. **角色切换**：`setTexture()` + 重新计算 scale，配合 fade tween
6. **打字机效果**：30ms/字，点击跳过当前行 or 推进下一行
7. **最后一行点击后**: fadeOut(400) → `scene.start('GameScene')`
8. **BGM**: 从 NarrativeScene 开始播放 (`audio.bgm(THEME.bgmStyle)`)，GameScene 不重复启动

### 人物素材适配规则

| 素材类型 | 适用位置 | 注意事项 |
|---------|---------|---------|
| 白底 JPG 全身 | NarrativeScene 大卡片 (240×320) | 白底融入奶油 bgBase; 顶部锚点保头 |
| 白底 JPG 全身 | ResultScene 小圆框 | **不推荐** — 裁切后只见衣服/头发，观感差 |
| 透明 PNG (绿幕流程) | 所有位置 | 最佳方案，但需额外处理步骤; **NarrativeScene 必须加白色背景垫层** |
| Q版/头像图 | ResultScene 小圆框 | 如果需要结算页头像，用专门的头像图 |

**原则**: 宁可不放，也别强塞。全身图在 <100px 圆框里几乎不可能好看。

### Win Condition 安全模式

模板的 `finishGame` 通常有 `if (this.isOver) return` 守卫。如果 win 条件在 `delayedCall` 中触发，而 `isOver` 已在计时器回调前被设为 true，会导致 win 回调被跳过。

**修复模式**:
```javascript
// GameScene.init() 中增加
this._winning = false;

// Win 条件触发时
if (this.catchProgress >= 1 && !this._winning) {
  this._winning = true;
  // 绕过 finishGame，直接跳转
  this.time.delayedCall(800, () => {
    this.scene.start('ResultScene', { score, rating, ... });
  });
}
```

### 截图验证 (Playwright)

Claude Preview MCP 无法捕获 WebGL canvas 内容（超时）。使用 Playwright + 系统 Chrome:

```javascript
const { chromium } = require('playwright-core');
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 393, height: 736 } });
await page.goto('http://localhost:3333/games/ep-5_scene01/index.html');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshot.png' });
```

**注意**:
- NarrativeScene 需要多次 tap 推进（每行对白 = skip打字 + 下一行 = 2次点击）。
- `page.click('canvas')` 无法触发 Phaser 交互元素，必须用 `page.mouse.click(x, y)` 指定坐标。START 按钮通常在 `(196, 530)` 附近，叙事推进点击在 `(196, 400)` 附近。

## Stability Rules Learned From Recent Delivery Work

### Layout stability
- Reserve vertical bands deliberately:
  - header and score band: roughly `y 24-126`
  - play card: roughly `y 188-548`
  - status and combo band: below the play card, never overlapping it
  - primary CTA: low thumb zone with comfortable bottom margin
- Dense choice layouts should prefer 2×2 cards or a dedicated answer area over stacked buttons.
- If status or hint text wraps into gameplay space, shorten the copy first, then move the band lower if needed.
- Keep gameplay copy mobile-short. Long instructions are a recurring source of overlap.

### Implementation stability
- Do not assume every game uses `ResultScene`; existing games may use `RatingScene`.
- Do not assume CTA buttons are immediately interactive; some scenes fade or delay them in.
- Use a deterministic modifier lookup and verify it against the rating enum every time.
- Preserve the bridge order exactly.

### Verification stability
- Run a syntax compile pass on every generated HTML script block.
- Run browser verification, not just static inspection.
- Settlement verification should cover:
  - page loads and canvas exists
  - settlement scene is reachable
  - final CTA emits payload
  - payload contains `rating / score / attribute / modifier`
  - modifier matches the fixed `S / A / B / C` lookup
- For large packs, use a generic CTA verification flow for standard `ResultScene` games and a special-case flow for any game with a different result scene structure.
- After UI moves, re-check the exact pages that were touched with a real browser view.

## Template V2: Hybrid DOM+Phaser 架构

### 为什么要 V2

原版模板全部用 Phaser Graphics/Text 渲染 Shell UI（标题栏、HP 条、按钮等）。问题：
- **高 DPI 屏幕文字模糊** — Phaser canvas 文字渲染质量远不如 CSS
- **UI 样式受限** — 渐变、圆角、阴影等用 Graphics 很难精确复现设计稿
- **重复代码多** — 每个游戏 ~2000 行中 ~800 行是相同的 Shell 绘制

V2 架构：**Shell UI 用 HTML/CSS DOM，Phaser 只做游戏对象 + 粒子特效**。

### 架构规则

```
#game-shell (393×852, position:relative)
  ├── #phaser-container (z-index:1, transparent canvas — 粒子/特效/游戏对象)
  ├── .title-bar (z-index:10, DOM — 标题 + 扇形底边)
  ├── [游戏特有区域] (z-index:5~11, DOM/Phaser 混合)
  ├── .score-display (z-index:11, DOM — 分数 + 加减动画)
  ├── .timer-text (z-index:11, DOM)
  └── .btn-area (z-index:10, DOM — 糖果按钮)
```

**Phaser 配置**:
```javascript
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const config = {
  type: Phaser.CANVAS,        // 不用 AUTO/WEBGL
  parent: 'phaser-container',
  width: 393, height: 852,
  resolution: DPR,             // 必须设置！
  transparent: true,           // 透明背景
  scale: { mode: Phaser.Scale.NONE },
  scene: [BootScene, GameScene, ResultScene]
};
```

**fitShell() 缩放**：整个 `#game-shell` 用 CSS transform 缩放适配屏幕。

### 配色系统（静态预设 + 动态提取）

游戏有两种配色来源，运行时自动选择：

```
游戏启动
  ├── 有 CTX.coverImage（Episode 剧情嵌入）?
  │   ├── YES → 加载封面图 → extractPalette() → 动态 5 色调色板
  │   │         质检不通过? → fallback 到 CTX.theme 或 'combat' 静态预设
  │   └── NO  → 用 THEMES[CTX.theme || 'combat'] 静态预设
  └── 两条路径最终都写入同一套 CSS 变量 (--primary, --bg, --primary-10, etc.)
```

#### 方式 A：静态预设（5 套 THEMES）

通用场景、独立游戏。通过 `?theme=X` 或 `CTX.theme` 选择。

| 氛围 | ID | 背景色 | 主色 | 适用场景 |
|------|-----|--------|------|---------|
| 🔥热血 | combat | #1A1221 | #EC4F99 | 战斗、追逐、对抗 |
| 🌊神秘 | mystery | #0F1729 | #3B82F6 | 探索、解谜、潜行 |
| 🌿清新 | nature | #0F1F16 | #10B981 | 田园、策略、休闲 |
| 💜暗黑 | dark | #110E1A | #8B5CF6 | 抵抗、压力、意志 |
| 🌸甜美 | sweet | #1A1221 | #F472B6 | 匹配、节奏、社交 |

```javascript
const THEMES = {
  combat:  { bg:'#1A1221', primary:'#EC4F99', primaryLight:'#F9A8D4', circleTail:'#FFE0F8', playerHp:'#4FECA2', opponentHp:'#EC4F99', gold:'#F5C842' },
  mystery: { bg:'#0F1729', primary:'#3B82F6', primaryLight:'#93C5FD', circleTail:'#DBEAFE', ... },
  // ...
};
const T = THEMES[CTX.theme || params.get('theme') || 'combat'];
// 写入 CSS 变量
Object.entries({ '--bg':T.bg, '--primary':T.primary, ... })
  .forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
```

CSS 中一律用 `var(--primary)` 等变量，不硬编码颜色。

#### 方式 B：动态提取（从封面图取色）

Episode 剧情嵌入场景。封面图的颜色自动成为游戏配色，视觉完美匹配故事氛围。

**算法核心**（完整实现见 `design-system/ui-visual-language.md` §3.6）：
```
封面图 → 缩小到 80×80 → K-Means k=12 → 分三区（lights/darks/mids）
→ 对 mids 按「年轻感评分」排序（粉/紫最高分，土黄减分）
→ 贪心多样性选 3 色（色相差 >50° 且亮度差 >0.25）
→ 饱和度提升 clamp(S, 0.74, 0.92)
→ 输出 { primary, accent, secondary, surface, text, bgDark }
```

**年轻感评分** — 保证提取的颜色符合「糖果霓虹」美学：
```javascript
vibeScore = Math.pow(s + 0.05, 0.55) * bell(l, 0.57, 0.21) * hueBonus(h);
// hueBonus: 粉红/品红 1.28, 紫 1.22, 薄荷/青 1.20, 蓝 1.15, 黄/黄绿 0.65
```

**Fallback 瀑布**（单色封面兜底）：
1. 标准贪心从 mids 选色
2. 不足 2 色 → 从 darks 中 S>0.30 的提亮（L +0.30）
3. 仍不足 → 数学生成互补色（色相旋转 150°），标记 `generated: true`

**质检标准**（硬错误自动修正，不通过则 fallback 到静态 THEME）：
```
硬错误：primary.L <40% 或 >75%，primary.S <60%，surface.L <80%，text.L >30%
软警告：accent.fromDark=true，accent.generated=true，hue diff <60°
```

**集成代码**：
```javascript
// 在游戏启动逻辑中：
async function resolveTheme() {
  if (CTX.coverImage) {
    try {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.src = CTX.coverImage;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 80;
      canvas.getContext('2d').drawImage(img, 0, 0, 80, 80);
      const palette = extractPalette(canvas.getContext('2d').getImageData(0,0,80,80));
      if (palette) return {
        bg: palette.bgDark, primary: palette.primary,
        primaryLight: palette.surface, playerHp: palette.accent,
        opponentHp: palette.secondary, gold: '#F5C842'
      };
    } catch(e) { console.warn('Dynamic palette failed, falling back to static theme'); }
  }
  return THEMES[CTX.theme || 'combat'];
}
```

**调色板应用顺序**（动态取色后替换颜色时必须遵守）：
```
Step 1  插入 CSS 结构块（在颜色替换之前）
Step 2  替换完整渐变字符串（conic-gradient/linear-gradient 整段）
Step 3  替换单个 hex 颜色
Step 4  替换 rgba() 颜色
Step 5  嵌入封面图（如需要 Layer 1 封面背景）
Step 6  替换 JS 中的颜色引用
Step 7  验证：扫描残留旧 hex
```
> 详见 `design-system/ui-visual-language.md` §3.9。关键：**渐变字符串必须在单色 hex 之前替换**，否则渐变中的中间派生色会残留。

### 布局分类：按游戏玩法设计 UI

**关键原则：UI 服务于玩法。绝对不要给所有游戏套同一个通用布局。**

每个游戏的 UI 应该围绕其核心玩法来设计：

| 游戏类型 | UI 设计思路 | 示例 |
|---------|-----------|------|
| VS 对战 | 头像 + HP 条 + 对话气泡 + 攻击提示圈 | qte-boss-parry |
| 蓄力释放 | 环形蓄力仪表盘 + 目标区高亮 | qte-hold-release |
| 抵抗压力 | 脉冲核心 + 意志/压力双条 | will-surge |
| 射击瞄准 | 全屏射击区 + 瞄准线 + 目标 | cannon-aim |
| 车道闪避 | 三车道全屏 + 生命心 | lane-dash |
| 红绿灯 | DOM 信号灯 + 跑道进度条 | red-light-green-light |
| 颜色匹配 | 大色卡展示 + 答案网格 | color-match |
| 传送分拣 | 三列传送带 + 分类箱 | conveyor-sort |
| 钓鱼 | 垂直钓鱼仪表 + 鱼区 + 浮漂 | stardew-fishing |
| 迷宫 | 迷宫网格全屏 + D-Pad | maze-escape |
| 聚光搜索 | 暗场全屏 + 聚光灯 | spotlight-seek |
| 停车 | 俯视停车场 + 车位高亮 | parking-rush |

**分析新游戏时的思考流程**:
1. 核心玩法是什么？（点击位置、按住、拖拽、方向键？）
2. 游戏内容需要多大面积？（迷宫/射击场需要大空间 vs QTE 只需要提示区）
3. 玩家的操作方式？（直接点击游戏区 vs 按钮控制）
4. 有没有对抗方？（有 → 双方 HP/状态条；无 → 简洁信息条）

### 交互设计原则

**直接交互优先于底部按钮**:
- 可点击的游戏对象（车位、网格、目标）→ 用 Phaser `setInteractive()` 透明 hitArea
- 方向控制类 → 底部 D-pad 按钮 + 键盘 + 触屏左右半区
- 按住/释放类 → 底部大按钮合适（钓鱼、红绿灯、蓄力）
- 选择类 → 答案按钮在游戏区附近（不一定在底部）

**反面案例**：停车游戏只有底部 LEFT/CENTER/RIGHT 按钮 → 应该能直接点击车位

### 共享 DOM 组件

所有 V2 游戏共享以下 DOM 辅助函数（从参考实现 `qte-boss-parry/index-v2.html` 复制）：

- `$(id)` — getElementById 简写
- `setVisible(id, bool)` — 显示/隐藏
- `makeCandyButton(label, class, fontSize, onClick)` — 4 层糖果按钮
- `clearBtnArea()` — 清空按钮区
- `fitShell()` — 响应式缩放
- `MoonAudio` 类 — 合成器音效
- `spawnParticles()` / `showToast()` / `damageFlash()` / `screenShake()` — Phaser 特效
- **boot-card** — BootScene 引导说明用 DOM div（不用 Phaser text），GameScene 时隐藏：
  ```html
  <div id="boot-card" style="position:absolute;top:200px;left:50%;transform:translateX(-50%);
    z-index:11;text-align:center;color:#fff;font-family:Montserrat;">
    <h2>游戏标题</h2><p>规则说明...</p>
  </div>
  ```

**糖果按钮 CSS**: 4 层结构 — base(`var(--primary)`) + glass(`rgba(255,255,255,0.3)`) + highlight(顶部 20px) + glow(inset shadow)。圆角 24px，按下位移 3px。

**分数 delta 动画**: `@keyframes deltaPop` — +N 绿色 / -N 主色 上浮淡出。

### V2 视觉规范

> 世界观：**「黑色宇宙里的糖果霓虹」** — 极暗底色 × 极鲜艳前景。
> 背景永远是深暗带色相的（禁止纯黑 #000/#111），色彩像糖果在夜市发光。

#### CSS Token 透明度变体

除了 `--primary`、`--bg` 等实色变量外，每套 THEME 还需生成透明度变体，用于渐变和玻璃效果：

```css
:root {
  /* 核心色（由 THEMES 对象写入） */
  --bg: ...; --primary: ...; --primary-light: ...;
  --player-hp: ...; --opponent-hp: ...; --gold: ...;

  /* 透明度变体（从 --primary 派生，启动时 JS 计算写入） */
  --primary-10: rgba(R,G,B, 0.10);
  --primary-20: rgba(R,G,B, 0.20);
  --primary-30: rgba(R,G,B, 0.30);
  --primary-50: rgba(R,G,B, 0.50);

  /* 固定色（不随主题变化） */
  --white: #FFFFFF;
  --white-20: rgba(255,255,255,.20);
  --white-30: rgba(255,255,255,.30);
  --white-50: rgba(255,255,255,.50);
  --black-15: rgba(0,0,0,.15);
  --black-25: rgba(0,0,0,.25);
}
```

JS 计算透明度变体的方法：
```javascript
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
// 启动时：
const T = THEMES[themeName];
const root = document.documentElement.style;
root.setProperty('--primary-10', hexToRgba(T.primary, 0.10));
root.setProperty('--primary-20', hexToRgba(T.primary, 0.20));
root.setProperty('--primary-30', hexToRgba(T.primary, 0.30));
root.setProperty('--primary-50', hexToRgba(T.primary, 0.50));
```

**规则**: 组件中不允许硬编码 hex 值，只用 CSS 变量 token。

#### 渐变食谱（6 套标准配方）

渐变方向规则：按钮/HP 条/竖向元素 → **180deg**（顶淡底浓，模拟顶部光源）；圆形内区 → **radial**；圆形外环 → **conic**。

```css
/* G-01  主色渐变填充（CTA 按钮、卡片 hero 区） */
background: linear-gradient(180deg, var(--primary-10) 0%, var(--primary) 100%);
border: 2px solid #FFF;  /* 渐变背景配白边 */

/* G-02  HP / Progress Bar（垂直，上淡下浓） */
background: linear-gradient(180deg, rgba(accent, .10) 0%, var(--player-hp) 100%);

/* G-03  圆形内区（Portal、选择圈） */
background: radial-gradient(circle at 50% 50%, #FFFFFF 46%, var(--primary-light) 100%);

/* G-04  圆形外环 */
background: conic-gradient(from 270deg, var(--primary), #FFFFFF 360deg);

/* G-05  玻璃面板（半透明卡片、对话气泡底） */
background: linear-gradient(180deg, rgba(255,255,255,.06) 0%, var(--primary-10) 100%);
border: 1.5px solid var(--white-20);

/* G-06  渐变描边（头像环、特殊装饰圈） */
/* 用 ::before 伪元素 + gradient（CSS border 无法做渐变） */
background: linear-gradient(180deg, var(--primary) 0%, var(--primary-light) 100%);
```

**边框搭配规则**：渐变背景 → 白边 2px；实色背景 → 主色边 2px；玻璃面板 → `rgba(255,255,255,.20)` 边 1.5px。

#### 阴影系统

**MUST: 游戏按钮的外阴影 blur 必须为 0（硬边）。硬边 = 游戏感，模糊阴影 = Web 感。**

```css
/* S-01  3D 可点击按钮（标准） */
box-shadow:
  0 4px 0 0 var(--black-15),         /* 底部硬边：立体感 */
  inset 0 0 4px 4px var(--white-50); /* 内白光：光泽感 */

/* S-02  按下态（active） — 配合 translateY(4px) */
box-shadow:
  0 1px 0 0 var(--black-15),
  inset 0 0 4px 4px var(--white-50);

/* S-03  外发光（激活/选中/呼吸动画） */
box-shadow: 0 0 20px 2px var(--primary-30);

/* S-04  圆形内深度 */
box-shadow: inset 0 4px 16px rgba(0,0,0,.12);

/* S-05  对话气泡 — 用 filter 让箭头也投影 */
filter: drop-shadow(0 2px 4px rgba(0,0,0,.15));
```

#### 动效 Token

```css
:root {
  /* 缓动函数 */
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);  /* 弹性：元素出现、按钮弹回 */
  --ease-out:    cubic-bezier(.25, 1, .5, 1);        /* 标准缓出：面板滑入 */
  --ease-in:     cubic-bezier(.5, 0, 1, .75);        /* 缓入：元素消失 */

  /* 时长 */
  --duration-fast:   150ms;  /* 微交互（按钮按下反馈） */
  --duration-normal: 280ms;  /* 标准（HP 条变化） */
  --duration-slow:   450ms;  /* 页面级（面板进出） */
}
```

**必选动效（MUST）**：
- 按钮 active：`transform: translateY(4px)` + shadow 收缩，时长 `--duration-fast`
- HP 条变化：`transition: width var(--duration-normal) var(--ease-spring)`（弹性有生命感）
- 元素出现：`@keyframes pop-in { from { opacity:0; transform:scale(.85) } to { opacity:1; transform:scale(1) } }`

**推荐动效（SHOULD）**：
- 圆形游戏区呼吸光晕：`@keyframes glow-pulse` 周期 3s
- 评分文字出现：scale 0→1，`--ease-spring`
- 星星展开：依次 delay 80ms/颗
- 分数上浮：`@keyframes float-up { 0% { opacity:0; translateY(0) } 30% { opacity:1 } 100% { opacity:0; translateY(-40px) } }`

#### 间距系统（4px 网格）

**MUST: 所有间距以 4px 为倍数。**

```
4px   xs   图标与文字间距、组件内紧凑间距
8px   sm   组件内标准间距
12px  md   卡片内边距（padding）
16px  —    内容区边距
20px  lg   页面水平边距
24px  xl   组件组之间
32px  2xl  卡片内大间距
48px  3xl  区块间距
```

#### 字体与描边

```
主字体：Montserrat（游戏 UI 全局）
字重：只用 700 / 900（标题 900，正文/按钮 700）
字号：12–64px，只用 4px 倍数规格（12/14/16/18/20/24/28/32/40/48/64）
低于 12px 不可读，高于 64px 失控。
```

**文字描边**: MUST 用 `text-shadow` 8方向模拟外描边，禁止用 `-webkit-text-stroke`（向内外各扩展，粗细不均）。

```css
/* 白字 + primary 色描边（标题栏标准做法） */
text-shadow:
  -3px -3px 0 var(--primary), 3px -3px 0 var(--primary),
  -3px  3px 0 var(--primary), 3px  3px 0 var(--primary),
   0   -3px 0 var(--primary), 0    3px 0 var(--primary),
  -3px    0 0 var(--primary), 3px    0 0 var(--primary);
```

#### Phaser Canvas 绘制原则

对 Phaser 游戏区内直接绘制的元素（游戏对象、目标、特效），遵循：

**游戏对象 / 目标球**：双层光晕 + 高光
```javascript
// 外圈光晕：主色, alpha 0.10, radius + 14
graphics.fillStyle(primaryHex, 0.10);
graphics.fillCircle(x, y, radius + 14);
// 内圈光晕：主色, alpha 0.28, radius + 6
graphics.fillStyle(primaryHex, 0.28);
graphics.fillCircle(x, y, radius + 6);
// 实体
graphics.fillStyle(primaryHex, 1.0);
graphics.fillCircle(x, y, radius);
// 高光：白色, alpha 0.65, 左上角 ≈ 35% radius
graphics.fillStyle(0xffffff, 0.65);
graphics.fillCircle(x - radius*0.3, y - radius*0.3, radius * 0.35);
```

**精灵图轮廓光晕**（优先于上方 Graphics 圆形光晕，效果更高级）：
```javascript
// 用 tinted + scaled 副本叠放实现（光晕贴合精灵实际形状而非圆形）
// 外层: setDisplaySize(原尺寸×1.3), setTint(类别色), setAlpha(0.15)
// 中层: setDisplaySize(原尺寸×1.18), setTint(类别色), setAlpha(0.3)
// 内层: setDisplaySize(原尺寸×1.09), setTint(类别色), setAlpha(0.45)
// 主体: setDisplaySize(原尺寸), 无 tint, alpha 1.0
// 适用：conveyor-sort 掉落物/底栏、所有带精灵图的游戏对象
// Canvas 模式兼容（不依赖 WebGL postFX）
```

**射线 / 炮管类元素**：双层叠加模拟高光
```
底层：较深颜色，线宽 14px
顶层：primary 色，线宽 5px，alpha 0.8
```

**背景点阵**（如需要装饰性背景）：
```
primary 色，alpha 0.10，间距 28×30px，错位排列
白色小点（占 1/3），alpha 0.04，尺寸 1.5px
```

**粒子效果标准参数**：
```
count: 8–16 颗
速度: 80–200px，随机方向
尺寸: 3–7px 渐变到 0.2
时长: 400–600ms, ease: Quad.easeOut
```

#### V2 UI 质检 Checklist

在每个 V2 游戏输出前，对照确认：

```
颜色
□ 背景是带色相的极深色（非纯黑 #000/#111）？
□ 所有颜色来自 CSS 变量 token，没有硬编码 hex？
□ 按钮/HP 条使用了渐变配方（非纯色填充）？
□ primary 饱和度足够（视觉鲜艳）？

间距
□ 所有间距是 4px 倍数？
□ 字号在 12–64px 之间，只用 4px 倍数规格？
□ 字重只用 700/900？

视觉
□ 按钮外阴影 blur=0（硬边游戏感）？
□ 渐变背景配白边，实色背景配主色边？
□ 对话气泡用 filter:drop-shadow（箭头也投影）？
□ 文字描边用 text-shadow 8方向（非 -webkit-text-stroke）？

动效
□ 按钮 active 有 translateY(4px) + shadow 收缩？
□ HP 条变化有 ease-spring 过渡？
□ 使用了 duration/ease token，没有硬编码 ms 值？
□ 元素出现有 pop-in 动画？

Canvas/Phaser
□ 游戏对象有双层光晕（外圈 + 内圈）？
□ 高光点在左上角 ~35% 位置？
□ 粒子参数在标准范围内？
```

### 转换流程（从 V1 到 V2）

1. **读取原始 `index.html`**，理解游戏机制和 UI 需求
2. **确定游戏特有 UI 布局**（参考上方布局分类表，为玩法量身设计）
3. **选择氛围配色**（combat/mystery/nature/dark/sweet）
4. **构建 DOM Shell**：标题栏 + 游戏特有区域 + 分数 + 按钮
5. **迁移 Phaser 场景逻辑**：
   - 删除所有 Shell Graphics 绘制（标题栏、HP 条、按钮等）
   - 删除所有 Phaser Text 用于 Shell 展示的部分（改用 DOM）
   - 保留游戏核心机制（物理、碰撞、时序、计分、难度）
   - 保留 Phaser 粒子效果和动画
   - 添加 DOM 更新调用
6. **验证**：START → 游戏 → 评级 → CONTINUE 完整流程

### V2/V3 强制规则（每个游戏必须遵守）

1. **永远不用 `document.styleSheets[0]`** — Google Fonts 跨域样式表触发 SecurityError，整个脚本崩溃。动态样式一律用 `document.createElement('style')` + `document.head.appendChild(s)`。
2. **BootScene 禁止用 `this.add.text()` 显示说明文字** — Phaser 对象在场景切换后残留。所有引导文字/规则说明都用 DOM `boot-card` div，GameScene 启动时 `setVisible('boot-card', false)` 隐藏。
3. **每个 Scene 的 `create()` 前两行必须是 `this.children.removeAll(true)` + `this.cameras.main.resetFX()`** — 防止跨场景对象残留和 camera shake/flash 效果残留。缺少 `resetFX()` 会导致 REPLAY 后屏幕变暗。
4. **HTML 中不要用 JS unicode 转义 `\uXXXX`** — 在 HTML 中是字面文本。用实际字符（⚡）或 HTML 实体（`&#9889;`）。
5. **JS 中的 surrogate pair `\uD83D\uXXXX` 也要用实际 emoji** — 虽然 JS 引擎能解析，但在 innerHTML/textContent 混合场景中可能乱码。直接写 🐟🌟🔥 等实际字符。
6. **可点击游戏对象必须加 Phaser 透明 hitArea** — DOM 按钮在 z-index:10 盖住 canvas，玩家无法直接点击游戏区。解法：
   ```javascript
   this.add.rectangle(x, y, w, h, 0xffffff, 0.001)
     .setInteractive({ useHandCursor: true })
     .setDepth(20)
     .on('pointerdown', handler);
   ```
7. **DOM 元素不要和 Phaser 游戏区文字重叠** — DOM z-index > canvas z-index:1，DOM 会遮挡 Phaser text。需要在 Phaser 区域显示的文字用 Phaser text，不用 DOM。
8. **REPLAY 按钮必须回 BootScene，不能直接跳 GameScene** — 直接跳 GameScene 会导致 DOM 状态不重置（HP 条、分数、星星残留），场景切换异常。始终走 BootScene → GameScene 完整流程。
9. **每个游戏 BootScene 必须有玩法介绍** — 用 boot-card/rules-card/circle-content/dialogue 显示规则说明。玩家在 START 前必须能看到怎么玩。
10. **每个游戏 BootScene 必须有 UNLOCK S TIER 按钮** — 金色 `.btn-candy.secondary` 样式，点击后跳转 ResultScene 展示 S 级评分预览（传入 score: 9999）。
11. **所有按钮样式必须统一为 candy material** — 包括游戏内特殊按钮（方向键、FIRE、REEL 等）。使用深色渐变底 `color-mix(in srgb, var(--primary), #000 40%)`，强高光条，glass 层，text-shadow。不同按钮可以用不同颜色但必须保持相同的材质感。
12. **删除未使用的 `PRIMARY_COLOR` 常量** — V3 使用 THEMES + `resolveTheme()` 驱动所有颜色，`PRIMARY_COLOR` 是 V1 遗留死代码。

### V2 常见 Bug 和避坑

| Bug | 原因 | 修复 |
|-----|------|------|
| 页面只有标题栏，其余空白 | `document.styleSheets[0].insertRule()` 拿到 Google Fonts 跨域样式表 → SecurityError → Phaser 永不初始化 | **永远不用 `styleSheets[0]`**。用 `document.createElement('style')` + `appendChild` |
| Phaser 文字模糊 | 缺少 `resolution: DPR` | config 必须设 `resolution: Math.min(devicePixelRatio, 3)` |
| 中文字符不显示 | Montserrat 不支持中文 | Phaser text 中文用系统字体 fallback；或 DOM 显示中文 |
| DOM 按钮点不了 | Phaser canvas 覆盖在上面 | canvas `z-index:1`，按钮 `z-index:10` |
| 糖果按钮颜色不跟主题 | 按钮 border/base 硬编码颜色 | 用 `var(--primary)` 或 JS 动态设置 |
| fitShell 后 Phaser 偏移 | canvas 大小与 shell 不匹配 | `Phaser.Scale.NONE` + canvas CSS 设为 393×852 |
| 游戏可玩但体验差（只能点底部按钮） | 交互区域与游戏内容分离 | 在 Phaser 游戏区域加透明 hitArea 支持直接点击 |
| BootScene 文字/图形残留在 GameScene 背后 | Phaser 对象跨场景残留 | **BootScene 禁止用 `this.add.text()`**——所有说明文字都用 DOM boot-card。每个 Scene 的 `create()` 第一行加 `this.children.removeAll(true)` |
| DOM 元素遮挡 Phaser 游戏内文字 | DOM z-index > canvas z-index:1 | DOM hint/label 不要和 Phaser 游戏区重叠；需要在 Phaser 区域显示的文字用 Phaser text |
| HTML 中 `\u26A1` 显示为乱码 | JS unicode 转义在 HTML 中是字面文本 | HTML 用实际字符（⚡）或 HTML 实体（`&#9889;`），不要用 `\uXXXX` |
| Surrogate pair `\uD83D\uDC1F` 在某些环境乱码 | JS surrogate pair 在 innerHTML/WebView 中不可靠 | 直接用实际 emoji 字符 🐟🌟🔥，不要用 `\uD83D\uXXXX` 转义 |
| REPLAY 后屏幕变暗 | REPLAY 直接跳 GameScene，DOM 状态未重置 + camera effects 残留 | **REPLAY 必须回 BootScene**，且每个 Scene `create()` 加 `this.cameras.main.resetFX()` |
| 按钮颜色太平、不够亮 | `.base` 用 `var(--primary)` 纯色或 `var(--primary-10)` 渐变太淡 | 用 `color-mix(in srgb, var(--primary), #000 40%)` 做底部深色渐变 + 强高光条 |
| 游戏特有按钮风格不一致 | 方向键/FIRE/REEL 等用自定义 CSS 没有 candy material | 所有按钮统一用相同的渐变/阴影/高光模式，只是颜色不同 |
| 开局没有玩法介绍 | BootScene 缺少规则说明 | 每个游戏必须在 START 前显示玩法规则（boot-card/circle-content/dialogue） |
| `PRIMARY_COLOR` 死代码 | V1 遗留常量，V3 不使用 | 删除，用 `window.__V3_THEME__` 替代 |
| 开屏 boot-card 还显示模板默认游戏名（如 "急速泊车"） | 模板在 `<div id="boot-card">` 里硬编码了中文标题，`STORY_RESKIN.labels` 只捕获英文键会漏掉 | 为每个使用了模板的 ep 的 `labels` 加一条中文→中文映射（如 `'急速泊车':'规则战争'`）。**审核时用 `grep -oP '[\p{Han}]+' packs/.../index-v3.html \| sort -u` 把模板里所有硬编码中文枚举出来**，确保每条都在 `STORY_RESKIN[ep].labels` 里有对应映射。已知受影响模板：conveyor-sort/maze-escape/parking-rush/spotlight-seek/will-surge |
| Layer 3 定制变成装饰图覆盖游戏 | 误以为"深度定制"就是找张大图铺在游戏上，把可交互元素挡住 | Layer 3 **不是装饰层**。是有针对性的 *核心视觉外壳* 替换（信号灯/墙/车道），不是背景图覆盖。不满足 4 条决策门槛就不做 |
| Layer 3 主题视觉只有第一帧对，之后不随游戏状态刷新 | 只在 hook 里跑了一次初始化，没 hook 重绘入口函数 | 识别每个游戏的重绘入口：maze-escape 是 `loadMaze()`（每关换图）、parking-rush 是 `drawLanes()`（每回合换 freeIndex）、red-light-green-light 是 `setTrafficLight()`（每次切灯）。必须把主题重绘塞进这些函数的 hook 里 |
| Layer 3 新素材风格与现有 sprite/背景完全不搭（3D photoreal 碰 2D painted） | 没看现有素材就直接让 AI 生成新图 | 生成前先 `Read` 一遍 `data/<series>/<ep>/game/bg-scene.jpg` + 所有 `sprite-*.png`，总结风格关键词（"painted digital illustration"/"anime-inspired"/"flat shading"/"cool palette"）写进 prompt。更好的选择是先看 Layer 2 sprite 能不能直接复用（ep11 的 sprite-car/sprite-slot 正好就是议政主题），省一次 API 调用还能保证风格一致 |
| Layer 3 给 top-down 迷宫类游戏做纹理时每格看起来像一堆小卵石 | Tile-based top-down 游戏每格只有 24-30px，生成带大量小细节的纹理会糊成一团 | Top-down 游戏纹理要 **一格一主形象**（one-stone-per-tile / one-tree-per-tile），不是一堆小物件的 pattern。prompt 里写 "ONE stone only, not multiple cobbles, not a pattern, top-down orthographic view, NO 3D perspective" |
| Layer 3 新素材颜色抢走游戏核心对象的戏 | 新素材用了和钥匙/目标物/HP 条一样的颜色 | 生成前先盘点游戏核心对象的颜色（ep20 钥匙是金黄色 → 迷宫墙就不能用黄花/暖色调），新素材 **必须避开这些颜色**。prompt 里显式写 "NO yellow, NO warm colors, cool palette only" |
| Layer 3 墙/地板纹理在深色背景里看不清 | 生成的素材本身太暗，和深色背景融成一团 | 可读性是底线。深色背景用的覆盖素材要 "MEDIUM-BRIGHTNESS, light enough to clearly read against dark backgrounds, NOT dark, NOT black" |
| Layer 3 改了背景导致和 Layer 2 的 bg-scene.jpg 冲突 | 误以为 Layer 3 要把整个氛围重做 | Layer 3 **只换核心视觉外壳**（信号灯/墙/车道），bg-scene.jpg 由 Layer 2 定，Layer 3 不动。背景的剧情基调已经在 Layer 2 对齐过了 |
| Layer 3 hook 抢先一步，GameScene 还没就绪就报错 | 直接 `game.scene.getScene('GameScene')` 拿不到或者 scene 还在 init | 用 `setInterval(fn, 80)` 轮询，检查 `window.__game && game.scene && gs` 都就绪再 hook，最多尝试 80 次（~6s）后放弃。hook 成功后立刻 `clearInterval`，并用 `gs.__XXXHooked` 标志防重入 |
| Layer 3 和 Layer 2 按钮/HP 条配色打架 | jsOverride 里硬编码色值（`0x8a6438`/`#d4a24a`），和 Layer 2 kmeans 从 bg-scene 提取出来的 primary 完全两个色相 | **绝不硬编码带色相的色值**。读 `window.__V3_THEME__`（Layer 2 kmeans 结果），用 `hexInt(T.primary)` / `hexInt(T.strokeDark)` / `hexInt(T.bg)` / `T.primaryLight` 派生所有 graphics fill/stroke/tint/text 色值。这样 Layer 3 和 Layer 2 永远是同一个色相家族 |
| 肉眼看 bg-scene 是暖棕，硬编码暖棕色结果和蓝色按钮对不上 | 视觉印象 ≠ kmeans 结果。ep11 议政厅看着暖棕，kmeans 提取出来却是亮蓝 `#66A7E8`（木纹反光 + 阴影里大量冷色像素主导） | 不要凭肉眼判断 bg-scene 的主色。kmeans 说什么就是什么 —— 全部从 `window.__V3_THEME__` 派生。要验证的话 `window.__V3_THEME__` 一打印就知道真实结果 |
| Layer 3 顺手把 HTML UI 也"主题化" | cssOverride 里改了 `#lane-btns .btn-lane` / `.combo-text` / HP 条，引入第二套配色 | HTML UI 由 Layer 2 kmeans 驱动，**已经和 bg 一致**。Layer 3 不动它们。如果 canvas 内全部搞定了，`cssOverride: ''` 空字符串即可 |
| Layer 3 灌到 `index.html`（普通定制版）里 | `batch-generate-wolven.js` Step 15 无条件注入 STORY_THEME，没按 `isVariant` 分流 | Step 15 必须写成 `const theme = isVariant ? STORY_THEME[ep] : null;`。普通定制版是第一、二层稳定基线，所有集都要走；Layer 3 只放进 `variant-themed.html` |

### V2/V3 文件约定

```
games/<game-id>/
  index.html        # V1 原版（纯 Phaser，保持不动）
  index-v2.html     # V2 混合架构版本
  index-v3.html     # V3 视觉升级版本（7 主题 + 动态取色 + candy UI）
```

- 每个版本独立自包含，不依赖其他版本
- 字体: 只用 Montserrat (700, 900)
- 单文件自包含，无构建步骤
- V2 参考实现: `games/qte-boss-parry/index-v2.html`（Layout A）
- V3 参考实现: `games/qte-boss-parry/index-v3.html`（Layout A 标杆）、`games/cannon-aim/index-v3.html`（Layout B 标杆）
- V3 共享代码参考: `scripts/v3-shared-blocks.js`（THEMES + applyTheme + extractPalette 全链）
- V3 质检脚本: `scripts/verify-v3.sh`

### 批量转换策略

转换多个游戏时，使用并发子代理（每个处理 2-3 个游戏）。分组策略：
- 同类游戏放一组（如所有 VS 对战类一组）
- 每个子代理需要读取参考实现 + 原始游戏文件
- 每个子代理独立输出对应版本文件

**V3 先标杆后批量经验**：
1. 先做 2 个标杆（Layout A + Layout B），经过 spec review 验证
2. 标杆通过后，4 组并发子代理批量转换剩余 10 个游戏
3. 批量完成后运行 `scripts/verify-v3.sh` 全量质检
4. 常见需要额外修复的问题：死代码 `PRIMARY_COLOR`、surrogate pair 编码、按钮风格不一致、缺少玩法介绍

**V3 candy 按钮 CSS 标准**（所有按钮必须遵循）：
```css
.btn-candy .base {
  background: linear-gradient(180deg, var(--primary) 0%,
    color-mix(in srgb, var(--primary), #000 40%) 100%);
}
.btn-candy .highlight {
  left: 8px; right: 8px; top: 3px; height: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.05));
}
.btn-candy .glass {
  background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 50%);
}
.btn-candy .label { text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
.btn-candy.secondary .base {
  background: linear-gradient(180deg, #F5C842, #B8860B);
}
```
游戏特有按钮（.btn-lane, .reel-btn, .fire-btn 等）必须使用相同的渐变/阴影/高光模式。

## Device APIs
Camera, microphone, and gyroscope integration rules live in:
`references/device-apis.md`

All sensor calls must be triggered by a user gesture.

## Narrative & Text
Dialogue scenes, typewriter copy, and attribute-aware result text live in:
`references/narrative-layer.md`

## Sprite & Asset Layer
Texture sourcing, Kenney-style asset strategy, and font guidance live in:
`references/sprite-assets.md`

## Reference Map

| File | Read when |
|------|-----------|
| `standards/design-guide.md` | Every game |
| `standards/framework-constraints.md` | Every game |
| `contracts/settlement.contract.md` | Every game |
| `contracts/settlement.schema.json` | Validation step |
| `references/device-apis.md` | Sensor-based mechanics |
| `references/sprite-assets.md` | Sprite or texture work |
| `references/narrative-layer.md` | Dialogue or text animation |
| `templates/phaser-h5-template.html` | Starting point for every game |
| `host/cocos-settlement-handler.ts` | Host-side parsing reference |
| `host/cocos-webview-integration.md` | Cocos WebView integration guide |
| `qa/compatibility-checklist.md` | Pre-release gate |
| `examples/platform-runner/index.html` | Runner mechanic reference |
| `examples/merge-2048/index.html` | Merge and special result scene reference |
| `design-system/ui-visual-language.md` | V2 视觉规范完整参考（动态取色算法、渐变/阴影/动效/Canvas 绘制细节） |

## Done Checklist
- [ ] Task logged in `roadmap.md` before implementation.
- [ ] Game lives under `games/<game_id>/index.html` when a game is created.
- [ ] Runs standalone in browser with no build step.
- [ ] Reads `attribute` and `primaryColor` from URL.
- [ ] Sends settlement payload with required four fields and four-tier rating compatibility.
- [ ] Settlement is sent only from the final confirmation CTA.
- [ ] `list.md` inventory updated when game inventory changed.
- [ ] `qa/compatibility-checklist.md` reviewed.
- [ ] Browser settlement verification completed.
- [ ] Roadmap task marked complete with validation notes.

## Episode Content Pipeline

The episode content pipeline is a **pre-production build step** — not a runtime feature. It runs once per episode scene and outputs a fully self-contained HTML file.

### How It Works

```
episode JSON config
        ↓
scripts/build-episode-game.js
        ↓  (1) resolve gameId
           gameId in config?  → use directly
           else → call Gemini API (google/gemini-3.1-pro-preview via ZenMux) with sceneContext
           Gemini fails?      → static fallback from episodes/game-selector.json
        ↓  (2) inject window.__EPISODE_CTX__
           copies games/<gameId>/index.html
           prepends <script>window.__EPISODE_CTX__ = {...};</script>
        ↓
games/<episodeId>_<sceneId>/index.html   (output)
```

### Episode Config Fields

See `episodes/episode.schema.json` for the full JSON Schema.

Key fields:
- `episodeId`, `sceneId` — kebab-case IDs used to name the output folder
- `attribute`, `primaryColor` — echoed in settlement; theme seed
- `sceneContext` — natural language scene description (required when `gameId` absent)
- `sceneType` — enum hint for static fallback (`action/tension/romantic/comedic/mystery/competitive/reflective`)
- `difficulty` — `easy/moderate/hard` (default: `moderate`)
- `gameId` — direct override; skips LLM entirely
- `character`, `background`, `narrative` — optional asset/dialogue injection

### Running the Build

```bash
# Requires ZenMux API key for LLM selection (routes to google/gemini-3.1-pro-preview)
export ZENMUX_API_KEY=sk-ss-v1-...

# Build with LLM game selection
node scripts/build-episode-game.js episodes/my-ep-scene.json

# Build with static fallback only (no API key needed)
node scripts/build-episode-game.js episodes/my-ep-scene.json --no-llm

# Dry run (prints resolved config without writing)
node scripts/build-episode-game.js episodes/my-ep-scene.json --dry-run

# Custom output directory
node scripts/build-episode-game.js episodes/my-ep-scene.json --out dist/
```

### window.__EPISODE_CTX__ Contract

All 50 games, the template, and both examples read CTX via priority chain:

```javascript
const CTX = window.__EPISODE_CTX__ || {};
const params = new URLSearchParams(window.location.search);
const ATTRIBUTE = CTX.attribute || params.get('attribute') || '<default>';
const PRIMARY_COLOR = CTX.primaryColor || params.get('primaryColor') || '<default>';
```

Games continue to work without CTX (URL params or defaults). CTX only takes effect when injected by the build script.

### Relevant Files

| Path | Purpose |
|---|---|
| `episodes/episode.schema.json` | JSON Schema for episode configs |
| `episodes/game-selector.json` | Static fallback: sceneType+difficulty → gameId[] |
| `episodes/game-selector.md` | Editor-facing mapping guide |
| `episodes/example-ep01-scene02.json` | Annotated example config |
| `templates/episode-ctx-snippet.js` | Canonical CTX reader snippet |
| `scripts/patch-games-episode-ctx.js` | One-time migration script (already applied) |
| `scripts/build-episode-game.js` | Main build script with Gemini LLM selection (via ZenMux) |

---

## Asset Generation & Processing Pipeline

### Overview

When building episode-specific games with character art and scene backgrounds, use the following proven pipeline to produce game-ready transparent PNGs from reference character images.

### Step 1: Generate Pose Variants via ZenMux Gemini (Green Screen)

**Critical Rule**: Always request **solid green (#00FF00) chroma key background**. Never let Gemini generate scene backgrounds — they pollute the image and make background removal impossible.

```bash
ZENMUX_API_KEY=$KEY node scripts/zenmux-image.js \
  --prompt "Generate this exact same character in a [DESIRED POSE]. Place on a SOLID BRIGHT GREEN (#00FF00) chroma key background. Full body view, anime style." \
  --input data/ep5/character/reference.jpg \
  --out data/ep5/processed/character_green.png \
  --model google/gemini-3.1-flash-image-preview
```

**Prompt guidelines for pose generation**:
- Always reference "this exact same character" to preserve appearance
- Specify emotion: "tense scared pose with wide fearful eyes" / "alert protective stance with serious expression"
- Always include "SOLID BRIGHT GREEN (#00FF00) chroma key background"
- Always include "Full body view, anime style"
- **SINGLE CHARACTER ONLY** — each image must contain exactly ONE person. Never generate multiple characters, other people, bystanders, or crowds in the same image. If the scene has two characters, generate them as separate images and composite in-game.
- **NO objects or props** — no weapons, furniture, vehicles, animals, or handheld items. The character should be standing/posing with empty hands unless the prop is integral to the character's identity (e.g., a signature accessory).
- Never ask for scene elements (cars, rain, buildings) — those go in the game background

**Image model** (via `scripts/zenmux-image.js`): `google/gemini-3.1-flash-image-preview`

**ZenMux Vertex AI Protocol**:
- Endpoint: `POST https://zenmux.ai/api/vertex-ai/v1beta/models/{model}:generateContent`
- Auth: `x-api-key` header
- Request: `{ contents: [{ role: 'user', parts: [...] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }`
- Response: `candidates[0].content.parts[].inlineData.{mimeType, data}` (base64)
- **NOT supported** via OpenAI-compatible `/v1/chat/completions` endpoint

### Step 2: Chroma Key Background Removal (sharp)

Gemini **cannot output true alpha channels** — all generated PNGs have `hasAlpha: false`. Must post-process with programmatic chroma key removal.

```bash
# Automated via Node.js + sharp
node -e "
const sharp = require('sharp');
async function chromaKey(input, output) {
  const { data, info } = await sharp(input).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  // Green dominance check per pixel
  for (let i = 0; i < width * height; i++) {
    const off = i * channels;
    const r = data[off], g = data[off+1], b = data[off+2];
    const greenDominance = g - Math.max(r, b);
    if (greenDominance > 30 && g > 100) {
      data[off+3] = 0; // fully transparent
    } else if (greenDominance > 15 && g > 80) {
      // Semi-transparent edge + de-spill
      data[off+3] = Math.min(data[off+3], Math.max(0, Math.round(255 * (1 - (greenDominance-15)/30))));
      data[off+1] = Math.min(g, Math.round((r+b)/2)); // remove green tint
    }
  }
  // 2-pass edge erosion for smooth edges
  // ... (see scripts for full implementation)
  await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
}
"
```

**Key learnings**:
- White background removal is unreliable when characters wear white clothing (e.g., white shirt)
- Green screen gives 76-80% transparent pixels with clean edges
- Always verify with `sharp(file).metadata()` → check `hasAlpha: true`
- Edge erosion (2-3 passes) prevents jagged borders
- De-spill (neutralize green tint on edges) prevents green fringing

### Step 3: Integrate into Phaser Game

**Preserve aspect ratio** — never hardcode display sizes that distort:

```javascript
// Read actual image dimensions from metadata
const CHAR_RATIO = 1376 / 768; // actual height/width from source
const charW = 150;
const charH = Math.round(charW * CHAR_RATIO);
sprite.setDisplaySize(charW, charH); // never stretch
```

**Character positioning behind obstacles**:
- Use depth layers: characters at depth 12, car/obstacle at depth 13
- Position character origin at bottom-center (0.5, 1) so y controls foot position
- Show at least head + shoulders + chest above obstacle line
- Test visibility at multiple car heights before finalizing

### Anti-Patterns (Lessons Learned)

| Mistake | Consequence | Fix |
|---------|------------|-----|
| Let Gemini generate scene backgrounds | Car/buildings pollute character image | Always use green screen prompt |
| Generate multiple characters in one image | Chroma key removes parts of overlapping characters; unusable for in-game compositing | Always generate ONE character per image, composite in Phaser |
| Include props/objects in character image | Objects get green-tinted edges or block character body; extra cleanup needed | Prompt must say "no objects, no props, empty hands" |
| Use white background for removal | White clothing gets deleted | Use green chroma key instead |
| Hardcode `setDisplaySize(200, 460)` | Character stretched/squished | Calculate from actual aspect ratio |
| Skip `hasAlpha` verification | Invisible background in browser, visible in game | Always check with sharp metadata |
| Use Gemini for background removal | Still outputs RGB, no alpha | Use sharp programmatic removal |
| Runtime canvas-based bg removal | Slow, blocks game start, unreliable | Pre-process assets offline |

### Relevant Scripts

| Script | Purpose |
|--------|---------|
| `scripts/zenmux-image.js` | Gemini image generation/editing via ZenMux Vertex AI |
| `scripts/prepare-assets.js` | Browser-based asset processor (legacy, prefer sharp) |
| `scripts/save-processed-assets.js` | HTTP server for receiving processed assets |
| `scripts/remove-bg.mjs` | `@imgly/background-removal-node` wrapper (alternative) |

---

## UI Design with Google Stitch

### Setup

Google Stitch MCP provides AI-powered UI screen generation for game interfaces.

```bash
# Add to Claude Code (with proxy for China mainland)
claude mcp add stitch -s user \
  -e STITCH_API_KEY=<your-key> \
  -e HTTPS_PROXY=http://127.0.0.1:7890 \
  -- npx @_davideast/stitch-mcp proxy
```

**Important**: Stitch connects directly to Google servers. Users in China need `HTTPS_PROXY` configured.

### Workflow

1. **Create project**: `mcp__stitch__create_project` with game title
2. **Generate screens**: `mcp__stitch__generate_screen_from_text` with detailed UI descriptions
3. **Download HTML**: Each screen has `htmlCode.downloadUrl` for the generated HTML/CSS
4. **Extract design tokens**: Pull color palette, typography, spacing from Stitch design system
5. **Integrate into Phaser**: Convert Stitch CSS design tokens into Phaser scene styling

### Design Theme Integration

Stitch generates a comprehensive `designTheme` with:
- Named colors (surface hierarchy, primary/secondary/tertiary, error states)
- Typography (headline, body, label fonts)
- Spacing scale and roundness tokens

Map these to Phaser game UI:
```javascript
// CSS variables from Stitch → Phaser text/shape styles
const THEME = {
  bg: 0x0e141c,           // --bg
  surface: 0x1b2029,      // --surface
  primary: 0xaec6ff,      // --primary
  secondary: 0xffb4a4,    // --secondary (danger/tension)
  tertiary: 0xe5c191,     // --tertiary (romance/warmth)
  onSurface: 0xdee2ef,    // --on-surface (text)
};
```

### Relevant Files

| Path | Purpose |
|------|---------|
| `.claude/settings.local.json` | Stitch MCP permissions |
| Stitch project dashboard | https://stitch.withgoogle.com |

---

## Environment & API Keys

All API keys are stored in `.env` at project root (gitignored):

```env
ZENMUX_API_KEY=sk-...    # ZenMux proxy for Gemini models (game selection, copy generation, image generation)
```

**Stitch API key** is configured via Claude MCP environment variable (not in `.env`).

### Model Selection for Build Pipeline

| Task | Model | Config Location |
|------|-------|----------------|
| Game selection (LLM) | `google/gemini-3.1-pro-preview` | `scripts/build-episode-game.js` |
| Copy generation | `google/gemini-2.5-flash` | `scripts/build-episode-game.js` |
| Image generation | `google/gemini-3.1-flash-image-preview` | `scripts/zenmux-image.js` |

---

## Local Development

### Preview Server

```bash
# Configured in .claude/launch.json
# Starts Node.js static file server on port 3333
# Access games at: http://localhost:3333/games/<game-id>/index.html
```

### Quick Iteration Cycle

1. Edit `games/<id>/index.html`
2. Refresh browser at `http://localhost:3333/games/<id>/index.html`
3. Use Claude Preview MCP for automated screenshots and JS eval
4. Check browser console for Phaser errors

### Asset Processing Checklist

- [ ] Reference character images in `data/<ep>/character/`
- [ ] Generate green screen poses via `zenmux-image.js`
- [ ] Verify green background is uniform (no scene elements)
- [ ] Run chroma key removal with sharp
- [ ] Verify `hasAlpha: true` and >70% transparent pixels
- [ ] Check aspect ratio matches source (don't hardcode display sizes)
- [ ] Test in-game: no white edges, no stretching, correct depth layering

<!-- Customized Mini-Game SOP merged into Delivery Workflow above -->
