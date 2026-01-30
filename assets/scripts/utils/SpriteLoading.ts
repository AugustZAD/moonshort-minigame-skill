import { Node, Graphics, UITransform, Color, tween, Tween, Vec3 } from 'cc';

/**
 * SpriteLoading - 纯代码 Loading 工具
 * 
 * 在目标节点上显示旋转圆环 Loading 动画，用于远程图片/视频加载时的占位
 * 
 * 用法：
 *   import { SpriteLoading } from '../scripts/utils/SpriteLoading';
 *   
 *   SpriteLoading.showLoading(node);
 *   await loadSomething();
 *   SpriteLoading.hideLoading(node);
 */

interface LoadingData {
    node: Node;
    tween: Tween<Node>;
}

// 全局存储
const loadingMap: Map<Node, LoadingData> = new Map();
const LOADING_NODE_NAME = '__sprite_loading__';

/**
 * 在目标节点上显示 Loading
 * @param target 目标节点
 * @param options 可选配置
 */
export function showLoading(target: Node, options?: {
    /** 圆环颜色，默认白色半透明 */
    color?: Color;
    /** 圆环线宽，默认 3 */
    lineWidth?: number;
    /** 圆环半径，默认自动计算 */
    radius?: number;
    /** 是否显示遮罩背景，默认 true */
    showMask?: boolean;
    /** 遮罩颜色，默认半透明黑 */
    maskColor?: Color;
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
        maskColor = new Color(0, 0, 0, 255),
    } = options || {};

    // 获取目标节点尺寸
    const targetTransform = target.getComponent(UITransform);
    const width = targetTransform?.width || 100;
    const height = targetTransform?.height || 100;
    const autoRadius = Math.min(width, height) / 6;
    const r = radius ?? Math.max(10, Math.min(autoRadius, 24));

    // 创建 Loading 容器
    const loadingNode = new Node(LOADING_NODE_NAME);
    const loadingTransform = loadingNode.addComponent(UITransform);
    loadingTransform.width = width;
    loadingTransform.height = height;
    target.addChild(loadingNode);

    // 遮罩背景
    if (showMask) {
        const maskNode = new Node('mask');
        const maskTransform = maskNode.addComponent(UITransform);
        maskTransform.width = width;
        maskTransform.height = height;
        const maskGraphics = maskNode.addComponent(Graphics);
        maskGraphics.fillColor = maskColor;
        maskGraphics.rect(-width / 2, -height / 2, width, height);
        maskGraphics.fill();
        loadingNode.addChild(maskNode);
    }

    // 旋转圆环
    const spinnerNode = new Node('spinner');
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
    
    loadingNode.addChild(spinnerNode);

    // 旋转动画
    const spinTween = tween(spinnerNode)
        .by(0.8, { eulerAngles: new Vec3(0, 0, -360) })
        .repeatForever()
        .start();

    // 淡入
    loadingNode.setScale(0.8, 0.8, 1);
    tween(loadingNode)
        .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
        .start();

    loadingMap.set(target, { node: loadingNode, tween: spinTween });
}

/**
 * 隐藏目标节点上的 Loading
 * @param target 目标节点
 */
export function hideLoading(target: Node): void {
    if (!target) return;

    const data = loadingMap.get(target);
    if (data) {
        data.tween.stop();
        
        // 淡出
        tween(data.node)
            .to(0.08, { scale: new Vec3(0.8, 0.8, 1) }, { easing: 'backIn' })
            .call(() => {
                if (data.node && data.node.isValid) {
                    data.node.destroy();
                }
            })
            .start();
        
        loadingMap.delete(target);
        return;
    }

    // 兜底：直接查找移除
    const existing = target.getChildByName(LOADING_NODE_NAME);
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
