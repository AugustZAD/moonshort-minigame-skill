# 场景参数传递使用指南

## 概述

本项目提供了场景参数传递功能，允许在场景跳转时传递参数（如小说 ID、章节 ID 等），并在目标场景中获取这些参数。

## 核心组件

### 1. SceneParams（场景参数管理器）

位置: `assets/scripts/core/SceneParams.ts`

用于存储和获取场景参数的单例管理器。

### 2. SceneHistory（场景历史管理器）

位置: `assets/components/SceneHistory.ts`

已扩展支持参数传递，提供 `push()` 和 `replace()` 方法。

## 使用方法

### 方式一：使用 SceneHistory（推荐）

#### 1. 跳转场景并传递参数

```typescript
import { SceneHistory } from './components/SceneHistory';

// 跳转到 overview 场景，传递 novelId
SceneHistory.push('overview', { novelId: '123' });

// 跳转到 game 场景，传递多个参数
SceneHistory.push('game', {
    novelId: '123',
    chapterId: 1,
    saveId: 'save_001'
});

// 带回调的跳转
SceneHistory.push('overview', { novelId: '123' }, () => {
    console.log('场景加载完成');
});
```

#### 2. 在目标场景获取参数

在目标场景的组件中（通常在 `onLoad()` 方法中）：

```typescript
import { SceneParams } from '../scripts/core/SceneParams';

onLoad() {
    // 获取参数（自动清空，防止下次误用）
    const params = SceneParams.get<{ novelId: string }>();
    
    if (!params.novelId) {
        console.error('缺少 novelId 参数');
        return;
    }
    
    console.log('接收到 novelId:', params.novelId);
    
    // 使用参数加载数据
    this.loadNovelDetail(params.novelId);
}
```

### 方式二：直接使用 SceneParams

如果你不想使用 SceneHistory，也可以直接使用 SceneParams：

```typescript
import { director } from 'cc';
import { SceneParams } from '../scripts/core/SceneParams';

// 设置参数
SceneParams.set({ novelId: '123', chapterId: 1 });

// 跳转场景
director.loadScene('overview');
```

## API 文档

### SceneHistory API

#### `push(sceneName, params?, onLaunched?)`

跳转场景并记录历史。

- `sceneName: string` - 目标场景名称
- `params?: Record<string, any>` - 场景参数（可选）
- `onLaunched?: () => void` - 加载完成回调（可选）

```typescript
// 仅跳转
SceneHistory.push('overview');

// 带参数跳转
SceneHistory.push('overview', { novelId: '123' });

// 带回调跳转
SceneHistory.push('overview', () => {
    console.log('完成');
});

// 带参数和回调
SceneHistory.push('overview', { novelId: '123' }, () => {
    console.log('完成');
});
```

#### `replace(sceneName, params?, onLaunched?)`

替换当前场景（不记录历史）。参数用法同 `push()`。

#### `back()`

返回上一个场景。

### SceneParams API

#### `set(params)`

设置场景参数。

```typescript
SceneParams.set({ novelId: '123', chapterId: 1 });
```

#### `get<T>(consume?)`

获取场景参数。

- `consume: boolean` - 是否消费参数（默认 true，获取后自动清空）

```typescript
// 获取并清空
const params = SceneParams.get<{ novelId: string }>();

// 获取但不清空（可多次获取）
const params = SceneParams.get<{ novelId: string }>(false);
```

#### `getValue<T>(key, defaultValue?)`

获取单个参数值。

```typescript
const novelId = SceneParams.getValue<string>('novelId');
const chapterId = SceneParams.getValue<number>('chapterId', 1);
```

#### `has(key?)`

检查是否有参数。

```typescript
// 检查是否有任何参数
if (SceneParams.has()) {
    // ...
}

// 检查是否有特定参数
if (SceneParams.has('novelId')) {
    // ...
}
```

#### `clear()`

清空所有参数。

```typescript
SceneParams.clear();
```

## 完整示例

### 示例 1: 小说列表 → 详情页

**NovelsListComponent.ts（小说列表）**

```typescript
import { SceneHistory } from './SceneHistory';

private onNovelClick(novel: Novel) {
    // 记录浏览
    this.novelsAPI.view(novel.id);
    
    // 跳转到详情页，传递 novelId
    SceneHistory.push('overview', { novelId: novel.id });
}
```

**NovelOverviewComponent.ts（详情页）**

```typescript
import { SceneParams } from '../scripts/core/SceneParams';

onLoad() {
    // 获取参数
    const params = SceneParams.get<{ novelId: string }>();
    
    if (!params.novelId) {
        console.error('缺少 novelId 参数');
        return;
    }
    
    // 加载小说详情
    this.loadNovelDetail(params.novelId);
}

private async loadNovelDetail(novelId: string) {
    const novel = await this.novelsAPI.getDetail(novelId);
    this.renderNovelDetail(novel);
}
```

### 示例 2: 详情页 → 游戏场景

**NovelOverviewComponent.ts（详情页）**

```typescript
private onStartGame() {
    // 跳转到游戏场景，传递小说和章节信息
    SceneHistory.push('game', {
        novelId: this.novelId,
        chapterId: 1,
        startNewGame: true
    });
}
```

**GameComponent.ts（游戏场景）**

```typescript
onLoad() {
    const params = SceneParams.get<{
        novelId: string;
        chapterId: number;
        startNewGame?: boolean;
    }>();
    
    if (!params.novelId || !params.chapterId) {
        console.error('缺少必要参数');
        return;
    }
    
    // 初始化游戏
    this.initGame(params.novelId, params.chapterId, params.startNewGame);
}
```

## 注意事项

1. **参数会在获取后自动清空**（默认行为），避免下次进入场景时误用旧参数
2. **类型安全**：使用泛型指定参数类型，如 `SceneParams.get<{ novelId: string }>()`
3. **参数验证**：获取参数后应该验证必需参数是否存在
4. **兼容性**：SceneHistory 的 `push()` 和 `replace()` 方法保持向后兼容，可以不传参数
5. **生命周期**：参数在内存中持久化，直到被消费或手动清空

## 已集成的功能

✅ 小说列表点击跳转到详情页（已实现）  
✅ SceneHistory 支持参数传递（已实现）  
✅ 示例组件 NovelOverviewComponent（已创建）

## 后续扩展

你可以在以下场景使用参数传递：

- 详情页 → 游戏场景（传递 novelId、chapterId）
- 游戏场景 → 存档页面（传递当前进度）
- 设置页面 → 任意页面（传递配置更改标志）
- 商城页面 → 详情页（传递商品 ID）

根据需要修改相应组件的跳转逻辑即可。
