import { _decorator, Component, Label, Node, UITransform, Widget, Color, tween, UIOpacity, Canvas, Layers, director, game, Graphics } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 全局 Toast 组件
 * 用法：Toast.show('复制成功');
 */
@ccclass('Toast')
export class Toast extends Component {
    private static _instance: Toast | null = null;
    private static _toastNode: Node | null = null;

    private _label: Label | null = null;
    private _graphics: Graphics | null = null;
    private _uiOpacity: UIOpacity | null = null;
    private _hideTimer: number = 0;

    // 样式配置
    private static readonly BG_COLOR = new Color(0, 0, 0, 200);  // 半透明黑色背景
    private static readonly PADDING_H = 12;  // 水平内边距
    private static readonly PADDING_V = 8;   // 垂直内边距
    private static readonly RADIUS = 8;      // 圆角半径
    private static readonly FONT_SIZE = 22;  // 字体大小

    /**
     * 显示 Toast
     * @param message 消息内容
     * @param duration 显示时长（秒），默认 2 秒
     */
    static show(message: string, duration: number = 2): void {
        Toast._ensureInstance();
        Toast._instance?.showMessage(message, duration);
    }

    /**
     * 隐藏 Toast
     */
    static hide(): void {
        Toast._instance?.hideMessage();
    }

    /**
     * 确保实例存在
     */
    private static _ensureInstance(): void {
        if (Toast._instance && Toast._toastNode?.isValid) {
            return;
        }

        // 查找 Canvas
        const canvas = director.getScene()?.getComponentInChildren(Canvas);
        if (!canvas) {
            console.warn('[Toast] 找不到 Canvas');
            return;
        }

        // 创建 Toast 容器节点
        const toastNode = new Node('GlobalToast');
        toastNode.layer = Layers.Enum.UI_2D;
        toastNode.setParent(canvas.node);

        // 设置 UITransform
        const transform = toastNode.addComponent(UITransform);
        transform.setContentSize(200, 50);

        // 设置 Widget 居中
        const widget = toastNode.addComponent(Widget);
        widget.isAlignHorizontalCenter = true;
        widget.horizontalCenter = 0;
        widget.isAlignVerticalCenter = true;
        widget.verticalCenter = 0;

        // 添加 UIOpacity
        const uiOpacity = toastNode.addComponent(UIOpacity);
        uiOpacity.opacity = 0;

        // 创建背景节点（使用 Graphics 绘制圆角矩形）
        const bgNode = new Node('Background');
        bgNode.layer = Layers.Enum.UI_2D;
        bgNode.setParent(toastNode);

        const bgTransform = bgNode.addComponent(UITransform);
        bgTransform.setContentSize(200, 50);

        const graphics = bgNode.addComponent(Graphics);
        graphics.fillColor = Toast.BG_COLOR;

        // 创建 Label 节点
        const labelNode = new Node('Label');
        labelNode.layer = Layers.Enum.UI_2D;
        labelNode.setParent(toastNode);

        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(500, 50);  // 设置较大值，让文字自由排布

        const label = labelNode.addComponent(Label);
        label.string = '';
        label.fontSize = Toast.FONT_SIZE;
        label.lineHeight = Toast.FONT_SIZE + 4;
        label.color = new Color(255, 255, 255, 255);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.NONE;  // 不限制，让文字自然排布

        // 添加 Toast 组件
        const toast = toastNode.addComponent(Toast);
        toast._label = label;
        toast._graphics = graphics;
        toast._uiOpacity = uiOpacity;

        Toast._instance = toast;
        Toast._toastNode = toastNode;

        // 确保跨场景保留
        game.addPersistRootNode(toastNode);
    }

    /**
     * 绘制圆角矩形背景
     */
    private drawBackground(width: number, height: number): void {
        if (!this._graphics) return;

        const g = this._graphics;
        const r = Toast.RADIUS;
        const x = -width / 2;
        const y = -height / 2;
        const w = width;
        const h = height;

        g.clear();
        g.fillColor = Toast.BG_COLOR;

        // 绘制圆角矩形
        g.roundRect(x, y, w, h, r);
        g.fill();
    }

    /**
     * 显示消息
     */
    private showMessage(message: string, duration: number): void {
        if (!this._label || !this._uiOpacity) return;

        // 清除之前的定时器
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = 0;
        }

        // 停止之前的动画
        tween(this._uiOpacity).stop();

        // 设置消息
        this._label.string = message;

        // 等待下一帧让 Label 渲染完成
        this.scheduleOnce(() => {
            if (!this._label || !this.node?.isValid) return;
            
            // 获取文字实际宽度
            const labelTransform = this._label.node.getComponent(UITransform);
            const labelWidth = labelTransform?.contentSize.width || 50;
            const bgWidth = labelWidth + Toast.PADDING_H * 2;
            const bgHeight = Toast.FONT_SIZE + Toast.PADDING_V * 2;

            // 绘制背景
            this.drawBackground(bgWidth, bgHeight);
        }, 0);

        // 淡入动画
        this._uiOpacity.opacity = 0;
        tween(this._uiOpacity)
            .to(0.2, { opacity: 255 })
            .start();

        // 设置自动隐藏
        this._hideTimer = setTimeout(() => {
            this.hideMessage();
        }, duration * 1000) as unknown as number;
    }

    /**
     * 隐藏消息
     */
    private hideMessage(): void {
        if (!this._uiOpacity) return;

        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = 0;
        }

        // 淡出动画
        tween(this._uiOpacity)
            .to(0.2, { opacity: 0 })
            .start();
    }

    onDestroy(): void {
        if (Toast._instance === this) {
            Toast._instance = null;
            Toast._toastNode = null;
        }
    }
}
