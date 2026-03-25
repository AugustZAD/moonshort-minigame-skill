# Attribute Archetype Selection Matrix

This table is the editor-facing reference for matching story beats to the curated 12-template pack.

| Attribute | Game ID | Core gameplay | Why it fits | Best-fit scene signals |
| --- | --- | --- | --- | --- |
| `ATK` 身手 | `qte-boss-parry` | 观察敌方前摇, 在极短判定窗内格挡并反击, 连续成功可维持高压攻防节奏。 | 最适合正面对抗、护人、拆招、硬碰硬反制, 玩家会直接感到“身手好不好”。 | 打架, 挡招, 保护别人, 冲突升级, 近身反制, 正面硬刚 |
| `ATK` 身手 | `lane-dash` | 在多车道之间快速切换, 躲开障碍并持续前冲, 节奏越来越快。 | 突出闪避、走位、追逃、穿越危险区域的身体反应。 | 追逐, 逃跑, 冲刺, 穿越人群, 翻越封锁, 险中求生 |
| `ATK` 身手 | `cannon-aim` | 调整射击角度与时机, 命中移动目标或关键落点。 | 提供“精准出手”分支, 让 ATK 不只等于连点或闪避。 | 瞄准, 投掷, 远距离命中, 打信号, 打掉物件, 精准一击 |
| `WIL` 意志 | `will-surge` | 连续点击维持意志槽, 抵抗不断上升的威压; 爆发波次会突然加压, 必须撑到倒计时结束。 | 几乎是“意志检定”的直译玩法, 特别适合忍耐、抵抗、顶住压迫。 | 忍住, 不屈服, 顶住压力, 扛住恐惧, 抵抗控制, 撑到救援 |
| `WIL` 意志 | `red-light-green-light` | 绿灯时前进, 红灯时必须瞬间冻住; 红灯期间任何动作都会被惩罚。 | 典型的冲动控制测试, 适合"别动""忍住""装死""不暴露"这类自律/隐忍场景。 | 别动, 忍住冲动, 不暴露, 装死, 自律, 潜伏 |
| `WIL` 意志 | `qte-hold-release` | 按住蓄力, 等准星进入最佳释放区后松手, 早放或晚放都会失误。 | 适合“忍到正确时机”的场景, 体现克制、耐心、定力。 | 克制, 忍耐, 等时机, 不可提前行动, 蓄势, 压住冲动 |
| `INT` 智慧 | `conveyor-sort` | 从传送带上拖拽包裹到对应分类箱, 速度递增且类别增多。 | 快速分类判断, 适合"整理线索""信息筛选""优先排序"等需要分析力的智慧场景。 | 快速分析, 分类判断, 整理线索, 优先排序, 信息筛选, 归档 |
| `INT` 智慧 | `parking-rush` | 通过移动不同车辆或障碍物, 腾出关键通路, 用最短步骤完成解局。 | 强调空间规划和多步推演, 比单点答题更像真正的“聪明操作”。 | 规划路线, 挪开障碍, 调度, 多步解法, 布局, 借位 |
| `INT` 智慧 | `maze-escape` | 在迷宫中寻找出口或关键节点, 规划路径并避免走入死路。 | 适合调查、潜入、找路、快速判断最优路线。 | 找出口, 探路, 潜入, 绕路, 地形判断, 空间推理 |
| `CHA` 魅力 | `color-match` | 看提示快速点击匹配的颜色, 回合加速且干扰项增多。 | 包装成”察言观色”——快速读懂对方情绪信号并回应, 体现社交直觉和氛围感。 | 察言观色, 配合情绪, 社交直觉, 氛围感, 快速回应, 读懂信号 |
| `CHA` 魅力 | `spotlight-seek` | 移动聚光灯, 在暗处找到目标人物或关键焦点, 兼具探索和注视感。 | 很适合“在人群中一下看到你”或“把注意力吸过来”的叙事。 | 人群中找人, 目光锁定, 偷偷见面, 被吸引, 暗处观察, 焦点感 |
| `CHA` 魅力 | `stardew-fishing` | 通过按住和松开控制浮标, 让它持续贴住移动目标区间, 像在拉扯互动节奏。 | 适合包装成聊天拉扯、暧昧试探、拿捏节奏, 比传统记忆玩法更有情绪张力。 | 调情, 试探, 聊天节奏, 拉扯, 吊胃口, 维持关注 |

## Quick Routing Heuristic

- If the scene is about direct physical confrontation or evasive movement, start from `ATK`.
- If the scene is about enduring fear, pain, coercion, or panic, start from `WIL`.
- If the scene is about deduction, route planning, or puzzle solving, start from `INT`.
- If the scene is about attraction, performance, chemistry, or social pull, start from `CHA`.

## Avoid Misrouting

- Do not send pure combat scenes to `CHA` only because they involve a love interest.
- Do not send panic scenes to `INT` unless the win condition is genuinely puzzle solving.
- Do not send stealth or escape scenes to `WIL` if player fantasy is mostly movement skill; prefer `ATK`.
- Do not send romantic scenes to `WIL` unless the dramatic core is restraint or emotional endurance.
