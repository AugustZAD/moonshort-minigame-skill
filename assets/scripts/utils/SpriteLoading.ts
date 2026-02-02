import { Node, Graphics, UITransform, Color, tween, Tween, Vec3, Sprite, SpriteFrame, Texture2D } from 'cc';

/**
 * SpriteLoading - Loading 工具
 * 
 * 在目标 Sprite 节点上显示 Loading：
 * 1. 给 Sprite 设置纯黑色 spriteFrame 作为背景（享受 shader 裁切）
 * 2. 添加圆环子节点播放旋转动画
 * 
 * 用法：
 *   import { showLoading, hideLoading } from '../scripts/utils/SpriteLoading';
 *   
 *   showLoading(spriteNode);
 *   await loadSomething();
 *   hideLoading(spriteNode);
 */

interface LoadingData {
    spinnerNode: Node;
    spinTween: Tween<Node>;
    originalSpriteFrame: SpriteFrame | null; // 保存原始 spriteFrame
}

// 全局存储
const loadingMap: Map<Node, LoadingData> = new Map();
const SPINNER_NODE_NAME = '__loading_spinner__';

// 缓存纯黑色 SpriteFrame
let blackSpriteFrame: SpriteFrame | null = null;

function getBlackSpriteFrame(): SpriteFrame {
    if (!blackSpriteFrame) {
        const texture = new Texture2D();
        // 创建 1x1 纯黑色纹理
        const data = new Uint8Array([0, 0, 0, 255]); // RGBA: 纯黑不透明
        texture.reset({
            width: 1,
            height: 1,
            format: Texture2D.PixelFormat.RGBA8888,
        });
        texture.uploadData(data);
        
        blackSpriteFrame = new SpriteFrame();
        blackSpriteFrame.texture = texture;
    }
    return blackSpriteFrame;
}

/**
 * 在目标节点上显示 Loading
 * @param target 目标节点（应该有 Sprite 组件）
 * @param options 可选配置
 */
export function showLoading(target: Node, options?: {
    /** 圆环颜色，默认白色半透明 */
    color?: Color;
    /** 圆环线宽，默认 3 */
    lineWidth?: number;
    /** 圆环半径，默认自动计算 */
    radius?: number;
    /** 是否设置黑色背景，默认 true */
    showMask?: boolean;
}): void {
    if (!target || !target.isValid) {
        return;
    }

    // 已有 Loading，跳过
    if (loadingMap.has(target)) {
        return;
    }

    const {
        color = new Color(255, 255, 255, 200),
        lineWidth = 3,
        radius,
        showMask = true,
    } = options || {};

    // 获取目标节点尺寸
    const targetTransform = target.getComponent(UITransform);
    const width = targetTransform?.width || 100;
    const height = targetTransform?.height || 100;
    const autoRadius = Math.min(width, height) / 6;
    const r = radius ?? Math.max(10, Math.min(autoRadius, 24));

    // 保存原始 spriteFrame
    const sprite = target.getComponent(Sprite);
    const originalSpriteFrame = sprite?.spriteFrame || null;
    
    // 设置黑色背景（享受 Sprite 的 shader 裁切）
    if (showMask && sprite) {
        sprite.spriteFrame = getBlackSpriteFrame();
    }

    // 创建旋转圆环子节点
    const spinnerNode = new Node(SPINNER_NODE_NAME);
    spinnerNode.addComponent(UITransform);
    const graphics = spinnerNode.addComponent(Graphics);
    graphics.lineWidth = lineWidth;
    graphics.strokeColor = color;
    graphics.lineCap = Graphics.LineCap.ROUND;
    
    // 绘制 270° 弧
    const startRad = -Math.PI / 2;
    const endRad = startRad + Math.PI * 1.5;
    graphics.arc(0, 0, r, startRad, endRad, false);
    graphics.stroke();
    
    target.addChild(spinnerNode);

    // 旋转动画
    const spinTween = tween(spinnerNode)
        .by(0.8, { eulerAngles: new Vec3(0, 0, -360) })
        .repeatForever()
        .start();

    // 淡入
    spinnerNode.setScale(0.8, 0.8, 1);
    tween(spinnerNode)
        .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
        .start();

    loadingMap.set(target, { spinnerNode, spinTween, originalSpriteFrame });
}

/**
 * 隐藏目标节点上的 Loading
 * @param target 目标节点
 */
export function hideLoading(target: Node): void {
    if (!target) return;

    const data = loadingMap.get(target);
    if (data) {
        data.spinTween.stop();
        
        // 淡出
        tween(data.spinnerNode)
            .to(0.08, { scale: new Vec3(0.8, 0.8, 1) }, { easing: 'backIn' })
            .call(() => {
                if (data.spinnerNode && data.spinnerNode.isValid) {
                    data.spinnerNode.destroy();
                }
            })
            .start();
        
        // 注意：不恢复原始 spriteFrame，因为视频/图片加载完成后会设置新的
        // 如果需要恢复，可以取消下面的注释
        // const sprite = target.getComponent(Sprite);
        // if (sprite && data.originalSpriteFrame) {
        //     sprite.spriteFrame = data.originalSpriteFrame;
        // }
        
        loadingMap.delete(target);
        return;
    }

    // 兑底：直接查找移除
    const existing = target.getChildByName(SPINNER_NODE_NAME);
    if (existing) {
        existing.destroy();
    }
}

/**
 * 检查节点是否正在显示 Loading
 */
export function isLoading(target: Node): boolean {
    return loadingMap.has(target);
}

/**
 * 隐藏所有 Loading
 */
export function hideAllLoading(): void {
    for (const [target] of loadingMap) {
        hideLoading(target);
    }
}

// 导出为命名空间形式，方便使用
export const SpriteLoading = {
    showLoading,
    hideLoading,
    isLoading,
    hideAllLoading,
};

// 默认导出
export default SpriteLoading;
