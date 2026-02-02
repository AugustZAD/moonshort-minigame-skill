import { _decorator, Component, Node, Sprite, SpriteFrame, assetManager, ImageAsset, Texture2D, Button, Label, instantiate, Prefab, Rect, Size } from 'cc';
import { EnrichedBCard, NarrativeSegment, PlayerSave, TTSSegmentData } from '../scripts/types/game.types';
import { NarrativeDialogComponent, NarrativeItem, TTSOptions } from './NarrativeDialogComponent';
import { TTSSegment, getTTSManager } from '../scripts/core/TTSManager';
import { VideoTexturePlayer } from './VideoTexturePlayer';
import { AdaptiveCardBackground } from './AdaptiveCardBackground';
import { DiceRollController } from './DiceRollController';
import { performCheck, getTempModifierValue, Attribute } from '../scripts/utils/GameUtils';

const { ccclass, property, menu } = _decorator;

/**
 * B 卡状态
 */
enum BCardState {
    IDLE = 'IDLE',
    INTRO_VIDEO = 'INTRO_VIDEO',
    FIRST_NARRATIVE = 'FIRST_NARRATIVE',
    DECISION_OPTIONS = 'DECISION_OPTIONS',
    DICE_ANIMATION = 'DICE_ANIMATION',
    OPTION_VIDEO = 'OPTION_VIDEO',
    NARRATIVE = 'NARRATIVE',
    COMPLETED = 'COMPLETED'
}

/**
 * B 卡显示组件
 * 协调整个 B 卡流程
 * 
 * 节点结构：
 * BCardContainer
 * ├── BackgroundSprite - 背景图片/视频节点（同时用于 intro 视频和场景空镜图）
 * ├── NarrativeDialog - 对话框
 * ├── DecisionPanel - 抉择面板
 * │   ├── TitleLabel
 * │   └── OptionsContainer
 * └── DiceAnimation - 摔骰子动画
 * 
 * 注：BackgroundSprite 同时用于：
 * 1. 播放 intro 视频（通过 VideoTexturePlayer 组件）
 * 2. 显示场景空镜图（直接设置 Sprite.spriteFrame）
 * 3. 播放选项视频（通过 VideoTexturePlayer 组件）
 */
@ccclass('BCardDisplayComponent')
@menu('Components/BCardDisplayComponent')
export class BCardDisplayComponent extends Component {
    // 子节点引用
    @property({ type: Node, tooltip: '对话框节点' })
    narrativeDialogNode: Node | null = null;

    @property({ type: Node, tooltip: '选项容器节点（直接渲染选项）' })
    optionsContainerNode: Node | null = null;

    @property({ type: Prefab, tooltip: '选项预制体（AdaptiveCardBackground）' })
    optionPrefab: Prefab | null = null;

    @property({ type: Node, tooltip: '摧骰子节点' })
    diceRollNode: Node | null = null;

    // 私有属性
    private currentState: BCardState = BCardState.IDLE;
    private bCardData: EnrichedBCard | null = null;
    private currentDecisionIndex: number = 0;
    private selectedOptions: number[] = [];  // 记录每次选择的选项索引
    
    // 角色信息
    private roleplayAvatarFrame: SpriteFrame | null = null;
    private roleplayCharacterName: string = '';
    
    // 玩家数据（用于投骰检定）
    private playerSave: PlayerSave | null = null;
    
    // 组件引用
    private narrativeDialog: NarrativeDialogComponent | null = null;
    private diceRollController: DiceRollController | null = null;
    private gameController: any = null;  // GameSceneController 引用

    onLoad() {
        console.log('[BCardDisplay] 初始化');

        // 获取 GameSceneController
        this.gameController = this.node.parent?.getComponent('GameSceneController');
        if (!this.gameController) {
            console.error('[BCardDisplay] 未找到 GameSceneController');
        }

        // 获取组件引用
        if (this.narrativeDialogNode) {
            this.narrativeDialog = this.narrativeDialogNode.getComponent(NarrativeDialogComponent);
        }

        if (this.diceRollNode) {
            this.diceRollController = this.diceRollNode.getComponent(DiceRollController);
        }

        // 初始隐藏所有元素
        this.hideAllElements();
    }

    /**
     * 设置角色信息（由 GameSceneController 调用）
     * @param avatarFrame 角色头像
     * @param characterName 角色名称
     */
    setRoleplayInfo(avatarFrame: SpriteFrame | null, characterName: string) {
        console.log('[BCardDisplay] 设置角色信息:', { hasAvatar: !!avatarFrame, characterName });
        
        this.roleplayAvatarFrame = avatarFrame;
        this.roleplayCharacterName = characterName;
    }

    /**
     * 设置玩家数据（由 GameSceneController 调用）
     * @param playerSave 玩家存档数据
     */
    setPlayerSave(playerSave: PlayerSave) {
        this.playerSave = playerSave;
    }

    /**
     * 显示 B 卡
     */
    async displayBCard(bcard: EnrichedBCard) {
        console.log('[BCardDisplay] 开始显示 B 卡:', {
            nodeIndex: bcard.nodeIndex,
            nodeName: bcard.nodeName,
            hasIntroVideo: !!bcard.introVideoUrl,
            introVideoUrl: bcard.introVideoUrl,
            hasFirstNarrative: !!(bcard.firstNarrative && bcard.firstNarrative.length > 0),
            decisionsCount: bcard.decisions?.length || 0
        });

        this.bCardData = bcard;
        this.currentDecisionIndex = 0;
        this.selectedOptions = [];

        console.log('[BCardDisplay] 开始执行 startIntroVideo...');
        // 开始流程
        try {
            await this.startIntroVideo();
            console.log('[BCardDisplay] startIntroVideo 执行完成');
        } catch (error) {
            console.error('[BCardDisplay] startIntroVideo 执行失败:', error);
        }
    }

    /**
     * 阶段1：播放 Intro 视频
     * 同时启动流式 TTS 预加载（后台异步，不阻塞）
     */
    private async startIntroVideo() {
        console.log('[BCardDisplay] 阶段1：播放 Intro 视频');
        this.currentState = BCardState.INTRO_VIDEO;

        // 启动流式 TTS 预加载（后台异步，不等待）
        if (this.bCardData?.firstNarrativeTTS && this.bCardData.firstNarrativeTTS.length > 0) {
            const ttsSegments = this.convertTTSSegments(this.bCardData.firstNarrativeTTS);
            console.log('[BCardDisplay] 启动流式 TTS 预加载,', ttsSegments.length, '个段落');
            getTTSManager().startPreload(ttsSegments);
        }

        // 播放视频（如果有）
        if (this.bCardData?.introVideoUrl) {
            try {
                await this.playVideoOnBackground(this.bCardData.introVideoUrl);
                console.log('[BCardDisplay] Intro 视频播放完成');
            } catch (error) {
                console.error('[BCardDisplay] Intro 视频播放失败:', error);
            }
        }

        // 进入下一阶段
        await this.startFirstNarrative();
    }

    /**
     * 阶段2：显示首次叙事
     */
    private async startFirstNarrative() {
        console.log('[BCardDisplay] 阶段2：显示首次叙事');
        this.currentState = BCardState.FIRST_NARRATIVE;

        // 显示场景空镜图（替换视频）
        await this.loadSceneImage(this.currentDecisionIndex);

        // 显示首次叙事（传递 TTS 数据）
        if (this.bCardData?.firstNarrative && this.bCardData.firstNarrative.length > 0) {
            const ttsSegments = this.bCardData.firstNarrativeTTS 
                ? this.convertTTSSegments(this.bCardData.firstNarrativeTTS)
                : undefined;
            await this.playNarrative(this.bCardData.firstNarrative, ttsSegments);
        }

        // 进入选项阶段
        await this.showDecisionOptions();
    }

    /**
     * 阶段3：显示抉择选项
     */
    private async showDecisionOptions() {
        console.log('[BCardDisplay] 阶段3：显示抉择选项，当前抉择索引:', this.currentDecisionIndex);
        this.currentState = BCardState.DECISION_OPTIONS;

        if (!this.bCardData || this.currentDecisionIndex >= this.bCardData.decisions.length) {
            // 所有抉择完成
            await this.completeBCard();
            return;
        }

        // 确保背景使用带蒙版的图片节点（如果之前是图片的话）
        await this.ensureImageWithMask();

        const currentDecision = this.bCardData.decisions[this.currentDecisionIndex];

        // 直接渲染选项（不需要面板和标题）
        this.renderOptions(currentDecision.options);

        // 等待玩家选择（通过事件监听）
    }

    /**
     * 渲染选项
     */
    private renderOptions(options: any[]) {
        if (!this.optionsContainerNode || !this.optionPrefab) {
            return;
        }

        // 清空容器
        this.optionsContainerNode.removeAllChildren();

        // 创建选项
        options.forEach((option, index) => {
            const optionNode = instantiate(this.optionPrefab!);
            const adaptiveBg = optionNode.getComponent(AdaptiveCardBackground);

            // 设置文本
            if (adaptiveBg) {
                adaptiveBg.setText(option.text);
            } else {
                const label = optionNode.getComponentInChildren(Label);
                if (label) {
                    label.string = option.text;
                }
            }

            // 直接监听节点的触摸事件
            console.log('[BCardDisplay] 为选项', index, '绑定触摸事件');
            optionNode.on(Node.EventType.TOUCH_END, () => {
                console.log('[BCardDisplay] 选项', index, '被点击');
                this.onOptionSelected(index);
            }, this);

            this.optionsContainerNode!.addChild(optionNode);
        });

        console.log('[BCardDisplay] 已渲染', options.length, '个选项');
    }

    /**
     * 选项被选择
     */
    private async onOptionSelected(optionIndex: number) {
        console.log('[BCardDisplay] 选择了选项:', optionIndex);

        this.selectedOptions.push(optionIndex);

        // 获取选项文本
        const currentDecision = this.bCardData?.decisions[this.currentDecisionIndex];
        const optionText = currentDecision?.options[optionIndex]?.text || '';

        // 清空选项容器
        if (this.optionsContainerNode) {
            this.optionsContainerNode.removeAllChildren();
        }

        // 显示摧骰子界面
        await this.showDiceRoll(optionText);

        // 播放选项视频（如果有）
        await this.playOptionVideo(this.currentDecisionIndex, optionIndex);

        // 进入下一轮抉择
        this.currentDecisionIndex++;
        await this.showDecisionOptions();
    }

    /**
     * 显示摧骰子界面
     */
    private async showDiceRoll(optionText: string): Promise<void> {
        return new Promise(async (resolve) => {
            console.log('[BCardDisplay] 显示摧骰子界面');
            this.currentState = BCardState.DICE_ANIMATION;

            if (!this.diceRollController) {
                console.warn('[BCardDisplay] DiceRollController 未配置');
                resolve();
                return;
            }

            // 确保背景使用带蒙版的图片节点
            await this.ensureImageWithMask();

            // 获取当前选项
            const currentDecision = this.bCardData?.decisions[this.currentDecisionIndex];
            const currentOption = currentDecision?.options[this.selectedOptions[this.selectedOptions.length - 1]];

            // 执行检定
            let rollResult: { success: boolean; value: number };

            if (currentOption?.checkAttr && currentOption?.checkDC && this.playerSave) {
                // 有检定要求，进行真实投骰
                const attrValue = this.playerSave[currentOption.checkAttr];
                const tempMod = getTempModifierValue(
                    this.playerSave.tempModifiers || [],
                    currentOption.checkAttr as Attribute
                );

                const checkResult = performCheck(attrValue, tempMod, currentOption.checkDC);
                
                rollResult = {
                    success: checkResult.success,
                    value: checkResult.roll
                };

                console.log('[BCardDisplay] 投骰结果:', {
                    attr: currentOption.checkAttr,
                    attrValue,
                    tempMod,
                    dc: currentOption.checkDC,
                    roll: checkResult.roll,
                    modifier: checkResult.modifier,
                    total: checkResult.total,
                    success: checkResult.success
                });
            } else {
                // 没有检定要求，自动成功
                rollResult = {
                    success: true,
                    value: 20
                };
                console.log('[BCardDisplay] 无需检定，自动成功');
            }

            // 监听完成事件
            this.diceRollNode!.once('dice-completed', () => {
                resolve();
            });

            // 显示摧骰子界面
            this.diceRollController.showDiceRoll(optionText, rollResult);
        });
    }

    /**
     * 阶段5：播放选项视频
     */
    private async playOptionVideo(decisionIndex: number, optionIndex: number) {
        console.log('[BCardDisplay] 阶段5：播放选项视频');
        this.currentState = BCardState.OPTION_VIDEO;

        // 查找对应的视频
        const videoUrl = this.findOptionVideoUrl(decisionIndex, optionIndex);

        if (!videoUrl) {
            console.log('[BCardDisplay] 没有对应的选项视频');
            return;
        }

        // 使用背景节点播放视频
        try {
            await this.playVideoOnBackground(videoUrl);
            console.log('[BCardDisplay] 选项视频播放完成');
        } catch (error) {
            console.error('[BCardDisplay] 选项视频播放失败:', error);
        }
    }

    /**
     * 查找抉择场景图 URL
     */
    private findDecisionSceneImageUrl(decisionIndex: number): string | null {
        if (!this.bCardData?.decisionSceneImages) {
            return null;
        }

        const sceneImage = this.bCardData.decisionSceneImages.find(
            img => img.decisionIndex === decisionIndex + 1  // 后端使用 1-based 索引
        );

        return sceneImage?.sceneImageUrl || null;
    }

    /**
     * 查找选项视频 URL
     */
    private findOptionVideoUrl(decisionIndex: number, optionIndex: number): string | null {
        if (!this.bCardData?.optionVideos) {
            return null;
        }

        const video = this.bCardData.optionVideos.find(
            v => v.decisionIndex === decisionIndex + 1 && v.optionIndex === optionIndex + 1
        );

        return video?.videoUrl || null;
    }

    /**
     * 将后端 TTS 数据转换为前端格式
     */
    private convertTTSSegments(segments: TTSSegmentData[]): TTSSegment[] {
        return segments.map(seg => ({
            id: seg.id,
            role: seg.role,
            instruction: seg.instruction,
            content: seg.content,
            speaker: seg.speaker,
        }));
    }

    /**
     * 播放叙事
     * @param narratives 叙事段落数组
     * @param ttsSegments TTS 数据（可选）
     */
    private playNarrative(narratives: NarrativeSegment[], ttsSegments?: TTSSegment[]): Promise<void> {
        return new Promise((resolve) => {
            if (!this.narrativeDialog) {
                console.warn('[BCardDisplay] 对话框组件未配置');
                resolve();
                return;
            }

            // 监听完成事件
            this.narrativeDialogNode!.once('narrative-completed', () => {
                resolve();
            });

            // 构建 TTS 配置
            const ttsOptions: TTSOptions | undefined = ttsSegments && ttsSegments.length > 0
                ? { enabled: true, segments: ttsSegments, autoPlay: true }
                : undefined;

            // 播放叙事，传递角色信息和 TTS 配置
            console.log('[BCardDisplay] 传递角色信息:', {
                hasAvatar: !!this.roleplayAvatarFrame,
                characterName: this.roleplayCharacterName,
                hasTTS: !!ttsOptions
            });
            this.narrativeDialog.playNarrative(
                narratives as any,
                this.roleplayAvatarFrame,
                this.roleplayCharacterName,
                ttsOptions
            );
        });
    }

    /**
     * 加载场景空镜图
     */
    private async loadSceneImage(decisionIndex: number) {
        if (!this.bCardData) {
            console.warn('[BCardDisplay] bCardData 不存在');
            return;
        }

        console.log('[BCardDisplay] 加载场景空镜图，抽择索引:', decisionIndex);

        // 从 decisionSceneImages 数组中查找对应的场景图
        const sceneImageUrl = this.findDecisionSceneImageUrl(decisionIndex);
        
        if (sceneImageUrl) {
            console.log('[BCardDisplay] 加载场景图:', sceneImageUrl);
            try {
                await this.loadRemoteImage(sceneImageUrl);
                console.log('[BCardDisplay] 场景图加载成功');
            } catch (error) {
                console.error('[BCardDisplay] 场景图加载失败:', error);
            }
        } else {
            console.warn('[BCardDisplay] 未找到 decisionIndex', decisionIndex, '对应的场景图');
        }
    }

    /**
     * 加载场景图片（使用 GameSceneController 的统一渲染）
     * 初始加载时使用无蒙版节点
     */
    private async loadRemoteImage(url: string): Promise<void> {
        if (!this.gameController) {
            console.error('[BCardDisplay] GameSceneController 不存在');
            return;
        }
        
        try {
            // 使用 GameSceneController 的统一渲染（无蒙版）
            await this.gameController.renderImage(url);
            console.log('[BCardDisplay] 场景图加载成功（无蒙版）');
        } catch (error) {
            console.error('[BCardDisplay] 场景图加载失败:', error);
            throw error;
        }
    }

    /**
     * 确保背景使用带蒙版的图片节点
     * 在显示选项和骰子界面时调用
     */
    private async ensureImageWithMask(): Promise<void> {
        if (!this.gameController) {
            console.error('[BCardDisplay] GameSceneController 不存在');
            return;
        }

        const currentMode = this.gameController.getRenderMode();
        console.log('[BCardDisplay] 当前渲染模式:', currentMode);

        // 如果当前是视频模式，需要先加载场景图
        if (currentMode === 'video') {
            console.log('[BCardDisplay] 视频模式，先加载场景图');
            await this.loadSceneImage(this.currentDecisionIndex);
        }

        // 如果当前是普通图片模式，切换到带蒙版模式
        const modeAfterLoad = this.gameController.getRenderMode();
        if (modeAfterLoad === 'image') {
            console.log('[BCardDisplay] 切换到带蒙版模式');
            this.gameController.switchToMask();
        }
        // 如果已经是 image-mask 模式，不需要重复处理
    }

    /**
     * 完成 B 卡
     */
    private async completeBCard() {
        console.log('[BCardDisplay] 阶段8：B 卡完成');
        this.currentState = BCardState.COMPLETED;

        // 调用 evaluate API 结算
        if (this.gameController && this.bCardData && this.playerSave) {
            try {
                const result = await this.gameController.evaluateBCard(
                    this.playerSave.id,
                    this.bCardData.nodeIndex,
                    []  // checkResults
                );
                console.log('[BCardDisplay] B 卡结算结果:', result);

                // 触发完成事件，传递后端返回的数据
                this.node.emit('bcard-completed', {
                    nodeIndex: this.bCardData.nodeIndex,
                    resultType: result.resultType,
                    playerUpdates: result.playerUpdates,
                    rewards: result.rewards,
                    gameCompleted: result.gameCompleted,
                    nextNodeIndex: result.nextNodeIndex,
                });
            } catch (error) {
                console.error('[BCardDisplay] B 卡结算失败:', error);
                // 即使失败也触发事件，以便上层处理
                this.node.emit('bcard-completed', {
                    nodeIndex: this.bCardData?.nodeIndex,
                    resultType: 'normal',
                    playerUpdates: {},
                    gameCompleted: false,
                });
            }
        } else {
            console.error('[BCardDisplay] 缺少必要数据，无法结算');
            this.node.emit('bcard-completed', {
                nodeIndex: this.bCardData?.nodeIndex,
                resultType: 'normal',
                playerUpdates: {},
                gameCompleted: false,
            });
        }
    }

    /**
     * 隐藏所有元素
     */
    private hideAllElements() {
        if (this.narrativeDialogNode) this.narrativeDialogNode.active = false;
        if (this.diceRollNode) this.diceRollNode.active = false;
        // 清空选项容器
        if (this.optionsContainerNode) {
            this.optionsContainerNode.removeAllChildren();
        }
    }

    /**
     * 播放视频（使用 GameSceneController 的统一渲染）
     */
    private async playVideoOnBackground(videoUrl: string): Promise<void> {
        if (!this.gameController) {
            console.error('[BCardDisplay] GameSceneController 不存在');
            return;
        }
        
        try {
            // 使用 GameSceneController 的统一渲染
            await this.gameController.renderVideo(videoUrl);
            await this.gameController.playVideo();
            console.log('[BCardDisplay] 视频播放完成');
        } catch (error) {
            console.error('[BCardDisplay] 视频播放失败:', error);
            throw error;
        }
    }


    /**
     * 等待
     */
    private wait(ms: number): Promise<void> {
        return new Promise(resolve => {
            this.scheduleOnce(() => resolve(), ms / 1000);
        });
    }

    onDestroy() {
        console.log('[BCardDisplay] 销毁组件...');
        
        // 清理摇骰子事件（检查节点是否有效）
        if (this.diceRollNode && this.diceRollNode.isValid) {
            this.diceRollNode.off('dice-completed');
        }
        
        // 清空引用
        this.bCardData = null;
        this.playerSave = null;
        this.gameController = null;
        this.narrativeDialog = null;
        this.diceRollController = null;
        this.narrativeDialogNode = null;
        this.diceRollNode = null;
    }
}
