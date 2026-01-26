# 快速登录组件使用指南

快速登录组件 `QuickLoginComponent` 提供一键登录功能，自动创建临时游客账号并登录。

## ✨ 功能特点

- **一键登录** - 无需手动输入用户名密码
- **自动创建账号** - 自动生成临时游客账号
- **智能重试** - 用户名冲突自动重试（最多5次）
- **状态检查** - 已登录用户自动跳转
- **错误提示** - 友好的错误提示信息

## 📋 场景结构

创建一个简单的登录场景：

```
LoginScene
└── Canvas
    ├── GameManager (添加 GameManager 组件)
    └── QuickLogin (Node)
        ├── QuickLoginComponent (Component)
        ├── LoginButton (Button) ← 快速登录按钮
        ├── TipLabel (Label) ← 提示文本（初始隐藏）
        └── LoadingNode (Node + Label) ← 加载中提示（初始隐藏）
```

### 推荐 UI 布局

```
Canvas
└── QuickLogin
    ├── Background (Sprite) ← 背景图
    ├── Logo (Sprite) ← 游戏 Logo
    ├── Title (Label) ← "欢迎来到游戏"
    ├── LoginButton (Button)
    │   └── Label - "开始游戏"
    ├── TipLabel (Label) ← 提示信息
    └── LoadingNode (Node)
        └── Label - "正在登录..."
```

## ⚙️ 属性配置

在属性检查器中配置以下属性：

| 属性名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `Tip Label` | Label | 提示文本 Label（可选） | ⭕ |
| `Loading Node` | Node | 加载中提示节点（可选） | ⭕ |
| `Next Scene Name` | String | 登录成功后跳转的场景名（默认 "home"） | ✅ |
| `Auto Check Login` | Boolean | 是否在启动时自动检查登录状态（默认 true） | ⭕ |

### 配置步骤

1. **创建场景结构** - 按照上面的结构创建节点
2. **添加组件** - 为 QuickLogin 节点添加 `QuickLoginComponent`
3. **配置属性**：
   - `Tip Label` → 拖入 TipLabel 节点的 Label 组件（可不配）
   - `Loading Node` → 拖入 LoadingNode 节点（可不配）
   - `Next Scene Name` → 填写 "home"（或你的主场景名）
   - 勾选 `Auto Check Login`
4. **配置按钮事件** - 在 LoginButton 的 Button 组件中：
   - 点击 "Click Events" 下的 "+" 添加事件
   - 拖入 QuickLogin 节点到 `cc.Node`
   - 选择 Component: `QuickLoginComponent`
   - 选择 Handler: `onLoginClick`
5. **设置按钮文本** - LoginButton 的 Label 设置为 "开始游戏"
6. **隐藏提示节点** - TipLabel 和 LoadingNode 初始状态设为不可见

## 🎯 工作流程

1. **场景加载** → 检查是否已登录
2. **已登录** → 直接跳转到主场景
3. **未登录** → 显示快速登录按钮
4. **点击按钮** → 自动创建临时账号
5. **账号格式** → `guest_时间戳_随机数`（如 `guest_1706000000_1234`）
6. **密码生成** → 8位随机字母数字组合
7. **注册账号** → 调用后端注册接口
8. **用户名冲突** → 自动重新生成并重试（最多5次）
9. **登录成功** → 跳转到主场景

## 💻 使用示例

### 基础用法（推荐）

只需在场景中配置组件，无需编写代码。组件会自动处理所有逻辑。

### 高级用法 - 自定义控制

如果需要程序控制登录流程：

```typescript
import { QuickLoginComponent } from './QuickLoginComponent';

// 获取组件
const quickLogin = this.node.getComponent(QuickLoginComponent);

// 手动触发快速登录
// 注意：通常不需要手动调用，组件会自动处理
```

### 与其他组件集成

如果你想在快速登录的同时还保留传统登录入口：

```
LoginScene
└── Canvas
    ├── GameManager
    ├── QuickLoginPanel (Node)
    │   ├── QuickLoginComponent
    │   └── QuickLoginButton (Button) - "游客登录"
    └── NormalLoginPanel (Node)
        ├── LoginComponent
        ├── UsernameInput (EditBox)
        ├── PasswordInput (EditBox)
        └── LoginButton (Button) - "账号登录"
```

## 🔐 临时账号说明

### 账号格式

- **用户名格式**：`guest_时间戳_随机数`
- **示例**：`guest_1706000000_1234`
- **密码**：8位随机字母数字组合（自动生成）

### 账号特性

✅ **自动创建** - 无需手动注册  
✅ **立即可用** - 创建后立即登录  
✅ **持久化** - 账号保存在数据库中  
✅ **完整功能** - 与普通账号功能相同  
✅ **初始奖励** - 注册即获得 1000 宝石  

### 注意事项

⚠️ **账号密码不显示** - 临时账号的密码不会显示给用户  
⚠️ **无法找回** - 如果清除本地缓存，需要重新创建账号  
⚠️ **建议升级** - 后续可以添加绑定手机/邮箱功能  

## 🎨 UI 设计建议

### 按钮文案

- ✅ "开始游戏"
- ✅ "立即游玩"
- ✅ "游客登录"
- ❌ 避免使用 "登录" 或 "注册"（用户无感知）

### 提示文本

- 加载中：`正在创建账号...` / `正在登录...`
- 成功：`登录成功！`
- 失败：显示具体错误信息

### 视觉反馈

1. **点击按钮** → 按钮禁用，显示加载动画
2. **创建账号** → 显示提示文本
3. **登录成功** → 短暂提示，然后跳转
4. **登录失败** → 显示错误信息，按钮重新启用

## 🐛 常见问题

### 1. 点击按钮没有反应

**原因**：GameManager 未初始化或按钮未绑定  
**解决**：
- 确保场景中有 GameManager 节点
- 检查按钮是否正确绑定到 `Quick Login Button` 属性

### 2. 提示 "创建账号失败"

**原因**：后端服务未启动或网络问题  
**解决**：
- 确保后端服务在 http://localhost:8000 运行
- 检查浏览器控制台的网络请求
- 查看后端日志

### 3. 一直提示 "用户名冲突"

**原因**：时间戳生成重复（极少见）  
**解决**：组件会自动重试最多5次，如果仍失败说明后端有问题

### 4. 登录成功后没有跳转

**原因**：`Next Scene Name` 未设置或场景不存在  
**解决**：
- 检查 `Next Scene Name` 属性是否填写
- 确认目标场景已添加到构建设置中

### 5. 重复创建账号

**原因**：本地存储被清除或 `Auto Login If Logged In` 未勾选  
**解决**：
- 勾选 `Auto Login If Logged In` 属性
- 组件会自动检查登录状态，避免重复创建

## 🔄 与传统登录组件对比

| 特性 | QuickLoginComponent | LoginComponent |
|-----|-------------------|----------------|
| 用户体验 | 一键登录，无需输入 | 需要输入账号密码 |
| 账号创建 | 自动创建临时账号 | 需要手动注册 |
| 适用场景 | 游客模式、快速体验 | 正式玩家、保存进度 |
| 配置复杂度 | 简单（1个按钮） | 中等（2个输入框+1个按钮） |
| 账号安全性 | 低（密码不可见） | 高（用户自己设置） |

## 💡 最佳实践

### 推荐场景

1. **启动场景** - 作为默认登录方式
2. **游客模式** - 让用户快速体验游戏
3. **首次启动** - 降低新用户门槛

### 不推荐场景

1. **需要账号安全的场景** - 如涉及充值、绑定等
2. **多设备同步** - 临时账号难以在多设备间同步

### 建议搭配

```typescript
// 组合方案：快速登录 + 账号升级
// 1. 使用 QuickLoginComponent 快速进入游戏
// 2. 游戏内提供 "绑定账号" 功能
// 3. 绑定后可以设置正式的用户名密码
```

## 🚀 下一步

1. **创建场景** - 按照本文档创建登录场景
2. **配置组件** - 绑定节点和设置属性
3. **测试运行** - 点击按钮测试快速登录
4. **设置启动场景** - 将登录场景设为启动场景
5. **添加后续功能** - 考虑添加账号升级/绑定功能

## 📝 完整示例

### 最小化配置

只需要：
- 1 个按钮
- 设置 Next Scene Name
- 配置 Button 的 Click Events

就可以实现快速登录！

```
LoginScene
└── Canvas
    └── QuickLogin
        ├── QuickLoginComponent (Component)
        │   └── Next Scene Name = "home"
        └── StartButton (Button)
            └── Click Events:
                - Node: QuickLogin
                - Component: QuickLoginComponent
                - Handler: onLoginClick
```

## 🎉 完成！

配置完成后，用户只需点击一个按钮就能立即开始游戏，大大降低了使用门槛！
