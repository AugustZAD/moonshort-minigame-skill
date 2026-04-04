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
| **BGM 风格** | 属性默认 | 按场景氛围覆写 |
| **增量工作** | 基准 (~16 min) | +~10 min (+35% token) |
| **模板改动** | ~100 行 | +~36 行增量 |

**询问用户时可提供的参考信息**:
- 普通定制化适合：剧情氛围与模板默认风格一致的场景
- 深度定制化适合：剧情氛围与模板默认风格冲突、或需要更强沉浸感的场景
- 有背景图素材可用时，深度定制化效果更好

**深度定制化命名规范**:
- 文件夹名 `ep-N_scene01-<style>` 中的 `<style>` 后缀必须反映实际风格
- **不要一律用 `-dark`**。按场景氛围选择：`-sweet`(甜蜜)、`-warm`(温暖)、`-noir`(暗黑)、`-neon`(赛博)、`-tense`(紧张) 等
- 示例：甜蜜约会 → `ep-8_scene01-sweet`，校园对峙 → `ep-6_scene01-noir`

**深度定制化额外步骤**:
1. 在 EP 常量中添加 `backgrounds` 配置（见 EP 常量结构）
2. 覆写 `ATTR_THEMES` 中对应属性的色值（bgBase/primary/trackBg 等）
3. 覆写 `CANDY.cardPink` / `cardPinkLt` 为匹配色
4. 将所有 `setBackgroundColor + drawDotPattern` 替换为 `drawSceneBg` 调用
5. 根据剧情氛围覆写 `bgmStyle`（如紧张场景强制 `tense`）
6. 游戏内提示文案剧情化
7. **游戏机制隐喻重新包装**：将模板默认的机制描述替换为剧情化隐喻（如 stardew-fishing "钓鱼" → "心跳同步"），包括计数器 emoji/标签、进度条标签、状态提示文案、combo 描述
8. **ResultScene 增加剧情结语**：按 S/A/B/C 四档编写不同剧情描述文案（如 S:"你们的心跳完美同步" / C:"心跳快得乱了节奏"）
9. **按钮/色系可自由调整**：色系不必严格按四大属性（ATK/WIL/INT/CHA）分配，可参考 `packs/attribute-archetypes/STYLE-POLISH-SKILL.md` 自定义 PALETTE、CANDY、按钮渐变色等，让色调完全服务于剧情氛围

### Step 1: 需求分析 & 模板选取

1. Log the task in `roadmap.md` (Target + deliverables checklist + start note).
2. Extract inputs — see **Step 0 Requirements Intake** above.
3. Read required docs (see **Required Reading Order**).

| Input | Format | Example |
|-------|--------|---------|
| 剧情/场景描述 | 自然语言 | "纹身坏男孩找女主麻烦，运动男挺身保护她" |
| 人物参考图 | PNG/JPG (1-3张) | `data/ep6/character/aiden.jpg` |
| 背景图 | JPG | `data/ep6/background/bedroom.jpg` |
| 叙事对白 (可选) | JSON array | `[{speaker, text, portraitUrl?}]` |
| 游戏机制偏好 (可选) | 关键词 | QTE, 对抗, 闪避 |

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
2. **绿幕抠图**: sharp chroma key removal → 验证 `hasAlpha: true`
   - chroma key 阈值: `g > 120 && g > r * 1.3 && g > b * 1.3` (纯绿→透明)
   - 边缘羽化: 近绿区域按 greenness 比例设置 alpha + 去绿溢 (`g = g*0.7 + max(r,b)*0.3`)
   - **验证**: 合成到白底 (`sharp composite`) 检查边缘干净度，确认 `hasAlpha: true`
3. **背景图**: 直接使用提供的背景图

> 详细 pipeline 见下方 **Asset Generation & Processing Pipeline** 章节。

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

1. **基于 Step 1 选中的模板起步**: 复制 `packs/attribute-archetypes/games/<game-id>/index.html` 到 `games/<new-game-id>/`，在此基础上改编
2. **Scene 顺序**: `BootScene` → `NarrativeScene` → `GameScene` → `ResultScene`
3. **叙事开场 overlay**: 支持 `CTX.narrative` 自定义对白, 点击推进, 最后一句淡出
4. **核心机制**:
   - 每个阶段必须有 **有意义的决策** (不是无脑点击)
   - 操作错误必须有 **明确惩罚** (tension 增加, 扣分, 屏幕震动)
   - 关键资源 (耐力/时间) 必须是 **有限的**
5. **音频**: BGM 首次交互后播放全程循环; SFX 绑定游戏事件; 处理 AudioContext suspended
6. **角色素材**: `this.load.image()` 在线加载; 保持原始宽高比

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

| 阶段 | 坑 | 解法 |
|------|-----|------|
| 素材 | 人物表情不匹配场景 | Prompt 明确写表情+姿势 |
| 素材 | 白衣服被白底删除 | 永远用绿幕 |
| 音频 | BGM 消失/中断 | AudioContext resume 异步; 全程一首循环不 stopBgm |
| 机制 | 某阶段无决策/无惩罚 | 每阶段风险/回报 + 递增惩罚 |
| 选取 | 因为涉及恋人就选 CHA | 看核心冲突：打架→ATK，忍耐→WIL |
| 选取 | 凭感觉选模板不查 manifest | 必须读 selection-manifest.json 的 keywordsZh 匹配 |
| 部署 | OSS 资源 URL 404 | 先 `oss-upload.js` 上传，再替换 HTML 中的 URL |
| 部署 | 跨域问题 | OSS Bucket 必须设 public-read ACL |
| 叙事 | 全身人物图在小圆框里裁切怪异 | 大卡片(240x320)+顶部锚点; 小框干脆不放 |
| 叙事 | NarrativeScene 结束后 GameScene 的 isOver 导致 win 回调跳过 | 加 `_winning` 标记位，win 路径绕过 `finishGame` |
| 叙事 | 白底人物 JPG 和深色背景冲突 | 白底只配浅/奶油背景; 或用绿幕流程抠图 |
| 叙事 | ResultScene 强塞人物头像效果差 | 不合适就不放——"搞不好就别放" |
| 叙事 | 透明 PNG 在 portrait 卡片中背景黑色 | 在 image 后面加 `fillRoundedRect(0xffffff)` 白色垫层 |
| 叙事 | 对白太多，玩家点击疲劳 | NarrativeScene 对白不超过 4 句；精简到核心冲突，砍掉寒暄和过渡 |
| 音频 | BGM 风格跟属性默认值走，与场景氛围冲突 | BGM 以场景氛围为准：家暴/紧张场景即使属性是 CHA 也用 `tense`，而非默认 `romantic` |
| 素材 | 不确定是否需要走绿幕流程 | 判断规则：白底 JPG + 大卡片 + 浅色背景 → 直接用；需要绿幕的条件：ResultScene 小圆框、深色背景、或需特定姿势/表情 |
| 深度定制 | 背景图太亮/太暗，UI 不可读 | 用 `overlay` + `overlayAlpha` 调整；暗场景推荐 overlay `#0D0A14` alpha 0.4-0.6 |
| 深度定制 | 覆写色值后 candy 卡片仍是粉色 | 必须同时覆写 `CANDY.cardPink` 和 `cardPinkLt`，不只改 ATTR_THEMES |
| 深度定制 | 白色 score/timer pill 在暗色背景上太突兀 | `CC.white` 保持不变即可——白色药丸在暗背景上反而提供良好对比 |
| 深度定制 | drawSceneBg 未生效 | 检查 BootScene preload 是否加载了 `ep_bg_*` 资源；背景图路径是否正确 |
| 深度定制 | 所有深度定制版都叫 `-dark` | 命名按实际风格：`-sweet`/`-warm`/`-noir`/`-neon`/`-tense`，不要一律 `-dark` |
| 素材 | 复用其他 EP 的素材但表情不匹配 | 表情必须匹配当前剧情氛围；紧张表情放甜蜜场景会破坏沉浸感，必须重新生成 |
| 深度定制 | 游戏机制文案还是英文/模板默认 | 计数器 emoji、进度条标签、状态文案、combo 描述全部替换为剧情化隐喻（如钓鱼→心跳同步） |
| 深度定制 | ResultScene 只有冰冷的评分数字 | 增加 `resultTexts` 按 S/A/B/C 四档展示不同剧情结语，让结算有情感共鸣 |
| 深度定制 | 色系死板跟属性走，甜蜜场景用了暗色 | 色系服务于剧情氛围，不必按四大属性分配；参考 `STYLE-POLISH-SKILL.md` 自由调整 |

## Episode Skin Pattern (叙事包装)

### 核心思路

模板是已经调优的游戏引擎，**不要大改**。Episode 只添加叙事外壳：

```
BootScene → [NarrativeScene] → GameScene → ResultScene
```

- **NarrativeScene** 是唯一新增 Scene（视觉小说对话过场）
- **普通定制化**: 模板改动仅两行 (BootScene START 目标 + Phaser config scene 数组)
- **深度定制化**: 额外 ~36 行 (drawSceneBg 函数 + 色值覆写 + 背景加载)
- 资产通过 `EP` 常量注入，不影响模板逻辑

### EP 常量结构

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

### 氛围配色系统（5 套）

游戏通过 `?theme=X` 或 `CTX.theme` 选择配色，不是每个游戏独立配色。

| 氛围 | ID | 背景色 | 主色 | 适用场景 |
|------|-----|--------|------|---------|
| 🔥热血 | combat | #1A1221 | #EC4F99 | 战斗、追逐、对抗 |
| 🌊神秘 | mystery | #0F1729 | #3B82F6 | 探索、解谜、潜行 |
| 🌿清新 | nature | #0F1F16 | #10B981 | 田园、策略、休闲 |
| 💜暗黑 | dark | #110E1A | #8B5CF6 | 抵抗、压力、意志 |
| 🌸甜美 | sweet | #1A1221 | #F472B6 | 匹配、节奏、社交 |

**实现方式**: JS `THEMES` 对象 + CSS 变量：
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

**糖果按钮 CSS**: 4 层结构 — base(`var(--primary)`) + glass(`rgba(255,255,255,0.3)`) + highlight(顶部 20px) + glow(inset shadow)。圆角 24px，按下位移 3px。

**分数 delta 动画**: `@keyframes deltaPop` — +N 绿色 / -N 主色 上浮淡出。

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

### V2 文件约定

```
games/<game-id>/
  index.html        # V1 原版（纯 Phaser，保持不动）
  index-v2.html     # V2 混合架构版本
```

- V2 文件是独立的，不依赖 V1
- 字体: 只用 Montserrat (700, 800, 900)
- 单文件自包含，无构建步骤
- 参考实现: `games/qte-boss-parry/index-v2.html`（Layout A — VS 对战）

### 批量转换策略

转换多个游戏时，使用并发子代理（每个处理 2-3 个游戏）。分组策略：
- 同类游戏放一组（如所有 VS 对战类一组）
- 每个子代理需要读取参考实现 + 原始游戏文件
- 每个子代理独立输出 `index-v2.html`

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
  --model google/gemini-2.5-flash-image
```

**Prompt guidelines for pose generation**:
- Always reference "this exact same character" to preserve appearance
- Specify emotion: "tense scared pose with wide fearful eyes" / "alert protective stance with serious expression"
- Always include "SOLID BRIGHT GREEN (#00FF00) chroma key background"
- Always include "Full body view, anime style"
- **SINGLE CHARACTER ONLY** — each image must contain exactly ONE person. Never generate multiple characters, other people, bystanders, or crowds in the same image. If the scene has two characters, generate them as separate images and composite in-game.
- **NO objects or props** — no weapons, furniture, vehicles, animals, or handheld items. The character should be standing/posing with empty hands unless the prop is integral to the character's identity (e.g., a signature accessory).
- Never ask for scene elements (cars, rain, buildings) — those go in the game background

**Available models** (via `scripts/zenmux-image.js`):
| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| `google/gemini-2.5-flash-image` | Fast | Good | Default, pose generation |
| `google/gemini-3-pro-image-preview` | Slow | Best | High-quality hero assets |

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
| Image generation | `google/gemini-2.5-flash-image` | `scripts/zenmux-image.js` |
| High-quality image | `google/gemini-3-pro-image-preview` | `scripts/zenmux-image.js` |

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
