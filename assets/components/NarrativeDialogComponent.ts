import { _decorator, Component, Node, Label, Prefab, instantiate, SpriteFrame } from 'cc';
import { NarrativeItemComponent } from './NarrativeItemComponent';

const { ccclass, property, menu } = _decorator;

/**
 * 叙事类型
 */
export enum NarrativeType {
    NARRATION = 'narration',  // 旁白
    THINKING = 'thinking',     // 思考
    SPEAKING = 'speaking'      // 对话
}

/**
 * 叙事项
 */
export interface NarrativeItem {
    type: NarrativeType | string;
    content: string;
    speaker?: string;  // 仅 speaking 类型使用
}

/**
 * 对话框组件
 * 显示 3 态剧情：叙述、思考、对话
 * 
 * 节点结构：
 * NarrativeDialog
 * ├── ContentContainer - 内容容器
 * │   ├── NarrationTemplate - 旁白模板
 * │   ├── ThinkingTemplate - 思考模板
 * │   └── SpeakingTemplate - 对话模板
 * └── NextButton - 下一步按钮
 */
@ccclass('NarrativeDialogComponent')
@menu('Components/NarrativeDialogComponent')
export class NarrativeDialogComponent extends Component {
    @property({ type: Node, tooltip: '内容容器' })
    contentContainer: Node | null = null;

    @property({ type: Prefab, tooltip: '旁白模板预制体' })
    narrationTemplate: Prefab | null = null;

    @property({ type: Prefab, tooltip: '思考模板预制体' })
    thinkingTemplate: Prefab | null = null;

    @property({ type: Prefab, tooltip: '对话模板预制体' })
    speakingTemplate: Prefab | null = null;

    @property({ type: Node, tooltip: '下一步按钮' })
    nextButton: Node | null = null;

    // 私有属性
    private narrativeQueue: NarrativeItem[] = [];
    private currentIndex: number = 0;
    private isPlaying: boolean = false;
    private currentNode: Node | null = null;
    
    // 角色信息（由 playNarrative 传入）
    private currentRoleplayAvatar: SpriteFrame | null = null;
    private currentRoleplayName: string = '';

    onLoad() {
        // 绑定下一步按钮点击事件
        if (this.nextButton) {
            this.nextButton.on(Node.EventType.TOUCH_END, this.onNextButtonClick, this);
        }

        // 初始隐藏
        this.node.active = false;
    }

    onDestroy() {
        // 清理事件（检查节点是否有效）
        if (this.nextButton && this.nextButton.isValid) {
            this.nextButton.off(Node.EventType.TOUCH_END, this.onNextButtonClick, this);
        }
        
        // 清理当前节点
        if (this.currentNode && this.currentNode.isValid) {
            this.currentNode.destroy();
        }
        
        // 清空引用
        this.currentNode = null;
        this.currentRoleplayAvatar = null;
        this.narrativeQueue = [];
        this.contentContainer = null;
        this.narrationTemplate = null;
        this.thinkingTemplate = null;
        this.speakingTemplate = null;
        this.nextButton = null;
    }

    /**
     * 播放叙事序列
     * @param narratives 叙事列表
     * @param roleplayAvatar 角色头像
     * @param roleplayName 角色名称
     */
    playNarrative(
        narratives: NarrativeItem[],
        roleplayAvatar?: SpriteFrame | null,
        roleplayName?: string
    ) {
        console.log('[NarrativeDialog] 开始播放叙事，共', narratives.length, '条');
        
        this.narrativeQueue = [...narratives];
        this.currentIndex = 0;
        this.isPlaying = true;
        
        // 存储角色信息（仅用于本次播放）
        this.currentRoleplayAvatar = roleplayAvatar || null;
        this.currentRoleplayName = roleplayName || '';

        // 显示对话框
        this.node.active = true;

        // 显示第一条叙事
        this.showCurrentNarrative();
    }

    /**
     * 显示当前叙事
     */
    private showCurrentNarrative() {
        if (this.currentIndex >= this.narrativeQueue.length) {
            this.onNarrativeCompleted();
            return;
        }

        const narrative = this.narrativeQueue[this.currentIndex];
        console.log('[NarrativeDialog] 显示叙事', this.currentIndex + 1, '/', this.narrativeQueue.length, narrative);

        // 清除之前的节点
        if (this.currentNode) {
            this.currentNode.destroy();
            this.currentNode = null;
        }

        // 根据类型创建节点
        const node = this.createNarrativeNode(narrative);
        if (node && this.contentContainer) {
            this.contentContainer.addChild(node);
            this.currentNode = node;
        }

        // 显示下一步按钮
        if (this.nextButton) {
            this.nextButton.active = true;
        }
    }

    /**
     * 根据类型创建叙事节点
     */
    private createNarrativeNode(narrative: NarrativeItem): Node | null {
        let template: Prefab | null = null;

        switch (narrative.type) {
            case NarrativeType.NARRATION:
            case 'narration':
                template = this.narrationTemplate;
                break;
            case NarrativeType.THINKING:
            case 'thinking':
                template = this.thinkingTemplate;
                break;
            case NarrativeType.SPEAKING:
            case 'speaking':
                template = this.speakingTemplate;
                break;
            default:
                console.warn('[NarrativeDialog] 未知叙事类型:', narrative.type);
                return null;
        }

        if (!template) {
            console.warn('[NarrativeDialog] 未配置模板:', narrative.type);
            return null;
        }

        const node = instantiate(template);

        // 获取 NarrativeItemComponent 并设置数据
        const itemComponent = node.getComponent(NarrativeItemComponent);
        if (itemComponent) {
            // 调用组件的 setNarrative 方法
            // 总是传递角色信息，由预制体结构决定是否显示
            // nameSuffix 由预制体面板配置，不需要传递
            itemComponent.setNarrative(
                narrative.content,
                this.currentRoleplayAvatar,
                this.currentRoleplayName,
                narrative.speaker  // 说话者名称（可选）
            );
        } else {
            console.warn('[NarrativeDialog] 预制体缺少 NarrativeItemComponent 组件');
        }

        return node;
    }

    /**
     * 下一步按钮点击
     */
    private onNextButtonClick() {
        if (!this.isPlaying) {
            return;
        }

        console.log('[NarrativeDialog] 点击下一步');

        // 进入下一条叙事
        this.currentIndex++;
        this.showCurrentNarrative();
    }

    /**
     * 叙事播放完成
     */
    private onNarrativeCompleted() {
        console.log('[NarrativeDialog] 叙事播放完成');

        this.isPlaying = false;

        // 隐藏对话框
        this.node.active = false;

        // 清除当前节点
        if (this.currentNode) {
            this.currentNode.destroy();
            this.currentNode = null;
        }

        // 触发完成事件
        this.node.emit('narrative-completed');
    }

    /**
     * 停止播放
     */
    stop() {
        this.isPlaying = false;
        this.narrativeQueue = [];
        this.currentIndex = 0;
        
        if (this.currentNode) {
            this.currentNode.destroy();
            this.currentNode = null;
        }

        this.node.active = false;
    }

    /**
     * 是否正在播放
     */
    isActive(): boolean {
        return this.isPlaying;
    }
}
