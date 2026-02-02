# Google 登录集成指南

## 已完成的部分

✅ **后端 API** (`/api/auth/google`)
- 验证 Google ID Token
- 支持三种场景：直接登录、创建新账号、绑定现有账号
- 存储 Google 用户信息：googleId, googleEmail, googleName, googleAvatar
- Google 登录用户自动激活

✅ **前端组件** (`QuickLoginComponent.ts`)
- 快速登录：`onLoginClick()` - 创建游客账号
- Google 登录：`onGoogleLoginClick()` - 使用 Google 账号
- Web 端：使用 Google Identity Services
- 原生端：预留 JSB 接口（待实现）

## 场景配置步骤

### 1. 在登录场景添加 Google 登录按钮

打开 Cocos Creator，编辑 `login.scene`：

```
LoginScene
└── Canvas
    ├── GameManager (已有)
    └── QuickLogin (已有)
        ├── QuickLoginComponent
        ├── QuickLoginButton - "快速开始"
        ├── GoogleLoginButton - "Google 登录" (新增)
        ├── TipLabel (Label，可选)
        └── LoadingNode (Node，可选)
```

### 2. 配置 QuickLoginComponent 属性

在属性检查器中设置：
- `Tip Label` → 拖入 TipLabel（可选）
- `Loading Node` → 拖入 LoadingNode（可选）
- `Activated Scene Name` → `index`
- `Invite Scene Name` → `invite`
- `Bind Google To Current User` → `false`（登录场景用 false）

### 3. 配置按钮事件

**快速登录按钮**：
- Handler: `onLoginClick`

**Google 登录按钮**：
- Handler: `onGoogleLoginClick`

### 4. 在邀请码页面添加 Google 绑定按钮

已登录但未激活的用户可以通过绑定 Google 来激活：

```
InviteScene
└── Canvas
    ├── InviteCodePanel (已有)
    └── QuickLoginComponent (新增，用于绑定)
        ├── Bind Google To Current User = true  ← 重要！
        └── GoogleBindButton - "绑定 Google 账号"
            └── Handler: onGoogleLoginClick
```

## 登录流程说明

### 流程 A：快速登录 + 邀请码
1. 点击"快速开始" → 创建游客账号（未激活）
2. 跳转到邀请码页面
3. 输入邀请码激活 或 点击"绑定 Google"激活

### 流程 B：直接 Google 登录
1. 点击"Google 登录"
2. 如果已绑定 → 直接登录，跳转主页
3. 如果未绑定 → 创建新账号（自动激活），跳转主页

### 流程 C：游客账号绑定 Google
1. 快速登录后在邀请页点击"绑定 Google"
2. 绑定成功 → 账号自动激活，跳转主页

## 测试方法

### Web 端测试
1. 启动后端服务（确保代理已配置）
2. 在 Cocos Creator 中运行 Web 预览
3. 点击 Google 登录按钮
4. 选择 Google 账号授权

### 使用 OAuth Playground 测试
1. 访问 https://developers.google.com/oauthplayground/
2. 设置 Client ID: `412992342491-r70savlemhlqg0lbud6j0rup0qfjr30n.apps.googleusercontent.com`
3. 授权获取 id_token
4. 使用 curl 测试：
```bash
curl -X POST http://localhost:3000/apiv2/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "你的id_token"}'
```

## Android 配置（待完成）

需要在 `google-services.json` 中添加 OAuth Client ID：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建 OAuth 2.0 客户端 ID（Android 类型）
3. 填入 SHA-1 指纹和包名 `com.mobai.moonshort`
4. 下载更新后的 `google-services.json`

## iOS 配置（待完成）

1. 创建 iOS OAuth 客户端 ID
2. 下载 `GoogleService-Info.plist`
3. 配置 URL Scheme

## 注意事项

⚠️ Google 登录用户自动激活，不需要邀请码
⚠️ 绑定 Google 会同时激活账号
⚠️ 每个 Google 账号只能绑定一个游戏账号
⚠️ 开发环境需要配置代理才能访问 Google API
