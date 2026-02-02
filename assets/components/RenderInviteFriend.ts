import { _decorator, Component, Label, Node } from 'cc';
import { trackHomeCopyInvite, trackHomeInviteOpen } from '../analytics/UiEvents';
import { GameManager } from '../scripts/core/GameManager';
import { NativeBridge } from '../scripts/core/NativeBridge';
import { Toast } from '../scripts/ui/Toast';

const { ccclass, property, menu } = _decorator;

/**
 * 邀请好友面板组件
 * 显示用户邀请码、剩余次数，支持复制
 */
@ccclass('RenderInviteFriend')
@menu('Components/RenderInviteFriend')
export class RenderInviteFriend extends Component {
    @property({ type: Label, tooltip: '显示邀请码的 Label' })
    inviteCodeLabel: Label | null = null;

    @property({ type: Node, tooltip: '显示剩余次数的 Label 节点' })
    remainingLabelNode: Node | null = null;

    private _inviteCode: string = '';
    private _remaining: number = 0;
    private _limit: number = 5;
    private _remainingLabel: Label | null = null;

    onLoad() {
        if (this.remainingLabelNode) {
            this._remainingLabel = this.remainingLabelNode.getComponent(Label);
        }
    }

    /**
     * 打开面板
     */
    open() {
        this.node.active = true;
        this.fetchData();
        trackHomeInviteOpen();
    }

    /**
     * 关闭面板
     */
    close() {
        this.node.active = false;
    }

    /**
     * 获取邀请码数据
     */
    async fetchData() {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        try {
            const api = gameManager.getAPI();
            const response = await api.get('/apiv2/auth/invite');
            
            if (!this.node || !this.node.isValid) return;

            this._inviteCode = response.inviteCode || '';
            this._remaining = response.remaining || 0;
            this._limit = response.limit || 5;

            this.updateUI();
        } catch (error: any) {
            console.error('[RenderInviteFriend] 获取邀请码信息失败:', error);
        }
    }

    /**
     * 复制邀请码
     */
    async copyCode() {
        if (!this._inviteCode) {
            return;
        }

        const success = await NativeBridge.copyToClipboard(this._inviteCode);
        
        if (success) {
            Toast.show('Copied!');
        }

        // 埋点
        trackHomeCopyInvite({
            invite_code: this._inviteCode,
            remaining: this._remaining,
        });
    }

    /**
     * 更新 UI
     */
    private updateUI() {
        // 更新邀请码
        if (this.inviteCodeLabel && this.inviteCodeLabel.isValid) {
            this.inviteCodeLabel.string = this._inviteCode;
        }

        // 更新剩余次数
        if (this._remainingLabel && this._remainingLabel.isValid) {
            this._remainingLabel.string = `Remaining: ${this._remaining}/${this._limit}`;
        }
    }
}
