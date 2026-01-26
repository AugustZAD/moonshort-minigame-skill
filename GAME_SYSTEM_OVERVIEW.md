# 游戏系统完整架构文档

## 📋 已完成的基础设施

### 1. 类型定义 (`assets/scripts/types/game.types.ts`)
✅ 已创建完整的游戏类型系统：
- `GamePhase` - 游戏阶段枚举（A_CARD/B_CARD/TRANSITION）
- `PlayerSave` - 完整存档数据
- `BCardData` / `EnrichedBCard` - B卡原始和富化数据
- `ACard` / `ACardPool` - A卡和卡池
- `TempModifier` - 临时Buff/Debuff
- 其他所有游戏相关类型

### 2. API 封装 (`assets/scripts/api/GameAPI.ts`)
✅ 已创建完整的游戏API封装：
- **存档管理**: getSaves, getSaveDetail, createSave, updateSave, deleteSave
- **B卡系统**: getBCard, getEnrichedBCard, evaluateBCard
- **A卡系统**: getACardPool, selectACard
- **过渡叙事**: generateTransition

## 🎮 游戏流程架构

### 核心流程
```
1. 选择小说 (NovelsListComponent)
   ↓
2. 创建存档/选择存档 (分配属性)
   ↓
3. 进入游戏场景 (Game Scene)
   ↓
4. 游戏循环:
   ┌─────────────────────────────┐
   │ B卡阶段 (剧情+抉择)          │
   │ - 播放intro视频             │
   │ - 显示AI生成的叙事           │
   │ - 玩家做出抉择               │
   │ - 检定判定                   │
   │ - 播放ending视频             │
   │ - 结算奖励                   │
   └──────────┬──────────────────┘
              ↓
   ┌─────────────────────────────┐
   │ 过渡叙事 (Transition)        │
   │ - 显示过渡文本               │
   └──────────┬──────────────────┘
              ↓
   ┌─────────────────────────────┐
   │ A卡阶段 (准备)              │
   │ - 显示A卡池                 │
   │ - 玩家选择2张A卡             │
   │ - 扣除灵石                   │
   │ - 获得Buff/属性提升           │
   └──────────┬──────────────────┘
              ↓
   (返回B卡阶段，继续下一个节点)
```

## 🏗️ 建议的组件架构

### 方案一：单一游戏管理组件（推荐）

#### `GameSceneController.ts` - 游戏场景总控
**职责**：
- 管理游戏状态和阶段切换
- 加载和更新存档
- 协调各个UI组件
- 处理场景跳转

**核心方法**：
```typescript
- onLoad() // 获取saveId参数，加载存档
- loadSave(saveId) // 加载存档详情
- updatePlayerState() // 更新存档状态
- switchToACardPhase() // 切换到A卡阶段
- switchToBCardPhase() // 切换到B卡阶段
- switchToTransition() // 显示过渡叙事
```

#### `PlayerStatsPanel.ts` - 玩家状态面板（常驻）
**显示内容**：
- 等级、经验条
- HP/MP 条
- 灵石（货币）
- 四维属性（combat, intelligence, charisma, will）
- Buff/Debuff 图标

#### `BCardDisplay.ts` - B卡显示组件
**功能**：
- 播放intro视频（VideoTexturePlayer）
- 显示AI生成的叙事文本
- 显示抉择选项（带检定信息）
- 处理玩家选择
- 播放ending视频
- 显示结算结果

#### `ACardPanel.ts` - A卡选择面板
**功能**：
- 显示A卡池（分三个路径）
- 显示每张卡的费用和效果
- 处理卡片选择（最多2张）
- 扣除灵石
- 显示选择效果

#### `TransitionDisplay.ts` - 过渡叙事显示
**功能**：
- 显示过渡文本
- 自动或手动继续到下一阶段

###方案二：分离的游戏管理器（更模块化）

#### `GameStateManager.ts` - 全局游戏状态管理器（单例）
```typescript
class GameStateManager {
    currentSave: PlayerSave | null
    currentPhase: GamePhase
    currentBCard: EnrichedBCard | null
    currentACardPool: ACardPool | null
    
    loadSave(saveId: number)
    updateSave(updates: Partial<PlayerSave>)
    switchPhase(phase: GamePhase)
    // 事件系统
    on(event: string, callback: Function)
    emit(event: string, data: any)
}
```

## 📊 UI布局建议

### Game Scene 节点结构
```
GameScene
├── GameSceneController (挂载主控组件)
├── PlayerStatsPanel (常驻显示)
│   ├── LevelText
│   ├── ExpBar
│   ├── HPBar
│   ├── MPBar
│   ├── SpiritStoneText
│   └── BuffsContainer
├── BCardContainer (B卡阶段显示)
│   ├── IntroVideo (VideoTexturePlayer)
│   ├── NarrativeText (Label/RichText)
│   ├── DecisionsContainer
│   │   └── OptionButton × N
│   ├── EndingVideo (VideoTexturePlayer)
│   └── ResultPanel
├── TransitionContainer (过渡叙事)
│   └── NarrativeText
└── ACardContainer (A卡阶段显示)
    ├── PathTab × 3 (三个路径标签)
    ├── CardsScrollView
    │   └── CardItem × N
    └── SelectedCardsPanel
```

## 🔄 游戏数据流

### 1. 进入游戏
```
Overview Scene → Game Scene
传递参数: { saveId: number } 或 { novelId: string, needCreate: true }
```

### 2. 加载存档
```typescript
// GameSceneController.onLoad()
const params = SceneParams.get<{ saveId?: number, novelId?: string }>();

if (params.saveId) {
    const save = await gameAPI.getSaveDetail(params.saveId);
    this.loadSaveData(save);
} else if (params.novelId) {
    // 显示属性分配界面
    this.showAttributeAllocation(params.novelId);
}
```

### 3. B卡流程
```typescript
// 1. 获取当前节点的B卡
const bcard = await gameAPI.getEnrichedBCard(saveId);

// 2. 显示intro视频 + 叙事文本

// 3. 玩家做出抉择
const choice = await this.waitForPlayerChoice();

// 4. 结算
const result = await gameAPI.evaluateBCard(saveId, bcard.nodeIndex, checkResults);

// 5. 显示ending视频 + 结算结果

// 6. 更新存档
await gameAPI.updateSave(saveId, result.playerUpdates);

// 7. 生成过渡叙事
const transition = await gameAPI.generateTransition(saveId, bcard.nodeIndex);

// 8. 显示过渡 → 进入A卡阶段
```

### 4. A卡流程
```typescript
// 1. 获取A卡池
const pool = await gameAPI.getACardPool(saveId);

// 2. 玩家选择2张A卡
const selectedCards = await this.waitForCardSelection(2);

// 3. 依次选择卡片
for (const card of selectedCards) {
    const result = await gameAPI.selectACard(saveId, card.id);
    // 显示效果
    this.showCardEffect(result);
}

// 4. 更新存档并进入下一个B卡
this.moveToNextNode();
```

## 🎨 需要的资源

### UI 资源
- [ ] 卡片背景（A卡三种路径）
- [ ] HP/MP条背景和填充图
- [ ] 经验条背景和填充图
- [ ] 按钮样式（普通/选中/不可用）
- [ ] Buff/Debuff 图标
- [ ] 货币图标（灵石）
- [ ] 属性图标（combat/intelligence/charisma/will）

### 预制体
- [ ] ACardItem.prefab - A卡项
- [ ] BCardOption.prefab - B卡选项按钮
- [ ] BuffIcon.prefab - Buff图标

## 🚀 实现优先级建议

### Phase 1: 核心流程（必需）
1. ✅ GameAPI 和类型定义
2. GameSceneController - 主控制器
3. PlayerStatsPanel - 玩家状态面板
4. BCardDisplay - B卡显示（简化版，先文本后视频）
5. 测试 B卡流程

### Phase 2: A卡系统
1. ACardPanel - A卡选择面板
2. 测试 A→B 完整循环

### Phase 3: 完善功能
1. 视频播放（VideoTexturePlayer 集成）
2. TransitionDisplay - 过渡叙事
3. 动画和视觉效果
4. 音效和音乐

### Phase 4: 高级功能
1. 商城系统集成
2. 道具和装备系统
3. 存档管理界面
4. 成就系统

## 📝 后续步骤

**请告诉我你需要优先实现哪些部分**，我可以：

1. 创建完整的 `GameSceneController` 组件
2. 创建 `PlayerStatsPanel` 显示玩家状态
3. 创建 `BCardDisplay` 处理剧情和抉择
4. 创建 `ACardPanel` 处理A卡选择
5. 创建完整的使用示例和配置指南

**你也可以告诉我哪些功能暂时不需要**，我会调整实现方案。

## 🔗 相关文档

- [场景参数传递指南](./SCENE_PARAMS_GUIDE.md)
- [视频播放组件指南](./VIDEO_TEXTURE_GUIDE.md)
- [小说详情页指南](./NOVEL_OVERVIEW_GUIDE.md)
