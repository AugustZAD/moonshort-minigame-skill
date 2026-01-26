# 游戏组件对接指南

## 📦 组件清单

### 已创建
1. ✅ **PlayerStatsPanel.ts** - 玩家状态面板
2. ✅ **GameSceneController.ts** - 游戏总控（刚创建）

### 待创建（按对接顺序）
3. **TransitionDisplayComponent.ts** - 过渡叙事显示
4. **BCardOptionItem.ts** - B卡选项项（Prefab）
5. **BCardDisplayComponent.ts** - B卡显示
6. **ACardItem.ts** - A卡项（Prefab）
7. **ACardPanelComponent.ts** - A卡面板

## 🔄 对接流程图

```
GameSceneController (总控)
├── PlayerStatsPanel (常驻显示)
├── BCardDisplayComponent
│   └── BCardOptionItem × N (动态创建)
├── TransitionDisplayComponent  
└── ACardPanelComponent
    └── ACardItem × N (动态创建)
```

## 📝 对接步骤

### Step 1: 创建 Game 场景结构

在 Cocos Creator 中创建以下节点结构：

```
GameScene (挂载 GameSceneController)
├── PlayerStatsPanel (挂载 PlayerStatsPanel)
│   ├── LevelLabel
│   ├── ExpBar
│   │   └── Fill (Sprite, Type=FILLED)
│   ├── HPBar
│   │   ├── Label
│   │   └── Fill (Sprite, Type=FILLED)
│   ├── MPBar
│   │   ├── Label
│   │   └── Fill (Sprite, Type=FILLED)
│   ├── SpiritStoneLabel
│   ├── CombatLabel
│   ├── IntelligenceLabel
│   ├── CharismaLabel
│   ├── WillLabel
│   └── BuffsContainer
│
├── LoadingNode
│   └── Label "加载中..."
│
├── ErrorNode
│   └── Label "加载失败"
│
├── BCardContainer (挂载 BCardDisplayComponent)
│   ├── IntroVideo (VideoTexturePlayer)
│   ├── NarrativeText (Label/RichText)
│   ├── DecisionsContainer (Layout)
│   └── EndingVideo (VideoTexturePlayer)
│
├── TransitionContainer (挂载 TransitionDisplayComponent)
│   ├── NarrativeText
│   └── ContinueButton
│
└── ACardContainer (挂载 ACardPanelComponent)
    ├── PathTabs
    │   ├── Tab1 "自我提升"
    │   ├── Tab2 "资源筹备"
    │   └── Tab3 "社交情报"
    ├── CardsScrollView
    │   └── Content
    └── SelectedCardsPanel
```

### Step 2: 配置 GameSceneController

在 GameScene 根节点的 GameSceneController 组件中配置：

| 属性 | 拖拽的节点 |
|------|-----------|
| `playerStatsPanelNode` | PlayerStatsPanel |
| `bCardContainerNode` | BCardContainer |
| `aCardContainerNode` | ACardContainer |
| `transitionContainerNode` | TransitionContainer |
| `loadingNode` | LoadingNode |
| `errorNode` | ErrorNode |

### Step 3: 配置 PlayerStatsPanel

在 PlayerStatsPanel 节点的组件中配置所有 Label 和 Sprite 引用。

### Step 4: 创建预制体

#### 4.1 创建 BCardOption.prefab
```
BCardOption (Button, 挂载 BCardOptionItem)
├── Background (Sprite)
├── OptionText (Label)
└── CheckInfo (Label) - 显示检定要求
```

#### 4.2 创建 ACard.prefab
```
ACard (挂载 ACardItem)
├── Background (Sprite)
├── CardName (Label)
├── CardPath (Label)
├── Description (Label)
├── Cost (Label)
└── SelectMark (Node) - 选中标记
```

## 🔌 组件对接顺序

### 阶段 1: 基础框架（当前）
✅ 1. PlayerStatsPanel - 已创建
✅ 2. GameSceneController - 已创建

### 阶段 2: 简单组件
⏳ 3. TransitionDisplayComponent - 最简单，先做
⏳ 4. BCardOptionItem - Prefab 组件

### 阶段 3: B卡系统
⏳ 5. BCardDisplayComponent - 依赖 BCardOptionItem

### 阶段 4: A卡系统
⏳ 6. ACardItem - Prefab 组件
⏳ 7. ACardPanelComponent - 依赖 ACardItem

## 📋 组件接口说明

### GameSceneController 对外接口
```typescript
// 获取当前存档
getCurrentSave(): PlayerSave | null

// 获取当前阶段
getCurrentPhase(): GamePhase
```

### 子组件需要实现的接口

#### PlayerStatsPanel
```typescript
// 更新玩家状态显示
updatePlayerState(save: PlayerSave): void
```

#### BCardDisplayComponent
```typescript
// 显示 B 卡内容
displayBCard(bcard: EnrichedBCard): void

// 事件：B卡完成
// this.node.emit('bcard-completed', result)
```

#### ACardPanelComponent
```typescript
// 显示 A 卡池
displayACardPool(pool: ACardPool): void

// 事件：A卡完成
// this.node.emit('acard-completed', result)
```

#### TransitionDisplayComponent
```typescript
// 显示过渡叙事
displayTransition(transition: TransitionNarrative): void

// 事件：过渡完成
// this.node.emit('transition-completed')
```

## 🎯 数据流动

### 1. 进入游戏
```
Overview Scene (传递 saveId)
    ↓
GameSceneController.onLoad()
    ↓
loadSave(saveId)
    ↓
API: getSaveDetail(saveId)
    ↓
PlayerStatsPanel.updatePlayerState(save)
    ↓
根据 save.gamePhase 决定进入哪个阶段
```

### 2. B卡阶段
```
startBCardPhase()
    ↓
API: getEnrichedBCard(saveId)
    ↓
BCardDisplayComponent.displayBCard(bcard)
    ↓
玩家做出选择
    ↓
API: evaluateBCard(saveId, nodeIndex, checkResults)
    ↓
触发事件: 'bcard-completed'
    ↓
GameSceneController.onBCardCompleted()
    ↓
更新存档 → 进入过渡阶段
```

### 3. 过渡阶段
```
startTransitionPhase(nodeIndex, resultType)
    ↓
API: generateTransition(saveId, nodeIndex, resultType)
    ↓
TransitionDisplayComponent.displayTransition(transition)
    ↓
玩家点击继续
    ↓
触发事件: 'transition-completed'
    ↓
GameSceneController.onTransitionCompleted()
    ↓
进入 A卡阶段
```

### 4. A卡阶段
```
startACardPhase()
    ↓
API: getACardPool(saveId)
    ↓
ACardPanelComponent.displayACardPool(pool)
    ↓
玩家选择卡片（最多2张）
    ↓
每张卡片: API.selectACard(saveId, cardId)
    ↓
触发事件: 'acard-completed'
    ↓
GameSceneController.onACardCompleted()
    ↓
检查 prepTurnsRemaining
    - 如果 > 0: 继续 A卡阶段
    - 如果 = 0: 进入下一个 B卡阶段
```

## 🔑 关键点

### 1. 事件驱动
所有子组件通过事件与 GameSceneController 通信：
```typescript
// 子组件触发事件
this.node.emit('bcard-completed', result);

// GameSceneController 监听
this.bCardDisplay.node.once('bcard-completed', this.onBCardCompleted, this);
```

### 2. 组件查找
GameSceneController 通过 `getComponent` 和 `getComponentInChildren` 查找子组件：
```typescript
this.playerStatsPanel = node.getComponent(PlayerStatsPanel);
if (!this.playerStatsPanel) {
    this.playerStatsPanel = node.getComponentInChildren(PlayerStatsPanel);
}
```

### 3. 容器切换
使用 `active` 属性控制容器显示/隐藏：
```typescript
this.bCardContainerNode.active = true;  // 显示
this.aCardContainerNode.active = false; // 隐藏
```

## 🚀 下一步

**请告诉我你希望我接下来创建哪个组件**，建议顺序：

1. **TransitionDisplayComponent** - 最简单，只显示文本和按钮
2. **BCardOptionItem** - B卡选项的 Prefab 组件
3. **BCardDisplayComponent** - B卡显示和交互
4. **ACardItem** - A卡的 Prefab 组件
5. **ACardPanelComponent** - A卡面板和选择逻辑

我会按照你指定的顺序逐个完整实现这些组件。
