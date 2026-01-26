# ItemCard 组件使用指南

## 📋 概述

`ItemCard` 是一个用于展示单个装备或消耗品的 UI 组件。它负责根据道具数据更新显示，包括稀有度、类别、名称、图标、数量等信息。

## 🎯 主要功能

- ✅ 显示 4 个稀有度等级（普通/精良/史诗/传说）
- ✅ 根据稀有度显示不同颜色的背景
- ✅ 显示装备/消耗品图标（可配置）
- ✅ 显示道具名称（支持盲盒状态）
- ✅ 显示类别标签（武器/头饰/服饰/手饰/消耗品）
- ✅ 显示持有数量
- ✅ 显示属性加成（仅装备）
- ✅ 支持点击交互

## 🏗️ 节点结构

创建一个 ItemCard 预制体时，按以下结构组织节点：

```
ItemCard (Node + ItemCard Component)
├── Background (Sprite) - 背景，根据稀有度变色
├── Icon (Sprite) - 道具图标
├── Name (Label) - 道具名称
├── CategoryLabel (Label) - 类别标签
├── RarityBadge (Node) - 稀有度标识容器
│   └── RarityLabel (Label) - 稀有度文本（普通/精良/史诗/传说）
├── CountBadge (Node) - 数量标识容器
│   └── CountLabel (Label) - 数量文本（×2）
└── AttributeLabel (Label) - 属性加成（战斗 +2）
```

## ⚙️ 组件配置

### 1. 节点引用配置

在 Cocos Creator 编辑器中，将以下节点拖拽到对应属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| `backgroundSprite` | Sprite | 背景精灵 |
| `iconSprite` | Sprite | 道具图标 |
| `nameLabel` | Label | 道具名称 |
| `categoryLabel` | Label | 类别标签 |
| `rarityBadge` | Node | 稀有度标识节点 |
| `rarityLabel` | Label | 稀有度文本 |
| `countBadge` | Node | 数量标识节点 |
| `countLabel` | Label | 数量文本 |
| `attributeLabel` | Label | 属性加成标签 |
| `itemButton` | Button | 卡片按钮（可选） |

### 2. 稀有度背景配置

配置 4 个稀有度的背景图片（可选，不配置则使用默认颜色）：

```typescript
rarityBackgrounds: [
    { rarity: "common", backgroundFrame: <普通背景图> },
    { rarity: "fine", backgroundFrame: <精良背景图> },
    { rarity: "epic", backgroundFrame: <史诗背景图> },
    { rarity: "legendary", backgroundFrame: <传说背景图> }
]
```

### 3. 类别图标配置

配置装备和消耗品的图标：

```typescript
categoryIcons: [
    // 装备类别
    { categoryId: "weapon", iconFrame: <武器图标> },
    { categoryId: "headpiece", iconFrame: <头饰图标> },
    { categoryId: "clothing", iconFrame: <服饰图标> },
    { categoryId: "accessory", iconFrame: <手饰图标> },
    
    // 消耗品类别（根据 effectType）
    { categoryId: "hp_restore", iconFrame: <HP药水图标> },
    { categoryId: "mp_restore", iconFrame: <MP药水图标> },
    { categoryId: "stat_boost", iconFrame: <属性药剂图标> },
    { categoryId: "advantage", iconFrame: <优势骰子图标> },
    { categoryId: "remove_influence", iconFrame: <消除卷轴图标> },
    // ... 其他消耗品类型
]
```

## 💻 代码使用

### 基本用法

```typescript
import { ItemCard, ItemData, ItemRarity, EquipmentSlot } from './ItemCard';

// 创建装备数据
const equipmentData: ItemData = {
    id: 'eq_001',
    type: 'equipment',
    name: '精良武器',
    rarity: ItemRarity.FINE,
    slot: EquipmentSlot.WEAPON,
    attribute: 'combat',
    bonus: 2,
    isRevealed: true,
    revealedName: '破魔之剑',
    count: 1
};

// 获取 ItemCard 组件
const itemCard = itemNode.getComponent(ItemCard);

// 设置数据（会自动更新显示）
itemCard.setItemData(equipmentData);

// 设置点击回调
itemCard.setClickCallback((item) => {
    console.log('道具被点击:', item.name);
});
```

### 消耗品示例

```typescript
const consumableData: ItemData = {
    id: 'con_001',
    type: 'consumable',
    name: '治疗药水',
    rarity: ItemRarity.COMMON,
    effectType: 'hp_restore',
    effect: { value: 40 },
    isRevealed: true,
    revealedName: '小型治疗药水',
    count: 3  // 持有 3 个
};

itemCard.setItemData(consumableData);
```

### 盲盒状态

```typescript
const blindBoxData: ItemData = {
    id: 'eq_002',
    type: 'equipment',
    name: '史诗装备',
    rarity: ItemRarity.EPIC,
    slot: EquipmentSlot.HEADPIECE,
    attribute: 'intelligence',
    bonus: 3,
    isRevealed: false,  // 未揭示
    count: 1
};

itemCard.setItemData(blindBoxData);
// 显示为：🎁 史诗装备盲盒
```

## 🎨 稀有度颜色配置

组件内置了 4 个稀有度的默认颜色：

| 稀有度 | 颜色 | RGB |
|--------|------|-----|
| 普通 (common) | 灰色 | (200, 200, 200) |
| 精良 (fine) | 蓝色 | (100, 150, 255) |
| 史诗 (epic) | 紫色 | (200, 100, 255) |
| 传说 (legendary) | 橙色 | (255, 165, 0) |

这些颜色会自动应用到：
- 背景精灵的 `color` 属性
- 稀有度标签的文本颜色

## 📊 数据接口

### ItemData 接口

```typescript
interface ItemData {
    id: string;                    // 道具 ID
    type: 'equipment' | 'consumable';  // 类型
    name: string;                  // 默认名称
    rarity: ItemRarity;            // 稀有度
    
    // 装备特有
    slot?: EquipmentSlot;          // 装备槽位
    attribute?: string;            // 影响的属性
    bonus?: number;                // 属性加成
    
    // 消耗品特有
    effectType?: string;           // 效果类型
    effect?: any;                  // 效果详情
    
    // 盲盒相关
    isRevealed?: boolean;          // 是否已揭示
    revealedName?: string;         // 揭示后的名称
    
    // UI 相关
    count?: number;                // 持有数量（默认 1）
}
```

## 🔧 常用方法

### setItemData(data: ItemData)
设置道具数据并更新显示。

### getItemData(): ItemData | null
获取当前道具数据。

### setClickCallback(callback: (item: ItemData) => void)
设置点击回调函数。

### setInteractable(interactable: boolean)
设置按钮是否可点击。

```typescript
// 禁用卡片点击
itemCard.setInteractable(false);
```

## 📝 使用注意事项

1. **必须配置的节点**：至少需要配置 `nameLabel` 和 `iconSprite`，其他节点为可选。

2. **图标配置**：
   - 装备图标使用 `slot` 作为 key（weapon/headpiece/clothing/accessory）
   - 消耗品图标使用 `effectType` 作为 key（hp_restore/mp_restore 等）

3. **数量显示**：
   - 当 `count > 1` 时，显示数量标识
   - 当 `count <= 1` 时，隐藏数量标识

4. **属性加成显示**：
   - 仅当 `type === 'equipment'` 且存在 `attribute` 和 `bonus` 时显示
   - 消耗品不显示属性加成

5. **盲盒状态**：
   - 当 `isRevealed === false` 时，显示盲盒名称格式：`🎁 {稀有度}{类型}盲盒`
   - 当 `isRevealed === true` 时，显示 `revealedName` 或 `name`

## 🎯 下一步

创建好 `ItemCard` 组件后，可以：

1. 在 Cocos Creator 中创建 `ItemCard.prefab` 预制体
2. 配置节点引用和图标资源
3. 创建 `InventoryPanel` 组件，使用 ItemCard 来显示背包列表
4. 创建 `EquipmentPanel` 组件，显示装备槽和已装备的道具

## 📚 相关文档

- [游戏系统概览](./GAME_SYSTEM_OVERVIEW.md)
- [道具系统设计](/Users/rydia/Project/mob.ai/git/noval.demo.2/coreDocs/gems_system.md)
- [后端道具 API](/Users/rydia/Project/mob.ai/git/noval.demo.2/app/api/players/[id]/inventory/route.ts)
