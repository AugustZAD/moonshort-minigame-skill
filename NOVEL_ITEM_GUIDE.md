# NovelItem 预制体配置指南

## 概述

NovelItem 是小说列表中的复杂项组件，包含封面图、视频播放、文本信息等功能。

## 后端修改

已修改 `/apiv2/novels` 接口，添加以下字段：
- `firstChapterTitle`: 第一章标题
- `firstNodeIntroVideo`: 第一个节点的 intro 视频 URL

重启后端服务器使修改生效：
```bash
cd /Users/rydia/Project/mob.ai/git/noval.demo.2
npm run dev
```

## 预制体结构

### NovelItem.prefab

```
NovelItem (Node)
├── NovelItemComponent (Component) ← 添加此组件
├── Cover (Sprite) ← 封面图
├── VideoPlayer (VideoPlayer) ← 视频播放器
├── Title (Label) ← 小说标题
├── Description (Label) ← 小说描述
├── FirstChapterTitle (Label) ← 第一章标题
└── TagsContainer (Node + Layout) ← Tags 容器
```

**注意**：节点名称可以任意，通过属性检查器配置绑定。

### Tag.prefab（简单项）

```
Tag (Node)
└── Label (Label) ← 标签文本
```

或者更复杂的结构：

```
Tag (Node)
├── Background (Sprite)
└── Text (Label) ← 组件会自动查找第一个 Label
```

## 配置步骤

### 1. 创建预制体

1. 在场景中创建一个空节点，命名为 `NovelItem`
2. 添加 `NovelItemComponent` 组件
3. 创建子节点并添加对应组件

### 2. 配置 NovelItemComponent

在属性检查器中配置（通过拖拽绑定，不依赖节点名称）：

| 属性 | 类型 | 说明 | 必填 |
|------|------|------|------|
| **Cover Sprite** | Sprite | 封面图 Sprite 节点 | ✅ |
| **Title Label** | Label | 标题 Label 节点 | ✅ |
| **Description Label** | Label | 描述 Label 节点 | ⭕ |
| **First Chapter Label** | Label | 第一章标题 Label 节点 | ⭕ |
| **Video Player** | VideoPlayer | 视频播放器节点 | ⭕ |
| **Tags Container** | Node | Tags 容器节点 | ⭕ |
| **Tag Prefab** | Prefab | Tag 项预制体 | ⭕ |
| **Max Tags Count** | Number | 显示的 Tags 数量（默认 2） | ⭕ |
| **Default Cover Image** | SpriteFrame | 默认封面图（资源） | ✅ |
| **Default Video Url** | String | 默认视频 URL（本地或远程） | ⭕ |

### 3. 准备默认资源

#### 默认封面图
1. 将默认封面图片放到 `assets/textures/` 目录
2. 在编辑器中拖拽到 `Default Cover Image` 属性

#### 默认视频（可选）
方式 1 - 本地视频：
1. 将视频文件放到 `assets/videos/` 目录
2. 设置 `Default Video Url` 为相对路径，如 `videos/default-intro`

方式 2 - 远程视频：
1. 设置 `Default Video Url` 为完整 URL，如 `https://example.com/default.mp4`

### 4. 配置封面图 Sprite

- **Content Size**: 建议 200x300 或 16:9 比例
- **Sprite Frame**: 留空（运行时动态加载）

### 5. 配置视频播放器

- **Content Size**: 建议 300x169（16:9）
- **Stay On Bottom**: 勾选（在 UI 底层显示）
- **Resource Type**: 自动设置（组件会根据 URL 自动判断）
- **Remote URL**: 留空（组件会动态设置）
- **Clip**: 留空（组件会动态加载）

### 6. 配置 TagsContainer

- **Layout 组件**：添加 Layout 组件（Horizontal）
- **Spacing**：设置间距（建议 10px）
- **Resize Mode**：设置为 CONTAINER

### 7. 创建 Tag 预制体

创建简单的 `Tag.prefab`：

1. 创建一个节点，添加 Background Sprite（可选）
2. 添加子节点，添加 Label 组件
3. 调整样式（字体、颜色、背景）
4. 保存为预制体

**重要**：组件会自动递归查找第一个 Label 组件，无需特定名称。

### 8. 绑定到 NovelItemComponent

在 `NovelItem` 的 `NovelItemComponent` 中：
1. 将 `TagsContainer` 节点拖入 **Tags Container** 属性
2. 将 `Tag.prefab` 拖入 **Tag Prefab** 属性
3. 设置 **Max Tags Count** = 2

### 9. 保存预制体

将配置好的 `NovelItem` 节点拖拽到 `assets/prefab/` 目录，生成预制体。

## 使用方法

### 在列表场景中使用

1. 创建 `NovelsList` 节点
2. 添加 `NovelsListComponent` 组件
3. 配置：
   - **Container Node**: 列表容器
   - **Item Prefab**: 拖入 `NovelItem.prefab`
   - **Page Size**: 10
   - **Auto Load**: ✅

### 监听点击事件

```typescript
// 在你的场景脚本中
this.novelsListNode.on('novel-selected', (novel: Novel) => {
    console.log('选中小说:', novel);
    // 跳转到游戏场景
});
```

### 手动控制视频播放（可选）

```typescript
const itemComponent = novelItemNode.getComponent(NovelItemComponent);

// 播放视频
itemComponent.playVideo();

// 暂停视频
itemComponent.pauseVideo();

// 停止视频
itemComponent.stopVideo();
```

## 数据流

```
后端接口 (/apiv2/novels)
    ↓ 返回：title, description, coverImage, 
           firstChapterTitle, firstNodeIntroVideo, tags
    ↓
NovelsListComponent.loadNovels()
    ↓
创建 NovelItem 实例
    ↓
NovelItemComponent.setData(novel)
    ↓
自动渲染：
  1. 标题、描述、第一章标题
  2. Tags（前 2 个）
  3. 封面图（远程 URL 或默认图）
  4. 视频（远程 URL 或默认视频）
```

## 封面图加载逻辑

1. 检查 `novel.coverImage` 是否存在
2. 存在 → 使用 `assetManager.loadRemote` 加载远程图片
3. 不存在或加载失败 → 使用 `defaultCoverImage`

## Tags 渲染逻辑

1. 检查 `novel.tags` 数组
2. 清空 `tagsContainer`
3. 取前 `maxTagsCount`（默认 2）个 tags
4. 对每个 tag：
   - 实例化 `tagPrefab`
   - 递归查找第一个 Label 组件
   - 设置 Label.string = tag

## 视频加载逻辑

1. 检查 `novel.firstNodeIntroVideo` 是否存在
2. 不存在 → 使用 `defaultVideoUrl`
3. 判断 URL 类型：
   - 以 `http://` 或 `https://` 开头 → 远程视频
   - 否则 → 本地资源路径
4. 设置对应的 `resourceType` 和加载方式

## 故障排查

### 封面图不显示
- 检查 `defaultCoverImage` 是否配置
- 查看控制台是否有加载错误
- 确认 `coverSprite` 属性已绑定

### 视频不播放
- 检查 `videoPlayer` 属性是否绑定
- 确认视频 URL 格式正确
- 查看控制台视频加载错误
- 对于远程视频，确认 URL 可访问

### 文本不显示
- 确认对应的 Label 属性已绑定（通过拖拽）
- 检查后端返回的数据格式

### Tags 不显示
- 确认 `tagsContainer` 和 `tagPrefab` 已绑定
- 检查 `tagPrefab` 中是否包含 Label 组件
- 查看控制台是否有错误日志
- 确认后端返回的 `tags` 是数组格式

## 性能优化建议

1. **图片缓存**: 考虑使用图片缓存机制避免重复加载
2. **视频预加载**: 对于列表中的视频，可以考虑懒加载策略
3. **列表复用**: 使用虚拟列表技术减少预制体实例数量

## 完整示例场景结构

```
Home Scene
└── Canvas
    ├── UserInfo (UserInfoComponent)
    └── NovelsList (Node)
        ├── NovelsListComponent
        ├── Container (Node + Layout)
        ├── Loading (Node + Label)
        ├── Empty (Node + Label)
        └── Error (Node + Label)
```

## 后续扩展

如果需要更多功能，可以扩展 `NovelItemComponent`：
- 收藏按钮
- 分享功能
- 标签筛选
- 评分显示
- 下载进度

<citations>
  <document>
      <document_type>RULE</document_type>
      <document_id>BexDERyqjuuQBZIdyiHMUR</document_id>
  </document>
</citations>
