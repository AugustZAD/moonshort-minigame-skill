# 组件使用指南

本文档介绍如何使用项目中的各种组件来对接后端 v2 API。所有组件都采用**配置绑定**的方式，避免依赖节点顺序。

## 📋 目录

- [组件概览](#组件概览)
- [通用组件配置原则](#通用组件配置原则)
- [组件详细说明](#组件详细说明)
  - [NovelsListComponent - 小说列表](#1-novelslistcomponent---小说列表)
  - [SavesListComponent - 存档列表](#2-saveslistcomponent---存档列表)
  - [MallComponent - 商城](#3-mallcomponent---商城)
  - [UserInfoComponent - 用户信息](#4-userinfocomponent---用户信息)
  - [LoginComponent - 登录](#5-logincomponent---登录)
- [事件系统](#事件系统)
- [完整示例](#完整示例)
- [常见问题](#常见问题)

## 组件概览

| 组件名称 | 功能 | API 接口 |
|---------|------|---------|
| `NovelsListComponent` | 显示小说列表，支持分页 | GET /apiv2/novels |
| `SavesListComponent` | 显示存档列表 | GET /apiv2/saves |
| `MallComponent` | 显示商城商品和购买 | GET /apiv2/mall/items, POST /apiv2/mall/purchase |
| `UserInfoComponent` | 显示用户信息 | 从本地获取 |
| `LoginComponent` | 登录界面 | POST /apiv2/auth/login |

## 通用组件配置原则

### ⭐ 核心原则

1. **配置绑定，不依赖顺序**：所有节点通过 `@property` 装饰器配置，在编辑器中拖拽绑定
2. **预制体模式**：列表项使用 Prefab，便于复用和修改
3. **状态节点**：loading、empty、error 等状态节点统一管理
4. **事件驱动**：组件之间通过事件通信，降低耦合

### 🎯 配置步骤

每个组件的配置都遵循以下步骤：

1. **创建场景结构** - 按组件要求创建节点层次
2. **添加组件** - 为容器节点添加对应的组件脚本
3. **绑定节点** - 在属性检查器中拖拽绑定各个节点
4. **创建预制体** - 为列表项创建 Prefab（如需要）
5. **测试运行** - 运行场景验证功能

## 组件详细说明

### 1. NovelsListComponent - 小说列表

**用途**：显示已发布的小说列表，支持分页加载。

#### 场景结构

```
NovelsList (Node)
├── NovelsListComponent (Component)
├── Container (Node) ← 容器节点，用于放置列表项
├── Loading (Node) ← 加载中提示
├── Empty (Node) ← 空状态提示
└── Error (Node) ← 错误提示
```

#### 预制体结构（Novel Item Prefab）

创建一个 Prefab，命名为 `NovelItem.prefab`，结构如下：

```
NovelItem (Node)
├── Title (Label) ← 小说标题
├── Description (Label) ← 小说描述
├── Cover (Sprite) ← 封面图（可选）
├── Tags (Label) ← 标签
├── ViewCount (Label) ← 浏览量
└── LikeCount (Label) ← 点赞数
```

**注意**：子节点名称必须与上面一致，组件通过 `getChildByName` 查找节点。

#### 属性配置

在属性检查器中配置以下属性：

| 属性名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `Container Node` | Node | 列表项容器 | ✅ |
| `Item Prefab` | Prefab | 小说项预制体 | ✅ |
| `Loading Node` | Node | 加载中提示 | ⭕ |
| `Empty Node` | Node | 空状态提示 | ⭕ |
| `Error Node` | Node | 错误提示 | ⭕ |
| `Page Size` | Number | 每页数量（默认 10） | ⭕ |
| `Auto Load` | Boolean | 是否自动加载（默认 true） | ⭕ |

#### 使用方法

```typescript
// 获取组件
const novelsList = this.node.getComponent(NovelsListComponent);

// 手动加载（如果 autoLoad 为 false）
novelsList.loadNovels();

// 加载指定页
novelsList.loadNovels(2);

// 翻页
novelsList.loadNextPage();
novelsList.loadPrevPage();

// 刷新列表
novelsList.refresh();

// 监听选择事件
this.node.on('novel-selected', (novel: Novel) => {
    console.log('选择了小说:', novel);
});
```

---

### 2. SavesListComponent - 存档列表

**用途**：显示用户的存档列表，支持删除操作。

#### 场景结构

```
SavesList (Node)
├── SavesListComponent (Component)
├── Container (Node) ← 容器节点
├── Loading (Node) ← 加载中提示
├── Empty (Node) ← 空状态提示
└── Error (Node) ← 错误提示
```

#### 预制体结构（Save Item Prefab）

```
SaveItem (Node)
├── NovelTitle (Label) ← 小说标题
├── SaveName (Label) ← 存档名称
├── Level (Label) ← 等级
├── Progress (Label) ← 进度（节点）
├── UpdateTime (Label) ← 更新时间
└── DeleteButton (Button) ← 删除按钮（可选）
```

#### 属性配置

| 属性名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `Container Node` | Node | 列表项容器 | ✅ |
| `Item Prefab` | Prefab | 存档项预制体 | ✅ |
| `Loading Node` | Node | 加载中提示 | ⭕ |
| `Empty Node` | Node | 空状态提示 | ⭕ |
| `Error Node` | Node | 错误提示 | ⭕ |
| `Filter Novel Id` | String | 过滤的小说 ID（可选） | ⭕ |
| `Auto Load` | Boolean | 是否自动加载 | ⭕ |

#### 使用方法

```typescript
// 获取组件
const savesList = this.node.getComponent(SavesListComponent);

// 手动加载
savesList.loadSaves();

// 按小说过滤
savesList.setFilterNovelId('novel_id_123');

// 刷新列表
savesList.refresh();

// 监听选择事件
this.node.on('save-selected', (save: SaveGame) => {
    console.log('选择了存档:', save);
    // 跳转到游戏场景
});
```

---

### 3. MallComponent - 商城

**用途**：显示商城商品，处理购买操作。

#### 场景结构

```
Mall (Node)
├── MallComponent (Component)
├── GemsLabel (Label) ← 显示用户宝石数量
├── Container (Node) ← 商品容器
├── Loading (Node) ← 加载中提示
└── Error (Node) ← 错误提示
```

#### 预制体结构（Mall Item Prefab）

```
MallItem (Node)
├── Name (Label) ← 商品名称
├── Description (Label) ← 商品描述
├── Price (Label) ← 价格
├── Rarity (Label) ← 稀有度（可选）
├── Type (Label) ← 类型（可选）
├── Effect (Label) ← 效果
└── BuyButton (Button) ← 购买按钮
```

#### 属性配置

| 属性名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `Container Node` | Node | 商品容器 | ✅ |
| `Item Prefab` | Prefab | 商品项预制体 | ✅ |
| `Gems Label` | Label | 宝石数量显示 | ⭕ |
| `Loading Node` | Node | 加载中提示 | ⭕ |
| `Error Node` | Node | 错误提示 | ⭕ |
| `Auto Load` | Boolean | 是否自动加载 | ⭕ |

#### 使用方法

```typescript
// 获取组件
const mall = this.node.getComponent(MallComponent);

// 手动加载
mall.loadMall();

// 刷新商城
mall.refresh();

// 获取当前宝石数量
const gems = mall.getUserGems();

// 监听购买事件
this.node.on('item-purchased', (item: MallItem) => {
    console.log('购买了商品:', item);
    // 显示购买成功提示
});
```

---

### 4. UserInfoComponent - 用户信息

**用途**：显示用户的基本信息（用户名、宝石等）。

#### 场景结构

```
UserInfo (Node)
├── UserInfoComponent (Component)
├── UsernameLabel (Label) ← 用户名
├── GemsLabel (Label) ← 宝石数量
└── UserIdLabel (Label) ← 用户 ID（可选）
```

#### 属性配置

| 属性名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `Username Label` | Label | 用户名 Label | ⭕ |
| `Gems Label` | Label | 宝石数量 Label | ⭕ |
| `User Id Label` | Label | 用户 ID Label | ⭕ |
| `Auto Load` | Boolean | 是否自动加载 | ⭕ |
| `Gems Prefix` | String | 宝石前缀文本（默认 "宝石: "） | ⭕ |

#### 使用方法

```typescript
// 获取组件
const userInfo = this.node.getComponent(UserInfoComponent);

// 手动加载
userInfo.loadUserInfo();

// 刷新用户信息
userInfo.refresh();

// 更新宝石数量
userInfo.updateGems(1000);

// 获取用户信息
const info = userInfo.getUserInfo();
console.log(info.username, info.gems);
```

---

### 5. LoginComponent - 登录

详见 `LOGIN_SETUP.md` 文档。

## 事件系统

组件通过自定义事件进行通信，降低耦合度。

### 可监听的事件

#### NovelsListComponent

```typescript
// 监听小说选择事件
node.on('novel-selected', (novel: Novel) => {
    // 处理小说选择
});
```

#### SavesListComponent

```typescript
// 监听存档选择事件
node.on('save-selected', (save: SaveGame) => {
    // 处理存档选择
});
```

#### MallComponent

```typescript
// 监听商品购买事件
node.on('item-purchased', (item: MallItem) => {
    // 处理购买成功
});
```

### 发送事件示例

```typescript
// 在其他组件中触发事件
this.node.emit('custom-event', { data: 'value' });
```

## 完整示例

### 示例 1：创建小说列表页面

1. **创建场景结构**

```
NovelsScene
└── Canvas
    ├── GameManager (添加 GameManager 组件)
    └── NovelsList (Node)
        ├── Title (Label) - "小说列表"
        ├── Container (Node + Layout 组件)
        ├── Loading (Node + Label) - "加载中..."
        ├── Empty (Node + Label) - "暂无小说"
        ├── Error (Node + Label) - "加载失败"
        └── PrevButton / NextButton (Button)
```

2. **创建 NovelItem 预制体**

在 `assets/profab/` 目录下创建 `NovelItem.prefab`：

```
NovelItem
├── Background (Sprite)
├── Title (Label)
├── Description (Label)
├── Tags (Label)
└── Stats (Node)
    ├── ViewCount (Label)
    └── LikeCount (Label)
```

3. **配置组件**

- 为 `NovelsList` 节点添加 `NovelsListComponent`
- 拖拽绑定：
  - Container Node → Container 节点
  - Item Prefab → NovelItem.prefab
  - Loading Node → Loading 节点
  - Empty Node → Empty 节点
  - Error Node → Error 节点
- 设置 Page Size = 10
- 勾选 Auto Load

4. **添加翻页逻辑**

创建一个新的脚本 `NovelsPageController.ts`：

```typescript
import { _decorator, Component, Button } from 'cc';
import { NovelsListComponent } from './NovelsListComponent';

const { ccclass, property } = _decorator;

@ccclass('NovelsPageController')
export class NovelsPageController extends Component {
    @property({ type: Button })
    prevButton: Button | null = null;

    @property({ type: Button })
    nextButton: Button | null = null;

    @property({ type: NovelsListComponent })
    novelsList: NovelsListComponent | null = null;

    onLoad() {
        if (this.prevButton) {
            this.prevButton.node.on(Button.EventType.CLICK, () => {
                this.novelsList?.loadPrevPage();
            }, this);
        }

        if (this.nextButton) {
            this.nextButton.node.on(Button.EventType.CLICK, () => {
                this.novelsList?.loadNextPage();
            }, this);
        }
    }
}
```

### 示例 2：商城页面与用户信息联动

创建一个包含商城和用户信息的场景：

```typescript
import { _decorator, Component } from 'cc';
import { MallComponent } from './MallComponent';
import { UserInfoComponent } from './UserInfoComponent';
import { MallItem } from '../scripts/types/api.types';

const { ccclass, property } = _decorator;

@ccclass('MallPageController')
export class MallPageController extends Component {
    @property({ type: MallComponent })
    mall: MallComponent | null = null;

    @property({ type: UserInfoComponent })
    userInfo: UserInfoComponent | null = null;

    onLoad() {
        // 监听购买事件，更新用户信息
        this.mall?.node.on('item-purchased', (item: MallItem) => {
            console.log('购买成功:', item.name);
            
            // 更新用户宝石显示
            const newGems = this.mall.getUserGems();
            this.userInfo?.updateGems(newGems);
        }, this);
    }
}
```

## 常见问题

### 1. 组件加载失败，提示"GameManager 未初始化"

**原因**：场景中没有 GameManager 节点  
**解决**：在场景根节点或 Canvas 下创建一个空节点，添加 GameManager 组件

### 2. 列表项显示不正确

**原因**：预制体中的子节点名称与组件期望的不一致  
**解决**：检查预制体中的节点名称是否与文档中的一致（区分大小写）

### 3. 列表项布局混乱

**原因**：Container 节点没有添加 Layout 组件  
**解决**：为 Container 节点添加 Layout 组件（Vertical 或 Grid），并配置间距

### 4. 点击事件不响应

**原因**：节点没有添加 Button 组件或事件监听未正确绑定  
**解决**：
- 确保按钮节点有 Button 组件
- 检查是否正确获取了组件引用
- 查看控制台是否有错误日志

### 5. 数据显示为空或 undefined

**原因**：API 请求失败或数据格式不匹配  
**解决**：
- 打开浏览器控制台查看网络请求
- 检查后端服务是否正常运行
- 确认 API 返回的数据格式与类型定义一致

### 6. Token 过期或未认证

**原因**：用户未登录或 token 已过期  
**解决**：
- 检查是否已登录
- 查看 AuthManager 的 token 状态
- 确认 APIService 正确设置了 tokenProvider

### 7. 预制体创建的节点不显示

**原因**：预制体尺寸或位置设置不当  
**解决**：
- 检查预制体的 ContentSize
- 确认 Container 使用了 Layout 组件
- 调整预制体的锚点和对齐方式

## 🎉 总结

通过配置绑定的方式：
- ✅ **避免节点顺序依赖** - 节点可以任意调整顺序
- ✅ **可视化配置** - 所有配置都在编辑器中完成
- ✅ **易于维护** - 修改 UI 结构不影响逻辑代码
- ✅ **类型安全** - TypeScript 提供完整的类型检查
- ✅ **事件驱动** - 组件之间松耦合，易于扩展

如有其他问题，请查看代码注释或联系开发团队。
