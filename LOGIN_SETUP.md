# 登录系统集成指南

登录系统的核心代码已经实现完成！现在需要在 Cocos Creator 编辑器中完成 UI 配置。

## 📦 已完成的部分

✅ **核心架构层**
- `APIService` - HTTP 请求封装，自动注入 Token
- `AuthManager` - 认证管理和 Token 自动刷新
- `GameManager` - 全局单例管理器
- `AuthAPI` - 认证 API 封装

✅ **配置和类型**
- `APIConfig` - API 配置
- `api.types.ts` - TypeScript 类型定义

✅ **UI 组件**
- `LoginComponent` - 登录界面逻辑

## 🚀 接下来需要做的

### 步骤 1: 初始化 GameManager

1. 打开 Cocos Creator 编辑器
2. 打开 `index.scene`（或你的启动场景）
3. 在场景的根节点或 Canvas 下创建一个空节点，命名为 `GameManager`
4. 为这个节点添加 `GameManager` 组件（在组件列表中搜索 GameManager）
5. **重要**: 确保这个节点在场景加载时就存在，这样认证系统才能正常工作

### 步骤 2: 创建登录场景

#### 2.1 创建新场景
1. 在 `assets/scenes/` 目录下右键 -> 新建 -> Scene
2. 命名为 `login.scene`
3. 打开新创建的场景

#### 2.2 创建 GameManager 节点
在登录场景中也需要创建 GameManager 节点：
1. 创建空节点，命名为 `GameManager`
2. 添加 `GameManager` 组件

#### 2.3 创建登录 UI
在 Canvas 节点下创建以下 UI 结构：

```
Canvas
└── LoginPanel (Node)
    ├── Background (Sprite) - 背景
    ├── Title (Label) - 标题 "登录"
    ├── UsernameInput (EditBox) - 用户名输入框
    │   └── Placeholder (Label) - "请输入用户名"
    ├── PasswordInput (EditBox) - 密码输入框
    │   └── Placeholder (Label) - "请输入密码"
    ├── LoginButton (Button) - 登录按钮
    │   └── Label (Label) - "登录"
    ├── ErrorLabel (Label) - 错误提示（初始隐藏）
    └── LoadingNode (Node) - 加载中提示（初始隐藏）
        └── Label (Label) - "登录中..."
```

**注意事项**：
- 密码输入框的 EditBox 组件需要设置 `Input Flag` 为 `PASSWORD`
- ErrorLabel 初始状态设置为不可见（取消勾选 Active）
- LoadingNode 初始状态设置为不可见

#### 2.4 配置 LoginComponent

1. 为 `LoginPanel` 节点添加 `LoginComponent` 组件
2. 在属性检查器中绑定节点：
   - `Username Input`: 拖入 UsernameInput 节点
   - `Password Input`: 拖入 PasswordInput 节点
   - `Login Button`: 拖入 LoginButton 节点的 Button 组件
   - `Error Label`: 拖入 ErrorLabel 节点的 Label 组件
   - `Loading Node`: 拖入 LoadingNode 节点
   - `Next Scene Name`: 填写登录成功后要跳转的场景名（如 "home"）

### 步骤 3: 配置项目启动场景

有两种方式设置启动流程：

#### 方案 A: 直接使用登录场景作为启动场景（推荐）
1. 打开菜单 -> 项目 -> 项目设置
2. 在"启动场景"中选择 `login.scene`
3. 这样游戏启动时会先显示登录界面
4. LoginComponent 会自动检查登录状态，如果已登录会自动跳转

#### 方案 B: 在现有的 index 场景中添加登录检查
如果你想保留当前的 index 场景作为启动场景，需要：
1. 在 index 场景的某个节点上添加启动检查脚本
2. 创建一个简单的启动脚本（参考下面的代码）

```typescript
// StartupCheck.ts
import { _decorator, Component, director } from 'cc';
import { GameManager } from './scripts/core/GameManager';

const { ccclass } = _decorator;

@ccclass('StartupCheck')
export class StartupCheck extends Component {
    start() {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.isLoggedIn()) {
            // 未登录，跳转到登录场景
            director.loadScene('login');
        }
    }
}
```

### 步骤 4: 在其他场景中使用认证

在需要认证的场景中，获取 GameManager 并调用 API：

```typescript
import { GameManager } from '../scripts/core/GameManager';

// 获取 GameManager 实例
const gameManager = GameManager.getInstance();

// 检查是否已登录
if (!gameManager || !gameManager.isLoggedIn()) {
    director.loadScene('login');
    return;
}

// 获取用户信息
const userInfo = gameManager.getAuth().getUserInfo();
console.log('当前用户:', userInfo);

// 发送 API 请求（会自动附带 token）
const api = gameManager.getAPI();
const data = await api.get('/apiv2/some-endpoint');
```

### 步骤 5: 测试登录功能

#### 5.1 启动后端服务
1. 确保后端服务正在运行
2. 后端地址应该是 `http://localhost:8000`（如需修改，编辑 `assets/scripts/config/APIConfig.ts`）

#### 5.2 创建测试账号
在后端项目中创建测试用户，或使用已有的账号。

#### 5.3 测试流程
1. 在 Cocos Creator 中点击运行（浏览器预览）
2. 应该会显示登录界面
3. 输入用户名和密码，点击登录
4. 如果登录成功，会自动跳转到主场景（home）
5. 打开浏览器控制台，查看日志输出

预期的日志输出：
```
[GameManager] 初始化...
[GameManager] 初始化完成
[GameManager] 用户未登录
[LoginComponent] 登录成功
[AuthManager] 登录成功: {id: "...", username: "...", gems: 0}
[GameManager] 用户已登录: {id: "...", username: "...", gems: 0}
```

### 步骤 6: 添加登出功能（可选）

在设置或个人中心页面添加登出按钮：

```typescript
import { GameManager } from '../scripts/core/GameManager';

// 登出按钮点击事件
onLogoutClick() {
    const gameManager = GameManager.getInstance();
    if (gameManager) {
        gameManager.getAuth().logout();
        // 跳转到登录场景
        director.loadScene('login');
    }
}
```

## 🔧 配置说明

### 修改 API 地址
如果后端 API 地址不是 `http://localhost:8000`，修改：
- 文件: `assets/scripts/config/APIConfig.ts`
- 修改 `BASE_URL` 的值

### 修改 Token 刷新时间
默认在 token 过期前 1 天自动刷新，如需修改：
- 文件: `assets/scripts/config/APIConfig.ts`
- 修改 `TOKEN_REFRESH_BEFORE_EXPIRY_MS` 的值（单位：毫秒）

## 🎯 核心功能

### 自动 Token 管理
- ✅ 登录后 token 自动存储到本地
- ✅ 所有 API 请求自动附带 token
- ✅ token 即将过期时自动刷新（剩余时间 < 1天）
- ✅ token 过期后自动清理并跳转登录页

### 错误处理
- ✅ 网络错误提示
- ✅ 401 错误自动处理（尝试刷新 token）
- ✅ 显示后端返回的错误信息
- ✅ 请求超时处理（默认 10 秒）

### 用户体验
- ✅ 已登录状态下自动跳转到主页
- ✅ 登录中禁用输入和按钮
- ✅ 清晰的错误提示
- ✅ 持久化登录状态

## 📝 API 使用示例

### 发送 GET 请求
```typescript
const gameManager = GameManager.getInstance();
const api = gameManager.getAPI();

try {
    const data = await api.get('/apiv2/novels', { page: 1, limit: 20 });
    console.log(data);
} catch (error) {
    console.error('请求失败:', error);
}
```

### 发送 POST 请求
```typescript
const gameManager = GameManager.getInstance();
const api = gameManager.getAPI();

try {
    const result = await api.post('/apiv2/novels', {
        title: '我的小说',
        content: '...'
    });
    console.log(result);
} catch (error) {
    console.error('请求失败:', error);
}
```

### 获取用户信息
```typescript
const gameManager = GameManager.getInstance();
const authManager = gameManager.getAuth();

const userInfo = authManager.getUserInfo();
console.log('用户名:', userInfo?.username);
console.log('宝石数量:', userInfo?.gems);
```

### 手动刷新 Token
```typescript
const gameManager = GameManager.getInstance();
const authManager = gameManager.getAuth();

try {
    await authManager.refreshToken();
    console.log('Token 刷新成功');
} catch (error) {
    console.error('Token 刷新失败:', error);
}
```

## 🐛 常见问题

### 1. GameManager 未初始化
**原因**: 场景中没有添加 GameManager 节点  
**解决**: 在场景中创建节点并添加 GameManager 组件

### 2. 登录后没有跳转
**原因**: LoginComponent 的 nextSceneName 未设置或场景不存在  
**解决**: 检查 LoginComponent 的 nextSceneName 属性，确保场景存在

### 3. 请求一直超时
**原因**: 后端服务未启动或地址配置错误  
**解决**: 
- 检查后端服务是否在运行
- 检查 APIConfig.ts 中的 BASE_URL 是否正确
- 检查浏览器控制台的网络请求

### 4. Token 存储失败
**原因**: 浏览器不支持 localStorage 或被禁用  
**解决**: 检查浏览器设置，确保允许使用 localStorage

### 5. CORS 错误
**原因**: 后端未正确配置 CORS  
**解决**: 后端已配置允许所有来源，如果仍有问题，检查后端的 CORS 配置

## 🔐 安全注意事项

1. **不要在代码中硬编码密码**
2. **Token 存储在 localStorage 中**，浏览器环境下相对安全
3. **生产环境建议使用 HTTPS**
4. **定期刷新 token** 以提高安全性
5. **登出时清理本地存储**

## 🎉 完成！

完成以上步骤后，你的登录系统就完全配置好了！所有后续的 API 请求都会自动附带 token，并且会自动处理 token 刷新。
