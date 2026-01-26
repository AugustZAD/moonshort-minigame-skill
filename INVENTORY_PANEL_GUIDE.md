# InventoryPanel 使用指南

## 📋 概述

`InventoryPanel` 是道具系统的总控器，负责：
- 显示玩家背包道具列表
- 按类别筛选道具（全部/装备/增益/道具/骰子）
- 从服务器加载道具数据
- 使用 ItemCard 预制体渲染道具

## 🏗️ 节点结构

```
InventoryPanel (Node + InventoryPanel Component)
├── CategoryButtons (Node) - 类别按钮容器
│   ├── AllButton (Node + Button) - 全部按钮
│   ├── EquipmentButton (Node + Button) - 装备类按钮
│   ├── BuffButton (Node + Button) - 增益类按钮
│   ├── ConsumableButton (Node + Button) - 道具类按钮
│   └── DiceButton (Node + Button) - 骰子类按钮
└── ItemsContainer (Node + Layout) - 道具容器（Grid/Horizontal/Vertical Layout）
```

## ⚙️ 组件配置

### 1. 节点引用

| 属性 | 类型 | 说明 |
|------|------|------|
| `itemsContainer` | Node | 道具列表容器（需添加 Layout 组件）|
| `itemCardPrefab` | Prefab | ItemCard 预制体 |

### 2. 类别按钮配置（5个）

在 `categoryButtons` 数组中配置：

```typescript
[0] { categoryId: "all", buttonNode: <AllButton节点>, iconSprite: <可选图标> }
[1] { categoryId: "equipment", buttonNode: <EquipmentButton节点>, iconSprite: <可选图标> }
[2] { categoryId: "buff", buttonNode: <BuffButton节点>, iconSprite: <可选图标> }
[3] { categoryId: "consumable", buttonNode: <ConsumableButton节点>, iconSprite: <可选图标> }
[4] { categoryId: "dice", buttonNode: <DiceButton节点>, iconSprite: <可选图标> }
```

### 3. 颜色配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `activeColor` | string | `#FF6B35` | 激活状态颜色 |
| `normalColor` | string | `#CCCCCC` | 普通状态颜色 |

## 💻 代码使用

### 基本用法

```typescript
// 在场景中获取 InventoryPanel
const panel = this.node.getComponent(InventoryPanel);

// 设置玩家ID并加载道具
await panel.setPlayer(playerId);
```

### 监听道具点击事件

```typescript
// 监听道具选中事件
panel.node.on('item-selected', (item: ItemData) => {
    console.log('玩家选中了道具:', item.name);
    // 打开详情面板、使用道具等
}, this);
```

### 刷新道具列表

```typescript
// 刷新当前类别的道具
await panel.refresh();

// 获取当前选中的类别
const category = panel.getCurrentCategory(); // 'all' | 'equipment' | 'buff' | 'consumable' | 'dice'
```

## 🎯 工作流程

### 1. 初始化流程

```
用户进入背包界面
  ↓
调用 panel.setPlayer(playerId)
  ↓
loadItems() - 从服务器获取所有道具
  ↓
renderItems() - 渲染道具列表（使用 ItemCard 预制体）
  ↓
显示完成
```

### 2. 切换类别流程

```
用户点击类别按钮（如：装备）
  ↓
onCategoryButtonClick('equipment')
  ↓
updateButtonStates() - 更新按钮高亮状态
  ↓
loadItems('equipment') - 从服务器获取该类别道具
  ↓
renderItems() - 重新渲染列表
  ↓
显示完成
```

### 3. 道具去重与计数

组件会自动对相同ID的道具进行去重和计数：

```typescript
背包中有：
  - 小型HP药水 (id: item_001)
  - 小型HP药水 (id: item_001)
  - 小型HP药水 (id: item_001)

渲染时会合并为：
  - 小型HP药水 ×3
```

## 🔧 Cocos Creator 配置步骤

### 步骤1：创建 InventoryPanel 节点

1. 创建一个空节点，命名为 `InventoryPanel`
2. 添加 `InventoryPanel` 组件

### 步骤2：创建类别按钮

在 `InventoryPanel` 下创建 `CategoryButtons` 容器：

```
CategoryButtons
├── AllButton (Button)
├── EquipmentButton (Button)
├── BuffButton (Button)
├── ConsumableButton (Button)
└── DiceButton (Button)
```

### 步骤3：创建道具容器

1. 创建 `ItemsContainer` 节点
2. 添加 **Layout** 组件（Grid Layout / Horizontal Layout / Vertical Layout）
3. 配置 Layout 参数：
   - Type: GRID
   - Cell Size: 设置每个道具卡片的大小
   - Spacing: 设置间距
   - Padding: 设置边距

### 步骤4：配置 InventoryPanel 组件

1. **Items Container**: 拖拽 `ItemsContainer` 节点
2. **Item Card Prefab**: 拖拽 `ItemCard.prefab`
3. **Category Buttons**: 配置 5 个按钮
   - 每个按钮设置 `categoryId` 和 `buttonNode`
   - 可选：设置 `iconSprite` 用于颜色变化
4. **颜色配置**: 设置激活/普通状态颜色

## 🎨 视觉效果

### 按钮状态

- **普通状态**: 灰色 (`#CCCCCC`)
- **激活状态**: 橙色 (`#FF6B35`)

点击按钮后，会自动更新按钮的 Sprite 颜色。

### 布局示例

```
┌─────────────────────────────────────┐
│  [全部] [装备] [增益] [道具] [骰子]   │  ← 类别按钮
├─────────────────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│  │道具│ │道具│ │道具│ │道具│           │
│  └───┘ └───┘ └───┘ └───┘           │  ← 道具列表
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐           │     (Grid Layout)
│  │道具│ │道具│ │道具│ │道具│           │
│  └───┘ └───┘ └───┘ └───┘           │
└─────────────────────────────────────┘
```

## 🔌 后端接口

### 获取道具列表

```
GET /api/players/{playerId}/inventory?category=equipment

参数：
- category (可选): 'equipment' | 'buff' | 'consumable' | 'dice'
- 不传 category 或传 'all' 返回所有道具

返回：ItemData[]
```

## 📝 注意事项

1. **ItemCard 预制体必须配置好**：确保 ItemCard.prefab 已创建并配置了所有图标
2. **Layout 组件必须添加**：ItemsContainer 必须有 Layout 组件才能自动排列
3. **玩家ID必须设置**：使用前必须调用 `setPlayer(playerId)`
4. **事件清理**：组件会自动清理事件，无需手动处理

## 🚀 完整示例

```typescript
import { _decorator, Component } from 'cc';
import { InventoryPanel } from './InventoryPanel';
import { ItemData } from './ItemCard';

const { ccclass, property } = _decorator;

@ccclass('GameScene')
export class GameScene extends Component {
    @property({ type: InventoryPanel })
    inventoryPanel: InventoryPanel | null = null;
    
    async start() {
        // 初始化背包面板
        if (this.inventoryPanel) {
            // 设置玩家ID
            await this.inventoryPanel.setPlayer(123);
            
            // 监听道具点击
            this.inventoryPanel.node.on('item-selected', (item: ItemData) => {
                console.log('选中道具:', item);
                this.showItemDetail(item);
            }, this);
        }
    }
    
    showItemDetail(item: ItemData) {
        // 显示道具详情弹窗
    }
}
```

## 📚 相关文档

- [ItemCard 组件使用指南](./ITEM_CARD_GUIDE.md)
- [ItemCard 配置说明](./ITEM_CARD_CONFIG.md)
- [后端道具系统](../mob.ai/git/noval.demo.2/app/lib/items.ts)
