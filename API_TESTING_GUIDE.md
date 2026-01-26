# API 测试和问题排查指南

## 🚀 启动后端服务器

### 1. 进入后端项目目录
```bash
cd /Users/rydia/Project/mob.ai/git/noval.demo.2
```

### 2. 启动开发服务器
```bash
npm run dev
```

服务器默认在 `http://localhost:3000` 启动（Next.js 默认端口）

**注意**：根据你的规则，生产环境 API 在 8000 端口，前端 UI 在 8001 端口。
开发环境默认是 3000 端口。

## 🔍 已发现的问题

### 问题 1: PlayerStatsPanel.ts 中的 Color 引用错误
**状态**: ✅ 已修复

**问题**: 使用了 `cc.Color` 而不是 `Color`
```typescript
// ❌ 错误
this.combatLabel.color = cc.Color.GREEN;

// ✅ 正确
this.combatLabel.color = Color.GREEN;
```

**修复**: 已更新导入语句并修改所有引用

### 问题 2: API 基础 URL 配置
**需要检查**: APIConfig.ts 中的 baseURL 配置

查看当前配置：
```bash
cat /Users/rydia/Project/moonshort/assets/scripts/config/APIConfig.ts
```

应该配置为：
- 开发环境: `http://localhost:3000`
- 生产环境: `http://localhost:8000` (根据你的规则)

## 🧪 API 测试命令

### 1. 测试小说列表接口
```bash
# 获取小说列表（公开接口，不需要认证）
curl -X GET "http://localhost:3000/apiv2/novels?page=1&limit=10"
```

### 2. 测试小说详情接口
```bash
# 获取小说详情（需要小说ID）
curl -X GET "http://localhost:3000/apiv2/novels/{novelId}"
```

### 3. 测试认证接口
```bash
# 登录获取 token
curl -X POST "http://localhost:3000/apiv2/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "password": "password"
  }'
```

### 4. 测试游戏接口（需要认证）

#### 4.1 获取存档列表
```bash
# 需要先获取 token
TOKEN="your_token_here"

curl -X GET "http://localhost:3000/apiv2/saves" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4.2 创建新存档
```bash
curl -X POST "http://localhost:3000/apiv2/saves" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "novelId": "novel_id_here",
    "combat": 15,
    "intelligence": 14,
    "charisma": 13,
    "will": 12
  }'
```

#### 4.3 获取存档详情
```bash
curl -X GET "http://localhost:3000/apiv2/saves/{saveId}" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4.4 获取 A 卡池
```bash
curl -X GET "http://localhost:3000/apiv2/game/acard/pool?saveId={saveId}" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4.5 选择 A 卡
```bash
curl -X POST "http://localhost:3000/apiv2/game/acard/select" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "saveId": 1,
    "cardId": "card_id_here"
  }'
```

#### 4.6 获取 B 卡数据
```bash
# 获取原始 B 卡
curl -X GET "http://localhost:3000/apiv2/game/bcard/1?novelId={novelId}" \
  -H "Authorization: Bearer $TOKEN"

# 获取 AI 富化的 B 卡
curl -X POST "http://localhost:3000/apiv2/game/bcard/enriched" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": 1
  }'
```

#### 4.7 结算 B 卡
```bash
curl -X POST "http://localhost:3000/apiv2/game/bcard/evaluate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": 1,
    "nodeIndex": 1,
    "checkResults": []
  }'
```

#### 4.8 生成过渡叙事
```bash
curl -X POST "http://localhost:3000/apiv2/game/transition" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": 1,
    "nodeIndex": 1,
    "resultType": "normal"
  }'
```

## 🔧 前端代码中需要检查的问题

### 1. APIConfig 基础 URL
检查 `assets/scripts/config/APIConfig.ts`:
```typescript
export class APIConfig {
    static readonly BASE_URL = 'http://localhost:3000'; // 开发环境
    // 生产环境应该是 'http://localhost:8000'
}
```

### 2. CORS 问题
后端已配置 CORS 允许所有来源（根据你的规则）。
检查 `next.config.ts` 确认配置正确。

### 3. GameAPI.ts 端点路径
检查所有 API 调用是否使用正确的路径前缀 `/apiv2/`

### 4. 类型匹配
确保前端类型定义与后端 API 响应格式匹配：
- `PlayerSave` 类型
- `EnrichedBCard` 类型
- `ACardPool` 类型
等

## 📋 完整测试流程

### 步骤 1: 启动服务器
```bash
cd /Users/rydia/Project/mob.ai/git/noval.demo.2
npm run dev
```

### 步骤 2: 测试公开接口（无需认证）
```bash
# 获取小说列表
curl http://localhost:3000/apiv2/novels

# 获取小说详情（替换 {novelId}）
curl http://localhost:3000/apiv2/novels/{novelId}
```

### 步骤 3: 登录获取 Token
```bash
# 登录（需要先确认数据库中有测试用户）
curl -X POST http://localhost:3000/apiv2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password"}'

# 保存返回的 token
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 步骤 4: 测试游戏接口
```bash
# 获取存档列表
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/apiv2/saves

# 创建新存档
curl -X POST http://localhost:3000/apiv2/saves \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "novelId": "your_novel_id",
    "combat": 15,
    "intelligence": 14,
    "charisma": 13,
    "will": 12
  }'
```

## 🐛 常见问题排查

### 问题 A: "Server not running"
**原因**: 后端服务器未启动
**解决**: 运行 `npm run dev` 启动服务器

### 问题 B: CORS 错误
**原因**: 跨域配置问题
**解决**: 确认 `next.config.ts` 中已配置 CORS 允许所有来源

### 问题 C: 401 Unauthorized
**原因**: Token 未提供或已过期
**解决**: 重新登录获取新 Token

### 问题 D: 404 Not Found
**原因**: API 路径错误
**解决**: 确认使用 `/apiv2/` 前缀，不是 `/api/`

### 问题 E: 类型错误
**原因**: 前端类型定义与后端响应不匹配
**解决**: 对比后端接口代码和前端类型定义

## ✅ 验证清单

- [ ] 后端服务器已启动（`npm run dev`）
- [ ] 小说列表接口可访问
- [ ] 小说详情接口可访问
- [ ] 登录接口返回 Token
- [ ] 存档接口需要认证可正常访问
- [ ] A卡接口可正常访问
- [ ] B卡接口可正常访问
- [ ] 前端 APIConfig 配置正确
- [ ] PlayerStatsPanel Color 引用已修复
- [ ] 所有组件导入路径正确

## 🔗 相关文件

- 后端项目: `/Users/rydia/Project/mob.ai/git/noval.demo.2`
- 前端项目: `/Users/rydia/Project/moonshort`
- API 封装: `assets/scripts/api/GameAPI.ts`
- 类型定义: `assets/scripts/types/game.types.ts`
- 配置文件: `assets/scripts/config/APIConfig.ts`
