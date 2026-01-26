# GameManager 设置指南

## 🎯 重要说明

**GameManager 是全局单例管理器**，采用懒加载模式，**不需要在场景中挂载**，首次访问时自动初始化。

## ⚡ 核心特性

- ✅ **自动初始化** - 首次访问 `getInstance()` 时自动创建
- ✅ **无需挂载** - 不需要在任何场景中创建节点
- ✅ **全局单例** - 整个游戏只有一个实例
- ✅ **数据持久** - 登录状态、Token 等数据在整个游戏期间保持

## 📋 使用方式

### 一行代码即可使用！

**不需要在任何场景中创建节点**，直接在代码中调用：

```typescript
import { GameManager } from '../scripts/core/GameManager';

// 在任何组件中直接调用
const gameManager = GameManager.getInstance();
// 首次调用时自动初始化，之后调用返回同一实例
```

**就这么简单！**

### 不需要的操作

❌ **不需要**在场景中创建 GameManager 节点  
❌ **不需要**挂载 GameManager 组件  
❌ **不需要**担心场景切换时数据丢失  
❌ **不需要**设置持久化节点  

## 🔍 工作原理

### 懒加载单例模式

```typescript
// GameManager.ts 中的实现
export class GameManager {
    private static _instance: GameManager | null = null;
    
    // 私有构造函数，防止外部直接 new
    private constructor() {
        // 初始化 APIService、AuthManager 等
    }
    
    // 首次调用时创建实例
    static getInstance(): GameManager {
        if (!GameManager._instance) {
            GameManager._instance = new GameManager();
        }
        return GameManager._instance;
    }
}
```

### 生命周期

```
启动游戏
  ↓
加载任何场景 (login, home, game...)
  ↓
组件首次调用 GameManager.getInstance()
  ↓
GameManager 自动初始化 ✅
  ↓
切换到其他场景
  ↓
GameManager 实例保持存在 ✅
数据保持存在 ✅
  ↓
再次调用 GameManager.getInstance()
  ↓
返回同一个实例 ✅
```

## ✅ 最佳实践

### 1. 在任何地方直接使用

**不需要在场景中创建任何节点！**

```
项目场景结构：
- login.scene
  └── 无需 GameManager 节点 ✅
  
- home.scene
  └── 无需 GameManager 节点 ✅
  
- game.scene
  └── 无需 GameManager 节点 ✅

所有组件直接调用 GameManager.getInstance() 即可
```

### 2. 在任何组件中使用

```typescript
import { GameManager } from '../scripts/core/GameManager';

// 在任何组件中直接使用
onLoad() {
    // 无需检查 null，总是会返回实例
    const gameManager = GameManager.getInstance();
    
    // 直接使用
    const isLoggedIn = gameManager.isLoggedIn();
    const userInfo = gameManager.getAuth().getUserInfo();
}
```

### 3. 检查是否已登录

在需要认证的场景中，检查登录状态：

```typescript
import { _decorator, Component, director } from 'cc';
import { GameManager } from '../scripts/core/GameManager';

const { ccclass } = _decorator;

@ccclass('HomeScene')
export class HomeScene extends Component {
    start() {
        const gameManager = GameManager.getInstance();
        
        // 检查是否已登录
        if (!gameManager || !gameManager.isLoggedIn()) {
            console.log('未登录，跳转到登录场景');
            director.loadScene('login');
            return;
        }
        
        // 已登录，继续游戏逻辑
        console.log('已登录，用户:', gameManager.getAuth().getUserInfo());
    }
}
```

## 🐛 常见问题

### 1. 登录状态丢失？

**现象**：切换场景后需要重新登录

**原因**：清除了浏览器的 localStorage

**解决**：
- GameManager 使用 localStorage 存储 token
- 清除缓存后需要重新登录
- 这是正常行为，不是 bug

### 2. 在编辑器中测试某个场景

**现象**：单独打开某个场景测试时，提示未登录

**原因**：没有通过登录流程

**解决**：
- GameManager 会自动初始化
- 但如果没有登录，需要先运行登录场景
- 或者在测试代码中模拟登录状态

### 3. TypeScript 类型错误

**现象**：提示 `GameManager.getInstance()` 可能为 null

**原因**：旧版本代码的类型定义

**解决**：
- 新版本 `getInstance()` 总是返回 GameManager
- 不需要检查 null
- 如果仍有错误，重启 TypeScript 服务

### 4. 如何清理测试数据

**需求**：清除所有登录状态和测试数据

**方法**：
```typescript
// 在浏览器控制台执行
localStorage.clear();
location.reload();
```

或者使用浏览器的“清除网站数据”功能

## 📝 示例代码

### 完整的启动检查

```typescript
import { _decorator, Component, director } from 'cc';
import { GameManager } from '../scripts/core/GameManager';

const { ccclass } = _decorator;

@ccclass('SceneInit')
export class SceneInit extends Component {
    start() {
        // 检查 GameManager
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.error('[SceneInit] GameManager 不存在，跳转到登录场景');
            director.loadScene('login');
            return;
        }
        
        console.log('[SceneInit] GameManager 已就绪');
        
        // 检查登录状态
        if (!gameManager.isLoggedIn()) {
            console.log('[SceneInit] 未登录，跳转到登录场景');
            director.loadScene('login');
            return;
        }
        
        // 已登录，继续执行
        console.log('[SceneInit] 已登录，用户:', gameManager.getAuth().getUserInfo());
    }
}
```

### 在组件中安全使用

```typescript
import { _decorator, Component } from 'cc';
import { GameManager } from '../scripts/core/GameManager';

const { ccclass } = _decorator;

@ccclass('SomeComponent')
export class SomeComponent extends Component {
    private gameManager: GameManager | null = null;
    
    onLoad() {
        this.gameManager = GameManager.getInstance();
        if (!this.gameManager) {
            console.error('[SomeComponent] GameManager 未初始化');
            return;
        }
    }
    
    async someMethod() {
        if (!this.gameManager) {
            console.error('[SomeComponent] GameManager 不可用');
            return;
        }
        
        // 安全使用
        const api = this.gameManager.getAPI();
        const data = await api.get('/apiv2/novels');
    }
}
```

## 🎯 检查清单

在每个新场景中，确保：

- [ ] 不要创建新的 GameManager 节点
- [ ] 在使用前检查 `GameManager.getInstance()` 是否为 null
- [ ] 需要认证的场景要检查登录状态
- [ ] 测试时从登录场景开始运行

## 🚀 总结

### 关键点

1. **只在第一个场景创建** - GameManager 只需要在启动场景创建一次
2. **自动持久化** - 已经实现了自动持久化，不需要额外配置
3. **全局访问** - 任何场景都可以通过 `GameManager.getInstance()` 访问
4. **单例模式** - 整个游戏只有一个 GameManager 实例

### 场景结构

```
游戏场景列表：

1. login.scene (启动场景)
   └── GameManager ✅ 唯一创建位置

2. home.scene
   └── (无需 GameManager)

3. game.scene
   └── (无需 GameManager)

4. mall.scene
   └── (无需 GameManager)

所有场景都通过 GameManager.getInstance() 访问同一个实例
```

完成！现在 GameManager 会在所有场景之间保持存在。
