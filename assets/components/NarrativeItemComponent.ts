import { _decorator, Component, Node, Label, Sprite, SpriteFrame, Mask, Graphics, Color, UITransform } from 'cc';

const { ccclass, property, menu } = _decorator;

/**
 * 叙事项组件
 * 用于 3 种预制体：narration（旁白）、thinking（思考）、speaking（对话）
 * 
 * 节点结构：
 * - Narration/Thinking 预制体：只有 ContentLabel
 * - Speaking 预制体：有 AvatarSprite + SpeakerNameLabel + ContentLabel
 * 
 * 注：不需要显隐控制，由不同的预制体结构决定
 */
@ccclass('NarrativeItemComponent')
@menu('Components/NarrativeItemComponent')
export class NarrativeItemComponent extends Component {
    @property({ type: Sprite, tooltip: '角色头像 Sprite' })
    avatarSprite: Sprite | null = null;

    @property({ type: Label, tooltip: '角色名称 Label' })
    speakerNameLabel: Label | null = null;

    @property({ type: Label, tooltip: '对话内容 Label' })
    contentLabel: Label | null = null;

    @property({ tooltip: '名称后缀（在预制体面板配置，用于区分不同类型，如："（旁白）" 或 "·莫雷蒂"）' })
    nameSuffix: string = '';

    onLoad() {
        // 为头像设置圆形遮罩
        this.setupAvatarMask();
    }

    /**
     * 设置叙事数据
     * 
     * @param content 对话内容
     * @param avatarFrame 角色头像（总是传递，由预制体结构决定是否显示）
     * @param characterName 角色名称（总是传递）
     * @param speakerName 说话者名称（可选，用于 speaking 类型）
     */
    setNarrative(
        content: string,
        avatarFrame: SpriteFrame | null,
        characterName: string,
        speakerName?: string
    ) {
        // 简化日志，不显示内部属性
        console.log('[NarrativeItem] 设置叙事:', content.substring(0, 30) + '...');

        // 1. 设置内容（所有预制体必有）
        if (this.contentLabel) {
            this.contentLabel.string = content;
        }

        // 2. 设置头像（如果预制体有 avatarSprite 节点）
        if (this.avatarSprite) {
            if (avatarFrame) {
                this.avatarSprite.spriteFrame = avatarFrame;
                console.log('[NarrativeItem] 头像设置成功');
            } else {
                console.warn('[NarrativeItem] avatarFrame 为 null，无法设置头像');
            }
        } else {
            console.log('[NarrativeItem] 预制体没有 avatarSprite 节点');
        }

        // 3. 设置角色名称（如果预制体有 speakerNameLabel 节点）
        if (this.speakerNameLabel) {
            // 优先使用 speakerName，其次使用 characterName
            let finalName = speakerName || characterName;
            
            // 添加预制体配置的后缀
            if (this.nameSuffix) {
                finalName = finalName + this.nameSuffix;
            }
            
            this.speakerNameLabel.string = finalName;
        }
    }

    onDestroy() {
        // 节点已经从父节点移除，不会再被渲染
        // 只需清空引用
        this.avatarSprite = null;
        this.speakerNameLabel = null;
        this.contentLabel = null;
    }

    /**
     * 为头像设置圆形遮罩
     */
    private setupAvatarMask() {
        if (!this.avatarSprite) {
            return;
        }

        const spriteNode = this.avatarSprite.node;
        const parentNode = spriteNode.parent;
        
        if (!parentNode) {
            return;
        }
        
        // 在父节点上添加 Mask 组件
        let mask = parentNode.getComponent(Mask);
        if (!mask) {
            mask = parentNode.addComponent(Mask);
        }
        
        // 设置 Mask 类型为 Graphics
        mask.type = Mask.Type.GRAPHICS_STENCIL;
        
        // 在父节点上添加 Graphics 组件
        let graphics = parentNode.getComponent(Graphics);
        if (!graphics) {
            graphics = parentNode.addComponent(Graphics);
        }
        
        // 获取父节点尺寸
        const transform = parentNode.getComponent(UITransform);
        if (!transform) {
            return;
        }
        
        // 绘制圆形（以节点中心为圆心）
        const radius = Math.min(transform.width, transform.height) / 2;
        graphics.clear();
        graphics.fillColor = Color.WHITE;
        graphics.circle(0, 0, radius);
        graphics.fill();
        
        console.log(`[NarrativeItem] 已为头像设置圆形遮罩，半径: ${radius}`);
    }
}
