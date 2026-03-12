# MiniGame Project List

## Root Structure

```text
.
├── README.md
├── SKILL.md
├── agent.md
├── list.md
├── roadmap.md
├── contracts/
├── host/
├── standards/
├── templates/
├── examples/
├── games/
├── scripts/
└── qa/
```

## File Responsibilities

| Path | Type | Responsibility |
| --- | --- | --- |
| `README.md` | overview | Repository overview and entry points |
| `SKILL.md` | skill | Primary operating guide and skill entry |
| `agent.md` | compatibility pointer | Backward-compatible redirect to `SKILL.md` |
| `list.md` | index | Repository structure and shipped game inventory |
| `roadmap.md` | live log | Real-time task planning, progress, and verification log |
| `contracts/settlement.contract.md` | contract doc | Host bridge settlement contract |
| `contracts/settlement.schema.json` | schema | Machine-readable payload validation schema |
| `host/cocos-settlement-handler.ts` | host adapter | Host-side payload parser and guard |
| `host/cocos-webview-integration.md` | guide | Cocos WebView integration reference |
| `standards/design-guide.md` | guide | Full visual and interaction guide |
| `standards/framework-constraints.md` | standard | Compact compatibility constraints |
| `templates/phaser-h5-template.html` | template | Starter template with bridge and settlement flow |
| `examples/` | examples | Quality references for mechanic and result-scene structure |
| `games/` | output dir | Shipped game instances (`<game_id>/index.html`) |
| `scripts/validate-settlement.js` | script | Local settlement validator |
| `qa/compatibility-checklist.md` | qa | Pre-release compatibility checklist |

## Maintenance Rules

- `roadmap.md` must be updated before a substantive task starts and after it is verified.
- `list.md` must be updated whenever the game inventory changes.
- `SKILL.md` is the single source of truth for agent behavior in this repository.

## Game Inventory

Current total: `50` games

| Name | Gameplay | Directory |
| --- | --- | --- |
| Arithmetic Rush | 限时算式速答 | `games/arithmetic-rush/index.html` |
| Balance Beam | 左右施力维持平衡 | `games/balance-beam/index.html` |
| Balloon Pop | 快速点击打爆气球 | `games/balloon-pop/index.html` |
| Basket Catch | 左右移动接住落物 | `games/basket-catch/index.html` |
| Bomb Defuse | 读提示切正确导线 | `games/bomb-defuse/index.html` |
| Breakout Blitz | 反弹小球清砖块 | `games/breakout-blitz/index.html` |
| Cannon Aim | 抛物线瞄准射击目标 | `games/cannon-aim/index.html` |
| Code Breaker | 根据线索破译密码 | `games/code-breaker/index.html` |
| Color Match | 按要求匹配颜色 | `games/color-match/index.html` |
| Conveyor Sort | 拖拽包裹分拣入箱 | `games/conveyor-sort/index.html` |
| Dial Safe | 旋转拨盘解锁保险箱 | `games/dial-safe/index.html` |
| Falling Rhythm | 下落式节奏判定 | `games/falling-rhythm/index.html` |
| Flappy Bird | 点击飞行穿过管道 | `games/flappy-bird/index.html` |
| Gate Picker | 在多门之间做快速选择 | `games/gate-picker/index.html` |
| Goalie Guard | 横向扑救守住球门 | `games/goalie-guard/index.html` |
| Jump Hurdle | 跳跃跨过连续栏架 | `games/jump-hurdle/index.html` |
| Lane Dash | 多车道切换闪避 | `games/lane-dash/index.html` |
| Maze Escape | 取钥匙后逃离迷宫 | `games/maze-escape/index.html` |
| Memory Flip | 翻牌配对记忆 | `games/memory-flip/index.html` |
| Merge 2048 | 合并数字方块冲高分 | `games/merge-2048/index.html` |
| Meteor Dodge | 闪避陨石生存 | `games/meteor-dodge/index.html` |
| Mini Golf Putt | 拉杆蓄力完成推杆进洞 | `games/mini-golf-putt/index.html` |
| Odd One Out | 找出不一样的目标 | `games/odd-one-out/index.html` |
| Orbit Avoid | 环轨切线收星避障 | `games/orbit-avoid/index.html` |
| Parking Rush | 抢占车位并快速入位 | `games/parking-rush/index.html` |
| Path Picker | 在分岔路径中选安全路线 | `games/path-picker/index.html` |
| Power Swing | 力度条定点挥击 | `games/power-swing/index.html` |
| Pulse Keeper | 按节拍维持脉冲区间 | `games/pulse-keeper/index.html` |
| QTE Boss Parry | 识别前摇后格挡反制 | `games/qte-boss-parry/index.html` |
| QTE Challenge | 基础窗口判定 QTE | `games/qte-challenge/index.html` |
| QTE Direction Switch | 限时方向连打输入 | `games/qte-direction-switch/index.html` |
| QTE Hold Release | 按住蓄力后精准松手 | `games/qte-hold-release/index.html` |
| QTE Sequence Recall | 记忆并复现指令序列 | `games/qte-sequence-recall/index.html` |
| Quiz Gauntlet | 答题闯关 | `games/quiz-gauntlet/index.html` |
| Rapid Memory | 短时展示后快速回忆 | `games/rapid-memory/index.html` |
| Reactor Cooler | 调节阀值给反应堆降温 | `games/reactor-cooler/index.html` |
| 123 Wooden Man | 红灯停绿灯行 | `games/red-light-green-light/index.html` |
| Shape Match | 图形匹配归类 | `games/shape-match/index.html` |
| Shell Shuffle | 跟踪洗牌后的目标壳 | `games/shell-shuffle/index.html` |
| Slot Machine | 老虎机停轮判定 | `games/slot-machine/index.html` |
| Snake Sprint | 贪吃蛇冲分 | `games/snake-sprint/index.html` |
| Spotlight Seek | 用聚光灯找隐藏目标 | `games/spotlight-seek/index.html` |
| Stack Drop | 对齐掉落方块叠塔 | `games/stack-drop/index.html` |
| Stardew Fishing | 钓鱼平衡条控制 | `games/stardew-fishing/index.html` |
| Survive 30 Seconds | 30 秒短局生存躲避 | `games/survive-30-seconds/index.html` |
| Target Tap | 点击移动目标抢分 | `games/target-tap/index.html` |
| Tile Trace | 按路径追踪瓷砖 | `games/tile-trace/index.html` |
| Traffic Control | 切换红绿灯疏导路口 | `games/traffic-control/index.html` |
| Whack-a-Mole | 打地鼠 | `games/whack-a-mole/index.html` |
| Word Scramble | 看提示拼回正确单词 | `games/word-scramble/index.html` |

## Conventions

- One game per folder under `games/`.
- Folder naming uses lowercase kebab-case.
- Minimum required file for each game:
  - `games/<game_id>/index.html`
- Optional per-game docs may be added as:
  - `games/<game_id>/README.md`
