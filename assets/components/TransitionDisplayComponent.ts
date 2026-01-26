import { _decorator, Component, Label, Button, Node } from 'cc';
import { TransitionNarrative } from '../scripts/types/game.types';

const { ccclass, property, menu } = _decorator;

/**
 * 过渡叙事显示组件
 * 显示 B卡结束后到 A卡开始前的过渡文本
 * 
 * 节点结构：
 * TransitionContainer (挂载此组件)
 * ├── NarrativeText (Label/RichText)
 * └── ContinueButton (Button)
 */
@ccclass('TransitionDisplayComponent')
@menu('Components/TransitionDisplayComponent')
export class TransitionDisplayComponent extends Component {
    @property({ type: Label, tooltip: '叙事文本' })
    narrativeLabel: Label | null = null;

    @property({ type: Button, tooltip: '继续按钮' })
    continueButton: Button | null = null;

    private currentTransition: TransitionNarrative | null = null;

    onLoad() {
        // 绑定继续按钮事件
        if (this.continueButton) {
            this.continueButton.node.on(Button.EventType.CLICK, this.onContinueClick, this);
        }
    }

    /**
     * 显示过渡叙事
     */
    displayTransition(transition: TransitionNarrative) {
        console.log('[TransitionDisplayComponent] 显示过渡叙事:', transition);
        
        this.currentTransition = transition;

        // 显示叙事文本
        if (this.narrativeLabel) {
            this.narrativeLabel.string = transition.narrative;
        }

        // 显示继续按钮
        if (this.continueButton) {
            this.continueButton.node.active = true;
        }
    }

    /**
     * 继续按钮点击事件
     */
    private onContinueClick() {
        console.log('[TransitionDisplayComponent] 玩家点击继续');

        // 触发完成事件，通知 GameSceneController
        this.node.emit('transition-completed');
    }

    /**
     * 获取当前过渡叙事
     */
    getCurrentTransition(): TransitionNarrative | null {
        return this.currentTransition;
    }

    onDestroy() {
        // 清理事件监听（检查节点是否有效）
        if (this.continueButton && this.continueButton.node && this.continueButton.node.isValid) {
            this.continueButton.node.off(Button.EventType.CLICK, this.onContinueClick, this);
        }
        
        // 清空引用
        this.currentTransition = null;
        this.continueButton = null;
        this.narrativeLabel = null;
    }
}
