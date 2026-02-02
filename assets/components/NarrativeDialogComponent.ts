import { _decorator, Component, Node, Label, Prefab, instantiate, SpriteFrame } from 'cc';
import { NarrativeItemComponent } from './NarrativeItemComponent';
import { getTTSManager, TTSSegment } from '../scripts/core/TTSManager';

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
 * TTS 配置项
 */
export interface TTSOptions {
    enabled: boolean;
    segments?: TTSSegment[];
    autoPlay?: boolean;  // 是否自动播放 TTS
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

    @property({ tooltip: '是否启用 TTS 语音' })
    enableTTS: boolean = true;

    @property({ tooltip: 'TTS 播放时禁用下一步按钮' })
    lockNextDuringTTS: boolean = true;

    // 私有属性
    private narrativeQueue: NarrativeItem[] = [];
    private currentIndex: number = 0;
    private isPlaying: boolean = false;
    private currentNode: Node | null = null;
    
    // 角色信息（由 playNarrative 传入）
    private currentRoleplayAvatar: SpriteFrame | null = null;
    private currentRoleplayName: string = '';
    
    // TTS 相关
    private ttsOptions: TTSOptions | null = null;
    private isTTSPlaying: boolean = false;

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
     * @param ttsOptions TTS 配置项
     */
    playNarrative(
        narratives: NarrativeItem[],
        roleplayAvatar?: SpriteFrame | null,
        roleplayName?: string,
        ttsOptions?: TTSOptions
    ) {
        console.log('[NarrativeDialog] 开始播放叙事，共', narratives.length, '条');
        
        this.narrativeQueue = [...narratives];
        this.currentIndex = 0;
        this.isPlaying = true;
        
        // 存储角色信息（仅用于本次播放）
        this.currentRoleplayAvatar = roleplayAvatar || null;
        this.currentRoleplayName = roleplayName || '';
        
        // TTS 配置
        this.ttsOptions = ttsOptions || null;
        this.isTTSPlaying = false;

        // 显示对话框
        this.node.active = true;
        
        // TTS 预加载已在 BCardDisplay 中启动，这里不再重复调用

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

        // 清除之前的节点（先移除再销毁）
        if (this.currentNode && this.currentNode.isValid) {
            this.currentNode.removeFromParent();
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
        
        // 播放 TTS 语音
        this.playCurrentTTS();
    }
    
    /**
     * 播放当前段落的 TTS
     * 
     * 流式播放: 如果当前段落还在加载，playSegment 会等待它
     */
    private async playCurrentTTS() {
        if (!this.enableTTS || !this.ttsOptions?.enabled) {
            return;
        }
        
        const segmentId = this.currentIndex + 1; // TTS segment ID 从 1 开始
        
        try {
            const ttsManager = getTTSManager();
            
            // 设置 TTS 播放状态
            this.isTTSPlaying = true;
            this.updateNextButtonState();
            
            console.log('[NarrativeDialog] 播放 TTS 段落:', segmentId);
            
            // playSegment 会自动等待加载完成
            const success = await ttsManager.playSegment(segmentId, () => {
                // TTS 播放完成回调
                this.isTTSPlaying = false;
                this.updateNextButtonState();
                console.log('[NarrativeDialog] TTS 播放完成');
            });
            
            if (!success) {
                // 播放失败，重置状态
                this.isTTSPlaying = false;
                this.updateNextButtonState();
            }
        } catch (error) {
            console.error('[NarrativeDialog] TTS 播放失败:', error);
            this.isTTSPlaying = false;
            this.updateNextButtonState();
        }
    }
    
    /**
     * 更新下一步按钮状态
     * 
     * 新逻辑：如果下一段音频已加载完成，允许点击跳过当前语音
     */
    private updateNextButtonState() {
        if (!this.nextButton) return;
        
        // 始终允许点击，在 onNextButtonClick 中判断是否可以跳过
        this.nextButton.getComponent('cc.Button')?.setInteractable?.(true);
    }
    
    /**
     * 检查下一段 TTS 是否已加载完成
     */
    private isNextTTSReady(): boolean {
        if (!this.enableTTS || !this.ttsOptions?.enabled) {
            return true; // 没有 TTS，直接允许
        }
        
        const nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.narrativeQueue.length) {
            return true; // 没有下一段，允许
        }
        
        const nextSegmentId = nextIndex + 1; // TTS segment ID 从 1 开始
        const ttsManager = getTTSManager();
        return ttsManager.isSegmentReady(nextSegmentId);
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
        
        // TTS 播放中时，检查下一段是否已加载
        if (this.isTTSPlaying && this.lockNextDuringTTS) {
            if (!this.isNextTTSReady()) {
                console.log('[NarrativeDialog] 下一段 TTS 还在加载，忽略点击');
                return;
            }
            // 下一段已加载，允许跳过
            console.log('[NarrativeDialog] 下一段 TTS 已加载，允许跳过当前语音');
        }

        console.log('[NarrativeDialog] 点击下一步');
        
        // 停止当前 TTS
        if (this.isTTSPlaying) {
            getTTSManager().stop();
            this.isTTSPlaying = false;
        }

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

        // 先清除当前节点（在隐藏之前，避免渲染已销毁的 sprite）
        if (this.currentNode && this.currentNode.isValid) {
            // 先从父节点移除
            this.currentNode.removeFromParent();
            this.currentNode.destroy();
            this.currentNode = null;
        }

        // 然后隐藏对话框
        this.node.active = false;

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
        
        // 停止 TTS
        if (this.isTTSPlaying) {
            getTTSManager().stop();
            this.isTTSPlaying = false;
        }
        
        // 先移除再销毁
        if (this.currentNode && this.currentNode.isValid) {
            this.currentNode.removeFromParent();
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
