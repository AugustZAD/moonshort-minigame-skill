# GameManager 快速开始

## 🚀 一句话说明

**GameManager 会自动初始化，不需要在任何场景中创建节点！**

## ✅ 使用方法

在任何组件中直接使用：

```typescript
import { GameManager } from '../scripts/core/GameManager';

// 直接调用，首次访问时自动初始化
const gameManager = GameManager.getInstance();

// 使用 API
const novels = await gameManager.getAPI().get('/apiv2/novels');

// 检查登录状态
if (gameManager.isLoggedIn()) {
    const user = gameManager.getAuth().getUserInfo();
    console.log('当前用户:', user.username);
}
```

## ❌ 不需要做的事

- ❌ 不需要在场景中创建 GameManager 节点
- ❌ 不需要挂载 GameManager 组件
- ❌ 不需要担心场景切换数据丢失
- ❌ 不需要检查 `getInstance()` 返回值是否为 null

## 🎯 核心特性

1. **懒加载** - 首次调用 `getInstance()` 时自动创建
2. **全局单例** - 整个游戏只有一个实例
3. **跨场景持久** - 数据在场景切换时保持
4. **零配置** - 无需任何场景配置

## 📝 完整示例

```typescript
import { _decorator, Component } from 'cc';
import { GameManager } from '../scripts/core/GameManager';

const { ccclass } = _decorator;

@ccclass('MyComponent')
export class MyComponent extends Component {
    async onLoad() {
        // 获取 GameManager（自动初始化）
        const gm = GameManager.getInstance();
        
        // 检查登录
        if (!gm.isLoggedIn()) {
            console.log('请先登录');
            return;
        }
        
        // 获取用户信息
        const user = gm.getAuth().getUserInfo();
        console.log('欢迎', user.username);
        
        // 调用 API
        try {
            const api = gm.getAPI();
            const data = await api.get('/apiv2/novels');
            console.log('小说列表:', data);
        } catch (error) {
            console.error('请求失败:', error);
        }
    }
}
```

## 🔥 升级说明

### 如果你之前在场景中创建了 GameManager 节点

**可以删除了！** 新版本不需要任何场景节点。

### 如果你的代码检查了 null

```typescript
// 旧代码
const gm = GameManager.getInstance();
if (!gm) {
    console.error('GameManager 未初始化');
    return;
}

// 新代码（不需要检查）
const gm = GameManager.getInstance();
// 直接使用，总是返回实例
```

## 📚 详细文档

查看 `GAMEMANAGER_SETUP.md` 获取完整文档。

## 🎉 就这么简单！

现在开始使用 GameManager 吧，它会自动处理一切！
