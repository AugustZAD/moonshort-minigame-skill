# 视频纹理播放器使用指南

## 概述
`VideoTexturePlayer` 是一个通过序列帧图片实现视频播放效果的组件，固定 12 FPS，无音频支持，适用于需要在 UI 层级上添加特效和文字的场景。

## 快速开始

### 1. 准备序列帧图片
将视频导出为图片序列（推荐格式：PNG 或 JPG）：
- 帧率：12 FPS
- 命名规则：`frame_0001.png`, `frame_0002.png`, ... 等

### 2. 导入到 Cocos Creator
1. 将所有图片放入 `assets/images` 或其他资源目录
2. 在 Cocos Creator 资源面板中选中所有图片
3. 确保图片按名称正确排序

### 3. 创建播放节点
在场景中创建使用方式：

```
层级结构：
- Canvas
  └── VideoNode (添加 Sprite + VideoTexturePlayer 组件)
      └── TextLabel (可以在视频上方显示文字)
```

### 4. 配置组件

#### 在编辑器中配置：
1. 选中 `VideoNode` 节点
2. 添加 `Sprite` 组件（如果没有）
3. 添加 `VideoTexturePlayer` 组件（菜单: Video/VideoTexturePlayer）
4. 配置属性：
   - **Frames**: 拖入所有序列帧图片（按顺序）
   - **Loop**: 是否循环播放（默认 true）
   - **Auto Play**: 是否自动播放（默认 true）

#### 通过代码配置：
```typescript
import { SpriteFrame, resources } from 'cc';
import { VideoTexturePlayer } from './components/VideoTexturePlayer';

// 动态加载序列帧
resources.loadDir('video_frames', SpriteFrame, (err, frames) => {
    if (err) {
        console.error('加载序列帧失败:', err);
        return;
    }
    
    const player = this.node.getComponent(VideoTexturePlayer);
    player.frames = frames;
    player.play();
});
```

## API 参考

### 属性
| 属性 | 类型 | 说明 |
|------|------|------|
| frames | SpriteFrame[] | 序列帧图片数组 |
| loop | boolean | 是否循环播放 |
| autoPlay | boolean | 自动播放 |
| fps | number | 固定 12 FPS（只读） |

### 方法

#### play()
开始播放
```typescript
player.play();
```

#### pause()
暂停播放
```typescript
player.pause();
```

#### stop()
停止播放并重置到第一帧
```typescript
player.stop();
```

#### gotoFrame(frameIndex: number)
跳转到指定帧
```typescript
player.gotoFrame(10); // 跳转到第 10 帧
```

#### gotoAndPlay(frameIndex: number)
跳转到指定帧并播放
```typescript
player.gotoAndPlay(5); // 从第 5 帧开始播放
```

#### gotoAndStop(frameIndex: number)
跳转到指定帧并停止
```typescript
player.gotoAndStop(15); // 跳转到第 15 帧并暂停
```

#### getCurrentFrame(): number
获取当前帧索引
```typescript
const currentFrame = player.getCurrentFrame();
console.log('当前帧:', currentFrame);
```

#### getTotalFrames(): number
获取总帧数
```typescript
const total = player.getTotalFrames();
console.log('总帧数:', total);
```

#### getIsPlaying(): boolean
检查是否正在播放
```typescript
if (player.getIsPlaying()) {
    console.log('正在播放');
}
```

## 使用场景

### 场景1：循环背景动画
```typescript
// 在编辑器中设置：
// - Loop: true
// - Auto Play: true
// 无需代码，加载后自动循环播放
```

### 场景2：一次性播放（如过场动画）
```typescript
// 在编辑器中设置：
// - Loop: false
// - Auto Play: true

// 监听播放完成（需要扩展 onPlayComplete 方法）
```

### 场景3：手动控制播放
```typescript
import { VideoTexturePlayer } from './components/VideoTexturePlayer';

// 在编辑器中设置：
// - Auto Play: false

const player = this.node.getComponent(VideoTexturePlayer);

// 点击按钮播放
this.playButton.on('click', () => {
    player.play();
});

// 点击按钮暂停
this.pauseButton.on('click', () => {
    player.pause();
});
```

### 场景4：叠加文字和特效
```typescript
// 层级结构：
// - VideoNode (VideoTexturePlayer)
//   ├── EffectNode (粒子特效)
//   └── TextNode (Label)

// 文字和特效会自动显示在视频上方
// 因为它们在同一个 UI 层级中
```

## 性能优化建议

### 1. 图片压缩
- 使用压缩纹理格式（ETC2、PVRTC、ASTC）
- 在 Cocos Creator 资源面板中配置纹理压缩

### 2. 图片尺寸
- 根据实际显示大小选择合适的分辨率
- 避免过大的图片尺寸（建议不超过 1920x1080）

### 3. 帧数控制
- 12 FPS 已经是较低帧率，适合大多数场景
- 如果需要更低帧率以节省资源，可修改 `fps` 属性

### 4. 内存管理
```typescript
// 播放完成后释放资源
player.stop();
player.frames = []; // 清空引用
```

## 常见问题

### Q: 为什么选择 12 FPS？
A: 12 FPS 是平衡性能和流畅度的选择，对于大多数 UI 动画已经足够流畅，同时减少了图片数量和内存占用。

### Q: 如何实现音频同步？
A: 使用 Cocos 的 AudioSource 组件，在 `play()` 时同步播放音频：
```typescript
const player = this.getComponent(VideoTexturePlayer);
const audio = this.getComponent(AudioSource);
player.play();
audio.play();
```

### Q: 文字显示在视频下方怎么办？
A: 确保文字节点在视频节点的**子节点**位置，或者调整节点的 `zIndex` 属性。

### Q: 可以动态修改 FPS 吗？
A: 当前版本固定 12 FPS。如需自定义，可以修改组件源码中的 `fps` 和 `frameInterval` 属性。

## 扩展功能

如需添加播放完成回调、进度事件等功能，可以修改 `onPlayComplete()` 方法：

```typescript
// 在 VideoTexturePlayer.ts 中修改：
private onPlayComplete() {
    // 触发自定义事件
    this.node.emit('video-complete');
}

// 在其他脚本中监听：
videoNode.on('video-complete', () => {
    console.log('视频播放完成');
});
```

## 许可
此组件为项目内部使用，可自由修改和扩展。
