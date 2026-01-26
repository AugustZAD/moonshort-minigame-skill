# QuickLoginComponent 配置说明

## 🎯 使用方式

QuickLoginComponent 采用标准的 Cocos Creator Button 事件配置方式，**不需要在代码中绑定按钮**。

## 📋 配置步骤

### 1. 创建场景结构

```
LoginScene
└── Canvas
    └── QuickLogin (Node)
        ├── StartButton (Button) ← 开始游戏按钮
        ├── TipLabel (Label) ← 提示文本（可选）
        └── LoadingNode (Node) ← 加载提示（可选）
```

### 2. 添加组件

为 `QuickLogin` 节点添加 `QuickLoginComponent` 组件。

### 3. 配置组件属性

在 QuickLoginComponent 的属性面板中：

| 属性 | 配置 | 必填 |
|-----|------|------|
| Tip Label | 拖入 TipLabel 的 Label 组件 | ⭕ 可选 |
| Loading Node | 拖入 LoadingNode 节点 | ⭕ 可选 |
| Next Scene Name | 填写 "home" | ✅ 必填 |
| Auto Check Login | 勾选（默认） | ⭕ 可选 |

### 4. 配置按钮事件（重要！）

在 `StartButton` 的 **Button 组件**中配置点击事件：

1. 找到 **Click Events** 属性
2. 点击下方的 **+** 添加事件
3. 配置事件参数：
   - **cc.Node**: 拖入 `QuickLogin` 节点（挂载了 QuickLoginComponent 的节点）
   - **Component**: 选择 `QuickLoginComponent`
   - **Handler**: 选择 `onLoginClick`
   - **CustomEventData**: 留空

## 🎨 配置截图说明

### Button 组件的 Click Events 配置

```
Button 组件
├── Interactable: ✓
├── Target: (自动)
└── Click Events: [1]
    └── [0]
        ├── Target: QuickLogin (Node)
        ├── Component: QuickLoginComponent
        ├── Handler: onLoginClick
        └── CustomEventData: (空)
```

## ✅ 最小化配置

如果你只想要最基本的功能，可以不配置 `Tip Label` 和 `Loading Node`：

```
QuickLogin
├── QuickLoginComponent
│   └── Next Scene Name = "home"
└── StartButton (Button)
    └── Click Events → QuickLoginComponent.onLoginClick
```

## 🎯 工作流程

```
用户点击按钮
    ↓
Button 组件触发 Click Events
    ↓
调用 QuickLoginComponent.onLoginClick()
    ↓
自动创建临时账号
    ↓
登录成功，跳转到 home 场景
```

## ❌ 常见错误

### 1. 点击按钮没反应

**原因**: Click Events 没有正确配置

**检查**:
- Button 组件的 Click Events 是否添加了事件
- Target 是否正确拖入了 QuickLogin 节点
- Component 是否选择了 QuickLoginComponent
- Handler 是否选择了 onLoginClick

### 2. 提示 "方法未找到"

**原因**: Handler 名称错误

**解决**: 确保 Handler 选择的是 `onLoginClick`（不是其他名称）

### 3. 无法跳转场景

**原因**: Next Scene Name 未配置或场景不存在

**解决**:
- 检查 Next Scene Name 是否填写
- 确认目标场景已添加到构建设置中

## 💡 提示

1. **Tip Label 和 Loading Node 是可选的**
   - 如果不需要提示文本，可以不配置 Tip Label
   - 如果不需要加载动画，可以不配置 Loading Node
   - 组件会自动处理空引用

2. **按钮可以在任何地方**
   - 按钮不需要是 QuickLogin 的子节点
   - 只要在 Click Events 中正确配置即可

3. **可以多个按钮共用一个组件**
   - 多个按钮可以配置相同的 QuickLoginComponent
   - 都调用 onLoginClick 方法即可

## 📝 完整示例

### 场景层次结构

```
Canvas
├── Background (Sprite)
├── Logo (Sprite)
└── QuickLogin (Node)
    ├── QuickLoginComponent
    │   ├── Tip Label: TipLabel
    │   ├── Loading Node: LoadingNode
    │   ├── Next Scene Name: "home"
    │   └── Auto Check Login: ✓
    ├── Title (Label) - "欢迎来到游戏"
    ├── StartButton (Button)
    │   ├── Label - "开始游戏"
    │   └── Click Events:
    │       └── QuickLogin.QuickLoginComponent.onLoginClick
    ├── TipLabel (Label) - [hidden]
    └── LoadingNode (Node) - [hidden]
        └── Label - "正在登录..."
```

## 🎉 完成

配置完成后，点击按钮就会自动创建临时账号并登录！
