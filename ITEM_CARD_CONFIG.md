# ItemCard 配置说明

## ✅ 优化后的配置方式

### 1. 道具图标按 **类别+稀有度** 组合

每个道具的图标现在由**类别**和**稀有度**共同决定，支持更精细的视觉呈现。

**配置格式：** `类别_稀有度`

### 2. 默认名称自动生成

如果后端没有返回道具名称，组件会根据**类别+稀有度**自动生成默认名称：
- 装备：`{稀有度}{类别}`（如：**精良武器**、**史诗头饰**）
- 消耗品：`{稀有度}消耗品`（如：**普通消耗品**、**传说消耗品**）

### 3. 配置数组保持在编辑器可见

为了方便配置，`rarityBackgrounds` 和 `itemIcons` 数组在编辑器中保持可见，但用户只需要配置一次。

---

## 🎨 配置示例

### 稀有度背景配置（4个）

```typescript
rarityBackgrounds: [
    { rarity: "common", backgroundFrame: <普通背景图> },
    { rarity: "fine", backgroundFrame: <精良背景图> },
    { rarity: "epic", backgroundFrame: <史诗背景图> },
    { rarity: "legendary", backgroundFrame: <传说背景图> }
]
```

### 道具图标配置（类别_稀有度）

#### 装备图标（16个：4类别 × 4稀有度）

```typescript
itemIcons: [
    // 武器
    { configId: "weapon_common", iconFrame: <普通武器图> },
    { configId: "weapon_fine", iconFrame: <精良武器图> },
    { configId: "weapon_epic", iconFrame: <史诗武器图> },
    { configId: "weapon_legendary", iconFrame: <传说武器图> },
    
    // 头饰
    { configId: "headpiece_common", iconFrame: <普通头饰图> },
    { configId: "headpiece_fine", iconFrame: <精良头饰图> },
    { configId: "headpiece_epic", iconFrame: <史诗头饰图> },
    { configId: "headpiece_legendary", iconFrame: <传说头饰图> },
    
    // 服饰
    { configId: "clothing_common", iconFrame: <普通服饰图> },
    { configId: "clothing_fine", iconFrame: <精良服饰图> },
    { configId: "clothing_epic", iconFrame: <史诗服饰图> },
    { configId: "clothing_legendary", iconFrame: <传说服饰图> },
    
    // 手饰
    { configId: "accessory_common", iconFrame: <普通手饰图> },
    { configId: "accessory_fine", iconFrame: <精良手饰图> },
    { configId: "accessory_epic", iconFrame: <史诗手饰图> },
    { configId: "accessory_legendary", iconFrame: <传说手饰图> },
]
```

#### 消耗品图标（根据效果类型+稀有度）

```typescript
itemIcons: [
    // HP恢复
    { configId: "hp_restore_common", iconFrame: <小型HP药水> },
    { configId: "hp_restore_fine", iconFrame: <中型HP药水> },
    { configId: "hp_restore_epic", iconFrame: <大型HP药水> },
    { configId: "hp_restore_legendary", iconFrame: <超级HP药水> },
    
    // MP恢复
    { configId: "mp_restore_common", iconFrame: <小型MP药水> },
    { configId: "mp_restore_fine", iconFrame: <中型MP药水> },
    { configId: "mp_restore_epic", iconFrame: <大型MP药水> },
    { configId: "mp_restore_legendary", iconFrame: <超级MP药水> },
    
    // HP+MP恢复
    { configId: "hp_mp_restore_fine", iconFrame: <治疗法力合剂> },
    { configId: "hp_mp_restore_epic", iconFrame: <高级治疗法力合剂> },
    { configId: "hp_mp_restore_legendary", iconFrame: <完美治疗法力合剂> },
    
    // 属性提升（战斗）
    { configId: "stat_boost_common", iconFrame: <普通属性药剂> },
    { configId: "stat_boost_fine", iconFrame: <强效属性药剂> },
    { configId: "stat_boost_epic", iconFrame: <高级属性药剂> },
    { configId: "stat_boost_legendary", iconFrame: <传说属性药剂> },
    
    // 优势骰子
    { configId: "advantage_epic", iconFrame: <优势骰子> },
    { configId: "advantage_legendary", iconFrame: <传说优势骰子> },
    
    // 消除影响
    { configId: "remove_influence_fine", iconFrame: <消除影响卷轴> },
    { configId: "remove_influence_epic", iconFrame: <高级消除影响卷轴> },
    { configId: "remove_influence_legendary", iconFrame: <完美消除影响卷轴> },
]
```

#### 后备图标（可选，共用所有稀有度）

如果不想为每个稀有度都配置图标，可以只配置类别，作为后备：

```typescript
itemIcons: [
    // 后备装备图标
    { configId: "weapon", iconFrame: <通用武器图> },
    { configId: "headpiece", iconFrame: <通用头饰图> },
    { configId: "clothing", iconFrame: <通用服饰图> },
    { configId: "accessory", iconFrame: <通用手饰图> },
    
    // 后备消耗品图标
    { configId: "hp_restore", iconFrame: <通用HP药水> },
    { configId: "mp_restore", iconFrame: <通用MP药水> },
    { configId: "stat_boost", iconFrame: <通用属性药剂> },
]
```

---

## 🔍 图标匹配规则

组件会按以下顺序查找图标：

1. **精确匹配**：先尝试匹配 `类别_稀有度`
   - 例如：`weapon_fine`（精良武器）
   
2. **后备匹配**：如果精确匹配失败，尝试只匹配 `类别`
   - 例如：`weapon`（通用武器）

3. **无匹配**：如果都没找到，控制台会输出警告

### 示例

```typescript
// 道具数据
const item = {
    type: 'equipment',
    slot: 'weapon',
    rarity: 'fine'
}

// 查找顺序
1. 先查找: "weapon_fine"   ✓ 找到了！使用精良武器图
2. 如果没找到，查找: "weapon"   (后备)
3. 都没找到，输出警告
```

---

## 📝 名称生成规则

### 1. 盲盒状态（isRevealed = false）

显示格式：`🎁 {稀有度}{类型}盲盒`

```typescript
{ rarity: 'epic', type: 'equipment', isRevealed: false }
→ 显示：🎁 史诗装备盲盒
```

### 2. 已揭示状态（isRevealed = true）

按以下优先级显示名称：

1. **revealedName**（AI生成的名称，最优先）
   ```typescript
   { revealedName: '破魔之剑' }
   → 显示：破魔之剑
   ```

2. **name**（后端返回的默认名称）
   ```typescript
   { name: '精良武器' }
   → 显示：精良武器
   ```

3. **自动生成**（都没有时，根据类别+稀有度生成）
   ```typescript
   { type: 'equipment', slot: 'weapon', rarity: 'fine' }
   → 显示：精良武器
   
   { type: 'consumable', rarity: 'epic' }
   → 显示：史诗消耗品
   ```

---

## 🎯 最少配置方案

如果资源有限，可以只配置**后备图标**：

```typescript
// 最少配置（8个图标 + 4个背景）
itemIcons: [
    { configId: "weapon", iconFrame: <武器图> },
    { configId: "headpiece", iconFrame: <头饰图> },
    { configId: "clothing", iconFrame: <服饰图> },
    { configId: "accessory", iconFrame: <手饰图> },
    { configId: "hp_restore", iconFrame: <HP药水> },
    { configId: "mp_restore", iconFrame: <MP药水> },
    { configId: "stat_boost", iconFrame: <属性药剂> },
    { configId: "advantage", iconFrame: <骰子> },
]

rarityBackgrounds: [
    // 不配置背景图，使用默认颜色即可
]
```

这样所有稀有度的同类道具会使用相同的图标，通过**背景颜色**区分稀有度。

---

## 📊 完整配置清单

### 装备（4类 × 4稀有度 = 16个）

| configId | 说明 |
|----------|------|
| weapon_common | 普通武器 |
| weapon_fine | 精良武器 |
| weapon_epic | 史诗武器 |
| weapon_legendary | 传说武器 |
| headpiece_common | 普通头饰 |
| headpiece_fine | 精良头饰 |
| headpiece_epic | 史诗头饰 |
| headpiece_legendary | 传说头饰 |
| clothing_common | 普通服饰 |
| clothing_fine | 精良服饰 |
| clothing_epic | 史诗服饰 |
| clothing_legendary | 传说服饰 |
| accessory_common | 普通手饰 |
| accessory_fine | 精良手饰 |
| accessory_epic | 史诗手饰 |
| accessory_legendary | 传说手饰 |

### 消耗品（根据实际需要配置）

| configId | 说明 |
|----------|------|
| hp_restore_{rarity} | HP恢复药水 |
| mp_restore_{rarity} | MP恢复药水 |
| hp_mp_restore_{rarity} | HP+MP恢复合剂 |
| stat_boost_{rarity} | 属性提升药剂 |
| advantage_{rarity} | 优势骰子 |
| remove_influence_{rarity} | 消除影响卷轴 |

---

## 💡 使用建议

1. **完整配置**：如果有足够的美术资源，为每个类别的每个稀有度都配置独特图标
2. **简化配置**：如果资源有限，只配置类别后备图标，通过背景颜色区分稀有度
3. **混合配置**：为重要/常见的道具配置精确图标，其他使用后备图标
