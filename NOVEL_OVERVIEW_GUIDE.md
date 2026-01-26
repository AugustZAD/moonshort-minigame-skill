# NovelOverviewComponent 使用指南

## 概述

`NovelOverviewComponent` 是小说详情页组件，用于展示小说的完整信息并支持点赞/取消点赞功能。

## 功能特性

- ✅ 显示小说标题、描述
- ✅ 显示点赞数、游玩次数、章节数量
- ✅ 支持点赞/取消点赞（带防抖）
- ✅ 动态渲染标签列表（使用 Prefab）
- ✅ 支持点赞状态图标切换
- ✅ 加载状态管理（加载中/错误/内容）
- ✅ 从场景参数获取 novelId

## 组件属性配置

### UI 元素（必需）

| 属性 | 类型 | 说明 |
|------|------|------|
| `coverImage` | Sprite | 小说封面图 |
| `titleLabel` | Label | 小说标题 |
| `descriptionLabel` | Label | 小说描述 |
| `likeCountLabel` | Label | 点赞数量 |
| `viewCountLabel` | Label | 游玩次数（浏览量） |
| `nodeCountLabel` | Label | 章节数量 |

### 点赞功能（必需）

| 属性 | 类型 | 说明 |
|------|------|------|
| `likeButton` | Button | 点赞按钮 |
| `likedNode` | Node | 已点赞状态节点（点赞后显示） |
| `unlikedNode` | Node | 未点赞状态节点（默认显示） |

### 标签功能（可选）

| 属性 | 类型 | 说明 |
|------|------|------|
| `tagsContainer` | Node | 标签容器节点（建议使用 Layout 布局） |
| `tagPrefab` | Prefab | 标签项预制体（需包含 TagItemComponent） |

### 状态管理（可选）

| 属性 | 类型 | 说明 |
|------|------|------|
| `loadingNode` | Node | 加载中提示节点 |
| `errorNode` | Node | 错误提示节点 |
| `contentNode` | Node | 内容节点（加载成功后显示） |

## 使用步骤

### 1. 创建标签预制体（Tag.prefab）

1. 创建一个节点命名为 `Tag`
2. 添加 UI 组件（如背景精灵图）
3. 添加 Label 子节点用于显示标签文本
4. 添加 `TagItemComponent` 组件到根节点
5. 配置 `tagLabel` 属性指向 Label 节点
6. 保存为预制体

**标签预制体结构示例：**
```
Tag (Sprite, TagItemComponent)
└── Label (Label)
```

### 2. 创建 Overview 场景

1. 创建场景节点结构：

```
OverviewScene
├── LoadingNode (加载中提示)
├── ErrorNode (错误提示)
└── ContentNode (内容区域)
    ├── CoverImage (Sprite) - 封面图
    ├── TitleLabel (Label) - 小说标题
    ├── DescriptionLabel (Label) - 小说描述
    ├── StatsContainer
    │   ├── LikeCount (Label)
    │   ├── ViewCount (Label)
    │   └── NodeCount (Label)
    ├── LikeButton (Button)
    │   ├── LikedNode (已点赞状态)
    │   └── UnlikedNode (未点赞状态)
    └── TagsContainer (Layout) - 标签容器
```

2. 添加 `NovelOverviewComponent` 到根节点
3. 配置所有属性

### 3. 配置组件属性

在 Cocos Creator 编辑器中：

1. 选中根节点
2. 找到 `NovelOverviewComponent` 组件
3. 拖拽对应节点到属性面板：
   - **UI 元素**：拖拽各个 Label 节点和 CoverImage Sprite 节点
   - **点赞按钮**：拖拽 Button 节点、LikedNode 和 UnlikedNode
   - **标签**：拖拽 TagsContainer 节点和 Tag.prefab
   - **状态节点**：拖拽 LoadingNode、ErrorNode、ContentNode

### 4. 场景跳转传参

从小说列表跳转到详情页：

```typescript
import { SceneHistory } from './SceneHistory';

// 在小说列表中点击某个小说
SceneHistory.push('overview', { novelId: novel.id });
```

## API 接口说明

### 后端接口

组件会调用以下后端接口：

1. **获取小说详情**
   - `GET /apiv2/novels/:novelId`
   - 返回字段：id, title, description, **coverImage**, language, viewCount, likeCount, tags, nodeCount, isLiked

2. **点赞小说**
   - `POST /apiv2/novels/:novelId/like`
   - 需要登录认证

3. **取消点赞**
   - `DELETE /apiv2/novels/:novelId/like`
   - 需要登录认证

### 组件方法

#### `getNovelId(): string`

获取当前小说 ID。

```typescript
const novelId = overviewComponent.getNovelId();
```

#### `getCurrentNovel(): Novel | null`

获取当前小说数据。

```typescript
const novel = overviewComponent.getCurrentNovel();
if (novel) {
    console.log(novel.title, novel.likeCount);
}
```

## 点赞功能说明

### 防抖机制

组件内置防抖机制，防止用户快速重复点击：

- 使用 `isLiking` 标志控制
- 请求进行中时忽略新的点击
- 请求失败时自动恢复状态

### 状态管理

点赞状态通过以下方式管理：

1. **本地状态**：`currentNovel.isLiked`
2. **UI 更新**：
   - 显示/隐藏 likedNode 和 unlikedNode
   - 更新点赞数量 Label
3. **错误恢复**：请求失败时自动恢复到原始状态

### 节点切换

通过显示/隐藏两个不同的节点实现状态切换：

- `likedNode`：已点赞状态节点（例如红色实心图标）
  - `isLiked = true` 时：`likedNode.active = true`
- `unlikedNode`：未点赞状态节点（例如灰色空心图标）
  - `isLiked = false` 时：`unlikedNode.active = true`

## 标签渲染说明

### 自动渲染

组件会自动根据 `novel.tags` 数组渲染标签：

1. 清空标签容器
2. 遍历 tags 数组
3. 实例化 tagPrefab
4. 设置标签文本
5. 添加到容器

### 布局建议

标签容器建议使用 Layout 组件：

- **Layout Type**: Horizontal（水平排列）
- **Resize Mode**: Container（自适应内容）
- **Spacing**: 10（标签间距）
- **Padding**: 适当设置内边距

### 降级处理

如果 tagPrefab 没有 `TagItemComponent`，组件会自动降级：

1. 尝试在根节点查找 Label
2. 尝试在子节点查找 Label
3. 直接设置 Label.string

## 状态管理

组件提供三种状态：

### 1. 加载中（Loading）

- 显示：`loadingNode.active = true`
- 隐藏：`errorNode`, `contentNode`
- 用于：初始加载小说详情时

### 2. 错误（Error）

- 显示：`errorNode.active = true`
- 隐藏：`loadingNode`, `contentNode`
- 用于：加载失败、缺少参数等情况

### 3. 内容（Content）

- 显示：`contentNode.active = true`
- 隐藏：`loadingNode`, `errorNode`
- 用于：成功加载并显示小说详情

## 完整示例

### 场景结构

```
OverviewScene
├── NovelOverviewComponent (挂载到根节点)
├── Loading (加载中)
│   └── Label "加载中..."
├── Error (错误提示)
│   └── Label "加载失败，请重试"
└── Content (内容区域)
    ├── Header
    │   ├── CoverImage (Sprite) - 封面图
    │   └── Title (Label)
    ├── Body
    │   ├── Description (Label)
    │   └── Tags (Layout)
    ├── Stats
    │   ├── LikeCount (Label)
    │   ├── ViewCount (Label)
    │   └── NodeCount (Label)
    └── Actions
        └── LikeButton (Button)
            ├── LikedNode (已点赞状态，默认隐藏)
            └── UnlikedNode (未点赞状态，默认显示)
```

### 从列表跳转

```typescript
// NovelsListComponent.ts
import { SceneHistory } from './SceneHistory';

private onNovelClick(novel: Novel) {
    // 记录浏览
    this.novelsAPI.view(novel.id);
    
    // 跳转到详情页
    SceneHistory.push('overview', { novelId: novel.id });
}
```

## 注意事项

1. **必需属性**：至少配置基本的 Label 和 Button 属性才能正常工作
2. **封面图**：封面图会从远程 URL 加载，需要网络连接
3. **点赞节点**：必须配置 likedNode 和 unlikedNode，两个节点会根据状态自动切换显示/隐藏
4. **标签可选**：如果不需要标签功能，可以不配置 tagsContainer 和 tagPrefab
5. **状态节点可选**：如果不需要状态管理，可以不配置状态节点
6. **登录状态**：点赞功能需要用户登录，未登录用户无法点赞
7. **场景参数**：必须通过 SceneHistory.push() 传递 novelId 参数

## 相关组件

- `TagItemComponent` - 标签项组件
- `NovelsListComponent` - 小说列表组件（跳转来源）
- `SceneHistory` - 场景历史管理器（带参数传递）
- `SceneParams` - 场景参数管理器
