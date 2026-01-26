# VideoPlayer → VideoTexturePlayer 迁移指南

## 🔄 迁移内容

### NovelItemComponent 已迁移
已将 `VideoPlayer` 组件替换为自定义的 `VideoTexturePlayer` 组件。

---

## 📋 场景/预制体需要的操作

### 1. **更新 NovelItem 预制体**
打开使用 NovelItemComponent 的预制体：

**原来的节点结构：**
```
NovelItem
├── CoverSprite (Sprite)
├── TitleLabel (Label)
├── VideoPlayerNode (VideoPlayer) ❌
└── ...
```

**新的节点结构：**
```
NovelItem
├── CoverSprite (Sprite)
├── TitleLabel (Label)
├── VideoPlayerNode (Sprite + VideoTexturePlayer) ✅
└── ...
```

### 2. **修改步骤**

#### 步骤 A：删除旧的 VideoPlayer 组件
1. 在 Cocos Creator 中打开预制体
2. 选中视频播放器节点
3. 在 **属性检查器** 中删除 `VideoPlayer` 组件

#### 步骤 B：添加新组件
1. 确保节点上有 `Sprite` 组件（如果没有，添加一个）
2. 添加 `VideoTexturePlayer` 组件（菜单：Video/VideoTexturePlayer）
3. 配置属性：
   ```
   ✓ Video Url: （留空，会从代码设置）
   ✓ Fit Mode: 1 (COVER)
   ✓ Loop: false
   ✓ Auto Play: true
   ✓ Corner Radius: 24
   ✓ Upload Fps: 12
   ```

#### 步骤 C：重新关联引用
在 NovelItemComponent 组件中：
1. 找到 `Video Player` 属性
2. 拖入刚才修改的节点（现在带有 VideoTexturePlayer 的节点）

---

## 🆚 API 对比

### VideoPlayer（旧）
```typescript
// 设置远程视频
videoPlayer.remoteURL = 'https://example.com/video.mp4';
videoPlayer.resourceType = VideoPlayer.ResourceType.REMOTE;

// 控制
videoPlayer.play();
videoPlayer.pause();
videoPlayer.stop();
```

### VideoTexturePlayer（新）
```typescript
// 设置远程视频
await videoPlayer.setVideoUrl('https://example.com/video.mp4');

// 控制（相同）
videoPlayer.play();
videoPlayer.pause();
videoPlayer.stop();
```

---

## ✅ 优势对比

| 特性 | VideoPlayer | VideoTexturePlayer |
|------|------------|-------------------|
| **Web 平台层级问题** | ❌ 有问题 | ✅ 完美支持 |
| **UI/文字叠加** | ❌ 困难 | ✅ 完美支持 |
| **圆角裁剪** | ❌ 需额外组件 | ✅ 内置支持 |
| **性能控制** | ⚠️ 固定 | ✅ 可调节（FPS） |
| **跨平台兼容** | ⚠️ 不稳定 | ✅ Web 优化 |
| **音频支持** | ✅ 支持 | ⚠️ 静音（Web限制） |

---

## ⚠️ 注意事项

### 1. **仅支持远程 URL**
VideoTexturePlayer 只支持 `http://` 或 `https://` 开头的远程视频 URL。

**不支持：**
- ❌ 本地资源路径（`resources/videos/xxx`）
- ❌ 相对路径

**支持：**
- ✅ `https://cdn.example.com/video.mp4`
- ✅ `https://example.com/videos/intro.webm`

### 2. **CORS 要求**
视频服务器必须允许跨域访问：
```
Access-Control-Allow-Origin: *
```

### 3. **音频说明**
- Web 平台自动播放需要静音（`muted=true`）
- 如需音频，需用户交互后再取消静音
- 可单独控制 `<video>` 元素的音量

### 4. **性能建议**
- **720p**：流畅，推荐
- **1080p**：可用，但可能需降低 `uploadFps`
- **4K**：不推荐

---

## 🔧 故障排查

### 问题：黑屏/不显示
**原因：** 资源生命周期问题
**解决：** 已在最新版本修复，确保使用最新的 VideoTexturePlayer.ts

### 问题：视频尺寸不对
**原因：** FitMode 设置不当
**解决：** 调整 `fitMode` 属性：
- `CONTAIN (0)` - 完整显示
- `COVER (1)` - 填满容器（默认）
- `FIT_WIDTH (2)` - 宽度一致
- `FIT_HEIGHT (3)` - 高度一致

### 问题：CORS 错误
**原因：** 视频服务器不允许跨域
**解决：** 
1. 配置服务器允许 CORS
2. 或使用代理服务器
3. 或将视频放在同源服务器

---

## 📝 代码示例

### 基本用法
```typescript
import { VideoTexturePlayer } from './components/VideoTexturePlayer';

// 获取组件
const player = this.node.getComponent(VideoTexturePlayer);

// 设置视频
await player.setVideoUrl('https://example.com/video.mp4');

// 播放控制
player.play();
player.pause();
player.stop();
```

### 高级配置
```typescript
// 配置圆角
player.cornerRadius = 32;
player.roundTopLeft = true;
player.roundTopRight = true;
player.roundBottomRight = false;
player.roundBottomLeft = false;

// 配置适配模式
player.fitMode = 1; // COVER

// 配置性能
player.uploadFps = 15; // 提高流畅度
```

---

## 🎯 下一步

1. ✅ 更新所有使用 NovelItemComponent 的预制体
2. ✅ 测试视频加载和播放
3. ✅ 验证圆角和 UI 叠加效果
4. ✅ 检查控制台是否有错误

---

## 📞 技术支持

如遇到问题，检查：
1. 浏览器控制台的错误日志
2. Network 面板查看视频是否正常加载
3. VideoTexturePlayer 的属性配置是否正确
